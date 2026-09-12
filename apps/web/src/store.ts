import type { CanvasMeta, MindEdge, MindNode, Op, StylePreset } from "@mind-map/shared";
import { create } from "zustand";

export type Positions = Record<string, { x: number; y: number }>;

type State = {
  canvases: CanvasMeta[];
  canvasId: string | null;
  canvas: CanvasMeta | null;
  nodes: MindNode[];
  edges: MindEdge[];
  positions: Positions;
  selectedIds: string[];
  selectedEdgeId: string | null;
  /** Transient find/focus flash ids. */
  highlightIds: string[];
  highlightEdgeIds: string[];
  highlightStyle: {
    nodeColor?: string;
    nodeGlow?: boolean;
    edgeWidth?: number;
    edgeColor?: string;
  } | null;
  /** One-shot camera fit from server auto_fit. */
  fitViewport: { x: number; y: number; zoom: number } | null;
  leftCollapsed: boolean;
  themeId: string;
  lastChangeSetId: string | null;
  loadCanvases: () => Promise<void>;
  openCanvas: (id: string) => Promise<void>;
  createCanvas: (title?: string) => Promise<void>;
  applyOps: (ops: Op[], summary?: string) => Promise<void>;
  applyCanvasPayload: (
    data: {
      canvas: CanvasMeta;
      nodes: MindNode[];
      edges: MindEdge[];
      positions: Positions;
    },
    opts?: { preserveUnpinned?: boolean },
  ) => void;
  patchLocal: (patch: {
    nodes?: MindNode[];
    edges?: MindEdge[];
    positions?: Positions;
    canvas?: CanvasMeta;
  }) => void;
  requestFitViewport: (vp: { x: number; y: number; zoom: number }) => void;
  consumeFitViewport: () => { x: number; y: number; zoom: number } | null;
  undo: () => Promise<void>;
  setSelection: (ids: string[]) => void;
  setSelectedEdge: (id: string | null) => void;
  flashHighlight: (
    idsOrOpts:
      | string[]
      | {
          nodeIds?: string[];
          edgeIds?: string[];
          style?: {
            nodeColor?: string;
            nodeGlow?: boolean;
            edgeWidth?: number;
            edgeColor?: string;
          } | null;
          ttlMs?: number;
        },
  ) => void;
  setThemeId: (id: string) => void;
  setCollapsedPanels: (side: "left", collapsed: boolean) => void;
  setPrefs: (patch: Partial<CanvasMeta["prefs"]>) => Promise<void>;
  setStylePreset: (nodeId: string, stylePreset: StylePreset) => Promise<void>;
  loadTrash: () => Promise<void>;
  restoreFromTrash: (nodeId: string) => Promise<void>;
  trash: MindNode[];
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json()) as T & { ok?: boolean; message?: string; error?: string };
  if (!res.ok) throw new Error(data.message ?? data.error ?? res.statusText);
  return data;
}

function softMergePositions(prev: Positions, next: Positions): Positions {
  const out: Positions = { ...prev };
  for (const [id, p] of Object.entries(next)) {
    out[id] = { ...p };
  }
  for (const id of Object.keys(out)) {
    if (!(id in next)) delete out[id];
  }
  return out;
}

/** After pin-only ops: keep non-pinned nodes where the client already had them. */
function mergePinStable(
  before: Positions,
  server: Positions,
  pinnedIds: Set<string>,
): Positions {
  const out: Positions = { ...server };
  for (const [id, p] of Object.entries(before)) {
    if (!pinnedIds.has(id) && out[id]) {
      out[id] = { ...p };
    }
  }
  for (const id of pinnedIds) {
    if (server[id]) out[id] = { ...server[id]! };
    else if (before[id]) out[id] = { ...before[id]! };
  }
  return out;
}

const pinStableFreeze = new Map<
  string,
  { positions: Positions; pinnedIds: string[]; until: number }
>();

export const useAppStore = create<State>((set, get) => ({
  canvases: [],
  canvasId: null,
  canvas: null,
  nodes: [],
  edges: [],
  positions: {},
  selectedIds: [],
  selectedEdgeId: null,
  highlightIds: [],
  highlightEdgeIds: [],
  highlightStyle: null,
  fitViewport: null,
  leftCollapsed: false,
  themeId: localStorage.getItem("mind-map:theme") ?? "abyss",
  lastChangeSetId: null,
  trash: [],

  loadCanvases: async () => {
    const data = await api<{ canvases: CanvasMeta[] }>("/api/canvases");
    set({ canvases: data.canvases });
    if (!get().canvasId && data.canvases[0]) {
      await get().openCanvas(data.canvases[0].id);
    }
  },

  openCanvas: async (id) => {
    const data = await api<{
      canvas: CanvasMeta;
      nodes: MindNode[];
      edges: MindEdge[];
      positions: Positions;
    }>(`/api/canvases/${id}`);
    set({
      canvasId: id,
      canvas: data.canvas,
      nodes: data.nodes,
      edges: data.edges,
      positions: data.positions,
      selectedIds: [],
      selectedEdgeId: null,
      themeId: data.canvas.prefs.themeId ?? get().themeId,
    });
    await get().loadTrash();
  },

  createCanvas: async (title) => {
    const data = await api<{
      canvas: CanvasMeta;
      nodes: MindNode[];
      edges: MindEdge[];
      positions: Positions;
    }>("/api/canvases", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    await get().loadCanvases();
    set({
      canvasId: data.canvas.id,
      canvas: data.canvas,
      nodes: data.nodes,
      edges: data.edges,
      positions: data.positions,
      selectedIds: [],
    });
  },

  patchLocal: (patch) => {
    set((s) => ({
      nodes: patch.nodes ?? s.nodes,
      edges: patch.edges ?? s.edges,
      positions: patch.positions ?? s.positions,
      canvas: patch.canvas ?? s.canvas,
    }));
  },

  requestFitViewport: (vp) => set({ fitViewport: vp }),
  consumeFitViewport: () => {
    const vp = get().fitViewport;
    if (vp) set({ fitViewport: null });
    return vp;
  },

  applyOps: async (ops, summary) => {
    const id = get().canvasId;
    if (!id) return;
    const touchesTrash = ops.some(
      (o) => o.type === "delete_node" || o.type === "restore_node",
    );
    const touchesRoster = ops.some(
      (o) => o.type === "set_prefs" || o.type === "update_text",
    );
    const onlyPins =
      ops.length > 0 && ops.every((o) => o.type === "set_pinned");
    const pinnedIds = new Set(
      ops
        .filter(
          (o): o is Extract<Op, { type: "set_pinned" }> =>
            o.type === "set_pinned" && o.pinned === true,
        )
        .map((o) => o.nodeId),
    );
    // Snapshot after any optimistic patchLocal the caller already applied.
    const beforePos = { ...get().positions };

    const data = await api<{
      canvas: CanvasMeta;
      nodes: MindNode[];
      edges: MindEdge[];
      positions: Positions;
      changeSetId: string;
      fitViewport?: { x: number; y: number; zoom: number };
    }>(`/api/canvases/${id}/ops`, {
      method: "POST",
      body: JSON.stringify({ ops, origin: "user", summary }),
    });

    const positions =
      onlyPins && pinnedIds.size > 0
        ? mergePinStable(beforePos, data.positions, pinnedIds)
        : softMergePositions(beforePos, data.positions);

    set({
      canvas: data.canvas,
      nodes: data.nodes,
      edges: data.edges,
      positions,
      lastChangeSetId: data.changeSetId,
      themeId: data.canvas.prefs.themeId,
      ...(data.fitViewport ? { fitViewport: data.fitViewport } : {}),
    });
    // Remember pin-stable freeze so a trailing WS refresh doesn't undo single-node drag.
    if (onlyPins && pinnedIds.size > 0) {
      pinStableFreeze.set(id, {
        positions: { ...positions },
        pinnedIds: [...pinnedIds],
        until: Date.now() + 2000,
      });
    }
    if (touchesRoster) void get().loadCanvases();
    if (touchesTrash) void get().loadTrash();
  },

  applyCanvasPayload: (
    data: {
      canvas: CanvasMeta;
      nodes: MindNode[];
      edges: MindEdge[];
      positions: Positions;
    },
    opts?: { preserveUnpinned?: boolean },
  ) => {
    const id = data.canvas.id;
    const freeze = pinStableFreeze.get(id);
    const before = get().positions;
    let positions = data.positions;
    if (opts?.preserveUnpinned || (freeze && freeze.until > Date.now())) {
      const pinnedIds = new Set(
        freeze?.pinnedIds ??
          data.nodes.filter((n) => n.pinned && n.pos).map((n) => n.id),
      );
      positions = mergePinStable(
        freeze?.positions ?? before,
        data.positions,
        pinnedIds,
      );
    }
    set({
      canvasId: id,
      canvas: data.canvas,
      nodes: data.nodes,
      edges: data.edges,
      positions,
      themeId: data.canvas.prefs.themeId ?? get().themeId,
    });
  },

  undo: async () => {
    const id = get().canvasId;
    const cs = get().lastChangeSetId;
    if (!id || !cs) return;
    const data = await api<{
      snapshot: { canvas: CanvasMeta; nodes: MindNode[]; edges: MindEdge[] };
      changeSetId: string;
    }>(`/api/canvases/${id}/undo`, {
      method: "POST",
      body: JSON.stringify({ changeSetId: cs }),
    });
    await get().openCanvas(id);
    set({ lastChangeSetId: data.changeSetId });
  },

  setSelection: (ids) => set({ selectedIds: ids, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedIds: id ? [] : get().selectedIds }),
  flashHighlight: (idsOrOpts) => {
    const opts = Array.isArray(idsOrOpts)
      ? { nodeIds: idsOrOpts }
      : idsOrOpts;
    const nodeIds = opts.nodeIds ?? [];
    const edgeIds = opts.edgeIds ?? [];
    const style = opts.style ?? null;
    const ttlMs = Math.max(500, Math.min(60000, opts.ttlMs ?? 2200));
    set({
      highlightIds: nodeIds,
      highlightEdgeIds: edgeIds,
      highlightStyle: style,
      selectedIds: nodeIds.length ? nodeIds : get().selectedIds,
      selectedEdgeId: edgeIds.length === 1 ? edgeIds[0]! : get().selectedEdgeId,
    });
    window.setTimeout(() => {
      const cur = useAppStore.getState();
      if (
        cur.highlightIds.length === nodeIds.length &&
        cur.highlightIds.every((x, i) => x === nodeIds[i]) &&
        cur.highlightEdgeIds.length === edgeIds.length &&
        cur.highlightEdgeIds.every((x, i) => x === edgeIds[i])
      ) {
        set({
          highlightIds: [],
          highlightEdgeIds: [],
          highlightStyle: null,
        });
      }
    }, ttlMs);
  },
  setThemeId: (id) => {
    localStorage.setItem("mind-map:theme", id);
    set({ themeId: id });
  },
  setCollapsedPanels: (side, collapsed) => {
    if (side === "left") set({ leftCollapsed: collapsed });
  },
  setPrefs: async (patch) => {
    await get().applyOps([{ type: "set_prefs", prefs: patch }], "update prefs");
  },
  setStylePreset: async (nodeId, stylePreset) => {
    await get().applyOps([{ type: "set_style_preset", nodeId, stylePreset }], "style");
  },

  loadTrash: async () => {
    const id = get().canvasId;
    if (!id) return;
    const data = await api<{ nodes: MindNode[] }>(`/api/canvases/${id}/trash`);
    set({ trash: data.nodes });
  },

  restoreFromTrash: async (nodeId) => {
    const id = get().canvasId;
    if (!id) return;
    await api(`/api/canvases/${id}/trash/${nodeId}/restore`, { method: "POST" });
    await get().openCanvas(id);
    await get().loadTrash();
  },
}));
