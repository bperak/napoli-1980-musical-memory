#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Spaja ekstrakcije iz korpusa, čisti šum, geokodira (Photon) i crta kartu."""
import csv
import json
import pathlib
import random
import re
import time
import urllib.parse
import urllib.request
# --- putanje: skripte rade i u repozitoriju (data/, maps/) i u ravnom radnom direktoriju ---
BASE = pathlib.Path(__file__).resolve().parent.parent
DATA = BASE / "data" if (BASE / "data").is_dir() else BASE
MAPS = BASE / "maps" if (BASE / "maps").is_dir() else BASE

UA = {"User-Agent": "Napoli1980Research/1.0 (research; contact: bperak@uniri.hr)"}

DROP_RAW = ["discoteca omonima", "sala giochi", "vomero", "cavone san gennaro", "discoteca kiss kiss"]
MERGE = {"demarcodischi": "demarco"}
DROP = {re.sub(r"\W+", "", d.lower()) for d in DROP_RAW}

GAZ = {
    "via atri": (40.8515, 14.2545), "via costantinopoli": (40.8516, 14.2517),
    "via san giacomo dei capri": (40.8585, 14.2340), "via partenope": (40.8332, 14.2337),
    "via paisiello": (40.8420, 14.2285), "via manzoni": (40.8453, 14.2320),
    "via consalvo carelli": (40.8580, 14.2280),
    "piazza del gesù": (40.8479, 14.2553), "piazza dei martiri": (40.8345, 14.2415),
    "vomero": (40.8439, 14.2255), "chiaia": (40.8330, 14.2280), "sanità": (40.8576, 14.2520),
    "cavalleggeri": (40.8290, 14.2050), "costantinopoli": (40.8516, 14.2517),
}


def norm(n):
    n = re.sub(r"^(il|lo|la|i|gli|le|l')\s+", "", str(n).strip(), flags=re.I)
    return re.sub(r"\W+", "", n.lower())


def load():
    out = {}
    for line in (DATA / "estrazioni_corpus.jsonl").read_text().splitlines():
        if not line.strip():
            continue
        r = json.loads(line)
        k = norm(r.get("nome"))
        if k in MERGE:
            k = MERGE[k]
        if not k or k in DROP:
            continue
        d = out.setdefault(k, {"nome": str(r.get("nome")).strip(), "tipo": r.get("tipo") or "altro",
                               "via": "", "quartiere": "", "anni": "", "citazione": "",
                               "documenti": set(), "url": r.get("url_fonte", "")})
        for f in ("via", "quartiere", "anni"):
            if not d[f] and r.get(f):
                d[f] = str(r[f]).strip()
        if not d["citazione"] and r.get("citazione"):
            d["citazione"] = r["citazione"][:300]
        if r.get("documento"):
            d["documenti"].add(r["documento"])
        if d["tipo"] == "altro" and r.get("tipo"):
            d["tipo"] = r["tipo"]
    # sitne normalizacije imena
    for d in out.values():
        d["nome"] = d["nome"].replace("discoteca kiss kiss", "Kiss Kiss").replace("teatro Ausonia", "Teatro Ausonia")
    return out


def photon(q):
    """Nominatim (1 req/s) pa Photon bez 'lang' (s 'lang' vraća 400)."""
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": q, "format": "jsonv2", "limit": 1, "countrycodes": "it"})
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
            d = json.loads(r.read().decode())
        if d:
            return {"lat": float(d[0]["lat"]), "lon": float(d[0]["lon"]),
                    "label": (d[0].get("display_name") or "")[:70]}
    except Exception:
        pass
    time.sleep(1.1)
    url = "https://photon.komoot.io/api/?" + urllib.parse.urlencode({"q": q, "limit": 1})
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
            d = json.loads(r.read().decode())
    except Exception:
        return None
    feats = d.get("features") or []
    if not feats:
        return None
    c = feats[0]["geometry"]["coordinates"]
    props = feats[0].get("properties", {})
    return {"lat": c[1], "lon": c[0], "label": ", ".join(
        str(props.get(k)) for k in ("name", "street", "city", "district") if props.get(k))}


def gaz(txt):
    t = (txt or "").lower()
    for k, c in GAZ.items():
        if k in t:
            return c
    return None


def main():
    M = load()
    rows = []
    for i, (k, d) in enumerate(sorted(M.items(), key=lambda x: -len(x[1]["documenti"]))):
        coord, prec, how = None, "", ""
        # 1) probaj geokodirati adresu
        for campo, pref in (("via", ""), ("quartiere", "")):
            val = d[campo].strip()
            if not val:
                continue
            q = val if val.lower().startswith(("via", "piazza", "viale")) else val + ", Napoli"
            if "napoli" not in q.lower():
                q = q + ", Napoli"
            hit = photon(q)
            time.sleep(1.1)
            if hit:
                coord, prec, how = (hit["lat"], hit["lon"]), campo, "photon: " + hit["label"][:60]
                break
        # 2) fallback na gazetteer iz teksta
        if not coord:
            g = gaz(d["via"]) or gaz(d["quartiere"]) or gaz(d["nome"])
            if g:
                coord, prec, how = g, "quartiere", "gazetteer"
        if coord:  # mala varijacija da se točke na istom kvartu ne preklope
            rnd = random.Random(i)
            coord = (coord[0] + rnd.uniform(-0.0016, 0.0016), coord[1] + rnd.uniform(-0.0016, 0.0016))
        d.update({"lat": round(coord[0], 5) if coord else "", "lon": round(coord[1], 5) if coord else "",
                  "precisione": prec, "geo_fonte": how,
                  "livello": "B" if len(d["documenti"]) >= 2 else "C",
                  "documenti": " | ".join(sorted(d["documenti"]))})
        rows.append(d)
    fields = ["nome", "tipo", "via", "quartiere", "anni", "lat", "lon", "precisione", "livello",
              "citazione", "documenti", "geo_fonte", "url"]
    with (DATA / "estrazioni_reali.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fields})
    loc = [r for r in rows if r["lat"] != ""]
    print(f"mjesta: {len(rows)} | lokalizirano: {len(loc)} | B: {sum(1 for r in rows if r['livello']=='B')}")
    for r in rows:
        print(f"  {'★' if r['lat'] != '' else '·'} {r['nome'][:26]:26} {r['tipo'][:13]:13} "
              f"{str(r['via'] or r['quartiere'])[:24]:24} {r['livello']} {r['geo_fonte'][:22]}")
    return rows


if __name__ == "__main__":
    main()
