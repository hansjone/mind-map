# -*- coding: utf-8 -*-
from pathlib import Path

d = Path(__file__).resolve().parents[1] / "dist" / "assets"
js = next(d.glob("index-*.js")).read_text(encoding="utf-8")
needles = ["选择", "平移", "连线", "单点", "整枝", "气泡", "卡片", "解钉", "撤销"]
print(next(d.glob("index-*.js")).name)
print({n: (n in js) for n in needles})
print("corrupt select:", '["select","??"' in js)
