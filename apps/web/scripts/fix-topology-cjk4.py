# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src" / "TopologyCanvas.tsx"
t = p.read_text(encoding="utf-8")
pairs = [
    (
        'title="???????????? (N)??? Shift ??????"',
        'title="单点拖拽：只移动当前节点 (N)；按住 Shift 也可临时单点"',
    ),
    (
        'title="?????????????? (B)"',
        'title="整枝拖拽：节点与子孙一起移动 (B)"',
    ),
]
for old, new in pairs:
    if old not in t:
        raise SystemExit(f"missing: {old}")
    t = t.replace(old, new, 1)
    print("fixed:", new[:40])
p.write_text(t, encoding="utf-8", newline="\n")
print("done")
