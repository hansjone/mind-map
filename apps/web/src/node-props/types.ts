import type { MindNode, Op } from "@mind-map/shared";

export type PropFieldId =
  | "text"
  | "note"
  | "description"
  | "imageUrl"
  | "tags"
  | "links"
  | "startAt"
  | "dueAt"
  | "pinned";

export type PropWidgetKind =
  | "title"
  | "textarea"
  | "image"
  | "tags"
  | "links"
  | "datetime"
  | "flag";

export type PropFieldDef = {
  id: PropFieldId;
  label: string;
  kind: PropWidgetKind;
  /** Always show even when empty (title). */
  always?: boolean;
  /** Extra height when this row is an image preview. */
  imageRow?: boolean;
  /** @deprecated Prefer dedicated list UI for description; kept for compat. */
  advanced?: boolean;
  rowHeight: number;
  isEmpty: (node: MindNode) => boolean;
  preview: (node: MindNode) => string | null;
  /** Build ops to commit a raw editor string/value. Empty clears. */
  commit: (nodeId: string, raw: string, node: MindNode) => Op[];
};

export type VisiblePropRow = {
  def: PropFieldDef;
  preview: string | null;
};
