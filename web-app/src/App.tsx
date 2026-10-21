import React, { useState } from 'react';
import { Navbar, TabKey } from './components/Navbar';
import { InteractiveMap } from './components/InteractiveMap';
import { ArchiveTable } from './components/ArchiveTable';
import { TheProbeAnalytics } from './components/TheProbeAnalytics';
import { ExtractorWorkbench } from './components/ExtractorWorkbench';
import { ValidatorWorkbench } from './components/ValidatorWorkbench';
import { SourcesGuide } from './components/SourcesGuide';

// Real and synthesized datasets from the repository
import realPlacesData from './data/estrazioni_reali.json';
import attestatiData from './data/attestati.json';
import corpusManifestData from './data/corpus_manifest.json';
import corpusExtractionsData from './data/estrazioni_corpus.json';
import registroVerificaData from './data/registro_verifica.json';
import syntheticPlacesData from './data/synthetic_places.json';
import syntheticQuestionnairesData from './data/synthetic_questionnaires.json';
import sourcesCatalogData from './data/sources_catalog.json';

import { RealPlace, AttestatoPlace, SyntheticPlace, SyntheticQuestionnaire, CorpusExtraction, SourceCatalogItem } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabKey>('map');

  const realPlaces = realPlacesData as RealPlace[];
  const attestati = attestatiData as AttestatoPlace[];
  const corpusManifest = corpusManifestData as any[];
  const corpusExtractions = corpusExtractionsData as CorpusExtraction[];
  const syntheticPlaces = syntheticPlacesData as SyntheticPlace[];
  const syntheticQuestionnaires = syntheticQuestionnairesData as SyntheticQuestionnaire[];
  const sourcesCatalog = sourcesCatalogData as SourceCatalogItem[];

  const handleViewOnMap = (_place: RealPlace) => {
    setCurrentTab('map');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        archivalCount={realPlaces.length}
        syntheticCount={syntheticPlaces.length}
        sourcesCount={sourcesCatalog.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'map' && (
          <InteractiveMap
            realPlaces={realPlaces}
            attestati={attestati}
            syntheticPlaces={syntheticPlaces}
          />
        )}

        {currentTab === 'archive' && (
          <ArchiveTable
            realPlaces={realPlaces}
            attestati={attestati}
            corpusExtractions={corpusExtractions}
            corpusManifest={corpusManifest}
            onViewOnMap={handleViewOnMap}
          />
        )}

        {currentTab === 'probe' && (
          <TheProbeAnalytics
            syntheticPlaces={syntheticPlaces}
            questionnaires={syntheticQuestionnaires}
          />
        )}

        {currentTab === 'extractor' && <ExtractorWorkbench />}

        {currentTab === 'validator' && (
          <ValidatorWorkbench
            realPlaces={realPlaces}
            attestati={attestati}
            rawRegistro={registroVerificaData}
          />
        )}

        {currentTab === 'sources' && <SourcesGuide sources={sourcesCatalog} />}
      </main>

      {/* Persistent Academic Footer */}
      <footer className="border-t border-stone-800/80 bg-stone-950 py-6 px-4 text-xs text-stone-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-serif font-semibold text-stone-200">
              Napoli 1980 — Memoria musicale estratta
            </div>
            <div className="text-[11px] text-stone-400 font-light">
              Progetto di ricerca di Benedikt Perak · Cultural Complexity Lab (University of Rijeka)
              in collaborazione con il Seminario di Storia Digitale, Università degli Studi di Napoli Federico II.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-stone-400">
            <a
              href="https://github.com/bperak/napoli-1980-musical-memory"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline"
            >
              GitHub Repository
            </a>
            <span>•</span>
            <span>CC BY 4.0 & MIT License</span>
            <span>•</span>
            <span className="text-stone-400">21–22 Ottobre 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
