import type { MindNode } from "@mind-map/shared";

export function HoverCard({
  node,
  x,
  y,
}: {
  node: MindNode;
  x: number;
  y: number;
}) {
  const tags = (node.tags ?? []).slice(0, 4);
  const note = (node.note ?? "").trim();
  const links = node.links?.length ?? 0;
  return (
    <div className="hover-card" style={{ left: x, top: y }}>
      <div className="hover-card__title">{node.text}</div>
      {note ? <div className="hover-card__note">{note.slice(0, 120)}</div> : null}
      {tags.length ? (
        <div className="hover-card__tags">
          {tags.map((t) => (
            <span key={t} className="hover-card__tag">
              {t}
            </span>
          ))}
        </div>
      ) : null}
      <div className="hover-card__meta">
        {links ? `${links} 链接` : null}
        {node.dueAt != null
          ? `${links ? " · " : ""}截止 ${new Date(node.dueAt).toLocaleDateString()}`
          : null}
        {node.stylePreset !== "default" ? `${links || node.dueAt ? " · " : ""}${node.stylePreset}` : null}
      </div>
    </div>
  );
}
