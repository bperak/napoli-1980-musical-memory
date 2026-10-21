#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Izvršava notebook i upisuje rezultate (tekst + slike) u .ipynb, da se vide bez pokretanja."""
import base64
import contextlib
import io
import json
import pathlib
import sys
import traceback

NB_IN = pathlib.Path("/home/agent/napoli1980/Napoli_1980_musical_memory_map.ipynb")
NB_OUT = pathlib.Path("/home/agent/napoli1980/Napoli_1980_musical_memory_map_executed.ipynb")

import os
os.chdir("/home/agent/napoli1980")

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402


class _Stub:
    def __getattr__(self, item):
        raise ImportError("colab stub")


sys.modules.setdefault("google", _Stub())
sys.modules.setdefault("google.colab", _Stub())

nb = json.loads(NB_IN.read_text(encoding="utf-8"))
ns = {"__name__": "__main__"}


def fig_outputs():
    out = []
    for num in plt.get_fignums():
        fig = plt.figure(num)
        buf = io.BytesIO()
        fig.savefig(buf, format="png", bbox_inches="tight", dpi=130)
        out.append({
            "output_type": "display_data",
            "data": {"image/png": base64.b64encode(buf.getvalue()).decode()},
            "metadata": {}})
        plt.close(fig)
    return out


for idx, cell in enumerate(nb["cells"], 1):
    if cell["cell_type"] != "code":
        continue
    src = "".join(cell["source"])
    lines = [ln for ln in src.splitlines() if not ln.strip().startswith(("!", "%"))]
    if not lines:
        cell["outputs"] = []
        cell["execution_count"] = None
        continue
    buf = io.StringIO()
    outs = []
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile("\n".join(lines), f"<cell {idx}>", "exec"), ns)
        text = buf.getvalue()
        if text.strip():
            outs.append({"output_type": "stream", "name": "stdout",
                         "text": text.splitlines(keepends=True)})
        outs.extend(fig_outputs())
        if "m.save(" in src:
            try:
                import base64 as _b64
                img = pathlib.Path("/home/agent/napoli1980/map_by_model.png").read_bytes()
                try:
                    from PIL import Image
                    import io as _io
                    im = Image.open(_io.BytesIO(img)).convert("RGB")
                    im.thumbnail((1400, 1400))
                    buf2 = _io.BytesIO()
                    im.save(buf2, format="JPEG", quality=82, optimize=True)
                    payload, mime = _b64.b64encode(buf2.getvalue()).decode(), "image/jpeg"
                except Exception:
                    payload, mime = _b64.b64encode(img).decode(), "image/png"
                outs.append({"output_type": "display_data",
                             "data": {mime: payload}, "metadata": {}})
            except Exception as e:
                print("statična karta nije ugrađena:", str(e)[:80])
        print(f"✓ cell {idx}: {len(text)} znakova, {len(outs)} izlaza")
    except Exception:
        text = buf.getvalue()
        if text.strip():
            outs.append({"output_type": "stream", "name": "stdout",
                         "text": text.splitlines(keepends=True)})
        outs.append({"output_type": "error", "ename": "Error",
                     "evalue": "cell failed", "traceback": traceback.format_exc().splitlines()})
        print(f"✗ cell {idx}")
        traceback.print_exc(limit=2)
    # ćelija s ugrađenom (hosted) kartom: upiši HTML izlaz da se vidi bez pokretanja
    if "HOSTED_MAP_URL" in src:
        outs = [{"output_type": "display_data", "metadata": {},
                 "data": {"text/html": (
                     '<div style="font:12px sans-serif;color:#555;margin:4px 0 6px">live map: '
                     '<a href="https://bperak.github.io/napoli-1980-map/" target="_blank">'
                     'https://bperak.github.io/napoli-1980-map/</a></div>'
                     '<iframe src="https://bperak.github.io/napoli-1980-map/" width="100%" height="560" '
                     'style="border:1px solid #ccd;border-radius:6px" loading="lazy"></iframe>')}}]
    cell["outputs"] = outs
    cell["execution_count"] = idx

NB_OUT.write_text(json.dumps(nb, ensure_ascii=False, indent=1), encoding="utf-8")
print("\nzapisano:", NB_OUT, NB_OUT.stat().st_size, "B")
