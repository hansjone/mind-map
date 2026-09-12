export * from "./types.js";
export * from "./ops.js";
export * from "./resolve-ops.js";
export * from "./graph-query.js";

export function now(): number {
  return Date.now();
}

export function newId(prefix = "n"): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

/** Fit camera so content bbox fills a virtual viewport (server-side auto_fit). */
export function computeFitViewport(
  positions: Record<string, { x: number; y: number }>,
  opts?: {
    padding?: number;
    viewW?: number;
    viewH?: number;
    nodeW?: number;
    nodeH?: number;
  },
): { x: number; y: number; zoom: number } {
  const pad = opts?.padding ?? 50;
  const viewW = opts?.viewW ?? 1280;
  const viewH = opts?.viewH ?? 800;
  const nodeW = opts?.nodeW ?? 160;
  const nodeH = opts?.nodeH ?? 44;
  const pts = Object.values(positions);
  if (!pts.length) return { x: 0, y: 0, zoom: 1 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x - nodeW / 2);
    maxX = Math.max(maxX, p.x + nodeW / 2);
    minY = Math.min(minY, p.y - nodeH / 2);
    maxY = Math.max(maxY, p.y + nodeH / 2);
  }
  minX -= pad;
  maxX += pad;
  minY -= pad;
  maxY += pad;
  const bw = Math.max(40, maxX - minX);
  const bh = Math.max(40, maxY - minY);
  const zoom = Math.min(
    2.5,
    Math.max(0.12, Math.min((viewW * 0.86) / bw, (viewH * 0.86) / bh)),
  );
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return { x: -cx * zoom, y: -cy * zoom, zoom };
}
