// Prüft die LIVE-Seite nach dem Deploy und sagt, was noch fehlt.
// Aufruf: node scripts/live-check.js [https://captionrush.com]      (auch als GitHub-Action «Live-Check»)
// Exit 1, wenn eine Pflichtprüfung (✗) fehlschlägt. Hinweise (!) sind nicht fatal.
const dns = require('dns').promises;

const BASE = (process.argv.slice(2).find(a => !a.startsWith('--')) || process.env.SITE_URL || 'https://captionrush.com').replace(/\/+$/, '');
const HOST = new URL(BASE).hostname;
const TIMEOUT = 20000;
const LOCAL = process.argv.includes('--local'); // Test gegen php -S: keine HTTPS-/www-/DNS-Prüfungen
let bad = 0, warn = 0, ok = 0;
const say = (sym, msg, hint) => { console.log(`${sym} ${msg}${hint ? '\n    → ' + hint : ''}`); };
const pass = m => { ok++; say('✓', m); };
const fail = (m, h) => { bad++; say('✗', m, h); };
const note = (m, h) => { warn++; say('!', m, h); };

async function get(path, opt = {}) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const r = await fetch(path.startsWith('http') ? path : BASE + path, Object.assign({ redirect: 'manual', signal: ctl.signal, headers: { 'User-Agent': 'captionrush-live-check' } }, opt));
    const text = await r.text().catch(() => '');
    let json = null; try { json = JSON.parse(text); } catch (e) { /* kein JSON */ }
    return { status: r.status, headers: r.headers, text, json };
  } catch (e) {
    return { error: (e && e.cause && (e.cause.code || e.cause.message)) || (e && e.message) || String(e) };
  } finally { clearTimeout(t); }
}

(async () => {
  console.log(`Live-Check für ${BASE}\n`);

  // 1) Erreichbar + HTTPS
  const home = await get('/');
  if (home.error) {
    fail('Seite nicht erreichbar: ' + home.error, /CERT|SSL|self|certificate/i.test(home.error) ? 'SSL-Zertifikat fehlt oder ist ungültig: Hostpoint → Domain → SSL (Let\'s Encrypt) einschalten.' : 'Domain noch nicht mit dem Hosting verbunden oder DNS noch nicht umgestellt (kann einige Stunden dauern).');
    console.log(`\n${bad} Fehler — weitere Prüfungen übersprungen.`); process.exit(1);
  }
  if (home.status === 200 && /CaptionRush/i.test(home.text)) pass('Startseite lädt (HTTPS, Zertifikat gültig)');
  else fail(`Startseite liefert Status ${home.status} oder nicht CaptionRush`, 'Wurde der Deploy (Actions → Deploy) erfolgreich beendet? Zielordner (FTP_DIR) prüfen: dort muss captly.html liegen.');
  if (!LOCAL) { if (home.headers && /max-age/i.test(home.headers.get('strict-transport-security') || '')) pass('HSTS-Header gesetzt'); else note('HSTS-Header fehlt', '.htaccess wurde evtl. nicht hochgeladen oder mod_headers ist aus.'); }

  // 2) http → https, www → ohne www
  if (!LOCAL) {
  const h = await get('http://' + HOST + '/');
  if (h.status >= 301 && h.status <= 308 && /^https:\/\//.test(h.headers.get('location') || '')) pass('http:// leitet auf https:// weiter');
  else note('http:// leitet nicht auf https:// weiter' + (h.error ? ' (' + h.error + ')' : ' (Status ' + h.status + ')'), 'Normal, solange Port 80 nicht erreichbar ist; sonst .htaccess prüfen.');
  const w = await get('https://www.' + HOST.replace(/^www\./, '') + '/');
  if (w.status >= 301 && w.status <= 308) pass('www. leitet weiter'); else note('www.' + HOST + ' nicht erreichbar oder ohne Weiterleitung', 'Optional: im Hostpoint-DNS einen www-Eintrag auf dieselbe Adresse setzen.');
  }

  // 3) Seiten
  for (const [p, re] of [['/de', /Untertitel/i], ['/impressum', /Impressum/i], ['/datenschutz', /Datenschutz/i], ['/privacy', /Privacy/i], ['/terms', /Terms|Nutzungsbedingungen/i], ['/kontakt', /name="message"/], ['/contact', /name="message"/]]) {
    const r = await get(p);
    if (r.status === 200 && re.test(r.text)) pass(p + ' lädt'); else fail(`${p} liefert Status ${r.error || r.status} oder falschen Inhalt`, '.htaccess nicht aktiv? Bei /kontakt: contact.php fehlt oder PHP läuft nicht.');
  }
  const k = await get('/kontakt');
  if (k.status === 200 && /name="t" value="\d+\.[0-9a-f]{24}"/.test(k.text)) pass('Kontaktformular hat Spam-Schutz-Token (LEAD_SECRET gesetzt)');
  else if (k.status === 200) fail('Kontaktformular ohne Token — LEAD_SECRET fehlt in config.php', 'GitHub-Secret LEAD_SECRET eintragen und neu deployen.');

  // 4) API (GET → Statusmeldung)
  const tr = await get('/api/transcribe');
  if (tr.json && tr.json.ok && tr.json.configured) pass('Transkription: bereit (Groq-Key hinterlegt)');
  else if (tr.json && tr.json.ok) fail('Transkription: erreichbar, aber Groq-Key fehlt', 'Secret GROQ_API_KEY eintragen, neu deployen.');
  else fail('Transkription (/api/transcribe) nicht erreichbar (Status ' + (tr.error || tr.status) + ')', 'PHP-Version ≥ 8.1 mit curl? Hostpoint → PHP-Einstellungen.');
  for (const [p, name, key] of [['/api/lead', 'E-Mail-Erfassung', 'SUPABASE_SERVICE_KEY'], ['/api/log', 'Fehlerberichte', 'SUPABASE_SERVICE_KEY']]) {
    const r = await get(p);
    if (r.json && r.json.ok && r.json.configured) pass(name + ': bereit');
    else if (r.json && r.json.ok) fail(name + ': erreichbar, aber Supabase nicht konfiguriert', 'Secret ' + key + ' eintragen, neu deployen.');
    else fail(name + ' (' + p + ') nicht erreichbar (Status ' + (r.error || r.status) + ')');
  }
  const st = await get('/api/stat');
  if (st.json && st.json.configured) pass('Style-Zähler: bereit'); else if (st.json) note('Style-Zähler: Supabase nicht konfiguriert', 'Secret SUPABASE_SERVICE_KEY und schema.sql in Supabase ausführen.'); else fail('/api/stat nicht erreichbar');
  const pl = await get('/api/plan');
  if (pl.json && pl.json.enabled === false) pass('Abos: aus (richtig für den Start)'); else if (pl.json && pl.json.enabled) note('Abos sind EINGESCHALTET', 'Gewollt? Sonst Variable BILLING_ENABLED entfernen und neu deployen.'); else fail('/api/plan nicht erreichbar (Status ' + (pl.error || pl.status) + ')');

  // 5) Interne Dateien dürfen nie öffentlich sein
  for (const p of ['/config.php', '/config.example.php', '/schema.sql', '/server.js', '/test-captly.js', '/.htaccess', '/CLAUDE.md']) {
    const r = await get(p);
    if (r.status === 200 && /\.php$/.test(p) && r.text.trim() === '') pass(p + ' wird nur ausgeführt (leere Antwort, nichts sichtbar)');
    else if (r.status === 200 && !/<html/i.test(r.text.slice(0, 200)) ) fail(`${p} ist ÖFFENTLICH abrufbar!`, 'Sofort prüfen: .htaccess hochgeladen? Hostpoint muss .htaccess auswerten (AllowOverride).');
    else pass(p + ' ist nicht abrufbar (' + (r.error || r.status) + ')');
  }
  const c = await get('/config.php');
  if (c.status === 200 && /GROQ_API_KEY|SERVICE_KEY|SMTP_PASS/.test(c.text)) fail('config.php verrät Geheimnisse', 'Sofort Schlüssel wechseln (Groq, Supabase, SMTP) und .htaccess prüfen.');

  // 6) Mail-DNS (SPF, DMARC, MX) für die Domain der Absenderadresse
  if (!LOCAL) {
  const mailDomain = HOST.replace(/^www\./, '');
  try { const mx = await dns.resolveMx(mailDomain); if (mx.length) pass('MX-Eintrag vorhanden (' + mx.map(m => m.exchange).join(', ') + ')'); else fail('Kein MX-Eintrag', 'Hostpoint-DNS: Mail-Server-Einträge (MX) setzen, sonst kommt keine Mail an contact@.'); }
  catch (e) { fail('Kein MX-Eintrag für ' + mailDomain + ' (' + e.code + ')', 'Hostpoint → Domain → DNS: MX-Einträge setzen (meist per Klick «E-Mail aktivieren»).'); }
  const txt = async n => { try { return (await dns.resolveTxt(n)).map(a => a.join('')); } catch (e) { return []; } };
  const spf = (await txt(mailDomain)).filter(t => /^v=spf1/i.test(t));
  if (spf.length === 1) pass('SPF vorhanden: ' + spf[0].slice(0, 80)); else if (spf.length > 1) fail('Mehrere SPF-Einträge (nur einer erlaubt)', 'Zu einem einzigen Eintrag zusammenfassen.'); else fail('Kein SPF-Eintrag', 'Hostpoint → DNS-Zone → «Hostpoint-SPF-Eintrag hinzufügen».');
  const dm = (await txt('_dmarc.' + mailDomain)).filter(t => /^v=DMARC1/i.test(t));
  if (dm.length) pass('DMARC vorhanden: ' + dm[0].slice(0, 80)); else note('Kein DMARC-Eintrag', 'TXT-Eintrag _dmarc mit v=DMARC1; p=none; rua=mailto:contact@' + mailDomain + ' anlegen.');
  note('DKIM kann ich von aussen nicht prüfen', 'In Gmail eine Testmail von noreply@ öffnen → «Original anzeigen»: DKIM: PASS erwünscht.');
  }

  console.log(`\n${ok} ok · ${warn} Hinweise · ${bad} Fehler`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('Live-Check abgebrochen:', e); process.exit(2); });
