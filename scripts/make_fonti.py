#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Katalog izvora za ekstrakciju (Sheet + Google Doc vodič)."""
import json
import pathlib
import sys

sys.path.insert(0, "/home/agent/.hermes/skills/productivity/google-workspace/scripts")
from google_api import build_service  # noqa: E402
from googleapiclient.http import MediaFileUpload  # noqa: E402

COL = ["#", "Fonte", "Tipo di materiale", "Che cosa ci dà", "Come si arriva (percorso)",
       "Costo e tempo", "Difficoltà (1-5)", "Resa attesa", "Stato", "Note"]
COST = "—"
SRC = [
    ["Rolling Stone Italia — «Ten Cities: la storia del clubbing a Napoli» (D. Capasso)",
     "Articolo/pagine di libro", "Nomi di club, quartieri, anni, qualche indirizzo",
     "Online, aperto: rollingstone.it/musica/ten-cities-la-storia-del-clubbing-a-napoli/543958 — leggere le parti 1975-1990",
     "gratis, 20 min", 1, "8-10 luoghi", "provata",
     "È la fonte più ricca per gli anni '80; stile narrativo, pochi indirizzi esatti"],
    ["L'Indiependente — «Spacca Napoli #3» (punk 1979-1983)",
     "Articolo/webzine", "Locali, date precise, fanzine, nomi di negozi",
     "Online, aperto: lindiependente.it/spacca-napoli-3-underground",
     "gratis, 15 min", 1, "6-8 luoghi", "provata",
     "La fonte più precisa sulle date: ZX 13 aprile 1982, De Marco al Vomero, Cantina Sica"],
    ["Madre Museum — scheda evento «Diamond Dogs»",
     "Scheda di archivio museale", "Descrizione del locale, fotografie, anni",
     "Online: madrenapoli.it/calendario/diamond-dogs",
     "gratis, 10 min", 1, "1-2 luoghi", "provata", "Utile per la data di apertura e la foto di Toty Ruggieri"],
    ["Frizzifrizzi — «Diamond Dogs: la Napoli underground anni '80»",
     "Saggio fotografico", "Contesto, nomi, date, persone",
     "Online: frizzifrizzi.it/2016/05/26/diamond-dogs",
     "gratis, 15 min", 1, "2-3 luoghi", "provata", "Foto commentate: buone didascalie con luogo e anno"],
    ["Salvatore Capobianco «The Doctor» — memoir del dj",
     "Memoir/sito personale", "Elenchi di locali, vie, anni, serate",
     "Online: salvatorecapobianco.it/the-way-we-were",
     "gratis, 30 min", 1, "10-15 luoghi", "provata", "Testimone diretto: citare con nome e ruolo"],
    ["Musica e Memoria — testimonianze orali (Radio Kiss Kiss)",
     "Storia orale trascritta", "Radio, locali, date, nomi di persone",
     "Online: musicaememoria.com/testimonianza_radio_kiss_kiss.htm",
     "gratis, 20 min", 1, "3-5 luoghi", "provata", "Testimonianza raccolta da terzi: va citata come tale, non come documento"],
    ["Wikipedia (it) — voci su radio e locali napoletani",
     "Enciclopedia", "Date di fondazione, cambi di sede, proprietà",
     "Online: it.wikipedia.org (verificare sempre le note in fondo)",
     "gratis, 10 min", 1, "2-4 luoghi", "provata", "Solo per ancorare le date: la voce non è una fonte primaria"],
    ["Disco & Dancing — archivio dei locali (Campania)",
     "Archivio/directory", "Elenco di discoteche con località",
     "Online: discodancing.it/locali/campania",
     "gratis, 10 min", 2, "5-8 nomi", "provata", "Elenco, non prosa: serve soprattutto a confermare i nomi"],
    ["Dusty Dancing — discoteche abbandonate in Campania",
     "Archivio fotografico e editoriale", "Storia dei locali chiusi, anni, foto",
     "Online: dustydancing.com/category/discoteche-abbandonate-campania",
     "gratis, 20 min", 1, "3-5 luoghi", "provata", "Buono per i locali chiusi negli anni '80-'90"],
    ["Discogs — etichette e stampe napoletane",
     "Database discografico", "Anni di pubblicazione, città, etichette, negozi citati nelle note",
     "Online: discogs.com → Label → ricerca «Napoli»; filtro anni 1975-1990",
     "gratis, 30 min", 2, "3-6 nomi", "da provare", "Le note di copertina a volte nominano il negozio dove si comprava il disco"],
    ["Internet Archive — testi che nominano Napoli 1975-1992",
     "Biblioteca digitale (full text)", "Guide, riviste, libri scansionati con ricerca nel testo",
     "Online: archive.org → ricerca avanzata, «Napoli» + intervallo date; 209 testi già individuati",
     "gratis, 45 min", 2, "5-10 luoghi", "da provare", "Serve OCR per i PDF scansionati: tesseract non è installato su questa macchina"],
    ["Google Books — guide e annuari",
     "Libri digitalizzati", "Indirizzi e nomi nelle guide annuali",
     "Online: books.google.com; l'API va a singhiozzo (HTTP 429)",
     "gratis, 30 min", 2, "3-6 luoghi", "da provare", "Cercare «Pagine Gialle Napoli 1981» e simili: le guide contengono indirizzi, non racconti"],
    ["Archivio RAI / YouTube — filmati di concerti",
     "Audiovisivo", "Data, luogo, insegna visibile nei fotogrammi",
     "Online: ricerca «Napoli concerto 1982»; verificare titolo e data di caricamento",
     "gratis, 40 min", 3, "1-3 luoghi", "da provare", "Il fotogramma con l'insegna vale come prova visiva: salvare il minuto esatto"],
    ["Gruppi Facebook (Vomero anni '80, Retrodance, Napoli Underground)",
     "Memoria collettiva", "Testimonianze, foto, nomi di locali",
     "Richiede account e consenso dell'amministratore del gruppo; mai citare senza permesso",
     "gratis, 60 min", 4, "5-10 nomi", "non fattibile ora", "Va trattata come storia orale: due testimoni indipendenti per ogni luogo"],
    ["OpenStreetMap + Photon/Nominatim",
     "Dati geografici", "Coordinate di vie e piazze; geometria dei quartieri",
     "API pubbliche: photon.komoot.io (usata qui) e nominatim.openstreetmap.org (limite 1 req/s)",
     "gratis, automatico", 1, "geocodifica", "provata", "Nominatim ha risposto 403 senza User-Agent: usare Photon"],
    ["Biblioteca Nazionale «Vittorio Emanuele III» — sezione napoletana",
     "Pagine Gialle e annuari 1975-1990", "Nome, indirizzo e telefono di negozi e locali: il dato esatto",
     "Palazzo Reale, Piazza Plebiscito 1, Napoli; tessera gratuita; chiedere in sala «annuari telefonici, collocazione Napoli»",
     "gratis, 2-3 ore", 3, "15-25 luoghi", "da provare", "È la fonte con il rapporto resa/tempo migliore: si legge un elenco, non un racconto"],
    ["Emeroteca Tucci",
     "Il Mattino, Roma, Corriere del Mezzogiorno su carta e microfilm",
     "Inserzioni di aperture, concerti, pubblicità dei negozi: data + indirizzo",
     "Via L. Giordano (c/o Università Suor Orsola Benincasa), Napoli; prenotare il posto; fotocopie a pagamento",
     "2-4 €/pagina, 3-4 ore", 3, "10-20 luoghi", "da provare", "Cercare nelle pagine «Spettacoli» del venerdì e nelle inserzioni di settembre"],
    ["Archivio di Stato di Napoli",
     "Atti di prefettura e questura", "Licenze di pubblico spettacolo, autorizzazioni, verbali",
     "Piazzetta Grande Archivio 5, Napoli; registrazione annuale; inventari in sala studio",
     "gratis, 3-5 ore", 4, "5-15 luoghi", "da provare", "Richiede di sapere già il nome del locale: serve a confermare, non a scoprire"],
    ["Comune di Napoli — SUAP / ufficio commercio",
     "Licenze commerciali e di spettacolo", "Titolare, indirizzo, date di apertura e chiusura",
     "Palazzo San Giacomo, Piazza Municipio; istanza di accesso agli atti (L. 241/1990) con oggetto preciso",
     "gratis, 30-60 giorni", 5, "10-20 luoghi", "da provare", "Il percorso più solido ma il più lento: va avviato subito, si raccoglie dopo mesi"],
    ["SIAE — sede di Napoli",
     "Repertorio eventi e locali", "Eventi autorizzati, date, locali",
     "Viale Gramsci (Chiaia), Napoli; richiesta scritta motivata per ricerca storica",
     "gratis, 2-4 settimane", 4, "10-20 luoghi", "da provare", "Serve credenziale di ricerca istituzionale: può passare per il Dipartimento"],
    ["Camera di Commercio di Napoli — Registro Imprese",
     "Visure camerali", "Denominazione, sede, attività, data di iscrizione e cessazione",
     "Online (registroimprese.it, visura a pagamento) oppure sportello in Piazza Bovio",
     "1-3 €/visura, 20 min", 2, "10-20 luoghi", "da provare", "Ottimo per i negozi: «De Marco dischi» si trova come impresa, non come racconto"],
    ["Archivio fotografico Carbone / Fondazione Morra / Madre",
     "Fotografie con didascalie", "Insegne, interni, date; il nome del locale scritto nella didascalia",
     "Contattare l'archivio via mail; consultazione su appuntamento; diritti d'uso separati",
     "gratis-50 €/immagine", 3, "5-10 luoghi", "da provare", "La didascalia è il dato: chiedere sempre la scheda, non solo la foto"],
    ["Archivio Toty Ruggieri (fotografo del Diamond Dogs)",
     "Archivio privato", "Foto datate del locale e della scena",
     "Contatto tramite Madre/Museo o il libro «Diamond Dogs» (2016)",
     "da concordare", 3, "2-5 luoghi", "da provare", "È il titolare dei diritti delle foto più citate"],
    ["Fanzine — «Megawave» (D. Morgera) e raccolte private",
     "Stampa underground", "Nomi di locali, date di concerti, indirizzi per la posta",
     "Collezioni private e biblioteche specializzate; chiedere alla Biblioteca Nazionale la collocazione dei fondi minori",
     "gratis, 2-3 ore", 4, "5-10 luoghi", "da provare", "Le fanzine hanno l'indirizzo in ultima pagina: è il dato più difficile e più prezioso"],
    ["Archivi radiofonici — Radio Kiss Kiss, RAI Campania",
     "Registrazioni e programmi", "Date di fondazione, sedi, eventi organizzati",
     "Contattare l'ufficio stampa dell'emittente; per la RAI, mediateca regionale",
     "da concordare", 4, "2-5 luoghi", "da provare", "La radio è un luogo anch'essa: sede e data di nascita sono il dato"],
    ["Storia orale — dj, titolari, famiglie",
     "Interviste", "Indirizzo, anni, frequentatori, aneddoti verificabili",
     "Contatti diretti (Capobianco, Gigi D'Aria, famiglia Niespolo per il Kiss Kiss); registrare con consenso scritto",
     "gratis, 1-2 ore per intervista", 2, "5-10 luoghi", "in corso", "Regola: un luogo entra in tabella solo con due testimoni indipendenti"],
]

INTRO = """Guidа alle fonti — come arrivare ai luoghi della musica napoletana degli anni Ottanta

Questo documento raccoglie tutte le fonti che possono essere usate per estrarre dati sui luoghi della musica a
Napoli fra il 1975 e il 1992, e per ciascuna indica il percorso pratico per arrivarci: dove si trova, chi la
custodisce, quanto costa, quanto tempo richiede e che tipo di dato restituisce.

La logica è semplice. Un modello linguistico può nominare cento locali in un minuto, ma non sa se esistono. Una
fonte, anche povera, dice una cosa sola e la dice in modo verificabile. Per questo ogni riga della tabella finale
deve portare una citazione, e ogni citazione deve poter essere ricontrollata da qualcun altro.

Le fonti sono ordinate per rapporto fra resa e sforzo. In cima stanno quelle che si aprono dal computer in pochi
minuti e hanno già prodotto i risultati che vedete sulla mappa. Subito dopo vengono le fonti che valgono di più ma
costano un viaggio: le Pagine Gialle alla Biblioteca Nazionale e Il Mattino all'Emeroteca Tucci. In fondo stanno
i percorsi lunghi — licenze comunali, SIAE, Archivio di Stato — che vanno avviati adesso e danno frutti fra mesi.

Tre livelli di prova, da tenere distinti anche nel foglio di lavoro. Livello A: documento d'epoca con indirizzo
(Pagine Gialle, licenza, visura camerale). Livello B: due fonti indipendenti che concordano su nome e luogo
(due articoli, o un articolo e un testimone). Livello C: una sola fonte, o fonte senza indirizzo. Livello D: il
nome viene solo da un modello, e resta un'ipotesi da verificare.

Il protocollo in sette passi, lo stesso per ogni luogo, sta nel foglio «protocollo» della tabella di registro.
In breve: si prende un nome dall'elenco dei candidati; si cerca nelle fonti online; se non basta si passa a
Pagine Gialle dell'anno più vicino; si annota indirizzo e anno; si verifica con una seconda fonte; si geocodifica
l'indirizzo; si aggiorna la riga con livello di prova, citazione e data del controllo. Mezz'ora per luogo, e il
punteggio si sposta dal grigio alla stella.

La tabella delle fonti è nel foglio «fonti»; il registro dei candidati nel foglio «candidati»; i luoghi già
attestati nel foglio «attestati». Il notebook Colab contiene la stessa lista in forma leggibile e l'estrattore
che trasforma una pagina in righe di tabella.
"""


def sheet():
    sh = build_service("sheets", "v4")
    dr = build_service("drive", "v3")
    ss = sh.spreadsheets().create(body={"properties": {"title": "Napoli 1980 — Fonti e percorsi di accesso"},
                                        "sheets": [{"properties": {"title": "fonti"}},
                                                   {"properties": {"title": "protocollo"}},
                                                   {"properties": {"title": "livelli"}}]},
                                  fields="spreadsheetId").execute()
    sid = ss["spreadsheetId"]
    values = [COL] + [[str(i + 1)] + [str(c) for c in row] for i, row in enumerate(SRC)]
    sh.spreadsheets().values().update(spreadsheetId=sid, range="fonti!A1", valueInputOption="RAW",
                                      body={"values": values}).execute()
    proto = [["passo", "azione", "strumento", "tempo"],
             ["1", "prendi un nome dall'elenco dei candidati", "foglio «candidati»", "1 min"],
             ["2", "cerca il nome nelle fonti online in cima alla lista", "motore di ricerca + estrattore", "5 min"],
             ["3", "se il nome non basta, cerca l'anno più vicino nelle Pagine Gialle", "Biblioteca Nazionale, annuari", "20 min"],
             ["4", "annota indirizzo, anni, titolare se c'è", "foglio «attestati»", "5 min"],
             ["5", "verifica con una seconda fonte indipendente", "Emeroteca Tucci o archivio fotografico", "15 min"],
             ["6", "geocodifica l'indirizzo", "Photon / Nominatim / OpenStreetMap", "1 min"],
             ["7", "aggiorna livello di prova, citazione e data del controllo", "foglio «attestati»", "2 min"]]
    sh.spreadsheets().values().update(spreadsheetId=sid, range="protocollo!A1", valueInputOption="RAW",
                                      body={"values": proto}).execute()
    liv = [["livello", "che cosa significa", "esempio"],
           ["A", "documento d'epoca con indirizzo", "Pagine Gialle 1981, pagina 412: nome, via, telefono"],
           ["B", "due fonti indipendenti concordanti", "articolo 2016 + testimonianza del dj"],
           ["C", "una sola fonte, o fonte senza indirizzo", "un articolo che nomina il locale senza via"],
           ["D", "solo il modello lo nomina", "il nome compare nelle risposte sintetiche, niente riscontro"]]
    sh.spreadsheets().values().update(spreadsheetId=sid, range="livelli!A1", valueInputOption="RAW",
                                      body={"values": liv}).execute()
    dr.permissions().create(fileId=sid, body={"role": "reader", "type": "anyone"}).execute()
    return sid


def doc():
    dr = build_service("drive", "v3")
    body = {"name": "Napoli 1980 — Guida alle fonti e ai percorsi di accesso",
            "mimeType": "application/vnd.google-apps.document"}
    d = dr.files().create(body=body, fields="id").execute()
    did = d["id"]
    text = INTRO + "\n\n"
    for i, row in enumerate(SRC):
        text += f"{i+1}. {row[0]}\n"
        text += f"   Tipo: {row[1]}. Che cosa dà: {row[2]}.\n"
        text += f"   Come si arriva: {row[3]}\n"
        text += f"   Costo e tempo: {row[4]}. Difficoltà: {row[5]}/5. Resa attesa: {row[6]}. Stato: {row[7]}.\n"
        if row[8]:
            text += f"   Nota: {row[8]}\n"
        text += "\n"
    # upiši tekst preko Google Docs API (jednostavno: insertText na kraj dokumenta)
    docs = build_service("docs", "v1")
    docs.documents().batchUpdate(documentId=did, body={"requests": [
        {"insertText": {"location": {"index": 1}, "text": text}}]}).execute()
    dr.permissions().create(fileId=did, body={"role": "reader", "type": "anyone"}).execute()
    pdf = dr.files().export(fileId=did, mimeType="application/pdf").execute()
    out = pathlib.Path("/home/agent/napoli1980/seminar_federico/Napoli_1980_Guida_alle_fonti.pdf")
    out.write_bytes(pdf)
    return did, out


if __name__ == "__main__":
    sid = sheet()
    did, pdf = doc()
    ids = {"sheet_fonti": sid, "doc_guida": did, "pdf": str(pdf)}
    pathlib.Path("/home/agent/napoli1980/fonti_ids.json").write_text(json.dumps(ids, indent=1))
    print("fonti:", len(SRC), "| sheet:", sid, "| doc:", did, "| pdf:", pdf, pdf.stat().st_size, "B")
