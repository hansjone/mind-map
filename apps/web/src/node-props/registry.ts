import type { LinkRef, MindNode, Op } from "@mind-map/shared";
import { descriptionPreviewLine } from "./description-display";
import type { PropFieldDef, PropFieldId, VisiblePropRow } from "./types";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 32);
  }
}

function formatDate(ms?: number): string | null {
  if (ms == null || !Number.isFinite(ms)) return null;
  try {
    return new Date(ms).toLocaleDateString();
  } catch {
    return null;
  }
}

function parseDatetimeLocal(v: string): number | null {
  if (!v.trim()) return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

function parseLinks(text: string): LinkRef[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf("|");
      if (i >= 0) {
        return {
          title: line.slice(0, i).trim(),
          url: line.slice(i + 1).trim(),
        };
      }
      return { url: line };
    })
    .filter((l) => l.url);
}

function linksToText(links: LinkRef[] | undefined): string {
  return (links ?? [])
    .map((l) => (l.title ? `${l.title}|${l.url}` : l.url))
    .join("\n");
}

/** Order: title → image → note → meta → footer fields → advanced JSON. */
export const PROP_FIELDS: PropFieldDef[] = [
  {
    id: "text",
    label: "标题",
    kind: "title",
    always: true,
    rowHeight: 22,
    isEmpty: (n) => !n.text?.trim(),
    preview: (n) => n.text?.trim() || "未命名",
    commit: (nodeId, raw) => [
      { type: "update_text", nodeId, text: raw.trim() || "未命名" },
    ],
  },
  {
    id: "imageUrl",
    label: "配图",
    kind: "image",
    imageRow: true,
    rowHeight: 64,
    isEmpty: (n) => !n.imageUrl?.trim(),
    preview: (n) => n.imageUrl?.trim() || null,
    commit: (nodeId, raw) => [
      {
        type: "update_node_meta",
        nodeId,
        patch: { imageUrl: raw.trim() || null },
      },
    ],
  },
  {
    id: "note",
    label: "摘要",
    kind: "textarea",
    rowHeight: 18,
    isEmpty: (n) => !n.note?.trim(),
    preview: (n) => {
      const t = n.note?.trim();
      if (!t) return null;
      return t.length > 72 ? `${t.slice(0, 72)}…` : t;
    },
    commit: (nodeId, raw) => [
      {
        type: "update_node_meta",
        nodeId,
        patch: { note: raw.trim() || null },
      },
    ],
  },
  {
    id: "tags",
    label: "标签",
    kind: "tags",
    rowHeight: 18,
    isEmpty: (n) => !(n.tags?.length > 0),
    preview: (n) =>
      n.tags?.length ? n.tags.slice(0, 4).map((t) => `#${t}`).join(" ") : null,
    commit: (nodeId, raw) => {
      const tags = raw
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean);
      return [{ type: "update_node_meta", nodeId, patch: { tags } }];
    },
  },
  {
    id: "links",
    label: "来源",
    kind: "links",
    rowHeight: 18,
    isEmpty: (n) => !(n.links?.length > 0),
    preview: (n) => {
      const l = n.links?.[0];
      if (!l) return null;
      const head = l.title?.trim() || hostnameOf(l.url);
      const more = (n.links?.length ?? 0) > 1 ? ` +${(n.links!.length - 1)}` : "";
      return `${head}${more}`;
    },
    commit: (nodeId, raw) => [
      { type: "update_node_meta", nodeId, patch: { links: parseLinks(raw) } },
    ],
  },
  {
    id: "startAt",
    label: "开始",
    kind: "datetime",
    rowHeight: 18,
    isEmpty: (n) => n.startAt == null,
    preview: (n) => formatDate(n.startAt),
    commit: (nodeId, raw) => [
      {
        type: "update_node_meta",
        nodeId,
        patch: { startAt: parseDatetimeLocal(raw) },
      },
    ],
  },
  {
    id: "dueAt",
    label: "截止",
    kind: "datetime",
    rowHeight: 18,
    isEmpty: (n) => n.dueAt == null,
    preview: (n) => formatDate(n.dueAt),
    commit: (nodeId, raw) => [
      {
        type: "update_node_meta",
        nodeId,
        patch: { dueAt: parseDatetimeLocal(raw) },
      },
    ],
  },
  {
    id: "pinned",
    label: "固定",
    kind: "flag",
    rowHeight: 18,
    isEmpty: (n) => !n.pinned,
    preview: (n) => (n.pinned ? "已钉住" : null),
    commit: (nodeId, raw) => {
      const on = raw === "1" || raw === "true";
      return [{ type: "set_pinned", nodeId, pinned: on }];
    },
  },
  {
    id: "description",
    label: "属性",
    kind: "textarea",
    rowHeight: 36,
    isEmpty: (n) => !n.description || Object.keys(n.description).length === 0,
    preview: (n) => descriptionPreviewLine(n.description),
    commit: (nodeId, raw) => {
      // Prefer structured list editor; raw string path kept for tooling.
      const trimmed = raw.trim();
      if (!trimmed) {
        return [
          {
            type: "update_node_meta",
            nodeId,
            patch: { description: null },
          },
        ];
      }
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("description must be a JSON object");
        }
        return [
          {
            type: "update_node_meta",
            nodeId,
            patch: { description: parsed as Record<string, unknown> },
          },
        ];
      } catch {
        return [];
      }
    },
  },
];

export const PROP_FIELD_BY_ID = Object.fromEntries(
  PROP_FIELDS.map((f) => [f.id, f]),
) as Record<PropFieldId, PropFieldDef>;

/** Fields visible for display / edit given optional user-forced ids. */
export function visiblePropRows(
  node: MindNode,
  forced: ReadonlySet<string> = new Set(),
): VisiblePropRow[] {
  const out: VisiblePropRow[] = [];
  for (const def of PROP_FIELDS) {
    if (def.always || !def.isEmpty(node) || forced.has(def.id)) {
      out.push({ def, preview: def.preview(node) });
    }
  }
  return out;
}

/** Fields that can be added (currently hidden). */
export function hiddenAddableFields(
  node: MindNode,
  forced: ReadonlySet<string> = new Set(),
): PropFieldDef[] {
  return PROP_FIELDS.filter(
    (f) => !f.always && f.isEmpty(node) && !forced.has(f.id),
  );
}

export function fieldEditorSeed(node: MindNode, id: PropFieldId): string {
  switch (id) {
    case "text":
      return node.text ?? "";
    case "note":
      return node.note ?? "";
    case "description":
      return node.description
        ? JSON.stringify(node.description, null, 2)
        : "";
    case "imageUrl":
      return node.imageUrl ?? "";
    case "tags":
      return (node.tags ?? []).join(", ");
    case "links":
      return linksToText(node.links);
    case "startAt":
      return toDatetimeLocal(node.startAt);
    case "dueAt":
      return toDatetimeLocal(node.dueAt);
    case "pinned":
      return node.pinned ? "1" : "0";
    default:
      return "";
  }
}

function toDatetimeLocal(ms?: number): string {
  if (ms == null || !Number.isFinite(ms)) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function commitField(
  node: MindNode,
  id: PropFieldId,
  raw: string,
): Op[] {
  return PROP_FIELD_BY_ID[id].commit(node.id, raw, node);
}
