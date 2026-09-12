import type { MindNode } from "@mind-map/shared";
import { visiblePropRows } from "./registry";

export const CARD_WIDTH = { comfortable: 288, compact: 248 } as const;
export const CARD_HEADER_H = 36;
export const CARD_PAD_Y = 12;
export const CARD_PAD_X = 12;
export const CARD_GAP = 10;

/** Layout / hit-test height for a card node. */
export function estimateCardSize(
  node: MindNode,
  dens: boolean,
  forced: ReadonlySet<string> = new Set(),
): { w: number; h: number } {
  const w = dens ? CARD_WIDTH.compact : CARD_WIDTH.comfortable;
  const rows = visiblePropRows(node, forced);
  let body = 0;
  for (const { def } of rows) {
    if (def.id === "text") continue;
    // Stacked label+value needs a bit more than legacy side-by-side rows.
    const rh =
      def.imageRow ? (dens ? 52 : 64) + 4 : Math.max(def.rowHeight + 12, dens ? 28 : 32);
    body += rh + CARD_GAP;
  }
  if (body > 0) body -= CARD_GAP;
  const h = CARD_HEADER_H + CARD_PAD_Y * 2 + Math.max(body, 12);
  return { w, h: Math.max(h, dens ? 84 : 100) };
}
