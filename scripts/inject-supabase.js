// Setzt im Upload-Paket (dist/) die öffentliche Supabase-Adresse + den Publishable Key aus den GitHub-Secrets
// SUPABASE_URL / SUPABASE_ANON_KEY ein (nach scripts/build-dist.js). So braucht ein neues Supabase-Projekt keine
// Code-Änderung. Beide leer → nichts tun (es gelten die Werte aus captly.html). Nie den service_role-Key hier eintragen.
const fs = require('fs');
const path = require('path');
const url = String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const key = String(process.env.SUPABASE_ANON_KEY || '').trim();
if (!url && !key) { console.log('Supabase: Werte aus captly.html (keine Secrets SUPABASE_URL/SUPABASE_ANON_KEY gesetzt)'); process.exit(0); }
const fail = m => { console.error('✗ ' + m); process.exit(1); };
if (!url || !key) fail('SUPABASE_URL und SUPABASE_ANON_KEY nur zusammen setzen (beide oder keines).');
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) fail('SUPABASE_URL sieht nicht wie https://<projekt>.supabase.co aus: ' + url);
if (/^sb_secret_|service_role/.test(key) || (/^eyJ/.test(key) && /service_role/.test(Buffer.from(key.split('.')[1] || '', 'base64').toString()))) {
  fail('SUPABASE_ANON_KEY ist der geheime service_role-Schlüssel — hier gehört der öffentliche Publishable/anon-Key hin.');
}
if (!/^(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_.-]+)$/.test(key)) fail('SUPABASE_ANON_KEY hat ein unerwartetes Format.');
const dist = path.join(__dirname, '..', 'dist');
for (const f of ['captly.html', 'captly.de.html']) {
  const p = path.join(dist, f);
  let s = fs.readFileSync(p, 'utf8'), n = 0;
  s = s.replace(/(var SUPABASE_URL\s*=\s*)'[^']*'/, (m, a) => { n++; return a + "'" + url + "'"; });
  s = s.replace(/(var SUPABASE_ANON_KEY\s*=\s*)'[^']*'/, (m, a) => { n++; return a + "'" + key + "'"; });
  if (n !== 2) fail(f + ': SUPABASE_URL/SUPABASE_ANON_KEY-Zeilen nicht gefunden');
  fs.writeFileSync(p, s);
}
console.log('✓ Supabase-Projekt eingesetzt: ' + url);
