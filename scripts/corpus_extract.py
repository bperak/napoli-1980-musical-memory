#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Estrae luoghi musicali da un corpus di documenti reali (DeepSeek), salva JSONL."""
import json
import os
import pathlib
import re
import sys
import time
import urllib.request
# --- putanje: skripte rade i u repozitoriju (data/, maps/) i u ravnom radnom direktoriju ---
BASE = pathlib.Path(__file__).resolve().parent.parent
DATA = BASE / "data" if (BASE / "data").is_dir() else BASE
MAPS = BASE / "maps" if (BASE / "maps").is_dir() else BASE

CORPUS = BASE / "corpus"
OUT = DATA / "estrazioni_corpus.jsonl"

PROMPT = """Sei un estrattore di dati storici. Dal TESTO estrai SOLO i luoghi musicali di Napoli nominati
esplicitamente (negozi di dischi, club, discoteche, teatri, centri sociali, radio, piazze o muretti usati come
ritrovo). Per ognuno restituisci: nome (come nel testo), tipo
(negozio_dischi|club|discoteca|teatro|centro_sociale|radio|ritrovo|altro), via (via o piazza se nominata,
altrimenti ""), quartiere (se nominato, altrimenti ""), anni (date o anni nominati, altrimenti ""),
citazione (la frase esatta del testo, massimo 30 parole).
Non inventare nulla. Rispondi SOLO con un array JSON.

TESTO:
---
{testo}
---"""


def key():
    """Ključ isključivo iz okoline — nikad iz datoteke u repozitoriju."""
    k = os.environ.get("LLM_API_KEY") or os.environ.get("DEEPSEEK_API_KEY", "")
    if not k:
        print("Postavi LLM_API_KEY (ili DEEPSEEK_API_KEY) u okolinu.")
    return k


def call(prompt, k):
    body = json.dumps({"model": os.environ.get("LLM_MODEL", "deepseek-chat"), "temperature": 0.1, "max_tokens": 3000,
                       "messages": [{"role": "user", "content": prompt}]}).encode()
    base = os.environ.get("LLM_BASE_URL", "https://api.deepseek.com/v1").rstrip("/")
    req = urllib.request.Request(base + "/chat/completions", data=body,
                                 headers={"Content-Type": "application/json",
                                          "Authorization": "Bearer " + k}, method="POST")
    with urllib.request.urlopen(req, timeout=240) as r:
        return json.loads(r.read().decode())["choices"][0]["message"]["content"]


def parse(raw):
    m = re.search(r"\[.*\]", raw, re.S)
    if not m:
        return []
    try:
        data = json.loads(m.group(0))
    except Exception:
        return []
    return [r for r in data if isinstance(r, dict) and len(str(r.get("nome", "")).strip()) > 2]


def docs():
    out = {}
    for p in sorted(CORPUS.glob("doc_*.md")):
        t = p.read_text(errors="replace")
        title = re.search(r"TITLE:\s*(.+)", t)
        url = re.search(r"URL:\s*(\S+)", t)
        body = t.split("\n\n", 1)[-1]
        out[f"{title.group(1).strip()[:70] if title else p.stem}"] = {"text": body, "url": url.group(1) if url else ""}
    for extra, name in [("ricerca/src_0.md", "L'Indiependente — Spacca Napoli #3"),
                        ("ricerca/rs_napoli_80.md", "Capasso, Ten Cities — estratto Rolling Stone")]:
        p = BASE / extra
        if p.exists():
            out[name] = {"text": p.read_text(errors="replace"), "url": ""}
    return out


def main():
    k = key()
    if not k:
        print("nema DEEPSEEK_API_KEY")
        return 1
    D = docs()
    print(f"dokumenata: {len(D)} | znakova: {sum(len(v['text']) for v in D.values())}", flush=True)
    done = 0
    with OUT.open("a", encoding="utf-8") as f:
        for nome, meta in D.items():
            testo = re.sub(r"\s+", " ", meta["text"])
            step, span = 4200, 5400
            for i in range(0, len(testo), step):
                chunk = testo[i:i + span]
                if len(chunk) < 400:
                    continue
                try:
                    rows = parse(call(PROMPT.replace("{testo}", chunk), k))
                except Exception as e:
                    print(f"  ERR {nome[:35]} blok {i//step}: {type(e).__name__} {str(e)[:70]}", flush=True)
                    time.sleep(3)
                    continue
                for r in rows:
                    r["documento"] = nome
                    r["url_fonte"] = meta["url"]
                    r["metodo"] = "llm"
                for r in rows:
                    f.write(json.dumps(r, ensure_ascii=False) + "\n")
                done += len(rows)
                print(f"  {nome[:38]:38} blok {i//step:2}: +{len(rows):2} (ukupno {done})", flush=True)
                time.sleep(0.8)
    print(f"GOTOVO — redaka: {done}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
