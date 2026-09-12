/** Read DSH / host CSS tokens (with dark fallbacks). */
export type SystemTheme = {
  bgBase: string;
  bgLayer1: string;
  labelPrimary: string;
  labelSecondary: string;
  brand: string;
  border: string;
  bubble: string;
  warn: string;
  error: string;
};

const FALLBACK: SystemTheme = {
  bgBase: "#101014",
  bgLayer1: "#1b1e28",
  labelPrimary: "#f4f5f7",
  labelSecondary: "#a5adb8",
  brand: "#5e6ad2",
  border: "rgba(255,255,255,0.08)",
  bubble: "rgba(37,42,58,0.9)",
  warn: "#f59e5b",
  error: "#ef4444",
};

const VAR_MAP: { key: keyof SystemTheme; css: string }[] = [
  { key: "bgBase", css: "--dsw-alias-bg-base" },
  { key: "bgLayer1", css: "--dsw-alias-bg-layer-1" },
  { key: "labelPrimary", css: "--dsw-alias-label-primary" },
  { key: "labelSecondary", css: "--dsw-alias-label-secondary" },
  { key: "brand", css: "--dsw-alias-brand-primary" },
  { key: "border", css: "--dsw-alias-border-l1" },
  { key: "bubble", css: "--dsw-specific-bubble" },
  { key: "warn", css: "--dsw-alias-state-warn-primary" },
  { key: "error", css: "--dsw-alias-state-error-primary" },
];

function cssVar(name: string): string {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  } catch {
    return "";
  }
}

/** Apply theme tokens from query string (host → iframe). */
export function applyThemeFromQuery(search = window.location.search): void {
  const q = new URLSearchParams(search);
  const root = document.documentElement;
  for (const { key, css } of VAR_MAP) {
    const v = q.get(`t_${key}`);
    if (v) root.style.setProperty(css, decodeURIComponent(v));
  }
  const scheme = q.get("colorScheme");
  if (scheme === "light" || scheme === "dark") {
    root.dataset.colorScheme = scheme;
  }
}

export function readSystemTheme(): SystemTheme {
  const out = { ...FALLBACK };
  for (const { key, css } of VAR_MAP) {
    const v = cssVar(css);
    if (v) out[key] = v;
  }
  return out;
}

/** Snapshot DSH page tokens for embedding into iframe URL. */
export function snapshotHostTheme(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key, css } of VAR_MAP) {
    const v = cssVar(css);
    if (v) out[`t_${key}`] = v;
  }
  try {
    const scheme =
      document.documentElement.dataset.colorScheme ||
      (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    out.colorScheme = scheme;
  } catch {
    out.colorScheme = "dark";
  }
  return out;
}

/** Simple branch hues from brand (same idea as dream-skin.branchPalette). */
export function branchPalette(brand: string, count = 8): string[] {
  const hex = brand.startsWith("#") ? brand : FALLBACK.brand;
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1]!, 16) : 0x5e6ad2;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const rr = r / 255;
    const gg = g / 255;
    const bb = b / 255;
    switch (max) {
      case rr:
        h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
        break;
      case gg:
        h = ((bb - rr) / d + 2) / 6;
        break;
      default:
        h = ((rr - gg) / d + 4) / 6;
    }
  }
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const nh = (h * 360 + i * (360 / count)) % 360;
    const ns = Math.min(0.55, s * 0.85);
    const nl = Math.min(0.62, Math.max(0.42, l));
    out.push(hslToHex(nh, ns, nl));
  }
  return out;
}

function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
