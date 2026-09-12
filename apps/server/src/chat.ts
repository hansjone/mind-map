import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, type CoreMessage } from "ai";
import { z } from "zod";
import type { ToolContext } from "./tools.js";
import { buildSpatialContext, runTool } from "./tools.js";

export function llmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY || process.env.OPENAI_API_KEY);
}

export function llmStatus(sourceHint?: "dsh" | "env" | "none") {
  const configured = llmConfigured();
  const viaDsh =
    sourceHint === "dsh" ||
    process.env.MINDMAP_LLM_SOURCE === "dsh" ||
    Boolean(process.env.MINDMAP_DSH_PROVIDER);
  return {
    configured,
    source: viaDsh ? "dsh" : configured ? "env" : "none",
    provider: process.env.MINDMAP_DSH_PROVIDER || undefined,
    model:
      process.env.MINDMAP_DSH_MODEL ||
      process.env.LLM_MODEL ||
      "deepseek-chat",
    baseURL: process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || undefined,
  };
}

function getModel() {
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "missing";
  const baseURL =
    process.env.LLM_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.deepseek.com/v1";
  // When bridged through DSH OpenAI shim, model id is ignored by the shim;
  // settings card provider/model win on the host side.
  const modelId = process.env.LLM_MODEL || "deepseek-chat";
  const provider = createOpenAI({ apiKey, baseURL });
  return provider(modelId);
}

const OpZ = z
  .object({
    type: z.string().describe("Op discriminator: create_node | link | update_text | … (NOT `op`)"),
  })
  .passthrough();

export function createChatHandler(ctx: ToolContext) {
  return async function handleChat(body: {
    canvasId: string;
    messages: { role: "user" | "assistant" | "system"; content: string }[];
  }) {
    const canvasId = body.canvasId;
    const spatial = buildSpatialContext(ctx.store, canvasId);
    const system = `你是 Mind Map 画布上的 AI 协作者。图是唯一事实源。
规则：
1. 先用 mindmap_get_spatial_context / mindmap_find 定位，禁止臆造节点 ID。找边用 searchScope=edge_label|edge_note。
2. find 返回 ambiguous=true 时必须向用户反问，不得自行挑选。
3. 快速档(riskProfile=fast)：低风险用 mindmap_apply_direct（新建、改文本、关联、样式）；删除/换父等用 mindmap_propose。
4. 严格档：一律 propose，等用户接受。
5. 禁止输出整棵树 JSON 覆盖；只提交增量 ops。每个 op 必须用字段 type（禁止用 op）。
6. 对话里先用自然语言说明你在做什么；工具会改图。
7. 用户若说「特朗普家族」等关系梳理：围绕焦点创建人物节点与 relation/hierarchy 边，边可带 label（如配偶、子女）。link 示例：{"type":"link","from":"...","to":"...","kind":"relation","label":"配偶"}。
8. 固定坐标用 set_pinned 或 create_node 带 pos；不确定时 mindmap_get_schema。
9. 节点属性：标题用 update_text；描述/多标签/多链接/图片URL/时间用 update_node_meta（patch）；边用 update_edge_meta 或 set_edge_label。
10. 节点类型 stylePreset：default|card|title|decision|risk|note|muted（title 仅画布锚点，勿新建；card=新闻快照卡片，配图用 imageUrl、摘要用 note、来源用 links）。
11. 同级排序用 reorder：优先 {"type":"reorder","nodeId":"...","order":10}；也可用 afterSiblingId（null=置顶）。
12. 折叠 set_collapsed 会隐藏该节点主父链下的全部子孙并重新布局；展开后恢复。
13. 问图：用 mindmap_query（neighbors|path|stats|orphans|missing_meta）；答完可用 mindmap_highlight 高亮路径；细节用 mindmap_get_node / mindmap_get_edge。禁止编造图中没有的事实。

当前空间上下文（摘要）：
${JSON.stringify(spatial, null, 0).slice(0, 6000)}
`;

    const toolCtx: ToolContext = { ...ctx, defaultCanvasId: canvasId };

    const result = streamText({
      model: getModel(),
      system,
      messages: body.messages as CoreMessage[],
      maxSteps: 10,
      tools: {
        mindmap_get_spatial_context: tool({
          description: "获取选区/视口/外围簇等空间上下文",
          parameters: z.object({ canvasId: z.string().optional() }),
          execute: async (args) => runTool("mindmap_get_spatial_context", args, toolCtx),
        }),
        mindmap_find: tool({
          description:
            "检索节点或边；searchScope=text|note|tags|description|edge_label|edge_note|all；可能返回 ambiguous",
          parameters: z.object({
            query: z.string(),
            searchScope: z
              .enum([
                "text",
                "note",
                "tags",
                "description",
                "edge_label",
                "edge_note",
                "all",
              ])
              .optional(),
            canvasId: z.string().optional(),
          }),
          execute: async (args) => runTool("mindmap_find", args, toolCtx),
        }),
        mindmap_query: tool({
          description:
            "图问答：neighbors|path|stats|orphans|missing_meta。path 含 paths[].edges；stats 含 longestPath/mostConnected",
          parameters: z.object({
            op: z.enum(["neighbors", "path", "stats", "orphans", "missing_meta"]),
            node: z.string().optional(),
            nodeId: z.string().optional(),
            from: z.string().optional(),
            to: z.string().optional(),
            depth: z.number().optional(),
            maxHops: z.number().optional(),
            direction: z.enum(["out", "in", "both"]).optional(),
            edgeKinds: z.enum(["all", "hierarchy", "relation"]).optional(),
            throughRelationNodes: z.boolean().optional(),
            canvasId: z.string().optional(),
          }),
          execute: async (args) =>
            runTool("mindmap_query", args as Record<string, unknown>, toolCtx),
        }),
        mindmap_get_node: tool({
          description: "读单个节点详情（description/note/tags/links）",
          parameters: z.object({
            nodeId: z.string(),
            fields: z.array(z.enum(["all", "description", "note", "tags", "links"])).optional(),
            canvasId: z.string().optional(),
          }),
          execute: async (args) => runTool("mindmap_get_node", args, toolCtx),
        }),
        mindmap_get_edge: tool({
          description: "读单条边详情（label/weight/lineStyle/direction/note）",
          parameters: z.object({
            edgeId: z.string(),
            fields: z.array(z.enum(["all", "label", "meta"])).optional(),
            canvasId: z.string().optional(),
          }),
          execute: async (args) => runTool("mindmap_get_edge", args, toolCtx),
        }),
        mindmap_highlight: tool({
          description: "在画布上高亮节点/边（临时，不改图）；问答后可视化路径",
          parameters: z.object({
            nodeIds: z.array(z.string()).optional(),
            edgeIds: z.array(z.string()).optional(),
            ttlMs: z.number().optional(),
            style: z
              .object({
                nodeColor: z.string().optional(),
                nodeGlow: z.boolean().optional(),
                edgeWidth: z.number().optional(),
                edgeColor: z.string().optional(),
              })
              .optional(),
            canvasId: z.string().optional(),
          }),
          execute: async (args) =>
            runTool("mindmap_highlight", args as Record<string, unknown>, toolCtx),
        }),
        mindmap_get_subgraph: tool({
          description: "读取以某节点为根的子图（depth<=3）",
          parameters: z.object({
            rootId: z.string().optional(),
            depth: z.number().optional(),
            canvasId: z.string().optional(),
          }),
          execute: async (args) => runTool("mindmap_get_subgraph", args, toolCtx),
        }),
        mindmap_apply_direct: tool({
          description: "快速档直接应用低风险 ops",
          parameters: z.object({
            ops: z.array(OpZ),
            summary: z.string().optional(),
            canvasId: z.string().optional(),
          }),
          execute: async (args) =>
            runTool("mindmap_apply_direct", args as Record<string, unknown>, toolCtx),
        }),
        mindmap_propose: tool({
          description: "提交待确认提案（高风险或严格档）",
          parameters: z.object({
            ops: z.array(OpZ),
            rationale: z.string(),
            canvasId: z.string().optional(),
          }),
          execute: async (args) =>
            runTool("mindmap_propose", args as Record<string, unknown>, toolCtx),
        }),
        mindmap_focus: tool({
          description: "移动视觉焦点",
          parameters: z.object({
            nodeId: z.string(),
            canvasId: z.string().optional(),
          }),
          execute: async (args) => runTool("mindmap_focus", args, toolCtx),
        }),
      },
    });

    return result;
  };
}
