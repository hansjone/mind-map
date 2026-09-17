import type { MindNode } from "@mind-map/shared";
import { descriptionChips } from "./description-display";

export const CARD_WIDTH = { comfortable: 288, compact: 248 } as const;
export const CARD_HEADER_H = 40;
export const CARD_PAD_Y = 12;
export const CARD_PAD_X = 14;
export const CARD_GAP = 10;
export const CARD_HERO_H = { comfortable: 108, compact: 90 } as const;
export const CARD_CHIP_H = 18;
export const CARD_FOOTER_H = 24;

export type CardSizeOpts = {
  /** Click-expanded: show full note / multi-line props / more chips. */
  expanded?: boolean;
};

/** Layout / hit-test height for a glass card node (title → image → note → chips → footer). */
export function estimateCardSize(
  node: MindNode,
  dens: boolean,
  _forced: ReadonlySet<string> = new Set(),
  opts: CardSizeOpts = {},
): { w: number; h: number } {
  const expanded = Boolean(opts.expanded);
  const w = dens ? CARD_WIDTH.compact : CARD_WIDTH.comfortable;
  let body = 0;

  if (node.imageUrl?.trim()) {
    body += (dens ? CARD_HERO_H.compact : CARD_HERO_H.comfortable) + CARD_GAP;
  }

  if (node.note?.trim()) {
    if (expanded) {
      // Rough multi-line note: ~42 chars/line at card width
      const lines = Math.min(
        12,
        Math.max(2, Math.ceil(node.note.trim().length / (dens ? 28 : 34))),
      );
      body += lines * (dens ? 15 : 16) + CARD_GAP;
    } else {
      body += (dens ? 40 : 48) + CARD_GAP;
    }
  }

  const chips = descriptionChips(node.description, {
    full: expanded,
    max: expanded ? 64 : 6,
  });
  if (chips.length) {
    if (expanded) {
      const rowGap = dens ? 4 : 5;
      let chipH = 0;
      for (const chip of chips) {
        // ~22 chars per value line when label takes ~36% width
        const vLines = Math.min(
          8,
          Math.max(1, Math.ceil(chip.fullValue.length / (dens ? 18 : 22))),
        );
        chipH += CARD_CHIP_H + Math.max(0, vLines - 1) * (dens ? 14 : 15);
        chipH += rowGap;
      }
      body += chipH + CARD_GAP;
    } else {
      body +=
        chips.length * CARD_CHIP_H +
        Math.max(0, chips.length - 1) * 4 +
        CARD_GAP;
    }
  }

  const hasFooter =
    Boolean(node.tags?.length) ||
    Boolean(node.links?.length) ||
    node.startAt != null ||
    node.dueAt != null ||
    Boolean(node.pinned);
  if (hasFooter) {
    body += CARD_FOOTER_H + CARD_GAP;
  }

  if (body > 0) body -= CARD_GAP;
  const h = CARD_HEADER_H + CARD_PAD_Y * 2 + Math.max(body, 8);
  return { w, h: Math.max(h, dens ? 88 : 104) };
}
