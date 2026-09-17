import type { MindNode, StylePreset } from "@mind-map/shared";
import { estimateCardSize } from "./node-props/sizing";

export const TOPO_ICON_PX = { comfortable: 36, compact: 30 } as const;
export const ROUTER_ICON_URL = "/topo/ne-router.png";

/** Keep roughly in sync with layout-engine nodeLayoutSize (comfortable / compact). */
export function nodeBoxSize(
  n: MindNode,
  dens: boolean,
  opts?: { asCard?: boolean; asTopology?: boolean; expanded?: boolean },
): { w: number; h: number } {
  if (opts?.asTopology) {
    const icon = dens ? TOPO_ICON_PX.compact : TOPO_ICON_PX.comfortable;
    const caption = dens ? 18 : 20;
    const gap = 6;
    const pad = dens ? 6 : 8;
    return {
      w: Math.max(dens ? 72 : 88, icon + pad * 2),
      h: icon + gap + caption + pad,
    };
  }
  if (opts?.asCard || n.stylePreset === "card") {
    return estimateCardSize(n, dens, new Set(), { expanded: opts?.expanded });
  }

  let w = dens ? 168 : 212;
  let h = dens ? 48 : 60;
  const hasMeta =
    Boolean(n.tags?.length) ||
    Boolean(n.links?.length) ||
    n.dueAt != null ||
    Boolean(n.note);
  h += hasMeta ? (dens ? 20 : 26) : dens ? 8 : 10;
  const p: StylePreset = n.stylePreset;
  if (p === "title") {
    w *= 1.18;
    h *= 1.15;
  } else if (p === "decision") {
    w *= 1.08;
    h *= 1.12;
  } else if (p === "note") {
    h *= 1.12;
  }
  if (n.imageUrl) {
    w = Math.max(w, dens ? 200 : 248);
    h += dens ? 78 : 96;
  }
  return { w, h };
}

export function drawNodeShape(
  ctx: CanvasRenderingContext2D,
  preset: StylePreset,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  ctx.beginPath();
  if (preset === "decision") {
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.moveTo(cx, y);
    ctx.lineTo(x + w, cy);
    ctx.lineTo(cx, y + h);
    ctx.lineTo(x, cy);
    ctx.closePath();
  } else if (preset === "note") {
    const fold = Math.min(12, w * 0.12);
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - fold, y);
    ctx.lineTo(x + w, y + fold);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  } else if (preset === "title") {
    const r = h / 2;
    roundRectPath(ctx, x, y, w, h, r);
  } else {
    // default / risk / muted / card
    roundRectPath(ctx, x, y, w, h, radius);
  }
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Wrap text to at most `maxLines` lines within `maxWidth`. */
export function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const raw = text.replace(/\s+/g, " ").trim();
  if (!raw) return [];
  const lines: string[] = [];
  let rest = raw;
  while (rest && lines.length < maxLines) {
    if (ctx.measureText(rest).width <= maxWidth) {
      lines.push(rest);
      break;
    }
    let lo = 1;
    let hi = rest.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (ctx.measureText(rest.slice(0, mid)).width <= maxWidth) lo = mid;
      else hi = mid - 1;
    }
    let cut = Math.max(1, lo);
    const space = rest.lastIndexOf(" ", cut);
    if (space > cut * 0.4) cut = space;
    let line = rest.slice(0, cut).trimEnd();
    rest = rest.slice(cut).trimStart();
    if (lines.length === maxLines - 1 && rest) {
      while (line.length > 1 && ctx.measureText(`${line}…`).width > maxWidth) {
        line = line.slice(0, -1);
      }
      lines.push(`${line}…`);
      break;
    }
    lines.push(line);
  }
  return lines;
}

export function cardSourceLabel(n: MindNode): string | null {
  const link = n.links?.[0];
  if (!link) return null;
  if (link.title?.trim()) return link.title.trim().slice(0, 28);
  try {
    return new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    return link.url.slice(0, 28);
  }
}

export function cardTimeLabel(n: MindNode): string | null {
  const ms = n.startAt ?? n.dueAt ?? null;
  if (ms == null || !Number.isFinite(ms)) return null;
  try {
    return new Date(ms).toLocaleDateString();
  } catch {
    return null;
  }
}

export function nodeBadges(n: MindNode): string[] {
  const out: string[] = [];
  if (n.icon) {
    const glyph = ICON_GLYPH[n.icon];
    if (glyph) out.push(glyph);
  }
  if (n.collapsed) out.push("▸");
  if (n.links?.length) out.push("🔗");
  if (n.imageUrl) out.push("🖼");
  if (n.dueAt != null) out.push("⏰");
  if (n.tags?.length) out.push(`#${n.tags.length}`);
  if (n.pinned) out.push("📌");
  return out;
}

const ICON_GLYPH: Record<string, string> = {
  server: "[服]",
  database: "[库]",
  cloud: "[云]",
  person: "[人]",
  folder: "[夹]",
  doc: "[档]",
  link: "[链]",
  warning: "[警]",
  check: "[✓]",
  star: "[★]",
  gear: "[设]",
  globe: "[球]",
  router: "[路]",
};
