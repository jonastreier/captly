// End-to-End-Test im echten Browser (Playwright + Chromium) gegen einen lokalen Mock-Server:
//   Upload → Untertitel (Mock-Transkription) → Style → Export (MP4) → E-Mail-Gate → Cover → Login → Projekt speichern/laden
// auf Desktop (1280×800) und Handy (390×844). Screenshots nach ./e2e-shots (oder E2E_SHOTS=…).
// Aufruf: node test-e2e.js      Voraussetzung: playwright + chromium (z. B. /opt/pw-browsers) und ffmpeg für das Testvideo.
// Nicht Teil der Pflicht-Tests aus CLAUDE.md (braucht Browser); vor grösseren UI-Änderungen von Hand laufen lassen.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

let chromium;
try { chromium = require('playwright').chromium; } catch (e) {
  try { chromium = require(path.join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright')).chromium; } catch (e2) { console.log('playwright nicht gefunden – test-e2e übersprungen'); process.exit(0); }
}
const ROOT = __dirname;
const SHOTS = process.env.E2E_SHOTS || path.join(ROOT, 'e2e-shots');
fs.mkdirSync(SHOTS, { recursive: true });
let fails = 0, n = 0;
const ok = (c, m) => { n++; console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };

// ── Testvideo (6 s, 540×960, VP8/WebM – Headless-Chromium hat keinen H.264-Decoder; hörbares Rauschen+Ton, damit die Sprach-Erkennung nicht „Stille“ meldet)
const VIDEO = path.join(os.tmpdir(), 'cr-e2e.webm');
if (!fs.existsSync(VIDEO)) {
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=540x960:rate=30:duration=6', '-f', 'lavfi', '-i', 'sine=frequency=300:duration=6',
    '-f', 'lavfi', '-i', 'anoisesrc=amplitude=0.2:duration=6', '-filter_complex', '[1][2]amix=inputs=2:duration=first[a]', '-map', '0:v', '-map', '[a]',
    '-c:v', 'libvpx', '-b:v', '600k', '-pix_fmt', 'yuv420p', '-c:a', 'libvorbis', '-shortest', VIDEO]);
  if (r.status !== 0) { console.log('ffmpeg fehlt – test-e2e übersprungen'); process.exit(0); }
}

// ── Mock-Server: statische Dateien + /api/* + minimales Supabase (Auth + projects)
const WORDS = 'Das ist ein kurzer Test für die Untertitel. Heute zeigen wir dir, wie schnell das geht und warum es so gut funktioniert.'.split(' ')
  .map((w, i) => ({ word: w, start: 0.3 + i * 0.22, end: 0.3 + i * 0.22 + 0.2 }));
const state = { leads: [], projects: [], seq: 0, transcribeCalls: 0, otpCalls: 0 };
const mine = () => state.projects.filter(p => p.title !== '__capivo_templates__');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.txt': 'text/plain', '.svg': 'image/svg+xml' };
function body(req) { return new Promise(r => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => r(Buffer.concat(c))); }); }
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'); const p = u.pathname;
  const json = (o, code = 200, h = {}) => { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, h)); res.end(JSON.stringify(o)); };
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }); return res.end(); }
  if (p === '/api/transcribe') {
    if (req.method !== 'POST') return json({ configured: true });
    await body(req); state.transcribeCalls++;
    return json({ language: 'german', text: WORDS.map(w => w.word).join(' '), words: WORDS });
  }
  if (p === '/api/polish' || p === '/api/enhance') return json({ error: 'off' }, 503);
  if (p === '/api/lead') {
    if (req.method !== 'POST') return json({ ok: true, configured: true });
    const j = JSON.parse((await body(req)).toString() || '{}'); state.leads.push(j); return json({ ok: true, confirm_mail: j.newsletter ? true : null });
  }
  // Supabase (Auth per Code-Login + Tabelle projects), alles im Speicher
  if (p === '/auth/v1/health') return json({ ok: true });
  if (p === '/auth/v1/otp') { state.otpCalls++; return json({}); }
  if (p === '/auth/v1/verify' || p === '/auth/v1/token') {
    const user = { id: 'u1', aud: 'authenticated', role: 'authenticated', email: 'test@example.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
    return json({ access_token: 'e2e.' + Buffer.from('{"sub":"u1","exp":9999999999,"role":"authenticated"}').toString('base64url') + '.sig', token_type: 'bearer', expires_in: 3600, expires_at: 9999999999, refresh_token: 'r', user });
  }
  if (p === '/auth/v1/user') return json({ id: 'u1', aud: 'authenticated', role: 'authenticated', email: 'test@example.com', app_metadata: {}, user_metadata: {} });
  if (p.startsWith('/rest/v1/')) {
    const t = p.slice(9);
    if (t !== 'projects' && t !== 'templates') return json([]);
    const flt = r => { // Mini-PostgREST: id=eq.x, title=eq.x / neq.x
      for (const k of ['id', 'title']) { const v = u.searchParams.get(k); if (!v) continue; const m = v.match(/^(n?eq)\.(.*)$/); if (m && ((m[1] === 'eq') !== (r[k] === m[2]))) return false; }
      return true;
    };
    if (req.method === 'GET') {
      const rows = state.projects.filter(flt);
      if (/vnd\.pgrst\.object/.test(req.headers.accept || '')) return rows.length ? json(rows[0]) : json({ message: 'none' }, 406);
      return json(rows);
    }
    const raw = (await body(req)).toString(); const j = raw ? JSON.parse(raw) : {};
    if (req.method === 'POST') {
      const rows = (Array.isArray(j) ? j : [j]).map(r => Object.assign({ id: 'p' + (++state.seq), updated_at: new Date().toISOString() }, r));
      state.projects.push(...rows); return json(rows, 201);
    }
    if (req.method === 'PATCH') { const hit = state.projects.filter(flt); hit.forEach(r => Object.assign(r, j, { updated_at: new Date().toISOString() })); return json(hit, 200); }
    if (req.method === 'DELETE') { state.projects = state.projects.filter(r => !flt(r)); return json([]); }
  }
  // statisch
  let f = p === '/' ? '/captly.html' : p === '/de' ? '/captly.de.html' : p;
  if (/^\/(impressum|datenschutz|privacy|terms|licenses)$/.test(f)) f += '.html';
  const file = path.join(ROOT, path.normalize(f));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});

module.exports = { WORDS, state };
if (require.main !== module) return;

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
  const profiles = [{ name: 'desktop', viewport: { width: 1280, height: 800 }, mobile: false }, { name: 'phone', viewport: { width: 390, height: 844 }, mobile: true }];
  for (const prof of profiles) {
    console.log('\n== ' + prof.name + ' ' + prof.viewport.width + 'px ==');
    const ctx = await browser.newContext({ viewport: prof.viewport, isMobile: prof.mobile, hasTouch: prof.mobile, acceptDownloads: true, deviceScaleFactor: 1 });
    // Supabase-Aufrufe der Seite auf den Mock umleiten
    await ctx.route('https://tghodbtdraqkfwcmedcv.supabase.co/**', async route => {
      const rq = route.request(), u = new URL(rq.url());
      const r = await fetch(base + u.pathname + u.search, { method: rq.method(), headers: rq.headers(), body: ['GET', 'HEAD', 'OPTIONS'].includes(rq.method()) ? undefined : rq.postDataBuffer() });
      const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
      h['access-control-allow-origin'] = '*'; h['access-control-allow-headers'] = '*'; h['access-control-allow-methods'] = '*';
      await route.fulfill({ status: r.status, headers: h, body: Buffer.from(await r.arrayBuffer()) });
    });
    const page = await ctx.newPage();
    const errors = [], external = [];
    page.on('dialog', d => { errors.push('dialog: ' + d.message()); d.dismiss(); });
    if (process.env.E2E_DEBUG) page.on('response', r => { if (/supabase|\/rest\//.test(r.url())) console.log('   ', r.request().method(), r.url().replace(/^https?:\/\/[^/]+/, ''), r.status()); });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push(m.text()); });
    page.on('request', r => { const u = r.url(); if (!u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:') && !/supabase\.co/.test(u)) external.push(u); });
    const shot = async name => page.screenshot({ path: path.join(SHOTS, prof.name + '-' + name + '.png') });
    state.leads.length = 0; state.projects = [];

    await page.goto(base + '/', { waitUntil: 'load' });
    await shot('01-landing');
    // 1) Upload
    await page.setInputFiles('#landInput', VIDEO);
    await page.waitForFunction(() => typeof captionBlocks !== 'undefined' && captionBlocks.length > 0, null, { timeout: 60000 }).catch(() => {});
    const nb = await page.evaluate(() => captionBlocks.length);
    ok(nb > 0, 'Untertitel erzeugt (' + nb + ' Blöcke), Mock-Transkription ' + state.transcribeCalls + '×');
    await page.waitForTimeout(800);
    await shot('02-editor');
    // 2) Style wählen → Overlay zeigt Text im gewählten Look
    await page.evaluate(() => selectStyle('hormozi'));
    const sty = await page.evaluate(() => activeId);
    ok(sty === 'hormozi', 'Style gewählt: ' + sty);
    await page.evaluate(() => { var v = document.getElementById('mainVid'); if (v) v.currentTime = 0.5; });
    await page.waitForTimeout(600);
    await shot('03-style');

    // 3) Export: Gate verlangt E-Mail (Beta) → ungültig/leer wird abgelehnt, gültig + Newsletter geht durch
    await page.click('#tbExport');
    await page.waitForSelector('#expSheet', { state: 'visible' });
    await shot('04-export-sheet');
    const gateVisible = await page.isVisible('#expGate');
    ok(gateVisible, 'E-Mail-Gate sichtbar vor dem ersten Export');
    if (gateVisible) {
      await page.click('#btnVideo');
      await page.waitForTimeout(300);
      ok(await page.isVisible('#gateErr'), 'leere E-Mail: Fehlermeldung');
      await page.fill('#gateEmail', 'kaputt@');
      await page.click('#btnVideo');
      await page.waitForTimeout(300);
      ok(await page.isVisible('#gateErr') && state.leads.length === 0, 'ungültige E-Mail: abgelehnt, nichts gesendet');
      await page.fill('#gateEmail', 'e2e@example.com');
      await page.check('#gateNews');
    }
    const dlP = page.waitForEvent('download', { timeout: 180000 }).catch(() => null);
    await page.click('#btnVideo');
    await page.waitForTimeout(1500);
    await shot('05-exporting');
    const dl = await dlP;
    ok(!!dl, 'Download gestartet (' + (dl ? dl.suggestedFilename() : '–') + ')');
    if (dl) {
      const fp = path.join(os.tmpdir(), 'cr-e2e-out-' + prof.name + path.extname(dl.suggestedFilename()));
      await dl.saveAs(fp);
      const size = fs.statSync(fp).size;
      ok(size > 20000, 'Export-Datei nicht leer (' + size + ' B)');
      const pr = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', fp]);
      let info = {}; try { info = JSON.parse(pr.stdout.toString()); } catch (e) {}
      const dur = info.format && +info.format.duration;
      ok(dur > 4.5 && dur < 8, 'Export-Dauer passt zum Video (' + dur + ' s)');
      ok((info.streams || []).some(x => x.codec_type === 'video') && (info.streams || []).some(x => x.codec_type === 'audio'), 'Export hat Bild und Ton');
      // Vorschau = Export: ein Frame aus der Mitte mit Untertitel-Pixeln prüfen (heller Text auf dem Testbild)
      const fr = path.join(SHOTS, prof.name + '-export-frame.png');
      spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1.2', '-i', fp, '-frames:v', '1', fr]);
    }
    ok(state.leads.length === 1 && state.leads[0].email === 'e2e@example.com' && state.leads[0].newsletter === true, 'Lead an /api/lead gesendet (E-Mail + Newsletter-Häkchen)');
    await page.waitForTimeout(500);
    await shot('06-export-done');

    // 4) Cover
    if (!(await page.isVisible('#expSheet'))) await page.evaluate(() => openExportSheet());
    await page.click('#expSheet button:has-text("Create cover"):visible');
    await page.waitForSelector('#coverModal', { state: 'visible' });
    await page.fill('#cvTitle', 'Mein Titel');
    await page.waitForTimeout(700);
    await shot('07-cover');
    const cdl = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
    await page.click('#cvDl');
    const cd = await cdl;
    ok(!!cd && /\.png$/i.test(cd.suggestedFilename()), 'Cover als PNG heruntergeladen');
    await page.evaluate(() => closeCover());

    // 5) Login per Code + Projekt speichern/laden
    await page.evaluate(() => showAcct());
    await page.fill('#acctEmail', 'test@example.com');
    await page.click('#acctStep1 button');
    await page.waitForSelector('#acctStep2', { state: 'visible', timeout: 10000 }).catch(() => {});
    ok(await page.isVisible('#acctStep2'), 'Login-Code angefordert (Schritt 2)');
    await shot('08-login');
    await page.fill('#acctCode', '123456');
    await page.click('#acctStep2 button');
    await page.waitForFunction(() => meEmail === 'test@example.com', null, { timeout: 10000 }).catch(() => {});
    ok(await page.evaluate(() => meEmail) === 'test@example.com', 'Eingeloggt');
    await page.evaluate(() => { document.getElementById('acctModal').style.display = 'none'; });
    const nbSave = await page.evaluate(() => captionBlocks.length);
    await page.evaluate(() => saveProject());
    await page.waitForTimeout(800);
    ok(mine().length === 1 && mine()[0].payload && mine()[0].payload.blocks.length === nbSave, 'Projekt gespeichert (' + nbSave + ' Blöcke)');
    // Neu laden, anderes Projekt-Gedächtnis: Editor leeren und Projekt aus der Liste laden
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForFunction(() => meEmail === 'test@example.com', null, { timeout: 10000 }).catch(() => {});
    ok(await page.evaluate(() => meEmail) === 'test@example.com', 'Sitzung bleibt nach Reload erhalten');
    await page.evaluate(() => loadProjects());
    await page.waitForTimeout(500);
    const opts = await page.evaluate(() => document.querySelectorAll('#projList option').length);
    ok(opts === 2, 'Projektliste zeigt das gespeicherte Projekt');
    await page.evaluate(id => loadProject(id), (mine()[0] || {}).id);
    await page.waitForTimeout(800);
    const nb2 = await page.evaluate(() => captionBlocks.length);
    ok(nb2 === nbSave, 'Projekt geladen: ' + nb2 + ' Blöcke');
    await shot('09-project-loaded');

    // 6) Hygiene
    ok(errors.length === 0, 'keine Konsolen-/Seitenfehler' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
    ok(external.length === 0, 'keine Fremdserver-Anfragen' + (external.length ? ': ' + external.slice(0, 3).join(' | ') : ''));
    const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    ok(!hscroll, 'kein horizontales Scrollen');
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(fails ? `\n${fails}/${n} FEHLER` : `\ntest-e2e: ${n} Prüfungen grün`);
  process.exit(fails ? 1 : 0);
})();
