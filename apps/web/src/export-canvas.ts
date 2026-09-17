/** Client-side canvas / file export helpers. */

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

export function downloadText(text: string, filename: string, mime: string) {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

/** Rasterize the on-screen canvas (current viewport) to PNG. */
export function exportCanvasPng(
  el: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    el.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("png_encode_failed"));
          return;
        }
        downloadBlob(blob, filename);
        resolve();
      },
      "image/png",
    );
  });
}

/** Fit view → wait for paint → PNG of full graph in viewport. */
export async function exportFitPng(opts: {
  fitView: () => void;
  canvas: HTMLCanvasElement;
  filename: string;
}): Promise<void> {
  opts.fitView();
  await new Promise<void>((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r())),
  );
  await new Promise((r) => setTimeout(r, 40));
  await exportCanvasPng(opts.canvas, opts.filename);
}

export async function exportSvgFromApi(
  canvasId: string,
  filename: string,
): Promise<void> {
  const res = await fetch(`/api/canvases/${encodeURIComponent(canvasId)}/export.svg`);
  if (!res.ok) throw new Error(`svg_export_${res.status}`);
  const text = await res.text();
  downloadText(text, filename, "image/svg+xml;charset=utf-8");
}
