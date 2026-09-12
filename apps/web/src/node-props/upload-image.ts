/** Compress a local image file and upload to mind-map server. */

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image decode failed"));
    img.src = src;
  });
}

/** Resize + JPEG encode in browser; returns data URL. */
export async function compressImageFile(file: File): Promise<{
  dataUrl: string;
  mimeType: string;
}> {
  const rawUrl = await readFileAsDataUrl(file);
  const img = await loadImage(rawUrl);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  // Keep PNG only for graphics with alpha when small; otherwise JPEG.
  const preferPng =
    file.type === "image/png" && file.size < 400_000 && scale === 1;
  const mimeType = preferPng ? "image/png" : "image/jpeg";
  const dataUrl = canvas.toDataURL(
    mimeType,
    preferPng ? undefined : JPEG_QUALITY,
  );
  return { dataUrl, mimeType };
}

export async function uploadImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("请选择图片文件");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("原图过大（请小于 20MB）");
  }
  const { dataUrl, mimeType } = await compressImageFile(file);
  const res = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataBase64: dataUrl,
      mimeType,
      filename: file.name,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    url?: string;
    message?: string;
  };
  if (!res.ok || !body.ok || !body.url) {
    throw new Error(body.message || `上传失败 (${res.status})`);
  }
  return body.url;
}
