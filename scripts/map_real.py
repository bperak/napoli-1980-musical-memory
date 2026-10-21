#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Karta 24 izvučena mjesta: folium HTML + statični PNG."""
import csv
import pathlib
import random

import folium
from folium.plugins import MarkerCluster

BASE = pathlib.Path("/home/agent/napoli1980")
ROWS = list(csv.DictReader((BASE / "estrazioni_reali.csv").open(encoding="utf-8")))
LOC = [r for r in ROWS if r["lat"] not in ("", None)]

COLORS = {"club": "darkred", "discoteca": "purple", "negozio_dischi": "darkgreen",
          "teatro": "darkblue", "centro_sociale": "cadetblue", "radio": "orange",
          "ritrovo": "beige", "altro": "gray"}
ICONS = {"club": "music", "discoteca": "star", "negozio_dischi": "shopping-cart",
         "teatro": "film", "centro_sociale": "home", "radio": "signal", "ritrovo": "users", "altro": "info-sign"}


def popup(r):
    cit = (r["citazione"] or "").replace('"', "“")
    return (f"<div style='font-family:system-ui,sans-serif;font-size:12px;max-width:320px'>"
            f"<b style='font-size:14px'>{r['nome']}</b><br>"
            f"<span style='color:#666'>{r['tipo']} · {r['via'] or r['quartiere'] or '—'} · {r['anni'] or '—'}</span><br>"
            f"<hr style='border:none;border-top:1px solid #ddd;margin:6px 0'>"
            f"<i>„{cit[:230]}”</i><br>"
            f"<span style='color:#888;font-size:11px'>{r['documenti']}</span><br>"
            f"<span style='color:#888;font-size:11px'>prova: {r['livello']} · {r['precisione'] or '—'}</span></div>")


m = folium.Map(location=[40.8475, 14.2500], zoom_start=12, tiles=None,
               control_scale=True)
folium.TileLayer("OpenStreetMap", name="Strade", attr="© OpenStreetMap contributors").add_to(m)
folium.TileLayer("Esri.WorldGrayCanvas", name="Chiaro (Esri)").add_to(m)
groups = {}
for tipo in sorted({r["tipo"] for r in LOC}):
    groups[tipo] = folium.FeatureGroup(name=f"{tipo} ({sum(1 for r in LOC if r['tipo'] == tipo)})").add_to(m)
for i, r in enumerate(LOC):
    folium.Marker(
        location=[float(r["lat"]), float(r["lon"])],
        icon=folium.Icon(color=COLORS.get(r["tipo"], "gray"), icon=ICONS.get(r["tipo"], "info-sign"), prefix="glyphicon"),
        popup=folium.Popup(popup(r), max_width=340),
        tooltip=f"{r['nome']} — {r['tipo']}").add_to(groups[r["tipo"]])
folium.LayerControl(collapsed=False).add_to(m)
title = (f"<div style='position:fixed;top:12px;left:52px;z-index:9999;background:rgba(255,255,255,.94);"
         f"padding:10px 14px;border-radius:8px;font-family:system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.15)'>"
         f"<b style='font-size:14px'>Napoli 1980 — luoghi estratti dai documenti</b><br>"
         f"<span style='font-size:12px;color:#444'>{len(LOC)} localizzati su {len(ROWS)} estratti · "
         f"ogni punto porta la frase da cui è stato ricavato</span></div>")
m.get_root().html.add_child(folium.Element(title))
out = BASE / "estrazioni_reali_map.html"
m.save(str(out))
print("HTML:", out, out.stat().st_size, "B | lokalizirano:", len(LOC), "| ukupno:", len(ROWS))

# statična verzija
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import contextily as cx

fig, ax = plt.subplots(figsize=(9.5, 9))
pal = {"club": "#8b1e1e", "discoteca": "#6c3483", "negozio_dischi": "#1e6b3a", "teatro": "#1f3864",
       "centro_sociale": "#117a65", "radio": "#b9770e", "ritrovo": "#7f8c8d", "altro": "#555555"}
for r in LOC:
    ax.scatter(float(r["lon"]), float(r["lat"]), s=150, marker="*", c=pal.get(r["tipo"], "#333"),
               edgecolors="white", linewidths=0.8, zorder=5)
    ax.annotate(r["nome"][:26], (float(r["lon"]), float(r["lat"])), fontsize=7.6, xytext=(6, 4),
                textcoords="offset points", zorder=6,
                bbox=dict(boxstyle="round,pad=0.18", fc="white", ec="none", alpha=0.72))
ax.set_xlim(14.19, 14.34); ax.set_ylim(40.80, 40.90)
ax.set_xticks([]); ax.set_yticks([])
ax.set_title(f"Napoli 1980 — {len(LOC)} luoghi estratti dai documenti\n"
             f"({len(ROWS)} estratti in totale; ogni punto ha una citazione)", fontsize=12, color="#1f3864")
try:
    cx.add_basemap(ax, crs="EPSG:4326", source=cx.providers.Esri.WorldGrayCanvas, attribution_size=4)
except Exception as e:
    print("podloga:", str(e)[:90])
plt.tight_layout()
png = BASE / "map_estrazioni_reali.png"
fig.savefig(png, dpi=150, bbox_inches="tight")
print("PNG:", png, png.stat().st_size, "B")
