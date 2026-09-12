/** Shared canvas typography + chrome helpers for bubble/card nodes. */

export const CANVAS_FONT =
  '"Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif';

export function canvasFont(
  sizePx: number,
  weight: 400 | 500 | 600 | 700 = 400,
): string {
  return `${weight === 400 ? "" : `${weight} `}${sizePx}px ${CANVAS_FONT}`;
}

/** Soft drop shadow under a node (world units). */
export function paintNodeShadow(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  opts?: { selected?: boolean },
) {
  ctx.shadowColor = opts?.selected
    ? "rgba(0, 0, 0, 0.45)"
    : "rgba(0, 0, 0, 0.28)";
  ctx.shadowBlur = (opts?.selected ? 18 : 12) / Math.max(0.5, zoom);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3 / Math.max(0.5, zoom);
}

export function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/** Low-alpha accent wash clipped to current path. */
export function fillAccentWash(
  ctx: CanvasRenderingContext2D,
  accent: string,
  alpha = 0.14,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.restore();
}

/** Left accent rail inside a rounded rect (not for diamonds/pills). */
export function paintAccentRail(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  accent: string,
  radius = 10,
) {
  const railW = 4;
  ctx.save();
  ctx.beginPath();
  const rr = Math.min(radius, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + railW, y);
  ctx.lineTo(x + railW, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.95;
  ctx.fill();
  ctx.restore();
}

export function paintBadgeChip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  theme: {
    labelSecondary: string;
    border: string;
    bgLayer1: string;
    glassHeader?: string;
    glassBorder?: string;
  },
  zoom: number,
): number {
  const padX = 6;
  const h = 16 / Math.max(0.75, Math.min(1.2, zoom));
  ctx.font = canvasFont(10 / Math.max(0.75, Math.min(1.2, zoom)), 500);
  const tw = ctx.measureText(text).width;
  const w = tw + padX * 2;
  ctx.beginPath();
  const r = h / 2;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = theme.glassHeader ?? "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.strokeStyle = theme.glassBorder ?? theme.border;
  ctx.lineWidth = 1 / Math.max(0.5, zoom);
  ctx.stroke();
  ctx.fillStyle = theme.labelSecondary;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2);
  return w + 4;
}

/** Soft outer glow in accent hue for glass cards (shadow only — do not change fill alpha). */
export function paintGlassGlow(
  ctx: CanvasRenderingContext2D,
  accent: string,
  zoom: number,
  selected?: boolean,
) {
  ctx.shadowColor = accent;
  ctx.shadowBlur = (selected ? 20 : 12) / Math.max(0.5, zoom);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/** Inner top highlight strip for frosted-glass feel. */
export function paintGlassHighlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  highlight: string,
) {
  ctx.save();
  ctx.beginPath();
  const rr = Math.min(radius, h / 2, w / 2);
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + Math.min(h * 0.45, 28));
  ctx.lineTo(x, y + Math.min(h * 0.45, 28));
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
  const g = ctx.createLinearGradient(x, y, x, y + 28);
  g.addColorStop(0, highlight);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}
