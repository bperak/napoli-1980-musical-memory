import React, { useState, useMemo } from 'react';
import { SyntheticPlace, SyntheticQuestionnaire } from '../types';
import {
  Sparkles,
  BarChart3,
  Users,
  Search,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  CheckCircle,
  HelpCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface TheProbeAnalyticsProps {
  syntheticPlaces: SyntheticPlace[];
  questionnaires: SyntheticQuestionnaire[];
}

export const TheProbeAnalytics: React.FC<TheProbeAnalyticsProps> = ({
  syntheticPlaces,
  questionnaires,
}) => {
  const [subTab, setSubTab] = useState<'overview' | 'questionnaires' | 'places_cloud' | 'maps_gallery'>('overview');
  const [modelFilter, setModelFilter] = useState<'all' | 'deepseek' | 'gemma'>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyCore, setOnlyCore] = useState<boolean>(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<SyntheticQuestionnaire | null>(null);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = syntheticPlaces.length;
    const deepseekCount = syntheticPlaces.filter((p) => p.modello.includes('deepseek')).length;
    const gemmaCount = syntheticPlaces.filter((p) => p.modello.includes('gemma')).length;
    const coreCount = syntheticPlaces.filter((p) => p.is_core).length;
    const sharedCount = syntheticPlaces.filter((p) => p.is_shared_model).length;

    // Unique names
    const uniqueNames = new Set(syntheticPlaces.map((p) => p.norm_key)).size;

    // Frequent names (top 10)
    const nameMap: Record<string, { name: string; count: number; models: Set<string>; type: string }> = {};
    syntheticPlaces.forEach((p) => {
      if (!nameMap[p.norm_key]) {
        nameMap[p.norm_key] = {
          name: p.luogo,
          count: 0,
          models: new Set(),
          type: p.tipo,
        };
      }
      nameMap[p.norm_key].count++;
      nameMap[p.norm_key].models.add(p.modello.includes('deepseek') ? 'DeepSeek' : 'Gemma 4');
    });

    const topNames = Object.values(nameMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // Zone counts
    const zoneMap: Record<string, number> = {};
    syntheticPlaces.forEach((p) => {
      const z = p.zona_standard || 'Altra';
      zoneMap[z] = (zoneMap[z] || 0) + 1;
    });

    const topZones = Object.entries(zoneMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      total,
      deepseekCount,
      gemmaCount,
      coreCount,
      sharedCount,
      uniqueNames,
      topNames,
      topZones,
    };
  }, [syntheticPlaces]);

  // Filtered Questionnaires
  const filteredQuestionnaires = useMemo(() => {
    return questionnaires.filter((q) => {
      if (modelFilter !== 'all') {
        const isDeepseek = q.modello.includes('deepseek');
        if (modelFilter === 'deepseek' && !isDeepseek) return false;
        if (modelFilter === 'gemma' && isDeepseek) return false;
      }

      if (selectedZone !== 'all') {
        if (!q.zona_residenza.toLowerCase().includes(selectedZone.toLowerCase())) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          q.respondent_id.toLowerCase().includes(query) ||
          q.zona_residenza.toLowerCase().includes(query) ||
          q.negozio_nome.toLowerCase().includes(query) ||
          q.club_nome.toLowerCase().includes(query) ||
          q.teleportazione.toLowerCase().includes(query) ||
          q.concerto_memorabile.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [questionnaires, modelFilter, selectedZone, searchQuery]);

  // Filtered Synthetic Places
  const filteredPlaces = useMemo(() => {
    return syntheticPlaces.filter((p) => {
      if (modelFilter !== 'all') {
        const isDeepseek = p.modello.includes('deepseek');
        if (modelFilter === 'deepseek' && !isDeepseek) return false;
        if (modelFilter === 'gemma' && isDeepseek) return false;
      }

      if (onlyCore && !p.is_core) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.luogo.toLowerCase().includes(q) ||
          p.zona.toLowerCase().includes(q) ||
          p.racconto.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [syntheticPlaces, modelFilter, onlyCore, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-stone-100">
      {/* Hero Header */}
      <div className="pb-6 border-b border-stone-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
            LA SONDA SPERIMENTALE
          </span>
          <span className="text-xs text-stone-400">
            429 Questionari sintetici · 1.716 Menzioni · Solo 18–20 nomi condivisi
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-stone-100">
          La Sonda dei Modelli: Allucinazione vs Memoria
        </h2>
        <p className="text-sm text-stone-400 mt-2 max-w-3xl font-light leading-relaxed">
          «Se chiedi a un modello linguistico di elencare i luoghi musicali della Napoli del 1980, risponde in modo
          fluido e convincente — ma quasi nulla di ciò che dice trova riscontro nei documenti. 429 questionari generati da
          due modelli distinti (DeepSeek e Gemma 4 26B) producono 1.304 nomi diversi e <b>appena 18 nomi condivisi</b>.
          Quella distanza è il risultato: <b>i modelli non ricordano Napoli, la ricostruiscono</b>.»
        </p>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
        <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono uppercase text-stone-400 mb-1">Questionari Generati</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-stone-100">429</div>
          <div className="text-[11px] text-stone-400 mt-1">205 DeepSeek · 224 Gemma 4</div>
        </div>

        <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono uppercase text-stone-400 mb-1">Menzioni di Luogo</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-400">1.716</div>
          <div className="text-[11px] text-stone-400 mt-1">1.304 nomi distinti</div>
        </div>

        <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono uppercase text-stone-400 mb-1">Nomi Condivisi (Overlap)</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">20 / 1.304</div>
          <div className="text-[11px] text-rose-300/80 font-medium mt-1">Solo 1.5% di accordo tra LLM!</div>
        </div>

        <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono uppercase text-stone-400 mb-1">Jezgra / Core (≥ 3x)</div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">{stats.coreCount}</div>
          <div className="text-[11px] text-stone-400 mt-1">Ripetuti dallo stesso modello</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-stone-800 gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Confronto & Pattern', icon: <BarChart3 className="w-4 h-4 text-amber-400" /> },
          { id: 'questionnaires', label: `I 429 Rispondenti Sintetici (${questionnaires.length})`, icon: <Users className="w-4 h-4 text-blue-400" /> },
          { id: 'places_cloud', label: `Nomi Ricostruiti (${syntheticPlaces.length})`, icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
          { id: 'maps_gallery', label: 'Carte Tematiche Pubblicate (PNG)', icon: <ImageIcon className="w-4 h-4 text-emerald-400" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
              subTab === tab.id
                ? 'border-blue-500 text-blue-300 bg-blue-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & COMPARISON */}
      {subTab === 'overview' && (
        <div className="mt-6 space-y-6">
          {/* Scientific Thesis Box */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-serif font-bold text-lg text-amber-300 mb-3 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Perché questa discrepanza è fondamentale per la Storia Digitale</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light mb-4">
              I modelli linguistici addestrati su corpora generici possiedono una conoscenza probabilistica della lingua
              e della toponomastica napoletana: associano con facilità «Vomero», «Piazza Bellini», «Dischi», o «Cantina»
              generando nomi verosimili come <i>«Fonoteca Bellini»</i>, <i>«Cantina Sica»</i> o <i>«Il Gabbiano»</i>.
              Tuttavia, quando si confrontano le generazioni di due modelli indipendenti:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800">
                <span className="font-bold text-blue-400 block mb-1">DeepSeek Flash (205 questionari)</span>
                <p className="text-stone-400">
                  Genera 631 nomi distinti. Tende a localizzare ritrovi intorno al Centro Storico, Porto e Poggioreale,
                  con toni malinconici ed enfasi su concerti di Pino Daniele e De André.
                </p>
              </div>
              <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800">
                <span className="font-bold text-rose-400 block mb-1">Gemma 4 26B (224 questionari)</span>
                <p className="text-stone-400">
                  Genera 686 nomi distinti su DGX Spark. Tende a privilegiare la collina del Vomero e Posillipo,
                  creando nomi di locali notturni di matrice post-punk o disco eleganti.
                </p>
              </div>
              <div className="bg-stone-950/70 p-3.5 rounded-xl border border-amber-500/40">
                <span className="font-bold text-amber-300 block mb-1">L'Archivio Documentale (24 luoghi)</span>
                <p className="text-stone-400">
                  Sparse, localizzabili solo con un documento d'epoca o citazione verbatim. Solo 10-15 hanno indirizzi
                  certi: il resto è lavoro di emeroteca (Il Mattino) o archivio telefonico.
                </p>
              </div>
            </div>
          </div>

          {/* Top hallucinated / frequent names table and Top Quarters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Reconstructed Names */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>I nomi più generati dai modelli (Jezgra)</span>
                </h4>
                <span className="text-[11px] font-mono text-stone-400">≥ 3 occorrenze</span>
              </div>
              <div className="divide-y divide-stone-800/80">
                {stats.topNames.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-stone-500">#{idx + 1}</span>
                        <span>{item.name}</span>
                        {item.models.size > 1 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Entrambi i modelli
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400 uppercase font-mono">
                        {item.type} · {Array.from(item.models).join(' + ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {item.count}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Quarters in Model Memory */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Distribuzione nei Quartieri</span>
                </h4>
                <span className="text-[11px] font-mono text-stone-400">Centroidi associati</span>
              </div>
              <div className="space-y-3">
                {stats.topZones.map(([zone, count], idx) => {
                  const pct = Math.round((count / stats.total) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize font-medium text-stone-200">{zone}</span>
                        <span className="font-mono text-stone-400">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-amber-500 rounded-full"
                          style={{ width: `${pct * 3}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTIONNAIRES BROWSER */}
      {subTab === 'questionnaires' && (
        <div className="mt-6 space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/60 p-3 rounded-xl border border-stone-800">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cerca nei 429 questionari (negozio, concerto, racconto...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-800/90 text-stone-100 placeholder-stone-400 text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value as any)}
                className="bg-stone-800 text-stone-200 px-2.5 py-1.5 rounded-lg border border-stone-700 text-xs focus:outline-none"
              >
                <option value="all">Tutti i modelli (429)</option>
                <option value="deepseek">Solo DeepSeek (205)</option>
                <option value="gemma">Solo Gemma 4 26B (224)</option>
              </select>

              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-stone-800 text-stone-200 px-2.5 py-1.5 rounded-lg border border-stone-700 text-xs focus:outline-none"
              >
                <option value="all">Tutti i quartieri</option>
                <option value="Centro storico">Centro Storico</option>
                <option value="Vomero">Vomero</option>
                <option value="Chiaia">Chiaia</option>
                <option value="Posillipo">Posillipo</option>
                <option value="Fuorigrotta">Fuorigrotta</option>
                <option value="Sanità">Sanità</option>
                <option value="Barra">Barra</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuestionnaires.slice(0, 36).map((q, idx) => {
              const isDeepseek = q.modello.includes('deepseek');
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-stone-800 bg-stone-900/50 hover:bg-stone-850 hover:border-stone-700 transition flex flex-col justify-between text-xs cursor-pointer shadow-md"
                  onClick={() => setSelectedQuestionnaire(q)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isDeepseek
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {isDeepseek ? 'DeepSeek' : 'Gemma 4'}
                      </span>
                      <span className="text-[11px] font-mono text-stone-400">
                        {q.anno_nascita ? `Nato nel ${q.anno_nascita}` : ''} ({q.genere})
                      </span>
                    </div>

                    <div className="text-stone-300 font-semibold text-sm mb-1 line-clamp-1">
                      📍 {q.zona_residenza || 'Napoli'}
                    </div>

                    <div className="space-y-1.5 my-2 text-[11px] text-stone-300">
                      <div>
                        <span className="text-stone-500 font-mono">Negozio:</span>{' '}
                        <b className="text-stone-200">{q.negozio_nome || '—'}</b>
                        {q.negozio_zona ? ` (${q.negozio_zona})` : ''}
                      </div>
                      <div>
                        <span className="text-stone-500 font-mono">Club:</span>{' '}
                        <b className="text-stone-200">{q.club_nome || '—'}</b>
                      </div>
                      {q.concerto_memorabile && (
                        <div className="line-clamp-1">
                          <span className="text-stone-500 font-mono">Concerto:</span>{' '}
                          <span>{q.concerto_memorabile}</span>
                        </div>
                      )}
                    </div>

                    {q.teleportazione && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-stone-950/70 border border-stone-800/80 italic font-serif text-[11px] text-stone-300 line-clamp-3">
                        «{q.teleportazione}»
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                    <span>{q.respondent_id}</span>
                    <span className="text-amber-400 font-medium">Clicca per scheda completa →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredQuestionnaires.length > 36 && (
            <div className="text-center py-4 text-xs text-stone-400">
              Mostrati i primi 36 questionari di {filteredQuestionnaires.length}. Usa la barra di ricerca per esplorare gli altri.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SYNTHETIC PLACES CLOUD */}
      {subTab === 'places_cloud' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/60 p-3 rounded-xl border border-stone-800 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cerca nome luogo ricostruito..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-800/90 text-stone-100 placeholder-stone-400 text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-700 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer bg-stone-800 px-3 py-2 rounded-lg border border-stone-700">
              <input
                type="checkbox"
                checked={onlyCore}
                onChange={(e) => setOnlyCore(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span>Solo Jezgra / Core (≥ 3 occorrenze)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPlaces.slice(0, 48).map((p, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-stone-800 bg-stone-900/40 text-xs hover:border-stone-700 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-stone-100 truncate">{p.luogo}</div>
                  <span className="font-mono text-[10px] text-amber-400 px-1.5 py-0.2 rounded bg-amber-400/10 border border-amber-400/20">
                    {p.occorrenze}x
                  </span>
                </div>
                <div className="text-[11px] text-stone-400 mb-2">
                  {p.tipo} · {p.zona || 'Napoli'}
                </div>
                {p.descrizione && (
                  <p className="text-[11px] text-stone-300 italic mb-2 line-clamp-2">
                    {p.descrizione}
                  </p>
                )}
                <div className="text-[10px] text-stone-500 font-mono flex items-center justify-between">
                  <span>{p.modello}</span>
                  {p.is_shared_model && <span className="text-rose-400 font-bold">Condiviso</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PUBLISHED MAPS GALLERY */}
      {subTab === 'maps_gallery' && (
        <div className="mt-6 space-y-6">
          <div className="p-4 bg-stone-900/70 rounded-xl border border-stone-800 text-xs text-stone-300">
            Le mappe cartografiche generate con Matplotlib, Contextily e Folium pubblicate negli script e nel notebook scientifico del repository.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              {
                file: '/maps/map_attestati_vs_modelli.png',
                title: 'Luoghi Attestati vs. Nuvola dei Modelli',
                desc: 'La nuvola grigia densa dei modelli a confronto con le rare stelle dell’archivio.',
              },
              {
                file: '/maps/map_core_vs_all.png',
                title: 'Jezgra (Core) vs. Tutti i Luoghi',
                desc: 'Solo i nomi ripetuti ≥ 3 volte nello stesso modello vs. 1.716 menzioni complessive.',
              },
              {
                file: '/maps/map_by_model.png',
                title: 'Mappa per Modello (DeepSeek vs Gemma 4)',
                desc: 'Distribuzione spaziale delle allucinazioni toponomastiche tra le due architetture.',
              },
              {
                file: '/maps/map_by_type.png',
                title: 'Mappa per Tipologia',
                desc: 'Negozi di dischi, club, discoteche, ritrovi e teatri nella cartografia sintetica.',
              },
            ].map((m, idx) => (
              <div key={idx} className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-xl">
                <div className="p-3.5 border-b border-stone-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-stone-100">{m.title}</h4>
                    <p className="text-[11px] text-stone-400">{m.desc}</p>
                  </div>
                  <a
                    href={m.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 text-xs font-mono"
                  >
                    Ingrandisci ↗
                  </a>
                </div>
                <div className="bg-stone-950 p-2 flex items-center justify-center">
                  <img
                    src={m.file}
                    alt={m.title}
                    className="max-h-80 w-auto object-contain rounded border border-stone-800/80"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Questionnaire Details */}
      {selectedQuestionnaire && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedQuestionnaire(null)}
        >
          <div
            className="bg-stone-900 border border-stone-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {selectedQuestionnaire.modello} · {selectedQuestionnaire.respondent_id}
                </span>
                <h3 className="text-xl font-serif font-bold text-stone-100 mt-2">
                  Questionario Sintetico #{selectedQuestionnaire.respondent_id}
                </h3>
                <p className="text-xs text-stone-400">
                  Residenza: {selectedQuestionnaire.zona_residenza} · Nato nel {selectedQuestionnaire.anno_nascita} ({selectedQuestionnaire.genere})
                </p>
              </div>
              <button
                onClick={() => setSelectedQuestionnaire(null)}
                className="text-stone-400 hover:text-stone-100 font-mono"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-800">
                <span className="text-amber-400 font-bold block mb-1">Negozio di Dischi Preferito:</span>
                <p className="font-semibold text-stone-200">
                  {selectedQuestionnaire.negozio_nome} ({selectedQuestionnaire.negozio_zona})
                </p>
                <p className="text-stone-400 text-[11px] mt-1">{selectedQuestionnaire.negozio_descrizione}</p>
                <p className="text-stone-500 text-[10px] mt-0.5">Genere: {selectedQuestionnaire.negozio_genere}</p>
              </div>

              <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-800">
                <span className="text-purple-400 font-bold block mb-1">Club / Locale Serale:</span>
                <p className="font-semibold text-stone-200">
                  {selectedQuestionnaire.club_nome} ({selectedQuestionnaire.club_zona})
                </p>
                <p className="text-stone-400 text-[11px] mt-1">{selectedQuestionnaire.club_dove}</p>
              </div>

              {selectedQuestionnaire.ritrovo_bar && (
                <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-800">
                  <span className="text-amber-300 font-bold block mb-1">Ritrovo / Muretto con Jukebox:</span>
                  <p className="text-stone-300">{selectedQuestionnaire.ritrovo_bar}</p>
                </div>
              )}

              {selectedQuestionnaire.concerto_memorabile && (
                <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-800">
                  <span className="text-emerald-400 font-bold block mb-1">Concerto Memorabile:</span>
                  <p className="text-stone-300">{selectedQuestionnaire.concerto_memorabile}</p>
                </div>
              )}

              {selectedQuestionnaire.teleportazione && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-stone-950 to-stone-900 border border-amber-500/30">
                  <span className="text-amber-400 font-serif font-bold text-xs uppercase tracking-wider block mb-1">
                    «Se potessi tornare a una sera a Napoli negli anni '80...»
                  </span>
                  <p className="italic font-serif text-stone-200 text-xs sm:text-sm leading-relaxed">
                    «{selectedQuestionnaire.teleportazione}»
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
