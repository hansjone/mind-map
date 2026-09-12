import { useEffect, useMemo } from "react";
import { NodeInspector } from "./NodeInspector";
import { applyThemeFromQuery } from "./system-theme";
import { TopologyCanvas } from "./TopologyCanvas";
import { useAppStore } from "./store";

function readQuery() {
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams();
  }
}

export function App() {
  const query = useMemo(() => readQuery(), []);
  const embed = query.get("embed") === "1" || query.get("embed") === "true";
  const queryCanvasId = query.get("canvasId") || "";
  const {
    canvases,
    canvasId,
    canvas,
    nodes,
    selectedIds,
    leftCollapsed,
    loadCanvases,
    createCanvas,
    openCanvas,
    undo,
    setCollapsedPanels,
    setPrefs,
    applyOps,
    trash,
    restoreFromTrash,
  } = useAppStore();

  useEffect(() => {
    applyThemeFromQuery();
  }, []);

  useEffect(() => {
    void (async () => {
      await loadCanvases();
      if (queryCanvasId) {
        await openCanvas(queryCanvasId);
        return;
      }
      if (!useAppStore.getState().canvasId) {
        await createCanvas("未命名画布");
      }
    })();
  }, [loadCanvases, createCanvas, openCanvas, queryCanvasId]);

  useEffect(() => {
    const wsUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
    let ws: WebSocket | null = null;
    let closed = false;
    let retryTimer: number | undefined;
    let refreshTimer: number | undefined;
    let retryMs = 800;

    const scheduleRefresh = (id: string, preserveUnpinned?: boolean) => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(async () => {
        if (useAppStore.getState().canvasId !== id) return;
        try {
          const data = await fetch(`/api/canvases/${id}`).then((r) => r.json()) as {
            canvas: import("@mind-map/shared").CanvasMeta;
            nodes: import("@mind-map/shared").MindNode[];
            edges: import("@mind-map/shared").MindEdge[];
            positions: import("./store").Positions;
          };
          useAppStore.getState().applyCanvasPayload(data, { preserveUnpinned });
        } catch {
          void useAppStore.getState().openCanvas(id);
        }
      }, 120);
    };

    const connect = () => {
      if (closed) return;
      try {
        ws = new WebSocket(wsUrl);
      } catch {
        retryTimer = window.setTimeout(connect, retryMs);
        retryMs = Math.min(8000, retryMs * 1.6);
        return;
      }
      ws.onopen = () => {
        retryMs = 800;
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as {
            type?: string;
            canvasId?: string;
            preserveUnpinned?: boolean;
            nodeIds?: string[];
            edgeIds?: string[];
            style?: {
              nodeColor?: string;
              nodeGlow?: boolean;
              edgeWidth?: number;
              edgeColor?: string;
            };
            ttlMs?: number;
            fitViewport?: { x: number; y: number; zoom: number };
            mirror?: {
              kind: "user" | "assistant" | "text-delta" | "tool" | "turn-end";
              text?: string;
              name?: string;
              callId?: string;
              sessionId?: string;
              reason?: unknown;
            };
          };
          if (
            msg.type === "canvas/event" &&
            msg.canvasId &&
            msg.canvasId === useAppStore.getState().canvasId
          ) {
            if (msg.fitViewport) {
              useAppStore.getState().requestFitViewport(msg.fitViewport);
            }
            scheduleRefresh(msg.canvasId, msg.preserveUnpinned === true);
          }
          if (
            msg.type === "canvas/highlight" &&
            msg.canvasId &&
            msg.canvasId === useAppStore.getState().canvasId
          ) {
            const nodeIds = Array.isArray(msg.nodeIds) ? msg.nodeIds : [];
            const edgeIds = Array.isArray(msg.edgeIds) ? msg.edgeIds : [];
            useAppStore.getState().flashHighlight({
              nodeIds,
              edgeIds,
              style:
                msg.style && typeof msg.style === "object" ? msg.style : null,
              ttlMs:
                typeof msg.ttlMs === "number"
                  ? msg.ttlMs
                  : edgeIds.length
                    ? 5000
                    : 2200,
            });
          }
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        if (closed) return;
        retryTimer = window.setTimeout(connect, retryMs);
        retryMs = Math.min(8000, retryMs * 1.6);
      };
      ws.onerror = () => {
        try {
          ws?.close();
        } catch {
          /* ignore */
        }
      };
    };

    connect();
    return () => {
      closed = true;
      window.clearTimeout(retryTimer);
      window.clearTimeout(refreshTimer);
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    const id = canvasId;
    if (!id) return;
    const t = window.setTimeout(() => {
      void fetch(`/api/canvases/${id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectionIds: selectedIds,
          focusNodeId: canvas?.focusNodeId ?? null,
          viewport: canvas?.viewport ?? { x: 0, y: 0, zoom: 1 },
        }),
      });
    }, 200);
    return () => window.clearTimeout(t);
  }, [canvasId, selectedIds, canvas?.focusNodeId, canvas?.viewport]);

  const focusId = canvas?.focusNodeId;
  const outline = nodes.filter((n) => !n.deletedAt);

  if (embed) {
    return (
      <div className="app-shell embed">
        <div className="main embed-main">
          <TopologyCanvas />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">Mind Map</div>
        <button type="button" onClick={() => setCollapsedPanels("left", !leftCollapsed)}>
          {leftCollapsed ? "目录" : "收目录"}
        </button>
        <button type="button" onClick={() => void createCanvas()}>
          新建
        </button>
        <button type="button" onClick={() => void undo()} disabled={!useAppStore.getState().lastChangeSetId}>
          撤销
        </button>
        <button
          type="button"
          onClick={() =>
            void setPrefs({
              density: canvas?.prefs.density === "compact" ? "comfortable" : "compact",
            })
          }
        >
          密度: {canvas?.prefs.density ?? "comfortable"}
        </button>
        <button
          type="button"
          onClick={() =>
            void setPrefs({ branchColoring: !(canvas?.prefs.branchColoring ?? true) })
          }
        >
          分色: {canvas?.prefs.branchColoring === false ? "关" : "开"}
        </button>
        <button
          type="button"
          onClick={() =>
            void setPrefs({
              nodeViewMode:
                canvas?.prefs.nodeViewMode !== "bubble" ? "bubble" : "card",
            })
          }
        >
          模式: {canvas?.prefs.nodeViewMode !== "bubble" ? "卡片" : "气泡"}
        </button>
        <button
          type="button"
          onClick={() => {
            const id = canvasId;
            if (!id) return;
            void fetch(`/api/canvases/${id}/export.json`)
              .then((r) => r.json())
              .then((data) => {
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
                });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${canvas?.title ?? "mindmap"}.json`;
                a.click();
              });
          }}
        >
          导出JSON
        </button>
        <button
          type="button"
          onClick={() => {
            const el = document.querySelector(".canvas-host canvas") as HTMLCanvasElement | null;
            if (!el) return;
            el.toBlob((blob) => {
              if (!blob) return;
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `${canvas?.title ?? "mindmap"}.png`;
              a.click();
            });
          }}
        >
          导出PNG
        </button>
        <div className="spacer" />
      </header>

      <div
        className={`main ${leftCollapsed ? "left-collapsed" : ""}`}
      >
        <aside className="panel" style={{ display: leftCollapsed ? "none" : undefined }}>
          <div className="panel-header">目录</div>
          <div className="panel-body">
            <div className="muted" style={{ marginBottom: 8 }}>
              画布
            </div>
            {canvases.map((c) => (
              <div
                key={c.id}
                className={`canvas-list-item ${c.id === canvasId ? "active" : ""}`}
                onClick={() => void openCanvas(c.id)}
              >
                {c.title}
              </div>
            ))}
            <div className="muted" style={{ margin: "12px 0 8px" }}>
              大纲
            </div>
            {outline.map((n) => (
              <div
                key={n.id}
                className={`outline-item ${selectedIds.includes(n.id) ? "active" : ""}`}
                onClick={() => {
                  useAppStore.getState().setSelection([n.id]);
                  void applyOps([{ type: "set_focus", nodeId: n.id }]);
                }}
              >
                {n.id === focusId ? "◎ " : "• "}
                {n.text}
              </div>
            ))}
            <div className="muted" style={{ margin: "12px 0 8px" }}>
              属性
            </div>
            <NodeInspector />
            <div className="muted" style={{ margin: "12px 0 8px" }}>
              回收站 ({trash.length})
            </div>
            {trash.length === 0 && <div className="muted">空</div>}
            {trash.map((n) => (
              <div key={n.id} className="trash-item">
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{n.text}</span>
                <button type="button" onClick={() => void restoreFromTrash(n.id)}>
                  恢复
                </button>
              </div>
            ))}
          </div>
        </aside>

        <TopologyCanvas />
      </div>
    </div>
  );
}
