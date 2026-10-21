#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Statična karta (PNG) s bazom iz OpenStreetMapa — za pregled bez Colaba."""
import csv
import pathlib
import warnings

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import contextily as cx

warnings.filterwarnings("ignore")
BASE = pathlib.Path(__file__).resolve().parent.parent
df = pd.read_csv(BASE / "napoli1980_places_enriched.csv")
df = df.dropna(subset=["lat", "lon"])
print("točaka:", len(df))

COLORS = {"deepseek-flash": "#1f3864", "gemma4-26b-local": "#b03a2e"}
TYPE_MARK = {"negozio": "o", "club": "s", "ritrovo": "^", "live": "D"}


def draw(by, fname, title):
    fig, ax = plt.subplots(figsize=(11, 11))
    if by == "model":
        for m, sub in df.groupby("modello"):
            ax.scatter(sub["lon"], sub["lat"], s=16, alpha=0.55, c=COLORS.get(m, "#555"),
                       label=f"{m} ({len(sub)} punti)", linewidths=0)
    else:
        palette = {"negozio": "#1f3864", "club": "#b03a2e", "ritrovo": "#186a3b", "live": "#b9770e"}
        for t, sub in df.groupby("tipo"):
            ax.scatter(sub["lon"], sub["lat"], s=16, alpha=0.5, marker=TYPE_MARK.get(t, "o"),
                       c=palette.get(t, "#555"), label=f"{t} ({len(sub)})", linewidths=0)
    ax.set_xlim(14.13, 14.33)
    ax.set_ylim(40.79, 40.92)
    ax.set_xticks([]); ax.set_yticks([])
    ax.set_title(title, fontsize=13, color="#1f3864")
    ax.legend(loc="lower left", fontsize=9, framealpha=0.9)
    for prov_name in ("Esri.WorldGrayCanvas", "OpenStreetMap.Mapnik", "Esri.WorldStreetMap"):
        try:
            src = cx.providers
            for part in prov_name.split("."):
                src = getattr(src, part)
            cx.add_basemap(ax, crs="EPSG:4326", source=src, attribution_size=5)
            print("bazna karta:", prov_name)
            break
        except Exception as e:
            print("provajder pao", prov_name, str(e)[:100])
    plt.tight_layout()
    out = BASE / fname
    fig.savefig(out, dpi=140, bbox_inches="tight")
    plt.close(fig)
    print("zapisano:", out.name, out.stat().st_size // 1024, "KB")


draw("model", "map_by_model.png", "Napoli 1980 — memoria musicale: DeepSeek vs Gemma 4 (sintetico)")
draw("type", "map_by_type.png", "Napoli 1980 — luoghi per tipo (sintetico, 429 questionari)")
