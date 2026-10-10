// Tests für die Betriebs-Skripte: scripts/check-secrets.js (Deploy-Vorprüfung) und scripts/live-check.js (Live-Prüfung).
// Der Live-Check läuft gegen php -S mit einem Router, der Apache nachahmt (Clean URLs, gesperrte Dateien); kein Netz.
// Aufruf: node test-ops.js   (überspringt den Live-Teil ohne php)
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');

let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m); } };
const freePort = () => new Promise(r => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });
const run = (script, args, env) => spawnSync('node', [path.join(__dirname, script)].concat(args || []), { env: Object.assign({ PATH: process.env.PATH }, env || {}), encoding: 'utf8' });

// ── 1) check-secrets.js ──
const FULL = { FTP_SERVER: 'ftp.example.ch', FTP_USERNAME: 'u', FTP_PASSWORD: 'p', GROQ_API_KEY: 'gsk_abc', SUPABASE_SERVICE_KEY: 'eyJservice', SMTP_HOST: 'asmtp.example.ch', SMTP_USER: 'noreply@example.com', SMTP_PASS: 'x', LEAD_SECRET: 'a'.repeat(40) };
let r = run('scripts/check-secrets.js', [], {});
ok(r.status === 1, 'check-secrets: ohne Secrets Exit 1');
ok(['FTP_SERVER', 'FTP_USERNAME', 'FTP_PASSWORD', 'GROQ_API_KEY', 'SUPABASE_SERVICE_KEY', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'LEAD_SECRET'].every(k => r.stdout.includes('✗ ' + k)), 'check-secrets: nennt ALLE fehlenden Pflicht-Secrets auf einmal');
ok(/docs\/START-HIER\.md/.test(r.stdout), 'check-secrets: verweist auf die Anleitung');
r = run('scripts/check-secrets.js', [], FULL);
ok(r.status === 0 && /Alle Pflicht-Secrets vorhanden/.test(r.stdout), 'check-secrets: vollständig → Exit 0');
ok(/FTP_DIR/.test(r.stdout) && /MAIL_FROM/.test(r.stdout), 'check-secrets: empfohlene (optionale) Secrets werden erwähnt');
r = run('scripts/check-secrets.js', [], Object.assign({}, FULL, { LEAD_SECRET: 'kurz' }));
ok(r.status === 1 && /LEAD_SECRET.*zu kurz/.test(r.stdout), 'check-secrets: zu kurzes LEAD_SECRET wird abgelehnt');
r = run('scripts/check-secrets.js', [], Object.assign({}, FULL, { SUPABASE_SERVICE_KEY: 'sb_publishable_xyz' }));
ok(r.status === 1 && /service_role/.test(r.stdout), 'check-secrets: öffentlicher Supabase-Schlüssel statt service_role wird abgelehnt');
r = run('scripts/check-secrets.js', [], Object.assign({}, FULL, { FTP_DIR: './www/x', SMTP_PORT: 'abc' }));
ok(r.status === 1 && /SMTP_PORT/.test(r.stdout) && /FTP_DIR.*endet nicht mit \//.test(r.stdout), 'check-secrets: SMTP_PORT-Fehler und FTP_DIR-Hinweis');
r = run('scripts/check-secrets.js', [], Object.assign({}, FULL, { GROQ_API_KEY: '  ' }));
ok(r.status === 1 && /✗ GROQ_API_KEY/.test(r.stdout), 'check-secrets: leerer Wert zählt als fehlend');

(async () => {
  if (spawnSync('php', ['-v']).status !== 0) { console.log('php nicht gefunden – Live-Check-Test übersprungen'); return done(); }
  // ── 2) live-check.js gegen php -S ──
  const { execFileSync } = require('child_process');
  execFileSync('node', [path.join(__dirname, 'scripts/build-dist.js')], { stdio: 'ignore' });
  const mk = (cfgPhp, leak) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crops-'));
    fs.cpSync(path.join(__dirname, 'dist'), dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'config.php'), '<?php return ' + cfgPhp + ';');
    if (leak) fs.copyFileSync(path.join(__dirname, 'schema.sql'), path.join(dir, 'schema.sql'));
    fs.writeFileSync(path.join(dir, 'router.php'), `<?php
$p = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$deny = ${leak ? 'false' : "preg_match('#(^/\\\\.|/config(\\\\.example)?\\\\.php$|\\\\.(md|sql|sh|log)$|/test-.*|/server\\\\.js$)#', $p)"};
if ($deny && $p !== '/config.php') { http_response_code(403); exit; }
if ($p === '/config.php' && $deny) { http_response_code(403); exit; }
$pages = ['/' => 'captly.html', '/de' => 'captly.de.html', '/impressum' => 'impressum.html', '/datenschutz' => 'datenschutz.html', '/privacy' => 'privacy.html', '/terms' => 'terms.html'];
if (isset($pages[$p])) { header('Content-Type: text/html; charset=utf-8'); readfile(__DIR__ . '/' . $pages[$p]); return true; }
if (preg_match('#^/api/(transcribe|lead|log|stat|plan)$#', $p, $m)) { require __DIR__ . '/' . $m[1] . '.php'; return true; }
if ($p === '/kontakt') { $_GET['lang'] = 'de'; require __DIR__ . '/contact.php'; return true; }
if ($p === '/contact') { require __DIR__ . '/contact.php'; return true; }
return false;`);
    return dir;
  };
  const withServer = async (dir, fn) => {
    const port = await freePort();
    const php = spawn('php', ['-S', '127.0.0.1:' + port, '-t', dir, path.join(dir, 'router.php')], { stdio: 'ignore', env: Object.assign({}, process.env, { TMPDIR: dir }) });
    await new Promise(r => setTimeout(r, 800));
    try { return await fn('http://127.0.0.1:' + port); } finally { php.kill(); fs.rmSync(dir, { recursive: true, force: true }); }
  };
  const live = base => new Promise(res => { const p = spawn('node', [path.join(__dirname, 'scripts/live-check.js'), base, '--local']); let o = ''; p.stdout.on('data', d => o += d); p.stderr.on('data', d => o += d); p.on('close', c => res({ status: c, out: o })); });
  const GOOD = "['GROQ_API_KEY'=>'gsk_x','SUPABASE_URL'=>'http://127.0.0.1:9','SUPABASE_SERVICE_KEY'=>'svc','LEAD_SECRET'=>'" + 'b'.repeat(40) + "','BILLING_ENABLED'=>false]";

  let res = await withServer(mk(GOOD, false), live);
  if (process.env.OPS_VERBOSE) console.log(res.out);
  ok(res.status === 0, 'live-check: korrekt konfigurierter Server → Exit 0' + (res.status ? '\n' + res.out : ''));
  ok(/Transkription: bereit/.test(res.out) && /E-Mail-Erfassung: bereit/.test(res.out) && /Abos: aus/.test(res.out), 'live-check: meldet Transkription, Leads und Abos-Schalter');
  ok(/Kontaktformular hat Spam-Schutz-Token/.test(res.out), 'live-check: erkennt das Token des Kontaktformulars');
  ok(/\/schema\.sql ist nicht abrufbar/.test(res.out) && /\/config\.php ist nicht abrufbar|\/config\.php wird nur ausgeführt/.test(res.out), 'live-check: interne Dateien nicht abrufbar');

  res = await withServer(mk(GOOD.replace("'GROQ_API_KEY'=>'gsk_x',", ''), false), live);
  if (process.env.OPS_VERBOSE) console.log(res.out);
  ok(res.status === 1 && /Transkription: erreichbar, aber Groq-Key fehlt/.test(res.out), 'live-check: erkennt fehlenden Groq-Key');

  res = await withServer(mk(GOOD.replace("'LEAD_SECRET'", "'X_LEAD'"), false), live);
  ok(res.status === 1 && /Kontaktformular ohne Token/.test(res.out), 'live-check: erkennt fehlendes LEAD_SECRET');

  res = await withServer(mk(GOOD, true), live);
  ok(res.status === 1 && /\/schema\.sql ist ÖFFENTLICH abrufbar/.test(res.out), 'live-check: erkennt öffentlich abrufbare interne Datei (schema.sql)');

  const dead = await live('http://127.0.0.1:' + await freePort());
  ok(dead.status === 1 && /Seite nicht erreichbar/.test(dead.out), 'live-check: nicht erreichbare Seite → verständliche Meldung');
  done();
})();

function done() {
  console.log(fails ? `${fails}/${n} FEHLER` : `test-ops: ${n} Prüfungen grün`);
  process.exit(fails ? 1 : 0);
}
