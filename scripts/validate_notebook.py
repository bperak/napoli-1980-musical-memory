#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Provjerava da nijedna ćelija Colab notebooka ne pada: izvršava kod-ćelije redom lokalno."""
import json
import pathlib
import sys
import traceback

NB = pathlib.Path("/home/agent/napoli1980/Napoli_1980_musical_memory_map.ipynb")
WORKDIR = "/home/agent/napoli1980"


class _Stub:
    def __getattr__(self, item):
        raise ImportError("colab stub")


sys.modules.setdefault("google", _Stub())
sys.modules.setdefault("google.colab", _Stub())

nb = json.loads(NB.read_text(encoding="utf-8"))
cells = nb["cells"]
ns = {"__name__": "__main__"}
failures = []
ran = 0

import os
os.chdir(WORKDIR)

for idx, cell in enumerate(cells, 1):
    if cell["cell_type"] != "code":
        continue
    src = "".join(cell["source"])
    lines = [ln for ln in src.splitlines() if not ln.strip().startswith(("!", "%"))]
    if not lines:
        continue
    code = "\n".join(lines)
    try:
        exec(compile(code, f"<cell {idx}>", "exec"), ns)
        ran += 1
        print(f"✓ cell {idx}")
    except Exception:
        failures.append(idx)
        print(f"✗ cell {idx}")
        traceback.print_exc(limit=3)

print(f"\nizvršeno ćelija: {ran} | palo: {len(failures)} {failures if failures else ''}")
sys.exit(1 if failures else 0)
