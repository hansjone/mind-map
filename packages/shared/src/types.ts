import { z } from "zod";

export const StylePresetSchema = z.enum([
  "default",
  "title",
  "decision",
  "risk",
  "note",
  "muted",
  "card",
]);
export type StylePreset = z.infer<typeof StylePresetSchema>;

export const EdgeKindSchema = z.enum(["hierarchy", "relation"]);
export type EdgeKind = z.infer<typeof EdgeKindSchema>;

export const DensitySchema = z.enum(["comfortable", "compact"]);
export type Density = z.infer<typeof DensitySchema>;

export const RiskProfileSchema = z.enum(["fast", "strict"]);
export type RiskProfile = z.infer<typeof RiskProfileSchema>;

export const AgentModeSchema = z.enum(["explore", "edit", "critique"]);
export type AgentMode = z.infer<typeof AgentModeSchema>;

export const NodeBadgesSchema = z.enum(["off", "icons", "tags"]);
export type NodeBadges = z.infer<typeof NodeBadgesSchema>;

export const InspectorModeSchema = z.enum(["selection", "always"]);
export type InspectorMode = z.infer<typeof InspectorModeSchema>;

/** Whole-canvas node chrome: bubble titles vs property cards. */
export const NodeViewModeSchema = z.enum(["bubble", "card"]);
export type NodeViewMode = z.infer<typeof NodeViewModeSchema>;

/** Controlled node icon set (agent/UI). */
export const NodeIconSchema = z.enum([
  "server",
  "database",
  "cloud",
  "person",
  "folder",
  "doc",
  "link",
  "warning",
  "check",
  "star",
  "gear",
  "globe",
]);
export type NodeIcon = z.infer<typeof NodeIconSchema>;

export const EdgeLineStyleSchema = z.enum(["solid", "dashed", "dotted"]);
export type EdgeLineStyle = z.infer<typeof EdgeLineStyleSchema>;

/** Arrowheads: forward = to only, both = ends, none = no arrows. */
export const EdgeDirectionSchema = z.enum(["forward", "both", "none"]);
export type EdgeDirection = z.infer<typeof EdgeDirectionSchema>;

export const SearchScopeSchema = z.enum([
  "text",
  "note",
  "tags",
  "description",
  "edge_label",
  "edge_note",
  "all",
]);
export type SearchScope = z.infer<typeof SearchScopeSchema>;

/** Free-form structured knowledge blob (JSON object). */
export const DescriptionSchema = z.record(z.string(), z.unknown());
export type NodeDescription = z.infer<typeof DescriptionSchema>;

/** #RGB or #RRGGBB */
export const AccentColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
export type AccentColor = z.infer<typeof AccentColorSchema>;

export const ViewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});
export type Viewport = z.infer<typeof ViewportSchema>;

export const LinkRefSchema = z.object({
  url: z.string().min(1),
  title: z.string().optional(),
});
export type LinkRef = z.infer<typeof LinkRefSchema>;

export const CanvasPrefsSchema = z.object({
  themeId: z.string().default("abyss"),
  branchColoring: z.boolean().default(true),
  density: DensitySchema.default("comfortable"),
  riskProfile: RiskProfileSchema.default("fast"),
  showRelationEdges: z.boolean().default(true),
  nodeBadges: NodeBadgesSchema.default("icons"),
  showHoverCard: z.boolean().default(true),
  inspectorMode: InspectorModeSchema.default("selection"),
  nodeViewMode: NodeViewModeSchema.default("card"),
});
export type CanvasPrefs = z.infer<typeof CanvasPrefsSchema>;

export const NodeSchema = z.object({
  id: z.string(),
  canvasId: z.string(),
  text: z.string(),
  /** Longer free-text body. */
  note: z.string().optional(),
  /** Structured knowledge fields (JSON object; keys free-form). */
  description: DescriptionSchema.optional(),
  collapsed: z.boolean().default(false),
  pinned: z.boolean().default(false),
  pos: z.object({ x: z.number(), y: z.number() }).nullable().optional(),
  sidePref: z.union([z.literal(-1), z.literal(0), z.literal(1)]).default(0),
  stylePreset: StylePresetSchema.default("default"),
  version: z.number().int().nonnegative(),
  tags: z.array(z.string()).default([]),
  links: z.array(LinkRefSchema).default([]),
  imageUrl: z.string().optional(),
  dueAt: z.number().optional(),
  startAt: z.number().optional(),
  /** Optional accent stroke/fill override (#RGB / #RRGGBB). */
  accentColor: AccentColorSchema.optional(),
  /** Optional controlled icon id. */
  icon: NodeIconSchema.optional(),
  /** Stable agent-facing alias (unique per canvas, lowercase). */
  alias: z.string().min(1).max(64).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().optional(),
});
export type MindNode = z.infer<typeof NodeSchema>;

export const EdgeSchema = z.object({
  id: z.string(),
  canvasId: z.string(),
  from: z.string(),
  to: z.string(),
  kind: EdgeKindSchema,
  isPrimaryParent: z.boolean().default(false),
  order: z.number().default(0),
  label: z.string().optional(),
  tags: z.array(z.string()).default([]),
  note: z.string().optional(),
  /** Relative stroke weight 1–5 (default 1). */
  weight: z.number().min(1).max(5).optional(),
  lineStyle: EdgeLineStyleSchema.optional(),
  direction: EdgeDirectionSchema.optional(),
  version: z.number().int().nonnegative(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().optional(),
});
export type MindEdge = z.infer<typeof EdgeSchema>;

export const CanvasMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  focusNodeId: z.string().nullable(),
  /** Hidden system root — not shown to users/agents; top-level nodes hang under it. */
  anchorNodeId: z.string().nullable().optional(),
  viewport: ViewportSchema,
  rev: z.number().int().nonnegative(),
  prefs: CanvasPrefsSchema,
  agentMode: AgentModeSchema.default("edit"),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().optional(),
});
export type CanvasMeta = z.infer<typeof CanvasMetaSchema>;

export type GraphSnapshot = {
  canvas: CanvasMeta;
  nodes: MindNode[];
  edges: MindEdge[];
};

export const ErrorCodeSchema = z.enum([
  "not_found",
  "version_conflict",
  "ambiguous",
  "budget_exceeded",
  "invalid_op",
  "proposal_stale",
  "cycle_rejected",
  "permission_denied",
  "mode_denied",
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const TOOL_NAMES = [
  "mindmap_list_canvases",
  "mindmap_get_context",
  "mindmap_get_spatial_context",
  "mindmap_get_subgraph",
  "mindmap_find",
  "mindmap_find_and_focus",
  "mindmap_query",
  "mindmap_get_node",
  "mindmap_export",
  "mindmap_history",
  "mindmap_redo",
  "mindmap_snapshot",
  "mindmap_restore_snapshot",
  "mindmap_propose",
  "mindmap_revise_proposal",
  "mindmap_accept_proposal",
  "mindmap_reject_proposal",
  "mindmap_apply_direct",
  "mindmap_undo",
  "mindmap_recent_changes",
  "mindmap_focus",
  "mindmap_set_mode",
] as const;
export type ToolName = (typeof TOOL_NAMES)[number];
