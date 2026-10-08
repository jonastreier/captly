// Tests für lead.php / confirm.php / unsubscribe.php gegen Mock-Supabase und Mock-SMTP (php -S, kein Netz).
// Aufruf: node test-lead.js  (überspringt sich ohne php)
const { spawn, spawnSync } = require('child_process');
const http = require('http');
const net = require('net');
const fs = require('fs');
const os = require('os');
const path = require('path');

if (spawnSync('php', ['-v']).status !== 0) { console.log('php nicht gefunden – test-lead übersprungen'); process.exit(0); }
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m); } };
const freePort = () => new Promise(r => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });

(async () => {
  const [sbPort, smtpPort, phpPort] = [await freePort(), await freePort(), await freePort()];
  const leads = []; const sbLog = [];
  const sb = http.createServer((req, res) => {
    let b = ''; req.on('data', d => b += d); req.on('end', () => {
      const u = new URL(req.url, 'http://x'); sbLog.push(req.method + ' ' + u.pathname + u.search + ' ' + b);
      const q = u.searchParams; const json = x => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(x)); };
      if (req.method === 'GET') { const em = (q.get('email') || '').replace('eq.', ''); return json(leads.filter(l => l.email === em)); }
      if (req.method === 'POST') { const row = Object.assign({ id: 'id' + (leads.length + 1) }, JSON.parse(b)); leads.push(row); res.statusCode = 201; return json([row]); }
      if (req.method === 'PATCH') {
        const p = JSON.parse(b); let hit = [];
        if (q.get('id')) hit = leads.filter(l => l.id === q.get('id').replace('eq.', ''));
        else if (q.get('email')) hit = leads.filter(l => l.email === q.get('email').replace('eq.', ''));
        else if (q.get('confirm_hash')) hit = leads.filter(l => l.confirm_hash === q.get('confirm_hash').replace('eq.', '') && !l.confirmed_at);
        hit.forEach(l => Object.assign(l, p)); return json(hit);
      }
      res.statusCode = 405; res.end();
    });
  }).listen(sbPort);
  const mails = [];
  const smtp = net.createServer(sock => {
    let data = false, buf = ''; sock.write('220 mock\r\n');
    sock.on('data', d => {
      buf += d;
      if (data) { if (/\r\n\.\r\n$/.test(buf)) { mails.push(buf); buf = ''; data = false; sock.write('250 ok\r\n'); } return; }
      buf.split('\r\n').filter(Boolean).forEach(l => {
        if (/^EHLO/.test(l)) sock.write('250 mock\r\n'); else if (/^DATA/.test(l)) { data = true; sock.write('354 go\r\n'); } else if (/^QUIT/.test(l)) sock.end('221 bye\r\n'); else sock.write('250 ok\r\n');
      });
      if (!data) buf = '';
    });
  }).listen(smtpPort);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crlead-'));
  for (const f of ['lead.php', 'confirm.php', 'unsubscribe.php', 'mail.php']) fs.copyFileSync(path.join(__dirname, f), path.join(dir, f));
  fs.writeFileSync(path.join(dir, 'config.php'), `<?php return ['SUPABASE_URL'=>'http://127.0.0.1:${sbPort}','SUPABASE_SERVICE_KEY'=>'svc','LEAD_SECRET'=>'geheim','SITE_URL'=>'http://127.0.0.1:${phpPort}','MAIL_FROM'=>'noreply@example.com','SMTP_HOST'=>'127.0.0.1','SMTP_PORT'=>${smtpPort},'SMTP_SECURE'=>'none'];`);
  const php = spawn('php', ['-S', '127.0.0.1:' + phpPort, '-t', dir], { env: Object.assign({}, process.env, { TMPDIR: dir }), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const base = 'http://127.0.0.1:' + phpPort + '/';
  const post = (f, body) => fetch(base + f, { method: 'POST', body: JSON.stringify(body) }).then(async r => ({ s: r.status, j: await r.json().catch(() => null) }));

  try {
    // 1) Anmeldung → Bestätigungsmail mit Abmelde-Link + List-Unsubscribe-Header
    const r1 = await post('lead.php', { email: 'Anna@Example.com', newsletter: true, consent_text: 'ok', lang: 'de-CH' });
    ok(r1.s === 200 && r1.j.ok && r1.j.confirm_mail === true, 'lead: 200 + Mail verschickt');
    ok(mails.length === 1, 'genau 1 Mail im Mock-SMTP');
    const raw = mails[0] || '';
    const body = Buffer.from((raw.split('\r\n\r\n')[1] || '').replace(/\r\n|\r?\n\.\r?\n?$/g, ''), 'base64').toString('utf8');
    const m = body.match(/http:\/\/127\.0\.0\.1:\d+\/api\/unsubscribe\?e=([\w-]+)&s=([0-9a-f]{32})/);
    ok(!!m, 'Mailtext enthält signierten Abmelde-Link');
    ok(/List-Unsubscribe: <http/.test(raw) && /List-Unsubscribe-Post: List-Unsubscribe=One-Click/.test(raw), 'List-Unsubscribe-Header (One-Click)');
    ok(Buffer.from(m[1], 'base64').toString() === 'anna@example.com', 'Link kodiert die kleingeschriebene Adresse');
    const url = base + 'unsubscribe.php?e=' + m[1] + '&s=' + m[2];

    // 2) Bestätigung (DOI) nicht kaputt
    const tok = body.match(/api\/confirm\?t=([a-f0-9]{48})/);
    const c = await fetch(base + 'confirm.php?t=' + tok[1]); ok(c.status === 200 && /bestätigt|confirmed/i.test(await c.text()) && !!leads[0].confirmed_at, 'confirm setzt confirmed_at');

    // 3) GET meldet NICHT ab (Mail-Scanner), zeigt nur die Frage
    const g = await fetch(url); const gt = await g.text();
    ok(g.status === 200 && /<form method="post"/.test(gt) && !leads[0].unsubscribed_at, 'GET zeigt Bestätigung, ändert nichts');

    // 4) Manipulierte Signatur / Adresse → ungültig, nichts geschrieben
    const before = sbLog.length;
    const bad = await fetch(base + 'unsubscribe.php?e=' + m[1] + '&s=' + '0'.repeat(32), { method: 'POST' });
    ok(/nicht gültig|not valid/i.test(await bad.text()) && !leads[0].unsubscribed_at && sbLog.length === before, 'falsche Signatur: kein DB-Zugriff');
    const other = Buffer.from('opfer@example.com').toString('base64url');
    const bad2 = await fetch(base + 'unsubscribe.php?e=' + other + '&s=' + m[2], { method: 'POST' });
    ok(/nicht gültig|not valid/i.test(await bad2.text()) && sbLog.length === before, 'Signatur einer anderen Adresse wird abgelehnt');

    // 5) POST (Formular bzw. One-Click) meldet ab
    const p = await fetch(url, { method: 'POST', body: 'List-Unsubscribe=One-Click', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    ok(p.status === 200 && /Abgemeldet|unsubscribed/i.test(await p.text()) && !!leads[0].unsubscribed_at, 'POST setzt unsubscribed_at');
    const p2 = await fetch(url, { method: 'POST' }); ok(p2.status === 200, 'zweites Abmelden ist idempotent');

    // 6) Ohne Secret/Service-Key kein Link, keine Abmeldung
    const nl = await fetch(base + 'unsubscribe.php', { method: 'POST' }); ok(/nicht gültig|not valid/i.test(await nl.text()), 'ohne Parameter: ungültig');
  } finally { php.kill(); sb.close(); smtp.close(); fs.rmSync(dir, { recursive: true, force: true }); }
  console.log(fails ? `${fails}/${n} FEHLER` : `test-lead: ${n} Prüfungen grün`);
  process.exit(fails ? 1 : 0);
})();
