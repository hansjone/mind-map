import type { MindNode, Op, StylePreset } from "@mind-map/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  commitField,
  fieldEditorSeed,
  hiddenAddableFields,
  visiblePropRows,
} from "./registry";
import type { PropFieldDef, PropFieldId } from "./types";
import { uploadImageFile } from "./upload-image";
import "./node-shell.css";

type ApplyOps = (ops: Op[], summary?: string) => void | Promise<void>;

export function NodePropEditor({
  node,
  applyOps,
  accent,
  variant = "overlay",
  onDragHandlePointerDown,
  showStylePreset,
}: {
  node: MindNode;
  applyOps: ApplyOps;
  accent?: string;
  variant?: "overlay" | "panel";
  onDragHandlePointerDown?: (e: React.PointerEvent) => void;
  showStylePreset?: boolean;
}) {
  const [forced, setForced] = useState<Set<string>>(() => new Set());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setForced(new Set());
    setMenuOpen(false);
  }, [node.id]);

  const rows = useMemo(
    () => visiblePropRows(node, forced),
    [node, forced],
  );
  const addable = useMemo(
    () => hiddenAddableFields(node, forced),
    [node, forced],
  );

  const commit = (id: PropFieldId, raw: string) => {
    const ops = commitField(node, id, raw);
    if (!ops.length) return;
    void applyOps(ops, `prop ${id}`);
    if (!raw.trim() && id !== "text") {
      setForced((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div
      className={`ns-editor${variant === "panel" ? " ns-editor--panel" : ""}`}
    >
      <div
        className="ns-editor__header"
        data-ns-drag-handle
        onPointerDown={onDragHandlePointerDown}
      >
        <span
          className="ns-editor__dot"
          style={accent ? { background: accent } : undefined}
        />
        <input
          className="ns-editor__title"
          key={`title-${node.id}-${node.version}`}
          defaultValue={node.text}
          onPointerDown={(e) => e.stopPropagation()}
          onBlur={(e) => {
            if (e.target.value !== node.text) commit("text", e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      </div>

      <div className="ns-editor__body">
        {showStylePreset ? (
          <div className="ns-row">
            <span className="ns-row__label">类型</span>
            <div className="ns-row__ctrl">
              <select
                value={node.stylePreset}
                onChange={(e) => {
                  void applyOps(
                    [
                      {
                        type: "set_style_preset",
                        nodeId: node.id,
                        stylePreset: e.target.value as StylePreset,
                      },
                    ],
                    "style",
                  );
                }}
              >
                <option value="default">默认外形</option>
                <option value="title">title</option>
                <option value="decision">决策</option>
                <option value="risk">风险</option>
                <option value="note">便签</option>
                <option value="muted">弱化</option>
              </select>
            </div>
            <span />
          </div>
        ) : null}

        <div className="ns-row">
          <span className="ns-row__label">强调色</span>
          <div className="ns-row__ctrl">
            <input
              type="text"
              placeholder="#e74c3c"
              defaultValue={node.accentColor ?? ""}
              key={`ac-${node.id}-${node.version}`}
              onBlur={(e) => {
                const v = e.target.value.trim();
                const next = v || null;
                if ((node.accentColor ?? null) === next) return;
                void applyOps([
                  {
                    type: "update_node_meta",
                    nodeId: node.id,
                    patch: { accentColor: next as never },
                  },
                ]);
              }}
            />
          </div>
          <span />
        </div>
        <div className="ns-row">
          <span className="ns-row__label">图标</span>
          <div className="ns-row__ctrl">
            <select
              value={node.icon ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                void applyOps([
                  {
                    type: "update_node_meta",
                    nodeId: node.id,
                    patch: {
                      icon: (v || null) as never,
                    },
                  },
                ]);
              }}
            >
              <option value="">无</option>
              <option value="server">🖥 服务器</option>
              <option value="database">🗄 数据库</option>
              <option value="cloud">☁ 云</option>
              <option value="person">👤 人物</option>
              <option value="folder">📁 文件夹</option>
              <option value="doc">📄 文档</option>
              <option value="link">🔗 链接</option>
              <option value="warning">⚠ 警告</option>
              <option value="check">✓ 完成</option>
              <option value="star">★ 星标</option>
              <option value="gear">⚙ 设置</option>
              <option value="globe">🌐 全球</option>
            </select>
          </div>
          <span />
        </div>

        {rows
          .filter((r) => r.def.id !== "text")
          .map(({ def }) => (
            <FieldRow
              key={def.id}
              def={def}
              node={node}
              onCommit={(raw) => commit(def.id, raw)}
              onClear={() => {
                commit(def.id, "");
                setForced((prev) => {
                  const next = new Set(prev);
                  next.delete(def.id);
                  return next;
                });
              }}
            />
          ))}
      </div>

      {addable.length > 0 ? (
        <div
          className="ns-add"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {menuOpen ? (
            <div className="ns-add__menu">
              {addable.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="ns-add__item"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setForced((prev) => new Set(prev).add(f.id));
                    setMenuOpen(false);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            className="ns-add__btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            + 添加字段
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FieldRow({
  def,
  node,
  onCommit,
  onClear,
}: {
  def: PropFieldDef;
  node: MindNode;
  onCommit: (raw: string) => void;
  onClear: () => void;
}) {
  const seed = fieldEditorSeed(node, def.id);
  const canClear = !def.always;
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (def.kind === "image") {
    return (
      <div className="ns-row">
        <span className="ns-row__label">{def.label}</span>
        <div className="ns-row__ctrl ns-row__ctrl--image" onPointerDown={(e) => e.stopPropagation()}>
          {seed ? <img className="ns-thumb" src={seed} alt="" /> : null}
          <div className="ns-image-actions">
            <button
              type="button"
              className="ns-image-pick"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "上传中…" : "选择文件"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setUploadErr(null);
                setUploading(true);
                void uploadImageFile(file)
                  .then((url) => onCommit(url))
                  .catch((err) =>
                    setUploadErr(String(err?.message || err || "上传失败")),
                  )
                  .finally(() => setUploading(false));
              }}
            />
            <input
              key={`${def.id}-${node.id}-${node.version}`}
              className="ns-image-url"
              defaultValue={seed}
              placeholder="或粘贴图片 URL"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== (seed || "")) onCommit(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
            />
            {canClear ? (
              <button
                type="button"
                className="ns-row__clear"
                title="清除"
                onClick={onClear}
              >
                ×
              </button>
            ) : null}
          </div>
          {uploadErr ? <div className="ns-image-err">{uploadErr}</div> : null}
          <div className="ns-image-hint">支持本地选图或粘贴 https://… 链接</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ns-row">
      <span className="ns-row__label">{def.label}</span>
      <div className="ns-row__ctrl" onPointerDown={(e) => e.stopPropagation()}>
        {def.kind === "textarea" || def.kind === "links" ? (
          <textarea
            key={`${def.id}-${node.id}-${node.version}`}
            defaultValue={seed}
            rows={def.kind === "links" ? 3 : 2}
            placeholder={def.kind === "links" ? "标题|url 每行一条" : ""}
            onBlur={(e) => onCommit(e.target.value)}
          />
        ) : def.kind === "datetime" ? (
          <input
            key={`${def.id}-${node.id}-${node.version}`}
            type="datetime-local"
            defaultValue={seed}
            onBlur={(e) => onCommit(e.target.value)}
          />
        ) : def.kind === "flag" ? (
          <button
            type="button"
            onClick={() => onCommit(node.pinned ? "0" : "1")}
          >
            {node.pinned ? "解钉" : "钉住"}
          </button>
        ) : (
          <input
            key={`${def.id}-${node.id}-${node.version}`}
            defaultValue={seed}
            placeholder={def.kind === "tags" ? "逗号分隔" : ""}
            onBlur={(e) => onCommit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        )}
        {canClear ? (
          <button
            type="button"
            className="ns-row__clear"
            title="清除"
            onClick={onClear}
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function NodePropOverlay({
  node,
  applyOps,
  screenX,
  screenY,
  zoom,
  accent,
  width,
  showStylePreset,
}: {
  node: MindNode;
  applyOps: ApplyOps;
  screenX: number;
  screenY: number;
  zoom: number;
  accent?: string;
  width: number;
  showStylePreset?: boolean;
}) {
  return (
    <div
      className="ns-overlay"
      style={{
        left: screenX,
        top: screenY,
        width,
        transform: `translate(-50%, -50%) scale(${zoom})`,
      }}
    >
      <NodePropEditor
        node={node}
        applyOps={applyOps}
        accent={accent}
        showStylePreset={showStylePreset}
      />
    </div>
  );
}
