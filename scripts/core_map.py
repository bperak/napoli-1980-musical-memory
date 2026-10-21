#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Karta 'jezgre': samo imena koja se kod istog modela ponavljaju ≥3 puta.
Poanta: 1.304 različita imena, 20 zajedničkih — modeli ne pamte grad, nego proizvode uvjerljiva imena."""
import collections
import csv
import re
import unicodedata
import warnings

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import contextily as cx

warnings.filterwarnings("ignore")
BASE = str(pathlib.Path(__file__).resolve().parent.parent) + "/"
df = pd.read_csv(BASE + "napoli1980_places_enriched.csv")


def norm(s):
    s = unicodedata.normalize("NFKD", str(s)).lower()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


df["key"] = df["luogo"].map(norm)
df = df.dropna(subset=["lat", "lon"])

# jezgra: ime se kod istog modela pojavljuje barem 3 puta
core_keys = {}
for m, sub in df.groupby("modello"):
    c = collections.Counter(sub["key"])
    core_keys[m] = {k for k, v in c.items() if v >= 3}
df["jezgra"] = [r.key in core_keys.get(r.modello, set()) for r in df.itertuples()]
core = df[df["jezgra"]]

print("svih točaka:", len(df), "| jezgra:", len(core), f"({len(core)/len(df):.0%})")
print("po modelu:", core.groupby("modello").size().to_dict())

COLORS = {"deepseek-flash": "#1f3864", "gemma4-26b-local": "#b03a2e"}
fig, axes = plt.subplots(1, 2, figsize=(15, 7.2))

# lijevo: sve točke (sivo) + jezgra (boja)
ax = axes[0]
ax.scatter(df["lon"], df["lat"], s=8, c="#c8c8c8", alpha=0.6, linewidths=0, label="pojedinačna imena")
for m, sub in core.groupby("modello"):
    ax.scatter(sub["lon"], sub["lat"], s=26, c=COLORS.get(m, "#555"), alpha=0.85,
               linewidths=0.4, edgecolors="white", label=f"jezgra — {m} ({len(sub)})")
ax.set_xlim(14.13, 14.33); ax.set_ylim(40.79, 40.92)
ax.set_xticks([]); ax.set_yticks([])
ax.set_title("Tutto il dataset: 1.716 luoghi, 1.304 nomi distinti", fontsize=12, color="#1f3864")
ax.legend(loc="lower left", fontsize=8.5, framealpha=0.92)

# desno: samo jezgra + najčešća imena
ax = axes[1]
for m, sub in core.groupby("modello"):
    ax.scatter(sub["lon"], sub["lat"], s=30, c=COLORS.get(m, "#555"), alpha=0.85,
               linewidths=0.4, edgecolors="white", label=f"{m} ({len(sub)})")
top = collections.Counter(core["key"]).most_common(7)
for key, _ in top:
    r = core[core["key"] == key].iloc[0]
    ax.annotate(r["luogo"][:26], (r["lon"], r["lat"]), fontsize=7.5, color="#333",
                xytext=(4, 4), textcoords="offset points")
ax.set_xlim(14.13, 14.33); ax.set_ylim(40.79, 40.92)
ax.set_xticks([]); ax.set_yticks([])
ax.set_title(f"Solo la “memoria stabile”: nomi ripetuti ≥3 volte ({len(core)} punti, "
             f"{sum(len(v) for v in core_keys.values())} nomi)", fontsize=12, color="#1f3864")
ax.legend(loc="lower left", fontsize=8.5, framealpha=0.92)

for a in axes:
    try:
        cx.add_basemap(a, crs="EPSG:4326", source=cx.providers.Esri.WorldGrayCanvas, attribution_size=4)
    except Exception as e:
        print("podloga:", str(e)[:80])

fig.suptitle("Napoli 1980 — memoria musicale: quanto è stabile ciò che i modelli “ricordano”",
             fontsize=13.5, color="#1f3864", y=0.98)
plt.tight_layout(rect=[0, 0, 1, 0.96])
out = BASE + "map_core_vs_all.png"
fig.savefig(out, dpi=145, bbox_inches="tight")
print("zapisano:", out)

# brojke za govor
ms = sorted(df["modello"].unique())
sets = {m: set(df.loc[df["modello"] == m, "key"]) for m in ms}
inter = sets[ms[0]] & sets[ms[1]]
print(f"\nza govor: {len(df)} zapisa, {df['key'].nunique()} imena, "
      f"{len(inter)} zajedničkih ({len(inter)/df['key'].nunique():.1%}), jezgra {len(core)} točaka "
      f"({len(core)/len(df):.0%})")
print("najčešća imena u jezgri:", [k for k, _ in collections.Counter(core['key']).most_common(10)])
