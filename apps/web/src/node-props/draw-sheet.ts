import type { MindNode } from "@mind-map/shared";
import { canvasFont, paintBadgeChip } from "../canvas-chrome";
import { getCachedImage, imageLoadFailed } from "../image-cache";
import type { SystemTheme } from "../system-theme";
import { roundRectPath, wrapTextLines } from "../node-geometry";
import { descriptionChips } from "./description-display";
import {
  CARD_CHIP_H,
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
) {
  const { w, h } = estimateCardSize(node, dens);
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
    dens ? 1 : 2,
  );
  if (titleLines.length === 1) {
    ctx.fillText(titleLines[0]!, x + 28, y + CARD_HEADER_H / 2);
  } else {
    const lh = 14;
    const ty = y + CARD_HEADER_H / 2 - lh / 2;
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
      // Cover: fill frame, crop edges lightly for magazine feel
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
    const lines = wrapTextLines(ctx, note, contentW, dens ? 2 : 3);
    const lh = dens ? 15 : 16;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i]!, x + CARD_PAD_X, cy + i * lh);
    }
    cy += lines.length * lh + CARD_GAP;
  }

  // Description as one compact key-value block (no row dividers)
  const chips = descriptionChips(node.description);
  if (chips.length) {
    const rowGap = dens ? 4 : 5;
    for (let i = 0; i < chips.length; i++) {
      const chip = chips[i]!;
      ctx.fillStyle = theme.labelSecondary;
      ctx.font = canvasFont(10, 500);
      ctx.textBaseline = "middle";
      const label = chip.label;
      const labelW = Math.min(ctx.measureText(label).width, contentW * 0.36);
      ctx.fillText(label, x + CARD_PAD_X, cy + CARD_CHIP_H / 2, labelW);

      ctx.fillStyle = theme.labelPrimary;
      ctx.font = canvasFont(dens ? 11 : 12, 500);
      const vx = x + CARD_PAD_X + labelW + 10;
      const vw = contentW - labelW - 10;
      const vLines = wrapTextLines(ctx, chip.value, vw, 1);
      ctx.fillText(vLines[0] ?? chip.value, vx, cy + CARD_CHIP_H / 2);
      cy += CARD_CHIP_H + rowGap;
    }
    cy += CARD_GAP - 4;
  }

  // Footer: tags / source / dates as chips
  const footerBits: string[] = [];
  if (node.tags?.length) {
    for (const t of node.tags.slice(0, 3)) footerBits.push(`#${t}`);
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
      if (fx > x + w - CARD_PAD_X - 24) break;
    }
  }

  ctx.restore();
}
