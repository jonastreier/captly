// Tests für die KI-Hervorhebung: api/enhance.js (Vercel) mit gemocktem fetch,
// plus – falls `php` installiert ist – Paritäts-Check der Prüf-Logik in enhance.php.
// Aufruf: node test-enhance.js   → "ENHANCE TESTS OK" oder Exit-Code 1.
const path = require('path');
const { Readable } = require('stream');
const { spawnSync } = require('child_process');

const handler = require(path.join(__dirname, 'api', 'enhance.js'));
const T = handler._test;
let fails = 0;
function ok(c, m) { if (c) console.log('  ok  ' + m); else { fails++; console.log('  FAIL ' + m); } }

async function run(method, body, env, headers) {
  Object.assign(process.env, { GROQ_API_KEY: '', RATE_LIMIT_PER_HOUR: '0', REQUIRE_LOGIN: '', SUPABASE_URL: '', SUPABASE_ANON_KEY: '' }, env || {});
  const raw = body == null ? null : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
  const req = Readable.from(raw ? [raw] : []);
  Object.assign(req, { method, url: '/api/enhance', headers: headers || {}, socket: { remoteAddress: '1.2.3.4' } });
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } };
  await handler(req, res);
  let json = null; try { json = JSON.parse(res.body); } catch (e) {}
  return Object.assign(res, { json });
}

let calls = [];
function mockGroq(plan) {
  calls = [];
  global.fetch = async (url, opts) => {
    const b = JSON.parse(opts.body);
    calls.push({ url, opts, body: b });
    const p = plan[b.model] || { status: 500, content: '' };
    const input = JSON.parse(b.messages[b.messages.length - 1].content);
    if (p.throw) { const e = new Error('x'); e.name = p.throw; throw e; }
    const content = typeof p.content === 'function' ? p.content(input) : p.content;
    const text = p.status >= 300 ? JSON.stringify({ error: { message: 'model error' } })
      : (p.rawBody != null ? p.rawBody : JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }] }));
    return { status: p.status, ok: p.status < 300, headers: { get: () => null }, text: async () => text };
  };
}

(async () => {
  const KEY = { GROQ_API_KEY: 'gsk_test' };
  const SEGS = [
    { id: 0, text: 'Hallo zäme, willkomme uf üsem Hof.', start: 0.2 },
    { id: 1, text: 'Hüt zeig ich euch üsi Highland Rinder', start: 1.6 },
    { id: 2, text: 'uf de Weid. Die sind', start: 3.0 },
    { id: 3, text: 'äh 365 Täg im Johr dusse', start: 4.1 },
    { id: 4, text: 'und frässed nur Gras und Heu.', start: 5.5 },
    { id: 5, text: 'Das merkt me am Fleisch.', start: 7.2 },
    { id: 6, text: 'Es isch zart und aromatisch.', start: 8.6 },
    { id: 7, text: 'Schribed eui Frage i d Kommentär!', start: 10.4 },
    { id: 8, text: '', start: 12.0 }
  ];

  console.log('Pure helpers');
  ok(T.EMOJI_LIST.every(e => T.graphemeCount(e) === 1) && T.EMOJI_LIST.length > 100, 'Emoji-Liste: nur einzelne Grapheme (' + T.EMOJI_LIST.length + ')');
  ok(T.normEmoji('🔥') === '🔥' && T.normEmoji(' ❤ ') === '❤️' && T.normEmoji('❤️') === '❤️', 'Emoji normalisiert (Variation Selector)');
  ok(T.normEmoji('🔥🔥') === null && T.normEmoji('👍🏽') === null && T.normEmoji('🇨🇭') === null && T.normEmoji('a') === null
     && T.normEmoji('👨‍🍳') === null && T.normEmoji(5) === null, 'mehrere Grapheme / Hautton / Flagge / ZWJ / Text → abgelehnt');
  ok(!T.kwEligible('die') && !T.kwEligible('äh,') && !T.kwEligible('Und') && !T.kwEligible('isch') && T.kwEligible('Rinder') && T.kwEligible('365') && !T.kwEligible('…'),
     'Stopp-/Füllwörter nie hervorgehoben, Zahlen/Nomen schon');
  const toks = T.tokens('Hüt zeig ich euch üsi Highland Rinder');
  ok(JSON.stringify(T.mapKeywords(['Highland', 'Rinder'], toks).kw) === '[5,6]', 'Keywords (Wörter) → Indizes');
  ok(JSON.stringify(T.mapKeywords(['rinder', 'Highland Rinder'], toks).kw) === '[5,6]', 'case-insensitiv, mehrteilige Angabe → Teilwort');
  const mk = T.mapKeywords([99, -1, 'ich', 'Kuh', 2.5, 'Rinder', 'zeig', 'Highland'], toks);
  ok(JSON.stringify(mk.kw) === '[1,6]' && mk.bad === 6, 'Index ausserhalb / Stoppwort / unbekannt / >2 → verworfen ' + JSON.stringify(mk));
  ok(JSON.stringify(T.mapKeywords([6, 6], toks).kw) === '[6]', 'doppelter Index nur einmal');
  const pj = T.parseSegAnswer(T.parseLlmJson('```json\n{"segments":[{"id":"2","kw":["Weid."]},{"id":2},{"kw":[]}]}\n```'));
  ok(pj && pj.size === 1 && pj.get(2).kw[0] === 'Weid.', 'parseLlmJson/parseSegAnswer: Codefence, id-String, Duplikate');
  ok(T.parseLlmJson('nope') === null && T.parseSegAnswer(T.parseLlmJson('{"foo":1}')) === null, 'unlesbar → null');
  ok(T.buildMessages('segments', {}).length === 4 && T.buildMessages('post', {}).length === 2 && /Swiss German/.test(T.SEG_PROMPT) && /never invent/i.test(T.POST_PROMPT),
     'Prompts: Segmente mit Few-Shot, Post ohne; Dialekt- und Fakten-Regel');

  // Quoten
  const allE = new Map(SEGS.map(s => [s.id, { kw: [], emoji: '🔥', zoom: true }]));
  const want = new Set(['keywords', 'emojis', 'zoom']);
  const q = T.applySegAnswer(SEGS, allE, want);
  const nE = q.segments.filter(s => s.emoji).length, nZ = q.segments.filter(s => s.zoom).length;
  ok(nE <= Math.floor(SEGS.length * 0.3) && nE >= 1, 'Emojis ≤ 30 % der Segmente: ' + nE + '/' + SEGS.length);
  ok(!q.segments.some((s, i) => s.emoji && q.segments[i - 1] && q.segments[i - 1].emoji), 'nie zwei Emojis hintereinander');
  const zt = q.segments.map((s, i) => s.zoom ? SEGS[i].start : null).filter(x => x !== null);
  ok(zt.every((t, i) => !i || t - zt[i - 1] >= 4) && nZ >= 2, 'Zooms ≥ 4 s Abstand (mit Timing): ' + zt);
  ok(q.segments[8].emoji === null && q.segments[8].zoom === false, 'leeres Segment bekommt nichts');
  const untimed = SEGS.map(s => ({ id: s.id, text: s.text }));
  const qu = T.applySegAnswer(untimed, allE, want).segments.filter(s => s.zoom).length;
  ok(qu <= Math.max(1, Math.floor(SEGS.length * 0.2)), 'ohne Timing: Zooms ≤ 20 % (' + qu + ')');
  const onlyKw = T.applySegAnswer(SEGS.slice(0, 2), new Map([[1, { kw: ['Rinder'], emoji: '🐄', zoom: true }]]), new Set(['keywords']));
  ok(onlyKw.segments[1].kw[0] === 6 && !('emoji' in onlyKw.segments[1]) && !('zoom' in onlyKw.segments[1]) && onlyKw.segments[0].kw.length === 0,
     'nur angefragte Felder, fehlende ids → leer');

  // Post
  const cp = T.cleanPost({ caption: 'So läbed üsi Rinder 🐄 #Hof #highland', hashtags: ['Highland Beef', '#Fricktal', '#fyp', '#hof', '#123', 'x', '#Weide', '#Bio', '#Schweiz', '#Rind'] }, 'Rinder ohne scharfes s');
  ok(cp.caption === 'So läbed üsi Rinder 🐄' && cp.hashtags.length === 6 && cp.hashtags[0] === '#HighlandBeef' && cp.hashtags.indexOf('#fyp') < 0
     && cp.hashtags.filter(h => h.toLowerCase() === '#hof').length === 1, 'Post: Hashtags aus dem Text verschoben, bereinigt, dedupliziert, max 6 ' + JSON.stringify(cp));
  ok(T.cleanPost({ caption: 'Ich weiß es.', hashtags: ['#Spaß'] }, 'weiss').caption === 'Ich weiss es.' && T.cleanPost({ caption: 'Ich weiß es.', hashtags: ['#Spaß'] }, 'weiss').hashtags[0] === '#Spass', 'Post: kein ß, wenn das Transkript keins hat');
  ok(T.cleanPost({ caption: '', hashtags: [] }, '') === null && T.cleanPost(null, '') === null, 'Post leer → null');
  ok(Array.from(T.cleanPost({ caption: 'wort '.repeat(100), hashtags: [] }, '').caption).length <= 300, 'Post-Text gekappt');

  console.log('Input');
  ok(T.parseInput({ segments: SEGS }).kind === 'segments' && T.parseInput({ segments: SEGS }).want.size === 3, 'Default want = keywords/emojis/zoom');
  ok(T.parseInput({ want: ['post', 'keywords'], text: 'x' }).code === 400, 'post + keywords kombiniert → 400');
  ok(T.parseInput({ want: ['post'], segments: [{ id: 0, text: 'a b' }] }).text === 'a b', 'post aus segments');
  ok(T.parseInput({ want: ['bogus'], segments: [] }).code === 400 && T.parseInput([]).code === 400, 'unbekanntes want / Array → 400');
  ok(T.parseInput({ segments: [{ id: 1, text: 'a', start: -1, end: 'x' }] }).segments[0].start === undefined, 'ungültige Zeiten ignoriert');

  console.log('Handler');
  ok((await run('GET')).json.service === 'capivo-enhance', 'GET Health-Check');
  ok((await run('POST', { segments: SEGS })).statusCode === 500, 'ohne Key → 500');
  ok((await run('POST', { segments: SEGS }, Object.assign({ REQUIRE_LOGIN: '1', SUPABASE_URL: 'https://x', SUPABASE_ANON_KEY: 'a' }, KEY))).statusCode === 401, 'REQUIRE_LOGIN ohne Token → 401');
  ok((await run('POST', 'nicht json', KEY)).statusCode === 400, 'ungültiges JSON → 400');
  ok((await run('POST', { segments: [{ id: 1, text: 'a' }, { id: 1, text: 'b' }] }, KEY)).statusCode === 400, 'doppelte id → 400');
  ok((await run('POST', { segments: [{ id: 0, text: 'wort '.repeat(2401) }] }, KEY)).statusCode === 413, 'Text > 12 000 → 413');
  ok((await run('POST', { want: ['post'], text: 'x'.repeat(12001) }, KEY)).statusCode === 413, 'Post-Text > 12 000 → 413');
  ok((await run('POST', { segments: [{ id: 0, text: 'x'.repeat(300 * 1024) }] }, KEY)).statusCode === 413, 'Body > 256 KB → 413');

  const ans = { segments: [
    { id: 0, kw: ['Hof.'], emoji: '👋', zoom: false },
    { id: 1, kw: ['Highland', 'Rinder', 'üsi'], emoji: '🐄', zoom: false },  // 3 kw → max 2; Emoji direkt nach Emoji → weg
    { id: 2, kw: ['Weid.'], emoji: '🐄🐄', zoom: false },                    // Doppel-Emoji → weg
    { id: 3, kw: ['365', 'äh'], emoji: null, zoom: true },                  // Füllwort → weg
    { id: 4, kw: [5, 99], emoji: '🌾', zoom: true },                         // Index 5 = Heu. ok, 99 weg; Zoom < 4 s nach 4.1 → weg
    { id: 5, kw: ['Fleisch.'], emoji: null, zoom: false },
    { id: 6, kw: ['zart'], emoji: '😋', zoom: false },
    { id: 7, kw: ['Frage'], emoji: '💬', zoom: true },
    { id: 42, kw: ['fremd'], emoji: '🔥', zoom: true }] };
  mockGroq({ 'openai/gpt-oss-120b': { status: 200, content: JSON.stringify(ans) } });
  const hp = await run('POST', { lang: 'de', segments: SEGS }, KEY);
  const S = hp.json && hp.json.segments;
  ok(hp.statusCode === 200 && hp.json.model === 'openai/gpt-oss-120b' && S.length === 9 && S.map(s => s.id).join() === '0,1,2,3,4,5,6,7,8', 'Happy path: alle ids, Reihenfolge, fremde id ignoriert');
  ok(JSON.stringify(S[1].kw) === '[5,6]' && JSON.stringify(S[3].kw) === '[1]' && JSON.stringify(S[4].kw) === '[5]', 'kw validiert ' + JSON.stringify(S.map(s => s.kw)));
  ok(S[0].emoji === '👋' && S[1].emoji === null && S[2].emoji === null && S.filter(s => s.emoji).length <= 2, 'Emojis: Quote, keine Nachbarn, kein Doppel-Emoji ' + JSON.stringify(S.map(s => s.emoji)));
  ok(S[3].zoom === true && S[4].zoom === false && S[7].zoom === true, 'Zoom-Abstand ≥ 4 s');
  ok(hp.json.dropped >= 6, 'dropped zählt verworfene Vorschläge: ' + hp.json.dropped);
  const c0 = calls[0], lastIn = JSON.parse(c0.body.messages[c0.body.messages.length - 1].content);
  ok(c0.body.response_format.type === 'json_object' && c0.body.temperature <= 0.3 && lastIn.segments.length === 8 && !('start' in lastIn.segments[0]) && lastIn.want.length === 3,
     'Groq: json_object, niedrige Temperatur, nur nicht-leere Segmente, keine Zeiten ans LLM');

  // Fallback + Fehler
  for (const st of [404, 429, 503]) {
    mockGroq({ 'openai/gpt-oss-120b': { status: st }, 'openai/gpt-oss-20b': { status: 200, content: JSON.stringify({ segments: [{ id: 1, kw: ['Rinder'] }] }) } });
    const fb = await run('POST', { segments: SEGS, want: ['keywords'] }, KEY);
    ok(fb.statusCode === 200 && fb.json.model === 'openai/gpt-oss-20b' && JSON.stringify(fb.json.segments[1].kw) === '[6]' && calls.length === 2, 'Fallback-Modell bei HTTP ' + st);
  }
  mockGroq({ 'openai/gpt-oss-120b': { status: 401 } });
  ok((await run('POST', { segments: SEGS }, KEY)).statusCode === 502 && calls.length === 1, '401 → kein Fallback, 502');
  mockGroq({ 'openai/gpt-oss-120b': { status: 200, content: 'Hier sind Keywords' }, 'openai/gpt-oss-20b': { status: 200, rawBody: '<html>' } });
  const both = await run('POST', { segments: SEGS }, KEY);
  ok(both.statusCode === 502 && /nicht-lesbar/.test(both.json.error), 'beide unlesbar → 502');
  mockGroq({ 'openai/gpt-oss-120b': { throw: 'TimeoutError' }, 'openai/gpt-oss-20b': { throw: 'TimeoutError' } });
  ok(/rechtzeitig/.test((await run('POST', { segments: SEGS }, KEY)).json.error), 'Timeout → 502');
  mockGroq({});
  const em = await run('POST', { segments: [{ id: 3, text: '  ' }] }, KEY);
  ok(em.statusCode === 200 && em.json.model === null && calls.length === 0 && em.json.segments[0].emoji === null, 'nur leere Segmente → kein Groq-Call');

  // Post
  mockGroq({ 'openai/gpt-oss-120b': { status: 200, content: JSON.stringify({ caption: 'Highland Rinder, die das ganze Jahr draussen sind 🐄', hashtags: ['#HighlandRinder', '#Weide', 'Hof', '#viral'] }) } });
  const po = await run('POST', { lang: 'de', want: ['post'], text: SEGS.map(s => s.text).join(' ') }, KEY);
  ok(po.statusCode === 200 && po.json.post.caption.indexOf('Highland') === 0 && po.json.post.hashtags.join(' ') === '#HighlandRinder #Weide #Hof', 'Post happy path ' + JSON.stringify(po.json));
  ok(calls[0].body.messages.length === 2 && calls[0].body.temperature <= 0.5, 'Post: ein Call, ohne Few-Shot');
  mockGroq({ 'openai/gpt-oss-120b': { status: 200, content: '{"caption":"","hashtags":[]}' }, 'openai/gpt-oss-20b': { status: 200, content: '{"caption":"Ok","hashtags":["#a1"]}' } });
  const pf = await run('POST', { want: ['post'], text: 'hallo' }, KEY);
  ok(pf.json.model === 'openai/gpt-oss-20b' && pf.json.post.caption === 'Ok', 'leerer Post → Fallback-Modell');
  ok((await run('POST', { want: ['post'], text: '   ' }, KEY)).statusCode === 400, 'leerer Post-Text → 400');

  mockGroq({ 'openai/gpt-oss-120b': { status: 200, content: '{"segments":[]}' } });
  const rl = []; for (let i = 0; i < 3; i++) rl.push((await run('POST', { segments: SEGS }, Object.assign({ RATE_LIMIT_PER_HOUR: '2' }, KEY))).statusCode);
  ok(rl[2] === 429, 'Rate-Limit greift: ' + rl);

  // PHP-Parität
  const hasPhp = spawnSync('php', ['-v']).status === 0;
  if (!hasPhp) console.log('  (php nicht gefunden – PHP-Paritäts-Check übersprungen)');
  else {
    console.log('PHP parity');
    const lint = spawnSync('php', ['-l', path.join(__dirname, 'enhance.php')], { encoding: 'utf8' });
    ok(lint.status === 0, 'php -l enhance.php');
    const posts = [
      [{ caption: 'So läbed üsi Rinder 🐄 #Hof #highland', hashtags: ['Highland Beef', '#Fricktal', '#fyp', '#hof', '#123', 'x', '#Weide', '#Bio', '#Schweiz', '#Rind'] }, 'x'],
      [{ caption: 'Ich weiß es.', hashtags: '#Spaß, #Hof' }, 'weiss'], [{ caption: '', hashtags: [] }, ''], [{ caption: 'wort '.repeat(80) }, '']
    ];
    const kws = [[['Highland', 'Rinder'], toks], [['rinder', 'Highland Rinder'], toks], [[99, -1, 'ich', 'Kuh', 'Rinder', 'zeig', 'Highland'], toks], [[6, 6], toks]];
    const segAns = { segments: ans.segments };
    const input = { posts, kws, emojis: ['🔥', ' ❤ ', '🔥🔥', '👍🏽', '🇨🇭', 'a', '👨‍🍳', '✈'], segs: SEGS, untimed, ans: JSON.stringify(segAns),
      allE: SEGS.map(s => ({ id: s.id, kw: [], emoji: '🔥', zoom: true })),
      inputs: [{ segments: SEGS }, { want: ['post', 'keywords'], text: 'x' }, { want: ['post'], segments: [{ id: 0, text: 'a b' }] }, { want: ['bogus'], segments: [] }] };
    const code = 'define("CAPIVO_ENHANCE_LIB", 1); include ' + JSON.stringify(path.join(__dirname, 'enhance.php')) + ';' +
      '$c = json_decode(stream_get_contents(STDIN), true); $o = [];' +
      '$o["emojiList"] = preg_split("/\\s+/u", ENH_EMOJI_LIST, -1, PREG_SPLIT_NO_EMPTY); $o["stop"] = preg_split("/\\s+/u", ENH_STOP, -1, PREG_SPLIT_NO_EMPTY);' +
      '$o["posts"] = array_map(function($p){ return enh_clean_post($p[0], $p[1]); }, $c["posts"]);' +
      '$o["kws"] = array_map(function($k){ return enh_map_keywords($k[0], $k[1]); }, $c["kws"]);' +
      '$o["emojis"] = array_map("enh_norm_emoji", $c["emojis"]);' +
      '$w = ["keywords"=>true,"emojis"=>true,"zoom"=>true]; $m = enh_parse_seg(enh_parse_llm($c["ans"]));' +
      '$o["seg"] = enh_apply_seg($c["segs"], $m, $w);' +
      '$all = []; foreach ($c["allE"] as $x) $all[(string)$x["id"]] = $x;' +
      '$o["allT"] = enh_apply_seg($c["segs"], $all, $w); $o["allU"] = enh_apply_seg($c["untimed"], $all, $w);' +
      '$o["inputs"] = array_map(function($i){ $r = enh_parse_input($i); return isset($r["code"]) ? $r["code"] : $r["kind"] . ":" . ($r["text"] ?? count($r["segments"])); }, $c["inputs"]);' +
      'echo json_encode($o, JSON_UNESCAPED_UNICODE);';
    const pr = spawnSync('php', ['-r', code], { input: JSON.stringify(input), encoding: 'utf8' });
    let P = null; try { P = JSON.parse(pr.stdout); } catch (e) {}
    ok(!!P, 'PHP-Lib lädt ohne Request-Bearbeitung ' + (P ? '' : (pr.stderr || pr.stdout).slice(0, 300)));
    if (P) {
      const src = require('fs').readFileSync(path.join(__dirname, 'api', 'enhance.js'), 'utf8');
      const stopJs = (/const STOP = new Set\(\(([\s\S]*?)\)\.split/.exec(src)[1]).replace(/'\s*\+\s*'/g, '').replace(/'/g, '').split(/\s+/).filter(Boolean);
      ok(JSON.stringify(P.emojiList) === JSON.stringify(T.EMOJI_LIST), 'Emoji-Liste identisch');
      ok(JSON.stringify(P.stop) === JSON.stringify(stopJs), 'Stoppwort-Liste identisch');
      posts.forEach((p, i) => ok(JSON.stringify(P.posts[i]) === JSON.stringify(T.cleanPost(p[0], p[1])), 'PHP == JS cleanPost #' + i + ' ' + JSON.stringify(P.posts[i]).slice(0, 60)));
      kws.forEach((k, i) => ok(JSON.stringify(P.kws[i]) === JSON.stringify(T.mapKeywords(k[0], k[1])), 'PHP == JS mapKeywords #' + i));
      ok(JSON.stringify(P.emojis) === JSON.stringify(input.emojis.map(T.normEmoji)), 'PHP == JS normEmoji ' + JSON.stringify(P.emojis));
      const jsSeg = T.applySegAnswer(SEGS, T.parseSegAnswer(T.parseLlmJson(input.ans)), new Set(['keywords', 'emojis', 'zoom']));
      ok(JSON.stringify(P.seg) === JSON.stringify(jsSeg), 'PHP == JS applySeg (Antwort)');
      ok(JSON.stringify(P.allT) === JSON.stringify(q) && JSON.stringify(P.allU) === JSON.stringify(T.applySegAnswer(untimed, allE, want)), 'PHP == JS Quoten (mit/ohne Timing)');
      ok(JSON.stringify(P.inputs) === JSON.stringify(['segments:9', 400, 'post:a b', 400]), 'PHP parseInput ' + JSON.stringify(P.inputs));
    }
  }

  if (fails) { console.log(fails + ' FEHLER'); process.exit(1); }
  console.log('ENHANCE TESTS OK');
})().catch(e => { console.error(e); process.exit(1); });
