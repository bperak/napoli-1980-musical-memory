"""Estrattore: iz teksta arhivske stranice (novine, fanzine, imenik) vadi mjesta u strukturirane retke.
Izlaz ima istu shemu kao attestati.csv, plus citat i datoteka izvora — da se svaki redak može provjeriti.

Backend se ne bira u kodu nego u okolini (vidi README, odjeljak „Bring your own model"):
  LLM_BASE_URL   — OpenAI-kompatibilni endpoint, npr. https://api.deepseek.com/v1
  LLM_API_KEY    — ključ za taj endpoint
  LLM_MODEL      — naziv modela kod tog endpointa
Ne postoji zadani host: ako varijable nisu postavljene, skripta stane s uputom.
"""
import argparse
import csv
import json
import os
import pathlib
import re
import sys
import time
import urllib.request

BASE = pathlib.Path(__file__).resolve().parent.parent


def endpoint() -> tuple[str, str, str]:
    base = os.environ.get("LLM_BASE_URL", "").rstrip("/")
    key = os.environ.get("LLM_API_KEY", "")
    model = os.environ.get("LLM_MODEL", "")
    if not (base and key and model):
        sys.exit("Postavi LLM_BASE_URL, LLM_API_KEY i LLM_MODEL (bilo koji OpenAI-kompatibilni "
                 "endpoint, vlastiti ključ). Skripta namjerno nema zadani host.")
    return base + "/chat/completions", key, model


ENDPOINT, API_KEY, MODEL = endpoint()

PROMPT = """Sei un estrattore di dati storici. Ti do il testo di una pagina d'archivio su Napoli (anni 1970-1990).
Estrai SOLO i luoghi musicali realmente nominati nel testo: negozi di dischi, club, discoteche, bar con musica,
teatri, centri sociali. Per ognuno restituisci un oggetto JSON con queste chiavi:
  "nome": come scritto nel testo,
  "tipo": uno tra negozio_dischi, club, discoteca, bar, teatro, centro_sociale, altro,
  "via": via o piazza se il testo la nomina, altrimenti "",
  "quartiere": quartiere se nominato, altrimenti "",
  "anni": anni o date nominati nel testo, altrimenti "",
  "citatio": la frase esatta del testo (max 25 parole) in cui il luogo è nominato
Non inventare nulla: se un campo non c'è nel testo, lascialo vuoto.
Rispondi SOLO con un array JSON, nessuna prosa.

TESTO:
---
{testo}
---"""


def call(text: str) -> str:
    payload = {"model": MODEL, "temperature": 0.1, "max_tokens": 3000,
               "messages": [{"role": "user", "content": PROMPT.replace("{testo}", text)}]}
    req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json",
                                          "Authorization": "Bearer " + API_KEY,
                                          "User-Agent": "Napoli80Archivio/1.0"},
                                 method="POST")
    with urllib.request.urlopen(req, timeout=300) as r:
        d = json.loads(r.read().decode())
    return d["choices"][0]["message"]["content"]


def parse(raw: str):
    m = re.search(r"\[.*\]", raw, re.S)
    if not m:
        return []
    try:
        data = json.loads(m.group(0))
    except Exception:
        return []
    out = []
    for r in data if isinstance(data, list) else []:
        if not isinstance(r, dict):
            continue
        nome = str(r.get("nome", "")).strip()
        if len(nome) < 3:
            continue
        out.append({
            "nome": nome[:70],
            "tipo": str(r.get("tipo", "altro"))[:20],
            "via": str(r.get("via", ""))[:60],
            "quartiere": str(r.get("quartiere", ""))[:40],
            "anni": str(r.get("anni", ""))[:30],
            "citatio": str(r.get("citatio") or r.get("citazione", ""))[:300],
        })
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--out", default=str(BASE / "estrazioni.csv"))
    args = ap.parse_args()

    rows, seen = [], set()
    for path in args.files:
        p = pathlib.Path(path)
        text = p.read_text(encoding="utf-8", errors="replace")
        chunks = [text[i:i + 6000] for i in range(0, len(text), 6000)][:6]
        for n, chunk in enumerate(chunks, 1):
            try:
                raw = call(chunk)
            except Exception as e:
                print(f"  {p.name} chunk {n}: GREŠKA {type(e).__name__} {str(e)[:80]}")
                continue
            got = parse(raw)
            for r in got:
                key = re.sub(r"\W+", "", r["nome"].lower())
                if key in seen:
                    continue
                seen.add(key)
                r.update({"fonte_file": p.name, "chunk": n, "estratto_il": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())})
                rows.append(r)
            print(f"  {p.name} chunk {n}: +{len(got)}")
            time.sleep(1)

    out = pathlib.Path(args.out)
    fields = ["nome", "tipo", "via", "quartiere", "anni", "citatio", "fonte_file", "chunk", "estratto_il"]
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"\nzapisano: {out} — {len(rows)} mjesta")


if __name__ == "__main__":
    main()
