// CaptionRush – Transkript-Feinschliff („Polish“) als Vercel Serverless Function (Groq Chat Completions).
// Gegenstück für klassisches PHP-Webhosting: polish.php (gleiche Schnittstelle, gleiche Regeln).
//
// Zweck: Nach Whisper large-v3 korrigiert ein LLM NUR offensichtliche Erkennungsfehler
// (verhörte Wörter – v. a. Namen/Marken/Orte aus dem Vokabular –, Rechtschreibung, Gross-/Kleinschreibung,
// Satzzeichen, Satzgrenzen). Kein Umformulieren/Übersetzen/Kürzen/Umstellen. Jede vorgeschlagene
// Korrektur wird serverseitig geprüft (Wortzahl, Wort-Editierdistanz, ß-Schutz); was zu stark
// abweicht, wird verworfen und das Original bleibt stehen.
//
// ── Vertrag ──────────────────────────────────────────────────────────────────────────────
// POST /api/polish   Content-Type: application/json   (optional Header X-Capivo-Token bei REQUIRE_LOGIN)
//   { "lang": "de",                          // ISO-Kürzel, optional (nur a–z, max. 8)
//     "vocab": "Birkenhof, Highland Beef",   // optional, wird bereinigt + auf 300 Zeichen gekappt
//     "segments": [ { "id": 0, "text": "..." }, ... ] }   // id = endliche Zahl, eindeutig; text = String
//   Grenzen: Gesamttext (Summe aller text-Längen) ≤ 12 000 Zeichen, ≤ 1000 Segmente → sonst 413.
// 200 → { "segments": [ { "id", "text" }, ... ],   // gleiche ids, gleiche Reihenfolge, immer vollständig
//         "model": "openai/gpt-oss-120b" | "openai/gpt-oss-20b" | null (nichts zu tun),
//         "changed": n,                            // Segmente mit geändertem Text
//         "rejected": n }                          // LLM-Vorschläge, die die Prüfung nicht bestanden
// Fehler → { "error": "..." } mit 400 (ungültiger Body), 401 login_required, 405-frei (GET = Health-Check),
//   413 (zu gross), 429 (IP-Limit, Retry-After), 500 („Server nicht konfiguriert: …“), 502 (Groq
//   komplett fehlgeschlagen/unlesbar/Timeout). Bei jedem Fehler behält das Frontend das Roh-Transkript.
// GET /api/polish → { ok: true, service: "capivo-polish", configured: bool }
//
// Ablauf Groq: Modell "openai/gpt-oss-120b", Fallback "openai/gpt-oss-20b" bei 400/404/429/5xx,
// Netzfehler oder unlesbarem JSON; temperature 0, response_format json_object; Gesamtbudget ~25 s.
//
// Vercel → Project → Settings → Environment Variables (dieselben wie api/transcribe.js):
//   GROQ_API_KEY          (Pflicht)  gsk_...
//   RATE_LIMIT_PER_HOUR   (optional) Default 120 pro IP (eigener Zähler, getrennt von transcribe)
//   REQUIRE_LOGIN=1 + SUPABASE_URL + SUPABASE_ANON_KEY (optional) → nur Eingeloggte
// Keine globalen URL/Blob nötig (die können in Tests gestubbt sein) – nur fetch + AbortSignal (Node ≥ 18).

const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const guard = require('./_guard');
const MAX_BYTES = 256 * 1024;   // roher JSON-Body
const MAX_CHARS = 12000;        // Summe aller Segment-Texte
const MAX_SEGMENTS = 1000;
const BUDGET_MS = 20000;        // gesamte Groq-Zeit (vercel.json maxDuration 30)
const MIN_FALLBACK_MS = 4000;   // weniger Restzeit → kein Fallback-Versuch mehr

const hits = new Map();   // ip -> [timestamps]  (eigener Bucket; best effort pro Instanz)
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

// ── Prompt ────────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = [
  'You proofread automatic speech-recognition (Whisper) transcripts that become video subtitles.',
  'Input: JSON {"lang": ISO code, "vocab": comma-separated names/terms (may be empty), "segments": [{"id", "text"}]}.',
  'Output: ONLY a JSON object {"segments":[{"id":<same id>,"text":"<corrected text>"}]} containing every input id exactly once, in the same order. Return unchanged segments verbatim.',
  '',
  'Fix ONLY obvious recognition errors:',
  '1. Misheard words: if a word or phrase sounds like an entry in "vocab", write it exactly as in vocab (e.g. "Birkehof" -> "Birkenhof", "Highland Biff" -> "Highland Beef"). Also fix clearly misheard common words that make no sense in context.',
  '2. Spelling mistakes.',
  '3. Capitalization: sentence starts, proper names; in German ALL nouns are capitalized.',
  '4. Punctuation and sentence boundaries: periods, commas, question marks, apostrophes.',
  '',
  'NEVER:',
  '- paraphrase, rephrase, translate, summarize, shorten, expand or "improve" style or grammar;',
  '- add, remove or reorder words, or move words between segments; never merge or split segments;',
  '- remove filler words (äh, ähm, also, halt, quasi, gell, eh, um, like), repetitions, colloquial, Swiss or dialect phrasing — keep them exactly as spoken;',
  '- change numbers between digits and words;',
  '- change "ss" to "ß". Swiss spelling uses "ss": if the input text has no "ß", the output must not contain "ß".',
  '- "translate" Swiss German / dialect into Standard German: dialect words stay as written (e.g. "üsi", "zäme", "uf", "hüt", "zeig", "Weid", "willkomme" stay — only fix their capitalization);',
  '- join separate words with hyphens or merge/split words (e.g. never "Highland Rinder" -> "Highland-Rinder"); use only plain ASCII hyphens if a hyphen is already in the input.',
  '- replace a correctly recognised real word with a vocab entry just because they share a word: vocab only fixes words that SOUND like the entry and make no sense as heard ("Highland Rinder" stays "Highland Rinder"; "Highland Biff" -> "Highland Beef");',
  'Keep the language of the input. If you are not sure a change is needed, leave the text unchanged.'
].join('\n');

const FEW_SHOT = [
  { input: { lang: 'de', vocab: 'Birkenhof, Highland Beef', segments: [
      { id: 1, text: 'äh willkommen auf dem birkehof bei uns gibts highland biff' },
      { id: 2, text: 'die rinder sind das ganze jahr draussen gell' }] },
    output: { segments: [
      { id: 1, text: 'Äh, willkommen auf dem Birkenhof, bei uns gibt\'s Highland Beef.' },
      { id: 2, text: 'Die Rinder sind das ganze Jahr draussen, gell?' }] } },
  { input: { lang: 'de', vocab: '', segments: [
      { id: 7, text: 'also wir haben halt heute morgen die schaafe geschoren und das war mega streng' },
      { id: 8, text: 'ich weiss nicht ob das jetzt so gut ist wie letztes jahr was meinst du' }] },
    output: { segments: [
      { id: 7, text: 'Also, wir haben halt heute Morgen die Schafe geschoren und das war mega streng.' },
      { id: 8, text: 'Ich weiss nicht, ob das jetzt so gut ist wie letztes Jahr. Was meinst du?' }] } }
];

function buildMessages(lang, vocab, segs) {
  const m = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const ex of FEW_SHOT) {
    m.push({ role: 'user', content: JSON.stringify(ex.input) });
    m.push({ role: 'assistant', content: JSON.stringify(ex.output) });
  }
  m.push({ role: 'user', content: JSON.stringify({ lang: lang || '', vocab: vocab || '', segments: segs }) });
  return m;
}

// ── Prüfung der LLM-Vorschläge ──────────────────────────────────────────────────────────────
function cleanText(s) {
  return String(s).replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim();
}
// Normalisierte Wortliste: klein, ß→ss, alles ausser Buchstaben/Ziffern entfernt (Satzzeichen zählen nicht).
function normWords(s) {
  return String(s).split(/\s+/).map(w => w.toLowerCase().replace(/ß/g, 'ss').replace(/[^\p{L}\p{N}]+/gu, ''))
    .filter(Boolean);
}
// Levenshtein auf Wort-Ebene (Einfügen/Löschen/Ersetzen je 1).
function wordEditDistance(a, b) {
  let prev = new Array(b.length + 1), cur = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    const t = prev; prev = cur; cur = t;
  }
  return prev[b.length];
}
// Gibt den akzeptierten (ggf. ß→ss reparierten) Text zurück oder null (→ Original behalten).
// Regeln: nicht leer; Wortzahl-Abweichung ≤ max(2, 15 %); Wort-Editierdistanz ≤ max(1, 35 %) der
// Original-Wortzahl (Minimum 1, damit z. B. ein einzelnes verhörtes Vokabular-Wort korrigierbar ist);
// kein neues „ß“, wenn das Original keins hatte; Länge ≤ 2× Original + 40 Zeichen.
function acceptCorrection(orig, cand) {
  if (typeof cand !== 'string') return null;
  let t = cleanText(cand);
  if (!t) return null;
  if (!/[ßẞ]/.test(orig)) t = t.replace(/ẞ/g, 'SS').replace(/ß/g, 'ss');
  // Exotische Bindestriche (U+2010/2011) → normaler; hatte das Original gar keinen Bindestrich, wird ein vom
  // Modell neu eingefügter ("Highland Rinder" → "Highland‑Rinder") wieder zum Leerzeichen — sonst ändert sich
  // die Wortzahl und die Wort-Timings passen nicht mehr.
  t = t.replace(/[\u2010\u2011]/g, '-');
  if (orig.indexOf('-') < 0) t = t.replace(/(\S)-(\S)/g, '$1 $2');
  const a = normWords(orig), b = normWords(t), n = a.length;
  if (!n || !b.length) return null;
  if (Math.abs(b.length - n) > Math.max(2, Math.floor(n * 0.15))) return null;
  if (wordEditDistance(a, b) > Math.max(1, Math.floor(n * 0.35))) return null;
  if (t.length > orig.length * 2 + 40) return null;
  return t;
}

// LLM-Antwort → Map id → text, oder null wenn unlesbar.
function parseLlmJson(content) {
  if (typeof content !== 'string') return null;
  let s = content.trim(), obj = null;
  try { obj = JSON.parse(s); } catch (e) {
    const i = s.indexOf('{'), j = s.lastIndexOf('}');   // z. B. ```json … ``` drumherum
    if (i < 0 || j <= i) return null;
    try { obj = JSON.parse(s.slice(i, j + 1)); } catch (e2) { return null; }
  }
  const arr = obj && Array.isArray(obj.segments) ? obj.segments : null;
  if (!arr) return null;
  const out = new Map();
  for (const x of arr) {
    if (!x || typeof x !== 'object') continue;
    const id = typeof x.id === 'string' && x.id.trim() !== '' ? Number(x.id) : x.id;
    if (typeof id !== 'number' || !Number.isFinite(id) || out.has(id)) continue;
    out.set(id, x.text);
  }
  return out;
}

function applyCorrections(segs, map) {
  let changed = 0, rejected = 0;
  const out = segs.map(s => {
    if (!map.has(s.id)) return { id: s.id, text: s.text };
    const prop = map.get(s.id);
    const ok = acceptCorrection(s.text, prop);
    if (ok === null) { if (typeof prop !== 'string' || cleanText(prop) !== cleanText(s.text)) rejected++; return { id: s.id, text: s.text }; }
    if (ok !== s.text) changed++;
    return { id: s.id, text: ok };
  });
  return { segments: out, changed, rejected };
}

function sanitizeVocab(v) {
  return Array.from(cleanText(typeof v === 'string' ? v : '')).slice(0, 300).join('').trim();
}

// Validiert den Request-Body. Gibt { lang, vocab, segments } oder { code, msg } zurück.
function parseInput(obj) {
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj.segments)) return { code: 400, msg: 'Ungültige Anfrage: segments fehlt.' };
  if (obj.segments.length > MAX_SEGMENTS) return { code: 413, msg: 'Zu viele Segmente (max. ' + MAX_SEGMENTS + ').' };
  const seen = new Set(), segs = []; let chars = 0;
  for (const s of obj.segments) {
    if (!s || typeof s !== 'object' || typeof s.id !== 'number' || !Number.isFinite(s.id) || seen.has(s.id) || typeof s.text !== 'string')
      return { code: 400, msg: 'Ungültige Anfrage: jedes Segment braucht eine eindeutige numerische id und text.' };
    seen.add(s.id); chars += s.text.length; segs.push({ id: s.id, text: s.text });
  }
  if (chars > MAX_CHARS) return { code: 413, msg: 'Transkript zu lang für die Korrektur (max. ' + MAX_CHARS + ' Zeichen).' };
  const lang = String(typeof obj.lang === 'string' ? obj.lang : '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 8);
  return { lang, vocab: sanitizeVocab(obj.vocab), segments: segs };
}

async function callGroq(key, model, messages, timeoutMs) {
  const body = { model, messages, temperature: 0, response_format: { type: 'json_object' } };
  if (/gpt-oss/.test(model)) body.reasoning_effort = 'low'; // reine Korrektur, kein langes Nachdenken nötig
  let r, text;
  try {
    r = await fetch(GROQ_URL, { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(Math.max(1000, timeoutMs)) });
    text = await r.text();
  } catch (e) { return { ok: false, status: 0, retry: true, err: e && e.name === 'TimeoutError' ? 'timeout' : 'network' }; }
  if (r.status === 429) guard.alertOps('groq-429-llm', 'Groq-Limit erreicht (KI-Feinschliff, HTTP 429). Captions kommen ohne Polish/Enhance.');
  if (r.status < 200 || r.status >= 300) {
    // 401/403 = Key-Problem → anderes Modell hilft nicht. Sonst (400 Modell/JSON-Fehler, 404, 413, 429, 5xx) → Fallback.
    return { ok: false, status: r.status, retry: r.status !== 401 && r.status !== 403, err: 'http' };
  }
  let data = null; try { data = JSON.parse(text); } catch (e) {}
  const ch = data && data.choices && data.choices[0];
  const map = ch && ch.message ? parseLlmJson(ch.message.content) : null;
  if (!map) return { ok: false, status: r.status, retry: true, err: 'unparseable' };
  return { ok: true, map };
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  const KEY = process.env.GROQ_API_KEY || '';
  if (req.method !== 'POST') return send(res, 200, { ok: true, service: 'capivo-polish', configured: !!KEY });
  if (!KEY) return send(res, 500, { error: 'Server nicht konfiguriert: GROQ_API_KEY fehlt (Vercel → Environment Variables).' });

  if (process.env.REQUIRE_LOGIN && process.env.REQUIRE_LOGIN !== '0') {
    const bad = await checkLogin(req);
    if (bad) return send(res, bad.code, { error: bad.msg });
  }

  const limit = parseInt(process.env.RATE_LIMIT_PER_HOUR || '120', 10);
  if (limit > 0) {
    const ip = String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'x').split(',')[0].trim();
    const now = Date.now(), list = (hits.get(ip) || []).filter(t => t > now - 3600000);
    if (list.length >= limit) return send(res, 429, { error: 'Zu viele Anfragen von dieser Adresse – bitte später erneut versuchen.' }, { 'Retry-After': '300' });
    list.push(now); hits.set(ip, list);
    if (hits.size > 5000) hits.clear();
  }

  let raw;
  try { raw = await readBody(req); }
  catch (e) { return send(res, e.tooLarge ? 413 : 400, { error: e.tooLarge ? 'Anfrage zu gross.' : 'Body konnte nicht gelesen werden.' }); }
  let obj = null;
  if (raw.length) { try { obj = JSON.parse(raw.toString('utf8')); } catch (e) { return send(res, 400, { error: 'Ungültiges JSON.' }); } }
  else if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) obj = req.body; // Vercel hat Body schon geparst
  const inp = parseInput(obj);
  if (inp.code) return send(res, inp.code, { error: inp.msg });

  // Nur Segmente mit Inhalt ans LLM; leere bleiben, wie sie sind.
  const todo = inp.segments.filter(s => s.text.trim() !== '').map(s => ({ id: s.id, text: cleanText(s.text) }));
  if (!todo.length) return send(res, 200, { segments: inp.segments, model: null, changed: 0, rejected: 0 });

  const messages = buildMessages(inp.lang, inp.vocab, todo);
  const deadline = Date.now() + BUDGET_MS;
  let last = null;
  for (let i = 0; i < MODELS.length; i++) {
    const left = deadline - Date.now();
    if (i > 0 && (left < MIN_FALLBACK_MS || !last.retry)) break;
    last = await callGroq(KEY, MODELS[i], messages, left);
    if (last.ok) {
      const out = applyCorrections(inp.segments, last.map);
      return send(res, 200, { segments: out.segments, model: MODELS[i], changed: out.changed, rejected: out.rejected });
    }
  }
  const msg = last.err === 'timeout' ? 'Korrektur-Dienst hat nicht rechtzeitig geantwortet.'
    : last.err === 'network' ? 'Korrektur-Dienst nicht erreichbar.'
    : last.err === 'unparseable' ? 'Korrektur-Dienst hat nicht-lesbar geantwortet.'
    : 'Korrektur-Dienst meldet Fehler (HTTP ' + last.status + ').';
  return send(res, 502, { error: msg, upstream: last.status || null });
}

module.exports = handler;
// Interne Helfer für test-polish.js (Vercel nutzt nur den Default-Export).
module.exports._test = { acceptCorrection, normWords, wordEditDistance, parseLlmJson, applyCorrections, parseInput, buildMessages, sanitizeVocab, MODELS, MAX_CHARS, SYSTEM_PROMPT };
