export interface ExtractedPlaceItem {
  nome: string;
  tipo: string;
  via: string;
  quartiere: string;
  anni: string;
  citazione: string;
  livello_suggerito: string;
  metodo: 'regola_deterministica' | 'gemini_llm';
  lat?: string;
  lon?: string;
  precisione?: string;
}

export const KNOWN_NAPOLI_GEO: Record<string, { lat: number; lon: number; precision: 'via' | 'quartiere' | 'città' }> = {
  'cavone san gennaro': { lat: 40.86291, lon: 14.24888, precision: 'via' },
  'via atri': { lat: 40.8515, lon: 14.2545, precision: 'via' },
  'via costantinopoli': { lat: 40.8516, lon: 14.2517, precision: 'via' },
  'via san giacomo dei capri': { lat: 40.85741, lon: 14.2232, precision: 'via' },
  'via partenope': { lat: 40.8296, lon: 14.24483, precision: 'via' },
  'via manzoni': { lat: 40.81737, lon: 14.20199, precision: 'via' },
  'via paisiello': { lat: 40.84709, lon: 14.22775, precision: 'via' },
  'piazza del gesù': { lat: 40.84576, lon: 14.25242, precision: 'via' },
  'piazza dei martiri': { lat: 40.83565, lon: 14.24055, precision: 'via' },
  'piazza bellini': { lat: 40.8518, lon: 14.258, precision: 'via' },
  'vomero': { lat: 40.84383, lon: 14.216, precision: 'quartiere' },
  'sanità': { lat: 40.858, lon: 14.25, precision: 'quartiere' },
  'chiaia': { lat: 40.8342, lon: 14.22888, precision: 'quartiere' },
  'centro storico': { lat: 40.8515, lon: 14.2565, precision: 'quartiere' },
  'posillipo': { lat: 40.81, lon: 14.21, precision: 'quartiere' },
  'fuorigrotta': { lat: 40.827, lon: 14.19, precision: 'quartiere' },
  'bagnoli': { lat: 40.825, lon: 14.175, precision: 'quartiere' },
  'rione alto': { lat: 40.857, lon: 14.223, precision: 'quartiere' },
  'acerra': { lat: 40.9461, lon: 14.375, precision: 'città' },
};

export function lookupCoords(text: string): { lat: string; lon: string; precisione: string } {
  const lower = text.toLowerCase();
  for (const [key, data] of Object.entries(KNOWN_NAPOLI_GEO)) {
    if (lower.includes(key)) {
      return {
        lat: data.lat.toString(),
        lon: data.lon.toString(),
        precisione: data.precision,
      };
    }
  }
  return { lat: '', lon: '', precisione: '' };
}

// Deterministic extractor implementing the rules from scripts/estrattore.py
export function extractPlacesHeuristic(rawText: string): ExtractedPlaceItem[] {
  const results: ExtractedPlaceItem[] = [];
  if (!rawText || rawText.trim().length === 0) return results;

  // Split into sentences
  const sentences = rawText
    .replace(/([.?!])\s+(?=[A-Z0-9«"“])/g, '$1|')
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const placeTypeMap: Record<string, string> = {
    club: 'club',
    discoteca: 'discoteca',
    discoteche: 'discoteca',
    'maxidiscoteca': 'discoteca',
    'negozio di dischi': 'negozio_dischi',
    'negozio dischi': 'negozio_dischi',
    dischi: 'negozio_dischi',
    fanzine: 'ritrovo',
    'centro sociale': 'centro_sociale',
    teatro: 'teatro',
    radio: 'radio',
    emittente: 'radio',
    muretto: 'ritrovo',
    ritrovo: 'ritrovo',
    tavernetta: 'club',
    night: 'club',
    bar: 'ritrovo',
  };

  // Deterministic known patterns
  const patterns = [
    // "aprono il Diamond Dogs" / "allo storico locale underground Diamond Dogs"
    /(?:aprono\s+il|al\s+locale|allo\s+storico\s+locale\s+underground|allo|al)\s+([A-Z][a-zA-Z0-9\s'’-]{2,30}?)(?=[,\.\s]+(?:al|nel|in|di|sito|aperto|chiuso|\b))/i,
    // "si chiama Cantina Sica"
    /(?:si\s+chiama|denominat[oa]|chiamat[oa])\s+([A-Z][a-zA-Z0-9\s'’-]{2,30}?)(?=[,\.\s]+|$)/i,
    // "lo ZX di via Atri"
    /(?:lo|il|la|il\s+club|il\s+mitico)\s+([A-Z][a-zA-Z0-9\s'’-]{2,25})\s+(?:di|in|sito\s+in)\s+(via|piazza|corso|cavone)\s+([A-Za-z0-9\s]+?)(?=[,\.]|$)/i,
    // "De Marco, un negozio di dischi, al Vomero"
    /([A-Z][a-zA-Z0-9\s'’-]{2,25}),\s+(?:un|una)\s+(negozio di dischi|club|discoteca|radio|ritrovo)/i,
    // "Radio Kiss Kiss", "Radio Marte", etc.
    /(Radio\s+[A-Z][a-zA-Z0-9\s'’-]{2,20})/i,
    // "il Saturday's Club sito in Via Partenope"
    /([A-Z][a-zA-Z0-9\s'’-]{2,25}\s+Club)\s+(?:sito\s+in\s+)?([Vv]ia|[Pp]iazza|[Cc]orso)?/i,
  ];

  sentences.forEach((sentence) => {
    // Detect years (1970-1999 or '80s)
    const yearMatch = sentence.match(/\b(19[7-9]\d(?:\s*[-–/]\s*19[8-9]\d)?|anni\s*['’]?[789]0(?:\s*e\s*['’]?90)?|nel\s*['’]\d{2}|['’]\d{2})\b/i);
    const years = yearMatch ? yearMatch[0] : '';

    // Detect quarter
    const quarterMatch = sentence.match(/\b(Vomero|Chiaia|Sanità|Centro Storico|Decumani|Posillipo|Fuorigrotta|Bagnoli|Acerra|Rione Alto|Arenella|Porto|Pendino|Pianura|Soccavo)\b/i);
    const quarter = quarterMatch ? quarterMatch[0] : '';

    // Detect street
    const streetMatch = sentence.match(/\b((?:via|piazza|corso|cavone)\s+[A-Za-z0-9\s'’]{3,28}?)(?=[,\.]|\s+(?:al|nel|in|del|a Napoli|\b))/i);
    const street = streetMatch ? streetMatch[0].trim() : '';

    // Detect type
    let matchedType = 'club';
    for (const [key, typeVal] of Object.entries(placeTypeMap)) {
      if (new RegExp(`\\b${key}\\b`, 'i').test(sentence)) {
        matchedType = typeVal;
        break;
      }
    }

    // Check patterns
    for (const pat of patterns) {
      const match = sentence.match(pat);
      if (match && match[1]) {
        const placeName = match[1].trim();
        // Skip common false positives
        if (
          placeName.length >= 3 &&
          !['Napoli', 'Italia', 'Rolling Stone', 'Campania', 'Europa', 'New Wave', 'Post Punk', 'Dischi', 'Radio', 'Club'].includes(placeName)
        ) {
          // Avoid duplicate within same sentence
          if (!results.some((r) => r.nome.toLowerCase() === placeName.toLowerCase())) {
            const locInfo = lookupCoords(`${street} ${quarter} ${placeName}`);
            results.push({
              nome: placeName,
              tipo: matchedType,
              via: street,
              quartiere: quarter,
              anni: years,
              citazione: sentence.length > 180 ? sentence.substring(0, 177) + '...' : sentence,
              livello_suggerito: 'C',
              metodo: 'regola_deterministica',
              lat: locInfo.lat,
              lon: locInfo.lon,
              precisione: locInfo.precisione,
            });
          }
        }
      }
    }
  });

  return results;
}

// Dual extractor: tries Gemini /api/extract first, falls back to deterministic heuristic
export async function extractPlaces(
  text: string,
  preferredMethod: 'auto' | 'gemini' | 'heuristic' = 'auto'
): Promise<{ places: ExtractedPlaceItem[]; method: string; note?: string }> {
  if (preferredMethod === 'heuristic') {
    return {
      places: extractPlacesHeuristic(text),
      method: 'Heuristic & Regex (Offline Deterministic)',
    };
  }

  try {
    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.places && Array.isArray(data.places) && data.places.length > 0) {
        const enriched = data.places.map((p: any) => {
          const loc = lookupCoords(`${p.via || ''} ${p.quartiere || ''} ${p.nome || ''}`);
          return {
            nome: p.nome || '',
            tipo: p.tipo || 'club',
            via: p.via || '',
            quartiere: p.quartiere || '',
            anni: p.anni || '',
            citazione: p.citazione || '',
            livello_suggerito: p.livello_suggerito || 'C',
            metodo: 'gemini_llm' as const,
            lat: loc.lat,
            lon: loc.lon,
            precisione: loc.precisione,
          };
        });
        return {
          places: enriched,
          method: 'Gemini 2.5 Flash LLM (Structured JSON Extraction)',
        };
      }
    }
  } catch (_e) {
    // API not configured or network error, fallback gracefully
  }

  // Fallback to heuristic
  const heuristicPlaces = extractPlacesHeuristic(text);
  return {
    places: heuristicPlaces,
    method: 'Heuristic & Regex (Deterministic Pipeline)',
    note: 'Estrattore locale deterministico eseguito con successo sulle regole sintattiche e toponomastiche.',
  };
}
