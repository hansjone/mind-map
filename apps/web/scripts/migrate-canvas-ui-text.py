# -*- coding: utf-8 -*-
"""Rewrite TopologyCanvas.tsx to use canvasUi (no inline CJK). Tolerates broken latin1/0xb7 files."""
from __future__ import annotations

import re
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src" / "TopologyCanvas.tsx"
raw = p.read_bytes()
try:
    text = raw.decode("utf-8")
except UnicodeDecodeError:
    text = raw.decode("latin1").replace("\xb7", "·")

# Drop prior broken import if re-run
text = re.sub(
    r'^import \{ canvasUi as U \} from "\./canvas-ui-text";\n',
    "",
    text,
    count=1,
    flags=re.M,
)

# Insert import after last relative import near top
if 'from "./canvas-ui-text"' not in text:
    m = re.search(r'(import .+ from "\./[^"]+";\n)', text)
    # insert after first block of local imports — after image-cache / node-props style imports
    insert_at = None
    for m in re.finditer(r'^import .+ from "\./.+";\n', text, flags=re.M):
        insert_at = m.end()
    if insert_at is None:
        raise SystemExit("no local import found to anchor canvas-ui-text import")
    text = (
        text[:insert_at]
        + 'import { canvasUi as U } from "./canvas-ui-text";\n'
        + text[insert_at:]
    )

subs = [
    # comments
    (r"// iframe \?+ Tab \?+", "// iframe: notify parent Tab fullscreen when needed"),
    (r"// Free place .+?pin every dragged id", "// Free place -> pin every dragged id"),
    (r"// Contain: \?+", "// Contain: fit image inside box, no crop"),
    # placeholders / creates
    (r'(wrapTextLines\(ctx, n\.text \|\| )"\?+"', r'\1U.unnamed'),
    (r'(n\.text \|\| )"\?+"', r"\1U.unnamed"),
    (r'(wrapTextLines\(ctx, n\.text \|\| )U\.unnamed', r"\1U.unnamed"),  # noop safe
    (r'text: "\?+", parentId: parent\b', "text: U.newNode, parentId: parent"),
    (r': \{ type: "create_node", text: "\?+" \},', ': { type: "create_node", text: U.newNode },'),
    (
        r'text: "\?+",\n            parentId: selectedIds\[0\],\n            sidePref: -1',
        "text: U.leftChild,\n            parentId: selectedIds[0],\n            sidePref: -1",
    ),
    (
        r'text: "\?+",\n            parentId: selectedIds\[0\],\n            sidePref: 1',
        "text: U.rightChild,\n            parentId: selectedIds[0],\n            sidePref: 1",
    ),
    (
        r'text: "\?+",\n                parentId: parentOfSel',
        "text: U.sibling,\n                parentId: parentOfSel",
    ),
    (
        r'text: "\?+",\n              \.\.\.\(selectedIds\[0\]',
        "text: U.newNode,\n              ...(selectedIds[0]",
    ),
    (r'label: "\?+"', "label: U.relationLabel"),
    # toolbar
    (
        r'(className="canvas-toolbar"\n        role="toolbar"\n        aria-label=)"\?+"',
        r'\1{U.toolbarAria}',
    ),
    (
        r'(className="canvas-tool-btn"\n                title=)"\?+"(\n                onClick=\{requestBackToRoster\}\n              >\n                )\?+(\n              </button>)',
        r"\1{U.backRosterTitle}\2{U.backRoster}\3",
    ),
    (r'\["select", "\?+", "V"\]', '["select", U.toolSelect, "V"]'),
    (r'\["pan", "\?+", "H"\]', '["pan", U.toolPan, "H"]'),
    (r'\["link", "\?+", "C"\]', '["link", U.toolLink, "C"]'),
    # also if already Chinese from partial fix
    (r'\["select", "选择", "V"\]', '["select", U.toolSelect, "V"]'),
    (r'\["pan", "平移", "H"\]', '["pan", U.toolPan, "H"]'),
    (r'\["link", "连线", "C"\]', '["link", U.toolLink, "C"]'),
    # drag titles/labels — match mixed ? + latin
    (
        r'(dragScope === "node" \? " is-active" : ""\}`\}\n            title=)"[^"]*"',
        r'\1{U.dragNodeTitle}',
    ),
    (
        r'(aria-pressed=\{dragScope === "node"\}\n            onClick=\{\(\) => setDragScope\("node"\)\}\n          >\n            )(?:\?+|单点)(\n          </button>)',
        r"\1{U.dragNode}\2",
    ),
    (
        r'(dragScope === "branch" \? " is-active" : ""\}`\}\n            title=)"[^"]*"',
        r'\1{U.dragBranchTitle}',
    ),
    (
        r'(aria-pressed=\{dragScope === "branch"\}\n            onClick=\{\(\) => setDragScope\("branch"\)\}\n          >\n            )(?:\?+|整枝)(\n          </button>)',
        r"\1{U.dragBranch}\2",
    ),
    (
        r'(className=\{`canvas-tool-btn\$\{cardView \? "" : " is-active"\}`\}\n            title=)"[^"]*"',
        r'\1{U.bubbleTitle}',
    ),
    (
        r'(void setPrefs\(\{ nodeViewMode: "bubble" \}\);\n            \}\}\n          >\n            )(?:\?+|气泡)(\n          </button>)',
        r"\1{U.bubble}\2",
    ),
    (
        r'(className=\{`canvas-tool-btn\$\{cardView \? " is-active" : ""\}`\}\n            title=)"[^"]*"',
        r'\1{U.cardTitle}',
    ),
    (
        r'(void setPrefs\(\{ nodeViewMode: "card" \}\);\n            \}\}\n          >\n            )(?:\?+|卡片)(\n          </button>\n          <button\n            type="button"\n            className="canvas-tool-btn"\n            title=)"[^"]*"',
        r"\1{U.card}\2{U.unpinTitle}",
    ),
    (
        r'(pinned: false \},\n              \]\);\n            \}\}\n          >\n            )(?:\?+|解钉)(\n          </button>)',
        r"\1{U.unpin}\2",
    ),
    (
        r'(className="canvas-tool-btn"\n            title=)"[^"]*"(\n            disabled=\{!lastChangeSetId\}\n            onClick=\{\(\) => void undo\(\)\}\n          >\n            )(?:\?+|撤销)(\n          </button>)',
        r"\1{U.undo}\2{U.undo}\3",
    ),
    # controls
    (
        r'(className="canvas-controls"\n        role="toolbar"\n        aria-label=)"\?+"',
        r"\1{U.controlsAria}",
    ),
    (
        r'title=\{fullscreen \? "[^"]*" : "[^"]*"\}\n          aria-label=\{fullscreen \? "[^"]*" : "[^"]*"\}',
        "title={fullscreen ? U.exitFullscreen : U.fullscreen}\n          aria-label={fullscreen ? U.exitFullscreen : U.fullscreen}",
    ),
    (
        r'title="[^"]* \(\+\)"\n          aria-label="[^"]*"',
        "title={U.zoomInTitle}\n          aria-label={U.zoomIn}",
    ),
    (
        r'title="[^"]* \(-\)"\n          aria-label="[^"]*"',
        "title={U.zoomOutTitle}\n          aria-label={U.zoomOut}",
    ),
    (
        r'title="[^"]* \(F\)"\n          aria-label="[^"]*"',
        "title={U.fitTitle}\n          aria-label={U.fit}",
    ),
    (
        r'title=\{locked \? "[^"]* \(L\)" : "[^"]* \(L\)"\}\n          aria-label=\{locked \? "[^"]*" : "[^"]*"\}',
        "title={locked ? U.unlockTitle : U.lockTitle}\n          aria-label={locked ? U.unlock : U.lock}",
    ),
    # handles
    (
        r'const text = side < 0 \? "[^"]*" : "[^"]*";',
        "const text = side < 0 ? U.leftChild : U.rightChild;",
    ),
    (
        r'(className="node-handle node-handle--left"\n                style=\{\{ left: cx - hw - 14, top: cy - 10 \}\}\n                title=)"[^"]*"',
        r"\1{U.addLeftChildTitle}",
    ),
    (
        r'(className="node-handle node-handle--right"\n                style=\{\{ left: cx \+ hw - 2, top: cy - 10 \}\}\n                title=)"[^"]*"',
        r"\1{U.addRightChildTitle}",
    ),
    # hint
    (
        r"""\{locked
          \? "[^"]*"
          : dragScope === "node"
            \? "[^"]*"
            : "[^"]*"\}""",
        """{locked
          ? U.hintLocked
          : dragScope === "node"
            ? U.hintNodeDrag
            : U.hintBranchDrag}""",
    ),
]

for pat, repl in subs:
    text, n = re.subn(pat, repl, text, count=0)
    print(f"x{n}: {pat[:50]}")

# Fix remaining Chinese literals if any known ones remain (after partial restores)
zh_map = {
    '"未命名"': "U.unnamed",
    '"新节点"': "U.newNode",
    '"左侧子主题"': "U.leftChild",
    '"右侧子主题"': "U.rightChild",
    '"兄弟节点"': "U.sibling",
    '"关联"': "U.relationLabel",
}
for a, b in zh_map.items():
    if a in text:
        text = text.replace(a, b)
        print("zh->U:", a)

# aria-label leftovers as string attrs that should be expressions
text = text.replace('aria-label="画布工具"', "aria-label={U.toolbarAria}")
text = text.replace('aria-label="视图控制"', "aria-label={U.controlsAria}")

remaining = re.findall(r'"\?{2,}"', text)
btn = re.findall(r">\n\s+\?{2,}\n\s+</button>", text)
print("quoted ?? left:", remaining)
print("button ?? left:", len(btn))
print("has import:", 'canvas-ui-text' in text)

p.write_text(text, encoding="utf-8", newline="\n")
print("wrote", p)
if remaining or btn:
    raise SystemExit(2)
print("SUCCESS")
