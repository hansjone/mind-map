/**
 * Register mindmap_* tools that call the local mind-map HTTP API.
 * Plain ToolDefinition objects (same style as dsh-ops-cron).
 */

function text(value) {
  return [{ type: 'text', text: String(value ?? '') }]
}

function jsonText(value) {
  return text(typeof value === 'string' ? value : JSON.stringify(value, null, 0))
}

async function callTool(getBase, name, args) {
  const base = getBase?.()
  if (!base) throw new Error('mind-map server is not running')
  const res = await fetch(`${base}/api/tools/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(args || {}),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body.message || body.error || `HTTP ${res.status}`)
    err.code = body.error || 'TOOL_HTTP'
    throw err
  }
  return body
}

const OBJECT = {
  type: 'object',
  additionalProperties: true,
}

const OP_ITEM = {
  type: 'object',
  additionalProperties: true,
  description:
    'Graph op. REQUIRED discriminator field is `type` (NOT `op`). Examples: {"type":"create_node","text":"贾宝玉","parentId":"..."}, {"type":"link","from":"...","to":"...","kind":"relation","label":"木石前盟"}, {"type":"set_pinned","nodeId":"...","pinned":true,"pos":{"x":120,"y":-80}}',
  properties: {
    type: {
      type: 'string',
      description:
        'Op kind: create_node | update_text | link | unlink | set_pinned | set_focus | set_collapsed | set_style_preset | set_edge_label | set_prefs | move_node | delete_node | …',
    },
  },
  required: ['type'],
}

export function mindmapToolDefinitions(getBase, getCanvasIdForSession, setActiveCanvas, queueUiOpen) {
  /** Tools that must open/switch the right-panel canvas. */
  const HARD_OPEN_UI = new Set(['mindmap_create_canvas', 'mindmap_open_canvas'])
  /** Soft reveal: bind session + open tab only if needed (client dedupes). */
  const SOFT_REVEAL_UI = new Set([
    'mindmap_query',
    'mindmap_find',
    'mindmap_find_and_focus',
    'mindmap_get_node',
    'mindmap_get_edge',
    'mindmap_highlight',
    'mindmap_get_spatial_context',
    'mindmap_get_subgraph',
    'mindmap_focus',
    'mindmap_apply_direct',
    'mindmap_propose',
    'mindmap_accept_proposal',
    'mindmap_export',
  ])

  const run = (name) => async (args, exec) => {
    const sessionId = String(
      exec?.agent?.session?.id ||
        exec?.agent?.session?.header?.id ||
        exec?.sessionId ||
        '',
    ).trim()
    const bound =
      typeof getCanvasIdForSession === 'function' && sessionId
        ? getCanvasIdForSession(sessionId)
        : null
    const payload = {
      ...(args || {}),
      canvasId: args?.canvasId || bound || undefined,
      sessionId: sessionId || undefined,
    }
    const body = await callTool(getBase, name, payload)

    if (name === 'mindmap_delete_canvas' && sessionId && typeof setActiveCanvas === 'function') {
      const deleted = args?.canvasId || bound
      const still = getCanvasIdForSession?.(sessionId)
      if (deleted && still === deleted) setActiveCanvas(sessionId, null)
    }

    const cid =
      body?.canvas?.id ||
      payload.canvasId ||
      (typeof getCanvasIdForSession === 'function' && sessionId
        ? getCanvasIdForSession(sessionId)
        : null)

    if (body && body.ok !== false && sessionId && cid) {
      if (HARD_OPEN_UI.has(name) && typeof queueUiOpen === 'function') {
        queueUiOpen(sessionId, {
          canvasId: cid,
          title: body?.canvas?.title || body?.title || args?.title || 'Mind Map',
        })
      } else if (SOFT_REVEAL_UI.has(name)) {
        // Bind session; open UI at most via queue (client skips if already live).
        if (typeof setActiveCanvas === 'function') setActiveCanvas(sessionId, cid)
        if (typeof queueUiOpen === 'function') {
          queueUiOpen(sessionId, {
            canvasId: cid,
            title: body?.canvas?.title || body?.title || args?.title || 'Mind Map',
          })
        }
      }
    }

    return body
  }

  return [
    {
      name: 'mindmap_get_schema',
      description:
        'Return mind-map op schema: valid `type` values, examples (create_node / link / set_pinned), and tool list. Call when unsure about op shape.',
      parameters: { type: 'object', additionalProperties: false, properties: {} },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_get_schema'),
    },
    {
      name: 'mindmap_list_canvases',
      description: 'List mind-map canvases (id + title).',
      parameters: { type: 'object', additionalProperties: false, properties: {} },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_list_canvases'),
    },
    {
      name: 'mindmap_create_canvas',
      description:
        'Create a brand-new mind-map canvas (new id; does NOT overwrite existing canvases), bind it to this chat session, and open it in the 思维导图 tab. Canvas starts visually empty. Top-level nodes: omit parentId. Optional nodeViewMode (bubble|card|topology) is a canvas-global preference (can also be changed later via set_prefs).',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string', description: 'Canvas title, e.g. 红楼梦人物关系' },
          rootText: {
            type: 'string',
            description:
              'Optional internal label / title sync only — there is no visible root node. Prefer title alone.',
          },
          nodeViewMode: {
            type: 'string',
            enum: ['bubble', 'card', 'topology'],
            description:
              'Canvas-global chrome (bubble|card|topology). Prefer setting when creating a topology map; default card. topology = router icons + straight blue links.',
          },
        },
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_create_canvas'),
    },
    {
      name: 'mindmap_open_canvas',
      description:
        'Open an existing canvas in the 思维导图 tab and bind it as the edit target for this session.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          canvasId: { type: 'string', description: 'Canvas id from mindmap_list_canvases' },
        },
        required: ['canvasId'],
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_open_canvas'),
    },
    {
      name: 'mindmap_delete_canvas',
      description:
        'Permanently delete a canvas (hard delete). Omit canvasId to delete the currently open canvas.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          canvasId: { type: 'string' },
        },
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_delete_canvas'),
    },
    {
      name: 'mindmap_get_spatial_context',
      description:
        'Get spatial harness context for the active mind-map canvas. Always call before inventing node ids.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          canvasId: { type: 'string', description: 'Omit to use the open/bound canvas.' },
        },
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_get_spatial_context'),
    },
    {
      name: 'mindmap_find',
      description:
        'Find nodes or edges. searchScope: text|note|tags|description|edge_label|edge_note|all (default text). Edge scopes return {kind:"edge", edgeId, fromText, toText, label}. If ambiguous, ask the user — do not pick silently.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          query: { type: 'string' },
          searchScope: {
            type: 'string',
            enum: [
              'text',
              'note',
              'tags',
              'description',
              'edge_label',
              'edge_note',
              'all',
            ],
            description:
              'Default text. Use edge_label/edge_note for edges; all includes nodes + edges.',
          },
          canvasId: { type: 'string' },
        },
        required: ['query'],
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_find'),
    },
    {
      name: 'mindmap_find_and_focus',
      description:
        'Find then focus+highlight the best unique match. Edge hits highlight endpoints + edge. If ambiguous, returns candidates without focusing.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          query: { type: 'string' },
          searchScope: {
            type: 'string',
            enum: [
              'text',
              'note',
              'tags',
              'description',
              'edge_label',
              'edge_note',
              'all',
            ],
          },
          canvasId: { type: 'string' },
        },
        required: ['query'],
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_find_and_focus'),
    },
    {
      name: 'mindmap_export',
      description:
        'Export canvas as json | md | svg. format=png also returns SVG (vector) for agents; use web UI for raster PNG.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          format: { type: 'string', enum: ['json', 'md', 'svg', 'png'] },
          canvasId: { type: 'string' },
        },
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_export'),
    },
    {
      name: 'mindmap_get_subgraph',
      description:
        'Read a subgraph around a node (depth <= 3). rootId: id|@alias|title. edgeKinds: hierarchy (default, tree children) | relation | all — same as mindmap_query. Use relation/all for relationship networks.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          rootId: {
            type: 'string',
            description: 'Node id, @alias, or unique title',
          },
          depth: { type: 'number' },
          edgeKinds: {
            type: 'string',
            enum: ['hierarchy', 'relation', 'all'],
            description:
              'hierarchy = primary-parent children (default); relation|all = undirected neighborhood',
          },
          canvasId: { type: 'string' },
        },
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_get_subgraph'),
    },
    {
      name: 'mindmap_query',
      description:
        'Deterministic graph Q&A primitives (no LLM inventing). op: neighbors|path|stats|orphans|missing_meta. Node refs: id | @alias | unique title. path returns paths[].edges with meta; stats includes longestPath + mostConnected. If empty, say the graph has no such info.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          op: {
            type: 'string',
            enum: ['neighbors', 'path', 'stats', 'orphans', 'missing_meta'],
          },
          node: { type: 'string', description: 'For neighbors: id|@alias|title' },
          nodeId: { type: 'string' },
          from: { type: 'string', description: 'For path: start node' },
          to: { type: 'string', description: 'For path: end node' },
          depth: { type: 'number' },
          maxDepth: { type: 'number' },
          maxHops: {
            type: 'number',
            description:
              'For path: max edges in a path (default 8). Do NOT pass depth:1 — that was neighbors-only.',
          },
          throughRelationNodes: {
            type: 'boolean',
            description:
              'For path: allow multi-hop via intermediate nodes (default true). false = direct edge only.',
          },
          maxPaths: { type: 'number' },
          direction: {
            type: 'string',
            enum: ['out', 'in', 'both'],
            description:
              'neighbors default both; path default both when throughRelationNodes, else out',
          },
          edgeKinds: {
            type: 'string',
            enum: ['all', 'hierarchy', 'relation'],
          },
          canvasId: { type: 'string' },
        },
        required: ['op'],
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_query'),
    },
    {
      name: 'mindmap_get_node',
      description:
        'Read one node. Default returns id/text/alias/function + full description. Use after Q&A when user asks for details on a cited node.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          nodeId: { type: 'string', description: 'id | @alias | unique title' },
          node: { type: 'string' },
          fields: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['all', 'description', 'note', 'tags', 'links'],
            },
          },
          canvasId: { type: 'string' },
        },
        required: ['nodeId'],
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_get_node'),
    },
    {
      name: 'mindmap_get_edge',
      description:
        'Read one edge by id. Returns from/to texts + label/direction/weight/lineStyle/note. fields: all|label|meta.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          edgeId: { type: 'string' },
          fields: {
            type: 'array',
            items: { type: 'string', enum: ['all', 'label', 'meta'] },
          },
          canvasId: { type: 'string' },
        },
        required: ['edgeId'],
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_get_edge'),
    },
    {
      name: 'mindmap_highlight',
      description:
        'Flash nodes and/or edges on the open canvas (no graph mutation). Use after path/neighbors Q&A. Optional style + ttlMs (default 5000).',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          nodeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'id | @alias | title',
          },
          edgeIds: { type: 'array', items: { type: 'string' } },
          style: {
            type: 'object',
            additionalProperties: false,
            properties: {
              nodeColor: { type: 'string' },
              nodeGlow: { type: 'boolean' },
              edgeWidth: { type: 'number' },
              edgeColor: { type: 'string' },
            },
          },
          ttlMs: { type: 'number', description: 'Auto-clear ms (500–60000)' },
          canvasId: { type: 'string' },
        },
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_highlight'),
    },
    {
      name: 'mindmap_apply_direct',
      description:
        'Apply low-risk graph ops immediately. Prefer batch_create for trees; relations[] for inline edges; auto_fit after large builds. EACH op MUST have field `type`. Response includes nodeIdMap. Set preview:true for dry-run. High-risk delete_node/move_node need mindmap_propose.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ops: { type: 'array', items: OP_ITEM },
          summary: { type: 'string' },
          canvasId: { type: 'string' },
          preview: {
            type: 'boolean',
            description: 'If true, simulate apply + layout without persisting',
          },
        },
        required: ['ops'],
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_apply_direct'),
    },
    {
      name: 'mindmap_propose',
      description:
        'Submit a validated proposal (ops must use `type`). Then mindmap_accept_proposal({proposalId}) to apply. Failures return invalid_op with details — not a silent stale.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ops: { type: 'array', items: OP_ITEM },
          rationale: { type: 'string' },
          canvasId: { type: 'string' },
        },
        required: ['ops', 'rationale'],
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_propose'),
    },
    {
      name: 'mindmap_accept_proposal',
      description: 'Accept a pending proposal by id returned from mindmap_propose.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          proposalId: { type: 'string' },
          canvasId: { type: 'string' },
        },
        required: ['proposalId'],
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_accept_proposal'),
    },
    {
      name: 'mindmap_reject_proposal',
      description: 'Reject a pending proposal by id.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          proposalId: { type: 'string' },
        },
        required: ['proposalId'],
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_reject_proposal'),
    },
    {
      name: 'mindmap_focus',
      description: 'Move visual focus to a node.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          nodeId: { type: 'string' },
          canvasId: { type: 'string' },
        },
        required: ['nodeId'],
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_focus'),
    },
    {
      name: 'mindmap_undo',
      description:
        'Undo latest change set (or specific changeSetId). Creates an undo companion that mindmap_redo can reverse.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          changeSetId: { type: 'string' },
          canvasId: { type: 'string' },
        },
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_undo'),
    },
    {
      name: 'mindmap_redo',
      description:
        'Redo after undo: undoes the latest undo-companion change set on the canvas.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          canvasId: { type: 'string' },
        },
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_redo'),
    },
    {
      name: 'mindmap_history',
      description:
        'List recent change sets + named snapshots; shows latest undoable/redoable ids.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          canvasId: { type: 'string' },
          limit: { type: 'number' },
        },
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_history'),
    },
    {
      name: 'mindmap_snapshot',
      description:
        'Create a named canvas snapshot, or action:"list" to list snapshots.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          canvasId: { type: 'string' },
          name: { type: 'string' },
          action: { type: 'string', enum: ['create', 'list'] },
          limit: { type: 'number' },
        },
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_snapshot'),
    },
    {
      name: 'mindmap_restore_snapshot',
      description: 'Restore canvas to a prior snapshot id from mindmap_snapshot / mindmap_history.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          snapshotId: { type: 'string' },
          canvasId: { type: 'string' },
        },
        required: ['snapshotId'],
      },
      output: { schema: OBJECT, render: (_a, v) => jsonText(v) },
      execute: run('mindmap_restore_snapshot'),
    },
  ]
}

export function registerMindmapTools(
  ctx,
  getBase,
  getCanvasIdForSession,
  setActiveCanvas,
  queueUiOpen,
) {
  const tools = ctx?.tools
  if (!tools || typeof tools.register !== 'function') return () => {}
  const offs = mindmapToolDefinitions(
    getBase,
    getCanvasIdForSession,
    setActiveCanvas,
    queueUiOpen,
  ).map((def) => tools.register(def))
  return () => {
    for (const off of offs) {
      if (typeof off === 'function') off()
    }
  }
}

export function makeMindmapSkill() {
  return {
    name: 'mind-map',
    description:
      'AI 无限画布思维导图：右侧「思维导图」Tab；用 mindmap_* 建图/改图。Ops 必须用 type 字段。',
    whenToUse:
      'User asks for 思维导图 / 关系图 / 梳理人物或家族关系 / Mind Map, OR asks questions about an existing map (路径/依赖/邻居/统计/缺描述).',
    source: 'runtime',
    provider: 'runtime',
    content: `Mind Map workflow (dsh-mind-map):

CRITICAL — op shape:
- Every graph mutation item MUST use discriminator field **type** (NOT op / operation).
- If unsure, call mindmap_get_schema first.
- Prefer **batch_create** for trees (up to 200 nodes) instead of many create_node rounds.
- Valid types include: batch_create, batch_link, create_node, update_text, link, unlink, set_pinned, set_focus, set_collapsed, auto_fit, set_style_preset, set_edge_label, delete_node, move_node, …

Examples:
{"type":"batch_create","nodes":[{"text":"数通","alias":"datacom"},{"text":"交换机","alias":"sw","parentId":"@datacom"},{"text":"AIOps","alias":"aiops","parentId":"@datacom","relations":[{"to":"@restart","label":"触发","kind":"relation"}],"description":{"function":"根因诊断"}},{"text":"自动重启","alias":"restart","parentId":"@datacom"}]}
{"type":"batch_link","edges":[{"from":"@daiyu","to":"@baoyu","kind":"relation","label":"知己"},{"from":"@baoyu","to":"@baochai","kind":"relation","label":"金玉良缘"}]}
{"type":"auto_fit","padding":50}
{"type":"create_node","text":"贾宝玉"}   ← top-level (omit parentId); appears as independent node
{"type":"create_node","text":"贾政","parentId":"<贾宝玉的可见父节点或主题id>"}
{"type":"create_node","text":"AIOps","alias":"aiops","relations":[{"to":"@restart","kind":"relation","label":"触发"}]}
{"type":"link","from":"<黛玉Id>","to":"<宝玉Id>","kind":"relation","label":"木石前盟"}
{"type":"update_text","nodeId":"<id>","text":"新文案"}
{"type":"set_pinned","nodeId":"<id>","pinned":true,"pos":{"x":120,"y":-80}}
{"type":"update_node_meta","nodeId":"@aiops","patch":{"description":{"owner":"SRE","sla":"30s"},"note":"自由文本"}}
{"type":"set_style_preset","nodeId":"@baoyu","stylePreset":"decision"}  ← field is stylePreset (not preset)
{"type":"unlink","from":"@daiyu","to":"@baoyu","kind":"relation"}  ← or edgeId
{"type":"restore_node","nodeId":"<softDeletedId>"}  ← same id after delete_node; also @alias/title of deleted nodes

There is NO visible root node. Canvas title is metadata only. Internally top-level nodes hang under a hidden anchor — agents must never mention or target a root id.

When the user asks to build a map (e.g. 「输出红楼梦人物关系图」):
1. mindmap_create_canvas({ title: "红楼梦人物关系" }) — ALWAYS creates a NEW canvas id (never overwrites an old one). Opens the right tab on that new canvas.
   Topology diagrams: mindmap_create_canvas({ title: "…拓扑", nodeViewMode: "topology" }) then nodes with icon:"router".
2. mindmap_get_spatial_context — orient on the NEW empty canvas
3. mindmap_apply_direct({ ops: [ {type:"batch_create", nodes:[...]}, {type:"auto_fit"} ] })
4. Keep adding in small batches; never dump a full tree JSON overwrite

If the user asks for another topic later: call mindmap_create_canvas again with the new title. Do NOT reuse the previous canvas unless they explicitly say to continue the same map.
mindmap_list_canvases shows all canvases; mindmap_open_canvas switches the edit target.

Hierarchy vs relation:
- omit parentId = top-level theme/person (siblings look unrelated, which is intended)
- parentId = nest under a visible node
- link kind:"relation" = cross links (人物关系、姻亲等)
- create_node.relations / batch_create[].relations = outgoing graph edges in the same op (not URL bookmarks; those are links[])

Layout:
- Default positions come from auto layout.
- After large batch_create, include {type:"auto_fit"} so the camera frames the map.
- To place manually / avoid overwrite: set_pinned + pos, or create_node with pos (auto-pins).

Propose/accept:
- mindmap_propose validates ops first; then mindmap_accept_proposal({proposalId}).
- Apply failures return error invalid_op (proposal stays pending) — not a fake proposal_stale.
- proposal_stale only means rev drifted > 50 or proposal already finished / missing after restart.

Other tools:
- mindmap_list_canvases / mindmap_open_canvas / mindmap_delete_canvas
- Query/find/highlight also auto-open the 思维导图 tab on the bound canvas (same as create/open)
- mindmap_find — searchScope text|note|tags|description|edge_label|edge_note|all; if ambiguous, ask then mindmap_focus / mindmap_highlight with quickActions[i].args
- mindmap_find_and_focus — unique hit → focus + highlight flash (edges → highlight endpoints)
- mindmap_query — graph Q&A: neighbors|path|stats|orphans|missing_meta (deterministic; cite returned nodes)
- mindmap_get_node / mindmap_get_edge — details for follow-up
- mindmap_highlight — flash path (nodeIds + edgeIds + optional ttlMs/style)
- mindmap_export — format json|md|svg (png→svg for agents; UI has raster PNG)
- mindmap_focus, mindmap_undo, mindmap_redo, mindmap_history
- mindmap_snapshot / mindmap_restore_snapshot — named checkpoints
- mindmap_apply_direct({ preview:true }) — dry-run layout + overlaps, no persist
- mindmap_get_subgraph, mindmap_get_schema
  - get_subgraph: edgeKinds hierarchy (default tree) | relation | all — use relation/all for 关系网络 around a leaf

Graph Q&A workflow:
1. Resolve entities with mindmap_find or @alias (edge labels: searchScope edge_label)
2. Call mindmap_query (never guess paths/relations from memory)
3. If empty/message says no match → answer "图中没有相关信息" — do NOT invent
4. Answer with node names + paths[].edges (label/weight/note); mention citedNodeIds
5. Follow-up details → mindmap_get_node / mindmap_get_edge
6. Visualize → mindmap_highlight({ nodeIds, edgeIds }) after path/neighbors

Examples:
mindmap_find({ query:"高置信", searchScope:"edge_label" })
mindmap_query({ op:"neighbors", node:"@aiops", direction:"out", depth:1 })
mindmap_query({ op:"path", from:"@detect", to:"@knowledge_write", throughRelationNodes:true, maxHops:5, edgeKinds:"relation" })
mindmap_query({ op:"path", from:"@detect", to:"@aiops", throughRelationNodes:false })  // direct edge only
mindmap_query({ op:"stats" })  // connectedComponents + longestPath/mostConnected
mindmap_query({ op:"stats", edgeKinds:"relation" })  // diameter on relation edges only
mindmap_query({ op:"missing_meta" })
mindmap_query({ op:"orphans" })
mindmap_highlight({ nodeIds:["@detect","@aiops"], edgeIds:["e_…"], ttlMs:5000 })

Node refs (P0 — prefer these over raw ids):
{"type":"create_node","text":"AIOps","alias":"aiops"}
{"type":"create_node","text":"重启","parentId":"@aiops"}
{"type":"link","from":"@aiops","to":"重启","kind":"relation","label":"诊断→重启"}
{"type":"link","fromText":"AIOps","toText":"重启","kind":"relation"}
{"type":"batch_link","edges":[{"from":"@daiyu","to":"@baoyu","kind":"relation","label":"知己"},{"from":"@baoyu","to":"@baochai","kind":"relation","label":"金玉良缘"}]}
apply_direct returns nodeIdMap: { "AIOps":"n_…", "@aiops":"n_…" }

Node/edge meta extras:
- update_node_meta patch: description (JSON object; put a short "function" field for Q&A), accentColor, icon, alias, note
- update_edge_meta patch: weight 1-5, lineStyle solid|dashed|dotted, direction forward|both|none
- Prefer batch_create for trees; relations[] for inline edges; batch_link for bulk edges later; auto_fit after big builds

Rules:
1. Always create or open a canvas BEFORE apply/propose.
2. Never invent node ids; use find or create_node results. Never ask for / use a root node id — there is no visible root.
3. Prefer batch_create (or many small ops) over one giant rewrite of unrelated topics.
4. Always use type, never op.
5. Top-level siblings: omit parentId on each create_node.
6. For questions about the map, use mindmap_query first; never fabricate graph facts.`,
  }
}
