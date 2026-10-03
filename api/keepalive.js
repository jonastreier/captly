// Täglicher Vercel-Cron (vercel.json → crons): hält das Supabase-Gratisprojekt wach.
// Supabase pausiert Free-Projekte nach ~7 Tagen ohne Datenbank-Aktivität; dann scheitern Login und das
// Speichern der Download-E-Mails. Eine kleine REST-Abfrage zählt als Aktivität. Liest nichts Sensibles:
// die Tabelle leads ist per RLS nur beschreibbar, die Abfrage liefert daher immer [].
// URL/Key sind dieselben öffentlichen Werte wie im Frontend (überschreibbar per Env).
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tghodbtdraqkfwcmedcv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_3apqJNM-Ew2sstAQRpbpeg_p5p_Ho3g';

module.exports = async function handler(req, res) {
  // Vercel schickt bei gesetztem CRON_SECRET „Authorization: Bearer <secret>“ mit — dann nur den Cron zulassen.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== 'Bearer ' + secret) {
    res.statusCode = 401; return res.end('unauthorized');
  }
  const out = {};
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/leads?select=id&limit=1', { headers: { apikey: SUPABASE_ANON_KEY } });
    out.db = r.status;
  } catch (e) { out.db = 'error'; }
  try {
    const r = await fetch(SUPABASE_URL + '/auth/v1/health', { headers: { apikey: SUPABASE_ANON_KEY } });
    out.auth = r.status;
  } catch (e) { out.auth = 'error'; }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = out.db === 200 ? 200 : 502;
  res.end(JSON.stringify(out));
};
