// Schreibt dist/config.php aus Umgebungsvariablen (GitHub-Secrets). Der Key landet nie im Repo.
// Pflicht: GROQ_API_KEY. Alle anderen optional (siehe config.example.php).
const fs = require('fs');
const path = require('path');
const e = process.env;
if (!e.GROQ_API_KEY) { console.error('GROQ_API_KEY fehlt (GitHub → Settings → Secrets → Actions).'); process.exit(1); }
// Abos erst live, wenn die Rechtstexte den Verkäufer nennen (Audit 2026-10-16): ohne «Paddle» in Terms und beiden
// Datenschutzerklärungen bricht der Deploy ab, statt Kunden ohne Kauf-/Rückerstattungsregeln abzurechnen.
if (e.BILLING_ENABLED === '1' || e.BILLING_ENABLED === 'true') {
  const miss = ['terms.html', 'privacy.html', 'datenschutz.html'].filter(f => { try { return !/Paddle/.test(fs.readFileSync(path.join(__dirname, '..', f), 'utf8')); } catch (x) { return true; } });
  if (miss.length) { console.error('BILLING_ENABLED, aber ' + miss.join(', ') + ' nennt Paddle nicht (Kauf, Rückerstattung, Datenschutz) — erst Texte ergänzen.'); process.exit(1); }
}
const q = v => "'" + String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const num = (v, d) => (v !== undefined && v !== '' && !isNaN(+v)) ? +v : d;
const cfg = [
  ['GROQ_API_KEY', q(e.GROQ_API_KEY)],
  ['CORS_ORIGIN', q(e.CORS_ORIGIN || '')],
  ['RATE_LIMIT_PER_HOUR', num(e.RATE_LIMIT_PER_HOUR, 120)],
  ['MAX_AUDIO_SEC_PER_HOUR', num(e.MAX_AUDIO_SEC_PER_HOUR, 1800)],
  ['MAX_AUDIO_SEC_PER_DAY_PER_MODEL', num(e.MAX_AUDIO_SEC_PER_DAY_PER_MODEL, 27000)],
  ['MAX_AUDIO_SEC_PER_IP_DAY', num(e.MAX_AUDIO_SEC_PER_IP_DAY, 3600)],
  ['MAX_UPLOAD_BYTES', num(e.MAX_UPLOAD_BYTES, 4718592)],
  ['LLM_CALLS_PER_IP_DAY', num(e.LLM_CALLS_PER_IP_DAY, 300)],
  ['LLM_CALLS_PER_DAY_TOTAL', num(e.LLM_CALLS_PER_DAY_TOTAL, 4000)],
  ['LEAD_MAILS_PER_DAY', num(e.LEAD_MAILS_PER_DAY, 300)],
  ['ALERT_URL', q(e.ALERT_URL || '')],
  ['REQUIRE_LOGIN', 'false'],
  ['SUPABASE_URL', q(e.SUPABASE_URL || 'https://tghodbtdraqkfwcmedcv.supabase.co')],
  ['SUPABASE_ANON_KEY', q(e.SUPABASE_ANON_KEY || 'sb_publishable_3apqJNM-Ew2sstAQRpbpeg_p5p_Ho3g')],
  // Lead-Erfassung (lead.php): service_role-Key NUR hier auf dem Server, nie im Frontend
  ['SUPABASE_SERVICE_KEY', q(e.SUPABASE_SERVICE_KEY || '')],
  ['SITE_URL', q(e.SITE_URL || 'https://gluephs.com')],
  ['MAIL_FROM', q(e.MAIL_FROM || 'hello@gluephs.com')],
  ['MAIL_FROM_NAME', q(e.MAIL_FROM_NAME || 'Gluephs')],
  ['SMTP_HOST', q(e.SMTP_HOST || '')],
  ['SMTP_PORT', num(e.SMTP_PORT, 465)],
  ['SMTP_USER', q(e.SMTP_USER || '')],
  ['SMTP_PASS', q(e.SMTP_PASS || '')],
  ['LEAD_SECRET', q(e.LEAD_SECRET || '')],
  // Abos (Standard aus). Werte kommen aus GitHub-Secrets/-Variablen; ohne BILLING_ENABLED=1 ändert sich nichts.
  ['BILLING_ENABLED', e.BILLING_ENABLED === '1' || e.BILLING_ENABLED === 'true' ? 'true' : 'false'],
  ['ANON_SEC_PER_DAY', num(e.ANON_SEC_PER_DAY, 600)],
  ['FREE_CLEAN_VIDEOS_PER_DAY', num(e.FREE_CLEAN_VIDEOS_PER_DAY, 2)],
  ['PADDLE_ENV', q(e.PADDLE_ENV === 'production' ? 'production' : 'sandbox')],
  ['PADDLE_CLIENT_TOKEN', q(e.PADDLE_CLIENT_TOKEN || '')],
  ['PADDLE_PRICE_CREATOR', q(e.PADDLE_PRICE_CREATOR || '')],
  ['PADDLE_PRICE_PRO', q(e.PADDLE_PRICE_PRO || '')],
  ['PADDLE_API_KEY', q(e.PADDLE_API_KEY || '')],
  ['PADDLE_WEBHOOK_SECRET', q(e.PADDLE_WEBHOOK_SECRET || '')],
  ['PADDLE_TOLERANCE_SEC', num(e.PADDLE_TOLERANCE_SEC, 300)],
];
const php = '<?php\n// Automatisch erzeugt von scripts/write-config.js (GitHub-Action). Nicht bearbeiten, nicht committen.\nreturn [\n'
  + cfg.map(([k, v]) => '  ' + q(k) + ' => ' + v + ',').join('\n') + '\n];\n';
const dir = path.join(__dirname, '..', 'dist');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'config.php'), php, { mode: 0o600 });
console.log('dist/config.php geschrieben (' + cfg.length + ' Werte, Secrets nicht ausgegeben)');
