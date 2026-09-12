import type { MindEdge, MindNode } from "@mind-map/shared";
import { useEffect, useMemo, useState } from "react";
import { NodePropEditor } from "./node-props";
import { useAppStore } from "./store";

type ApplyOps = ReturnType<typeof useAppStore.getState>["applyOps"];

export function NodeInspector() {
  const canvas = useAppStore((s) => s.canvas);
  const nodes = useAppStore((s) => s.nodes);
  const edges = useAppStore((s) => s.edges);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const selectedEdgeId = useAppStore((s) => s.selectedEdgeId);
  const applyOps = useAppStore((s) => s.applyOps);

  const mode = canvas?.prefs.inspectorMode ?? "selection";
  const node = useMemo(
    () => (selectedIds[0] ? nodes.find((n) => n.id === selectedIds[0]) : undefined),
    [nodes, selectedIds],
  );
  const edge = useMemo(
    () => (selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) : undefined),
    [edges, selectedEdgeId],
  );

  if (mode === "selection" && !node && !edge) {
    return <div className="inspector muted">选中节点或边以编辑属性</div>;
  }

  if (edge && !node) {
    return <EdgeForm edge={edge} applyOps={applyOps} />;
  }
  if (!node) {
    return <div className="inspector muted">选中节点或边以编辑属性</div>;
  }
  return <NodeForm node={node} applyOps={applyOps} />;
}

function NodeForm({ node, applyOps }: { node: MindNode; applyOps: ApplyOps }) {
  return (
    <div className="inspector">
      <div className="inspector__title">节点属性</div>
      <NodePropEditor
        node={node}
        applyOps={applyOps}
        variant="panel"
        showStylePreset
      />
      <div className="inspector__row" style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={() =>
            void applyOps([
              {
                type: "set_collapsed",
                nodeId: node.id,
                collapsed: !node.collapsed,
              },
            ])
          }
        >
          {node.collapsed ? "展开" : "折叠"}
        </button>
      </div>
    </div>
  );
}

function EdgeForm({ edge, applyOps }: { edge: MindEdge; applyOps: ApplyOps }) {
  const [tagsText, setTagsText] = useState(edge.tags?.join(", ") ?? "");
  useEffect(() => {
    setTagsText(edge.tags?.join(", ") ?? "");
  }, [edge.id, edge.version, edge.tags]);

  return (
    <div className="inspector">
      <div className="inspector__title">边属性</div>
      <label className="inspector__field">
        <span>标签</span>
        <input
          key={`el-${edge.id}-${edge.version}`}
          defaultValue={edge.label ?? ""}
          onBlur={(e) => {
            void applyOps([
              {
                type: "update_edge_meta",
                edgeId: edge.id,
                patch: { label: e.target.value || null },
              },
            ]);
          }}
        />
      </label>
      <label className="inspector__field">
        <span>备注</span>
        <textarea
          key={`en-${edge.id}-${edge.version}`}
          defaultValue={edge.note ?? ""}
          rows={2}
          onBlur={(e) => {
            void applyOps([
              {
                type: "update_edge_meta",
                edgeId: edge.id,
                patch: { note: e.target.value || null },
              },
            ]);
          }}
        />
      </label>
      <label className="inspector__field">
        <span>线粗 (1-5)</span>
        <input
          key={`ew-${edge.id}-${edge.version}`}
          type="number"
          min={1}
          max={5}
          defaultValue={edge.weight ?? 1}
          onBlur={(e) => {
            const n = Number(e.target.value);
            const weight = Number.isFinite(n)
              ? Math.max(1, Math.min(5, Math.round(n)))
              : null;
            void applyOps([
              {
                type: "update_edge_meta",
                edgeId: edge.id,
                patch: { weight },
              },
            ]);
          }}
        />
      </label>
      <label className="inspector__field">
        <span>线型</span>
        <select
          key={`es-${edge.id}-${edge.version}`}
          defaultValue={edge.lineStyle ?? (edge.kind === "relation" ? "dashed" : "solid")}
          onChange={(e) => {
            const v = e.target.value as "solid" | "dashed" | "dotted";
            void applyOps([
              {
                type: "update_edge_meta",
                edgeId: edge.id,
                patch: { lineStyle: v },
              },
            ]);
          }}
        >
          <option value="solid">实线</option>
          <option value="dashed">虚线</option>
          <option value="dotted">点线</option>
        </select>
      </label>
      <label className="inspector__field">
        <span>箭头</span>
        <select
          key={`ed-${edge.id}-${edge.version}`}
          defaultValue={
            edge.direction ?? (edge.kind === "relation" ? "forward" : "none")
          }
          onChange={(e) => {
            const v = e.target.value as "forward" | "both" | "none";
            void applyOps([
              {
                type: "update_edge_meta",
                edgeId: edge.id,
                patch: { direction: v },
              },
            ]);
          }}
        >
          <option value="forward">单向 →</option>
          <option value="both">双向 ↔</option>
          <option value="none">无箭头</option>
        </select>
      </label>
      <label className="inspector__field">
        <span>标签（逗号分隔）</span>
        <input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          onBlur={() => {
            const tags = tagsText
              .split(/[,，]/)
              .map((s) => s.trim())
              .filter(Boolean);
            void applyOps([{ type: "update_edge_meta", edgeId: edge.id, patch: { tags } }]);
          }}
        />
      </label>
      <div className="muted" style={{ fontSize: 11 }}>
        {edge.kind} · {edge.from.slice(0, 8)} → {edge.to.slice(0, 8)}
      </div>
    </div>
  );
}
