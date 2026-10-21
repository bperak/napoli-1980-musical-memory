import React, { useState, useMemo } from 'react';
import { RealPlace, AttestatoPlace, CorpusExtraction } from '../types';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  MapPin,
  CheckCircle,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ArchiveTableProps {
  realPlaces: RealPlace[];
  attestati: AttestatoPlace[];
  corpusExtractions: CorpusExtraction[];
  corpusManifest: Array<{ documento: string; url: string; file_locale: string; uso: string; nota: string }>;
  onViewOnMap?: (place: RealPlace) => void;
}

export const ArchiveTable: React.FC<ArchiveTableProps> = ({
  realPlaces,
  attestati,
  corpusExtractions,
  corpusManifest,
  onViewOnMap,
}) => {
  const [activeTab, setActiveTab] = useState<'reali' | 'attestati' | 'manifest' | 'raw_corpus'>('reali');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [onlyLocatable, setOnlyLocatable] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RealPlace | null>(null);

  // Filtered real places
  const filteredRealPlaces = useMemo(() => {
    return realPlaces.filter((p) => {
      if (selectedType !== 'all' && p.tipo !== selectedType) return false;
      if (selectedLevel !== 'all' && p.livello !== selectedLevel) return false;
      if (onlyLocatable && (!p.lat || !p.lon)) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          p.nome.toLowerCase().includes(q) ||
          (p.via && p.via.toLowerCase().includes(q)) ||
          (p.quartiere && p.quartiere.toLowerCase().includes(q)) ||
          p.citazione.toLowerCase().includes(q) ||
          p.documenti.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [realPlaces, selectedType, selectedLevel, onlyLocatable, searchTerm]);

  // Export to CSV
  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'reali') {
      csvContent += 'nome,tipo,via,quartiere,anni,lat,lon,precisione,livello,citazione,documenti,url\n';
      filteredRealPlaces.forEach((r) => {
        const citClean = (r.citazione || '').replace(/"/g, '""');
        const docClean = (r.documenti || '').replace(/"/g, '""');
        csvContent += `"${r.nome}","${r.tipo}","${r.via || ''}","${r.quartiere || ''}","${r.anni || ''}","${r.lat || ''}","${r.lon || ''}","${r.precisione || ''}","${r.livello}","${citClean}","${docClean}","${r.url || ''}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `napoli1980_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-stone-100">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              CORPUS DOCUMENTALE
            </span>
            <span className="text-xs text-stone-400">
              {realPlaces.length} luoghi storici estratti · 15 localizzati · 9 da risolvere
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-stone-100">
            Archivio dei Luoghi Attestati
          </h2>
          <p className="text-sm text-stone-400 mt-1 max-w-2xl font-light">
            Ogni voce proviene da un documento storico o memoir d'epoca (1975–1990) ed è memorizzata
            con la citazione testuale esatta, il livello di evidenza e il riscontro archivistico.
          </p>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono border border-stone-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Esporta CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-stone-800 mt-6 gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
        {[
          { id: 'reali', label: `Luoghi Estratti (${realPlaces.length})`, icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
          { id: 'attestati', label: `Registro Storico Attestati (${attestati.length})`, icon: <FileText className="w-4 h-4 text-amber-400" /> },
          { id: 'manifest', label: `Manifesto Documenti (${corpusManifest.length})`, icon: <Layers className="w-4 h-4 text-sky-400" /> },
          { id: 'raw_corpus', label: `Menzioni Raw del Corpus (${corpusExtractions.length})`, icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Table Content */}
      {activeTab === 'reali' && (
        <div className="mt-6 space-y-4">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/60 p-3 rounded-xl border border-stone-800">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cerca per nome, via, quartiere, citazione o fonte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-800/90 text-stone-100 placeholder-stone-400 text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-stone-800 text-stone-200 px-2.5 py-1.5 rounded-lg border border-stone-700 text-xs focus:outline-none"
              >
                <option value="all">Tutte le categorie</option>
                <option value="club">Club</option>
                <option value="discoteca">Discoteca</option>
                <option value="negozio_dischi">Negozio dischi</option>
                <option value="radio">Radio</option>
                <option value="ritrovo">Ritrovo</option>
                <option value="teatro">Teatro</option>
                <option value="centro_sociale">Centro Sociale</option>
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bg-stone-800 text-stone-200 px-2.5 py-1.5 rounded-lg border border-stone-700 text-xs focus:outline-none"
              >
                <option value="all">Tutti i livelli</option>
                <option value="B">Livello B (2 fonti)</option>
                <option value="C">Livello C (1 fonte)</option>
              </select>

              <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer bg-stone-800 px-2.5 py-1.5 rounded-lg border border-stone-700">
                <input
                  type="checkbox"
                  checked={onlyLocatable}
                  onChange={(e) => setOnlyLocatable(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="text-[11px]">Solo con coordinate</span>
              </label>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-900/40 shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-800/60 border-b border-stone-800 text-stone-400 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Nome & Tipo</th>
                  <th className="py-3 px-3">Indirizzo / Zona</th>
                  <th className="py-3 px-3">Anni</th>
                  <th className="py-3 px-3">Evidenza</th>
                  <th className="py-3 px-3 min-w-[280px]">Citazione dal Documento</th>
                  <th className="py-3 px-3">Fonti / Documenti</th>
                  <th className="py-3 px-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                {filteredRealPlaces.map((row, idx) => {
                  const hasGeo = Boolean(row.lat && row.lon);
                  const isLevelB = row.livello === 'B';
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-stone-800/40 transition cursor-pointer"
                      onClick={() => setSelectedRow(row)}
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-stone-100 flex items-center gap-1.5">
                          {isLevelB && <span className="text-amber-400 text-sm">★</span>}
                          <span>{row.nome}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 uppercase tracking-wider font-mono">
                          {row.tipo.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-stone-200">{row.via || '—'}</div>
                        <div className="text-[11px] text-stone-400">{row.quartiere || ''}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-stone-300">
                        {row.anni || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            isLevelB
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                              : 'bg-stone-800 text-stone-300 border border-stone-700'
                          }`}
                        >
                          Liv. {row.livello}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <p className="italic font-serif text-stone-300 leading-relaxed text-[11px] line-clamp-2">
                          „{row.citazione}”
                        </p>
                      </td>
                      <td className="py-3 px-3 text-stone-400 text-[11px] max-w-xs truncate">
                        {row.documenti}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {hasGeo && onViewOnMap && (
                            <button
                              onClick={() => onViewOnMap(row)}
                              className="p-1.5 rounded hover:bg-stone-700 text-stone-300 hover:text-amber-300 transition"
                              title="Visualizza sulla mappa"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {row.url && (
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded hover:bg-stone-700 text-stone-300 hover:text-amber-300 transition"
                              title="Apri link alla fonte"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attestati Tab */}
      {activeTab === 'attestati' && (
        <div className="mt-6 space-y-4">
          <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-800 text-xs text-stone-400">
            Registro bibliografico e storiografico dei 16 luoghi attestati dalla letteratura (Danilo Capasso / Ten Cities, Rolling Stone, L'Indiependente, Corriere del Mezzogiorno, la Repubblica).
          </div>
          <div className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-900/40 shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-800/60 border-b border-stone-800 text-stone-400 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Nome</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Luogo / Quartiere</th>
                  <th className="py-3 px-3">Anni</th>
                  <th className="py-3 px-3">Liv.</th>
                  <th className="py-3 px-3">Fonte Storiografica</th>
                  <th className="py-3 px-3">Note Archivistiche</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                {attestati.map((a, idx) => (
                  <tr key={idx} className="hover:bg-stone-800/40">
                    <td className="py-3 px-3 font-semibold text-stone-100">{a.nome}</td>
                    <td className="py-3 px-3 text-stone-400 font-mono">{a.tipo}</td>
                    <td className="py-3 px-3">
                      <div>{a.luogo}</div>
                      <div className="text-[10px] text-stone-500">{a.quartiere}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">{a.anni}</td>
                    <td className="py-3 px-3 font-bold text-amber-300">{a.livello}</td>
                    <td className="py-3 px-3 text-stone-400 max-w-xs">{a.fonte}</td>
                    <td className="py-3 px-3 text-stone-300 italic text-[11px]">{a.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manifest Tab */}
      {activeTab === 'manifest' && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {corpusManifest.map((doc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-stone-800 bg-stone-900/60 flex flex-col justify-between hover:border-amber-500/40 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      {doc.file_locale || `Doc #${idx + 1}`}
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">
                      {doc.uso}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-stone-100 mb-2">
                    {doc.documento}
                  </h3>
                  <p className="text-xs text-stone-400 mb-3">{doc.nota}</p>
                </div>
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono hover:underline pt-2 border-t border-stone-800/80"
                  >
                    <span>Apri documento online</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Extractions JSONL Tab */}
      {activeTab === 'raw_corpus' && (
        <div className="mt-6 space-y-4">
          <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-800 text-xs text-stone-400">
            Le 54 estrazioni grezze effettuate dall'estrattore sui testi prima del deduplicatore e del geocodificatore Photon.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {corpusExtractions.map((ext, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-stone-800 bg-stone-900/40 hover:bg-stone-800/30 transition text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-stone-100">{ext.nome}</span>
                  <span className="text-[10px] font-mono text-amber-400 uppercase bg-stone-800 px-1.5 py-0.5 rounded">
                    {ext.tipo}
                  </span>
                </div>
                <div className="text-[11px] text-stone-400 mb-2">
                  {ext.via || ext.quartiere || 'Napoli'} {ext.anni ? `(${ext.anni})` : ''}
                </div>
                <p className="italic text-[11px] text-stone-300 bg-stone-950/60 p-2 rounded border border-stone-800/80 mb-2 font-serif">
                  „{ext.citazione}”
                </p>
                <div className="text-[10px] text-stone-500 font-mono truncate">
                  Fonte: {ext.documento}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row detail modal */}
      {selectedRow && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedRow(null)}
        >
          <div
            className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedRow.tipo} · Livello {selectedRow.livello}
                </span>
                <h3 className="text-2xl font-serif font-bold text-stone-100 mt-2">
                  {selectedRow.nome}
                </h3>
                <p className="text-xs text-stone-400">
                  📍 {selectedRow.via ? `${selectedRow.via}, ` : ''}{selectedRow.quartiere || 'Napoli'}
                  {selectedRow.anni ? ` (${selectedRow.anni})` : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="text-stone-400 hover:text-stone-100 font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-stone-800/80 border-l-4 border-amber-500">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block mb-1">
                Frase documentale da cui è stato estratto:
              </span>
              <p className="italic font-serif text-sm text-stone-100 leading-relaxed">
                „{selectedRow.citazione}”
              </p>
            </div>

            <div className="mt-4 space-y-2 text-xs text-stone-300">
              <div>
                <span className="text-stone-400 font-semibold">Documenti:</span> {selectedRow.documenti}
              </div>
              {selectedRow.lat && selectedRow.lon && (
                <div>
                  <span className="text-stone-400 font-semibold">Coordinate:</span> {selectedRow.lat}, {selectedRow.lon} (precisione: {selectedRow.precisione})
                </div>
              )}
              {selectedRow.geo_fonte && (
                <div>
                  <span className="text-stone-400 font-semibold">Geocodifica:</span> {selectedRow.geo_fonte}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-stone-800">
              {selectedRow.url ? (
                <a
                  href={selectedRow.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium hover:underline"
                >
                  <span>Consulta documento originale</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-[11px] text-stone-500">Fonte archivistica cartacea</span>
              )}

              {selectedRow.lat && selectedRow.lon && onViewOnMap && (
                <button
                  onClick={() => {
                    onViewOnMap(selectedRow);
                    setSelectedRow(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-900 font-semibold text-xs flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Vai alla mappa</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
