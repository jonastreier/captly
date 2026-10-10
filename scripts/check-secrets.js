// Prüft vor dem Deploy, ob alle GitHub-Secrets da und plausibel sind — und nennt ALLE fehlenden auf einmal
// (statt einen nach dem anderen). Wird in .github/workflows/deploy.yml als erster Schritt aufgerufen.
// Lokal testen: node scripts/check-secrets.js   (liest process.env)
const e = process.env;
const has = k => typeof e[k] === 'string' && e[k].trim() !== '';

// [Name, wofür, woher]
const REQUIRED = [
  ['FTP_SERVER', 'Upload auf Hostpoint', 'Hostpoint → FTP-Einstellungen (Servername)'],
  ['FTP_USERNAME', 'Upload auf Hostpoint', 'Hostpoint → FTP-Benutzer'],
  ['FTP_PASSWORD', 'Upload auf Hostpoint', 'Hostpoint → FTP-Passwort'],
  ['GROQ_API_KEY', 'Transkription (Untertitel)', 'console.groq.com → API Keys (beginnt mit gsk_)'],
  ['SUPABASE_SERVICE_KEY', 'E-Mail-Liste, Fehlerberichte, Abos (nur Server)', 'Supabase → Project Settings → API → service_role'],
  ['SMTP_HOST', 'Mailversand (Bestätigungen, Kontaktformular)', 'Hostpoint-Postfach noreply@ → SMTP-Server'],
  ['SMTP_USER', 'Mailversand', 'volle Adresse noreply@captionrush.com'],
  ['SMTP_PASS', 'Mailversand', 'Passwort des Postfachs noreply@'],
  ['LEAD_SECRET', 'Signiert Abmelde-Links und Kontaktformular', 'selbst erzeugen: openssl rand -hex 32 (Terminal) oder Passwortmanager'],
];
const RECOMMENDED = [
  ['FTP_DIR', 'Zielordner auf dem Server (sonst ./ )', 'z. B. ./www/captionrush.com/ (mit / am Ende)'],
  ['SMTP_PORT', 'Mail-Port (sonst 465)', '465'],
  ['MAIL_FROM', 'Absenderadresse (sonst contact@captionrush.com)', 'noreply@captionrush.com'],
  ['ALERT_URL', 'Push-Alarm bei Groq-Limit/Fehlern', 'https://ntfy.sh/<dein-geheimes-thema>'],
];

const errors = [], warns = [];
for (const [k, why, from] of REQUIRED) if (!has(k)) errors.push(`  ✗ ${k.padEnd(22)} fehlt — ${why}\n      woher: ${from}`);
for (const [k, why, from] of RECOMMENDED) if (!has(k)) warns.push(`  · ${k.padEnd(22)} nicht gesetzt — ${why} (${from})`);

// Plausibilität (nur wenn gesetzt)
if (has('LEAD_SECRET') && e.LEAD_SECRET.trim().length < 24) errors.push('  ✗ LEAD_SECRET           zu kurz (mindestens 24 Zeichen), sonst lassen sich Abmelde-Links erraten');
if (has('GROQ_API_KEY') && !/^gsk_/.test(e.GROQ_API_KEY.trim())) warns.push('  · GROQ_API_KEY          beginnt nicht mit gsk_ — richtiger Schlüssel?');
if (has('SUPABASE_SERVICE_KEY') && /anon|publishable/i.test(e.SUPABASE_SERVICE_KEY)) errors.push('  ✗ SUPABASE_SERVICE_KEY  sieht nach dem öffentlichen (anon/publishable) Schlüssel aus — hier gehört der service_role-Schlüssel hin');
if (has('FTP_DIR') && !/\/$/.test(e.FTP_DIR.trim())) warns.push('  · FTP_DIR               endet nicht mit / — Pfad mit / am Ende angeben (z. B. ./www/captionrush.com/)');
if (has('SMTP_PORT') && !/^\d{2,5}$/.test(e.SMTP_PORT.trim())) errors.push('  ✗ SMTP_PORT             keine Zahl: ' + e.SMTP_PORT);
if (has('MAIL_FROM') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.MAIL_FROM.trim())) errors.push('  ✗ MAIL_FROM             keine gültige E-Mail-Adresse');
if (has('ALERT_URL') && !/^https:\/\//.test(e.ALERT_URL.trim())) warns.push('  · ALERT_URL             sollte mit https:// beginnen');

console.log('Secrets-Prüfung (Deploy)');
if (errors.length) {
  console.log('\nFEHLT oder falsch — bitte in GitHub eintragen (Repo → Settings → Secrets and variables → Actions → New repository secret):\n');
  console.log(errors.join('\n'));
}
if (warns.length) console.log('\nEmpfohlen / Hinweise:\n' + warns.join('\n'));
if (errors.length) {
  console.log('\nNach dem Eintragen: Actions → Deploy → «Run workflow». Anleitung: docs/START-HIER.md');
  process.exit(1);
}
console.log('\n✓ Alle Pflicht-Secrets vorhanden.');
