import type { MindEdge } from "@mind-map/shared";

/** Primary-hierarchy descendants including root. */
export function collectSubtreeIds(
  rootId: string,
  edges: MindEdge[],
): string[] {
  const kids = new Map<string, string[]>();
  for (const e of edges) {
    if (e.deletedAt || e.kind !== "hierarchy" || !e.isPrimaryParent) continue;
    const list = kids.get(e.from) ?? [];
    list.push(e.to);
    kids.set(e.from, list);
  }
  const out: string[] = [rootId];
  const seen = new Set<string>([rootId]);
  const queue = [rootId];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const c of kids.get(cur) ?? []) {
      if (seen.has(c)) continue;
      seen.add(c);
      out.push(c);
      queue.push(c);
    }
  }
  return out;
}

export function isDescendantOrSelf(
  candidateId: string,
  rootId: string,
  edges: MindEdge[],
): boolean {
  return collectSubtreeIds(rootId, edges).includes(candidateId);
}

export type DragGhost = {
  rootId: string;
  /** World delta from positions at pointer-down. */
  dx: number;
  dy: number;
  ids: string[];
};

export function ghostPos(
  id: string,
  base: { x: number; y: number } | undefined,
  ghost: DragGhost | null,
): { x: number; y: number } | undefined {
  if (!base) return undefined;
  if (ghost && ghost.ids.includes(id)) {
    return { x: base.x + ghost.dx, y: base.y + ghost.dy };
  }
  return base;
}
