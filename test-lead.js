// Tests für lead.php / confirm.php / unsubscribe.php / contact.php gegen Mock-Supabase und Mock-SMTP (php -S, kein Netz).
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
  for (const f of ['lead.php', 'confirm.php', 'unsubscribe.php', 'contact.php', 'mail.php']) fs.copyFileSync(path.join(__dirname, f), path.join(dir, f));
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

    // 7) Kontaktformular: Mail an contact@ mit Reply-To, Spam-Schutz (Honeypot, Zeitstempel, Rate-Limit), nichts in der DB
    {
      const dbBefore = sbLog.length, mBefore = mails.length;
      const form = (extra) => new URLSearchParams(Object.assign({ name: 'Anna', email: 'Anna@Example.com', message: 'Hallo, ich habe eine Frage zum Export.', website: '', t: tokC }, extra));
      const sendC = (f, q) => fetch(base + 'contact.php' + (q || '?lang=de'), { method: 'POST', body: f });
      const gc = await fetch(base + 'contact.php', { headers: { 'Accept-Language': 'de-CH' } }); const gct = await gc.text();
      ok(gc.status === 200 && /<form method="post"/.test(gct) && /Kontakt/.test(gct) && /name="website"/.test(gct) && /noindex/.test(gct), 'contact: GET zeigt deutsches Formular mit Honeypot, noindex');
      var tokC = (gct.match(/name="t" value="([^"]+)"/) || [])[1] || '';
      ok(/^\d+\.[0-9a-f]{24}$/.test(tokC), 'contact: Formular enthält signierten Zeitstempel');
      const en = await (await fetch(base + 'contact.php?lang=en', { headers: { 'Accept-Language': 'de' } })).text(); ok(/Your email address/.test(en), 'contact: ?lang=en überstimmt den Browser');
      // zu schnell (Zeitstempel < 4 s): Danke-Seite, aber keine Mail
      const fast = await sendC(form()); ok(fast.status === 200 && /Danke/.test(await fast.text()) && mails.length === mBefore, 'contact: zu schnell abgeschickt → keine Mail');
      await new Promise(r => setTimeout(r, 4300));
      const bot = await sendC(form({ website: 'http://spam.example' })); ok(bot.status === 200 && mails.length === mBefore, 'contact: Honeypot gefüllt → keine Mail');
      const forged = await sendC(form({ t: '1.' + '0'.repeat(24) })); ok(forged.status === 200 && mails.length === mBefore, 'contact: gefälschter Zeitstempel → keine Mail');
      const badMail = await sendC(form({ email: 'keine-adresse' })); const bmt = await badMail.text(); ok(/gültige E-Mail/.test(bmt) && /value="Anna"/.test(bmt) && mails.length === mBefore, 'contact: ungültige Adresse → Fehler, Eingabe bleibt erhalten');
      const empty = await sendC(form({ message: ' ' })); ok(/Nachricht/.test(await empty.text()) && mails.length === mBefore, 'contact: leere Nachricht → Fehler');
      const good = await sendC(form()); ok(good.status === 200 && /Danke/.test(await good.text()) && mails.length === mBefore + 1, 'contact: gültige Anfrage → Danke + genau 1 Mail');
      const craw = mails[mails.length - 1] || '';
      const cbody = Buffer.from((craw.split('\r\n\r\n')[1] || '').replace(/\r\n|\r?\n\.\r?\n?$/g, ''), 'base64').toString('utf8');
      ok(/To: <contact@captionrush\.com>/.test(craw) && /Reply-To: <anna@example\.com>/.test(craw), 'contact: Mail geht an contact@ mit Reply-To der Absenderin');
      ok(/Name: Anna/.test(cbody) && /E-Mail: anna@example\.com/.test(cbody) && /Frage zum Export/.test(cbody), 'contact: Mailtext enthält Name, Adresse, Nachricht');
      const inj = await sendC(form({ email: 'x@example.com\r\nBcc: opfer@example.com', message: 'Header-Einschleusung' })); await inj.text();
      ok(!mails.slice(mBefore).some(m => /Bcc:/i.test(m.split('\r\n\r\n')[0])), 'contact: keine Header-Einschleusung über die Adresse');
      for (let i = 0; i < 4; i++) await (await sendC(form())).text();
      const lim = await sendC(form()); ok(lim.status === 429 && /Stunde|hour/.test(await lim.text()), 'contact: 6. Nachricht pro Stunde → 429');
      ok(sbLog.length === dbBefore, 'contact: nichts in der Datenbank gespeichert');
    }
  } finally { php.kill(); sb.close(); smtp.close(); fs.rmSync(dir, { recursive: true, force: true }); }
  console.log(fails ? `${fails}/${n} FEHLER` : `test-lead: ${n} Prüfungen grün`);
  process.exit(fails ? 1 : 0);
})();
