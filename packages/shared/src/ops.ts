import { z } from "zod";
import {
  AccentColorSchema,
  DescriptionSchema,
  EdgeDirectionSchema,
  EdgeLineStyleSchema,
  LinkRefSchema,
  NodeIconSchema,
  StylePresetSchema,
  ViewportSchema,
} from "./types.js";

export const OP_TYPES = [
  "create_node",
  "batch_create",
  "batch_link",
  "update_text",
  "update_node_meta",
  "move_node",
  "reorder",
  "set_primary_parent",
  "link",
  "unlink",
  "delete_node",
  "restore_node",
  "set_pinned",
  "set_collapsed",
  "set_style_preset",
  "set_edge_label",
  "update_edge_meta",
  "set_prefs",
  "set_focus",
  "set_viewport",
  "auto_fit",
] as const;

export type OpType = (typeof OP_TYPES)[number];

const PosSchema = z.object({ x: z.number(), y: z.number() });

/** Outgoing graph edges declared on create / batch_create (not URL bookmarks). */
export const InlineRelationSchema = z.object({
  to: z.string(),
  kind: z.enum(["hierarchy", "relation"]).default("relation"),
  label: z.string().optional(),
  weight: z.number().min(1).max(5).optional(),
  lineStyle: EdgeLineStyleSchema.optional(),
  direction: EdgeDirectionSchema.optional(),
});
export type InlineRelation = z.infer<typeof InlineRelationSchema>;

const NodeMetaPatchSchema = z.object({
  note: z.string().nullable().optional(),
  description: DescriptionSchema.nullable().optional(),
  tags: z.array(z.string()).optional(),
  links: z.array(LinkRefSchema).optional(),
  imageUrl: z.string().nullable().optional(),
  dueAt: z.number().nullable().optional(),
  startAt: z.number().nullable().optional(),
  accentColor: AccentColorSchema.nullable().optional(),
  icon: NodeIconSchema.nullable().optional(),
  alias: z.string().min(1).max(64).nullable().optional(),
});

const EdgeMetaPatchSchema = z.object({
  label: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  note: z.string().nullable().optional(),
  weight: z.number().min(1).max(5).nullable().optional(),
  lineStyle: EdgeLineStyleSchema.nullable().optional(),
  direction: EdgeDirectionSchema.nullable().optional(),
});

const CreateNodeFieldsSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  parentId: z.string().nullable().optional(),
  sidePref: z.union([z.literal(-1), z.literal(0), z.literal(1)]).optional(),
  stylePreset: StylePresetSchema.optional(),
  /** Optional absolute position; implies pinned=true when set. */
  pos: PosSchema.optional(),
  pinned: z.boolean().optional(),
  note: z.string().optional(),
  description: DescriptionSchema.optional(),
  tags: z.array(z.string()).optional(),
  /** URL bookmarks (not graph edges). */
  links: z.array(LinkRefSchema).optional(),
  /** Outgoing graph edges created with this node. */
  relations: z.array(InlineRelationSchema).optional(),
  imageUrl: z.string().optional(),
  dueAt: z.number().optional(),
  startAt: z.number().optional(),
  accentColor: AccentColorSchema.optional(),
  icon: NodeIconSchema.optional(),
  /** Agent-friendly handle; later refs use @alias or bare alias. */
  alias: z.string().min(1).max(64).optional(),
});

export const OpSchema = z.discriminatedUnion("type", [
  CreateNodeFieldsSchema.extend({
    type: z.literal("create_node"),
  }),
  z.object({
    type: z.literal("batch_create"),
    nodes: z.array(CreateNodeFieldsSchema).min(1).max(200),
  }),
  z.object({
    type: z.literal("batch_link"),
    edges: z
      .array(
        z.object({
          from: z.string(),
          to: z.string(),
          kind: z.enum(["hierarchy", "relation"]).default("relation"),
          label: z.string().optional(),
          asPrimary: z.boolean().optional(),
          weight: z.number().min(1).max(5).optional(),
          lineStyle: EdgeLineStyleSchema.optional(),
          direction: EdgeDirectionSchema.optional(),
        }),
      )
      .min(1)
      .max(100),
  }),
  z.object({
    type: z.literal("update_text"),
    nodeId: z.string(),
    text: z.string(),
    expectedVersion: z.number().optional(),
  }),
  z.object({
    type: z.literal("update_node_meta"),
    nodeId: z.string(),
    patch: NodeMetaPatchSchema,
    expectedVersion: z.number().optional(),
  }),
  z.object({
    type: z.literal("move_node"),
    nodeId: z.string(),
    newParentId: z.string().nullable(),
    sidePref: z.union([z.literal(-1), z.literal(0), z.literal(1)]).optional(),
    order: z.number().optional(),
    expectedVersion: z.number().optional(),
  }),
  z.object({
    type: z.literal("reorder"),
    nodeId: z.string(),
    /** Numeric sibling sort key on the primary hierarchy edge (preferred). */
    order: z.number().optional(),
    /**
     * Convenience alias: place after this sibling under the same parent.
     * `null` = move to front. Server resolves to `order` when applying.
     */
    afterSiblingId: z.string().nullable().optional(),
  }),
  z.object({
    type: z.literal("set_primary_parent"),
    nodeId: z.string(),
    edgeId: z.string(),
  }),
  z.object({
    type: z.literal("link"),
    from: z.string(),
    to: z.string(),
    kind: z.enum(["hierarchy", "relation"]),
    label: z.string().optional(),
    asPrimary: z.boolean().optional(),
    weight: z.number().min(1).max(5).optional(),
    lineStyle: EdgeLineStyleSchema.optional(),
    direction: EdgeDirectionSchema.optional(),
  }),
  z.object({
    type: z.literal("unlink"),
    edgeId: z.string(),
  }),
  z.object({
    type: z.literal("delete_node"),
    nodeId: z.string(),
  }),
  z.object({
    type: z.literal("restore_node"),
    nodeId: z.string(),
  }),
  z.object({
    type: z.literal("set_pinned"),
    nodeId: z.string(),
    pinned: z.boolean(),
    pos: PosSchema.optional(),
  }),
  z.object({
    type: z.literal("set_collapsed"),
    nodeId: z.string(),
    collapsed: z.boolean(),
  }),
  z.object({
    type: z.literal("set_style_preset"),
    nodeId: z.string(),
    stylePreset: StylePresetSchema,
  }),
  z.object({
    type: z.literal("set_edge_label"),
    edgeId: z.string(),
    label: z.string(),
  }),
  z.object({
    type: z.literal("update_edge_meta"),
    edgeId: z.string(),
    patch: EdgeMetaPatchSchema,
    expectedVersion: z.number().optional(),
  }),
  z.object({
    type: z.literal("set_prefs"),
    prefs: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal("set_focus"),
    nodeId: z.string(),
  }),
  z.object({
    type: z.literal("set_viewport"),
    viewport: ViewportSchema,
  }),
  z.object({
    type: z.literal("auto_fit"),
    /** Extra world-space padding around content bbox (default 50). */
    padding: z.number().min(0).max(400).optional(),
  }),
]);

export type Op = z.infer<typeof OpSchema>;

/** Accept agent typos: op / operation → type. */
export function coerceOpInput(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const o = { ...(raw as Record<string, unknown>) };
  if (o.type == null) {
    if (typeof o.op === "string") o.type = o.op;
    else if (typeof o.operation === "string") o.type = o.operation;
  }
  delete o.op;
  delete o.operation;
  return o;
}

export function parseOps(
  raw: unknown,
):
  | { ok: true; ops: Op[] }
  | {
      ok: false;
      error: "invalid_op";
      message: string;
      validTypes: readonly string[];
      issues?: unknown;
    } {
  if (!Array.isArray(raw)) {
    return {
      ok: false,
      error: "invalid_op",
      message: "ops must be an array of objects with discriminator field `type` (not `op`).",
      validTypes: OP_TYPES,
    };
  }
  if (raw.length === 0) {
    return {
      ok: false,
      error: "invalid_op",
      message: "ops array is empty",
      validTypes: OP_TYPES,
    };
  }
  const coerced = raw.map(coerceOpInput);
  const parsed = z.array(OpSchema).safeParse(coerced);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const hint =
      first?.path?.join(".") === "0.type" || String(first?.message || "").includes("discriminator")
        ? " Each op MUST use field `type` (e.g. {\"type\":\"create_node\",\"text\":\"...\",\"parentId\":\"...\"}). Do not use `op`."
        : "";
    return {
      ok: false,
      error: "invalid_op",
      message: `Invalid ops: ${first?.message ?? "schema error"}.${hint}`,
      validTypes: OP_TYPES,
      issues: parsed.error.issues.slice(0, 8),
    };
  }
  for (const op of parsed.data) {
    if (
      op.type === "reorder" &&
      op.order == null &&
      op.afterSiblingId === undefined
    ) {
      return {
        ok: false,
        error: "invalid_op",
        message:
          'reorder requires `order` (number) or `afterSiblingId` (sibling id | null for first). Example: {"type":"reorder","nodeId":"...","order":10}',
        validTypes: OP_TYPES,
      };
    }
  }
  return { ok: true, ops: parsed.data };
}

export const OP_SCHEMA_DOC = {
  discriminator: "type",
  note: "Use `type`, never `op` / `operation`. Prefer batch_create for trees. There is no visible root node — omit parentId for top-level creates.",
  validTypes: OP_TYPES,
  examples: [
    {
      type: "batch_create",
      nodes: [
        { text: "数通产品线", alias: "datacom" },
        {
          text: "数据中心交换机",
          alias: "dc_switch",
          parentId: "@datacom",
        },
        {
          text: "AIOps诊断",
          alias: "aiops",
          parentId: "@datacom",
          description: {
            function: "故障根因诊断",
            inputs: ["指标", "日志"],
            sla: "30秒内输出",
          },
          relations: [
            { to: "@restart", label: "触发重启", kind: "relation" },
          ],
        },
        { text: "自动重启", alias: "restart", parentId: "@datacom" },
      ],
      _comment: "Two-pass: all nodes first, then parents/relations. Max 200.",
    },
    {
      type: "batch_link",
      edges: [
        { from: "@daiyu", to: "@baoyu", kind: "relation", label: "知己" },
        { from: "@baoyu", to: "@baochai", kind: "relation", label: "金玉良缘" },
      ],
      _comment: "Bulk relation/hierarchy links (max 100). Prefer after nodes exist.",
    },
    {
      type: "create_node",
      text: "核心交换机",
      alias: "core_sw",
      icon: "router",
    },
    {
      type: "create_node",
      text: "AIOps诊断",
      alias: "aiops",
      relations: [{ to: "@restart", label: "触发重启", kind: "relation" }],
      _comment: "relations = graph edges; links = URL bookmarks",
    },
    { type: "create_node", text: "贾宝玉" },
    {
      type: "create_node",
      text: "贾政",
      parentId: "<visibleParentId>",
    },
    {
      type: "link",
      from: "<fromNodeId>",
      to: "<toNodeId>",
      kind: "relation",
      label: "木石前盟",
    },
    {
      type: "create_node",
      text: "AIOps",
      alias: "aiops",
      _comment: "Later refs: parentId:'@aiops' or parentText:'AIOps'",
    },
    {
      type: "create_node",
      text: "自动重启",
      parentId: "@aiops",
    },
    {
      type: "link",
      from: "@aiops",
      to: "自动重启",
      kind: "relation",
      label: "诊断→重启",
      _comment:
        "from/to accept id, @alias, or unique title. Or use fromText/toText before resolve.",
    },
    { type: "update_text", nodeId: "<id>", text: "新文案" },
    {
      type: "update_node_meta",
      nodeId: "@aiops",
      patch: {
        note: "自由文本备注",
        description: {
          function: "故障根因诊断",
          owner: "SRE团队",
        },
        tags: ["人物", "贾府"],
        links: [{ url: "https://example.com", title: "百科" }],
        accentColor: "#e74c3c",
        icon: "person",
        alias: "aiops",
        dueAt: null,
      },
    },
    {
      type: "update_edge_meta",
      edgeId: "<edgeId>",
      patch: {
        label: "配偶",
        tags: ["亲属"],
        weight: 3,
        lineStyle: "dashed",
        direction: "both",
        note: null,
      },
    },
    {
      type: "set_pinned",
      nodeId: "<id>",
      pinned: true,
      pos: { x: 120, y: -80 },
      _comment: "Pure position move / lock — prefer this over move_node",
    },
    {
      type: "move_node",
      nodeId: "<id>",
      newParentId: "<visibleParentId or null for top-level>",
      _comment:
        "Reparent only (change hierarchy parent). To change x/y only, use set_pinned + pos instead.",
    },
    { type: "set_edge_label", edgeId: "<edgeId>", label: "配偶" },
    {
      type: "reorder",
      nodeId: "<id>",
      order: 10,
      _comment:
        "Changes sibling sort; also unpins so auto-layout can move the node visually.",
    },
    {
      type: "reorder",
      nodeId: "<id>",
      afterSiblingId: "<siblingId or null for first>",
      _comment: "Optional alias; server resolves to order",
    },
    {
      type: "set_collapsed",
      nodeId: "<id>",
      collapsed: true,
      _comment: "Hides hierarchy descendants from layout/viewport until expanded",
    },
    {
      type: "set_style_preset",
      nodeId: "@baoyu",
      stylePreset: "decision",
      _comment: "Field is stylePreset (not preset). Values: default|title|decision|risk|note|muted|card",
    },
    {
      type: "unlink",
      edgeId: "<edgeId>",
      _comment:
        "Prefer edgeId when multiple edges exist between the same pair. Sugar from+to(+kind) only works if exactly one live match — label is ignored.",
    },
    {
      type: "unlink",
      from: "@daiyu",
      to: "@baoyu",
      kind: "relation",
      _comment:
        "Sugar form; fails with ambiguous if >1 edge of that kind between the pair — then use edgeId.",
    },
    {
      type: "restore_node",
      nodeId: "<softDeletedNodeId>",
      _comment:
        "Restores a soft-deleted node (+ compatible incident edges). Use the same id returned by delete_node; @alias/title of deleted nodes also work.",
    },
    {
      type: "auto_fit",
      padding: 50,
      _comment: "Fit camera to content bbox after layout; pair with batch_create",
    },
  ],
  opNotes: {
    batch_create:
      "Create up to 200 nodes in one op. Two-pass (nodes then parents/relations) so forward @alias refs work. Prefer this over many create_node calls.",
    batch_link:
      "Create up to 100 edges in one op: {type:'batch_link', edges:[{from,to,kind,label,...}]}. from/to accept id|@alias|title.",
    move_node:
      "Requires newParentId (visible parent id, or null for top-level). Changes hierarchy parent only — NOT free-drag. Position → set_pinned + pos.",
    link:
      "kind: hierarchy | relation. from/to: node id, @alias, or unique title. Wire sugar: fromText/toText (resolved server-side before apply).",
    unlink:
      "Remove an edge. Prefer {type:'unlink', edgeId} (exact). Sugar: {from, to, kind?} with id|@alias|title — server resolves to edgeId when unique. If multiple edges share the same from+to(+kind), sugar is ambiguous → must use edgeId (label is NOT a disambiguator).",
    set_style_preset:
      "Field name is stylePreset (not preset). Example: {type:'set_style_preset', nodeId:'@x', stylePreset:'risk'}.",
    restore_node:
      "Soft-deleted nodes keep their id. Pass that id (or deleted @alias / unique title). Restores compatible incident edges; children already promoted stay under the new parent.",
    create_node:
      "Omit parentId for top-level. Optional pos pins immediately. Optional alias. Optional icon (server|database|cloud|person|folder|doc|link|warning|check|star|gear|globe|router). Optional relations[] for outgoing graph edges (not URL links). Optional description object.",
    update_node_meta:
      "Patch note/description/tags/links/imageUrl/dueAt/startAt/accentColor/icon/alias. icon enum same as create_node. description is a JSON object (knowledge fields). Null clears scalar fields. links = URL bookmarks.",
    set_prefs:
      "Partial canvas prefs: density, branchColoring, nodeViewMode (bubble|card|topology; canvas-global), showHoverCard, nodeBadges, showRelationEdges, riskProfile, themeId, inspectorMode.",
    update_edge_meta:
      "Patch label/tags/note/weight(1-5)/lineStyle(solid|dashed|dotted)/direction(forward|both|none) on an edge.",
    set_edge_label: "Need edgeId from spatial_context.edges or get_subgraph.",
    reorder:
      "Sibling order on primary hierarchy edge. Also unpins the node so auto-layout can move it. Example: {\"type\":\"reorder\",\"nodeId\":\"…\",\"order\":0}. Optional afterSiblingId (null=first).",
    set_collapsed:
      "Recursively hides ALL hierarchy descendants (via primary parent edges) from viewport/layout. Relation-only neighbors stay. Coordinates of collapsed nodes are preserved; expand restores them in place. Does not delete data.",
    auto_fit:
      "Camera fit to laid-out content. Does not reflow flextree sides. Optional padding (world units, default 50).",
  },
  highRisk: ["delete_node", "move_node", "set_primary_parent"],
  layout:
    "No visible root. Prefer batch_create for trees. Pin with set_pinned + pos. After big creates, call auto_fit. Agent refs: prefer alias over raw ids.",
  refs: {
    alias: "create_node.alias / batch_create → reference as @alias in parentId/nodeId/from/to/relations.to / get_subgraph.rootId",
    text: "Unique exact title also works as from/to/parentId; duplicates → ambiguous error",
    applyResponse: "mindmap_apply_direct returns nodeIdMap { text|@alias → id }",
  },
};
