# -*- coding: utf-8 -*-
from pathlib import Path
import re

p = Path(__file__).resolve().parents[1] / "src" / "TopologyCanvas.tsx"
t = p.read_text(encoding="utf-8")
print("utf8 ok, cjk tokens:", len(re.findall(r"[\u4e00-\u9fff]+", t)))
print("quoted ??:", re.findall(r'"\?{2,}"', t))
for i, line in enumerate(t.splitlines(), 1):
    if "title=" in line and ("(N)" in line or "(B)" in line or "选择" in line or "气泡" in line):
        print(f"{i}: {line.strip()}")
# toolbar labels
for needle in ("选择", "平移", "连线", "单点", "整枝", "气泡", "卡片", "解钉", "撤销"):
    print(needle, "OK" if needle in t else "MISSING")
