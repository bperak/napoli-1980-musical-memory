#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sloj attestati: mjesta potvrđena u izvorima (pritisak, novine, arhivi) — za razliku od modela."""
import csv
import json
import pathlib

BASE = pathlib.Path(__file__).resolve().parent.parent
OUT = BASE / "attestati.csv"

FIELDS = ["nome", "tipo", "luogo", "quartiere", "anni", "lat", "lon", "precisione_geo",
          "fonte", "livello", "nota"]

ROWS = [
    dict(nome="Diamond Dogs", tipo="club underground", luogo="Cavone, ipogeo (cisterne acquedotto)",
         quartiere="Sanità", anni="1984–1987/88", lat=40.8576, lon=14.2520, precisione_geo="quartiere",
         fonte="D. Capasso, in Ten Cities (Goethe-Institut / Spector Books), estratto su Rolling Stone; "
               "la Repubblica Napoli 13.10.2016; Corriere Napoli",
         livello="B", nota="aperto 11.06.1984; archivio fotografico Toty Ruggieri 1984–1987; "
                           "chiusura 1987 (libro) / 1988 (Capasso) — discrepanza da sciogliere"),
    dict(nome="ZX", tipo="punk club", luogo="via Atri", quartiere="Centro Storico (Tribunali/Atri)",
         anni="≈1979–1983", lat=40.8515, lon=14.2545, precisione_geo="via",
         fonte="l'Indiependente, 'Spacca Napoli #3'; Corriere Napoli (cultura)",
         livello="B", nota="pubblico legato al negozio De Marco Dischi e ai fanzine Megawave"),
    dict(nome="Trilogy", tipo="club", luogo="collina del Vomero", quartiere="Vomero",
         anni="inizi anni '80", lat=40.8439, lon=14.2255, precisione_geo="quartiere",
         fonte="D. Capasso, Rolling Stone (estratto Ten Cities)", livello="C",
         nota="in consolle Gigi D'Aria, 'primo dj alternativo della scena' — jedna potvrda"),
    dict(nome="Pulsar", tipo="club", luogo="via Santa Maria di Costantinopoli", quartiere="Centro Storico",
         anni="inizi anni '80", lat=40.8516, lon=14.2517, precisione_geo="via",
         fonte="D. Capasso, Rolling Stone (estratto Ten Cities)", livello="C",
         nota="samo jedna potvrda; broj kuće nepoznat"),
    dict(nome="Caffè della Luna", tipo="bar/club", luogo="Chiaia", quartiere="Chiaia",
         anni="inizi anni '80", lat=40.8353, lon=14.2283, precisione_geo="quartiere",
         fonte="D. Capasso, Rolling Stone (estratto Ten Cities)", livello="C",
         nota="samo jedna potvrda; adresa nepoznata"),
    dict(nome="Kiss Kiss", tipo="discoteca", luogo="Napoli (obitelj Niespolo)", quartiere="—",
         anni="od 1972", lat=40.8450, lon=14.2500, precisione_geo="città",
         fonte="D. Capasso, Rolling Stone; voci.fm (povijest Radio Kiss Kiss)", livello="B",
         nota="iz kluba 12.09.1976. rođen radio Kiss Kiss (89.00, emisija 'discolive', dj Sasà Capobianco)"),
    dict(nome="Galapagos", tipo="discoteca", luogo="Vomero / Chiaia / Posillipo (bez adrese)", quartiere="—",
         anni="anni '80", lat=40.8400, lon=14.2300, precisione_geo="città",
         fonte="D. Capasso, Rolling Stone", livello="C", nota="imenovan u nizu klubova 'Napoli bene'; adresa nije navedena"),
    dict(nome="Papillon", tipo="discoteca", luogo="Vomero / Chiaia / Posillipo (bez adrese)", quartiere="—",
         anni="anni '80", lat=40.8390, lon=14.2320, precisione_geo="città",
         fonte="D. Capasso, Rolling Stone", livello="C", nota="kao gore"),
    dict(nome="Piccadilly", tipo="discoteca", luogo="Vomero / Chiaia / Posillipo (bez adrese)", quartiere="—",
         anni="anni '80", lat=40.8380, lon=14.2340, precisione_geo="città",
         fonte="D. Capasso, Rolling Stone", livello="C", nota="kao gore"),
    dict(nome="La Mela", tipo="discoteca", luogo="Vomero / Chiaia / Posillipo (bez adrese)", quartiere="—",
         anni="anni '80", lat=40.8370, lon=14.2360, precisione_geo="città",
         fonte="D. Capasso, Rolling Stone", livello="C", nota="kao gore"),
    dict(nome="De Marco Dischi", tipo="negozio dischi", luogo="Centro Storico", quartiere="Centro Storico",
         anni="anni '80", lat=40.8515, lon=14.2565, precisione_geo="quartiere",
         fonte="l'Indiependente, 'Spacca Napoli #3'", livello="C",
         nota="spominje se kao mjesto odakle dolazi punk publika; adresa za potvrdu u Pagine Gialle"),
    dict(nome="Disco d'Oro", tipo="negozio dischi", luogo="via Raffaele Morghen 31 (od 1981.), prije via Marconi",
         quartiere="Vomero", anni="od 1976", lat=40.8430, lon=14.2339, precisione_geo="via",
         fonte="Corriere Viaggi, pregled povijesnih trgovina diskovima u Italiji", livello="B",
         nota="adresu treba potvrditi u izvoru iz 1980-ih (Pagine Gialle); danas na toj adresi druga trgovina"),
    dict(nome="Shaker Club", tipo="night club", luogo="via Nazario Sauro", quartiere="San Ferdinando",
         anni="1950-e (kontekst)", lat=40.8301, lon=14.2502, precisione_geo="via",
         fonte="D. Capasso, Rolling Stone", livello="B", nota="kontekst: nastupi Renata Carosonea"),
    dict(nome="Lloyd", tipo="night club", luogo="via Partenope", quartiere="San Ferdinando",
         anni="1950-e (kontekst)", lat=40.8298, lon=14.2493, precisione_geo="via",
         fonte="D. Capasso, Rolling Stone", livello="B", nota="kontekst"),
    dict(nome="Teatro Ausonia", tipo="teatro / koncerti", luogo="Napoli (centro)", quartiere="Centro Storico",
         anni="studeni 1984.", lat=40.8450, lon=14.2550, precisione_geo="città",
         fonte="D. Capasso, Rolling Stone", livello="C",
         nota="Nick Cave, koncert koji su organizirali Diamond Dogs; točna adresa za potvrdu"),
    dict(nome="Segnali di Accelerazione", tipo="centro sociale", luogo="Acerra (provincija)", quartiere="Acerra",
         anni="sredina '80-ih", lat=40.9461, lon=14.3750, precisione_geo="comune",
         fonte="D. Capasso, Rolling Stone", livello="C", nota="prvi centri sociali; gemellaggio s Diamond Dogs"),
]

with OUT.open("w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=FIELDS)
    w.writeheader()
    for r in ROWS:
        w.writerow({k: r.get(k, "") for k in FIELDS})

(BASE / "attestati.json").write_text(json.dumps(ROWS, ensure_ascii=False, indent=1), encoding="utf-8")
from collections import Counter
print("zapisano:", OUT, len(ROWS), "mjesta")
print("po razini:", dict(Counter(r["livello"] for r in ROWS)))
print("po tipu:", dict(Counter(r["tipo"] for r in ROWS)))
