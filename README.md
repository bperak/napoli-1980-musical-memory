# Napoli 1980 — musical memory, extracted

A small research repository about the places where music was heard in Naples between the late 1970s and the early
1990s: record shops, clubs, discos, theatres, social centres, radio stations and the walls where people met.

The project began as a question about method. If you ask a large language model to list the places of Neapolitan
musical life in 1980, it answers fluently and confidently — and much of what it says cannot be verified. So the
repository does two things at once, and keeps them apart:

1. **A probe, not a survey.** 429 questionnaires were filled by two language models (205 DeepSeek, 224 Gemma 4 26B
   running locally on a DGX Spark). They produce 1,716 place mentions, 1,304 distinct names, and only 18 names shared
   between the two models. That distance is the finding: the models do not remember Naples, they reconstruct it.
2. **The archive decides.** A second layer contains only places that come from documents, each stored with the exact
   sentence it was extracted from and an evidence level. These are the points that can be checked by someone else.

The rule of the repository is one line: **the model proposes, the citation proves, the historian decides.**

## What is here

| Path | What it contains |
|---|---|
| `data/napoli1980_synthetic.csv` | 429 synthetic questionnaires, 27 columns, with `modello` and `respondent_id` on every row |
| `data/estrazioni_reali.csv` | 24 places extracted from eight real documents — name, type, street, quarter, years, coordinates, evidence level, quote, source |
| `data/estrazioni_corpus.jsonl` | the 54 raw extractions before deduplication, one JSON object per line |
| `data/attestati.csv` | 16 attested places with evidence level and note (10 locatable) |
| `data/registro_verifica.json` | 30 candidate names, 12 source types, a 7-step verification protocol |
| `data/corpus_manifest.csv` | the documents used, with URLs; full texts are **not** in the repo (rights) |
| `notebook/Napoli_1980_musical_memory_map.ipynb` | the full Colab: load, audit, extraction, geocoding, maps, sources, extractor |
| `notebook/…_executed.ipynb` | the same notebook with outputs saved, so results are visible without running |
| `maps/estrazioni_reali_map.html` | interactive map of the extracted places, popups with citations |
| `maps/*.png` | static maps: by model, by type, model core vs. all, attested vs. generated, extracted places |
| `scripts/` | the pipeline: extractor, corpus run, merge and geocode, map builders, notebook and sheet builders |
| `docs/Guida_alle_fonti.pdf` | the 26 sources with the practical path to each: where, who, cost, time, yield |

Live versions:

- interactive map of the **extracted** places — <https://bperak.github.io/napoli-1980-map/reali.html>
- interactive map of the **generated** places, 1,555 markers — <https://bperak.github.io/napoli-1980-map/>
- notebook — <https://colab.research.google.com/drive/1OIh0W0HS9BAuD0rX8Oia5Jq4JuD9WpcK>
- sources sheet — 26 rows, open access, no account needed
- sources guide (Google Doc) — the prose version of the same table

## How the extraction works

`scripts/estrattore.py` takes a page of text and returns rows in a fixed schema: `nome`, `tipo`, `via`,
`quartiere`, `anni`, `citazione`, `fonte`. The prompt forbids invention and requires the exact sentence for every
row; the parser rejects anything that does not come back as a JSON array.

Three backends, tried in order so a blocked quota does not stop the work: Gemini, DeepSeek, and the local Gemma 4
26B on the DGX Spark. Keys are read from Colab Secrets or from the environment — never from the repository.

A deterministic second pass runs beside the model for the constructions the model skips — *"lo ZX di via Atri"*,
*"si chiama Cantina Sica"*, *"aprono il Diamond Dogs"*. The output carries a `metodo` column, so it is always
visible whether a row came from the model or from the rule.

## Evidence levels

| Level | Meaning |
|---|---|
| **A** | a period document with an address: telephone directory, licence, company record |
| **B** | two independent sources that agree |
| **C** | one source, or a source without an address |
| **D** | only a model names it — a hypothesis, kept out of the map |

The 24 extracted places split into 3 of level B and 21 of level C; 15 can be located. The remaining nine have a name
and a year but no street, which is precisely the work that the Pagine Gialle 1975–1990 at the Biblioteca Nazionale
and *Il Mattino* at the Emeroteca Tucci would settle. Level A is the next frontier and it costs an archive visit,
not a prompt.

## Reproducing

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 1. extraction over the corpus (needs one API key in the environment)
export DEEPSEEK_API_KEY=...
python scripts/corpus_extract.py        # writes data/estrazioni_corpus.jsonl

# 2. merge, deduplicate, geocode (Nominatim / Photon, 1 request per second)
python scripts/merge_reali.py           # writes data/estrazioni_reali.csv

# 3. maps
python scripts/map_real.py              # writes maps/estrazioni_reali_map.html and the PNG
```

The notebook can be opened directly in Colab: it carries a compressed copy of the dataset, so it runs without a
network, and it ships an offline copy of the 429 rows for the same reason.

## Data dictionary (extracted table)

| Column | Meaning |
|---|---|
| `nome` | the name as written in the source |
| `tipo` | `club`, `discoteca`, `negozio_dischi`, `teatro`, `centro_sociale`, `radio`, `ritrovo`, `altro` |
| `via`, `quartiere` | street or quarter when the source names it, otherwise empty |
| `anni` | years or dates named in the source |
| `lat`, `lon`, `precisione` | coordinates and what they refer to: street, quarter or city |
| `livello` | evidence level B or C |
| `citazione` | the exact sentence the place was extracted from |
| `documenti` | the documents that mention it, separated by `|` |
| `geo_fonte` | which geocoder produced the coordinates |

## Ethics and limits

The 429 questionnaires are **synthetic** and are labelled as such on every row. They are not a survey of
Neapolitans and must never be cited as testimony. Their only use is to measure what a model produces when asked to
remember a city, and to generate hypotheses for the archive.

Quotations from published articles are short and used for verification. Full texts are not redistributed; the
manifest gives the URL of each one. Photographs and archival material remain with their rights holders.

## Contributing — for collaborators and students

The table is open. Three ways in, and the easiest needs no git at all:

1. **Open an issue** with the «Add a place» form — two minutes, an account, no coding:
   <https://github.com/bperak/napoli-1980-musical-memory/issues/new?template=add-place.yml>
2. **Edit `data/estrazioni_reali.csv` in the browser** (pencil icon → new branch → pull request) if you have write
   access.
3. **Work locally** and open a pull request from a topic branch.

The rule is one sentence: **no row without a citation, no citation without a source.** A model's suggestion is a
lead, not a datum. Full instructions, the column-by-column schema, the evidence levels, where to find the sources,
and three exercises a student can complete in an afternoon are in **[CONTRIBUTING.md](CONTRIBUTING.md)** — in
English and in Italian.

Every pull request is checked automatically: `scripts/check_data.py` verifies that no row lacks a quote or a source,
that no name is duplicated, and that coordinates fall inside Naples. Run it yourself before pushing:

```bash
python scripts/check_data.py     # must print "0 errori"
```

## Citation

```
Perak, B. (2026). Napoli 1980 — musical memory, extracted: a probe with language models and an
extraction pipeline over documentary sources. GitHub repository.
https://github.com/bperak/napoli-1980-musical-memory
```

## Licence

Code: MIT (`LICENSE`). Data and texts produced here: CC BY 4.0 (`LICENSE-DATA`). Source articles quoted in
`citazione` keep their original rights.
