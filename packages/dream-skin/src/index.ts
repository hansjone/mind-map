import skinsJson from "./skins.json" with { type: "json" };

export type DreamSkin = {
  id: string;
  colorScheme: "light" | "dark";
  name: string;
  nameZh: string;
  tokens: Record<string, string>;
};

export const SKINS = skinsJson as DreamSkin[];
export const DEFAULT_SKIN_ID = "abyss";

export function getSkin(id: string): DreamSkin {
  return SKINS.find((s) => s.id === id) ?? SKINS[0]!;
}

export function listSkins(): DreamSkin[] {
  return SKINS;
}

/** Apply CSS variables onto an element (usually document.documentElement). */
export function applySkinToElement(
  el: {
    style: { setProperty(k: string, v: string): void };
    dataset: { theme?: string; colorScheme?: string };
  },
  skinId: string,
): DreamSkin {
  const skin = getSkin(skinId);
  el.dataset.theme = skin.id;
  el.dataset.colorScheme = skin.colorScheme;
  for (const [key, value] of Object.entries(skin.tokens)) {
    el.style.setProperty(key, value);
  }
  return skin;
}

export type ThemeSnapshot = {
  skinId: string;
  colorScheme: "light" | "dark";
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

export function toThemeSnapshot(skinId: string): ThemeSnapshot {
  const skin = getSkin(skinId);
  const t = skin.tokens;
  return {
    skinId: skin.id,
    colorScheme: skin.colorScheme,
    bgBase: t["--dsw-alias-bg-base"] ?? "#101014",
    bgLayer1: t["--dsw-alias-bg-layer-1"] ?? "#1b1e28",
    labelPrimary: t["--dsw-alias-label-primary"] ?? "#f4f5f7",
    labelSecondary: t["--dsw-alias-label-secondary"] ?? "#a5adb8",
    brand: t["--dsw-alias-brand-primary"] ?? "#5e6ad2",
    border: t["--dsw-alias-border-l1"] ?? "rgba(255,255,255,0.08)",
    bubble: t["--dsw-specific-bubble"] ?? "rgba(37,42,58,0.9)",
    warn: t["--dsw-alias-state-warn-primary"] ?? "#f59e5b",
    error: t["--dsw-alias-state-error-primary"] ?? "#ef4444",
  };
}

/** Generate restrained branch hues from brand color. */
export function branchPalette(brandHex: string, count = 8): string[] {
  const rgb = hexToRgb(brandHex) ?? { r: 94, g: 106, b: 210 };
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const nh = (h + i * (360 / count)) % 360;
    out.push(hslToHex(nh, Math.min(0.55, s * 0.85), Math.min(0.62, Math.max(0.42, l))));
  }
  return out;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      default:
        h = ((r - g) / d + 4) * 60;
    }
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}
