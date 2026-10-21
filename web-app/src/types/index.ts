export interface RealPlace {
  nome: string;
  tipo: 'club' | 'discoteca' | 'negozio_dischi' | 'teatro' | 'centro_sociale' | 'radio' | 'ritrovo' | 'altro' | string;
  via: string;
  quartiere: string;
  anni: string;
  lat: string;
  lon: string;
  precisione: 'via' | 'quartiere' | 'città' | string;
  livello: 'A' | 'B' | 'C' | 'D';
  citazione: string;
  documenti: string;
  geo_fonte: string;
  url?: string;
}

export interface AttestatoPlace {
  nome: string;
  tipo: string;
  luogo: string;
  quartiere: string;
  anni: string;
  lat: string;
  lon: string;
  precisione_geo: string;
  fonte: string;
  livello: string;
  nota: string;
}

export interface SyntheticPlace {
  id: string;
  respondent_id: string;
  modello: string;
  tipo: 'negozio_dischi' | 'club' | 'ritrovo' | 'live' | string;
  luogo: string;
  zona: string;
  zona_standard: string;
  genere_musicale?: string;
  descrizione?: string;
  confidenza: string;
  racconto: string;
  centroid: [number, number] | null;
  lat: number | null;
  lon: number | null;
  norm_key: string;
  occorrenze: number;
  is_core: boolean;
  is_shared_model: boolean;
}

export interface SyntheticQuestionnaire {
  anno_nascita: string;
  genere: string;
  econ_stabile: string;
  econ_preoccupazioni: string;
  econ_permettersi: string;
  zona_residenza: string;
  negozio_nome: string;
  negozio_genere: string;
  negozio_zona: string;
  negozio_descrizione: string;
  club_nome: string;
  club_genere: string;
  club_zona: string;
  club_dove: string;
  ritrovo_bar: string;
  locale_live: string;
  luogo_concerti_mancante: string;
  concerto_memorabile: string;
  teleportazione: string;
  respondent_id: string;
  modello: string;
  modello_id: string;
  prompt_versione: string;
  sintetico: string;
  confidenza_luoghi: string;
  lotto: string;
  generato_il: string;
}

export interface CorpusExtraction {
  nome: string;
  tipo: string;
  via: string;
  quartiere: string;
  anni: string;
  citazione: string;
  documento: string;
  url_fonte: string;
  metodo: string;
}

export interface SourceCatalogItem {
  id: number;
  fonte: string;
  tipo_materiale: string;
  cosa_da: string;
  percorso: string;
  costo_tempo: string;
  difficolta: number;
  resa_attesa: string;
  stato: string;
  note: string;
}

export interface VerificationCandidate {
  num: string;
  nome: string;
  occorrenze: string;
  modelli: string;
  tipo: string;
  quartiere: string;
  confidenza: string;
  fonte?: string;
  tipo_fonte?: string;
  anno?: string;
  indirizzo_trovato?: string;
  lat?: string;
  lon?: string;
  livello?: string;
  note?: string;
}

export interface ValidationError {
  line: number;
  placeName: string;
  field: string;
  type: 'error' | 'warning';
  message: string;
}

export interface ValidationSummary {
  totalRows: number;
  errorCount: number;
  warningCount: number;
  errors: ValidationError[];
  warnings: ValidationError[];
}
