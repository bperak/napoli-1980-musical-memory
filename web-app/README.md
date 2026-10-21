# Napoli 1980 — Interactive Web Application

Interactive digital history application and GIS explorer for the **Napoli 1980 — musical memory, extracted** project (Seminar Storia Digitale, Università Federico II, 21–22 October 2026).

## Features
- **Interactive Map**: Multi-layer Leaflet visualization of 24 documented archival places vs. 1,716 synthetic LLM reconstructions.
- **Archive Database**: Searchable and filterable registry of attested places with exact verbatim quotations and source references.
- **Model Probe**: Discrepancy analytics comparing DeepSeek Flash and Gemma 4 26B, including the 429 synthetic survey questionnaires.
- **Extractor Workbench**: Real-time syntactic and toponymic extraction engine based on scripts/estrattore.py.
- **Validation Workbench**: Interactive data validator implementing all rules from scripts/check_data.py and 30-candidate verification registry.
- **Sources & Methods Guide**: Catalogue of 26 archival sources, 7-step student verification protocol, and download templates.

## Running Locally
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
npm start
```
