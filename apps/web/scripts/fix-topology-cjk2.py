# -*- coding: utf-8 -*-
"""Restore remaining CJK in TopologyCanvas.tsx (context-anchored)."""
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src" / "TopologyCanvas.tsx"
text = p.read_text(encoding="utf-8")

replacements = [
    ("// iframe ??????????? Tab ??", "// iframe 内无法全屏时，通知父页 Tab 全屏"),
    ('{ type: "create_node", text: "???", parentId: parent }', '{ type: "create_node", text: "新节点", parentId: parent }'),
    (': { type: "create_node", text: "???" },', ': { type: "create_node", text: "新节点" },'),
    (
        '            text: "????",\n            parentId: selectedIds[0],\n            sidePref: -1,',
        '            text: "左侧子主题",\n            parentId: selectedIds[0],\n            sidePref: -1,',
    ),
    (
        '            text: "????",\n            parentId: selectedIds[0],\n            sidePref: 1,',
        '            text: "右侧子主题",\n            parentId: selectedIds[0],\n            sidePref: 1,',
    ),
    (
        '                text: "????",\n                parentId: parentOfSel,',
        '                text: "兄弟节点",\n                parentId: parentOfSel,',
    ),
    ('label: "??",', 'label: "关联",'),
    ("// Free place ?pin every dragged id", "// Free place → pin every dragged id"),
    (
        '              text: "???",\n              ...(selectedIds[0] ? { parentId: selectedIds[0] } : {}),',
        '              text: "新节点",\n              ...(selectedIds[0] ? { parentId: selectedIds[0] } : {}),',
    ),
    ('aria-label="????"\n        onPointerDown={(e) => e.stopPropagation()}\n      >\n        {embed ? (', 'aria-label="画布工具"\n        onPointerDown={(e) => e.stopPropagation()}\n      >\n        {embed ? ('),
    ('title="??????"\n                onClick={requestBackToRoster}\n              >\n                ??\n              </button>', 'title="返回画布列表"\n                onClick={requestBackToRoster}\n              >\n                返回\n              </button>'),
    ('["select", "??", "V"]', '["select", "选择", "V"]'),
    ('["pan", "??", "H"]', '["pan", "平移", "H"]'),
    ('["link", "??", "C"]', '["link", "连线", "C"]'),
    (
        'title="???????????? (N)??? Shift ??????"\n            aria-pressed={dragScope === "node"}\n            onClick={() => setDragScope("node")}\n          >\n            ??\n          </button>',
        'title="单点拖拽：只移动当前节点 (N)；按住 Shift 也可临时单点"\n            aria-pressed={dragScope === "node"}\n            onClick={() => setDragScope("node")}\n          >\n            单点\n          </button>',
    ),
    (
        'title="?????????????? (B)"\n            aria-pressed={dragScope === "branch"}\n            onClick={() => setDragScope("branch")}\n          >\n            ??\n          </button>',
        'title="整枝拖拽：节点与子孙一起移动 (B)"\n            aria-pressed={dragScope === "branch"}\n            onClick={() => setDragScope("branch")}\n          >\n            整枝\n          </button>',
    ),
    (
        'title="?????????????"\n            aria-pressed={!cardView}\n            disabled={locked}\n            onClick={() => {\n              if (!cardView) return;\n              void setPrefs({ nodeViewMode: "bubble" });\n            }}\n          >\n            ??\n          </button>',
        'title="气泡视图：精简标题"\n            aria-pressed={!cardView}\n            disabled={locked}\n            onClick={() => {\n              if (!cardView) return;\n              void setPrefs({ nodeViewMode: "bubble" });\n            }}\n          >\n            气泡\n          </button>',
    ),
    (
        'title="??????????????"\n            aria-pressed={cardView}\n            disabled={locked}\n            onClick={() => {\n              if (cardView) return;\n              void setPrefs({ nodeViewMode: "card" });\n            }}\n          >\n            ??\n          </button>',
        'title="卡片视图：展开属性面板"\n            aria-pressed={cardView}\n            disabled={locked}\n            onClick={() => {\n              if (cardView) return;\n              void setPrefs({ nodeViewMode: "card" });\n            }}\n          >\n            卡片\n          </button>',
    ),
    (
        'title="??????????????????"\n            disabled={\n              locked ||\n              !selectedIds[0] ||\n              !nodes.find((n) => n.id === selectedIds[0])?.pinned\n            }\n            onClick={() => {\n              if (!selectedIds[0]) return;\n              void applyOps([\n                { type: "set_pinned", nodeId: selectedIds[0], pinned: false },\n              ]);\n            }}\n          >\n            ??\n          </button>',
        'title="取消钉住：让选中节点重新参与自动布局"\n            disabled={\n              locked ||\n              !selectedIds[0] ||\n              !nodes.find((n) => n.id === selectedIds[0])?.pinned\n            }\n            onClick={() => {\n              if (!selectedIds[0]) return;\n              void applyOps([\n                { type: "set_pinned", nodeId: selectedIds[0], pinned: false },\n              ]);\n            }}\n          >\n            解钉\n          </button>',
    ),
    (
        'title="??"\n            disabled={!lastChangeSetId}\n            onClick={() => void undo()}\n          >\n            ??\n          </button>',
        'title="撤销"\n            disabled={!lastChangeSetId}\n            onClick={() => void undo()}\n          >\n            撤销\n          </button>',
    ),
    (
        'aria-label="????"\n        onPointerDown={(e) => e.stopPropagation()}\n      >\n        <button\n          type="button"\n          className="canvas-controls__btn"\n          title={fullscreen ? "????" : "??"}\n          aria-label={fullscreen ? "????" : "??"}',
        'aria-label="视图控制"\n        onPointerDown={(e) => e.stopPropagation()}\n      >\n        <button\n          type="button"\n          className="canvas-controls__btn"\n          title={fullscreen ? "退出全屏" : "全屏"}\n          aria-label={fullscreen ? "退出全屏" : "全屏"}',
    ),
    (
        'title="?? (+)"\n          aria-label="??"',
        'title="放大 (+)"\n          aria-label="放大"',
    ),
    (
        'title="?? (-)"\n          aria-label="??"',
        'title="缩小 (-)"\n          aria-label="缩小"',
    ),
    (
        'title="???? (F)"\n          aria-label="????"',
        'title="适应画布 (F)"\n          aria-label="适应画布"',
    ),
    (
        'title={locked ? "???? (L)" : "???? (L)"}\n          aria-label={locked ? "??" : "??"}',
        'title={locked ? "解锁画布 (L)" : "锁定画布 (L)"}\n          aria-label={locked ? "解锁" : "锁定"}',
    ),
    (
        'const text = side < 0 ? "????" : "????";',
        'const text = side < 0 ? "左侧子主题" : "右侧子主题";',
    ),
    (
        'className="node-handle node-handle--left"\n                style={{ left: cx - hw - 14, top: cy - 10 }}\n                title="????????"',
        'className="node-handle node-handle--left"\n                style={{ left: cx - hw - 14, top: cy - 10 }}\n                title="添加左侧子主题"',
    ),
    (
        'className="node-handle node-handle--right"\n                style={{ left: cx + hw - 2, top: cy - 10 }}\n                title="????????"',
        'className="node-handle node-handle--right"\n                style={{ left: cx + hw - 2, top: cy - 10 }}\n                title="添加右侧子主题"',
    ),
    (
        '{locked\n          ? "??? ? ???/??/????"\n          : dragScope === "node"\n            ? "??? ? ?????? ? Shift ???? ? Esc ??"\n            : "??? ? ??? ? ???? ? ?????? ? N ??? ? Esc ??"}',
        '{locked\n          ? "已锁定 · 仅浏览/缩放/平移"\n          : dragScope === "node"\n            ? "单点拖 · 只移动当前节点 · Shift 临时单点 · Esc 取消"\n            : "整枝拖 · 空白钉住 · 落到节点换父 · N 单点 · Esc 取消"}',
    ),
]

miss = []
for old, new in replacements:
    if old not in text:
        miss.append(old[:70])
        print("MISS:", old[:70].replace("\n", "\\n"))
    else:
        text = text.replace(old, new, 1)
        print("OK:", old[:50].replace("\n", "\\n"))

import re
# leftover UI ?? (not ?? nullish coalescing)
# count Chinese question-mark runs that are quoted UI strings
ui_q = re.findall(r'"\?{2,}"', text)
print("quoted ?? left:", ui_q)
print("misses:", len(miss))
if miss:
    raise SystemExit(1)
p.write_text(text, encoding="utf-8", newline="\n")
print("wrote", p)
