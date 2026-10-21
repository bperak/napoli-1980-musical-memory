import React, { useState, useMemo } from 'react';
import { RealPlace, AttestatoPlace, ValidationSummary, VerificationCandidate } from '../types';
import { validatePlacesData, BBOX } from '../services/validator';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCode,
  ListOrdered,
  Search,
  Check,
  Edit3,
  Download,
  Info,
} from 'lucide-react';

interface ValidatorWorkbenchProps {
  realPlaces: RealPlace[];
  attestati: AttestatoPlace[];
  rawRegistro: any;
}

export const ValidatorWorkbench: React.FC<ValidatorWorkbenchProps> = ({
  realPlaces,
  attestati,
  rawRegistro,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'validator' | 'registry' | 'protocol'>('validator');
  const [targetDataset, setTargetDataset] = useState<'estrazioni_reali' | 'custom'>('estrazioni_reali');
  const [customCsvInput, setCustomCsvInput] = useState<string>(
    `nome,tipo,via,quartiere,anni,lat,lon,precisione,livello,citazione,documenti\n` +
      `"Disco d'Oro","negozio_dischi","via Raffaele Morghen 31","Vomero","1981-1989",40.843,14.2339,"via","B","uno dei negozi storici di riferimento per il Vomero","Corriere Viaggi"`
  );

  // Parse candidate list from registro_verifica.json
  const candidates: VerificationCandidate[] = useMemo(() => {
    if (!rawRegistro || !rawRegistro.candidati || !Array.isArray(rawRegistro.candidati)) {
      return [];
    }
    const rows = rawRegistro.candidati.slice(1); // skip header
    return rows.map((r: string[]) => ({
      num: r[0] || '',
      nome: r[1] || '',
      occorrenze: r[2] || '',
      modelli: r[3] || '',
      tipo: r[4] || '',
      quartiere: r[5] || '',
      confidenza: r[6] || '',
      fonte: r[7] || '',
      tipo_fonte: r[8] || '',
      anno: r[9] || '',
      indirizzo_trovato: r[10] || '',
      lat: r[11] || '',
      lon: r[12] || '',
      livello: r[13] || '',
      note: r[14] || '',
    }));
  }, [rawRegistro]);

  const [registrySearch, setRegistrySearch] = useState('');
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});

  // Run validation on selected dataset
  const validationResult: ValidationSummary = useMemo(() => {
    if (targetDataset === 'estrazioni_reali') {
      return validatePlacesData(realPlaces, 'estrazioni_reali.csv');
    } else {
      // Parse custom CSV
      const lines = customCsvInput.trim().split('\n');
      if (lines.length <= 1) {
        return validatePlacesData([], 'custom_input.csv');
      }
      const header = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
      const rows = lines.slice(1).map((line) => {
        // Simple CSV splitter respecting quotes
        const match = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
        const obj: Record<string, string> = {};
        if (match) {
          match.forEach((col, idx) => {
            const cleanCol = col.replace(/^,?"?|"$/g, '').replace(/""/g, '"').trim();
            const colName = header[idx] || `col_${idx}`;
            obj[colName] = cleanCol;
          });
        }
        return obj;
      });
      return validatePlacesData(rows, 'custom_input.csv');
    }
  }, [targetDataset, realPlaces, customCsvInput]);

  const filteredCandidates = useMemo(() => {
    if (!registrySearch.trim()) return candidates;
    const q = registrySearch.toLowerCase();
    return candidates.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.quartiere.toLowerCase().includes(q) ||
        c.tipo.toLowerCase().includes(q)
    );
  }, [candidates, registrySearch]);

  const handleUpdateNote = (num: string, note: string) => {
    setStudentNotes((prev) => ({ ...prev, [num]: note }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-stone-100">
      {/* Header */}
      <div className="pb-6 border-b border-stone-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
            QUALITÀ & PROTOCOLLO
          </span>
          <span className="text-xs text-stone-400">
            Regola del progetto: nessuna riga senza citazione, nessuna riga senza fonte
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-stone-100">
          Validatore Dati & Registro di Verifica
        </h2>
        <p className="text-sm text-stone-400 mt-1 max-w-3xl font-light">
          Implementazione del controllo di integrità di <code>scripts/check_data.py</code> e registro di 30 candidati
          generati dai modelli in attesa di verifica archivistica da parte degli studenti del seminario.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-stone-800 mt-6 gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
        {[
          { id: 'validator', label: 'Validatore Automatico (check_data)', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
          { id: 'registry', label: `Registro 30 Candidati (${candidates.length})`, icon: <Edit3 className="w-4 h-4 text-amber-400" /> },
          { id: 'protocol', label: 'Protocollo di Verifica (7 Passi)', icon: <ListOrdered className="w-4 h-4 text-blue-400" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'border-emerald-500 text-emerald-300 bg-emerald-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: VALIDATOR */}
      {activeSubTab === 'validator' && (
        <div className="mt-6 space-y-6">
          {/* Target Dataset Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/60 p-3 rounded-xl border border-stone-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 font-mono">Dati da validare:</span>
              <button
                onClick={() => setTargetDataset('estrazioni_reali')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  targetDataset === 'estrazioni_reali'
                    ? 'bg-amber-600/30 text-amber-300 border-amber-500'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
              >
                estrazioni_reali.csv ({realPlaces.length} righe)
              </button>
              <button
                onClick={() => setTargetDataset('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  targetDataset === 'custom'
                    ? 'bg-amber-600/30 text-amber-300 border-amber-500'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
              >
                Modello / CSV Personalizzato
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-stone-400">BBOX Napoli:</span>
              <span className="text-stone-300 bg-stone-800 px-2 py-0.5 rounded">
                [{BBOX.latMin}–{BBOX.latMax}, {BBOX.lonMin}–{BBOX.lonMax}]
              </span>
            </div>
          </div>

          {targetDataset === 'custom' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-300 font-mono">
                Incolla o modifica le righe CSV da validare:
              </label>
              <textarea
                rows={5}
                value={customCsvInput}
                onChange={(e) => setCustomCsvInput(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 font-mono text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Validation Status Card */}
          <div
            className={`p-5 rounded-2xl border ${
              validationResult.errorCount === 0
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-rose-950/30 border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {validationResult.errorCount === 0 ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-400" />
                )}
                <div>
                  <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                    <span>
                      {validationResult.errorCount === 0
                        ? 'Validazione Superata — Tutto in ordine'
                        : `Rilevati ${validationResult.errorCount} errori bloccanti`}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                      {validationResult.totalRows} righe analizzate
                    </span>
                  </h3>
                  <p className="text-xs text-stone-300 mt-0.5">
                    {validationResult.errorCount === 0
                      ? 'Ogni riga ha nome valido, citazione con lunghezza minima, fonte documentale e coordinate nell’area metropolitana di Napoli.'
                      : 'La regola del progetto prevede 0 errori prima del commit nel repository.'}
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-xs hidden sm:block">
                <div className="text-emerald-400 font-bold">{validationResult.totalRows} righe conformi</div>
                <div className="text-amber-400">{validationResult.warningCount} avvisi</div>
              </div>
            </div>

            {/* Errors List */}
            {validationResult.errors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-rose-900/50 space-y-2">
                <span className="text-xs font-bold text-rose-400 uppercase font-mono tracking-wider">
                  Errori Bloccanti (Codice 1 in CI):
                </span>
                {validationResult.errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-rose-950/60 border border-rose-800/80 text-xs text-rose-200 flex items-start gap-2"
                  >
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>{err.message}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings List */}
            {validationResult.warnings.length > 0 && (
              <div className="mt-4 pt-4 border-t border-stone-800 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider">
                  Avvisi di integrità:
                </span>
                {validationResult.warnings.map((warn, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>{warn.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATE REGISTRY */}
      {activeSubTab === 'registry' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/60 p-3 rounded-xl border border-stone-800">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cerca nome candidato, quartiere, tipo..."
                value={registrySearch}
                onChange={(e) => setRegistrySearch(e.target.value)}
                className="w-full bg-stone-800 text-stone-100 placeholder-stone-400 text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-700 focus:outline-none"
              />
            </div>

            <div className="text-xs text-stone-400 font-mono">
              30 candidati emersi dai modelli LLM in attesa di riscontro archivistico
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-900/40 shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-800/60 border-b border-stone-800 text-stone-400 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Nome dal Modello</th>
                  <th className="py-3 px-3">Occorrenze</th>
                  <th className="py-3 px-3">Modello</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Quartiere Ipotizzato</th>
                  <th className="py-3 px-3">Confidenza</th>
                  <th className="py-3 px-3 min-w-[200px]">Note di Verifica Studente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                {filteredCandidates.map((c) => (
                  <tr key={c.num} className="hover:bg-stone-800/40">
                    <td className="py-3 px-3 font-mono text-stone-500">{c.num}</td>
                    <td className="py-3 px-3 font-semibold text-stone-100">{c.nome}</td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{c.occorrenze}x</td>
                    <td className="py-3 px-3 font-mono text-stone-400 text-[11px]">{c.modelli}</td>
                    <td className="py-3 px-3 text-stone-300 uppercase text-[10px] font-mono">{c.tipo}</td>
                    <td className="py-3 px-3 text-stone-300">{c.quartiere || '—'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          c.confidenza === 'alta'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : c.confidenza === 'media'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {c.confidenza}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        placeholder="Inserisci fonte consultata..."
                        value={studentNotes[c.num] || c.note || ''}
                        onChange={(e) => handleUpdateNote(c.num, e.target.value)}
                        className="w-full bg-stone-950/80 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PROTOCOL */}
      {activeSubTab === 'protocol' && (
        <div className="mt-6 space-y-4">
          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 shadow-lg">
            <h3 className="font-serif font-bold text-lg text-amber-300 mb-4 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-amber-400" />
              <span>Protocollo di Verifica in 7 Passi (per studenti e ricercatori)</span>
            </h3>

            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: 'Scelta del candidato',
                  desc: 'Seleziona un nome dal registro dei 30 candidati oppure proponi un ricordo familiare verificabile.',
                },
                {
                  step: 2,
                  title: 'Consultazione delle fonti online aperte',
                  desc: 'Cerca il nome nelle fonti ad accesso immediato: Rolling Stone (Ten Cities), Spacca Napoli #3, memoir Salvatore Capobianco, Madre Napoli.',
                },
                {
                  step: 3,
                  title: 'Archivi fisici e Pagine Gialle (se non trovato online)',
                  desc: 'Visita la Biblioteca Nazionale di Napoli (Piazza Plebiscito 1, tessera gratuita) e consulta gli annuari telefonici 1975–1990 per trovare indirizzo civico e numero telefonico esatto.',
                },
                {
                  step: 4,
                  title: 'Isolamento della citazione letterale',
                  desc: 'Copia la frase esatta (massimo 25–30 parole) che dimostra l’esistenza del locale. Nessun dato entra senza citazione d’appoggio.',
                },
                {
                  step: 5,
                  title: 'Assegnazione del livello di evidenza',
                  desc: 'Livello C (una fonte), Livello B (due fonti indipendenti concordanti), Livello A (documento originale dell’epoca con indirizzo).',
                },
                {
                  step: 6,
                  title: 'Geocodifica corretta',
                  desc: 'Identifica le coordinate WGS84 con precisione: "via" (se nota), "quartiere" (se nota solo l’area) o "città". Evita qualsiasi interpolazione fantasiosa.',
                },
                {
                  step: 7,
                  title: 'Esecuzione del check automatico',
                  desc: 'Verifica con check_data.py che la riga non contenga errori e apri la Pull Request nel repository.',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 p-3.5 rounded-lg bg-stone-950/60 border border-stone-800">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    {item.step}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-stone-100">{item.title}</h4>
                    <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
