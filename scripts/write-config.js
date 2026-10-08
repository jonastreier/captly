// Schreibt dist/config.php aus Umgebungsvariablen (GitHub-Secrets). Der Key landet nie im Repo.
// Pflicht: GROQ_API_KEY. Alle anderen optional (siehe config.example.php).
const fs = require('fs');
const path = require('path');
const e = process.env;
if (!e.GROQ_API_KEY) { console.error('GROQ_API_KEY fehlt (GitHub → Settings → Secrets → Actions).'); process.exit(1); }
const q = v => "'" + String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const num = (v, d) => (v !== undefined && v !== '' && !isNaN(+v)) ? +v : d;
const cfg = [
  ['GROQ_API_KEY', q(e.GROQ_API_KEY)],
  ['CORS_ORIGIN', q(e.CORS_ORIGIN || '')],
  ['RATE_LIMIT_PER_HOUR', num(e.RATE_LIMIT_PER_HOUR, 120)],
  ['MAX_AUDIO_SEC_PER_HOUR', num(e.MAX_AUDIO_SEC_PER_HOUR, 1800)],
  ['ALERT_URL', q(e.ALERT_URL || '')],
  ['REQUIRE_LOGIN', 'false'],
  ['SUPABASE_URL', q(e.SUPABASE_URL || 'https://tghodbtdraqkfwcmedcv.supabase.co')],
  ['SUPABASE_ANON_KEY', q(e.SUPABASE_ANON_KEY || 'sb_publishable_3apqJNM-Ew2sstAQRpbpeg_p5p_Ho3g')],
  // Lead-Erfassung (lead.php): service_role-Key NUR hier auf dem Server, nie im Frontend
  ['SUPABASE_SERVICE_KEY', q(e.SUPABASE_SERVICE_KEY || '')],
  ['SITE_URL', q(e.SITE_URL || 'https://captionrush.com')],
  ['MAIL_FROM', q(e.MAIL_FROM || 'contact@captionrush.com')],
  ['MAIL_FROM_NAME', q(e.MAIL_FROM_NAME || 'CaptionRush')],
  ['SMTP_HOST', q(e.SMTP_HOST || '')],
  ['SMTP_PORT', num(e.SMTP_PORT, 465)],
  ['SMTP_USER', q(e.SMTP_USER || '')],
  ['SMTP_PASS', q(e.SMTP_PASS || '')],
  ['LEAD_SECRET', q(e.LEAD_SECRET || '')],
];
const php = '<?php\n// Automatisch erzeugt von scripts/write-config.js (GitHub-Action). Nicht bearbeiten, nicht committen.\nreturn [\n'
  + cfg.map(([k, v]) => '  ' + q(k) + ' => ' + v + ',').join('\n') + '\n];\n';
const dir = path.join(__dirname, '..', 'dist');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'config.php'), php, { mode: 0o600 });
console.log('dist/config.php geschrieben (' + cfg.length + ' Werte, Secrets nicht ausgegeben)');
