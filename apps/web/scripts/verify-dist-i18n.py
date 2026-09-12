# -*- coding: utf-8 -*-
from pathlib import Path

js = next((Path(__file__).resolve().parents[1] / "dist" / "assets").glob("index-*.js")).read_text(
    encoding="utf-8"
)
print({k: (k in js) for k in ["选择", "Select", "平移", "Pan", "连线", "Link", "dsh-mind-map:locale"]})
