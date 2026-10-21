# How to contribute

This repository is a shared working table, not a finished publication. Anyone can add a place, correct a year,
attach a source, or check a row somebody else wrote. There are three ways in, and the easiest one needs no git at
all.

The rule that holds everything together is one sentence long: **no row without a citation, no citation without a
source.** A place enters the table when a document names it and you can quote the sentence. A model's suggestion is
a lead, not a datum.

---

## 1. The three ways in

### a) Open an issue (no account on git, no coding, two minutes)

If you know a place and have a source, open an issue using the **«Add a place»** form:

<https://github.com/bperak/napoli-1980-musical-memory/issues/new?template=add-place.yml>

The form asks for the name, the type, the street or quarter, the years, the exact sentence from your source and the
URL or archive reference. Someone with write access turns it into a row. You keep the credit in the issue thread.

This is the right channel for students in a seminar, for somebody who remembers a club and has a photograph, or for
a librarian who knows where the directory is.

### b) Edit the table directly in the browser (no local setup)

If you have write access — as a collaborator you do — you can edit the CSV on GitHub itself:

1. open `data/estrazioni_reali.csv`
2. press the pencil icon (**Edit this file**)
3. add one line at the end, keeping the same number of commas as the header
4. write a short commit message: `Add: Il Gabbiano, via Marechiaro, 1980s — source: ...`
5. choose **Create a new branch and start a pull request**

Run the check before you propose the change (see below); it tells you if a column is missing or a quote is empty.

### c) Work locally (for a batch of places)

```bash
git clone https://github.com/bperak/napoli-1980-musical-memory.git
cd napoli-1980-musical-memory
git checkout -b add-vomero-clubs

# edit data/estrazioni_reali.csv with any editor — keep UTF-8 and the same columns

python scripts/check_data.py          # must print "0 errori"
git add data/estrazioni_reali.csv
git commit -m "Add 4 clubs in the Vomero, sources: Capobianco, Indiependente"
git push -u origin add-vomero-clubs
```

Then open a pull request. Use one branch per topic: «Vomero clubs», «record shops», «radio stations».

---

## 2. What a good row looks like

| Column | What to write | Example |
|---|---|---|
| `nome` | the name as the source writes it, not as you remember it | `Diamond Dogs` |
| `tipo` | one of `club`, `discoteca`, `negozio_dischi`, `teatro`, `centro_sociale`, `radio`, `ritrovo`, `altro` | `club` |
| `via`, `quartiere` | street if the source gives it, otherwise the quarter; leave empty rather than guess | `Cavone San Gennaro` / `Sanità` |
| `anni` | the years or dates the source names | `1984-1987` |
| `lat`, `lon` | coordinates of the street or the quarter centre; leave empty if you cannot locate it | `40.8576`, `14.2520` |
| `precisione` | what the coordinates point to: `via`, `quartiere` or `citta` | `via` |
| `livello` | `A`, `B`, `C` or `D` — see below | `B` |
| `citazione` | **the exact sentence**, copied, not paraphrased, max ~30 words | `l'11 giugno 1984 aprono il Diamond Dogs` |
| `documenti` | the source(s), separated by `|`; name the publication and the article | `Capasso, Ten Cities | Repubblica Napoli 13.10.2016` |
| `geo_fonte` | which geocoder produced the coordinates (`nominatim`, `photon`, `gazetteer`) | `nominatim` |

Leaving a field empty is always better than filling it with a guess. An empty `via` is honest; an invented street
number is a lie that somebody will have to chase later.

---

## 3. Evidence levels

| Level | Meaning | Where it may appear |
|---|---|---|
| **A** | a period document with an address: telephone directory, entertainment licence, company record | table and map |
| **B** | two independent sources that agree on name and place | table and map |
| **C** | one source, or a source without an address | table and map, marked as single-source |
| **D** | only a language model names it | table only, **never** on the map |

If you cannot decide between B and C, choose C. The levels are meant to be conservative: a promotion from C to B
requires a second document, and the pull request should say which one.

---

## 4. Where to find the sources

The catalogue of 26 sources, each with the practical path — where it is, who holds it, what it costs, how long it
takes and how many places it can yield — is here:

- **Sheet, open access, no account:** <https://docs.google.com/spreadsheets/d/1jQ5VB9txOYP1GgMXmGyU-HreoMl1_PpHkB_c_U31Y0U/edit>
- **Guide in prose (PDF):** [`docs/Guida_alle_fonti.pdf`](docs/Guida_alle_fonti.pdf)

The short version, in order of yield per hour:

1. **Pagine Gialle 1975–1990**, Biblioteca Nazionale «Vittorio Emanuele III», Piazza Plebiscito 1, Naples. Free
   reader's card. Ask in the reading room for the telephone directories, Neapolitan collection. You read a list, not
   a story: name, street, phone. This is the single best hour of work in the whole project.
2. **Il Mattino 1975–1992**, Emeroteca Tucci, via L. Giordano (Suor Orsola Benincasa). Book a desk, ask for the
   «Spettacoli» pages of Fridays and the September advertisements. Photocopies cost a few euro per page.
3. **Online, free, today:** Rolling Stone «Ten Cities», *Spacca Napoli #3*, Madre and Frizzifrizzi on the Diamond
   Dogs, Capobianco's memoir, the Radio Kiss Kiss oral-history transcript, Disco & Dancing, Dusty Dancing.
4. **Institutional, slower:** Comune di Napoli (SUAP licences, access-to-documents request), SIAE Naples, Camera di
   Commercio (company records — one to three euro per search), Archivio di Stato.
5. **People:** DJs, owners, families. Two independent witnesses for a level C place to become B. Record with written
   consent.

The full seven-step protocol is in the same Sheet, tab **protocollo**: take a candidate name → search the free
sources → if not enough, go to the directory of the nearest year → note street and years → verify with a second,
independent source → geocode → update the row with level, quote and date of the check. About thirty minutes per
place.

---

## 5. If you are a student

Three exercises that produce a real, citable result and take an afternoon:

**Exercise 1 — Verify a candidate.** Take a name from `data/registro_verifica.json` (30 candidates that only the
models proposed). Look for it in the free online sources; if nothing, in the Pagine Gialle of the nearest year.
Outcome: either a new row in `data/estrazioni_reali.csv` with level C, or a note in the registry saying «not found
in these sources, checked on this date». **A documented absence is also a result** — write it down.

**Exercise 2 — Fill the questionnaire.** Answer the 19 questions about your own memory of the city, or ask an older
relative to. Geolocate the places you name. The result goes into a separate file,
`data/risposte_Studenti_<anno>.csv`, with the same columns as the synthetic table plus a `fonte = umana` column. This
is the only way the project can compare a model's memory with a person's.

**Exercise 3 — Read one page, extract its places.** Take a page of a book, an article, a fanzine, and run it through
`scripts/estrattore.py` (or do it by hand: it is the same schema). Check every row against the sentence. Report how
many rows the model got right, how many it invented, how many it missed — that number is the most useful thing this
project can publish.

At the end of the seminar, the names of the students who contributed rows with sources go into the contributors
section below and, if they wish, into the citation of the dataset.

---

## 6. What gets accepted, what gets sent back

**Accepted:** a row with a name, a quote, a source and an honest level. Corrections to somebody else's row are
welcome and should be argued with the source, not with an opinion.

**Sent back:** rows without a quote; streets filled in by intuition; places outside Naples and its first belt
(Acerra, Portici, Pozzuoli are fine — the box is 40.70–41.00 N, 13.95–14.55 E); duplicates of an existing row under
a slightly different name; a level B without the second source named.

**Never accepted:** anything presented as a real testimony when it came from a model. The synthetic table exists
precisely so that the two can be told apart.

---

## 7. Review

One review is enough for a row with a quote. Two are needed to change a level from C to B or to add level A. If
nobody answers within a week, mention `@bperak` in the pull request — silence is a backlog, not a rejection.

Before every pull request, run [`scripts/check_data.py`](scripts/check_data.py). It verifies that the columns exist,
that no row lacks a quote or a source, that no name is duplicated, and that coordinates fall inside Naples, and it
exits with an error if something is wrong:

```bash
python scripts/check_data.py     # must print "0 errori"
```

The same check can run automatically on every pull request: the workflow is ready in [`ci/validate.yml`](ci/validate.yml)
and only needs to be copied to `.github/workflows/validate.yml` by someone whose GitHub token has the `workflow`
scope.

---

## 8. Contributors

- Benedikt Perak — conceptual design, pipeline, extraction, maps
- *your name here* — the row you added, and the source you found

---

## In italiano

Questo repository è un tavolo di lavoro condiviso. Si può contribuire in tre modi: aprendo una **issue** con il
modulo «Add a place» (serve solo un account GitHub, due minuti), modificando il CSV **direttamente nel browser** con
la matita e poi «Create a new branch and start a pull request», oppure lavorando in locale con git e aprendo una pull
request.

La regola è una sola: **nessuna riga senza citazione, nessuna citazione senza fonte.** Un luogo entra in tabella
quando un documento lo nomina e tu puoi citare la frase esatta. Il suggerimento di un modello è una pista, non un
dato.

Le colonne da compilare sono quelle della tabella al punto 2: nome, tipo, via o quartiere, anni, coordinate,
precisione, livello, **citazione** (la frase copiata, non parafrasata), documenti. Un campo vuoto è sempre meglio di
un campo inventato.

I livelli di prova: **A** documento d'epoca con indirizzo (Pagine Gialle, licenza, visura), **B** due fonti
indipendenti concordanti, **C** una sola fonte o fonte senza indirizzo, **D** solo il modello — in tabella sì, sulla
mappa mai. Nel dubbio fra B e C scegli C.

Le fonti e i percorsi per arrivarci sono nel foglio pubblico (26 fonti, con costo, tempo e resa) e nella guida PDF
in `docs/`. In breve: Pagine Gialle 1975–1990 alla Biblioteca Nazionale, Il Mattino all'Emeroteca Tucci, poi le fonti
online gratuite, poi Comune, SIAE, Camera di Commercio, e infine le persone con due testimoni indipendenti.

Per gli studenti ci sono tre esercizi: verificare un candidato del registro (anche un'assenza documentata è un
risultato), compilare il questionario sulla propria memoria della città in un file separato con
`fonte = umana`, oppure estrarre i luoghi da una pagina e misurare quante righe il modello ha azzeccato, quante ha
inventato e quante ha perso.

Prima di proporre una modifica, lancia `python scripts/check_data.py`: deve dire «0 errori». Il controllo gira anche
da solo su ogni pull request.
