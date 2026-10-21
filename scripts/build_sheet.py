#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Slaže Google Sheet 'Napoli anni 80' iz generiranih JSONL redaka + jednog stvarnog odgovora.
Tri lista: risposte (podaci), domande (mapiranje ključ→pitanje), legenda (značenje metapodataka)."""
import csv
import json
import pathlib
import re
import sys
import zipfile

sys.path.insert(0, "/home/agent/.hermes/skills/productivity/google-workspace/scripts")
from google_api import build_service

BASE = pathlib.Path("/home/agent/napoli1980")

DOMANDE = [
    ("anno_nascita", "Indica il tuo anno di nascita"),
    ("genere", "Indica il tuo genere di appartenenza"),
    ("econ_stabile", "La mia famiglia era economicamente stabile"),
    ("econ_preoccupazioni", "Nella mia famiglia raramente ci si doveva preoccupare per le questioni economiche"),
    ("econ_permettersi", "La mia famiglia poteva permettersi la maggior parte delle cose che desideravamo"),
    ("zona_residenza", "Quartiere di residenza a Napoli negli anni '80"),
    ("negozio_nome", "Quale era il tuo negozio di rivendite, ufficiale o non ufficiale, di dischi/musicassette preferiti nella Napoli degli anni '80?"),
    ("negozio_genere", "Che genere di musica puoi associare prevalentemente a questo negozio rivendita?"),
    ("negozio_zona", "In che zona si trovava il negozio?"),
    ("negozio_descrizione", "Ci aiuti a ricordare dove si trovava e ci lasci una descrizione o un ricordo di questo negozio o rivendita?"),
    ("club_nome", "Quali erano i tuoi club/discoteca preferiti nella Napoli degli anni '80?"),
    ("club_genere", "Che genere di musica si ascoltava prevalentemente?"),
    ("club_zona", "In che zona si trovava il club?"),
    ("club_dove", "Ti ricordi dove si trovava il club?"),
    ("ritrovo_bar", "Quali erano il bar, la piazzetta o il muretto dove tu e il tuo gruppo vi incontravate, dove magari c'era un jukebox o musica?"),
    ("locale_live", "C'era un locale specifico che frequentavi per la musica dal vivo o per le jam session?"),
    ("luogo_concerti_mancante", "Qual è il luogo per concerti a Napoli che ti manca di più o a cui sei più legato/a?"),
    ("concerto_memorabile", "Qual è il concerto più memorabile a cui hai assistito a Napoli negli anni '80?"),
    ("teleportazione", "Se potessi teletrasportarti per una sola sera in uno di questi luoghi della Napoli anni '80, dove andresti e perché? Raccontaci un breve aneddoto!"),
]

META = [
    ("respondent_id", "Identificativo del questionario compilato (modello-lotto-numero)"),
    ("modello", "Modello che ha compilato il questionario"),
    ("modello_id", "Identificativo tecnico del modello presso il fornitore"),
    ("prompt_versione", "Versione del prompt di generazione"),
    ("sintetico", "SI = risposta generata da un modello, NON una persona intervistata"),
    ("confidenza_luoghi", "Autovalutazione del modello: alta / media / bassa sulla realtà dei luoghi citati"),
    ("lotto", "Numero del lotto di generazione"),
    ("generato_il", "Data e ora di generazione (UTC)"),
]

COLUMNS = [k for k, _ in DOMANDE] + [k for k, _ in META]


def load_rows():
    rows = []
    for f in sorted(BASE.glob("rows_*.jsonl")):
        if "_w" in f.stem:
            continue
        for line in f.open(encoding="utf-8"):
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def real_row_from_ivan():
    """Jedan stvarni odgovor iz Ivanove tablice, da bude referenca uz sintetičke."""
    path = pathlib.Path("/tmp/ivansheet.xlsx")
    if not path.exists():
        return None
    try:
        z = zipfile.ZipFile(path)
        shared = re.findall(r"<t[^>]*>(.*?)</t>", z.read("xl/sharedStrings.xml").decode("utf-8", "replace"), re.S)
        sheet = z.read("xl/worksheets/sheet1.xml").decode("utf-8", "replace")
        rows = re.findall(r"<row[^>]*>(.*?)</row>", sheet, re.S)
        data = []
        for r in rows:
            cells = re.findall(r'<c r="([A-Z]+)\d+"[^>]*?(?: t="s")?[^>]*>(?:<v>(.*?)</v>)?', r)
            vals = []
            for _, v in cells:
                if v is None:
                    vals.append("")
                elif v.isdigit() and int(v) < len(shared):
                    vals.append(shared[int(v)])
                else:
                    vals.append(v)
            data.append(vals)
        # redak s odgovorom: prvi koji ima popunjen stupac C (genere)
        for row in data:
            if len(row) > 3 and row[3] in ("Maschio", "Femmina", "Altro"):
                keys = [k for k, _ in DOMANDE]
                out = {k: (row[i] if i < len(row) else "") for i, k in enumerate(keys[:19])}
                out.update({"respondent_id": "reale-001", "modello": "risposta reale (Digital History / Federico II)",
                            "modello_id": "n/a", "prompt_versione": "n/a", "sintetico": "NO",
                            "confidenza_luoghi": "alta", "lotto": "", "generato_il": ""})
                return out
    except Exception as e:
        print("stvarni redak nije izvučen:", e)
    return None


def main():
    rows = load_rows()
    real = real_row_from_ivan()
    if real:
        rows.append(real)
    print("redaka ukupno:", len(rows))
    from collections import Counter
    print("po modelu:", dict(Counter(r.get("modello", "") for r in rows)))

    csv_path = BASE / "napoli1980_synthetic.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in COLUMNS})
    print("CSV:", csv_path, csv_path.stat().st_size, "B")

    # --- Google Sheets ---
    sheets = build_service("sheets", "v4")
    drive = build_service("drive", "v3")
    title = "Napoli anni 80 — memoria musicale (sintetica)"
    found = drive.files().list(q=f"name = '{title}' and trashed = false",
                               fields="files(id,name)").execute().get("files", [])
    if found:
        sid = found[0]["id"]
        print("postojeći sheet:", sid)
    else:
        sid = sheets.spreadsheets().create(
            body={"properties": {"title": title, "locale": "it_IT"},
                  "sheets": [{"properties": {"title": "risposte"}},
                             {"properties": {"title": "domande"}},
                             {"properties": {"title": "legenda"}}]},
            fields="spreadsheetId").execute()["spreadsheetId"]
        print("novi sheet:", sid)

    def write_range(rng, values):
        sheets.spreadsheets().values().update(
            spreadsheetId=sid, range=rng, valueInputOption="RAW",
            body={"values": values}).execute()

    try:
        sheets.spreadsheets().values().clear(spreadsheetId=sid, range="risposte!A1:Z100000").execute()
    except Exception as e:
        print("clear preskočen:", str(e)[:100])
    data = [COLUMNS] + [[r.get(c, "") for c in COLUMNS] for r in rows]
    write_range("risposte!A1", data)
    write_range("domande!A1", [["chiave", "domanda (come nel modulo)"]] + [[k, q] for k, q in DOMANDE])
    write_range("legenda!A1", [["campo", "significato"]] + [[k, m] for k, m in META])

    # formatiranje: podebljan header, zamrznut prvi red
    sheet_ids = {s["properties"]["title"]: s["properties"]["sheetId"]
                 for s in sheets.spreadsheets().get(spreadsheetId=sid).execute()["sheets"]}
    reqs = []
    for t in ("risposte", "domande", "legenda"):
        reqs.append({"repeatCell": {
            "range": {"sheetId": sheet_ids[t], "startRowIndex": 0, "endRowIndex": 1},
            "cell": {"userEnteredFormat": {"textFormat": {"bold": True}}},
            "fields": "userEnteredFormat.textFormat.bold"}})
        reqs.append({"updateSheetProperties": {
            "properties": {"sheetId": sheet_ids[t], "gridProperties": {"frozenRowCount": 1}},
            "fields": "gridProperties.frozenRowCount"}})
    sheets.spreadsheets().batchUpdate(spreadsheetId=sid, body={"requests": reqs}).execute()

    drive.permissions().create(fileId=sid, body={"type": "anyone", "role": "reader"},
                               fields="id").execute()
    url = f"https://docs.google.com/spreadsheets/d/{sid}/edit"
    print("URL:", url)
    print("CSV export:", f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv")
    (BASE / "sheet_info.json").write_text(json.dumps({
        "spreadsheet_id": sid, "url": url,
        "csv_url": f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv",
        "rows": len(rows)}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
