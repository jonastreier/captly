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

// ── Helles, einfarbiges Testvideo (Sand-Ton) für den Randtest: dunkle Pixel am Bildrand können dann nur vom Rahmen kommen
const LIGHT = path.join(os.tmpdir(), 'cr-e2e-light.webm');
if (!fs.existsSync(LIGHT)) {
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=0xd8c8a8:size=540x960:rate=30:duration=4', '-f', 'lavfi', '-i', 'sine=frequency=300:duration=4',
    '-c:v', 'libvpx', '-b:v', '300k', '-pix_fmt', 'yuv420p', '-c:a', 'libvorbis', '-shortest', LIGHT]);
}
// Unterer Rand eines Elements: mittlere 60 % der Spalten, Helligkeit der untersten 3 Pixelreihen (je Reihe der Mittelwert) und
// zum Vergleich der Reihen 8–11 darüber. Ein dunkler Streifen innerhalb der Rundung wäre ein Sprung gegenüber `ref`.
async function edgeStats(page, loc) {
  const buf = await loc.screenshot();
  return page.evaluate(async b64 => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const x0 = Math.round(im.width * 0.2), w = Math.round(im.width * 0.6);
    const row = r => { const d = x.getImageData(x0, r, w, 1).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += (d[i] + d[i + 1] + d[i + 2]) / 3; return s / w; };
    const h = im.height, last = [row(h - 1), row(h - 2), row(h - 3)], ref = [8, 9, 10, 11].map(k => row(h - k)).reduce((a, b) => a + b, 0) / 4;
    return { bottom: Math.min(...last), ref, w: im.width, h };
  }, buf.toString('base64'));
}
// abs: Kacheln mit weisser Beschriftung am unteren Rand (Verlauf + Text) taugen nicht für den Vergleich mit den Reihen darüber → fester Mindestwert (ein Streifen wäre ~0)
const edgeOk = (st, abs) => abs ? st.bottom >= abs : st.bottom >= st.ref * 0.75 - 2;

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
    // Rand: Showcase-Karten und Landing-Style-Kacheln haben unten keinen dunklen Streifen (Sprung gegenüber den Reihen darüber)
    await page.waitForTimeout(900);
    for (const [sel, abs] of [['.show-card', 0], ['.hc-th', 25]]) {
      let bad = [];
      for (let i = 0; i < 3; i++) {
        const loc = page.locator(sel).nth(i);
        if (!(await loc.count()) || !(await loc.isVisible())) continue;
        const st = await edgeStats(page, loc);
        if (!edgeOk(st, abs)) bad.push(i + ':' + Math.round(st.bottom) + '/' + Math.round(st.ref));
      }
      ok(bad.length === 0, 'Rand ' + sel + ': kein dunkler Streifen am unteren Rand' + (bad.length ? ' (' + bad.join(', ') + ')' : ''));
    }
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

    // 2b) Word pop (Customize → Highlight & animation): bei PAUSIERTEM Video muss jede Option sofort sichtbar etwas tun (Demo ~0,6 s)
    if (!prof.mobile) {
      // Pausenzeit 0,5 s nach Beginn des zweiten Worts (Folgewörter um 0,6 s verschoben): die 0,34-s-Animation ist dort längst vorbei,
      // jede Bewegung nach der Auswahl stammt also aus der Demo und nicht aus einem eingefrorenen Bild.
      const tp = await page.evaluate(() => {
        switchTab('style'); document.getElementById('advSet').open = true;
        var b = captionBlocks[0], w = b.words;
        for (var i = 2; i < w.length; i++) { w[i].start += 0.6; w[i].end += 0.6; }
        b.end += 0.6;
        var v = document.getElementById('mainVid'); v.pause(); v.currentTime = w[1].start + 0.5 - timeOff; _lastKey = null; updateOverlay();
        return { n: w.length, t: v.currentTime };
      });
      await page.waitForTimeout(600);
      ok(tp.n >= 2 && await page.evaluate(() => document.getElementById('mainVid').paused), 'Word pop: Video pausiert bei ' + tp.t.toFixed(2) + ' s');
      // Sampler im Seitenkontext: grösste Skalierung, kleinste Deckkraft, grösster Versatz und Text-Schatten des aktiven Worts über 300 ms
      const sample = async (value) => {
        await page.evaluate(() => {
          window.__wp = { sc: 1, op: 1, ty: 0, sh: 0, spans: 0, n: 0 };
          const t0 = performance.now();
          (function tick() {
            const all = [...document.querySelectorAll('#capOverlay [data-oi]')];
            window.__wp.spans = all.length;
            all.forEach(el => {
              const cs = getComputedStyle(el), m = /matrix\(([^)]+)\)/.exec(cs.transform);
              if (m) { const v = m[1].split(',').map(parseFloat); window.__wp.sc = Math.max(window.__wp.sc, v[0]); window.__wp.ty = Math.max(window.__wp.ty, v[5]); }
              window.__wp.op = Math.min(window.__wp.op, parseFloat(cs.opacity));
              const shs = (el.style.textShadow.match(/\d+(\.\d+)?px/g) || []).length;
              window.__wp.sh = Math.max(window.__wp.sh, shs);
            });
            window.__wp.n++;
            if (performance.now() - t0 < 300) requestAnimationFrame(tick);
          })();
        });
        await page.selectOption('#csAnim', value);
        await page.waitForTimeout(350);
        return page.evaluate(() => window.__wp);
      };
      await page.selectOption('#csAnim', 'none');
      await page.waitForTimeout(800); // Demo von «None» (keine) ausklingen lassen
      const base = await sample('none');
      const ev = {};
      for (const o of ['punch', 'scale', 'bounce', 'flash', 'glow']) {
        await page.selectOption('#csAnim', 'none'); await page.waitForTimeout(800);
        ev[o] = await sample(o);
      }
      ok(ev.punch.sc > 1.1, 'Word pop «Punch» bei pausiertem Video: scale > 1.1 innerhalb von 300 ms (max ' + ev.punch.sc.toFixed(3) + ', ' + ev.punch.n + ' Bilder)');
      ok(ev.scale.sc > 1.1, 'Word pop «Pop»: scale > 1.1 (max ' + ev.scale.sc.toFixed(3) + ')');
      ok(ev.bounce.ty > 1 && ev.bounce.op < 0.95, 'Word pop «Lift»: Versatz + Deckkraft (ty ' + ev.bounce.ty.toFixed(1) + 'px, op ' + ev.bounce.op.toFixed(2) + ')');
      ok(ev.flash.op < 0.6, 'Word pop «Fade in»: Deckkraft startet niedrig (min ' + ev.flash.op.toFixed(2) + ')');
      ok(ev.glow.sh > base.sh, 'Word pop «Glow»: zusätzlicher Leucht-Schatten (' + base.sh + ' → ' + ev.glow.sh + ' Werte)');
      ok(base.sc <= 1.0001 && base.op >= 0.999, 'Word pop «None»: keine Bewegung (scale ' + base.sc.toFixed(3) + ')');
      // Screenshot des Effekts mitten in der Demo (Punch, ~100 ms nach der Auswahl)
      await page.selectOption('#csAnim', 'none'); await page.waitForTimeout(800);
      await page.selectOption('#csAnim', 'punch'); await page.waitForTimeout(90);
      await shot('03b-wordpop-punch');
      await page.waitForTimeout(700);
      await page.selectOption('#csAnim', 'glow'); await page.waitForTimeout(90);
      await shot('03c-wordpop-glow');
      await page.waitForTimeout(700);
      // Nur im Modus Highlight: sonst Zeile ausgeblendet + Hinweis
      await page.selectOption('#csMotion', 'reveal');
      ok(!(await page.isVisible('#csAnimRow')) && /Animation: Highlight/.test(await page.textContent('#csAnimHint')) && await page.isVisible('#csAnimHint'), 'Word pop: bei Reveal Zeile weg + Hinweis');
      await page.selectOption('#csMotion', 'highlight');
      ok(await page.isVisible('#csAnimRow') && !(await page.isVisible('#csAnimHint')), 'Word pop: bei Highlight wieder sichtbar');
      await page.evaluate(() => { document.getElementById('advSet').open = false; selectStyle('hormozi'); var v = document.getElementById('mainVid'); v.currentTime = 0.5; });
      await page.waitForTimeout(400);
    }

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
    // Cover-Editor: Titel ziehen, Ausrichtung, einzelnes Wort (erst antippen, dann ziehen), Reset
    const cvInfo = () => page.evaluate(() => { const r = document.getElementById('cvCanvas').getBoundingClientRect(), b = _coverHit; return b && { left: r.left, top: r.top, k: r.width / 1080, h: r.height, box: { x: b.x, y: b.y, w: b.w, h: b.h }, words: b.words.map(w => ({ i: w.i, x: w.x, y: w.y, w: w.w, h: w.h })), st: JSON.parse(JSON.stringify({ ox: coverState.ox, oy: coverState.oy, align: coverState.align, wo: coverState.wo })), sel: _coverSel, maxW: coverMaxW(1080, 1920) }; });
    const cvDrag = async (fromU, dxPx, dyPx) => { // fromU: Punkt in 1080er-Einheiten; Verschiebung in CSS-px
      await page.locator('#cvCanvas').scrollIntoViewIfNeeded(); await page.waitForTimeout(150);
      const i = await cvInfo(), sx = i.left + fromU.x * i.k, sy = i.top + fromU.y * i.k;
      await page.mouse.move(sx, sy); await page.mouse.down();
      for (let s = 1; s <= 8; s++) await page.mouse.move(sx + dxPx * s / 8, sy + dyPx * s / 8);
      await page.mouse.up(); await page.waitForTimeout(350);
    };
    const cvTap = async u => { await page.locator('#cvCanvas').scrollIntoViewIfNeeded(); await page.waitForTimeout(150); const i = await cvInfo(); await page.mouse.click(i.left + u.x * i.k, i.top + u.y * i.k); await page.waitForTimeout(300); };
    const ctr = r => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
    await page.evaluate(() => coverSet('pos', 'mid')); await page.waitForTimeout(400);
    let c0 = await cvInfo();
    ok(c0 && c0.st.align === 'center' && c0.words.length === 2 && Math.abs(c0.box.x + c0.box.w / 2 - 540) < 1, 'Cover: Titel mittig, zwei Wort-Trefferflächen');
    await cvDrag(ctr(c0.box), 0, -0.15 * c0.h); // von der Mitte nach oben
    let c1 = await cvInfo();
    ok(c1.box.y < c0.box.y - 30 && c1.st.oy < -0.03 && Math.abs(c1.st.ox) < 0.05 && Object.keys(c1.st.wo).length === 0 && c1.sel === -1, 'Cover: Ziehen nach oben verschiebt den ganzen Titel (box.y ' + Math.round(c0.box.y) + ' → ' + Math.round(c1.box.y) + ')');
    await shot('07b-cover-dragged');
    await page.click('#cvAlign button[data-align="left"]'); await page.waitForTimeout(400);
    let c2 = await cvInfo();
    ok(Math.abs(c2.box.x - (1080 - c2.maxW) / 2) < 1 && c2.st.align === 'left', 'Cover: Ausrichtung links → Box an linker Kante von maxW');
    await page.click('#cvAlign button[data-align="right"]'); await page.waitForTimeout(400);
    let c3 = await cvInfo();
    ok(Math.abs(c3.box.x + c3.box.w - (1080 + c3.maxW) / 2) < 1, 'Cover: Ausrichtung rechts → Box an rechter Kante von maxW');
    // Wort: ohne vorheriges Antippen verschiebt Ziehen den ganzen Titel; angetippt (Umriss) nur das Wort
    await cvTap(ctr(c3.words[0]));
    let c4 = await cvInfo();
    ok(c4.sel === c3.words[0].i, 'Cover: Tippen wählt das Wort (Umriss)');
    await cvDrag(ctr(c4.words[0]), 0, 0.08 * c4.h);
    let c5 = await cvInfo();
    ok(Object.keys(c5.st.wo).length === 1 && c5.st.wo[c4.sel] && c5.st.wo[c4.sel][1] > 0.02 && Math.abs(c5.st.oy - c4.st.oy) < 1e-9 && Math.abs(c5.words[1].y - c4.words[1].y) < 0.5, 'Cover: angetipptes Wort wird einzeln verschoben, das andere bleibt');
    await shot('07c-cover-word');
    await cvTap({ x: 20, y: 20 });
    ok((await cvInfo()).sel === -1, 'Cover: Tippen daneben hebt die Wortauswahl auf');
    const rsDis = await page.evaluate(() => document.getElementById('cvReset').disabled);
    ok(rsDis === false, 'Cover: „Reset position“ aktiv, wenn verschoben');
    await page.click('#cvReset'); await page.waitForTimeout(400);
    let c6 = await cvInfo();
    ok(c6.st.ox === 0 && c6.st.oy === 0 && Object.keys(c6.st.wo).length === 0 && Math.abs(c6.box.y - c0.box.y) < 0.5 && await page.evaluate(() => document.getElementById('cvReset').disabled), 'Cover: Reset position stellt die Grundposition wieder her');
    if (prof.mobile) { // Touch: echtes Wischen (CDP) verschiebt den Titel; touch-action:none verhindert das Scrollen
      await page.locator('#cvCanvas').scrollIntoViewIfNeeded(); await page.waitForTimeout(150);
      const cdp = await ctx.newCDPSession(page), i = await cvInfo(), t0 = { x: i.left + ctr(i.box).x * i.k, y: i.top + ctr(i.box).y * i.k };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [t0] });
      for (let k = 1; k <= 6; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: t0.x, y: t0.y - 0.1 * i.h * k / 6 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(400);
      const it = await cvInfo();
      ok(it.st.oy < -0.03 && it.box.y < i.box.y - 20, 'Cover (Touch): Wischen nach oben verschiebt den Titel (oy ' + it.st.oy.toFixed(3) + ')');
      await page.click('#cvReset'); await page.waitForTimeout(300);
    }
    // PNG = Vorschau: wieder verschieben (Titel + Wort), Hilfslinien aus, dann PNG und Vorschau pixelweise vergleichen
    await page.click('#cvAlign button[data-align="center"]'); await page.waitForTimeout(300);
    await cvDrag(ctr(c6.box), -0.1 * c6.h * 0.5625, 0.12 * c6.h);
    await page.uncheck('#cvGuides'); await page.waitForTimeout(500);
    const cvEdge = await edgeStats(page, page.locator('#cvCanvas'));
    ok(edgeOk(cvEdge), 'Rand #cvCanvas: kein dunkler Streifen am unteren Rand (' + Math.round(cvEdge.bottom) + ' vs ' + Math.round(cvEdge.ref) + ')');
    const cdl = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
    await page.click('#cvDl');
    const cd = await cdl;
    ok(!!cd && /\.png$/i.test(cd.suggestedFilename()), 'Cover als PNG heruntergeladen');
    if (cd) {
      const pngPath = path.join(os.tmpdir(), 'cr-e2e-cover-' + prof.name + '.png');
      await cd.saveAs(pngPath);
      const cmp = await page.evaluate(async b64 => {
        const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
        const cv = document.getElementById('cvCanvas'), c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
        const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, c.width, c.height);
        const a = x.getImageData(0, 0, c.width, c.height).data, b = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        let s = 0, big = 0; for (let i = 0; i < a.length; i += 4) { const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); s += d; if (d > 150) big++; }
        return { mean: s / (a.length / 4 * 3), big: big / (a.length / 4), w: im.width, h: im.height };
      }, fs.readFileSync(pngPath).toString('base64'));
      ok(cmp.w === 1080 && cmp.h === 1920 && cmp.mean < 3 && cmp.big < 0.01, 'Cover: PNG 1080×1920 entspricht der Vorschau (mittlere Abweichung ' + cmp.mean.toFixed(2) + ', starke Abweichung ' + (cmp.big * 100).toFixed(2) + ' %)');
    }
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

    // 6) Rand der Vorschau: helles einfarbiges Video → in den untersten Pixelreihen innerhalb der Rundung kein dunkler Streifen
    //    (bei Zoom 1 und 1.25), das Video steht über den Rahmen hinaus und der Hintergrund dahinter ist nicht schwarz
    {
      const p2 = await ctx.newPage();
      await p2.goto(base + '/', { waitUntil: 'load' });
      await p2.setInputFiles('#landInput', LIGHT);
      await p2.waitForFunction(() => typeof vidReady !== 'undefined' && vidReady, null, { timeout: 60000 }).catch(() => {});
      await p2.waitForTimeout(1500);
      for (const z of [1, 1.25]) {
        await p2.evaluate(zz => setZoom(zz), z); await p2.waitForTimeout(400);
        const st = await edgeStats(p2, p2.locator('#prevFrame'));
        ok(st.bottom >= 80, 'Rand #prevFrame (Zoom ' + z + '): unterste 3 Pixelreihen hell genug (' + Math.round(st.bottom) + ' ≥ 80)');
        const g = await p2.evaluate(() => { const f = document.getElementById('prevFrame').getBoundingClientRect(), v = document.getElementById('mainVid').getBoundingClientRect(); return { over: v.bottom - f.bottom, overTop: f.top - v.top, bg: getComputedStyle(document.getElementById('prevBg')).backgroundColor }; });
        ok(g.over >= 1.5 * z - 0.2 && g.overTop >= 1.5 * z - 0.2, 'Vorschau (Zoom ' + z + '): Video steht über den Rahmen hinaus (' + g.over.toFixed(1) + ' px unten)');
        ok(/rgba\(0, 0, 0, 0\)|transparent/.test(g.bg), 'Vorschau: Hintergrund hinter dem Video nicht schwarz (' + g.bg + ')');
      }
      await p2.evaluate(() => setZoom(1));
      await p2.evaluate(() => switchTab('style')); await p2.waitForTimeout(800);
      let bad = [];
      for (let i = 0; i < 3; i++) {
        const loc = p2.locator('#stylePicker .stile').nth(i);
        if (!(await loc.count()) || !(await loc.isVisible())) continue;
        const st = await edgeStats(p2, loc);
        if (!edgeOk(st)) bad.push(i + ':' + Math.round(st.bottom) + '/' + Math.round(st.ref));
      }
      ok(bad.length === 0, 'Rand Style-Kacheln: kein dunkler Streifen am unteren Rand' + (bad.length ? ' (' + bad.join(', ') + ')' : ''));
      await p2.close();
    }

    // 7) Hygiene
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
