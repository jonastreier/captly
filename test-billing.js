// Tests für die Abo-Vorbereitung: paddle-webhook.php (Signatur, Zeitstempel, Idempotenz, Reihenfolge, Events), plan.php,
// Quota in transcribe.php (402 vor Groq), paddle-portal.php — gegen Mock-Supabase, Mock-Groq und Mock-Paddle (php -S, kein Netz).
// Aufruf: node test-billing.js  (überspringt sich ohne php)
const { spawn, spawnSync } = require('child_process');
const http = require('http');
const net = require('net');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

if (spawnSync('php', ['-v']).status !== 0) { console.log('php nicht gefunden – test-billing übersprungen'); process.exit(0); }
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m); } };
const freePort = () => new Promise(r => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });
const UID = '11111111-2222-4333-8444-555555555555', UID2 = '99999999-2222-4333-8444-555555555555';
const SECRET = 'pdl_ntfset_testsecret', PRICE_C = 'pri_creator', PRICE_P = 'pri_pro';

(async () => {
  const [sbPort, groqPort, paddlePort, phpPort, phpOffPort] = [await freePort(), await freePort(), await freePort(), await freePort(), await freePort()];
  // ── Mock-Supabase
  const db = { profiles: {}, usage: [], events: new Set(), failProfileWrite: false, rpc: [] };
  const tokens = { 'tok-user': { id: UID, email: 'a@example.com' }, 'tok-user2': { id: UID2, email: 'b@example.com' } };
  const sb = http.createServer((req, res) => {
    let b = ''; req.on('data', d => b += d); req.on('end', () => {
      const u = new URL(req.url, 'http://x'), q = u.searchParams; const json = (x, c = 200) => { res.statusCode = c; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(x)); };
      const eq = k => (q.get(k) || '').replace(/^(eq|gte)\./, '');
      if (u.pathname === '/auth/v1/user') { const t = (req.headers.authorization || '').replace('Bearer ', ''); return tokens[t] ? json(Object.assign({ aud: 'authenticated' }, tokens[t])) : json({ msg: 'bad' }, 401); }
      if (u.pathname === '/rest/v1/paddle_events') {
        if (req.method === 'POST') { const j = JSON.parse(b); if (db.events.has(j.event_id)) return json([]); db.events.add(j.event_id); return json([j], 201); }
        if (req.method === 'DELETE') { db.events.delete(eq('event_id')); res.statusCode = 204; return res.end(); }
      }
      if (u.pathname === '/rest/v1/profiles') {
        if (req.method === 'GET') {
          let rows = Object.values(db.profiles);
          if (q.get('user_id')) rows = rows.filter(r => r.user_id === eq('user_id'));
          if (q.get('paddle_customer_id')) rows = rows.filter(r => r.paddle_customer_id === eq('paddle_customer_id'));
          return json(rows);
        }
        if (req.method === 'POST') { if (db.failProfileWrite) return json({ message: 'boom' }, 500); const j = JSON.parse(b); db.profiles[j.user_id] = Object.assign(db.profiles[j.user_id] || {}, j); res.statusCode = 201; return res.end(); }
      }
      if (u.pathname === '/rest/v1/usage' && req.method === 'GET') return json(db.usage.filter(r => r.user_id === eq('user_id') && r.day >= eq('day')));
      if (u.pathname === '/rest/v1/rpc/add_usage') { const j = JSON.parse(b); db.rpc.push(j); db.usage.push({ user_id: j.p_user, day: new Date().toISOString().slice(0, 10), seconds: j.p_seconds }); res.statusCode = 204; return res.end(); }
      res.statusCode = 404; res.end();
    });
  }).listen(sbPort);
  // ── Mock-Groq
  let groqCalls = 0;
  const groq = http.createServer((req, res) => { req.resume(); req.on('end', () => { groqCalls++; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ text: 'hallo', language: 'german', words: [{ word: 'hallo', start: 0, end: 0.4 }] })); }); }).listen(groqPort);
  // ── Mock-Paddle (Portal)
  const paddleReqs = [];
  const paddle = http.createServer((req, res) => { let b = ''; req.on('data', d => b += d); req.on('end', () => { paddleReqs.push({ url: req.url, auth: req.headers.authorization, method: req.method }); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ data: { urls: { general: { overview: 'https://customer-portal.paddle.com/cpl_x?token=abc' } } } })); }); }).listen(paddlePort);

  const base = { SUPABASE_URL: `http://127.0.0.1:${sbPort}`, SUPABASE_SERVICE_KEY: 'svc', SUPABASE_ANON_KEY: 'anon', GROQ_API_KEY: 'gsk_test', GROQ_BASE: `http://127.0.0.1:${groqPort}`,
    RATE_LIMIT_PER_HOUR: 0, MAX_AUDIO_SEC_PER_HOUR: 0, PADDLE_PRICE_CREATOR: PRICE_C, PADDLE_PRICE_PRO: PRICE_P, PADDLE_WEBHOOK_SECRET: SECRET, PADDLE_API_KEY: 'pdl_key',
    PADDLE_API_BASE: `http://127.0.0.1:${paddlePort}`, PADDLE_CLIENT_TOKEN: 'test_client', PADDLE_ENV: 'sandbox', ANON_SEC_PER_DAY: 20 };
  const mkdir = (cfg) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crbill-'));
    for (const f of ['billing.php', 'plan.php', 'paddle-webhook.php', 'paddle-portal.php', 'transcribe.php']) fs.copyFileSync(path.join(__dirname, f), path.join(dir, f));
    fs.writeFileSync(path.join(dir, 'config.php'), '<?php return ' + require('child_process').execSync('php -r \'echo var_export(json_decode(file_get_contents("php://stdin"), true), true);\'', { input: JSON.stringify(cfg) }).toString() + ';');
    return dir;
  };
  const dirOn = mkdir(Object.assign({ BILLING_ENABLED: true }, base)), dirOff = mkdir(Object.assign({ BILLING_ENABLED: false }, base));
  const spawnPhp = (dir, port) => spawn('php', ['-S', '127.0.0.1:' + port, '-t', dir], { env: Object.assign({}, process.env, { TMPDIR: dir }), stdio: 'ignore' });
  const php = spawnPhp(dirOn, phpPort), phpOff = spawnPhp(dirOff, phpOffPort);
  await new Promise(r => setTimeout(r, 900));
  const U = 'http://127.0.0.1:' + phpPort + '/', UOFF = 'http://127.0.0.1:' + phpOffPort + '/';

  // ── Helfer
  const sign = (body, ts, secret = SECRET) => 'ts=' + ts + ';h1=' + crypto.createHmac('sha256', secret).update(ts + ':' + body).digest('hex');
  const now = () => Math.floor(Date.now() / 1000);
  let evSeq = 0;
  const sub = (type, over = {}, data = {}) => ({ event_id: over.event_id || 'evt_' + (++evSeq), event_type: type, occurred_at: over.occurred_at || new Date().toISOString(), notification_id: 'ntf_1',
    data: Object.assign({ id: 'sub_1', status: 'active', customer_id: 'ctm_1', items: [{ price: { id: PRICE_C } }], custom_data: { user_id: UID }, current_billing_period: { starts_at: new Date().toISOString(), ends_at: new Date(Date.now() + 30 * 864e5).toISOString() } }, data) });
  const hook = async (obj, opts = {}) => { const body = typeof obj === 'string' ? obj : JSON.stringify(obj); const ts = opts.ts || now();
    const r = await fetch(U + 'paddle-webhook.php', { method: 'POST', body, headers: { 'Paddle-Signature': opts.sig !== undefined ? opts.sig : sign(body, ts), 'Content-Type': 'application/json' } });
    return { s: r.status, j: await r.json().catch(() => ({})) }; };
  const plan = async (tok, url = U) => (await fetch(url + 'plan.php', { headers: tok ? { 'X-Capivo-Token': tok } : {} })).json();

  // WAV (n Sekunden, 16 kHz mono, Rauschen) für transcribe.php
  const wav = sec => { const nS = Math.round(16000 * sec), d = Buffer.alloc(44 + nS * 2); d.write('RIFF', 0); d.writeUInt32LE(36 + nS * 2, 4); d.write('WAVEfmt ', 8); d.writeUInt32LE(16, 16); d.writeUInt16LE(1, 20); d.writeUInt16LE(1, 22);
    d.writeUInt32LE(16000, 24); d.writeUInt32LE(32000, 28); d.writeUInt16LE(2, 32); d.writeUInt16LE(16, 34); d.write('data', 36); d.writeUInt32LE(nS * 2, 40); for (let i = 0; i < nS; i++) d.writeInt16LE(Math.round((Math.random() - 0.5) * 8000), 44 + i * 2); return d; };
  const tr = async (tok, sec, url = U) => { const r = await fetch(url + 'transcribe.php?model=whisper-large-v3-turbo', { method: 'POST', body: wav(sec), headers: Object.assign({ 'Content-Type': 'audio/wav' }, tok ? { 'X-Capivo-Token': tok } : {}) }); return { s: r.status, j: await r.json().catch(() => ({})) }; };

  try {
    // ════ Schalter aus: nichts ändert sich
    ok((await plan('tok-user', UOFF)).enabled === false, 'aus: plan.php meldet enabled:false');
    const offHook = await fetch(UOFF + 'paddle-webhook.php', { method: 'POST', body: '{}' }); ok(offHook.status === 503, 'aus: Webhook antwortet 503');
    const offTr = await tr(null, 3, UOFF); ok(offTr.s === 200 && groqCalls === 1 && db.rpc.length === 0, 'aus: Transkription läuft ohne Kontingent-Prüfung');
    const offPortal = await fetch(UOFF + 'paddle-portal.php', { method: 'POST' }); ok(offPortal.status === 503, 'aus: Portal antwortet 503');

    // ════ Webhook: Signatur und Zeitstempel
    const good = sub('subscription.created');
    ok((await hook(good, { sig: 'ts=' + now() + ';h1=' + '0'.repeat(64) })).s === 401, 'Webhook: falsche Signatur → 401');
    ok((await hook(good, { sig: '' })).s === 401 && (await hook(good, { sig: 'h1=abc' })).s === 401, 'Webhook: fehlende/kaputte Kopfzeile → 401');
    ok((await hook(good, { sig: sign(JSON.stringify(good), now(), 'anderes_secret') })).s === 401, 'Webhook: Signatur mit fremdem Secret → 401');
    ok((await hook(good, { ts: now() - 3600 })).s === 401, 'Webhook: Zeitstempel zu alt → 401 (Replay)');
    ok((await hook(good, { ts: now() + 3600 })).s === 401, 'Webhook: Zeitstempel in der Zukunft → 401');
    const tampered = JSON.stringify(good), ts0 = now(); const rt = await fetch(U + 'paddle-webhook.php', { method: 'POST', body: tampered.replace('creator', 'xx'), headers: { 'Paddle-Signature': sign(tampered, ts0) } });
    ok(rt.status === 401 && Object.keys(db.profiles).length === 0, 'Webhook: veränderter Body → 401, nichts gespeichert');
    // Secret-Rotation: zwei h1-Werte, einer gültig
    const body1 = JSON.stringify(good), tsr = now();
    const rotated = 'ts=' + tsr + ';h1=' + '1'.repeat(64) + ';h1=' + crypto.createHmac('sha256', SECRET).update(tsr + ':' + body1).digest('hex');
    const r1 = await hook(body1, { sig: rotated, ts: tsr });
    ok(r1.s === 200 && r1.j.plan === 'creator', 'Webhook: gültiger Event mit zwei h1-Werten (Rotation) → 200');
    ok(db.profiles[UID] && db.profiles[UID].plan === 'creator' && db.profiles[UID].status === 'active' && db.profiles[UID].paddle_customer_id === 'ctm_1' && !!db.profiles[UID].period_end, 'Webhook: Profil mit Plan, Status, Laufzeit und Kunden-ID gespeichert');

    // ════ Idempotenz und Reihenfolge
    const upserts = () => db.events.size;
    const d1 = await hook(good); ok(d1.s === 200 && d1.j.duplicate === true, 'Webhook: gleiches Event nochmals → duplicate, keine zweite Verarbeitung');
    db.profiles[UID].plan = 'manuell';
    await hook(good); ok(db.profiles[UID].plan === 'manuell', 'Webhook: Duplikat überschreibt nichts');
    db.profiles[UID].plan = 'creator';
    const newer = sub('subscription.updated', { occurred_at: new Date(Date.now() + 60000).toISOString() }, { items: [{ price: { id: PRICE_P } }] });
    ok((await hook(newer)).j.plan === 'pro' && db.profiles[UID].plan === 'pro', 'Webhook: subscription.updated mit Pro-Preis → Plan pro');
    const older = sub('subscription.updated', { occurred_at: new Date(Date.now() - 600000).toISOString() }, { items: [{ price: { id: PRICE_C } }] });
    const ro = await hook(older); ok(ro.j.ignored === 'older_event' && db.profiles[UID].plan === 'pro', 'Webhook: älteres Event überschreibt den neueren Stand nicht');

    // ════ Weitere Events
    const pd = await hook(sub('subscription.past_due', { occurred_at: new Date(Date.now() + 120000).toISOString() }, { status: 'past_due', items: [{ price: { id: PRICE_P } }] }));
    ok(pd.s === 200 && db.profiles[UID].status === 'past_due' && db.profiles[UID].plan === 'pro', 'Webhook: past_due → Status past_due, Plan bleibt');
    const noCd = await hook(sub('subscription.updated', { occurred_at: new Date(Date.now() + 180000).toISOString() }, { custom_data: null, status: 'active', items: [{ price: { id: PRICE_C } }] }));
    ok(noCd.s === 200 && db.profiles[UID].plan === 'creator' && db.profiles[UID].status === 'active', 'Webhook: ohne custom_data wird der Nutzer über die Kunden-ID gefunden');
    ok((await hook(sub('subscription.created', {}, { custom_data: { user_id: 'kein-uuid' }, customer_id: 'ctm_unbekannt' }))).j.ignored === 'no_user', 'Webhook: unbekannter Nutzer → ignoriert, kein Absturz');
    ok((await hook(sub('subscription.created', {}, { items: [{ price: { id: 'pri_fremd' } }] }))).j.ignored === 'unknown_price', 'Webhook: unbekannte Preis-ID → ignoriert');
    ok((await hook(sub('transaction.completed'))).j.ignored === 'transaction.completed', 'Webhook: nicht behandelter Typ → 200 ignoriert');
    ok((await hook('kein json')).s === 400 || (await hook('kein json')).s === 401, 'Webhook: kein JSON wird abgelehnt');
    // Fehler in der Datenbank → 500 und Event wieder freigeben (Paddle wiederholt)
    db.failProfileWrite = true;
    const failEv = sub('subscription.updated', { occurred_at: new Date(Date.now() + 240000).toISOString() }, { items: [{ price: { id: PRICE_P } }] });
    const rf = await hook(failEv); ok(rf.s === 500 && !db.events.has(failEv.event_id), 'Webhook: DB-Fehler → 500 und Event-ID wieder frei');
    db.failProfileWrite = false;
    const rr = await hook(failEv); ok(rr.s === 200 && rr.j.plan === 'pro', 'Webhook: Wiederholung nach DB-Fehler wird verarbeitet');
    const cEv = await hook(sub('subscription.canceled', { occurred_at: new Date(Date.now() + 300000).toISOString() }, { status: 'canceled', items: [{ price: { id: PRICE_P } }] }));
    ok(cEv.s === 200 && db.profiles[UID].status === 'canceled', 'Webhook: subscription.canceled → Status canceled');

    // ════ plan.php: wirksamer Plan und Restminuten
    let p = await plan(null); ok(p.enabled === true && p.loggedIn === false && p.plan === 'anon' && p.paddle.clientToken === 'test_client' && p.paddle.prices.pro === PRICE_P, 'plan: Gast → anon + öffentliche Paddle-Werte');
    ok(!JSON.stringify(p).includes(SECRET) && !JSON.stringify(p).includes('pdl_key') && !JSON.stringify(p).includes('svc'), 'plan: enthält keine Secrets');
    p = await plan('tok-user'); ok(p.plan === 'free' && p.limit_sec === 1800 && p.left_sec === 1800 && p.used_sec === 0, 'plan: gekündigt → free (30 Min.)');
    p = await plan('falsches-token'); ok(p.loggedIn === false, 'plan: ungültiges Token → Gast');
    db.profiles[UID].plan = 'creator'; db.profiles[UID].status = 'active'; db.profiles[UID].period_end = new Date(Date.now() + 864e5).toISOString();
    p = await plan('tok-user'); ok(p.plan === 'creator' && p.limit_sec === 18000 && p.canPortal === true, 'plan: Creator aktiv → 300 Min., Portal möglich');
    db.profiles[UID].period_end = new Date(Date.now() - 864e5).toISOString();
    p = await plan('tok-user'); ok(p.plan === 'free', 'plan: abgelaufene Laufzeit → free');
    db.profiles[UID].status = 'past_due'; db.profiles[UID].period_end = new Date(Date.now() - 864e5).toISOString();
    p = await plan('tok-user'); ok(p.plan === 'creator', 'plan: past_due innerhalb der 3 Tage Kulanz → Plan bleibt');
    db.profiles[UID].period_end = new Date(Date.now() - 5 * 864e5).toISOString();
    p = await plan('tok-user'); ok(p.plan === 'free', 'plan: past_due nach der Kulanz → free');
    delete db.profiles[UID]; p = await plan('tok-user'); ok(p.plan === 'free', 'plan: Nutzer ohne Profilzeile → free');

    // ════ Quota in transcribe.php
    const g0 = groqCalls;
    let t1 = await tr('tok-user', 12); ok(t1.s === 200 && groqCalls === g0 + 1 && db.rpc.length === 1 && db.rpc[0].p_user === UID && db.rpc[0].p_seconds === 12, 'Quota: eingeloggt, genug Minuten → 200 und 12 s verbucht');
    db.usage.push({ user_id: UID, day: new Date().toISOString().slice(0, 10), seconds: 1800 - 12 - 5 });
    const g1 = groqCalls; t1 = await tr('tok-user', 12);
    ok(t1.s === 402 && t1.j.error === 'quota' && t1.j.plan === 'free' && t1.j.limit_sec === 1800 && groqCalls === g1, 'Quota: Limit überschritten → 402 {error:quota} VOR dem Groq-Aufruf');
    t1 = await tr('tok-user', 3); ok(t1.s === 200, 'Quota: kleineres Stück passt noch');
    t1 = await tr('tok-user2', 12); ok(t1.s === 200 && db.rpc[db.rpc.length - 1].p_user === UID2, 'Quota: anderer Nutzer hat eigenes Kontingent');
    db.profiles[UID] = { user_id: UID, plan: 'pro', status: 'active', period_end: new Date(Date.now() + 864e5).toISOString() };
    t1 = await tr('tok-user', 12); ok(t1.s === 200, 'Quota: Pro-Plan hat deutlich mehr Minuten');
    const a1 = await tr(null, 12); ok(a1.s === 200, 'Quota Gast: erstes Stück (12 s von 20 s) ok');
    const a2 = await tr(null, 12); ok(a2.s === 402 && a2.j.plan === 'anon' && a2.j.limit_sec === 20, 'Quota Gast: Tageslimit pro IP → 402 anon');

    // ════ Kundenportal
    ok((await fetch(U + 'paddle-portal.php', { method: 'POST' })).status === 401, 'Portal: ohne Login → 401');
    ok((await fetch(U + 'paddle-portal.php', { method: 'POST', headers: { 'X-Capivo-Token': 'tok-user2' } })).status === 404, 'Portal: ohne Abo → 404');
    db.profiles[UID].paddle_customer_id = 'ctm_1';
    const por = await fetch(U + 'paddle-portal.php', { method: 'POST', headers: { 'X-Capivo-Token': 'tok-user' } }); const pj = await por.json();
    ok(por.status === 200 && /^https:\/\/customer-portal\.paddle\.com\//.test(pj.url), 'Portal: liefert den Portal-Link');
    ok(paddleReqs.length === 1 && paddleReqs[0].url === '/customers/ctm_1/portal-sessions' && paddleReqs[0].auth === 'Bearer pdl_key' && paddleReqs[0].method === 'POST', 'Portal: Paddle-Aufruf mit Kunden-ID und API-Key (nur serverseitig)');
  } finally { php.kill(); phpOff.kill(); sb.close(); groq.close(); paddle.close(); for (const d of [dirOn, dirOff]) fs.rmSync(d, { recursive: true, force: true }); }
  console.log(fails ? `${fails}/${n} FEHLER` : `test-billing: ${n} Prüfungen grün`);
  process.exit(fails ? 1 : 0);
})();
