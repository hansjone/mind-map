# -*- coding: utf-8 -*-
"""Restore CJK strings in TopologyCanvas.tsx corrupted to '?' / '??'."""
from __future__ import annotations

import re
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src" / "TopologyCanvas.tsx"
text = p.read_text(encoding="utf-8")
misses: list[str] = []


def sub(pattern: str, repl: str, *, flags: int = 0, count: int = 0, label: str = "") -> None:
    global text
    new, n = re.subn(pattern, repl, text, count=count, flags=flags)
    tag = label or pattern[:56]
    if n == 0:
        misses.append(tag)
        print("MISS:", tag)
    else:
        print(f"OK x{n}:", tag)
    text = new


# comments
sub(r"// iframe \?+ Tab \?+", "// iframe 内无法全屏时，通知父页 Tab 全屏", label="fullscreen comment")
sub(r"// Free place \?pin", "// Free place → pin", label="free place comment")

# create defaults
sub(
    r'text: "\?+", parentId: parent\b',
    'text: "新节点", parentId: parent',
    label="tab child",
)
sub(
    r': \{ type: "create_node", text: "\?+" \},',
    ': { type: "create_node", text: "新节点" },',
    label="tab orphan / enter orphan",
)
sub(
    r'text: "\?+",\n            parentId: selectedIds\[0\],\n            sidePref: -1',
    'text: "左侧子主题",\n            parentId: selectedIds[0],\n            sidePref: -1',
    label="arrow left",
)
sub(
    r'text: "\?+",\n            parentId: selectedIds\[0\],\n            sidePref: 1',
    'text: "右侧子主题",\n            parentId: selectedIds[0],\n            sidePref: 1',
    label="arrow right",
)
sub(
    r'text: "\?+",\n                parentId: parentOfSel',
    'text: "兄弟节点",\n                parentId: parentOfSel',
    label="enter sibling",
)
sub(
    r'text: "\?+",\n              \.\.\.\(selectedIds\[0\]',
    'text: "新节点",\n              ...(selectedIds[0]',
    label="dblclick create",
)
sub(r'label: "\?+"', 'label: "关联"', label="relation label")

# toolbar: back
sub(
    r'(className="canvas-tool-btn"\n                title=")\?+("\n                onClick=\{requestBackToRoster\}\n              >\n                )\?+(\n              </button>)',
    r'\1返回画布列表\2返回\3',
    label="back to roster",
)

# tool modes
sub(r'\["select", "\?+", "V"\]', '["select", "选择", "V"]', label="select")
sub(r'\["pan", "\?+", "H"\]', '["pan", "平移", "H"]', label="pan")
sub(r'\["link", "\?+", "C"\]', '["link", "连线", "C"]', label="link")

# drag scope
sub(
    r'(className=\{`canvas-tool-btn\$\{dragScope === "node" \? " is-active" : ""\}`\}\n            title=")\?+("\n            aria-pressed=\{dragScope === "node"\}\n            onClick=\{\(\) => setDragScope\("node"\)\}\n          >\n            )\?+(\n          </button>)',
    r'\1单点拖拽：只移动当前节点 (N)；按住 Shift 也可临时单点\2单点\3',
    label="drag node",
)
sub(
    r'(className=\{`canvas-tool-btn\$\{dragScope === "branch" \? " is-active" : ""\}`\}\n            title=")\?+("\n            aria-pressed=\{dragScope === "branch"\}\n            onClick=\{\(\) => setDragScope\("branch"\)\}\n          >\n            )\?+(\n          </button>)',
    r'\1整枝拖拽：节点与子孙一起移动 (B)\2整枝\3',
    label="drag branch",
)

# bubble / card / unpin
sub(
    r'(className=\{`canvas-tool-btn\$\{cardView \? "" : " is-active"\}`\}\n            title=")\?+("\n            aria-pressed=\{!cardView\})',
    r'\1气泡视图：精简标题\2',
    label="bubble title",
)
sub(
    r'(void setPrefs\(\{ nodeViewMode: "bubble" \}\);\n            \}\}\n          >\n            )\?+(\n          </button>\n          <button\n            type="button"\n            className=\{`canvas-tool-btn\$\{cardView \? " is-active" : ""\}`\})',
    r'\1气泡\2',
    label="bubble label",
)
sub(
    r'(className=\{`canvas-tool-btn\$\{cardView \? " is-active" : ""\}`\}\n            title=")\?+("\n            aria-pressed=\{cardView\})',
    r'\1卡片视图：展开属性面板\2',
    label="card title",
)
sub(
    r'(void setPrefs\(\{ nodeViewMode: "card" \}\);\n            \}\}\n          >\n            )\?+(\n          </button>\n          <button\n            type="button"\n            className="canvas-tool-btn"\n            title=")\?+(")',
    r'\1卡片\2取消钉住：让选中节点重新参与自动布局\3',
    label="card label + unpin title",
)
sub(
    r'(pinned: false \},\n              \]\);\n            \}\}\n          >\n            )\?+(\n          </button>\n        </div>\n        <div className="canvas-toolbar__sep" />\n        <div className="canvas-toolbar__group">\n          <button\n            type="button"\n            className="canvas-tool-btn"\n            title=")\?+("\n            disabled=\{!lastChangeSetId\})',
    r'\1解钉\2撤销\3',
    label="unpin + undo titles/labels",
)
sub(
    r'(disabled=\{!lastChangeSetId\}\n            onClick=\{\(\) => void undo\(\)\}\n          >\n            )\?+(\n          </button>)',
    r'\1撤销\2',
    label="undo label",
)

# aria-labels for toolbars
sub(
    r'(className="canvas-toolbar"\n        role="toolbar"\n        aria-label=")\?+(")',
    r'\1画布工具\2',
    label="toolbar aria",
)
sub(
    r'(className="canvas-controls"\n        role="toolbar"\n        aria-label=")\?+(")',
    r'\1视图控制\2',
    label="controls aria",
)

# controls titles
sub(
    r'title=\{fullscreen \? "\?+" : "\?+"\}\n          aria-label=\{fullscreen \? "\?+" : "\?+"\}',
    'title={fullscreen ? "退出全屏" : "全屏"}\n          aria-label={fullscreen ? "退出全屏" : "全屏"}',
    label="fullscreen",
)
sub(
    r'title="\?+ \(\+\)"\n          aria-label="\?+"',
    'title="放大 (+)"\n          aria-label="放大"',
    label="zoom in",
)
sub(
    r'title="\?+ \(-\)"\n          aria-label="\?+"',
    'title="缩小 (-)"\n          aria-label="缩小"',
    label="zoom out",
)
sub(
    r'title="\?+ \(F\)"\n          aria-label="\?+"',
    'title="适应画布 (F)"\n          aria-label="适应画布"',
    label="fit",
)
sub(
    r'title=\{locked \? "\?+ \(L\)" : "\?+ \(L\)"\}\n          aria-label=\{locked \? "\?+" : "\?+"\}',
    'title={locked ? "解锁画布 (L)" : "锁定画布 (L)"}\n          aria-label={locked ? "解锁" : "锁定"}',
    label="lock",
)

# handles
sub(
    r'const text = side < 0 \? "\?+" : "\?+";',
    'const text = side < 0 ? "左侧子主题" : "右侧子主题";',
    label="handle text",
)
sub(
    r'(className="node-handle node-handle--left"\n                style=\{\{ left: cx - hw - 14, top: cy - 10 \}\}\n                title=")\?+(")',
    r'\1添加左侧子主题\2',
    label="handle left title",
)
sub(
    r'(className="node-handle node-handle--right"\n                style=\{\{ left: cx \+ hw - 2, top: cy - 10 \}\}\n                title=")\?+(")',
    r'\1添加右侧子主题\2',
    label="handle right title",
)

# hint footer
sub(
    r'''\{locked
          \? "\?+"
          : dragScope === "node"
            \? "\?+"
            : "\?+"\}''',
    '''{locked
          ? "已锁定 · 仅浏览/缩放/平移"
          : dragScope === "node"
            ? "单点拖 · 只移动当前节点 · Shift 临时单点 · Esc 取消"
            : "整枝拖 · 空白钉住 · 落到节点换父 · N 单点 · Esc 取消"}''',
    label="canvas hint",
)

# context menu labels if any remain
sub(
    r'label: "\?+"',
    'label: "关联"',
    count=1,
    label="label leftover",
)

remaining = len(re.findall(r"\?{2,}", text))
cjk = len(re.findall(r"[\u4e00-\u9fff]+", text))
print("remaining ?? sequences:", remaining)
print("cjk tokens:", cjk)
print("misses:", len(misses))

if misses:
    raise SystemExit(1)

p.write_text(text, encoding="utf-8", newline="\n")
print("wrote", p)
