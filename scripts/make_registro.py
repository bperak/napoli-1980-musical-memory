#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gradi 'registro di verifica' — kandidatna mjesta iz modela + kolone za arhivsku provjeru."""
import collections
import csv
import json
import pathlib
import re
import unicodedata

BASE = pathlib.Path("/home/agent/napoli1980")


def norm(s):
    s = unicodedata.normalize("NFKD", str(s)).lower()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


rows = list(csv.DictReader((BASE / "napoli1980_places_enriched.csv").open(encoding="utf-8")))
by_key = collections.defaultdict(list)
for r in rows:
    by_key[norm(r["luogo"])].append(r)

cands = []
for key, group in by_key.items():
    models = sorted({g["modello"] for g in group})
    zona = collections.Counter(g["zona"] for g in group).most_common(1)[0][0]
    tipo = collections.Counter(g["tipo"] for g in group).most_common(1)[0][0]
    conf = collections.Counter(g["confidenza"] for g in group).most_common(1)[0][0]
    cands.append({
        "nome_modello": group[0]["luogo"][:70],
        "occorrenze": len(group),
        "modelli": " + ".join(m.split("-")[0] for m in models),
        "tipo": tipo,
        "quartiere": zona[:60],
        "confidenza_modello": conf,
    })
cands.sort(key=lambda c: (-c["occorrenze"], c["nome_modello"]))
top = cands[:30]

HEAD = ["#", "nome (dal modello)", "occorrenze", "modelli", "tipo", "quartiere (dal modello)",
        "confidenza modello", "VERIFICA: fonte", "tipo di fonte", "anno", "indirizzo trovato",
        "lat", "lon", "livello di evidenza", "note"]
LEVELS = "A = documento con indirizzo (licenza, guida, elenco) · B = inserzione/articolo d'epoca · C = testimonianza orale · D = solo modello · vuoto = non verificato"

values = [HEAD]
for i, c in enumerate(top, 1):
    values.append([str(i), c["nome_modello"], str(c["occorrenze"]), c["modelli"], c["tipo"],
                   c["quartiere"], c["confidenza_modello"], "", "", "", "", "", "", "", ""])

FONTI = [
    ["fonte", "dove", "cosa cercare", "livello"],
    ["Emeroteca Tucci — Il Mattino (annate 1978–1989)", "emerotecatucci.it — consultazione in sede, Napoli",
     "inserzioni di concerti, aperture/chiuse di locali, pubblicità di negozi di dischi, cronaca dei concerti", "B"],
    ["Pagine Gialle / elenco telefonico (volumi 1980–1989)", "Biblioteca Nazionale di Napoli 'Vittorio Emanuele III'; mercato antiquario",
     "categorie: sale da ballo, discoteche, negozi di dischi e musicassette, con indirizzo e telefono", "A"],
    ["Comune di Napoli — licenze di pubblico spettacolo / SUAP", "archivio comunale, Polizia Amministrativa",
     "titoli abilitativi per esercizi con musica dal vivo; indirizzo e titolare", "A"],
    ["Archivio di Stato di Napoli", "archiviodistatonapoli.cultura.gov.it",
     "atti notarili e societari di locali ed etichette discografiche; non licenze", "A"],
    ["SIAE — archivio permessi spettacolo", "richiesta all'ufficio SIAE competente",
     "permessi per concerti e serate: data, luogo, organizzatore", "A"],
    ["Stampa musicale d'epoca — Il Mucchio, Rockerilla, Ciao 2001, fanzine locali", "emeroteche, collezioni private, Internet Archive",
     "recensioni, rubriche di scena locale, indirizzi di club e negozi", "B"],
    ["Archivi fotografici (fotografi locali, fototeca comunale, Alinari)", "richiesta diretta / cataloghi online",
     "insegne, interni, date; spesso l'unica prova visiva dell'insegna e dell'incrocio", "B"],
    ["Testimonianze orali strutturate (il questionario di partenza)", "raccolta in classe, con consenso e citazione",
     "nome, zona, anno, aneddoto databile; due testimoni indipendenti = livello C solido", "C"],
    ["Gruppi e forum di memoria urbana (Facebook, forum locali)", "ricerca per nome del locale",
     "foto, volantini, ricordi datati; utile come indizio, mai come prova", "D→C"],
    ["Discogs / MusicBrainz / RateYourMusic", "discogs.com",
     "crediti di etichetta, studi di registrazione, note di copertina con indirizzi", "B"],
    ["Mappe storiche e voli aerei IGM (anni '70–'80)", "IGM, geoportale nazionale, carte tecniche regionali",
     "geometria delle strade e isolati: la via è cambiata meno di quanto sembri, l'edificio sì", "A (geometria)"],
    ["Modello linguistico (DeepSeek, Gemma)", "questo progetto",
     "genera candidati da verificare; non è mai una fonte, è un'ipotesi", "D"],
]

PROTO = [
    ["passo", "cosa fare", "tempo"],
    ["1", "Prendi un nome dal foglio 'candidati'. Non fidarti: è un'ipotesi del modello.", "0 min"],
    ["2", "Cerca il nome in due annate di Il Mattino intorno all'anno dichiarato (Emeroteca Tucci).", "20 min"],
    ["3", "Provа Pagine Gialle dell'anno: la categoria dà indirizzo e telefono, se il locale esisteva.", "10 min"],
    ["4", "Se non compare in nessuna delle due, prova una testimonianza orale: due indipendenti che concordano sull'incrocio.", "15 min"],
    ["5", "Zona trovata: assegnа le coordinate dalla mappa attuale (la via è la stessa), non dal modello.", "5 min"],
    ["6", "Scrivi il livello di evidenza (A/B/C/D) e la fonte esatta con anno e pagina. Vuoto = non verificato.", "5 min"],
    ["7", "Se resta D dopo due tentativi, il candidato si scarta — e si annota perché. Lo scarto è un risultato.", "0 min"],
]

OUT = BASE / "registro_verifica.json"
OUT.write_text(json.dumps({"candidati": values, "fonti": FONTI, "protocollo": PROTO,
                           "livelli": LEVELS}, ensure_ascii=False, indent=1))
print("kandidata:", len(values) - 1, "| izvora:", len(FONTI) - 1, "| koraka:", len(PROTO) - 1)
print("najčešća:", [v[1] for v in values[1:6]])
