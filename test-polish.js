// Tests für den Transkript-Feinschliff: api/polish.js (Vercel) mit gemocktem fetch,
// plus – falls `php` installiert ist – Paritäts-Check der Prüf-Logik in polish.php.
// Aufruf: node test-polish.js   → "POLISH TESTS OK" oder Exit-Code 1.
const path = require('path');
const { Readable } = require('stream');
const { spawnSync } = require('child_process');

const handler = require(path.join(__dirname, 'api', 'polish.js'));
const T = handler._test;
let fails = 0;
function ok(c, m) { if (c) console.log('  ok  ' + m); else { fails++; console.log('  FAIL ' + m); } }

async function run(method, body, env, headers) {
  Object.assign(process.env, { GROQ_API_KEY: '', RATE_LIMIT_PER_HOUR: '0', REQUIRE_LOGIN: '', SUPABASE_URL: '', SUPABASE_ANON_KEY: '' }, env || {});
  const raw = body == null ? null : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
  const req = Readable.from(raw ? [raw] : []);
  Object.assign(req, { method, url: '/api/polish', headers: headers || {}, socket: { remoteAddress: '1.2.3.4' } });
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } };
  await handler(req, res);
  let json = null; try { json = JSON.parse(res.body); } catch (e) {}
  return Object.assign(res, { json });
}

// Groq-Mock: antwortet pro Modell gemäss `plan[model]` = { status, content } | Funktion(segments) → content
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
const answer = map => input => JSON.stringify({ segments: input.segments.map(s => ({ id: s.id, text: map[s.id] != null ? map[s.id] : s.text })) });

(async () => {
  const KEY = { GROQ_API_KEY: 'gsk_test' };
  const SEGS = [
    { id: 0, text: 'äh willkommen auf dem birkehof' },
    { id: 1, text: 'bei uns gibts highland biff aus dem fricktal' },
    { id: 2, text: 'die rinder sind das ganze jahr draussen und fressen gras' },
    { id: 3, text: '' }
  ];

  console.log('Pure helpers');
  ok(T.wordEditDistance(['a', 'b', 'c'], ['a', 'x', 'c']) === 1 && T.wordEditDistance([], ['a', 'b']) === 2, 'Wort-Editierdistanz');
  ok(JSON.stringify(T.normWords('Gibt\'s Straße, „Highland-Beef“!')) === '["gibts","strasse","highlandbeef"]', 'normWords: klein, ß→ss, Satzzeichen weg');
  ok(T.acceptCorrection('birkehof', 'Birkenhof.') === 'Birkenhof.', 'einzelnes Vokabular-Wort darf korrigiert werden');
  ok(T.acceptCorrection('üsi highland rinder', 'Üsi Highland\u2011Rinder.') === 'Üsi Highland Rinder.', 'neu eingefuegter (Unicode-)Bindestrich wird wieder Leerzeichen');
  ok(T.acceptCorrection('e-mail adresse', 'E-Mail Adresse.') === 'E-Mail Adresse.', 'vorhandene Bindestriche bleiben');
  ok(T.acceptCorrection('das ist gut', 'Das war schlecht.') === null, 'zu viele Wortersetzungen → abgelehnt');
  ok(T.acceptCorrection('hallo zusammen', '   ') === null && T.acceptCorrection('hallo', 42) === null, 'leer / kein String → abgelehnt');
  ok(T.acceptCorrection('ich weiss es', 'Ich weiß es.') === 'Ich weiss es.', 'ß-Schutz: ß → ss, wenn Original keins hatte');
  ok(T.acceptCorrection('die straße ist nass', 'Die Straße ist nass.') === 'Die Straße ist nass.', 'ß bleibt, wenn Original es schon hatte');
  ok(T.sanitizeVocab('Birkenhof,\n\tHighland  Beef\u0007 ' + 'x'.repeat(400)).length === 300, 'vocab bereinigt + max 300 Zeichen');
  const pj = T.parseLlmJson('```json\n{"segments":[{"id":"2","text":"A"},{"id":2,"text":"B"},{"text":"C"}]}\n```');
  ok(pj && pj.size === 1 && pj.get(2) === 'A', 'parseLlmJson: Codefence toleriert, id-String → Zahl, Duplikate/ohne id ignoriert');
  ok(T.parseLlmJson('kein json') === null && T.parseLlmJson('{"foo":1}') === null, 'parseLlmJson: unlesbar → null');
  const msgs = T.buildMessages('de', 'Birkenhof', [{ id: 0, text: 'x' }]);
  ok(msgs[0].role === 'system' && msgs.length === 6 && /birkehof/.test(msgs[1].content) && /Birkenhof/.test(msgs[2].content), 'Prompt: System + 2 Few-Shots + Eingabe');

  console.log('Handler');
  ok((await run('GET')).json.service === 'capivo-polish', 'GET Health-Check');
  const nk = await run('POST', { segments: SEGS });
  ok(nk.statusCode === 500 && /nicht konfiguriert/.test(nk.json.error), 'ohne Key → 500 "nicht konfiguriert"');
  ok((await run('POST', { segments: SEGS }, Object.assign({ REQUIRE_LOGIN: '1', SUPABASE_URL: 'https://x', SUPABASE_ANON_KEY: 'a' }, KEY))).statusCode === 401,
     'REQUIRE_LOGIN ohne Token → 401');
  ok((await run('POST', 'nicht json', KEY)).statusCode === 400, 'ungültiges JSON → 400');
  ok((await run('POST', { segments: [{ id: 1, text: 'a' }, { id: 1, text: 'b' }] }, KEY)).statusCode === 400, 'doppelte id → 400');
  ok((await run('POST', { segments: [{ id: 'x', text: 'a' }] }, KEY)).statusCode === 400, 'nicht-numerische id → 400');
  const big = await run('POST', { segments: [{ id: 0, text: 'wort '.repeat(2401) }] }, KEY);
  ok(big.statusCode === 413, 'Gesamttext > 12 000 Zeichen → 413');
  ok((await run('POST', { segments: [{ id: 0, text: 'x'.repeat(300 * 1024) }] }, KEY)).statusCode === 413, 'Body > 256 KB → 413');

  // Happy path
  mockGroq({ 'openai/gpt-oss-120b': { status: 200, content: answer({
    0: 'Äh, willkommen auf dem Birkenhof.',
    1: 'Bei uns gibt\'s Highland Beef aus dem Fricktal.',
    2: 'Die Rinder sind das ganze Jahr draussen und fressen Gras.' }) } });
  const hp = await run('POST', { lang: 'de', vocab: 'Birkenhof, Highland Beef', segments: SEGS }, KEY);
  ok(hp.statusCode === 200 && hp.json.model === 'openai/gpt-oss-120b' && hp.json.changed === 3 && hp.json.rejected === 0, 'Happy path: 200, Modell, changed=3 ' + JSON.stringify(hp.json && { m: hp.json.model, c: hp.json.changed }));
  ok(JSON.stringify(hp.json.segments.map(s => s.id)) === '[0,1,2,3]' && hp.json.segments[3].text === '' && hp.json.segments[0].text === 'Äh, willkommen auf dem Birkenhof.', 'gleiche ids/Reihenfolge, leeres Segment unverändert');
  const c0 = calls[0];
  ok(calls.length === 1 && c0.url === 'https://api.groq.com/openai/v1/chat/completions' && c0.opts.headers.Authorization === 'Bearer gsk_test', 'Groq-Endpoint + Key nur serverseitig');
  ok(c0.body.temperature === 0 && c0.body.response_format.type === 'json_object' && c0.opts.signal, 'temperature 0, json_object, Timeout-Signal');
  const lastIn = JSON.parse(c0.body.messages[c0.body.messages.length - 1].content);
  ok(lastIn.vocab === 'Birkenhof, Highland Beef' && lastIn.lang === 'de' && lastIn.segments.length === 3, 'Eingabe ans LLM: vocab, lang, nur nicht-leere Segmente');

  // Nur leere Segmente → kein Groq-Call
  mockGroq({});
  const em = await run('POST', { segments: [{ id: 5, text: '  ' }] }, KEY);
  ok(em.statusCode === 200 && em.json.model === null && calls.length === 0, 'nur leere Segmente → kein Groq-Call');

  // Modell-Fallback (404 / 400 / 5xx / Netzfehler)
  for (const st of [404, 400, 503]) {
    mockGroq({ 'openai/gpt-oss-120b': { status: st }, 'openai/gpt-oss-20b': { status: 200, content: answer({ 0: 'Äh, willkommen auf dem Birkenhof.' }) } });
    const fb = await run('POST', { lang: 'de', segments: SEGS }, KEY);
    ok(fb.statusCode === 200 && fb.json.model === 'openai/gpt-oss-20b' && calls.length === 2 && fb.json.changed === 1, 'Fallback-Modell bei HTTP ' + st);
  }
  mockGroq({ 'openai/gpt-oss-120b': { throw: 'TypeError' }, 'openai/gpt-oss-20b': { status: 200, content: answer({}) } });
  ok((await run('POST', { segments: SEGS }, KEY)).json.model === 'openai/gpt-oss-20b', 'Fallback bei Netzfehler');
  mockGroq({ 'openai/gpt-oss-120b': { status: 401 }, 'openai/gpt-oss-20b': { status: 200, content: answer({}) } });
  const k401 = await run('POST', { segments: SEGS }, KEY);
  ok(k401.statusCode === 502 && calls.length === 1, '401 (Key-Problem) → kein Fallback, 502');

  // Ungültiges JSON vom LLM: erst Fallback, beide unlesbar → 502 (Frontend behält Roh-Transkript)
  mockGroq({ 'openai/gpt-oss-120b': { status: 200, content: 'Hier ist die Korrektur: ...' }, 'openai/gpt-oss-20b': { status: 200, content: answer({ 1: 'Bei uns gibt\'s Highland Beef aus dem Fricktal.' }) } });
  const ij = await run('POST', { segments: SEGS }, KEY);
  ok(ij.statusCode === 200 && ij.json.model === 'openai/gpt-oss-20b' && ij.json.changed === 1, 'unlesbares JSON → Fallback-Modell');
  mockGroq({ 'openai/gpt-oss-120b': { status: 200, content: '{"segments": "kaputt"}' }, 'openai/gpt-oss-20b': { status: 200, rawBody: '<html>oops' } });
  const both = await run('POST', { segments: SEGS }, KEY);
  ok(both.statusCode === 502 && /nicht-lesbar/.test(both.json.error) && calls.length === 2, 'beide unlesbar → 502 mit error');
  mockGroq({ 'openai/gpt-oss-120b': { throw: 'TimeoutError' }, 'openai/gpt-oss-20b': { throw: 'TimeoutError' } });
  const to = await run('POST', { segments: SEGS }, KEY);
  ok(to.statusCode === 502 && /rechtzeitig/.test(to.json.error) && calls.length === 2, 'Timeout bei beiden Modellen → 502');

  // Zu starkes Umformulieren → Original bleibt; andere Segmente trotzdem korrigiert
  mockGroq({ 'openai/gpt-oss-120b': { status: 200, content: answer({
    0: 'Äh, willkommen auf dem Birkenhof.',
    1: 'Unser Hof im Fricktal verkauft feinstes schottisches Hochlandrind.',
    2: 'Die Rinder.' }) } });
  const pa = await run('POST', { segments: SEGS }, KEY);
  ok(pa.statusCode === 200 && pa.json.segments[1].text === SEGS[1].text && pa.json.segments[2].text === SEGS[2].text, 'Paraphrase / Kürzung → Original behalten');
  ok(pa.json.segments[0].text === 'Äh, willkommen auf dem Birkenhof.' && pa.json.changed === 1 && pa.json.rejected === 2, 'gute Segmente trotzdem übernommen (changed=1, rejected=2)');

  // Fehlende / fremde ids im LLM-Output
  mockGroq({ 'openai/gpt-oss-120b': { status: 200, content: JSON.stringify({ segments: [{ id: 99, text: 'Fremd.' }, { id: 2, text: 'Die Rinder sind das ganze Jahr draussen und fressen Gras.' }] }) } });
  const mi = await run('POST', { segments: SEGS }, KEY);
  ok(mi.json.segments.length === 4 && mi.json.segments[0].text === SEGS[0].text && mi.json.changed === 1 && !mi.json.segments.some(s => s.id === 99), 'fehlende ids → Original, unbekannte ids ignoriert');

  // ß-Schutz im Handler
  mockGroq({ 'openai/gpt-oss-120b': { status: 200, content: answer({ 0: 'Äh, willkommen auf dem Birkenhof, weiß Gott.', 2: 'Die Rinder sind das ganze Jahr draußen und fressen Gras.' }) } });
  const sz = await run('POST', { segments: [{ id: 0, text: 'äh willkommen auf dem birkehof weiss gott' }, SEGS[2]] }, KEY);
  ok(sz.json.segments[0].text === 'Äh, willkommen auf dem Birkenhof, weiss Gott.' && sz.json.segments[1].text === 'Die Rinder sind das ganze Jahr draussen und fressen Gras.' && !/ß/.test(sz.body), 'kein ß eingeführt (→ ss)');

  // Rate-Limit (eigener Bucket)
  mockGroq({ 'openai/gpt-oss-120b': { status: 200, content: answer({}) } });
  const rl = []; for (let i = 0; i < 3; i++) rl.push((await run('POST', { segments: SEGS }, Object.assign({ RATE_LIMIT_PER_HOUR: '2' }, KEY))).statusCode);
  ok(rl[2] === 429, 'Rate-Limit greift: ' + rl);

  // PHP-Parität der Prüf-Logik (nur wenn php vorhanden)
  const hasPhp = spawnSync('php', ['-v']).status === 0;
  if (!hasPhp) console.log('  (php nicht gefunden – PHP-Paritäts-Check übersprungen)');
  else {
    console.log('PHP parity');
    const lint = spawnSync('php', ['-l', path.join(__dirname, 'polish.php')], { encoding: 'utf8' });
    ok(lint.status === 0, 'php -l polish.php');
    const cases = [
      ['birkehof', 'Birkenhof.'], ['das ist gut', 'Das war schlecht.'], ['ich weiss es', 'Ich weiß es.'],
      ['die straße ist nass', 'Die Straße ist nass.'], ['hallo zusammen', '  '], [SEGS[1].text, 'Unser Hof im Fricktal verkauft feinstes schottisches Hochlandrind.'],
      [SEGS[2].text, 'Die Rinder sind das ganze Jahr draußen und fressen Gras.'], ['äh also ja', 'Äh, also, ja!'], ['eins zwei drei vier fünf', 'Eins zwei drei vier fünf sechs sieben acht.']
    ];
    const code = 'define("CAPIVO_POLISH_LIB", 1); include ' + JSON.stringify(path.join(__dirname, 'polish.php')) + ';' +
      '$c = json_decode(stream_get_contents(STDIN), true); $o = [];' +
      'foreach ($c["cases"] as $x) $o[] = polish_accept($x[0], $x[1]);' +
      '$m = polish_parse_llm($c["llm"]); $o[] = $m; echo json_encode($o, JSON_UNESCAPED_UNICODE);';
    const llm = '```json\n{"segments":[{"id":"2","text":"A"},{"id":2,"text":"B"},{"text":"C"}]}\n```';
    const pr = spawnSync('php', ['-r', code], { input: JSON.stringify({ cases, llm }), encoding: 'utf8' });
    let phpOut = null; try { phpOut = JSON.parse(pr.stdout); } catch (e) {}
    ok(!!phpOut, 'PHP-Lib lädt ohne Request-Bearbeitung ' + (phpOut ? '' : (pr.stderr || pr.stdout).slice(0, 200)));
    if (phpOut) {
      cases.forEach((c, i) => {
        const js = T.acceptCorrection(c[0], c[1]);
        ok(phpOut[i] === js, 'PHP == JS: ' + JSON.stringify(c[1]).slice(0, 40) + ' → ' + JSON.stringify(js));
      });
      ok(JSON.stringify(phpOut[cases.length]) === '{"2":"A"}', 'PHP parse_llm == JS parseLlmJson');
    }
  }

  if (fails) { console.log(fails + ' FEHLER'); process.exit(1); }
  console.log('POLISH TESTS OK');
})().catch(e => { console.error(e); process.exit(1); });
