# -*- coding: utf-8 -*-
from pathlib import Path
t = Path(r"d:\project\chatgpt\mind-map\apps\web\src\TopologyCanvas.tsx").read_text(encoding="utf-8")
i = t.find('dragScope === "node"')
print("=== drag node ===")
print(repr(t[i - 80 : i + 320]))
print("=== hint ===")
j = t.find("canvas-hint")
print(repr(t[j : j + 400]))
print("=== remaining ?? ===")
import re
for m in re.finditer(r".{0,40}\?{2,}.{0,40}", t):
    print(repr(m.group(0)))
