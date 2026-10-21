# Studenti — come entrare e come aggiungere un luogo

Una pagina sola, da leggere in cinque minuti. Serve un account GitHub gratuito e nient'altro: nessun programma da
installare, nessun codice da scrivere.

La regola del progetto sta in una riga: **nessuna riga senza citazione.** Un luogo entra nella tabella quando un
documento lo nomina e tu puoi copiare la frase esatta. Quello che ricordi tu, o che suggerisce un modello, è una
pista da verificare — non un dato.

---

## Passo 0 — Crea l'account (2 minuti)

Vai su <https://github.com/signup>, usa l'indirizzo che usi di solito, conferma la mail. Scegli un nome utente
riconoscibile, meglio se contiene nome e cognome: comparirà come autore del tuo contributo.

Poi manda il tuo nome utente a chi tiene il seminario, così ti arriva l'invito al repository. L'invito si accetta da
<https://github.com/bperak/napoli-1980-musical-memory/invitations> — se non lo vedi, controlla le notifiche o la mail
sbagliata.

---

## Passo 1 — Scegli un luogo da verificare

Hai tre strade, dalla più facile:

**a) Prendi un nome dal registro dei candidati.** Il file `data/registro_verifica.json` contiene 30 nomi che solo i
modelli hanno proposto: molti sono inventati, e scoprirlo è esattamente il lavoro. Cerca il nome nelle fonti online
elencate qui sotto. Se non lo trovi da nessuna parte, il risultato è: «cercato in queste fonti, in questa data, non
trovato». Anche questo va scritto.

**b) Parti da un ricordo tuo o di un familiare.** Un locale, un negozio di dischi, un muretto, una radio. Poi cerca
un documento che lo confermi: un articolo, una foto con didascalia, un'annata delle Pagine Gialle.

**c) Prendi un luogo già in tabella e miglioralo.** Manca la via? Manca l'anno? Aggiungerli è un contributo, non un
rifacimento.

Le fonti gratuite che si aprono subito:

| Fonte | Dove | Che cosa ci trovi |
|---|---|---|
| Rolling Stone, «Ten Cities» | rollingstone.it/musica/ten-cities-la-storia-del-clubbing-a-napoli/543958 | club, quartieri, anni |
| *Spacca Napoli #3* | lindiependente.it/spacca-napoli-3-underground | punk, date precise, negozi |
| Madre Napoli | madrenapoli.it/calendario/diamond-dogs | Diamond Dogs, foto, date |
| Frizzifrizzi | frizzifrizzi.it/2016/05/26/diamond-dogs | contesto, nomi, didascalie |
| Capobianco, «The way we were» | salvatorecapobianco.it/the-way-we-were | elenchi di locali, vie |
| Musica e Memoria | musicaememoria.com/testimonianza_radio_kiss_kiss.htm | radio, voci dirette |
| Disco & Dancing | discodancing.it/locali/campania | elenco di discoteche |
| Dusty Dancing | dustydancing.com/category/discoteche-abbandonate-campania | locali chiusi, storia |

Se il nome non compare in nessuna di queste, la strada giusta è la **Biblioteca Nazionale** (Piazza Plebiscito 1,
Napoli, tessera gratuita): chiedi gli annuari telefonici — Pagine Gialle — dell'anno più vicino. Lì ogni negozio ha
nome, via e telefono. Mezz'ora di lettura vale dieci articoli.

---

## Passo 2 — Scrivi la riga

Apri il modello `data/template_nuovo_luogo.csv` e compila una riga sola. I campi:

```
nome,tipo,via,quartiere,anni,lat,lon,precisione,livello,citazione,documenti,geo_fonte
```

- **nome** — come lo scrive la fonte, non come lo ricordi
- **tipo** — club, discoteca, negozio_dischi, teatro, centro_sociale, radio, ritrovo, altro
- **via** / **quartiere** — se la fonte non li dice, lascia vuoto: un campo vuoto è onesto, una via inventata no
- **anni** — quelli che nomina la fonte
- **citazione** — la frase esatta, copiata, massimo trenta parole
- **documenti** — pubblicazione, articolo e data in cui l'hai consultato
- **livello** — `C` se hai una fonte sola, `B` se ne hai due indipendenti che concordano, `A` se hai un documento
  d'epoca con indirizzo. Nel dubbio metti `C`: si promuove dopo, con la seconda fonte.

Le coordinate puoi lasciarle vuote e le aggiunge chi rivede; oppure le prendi da OpenStreetMap con il tasto destro →
«Mostra indirizzo».

---

## Passo 3 — Proponi il contributo

**Modo semplice, senza git (consigliato la prima volta).** Apri
<https://github.com/bperak/napoli-1980-musical-memory/issues/new?template=add-place.yml> e compila il modulo: nome,
tipo, via, anni, la frase esatta, la fonte, il livello. Invia. Ricevi una risposta nella stessa pagina e il tuo nome
resta lì come autore della segnalazione.

**Modo diretto, se hai già l'invito.** Apri `data/estrazioni_reali.csv` su GitHub, premi la matita, aggiungi la tua
riga in fondo, scrivi nel messaggio `Add: <nome> — fonte: <fonte>`, scegli «Create a new branch and start a pull
request» e conferma. Riceverai un commento automatico se manca qualcosa.

**Modo locale, se lavori su più luoghi.** Clona il repository, crea un ramo con il tuo tema, modifica il CSV, lancia
`python scripts/check_data.py` (deve dire «0 errori»), commit e pull request.

---

## Passo 4 — Che cosa succede dopo

Chi rivede controlla una cosa sola: che la citazione esista e che dica quello che la riga sostiene. Se manca la
frase, la riga torna indietro con la richiesta di aggiungerla. Se la frase c'è, la riga entra e il tuo nome finisce
tra i contributori.

Da quel momento il luogo compare nella tabella e, se ha le coordinate, anche sulla mappa
<https://bperak.github.io/napoli-1980-map/reali.html> — con il popup che mostra la tua citazione.

---

## Tre esercizi da consegnare

1. **Un candidato verificato.** Un nome dal registro, una ricerca documentata, una riga nuova oppure una nota di
   assenza. Consegna: la riga o il link alla issue.
2. **Il questionario.** Rispondi alle 19 domande sulla tua memoria della città (o fallo compilare a un familiare più
   grande) e geolocalizza i luoghi che nomini. Consegna: `data/risposte_Studenti_<anno>.csv` con la colonna
   `fonte = umana`. Solo così il progetto può mettere il sogno di un modello accanto al ricordo di una persona.
3. **Una pagina letta.** Prendi una pagina (un articolo, una fanzine, un capitolo) e ricava i luoghi con
   `scripts/estrattore.py` o a mano. Poi controlla riga per riga: quante ne ha azzeccate, quante inventate, quante
   perse. Consegna: la tabellina con i tre numeri. È il risultato più utile che questo progetto possa pubblicare.

---

## Domande che vengono sempre

**Devo saper programmare?** No. Il modo semplice è un modulo web.

**E se il mio luogo non si trova in nessuna fonte?** Lo scrivi nel registro come assenza documentata, con le fonti
consultate e la data. Non entra in tabella, ma il lavoro è registrato.

**Posso usare Google invece delle fonti elencate?** Puoi cercare con Google, ma la riga deve citare il documento in
cui il luogo compare, non il motore di ricerca.

**E se due fonti si contraddicono?** Si scrivono entrambe nella colonna `documenti` e si mette la nota nella issue.
La contraddizione è un'informazione, non un problema.

**Il mio inglese non è buono.** Le istruzioni complete sono anche in italiano in `CONTRIBUTING.md`, sezione finale, e
le fonti sono quasi tutte in italiano.

**Chi posso contattare?** Apri una issue con la tua domanda: rispondere lì serve anche agli altri.
