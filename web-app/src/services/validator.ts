import { ValidationError, ValidationSummary } from '../types';

export const BBOX = {
  latMin: 40.70,
  latMax: 41.00,
  lonMin: 13.95,
  lonMax: 14.55,
};

export const VALID_LEVELS = new Set(['A', 'B', 'C', 'D']);
export const VALID_TYPES = new Set([
  'club',
  'discoteca',
  'negozio_dischi',
  'teatro',
  'centro_sociale',
  'radio',
  'ritrovo',
  'altro',
]);

export function normalizeName(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\W+/g, '');
}

export function validatePlacesData(
  rows: Array<Record<string, any>>,
  filename: string = 'estrazioni_reali.csv'
): ValidationSummary {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const seen: Map<string, number> = new Map();

  if (!rows || rows.length === 0) {
    return {
      totalRows: 0,
      errorCount: 1,
      warningCount: 0,
      errors: [
        {
          line: 1,
          placeName: '—',
          field: 'file',
          type: 'error',
          message: `${filename}: nessuna riga trovata nella tabella`,
        },
      ],
      warnings: [],
    };
  }

  rows.forEach((row, idx) => {
    const lineNum = idx + 2; // header is line 1
    const nome = (row.nome || '').trim();

    if (nome.length < 2) {
      errors.push({
        line: lineNum,
        placeName: nome || 'Senza nome',
        field: 'nome',
        type: 'error',
        message: `Riga ${lineNum}: nome mancante o troppo corto (< 2 caratteri)`,
      });
      return;
    }

    const normKey = normalizeName(nome);
    if (seen.has(normKey)) {
      errors.push({
        line: lineNum,
        placeName: nome,
        field: 'nome',
        type: 'error',
        message: `Riga ${lineNum}: nome duplicato «${nome}» (già presente alla riga ${seen.get(normKey)})`,
      });
    } else {
      seen.set(normKey, lineNum);
    }

    const cit = (row.citazione || '').trim();
    const fonte = (row.documenti || row.fonte || '').trim();

    if (filename !== 'attestati.csv' && cit.length < 15) {
      errors.push({
        line: lineNum,
        placeName: nome,
        field: 'citazione',
        type: 'error',
        message: `Riga ${lineNum}: «${nome}» senza citazione adeguata (minimo 15 caratteri, trovati ${cit.length})`,
      });
    } else if (cit && cit.length < 15) {
      warnings.push({
        line: lineNum,
        placeName: nome,
        field: 'citazione',
        type: 'warning',
        message: `Riga ${lineNum}: «${nome}» citazione molto breve (< 15 caratteri)`,
      });
    }

    if (!fonte) {
      errors.push({
        line: lineNum,
        placeName: nome,
        field: 'documenti',
        type: 'error',
        message: `Riga ${lineNum}: «${nome}» senza fonte documentale indicata`,
      });
    }

    const liv = (row.livello || '').trim().toUpperCase();
    if (liv && !VALID_LEVELS.has(liv)) {
      errors.push({
        line: lineNum,
        placeName: nome,
        field: 'livello',
        type: 'error',
        message: `Riga ${lineNum}: livello di evidenza «${liv}» non valido (consentiti: A, B, C, D)`,
      });
    }

    if (liv === 'D') {
      warnings.push({
        line: lineNum,
        placeName: nome,
        field: 'livello',
        type: 'warning',
        message: `Riga ${lineNum}: «${nome}» è livello D (sola menzione del modello — non compare sulla mappa dei luoghi documentati)`,
      });
    }

    const tipo = (row.tipo || '').trim().toLowerCase();
    if (filename !== 'attestati.csv' && tipo && !VALID_TYPES.has(tipo)) {
      warnings.push({
        line: lineNum,
        placeName: nome,
        field: 'tipo',
        type: 'warning',
        message: `Riga ${lineNum}: tipo «${tipo}» non standard (${Array.from(VALID_TYPES).join(', ')})`,
      });
    }

    const latRaw = (row.lat || '').toString().trim();
    const lonRaw = (row.lon || '').toString().trim();

    if (latRaw || lonRaw) {
      const lat = parseFloat(latRaw.replace(',', '.'));
      const lon = parseFloat(lonRaw.replace(',', '.'));

      if (isNaN(lat) || isNaN(lon)) {
        errors.push({
          line: lineNum,
          placeName: nome,
          field: 'coordinate',
          type: 'error',
          message: `Riga ${lineNum}: coordinate non numeriche valide («${latRaw}», «${lonRaw}»)`,
        });
      } else {
        if (
          lat < BBOX.latMin ||
          lat > BBOX.latMax ||
          lon < BBOX.lonMin ||
          lon > BBOX.lonMax
        ) {
          errors.push({
            line: lineNum,
            placeName: nome,
            field: 'coordinate',
            type: 'error',
            message: `Riga ${lineNum}: «${nome}» coordinate [${lat.toFixed(4)}, ${lon.toFixed(4)}] fuori dall'area metropolitana di Napoli [${BBOX.latMin}-${BBOX.latMax}, ${BBOX.lonMin}-${BBOX.lonMax}]`,
          });
        }

        const precisione = (row.precisione || row.precisione_geo || '').trim();
        if (!precisione) {
          warnings.push({
            line: lineNum,
            placeName: nome,
            field: 'precisione',
            type: 'warning',
            message: `Riga ${lineNum}: «${nome}» ha coordinate ma non specifica la precisione (via, quartiere, città)`,
          });
        }
      }
    }
  });

  return {
    totalRows: rows.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
  };
}
