import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// Health check endpoint for Cloud Run
app.get(['/healthz', '/api/health'], (_req, res) => {
  res.status(200).send('OK');
});

// API route for extracting places from text using Gemini
app.post('/api/extract', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Testo mancante o non valido.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY non configurata sul server. Utilizzo dell\'estrattore euristico locale.',
        useHeuristic: true
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Sei un estrattore di dati storici. Ti do il testo di una pagina d'archivio su Napoli (anni 1970-1990).
Estrai SOLO i luoghi musicali realmente nominati nel testo: negozi di dischi, club, discoteche, bar con musica, teatri, centri sociali, ritrovi o radio.
Per ognuno restituisci un oggetto JSON con queste chiavi:
  "nome": come scritto nel testo,
  "tipo": uno tra "club", "discoteca", "negozio_dischi", "teatro", "centro_sociale", "radio", "ritrovo", "altro",
  "via": via o piazza se il testo la nomina, altrimenti "",
  "quartiere": quartiere se nominato, altrimenti "",
  "anni": anni o date nominati nel testo, altrimenti "",
  "citazione": la frase esatta del testo (max 25 parole) in cui il luogo è nominato,
  "livello_suggerito": uno tra "B" (se citato da due fonti o autorevole) o "C" (menzione singola)

Non inventare nulla: se un campo non c'è nel testo, lascialo vuoto.
Rispondi con un array JSON, nessun testo aggiuntivo.

TESTO:
---
${text}
---`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    return res.json({ success: true, places: parsed, model: 'gemini-3.8-flash' });
  } catch (err: any) {
    console.error('Server extraction error:', err);
    return res.status(500).json({ error: err.message || 'Errore durante l\'estrazione', useHeuristic: true });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
