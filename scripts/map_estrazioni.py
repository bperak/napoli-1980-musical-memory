#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Karta izvađenih (stvarnih) mjesta iz dokumenata — 12 redaka iz estrazioni_reali.csv."""
import csv
import random
import warnings

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import contextily as cx

warnings.filterwarnings("ignore")
BASE = "/home/agent/napoli1980/"

GAZ = {
    "via atri": (40.8515, 14.2545), "via costantinopoli": (40.8516, 14.2517),
    "cavone san gennaro": (40.8576, 14.2520), "sanità": (40.8576, 14.2520),
    "vomero": (40.8439, 14.2255), "chiaia": (40.8330, 14.2280),
    "piazza del gesù": (40.8479, 14.2553), "piazza dei martiri": (40.8345, 14.2415),
    "acerra": (40.9461, 14.3750), "centro storico": (40.8515, 14.2565),
}


def coords(row, seed):
    for f in ("via", "quartiere", "nome"):
        t = (row.get(f) or "").lower().strip()
        for k, c in GAZ.items():
            if k in t:
                rnd = random.Random(seed)
                return (c[0] + rnd.uniform(-0.0025, 0.0025), c[1] + rnd.uniform(-0.0025, 0.0025)), k
    return None, None


rows = list(csv.DictReader(open(BASE + "estrazioni_reali.csv", encoding="utf-8")))
pts = []
for i, r in enumerate(rows):
    c, src = coords(r, i)
    r["_coord"], r["_geo"] = c, src
    if c:
        pts.append(r)
print("ukupno:", len(rows), "| s koordinatama:", len(pts))

COL = {"club": "#b03a2e", "negozio_dischi": "#186a3b", "discoteca": "#7d3c98",
       "teatro": "#1f3864", "centro_sociale": "#1f3864", "ritrovo": "#b9770e", "altro": "#555555"}

fig, ax = plt.subplots(figsize=(9.5, 9))
for r in pts:
    ax.scatter(r["_coord"][1], r["_coord"][0], s=170, marker="*", c=COL.get(r["tipo"], "#333"),
               edgecolors="white", linewidths=0.9, zorder=5)
    ax.annotate(f"{r['nome']} ({r['_geo']})", (r["_coord"][1], r["_coord"][0]), fontsize=8.4,
                xytext=(7, 5), textcoords="offset points", zorder=6,
                bbox=dict(boxstyle="round,pad=0.2", fc="white", ec="none", alpha=0.75))
ax.set_xlim(14.20, 14.42)
ax.set_ylim(40.80, 40.97)
ax.set_xticks([]); ax.set_yticks([])
ax.set_title("Napoli 1980 — luoghi estratti dai documenti con l'estrattore\n"
             f"{len(pts)} di {len(rows)} localizzati (via, piazza o quartiere)", fontsize=12.5, color="#1f3864")
try:
    cx.add_basemap(ax, crs="EPSG:4326", source=cx.providers.Esri.WorldGrayCanvas, attribution_size=4)
except Exception as e:
    print("podloga:", str(e)[:100])
plt.tight_layout()
out = BASE + "map_estrazioni_reali.png"
fig.savefig(out, dpi=150, bbox_inches="tight")
print("zapisano:", out)
