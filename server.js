// ═══════════════════════════════════════════════════════════════
// Captly Server v2 — komplettes Freemium-Backend, keine Dependencies (Node 22+)
//
// START:    OPENAI_API_KEY=sk-... node server.js
// Optional: PORT=8787  DB_PATH=./captly.db  FREE_PER_DAY=3  MAX_DAY_USD=5  MAX_MONTH_USD=50
//           RESEND_API_KEY=re_...  MAIL_FROM=login@deinedomain.ch   (Login-Mails; ohne Key → Code im Server-Log)
//           STRIPE_SECRET=sk_live_...  STRIPE_WEBHOOK_SECRET=whsec_...
//           STRIPE_PRICE_CREATOR=price_...  STRIPE_PRICE_PRO=price_...  STRIPE_PRICE_PACK=price_...
//           APP_URL=https://captly.deinedomain.ch   ADMIN_PASS=geheim   ALERT_USD=10
//
// Plan-Logik: ⚡ Fast läuft lokal im Browser (kostet dich 0, immer gratis).
// 💎 Perfect (POST /transcribe) ist die einzige Kostenquelle:
//   anonym  → FREE_PER_DAY Videos/Tag pro IP, dann 402
//   Free    → 10 Trial-Minuten einmalig, dann 402
//   Creator → 300 Min/Monat · Pro → 1500 Min/Monat (+ Minuten-Packs, nie automatisch)
// ═══════════════════════════════════════════════════════════════
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const KEY  = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 8787;
if (!KEY) { console.error('FEHLER: OPENAI_API_KEY fehlt.'); process.exit(1); }
const ENV = (k, d) => process.env[k] !== undefined ? process.env[k] : d;
const FREE_PER_DAY  = parseInt(ENV('FREE_PER_DAY', '3'));
const MAX_DAY_USD   = parseFloat(ENV('MAX_DAY_USD', '5'));
const MAX_MONTH_USD = parseFloat(ENV('MAX_MONTH_USD', '50'));
const ALERT_USD     = parseFloat(ENV('ALERT_USD', '10'));
const APP_URL       = ENV('APP_URL', 'http://localhost:' + PORT);

// ── DB ──
const db = new DatabaseSync(ENV('DB_PATH', './captly.db'));
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, created_at TEXT, trial_seconds_used INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER, created_at TEXT);
CREATE TABLE IF NOT EXISTS login_codes(email TEXT PRIMARY KEY, code TEXT, expires INTEGER, tries INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS subscriptions(user_id INTEGER PRIMARY KEY, stripe_customer_id TEXT, stripe_sub_id TEXT, plan TEXT DEFAULT 'free', status TEXT DEFAULT 'active', current_period_end TEXT);
CREATE TABLE IF NOT EXISTS usage_events(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, kind TEXT, seconds INTEGER, cost_usd REAL, created_at TEXT);
CREATE TABLE IF NOT EXISTS minute_packs(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, seconds_remaining INTEGER, purchased_at TEXT);
CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, payload_json TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS plans(id TEXT PRIMARY KEY, price_cents INTEGER, monthly_seconds INTEGER, trial_seconds INTEGER, max_projects INTEGER);
`);
// Plan-Defaults (Admin kann sie unter /admin ändern)
const seed = db.prepare('INSERT OR IGNORE INTO plans VALUES(?,?,?,?,?)');
seed.run('free', 0, 0, 600, 1);          // 10 Trial-Minuten, 1 Projekt
seed.run('creator', 900, 18000, 0, 20);  // 9 € · 300 Min · 20 Projekte
seed.run('pro', 2400, 90000, 0, -1);     // 24 € · 1500 Min · unbegrenzt

const now = () => new Date().toISOString();
const q = {
  userByEmail:  db.prepare('SELECT * FROM users WHERE email=?'),
  userById:     db.prepare('SELECT * FROM users WHERE id=?'),
  session:      db.prepare('SELECT user_id FROM sessions WHERE token=?'),
  sub:          db.prepare('SELECT * FROM subscriptions WHERE user_id=?'),
  plan:         db.prepare('SELECT * FROM plans WHERE id=?'),
  monthUse:     db.prepare("SELECT COALESCE(SUM(seconds),0) s FROM usage_events WHERE user_id=? AND created_at>=?"),
  monthSpend:   db.prepare("SELECT COALESCE(SUM(cost_usd),0) c FROM usage_events WHERE created_at>=?"),
  packs:        db.prepare('SELECT * FROM minute_packs WHERE user_id=? AND seconds_remaining>0 ORDER BY purchased_at'),
  projects:     db.prepare('SELECT id,title,updated_at FROM projects WHERE user_id=? ORDER BY updated_at DESC'),
  projCount:    db.prepare('SELECT COUNT(*) n FROM projects WHERE user_id=?'),
  projGet:      db.prepare('SELECT * FROM projects WHERE id=? AND user_id=?'),
};
const monthStart = () => new Date().toISOString().slice(0, 7) + '-01';

// ── Helpers ──
function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
async function readBody(req, limit) {
  const chunks = []; let len = 0;
  for await (const c of req) { len += c.length; if (len > (limit || 1e6)) throw new Error('too big'); chunks.push(c); }
  return Buffer.concat(chunks);
}
function authUser(req) {
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/);
  if (!m) return null;
  const s = q.session.get(m[1]);
  return s ? q.userById.get(s.user_id) : null;
}
function userState(u) {
  const sub  = q.sub.get(u.id) || { plan: 'free', status: 'active', current_period_end: null };
  const plan = q.plan.get(sub.plan) || q.plan.get('free');
  const used = q.monthUse.get(u.id, monthStart()).s;
  const packSecs  = q.packs.all(u.id).reduce((a, p) => a + p.seconds_remaining, 0);
  const trialLeft = Math.max(0, (q.plan.get('free').trial_seconds) - u.trial_seconds_used);
  const remaining = Math.max(0, plan.monthly_seconds - used) + packSecs + (sub.plan === 'free' ? trialLeft : 0);
  return { sub, plan, used, packSecs, trialLeft, remaining };
}
function deductSeconds(u, secs) {
  const st = userState(u); let rest = secs;
  if (st.sub.plan === 'free') {
    const t = Math.min(rest, st.trialLeft);
    db.prepare('UPDATE users SET trial_seconds_used=trial_seconds_used+? WHERE id=?').run(t, u.id); rest -= t;
  }
  const planLeft = Math.max(0, st.plan.monthly_seconds - st.used);
  rest = Math.max(0, rest - planLeft); // Plan-Minuten werden über usage_events gezählt
  for (const p of q.packs.all(u.id)) {
    if (rest <= 0) break;
    const take = Math.min(rest, p.seconds_remaining);
    db.prepare('UPDATE minute_packs SET seconds_remaining=seconds_remaining-? WHERE id=?').run(take, p.id); rest -= take;
  }
  db.prepare('INSERT INTO usage_events(user_id,kind,seconds,cost_usd,created_at) VALUES(?,?,?,?,?)')
    .run(u.id, 'transcribe', secs, secs / 60 * 0.006, now());
}
async function sendMail(to, subject, text) {
  if (!process.env.RESEND_API_KEY) { console.log('📧 [DEV] Mail an ' + to + ': ' + subject + ' — ' + text); return; }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: ENV('MAIL_FROM', 'captly@example.com'), to, subject, text })
  }).catch(e => console.error('Mail-Fehler', e));
}

// ── Missbrauchsschutz (anonym) ──
const hits = new Map(); const daily = new Map();
let daySpend = { day: '', usd: 0 }; let alerted = false;
function rateLimited(ip) {
  const t = Date.now(); const arr = (hits.get(ip) || []).filter(x => t - x < 600000);
  if (arr.length >= 10) { hits.set(ip, arr); return true; }
  arr.push(t); hits.set(ip, arr); if (hits.size > 5000) hits.clear(); return false;
}
function freeQuotaExceeded(ip) {
  const k = ip + '|' + new Date().toISOString().slice(0, 10);
  const n = daily.get(k) || 0;
  if (n >= FREE_PER_DAY) return true;
  daily.set(k, n + 1); if (daily.size > 20000) daily.clear(); return false;
}
function budgetExceeded(estUsd) {
  const day = new Date().toISOString().slice(0, 10);
  if (daySpend.day !== day) daySpend = { day, usd: 0 };
  const mSpend = q.monthSpend.get(monthStart()).c + daySpend.usd;
  if (mSpend + estUsd > MAX_MONTH_USD) return 'Monatsbudget erreicht';
  if (daySpend.usd + estUsd > MAX_DAY_USD) return 'Tagesbudget erreicht';
  daySpend.usd += estUsd;
  if (!alerted && mSpend > ALERT_USD) { alerted = true; sendMail(ENV('ALERT_EMAIL', ''), 'Captly Kosten-Alarm', 'Monats-API-Spend über ' + ALERT_USD + ' USD'); console.warn('⚠️ Kosten-Alarm: >' + ALERT_USD + ' USD diesen Monat'); }
  return null;
}

// ── Stripe (fertig verdrahtet; ohne Keys antwortet /billing sauber mit 501) ──
async function stripeCheckout(u, planId) {
  const prices = { creator: process.env.STRIPE_PRICE_CREATOR, pro: process.env.STRIPE_PRICE_PRO, pack: process.env.STRIPE_PRICE_PACK };
  if (!process.env.STRIPE_SECRET || !prices[planId]) return null;
  const body = new URLSearchParams({
    mode: planId === 'pack' ? 'payment' : 'subscription',
    success_url: APP_URL + '/?upgraded=1', cancel_url: APP_URL,
    'line_items[0][price]': prices[planId], 'line_items[0][quantity]': '1',
    customer_email: u.email, 'metadata[user_id]': String(u.id), 'metadata[plan]': planId,
  });
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST', headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET, 'Content-Type': 'application/x-www-form-urlencoded' }, body
  });
  return r.json();
}
function verifyStripeSig(raw, sigHeader) {
  const sec = process.env.STRIPE_WEBHOOK_SECRET; if (!sec) return false;
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')));
  const expected = crypto.createHmac('sha256', sec).update(parts.t + '.' + raw).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1 || '')); } catch (e) { return false; }
}

// ── HTTP ──
http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const u = new URL(req.url, 'http://x');
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?';
  try {

    // ── Auth: Magic-Code per Mail ──
    if (req.method === 'POST' && u.pathname === '/auth/request') {
      const { email } = JSON.parse(await readBody(req));
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || '')) return json(res, 400, { error: 'E-Mail ungültig' });
      if (rateLimited('auth:' + ip)) return json(res, 429, { error: 'Zu viele Versuche' });
      const code = String(crypto.randomInt(100000, 999999));
      db.prepare('INSERT OR REPLACE INTO login_codes VALUES(?,?,?,0)').run(email.toLowerCase(), code, Date.now() + 600000);
      await sendMail(email, 'Dein Captly Login-Code', 'Code: ' + code + ' (10 Min gültig)');
      return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && u.pathname === '/auth/verify') {
      const { email, code } = JSON.parse(await readBody(req));
      const row = db.prepare('SELECT * FROM login_codes WHERE email=?').get((email || '').toLowerCase());
      if (!row || row.expires < Date.now() || row.tries >= 5) return json(res, 401, { error: 'Code abgelaufen' });
      if (row.code !== String(code)) { db.prepare('UPDATE login_codes SET tries=tries+1 WHERE email=?').run(row.email); return json(res, 401, { error: 'Code falsch' }); }
      db.prepare('DELETE FROM login_codes WHERE email=?').run(row.email);
      let usr = q.userByEmail.get(row.email);
      if (!usr) {
        db.prepare('INSERT INTO users(email,created_at) VALUES(?,?)').run(row.email, now());
        usr = q.userByEmail.get(row.email);
        db.prepare('INSERT INTO subscriptions(user_id,plan) VALUES(?,?)').run(usr.id, 'free');
      }
      const token = crypto.randomBytes(32).toString('hex');
      db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(token, usr.id, now());
      return json(res, 200, { token, email: usr.email });
    }

    // ── Konto-Status ──
    if (req.method === 'GET' && u.pathname === '/me') {
      const usr = authUser(req); if (!usr) return json(res, 401, { error: 'auth' });
      const st = userState(usr);
      return json(res, 200, { email: usr.email, plan: st.sub.plan, remainingSeconds: st.remaining, usedSeconds: st.used, trialLeft: st.trialLeft, maxProjects: st.plan.max_projects });
    }

    // ── Projekte ──
    if (u.pathname === '/projects' || u.pathname.startsWith('/projects/')) {
      const usr = authUser(req); if (!usr) return json(res, 401, { error: 'auth' });
      const st = userState(usr);
      if (req.method === 'GET' && u.pathname === '/projects') return json(res, 200, q.projects.all(usr.id));
      if (req.method === 'POST' && u.pathname === '/projects') {
        const { title, payload } = JSON.parse(await readBody(req, 2e6));
        const n = q.projCount.get(usr.id).n;
        if (st.plan.max_projects >= 0 && n >= st.plan.max_projects)
          return json(res, 402, { error: 'project_limit', max: st.plan.max_projects });
        db.prepare('INSERT INTO projects(user_id,title,payload_json,updated_at) VALUES(?,?,?,?)').run(usr.id, title || 'Ohne Titel', JSON.stringify(payload), now());
        return json(res, 200, { ok: true });
      }
      const id = parseInt(u.pathname.split('/')[2]);
      if (req.method === 'GET') { const p = q.projGet.get(id, usr.id); return p ? json(res, 200, { id: p.id, title: p.title, payload: JSON.parse(p.payload_json) }) : json(res, 404, {}); }
      if (req.method === 'DELETE') { db.prepare('DELETE FROM projects WHERE id=? AND user_id=?').run(id, usr.id); return json(res, 200, { ok: true }); }
    }

    // ── Billing ──
    if (req.method === 'POST' && u.pathname === '/billing/checkout') {
      const usr = authUser(req); if (!usr) return json(res, 401, { error: 'auth' });
      const { plan } = JSON.parse(await readBody(req));
      const session = await stripeCheckout(usr, plan);
      if (!session) return json(res, 501, { error: 'Stripe noch nicht konfiguriert (STRIPE_SECRET + Price-IDs in env setzen).' });
      return json(res, 200, { url: session.url });
    }
    if (req.method === 'POST' && u.pathname === '/billing/webhook') {
      const raw = (await readBody(req)).toString();
      if (!verifyStripeSig(raw, req.headers['stripe-signature'] || '')) { res.writeHead(400); return res.end(); }
      const ev = JSON.parse(raw);
      const obj = ev.data.object;
      if (ev.type === 'checkout.session.completed') {
        const uid = parseInt(obj.metadata.user_id), plan = obj.metadata.plan;
        if (plan === 'pack') db.prepare('INSERT INTO minute_packs(user_id,seconds_remaining,purchased_at) VALUES(?,?,?)').run(uid, 6000, now());
        else db.prepare('UPDATE subscriptions SET plan=?, status=?, stripe_customer_id=?, stripe_sub_id=? WHERE user_id=?')
               .run(plan, 'active', obj.customer, obj.subscription, uid);
      }
      if (ev.type === 'customer.subscription.deleted')
        db.prepare("UPDATE subscriptions SET plan='free', status='canceled' WHERE stripe_sub_id=?").run(obj.id);
      res.writeHead(200); return res.end('{}');
    }

    // ── Admin (Basic-Auth) ──
    if (u.pathname === '/admin') {
      const pass = ENV('ADMIN_PASS', ''); const hdr = req.headers.authorization || '';
      if (!pass || hdr !== 'Basic ' + Buffer.from('admin:' + pass).toString('base64')) {
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="captly"' }); return res.end();
      }
      if (req.method === 'POST') {
        const p = JSON.parse(await readBody(req));
        db.prepare('UPDATE plans SET price_cents=?, monthly_seconds=?, trial_seconds=?, max_projects=? WHERE id=?')
          .run(p.price_cents, p.monthly_seconds, p.trial_seconds, p.max_projects, p.id);
        return json(res, 200, { ok: true });
      }
      const users = db.prepare('SELECT COUNT(*) n FROM users').get().n;
      const spend = q.monthSpend.get(monthStart()).c;
      const plans = db.prepare('SELECT * FROM plans').all();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<h2>Captly Admin</h2><p>Nutzer: ' + users + ' · API-Spend Monat: $' + spend.toFixed(2) +
        '</p><pre>' + JSON.stringify(plans, null, 2) + '</pre><p>Limits ändern: POST /admin mit {id,price_cents,monthly_seconds,trial_seconds,max_projects}</p>');
    }

    // ── Transkription (Kernendpoint mit Gating) ──
    if (req.method === 'POST' && u.pathname === '/transcribe') {
      if (rateLimited(ip)) return json(res, 429, { error: 'rate' });
      const usr = authUser(req);
      const wav = await readBody(req, 26 * 1024 * 1024);
      if (wav.length > 25 * 1024 * 1024) return json(res, 413, { error: 'too_big' });
      const secs = Math.ceil((wav.length - 44) / 32000); // Dauer serverseitig aus WAV-Bytes
      if (secs > 15 * 60) return json(res, 413, { error: 'Max. 15 Minuten pro Video.' });

      if (usr) {
        const st = userState(usr);
        if (secs > st.remaining) return json(res, 402, { error: 'quota', remaining: st.remaining, plan: st.sub.plan });
      } else if (freeQuotaExceeded(ip)) {
        return json(res, 402, { error: 'free_quota', freePerDay: FREE_PER_DAY });
      }
      const budget = budgetExceeded(secs / 60 * 0.006);
      if (budget) return json(res, 503, { error: budget });

      const translate = u.searchParams.get('translate') === '1';
      const fd = new FormData();
      fd.append('file', new Blob([wav], { type: 'audio/wav' }), 'audio.wav');
      fd.append('model', 'whisper-1');
      fd.append('response_format', 'verbose_json');
      if (!translate) {
        fd.append('timestamp_granularities[]', 'word');
        const lang = u.searchParams.get('lang'); if (lang) fd.append('language', lang);
      }
      const r = await fetch('https://api.openai.com/v1/audio/' + (translate ? 'translations' : 'transcriptions'), {
        method: 'POST', headers: { Authorization: 'Bearer ' + KEY }, body: fd, signal: AbortSignal.timeout(120000)
      });
      const txt = await r.text();
      if (r.ok && usr) deductSeconds(usr, secs);
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      return res.end(txt);
    }

    // ── Statisch ──
    if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/captly.html')) {
      const p = path.join(__dirname, 'captly.html');
      if (fs.existsSync(p)) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(fs.readFileSync(p)); }
    }
    res.writeHead(404); res.end('not found');
  } catch (e) {
    console.error(e);
    json(res, 500, { error: String(e.message || e) });
  }
}).listen(PORT, () => console.log('✅ Captly v2 auf http://localhost:' + PORT + ' — Auth, Pläne, Usage, Stripe-ready'));
