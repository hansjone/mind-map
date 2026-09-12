# -*- coding: utf-8 -*-
from pathlib import Path
import re
t = Path(r"d:\project\chatgpt\mind-map\apps\web\src\TopologyCanvas.tsx").read_text(encoding="utf-8")
print("quoted ??", re.findall(r'"\?{2,}"', t))
print("选择" in t, "单点" in t, "撤销" in t)
