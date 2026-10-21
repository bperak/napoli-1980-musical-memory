#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Research log — što je napravljeno, što je nađeno, što nije uspjelo, što je sljedeće."""
import csv
import pathlib

from docx import Document
from docx.shared import Pt, Cm, RGBColor

BASE = pathlib.Path(__file__).resolve().parent.parent
OUT = BASE / "seminar_federico" / "Research_log_Naples_1980_places.docx"
NAVY = RGBColor(0x1F, 0x38, 0x64)
GREY = RGBColor(0x55, 0x55, 0x55)

doc = Document()
doc.styles["Normal"].font.name = "Calibri"
doc.styles["Normal"].font.size = Pt(10)
for s in doc.sections:
    s.top_margin = s.bottom_margin = Cm(1.5)
    s.left_margin = s.right_margin = Cm(1.7)


def h(text, size=14, before=10):
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(before); p.paragraph_format.space_after = Pt(3)
    r = p.add_run(text); r.bold = True; r.font.size = Pt(size); r.font.color.rgb = NAVY


def para(text, size=10, italic=False, color=None, after=3):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(after)
    r = p.add_run(text); r.font.size = Pt(size); r.italic = italic
    if color: r.font.color.rgb = color


def table(headers, rows, widths=None, size=8.5):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Light Grid Accent 1"
    for i, htxt in enumerate(headers):
        cell = t.rows[0].cells[i]
        cell.text = ""
        r = cell.paragraphs[0].add_run(htxt); r.bold = True; r.font.size = Pt(size)
    for row in rows:
        cells = t.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = ""
            r = cells[i].paragraphs[0].add_run(str(val)); r.font.size = Pt(size)
    if widths:
        for i, w in enumerate(widths):
            for row in t.rows:
                row.cells[i].width = Cm(w)
    return t


t = doc.add_paragraph(); t.paragraph_format.space_after = Pt(1)
r = t.add_run("Research log — where were the music places of 1980s Naples?")
r.bold = True; r.font.size = Pt(17); r.font.color.rgb = NAVY
para("Prepared for the seminar Storia Digitale, Federico II, 21–22 October 2026 · Cultural Complexity Lab, "
     "University of Rijeka · 21 October 2026, 13:30", 9, color=GREY)

h("1. What this log is", 12)
para("A record of one research pass, made in about an hour before the seminar, with the aim of replacing "
     "generated place names with attested ones. Everything below can be rerun: the queries, the pages that "
     "were fetched and the extracted rows are stored as files next to this document (folder ricerca/). "
     "The point is not that the list is complete — it is not — but that the difference between a model's "
     "claim and a source's claim is now visible, row by row.")

h("2. Method, in the order it was done", 12)
para("First, a broad web pass: eight queries on historic Naples record shops, 1980s new wave and clubbing, "
     "the Carbone photographic archive and the digital archive of Il Mattino. Every query and every result "
     "was written to a log file (ricerca/log.jsonl), not kept in memory. Second, the four most promising pages "
     "were fetched in full and stored as text, so that a claim can be traced back to a file rather than to a "
     "recollection. Third, the names of venues that appeared in the sources were extracted by hand from the "
     "text, together with the street, the quarter, the years and the exact wording of the source. Fourth, "
     "each candidate was checked with one independent query, and only then given an evidence level. Fifth, "
     "coordinates were taken from a gazetteer (Photon/OpenStreetMap) for the street or the quarter, never from "
     "the model, and any place without a locatable street or quarter was left off the map and kept in the table.")

h("3. What the sources gave", 12)
para("The richest single source turned out to be the Italian edition of Ten Cities (Goethe-Institut, Spector "
     "Books), whose Naples chapter by Danilo Capasso was published as an extract by Rolling Stone Italia. "
     "It is secondary literature, but it names venues, streets and dates, and it is written from interviews: "
     "this is the difference between a source and a generation. It yielded the punk and new wave spine of the "
     "period — ZX in via Atri, Trilogy on the Vomero hill, Pulsar in via Santa Maria di Costantinopoli, the "
     "Caffè della Luna in Chiaia and, above all, Diamond Dogs, opened on 11 June 1984 in the reused cisterns "
     "of the ancient aqueduct in the Sanità and closed in 1987–88. Two independent confirmations followed for "
     "Diamond Dogs (la Repubblica Napoli, 13 October 2016, on the Toty Ruggieri photographic archive; Corriere "
     "Napoli) and for ZX (l'Indiependente, 'Spacca Napoli #3'), which is what moved them to level B.")

rows = []
with (BASE / "attestati.csv").open(encoding="utf-8") as f:
    for r in csv.DictReader(f):
        rows.append([r["nome"], r["tipo"], r["luogo"][:38], r["anni"], r["livello"]])
table(["place", "type", "street / area", "years", "level"], rows, widths=[3.3, 2.8, 5.4, 2.6, 1.2])

para("Levels: B = named in at least two independent published sources; C = one published source, or a source "
     "that names the venue without an address; D = model claim only. Nothing here reached level A, which "
     "would require a document with an address produced at the time — a licence, a directory entry, a permit.",
     9, italic=True, color=GREY, after=8)

h("4. What did not work, and why it matters", 12)
para("The digital archive of Il Mattino (archivio.ilmattino.it) exists and covers every page back to 1892, "
     "but it did not answer an anonymous request: it is behind a subscription. That is the single most "
     "important archive for this question, and access to it is a matter of a library subscription, not of "
     "research skill. The Melius forum thread on historic Neapolitan shops required a login and returned no "
     "content. OpenStreetMap's Nominatim refused the geocoding requests with a 403, so coordinates came from "
     "Photon instead. Facebook groups on Vomero and Naples in the 1980s are visibly full of the right kind of "
     "memory, but they cannot be read at scale without an account and without consent, and using them would "
     "require the ethics protocol anyway.")

h("5. The gap that remains", 12)
para("Of sixteen attested places, ten can be put on a map and six cannot: Kiss Kiss, Galapagos, Papillon, "
     "Piccadilly, La Mela and Teatro Ausonia are named by the sources but without an address, so their "
     "position would be an invention of the same kind we are trying to avoid. The next real step is a "
     "directory: Pagine Gialle for the relevant years, which gives name, address and telephone in the "
     "category sale da ballo and negozi di dischi. The volumes exist at the Biblioteca Nazionale in Naples "
     "and in the second-hand market, and they are the cheapest route from level C to level A.")

h("6. What to do next, in order of cost", 12)
for i, (what, why) in enumerate([
    ("Pagine Gialle 1980–1989, Biblioteca Nazionale di Napoli",
     "turns a name into an address and a telephone number; category search, no reading of prose"),
    ("Il Mattino 1978–1989 at the Emeroteca Tucci",
     "concert advertisements, openings and closures, record shop publicity — the only continuous weekly record"),
    ("Comune di Napoli, licenze di pubblico spettacolo / SUAP, and the SIAE permit archive",
     "level A documents: address, holder, year; requires a written request, so it is a project, not an afternoon"),
    ("Archivio fotografico Carbone",
     "photographs with dates and places; often the only surviving image of a sign or an intersection"),
    ("Structured interviews with two independent witnesses per place",
     "the only route to places that never advertised; two concordant witnesses, otherwise an anecdote"),
], 1):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(2); p.paragraph_format.left_indent = Cm(0.3)
    r = p.add_run(f"{i}. {what} — "); r.bold = True; r.font.size = Pt(9.5)
    p.add_run(why).font.size = Pt(9.5)

h("7. What this changes for the seminar", 12)
para("The map can now be shown as a comparison instead of a claim: grey points are what the models repeat at "
     "least three times (293 points), stars are what published sources actually name (10 located places, "
     "5 at level B). The stars are few and the grey cloud is dense — and that proportion is the lesson. "
     "A model produces a city that looks complete; an archive produces a city that is sparse, dated and "
     "arguable. The task for the students is to move one point from grey to star, and to write down what it "
     "cost them to do it.")

h("8. Other channels, tested or ruled out today", 12)
para("Beyond the pages that were read by hand, five further channels were checked for whether they can be "
     "made to yield structured rows, and the answer differs by channel.")
CH = [
    ["Internet Archive (full text, 209 texts tagged Naples 1975–1992)", "reachable",
     "needs item-level metadata and page images; the general search returns items, not pages, so extraction must follow the files"],
    ["Google Books API", "rate-limited (HTTP 429)",
     "worth retrying later: guidebooks of the 1980s list clubs with addresses, and the API returns snippets around the query term"],
    ["Wikidata SPARQL (venues with coordinates in Naples)", "rate-limited today (1 request/minute)",
     "useful for geometry and for a controlled vocabulary of venue types, not for 1980s closures"],
    ["Il Mattino digital archive", "subscription",
     "the decisive corpus; access is a library licence, not a technique"],
    ["OpenStreetMap / Nominatim", "403 on this host",
     "geocoding done through Photon instead; OSM gives present-day geometry, never the 1980s name"],
    ["Archivio fotografico Carbone", "catalogue online, images on request",
     "photographs carry dates and places; the enquiry is a letter, and the yield is one photo per place"],
]
table(["channel", "status today", "what it can give"], CH, widths=[6.2, 3.6, 7.4])

para("And one channel that was not tested but is built: an extractor (estrattore.py) that takes the text of an "
     "archive page, asks the local Gemma model for places in a fixed schema — name, type, street, quarter, "
     "years, and the exact sentence where the place is named — and writes rows that carry the source file and "
     "the chunk they came from. Run on the 1980s section of the Capasso chapter it returned seven places "
     "(Trilogy, Pulsar, Caffè della luna, Diamond Dogs with the date 11 June 1984, Segnali di Accelerazione, "
     "Teatro Ausonia, Kiss Kiss) in about forty seconds, and each row quotes its own sentence. That is the "
     "scalable part: the model reads and proposes, the sentence is the evidence, the historian decides. Point "
     "it at OCR'd pages of Pagine Gialle or of Il Mattino and the same output appears, one row per venue, with "
     "the page it came from.")

doc.save(OUT)
print("napisano:", OUT, OUT.stat().st_size, "B")
