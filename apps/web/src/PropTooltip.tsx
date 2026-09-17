import { useLayoutEffect, useRef, useState } from "react";

/** Floating property detail tip (card view hover / pinned for present). */

export function PropTooltip({
  label,
  value,
  x,
  y,
  pinned,
  hostW,
  hostH,
  onUnpin,
}: {
  label: string;
  value: string;
  x: number;
  y: number;
  pinned?: boolean;
  hostW: number;
  hostH: number;
  onUnpin?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      setPos({ x, y });
      return;
    }
    const pad = 10;
    const tw = el.offsetWidth;
    const th = el.offsetHeight;
    const maxX = Math.max(pad, hostW - pad - tw);
    const maxY = Math.max(pad, hostH - pad - th);
    setPos({
      x: Math.min(maxX, Math.max(pad, x)),
      y: Math.min(maxY, Math.max(pad, y)),
    });
  }, [x, y, label, value, hostW, hostH, pinned]);

  const longText = value.trim().length >= 72 || value.includes("\n");
  const className = [
    "prop-tooltip",
    pinned ? "prop-tooltip--pinned" : "",
    longText ? "prop-tooltip--long" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={ref}
      className={className}
      style={{ left: pos.x, top: pos.y }}
      role="tooltip"
      onContextMenu={(e) => {
        if (!pinned) return;
        e.preventDefault();
        e.stopPropagation();
        onUnpin?.();
      }}
      onPointerDown={(e) => {
        if (pinned) e.stopPropagation();
      }}
      onWheel={(e) => {
        // Keep scroll inside tip; do not zoom/pan the canvas behind.
        e.stopPropagation();
      }}
    >
      <div className="prop-tooltip__label">
        {label}
        {pinned ? (
          <span className="prop-tooltip__pin">钉住 · 右键释放</span>
        ) : null}
      </div>
      <div className="prop-tooltip__value">{value}</div>
    </div>
  );
}
