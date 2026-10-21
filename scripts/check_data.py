#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Verifica la tabella dei luoghi prima di un commit o di un pull request.

Regola del progetto: nessuna riga senza citazione, nessuna riga senza fonte, nessuna
coordinata fuori da Napoli. Lo script esce con codice 1 se trova errori, così GitHub
Actions può bloccare il merge.

Uso:
    python scripts/check_data.py                       # controlla i file di default
    python scripts/check_data.py data/mio_file.csv     # controlla un file specifico
"""
from __future__ import annotations

import csv
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT = [ROOT / "data" / "estrazioni_reali.csv", ROOT / "data" / "attestati.csv"]

# riquadro che contiene Napoli e i comuni della prima cintura (Acerra compresa)
BBOX = (40.70, 41.00, 13.95, 14.55)  # lat_min, lat_max, lon_min, lon_max
LIVELLI = {"A", "B", "C", "D"}
TIPI = {"club", "discoteca", "negozio_dischi", "teatro", "centro_sociale", "radio", "ritrovo", "altro"}

REQUIRED = {
    "estrazioni_reali.csv": ["nome", "tipo", "via", "quartiere", "anni", "lat", "lon",
                             "precisione", "livello", "citazione", "documenti"],
    "attestati.csv": ["nome", "tipo", "luogo", "anni", "livello", "fonte", "nota"],
}

# la tabella della mappa pretende la citazione; il registro storico degli attestati nasce
# da fonti già citate nel foglio «fonti», quindi lì la citazione è raccomandata, non obbligatoria
CITAZIONE_OBBLIGATORIA = {"estrazioni_reali.csv"}
TIPO_CONTROLLATO = {"estrazioni_reali.csv"}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\W+", "", s)


def check_file(path: Path) -> tuple[list[str], list[str], int]:
    errors: list[str] = []
    warnings: list[str] = []
    if not path.exists():
        return [f"{path.name}: file non trovato"], [], 0

    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames or []
        rows = list(reader)

    required = REQUIRED.get(path.name)
    if required:
        missing = [c for c in required if c not in cols]
        if missing:
            errors.append(f"{path.name}: colonne mancanti → {', '.join(missing)}")
    if not rows:
        errors.append(f"{path.name}: nessuna riga")
        return errors, warnings, 0

    seen: dict[str, int] = {}
    for i, row in enumerate(rows, start=2):  # 2 = prima riga dopo l'intestazione
        nome = (row.get("nome") or "").strip()
        if len(nome) < 2:
            errors.append(f"{path.name}:{i}: nome mancante o troppo corto")
            continue
        k = norm(nome)
        if k in seen:
            errors.append(f"{path.name}:{i}: nome duplicato «{nome}» (già alla riga {seen[k]})")
        else:
            seen[k] = i

        cit = (row.get("citazione") or "").strip()
        fonte = (row.get("documenti") or row.get("fonte") or "").strip()
        if path.name in CITAZIONE_OBBLIGATORIA and len(cit) < 15:
            errors.append(f"{path.name}:{i}: «{nome}» senza citazione (minimo 15 caratteri)")
        elif cit and len(cit) < 15:
            warnings.append(f"{path.name}:{i}: «{nome}» citazione troppo breve")
        if not fonte:
            errors.append(f"{path.name}:{i}: «{nome}» senza fonte")

        liv = (row.get("livello") or "").strip().upper()
        if liv and liv not in LIVELLI:
            errors.append(f"{path.name}:{i}: livello «{liv}» non valido (A, B, C o D)")
        if liv == "D":
            warnings.append(f"{path.name}:{i}: «{nome}» è livello D — può stare nella tabella, non sulla mappa")

        tipo = (row.get("tipo") or "").strip().lower()
        if path.name in TIPO_CONTROLLATO and tipo and tipo not in TIPI:
            warnings.append(f"{path.name}:{i}: tipo «{tipo}» fuori elenco ({', '.join(sorted(TIPI))})")

        lat, lon = (row.get("lat") or "").strip(), (row.get("lon") or "").strip()
        if lat or lon:
            try:
                la, lo = float(lat.replace(",", ".")), float(lon.replace(",", "."))
            except ValueError:
                errors.append(f"{path.name}:{i}: «{nome}» coordinate non numeriche ({lat}, {lon})")
                continue
            if not (BBOX[0] <= la <= BBOX[1] and BBOX[2] <= lo <= BBOX[3]):
                errors.append(f"{path.name}:{i}: «{nome}» coordinate fuori dall'area di Napoli "
                              f"({la}, {lo})")
            if not (row.get("precisione") or "").strip():
                warnings.append(f"{path.name}:{i}: «{nome}» ha coordinate ma non dice la precisione "
                                f"(via, quartiere, città)")
    return errors, warnings, len(rows)


def main(argv: list[str]) -> int:
    files = [Path(a) for a in argv[1:]] or DEFAULT
    total_err, total_warn, total_rows = 0, 0, 0
    for path in files:
        errors, warnings, n = check_file(path)
        total_err += len(errors)
        total_warn += len(warnings)
        total_rows += n
        status = "OK" if not errors else "ERRORI"
        print(f"\n{path.name}: {n} righe — {status}")
        for e in errors:
            print(f"  ✗ {e}")
        for w in warnings:
            print(f"  ! {w}")
    print(f"\nriepilogo: {total_rows} righe, {total_err} errori, {total_warn} avvisi")
    if total_err:
        print("\nLa regola del progetto: nessuna riga senza citazione, nessuna riga senza fonte.\n"
              "Correggi gli errori sopra e riprova. Se una fonte non esiste, la riga non entra.")
        return 1
    print("Tutto in ordine: ogni riga ha nome, citazione e fonte.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
