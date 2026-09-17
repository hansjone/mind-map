import type { MindNode } from "@mind-map/shared";
import { canvasFont, paintBadgeChip } from "../canvas-chrome";
import { getCachedImage, imageLoadFailed } from "../image-cache";
import type { SystemTheme } from "../system-theme";
import { roundRectPath, wrapTextLines } from "../node-geometry";
import { descriptionChips, type DescChip } from "./description-display";
import {
  CARD_CHIP_H,
  CARD_FOOTER_H,
  CARD_GAP,
  CARD_HEADER_H,
  CARD_HERO_H,
  CARD_PAD_X,
  CARD_PAD_Y,
  estimateCardSize,
} from "./sizing";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 28);
  }
}

function formatDate(ms?: number): string | null {
  if (ms == null || !Number.isFinite(ms)) return null;
  try {
    return new Date(ms).toLocaleDateString();
  } catch {
    return null;
  }
}

export type CardChipHit = {
  key: string;
  label: string;
  value: string;
  fullValue: string;
  /** Card-local rect (relative to card top-left). */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type DrawPropSheetOpts = {
  expanded?: boolean;
};

/** Compute chip hit targets in card-local coordinates (must match drawPropSheet). */
export function cardChipHits(
  node: MindNode,
  dens: boolean,
  expanded = false,
): CardChipHit[] {
  const { w } = estimateCardSize(node, dens, new Set(), { expanded });
  let cy = CARD_HEADER_H + Math.max(4, CARD_PAD_Y - 4);
  const contentW = w - CARD_PAD_X * 2;

  if (node.imageUrl?.trim()) {
    cy += (dens ? CARD_HERO_H.compact : CARD_HERO_H.comfortable) + CARD_GAP;
  }

  const note = node.note?.trim();
  if (note) {
    const maxLines = expanded ? (dens ? 10 : 12) : dens ? 2 : 3;
    // Approximate line count without canvas measure (hit test is generous)
    const approxChars = dens ? 28 : 34;
    const lines = Math.min(
      maxLines,
      Math.max(1, Math.ceil(note.length / approxChars)),
    );
    const lh = dens ? 15 : 16;
    cy += lines * lh + CARD_GAP;
  }

  const chips = descriptionChips(node.description, {
    full: expanded,
    max: expanded ? 64 : 6,
  });
  const hits: CardChipHit[] = [];
  const rowGap = dens ? 4 : 5;
  for (const chip of chips) {
    const approx = dens ? 18 : 22;
    const vLines = expanded
      ? Math.min(8, Math.max(1, Math.ceil(chip.fullValue.length / approx)))
      : 1;
    const lh = dens ? 14 : 15;
    const rowH = CARD_CHIP_H + Math.max(0, vLines - 1) * lh;
    hits.push({
      key: chip.key,
      label: chip.label,
      value: chip.value,
      fullValue: chip.fullValue,
      x: CARD_PAD_X,
      y: cy,
      w: contentW,
      h: rowH,
    });
    cy += rowH + rowGap;
  }
  return hits;
}

/** Also expose note / title as hoverable regions when truncated. */
export function cardFieldHits(
  node: MindNode,
  dens: boolean,
  expanded = false,
): CardChipHit[] {
  const { w } = estimateCardSize(node, dens, new Set(), { expanded });
  const hits: CardChipHit[] = [];
  const title = (node.text || "未命名").trim();
  hits.push({
    key: "__title",
    label: "标题",
    value: title,
    fullValue: title,
    x: 28,
    y: 4,
    w: w - 32 - CARD_PAD_X,
    h: CARD_HEADER_H - 8,
  });

  let cy = CARD_HEADER_H + Math.max(4, CARD_PAD_Y - 4);
  const contentW = w - CARD_PAD_X * 2;

  if (node.imageUrl?.trim()) {
    cy += (dens ? CARD_HERO_H.compact : CARD_HERO_H.comfortable) + CARD_GAP;
  }

  const note = node.note?.trim();
  if (note) {
    const maxLines = expanded ? (dens ? 10 : 12) : dens ? 2 : 3;
    const approxChars = dens ? 28 : 34;
    const lines = Math.min(
      maxLines,
      Math.max(1, Math.ceil(note.length / approxChars)),
    );
    const lh = dens ? 15 : 16;
    const noteH = lines * lh;
    hits.push({
      key: "__note",
      label: "摘要",
      value: note,
      fullValue: note,
      x: CARD_PAD_X,
      y: cy,
      w: contentW,
      h: noteH,
    });
  }

  return [...hits, ...cardChipHits(node, dens, expanded)];
}

function drawChipRows(
  ctx: CanvasRenderingContext2D,
  chips: DescChip[],
  x: number,
  startY: number,
  contentW: number,
  theme: SystemTheme,
  dens: boolean,
  expanded: boolean,
): number {
  let cy = startY;
  const rowGap = dens ? 4 : 5;
  for (let i = 0; i < chips.length; i++) {
    const chip = chips[i]!;
    ctx.fillStyle = theme.labelSecondary;
    ctx.font = canvasFont(10, 500);
    ctx.textBaseline = "middle";
    const label = chip.label;
    const labelW = Math.min(ctx.measureText(label).width, contentW * 0.36);
    const text = expanded ? chip.fullValue : chip.value;
    const vx = x + CARD_PAD_X + labelW + 10;
    const vw = contentW - labelW - 10;
    const maxLines = expanded ? 8 : 1;
    ctx.font = canvasFont(dens ? 11 : 12, 500);
    const vLines = wrapTextLines(ctx, text, vw, maxLines);
    const lh = dens ? 14 : 15;
    const rowH = Math.max(CARD_CHIP_H, vLines.length * lh);

    ctx.fillStyle = theme.labelSecondary;
    ctx.font = canvasFont(10, 500);
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + CARD_PAD_X, cy + CARD_CHIP_H / 2, labelW);

    ctx.fillStyle = theme.labelPrimary;
    ctx.font = canvasFont(dens ? 11 : 12, 500);
    if (vLines.length <= 1) {
      ctx.textBaseline = "middle";
      ctx.fillText(vLines[0] ?? text, vx, cy + CARD_CHIP_H / 2);
    } else {
      ctx.textBaseline = "top";
      for (let li = 0; li < vLines.length; li++) {
        ctx.fillText(vLines[li]!, vx, cy + 2 + li * lh);
      }
    }
    cy += rowH + rowGap;
  }
  return cy;
}

/** Glass card body: title → hero → note → meta chips → footer (no raw JSON). */
export function drawPropSheet(
  ctx: CanvasRenderingContext2D,
  node: MindNode,
  x: number,
  y: number,
  theme: SystemTheme,
  zoom: number,
  dens: boolean,
  accent: string,
  onImage: () => void,
  opts: DrawPropSheetOpts = {},
) {
  const expanded = Boolean(opts.expanded);
  const { w, h } = estimateCardSize(node, dens, new Set(), { expanded });
  const radius = dens ? 14 : 16;

  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.clip();

  // Low zoom: title only
  if (zoom < 0.35) {
    ctx.fillStyle = theme.labelPrimary;
    ctx.font = canvasFont(dens ? 12 : 13, 600);
    ctx.textBaseline = "middle";
    const lines = wrapTextLines(
      ctx,
      node.text || "未命名",
      w - CARD_PAD_X * 2,
      2,
    );
    const lineH = dens ? 14 : 16;
    const startY = y + h / 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, x + CARD_PAD_X, startY + i * lineH);
    });
    ctx.restore();
    return;
  }

  // Title row (same surface as body — no striped header band)
  ctx.beginPath();
  ctx.arc(x + 16, y + CARD_HEADER_H / 2, 7, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.22;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(x + 16, y + CARD_HEADER_H / 2, 4, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();

  ctx.fillStyle = theme.labelPrimary;
  ctx.font = canvasFont(dens ? 13 : 14, 600);
  ctx.textBaseline = "middle";
  const titleMaxW = w - 32 - CARD_PAD_X;
  const titleLines = wrapTextLines(
    ctx,
    node.text || "未命名",
    titleMaxW,
    expanded ? (dens ? 2 : 3) : dens ? 1 : 2,
  );
  if (titleLines.length === 1) {
    ctx.fillText(titleLines[0]!, x + 28, y + CARD_HEADER_H / 2);
  } else {
    const lh = 14;
    const ty = y + CARD_HEADER_H / 2 - ((titleLines.length - 1) * lh) / 2;
    titleLines.forEach((line, i) => {
      ctx.fillText(line, x + 28, ty + i * lh);
    });
  }

  let cy = y + CARD_HEADER_H + Math.max(4, CARD_PAD_Y - 4);
  const contentW = w - CARD_PAD_X * 2;

  // Hero image
  const imageUrl = node.imageUrl?.trim();
  if (imageUrl) {
    const ih = dens ? CARD_HERO_H.compact : CARD_HERO_H.comfortable;
    const img = getCachedImage(imageUrl, onImage);
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, x + CARD_PAD_X, cy, contentW, ih, 10);
    ctx.clip();
    ctx.fillStyle = theme.glassHeader;
    ctx.fillRect(x + CARD_PAD_X, cy, contentW, ih);
    if (img && img.naturalWidth > 0) {
      const scale = Math.max(
        contentW / img.naturalWidth,
        ih / img.naturalHeight,
      );
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(
        img,
        x + CARD_PAD_X + (contentW - dw) / 2,
        cy + (ih - dh) / 2,
        dw,
        dh,
      );
    } else {
      ctx.fillStyle = theme.labelSecondary;
      ctx.font = canvasFont(11, 500);
      ctx.textBaseline = "middle";
      ctx.fillText(
        imageLoadFailed(imageUrl) ? "配图失败" : "加载中…",
        x + CARD_PAD_X + 10,
        cy + ih / 2,
      );
    }
    ctx.restore();
    cy += ih + CARD_GAP;
  }

  // Note summary
  const note = node.note?.trim();
  if (note) {
    ctx.fillStyle = theme.labelSecondary;
    ctx.font = canvasFont(dens ? 11.5 : 12.5, 400);
    ctx.textBaseline = "top";
    const maxLines = expanded ? (dens ? 10 : 12) : dens ? 2 : 3;
    const lines = wrapTextLines(ctx, note, contentW, maxLines);
    const lh = dens ? 15 : 16;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i]!, x + CARD_PAD_X, cy + i * lh);
    }
    cy += lines.length * lh + CARD_GAP;
  }

  // Description as key-value rows
  const chips = descriptionChips(node.description, {
    full: expanded,
    max: expanded ? 64 : 6,
  });
  if (chips.length) {
    cy = drawChipRows(ctx, chips, x, cy, contentW, theme, dens, expanded);
    cy += CARD_GAP - 4;
  }

  // Footer: tags / source / dates as chips
  const footerBits: string[] = [];
  if (node.tags?.length) {
    for (const t of node.tags.slice(0, expanded ? 12 : 3)) footerBits.push(`#${t}`);
  }
  if (node.links?.[0]) {
    const l = node.links[0];
    footerBits.push(l.title?.trim() || hostnameOf(l.url));
  }
  const due = formatDate(node.dueAt);
  const start = formatDate(node.startAt);
  if (start) footerBits.push(start);
  if (due) footerBits.push(due);
  if (node.pinned) footerBits.push("钉");

  if (footerBits.length) {
    let fx = x + CARD_PAD_X;
    const fy = cy;
    for (const bit of footerBits) {
      const used = paintBadgeChip(ctx, bit, fx, fy, theme, zoom);
      fx += used;
      if (!expanded && fx > x + w - CARD_PAD_X - 24) break;
      if (expanded && fx > x + w - CARD_PAD_X - 24) {
        fx = x + CARD_PAD_X;
        cy += CARD_FOOTER_H;
      }
    }
  }

  ctx.restore();
}
