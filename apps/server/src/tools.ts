import type { SqliteGraphStore } from "@mind-map/graph-store";
import { applyOps, cloneGraph, toSnapshot } from "@mind-map/graph-core";
import type { MindEdge, MindNode, Op, SearchScope } from "@mind-map/shared";
import {
  newId,
  now,
  parseOps,
  resolveWireOps,
  buildNodeIdMap,
  computeFitViewport,
  queryNeighbors,
  queryPaths,
  queryStats,
  queryOrphans,
  queryMissingMeta,
  resolveQueryNodeRef,
  nodeFunction,
  OP_SCHEMA_DOC,
  OP_TYPES,
  NodeIconSchema,
  NodeViewModeSchema,
} from "@mind-map/shared";
import { hierarchyFingerprint, layout } from "@mind-map/layout-engine";

export type ClientActivity = {
  canvasId: string;
  selectionIds: string[];
  focusNodeId: string | null;
  viewport: { x: number; y: number; zoom: number };
  updatedAt: number;
};

const activityByCanvas = new Map<string, ClientActivity>();

function prepareOps(
  store: SqliteGraphStore,
  canvasId: string,
  rawOps: unknown,
):
  | { ok: true; ops: Op[]; nodeIdMap: Record<string, string> }
  | {
      ok: false;
      error: string;
      message: string;
      candidates?: { id: string; text: string }[];
      validTypes?: readonly string[];
      issues?: unknown;
    } {
  if (!Array.isArray(rawOps)) {
    const parsed = parseOps(rawOps);
    return parsed.ok
      ? { ok: true, ops: parsed.ops, nodeIdMap: {} }
      : parsed;
  }
  // Full graph (incl. soft-deleted) so restore_node / unlink from+to can resolve.
  const g = store.loadCanvas(canvasId);
  const resolved = resolveWireOps(
    rawOps,
    [...g.nodes.values()],
    {
      anchorId: g.canvas.anchorNodeId ?? null,
      edges: [...g.edges.values()],
    },
  );
  if (!resolved.ok) {
    return {
      ok: false,
      error: resolved.error,
      message: resolved.message,
      candidates: resolved.candidates,
      validTypes: OP_TYPES,
    };
  }
  const parsed = parseOps(resolved.ops);
  if (!parsed.ok) return parsed;
  return { ok: true, ops: parsed.ops, nodeIdMap: resolved.nodeIdMap };
}

function parseSearchScope(raw: unknown): SearchScope {
  const v = String(raw ?? "text");
  if (
    v === "note" ||
    v === "tags" ||
    v === "all" ||
    v === "text" ||
    v === "description" ||
    v === "edge_label" ||
    v === "edge_note"
  )
    return v;
  return "text";
}

function findVisibleHits(
  store: SqliteGraphStore,
  canvasId: string,
  query: string,
  scope: SearchScope,
  limit = 20,
) {
  const view = publicGraphView(store, canvasId);
  const visible = new Set(view.nodes.map((n) => n.id));
  const hits = store.search(canvasId, query, limit, scope).filter((h) => {
    if (h.kind === "edge") {
      return (
        visible.has(h.from) &&
        visible.has(h.to) &&
        h.from !== view.anchorId &&
        h.to !== view.anchorId
      );
    }
    return h.id !== view.anchorId && visible.has(h.id);
  });
  const ambiguous =
    hits.length > 1 && hits[0]!.score - (hits[1]?.score ?? 0) < 0.15;
  return { view, hits, ambiguous };
}

function candidateFromHit(
  h: ReturnType<SqliteGraphStore["search"]>[number],
) {
  if (h.kind === "edge") {
    return {
      kind: "edge" as const,
      edgeId: h.id,
      from: h.from,
      to: h.to,
      fromText: h.fromText,
      toText: h.toText,
      label: h.label,
      note: h.note,
      score: h.score,
      matchIn: h.matchIn,
    };
  }
  return {
    kind: "node" as const,
    id: h.id,
    text: h.text,
    score: h.score,
    matchIn: h.matchIn,
  };
}

function exportMarkdown(
  nodes: MindNode[],
  edges: MindEdge[],
  title: string,
  anchorId: string | null,
): string {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const children = new Map<string, string[]>();
  for (const e of edges) {
    if (e.deletedAt || e.kind !== "hierarchy" || !e.isPrimaryParent) continue;
    if (!byId.has(e.from) || !byId.has(e.to)) continue;
    const list = children.get(e.from) ?? [];
    list.push(e.to);
    children.set(e.from, list);
  }
  for (const [from, list] of children) {
    list.sort((a, b) => {
      const oa =
        edges.find(
          (e) =>
            e.kind === "hierarchy" &&
            e.isPrimaryParent &&
            e.from === from &&
            e.to === a &&
            !e.deletedAt,
        )?.order ?? 0;
      const ob =
        edges.find(
          (e) =>
            e.kind === "hierarchy" &&
            e.isPrimaryParent &&
            e.from === from &&
            e.to === b &&
            !e.deletedAt,
        )?.order ?? 0;
      return oa - ob;
    });
  }

  const lines: string[] = [`# ${title}`, ""];
  const walk = (id: string, depth: number, path: Set<string>) => {
    if (path.has(id)) return;
    const n = byId.get(id);
    if (!n || n.deletedAt) return;
    const next = new Set(path);
    next.add(id);
    if (id !== anchorId) {
      const pad = "  ".repeat(Math.max(0, depth));
      const icon = n.icon ? `[${n.icon}] ` : "";
      lines.push(`${pad}- ${icon}${n.text}`);
      if (n.note?.trim()) lines.push(`${pad}  > ${n.note.trim()}`);
      if (n.tags?.length) lines.push(`${pad}  tags: ${n.tags.join(", ")}`);
    }
    for (const cid of children.get(id) ?? []) {
      walk(cid, id === anchorId ? 0 : depth + 1, next);
    }
  };

  const roots =
    anchorId && children.get(anchorId)?.length
      ? children.get(anchorId)!
      : nodes
          .filter((n) => !n.deletedAt && n.id !== anchorId)
          .filter(
            (n) =>
              !edges.some(
                (e) =>
                  e.kind === "hierarchy" &&
                  e.isPrimaryParent &&
                  e.to === n.id &&
                  !e.deletedAt,
              ),
          )
          .map((n) => n.id);

  if (anchorId) walk(anchorId, 0, new Set());
  else for (const id of roots) walk(id, 0, new Set());

  const relations = edges.filter(
    (e) => e.kind === "relation" && !e.deletedAt && byId.has(e.from) && byId.has(e.to),
  );
  if (relations.length) {
    lines.push("", "## Relations", "");
    for (const e of relations) {
      const a = byId.get(e.from)?.text ?? e.from;
      const b = byId.get(e.to)?.text ?? e.to;
      const label = e.label ? ` (${e.label})` : "";
      lines.push(`- ${a} → ${b}${label}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function exportSvg(
  nodes: MindNode[],
  edges: MindEdge[],
  positions: Record<string, { x: number; y: number }>,
  title: string,
  anchorId: string | null,
): string {
  const visible = nodes.filter(
    (n) => !n.deletedAt && n.id !== anchorId && positions[n.id],
  );
  if (!visible.length) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><text x="20" y="40">${escapeXml(title)} (empty)</text></svg>`;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const boxW = 160;
  const boxH = 40;
  for (const n of visible) {
    const p = positions[n.id]!;
    minX = Math.min(minX, p.x - boxW / 2);
    maxX = Math.max(maxX, p.x + boxW / 2);
    minY = Math.min(minY, p.y - boxH / 2);
    maxY = Math.max(maxY, p.y + boxH / 2);
  }
  const pad = 48;
  const width = Math.ceil(maxX - minX + pad * 2);
  const height = Math.ceil(maxY - minY + pad * 2);
  const tx = (x: number) => x - minX + pad;
  const ty = (y: number) => y - minY + pad;
  const byId = new Set(visible.map((n) => n.id));
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#5e6ad2"/>
  </marker>
</defs>`,
    `<rect width="100%" height="100%" fill="#0f1117"/>`,
    `<text x="${pad}" y="28" fill="#a5adb8" font-size="14" font-family="sans-serif">${escapeXml(title)}</text>`,
  ];
  for (const e of edges) {
    if (e.deletedAt || !byId.has(e.from) || !byId.has(e.to)) continue;
    const a = positions[e.from]!;
    const b = positions[e.to]!;
    const dash =
      e.lineStyle === "dotted"
        ? ' stroke-dasharray="2 4"'
        : e.kind === "relation" || e.lineStyle === "dashed"
          ? ' stroke-dasharray="6 4"'
          : "";
    const dir = e.direction ?? (e.kind === "relation" ? "forward" : "none");
    const markerEnd =
      dir === "forward" || dir === "both" ? ' marker-end="url(#arrow)"' : "";
    const markerStart = dir === "both" ? ' marker-start="url(#arrow)"' : "";
    parts.push(
      `<path d="M ${tx(a.x)} ${ty(a.y)} C ${tx((a.x + b.x) / 2)} ${ty(a.y)}, ${tx((a.x + b.x) / 2)} ${ty(b.y)}, ${tx(b.x)} ${ty(b.y)}" fill="none" stroke="#5e6ad2" stroke-width="${1.2 + ((e.weight ?? 1) - 1) * 0.6}"${dash}${markerEnd}${markerStart}/>`,
    );
    if (e.label) {
      parts.push(
        `<text x="${tx((a.x + b.x) / 2)}" y="${ty((a.y + b.y) / 2) - 6}" fill="#7b838f" font-size="11" text-anchor="middle" font-family="sans-serif">${escapeXml(e.label)}</text>`,
      );
    }
  }
  for (const n of visible) {
    const p = positions[n.id]!;
    const x = tx(p.x) - boxW / 2;
    const y = ty(p.y) - boxH / 2;
    const fill = n.accentColor ?? "#1b1e28";
    const label = n.text.slice(0, 18);
    parts.push(
      `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="10" fill="${escapeXml(fill)}" stroke="#5e6ad2" stroke-width="1.5"/>`,
      `<text x="${tx(p.x)}" y="${ty(p.y) + 4}" fill="#f4f5f7" font-size="12" text-anchor="middle" font-family="sans-serif">${escapeXml(label)}</text>`,
    );
  }
  parts.push(`</svg>`);
  return parts.join("\n");
}

export function setActivity(a: ClientActivity) {
  activityByCanvas.set(a.canvasId, { ...a, updatedAt: now() });
}

export function getActivity(canvasId: string): ClientActivity | null {
  return activityByCanvas.get(canvasId) ?? null;
}

export type ProposalRecord = {
  id: string;
  canvasId: string;
  baseRev: number;
  rationale: string;
  status: "pending" | "accepted" | "rejected" | "partially_accepted" | "stale";
  revision: number;
  ops: Op[];
  createdAt: number;
  updatedAt: number;
};

const proposals = new Map<string, ProposalRecord>();

export function listProposals(canvasId: string): ProposalRecord[] {
  return [...proposals.values()]
    .filter((p) => p.canvasId === canvasId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProposal(id: string): ProposalRecord | undefined {
  return proposals.get(id);
}

export function createProposal(
  canvasId: string,
  baseRev: number,
  ops: Op[],
  rationale: string,
): ProposalRecord {
  const id = newId("p");
  const t = now();
  const rec: ProposalRecord = {
    id,
    canvasId,
    baseRev,
    rationale,
    status: "pending",
    revision: 1,
    ops,
    createdAt: t,
    updatedAt: t,
  };
  proposals.set(id, rec);
  return rec;
}

export function reviseProposal(
  id: string,
  ops: Op[],
  rationale: string,
): ProposalRecord {
  const p = proposals.get(id);
  if (!p || p.status !== "pending") throw new Error("proposal not pending");
  p.ops = ops;
  p.rationale = rationale;
  p.revision += 1;
  p.updatedAt = now();
  return p;
}

export function rejectProposal(id: string): ProposalRecord {
  const p = proposals.get(id);
  if (!p) throw new Error("not found");
  p.status = "rejected";
  p.updatedAt = now();
  return p;
}

const HIGH_RISK = new Set(["delete_node", "move_node", "set_primary_parent"]);

export function isHighRisk(op: Op): boolean {
  return HIGH_RISK.has(op.type);
}

export type ToolContext = {
  store: SqliteGraphStore;
  broadcast: (payload: unknown) => void;
  defaultCanvasId?: string;
};

const layoutCache = new Map<
  string,
  {
    positions: Record<string, { x: number; y: number }>;
    hierarchyFp: string;
    density: string;
    nodeViewMode: string;
  }
>();

function withLayout(store: SqliteGraphStore, canvasId: string) {
  const snap = store.getSnapshot(canvasId);
  const anchorId = snap.canvas.anchorNodeId ?? null;
  // Prefer hidden anchor as layout root so the map stays a stable left/right
  // mind-map (central topic). Focus only drives camera / selection, not re-root.
  const layoutRoot =
    (anchorId && snap.nodes.some((n) => n.id === anchorId && !n.deletedAt)
      ? anchorId
      : null) ??
    snap.canvas.focusNodeId ??
    snap.nodes.find((n) => !n.deletedAt)?.id;
  const cached = layoutCache.get(canvasId);
  const density = snap.canvas.prefs.density;
  const nodeViewMode = snap.canvas.prefs.nodeViewMode ?? "card";
  const viewChanged =
    Boolean(cached) &&
    (cached!.density !== density || cached!.nodeViewMode !== nodeViewMode);
  const positions = layoutRoot
    ? layout({
        nodes: snap.nodes,
        edges: snap.edges,
        focusNodeId: layoutRoot,
        density,
        nodeViewMode,
        prevPositions: cached?.positions,
        prevHierarchyFp: cached?.hierarchyFp,
        structureChanged: viewChanged,
      })
    : {};
  if (layoutRoot) {
    layoutCache.set(canvasId, {
      positions: { ...positions },
      hierarchyFp: hierarchyFingerprint(snap.edges),
      density,
      nodeViewMode,
    });
  }
  return { snap, positions, anchorId };
}

/** After auto_fit op: layout then write canvas.viewport. */
export function finalizeAutoFit(
  store: SqliteGraphStore,
  canvasId: string,
  padding = 50,
) {
  layoutCache.delete(canvasId);
  const { positions, anchorId } = withLayout(store, canvasId);
  const publicPositions = { ...positions };
  if (anchorId) delete publicPositions[anchorId];
  const viewport = computeFitViewport(publicPositions, { padding });
  store.updateViewport(canvasId, viewport);
  return viewport;
}

function estimateOverlaps(
  nodes: MindNode[],
  positions: Record<string, { x: number; y: number }>,
  nodeViewMode: string,
  anchorId: string | null,
) {
  const w =
    nodeViewMode === "card" ? 180 : nodeViewMode === "topology" ? 88 : 120;
  const h =
    nodeViewMode === "card" ? 72 : nodeViewMode === "topology" ? 64 : 36;
  const ids = nodes
    .filter((n) => !n.deletedAt && n.id !== anchorId && positions[n.id])
    .map((n) => n.id);
  const pairs: { a: string; b: string; dx: number; dy: number }[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i]!;
      const b = ids[j]!;
      const pa = positions[a]!;
      const pb = positions[b]!;
      const dx = Math.abs(pa.x - pb.x);
      const dy = Math.abs(pa.y - pb.y);
      if (dx < w && dy < h) {
        pairs.push({ a, b, dx, dy });
      }
    }
  }
  return pairs.slice(0, 40);
}

function layoutGraphPreview(
  _store: SqliteGraphStore,
  canvasId: string,
  graph: ReturnType<typeof cloneGraph>,
) {
  const snap = toSnapshot(graph);
  const cached = layoutCache.get(canvasId);
  const anchorId = snap.canvas.anchorNodeId ?? null;
  const layoutRoot =
    (anchorId && snap.nodes.some((n) => n.id === anchorId && !n.deletedAt)
      ? anchorId
      : null) ??
    snap.canvas.focusNodeId ??
    snap.nodes.find((n) => !n.deletedAt)?.id;
  const density = snap.canvas.prefs.density;
  const nodeViewMode = snap.canvas.prefs.nodeViewMode ?? "card";
  const positions = layoutRoot
    ? layout({
        nodes: snap.nodes,
        edges: snap.edges,
        focusNodeId: layoutRoot,
        density,
        nodeViewMode,
        prevPositions: cached?.positions,
        prevHierarchyFp: cached?.hierarchyFp,
        structureChanged: true,
      })
    : {};
  return {
    snap,
    positions,
    anchorId,
    overlaps: estimateOverlaps(snap.nodes, positions, nodeViewMode, anchorId),
  };
}

function isPublicNode(
  n: { id: string; deletedAt?: number | null },
  anchorId: string | null,
) {
  return !n.deletedAt && n.id !== anchorId;
}

/** Agent/UI-facing snapshot: hide system anchor + collapsed-branch descendants. */
export function publicGraphView(store: SqliteGraphStore, canvasId: string) {
  const { snap, positions, anchorId } = withLayout(store, canvasId);
  // Layout omits collapsed descendants from positions — treat as not rendered.
  const nodes = snap.nodes.filter(
    (n) => isPublicNode(n, anchorId) && positions[n.id] != null,
  );
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = snap.edges.filter(
    (e) =>
      !e.deletedAt &&
      e.from !== anchorId &&
      e.to !== anchorId &&
      nodeIds.has(e.from) &&
      nodeIds.has(e.to),
  );
  const publicFocus =
    snap.canvas.focusNodeId && snap.canvas.focusNodeId !== anchorId
      ? snap.canvas.focusNodeId
      : nodes[0]?.id ?? null;
  return {
    snap,
    anchorId,
    nodes,
    edges,
    positions,
    publicFocus,
    canvas: {
      id: snap.canvas.id,
      title: snap.canvas.title,
      rev: snap.canvas.rev,
      focusNodeId: publicFocus,
      prefs: snap.canvas.prefs,
      agentMode: snap.canvas.agentMode,
    },
  };
}

export function buildSpatialContext(
  store: SqliteGraphStore,
  canvasId: string,
  opts?: { compact?: boolean },
) {
  const activity = getActivity(canvasId);
  const view = publicGraphView(store, canvasId);
  const { snap, positions, anchorId, nodes, edges } = view;
  const compact = opts?.compact !== false;

  let focusId =
    activity?.focusNodeId && activity.focusNodeId !== anchorId
      ? activity.focusNodeId
      : view.publicFocus;

  const selection = (activity?.selectionIds?.length
    ? activity.selectionIds.filter((id) => id !== anchorId)
    : focusId
      ? [focusId]
      : []
  )
    .map((id) => nodes.find((n) => n.id === id))
    .filter(Boolean)
    .map((n) => ({ id: n!.id, text: n!.text }));

  const vp = activity?.viewport ?? snap.canvas.viewport;
  const ranked = nodes
    .map((n) => {
      const p = positions[n.id] ?? { x: 0, y: 0 };
      const dx = p.x - (vp.x || 0);
      const dy = p.y - (vp.y || 0);
      return { n, d: dx * dx + dy * dy };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, compact ? 60 : 80)
    .map(({ n }) => {
      const base: Record<string, unknown> = {
        id: n.id,
        text: n.text,
        collapsed: n.collapsed || undefined,
        childCount: n.collapsed
          ? 0
          : edges.filter(
              (e) =>
                e.kind === "hierarchy" && e.isPrimaryParent && e.from === n.id,
            ).length,
        collapsedChildCount: n.collapsed
          ? edges.filter(
              (e) => e.kind === "hierarchy" && e.from === n.id,
            ).length
          : undefined,
      };
      if (n.alias) base.alias = n.alias;
      const fn = nodeFunction(n);
      if (fn) base.function = fn;
      return base;
    });

  const topIds = new Set(ranked.map((r) => r.id as string));
  const topLevelParent = anchorId;
  const periphery = snap.edges
    .filter(
      (e) =>
        e.kind === "hierarchy" &&
        e.isPrimaryParent &&
        !e.deletedAt &&
        e.from === topLevelParent &&
        !topIds.has(e.to),
    )
    .slice(0, 12)
    .map((e) => {
      const node = nodes.find((n) => n.id === e.to);
      const count = edges.filter(
        (x) => x.kind === "hierarchy" && x.isPrimaryParent && x.from === e.to,
      ).length;
      return {
        clusterId: e.to,
        title: node?.text ?? e.to,
        nodeCount: count + 1,
      };
    });

  const rankedIds = new Set(ranked.map((r) => r.id as string));
  const visibleEdges = edges
    .filter((e) => rankedIds.has(e.from) || rankedIds.has(e.to))
    .slice(0, compact ? 100 : 120)
    .map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      kind: e.kind,
      label: e.label ?? null,
      isPrimaryParent: e.kind === "hierarchy" ? e.isPrimaryParent : undefined,
    }));

  return {
    canvasId,
    rev: snap.canvas.rev,
    title: snap.canvas.title,
    focusId,
    agentMode: snap.canvas.agentMode,
    riskProfile: snap.canvas.prefs.riskProfile,
    compact,
    selection,
    viewport: {
      nodes: ranked,
      edgesHint: edges.length,
      edges: visibleEdges,
    },
    periphery,
    rootAnchor: {
      visible: false,
      id: null,
      note: "No visible root. Do not search for a root node id. Top-level: omit parentId.",
    },
    hint: "Top-level nodes: omit parentId (or parentId:null). There is no visible root node. Edge ids are in viewport.edges[].id for set_edge_label.",
    qaHint:
      "For graph Q&A use mindmap_query (neighbors|path|stats|orphans|missing_meta). mindmap_get_node / mindmap_get_edge for details; mindmap_highlight to flash path. Never invent facts not returned by tools.",
    pendingProposals: listProposals(canvasId)
      .filter((p) => p.status === "pending")
      .map((p) => ({ id: p.id, summary: p.rationale, opCount: p.ops.length })),
  };
}

/** HTTP/UI payload with hidden anchor stripped. */
export function clientCanvasPayload(store: SqliteGraphStore, canvasId: string) {
  const view = publicGraphView(store, canvasId);
  return {
    canvas: view.canvas,
    nodes: view.nodes,
    edges: view.edges,
    positions: publicPositions(view.positions, view.anchorId),
  };
}

function publicPositions(
  positions: Record<string, { x: number; y: number }>,
  anchorId: string | null | undefined,
): Record<string, { x: number; y: number }> {
  if (!anchorId) return { ...positions };
  const out: Record<string, { x: number; y: number }> = {};
  for (const [id, p] of Object.entries(positions)) {
    if (id !== anchorId) out[id] = p;
  }
  return out;
}

export async function runTool(
  name: string,
  rawArgs: Record<string, unknown>,
  ctx: ToolContext,
): Promise<unknown> {
  const canvasId =
    (rawArgs.canvasId as string | undefined) ?? ctx.defaultCanvasId;
  const noCanvasOk = new Set([
    "mindmap_list_canvases",
    "mindmap_create_canvas",
    "mindmap_open_canvas",
    "mindmap_get_schema",
  ]);
  if (!canvasId && !noCanvasOk.has(name)) {
    return {
      ok: false,
      error: "no_active_canvas",
      message:
        "No active canvas. Call mindmap_create_canvas or mindmap_open_canvas first (or pass canvasId). Query/find tools will open the 思维导图 tab automatically.",
    };
  }

  switch (name) {
    case "mindmap_list_canvases":
      return {
        ok: true,
        canvases: ctx.store.listCanvases().map((c) => ({
          id: c.id,
          title: c.title,
          rev: c.rev,
        })),
      };

    case "mindmap_create_canvas": {
      const title = String(rawArgs.title || "未命名画布");
      const rootText =
        rawArgs.rootText != null && String(rawArgs.rootText).trim()
          ? String(rawArgs.rootText)
          : undefined;
      const prefsArg =
        rawArgs.prefs && typeof rawArgs.prefs === "object"
          ? (rawArgs.prefs as Record<string, unknown>)
          : undefined;
      const viewParsed = NodeViewModeSchema.safeParse(
        rawArgs.nodeViewMode ?? prefsArg?.nodeViewMode,
      );
      const g = ctx.store.createCanvas(
        title,
        rootText,
        viewParsed.success ? { nodeViewMode: viewParsed.data } : undefined,
      );
      return {
        ok: true,
        canvas: {
          id: g.canvas.id,
          title: g.canvas.title,
          rev: g.canvas.rev,
          prefs: { nodeViewMode: g.canvas.prefs.nodeViewMode },
        },
        hint:
          g.canvas.prefs.nodeViewMode === "topology"
            ? "Topology canvas: create NE nodes with icon:'router'. Omit parentId for top-level. Prefer straight hierarchy/relation links."
            : "Canvas is empty visually. Create top-level nodes with {type:'create_node', text:'...'} (omit parentId). Use parentId only when nesting under an existing visible node.",
      };
    }

    case "mindmap_open_canvas": {
      const id = String(rawArgs.canvasId || canvasId || "");
      if (!id) {
        return { ok: false, error: "canvasId_required", message: "canvasId required" };
      }
      try {
        const snap = ctx.store.getSnapshot(id);
        return {
          ok: true,
          canvas: { id: snap.canvas.id, title: snap.canvas.title, rev: snap.canvas.rev },
        };
      } catch {
        return { ok: false, error: "not_found", message: `canvas ${id} not found` };
      }
    }

    case "mindmap_delete_canvas": {
      ctx.store.hardDeleteCanvas(canvasId!);
      return { ok: true, deleted: canvasId };
    }

    case "mindmap_get_context":
    case "mindmap_get_spatial_context": {
      const compact =
        rawArgs.compact === undefined
          ? true
          : rawArgs.compact === true || String(rawArgs.compact) === "true";
      return {
        ok: true,
        ...(buildSpatialContext(ctx.store, canvasId!, { compact }) as object),
      };
    }

    case "mindmap_get_subgraph": {
      const view = publicGraphView(ctx.store, canvasId!);
      const rootToken =
        (rawArgs.rootId as string | undefined) ??
        (rawArgs.root as string | undefined);
      let rootId: string | undefined;
      if (rootToken) {
        const resolved = resolveQueryNodeRef(view.nodes, String(rootToken), {
          anchorId: view.anchorId,
        });
        if (!resolved.ok) {
          return {
            ok: false,
            error: resolved.error,
            message: resolved.message,
            candidates:
              "candidates" in resolved ? resolved.candidates : undefined,
          };
        }
        rootId = resolved.id;
      } else {
        rootId =
          (getActivity(canvasId!)?.focusNodeId !== view.anchorId
            ? getActivity(canvasId!)?.focusNodeId
            : undefined) ?? view.publicFocus ?? undefined;
      }
      const depth = Math.min(3, Number(rawArgs.depth ?? 2));
      const edgeKindsRaw = String(rawArgs.edgeKinds ?? "hierarchy");
      const edgeKinds =
        edgeKindsRaw === "relation" || edgeKindsRaw === "all"
          ? edgeKindsRaw
          : "hierarchy";
      if (!rootId || rootId === view.anchorId) {
        return {
          ok: true,
          edgeKinds,
          nodes: view.nodes.slice(0, 40),
          edges: view.edges.filter(
            (e) =>
              view.nodes.slice(0, 40).some((n) => n.id === e.from) &&
              view.nodes.slice(0, 40).some((n) => n.id === e.to),
          ),
          hint: "No rootId; returned top visible nodes. Pass rootId (id|@alias|title). edgeKinds: hierarchy (default) | relation | all.",
        };
      }

      const walkEdges = view.edges.filter((e) => {
        if (edgeKinds === "all") return true;
        return e.kind === edgeKinds;
      });

      const keep = new Set<string>([rootId]);
      let frontier = [rootId];
      for (let d = 0; d < depth; d++) {
        const next: string[] = [];
        for (const id of frontier) {
          for (const e of walkEdges) {
            let neighbor: string | null = null;
            if (edgeKinds === "hierarchy") {
              // Preserve tree zoom: only primary-parent children downward.
              if (e.isPrimaryParent && e.from === id) neighbor = e.to;
            } else {
              // relation | all: undirected neighborhood expansion.
              if (e.from === id) neighbor = e.to;
              else if (e.to === id) neighbor = e.from;
            }
            if (!neighbor || keep.has(neighbor)) continue;
            keep.add(neighbor);
            next.push(neighbor);
          }
        }
        frontier = next;
      }
      if (keep.size > 150) {
        return {
          ok: false,
          error: "budget_exceeded",
          skeleton: {
            rootId,
            edgeKinds,
            nodeCount: keep.size,
            hint: "缩小 depth 或先 mindmap_find；关系网可用 edgeKinds:'relation' + depth:1",
          },
        };
      }
      const nodes = view.nodes.filter((n) => keep.has(n.id));
      const edges = walkEdges.filter(
        (e) => keep.has(e.from) && keep.has(e.to),
      );
      const hint =
        nodes.length <= 1 && edges.length === 0 && edgeKinds === "hierarchy"
          ? "No hierarchy children under this root. For relation networks pass edgeKinds:'relation' or 'all' (same as mindmap_query)."
          : undefined;
      return {
        ok: true,
        rootId,
        edgeKinds,
        depth,
        nodes,
        edges,
        ...(hint ? { hint } : {}),
      };
    }

    case "mindmap_find": {
      const query = String(rawArgs.query ?? "");
      const scope = parseSearchScope(rawArgs.searchScope ?? rawArgs.scope);
      const { hits, ambiguous } = findVisibleHits(
        ctx.store,
        canvasId!,
        query,
        scope,
      );
      return {
        ok: true,
        searchScope: scope,
        ambiguous,
        candidates: hits.map(candidateFromHit),
        quickActions: hits.slice(0, 8).map((h, index) => {
          if (h.kind === "edge") {
            return {
              index,
              action: "highlight" as const,
              edgeId: h.id,
              tool: "mindmap_highlight",
              args: {
                canvasId,
                nodeIds: [h.from, h.to],
                edgeIds: [h.id],
              },
            };
          }
          return {
            index,
            action: "focus" as const,
            nodeId: h.id,
            tool: "mindmap_focus",
            args: { nodeId: h.id, canvasId },
          };
        }),
        message: ambiguous
          ? "多个候选接近，请向用户确认后再改，禁止自行挑选。确认后直接 mindmap_focus({nodeId}) 或 mindmap_highlight（边），可用 quickActions[i].args"
          : hits.length === 0
            ? scope === "edge_label" || scope === "edge_note"
              ? "无可见边匹配"
              : "无可见匹配（折叠分支内的节点不会出现在结果中；先展开再搜）"
            : undefined,
      };
    }

    case "mindmap_find_and_focus": {
      const query = String(rawArgs.query ?? "");
      const scope = parseSearchScope(rawArgs.searchScope ?? rawArgs.scope);
      const { hits, ambiguous } = findVisibleHits(
        ctx.store,
        canvasId!,
        query,
        scope,
      );
      const candidates = hits.map(candidateFromHit);
      if (!hits.length) {
        return {
          ok: true,
          searchScope: scope,
          focused: false,
          ambiguous: false,
          candidates,
          message: "无可见匹配",
        };
      }
      if (ambiguous) {
        return {
          ok: true,
          searchScope: scope,
          focused: false,
          ambiguous: true,
          candidates,
          message: "多个候选接近，未自动聚焦；请确认后 mindmap_focus / mindmap_highlight",
        };
      }
      const top = hits[0]!;
      if (top.kind === "edge") {
        ctx.broadcast({
          type: "canvas/highlight",
          canvasId,
          nodeIds: [top.from, top.to],
          edgeIds: [top.id],
          ttlMs: 5000,
        });
        return {
          ok: true,
          searchScope: scope,
          focused: false,
          highlighted: true,
          edgeId: top.id,
          nodeIds: [top.from, top.to],
          ambiguous: false,
          candidates,
        };
      }
      const nodeId = top.id;
      const result = ctx.store.applyChangeSet(
        canvasId!,
        [{ type: "set_focus", nodeId }],
        { origin: "ai", summary: `find_and_focus ${query}` },
      );
      ctx.broadcast({
        type: "canvas/event",
        canvasId,
        changeSetId: result.changeSetId,
      });
      ctx.broadcast({
        type: "canvas/highlight",
        canvasId,
        nodeIds: [nodeId],
      });
      return {
        ok: true,
        searchScope: scope,
        focused: true,
        focusNodeId: nodeId,
        ambiguous: false,
        candidates,
      };
    }

    case "mindmap_export": {
      const format = String(rawArgs.format ?? "json").toLowerCase();
      const snap = ctx.store.getSnapshot(canvasId!);
      const laid = withLayout(ctx.store, canvasId!);
      const anchorId = snap.canvas.anchorNodeId ?? null;
      const publicNodes = snap.nodes.filter(
        (n) => !n.deletedAt && n.id !== anchorId,
      );
      const publicEdges = snap.edges.filter((e) => !e.deletedAt);
      if (format === "md" || format === "markdown") {
        const markdown = exportMarkdown(
          snap.nodes,
          snap.edges,
          snap.canvas.title,
          anchorId,
        );
        return {
          ok: true,
          format: "md",
          title: snap.canvas.title,
          markdown,
          nodeCount: publicNodes.length,
          edgeCount: publicEdges.length,
        };
      }
      if (format === "json") {
        return {
          ok: true,
          format: "json",
          canvas: {
            id: snap.canvas.id,
            title: snap.canvas.title,
            prefs: snap.canvas.prefs,
            rev: snap.canvas.rev,
          },
          nodes: publicNodes,
          edges: publicEdges,
          nodeIdMap: buildNodeIdMap(publicNodes),
        };
      }
      if (format === "svg" || format === "png") {
        const svg = exportSvg(
          snap.nodes,
          snap.edges,
          laid.positions,
          snap.canvas.title,
          anchorId,
        );
        return {
          ok: true,
          format: format === "png" ? "svg" : "svg",
          title: snap.canvas.title,
          mimeType: "image/svg+xml",
          svg,
          nodeCount: publicNodes.length,
          edgeCount: publicEdges.length,
          hint:
            format === "png"
              ? "Agent export returns SVG (vector). For raster PNG use the web UI「导出PNG」; SVG pastes into docs/PPT as well."
              : "SVG can be saved as .svg or opened in browser / Office.",
        };
      }
      return {
        ok: false,
        error: "invalid_op",
        message: 'format must be "json" | "md" | "svg" (png → svg for agents; UI has raster PNG)',
      };
    }


    case "mindmap_get_node": {
      const view = publicGraphView(ctx.store, canvasId!);
      const token = String(rawArgs.nodeId ?? rawArgs.node ?? "");
      const resolved = resolveQueryNodeRef(view.nodes, token, {
        anchorId: view.anchorId,
      });
      if (!resolved.ok) {
        return {
          ok: false,
          error: resolved.error,
          message: resolved.message,
          candidates: "candidates" in resolved ? resolved.candidates : undefined,
        };
      }
      const n = view.nodes.find((x) => x.id === resolved.id);
      if (!n) {
        return { ok: false, error: "not_found", message: `node ${resolved.id}` };
      }
      const fieldsRaw = rawArgs.fields;
      const wantAll =
        !Array.isArray(fieldsRaw) ||
        fieldsRaw.length === 0 ||
        fieldsRaw.includes("all");
      const out: Record<string, unknown> = {
        id: n.id,
        text: n.text,
        alias: n.alias,
        function: nodeFunction(n),
      };
      if (wantAll || (Array.isArray(fieldsRaw) && fieldsRaw.includes("description"))) {
        out.description = n.description ?? null;
      }
      if (wantAll || (Array.isArray(fieldsRaw) && fieldsRaw.includes("note"))) {
        out.note = n.note ?? null;
      }
      if (wantAll || (Array.isArray(fieldsRaw) && fieldsRaw.includes("tags"))) {
        out.tags = n.tags ?? [];
      }
      if (wantAll || (Array.isArray(fieldsRaw) && fieldsRaw.includes("links"))) {
        out.links = n.links ?? [];
      }
      return {
        ok: true,
        node: out,
        citedNodeIds: [n.id],
        hint: "Use function for short answers; request fields:['description'] for full structured meta.",
      };
    }

    case "mindmap_get_edge": {
      const view = publicGraphView(ctx.store, canvasId!);
      const edgeId = String(rawArgs.edgeId ?? rawArgs.id ?? "").trim();
      if (!edgeId) {
        return { ok: false, error: "invalid_op", message: "edgeId required" };
      }
      const e = view.edges.find((x) => x.id === edgeId && !x.deletedAt);
      if (!e) {
        return {
          ok: false,
          error: "not_found",
          message: `edge ${edgeId} not found`,
        };
      }
      const fieldsRaw = rawArgs.fields;
      const wantAll =
        !Array.isArray(fieldsRaw) ||
        fieldsRaw.length === 0 ||
        fieldsRaw.includes("all");
      const wantLabel =
        wantAll ||
        (Array.isArray(fieldsRaw) && fieldsRaw.includes("label"));
      const wantMeta =
        wantAll ||
        (Array.isArray(fieldsRaw) && fieldsRaw.includes("meta"));
      const fromN = view.nodes.find((n) => n.id === e.from);
      const toN = view.nodes.find((n) => n.id === e.to);
      const out: Record<string, unknown> = {
        id: e.id,
        from: e.from,
        to: e.to,
        fromText: fromN?.text ?? e.from,
        toText: toN?.text ?? e.to,
        kind: e.kind,
      };
      if (wantLabel || wantAll) out.label = e.label ?? null;
      if (wantMeta || wantAll) {
        out.direction = e.direction ?? null;
        out.weight = e.weight ?? null;
        out.lineStyle = e.lineStyle ?? null;
      }
      if (wantAll) {
        out.note = e.note ?? null;
        out.tags = e.tags ?? [];
      }
      return {
        ok: true,
        edge: out,
        citedNodeIds: [e.from, e.to],
        citedEdgeIds: [e.id],
      };
    }

    case "mindmap_highlight": {
      const view = publicGraphView(ctx.store, canvasId!);
      const nodeIdsRaw = Array.isArray(rawArgs.nodeIds)
        ? rawArgs.nodeIds
        : rawArgs.nodeId != null
          ? [rawArgs.nodeId]
          : [];
      const edgeIdsRaw = Array.isArray(rawArgs.edgeIds)
        ? rawArgs.edgeIds
        : rawArgs.edgeId != null
          ? [rawArgs.edgeId]
          : [];
      const nodeIds: string[] = [];
      for (const token of nodeIdsRaw) {
        const r = resolveQueryNodeRef(view.nodes, String(token), {
          anchorId: view.anchorId,
        });
        if (r.ok) nodeIds.push(r.id);
      }
      const edgeIds: string[] = [];
      for (const eid of edgeIdsRaw) {
        const id = String(eid).trim();
        const e = view.edges.find((x) => x.id === id && !x.deletedAt);
        if (!e) continue;
        edgeIds.push(e.id);
        if (!nodeIds.includes(e.from)) nodeIds.push(e.from);
        if (!nodeIds.includes(e.to)) nodeIds.push(e.to);
      }
      if (!nodeIds.length && !edgeIds.length) {
        return {
          ok: false,
          error: "invalid_op",
          message: "nodeIds and/or edgeIds required",
        };
      }
      const style =
        rawArgs.style && typeof rawArgs.style === "object"
          ? (rawArgs.style as Record<string, unknown>)
          : undefined;
      const ttlMs = Math.max(
        500,
        Math.min(
          60000,
          Number(rawArgs.ttlMs ?? rawArgs.duration ?? style?.duration ?? 5000) ||
            5000,
        ),
      );
      ctx.broadcast({
        type: "canvas/highlight",
        canvasId,
        nodeIds,
        edgeIds,
        style: style
          ? {
              nodeColor:
                typeof style.nodeColor === "string"
                  ? style.nodeColor
                  : undefined,
              nodeGlow: style.nodeGlow !== false,
              edgeWidth:
                typeof style.edgeWidth === "number"
                  ? style.edgeWidth
                  : undefined,
              edgeColor:
                typeof style.edgeColor === "string"
                  ? style.edgeColor
                  : undefined,
            }
          : undefined,
        ttlMs,
      });
      return {
        ok: true,
        nodeIds,
        edgeIds,
        ttlMs,
        hint: "Transient highlight on the open canvas; does not mutate the graph.",
      };
    }

    case "mindmap_query": {
      const view = publicGraphView(ctx.store, canvasId!);
      const op = String(rawArgs.op ?? rawArgs.type ?? "").trim();
      const edgeKindsRaw = String(rawArgs.edgeKinds ?? "all");
      const edgeKinds =
        edgeKindsRaw === "hierarchy" || edgeKindsRaw === "relation"
          ? edgeKindsRaw
          : "all";
      const directionRaw = String(rawArgs.direction ?? "out");
      const direction =
        directionRaw === "in" || directionRaw === "both" ? directionRaw : "out";

      const resolveOne = (token: unknown, field: string) => {
        if (token == null || String(token).trim() === "") {
          return {
            ok: false as const,
            error: "invalid_op",
            message: `${field} required`,
          };
        }
        const r = resolveQueryNodeRef(view.nodes, String(token), {
          anchorId: view.anchorId,
        });
        if (!r.ok) {
          return {
            ok: false as const,
            error: r.error,
            message: r.message,
            candidates: "candidates" in r ? r.candidates : undefined,
          };
        }
        return { ok: true as const, id: r.id };
      };

      if (op === "stats") {
        const edgeKindsRaw = String(rawArgs.edgeKinds ?? "all");
        const statsEdgeKinds =
          edgeKindsRaw === "hierarchy" || edgeKindsRaw === "relation"
            ? edgeKindsRaw
            : "all";
        return {
          ok: true,
          op,
          edgeKinds: statsEdgeKinds,
          stats: queryStats({
            nodes: view.nodes,
            edges: view.edges,
            edgeKinds: statsEdgeKinds,
          }),
          hint: "connectedComponents = undirected components on edgeKinds. longestPath/mostConnected use same filter. orphanNodes + orphanDef explain isolates on that subgraph; when edgeKinds=relation also returns nodesWithoutRelation (same count). islands ≈ connectedComponents.count.",
        };
      }

      if (op === "orphans") {
        const r = queryOrphans({ nodes: view.nodes, edges: view.edges });
        return {
          ok: true,
          op,
          ...r,
          empty: r.nodes.length === 0,
          message:
            r.nodes.length === 0
              ? "No orphan nodes in the visible graph."
              : undefined,
        };
      }

      if (op === "missing_meta") {
        const r = queryMissingMeta({ nodes: view.nodes, edges: view.edges });
        return {
          ok: true,
          op,
          ...r,
          empty:
            r.nodesWithoutDescription.length === 0 &&
            r.nodesWithoutFunction.length === 0 &&
            r.edgesWithoutLabel.length === 0,
          hint: "nodesWithoutDescription = empty/missing description. nodesWithoutFunction = description exists but no function/summary field (complementary).",
        };
      }

      if (op === "neighbors") {
        const node = resolveOne(rawArgs.node ?? rawArgs.nodeId, "node");
        if (!node.ok) return node;
        const r = queryNeighbors({
          nodes: view.nodes,
          edges: view.edges,
          nodeId: node.id,
          depth: Number(rawArgs.depth ?? 1),
          direction:
            String(rawArgs.direction ?? "both") === "in"
              ? "in"
              : String(rawArgs.direction ?? "both") === "out"
                ? "out"
                : "both",
          edgeKinds,
        });
        return {
          ok: true,
          op,
          ...r,
          empty: r.edges.length === 0,
          message:
            r.edges.length === 0
              ? "No neighbors found for this node with the given filters."
              : undefined,
          hint: "Answer only from returned nodes/edges. Optional: mindmap_highlight({ nodeIds: citedNodeIds, edgeIds }) to flash on canvas.",
        };
      }

      if (op === "path" || op === "between") {
        const from = resolveOne(rawArgs.from ?? rawArgs.fromId, "from");
        if (!from.ok) return from;
        const to = resolveOne(rawArgs.to ?? rawArgs.toId, "to");
        if (!to.ok) return to;
        const throughRelationNodes =
          rawArgs.throughRelationNodes === undefined
            ? true
            : rawArgs.throughRelationNodes === true ||
              String(rawArgs.throughRelationNodes) === "true";
        // Prefer maxHops; do NOT reuse neighbors' `depth` (agents often pass depth:1).
        const maxHops = Number(
          rawArgs.maxHops ?? rawArgs.maxDepth ?? (throughRelationNodes ? 8 : 1),
        );
        const pathDirection =
          rawArgs.direction != null
            ? direction
            : throughRelationNodes
              ? "both"
              : "out";
        const r = queryPaths({
          nodes: view.nodes,
          edges: view.edges,
          fromId: from.id,
          toId: to.id,
          maxHops,
          maxPaths: Number(rawArgs.maxPaths ?? 5),
          direction: pathDirection,
          edgeKinds,
          throughRelationNodes,
        });
        return {
          ok: true,
          op: "path",
          from: from.id,
          to: to.id,
          direction: pathDirection,
          directionNote:
            pathDirection === "both"
              ? "Search treats edges as undirected (default when throughRelationNodes). Pass direction:'out' for forward-only."
              : pathDirection === "out"
                ? "Search follows edge from→to only."
                : "Search follows edge to→from only.",
          ...r,
          citedEdgeIds: r.edges.map((e) => e.id),
          empty: r.paths.length === 0,
          message:
            r.paths.length === 0
              ? "No path found in the graph between these nodes (with current filters)."
              : r.truncated
                ? `Showing ${r.pathsReturned}/${r.totalPathsFound} paths (maxPaths=${r.maxPaths}; ${r.omittedPaths} omitted).`
                : undefined,
          hint: r.truncated
            ? `truncated=true: pathsReturned=${r.pathsReturned}, totalPathsFound=${r.totalPathsFound}, omittedPaths=${r.omittedPaths}, maxPaths=${r.maxPaths}. Raise maxPaths (≤20) for more. Use paths[].edges for meta; mindmap_highlight to flash.`
            : "Use paths[].edges for weight/lineStyle/note (edgeLabels kept for compat). Flash with mindmap_highlight({ nodeIds: citedNodeIds, edgeIds: citedEdgeIds }). If empty, say no path — do not invent.",
        };
      }

      return {
        ok: false,
        error: "invalid_op",
        message:
          'mindmap_query op must be one of: neighbors | path | stats | orphans | missing_meta',
        validOps: ["neighbors", "path", "stats", "orphans", "missing_meta"],
      };
    }


    case "mindmap_get_schema":
      return {
        ok: true,
        ...OP_SCHEMA_DOC,
        tools: [
          "mindmap_list_canvases",
          "mindmap_create_canvas",
          "mindmap_open_canvas",
          "mindmap_delete_canvas",
          "mindmap_get_spatial_context",
          "mindmap_find",
          "mindmap_find_and_focus",
          "mindmap_export",
          "mindmap_get_subgraph",
          "mindmap_query",
          "mindmap_get_node",
          "mindmap_get_edge",
          "mindmap_highlight",
          "mindmap_apply_direct",
          "mindmap_propose",
          "mindmap_accept_proposal",
          "mindmap_reject_proposal",
          "mindmap_focus",
          "mindmap_undo",
          "mindmap_redo",
          "mindmap_history",
          "mindmap_snapshot",
          "mindmap_restore_snapshot",
          "mindmap_get_schema",
        ],
        searchScope: [
          "text",
          "note",
          "tags",
          "description",
          "edge_label",
          "edge_note",
          "all",
        ],
        nodeIcons: NodeIconSchema.options,
        nodeViewModes: NodeViewModeSchema.options,
        createCanvas: {
          nodeViewMode:
            "Optional on mindmap_create_canvas (canvas-global). Also changeable later via set_prefs.",
        },
        edgeLineStyles: ["solid", "dashed", "dotted"],
        edgeDirections: ["forward", "both", "none"],
        getSubgraph: {
          rootId: "id | @alias | unique title",
          edgeKinds: {
            values: ["hierarchy", "relation", "all"],
            default: "hierarchy",
            note: "hierarchy = primary-parent children only (tree zoom). relation|all = undirected neighborhood (关系网络). Same enum as mindmap_query.",
          },
          depth: "1–3 (default 2)",
        },
      };

    case "mindmap_propose": {
      const prepared = prepareOps(ctx.store, canvasId!, rawArgs.ops);
      if (!prepared.ok) return prepared;
      const rationale = String(rawArgs.rationale ?? "");
      const snap = ctx.store.getSnapshot(canvasId!);
      const p = createProposal(canvasId!, snap.canvas.rev, prepared.ops, rationale);
      ctx.broadcast({
        type: "proposal/updated",
        canvasId,
        proposalId: p.id,
      });
      return {
        ok: true,
        proposalId: p.id,
        revision: p.revision,
        ops: p.ops,
        nodeIdMap: prepared.nodeIdMap,
        rationale,
        hint: "Call mindmap_accept_proposal with this proposalId after the user confirms. Do not self-accept — proposals require explicit accept (UI or mindmap_accept_proposal).",
      };
    }

    case "mindmap_revise_proposal": {
      const proposalId = String(rawArgs.proposalId);
      const prepared = prepareOps(ctx.store, canvasId!, rawArgs.ops);
      if (!prepared.ok) return prepared;
      const rationale = String(rawArgs.rationale ?? "");
      try {
        const p = reviseProposal(proposalId, prepared.ops, rationale);
        ctx.broadcast({
          type: "proposal/updated",
          canvasId: p.canvasId,
          proposalId: p.id,
        });
        return {
          ok: true,
          proposalId: p.id,
          revision: p.revision,
          nodeIdMap: prepared.nodeIdMap,
        };
      } catch (e) {
        return {
          ok: false,
          error: "proposal_not_pending",
          message: String(e),
        };
      }
    }

    case "mindmap_accept_proposal": {
      const proposalId = String(rawArgs.proposalId);
      const p = getProposal(proposalId);
      if (!p) {
        return {
          ok: false,
          error: "proposal_not_found",
          message: `No proposal ${proposalId}. Proposals are in-memory — recreate with mindmap_propose if the server restarted.`,
        };
      }
      if (p.status !== "pending") {
        return {
          ok: false,
          error: "proposal_not_pending",
          message: `Proposal status is ${p.status}, not pending.`,
          status: p.status,
        };
      }
      const snap = ctx.store.getSnapshot(p.canvasId);
      if (snap.canvas.rev - p.baseRev > 50) {
        p.status = "stale";
        return {
          ok: false,
          error: "proposal_stale",
          message: `Canvas rev drifted (${snap.canvas.rev - p.baseRev} > 50). Re-propose against current context.`,
        };
      }
      try {
        const result = ctx.store.applyChangeSet(p.canvasId, p.ops, {
          origin: "ai",
          summary: p.rationale || "accept proposal",
        });
        p.status = "accepted";
        p.updatedAt = now();
        const fitViewport =
          result.autoFitPadding != null
            ? finalizeAutoFit(ctx.store, p.canvasId, result.autoFitPadding)
            : null;
        const laid = withLayout(ctx.store, p.canvasId);
        const anchorId = laid.anchorId;
        ctx.broadcast({
          type: "canvas/event",
          canvasId: p.canvasId,
          changeSetId: result.changeSetId,
          rev: result.rev,
          fitViewport: fitViewport ?? undefined,
        });
        return {
          ok: true,
          changeSetId: result.changeSetId,
          affected: result.affectedNodeIds.filter((id) => id !== anchorId),
          positions: publicPositions(laid.positions, anchorId),
          fitViewport: fitViewport ?? undefined,
        };
      } catch (e) {
        return {
          ok: false,
          error: "invalid_op",
          message: String(e),
          validTypes: OP_TYPES,
          hint: "Proposal kept pending. Fix ops (must use `type`) and revise or re-propose.",
          proposalId: p.id,
          status: p.status,
        };
      }
    }

    case "mindmap_reject_proposal": {
      try {
        const p = rejectProposal(String(rawArgs.proposalId));
        ctx.broadcast({ type: "proposal/updated", canvasId: p.canvasId, proposalId: p.id });
        return { ok: true, status: p.status };
      } catch (e) {
        return { ok: false, error: "proposal_not_found", message: String(e) };
      }
    }

    case "mindmap_apply_direct": {
      const prepared = prepareOps(ctx.store, canvasId!, rawArgs.ops);
      if (!prepared.ok) return prepared;
      const ops = prepared.ops;
      const snap = ctx.store.getSnapshot(canvasId!);
      const strict = snap.canvas.prefs.riskProfile === "strict";
      const preview =
        rawArgs.preview === true ||
        rawArgs.dryRun === true ||
        String(rawArgs.preview ?? "") === "true";
      if (strict && !preview) {
        return {
          ok: false,
          error: "permission_denied",
          message: "严格档请用 mindmap_propose",
        };
      }
      if (ops.some(isHighRisk) && !preview) {
        return {
          ok: false,
          error: "permission_denied",
          message:
            "高风险操作（delete_node / move_node / set_primary_parent）请用 mindmap_propose",
          highRisk: [...HIGH_RISK],
        };
      }
      if (preview) {
        try {
          const g = cloneGraph(ctx.store.loadCanvas(canvasId!));
          const applied = applyOps(g, ops);
          const laid = layoutGraphPreview(ctx.store, canvasId!, applied.graph);
          const anchorId = laid.anchorId;
          const affectedIds = applied.affectedNodeIds.filter(
            (id) => id !== anchorId,
          );
          const nodeIdMap = {
            ...prepared.nodeIdMap,
            ...buildNodeIdMap(laid.snap.nodes, {
              anchorId,
              onlyIds: new Set(affectedIds),
            }),
          };
          return {
            ok: true,
            preview: true,
            nodeIdMap,
            affected: affectedIds.map((id) => {
              const n = laid.snap.nodes.find((x) => x.id === id);
              return {
                id,
                version: n?.version,
                text: n?.text,
                alias: n?.alias,
              };
            }),
            positions: publicPositions(laid.positions, anchorId),
            overlaps: laid.overlaps,
            overlapCount: laid.overlaps.length,
            hint: "Dry-run only — nothing persisted. Omit preview to apply.",
          };
        } catch (e) {
          return {
            ok: false,
            error: "invalid_op",
            message: String(e),
            preview: true,
            validTypes: OP_TYPES,
          };
        }
      }
      try {
        const result = ctx.store.applyChangeSet(canvasId!, ops, {
          origin: "ai",
          summary: String(rawArgs.summary ?? "ai apply"),
        });
        const fitViewport =
          result.autoFitPadding != null
            ? finalizeAutoFit(ctx.store, canvasId!, result.autoFitPadding)
            : null;
        const payload = clientCanvasPayload(ctx.store, canvasId!);
        const anchorId = result.snapshot.canvas.anchorNodeId;
        const affectedIds = result.affectedNodeIds.filter((id) => id !== anchorId);
        ctx.broadcast({
          type: "canvas/event",
          canvasId,
          changeSetId: result.changeSetId,
          rev: result.rev,
          affectedNodeIds: affectedIds,
          fitViewport: fitViewport ?? undefined,
        });
        const nodeIdMap = {
          ...prepared.nodeIdMap,
          ...buildNodeIdMap(result.snapshot.nodes, {
            anchorId,
            onlyIds: new Set(affectedIds),
          }),
        };
        return {
          ok: true,
          changeSetId: result.changeSetId,
          nodeIdMap,
          affected: affectedIds.map((id) => {
            const n = result.snapshot.nodes.find((x) => x.id === id);
            return {
              id,
              version: n?.version,
              text: n?.text,
              alias: n?.alias,
            };
          }),
          positions: payload.positions,
          fitViewport: fitViewport ?? undefined,
        };
      } catch (e) {
        return {
          ok: false,
          error: "invalid_op",
          message: String(e),
          validTypes: OP_TYPES,
        };
      }
    }

    case "mindmap_undo": {
      try {
        let changeSetId =
          rawArgs.changeSetId != null && String(rawArgs.changeSetId).length
            ? String(rawArgs.changeSetId)
            : null;
        if (!changeSetId) {
          if (!canvasId) {
            return {
              ok: false,
              error: "invalid_op",
              message: "mindmap_undo needs canvasId or changeSetId",
            };
          }
          changeSetId = ctx.store.latestUndoableChangeSetId(canvasId);
          if (!changeSetId) {
            return {
              ok: false,
              error: "nothing_to_undo",
              message: "No undoable change set on this canvas",
            };
          }
        }
        const result = ctx.store.undoChangeSet(changeSetId);
        const payload = clientCanvasPayload(ctx.store, result.snapshot.canvas.id);
        ctx.broadcast({
          type: "canvas/event",
          canvasId: result.snapshot.canvas.id,
          changeSetId: result.changeSetId,
          rev: result.rev,
        });
        return {
          ok: true,
          undoneChangeSetId: changeSetId,
          changeSetId: result.changeSetId,
          rev: result.rev,
          ...payload,
        };
      } catch (e) {
        return {
          ok: false,
          error: "undo_failed",
          message: String(e),
          hint: "Pass changeSetId from apply_direct / accept_proposal, or omit to undo the latest change.",
        };
      }
    }

    case "mindmap_redo": {
      try {
        if (!canvasId) {
          return {
            ok: false,
            error: "invalid_op",
            message: "mindmap_redo needs canvasId",
          };
        }
        const changeSetId = ctx.store.latestRedoableChangeSetId(canvasId);
        if (!changeSetId) {
          return {
            ok: false,
            error: "nothing_to_redo",
            message:
              "No redoable undo companion (latest change is not an undo). Undo first, then redo.",
          };
        }
        const result = ctx.store.undoChangeSet(changeSetId);
        const payload = clientCanvasPayload(ctx.store, result.snapshot.canvas.id);
        ctx.broadcast({
          type: "canvas/event",
          canvasId: result.snapshot.canvas.id,
          changeSetId: result.changeSetId,
          rev: result.rev,
        });
        return {
          ok: true,
          redoneViaChangeSetId: changeSetId,
          changeSetId: result.changeSetId,
          rev: result.rev,
          ...payload,
        };
      } catch (e) {
        return {
          ok: false,
          error: "redo_failed",
          message: String(e),
        };
      }
    }

    case "mindmap_history": {
      if (!canvasId) {
        return {
          ok: false,
          error: "invalid_op",
          message: "mindmap_history needs canvasId",
        };
      }
      const limit = Math.min(100, Math.max(1, Number(rawArgs.limit ?? 30) || 30));
      const changes = ctx.store.listChangeSets(canvasId, limit);
      const snapshots = ctx.store.listSnapshots(canvasId, 20);
      const latestUndo = ctx.store.latestUndoableChangeSetId(canvasId);
      const latestRedo = ctx.store.latestRedoableChangeSetId(canvasId);
      return {
        ok: true,
        changes,
        snapshots,
        latestUndoableChangeSetId: latestUndo,
        latestRedoableChangeSetId: latestRedo,
        hint: "Use mindmap_undo / mindmap_redo, or mindmap_restore_snapshot({snapshotId}).",
      };
    }

    case "mindmap_snapshot": {
      if (!canvasId) {
        return {
          ok: false,
          error: "invalid_op",
          message: "mindmap_snapshot needs canvasId",
        };
      }
      const action = String(rawArgs.action ?? "create");
      if (action === "list") {
        return {
          ok: true,
          snapshots: ctx.store.listSnapshots(
            canvasId,
            Math.min(50, Number(rawArgs.limit ?? 20) || 20),
          ),
        };
      }
      const named = ctx.store.createSnapshot(
        canvasId,
        String(rawArgs.name ?? ""),
      );
      return { ok: true, ...named };
    }

    case "mindmap_restore_snapshot": {
      try {
        const snapshotId = String(rawArgs.snapshotId ?? "");
        if (!snapshotId) {
          return {
            ok: false,
            error: "invalid_op",
            message: "mindmap_restore_snapshot needs snapshotId",
          };
        }
        const result = ctx.store.restoreSnapshot(snapshotId);
        layoutCache.delete(result.snapshot.canvas.id);
        const payload = clientCanvasPayload(
          ctx.store,
          result.snapshot.canvas.id,
        );
        ctx.broadcast({
          type: "canvas/event",
          canvasId: result.snapshot.canvas.id,
          changeSetId: result.changeSetId,
          rev: result.rev,
        });
        return {
          ok: true,
          changeSetId: result.changeSetId,
          rev: result.rev,
          restoredSnapshotId: snapshotId,
          ...payload,
        };
      } catch (e) {
        return {
          ok: false,
          error: "restore_failed",
          message: String(e),
        };
      }
    }

    case "mindmap_recent_changes":
      return {
        ok: true,
        changes: canvasId ? ctx.store.listChangeSets(canvasId, 20) : [],
        proposals: listProposals(canvasId!),
      };

    case "mindmap_focus": {
      const nodeId = String(rawArgs.nodeId);
      const result = ctx.store.applyChangeSet(
        canvasId!,
        [{ type: "set_focus", nodeId }],
        { origin: "ai", summary: "focus" },
      );
      ctx.broadcast({
        type: "canvas/event",
        canvasId,
        changeSetId: result.changeSetId,
      });
      ctx.broadcast({
        type: "canvas/highlight",
        canvasId,
        nodeIds: [nodeId],
      });
      return { ok: true, focusNodeId: nodeId };
    }

    case "mindmap_set_mode": {
      const mode = String(rawArgs.mode ?? "edit");
      const g = ctx.store.loadCanvas(canvasId!);
      g.canvas.agentMode = mode as typeof g.canvas.agentMode;
      // persist via prefs hack / rename path — use set_prefs + field
      ctx.store.applyChangeSet(
        canvasId!,
        [{ type: "set_prefs", prefs: { ...(g.canvas.prefs as object) } }],
        { origin: "ai", summary: `mode ${mode}` },
      );
      g.canvas.agentMode = mode as typeof g.canvas.agentMode;
      return { ok: true, mode };
    }

    default:
      return { ok: false, error: "invalid_op", message: `unknown tool ${name}` };
  }
}
