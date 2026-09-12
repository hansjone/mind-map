# -*- coding: utf-8 -*-
from pathlib import Path
import re

p = Path(r"d:\project\chatgpt\mind-map\apps\web\src\TopologyCanvas.tsx")
t = p.read_text(encoding="utf-8")
for m in re.finditer(r'.{0,60}"\?{2,}".{0,40}', t):
    print(repr(m.group(0)))
# fix leftover ??? for create_node
if ': { type: "create_node", text: "???" }' in t:
    t = t.replace(': { type: "create_node", text: "???" }', ': { type: "create_node", text: "新节点" }')
    p.write_text(t, encoding="utf-8", newline="\n")
    print("fixed leftover")
print("quoted left", re.findall(r'"\?{2,}"', t))
print("cjk count", len(re.findall(r"[\u4e00-\u9fff]+", t)))
