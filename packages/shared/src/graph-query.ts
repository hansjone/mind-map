import type { MindEdge, MindNode } from "./types.js";

export type QueryEdgeKind = "hierarchy" | "relation" | "all";
export type QueryDirection = "out" | "in" | "both";

export type CompactNode = {
  id: string;
  text: string;
  alias?: string;
  /** description.function or description.summary — token-cheap for QA. */
  function?: string;
};

export type CompactEdge = {
  id: string;
  from: string;
  to: string;
  fromText: string;
  toText: string;
  kind: MindEdge["kind"];
  label?: string;
  direction?: MindEdge["direction"];
  weight?: number;
  lineStyle?: MindEdge["lineStyle"];
  note?: string;
  tags?: string[];
};

/** Path-local edge payload (keeps edgeLabels for backward compat). */
export type PathEdge = {
  id: string;
  label?: string | null;
  direction?: MindEdge["direction"];
  weight?: number;
  lineStyle?: MindEdge["lineStyle"];
  note?: string;
};

/** Prefer description.function, then summary. */
export function nodeFunction(n: MindNode): string | undefined {
  const d = n.description;
  if (!d || typeof d !== "object") return undefined;
  if (typeof d.function === "string" && d.function.trim()) return d.function.trim();
  if (typeof d.summary === "string" && d.summary.trim()) return d.summary.trim();
  return undefined;
}

export function toCompactNode(n: MindNode): CompactNode {
  const fn = nodeFunction(n);
  return {
    id: n.id,
    text: n.text,
    ...(n.alias ? { alias: n.alias } : {}),
    ...(fn ? { function: fn } : {}),
  };
}

function textOf(byId: Map<string, MindNode>, id: string): string {
  return byId.get(id)?.text ?? id;
}

export function toCompactEdge(
  e: MindEdge,
  byId: Map<string, MindNode>,
): CompactEdge {
  return {
    id: e.id,
    from: e.from,
    to: e.to,
    fromText: textOf(byId, e.from),
    toText: textOf(byId, e.to),
    kind: e.kind,
    ...(e.label ? { label: e.label } : {}),
    ...(e.direction ? { direction: e.direction } : {}),
    ...(e.weight != null ? { weight: e.weight } : {}),
    ...(e.lineStyle ? { lineStyle: e.lineStyle } : {}),
    ...(e.note ? { note: e.note } : {}),
    ...(e.tags?.length ? { tags: e.tags } : {}),
  };
}

export function toPathEdge(e: MindEdge): PathEdge {
  return {
    id: e.id,
    label: e.label ?? null,
    ...(e.direction ? { direction: e.direction } : {}),
    ...(e.weight != null ? { weight: e.weight } : {}),
    ...(e.lineStyle ? { lineStyle: e.lineStyle } : {}),
    ...(e.note ? { note: e.note } : {}),
  };
}

function filterEdges(
  edges: MindEdge[],
  edgeKinds: QueryEdgeKind = "all",
): MindEdge[] {
  if (edgeKinds === "all") return edges.filter((e) => !e.deletedAt);
  return edges.filter((e) => !e.deletedAt && e.kind === edgeKinds);
}

function buildAdj(
  edges: MindEdge[],
  direction: QueryDirection,
): Map<string, { to: string; edge: MindEdge }[]> {
  const adj = new Map<string, { to: string; edge: MindEdge }[]>();
  const add = (from: string, to: string, edge: MindEdge) => {
    const list = adj.get(from) ?? [];
    list.push({ to, edge });
    adj.set(from, list);
  };
  for (const e of edges) {
    if (direction === "out" || direction === "both") add(e.from, e.to, e);
    if (direction === "in" || direction === "both") add(e.to, e.from, e);
  }
  return adj;
}

export function queryNeighbors(input: {
  nodes: MindNode[];
  edges: MindEdge[];
  nodeId: string;
  depth?: number;
  direction?: QueryDirection;
  edgeKinds?: QueryEdgeKind;
}): {
  rootId: string;
  nodes: CompactNode[];
  edges: CompactEdge[];
  citedNodeIds: string[];
} {
  const depth = Math.max(1, Math.min(6, input.depth ?? 1));
  const direction = input.direction ?? "both";
  const byId = new Map(input.nodes.map((n) => [n.id, n]));
  const live = filterEdges(input.edges, input.edgeKinds ?? "all");
  const adj = buildAdj(live, direction);

  const keep = new Set<string>([input.nodeId]);
  const usedEdges = new Set<string>();
  let frontier = [input.nodeId];
  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const { to, edge } of adj.get(id) ?? []) {
        usedEdges.add(edge.id);
        if (!keep.has(to)) {
          keep.add(to);
          next.push(to);
        }
      }
    }
    frontier = next;
  }

  const nodes = [...keep]
    .map((id) => byId.get(id))
    .filter((n): n is MindNode => n != null && !n.deletedAt)
    .map(toCompactNode);
  const edges = live
    .filter((e) => usedEdges.has(e.id) && keep.has(e.from) && keep.has(e.to))
    .map((e) => toCompactEdge(e, byId));

  return {
    rootId: input.nodeId,
    nodes,
    edges,
    citedNodeIds: [...keep],
  };
}

/**
 * All simple paths from→to (directed by `direction`), capped by edge hops.
 * `maxHops` = number of edges (so node count along a path is hops+1).
 * Intermediate nodes are always allowed when maxHops > 1 (e.g. detect→diag_trigger→aiops).
 */
export function queryPaths(input: {
  nodes: MindNode[];
  edges: MindEdge[];
  fromId: string;
  toId: string;
  /** Max edges in a path (default 8). */
  maxHops?: number;
  /** @deprecated use maxHops — treated as maxHops when maxHops omitted. */
  maxDepth?: number;
  maxPaths?: number;
  direction?: QueryDirection;
  edgeKinds?: QueryEdgeKind;
  /**
   * When false, only direct edges (maxHops forced to 1).
   * When true (default), allow multi-hop via intermediate nodes.
   */
  throughRelationNodes?: boolean;
}): {
  paths: {
    nodeIds: string[];
    texts: string[];
    /** @deprecated prefer paths[].edges — kept for older clients */
    edgeLabels: (string | null)[];
    edges: PathEdge[];
    hops: number;
  }[];
  nodes: CompactNode[];
  edges: CompactEdge[];
  citedNodeIds: string[];
  truncated: boolean;
  /** Cap used while collecting paths (default 5, max 20). */
  maxPaths: number;
  /** How many paths are included in `paths`. */
  pathsReturned: number;
  /** How many simple paths were found before hop/budget stop (may equal pathsReturned). */
  totalPathsFound: number;
  /** totalPathsFound - pathsReturned when truncated. */
  omittedPaths: number;
  maxHops: number;
  throughRelationNodes: boolean;
} {
  const throughRelationNodes = input.throughRelationNodes !== false;
  let maxHops = Math.max(
    1,
    Math.min(12, input.maxHops ?? input.maxDepth ?? 8),
  );
  if (!throughRelationNodes) maxHops = 1;
  const maxPaths = Math.max(1, Math.min(20, input.maxPaths ?? 5));
  const direction = input.direction ?? (throughRelationNodes ? "both" : "out");
  const byId = new Map(input.nodes.map((n) => [n.id, n]));
  const live = filterEdges(input.edges, input.edgeKinds ?? "all");
  const adj = buildAdj(live, direction);

  const paths: {
    nodeIds: string[];
    texts: string[];
    edgeLabels: (string | null)[];
    edges: PathEdge[];
    hops: number;
  }[] = [];
  let totalPathsFound = 0;
  // Soft cap on enumeration so huge DAGs don't hang (still report totalPathsFound up to this).
  const enumerateCap = Math.max(maxPaths, Math.min(200, maxPaths * 20));

  type Frame = {
    node: string;
    path: string[];
    pathEdges: MindEdge[];
    visited: Set<string>;
  };
  // BFS so shorter paths surface first
  const queue: Frame[] = [
    {
      node: input.fromId,
      path: [input.fromId],
      pathEdges: [],
      visited: new Set([input.fromId]),
    },
  ];

  while (queue.length) {
    const cur = queue.shift()!;
    const hops = cur.pathEdges.length;
    if (cur.node === input.toId && hops > 0) {
      totalPathsFound += 1;
      if (paths.length < maxPaths) {
        paths.push({
          nodeIds: cur.path,
          texts: cur.path.map((id) => textOf(byId, id)),
          edgeLabels: cur.pathEdges.map((e) => e.label ?? null),
          edges: cur.pathEdges.map(toPathEdge),
          hops,
        });
      }
      if (totalPathsFound >= enumerateCap) break;
      continue;
    }
    if (hops >= maxHops) continue;
    for (const { to, edge } of adj.get(cur.node) ?? []) {
      if (cur.visited.has(to)) continue;
      const visited = new Set(cur.visited);
      visited.add(to);
      queue.push({
        node: to,
        path: [...cur.path, to],
        pathEdges: [...cur.pathEdges, edge],
        visited,
      });
    }
  }

  const truncated = totalPathsFound > paths.length;
  const cited = new Set<string>();
  const edgeIds = new Set<string>();
  for (const p of paths) {
    for (const id of p.nodeIds) cited.add(id);
    for (const e of p.edges) edgeIds.add(e.id);
  }

  return {
    paths,
    nodes: [...cited]
      .map((id) => byId.get(id))
      .filter((n): n is MindNode => n != null)
      .map(toCompactNode),
    edges: live
      .filter((e) => edgeIds.has(e.id))
      .map((e) => toCompactEdge(e, byId)),
    citedNodeIds: [...cited],
    truncated,
    maxPaths,
    pathsReturned: paths.length,
    totalPathsFound,
    omittedPaths: Math.max(0, totalPathsFound - paths.length),
    maxHops,
    throughRelationNodes,
  };
}

export function queryStats(input: {
  nodes: MindNode[];
  edges: MindEdge[];
  /** Limit longestPath / degree / components to these edge kinds (default all). */
  edgeKinds?: QueryEdgeKind;
}): {
  nodeCount: number;
  edgeCount: number;
  hierarchyEdgeCount: number;
  relationEdgeCount: number;
  orphanNodes: number;
  /**
   * What orphanNodes means under the current edgeKinds filter.
   * When edgeKinds=relation, these are nodes with no relation edges (not global isolates).
   */
  orphanDef: string;
  /** Alias of orphanNodes when edgeKinds=relation — clearer name for that view. */
  nodesWithoutRelation?: number;
  /** Alias of orphanNodes when edgeKinds=hierarchy. */
  nodesWithoutHierarchy?: number;
  /** @deprecated use connectedComponents.count — undirected component count over edgeKinds. */
  islands: number;
  /** Undirected connected components (filtered by edgeKinds). */
  connectedComponents: {
    count: number;
    edgeKinds: QueryEdgeKind;
    components: {
      size: number;
      nodeIds: string[];
      texts: string[];
    }[];
  };
  avgChildrenPerNode: number;
  deepestDepth: number;
  nodesWithoutDescription: number;
  nodesWithoutFunction: number;
  edgesWithoutLabel: number;
  /** Graph diameter on edgeKinds subgraph (undirected shortest-path hops). */
  longestPath: {
    hops: number;
    from: string;
    to: string;
    fromText: string;
    toText: string;
    edgeKinds: QueryEdgeKind;
  } | null;
  /** Highest undirected degree on edgeKinds subgraph. */
  mostConnected: {
    nodeId: string;
    text: string;
    degree: number;
    edgeKinds: QueryEdgeKind;
  } | null;
} {
  const edgeKinds: QueryEdgeKind = input.edgeKinds ?? "all";
  const nodes = input.nodes.filter((n) => !n.deletedAt);
  const allEdges = input.edges.filter((e) => !e.deletedAt);
  const edges = filterEdges(input.edges, edgeKinds);
  const nodeIds = new Set(nodes.map((n) => n.id));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const connected = new Set<string>();
  for (const e of edges) {
    if (nodeIds.has(e.from)) connected.add(e.from);
    if (nodeIds.has(e.to)) connected.add(e.to);
  }
  const orphans = nodes.filter((n) => !connected.has(n.id)).length;
  const orphanDef =
    edgeKinds === "relation"
      ? "Nodes with degree 0 on the relation-only subgraph (no relation edges). Not global isolates — hierarchy links are ignored in this view."
      : edgeKinds === "hierarchy"
        ? "Nodes with degree 0 on the hierarchy-only subgraph (no hierarchy edges). Relation-only nodes count here."
        : "Nodes with degree 0 on the full graph (no hierarchy or relation edges).";
  const orphanAliases =
    edgeKinds === "relation"
      ? { nodesWithoutRelation: orphans }
      : edgeKinds === "hierarchy"
        ? { nodesWithoutHierarchy: orphans }
        : {};

  // Undirected components
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const e of edges) {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue;
    adj.get(e.from)!.push(e.to);
    adj.get(e.to)!.push(e.from);
  }
  const seen = new Set<string>();
  const componentLists: string[][] = [];
  for (const id of nodeIds) {
    if (seen.has(id)) continue;
    const q = [id];
    seen.add(id);
    const members: string[] = [];
    while (q.length) {
      const cur = q.pop()!;
      members.push(cur);
      for (const nxt of adj.get(cur) ?? []) {
        if (seen.has(nxt)) continue;
        seen.add(nxt);
        q.push(nxt);
      }
    }
    members.sort();
    componentLists.push(members);
  }
  componentLists.sort((a, b) => b.length - a.length || a[0]!.localeCompare(b[0]!));
  const connectedComponents = {
    count: componentLists.length,
    edgeKinds,
    components: componentLists.slice(0, 40).map((ids) => ({
      size: ids.length,
      nodeIds: ids.slice(0, 24),
      texts: ids.slice(0, 24).map((id) => byId.get(id)?.text ?? id),
    })),
  };
  const islands = connectedComponents.count;

  const children = new Map<string, string[]>();
  for (const e of allEdges) {
    if (e.kind !== "hierarchy" || !e.isPrimaryParent) continue;
    const list = children.get(e.from) ?? [];
    list.push(e.to);
    children.set(e.from, list);
  }
  let childSum = 0;
  let parents = 0;
  for (const [, list] of children) {
    parents += 1;
    childSum += list.length;
  }

  let deepestDepth = 0;
  const roots = [...nodeIds].filter((id) => {
    return !allEdges.some(
      (e) =>
        e.kind === "hierarchy" &&
        e.isPrimaryParent &&
        e.to === id &&
        nodeIds.has(e.from),
    );
  });
  for (const root of roots) {
    const q: { id: string; d: number }[] = [{ id: root, d: 0 }];
    const vis = new Set<string>([root]);
    while (q.length) {
      const { id, d } = q.shift()!;
      deepestDepth = Math.max(deepestDepth, d);
      for (const c of children.get(id) ?? []) {
        if (vis.has(c)) continue;
        vis.add(c);
        q.push({ id: c, d: d + 1 });
      }
    }
  }

  const degree = new Map<string, number>();
  for (const id of nodeIds) degree.set(id, 0);
  for (const e of edges) {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue;
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
  }
  let mostConnected: {
    nodeId: string;
    text: string;
    degree: number;
    edgeKinds: QueryEdgeKind;
  } | null = null;
  for (const [id, deg] of degree) {
    if (!mostConnected || deg > mostConnected.degree) {
      mostConnected = {
        nodeId: id,
        text: byId.get(id)?.text ?? id,
        degree: deg,
        edgeKinds,
      };
    }
  }
  if (mostConnected && mostConnected.degree === 0) mostConnected = null;

  let longestPath: {
    hops: number;
    from: string;
    to: string;
    fromText: string;
    toText: string;
    edgeKinds: QueryEdgeKind;
  } | null = null;
  const bfsFarthest = (start: string) => {
    const dist = new Map<string, number>([[start, 0]]);
    const q = [start];
    let far = start;
    while (q.length) {
      const cur = q.shift()!;
      const d = dist.get(cur)!;
      if (d > (dist.get(far) ?? 0)) far = cur;
      for (const nxt of adj.get(cur) ?? []) {
        if (dist.has(nxt)) continue;
        dist.set(nxt, d + 1);
        q.push(nxt);
      }
    }
    return { far, hops: dist.get(far) ?? 0 };
  };
  const starts = nodes.slice(0, 200).map((n) => n.id);
  for (const start of starts) {
    const { far, hops } = bfsFarthest(start);
    if (hops > 0 && (!longestPath || hops > longestPath.hops)) {
      longestPath = {
        hops,
        from: start,
        to: far,
        fromText: byId.get(start)?.text ?? start,
        toText: byId.get(far)?.text ?? far,
        edgeKinds,
      };
    }
  }

  return {
    nodeCount: nodes.length,
    edgeCount: allEdges.length,
    hierarchyEdgeCount: allEdges.filter((e) => e.kind === "hierarchy").length,
    relationEdgeCount: allEdges.filter((e) => e.kind === "relation").length,
    orphanNodes: orphans,
    orphanDef,
    ...orphanAliases,
    islands,
    connectedComponents,
    avgChildrenPerNode: parents ? Math.round((childSum / parents) * 10) / 10 : 0,
    deepestDepth,
    nodesWithoutDescription: nodes.filter(
      (n) => !n.description || Object.keys(n.description).length === 0,
    ).length,
    nodesWithoutFunction: nodes.filter((n) => {
      if (!n.description || Object.keys(n.description).length === 0) return false;
      return !nodeFunction(n);
    }).length,
    edgesWithoutLabel: allEdges.filter((e) => !e.label?.trim()).length,
    longestPath,
    mostConnected,
  };
}

export function queryOrphans(input: {
  nodes: MindNode[];
  edges: MindEdge[];
}): { nodes: CompactNode[]; citedNodeIds: string[] } {
  const nodes = input.nodes.filter((n) => !n.deletedAt);
  const edges = input.edges.filter((e) => !e.deletedAt);
  const connected = new Set<string>();
  for (const e of edges) {
    connected.add(e.from);
    connected.add(e.to);
  }
  const orphans = nodes.filter((n) => !connected.has(n.id));
  return {
    nodes: orphans.map(toCompactNode),
    citedNodeIds: orphans.map((n) => n.id),
  };
}

export function queryMissingMeta(input: {
  nodes: MindNode[];
  edges: MindEdge[];
}): {
  nodesWithoutDescription: CompactNode[];
  /**
   * Nodes that already have a description object but lack function/summary.
   * Complementary to nodesWithoutDescription (not a duplicate of empty description).
   */
  nodesWithoutFunction: CompactNode[];
  edgesWithoutLabel: CompactEdge[];
  citedNodeIds: string[];
} {
  const byId = new Map(input.nodes.map((n) => [n.id, n]));
  const nodes = input.nodes.filter((n) => !n.deletedAt);
  const edges = input.edges.filter((e) => !e.deletedAt);
  const withoutDesc = nodes.filter(
    (n) => !n.description || Object.keys(n.description).length === 0,
  );
  const withoutFn = nodes.filter((n) => {
    if (!n.description || Object.keys(n.description).length === 0) return false;
    return !nodeFunction(n);
  });
  const withoutLabel = edges.filter((e) => !e.label?.trim());
  const cited = new Set<string>([
    ...withoutDesc.map((n) => n.id),
    ...withoutFn.map((n) => n.id),
    ...withoutLabel.flatMap((e) => [e.from, e.to]),
  ]);
  return {
    nodesWithoutDescription: withoutDesc.map(toCompactNode),
    nodesWithoutFunction: withoutFn.map(toCompactNode),
    edgesWithoutLabel: withoutLabel.map((e) => toCompactEdge(e, byId)),
    citedNodeIds: [...cited],
  };
}

/** Resolve id / @alias / unique title against a node list. */
export function resolveQueryNodeRef(
  nodes: MindNode[],
  token: string,
  opts?: { anchorId?: string | null },
):
  | { ok: true; id: string }
  | {
      ok: false;
      error: "not_found" | "ambiguous";
      message: string;
      candidates?: { id: string; text: string }[];
    } {
  const raw = token.trim();
  if (!raw) {
    return { ok: false, error: "not_found", message: "empty node ref" };
  }
  const anchorId = opts?.anchorId ?? null;
  const live = nodes.filter((n) => !n.deletedAt && n.id !== anchorId);
  if (live.some((n) => n.id === raw)) return { ok: true, id: raw };

  const aliasKey = raw.replace(/^@/, "").toLowerCase();
  const byAlias = live.filter((n) => n.alias === aliasKey);
  if (byAlias.length === 1) return { ok: true, id: byAlias[0]!.id };
  if (byAlias.length > 1) {
    return {
      ok: false,
      error: "ambiguous",
      message: `alias @${aliasKey} matches multiple nodes`,
      candidates: byAlias.slice(0, 8).map((n) => ({ id: n.id, text: n.text })),
    };
  }

  const key = raw.toLowerCase();
  const exact = live.filter((n) => n.text.trim().toLowerCase() === key);
  if (exact.length === 1) return { ok: true, id: exact[0]!.id };
  if (exact.length > 1) {
    return {
      ok: false,
      error: "ambiguous",
      message: `title "${raw}" matches ${exact.length} nodes; use @alias`,
      candidates: exact.slice(0, 8).map((n) => ({ id: n.id, text: n.text })),
    };
  }

  const soft = live.filter(
    (n) =>
      n.text.toLowerCase().includes(key) ||
      key.includes(n.text.toLowerCase()) ||
      (n.alias && n.alias.includes(aliasKey)),
  );
  if (soft.length === 1) return { ok: true, id: soft[0]!.id };
  if (soft.length > 1) {
    return {
      ok: false,
      error: "ambiguous",
      message: `"${raw}" is ambiguous`,
      candidates: soft.slice(0, 8).map((n) => ({ id: n.id, text: n.text })),
    };
  }
  return {
    ok: false,
    error: "not_found",
    message: `No node matched "${raw}". Use mindmap_find or create it first.`,
  };
}
