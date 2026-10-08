// Tests für log.php (Fehlerberichte) und stat.php (Style-Zählung) gegen Mock-Supabase (php -S, kein Netz).
// Aufruf: node test-telemetry.js  (überspringt sich ohne php)
const { spawn, spawnSync } = require('child_process');
const http = require('http');
const net = require('net');
const fs = require('fs');
const os = require('os');
const path = require('path');

if (spawnSync('php', ['-v']).status !== 0) { console.log('php nicht gefunden – test-telemetry übersprungen'); process.exit(0); }
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m); } };
const freePort = () => new Promise(r => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });

(async () => {
  const [sbPort, phpPort] = [await freePort(), await freePort()];
  const errors = []; const bumps = []; let statGets = 0;
  const today = new Date().toISOString().slice(0, 10);
  const sb = http.createServer((req, res) => {
    let b = ''; req.on('data', d => b += d); req.on('end', () => {
      const u = new URL(req.url, 'http://x'); const json = (x, c = 200) => { res.statusCode = c; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(x)); };
      if (u.pathname === '/rest/v1/client_errors' && req.method === 'POST') { errors.push(JSON.parse(b)); res.statusCode = 201; return res.end(); }
      if (u.pathname === '/rest/v1/client_errors' && req.method === 'DELETE') return json([]);
      if (u.pathname === '/rest/v1/rpc/bump_style') { bumps.push(JSON.parse(b).p_style); res.statusCode = 204; return res.end(); }
      if (u.pathname === '/rest/v1/style_stats' && req.method === 'GET') { statGets++; return json([{ style: 'tight', n: 30, day: today }, { style: 'tight', n: 20, day: today }, { style: 'mix', n: 12 }, { style: 'hormozi', n: 40 }, { style: 'x', n: 1 }]); }
      res.statusCode = 404; res.end();
    });
  }).listen(sbPort);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crtel-'));
  for (const f of ['log.php', 'stat.php']) fs.copyFileSync(path.join(__dirname, f), path.join(dir, f));
  fs.writeFileSync(path.join(dir, 'config.php'), `<?php return ['SUPABASE_URL'=>'http://127.0.0.1:${sbPort}','SUPABASE_SERVICE_KEY'=>'svc'];`);
  const php = spawn('php', ['-S', '127.0.0.1:' + phpPort, '-t', dir], { env: Object.assign({}, process.env, { TMPDIR: dir }), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const base = 'http://127.0.0.1:' + phpPort + '/';
  const post = (f, body, headers) => fetch(base + f, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers }).then(async r => ({ s: r.status, t: await r.text() }));

  try {
    // ── log.php
    const g = await fetch(base + 'log.php'); ok((await g.json()).configured === true, 'log: GET meldet configured');
    const r1 = await post('log.php', { m: 'TypeError: cannot read mein-urlaub-2024.mp4 for anna@example.com at https://captionrush.com/x?token=abc123#frag id 1234567890 tok_abcdefghijklmnopqrstuvwxyz0123', s: 'app.js:42', p: '/de?email=a@b.ch' },
      { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1' });
    ok(r1.s === 204 && errors.length === 1, 'log: 204 und eine Zeile gespeichert');
    const e = errors[0] || {};
    ok(!/mein-urlaub|\.mp4/.test(e.msg) && /<file>/.test(e.msg), 'log: Dateiname entfernt: ' + e.msg);
    ok(!/anna|example\.com/.test(e.msg) && /<email>/.test(e.msg), 'log: E-Mail-Adresse entfernt');
    ok(!/token=|abc123|#frag/.test(e.msg) && /captionrush\.com\/x/.test(e.msg), 'log: Query und Fragment der Adresse entfernt');
    ok(!/1234567890|abcdefghijklmnopqrstuvwxyz/.test(e.msg), 'log: lange Zahlen und Token entfernt');
    ok(e.page === '/de' && e.browser === 'Safari mobile' && e.src === 'app.js:42', 'log: Seitenpfad ohne Query, Browser-Familie statt User-Agent');
    ok(!('ip' in e) && !JSON.stringify(e).includes('127.0.0.1') && !/iPhone|AppleWebKit/.test(JSON.stringify(e)), 'log: weder IP noch User-Agent gespeichert');
    ok((await post('log.php', { m: '   ' })).s === 400, 'log: leere Meldung → 400');
    ok((await post('log.php', 'kein json')).s === 400, 'log: kein JSON → 400');
    const long = await post('log.php', { m: 'x'.repeat(1500) }); ok(long.s === 204 && errors[errors.length - 1].msg.length <= 240, 'log: lange Meldung wird gekürzt');
    // Drosselung: 20 pro Stunde und IP (bisher 4 Anfragen mit Treffer/Fehler gezählt)
    let last; for (let i = 0; i < 20; i++) last = await post('log.php', { m: 'e' + i });
    ok(last.s === 429, 'log: nach 20 Meldungen pro Stunde → 429');

    // ── stat.php
    ok((await post('stat.php', { style: 'tight' })).s === 204 && bumps.join() === 'tight', 'stat: Export zählt (rpc/bump_style)');
    ok((await post('stat.php', { style: 'Bad Style!' })).s === 400 && (await post('stat.php', { style: '../x' })).s === 400 && bumps.length === 1, 'stat: ungültige Style-ID abgelehnt');
    ok((await post('stat.php', 'x')).s === 400, 'stat: kaputter Body → 400');
    const s1 = await (await fetch(base + 'stat.php')).json();
    ok(s1.total === 103 && s1.top[0].style === 'tight' && s1.top[0].n === 50 && s1.top[1].style === 'hormozi', 'stat: GET summiert 30 Tage, sortiert: ' + JSON.stringify(s1.top));
    await fetch(base + 'stat.php'); ok(statGets === 1, 'stat: zweite Abfrage aus dem Datei-Cache (1 DB-Zugriff)');
    const hdr = (await fetch(base + 'stat.php')).headers.get('cache-control'); ok(/max-age=3600/.test(hdr || ''), 'stat: Cache-Control für 1 Stunde');
    let l2; for (let i = 0; i < 22; i++) l2 = await post('stat.php', { style: 'mix' });
    ok(l2.s === 429, 'stat: Drosselung pro IP → 429');

    // ── ohne Konfiguration (eigener Server, damit kein Opcache-Cache dazwischenfunkt)
    const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'crtel2-')); const p2 = await freePort();
    for (const f of ['log.php', 'stat.php']) fs.copyFileSync(path.join(__dirname, f), path.join(dir2, f));
    const php2 = spawn('php', ['-S', '127.0.0.1:' + p2, '-t', dir2], { env: Object.assign({}, process.env, { TMPDIR: dir2 }), stdio: 'ignore' });
    await new Promise(r => setTimeout(r, 800));
    try {
      const b2 = 'http://127.0.0.1:' + p2 + '/';
      const q1 = await fetch(b2 + 'log.php', { method: 'POST', body: '{"m":"x"}' }), q2 = await fetch(b2 + 'stat.php', { method: 'POST', body: '{"style":"tight"}' });
      ok(q1.status === 503 && q2.status === 503, 'ohne Config: 503 bei POST (' + q1.status + ',' + q2.status + ')');
      const off = await (await fetch(b2 + 'stat.php')).json(); ok(off.configured === false && off.total === 0, 'ohne Config: GET liefert leere Rangliste');
    } finally { php2.kill(); fs.rmSync(dir2, { recursive: true, force: true }); }
  } finally { php.kill(); sb.close(); fs.rmSync(dir, { recursive: true, force: true }); }
  console.log(fails ? `${fails}/${n} FEHLER` : `test-telemetry: ${n} Prüfungen grün`);
  process.exit(fails ? 1 : 0);
})();
