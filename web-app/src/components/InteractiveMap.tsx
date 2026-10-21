import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { RealPlace, SyntheticPlace, AttestatoPlace } from '../types';
import {
  Layers,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  Info,
  Maximize2,
  ExternalLink,
  Search,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';

interface InteractiveMapProps {
  realPlaces: RealPlace[];
  attestati: AttestatoPlace[];
  syntheticPlaces: SyntheticPlace[];
  onSelectPlace?: (place: RealPlace | SyntheticPlace) => void;
}

const TYPE_COLORS: Record<string, string> = {
  club: '#b91c1c', // red-700
  discoteca: '#7e22ce', // purple-700
  negozio_dischi: '#15803d', // green-700
  teatro: '#1d4ed8', // blue-700
  centro_sociale: '#0f766e', // teal-700
  radio: '#d97706', // amber-600
  ritrovo: '#854d0e', // yellow-800
  altro: '#4b5563', // gray-600
};

interface BasemapConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
  requiresKey?: boolean;
}

const BASEMAP_TILES: Record<string, BasemapConfig> = {
  esri_gray: {
    name: 'Esri Gray Canvas (Consigliata · Nessuna Key)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16,
  },
  esri_street: {
    name: 'Esri Strade & Toponomastica (Nessuna Key)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; National Geographic, DeLorme, NAVTEQ',
    maxZoom: 19,
  },
  osm_standard: {
    name: 'OpenStreetMap (Libero · Nessuna Key)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  esri_topo: {
    name: 'Esri Topografica (Nessuna Key)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; USGS, NGA',
    maxZoom: 19,
  },
  esri_satellite: {
    name: 'Esri Satellite / Vista Aerea (Nessuna Key)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; DigitalGlobe, GeoEye, Earthstar Geographics',
    maxZoom: 19,
  },
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  realPlaces,
  attestati: _attestati,
  syntheticPlaces,
  onSelectPlace,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const realMarkersGroupRef = useRef<L.FeatureGroup | null>(null);
  const syntheticMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  // States
  const [selectedBasemap, setSelectedBasemap] = useState<string>('esri_gray');
  const [mapboxToken, setMapboxToken] = useState<string>(() => localStorage.getItem('napoli_mapbox_token') || '');
  const [customTileUrl, setCustomTileUrl] = useState<string>(() => localStorage.getItem('napoli_custom_tile_url') || '');
  const [showRealLayer, setShowRealLayer] = useState<boolean>(true);
  const [showSyntheticLayer, setShowSyntheticLayer] = useState<boolean>(false);
  const [syntheticMode, setSyntheticMode] = useState<'all' | 'core' | 'shared'>('core');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState<RealPlace | null>(null);
  const [activePanel, setActivePanel] = useState<'filters' | 'legend' | 'detail' | 'basemap_settings' | null>(null);

  // Filtered real places that have valid coordinates
  const locatableRealPlaces = useMemo(() => {
    return realPlaces.filter((p) => {
      const lat = parseFloat(p.lat);
      const lon = parseFloat(p.lon);
      if (isNaN(lat) || isNaN(lon)) return false;

      if (selectedType !== 'all' && p.tipo !== selectedType) return false;
      if (selectedLevel !== 'all' && p.livello !== selectedLevel) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.nome.toLowerCase().includes(q) ||
          p.via.toLowerCase().includes(q) ||
          p.quartiere.toLowerCase().includes(q) ||
          p.citazione.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [realPlaces, selectedType, selectedLevel, searchQuery]);

  // Filtered synthetic places
  const locatableSyntheticPlaces = useMemo(() => {
    if (!showSyntheticLayer) return [];

    let subset = syntheticPlaces.filter((p) => p.lat !== null && p.lon !== null);

    if (syntheticMode === 'core') {
      subset = subset.filter((p) => p.is_core);
    } else if (syntheticMode === 'shared') {
      subset = subset.filter((p) => p.is_shared_model);
    }

    if (selectedType !== 'all') {
      subset = subset.filter((p) => {
        if (selectedType === 'negozio_dischi' && p.tipo === 'negozio_dischi') return true;
        if (selectedType === 'club' && (p.tipo === 'club' || p.tipo === 'live')) return true;
        if (selectedType === 'ritrovo' && p.tipo === 'ritrovo') return true;
        return p.tipo === selectedType;
      });
    }

    return subset;
  }, [syntheticPlaces, showSyntheticLayer, syntheticMode, selectedType]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [40.8475, 14.248],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

      const getTileConfig = (key: string) => {
        if (key === 'mapbox' && mapboxToken) {
          return {
            url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
            attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          };
        }
        if (key === 'custom' && customTileUrl) {
          return {
            url: customTileUrl,
            attribution: 'Tile server personalizzato',
            maxZoom: 19,
          };
        }
        return BASEMAP_TILES[key] || BASEMAP_TILES.esri_gray;
      };

      const baseCfg = getTileConfig(selectedBasemap);
      tileLayerRef.current = L.tileLayer(baseCfg.url, {
        attribution: baseCfg.attribution,
        maxZoom: baseCfg.maxZoom,
      }).addTo(map);

      realMarkersGroupRef.current = L.featureGroup().addTo(map);
      syntheticMarkersGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    let url = '';
    let attr = '';
    let maxZ = 18;

    if (selectedBasemap === 'mapbox' && mapboxToken) {
      url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`;
      attr = '&copy; Mapbox &copy; OpenStreetMap';
      maxZ = 19;
    } else if (selectedBasemap === 'custom' && customTileUrl) {
      url = customTileUrl;
      attr = 'Tile server personalizzato';
      maxZ = 19;
    } else {
      const cfg = BASEMAP_TILES[selectedBasemap] || BASEMAP_TILES.esri_gray;
      url = cfg.url;
      attr = cfg.attribution;
      maxZ = cfg.maxZoom;
    }

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = L.tileLayer(url, {
      attribution: attr,
      maxZoom: maxZ,
    }).addTo(mapInstanceRef.current);
  }, [selectedBasemap, mapboxToken, customTileUrl]);

  // Update Real Markers Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = realMarkersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!showRealLayer) return;

    locatableRealPlaces.forEach((r) => {
      const lat = parseFloat(r.lat);
      const lon = parseFloat(r.lon);
      if (isNaN(lat) || isNaN(lon)) return;

      const color = TYPE_COLORS[r.tipo] || '#b91c1c';
      const isLevelB = r.livello === 'B';

      // Custom HTML Marker with Star / Pin aesthetic
      const markerHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: ${color};
          color: white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          border: 2px solid ${isLevelB ? '#fef08a' : '#ffffff'};
          cursor: pointer;
        ">
          <div style="
            transform: rotate(45deg);
            font-size: 13px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${isLevelB ? '★' : '●'}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-real-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 13px; max-width: 310px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: 700; border-radius: 4px; background: ${color}20; color: ${color}; text-transform: uppercase;">
              ${r.tipo.replace('_', ' ')}
            </span>
            <span style="font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; background: ${isLevelB ? '#fef08a' : '#e2e8f0'}; color: ${isLevelB ? '#854d0e' : '#475569'};">
              Livello ${r.livello}
            </span>
          </div>

          <h3 style="font-size: 15px; font-weight: 800; color: #1c1917; margin: 4px 0 2px 0;">
            ${r.nome}
          </h3>

          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            ${r.via ? `<span>📍 ${r.via}</span>` : ''}
            ${r.quartiere ? `<span> · ${r.quartiere}</span>` : ''}
            ${r.anni ? `<span> · ⏱️ ${r.anni}</span>` : ''}
          </div>

          <div style="border-left: 3px solid ${color}; padding-left: 8px; margin: 8px 0; font-style: italic; color: #334155; font-size: 12px; background: #f8fafc; padding-top: 4px; padding-bottom: 4px;">
            „${r.citazione}”
          </div>

          <div style="font-size: 10px; color: #64748b; margin-top: 6px; border-top: 1px solid #f1f5f9; padding-top: 4px;">
            <b>Fonti:</b> ${r.documenti}
          </div>
          <div style="font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; margin-top: 4px;">
            <span>Precisione: ${r.precisione || '—'}</span>
            <span>Geo: ${r.geo_fonte ? r.geo_fonte.split(':')[0] : 'Photon'}</span>
          </div>
        </div>
      `;

      const marker = L.marker([lat, lon], { icon: customIcon });
      marker.bindPopup(popupHtml, { maxWidth: 330 });
      marker.on('click', () => {
        setSelectedPlaceInfo(r);
        setActivePanel('detail');
        if (onSelectPlace) onSelectPlace(r);
      });
      group.addLayer(marker);
    });
  }, [locatableRealPlaces, showRealLayer, onSelectPlace]);

  // Update Synthetic Markers Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = syntheticMarkersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!showSyntheticLayer) return;

    locatableSyntheticPlaces.forEach((p) => {
      if (p.lat === null || p.lon === null) return;

      const isDeepseek = p.modello.includes('deepseek');
      const pointColor = isDeepseek ? '#2563eb' : '#dc2626'; // blue vs red

      const circle = L.circleMarker([p.lat, p.lon], {
        radius: p.is_shared_model ? 7 : p.is_core ? 5 : 3.5,
        fillColor: pointColor,
        color: p.is_shared_model ? '#fbbf24' : '#ffffff',
        weight: p.is_shared_model ? 2 : 0.8,
        opacity: 0.9,
        fillOpacity: p.is_shared_model ? 0.9 : 0.65,
      });

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; max-width: 280px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <span style="font-size: 10px; font-weight: bold; color: ${pointColor}; text-transform: uppercase;">
              ${p.modello}
            </span>
            <span style="font-size: 10px; background: #e0e7ff; color: #3730a3; padding: 1px 5px; border-radius: 4px;">
              Sintetico (${p.occorrenze}x)
            </span>
          </div>
          <b style="font-size: 14px; color: #1e293b;">${p.luogo}</b>
          <div style="font-size: 11px; color: #64748b;">${p.tipo} · ${p.zona || 'Napoli'}</div>
          ${
            p.racconto
              ? `<p style="font-size: 11px; color: #475569; font-style: italic; margin-top: 6px; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
                  «${p.racconto.slice(0, 160)}${p.racconto.length > 160 ? '...' : ''}»
                </p>`
              : ''
          }
          <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">
            ID rispondente: ${p.respondent_id} · Centroide quartiere con jitter
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml, { maxWidth: 300 });
      group.addLayer(circle);
    });
  }, [locatableSyntheticPlaces, showSyntheticLayer]);

  // Fit bounds to Napoli center
  const resetNapoliView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([40.8475, 14.248], 13);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-7.5rem)] min-h-[550px] bg-stone-900 flex flex-col overflow-hidden">
      {/* Top Map Action Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Quick search and active counters */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cerca per nome, via, quartiere..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-stone-900/90 backdrop-blur-md text-stone-100 placeholder-stone-400 text-xs pl-8 pr-3 py-2 rounded-lg border border-stone-700/80 shadow-md focus:outline-none focus:border-amber-500 w-52 sm:w-64"
            />
          </div>

          <button
            onClick={() => setActivePanel(activePanel === 'filters' ? null : 'filters')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium backdrop-blur-md border shadow-md transition ${
              activePanel === 'filters'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-stone-900/90 text-stone-200 border-stone-700/80 hover:bg-stone-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtri</span>
            {(selectedType !== 'all' || selectedLevel !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'legend' ? null : 'legend')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium backdrop-blur-md border shadow-md transition ${
              activePanel === 'legend'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-stone-900/90 text-stone-200 border-stone-700/80 hover:bg-stone-800'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Legenda</span>
          </button>
        </div>

        {/* Right: Layer Switches & Basemap Switcher */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Real Archival Layer Toggle */}
          <button
            onClick={() => setShowRealLayer(!showRealLayer)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold backdrop-blur-md border shadow-md transition ${
              showRealLayer
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/80 shadow-emerald-950/50'
                : 'bg-stone-900/85 text-stone-400 border-stone-700 line-through'
            }`}
            title="Mostra / Nascondi i luoghi attestati dai documenti"
          >
            {showRealLayer ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Archivio Reale ({locatableRealPlaces.length})</span>
          </button>

          {/* Synthetic Model Cloud Toggle */}
          <button
            onClick={() => setShowSyntheticLayer(!showSyntheticLayer)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold backdrop-blur-md border shadow-md transition ${
              showSyntheticLayer
                ? 'bg-blue-950/90 text-blue-300 border-blue-600/80 shadow-blue-950/50'
                : 'bg-stone-900/85 text-stone-400 border-stone-700'
            }`}
            title="Attiva la nuvola dei luoghi generati dai modelli DeepSeek e Gemma"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Nuvola Modelli ({locatableSyntheticPlaces.length})</span>
          </button>

          {/* Basemap Free / Key badge & selector */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <select
                value={selectedBasemap}
                onChange={(e) => {
                  if (e.target.value === 'basemap_settings_trigger') {
                    setActivePanel('basemap_settings');
                  } else {
                    setSelectedBasemap(e.target.value);
                  }
                }}
                className="bg-stone-900/90 backdrop-blur-md text-stone-200 text-xs px-2.5 py-2 rounded-lg border border-stone-700 shadow-md focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <optgroup label="✓ Mappe Libere (Zero API Key)">
                  {Object.entries(BASEMAP_TILES).map(([k, cfg]) => (
                    <option key={k} value={k}>
                      🗺️ {cfg.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="⚙️ Opzioni Avanzate con Key">
                  <option value="mapbox">Mapbox Streets (Token Personale)</option>
                  <option value="custom">Tile Server Personalizzato (XYZ)</option>
                  <option value="basemap_settings_trigger">⚙️ Gestione Chiavi & Provider...</option>
                </optgroup>
              </select>
            </div>

            <button
              onClick={() => setActivePanel(activePanel === 'basemap_settings' ? null : 'basemap_settings')}
              className={`p-2 rounded-lg border text-xs shadow-md transition ${
                activePanel === 'basemap_settings'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-stone-900/90 text-emerald-400 border-stone-700 hover:bg-stone-800'
              }`}
              title="Informazioni API Key & Provider Mappa"
            >
              <span className="font-mono text-xs font-bold">🔑</span>
            </button>
          </div>

          <button
            onClick={resetNapoliView}
            className="p-2 rounded-lg bg-stone-900/90 text-stone-300 hover:text-white border border-stone-700 shadow-md transition"
            title="Centra su Napoli"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Filter Drawer Modal */}
      {activePanel === 'filters' && (
        <div className="absolute top-16 left-3 z-[1001] w-80 bg-stone-900/95 backdrop-blur-md border border-stone-700 rounded-xl shadow-2xl p-4 text-stone-200">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <Filter className="w-4 h-4" />
              <span>Filtri della Mappa</span>
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="text-stone-400 hover:text-stone-100 text-xs font-mono"
            >
              ✕
            </button>
          </div>

          {/* Place Type filter */}
          <div className="mb-3">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block mb-1.5">
              Tipologia Luogo
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-stone-800 text-stone-100 text-xs rounded-lg px-2.5 py-2 border border-stone-700 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">Tutti i tipi ({realPlaces.length})</option>
              <option value="club">Club & Underground</option>
              <option value="discoteca">Discoteca & Dancing</option>
              <option value="negozio_dischi">Negozio di Dischi</option>
              <option value="radio">Radio Libere</option>
              <option value="ritrovo">Muretti & Ritrovi</option>
              <option value="teatro">Teatri & Spazi Grandi</option>
              <option value="centro_sociale">Centri Sociali</option>
            </select>
          </div>

          {/* Evidence level filter */}
          <div className="mb-3">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block mb-1.5">
              Livello di Evidenza
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'all', label: 'Tutti' },
                { id: 'B', label: 'Liv. B (2 fonti)' },
                { id: 'C', label: 'Liv. C (1 fonte)' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`text-[11px] py-1.5 px-2 rounded border font-medium transition ${
                    selectedLevel === lvl.id
                      ? 'bg-amber-600/30 text-amber-300 border-amber-500'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Synthetic Cloud Sub-Filter */}
          {showSyntheticLayer && (
            <div className="pt-2 border-t border-stone-800">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1 mb-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Modalità Nuvola Modelli</span>
              </label>
              <div className="flex flex-col gap-1.5">
                {[
                  {
                    id: 'core',
                    title: 'Jezgra / Core (≥ 3 occorrenze)',
                    desc: '293 nomi ricorrenti nello stesso modello',
                  },
                  {
                    id: 'shared',
                    title: 'Condivisi DeepSeek ∩ Gemma',
                    desc: 'I soli 20 nomi generati da entrambi i modelli',
                  },
                  {
                    id: 'all',
                    title: 'Tutta la memoria sintetica (1.716 punti)',
                    desc: 'Densità totale ricostruita',
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSyntheticMode(m.id as any)}
                    className={`text-left p-2 rounded border text-xs transition ${
                      syntheticMode === m.id
                        ? 'bg-blue-950/70 text-blue-200 border-blue-500'
                        : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    <div className="font-semibold">{m.title}</div>
                    <div className="text-[10px] text-stone-400">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reset button */}
          <button
            onClick={() => {
              setSelectedType('all');
              setSelectedLevel('all');
              setSearchQuery('');
            }}
            className="w-full mt-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 underline text-center"
          >
            Reimposta tutti i filtri
          </button>
        </div>
      )}

      {/* Floating Legend Drawer */}
      {activePanel === 'legend' && (
        <div className="absolute top-16 left-3 z-[1001] w-80 bg-stone-900/95 backdrop-blur-md border border-stone-700 rounded-xl shadow-2xl p-4 text-stone-200">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <BookOpen className="w-4 h-4" />
              <span>Legenda & Criteri del Progetto</span>
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="text-stone-400 hover:text-stone-100 text-xs font-mono"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="font-semibold text-stone-100 mb-1">Livelli di Evidenza:</div>
              <ul className="space-y-1.5 text-[11px] text-stone-300">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-400 bg-amber-400/20 px-1 rounded">A</span>
                  <span>Documento d'epoca con indirizzo (Pagine Gialle 1980, SUAP, licenza questura).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-emerald-400 bg-emerald-400/20 px-1 rounded">B</span>
                  <span>Due fonti indipendenti che concordano (es. Diamond Dogs, Kiss Kiss).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-sky-400 bg-sky-400/20 px-1 rounded">C</span>
                  <span>Una fonte singola, oppure fonte senza numero civico/via precisa.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-rose-400 bg-rose-400/20 px-1 rounded">D</span>
                  <span>Solo proposta dal modello LLM (escluso dalla mappa storica).</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-stone-800">
              <div className="font-semibold text-stone-100 mb-1">Colori per Categoria:</div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {Object.entries(TYPE_COLORS).map(([t, c]) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                    <span className="capitalize">{t.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400 italic font-serif">
              «I punti grigi sono ciò che il modello ripete. Le stelle sono ciò che le fonti nominano. Quella distanza è la scoperta.»
            </div>
          </div>
        </div>
      )}

      {/* Floating Basemap & API Key Settings Drawer */}
      {activePanel === 'basemap_settings' && (
        <div className="absolute top-16 right-3 z-[1001] w-88 max-w-[calc(100vw-24px)] bg-stone-900/95 backdrop-blur-md border border-stone-700 rounded-xl shadow-2xl p-4 text-stone-200">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Provider Cartografici & API Key</span>
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="text-stone-400 hover:text-stone-100 text-xs font-mono"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Zero Key Banner */}
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-emerald-300 mb-1">
                <span>✓ Mappe 100% Libere — Nessuna API Key richiesta</span>
              </div>
              <p className="text-[11px] text-emerald-300/80">
                La mappa utilizza per impostazione predefinita <b>Esri Gray Canvas</b> (lo stesso strato cartografico impiegato negli script originali del repository <code>map_real.py</code>), oltre a <b>Esri Streets</b> e <b>OpenStreetMap</b>.
                Non è richiesta alcuna chiave API per esplorare l'archivio storico o la nuvola dei modelli.
              </p>
            </div>

            {/* Optional Mapbox Key Input */}
            <div className="pt-2 border-t border-stone-800">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block mb-1">
                Token Mapbox Personale (Opzionale)
              </label>
              <input
                type="text"
                placeholder="pk.eyJ1..."
                value={mapboxToken}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setMapboxToken(val);
                  localStorage.setItem('napoli_mapbox_token', val);
                  if (val) setSelectedBasemap('mapbox');
                }}
                className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                Se hai un tuo token Mapbox, inseriscilo qui per caricare lo stile vettoriale Mapbox Streets.
              </span>
            </div>

            {/* Optional Custom Tile URL Input */}
            <div className="pt-2 border-t border-stone-800">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                Server Tile Personalizzato (XYZ Template)
              </label>
              <input
                type="text"
                placeholder="https://.../{z}/{x}/{y}.png"
                value={customTileUrl}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setCustomTileUrl(val);
                  localStorage.setItem('napoli_custom_tile_url', val);
                  if (val) setSelectedBasemap('custom');
                }}
                className="w-full bg-stone-950 border border-stone-800 rounded px-2.5 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Reset to Default Esri Button */}
            <div className="pt-3 border-t border-stone-800">
              <button
                onClick={() => {
                  setSelectedBasemap('esri_gray');
                  setActivePanel(null);
                }}
                className="w-full py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs border border-stone-700 transition"
              >
                Ripristina Esri Gray Canvas (Archivio Storico)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Place Detail Floating Panel (When a place is clicked) */}
      {selectedPlaceInfo && activePanel === 'detail' && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-[1001] bg-stone-900/95 backdrop-blur-md border border-stone-700 rounded-xl shadow-2xl p-4 text-stone-100">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: TYPE_COLORS[selectedPlaceInfo.tipo] || '#666' }}
                >
                  {selectedPlaceInfo.tipo.replace('_', ' ')}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Livello {selectedPlaceInfo.livello}
                </span>
                {selectedPlaceInfo.anni && (
                  <span className="text-[11px] text-stone-400 font-mono">
                    {selectedPlaceInfo.anni}
                  </span>
                )}
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-100">
                {selectedPlaceInfo.nome}
              </h3>
              <p className="text-xs text-stone-400">
                📍 {selectedPlaceInfo.via || 'Via non specificata'}
                {selectedPlaceInfo.quartiere ? ` · ${selectedPlaceInfo.quartiere}` : ''}
              </p>
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="text-stone-400 hover:text-stone-200 text-xs font-mono p-1"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 p-3 rounded-lg bg-stone-800/80 border-l-2 border-amber-500 text-xs text-stone-200 italic font-serif leading-relaxed">
            „{selectedPlaceInfo.citazione}”
          </div>

          <div className="mt-2 text-[11px] text-stone-400">
            <span className="font-semibold text-stone-300">Documenti di riscontro:</span>{' '}
            {selectedPlaceInfo.documenti}
          </div>

          {selectedPlaceInfo.url && (
            <a
              href={selectedPlaceInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium hover:underline"
            >
              <span>Consulta la fonte documentale</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Main Leaflet Map Viewport */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
