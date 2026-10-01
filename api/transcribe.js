// Capivo – Transkriptions-Proxy als Vercel Serverless Function (Groq Whisper).
// Gleiche Schnittstelle wie transcribe.php: POST /api/transcribe?model=&lang=&translate=&prompt=
//   Body = rohe WAV-Bytes (das Frontend schickt ~100-s-Stücke, ≤ ~3,2 MB → unter Vercels 4,5-MB-Limit).
// Antwort = Groq-JSON (verbose_json) 1:1. Der Key liegt NUR als Vercel-Umgebungsvariable.
//
// Vercel → Project → Settings → Environment Variables:
//   GROQ_API_KEY          (Pflicht)  gsk_...
//   RATE_LIMIT_PER_HOUR   (optional) Default 120 pro IP (best effort, pro Function-Instanz)
//   REQUIRE_LOGIN=1 + SUPABASE_URL + SUPABASE_ANON_KEY (optional) → nur Eingeloggte dürfen transkribieren
const { URL } = require('url');
const { Blob } = require('buffer');
const ALLOWED = ['whisper-large-v3', 'whisper-large-v3-turbo'];
const MAX_BYTES = 4 * 1024 * 1024; // Vercel kappt Bodies ab 4,5 MB ohnehin

const hits = new Map();   // ip -> [timestamps]  (best effort: Instanzen teilen sich keinen Speicher)
const tokOk = new Map();  // token -> ablaufzeit

function send(res, code, obj, headers) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  for (const k in (headers || {})) res.setHeader(k, headers[k]);
  res.end(JSON.stringify(obj));
}

async function readBody(req) {
  const bufs = []; let n = 0;
  for await (const c of req) {
    n += c.length;
    if (n > MAX_BYTES) { const e = new Error('too large'); e.tooLarge = true; throw e; }
    bufs.push(c);
  }
  return Buffer.concat(bufs);
}

async function checkLogin(req) {
  const tok = String(req.headers['x-capivo-token'] || '').trim();
  const base = String(process.env.SUPABASE_URL || '').replace(/\/$/, ''), key = process.env.SUPABASE_ANON_KEY || '';
  if (!base || !key) return { code: 500, msg: 'REQUIRE_LOGIN aktiv, aber SUPABASE_URL/SUPABASE_ANON_KEY fehlen.' };
  if (!tok || tok.length > 4096) return { code: 401, msg: 'login_required' };
  if ((tokOk.get(tok) || 0) > Date.now()) return null; // 5 Min. gecacht
  try {
    const r = await fetch(base + '/auth/v1/user', { headers: { apikey: key, Authorization: 'Bearer ' + tok } });
    const u = r.ok ? await r.json() : null;
    if (!u || !u.id) return { code: 401, msg: 'login_required' };
  } catch (e) { return { code: 502, msg: 'Login-Prüfung nicht erreichbar.' }; }
  tokOk.set(tok, Date.now() + 300000);
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  const KEY = process.env.GROQ_API_KEY || '';
  if (req.method !== 'POST') return send(res, 200, { ok: true, service: 'capivo-transcribe', configured: !!KEY });
  if (!KEY) return send(res, 500, { error: 'Server nicht konfiguriert: GROQ_API_KEY fehlt (Vercel → Environment Variables).' });

  if (process.env.REQUIRE_LOGIN && process.env.REQUIRE_LOGIN !== '0') {
    const bad = await checkLogin(req);
    if (bad) return send(res, bad.code, { error: bad.msg });
  }

  const limit = parseInt(process.env.RATE_LIMIT_PER_HOUR || '120', 10);
  if (limit > 0) {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'x').split(',')[0].trim();
    const now = Date.now(), list = (hits.get(ip) || []).filter(t => t > now - 3600000);
    if (list.length >= limit) return send(res, 429, { error: 'Zu viele Anfragen von dieser Adresse – bitte später erneut versuchen.' }, { 'Retry-After': '300' });
    list.push(now); hits.set(ip, list);
    if (hits.size > 5000) hits.clear();
  }

  const url = new URL(req.url, 'http://x');
  let model = url.searchParams.get('model') || 'whisper-large-v3-turbo';
  if (!ALLOWED.includes(model)) model = 'whisper-large-v3-turbo';
  const translate = url.searchParams.get('translate') === '1';
  // whisper-large-v3-turbo ist nicht auf Übersetzung trainiert (Groq/OpenAI) → für Translate immer large-v3
  if (translate) model = 'whisper-large-v3';
  const lang = (url.searchParams.get('lang') || '').toLowerCase().replace(/[^a-z]/g, '');
  // Optionales Vokabular („Names & terms“) als Whisper-Prompt: Steuerzeichen raus, Whitespace glätten,
  // max. 300 Zeichen (Whisper wertet ohnehin nur ~224 Tokens aus; begrenzt auch Missbrauch).
  const prompt = Array.from(String(url.searchParams.get('prompt') || '')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 300).join('').trim();

  let audio;
  try { audio = await readBody(req); }
  catch (e) { return send(res, e.tooLarge ? 413 : 400, { error: e.tooLarge ? 'Audio zu gross (max ~4 MB pro Request).' : 'Body konnte nicht gelesen werden.' }); }
  if (audio.length < 100) return send(res, 400, { error: 'Keine Audiodaten empfangen.' });

  const fd = new FormData();
  fd.append('file', new Blob([audio], { type: 'audio/wav' }), 'audio.wav');
  fd.append('model', model);
  fd.append('response_format', 'verbose_json');
  if (!translate) {
    fd.append('timestamp_granularities[]', 'word'); // Wort-Timings für Karaoke
    if (lang) fd.append('language', lang);          // sonst Auto-Detect durch Groq
    if (prompt) fd.append('prompt', prompt);        // nur Transkription — beim Übersetzen würde der Prompt die Zielsprache stören
  }

  let r, body;
  try {
    r = await fetch('https://api.groq.com/openai/v1/audio/' + (translate ? 'translations' : 'transcriptions'),
      { method: 'POST', headers: { Authorization: 'Bearer ' + KEY }, body: fd, signal: AbortSignal.timeout(55000) });
    body = await r.text();
  } catch (e) { return send(res, 502, { error: 'Transkriptions-Dienst nicht erreichbar.' }); }

  const ra = r.headers.get('retry-after');
  res.statusCode = r.status || 502;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (ra && /^\d+$/.test(ra)) res.setHeader('Retry-After', ra);
  try { JSON.parse(body); } catch (e) { return send(res, r.status >= 400 ? r.status : 502, { error: 'Transkriptions-Dienst hat nicht-lesbar geantwortet.' }); }
  res.end(body);
};
