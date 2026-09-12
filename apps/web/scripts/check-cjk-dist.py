# -*- coding: utf-8 -*-
from pathlib import Path
import re

src = Path(r"d:\project\chatgpt\mind-map\apps\web\src\TopologyCanvas.tsx")
dist = Path(r"d:\project\chatgpt\mind-map\apps\web\dist\assets")
b = src.read_bytes()
print("src has 选择 bytes:", "选择".encode("utf-8") in b)
print("src has literal ?? button:", bool(re.search(rb">\s*\?\?\s*<", b)))
# show hex around select label
idx = b.find(b'["select"')
print("src select snippet:", b[idx : idx + 30])

for f in dist.glob("index-*.js"):
    jb = f.read_bytes()
    print(f.name, "size", len(jb))
    print("  has 选择:", "选择".encode("utf-8") in jb)
    print("  has [\"select\",\"??\":", b'["select","??"' in jb or b'["select", "??"' in jb)
    m = re.search(rb'\["select",\s*"[^"]*"', jb)
    if m:
        print("  select match:", m.group(0))
    m2 = re.search(rb'\["pan",\s*"[^"]*"', jb)
    if m2:
        print("  pan match:", m2.group(0))
