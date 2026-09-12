import type { MindEdge, MindNode } from "./types.js";

export type WireOp = Record<string, unknown> & { type?: string };

export type ResolveOpsResult =
  | {
      ok: true;
      ops: unknown[];
      /** alias / exact text → nodeId (batch + existing). */
      nodeIdMap: Record<string, string>;
    }
  | {
      ok: false;
      error: "invalid_op" | "ambiguous";
      message: string;
      candidates?: { id: string; text: string }[];
    };

function newId(prefix = "n"): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function isRefToken(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function normalizeAlias(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

/**
 * Expand agent-friendly refs before parseOps:
 * - create_node / batch_create.alias → @alias resolvable in same batch / later
 * - parentText / fromText / toText / nodeText → unique text match
 * - nodeId/parentId/from/to/relations.to starting with @ → alias
 * - restore_node resolves against soft-deleted nodes (id / @alias / unique title)
 * - unlink accepts edgeId or from+to (optional kind)
 * Assigns create_node.id early so later ops in the same batch can reference it.
 * batch_create: two-pass register all ids/aliases, then resolve parents/relations.
 */
export function resolveWireOps(
  rawOps: unknown[],
  liveNodes: MindNode[],
  opts?: { anchorId?: string | null; edges?: MindEdge[] },
): ResolveOpsResult {
  const anchorId = opts?.anchorId ?? null;
  const edges = opts?.edges ?? [];
  const aliasToId = new Map<string, string>();
  const textToIds = new Map<string, string[]>();
  const deletedAliasToId = new Map<string, string>();
  const deletedTextToIds = new Map<string, string[]>();
  const knownIds = new Set(liveNodes.filter((n) => !n.deletedAt).map((n) => n.id));
  const deletedIds = new Set(
    liveNodes
      .filter((n) => n.deletedAt && n.id !== anchorId)
      .map((n) => n.id),
  );

  const addText = (
    map: Map<string, string[]>,
    text: string,
    id: string,
  ) => {
    const key = text.trim().toLowerCase();
    if (!key) return;
    const list = map.get(key) ?? [];
    if (!list.includes(id)) list.push(id);
    map.set(key, list);
  };

  for (const n of liveNodes) {
    if (n.id === anchorId) continue;
    if (n.deletedAt) {
      addText(deletedTextToIds, n.text, n.id);
      if (n.alias) deletedAliasToId.set(normalizeAlias(n.alias), n.id);
      continue;
    }
    addText(textToIds, n.text, n.id);
    if (n.alias) aliasToId.set(normalizeAlias(n.alias), n.id);
  }

  const resolveAlias = (token: string): ResolveOpsResult | string => {
    const key = normalizeAlias(token);
    const id = aliasToId.get(key);
    if (!id) {
      return {
        ok: false,
        error: "invalid_op",
        message: `Unknown alias @${key}. Create with alias first, or use mindmap_find.`,
      };
    }
    return id;
  };

  const resolveDeletedAlias = (token: string): ResolveOpsResult | string => {
    const key = normalizeAlias(token);
    const id = deletedAliasToId.get(key);
    if (!id) {
      return {
        ok: false,
        error: "invalid_op",
        message: `Unknown deleted alias @${key}. Pass the soft-deleted node id from delete_node / history.`,
      };
    }
    return id;
  };

  const resolveDeletedText = (
    text: string,
    field: string,
  ): ResolveOpsResult | string => {
    const key = text.trim().toLowerCase();
    const ids = deletedTextToIds.get(key) ?? [];
    if (ids.length === 1) return ids[0]!;
    if (ids.length > 1) {
      return {
        ok: false,
        error: "ambiguous",
        message: `${field} "${text}" matches ${ids.length} deleted nodes; use node id`,
        candidates: ids.slice(0, 8).map((id) => {
          const n = liveNodes.find((x) => x.id === id);
          return { id, text: n?.text ?? id };
        }),
      };
    }
    return {
      ok: false,
      error: "invalid_op",
      message: `${field} "${text}" matched no deleted node. Soft-deleted ids stay valid for restore_node.`,
    };
  };

  const resolveText = (
    text: string,
    field: string,
  ): ResolveOpsResult | string => {
    const key = text.trim().toLowerCase();
    const ids = textToIds.get(key) ?? [];
    if (ids.length === 1) return ids[0]!;
    if (ids.length === 0) {
      const soft: { id: string; text: string }[] = [];
      for (const [t, list] of textToIds) {
        if (t.includes(key) || key.includes(t)) {
          for (const id of list) {
            const n = liveNodes.find((x) => x.id === id);
            soft.push({
              id,
              text: n?.text ?? [...textToIds.entries()].find(([, v]) => v.includes(id))?.[0] ?? t,
            });
          }
        }
      }
      const uniq = [...new Map(soft.map((s) => [s.id, s])).values()];
      if (uniq.length === 1) return uniq[0]!.id;
      if (uniq.length > 1) {
        return {
          ok: false,
          error: "ambiguous",
          message: `${field}="${text}" matches multiple nodes; use @alias or exact id`,
          candidates: uniq.slice(0, 8),
        };
      }
      return {
        ok: false,
        error: "invalid_op",
        message: `${field}="${text}" matched no node. Create it first or check spelling.`,
      };
    }
    return {
      ok: false,
      error: "ambiguous",
      message: `${field}="${text}" matches ${ids.length} nodes with the same title; use @alias`,
      candidates: ids.slice(0, 8).map((id) => ({
        id,
        text: liveNodes.find((n) => n.id === id)?.text ?? text,
      })),
    };
  };

  const resolveNodeRef = (
    value: unknown,
    field: string,
    mode: "live" | "deleted" = "live",
  ): ResolveOpsResult | string | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (!isRefToken(value)) {
      return {
        ok: false,
        error: "invalid_op",
        message: `${field} must be a string id, @alias, or omitted`,
      };
    }
    if (mode === "deleted") {
      if (value.startsWith("@")) return resolveDeletedAlias(value);
      if (deletedIds.has(value)) return value;
      if (deletedAliasToId.has(normalizeAlias(value))) {
        return deletedAliasToId.get(normalizeAlias(value))!;
      }
      // Exact live id that isn't deleted → clearer error than text miss.
      if (knownIds.has(value)) {
        return {
          ok: false,
          error: "invalid_op",
          message: `${field} ${value} is not deleted; restore_node only targets soft-deleted nodes`,
        };
      }
      return resolveDeletedText(value, field);
    }
    if (value.startsWith("@")) return resolveAlias(value);
    if (knownIds.has(value)) return value;
    if (aliasToId.has(normalizeAlias(value))) {
      return aliasToId.get(normalizeAlias(value))!;
    }
    return resolveText(value, field);
  };

  const registerCreateFields = (
    fields: Record<string, unknown>,
    path: string,
  ): ResolveOpsResult | Record<string, unknown> => {
    const id =
      typeof fields.id === "string" && fields.id.length
        ? fields.id
        : newId("n");
    fields.id = id;
    knownIds.add(id);
    const text = String(fields.text ?? "");
    const aliasRaw =
      typeof fields.alias === "string" && fields.alias.trim()
        ? normalizeAlias(fields.alias)
        : null;
    if (aliasRaw) {
      if (aliasToId.has(aliasRaw) && aliasToId.get(aliasRaw) !== id) {
        return {
          ok: false,
          error: "invalid_op",
          message: `alias "${aliasRaw}" already used by ${aliasToId.get(aliasRaw)} (${path})`,
        };
      }
      fields.alias = aliasRaw;
      aliasToId.set(aliasRaw, id);
    }
    addText(textToIds, text, id);
    return fields;
  };

  const resolveCreateParentsAndRelations = (
    fields: Record<string, unknown>,
    path: string,
  ): ResolveOpsResult | Record<string, unknown> => {
    if (fields.parentText != null && fields.parentId == null) {
      const r = resolveText(String(fields.parentText), `${path}.parentText`);
      if (typeof r !== "string") return r;
      fields.parentId = r;
    }
    delete fields.parentText;

    const parentResolved = resolveNodeRef(fields.parentId, `${path}.parentId`);
    if (
      parentResolved &&
      typeof parentResolved === "object" &&
      "ok" in parentResolved
    ) {
      return parentResolved;
    }
    if (parentResolved !== undefined) fields.parentId = parentResolved;

    if (Array.isArray(fields.relations)) {
      const nextRels: unknown[] = [];
      for (let ri = 0; ri < fields.relations.length; ri++) {
        const rel = fields.relations[ri];
        if (!rel || typeof rel !== "object" || Array.isArray(rel)) {
          return {
            ok: false,
            error: "invalid_op",
            message: `${path}.relations[${ri}] must be an object`,
          };
        }
        const r = { ...(rel as Record<string, unknown>) };
        if (r.toText != null && r.to == null) {
          const tr = resolveText(String(r.toText), `${path}.relations[${ri}].toText`);
          if (typeof tr !== "string") return tr;
          r.to = tr;
        }
        delete r.toText;
        const toR = resolveNodeRef(r.to, `${path}.relations[${ri}].to`);
        if (toR && typeof toR === "object" && "ok" in toR) return toR;
        if (typeof toR === "string") r.to = toR;
        nextRels.push(r);
      }
      fields.relations = nextRels;
    }
    return fields;
  };

  const out: unknown[] = [];
  const batchTextById = new Map<string, string>();

  for (let i = 0; i < rawOps.length; i++) {
    const raw = rawOps[i];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return {
        ok: false,
        error: "invalid_op",
        message: `ops[${i}] must be an object`,
      };
    }
    const op: WireOp = { ...(raw as WireOp) };
    const type = String(op.type ?? op.op ?? op.operation ?? "");

    if (type === "batch_create") {
      if (!Array.isArray(op.nodes) || op.nodes.length === 0) {
        return {
          ok: false,
          error: "invalid_op",
          message: `ops[${i}].nodes must be a non-empty array`,
        };
      }
      if (op.nodes.length > 200) {
        return {
          ok: false,
          error: "invalid_op",
          message: `batch_create supports at most 200 nodes (got ${op.nodes.length})`,
        };
      }
      const registered: Record<string, unknown>[] = [];
      for (let ni = 0; ni < op.nodes.length; ni++) {
        const nraw = op.nodes[ni];
        if (!nraw || typeof nraw !== "object" || Array.isArray(nraw)) {
          return {
            ok: false,
            error: "invalid_op",
            message: `ops[${i}].nodes[${ni}] must be an object`,
          };
        }
        const fields = { ...(nraw as Record<string, unknown>) };
        const reg = registerCreateFields(fields, `ops[${i}].nodes[${ni}]`);
        if ("ok" in reg && reg.ok === false) return reg as ResolveOpsResult;
        const f = reg as Record<string, unknown>;
        batchTextById.set(String(f.id), String(f.text ?? ""));
        registered.push(f);
      }
      const resolvedNodes: Record<string, unknown>[] = [];
      for (let ni = 0; ni < registered.length; ni++) {
        const r = resolveCreateParentsAndRelations(
          registered[ni]!,
          `ops[${i}].nodes[${ni}]`,
        );
        if ("ok" in r && r.ok === false) return r as ResolveOpsResult;
        resolvedNodes.push(r as Record<string, unknown>);
      }
      op.nodes = resolvedNodes;
      out.push(op);
      continue;
    }

    if (type === "batch_link") {
      if (!Array.isArray(op.edges) || op.edges.length === 0) {
        return {
          ok: false,
          error: "invalid_op",
          message: `ops[${i}].edges must be a non-empty array`,
        };
      }
      if (op.edges.length > 100) {
        return {
          ok: false,
          error: "invalid_op",
          message: `batch_link supports at most 100 edges (got ${op.edges.length})`,
        };
      }
      const resolvedEdges: Record<string, unknown>[] = [];
      for (let ei = 0; ei < op.edges.length; ei++) {
        const eraw = op.edges[ei];
        if (!eraw || typeof eraw !== "object" || Array.isArray(eraw)) {
          return {
            ok: false,
            error: "invalid_op",
            message: `ops[${i}].edges[${ei}] must be an object`,
          };
        }
        const e: Record<string, unknown> = { ...(eraw as Record<string, unknown>) };
        if (e.fromText != null && e.from == null) {
          const r = resolveText(String(e.fromText), `edges[${ei}].fromText`);
          if (typeof r !== "string") return r;
          e.from = r;
        }
        if (e.toText != null && e.to == null) {
          const r = resolveText(String(e.toText), `edges[${ei}].toText`);
          if (typeof r !== "string") return r;
          e.to = r;
        }
        delete e.fromText;
        delete e.toText;
        const fromR = resolveNodeRef(e.from, `edges[${ei}].from`);
        if (fromR && typeof fromR === "object" && "ok" in fromR) return fromR;
        if (typeof fromR === "string") e.from = fromR;
        const toR = resolveNodeRef(e.to, `edges[${ei}].to`);
        if (toR && typeof toR === "object" && "ok" in toR) return toR;
        if (typeof toR === "string") e.to = toR;
        if (!e.kind) e.kind = "relation";
        resolvedEdges.push(e);
      }
      op.edges = resolvedEdges;
      out.push(op);
      continue;
    }

    if (type === "create_node") {
      const reg = registerCreateFields(op, `ops[${i}]`);
      if ("ok" in reg && reg.ok === false) return reg as ResolveOpsResult;
      Object.assign(op, reg);
      batchTextById.set(String(op.id), String(op.text ?? ""));
      const resolved = resolveCreateParentsAndRelations(op, `ops[${i}]`);
      if ("ok" in resolved && resolved.ok === false) {
        return resolved as ResolveOpsResult;
      }
      Object.assign(op, resolved);
      out.push(op);
      continue;
    }

    if (type === "link") {
      if (op.fromText != null && op.from == null) {
        const r = resolveText(String(op.fromText), "fromText");
        if (typeof r !== "string") return r;
        op.from = r;
      }
      if (op.toText != null && op.to == null) {
        const r = resolveText(String(op.toText), "toText");
        if (typeof r !== "string") return r;
        op.to = r;
      }
      delete op.fromText;
      delete op.toText;

      const fromR = resolveNodeRef(op.from, "from");
      if (fromR && typeof fromR === "object" && "ok" in fromR) return fromR;
      if (typeof fromR === "string") op.from = fromR;

      const toR = resolveNodeRef(op.to, "to");
      if (toR && typeof toR === "object" && "ok" in toR) return toR;
      if (typeof toR === "string") op.to = toR;
      out.push(op);
      continue;
    }

    if (type === "restore_node") {
      if (op.nodeText != null && op.nodeId == null) {
        const r = resolveDeletedText(String(op.nodeText), "nodeText");
        if (typeof r !== "string") return r;
        op.nodeId = r;
      }
      delete op.nodeText;
      const r = resolveNodeRef(op.nodeId, "nodeId", "deleted");
      if (r && typeof r === "object" && "ok" in r) return r;
      if (typeof r === "string") op.nodeId = r;
      out.push(op);
      continue;
    }

    if (type === "unlink") {
      if (op.fromText != null && op.from == null) {
        const r = resolveText(String(op.fromText), "fromText");
        if (typeof r !== "string") return r;
        op.from = r;
      }
      if (op.toText != null && op.to == null) {
        const r = resolveText(String(op.toText), "toText");
        if (typeof r !== "string") return r;
        op.to = r;
      }
      delete op.fromText;
      delete op.toText;

      if (!op.edgeId) {
        const fromR = resolveNodeRef(op.from, "from");
        if (fromR && typeof fromR === "object" && "ok" in fromR) return fromR;
        if (typeof fromR === "string") op.from = fromR;

        const toR = resolveNodeRef(op.to, "to");
        if (toR && typeof toR === "object" && "ok" in toR) return toR;
        if (typeof toR === "string") op.to = toR;

        const from = typeof op.from === "string" ? op.from : null;
        const to = typeof op.to === "string" ? op.to : null;
        if (!from || !to) {
          return {
            ok: false,
            error: "invalid_op",
            message:
              "unlink needs edgeId, or from+to (id|@alias|title). Optional kind: hierarchy|relation.",
          };
        }
        const kind =
          op.kind === "hierarchy" || op.kind === "relation"
            ? op.kind
            : undefined;
        const match = (a: string, b: string) =>
          edges.filter(
            (e) =>
              !e.deletedAt &&
              e.from === a &&
              e.to === b &&
              (kind == null || e.kind === kind),
          );
        let hits = match(from, to);
        if (!hits.length) hits = match(to, from);
        if (!hits.length) {
          return {
            ok: false,
            error: "invalid_op",
            message: `No live edge between ${from} and ${to}${kind ? ` (kind=${kind})` : ""}. Use mindmap_get_edge / spatial_context.edges for edgeId.`,
          };
        }
        if (hits.length > 1) {
          return {
            ok: false,
            error: "ambiguous",
            message: `${hits.length} edges between those nodes; pass edgeId or kind`,
            candidates: hits.slice(0, 8).map((e) => ({
              id: e.id,
              text: `${e.kind}${e.label ? `:${e.label}` : ""} ${e.from}→${e.to}`,
            })),
          };
        }
        op.edgeId = hits[0]!.id;
      }
      delete op.from;
      delete op.to;
      delete op.kind;
      out.push(op);
      continue;
    }

    if (op.nodeText != null && op.nodeId == null) {
      const r = resolveText(String(op.nodeText), "nodeText");
      if (typeof r !== "string") return r;
      op.nodeId = r;
    }
    delete op.nodeText;

    for (const field of [
      "nodeId",
      "newParentId",
      "afterSiblingId",
      "from",
      "to",
      "parentId",
    ] as const) {
      if (op[field] === undefined) continue;
      const r = resolveNodeRef(op[field], field);
      if (r && typeof r === "object" && "ok" in r) return r;
      if (r !== undefined) op[field] = r;
    }

    out.push(op);
  }

  const nodeIdMap: Record<string, string> = {};
  for (const [alias, id] of aliasToId) {
    nodeIdMap[`@${alias}`] = id;
    nodeIdMap[alias] = id;
  }
  for (const [text, ids] of textToIds) {
    if (ids.length === 1) {
      const id = ids[0]!;
      const label =
        batchTextById.get(id) ??
        liveNodes.find((n) => n.id === id)?.text ??
        text;
      nodeIdMap[label] = id;
    }
  }

  return { ok: true, ops: out, nodeIdMap };
}

/** Build text/alias → id map from a snapshot (for responses). */
export function buildNodeIdMap(
  nodes: MindNode[],
  opts?: { anchorId?: string | null; onlyIds?: Set<string> },
): Record<string, string> {
  const map: Record<string, string> = {};
  const anchorId = opts?.anchorId ?? null;
  for (const n of nodes) {
    if (n.deletedAt || n.id === anchorId) continue;
    if (opts?.onlyIds && !opts.onlyIds.has(n.id)) continue;
    map[n.text] = n.id;
    if (n.alias) {
      map[n.alias] = n.id;
      map[`@${n.alias}`] = n.id;
    }
  }
  return map;
}
