/** Floating property detail tip (card view hover). */

export function PropTooltip({
  label,
  value,
  x,
  y,
}: {
  label: string;
  value: string;
  x: number;
  y: number;
}) {
  return (
    <div className="prop-tooltip" style={{ left: x, top: y }} role="tooltip">
      <div className="prop-tooltip__label">{label}</div>
      <div className="prop-tooltip__value">{value}</div>
    </div>
  );
}
