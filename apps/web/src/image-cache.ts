/** Shared image loader for canvas card thumbnails. */
const cache = new Map<string, HTMLImageElement | "loading" | "error">();

export function getCachedImage(
  url: string,
  onUpdate: () => void,
): HTMLImageElement | null {
  const hit = cache.get(url);
  if (hit instanceof HTMLImageElement) return hit;
  if (hit === "loading" || hit === "error") return null;

  cache.set(url, "loading");
  const img = new Image();
  img.decoding = "async";
  // Best-effort; some CDNs block canvas without CORS — we still draw when allowed.
  img.crossOrigin = "anonymous";
  img.onload = () => {
    cache.set(url, img);
    onUpdate();
  };
  img.onerror = () => {
    cache.set(url, "error");
    onUpdate();
  };
  img.src = url;
  return null;
}

export function imageLoadFailed(url: string): boolean {
  return cache.get(url) === "error";
}
