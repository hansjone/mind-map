import type {
  CanvasMeta,
  CanvasPrefs,
  MindEdge,
  MindNode,
  Op,
} from "@mind-map/shared";
import { newId, now } from "@mind-map/shared";

export type MutableGraph = {
  canvas: CanvasMeta;
  nodes: Map<string, MindNode>;
  edges: Map<string, MindEdge>;
};

export type ApplyResult = {
  graph: MutableGraph;
  inverseOps: Op[];
  affectedNodeIds: string[];
  /** When set, host must write fitted viewport before/with persist. */
  autoFitPadding?: number;
};

export class GraphError extends Error {
  constructor(
    public code:
      | "not_found"
      | "version_conflict"
      | "invalid_op"
      | "cycle_rejected",
    message: string,
  ) {
    super(message);
    this.name = "GraphError";
  }
}

function liveNodes(g: MutableGraph): MindNode[] {
  return [...g.nodes.values()].filter((n) => !n.deletedAt);
}

function liveEdges(g: MutableGraph): MindEdge[] {
  return [...g.edges.values()].filter((e) => !e.deletedAt);
}

function wouldCreateHierarchyCycle(
  g: MutableGraph,
  from: string,
  to: string,
): boolean {
  const children = new Map<string, string[]>();
  for (const e of liveEdges(g)) {
    if (e.kind !== "hierarchy") continue;
    const list = children.get(e.from) ?? [];
    list.push(e.to);
    children.set(e.from, list);
  }
  const stack = [to];
  const seen = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === from) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const c of children.get(cur) ?? []) stack.push(c);
  }
  return false;
}

function clearPrimaryForTarget(g: MutableGraph, to: string): void {
  for (const e of liveEdges(g)) {
    if (e.kind === "hierarchy" && e.to === to && e.isPrimaryParent) {
      e.isPrimaryParent = false;
      e.version += 1;
      e.updatedAt = now();
    }
  }
}

function promoteChildrenOnDelete(g: MutableGraph, nodeId: string): Op[] {
  const inverse: Op[] = [];
  const node = g.nodes.get(nodeId);
  if (!node) return inverse;

  let primaryParentId: string | null = null;
  for (const e of liveEdges(g)) {
    if (e.kind === "hierarchy" && e.to === nodeId && e.isPrimaryParent) {
      primaryParentId = e.from;
      break;
    }
  }

  const childEdges = liveEdges(g).filter(
    (e) => e.kind === "hierarchy" && e.from === nodeId,
  );
  for (const ce of childEdges) {
    ce.deletedAt = now();
    ce.version += 1;
    inverse.push({ type: "link", from: nodeId, to: ce.to, kind: "hierarchy", asPrimary: ce.isPrimaryParent, label: ce.label });
    if (primaryParentId) {
      const id = newId("e");
      const t = now();
      clearPrimaryForTarget(g, ce.to);
      g.edges.set(id, {
        id,
        canvasId: g.canvas.id,
        from: primaryParentId,
        to: ce.to,
        kind: "hierarchy",
        isPrimaryParent: true,
        order: ce.order,
        tags: [],
        version: 1,
        createdAt: t,
        updatedAt: t,
      });
      inverse.push({ type: "unlink", edgeId: id });
    }
  }
  return inverse;
}

export function createEmptyGraph(
  title = "未命名画布",
  rootText?: string,
  prefsOverride?: Partial<CanvasPrefs>,
): MutableGraph {
  const canvasId = newId("c");
  const nodeId = newId("n");
  const t = now();
  const prefs: CanvasPrefs = {
    themeId: "abyss",
    branchColoring: true,
    density: "comfortable",
    riskProfile: "fast",
    showRelationEdges: true,
    nodeBadges: "icons",
    showHoverCard: true,
    inspectorMode: "selection",
    nodeViewMode: "card",
    ...prefsOverride,
  };
  const canvas: CanvasMeta = {
    id: canvasId,
    title,
    focusNodeId: nodeId,
    anchorNodeId: nodeId,
    viewport: { x: 0, y: 0, zoom: 1 },
    rev: 0,
    prefs,
    agentMode: "edit",
    createdAt: t,
    updatedAt: t,
  };
  const node: MindNode = {
    id: nodeId,
    canvasId,
    text: rootText ?? title,
    collapsed: false,
    pinned: false,
    sidePref: 0,
    stylePreset: "title",
    version: 1,
    tags: [],
    links: [],
    createdAt: t,
    updatedAt: t,
  };
  return {
    canvas,
    nodes: new Map([[nodeId, node]]),
    edges: new Map(),
  };
}

export function resolveAnchorNodeId(g: MutableGraph): string | null {
  if (g.canvas.anchorNodeId && g.nodes.get(g.canvas.anchorNodeId) && !g.nodes.get(g.canvas.anchorNodeId)!.deletedAt) {
    return g.canvas.anchorNodeId;
  }
  for (const n of g.nodes.values()) {
    if (n.deletedAt) continue;
    if (n.stylePreset !== "title") continue;
    const hasParent = [...g.edges.values()].some(
      (e) =>
        e.kind === "hierarchy" &&
        e.isPrimaryParent &&
        !e.deletedAt &&
        e.to === n.id,
    );
    if (!hasParent) {
      g.canvas.anchorNodeId = n.id;
      return n.id;
    }
  }
  return g.canvas.focusNodeId;
}

export function isAnchorNode(g: MutableGraph, nodeId: string): boolean {
  return resolveAnchorNodeId(g) === nodeId;
}

export function cloneGraph(g: MutableGraph): MutableGraph {
  return {
    canvas: { ...g.canvas, prefs: { ...g.canvas.prefs }, viewport: { ...g.canvas.viewport } },
    nodes: new Map(
      [...g.nodes.entries()].map(([k, v]) => [
        k,
        {
          ...v,
          tags: [...(v.tags ?? [])],
          links: (v.links ?? []).map((l) => ({ ...l })),
          description: v.description ? { ...v.description } : undefined,
        },
      ]),
    ),
    edges: new Map(
      [...g.edges.entries()].map(([k, v]) => [
        k,
        { ...v, tags: [...(v.tags ?? [])] },
      ]),
    ),
  };
}

function assertAliasUnique(
  g: MutableGraph,
  alias: string | undefined,
  selfId: string,
) {
  if (!alias) return;
  for (const other of g.nodes.values()) {
    if (!other.deletedAt && other.id !== selfId && other.alias === alias) {
      throw new GraphError(
        "invalid_op",
        `alias "${alias}" already used by ${other.id}`,
      );
    }
  }
}

function addOutgoingRelations(
  g: MutableGraph,
  fromId: string,
  relations:
    | {
        to: string;
        kind?: "hierarchy" | "relation";
        label?: string;
        weight?: number;
        lineStyle?: MindEdge["lineStyle"];
        direction?: MindEdge["direction"];
      }[]
    | undefined,
  affected: Set<string>,
) {
  if (!relations?.length) return;
  const t = now();
  for (const rel of relations) {
    if (!g.nodes.get(rel.to) || g.nodes.get(rel.to)!.deletedAt) {
      throw new GraphError("not_found", rel.to);
    }
    const kind = rel.kind ?? "relation";
    if (kind === "hierarchy" && wouldCreateHierarchyCycle(g, fromId, rel.to)) {
      throw new GraphError("cycle_rejected", "hierarchy cycle");
    }
    const eid = newId("e");
    if (kind === "hierarchy") clearPrimaryForTarget(g, rel.to);
    g.edges.set(eid, {
      id: eid,
      canvasId: g.canvas.id,
      from: fromId,
      to: rel.to,
      kind,
      isPrimaryParent: kind === "hierarchy",
      order: 0,
      label: rel.label,
      tags: [],
      weight: rel.weight,
      lineStyle: rel.lineStyle,
      direction: rel.direction ?? (kind === "relation" ? "forward" : "none"),
      version: 1,
      createdAt: t,
      updatedAt: t,
    });
    // Inverse is covered by delete_node of the source (same as hierarchy parent edge).
    affected.add(fromId);
    affected.add(rel.to);
  }
}

function materializeNodeFromCreate(
  g: MutableGraph,
  op: Extract<Op, { type: "create_node" }> | {
    id?: string;
    text: string;
    parentId?: string | null;
    sidePref?: -1 | 0 | 1;
    stylePreset?: MindNode["stylePreset"];
    pos?: { x: number; y: number };
    pinned?: boolean;
    note?: string;
    description?: MindNode["description"];
    tags?: string[];
    links?: MindNode["links"];
    imageUrl?: string;
    dueAt?: number;
    startAt?: number;
    accentColor?: MindNode["accentColor"];
    icon?: MindNode["icon"];
    alias?: string;
  },
  opts: { attachParent: boolean; anchorId: string | null },
): { id: string; parentId: string | null } {
  const id = op.id ?? newId("n");
  if (g.nodes.has(id) && !g.nodes.get(id)!.deletedAt) {
    throw new GraphError("invalid_op", `node exists: ${id}`);
  }
  if (op.stylePreset === "title") {
    throw new GraphError(
      "invalid_op",
      "Cannot create another title/anchor node; omit parentId for top-level content nodes",
    );
  }
  const t = now();
  const pinPos = op.pos;
  const pinned = op.pinned ?? Boolean(pinPos);
  const alias =
    op.alias?.trim().replace(/^@/, "").toLowerCase() || undefined;
  assertAliasUnique(g, alias, id);
  const node: MindNode = {
    id,
    canvasId: g.canvas.id,
    text: op.text,
    note: op.note,
    description: op.description ? { ...op.description } : undefined,
    collapsed: false,
    pinned,
    pos: pinPos ?? null,
    sidePref: op.sidePref ?? 0,
    stylePreset: op.stylePreset ?? "default",
    version: 1,
    tags: op.tags ? [...op.tags] : [],
    links: op.links ? op.links.map((l) => ({ ...l })) : [],
    imageUrl: op.imageUrl,
    dueAt: op.dueAt,
    startAt: op.startAt,
    accentColor: op.accentColor,
    icon: op.icon,
    alias,
    createdAt: t,
    updatedAt: t,
  };
  g.nodes.set(id, node);

  let parentId: string | null =
    op.parentId === undefined || op.parentId === null || op.parentId === ""
      ? opts.anchorId
      : op.parentId;
  if (!opts.attachParent) {
    return { id, parentId };
  }
  if (parentId === id) {
    throw new GraphError("invalid_op", "node cannot parent itself");
  }
  if (parentId) {
    if (!g.nodes.get(parentId) || g.nodes.get(parentId)!.deletedAt) {
      throw new GraphError("not_found", `parent ${parentId}`);
    }
    if (wouldCreateHierarchyCycle(g, parentId, id)) {
      throw new GraphError("cycle_rejected", "hierarchy cycle");
    }
    const eid = newId("e");
    clearPrimaryForTarget(g, id);
    g.edges.set(eid, {
      id: eid,
      canvasId: g.canvas.id,
      from: parentId,
      to: id,
      kind: "hierarchy",
      isPrimaryParent: true,
      order: 0,
      tags: [],
      version: 1,
      createdAt: t,
      updatedAt: t,
    });
  }
  return { id, parentId };
}

export function applyOps(graph: MutableGraph, ops: Op[]): ApplyResult {
  const g = cloneGraph(graph);
  const inverseOps: Op[] = [];
  const affected = new Set<string>();
  const anchorId = resolveAnchorNodeId(g);
  let autoFitPadding: number | undefined;

  for (const op of ops) {
    switch (op.type) {
      case "create_node": {
        const { id, parentId } = materializeNodeFromCreate(g, op, {
          attachParent: true,
          anchorId,
        });
        affected.add(id);
        if (parentId) affected.add(parentId);
        inverseOps.push({ type: "delete_node", nodeId: id });
        addOutgoingRelations(g, id, op.relations, affected);
        break;
      }
      case "batch_create": {
        const specs = op.nodes;
        const created: {
          id: string;
          parentId: string | null;
          relations?: (typeof specs)[0]["relations"];
        }[] = [];
        for (const spec of specs) {
          const { id, parentId } = materializeNodeFromCreate(g, spec, {
            attachParent: false,
            anchorId,
          });
          created.push({ id, parentId, relations: spec.relations });
          affected.add(id);
          inverseOps.push({ type: "delete_node", nodeId: id });
        }
        const t = now();
        for (const c of created) {
          let parentId = c.parentId;
          if (parentId === undefined || parentId === null || parentId === "") {
            parentId = anchorId;
          }
          if (!parentId || parentId === c.id) continue;
          if (!g.nodes.get(parentId) || g.nodes.get(parentId)!.deletedAt) {
            throw new GraphError("not_found", `parent ${parentId}`);
          }
          if (wouldCreateHierarchyCycle(g, parentId, c.id)) {
            throw new GraphError("cycle_rejected", "hierarchy cycle");
          }
          const eid = newId("e");
          clearPrimaryForTarget(g, c.id);
          g.edges.set(eid, {
            id: eid,
            canvasId: g.canvas.id,
            from: parentId,
            to: c.id,
            kind: "hierarchy",
            isPrimaryParent: true,
            order: 0,
            tags: [],
            version: 1,
            createdAt: t,
            updatedAt: t,
          });
          affected.add(parentId);
        }
        for (const c of created) {
          addOutgoingRelations(g, c.id, c.relations, affected);
        }
        break;
      }
      case "batch_link": {
        for (const edge of op.edges) {
          if (!g.nodes.get(edge.from) || g.nodes.get(edge.from)!.deletedAt) {
            throw new GraphError("not_found", edge.from);
          }
          if (!g.nodes.get(edge.to) || g.nodes.get(edge.to)!.deletedAt) {
            throw new GraphError("not_found", edge.to);
          }
          if (
            edge.kind === "hierarchy" &&
            wouldCreateHierarchyCycle(g, edge.from, edge.to)
          ) {
            throw new GraphError("cycle_rejected", "hierarchy cycle");
          }
          const eid = newId("e");
          const t = now();
          if (edge.kind === "hierarchy" && edge.asPrimary !== false) {
            clearPrimaryForTarget(g, edge.to);
          }
          g.edges.set(eid, {
            id: eid,
            canvasId: g.canvas.id,
            from: edge.from,
            to: edge.to,
            kind: edge.kind,
            isPrimaryParent:
              edge.kind === "hierarchy" && edge.asPrimary !== false,
            order: 0,
            label: edge.label,
            tags: [],
            weight: edge.weight,
            lineStyle: edge.lineStyle,
            direction:
              edge.direction ??
              (edge.kind === "relation" ? "forward" : "none"),
            version: 1,
            createdAt: t,
            updatedAt: t,
          });
          inverseOps.push({ type: "unlink", edgeId: eid });
          affected.add(edge.from);
          affected.add(edge.to);
        }
        break;
      }
      case "update_node_meta": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        if (op.expectedVersion != null && n.version !== op.expectedVersion) {
          throw new GraphError("version_conflict", op.nodeId);
        }
        const prevPatch = {
          note: n.note ?? null,
          description: n.description ? { ...n.description } : null,
          tags: [...(n.tags ?? [])],
          links: (n.links ?? []).map((l) => ({ ...l })),
          imageUrl: n.imageUrl ?? null,
          dueAt: n.dueAt ?? null,
          startAt: n.startAt ?? null,
          accentColor: n.accentColor ?? null,
          icon: n.icon ?? null,
          alias: n.alias ?? null,
        };
        inverseOps.push({
          type: "update_node_meta",
          nodeId: op.nodeId,
          patch: prevPatch,
          expectedVersion: n.version + 1,
        });
        const p = op.patch;
        if (p.note !== undefined) n.note = p.note ?? undefined;
        if (p.description !== undefined) {
          n.description =
            p.description == null ? undefined : { ...p.description };
        }
        if (p.tags !== undefined) n.tags = [...p.tags];
        if (p.links !== undefined) n.links = p.links.map((l) => ({ ...l }));
        if (p.imageUrl !== undefined) n.imageUrl = p.imageUrl ?? undefined;
        if (p.dueAt !== undefined) n.dueAt = p.dueAt ?? undefined;
        if (p.startAt !== undefined) n.startAt = p.startAt ?? undefined;
        if (p.accentColor !== undefined) n.accentColor = p.accentColor ?? undefined;
        if (p.icon !== undefined) n.icon = p.icon ?? undefined;
        if (p.alias !== undefined) {
          const next =
            p.alias == null
              ? undefined
              : p.alias.trim().replace(/^@/, "").toLowerCase();
          assertAliasUnique(g, next, n.id);
          n.alias = next;
        }
        n.version += 1;
        n.updatedAt = now();
        affected.add(n.id);
        break;
      }
      case "update_text": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        if (op.expectedVersion != null && n.version !== op.expectedVersion) {
          throw new GraphError("version_conflict", op.nodeId);
        }
        inverseOps.push({
          type: "update_text",
          nodeId: op.nodeId,
          text: n.text,
          expectedVersion: n.version + 1,
        });
        n.text = op.text;
        n.version += 1;
        n.updatedAt = now();
        if (isAnchorNode(g, op.nodeId)) {
          g.canvas.title = op.text;
        }
        affected.add(n.id);
        break;
      }
      case "move_node": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        if (isAnchorNode(g, op.nodeId)) {
          throw new GraphError("invalid_op", "Cannot move the hidden canvas anchor");
        }
        const oldPrimary = liveEdges(g).find(
          (e) => e.kind === "hierarchy" && e.to === op.nodeId && e.isPrimaryParent,
        );
        if (oldPrimary) {
          oldPrimary.deletedAt = now();
          oldPrimary.version += 1;
          inverseOps.push({
            type: "link",
            from: oldPrimary.from,
            to: oldPrimary.to,
            kind: "hierarchy",
            asPrimary: true,
            label: oldPrimary.label,
          });
        }
        if (op.newParentId || anchorId) {
          const newParentId = op.newParentId || anchorId!;
          if (!g.nodes.get(newParentId) || g.nodes.get(newParentId)!.deletedAt) {
            throw new GraphError("not_found", newParentId);
          }
          if (wouldCreateHierarchyCycle(g, newParentId, op.nodeId)) {
            throw new GraphError("cycle_rejected", "hierarchy cycle");
          }
          const eid = newId("e");
          const t = now();
          clearPrimaryForTarget(g, op.nodeId);
          g.edges.set(eid, {
            id: eid,
            canvasId: g.canvas.id,
            from: newParentId,
            to: op.nodeId,
            kind: "hierarchy",
            isPrimaryParent: true,
            order: op.order ?? 0,
            tags: [],
            version: 1,
            createdAt: t,
            updatedAt: t,
          });
          inverseOps.push({ type: "unlink", edgeId: eid });
          affected.add(newParentId);
        }
        if (op.sidePref != null) n.sidePref = op.sidePref;
        n.version += 1;
        n.updatedAt = now();
        affected.add(n.id);
        break;
      }
      case "reorder": {
        const e = liveEdges(g).find(
          (x) => x.kind === "hierarchy" && x.to === op.nodeId && x.isPrimaryParent,
        );
        if (!e) throw new GraphError("not_found", `primary edge for ${op.nodeId}`);
        if (op.order == null && op.afterSiblingId === undefined) {
          throw new GraphError(
            "invalid_op",
            "reorder requires order (number) or afterSiblingId",
          );
        }
        let nextOrder = op.order;
        if (nextOrder == null) {
          const siblings = liveEdges(g)
            .filter(
              (x) =>
                x.kind === "hierarchy" &&
                x.isPrimaryParent &&
                x.from === e.from &&
                x.to !== op.nodeId,
            )
            .sort((a, b) => a.order - b.order);
          if (op.afterSiblingId == null) {
            nextOrder = (siblings[0]?.order ?? 0) - 1;
          } else {
            const after = siblings.find((s) => s.to === op.afterSiblingId);
            if (!after) {
              throw new GraphError(
                "not_found",
                `afterSiblingId ${op.afterSiblingId} not under same parent`,
              );
            }
            const idx = siblings.indexOf(after);
            const next = siblings[idx + 1];
            nextOrder = next
              ? (after.order + next.order) / 2
              : after.order + 1;
          }
        }
        const n = g.nodes.get(op.nodeId)!;
        // Pinned x/y would ignore sibling order — unpin so re-layout can move it.
        if (n.pinned) {
          inverseOps.push({
            type: "set_pinned",
            nodeId: op.nodeId,
            pinned: true,
            pos: n.pos ?? undefined,
          });
          n.pinned = false;
          n.pos = null;
        }
        inverseOps.push({ type: "reorder", nodeId: op.nodeId, order: e.order });
        e.order = nextOrder;
        e.version += 1;
        e.updatedAt = now();
        n.version += 1;
        n.updatedAt = now();
        affected.add(op.nodeId);
        break;
      }
      case "set_primary_parent": {
        const edge = g.edges.get(op.edgeId);
        if (!edge || edge.deletedAt || edge.kind !== "hierarchy") {
          throw new GraphError("not_found", op.edgeId);
        }
        if (edge.to !== op.nodeId) {
          throw new GraphError("invalid_op", "edge target mismatch");
        }
        const prev = liveEdges(g).find(
          (e) => e.kind === "hierarchy" && e.to === op.nodeId && e.isPrimaryParent,
        );
        if (prev) {
          inverseOps.push({
            type: "set_primary_parent",
            nodeId: op.nodeId,
            edgeId: prev.id,
          });
          prev.isPrimaryParent = false;
          prev.version += 1;
        }
        edge.isPrimaryParent = true;
        edge.version += 1;
        edge.updatedAt = now();
        affected.add(op.nodeId);
        break;
      }
      case "link": {
        if (!g.nodes.get(op.from) || g.nodes.get(op.from)!.deletedAt) {
          throw new GraphError("not_found", op.from);
        }
        if (!g.nodes.get(op.to) || g.nodes.get(op.to)!.deletedAt) {
          throw new GraphError("not_found", op.to);
        }
        if (op.kind === "hierarchy" && wouldCreateHierarchyCycle(g, op.from, op.to)) {
          throw new GraphError("cycle_rejected", "hierarchy cycle");
        }
        const eid = newId("e");
        const t = now();
        if (op.kind === "hierarchy" && op.asPrimary !== false) {
          clearPrimaryForTarget(g, op.to);
        }
        g.edges.set(eid, {
          id: eid,
          canvasId: g.canvas.id,
          from: op.from,
          to: op.to,
          kind: op.kind,
          isPrimaryParent: op.kind === "hierarchy" && op.asPrimary !== false,
          order: 0,
          label: op.label,
          tags: [],
          weight: op.weight,
          lineStyle: op.lineStyle,
          direction:
            op.direction ?? (op.kind === "relation" ? "forward" : "none"),
          version: 1,
          createdAt: t,
          updatedAt: t,
        });
        inverseOps.push({ type: "unlink", edgeId: eid });
        affected.add(op.from);
        affected.add(op.to);
        break;
      }
      case "unlink": {
        const e = g.edges.get(op.edgeId);
        if (!e || e.deletedAt) throw new GraphError("not_found", op.edgeId);
        inverseOps.push({
          type: "link",
          from: e.from,
          to: e.to,
          kind: e.kind,
          asPrimary: e.isPrimaryParent,
          label: e.label,
        });
        e.deletedAt = now();
        e.version += 1;
        affected.add(e.from);
        affected.add(e.to);
        break;
      }
      case "delete_node": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        if (isAnchorNode(g, op.nodeId)) {
          throw new GraphError("invalid_op", "Cannot delete the hidden canvas anchor");
        }
        inverseOps.push(...promoteChildrenOnDelete(g, op.nodeId).reverse());
        // Soft-delete remaining incident edges. restore_node undeletes them
        // (with conflict checks) — do not push link inverses here or undo would duplicate.
        for (const e of liveEdges(g)) {
          if (e.from === op.nodeId || e.to === op.nodeId) {
            e.deletedAt = now();
            e.version += 1;
          }
        }
        inverseOps.push({ type: "restore_node", nodeId: op.nodeId });
        n.deletedAt = now();
        n.version += 1;
        n.updatedAt = now();
        if (g.canvas.focusNodeId === op.nodeId) {
          const parentEdge = [...g.edges.values()].find(
            (e) =>
              e.kind === "hierarchy" &&
              e.to === op.nodeId &&
              e.isPrimaryParent &&
              e.deletedAt,
          );
          const fallback =
            (parentEdge && liveNodes(g).find((x) => x.id === parentEdge.from)?.id) ||
            liveNodes(g).sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id ||
            null;
          if (!fallback) {
            const anchor = createEmptyGraph(g.canvas.title);
            const only = [...anchor.nodes.values()][0]!;
            only.canvasId = g.canvas.id;
            g.nodes.set(only.id, only);
            g.canvas.focusNodeId = only.id;
            affected.add(only.id);
          } else {
            g.canvas.focusNodeId = fallback;
            affected.add(fallback);
          }
        }
        affected.add(op.nodeId);
        break;
      }
      case "restore_node": {
        const n = g.nodes.get(op.nodeId);
        if (!n) throw new GraphError("not_found", op.nodeId);
        if (isAnchorNode(g, op.nodeId)) {
          throw new GraphError("invalid_op", "Cannot restore the hidden canvas anchor");
        }
        if (!n.deletedAt) {
          throw new GraphError(
            "invalid_op",
            `node ${op.nodeId} is not deleted`,
          );
        }
        inverseOps.push({ type: "delete_node", nodeId: op.nodeId });
        n.deletedAt = null;
        n.version += 1;
        n.updatedAt = now();
        affected.add(n.id);

        // Undelete soft-deleted incident edges when the other end is live and
        // there is no conflicting live edge (e.g. children already promoted).
        for (const e of g.edges.values()) {
          if (!e.deletedAt) continue;
          if (e.from !== op.nodeId && e.to !== op.nodeId) continue;
          const otherId = e.from === op.nodeId ? e.to : e.from;
          const other = g.nodes.get(otherId);
          if (!other || other.deletedAt) continue;
          const dup = liveEdges(g).some(
            (x) =>
              x.from === e.from && x.to === e.to && x.kind === e.kind,
          );
          if (dup) continue;
          if (e.kind === "hierarchy" && e.isPrimaryParent) {
            const hasPrimary = liveEdges(g).some(
              (x) =>
                x.kind === "hierarchy" &&
                x.isPrimaryParent &&
                x.to === e.to,
            );
            if (hasPrimary) continue;
          }
          e.deletedAt = null;
          e.version += 1;
          e.updatedAt = now();
          affected.add(e.from);
          affected.add(e.to);
        }
        break;
      }
      case "set_pinned": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        inverseOps.push({
          type: "set_pinned",
          nodeId: op.nodeId,
          pinned: n.pinned,
          pos: n.pos ?? undefined,
        });
        n.pinned = op.pinned;
        if (op.pos) n.pos = op.pos;
        if (!op.pinned) n.pos = null;
        n.version += 1;
        n.updatedAt = now();
        affected.add(n.id);
        break;
      }
      case "set_collapsed": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        inverseOps.push({
          type: "set_collapsed",
          nodeId: op.nodeId,
          collapsed: n.collapsed,
        });
        n.collapsed = op.collapsed;
        n.version += 1;
        n.updatedAt = now();
        affected.add(n.id);
        break;
      }
      case "set_style_preset": {
        const n = g.nodes.get(op.nodeId);
        if (!n || n.deletedAt) throw new GraphError("not_found", op.nodeId);
        inverseOps.push({
          type: "set_style_preset",
          nodeId: op.nodeId,
          stylePreset: n.stylePreset,
        });
        n.stylePreset = op.stylePreset;
        n.version += 1;
        n.updatedAt = now();
        affected.add(n.id);
        break;
      }
      case "set_edge_label": {
        const e = g.edges.get(op.edgeId);
        if (!e || e.deletedAt) throw new GraphError("not_found", op.edgeId);
        inverseOps.push({
          type: "set_edge_label",
          edgeId: op.edgeId,
          label: e.label ?? "",
        });
        e.label = op.label;
        e.version += 1;
        e.updatedAt = now();
        affected.add(e.from);
        affected.add(e.to);
        break;
      }
      case "update_edge_meta": {
        const e = g.edges.get(op.edgeId);
        if (!e || e.deletedAt) throw new GraphError("not_found", op.edgeId);
        if (op.expectedVersion != null && e.version !== op.expectedVersion) {
          throw new GraphError("version_conflict", op.edgeId);
        }
        inverseOps.push({
          type: "update_edge_meta",
          edgeId: op.edgeId,
          patch: {
            label: e.label ?? null,
            tags: [...(e.tags ?? [])],
            note: e.note ?? null,
            weight: e.weight ?? null,
            lineStyle: e.lineStyle ?? null,
            direction: e.direction ?? null,
          },
          expectedVersion: e.version + 1,
        });
        const p = op.patch;
        if (p.label !== undefined) e.label = p.label ?? undefined;
        if (p.tags !== undefined) e.tags = [...p.tags];
        if (p.note !== undefined) e.note = p.note ?? undefined;
        if (p.weight !== undefined) e.weight = p.weight ?? undefined;
        if (p.lineStyle !== undefined) e.lineStyle = p.lineStyle ?? undefined;
        if (p.direction !== undefined) e.direction = p.direction ?? undefined;
        e.version += 1;
        e.updatedAt = now();
        affected.add(e.from);
        affected.add(e.to);
        break;
      }
      case "set_prefs": {
        const prev = { ...g.canvas.prefs };
        inverseOps.push({ type: "set_prefs", prefs: prev });
        g.canvas.prefs = { ...g.canvas.prefs, ...op.prefs } as CanvasPrefs;
        g.canvas.updatedAt = now();
        break;
      }
      case "set_focus": {
        if (!g.nodes.get(op.nodeId) || g.nodes.get(op.nodeId)!.deletedAt) {
          throw new GraphError("not_found", op.nodeId);
        }
        const prev = g.canvas.focusNodeId;
        if (prev) inverseOps.push({ type: "set_focus", nodeId: prev });
        g.canvas.focusNodeId = op.nodeId;
        g.canvas.updatedAt = now();
        affected.add(op.nodeId);
        break;
      }
      case "set_viewport": {
        inverseOps.push({
          type: "set_viewport",
          viewport: { ...g.canvas.viewport },
        });
        g.canvas.viewport = { ...op.viewport };
        g.canvas.updatedAt = now();
        break;
      }
      case "auto_fit": {
        inverseOps.push({
          type: "set_viewport",
          viewport: { ...g.canvas.viewport },
        });
        autoFitPadding = op.padding ?? 50;
        break;
      }
      default: {
        const bad = op as { type?: string };
        throw new GraphError(
          "invalid_op",
          `unknown op ${String(bad?.type)}. Each op needs field "type" (not "op"). Valid: create_node, batch_create, batch_link, update_text, update_node_meta, move_node, reorder, set_primary_parent, link, unlink, delete_node, restore_node, set_pinned, set_collapsed, set_style_preset, set_edge_label, update_edge_meta, set_prefs, set_focus, set_viewport, auto_fit`,
        );
      }
    }
  }

  g.canvas.updatedAt = now();
  return {
    graph: g,
    inverseOps: inverseOps.reverse(),
    affectedNodeIds: [...affected],
    autoFitPadding,
  };
}

export function toSnapshot(g: MutableGraph) {
  return {
    canvas: g.canvas,
    nodes: liveNodes(g),
    edges: liveEdges(g),
  };
}
