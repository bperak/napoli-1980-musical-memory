import React, { useState } from 'react';
import { SourceCatalogItem } from '../types';
import {
  BookOpen,
  Search,
  ExternalLink,
  Download,
  ShieldCheck,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  FileCheck,
} from 'lucide-react';

interface SourcesGuideProps {
  sources: SourceCatalogItem[];
}

export const SourcesGuide: React.FC<SourcesGuideProps> = ({ sources }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredSources = sources.filter((s) => {
    if (statusFilter !== 'all' && s.stato !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        s.fonte.toLowerCase().includes(q) ||
        s.cosa_da.toLowerCase().includes(q) ||
        s.percorso.toLowerCase().includes(q) ||
        s.note.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const downloadTemplateCSV = () => {
    const header = 'nome,tipo,via,quartiere,anni,lat,lon,precisione,livello,citazione,documenti,geo_fonte\n';
    const sample = 'Diamond Dogs,club,Cavone San Gennaro,Sanità,1984-1987,40.86291,14.24888,via,B,"varcato il portone di ferro arrugginito al Cavone San Gennaro, nel cuore del rione Sanità, si scendeva... nello storico locale underground Diamond Dogs","Madre Napoli | Rolling Stone Ten Cities","photon: Cavone S. Gennaro dei Poveri, Napoli"\n';
    const blob = new Blob([header + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_nuovo_luogo.csv';
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-stone-100">
      {/* Header */}
      <div className="pb-6 border-b border-stone-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
            GUIDA ALLE FONTI & METODO
          </span>
          <span className="text-xs text-stone-400">
            26 Canali di indagine storiografica per Napoli 1975–1990
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-stone-100">
          Inventario delle Fonti & Percorsi Archivistici
        </h2>
        <p className="text-sm text-stone-400 mt-1 max-w-3xl font-light">
          Dal web aperto alle sale della Biblioteca Nazionale e dell’Emeroteca Tucci: la mappa pragmatica di
          cosa ciascuna fonte è in grado di offrire, quanto costa, quanto tempo richiede e con quale resa attesa.
        </p>
      </div>

      {/* Action Banner: Seminar & Template Download */}
      <div className="my-6 p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-amber-950/30 to-stone-900 border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold mb-1">
            <Calendar className="w-4 h-4" />
            <span>SEMINARIO STORIA DIGITALE · FEDERICO II (21–22 OTTOBRE 2026)</span>
          </div>
          <h3 className="font-serif font-bold text-lg text-stone-100">
            Laboratorio per studenti e ricercatori
          </h3>
          <p className="text-xs text-stone-300 font-light mt-1 max-w-2xl">
            «Il compito per gli studenti è spostare un punto dalla nuvola grigia (modello) alla stella dell’archivio,
            e documentare esattamente quale costo archivistico ha comportato.»
          </p>
        </div>

        <button
          onClick={downloadTemplateCSV}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-2 shrink-0 shadow-lg transition"
        >
          <Download className="w-4 h-4" />
          <span>Scarica template_nuovo_luogo.csv</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/60 p-3 rounded-xl border border-stone-800 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cerca tra le 26 fonti (es. Pagine Gialle, Mattino, SIAE, Tucci...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-800 text-stone-100 placeholder-stone-400 text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-700 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stone-800 text-stone-200 px-2.5 py-1.5 rounded-lg border border-stone-700 text-xs focus:outline-none"
          >
            <option value="all">Tutti gli stati ({sources.length})</option>
            <option value="provata">Fonti già provate</option>
            <option value="da provare">Fonti da esplorare</option>
          </select>
        </div>
      </div>

      {/* Sources Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSources.map((s) => (
          <div
            key={s.id}
            className="p-4 rounded-xl border border-stone-800 bg-stone-900/50 hover:bg-stone-850 hover:border-stone-700 transition flex flex-col justify-between text-xs space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Fonte #{s.id} · {s.tipo_materiale}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    s.stato === 'provata'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-stone-800 text-stone-400 border border-stone-700'
                  }`}
                >
                  {s.stato}
                </span>
              </div>

              <h4 className="font-serif font-bold text-base text-stone-100 mb-1.5">
                {s.fonte}
              </h4>

              <div className="text-stone-300 text-xs mb-2 bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/80">
                <span className="text-stone-400 font-semibold block mb-0.5">Che cosa dà:</span>
                {s.cosa_da}
              </div>

              <p className="text-[11px] text-stone-400 leading-relaxed">
                <b className="text-stone-300">Percorso pratico:</b> {s.percorso}
              </p>
            </div>

            <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between text-[11px] text-stone-400 font-mono gap-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{s.costo_tempo}</span>
              </div>
              <div className="text-stone-300 font-medium">
                Resa: {s.resa_attesa}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ethics & Academic Citation Box */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800">
          <div className="flex items-center gap-2 text-stone-200 font-serif font-bold text-base mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Etica e Limiti della Ricerca</span>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed font-light">
            I 429 questionari generati dai modelli linguistici sono <b>esclusivamente sintetici</b> e non costituiscono
            indagine o testimonianza reale sui cittadini napoletani. La loro funzione metodologica è esclusivamente
            quella di quantificare e visualizzare le tendenze di allucinazione toponomastica delle IA generative rispetto
            alla concretezza sparsa delle fonti d'archivio.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800">
          <div className="flex items-center gap-2 text-stone-200 font-serif font-bold text-base mb-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>Citazione del Progetto</span>
          </div>
          <pre className="p-3 rounded-lg bg-stone-950 font-mono text-[11px] text-stone-300 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-stone-800">
{`Perak, B. (2026). Napoli 1980 — musical memory, extracted:
a probe with language models and an extraction pipeline
over documentary sources. GitHub repository.
https://github.com/bperak/napoli-1980-musical-memory`}
          </pre>
        </div>
      </div>
    </div>
  );
};
