# -*- coding: utf-8 -*-
"""Diagnose TopologyCanvas.tsx encoding / CJK corruption."""
from __future__ import annotations

import re
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src" / "TopologyCanvas.tsx"
raw = p.read_bytes()
print("size", len(raw))
print("bom", raw[:3] == b"\xef\xbb\xbf")
try:
    text = raw.decode("utf-8")
    print("utf8: OK")
except UnicodeDecodeError as e:
    print("utf8: FAIL", e)
    print("bad-byte context:", raw[max(0, e.start - 30) : e.start + 30])
    text = raw.decode("latin1")

quoted = re.findall(r'"\?{2,}"', text)
print("quoted ?? count:", len(quoted))
print("cjk chars:", len(re.findall(r"[\u4e00-\u9fff]", text)))
for i, line in enumerate(text.splitlines(), 1):
    if '["select"' in line or "title=" in line and "?" in line and "??" in line:
        if i >= 1180 and i <= 1360:
            print(f"{i}: {line.strip()[:100]}")
