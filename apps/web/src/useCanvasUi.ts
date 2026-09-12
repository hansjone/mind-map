import { useEffect, useMemo, useState } from "react";
import {
  getCanvasUi,
  normalizeCanvasLocale,
  type CanvasLocale,
  type CanvasUi,
} from "./canvas-ui-text";

const MSG_TYPE = "dsh-mind-map:locale";

function readLocaleFromUrl(): CanvasLocale | null {
  try {
    const q = new URLSearchParams(window.location.search);
    const raw = q.get("lang") || q.get("locale");
    if (!raw) return null;
    return normalizeCanvasLocale(raw);
  } catch {
    return null;
  }
}

function readLocaleFromDocument(): CanvasLocale | null {
  try {
    const raw = document.documentElement?.lang;
    if (!raw) return null;
    return normalizeCanvasLocale(raw);
  } catch {
    return null;
  }
}

function initialLocale(): CanvasLocale {
  return (
    readLocaleFromUrl() ||
    readLocaleFromDocument() ||
    normalizeCanvasLocale(navigator.language)
  );
}

/**
 * Follow DSH host language: ?lang= on embed URL, then postMessage, then <html lang>.
 */
export function useCanvasUi(): { locale: CanvasLocale; U: CanvasUi } {
  const [locale, setLocale] = useState<CanvasLocale>(initialLocale);

  useEffect(() => {
    const apply = (raw: unknown) => {
      const next = normalizeCanvasLocale(raw);
      setLocale((prev) => (prev === next ? prev : next));
    };

    const onMessage = (ev: MessageEvent) => {
      const data = ev?.data;
      if (!data || typeof data !== "object") return;
      if (data.type !== MSG_TYPE) return;
      apply(data.lang ?? data.locale);
    };
    window.addEventListener("message", onMessage);

    const mo = new MutationObserver(() => {
      const fromDoc = readLocaleFromDocument();
      if (fromDoc) apply(fromDoc);
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    // Re-read URL once (in case router rewrote search without remount)
    const fromUrl = readLocaleFromUrl();
    if (fromUrl) apply(fromUrl);

    return () => {
      window.removeEventListener("message", onMessage);
      mo.disconnect();
    };
  }, []);

  const U = useMemo(() => getCanvasUi(locale), [locale]);
  return { locale, U };
}
