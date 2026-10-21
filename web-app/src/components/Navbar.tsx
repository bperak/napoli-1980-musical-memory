import React from 'react';
import { MapPin, Database, Cpu, Compass, CheckCircle2, BookOpen, Layers } from 'lucide-react';

export type TabKey = 'map' | 'archive' | 'probe' | 'extractor' | 'validator' | 'sources';

interface NavbarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  archivalCount: number;
  syntheticCount: number;
  sourcesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  archivalCount,
  syntheticCount,
  sourcesCount,
}) => {
  const navItems: Array<{ key: TabKey; label: string; icon: React.ReactNode; badge?: string | number }> = [
    {
      key: 'map',
      label: 'Mappa Geografica',
      icon: <MapPin className="w-4 h-4" />,
      badge: '2 Livelli',
    },
    {
      key: 'archive',
      label: 'Archivio Documentale',
      icon: <Database className="w-4 h-4" />,
      badge: archivalCount,
    },
    {
      key: 'probe',
      label: 'Sonda dei Modelli',
      icon: <Cpu className="w-4 h-4" />,
      badge: syntheticCount,
    },
    {
      key: 'extractor',
      label: 'Estrattore Citazioni',
      icon: <Compass className="w-4 h-4" />,
      badge: 'Live',
    },
    {
      key: 'validator',
      label: 'Validatore & Registro',
      icon: <CheckCircle2 className="w-4 h-4" />,
      badge: '30 cand.',
    },
    {
      key: 'sources',
      label: 'Guida Fonti & Metodo',
      icon: <BookOpen className="w-4 h-4" />,
      badge: sourcesCount,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 shadow-lg">
      {/* Top Banner with Academic Seminar context */}
      <div className="bg-gradient-to-r from-stone-950 via-amber-950/40 to-stone-950 px-4 py-1.5 border-b border-stone-800/80 text-xs text-stone-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            SEMINARIO FEDERICO II · 21–22 OTT 2026
          </span>
          <span className="hidden sm:inline text-stone-400">
            Storia Digitale · Dottorato di Ricerca · Napoli
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-stone-400">
          <span className="italic font-serif text-amber-200/90">
            «Il modello propone, la citazione prova, lo storico decide»
          </span>
          <span className="hidden md:inline text-stone-500">|</span>
          <span className="hidden md:inline font-mono text-[10px] text-stone-400">
            Cultural Complexity Lab · UniRi
          </span>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('map')}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-rose-700 flex items-center justify-center shadow-md shadow-amber-950/40 text-stone-100 border border-amber-400/20">
            <Layers className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-lg sm:text-xl text-stone-100 tracking-tight flex items-center gap-1.5">
                Napoli 1980
                <span className="text-amber-400 font-sans font-light text-sm hidden xs:inline">
                  — Memoria Musicale
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-stone-400 line-clamp-1">
              Topografia storica (1975–1990) tra allucinazioni LLM e riscontri d'archivio
            </p>
          </div>
        </div>

        {/* Tab Links - Desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-amber-400/20 text-amber-200'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mini stats & Quick actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/bperak/napoli-1980-musical-memory"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded bg-stone-800/80 text-stone-300 hover:text-stone-100 border border-stone-700 hover:border-stone-600 transition"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>bperak/napoli</span>
          </a>
        </div>
      </div>

      {/* Mobile navigation tab scroll */}
      <div className="lg:hidden flex overflow-x-auto px-3 py-2 gap-1.5 bg-stone-950/70 border-t border-stone-800/80 no-scrollbar">
        {navItems.map((item) => {
          const isActive = currentTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                  : 'text-stone-400 hover:text-stone-200 bg-stone-900/50'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="text-[10px] px-1 py-0.2 rounded-full bg-stone-800 text-stone-300 ml-0.5">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
