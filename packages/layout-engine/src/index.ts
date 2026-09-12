import { flextree } from "d3-flextree";
import type {
  Density,
  MindEdge,
  MindNode,
  NodeViewMode,
  StylePreset,
} from "@mind-map/shared";

export type LayoutInput = {
  nodes: MindNode[];
  edges: MindEdge[];
  focusNodeId: string;
  density?: Density;
  /** Canvas-wide bubble vs card chrome (affects box sizes). */
  nodeViewMode?: NodeViewMode;
  /** Previous frame positions — reused when hierarchy structure is unchanged. */
  prevPositions?: PositionMap;
  /** Fingerprint of edges used to produce prevPositions. */
  prevHierarchyFp?: string;
  /** Force full flextree (e.g. after move_node / create / delete). */
  structureChanged?: boolean;
};

export type PositionMap = Record<string, { x: number; y: number }>;

type Dens = {
  gapX: number;
  gapY: number;
  nodeW: number;
  nodeH: number;
  pad: number;
};

const DENSITY: Record<Density, Dens> = {
  comfortable: { gapX: 80, gapY: 40, nodeW: 212, nodeH: 60, pad: 20 },
  compact: { gapX: 52, gapY: 28, nodeW: 168, nodeH: 48, pad: 12 },
};

/** Actual layout box — must match canvas hit/draw sizing intent. */
export function nodeLayoutSize(
  node: Pick<
    MindNode,
    | "stylePreset"
    | "imageUrl"
    | "tags"
    | "links"
    | "note"
    | "description"
    | "dueAt"
    | "startAt"
    | "pinned"
  >,
  dens: Dens,
  opts?: { asCard?: boolean },
): { w: number; h: number } {
  let w = dens.nodeW;
  let h = dens.nodeH;
  // meta strip (badges / tags / due)
  const hasMeta =
    Boolean(node.tags?.length) ||
    Boolean(node.links?.length) ||
    Boolean(node.dueAt) ||
    Boolean(node.note);
  if (hasMeta) h += dens.nodeH * 0.4;
  else h += dens.nodeH * 0.25;

  const preset: StylePreset = node.stylePreset ?? "default";
  const asCard = Boolean(opts?.asCard) || preset === "card";
  if (asCard) {
    // Keep in sync with apps/web/src/node-props/sizing.ts (glass card hierarchy)
    const cardW = dens.nodeW >= 200 ? 288 : 248;
    const gap = 10;
    const headerH = 40;
    const padY = 12;
    let body = 0;
    if (node.imageUrl) body += (dens.nodeW >= 200 ? 108 : 90) + gap;
    if (node.note) body += (dens.nodeW >= 200 ? 48 : 40) + gap;
    const descCount = node.description
      ? Math.min(
          6,
          Object.values(node.description).filter(
            (v) => v != null && String(v).trim() !== "",
          ).length,
        )
      : 0;
    if (descCount) body += descCount * 18 + Math.max(0, descCount - 1) * 4 + gap;
    const hasFooter =
      Boolean(node.tags?.length) ||
      Boolean(node.links?.length) ||
      node.startAt != null ||
      node.dueAt != null ||
      Boolean(node.pinned);
    if (hasFooter) body += 24 + gap;
    if (body > 0) body -= gap;
    const cardH = headerH + padY * 2 + Math.max(body, 8);
    return {
      w: cardW,
      h: Math.max(cardH, dens.nodeW >= 200 ? 104 : 88),
    };
  }
  if (preset === "title") {
    w *= 1.2;
    h *= 1.2;
  } else if (preset === "decision") {
    w *= 1.1;
    h *= 1.15;
  } else if (preset === "note") {
    h *= 1.15;
  }
  if (node.imageUrl) {
    w = Math.max(w, dens.nodeW * 1.2);
    h += dens.nodeH * 1.7;
  }
  return { w, h };
}

type FlexDatum = {
  id: string;
  size: [number, number];
  children?: FlexDatum[];
};

function buildAdj(edges: MindEdge[]): {
  hierarchy: Map<string, { other: string; primaryTo: boolean; order: number }[]>;
  relation: Map<string, string[]>;
} {
  const hierarchy = new Map<string, { other: string; primaryTo: boolean; order: number }[]>();
  const relation = new Map<string, string[]>();
  const addH = (from: string, to: string, primaryTo: boolean, order: number) => {
    const list = hierarchy.get(from) ?? [];
    list.push({ other: to, primaryTo, order });
    hierarchy.set(from, list);
  };
  const addR = (a: string, b: string) => {
    const la = relation.get(a) ?? [];
    la.push(b);
    relation.set(a, la);
  };
  for (const e of edges) {
    if (e.deletedAt) continue;
    if (e.kind === "hierarchy") {
      addH(e.from, e.to, e.isPrimaryParent, e.order);
      addH(e.to, e.from, false, e.order);
    } else if (e.kind === "relation") {
      addR(e.from, e.to);
      addR(e.to, e.from);
    }
  }
  for (const [, list] of hierarchy) {
    list.sort((a, b) => {
      if (a.primaryTo !== b.primaryTo) return a.primaryTo ? -1 : 1;
      return a.order - b.order;
    });
  }
  return { hierarchy, relation };
}

/**
 * Hierarchy subtree under any collapsed node — must not be laid out or rendered.
 * Walks all hierarchy edges (not only primary-parent), so AI-built trees still collapse.
 * The collapsed node itself stays visible.
 */
export function nodesHiddenByCollapse(
  nodes: MindNode[],
  edges: MindEdge[],
): Set<string> {
  const children = new Map<string, string[]>();
  for (const e of edges) {
    if (e.deletedAt || e.kind !== "hierarchy") continue;
    const list = children.get(e.from) ?? [];
    list.push(e.to);
    children.set(e.from, list);
  }

  const hidden = new Set<string>();
  const queue: string[] = [];
  for (const n of nodes) {
    if (n.deletedAt || !n.collapsed) continue;
    for (const c of children.get(n.id) ?? []) queue.push(c);
  }
  while (queue.length) {
    const id = queue.shift()!;
    if (hidden.has(id)) continue;
    hidden.add(id);
    for (const c of children.get(id) ?? []) queue.push(c);
  }
  return hidden;
}

function spanningChildren(
  focusId: string,
  adj: ReturnType<typeof buildAdj>,
  nodesById: Map<string, MindNode>,
  hidden: Set<string>,
): Map<string, string[]> {
  const children = new Map<string, string[]>();
  const seen = new Set<string>([focusId]);
  const queue = [focusId];

  const tryEnqueue = (other: string, kids: string[]) => {
    if (seen.has(other) || hidden.has(other)) return;
    const node = nodesById.get(other);
    if (!node || node.deletedAt) return;
    seen.add(other);
    kids.push(other);
    queue.push(other);
  };

  while (queue.length) {
    const cur = queue.shift()!;
    const curNode = nodesById.get(cur);
    // Collapsed: keep the node, do not expand its neighborhood into the tree.
    if (curNode?.collapsed) continue;
    const kids: string[] = [];
    for (const n of adj.hierarchy.get(cur) ?? []) tryEnqueue(n.other, kids);
    for (const other of adj.relation.get(cur) ?? []) tryEnqueue(other, kids);
    if (kids.length) children.set(cur, kids);
  }
  return children;
}

function assignSides(
  focusId: string,
  nodesById: Map<string, MindNode>,
  children: Map<string, string[]>,
): Map<string, -1 | 1> {
  const sideOf = new Map<string, -1 | 1>();
  let left = 0;
  let right = 0;
  for (const id of children.get(focusId) ?? []) {
    const node = nodesById.get(id);
    if (!node || node.deletedAt) continue;
    let side: -1 | 1;
    if (node.sidePref === -1) side = -1;
    else if (node.sidePref === 1) side = 1;
    else side = left <= right ? -1 : 1;
    sideOf.set(id, side);
    if (side === -1) left++;
    else right++;
  }
  return sideOf;
}

function buildSubtree(
  id: string,
  nodesById: Map<string, MindNode>,
  children: Map<string, string[]>,
  dens: Dens,
  path: Set<string>,
  asCard: boolean,
  childFilter?: (childId: string) => boolean,
): FlexDatum | null {
  if (path.has(id)) return null;
  const node = nodesById.get(id);
  if (!node || node.deletedAt) return null;
  const nextPath = new Set(path);
  nextPath.add(id);
  const kids: FlexDatum[] = [];
  if (!node.collapsed) {
    for (const cid of children.get(id) ?? []) {
      if (childFilter && !childFilter(cid)) continue;
      const child = buildSubtree(
        cid,
        nodesById,
        children,
        dens,
        nextPath,
        asCard,
      );
      if (child) kids.push(child);
    }
  }
  const box = nodeLayoutSize(node, dens, { asCard });
  return {
    id,
    // flextree size = full box + gutters (claim real space, not a rigid grid cell)
    size: [box.w + dens.gapX, box.h + dens.gapY],
    children: kids.length ? kids : undefined,
  };
}

/**
 * flextree: y = depth, x = sibling.
 * Mind map: depth → ±X, sibling → Y.
 * nodeSize [xSize,ySize] = [sibling span ≈ height, depth step ≈ width].
 */
function layoutSideTree(
  tree: FlexDatum,
  dens: Dens,
  side: -1 | 1,
  positions: PositionMap,
) {
  const lay = flextree()
    .children((d) => (d as FlexDatum).children ?? null)
    .nodeSize((d) => {
      const [boxW, boxH] = (d as { data: FlexDatum }).data.size;
      // data.size already includes gutters as [w+gapX, h+gapY]
      return [boxH, boxW];
    })
    .spacing(() => dens.gapY * 0.5);

  const root = lay.hierarchy(tree);
  lay(root);

  root.each((d) => {
    if (d.depth === 0) return;
    const data = d.data as FlexDatum;
    positions[data.id] = {
      x: side * d.y,
      y: d.x,
    };
  });
}

/**
 * Iterative AABB separation: nodes push apart until boxes (+pad) no longer overlap.
 * Pinned / focus stay fixed; others move. This is soft — not a locked grid.
 */
function resolveOverlaps(
  positions: PositionMap,
  sizes: Map<string, { w: number; h: number }>,
  fixed: Set<string>,
  pad: number,
  iterations = 60,
  /** If set, only pairs involving at least one of these ids are separated. */
  active?: Set<string>,
) {
  const ids = Object.keys(positions).filter((id) => sizes.has(id));
  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;
    for (let i = 0; i < ids.length; i++) {
      const a = ids[i]!;
      const pa = positions[a]!;
      const sa = sizes.get(a)!;
      const aw = sa.w / 2 + pad;
      const ah = sa.h / 2 + pad;
      for (let j = i + 1; j < ids.length; j++) {
        const b = ids[j]!;
        if (active && !active.has(a) && !active.has(b)) continue;
        const pb = positions[b]!;
        const sb = sizes.get(b)!;
        const bw = sb.w / 2 + pad;
        const bh = sb.h / 2 + pad;
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const ox = aw + bw - Math.abs(dx);
        const oy = ah + bh - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;

        // Push along the axis of least penetration
        const aFixed = fixed.has(a);
        const bFixed = fixed.has(b);
        if (aFixed && bFixed) continue;

        if (ox < oy) {
          const push = (ox / 2) * (dx === 0 ? (a < b ? 1 : -1) : Math.sign(dx) || 1);
          if (!aFixed && !bFixed) {
            pa.x -= push;
            pb.x += push;
          } else if (aFixed) {
            pb.x += push * 2;
          } else {
            pa.x -= push * 2;
          }
        } else {
          const push = (oy / 2) * (dy === 0 ? (a < b ? 1 : -1) : Math.sign(dy) || 1);
          if (!aFixed && !bFixed) {
            pa.y -= push;
            pb.y += push;
          } else if (aFixed) {
            pb.y += push * 2;
          } else {
            pa.y -= push * 2;
          }
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
}

/** Stable fingerprint of hierarchy topology + sibling order (ignores relation edges). */
export function hierarchyFingerprint(edges: MindEdge[]): string {
  const parts: string[] = [];
  for (const e of edges) {
    if (e.deletedAt || e.kind !== "hierarchy") continue;
    parts.push(
      `${e.from}>${e.to}:${e.isPrimaryParent ? 1 : 0}:${e.order}`,
    );
  }
  parts.sort();
  return parts.join("|");
}

export function layout(input: LayoutInput): PositionMap {
  const dens = DENSITY[input.density ?? "comfortable"];
  const asCard = input.nodeViewMode === "card";
  const nodesById = new Map(input.nodes.map((n) => [n.id, n]));
  if (!nodesById.has(input.focusNodeId)) return {};

  const hidden = nodesHiddenByCollapse(input.nodes, input.edges);
  // Focus inside a collapsed branch: still show the focus path (rare UI case).
  hidden.delete(input.focusNodeId);

  const sizes = new Map<string, { w: number; h: number }>();
  for (const n of input.nodes) {
    if (n.deletedAt || hidden.has(n.id)) continue;
    sizes.set(n.id, nodeLayoutSize(n, dens, { asCard }));
  }

  const prev = input.prevPositions;
  const fp = hierarchyFingerprint(input.edges);
  const structureUnchanged =
    !input.structureChanged &&
    Boolean(prev) &&
    Boolean(input.prevHierarchyFp) &&
    input.prevHierarchyFp === fp;

  const canReusePrev =
    structureUnchanged &&
    input.nodes.some((n) => !n.deletedAt && !hidden.has(n.id) && prev![n.id]);

  if (canReusePrev && prev) {
    const positions: PositionMap = {};
    for (const n of input.nodes) {
      if (n.deletedAt || hidden.has(n.id)) continue;
      const p = prev[n.id];
      if (p) positions[n.id] = { ...p };
    }

    const fixed = new Set<string>();
    const active = new Set<string>();
    for (const n of input.nodes) {
      if (hidden.has(n.id) || n.deletedAt) continue;
      if (!n.pinned) continue;
      const pinPos = n.pos ?? prev[n.id];
      if (!pinPos) continue;
      const before = positions[n.id];
      positions[n.id] = { ...pinPos };
      fixed.add(n.id);
      if (
        !before ||
        Math.abs(before.x - pinPos.x) > 0.5 ||
        Math.abs(before.y - pinPos.y) > 0.5
      ) {
        active.add(n.id);
      }
    }

    // Focus stays centered unless it is pinned (pinned never moves).
    const focus = nodesById.get(input.focusNodeId);
    if (!(focus?.pinned && positions[input.focusNodeId])) {
      positions[input.focusNodeId] = { x: 0, y: 0 };
      fixed.add(input.focusNodeId);
    } else {
      fixed.add(input.focusNodeId);
    }

    // Place brand-new nodes (no prev) near focus, then local-separate only.
    const orphans = input.nodes.filter(
      (n) => !n.deletedAt && !hidden.has(n.id) && !positions[n.id],
    );
    orphans.forEach((n, i) => {
      const angle = (i / Math.max(1, orphans.length)) * Math.PI * 2;
      const r = dens.nodeW + dens.gapX * 2;
      positions[n.id] = {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      };
      active.add(n.id);
    });

    if (active.size) {
      resolveOverlaps(positions, sizes, fixed, dens.pad, 24, active);
      if (!(focus?.pinned && positions[input.focusNodeId])) {
        positions[input.focusNodeId] = { x: 0, y: 0 };
      }
      resolveOverlaps(positions, sizes, fixed, dens.pad, 12, active);
    } else if (!(focus?.pinned && positions[input.focusNodeId])) {
      positions[input.focusNodeId] = { x: 0, y: 0 };
    }

    for (const id of hidden) delete positions[id];
    return positions;
  }

  // Full flextree path (structure changed or first layout).
  const adj = buildAdj(input.edges);
  const children = spanningChildren(input.focusNodeId, adj, nodesById, hidden);
  const sideOf = assignSides(input.focusNodeId, nodesById, children);
  const positions: PositionMap = {
    [input.focusNodeId]: { x: 0, y: 0 },
  };

  for (const side of [-1, 1] as const) {
    const tree = buildSubtree(
      input.focusNodeId,
      nodesById,
      children,
      dens,
      new Set(),
      asCard,
      (childId) => sideOf.get(childId) === side,
    );
    if (!tree?.children?.length) continue;
    layoutSideTree(tree, dens, side, positions);
  }

  positions[input.focusNodeId] = { x: 0, y: 0 };

  // Soft blend from prev — never override pinned nodes.
  if (prev) {
    for (const [id, p] of Object.entries(prev)) {
      if (hidden.has(id) || id === input.focusNodeId) continue;
      if (!positions[id]) continue;
      const node = nodesById.get(id);
      if (node?.pinned) continue;
      const sug = positions[id]!;
      const dist = Math.hypot(p.x - sug.x, p.y - sug.y);
      if (dist < dens.nodeW * 4) {
        positions[id] = { ...p };
      }
    }
  }

  const fixed = new Set<string>();
  for (const n of input.nodes) {
    if (hidden.has(n.id) || n.deletedAt) continue;
    if (!n.pinned) continue;
    const pinPos = n.pos ?? prev?.[n.id] ?? positions[n.id];
    if (!pinPos) continue;
    positions[n.id] = { ...pinPos };
    fixed.add(n.id);
  }

  const focusNode = nodesById.get(input.focusNodeId);
  if (!(focusNode?.pinned && positions[input.focusNodeId])) {
    positions[input.focusNodeId] = { x: 0, y: 0 };
  }
  fixed.add(input.focusNodeId);

  // Disconnected visible nodes only — never re-seed collapsed descendants.
  const placed = new Set(Object.keys(positions));
  const orphans = input.nodes.filter(
    (n) => !n.deletedAt && !hidden.has(n.id) && !placed.has(n.id),
  );
  orphans.forEach((n, i) => {
    if (prev?.[n.id]) {
      positions[n.id] = { ...prev[n.id]! };
      return;
    }
    const angle = (i / Math.max(1, orphans.length)) * Math.PI * 2;
    const r = dens.nodeW + dens.gapX * 2 + Math.floor(i / 8) * dens.nodeW;
    positions[n.id] = {
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    };
  });

  resolveOverlaps(positions, sizes, fixed, dens.pad);

  // Keep focus centered after pushes — but never yank a pinned focus off its pos.
  if (!(focusNode?.pinned && (focusNode.pos || prev?.[focusNode.id]))) {
    positions[input.focusNodeId] = { x: 0, y: 0 };
  }
  resolveOverlaps(positions, sizes, fixed, dens.pad, 20);

  // Ensure collapsed descendants never leak into the position map.
  for (const id of hidden) delete positions[id];

  return positions;
}

export function layoutDiff(
  prev: PositionMap,
  next: PositionMap,
): { id: string; x: number; y: number }[] {
  const out: { id: string; x: number; y: number }[] = [];
  for (const [id, p] of Object.entries(next)) {
    const o = prev[id];
    if (!o || o.x !== p.x || o.y !== p.y) out.push({ id, x: p.x, y: p.y });
  }
  return out;
}

export function primaryParentMap(edges: MindEdge[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const e of edges) {
    if (e.kind === "hierarchy" && e.isPrimaryParent && !e.deletedAt) {
      m.set(e.to, e.from);
    }
  }
  return m;
}
