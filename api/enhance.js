// CaptionRush – KI-Hervorhebung („Enhance“) als Vercel Serverless Function (Groq Chat Completions).
// Gegenstück für klassisches PHP-Webhosting: enhance.php (gleiche Schnittstelle, gleiche Regeln).
//
// Zweck (wie die Captions-App): Ein LLM WÄHLT nur aus — es schreibt nie Text um.
//   • keywords: 0–2 bedeutungstragende Wörter je Caption (Nomen, Namen, Zahlen, starke Verben) → Hervorhebung
//   • emojis:   ein passendes Emoji auf ~20–30 % der Captions (nur wo es klar passt)
//   • zoom:     sparsame „Punch-in“-Momente (max. einer pro ~4 s)
//   • post:     kurzer Post-Text (Hook) + 3–6 Hashtags aus dem Transkript, in dessen Sprache, ohne erfundene Fakten
// Jede LLM-Antwort wird serverseitig geprüft (ids, Wort-Indizes, Emoji aus fester Liste, Quoten) — was
// nicht passt, wird verworfen. Transkripttext wird nie geloggt.
//
// ── Vertrag ──────────────────────────────────────────────────────────────────────────────
// POST /api/enhance   Content-Type: application/json   (optional Header X-Capivo-Token bei REQUIRE_LOGIN)
//   a) { "lang": "de", "want": ["keywords","emojis","zoom"],             // Teilmenge, Default: alle drei
//        "segments": [ { "id": 0, "text": "...", "start": 1.2, "end": 2.0 }, ... ] }  // start/end optional (s)
//   b) { "lang": "de", "want": ["post"], "text": "ganzes Transkript" }   // oder segments → Text daraus
//   post lässt sich nicht mit keywords/emojis/zoom kombinieren (ein Groq-Aufruf je Anfrage) → 400.
//   Grenzen: Text ≤ 12 000 Zeichen, ≤ 1000 Segmente → sonst 413; Body ≤ 256 KB.
// 200 a) → { "segments": [ { "id", "kw": [i, …], "emoji": "🔥"|null, "zoom": bool } … ],  // gleiche ids/Reihenfolge,
//            "model": "…"|null, "dropped": n }                // nur angefragte Felder; kw = Wort-Indizes (Leerzeichen-Split)
// 200 b) → { "post": { "caption": "…", "hashtags": ["#…", …] }, "model": "…" }
// Fehler → { "error": "..." } mit 400, 401 login_required, 413, 429 (Retry-After), 500 („Server nicht
//   konfiguriert: …“), 502 (Groq fehlgeschlagen/unlesbar/Timeout). Das Frontend fällt dann still auf eine
//   lokale Heuristik zurück (nur Keywords).
// GET /api/enhance → { ok: true, service: "capivo-enhance", configured: bool }
//
// Groq: "openai/gpt-oss-120b", Fallback "openai/gpt-oss-20b" (wie api/polish.js), response_format json_object,
// temperature 0.2 (post 0.4), Gesamtbudget ~20 s (vercel.json maxDuration 30).
// Env: GROQ_API_KEY (Pflicht), RATE_LIMIT_PER_HOUR (Default 120/IP, eigener Zähler), REQUIRE_LOGIN + SUPABASE_*.

const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_BYTES = 256 * 1024;
const MAX_CHARS = 12000;
const MAX_SEGMENTS = 1000;
const BUDGET_MS = 20000;
const MIN_FALLBACK_MS = 4000;
const KW_MAX = 2;            // Hervorhebungen je Caption
const EMOJI_SHARE = 0.3;     // max. Anteil Captions mit Emoji
const ZOOM_GAP_S = 4;        // min. Abstand zweier Zooms (mit Timing)
const ZOOM_SHARE = 0.2;      // ohne Timing: max. Anteil
const CAPTION_MAX = 300;     // Post-Text (Zeichen)
const TAGS_MIN = 3, TAGS_MAX = 6;
const WANT_SEG = ['keywords', 'emojis', 'zoom'];

// Erlaubte Emojis (kanonische Schreibweise). Vergleich ohne Variation Selector (U+FE0F/FE0E).
// Bewusst ohne Flaggen, Hauttöne, ZWJ-Sequenzen und Symbole mit Doppeldeutung.
const EMOJI_LIST = ('🔥 💯 😂 🤣 😍 🥰 😎 🤔 😮 😱 🙌 👏 👍 👀 💪 🎉 ✨ ⭐ 🌟 ❤️ 💚 💙 💛 🧡 💜 🤍 💡 📈 📉 💰 💸 🚀 ⚡ 🎯 ✅ ❌ ⚠️ 🤯 😅 😊 🙂 😉 😭 🥲 🤝 🙏 👋 ' +
  '☀️ 🌧️ ❄️ 🌱 🌿 🍀 🌳 🌲 🌾 🌻 🌸 🍂 🐄 🐮 🐂 🐑 🐐 🐖 🐷 🐔 🐓 🐴 🐶 🐱 🐝 🦋 🐟 🐦 🦌 🍔 🍕 🥩 🍖 🥗 🍎 🍓 🥕 🧀 🍞 🥚 🥛 ☕ 🍷 🍺 🍽️ ' +
  '🎵 🎶 🎬 📸 📱 💻 ⏰ ⏳ 📅 🏆 🥇 🎁 🛒 🏠 🏡 🚜 🚗 ✈️ 🌍 🗺️ ⛰️ 🏔️ 🌊 🏖️ 🎓 📚 ✏️ 💬 🗣️ 👉 👆 🤷 🤦 😴 🥳 😋 🤤 😬 🙈 🧠 ❓ ❗ 💥 🌈 🌙 ' +
  '🔑 🔧 🛠️ 📦 💼 🏃 🧘 ⚽ 🎾 🚴 🏋️ 🎨 🎤 🎧 🍿 🧁 🎂 🍫 🍦 🌶️ 🥑 🍋 🍇 🍉 🌽 🥔 🧄 🍯 💧 🔋 🌡️ 💎 👑 🎈 🔔 📣 🆕 🆓 ⬇️ ⬆️ ➡️ 🔝 👌 ✌️ 🤞')
  .split(' ').filter(Boolean);
const vsKey = e => String(e).replace(/[︎️]/g, '');
const EMOJI_BY_KEY = new Map(EMOJI_LIST.map(e => [vsKey(e), e]));

// Wörter, die nie hervorgehoben werden (Artikel, Pronomen, Präpositionen, Konjunktionen, Hilfsverben, Füllwörter;
// de/ch, en, fr, it, es) — normalisiert (klein, ohne Satzzeichen).
const STOP = new Set(('der die das den dem des ein eine einen einem einer eines und oder aber doch denn weil dass wenn als wie ' +
  'ich du er sie es wir ihr mich dich sich uns euch mir dir ihm ihn ihnen mein dein sein unser euer meine deine seine unsere ' +
  'ist sind war waren bin bist seid hat haben habe hast hatte wird werden wurde kann können muss müssen soll will ' +
  'in im ins an am auf aus bei mit nach von vom zu zum zur für über unter vor hinter neben zwischen durch gegen ohne um ' +
  'nicht auch noch schon nur so da dann hier dort ja nein mal eben halt also quasi gell gäll eh äh ähm öhm hm hmm ' +
  'de d dr s es isch si mer mir üs eus em am im is i u o oder ond und gsi ha hät het hend ' +
  'the a an and or but if as of to in on at by for with from into onto is are was were be been am do does did ' +
  'i you he she it we they me him her us them my your his its our their this that these those so um uh uhm like just really ' +
  'le la les un une des du et ou mais je tu il elle nous vous ils elles est sont à au aux en dans sur pour par avec ' +
  'il lo la gli le un una e o ma io tu lui lei noi voi loro è sono di da in su per con tra fra ' +
  'el la los las un una y o pero yo tú él ella nosotros es son de en con por para').split(/\s+/).filter(Boolean));

const hits = new Map();
const tokOk = new Map();

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
  if ((tokOk.get(tok) || 0) > Date.now()) return null;
  try {
    const r = await fetch(base + '/auth/v1/user', { headers: { apikey: key, Authorization: 'Bearer ' + tok } });
    const u = r.ok ? await r.json() : null;
    if (!u || !u.id) return { code: 401, msg: 'login_required' };
  } catch (e) { return { code: 502, msg: 'Login-Prüfung nicht erreichbar.' }; }
  tokOk.set(tok, Date.now() + 300000);
  return null;
}

// ── Prompts ───────────────────────────────────────────────────────────────────────────────
const SEG_PROMPT = [
  'You add visual emphasis to the subtitles of a short social video (Reels/TikTok). You only SELECT — you never rewrite, correct, translate or reorder any text.',
  'Input: JSON {"lang": ISO code, "want": list of tasks, "segments": [{"id", "text"}]} — consecutive captions of one video.',
  'Output: ONLY a JSON object {"segments":[{"id":<same id>,"kw":["<word>"],"emoji":"<emoji>"|null,"zoom":true|false}]} with every input id exactly once.',
  '',
  'kw (task "keywords"): 0 to 2 words copied EXACTLY as they appear in that segment\'s text (same spelling and case, including dialect / Swiss German) that carry the meaning: nouns, names, numbers, strong verbs or adjectives.',
  '  Never articles, pronouns, prepositions, conjunctions, auxiliary verbs or filler words (äh, ähm, also, halt, gell, um, uh, like, so). Many segments need only one keyword; empty list if nothing stands out.',
  'emoji (task "emojis"): exactly ONE common emoji, only where it clearly matches something said in that segment (an object, animal, food, place, feeling or action). Use it on about 1 in 4 segments, never on two consecutive segments; otherwise null. No flags, no text, no emoji sequences.',
  'zoom (task "zoom"): true only for the strongest moments — the key claim, a punchline, a surprising number. Roughly one in 5 to 8 segments, never two in a row; otherwise false.',
  'Fields for tasks that are not in "want" may be omitted. Keep everything else as it is — do not add fields.'
].join('\n');

const SEG_FEW_SHOT = [{
  input: { lang: 'de', want: ['keywords', 'emojis', 'zoom'], segments: [
    { id: 0, text: 'Hallo zäme, willkomme uf üsem Hof.' },
    { id: 1, text: 'Hüt zeig ich euch üsi Highland Rinder' },
    { id: 2, text: 'uf de Weid. Die sind' },
    { id: 3, text: 'äh 365 Täg im Johr dusse' },
    { id: 4, text: 'und frässed nur Gras und Heu.' }] },
  output: { segments: [
    { id: 0, kw: ['Hof.'], emoji: '👋', zoom: false },
    { id: 1, kw: ['Highland', 'Rinder'], emoji: null, zoom: false },
    { id: 2, kw: ['Weid.'], emoji: '🐄', zoom: false },
    { id: 3, kw: ['365'], emoji: null, zoom: true },
    { id: 4, kw: ['Gras', 'Heu.'], emoji: '🌾', zoom: false }] }
}];

const POST_PROMPT = [
  'You write the post text for a short social video (Instagram Reels / TikTok) from its transcript.',
  'Input: JSON {"lang": ISO code, "text": transcript}. Output: ONLY a JSON object {"caption":"...","hashtags":["#...", ...]}.',
  'caption: in the language of the transcript (a Swiss German transcript gets Swiss Standard German: "ss", never "ß"). A short hook plus at most one more sentence, max. 180 characters, at most 2 emojis, no hashtags inside.',
  'Use ONLY facts that are in the transcript. Never invent names, places, prices, dates, numbers, offers or claims. If unsure, stay general.',
  'hashtags: 3 to 6 relevant hashtags (topic, product, place or name only if mentioned), each starting with #, no spaces, no generic spam like #fyp #viral #foryou.'
].join('\n');

function buildMessages(kind, payload) {
  if (kind === 'post') {
    return [{ role: 'system', content: POST_PROMPT }, { role: 'user', content: JSON.stringify(payload) }];
  }
  const m = [{ role: 'system', content: SEG_PROMPT }];
  for (const ex of SEG_FEW_SHOT) {
    m.push({ role: 'user', content: JSON.stringify(ex.input) });
    m.push({ role: 'assistant', content: JSON.stringify(ex.output) });
  }
  m.push({ role: 'user', content: JSON.stringify(payload) });
  return m;
}

// ── Hilfen ──────────────────────────────────────────────────────────────────────────────────
function cleanText(s) {
  return String(s).replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokens(text) { const t = cleanText(text); return t ? t.split(' ') : []; }
function normWord(w) { return String(w).toLowerCase().replace(/ß/g, 'ss').replace(/[^\p{L}\p{N}]+/gu, ''); }
// Darf dieses Wort hervorgehoben werden? Mind. 2 Buchstaben (oder eine Zahl), kein Stoppwort/Füllwort.
function kwEligible(tok) {
  const n = normWord(tok);
  if (!n) return false;
  if (/\p{N}/u.test(n)) return true;
  return n.length >= 2 && !STOP.has(n);
}
// Ein einzelnes Emoji aus der erlaubten Liste (kanonische Form) oder null.
function normEmoji(e) {
  if (typeof e !== 'string') return null;
  const k = vsKey(e.trim());
  return EMOJI_BY_KEY.get(k) || null;
}
function graphemeCount(s) {
  try { return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)).length; }
  catch (e) { return Array.from(s).length; }
}

// LLM-Antwort → Objekt oder null.
function parseLlmJson(content) {
  if (typeof content !== 'string') return null;
  const s = content.trim();
  let obj = null;
  try { obj = JSON.parse(s); } catch (e) {
    const i = s.indexOf('{'), j = s.lastIndexOf('}');
    if (i < 0 || j <= i) return null;
    try { obj = JSON.parse(s.slice(i, j + 1)); } catch (e2) { return null; }
  }
  return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : null;
}
// Segment-Antwort → Map id → Rohobjekt, oder null wenn unbrauchbar.
function parseSegAnswer(obj) {
  const arr = obj && Array.isArray(obj.segments) ? obj.segments : null;
  if (!arr) return null;
  const out = new Map();
  for (const x of arr) {
    if (!x || typeof x !== 'object') continue;
    const id = typeof x.id === 'string' && x.id.trim() !== '' ? Number(x.id) : x.id;
    if (typeof id !== 'number' || !Number.isFinite(id) || out.has(id)) continue;
    out.set(id, x);
  }
  return out;
}

// Keyword-Angaben (Wörter oder Indizes) → sortierte, gültige Wort-Indizes (max. KW_MAX).
function mapKeywords(raw, toks) {
  const list = Array.isArray(raw) ? raw : (raw == null ? [] : [raw]);
  const used = new Set(), out = [];
  let bad = 0;
  for (const k of list) {
    if (out.length >= KW_MAX) { bad++; continue; }
    let idx = -1;
    if (typeof k === 'number' && Number.isInteger(k)) idx = k;
    else if (typeof k === 'string' && k.trim()) {
      const want = normWord(k);
      // mehrteilige Angabe ("Highland Rinder") → erstes passendes Teilwort zählt
      const parts = cleanText(k).split(' ').map(normWord).filter(Boolean);
      for (let i = 0; i < toks.length && idx < 0; i++) if (!used.has(i) && want && normWord(toks[i]) === want) idx = i;
      for (let p = 0; p < parts.length && idx < 0 && parts.length > 1; p++)
        for (let i = 0; i < toks.length && idx < 0; i++) if (!used.has(i) && normWord(toks[i]) === parts[p]) idx = i;
    }
    if (idx < 0 || idx >= toks.length || used.has(idx) || !kwEligible(toks[idx])) { bad++; continue; }
    used.add(idx); out.push(idx);
  }
  return { kw: out.sort((a, b) => a - b), bad };
}

// Validiert die LLM-Vorschläge für alle Segmente; erzwingt Quoten. segs: [{id,text,start?}], want: Set.
function applySegAnswer(segs, map, want) {
  let dropped = 0;
  const out = segs.map(s => {
    const raw = map.get(s.id) || {};
    const o = { id: s.id };
    if (want.has('keywords')) {
      const r = mapKeywords(raw.kw !== undefined ? raw.kw : raw.keywords, tokens(s.text));
      o.kw = r.kw; dropped += r.bad;
    }
    if (want.has('emojis')) {
      const e = raw.emoji == null || raw.emoji === '' ? null : normEmoji(raw.emoji);
      if (raw.emoji != null && raw.emoji !== '' && !e) dropped++;
      o.emoji = s.text.trim() ? e : null;
    }
    if (want.has('zoom')) o.zoom = raw.zoom === true && !!s.text.trim();
    return o;
  });
  const n = segs.length;
  if (want.has('emojis')) {
    const maxE = n ? Math.max(1, Math.floor(n * EMOJI_SHARE)) : 0;
    let cnt = 0, prev = false;
    out.forEach(o => {
      if (!o.emoji) { prev = false; return; }
      if (prev || cnt >= maxE) { o.emoji = null; dropped++; prev = false; return; }
      cnt++; prev = true;
    });
  }
  if (want.has('zoom')) {
    const timed = segs.every(s => typeof s.start === 'number');
    const maxZ = timed ? Infinity : Math.max(1, Math.floor(n * ZOOM_SHARE));
    let cnt = 0, lastT = -Infinity, prevIdx = -2;
    out.forEach((o, i) => {
      if (!o.zoom) return;
      const t = timed ? segs[i].start : i;
      const okGap = timed ? t - lastT >= ZOOM_GAP_S : i - prevIdx > 1;
      if (!okGap || cnt >= maxZ) { o.zoom = false; dropped++; return; }
      cnt++; lastT = t; prevIdx = i;
    });
  }
  return { segments: out, dropped };
}

// Post-Antwort → { caption, hashtags } oder null.
function cleanPost(obj, srcText) {
  if (!obj || typeof obj !== 'object') return null;
  let cap = typeof obj.caption === 'string' ? cleanText(obj.caption) : '';
  let rawTags = obj.hashtags;
  if (typeof rawTags === 'string') rawTags = rawTags.split(/[\s,]+/);
  if (!Array.isArray(rawTags)) rawTags = [];
  // Hashtags im Text → in die Liste verschieben
  const inCap = cap.match(/#[\p{L}\p{N}_]+/gu) || [];
  cap = cleanText(cap.replace(/#[\p{L}\p{N}_]+/gu, ' ')).replace(/\s+([.,!?…])/g, '$1');
  if (!/[ßẞ]/.test(srcText || '')) cap = cap.replace(/ẞ/g, 'SS').replace(/ß/g, 'ss');
  const chars = Array.from(cap);
  if (chars.length > CAPTION_MAX) cap = chars.slice(0, CAPTION_MAX - 1).join('').replace(/\s+\S*$/, '') + '…';
  const seen = new Set(), tags = [];
  for (const t of rawTags.concat(inCap)) {
    if (typeof t !== 'string') continue;
    let h = t.trim().replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '');
    if (!/[ßẞ]/.test(srcText || '')) h = h.replace(/ß/g, 'ss');
    if (h.length < 2 || h.length > 40 || /^\d+$/.test(h)) continue;
    const k = h.toLowerCase();
    if (seen.has(k) || ['fyp', 'foryou', 'foryoupage', 'viral', 'fy', 'fypシ'].indexOf(k) >= 0) continue;
    seen.add(k); tags.push('#' + h);
    if (tags.length >= TAGS_MAX) break;
  }
  if (!cap && !tags.length) return null;
  return { caption: cap, hashtags: tags };
}

// Validiert den Request-Body. → { kind, lang, want:Set, segments?, text? } oder { code, msg }.
function parseInput(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { code: 400, msg: 'Ungültige Anfrage.' };
  const lang = String(typeof obj.lang === 'string' ? obj.lang : '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 8);
  let want = Array.isArray(obj.want) ? obj.want.filter(w => typeof w === 'string') : [];
  want = Array.from(new Set(want.filter(w => w === 'post' || WANT_SEG.indexOf(w) >= 0)));
  if (Array.isArray(obj.want) && obj.want.length && !want.length) return { code: 400, msg: 'Ungültige Anfrage: want unbekannt.' };
  const isPost = want.indexOf('post') >= 0;
  if (isPost && want.length > 1) return { code: 400, msg: 'Ungültige Anfrage: post lässt sich nicht mit keywords/emojis/zoom kombinieren.' };
  let segs = null;
  if (obj.segments !== undefined) {
    if (!Array.isArray(obj.segments)) return { code: 400, msg: 'Ungültige Anfrage: segments muss eine Liste sein.' };
    if (obj.segments.length > MAX_SEGMENTS) return { code: 413, msg: 'Zu viele Segmente (max. ' + MAX_SEGMENTS + ').' };
    const seen = new Set(); segs = []; let chars = 0;
    for (const s of obj.segments) {
      if (!s || typeof s !== 'object' || typeof s.id !== 'number' || !Number.isFinite(s.id) || seen.has(s.id) || typeof s.text !== 'string')
        return { code: 400, msg: 'Ungültige Anfrage: jedes Segment braucht eine eindeutige numerische id und text.' };
      seen.add(s.id); chars += s.text.length;
      const seg = { id: s.id, text: s.text };
      if (typeof s.start === 'number' && Number.isFinite(s.start) && s.start >= 0) seg.start = s.start;
      if (typeof s.end === 'number' && Number.isFinite(s.end) && s.end >= 0) seg.end = s.end;
      segs.push(seg);
    }
    if (chars > MAX_CHARS) return { code: 413, msg: 'Transkript zu lang (max. ' + MAX_CHARS + ' Zeichen).' };
  }
  if (isPost) {
    let text = typeof obj.text === 'string' ? obj.text : (segs ? segs.map(s => s.text).join(' ') : null);
    if (typeof text !== 'string') return { code: 400, msg: 'Ungültige Anfrage: text fehlt.' };
    if (text.length > MAX_CHARS) return { code: 413, msg: 'Transkript zu lang (max. ' + MAX_CHARS + ' Zeichen).' };
    return { kind: 'post', lang, want: new Set(want), text: cleanText(text) };
  }
  if (!segs) return { code: 400, msg: 'Ungültige Anfrage: segments fehlt.' };
  return { kind: 'segments', lang, want: new Set(want.length ? want : WANT_SEG), segments: segs };
}

async function callGroq(key, model, messages, timeoutMs, temperature, check) {
  const body = { model, messages, temperature, response_format: { type: 'json_object' } };
  if (/gpt-oss/.test(model)) body.reasoning_effort = 'low';
  let r, text;
  try {
    r = await fetch(GROQ_URL, { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(Math.max(1000, timeoutMs)) });
    text = await r.text();
  } catch (e) { return { ok: false, status: 0, retry: true, err: e && e.name === 'TimeoutError' ? 'timeout' : 'network' }; }
  if (r.status < 200 || r.status >= 300) return { ok: false, status: r.status, retry: r.status !== 401 && r.status !== 403, err: 'http' };
  let data = null; try { data = JSON.parse(text); } catch (e) {}
  const ch = data && data.choices && data.choices[0];
  const val = check(ch && ch.message ? parseLlmJson(ch.message.content) : null);
  if (!val) return { ok: false, status: r.status, retry: true, err: 'unparseable' };
  return { ok: true, val };
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  const KEY = process.env.GROQ_API_KEY || '';
  if (req.method !== 'POST') return send(res, 200, { ok: true, service: 'capivo-enhance', configured: !!KEY });
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
  else if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) obj = req.body;
  const inp = parseInput(obj);
  if (inp.code) return send(res, inp.code, { error: inp.msg });

  let messages, temperature, check;
  if (inp.kind === 'post') {
    if (!inp.text) return send(res, 400, { error: 'Ungültige Anfrage: text ist leer.' });
    messages = buildMessages('post', { lang: inp.lang, text: inp.text });
    temperature = 0.4;
    check = o => cleanPost(o, inp.text);
  } else {
    const todo = inp.segments.filter(s => s.text.trim() !== '').map(s => ({ id: s.id, text: cleanText(s.text) }));
    if (!todo.length) return send(res, 200, applySegResult(inp, new Map(), null));
    messages = buildMessages('segments', { lang: inp.lang, want: Array.from(inp.want), segments: todo });
    temperature = 0.2;
    check = o => parseSegAnswer(o);
  }
  const deadline = Date.now() + BUDGET_MS;
  let last = null;
  for (let i = 0; i < MODELS.length; i++) {
    const left = deadline - Date.now();
    if (i > 0 && (left < MIN_FALLBACK_MS || !last.retry)) break;
    last = await callGroq(KEY, MODELS[i], messages, left, temperature, check);
    if (last.ok) {
      if (inp.kind === 'post') return send(res, 200, { post: last.val, model: MODELS[i] });
      return send(res, 200, applySegResult(inp, last.val, MODELS[i]));
    }
  }
  const msg = last.err === 'timeout' ? 'KI-Dienst hat nicht rechtzeitig geantwortet.'
    : last.err === 'network' ? 'KI-Dienst nicht erreichbar.'
    : last.err === 'unparseable' ? 'KI-Dienst hat nicht-lesbar geantwortet.'
    : 'KI-Dienst meldet Fehler (HTTP ' + last.status + ').';
  return send(res, 502, { error: msg, upstream: last.status || null });
}
function applySegResult(inp, map, model) {
  const r = applySegAnswer(inp.segments, map, inp.want);
  return { segments: r.segments, model, dropped: r.dropped };
}

module.exports = handler;
// Interne Helfer für test-enhance.js (Vercel nutzt nur den Default-Export).
module.exports._test = { parseInput, parseLlmJson, parseSegAnswer, applySegAnswer, mapKeywords, kwEligible, normEmoji, graphemeCount,
  cleanPost, buildMessages, tokens, normWord, EMOJI_LIST, MODELS, MAX_CHARS, SEG_PROMPT, POST_PROMPT };
