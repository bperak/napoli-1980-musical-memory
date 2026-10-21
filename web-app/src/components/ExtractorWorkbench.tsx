import React, { useState } from 'react';
import { extractPlaces, ExtractedPlaceItem } from '../services/extractor';
import {
  Compass,
  Sparkles,
  Play,
  Copy,
  Check,
  MapPin,
  FileText,
  AlertCircle,
  HelpCircle,
  Download,
} from 'lucide-react';

const SAMPLE_TEXTS = [
  {
    title: 'Rolling Stone — Ten Cities (D. Capasso)',
    text: `Varcato il portone di ferro arrugginito al Cavone San Gennaro, nel cuore del rione Sanità, si scendeva nelle viscere di tufo dello storico locale underground Diamond Dogs, attivo tra il 1984 e il 1987. Più su, sulla collina del Vomero, c'era il Trilogy dove troviamo in consolle Gigi D'Aria, e il Pulsar di via Costantinopoli. Nel novembre dell'84 i ragazzi portarono a Napoli Nick Cave per uno speciale concerto al teatro Ausonia.`,
  },
  {
    title: "L'Indiependente — Spacca Napoli #3 (Punk & New Wave)",
    text: `Lo ZX di via Atri, aperto intorno al 1979 nel centro storico, divenne il punto di ritrovo della scena punk legata alla fanzine Megawave. I ragazzi si incontravano sui muretti di Piazza del Gesù e Piazza dei Martiri, oppure da De Marco, un negozio di dischi al Vomero. Altro ritrovo molto frequentato fu la Cantina Sica, una piccola cantina al Vomero.`,
  },
  {
    title: "Sasà Capobianco — «The way we were» (Clubbing & Radio)",
    text: `Nel 1973 diviene il Disk Jockey della prima maxidiscoteca napoletana, il Kiss Kiss, nella sua prima sede in Via San Giacomo dei Capri. Pochi anni dopo, nel 1976 nasce la Radio Kiss Kiss. La prima vera esperienza sui piatti fu nel 1971 allo Schiribizzo, tavernetta dell'Hotel Royal, per poi passare al Saturday's Club sito in Via Partenope a Napoli nel 1969 e allo Zeppelin, storico night di Via Manzoni.`,
  },
  {
    title: 'Gennaro Capodanno — La storia del TTC Club',
    text: `I locali del mitico TTC Club, sodalizio vomerese a cavallo degli anni settanta e ottanta, erano posti nel piano interrato al civico 39 di via Paisiello al Vomero, punto di riferimento per intere generazioni di giovani napoletani appassionati di musica.`,
  },
];

export const ExtractorWorkbench: React.FC = () => {
  const [inputText, setInputText] = useState(SAMPLE_TEXTS[0].text);
  const [loading, setLoading] = useState(false);
  const [extractionResult, setExtractionResult] = useState<{
    places: ExtractedPlaceItem[];
    method: string;
    note?: string;
  } | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleRunExtraction = async (mode: 'auto' | 'heuristic' | 'gemini') => {
    setLoading(true);
    try {
      const res = await extractPlaces(inputText, mode);
      setExtractionResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyRowAsCSV = (item: ExtractedPlaceItem, index: number) => {
    const citClean = (item.citazione || '').replace(/"/g, '""');
    const row = `"${item.nome}","${item.tipo}","${item.via || ''}","${item.quartiere || ''}","${item.anni || ''}","${item.lat || ''}","${item.lon || ''}","${item.precisione || ''}","${item.livello_suggerito}","${citClean}","Fonte estratta"\n`;
    navigator.clipboard.writeText(row);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const downloadAllCSV = () => {
    if (!extractionResult || extractionResult.places.length === 0) return;
    let csv = 'nome,tipo,via,quartiere,anni,lat,lon,precisione,livello,citazione,fonte\n';
    extractionResult.places.forEach((p) => {
      const citClean = (p.citazione || '').replace(/"/g, '""');
      csv += `"${p.nome}","${p.tipo}","${p.via || ''}","${p.quartiere || ''}","${p.anni || ''}","${p.lat || ''}","${p.lon || ''}","${p.precisione || ''}","${p.livello_suggerito}","${citClean}","Testo inserito"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'estrazione_luoghi.csv';
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-stone-100">
      {/* Header */}
      <div className="pb-6 border-b border-stone-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
            PIPELINE ESTRATTIVA
          </span>
          <span className="text-xs text-stone-400">
            Modulo basato su scripts/estrattore.py · Regole sintattiche + LLM
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-stone-100">
          Estrattore di Luoghi dai Documenti
        </h2>
        <p className="text-sm text-stone-400 mt-1 max-w-2xl font-light">
          Incolla il testo di un articolo, fanzine, pagina d'annuario o testimonianza per estrarre in modo
          rigoroso i luoghi musicali citati, con isolamento della frase esatta e geocodifica preliminare.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Input text & Sample presets */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-stone-300 font-mono uppercase tracking-wider">
                Esempi dal Corpus Documentale:
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {SAMPLE_TEXTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(sample.text)}
                  className="text-left p-2.5 rounded-lg border border-stone-800 bg-stone-950/60 hover:bg-stone-800 hover:border-amber-500/40 text-xs transition"
                >
                  <div className="font-semibold text-amber-300 truncate">{sample.title}</div>
                  <div className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                    {sample.text}
                  </div>
                </button>
              ))}
            </div>

            <label className="text-xs font-semibold text-stone-300 font-mono uppercase tracking-wider block mb-1.5">
              Testo della Fonte da Analizzare:
            </label>
            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Incolla qui una pagina di testo d'archivio..."
              className="w-full bg-stone-950 border border-stone-700/80 rounded-lg p-3 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
            />

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                disabled={loading || !inputText.trim()}
                onClick={() => handleRunExtraction('auto')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loading ? 'Estrazione in corso...' : 'Estrai Luoghi (Pipeline)'}</span>
              </button>

              <button
                disabled={loading || !inputText.trim()}
                onClick={() => handleRunExtraction('heuristic')}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition disabled:opacity-50"
                title="Esegui solo regole euristiche e toponomastiche offline"
              >
                <Compass className="w-3.5 h-3.5 text-stone-400" />
                <span>Solo Regole Locali</span>
              </button>
            </div>
          </div>

          {/* Method note */}
          <div className="p-4 rounded-xl border border-stone-800 bg-stone-900/30 text-xs text-stone-400 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <HelpCircle className="w-4 h-4" />
              <span>Regola d'oro del progetto</span>
            </div>
            <p className="leading-relaxed">
              «Nessuna riga senza citazione, nessuna riga senza fonte». L'estrattore non crea coordinate fittizie:
              se il testo menziona solo la città o un quartiere generico, la via resta vuota e la precisione è classificata come quartiere.
            </p>
          </div>
        </div>

        {/* Right Column: Extracted Structured Rows */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-4 min-h-[400px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-base text-stone-100">
                    Luoghi Estratti
                  </span>
                  {extractionResult && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {extractionResult.places.length} record
                    </span>
                  )}
                </div>

                {extractionResult && extractionResult.places.length > 0 && (
                  <button
                    onClick={downloadAllCSV}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
                  >
                    <Download className="w-3 h-3 text-amber-400" />
                    <span>Scarica CSV</span>
                  </button>
                )}
              </div>

              {extractionResult && extractionResult.method && (
                <div className="mb-3 px-3 py-1.5 rounded bg-stone-950 text-[11px] font-mono text-stone-400 border border-stone-800 flex items-center justify-between">
                  <span>Metodo: {extractionResult.method}</span>
                  {extractionResult.note && <span className="text-amber-400/80">✓ Eseguito</span>}
                </div>
              )}

              {/* Extraction items list */}
              {!extractionResult ? (
                <div className="py-16 text-center text-stone-500 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Premi «Estrai Luoghi» per avviare il parsing strutturato sul testo della fonte.
                </div>
              ) : extractionResult.places.length === 0 ? (
                <div className="py-16 text-center text-stone-400 text-xs">
                  <AlertCircle className="w-8 h-8 text-amber-500/60 mx-auto mb-2" />
                  Nessun luogo musicale esplicito riconosciuto nel testo con le regole attuali.
                </div>
              ) : (
                <div className="space-y-3">
                  {extractionResult.places.map((place, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-stone-800 bg-stone-950/70 hover:border-stone-700 transition text-xs"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <div className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                            <span>{place.nome}</span>
                            <span className="font-mono text-[10px] font-normal uppercase px-1.5 py-0.2 rounded bg-stone-800 text-stone-300">
                              {place.tipo}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {place.via ? `📍 ${place.via}` : ''}
                            {place.quartiere ? ` (${place.quartiere})` : ''}
                            {place.anni ? ` · ⏱️ ${place.anni}` : ''}
                          </div>
                        </div>

                        <button
                          onClick={() => copyRowAsCSV(place, idx)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[10px] font-mono text-stone-300 border border-stone-700 transition"
                          title="Copia riga pronta per il CSV"
                        >
                          {copiedIdx === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copiato!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-stone-400" />
                              <span>Copia riga</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-2 rounded bg-stone-900/80 border-l-2 border-amber-500 font-serif italic text-stone-300 text-[11px] my-2 leading-relaxed">
                        „{place.citazione}”
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-stone-500 pt-1 border-t border-stone-800/80">
                        <span>Livello suggerito: <b className="text-amber-400">{place.livello_suggerito}</b></span>
                        {place.lat && place.lon ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {place.lat}, {place.lon} ({place.precisione})
                          </span>
                        ) : (
                          <span className="text-stone-500">Coordinate: da risolvere in archivio</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
