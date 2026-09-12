import type { MindNode } from "@mind-map/shared";
import { canvasFont } from "../canvas-chrome";
import { getCachedImage, imageLoadFailed } from "../image-cache";
import type { SystemTheme } from "../system-theme";
import { roundRectPath, wrapTextLines } from "../node-geometry";
import { visiblePropRows } from "./registry";
import {
  CARD_GAP,
  CARD_HEADER_H,
  CARD_PAD_X,
  CARD_PAD_Y,
  estimateCardSize,
} from "./sizing";

/** Read-only card chrome + stacked property rows (shell already filled by canvas). */
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
  const rows = visiblePropRows(node);
  const radius = dens ? 12 : 14;

  // Top accent hairline
  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(x, y, w, 3);
  ctx.globalAlpha = 1;

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

  // Header band
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(x, y, w, CARD_HEADER_H);

  ctx.beginPath();
  ctx.arc(x + 14, y + CARD_HEADER_H / 2, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();

  ctx.fillStyle = theme.labelPrimary;
  ctx.font = canvasFont(dens ? 12 : 13, 600);
  ctx.textBaseline = "middle";
  const titleMaxW = w - 28 - CARD_PAD_X;
  const titleLines = wrapTextLines(
    ctx,
    node.text || "未命名",
    titleMaxW,
    dens ? 1 : 2,
  );
  if (titleLines.length === 1) {
    ctx.fillText(titleLines[0]!, x + 26, y + CARD_HEADER_H / 2);
  } else {
    const lh = 13;
    const ty = y + CARD_HEADER_H / 2 - lh / 2;
    titleLines.forEach((line, i) => {
      ctx.fillText(line, x + 26, ty + i * lh);
    });
  }

  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1 / Math.max(0.5, zoom);
  ctx.beginPath();
  ctx.moveTo(x + CARD_PAD_X, y + CARD_HEADER_H);
  ctx.lineTo(x + w - CARD_PAD_X, y + CARD_HEADER_H);
  ctx.stroke();

  let cy = y + CARD_HEADER_H + CARD_PAD_Y;
  const contentW = w - CARD_PAD_X * 2;

  for (const { def, preview } of rows) {
    if (def.id === "text") continue;

    if (def.imageRow && preview) {
      const ih = dens ? 52 : 64;
      const img = getCachedImage(preview, onImage);
      ctx.save();
      ctx.beginPath();
      roundRectPath(ctx, x + CARD_PAD_X, cy, contentW, ih, 8);
      ctx.clip();
      if (img && img.naturalWidth > 0) {
        // Contain: 等比例缩小完整入框，不裁切
        const scale = Math.min(
          contentW / img.naturalWidth,
          ih / img.naturalHeight,
        );
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.fillRect(x + CARD_PAD_X, cy, contentW, ih);
        ctx.drawImage(
          img,
          x + CARD_PAD_X + (contentW - dw) / 2,
          cy + (ih - dh) / 2,
          dw,
          dh,
        );
      } else {
        ctx.fillStyle = theme.border;
        ctx.fillRect(x + CARD_PAD_X, cy, contentW, ih);
        ctx.fillStyle = theme.labelSecondary;
        ctx.font = canvasFont(11, 500);
        ctx.textBaseline = "middle";
        ctx.fillText(
          imageLoadFailed(preview) ? "配图失败" : "加载中…",
          x + CARD_PAD_X + 10,
          cy + ih / 2,
        );
      }
      ctx.restore();
      cy += ih + CARD_GAP;
      continue;
    }

    ctx.fillStyle = theme.labelSecondary;
    ctx.font = canvasFont(dens ? 10 : 11, 500);
    ctx.textBaseline = "top";
    ctx.fillText(def.label, x + CARD_PAD_X, cy);

    ctx.fillStyle = theme.labelPrimary;
    ctx.font = canvasFont(dens ? 11 : 12, 400);
    const text = preview ?? "—";
    const maxLines = def.kind === "textarea" ? 3 : 2;
    const lines = wrapTextLines(ctx, text, contentW, maxLines);
    let ly = cy + (dens ? 14 : 15);
    for (const line of lines) {
      ctx.fillText(line, x + CARD_PAD_X, ly);
      ly += dens ? 14 : 15;
    }
    cy = Math.max(cy + def.rowHeight, ly) + CARD_GAP;
  }
  ctx.restore();
}
