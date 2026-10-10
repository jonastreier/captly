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

// Für test-ui-sweep.js wiederverwendbar: Mock-Server starten (→ Basis-URL) und die Supabase-Aufrufe der Seite darauf umleiten
async function startServer() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return 'http://127.0.0.1:' + server.address().port;
}
async function routeSupabase(ctx, base) {
  await ctx.route('https://tghodbtdraqkfwcmedcv.supabase.co/**', async route => {
    const rq = route.request(), u = new URL(rq.url());
    const r = await fetch(base + u.pathname + u.search, { method: rq.method(), headers: rq.headers(), body: ['GET', 'HEAD', 'OPTIONS'].includes(rq.method()) ? undefined : rq.postDataBuffer() });
    const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
    h['access-control-allow-origin'] = '*'; h['access-control-allow-headers'] = '*'; h['access-control-allow-methods'] = '*';
    await route.fulfill({ status: r.status, headers: h, body: Buffer.from(await r.arrayBuffer()) });
  });
}
module.exports = { WORDS, state, server, VIDEO, startServer, routeSupabase, chromium };
if (require.main !== module) return;

(async () => {
  const base = await startServer();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
  const profiles = [{ name: 'desktop', viewport: { width: 1280, height: 800 }, mobile: false }, { name: 'phone', viewport: { width: 390, height: 844 }, mobile: true }];
  for (const prof of profiles) {
    console.log('\n== ' + prof.name + ' ' + prof.viewport.width + 'px ==');
    const ctx = await browser.newContext({ viewport: prof.viewport, isMobile: prof.mobile, hasTouch: prof.mobile, acceptDownloads: true, deviceScaleFactor: 1 });
    // Supabase-Aufrufe der Seite auf den Mock umleiten
    await routeSupabase(ctx, base);
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

    // 2a) Style-Panel: feste Reihenfolge, «Erweitert» zu, Segment-Klick steuert das Select, kein seitliches Scrollen (auch mit «Erweitert» offen)
    {
      const r = await page.evaluate(() => {
        switchTab('style');
        const ids = ['stylePicker', 'csgText', 'csgAnim', 'csgLayout', 'csgFx', 'advSet', 'csgTpl'], els = ids.map(id => document.getElementById(id));
        const inOrder = els.every((e, i) => e && (i === 0 || (els[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)));
        const adv = document.getElementById('advSet'), pn = document.getElementById('csPanel');
        const seg = v => document.querySelector('.cs-seg[data-sel=csMotion] [data-v=' + v + ']');
        const out = { inOrder, advClosed: !adv.open, tplVisible: !!document.getElementById('csgTpl').offsetParent };
        seg('reveal').click();
        out.reveal = { sel: document.getElementById('csMotion').value, pressed: seg('reveal').getAttribute('aria-pressed'), rowHidden: !document.getElementById('csAnimRow').offsetParent };
        seg('highlight').click();
        out.hl = { sel: document.getElementById('csMotion').value, rowShown: !!document.getElementById('csAnimRow').offsetParent };
        adv.open = true; out.overflowX = pn.scrollWidth > pn.clientWidth + 1; adv.open = false;
        return out;
      });
      ok(r.inOrder && r.advClosed && r.tplVisible, 'Style-Panel: Reihenfolge Looks · Text · Animation · Layout · Effekte · Erweitert · Template, «Erweitert» zu, Template sichtbar');
      ok(r.reveal.sel === 'reveal' && r.reveal.pressed === 'true' && r.reveal.rowHidden && r.hl.sel === 'highlight' && r.hl.rowShown, 'Style-Panel: Animation-Segment setzt csMotion, Word pop nur bei Highlight');
      ok(!r.overflowX, 'Style-Panel: «Erweitert» offen ohne seitliches Scrollen');
    }

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

    // 2c) Timeline: Auswahlrahmen (Desktop) bzw. Wisch im «Select»-Modus (Handy) → Bereich gemeinsam verschieben → Undo
    {
      const tlInfo = () => page.evaluate(() => {
        const cv = _tl.cv, r = cv.getBoundingClientRect(), g = tlGeom(), v = tlView, off = timeOff || 0;
        return { l: r.left, t: r.top, w: r.width, g: { ruler: g.ruler, barY: g.barY, bar: g.bar, wave: g.wave, h: g.h }, pps: v.pps, vs: v.start,
          starts: captionBlocks.map(b => b.start), blocks: captionBlocks.map(b => ({ x0: tlTimeToX(b.start - off, v), x1: tlTimeToX(b.end - off, v) })) };
      });
      const rangeOf = () => page.evaluate(() => { const r = tlRange(); return r ? { a: r.a, b: r.b } : (tlSel >= 0 ? { a: tlSel, b: tlSel } : null); });
      const nbT = await page.evaluate(() => captionBlocks.length);
      await page.evaluate(() => { tlSnapOn = false; var v = document.getElementById('mainVid'); if (v) v.pause(); });
      if (!prof.mobile) {
        await page.evaluate(() => { tlSetOpen(true, false); _tl.cv.scrollIntoView({ block: 'center' }); });
        await page.waitForTimeout(500);
        let I = await tlInfo();
        const yWave = I.t + I.g.ruler + I.g.wave / 2, yBar = I.t + I.g.barY + I.g.bar / 2, bx = i => I.l + (I.blocks[i].x0 + I.blocks[i].x1) / 2;
        // Rahmen von der Wellenform über die ersten drei Blöcke
        await page.mouse.move(I.l + I.blocks[0].x0 + 3, yWave);
        await page.mouse.down();
        await page.mouse.move(I.l + I.blocks[1].x1, yBar, { steps: 6 });
        await page.mouse.move(I.l + I.blocks[2].x1 - 3, yBar, { steps: 6 });
        await page.waitForTimeout(150);
        await shot('02b-timeline-marquee');
        await page.mouse.up();
        let R = await rangeOf();
        ok(R && R.a === 0 && R.b - R.a === 2, 'Timeline Desktop: Rahmen über drei Blöcke → tlRange b−a = 2 (' + JSON.stringify(R) + ')');
        // Klick (< 3 px) auf leere Fläche: abwählen wie bisher
        await page.mouse.click(I.l + 4, yWave);
        ok((await rangeOf()) === null, 'Timeline Desktop: Klick auf leere Fläche hebt die Auswahl auf');
        // Rahmen über die letzten drei Blöcke, dann gemeinsam um +0,5 s verschieben
        const i0 = nbT - 3;
        await page.mouse.move(I.l + I.blocks[nbT - 1].x1 - 3, yWave);
        await page.mouse.down();
        await page.mouse.move(I.l + I.blocks[i0 + 1].x0, yBar, { steps: 6 });
        await page.mouse.move(I.l + I.blocks[i0].x0 + 3, yBar, { steps: 6 });
        await page.mouse.up();
        R = await rangeOf();
        ok(R && R.a === i0 && R.b === nbT - 1, 'Timeline Desktop: Rahmen von rechts nach links (umgekehrte Richtung) wählt die letzten drei (' + JSON.stringify(R) + ')');
        const before = I.starts, dxPx = 0.5 * I.pps;
        await page.mouse.move(bx(i0 + 1), yBar);
        await page.mouse.down();
        await page.mouse.move(bx(i0 + 1) + dxPx / 2, yBar, { steps: 5 });
        await page.mouse.move(bx(i0 + 1) + dxPx, yBar, { steps: 5 });
        await page.mouse.up();
        let after = (await tlInfo()).starts;
        ok(before.every((v, i) => i < i0 ? Math.abs(after[i] - v) < 1e-6 : Math.abs(after[i] - v - 0.5) < 0.02), 'Timeline Desktop: Bereich um +0,5 s verschoben, davor unverändert (' + (after[i0] - before[i0]).toFixed(3) + ' s)');
        ok(JSON.stringify(await rangeOf()) === JSON.stringify({ a: i0, b: nbT - 1 }), 'Timeline Desktop: Auswahl bleibt nach dem Verschieben bestehen');
        await page.mouse.move(I.l + 4, yWave); // Fokus: Tastatur an die Seite
        await page.keyboard.press('Control+z');
        await page.waitForTimeout(200);
        after = (await tlInfo()).starts;
        ok(before.every((v, i) => Math.abs(after[i] - v) < 1e-6), 'Timeline Desktop: Strg+Z macht das gemeinsame Verschieben rückgängig');
        // Shift+Rahmen erweitert die bestehende Auswahl
        await page.evaluate(() => tlSelect(0, false));
        await page.mouse.move(I.l + I.blocks[nbT - 1].x1 - 3, yWave);
        await page.keyboard.down('Shift');
        await page.mouse.down();
        await page.mouse.move(I.l + I.blocks[nbT - 1].x0 + 3, yBar, { steps: 4 });
        await page.mouse.up();
        await page.keyboard.up('Shift');
        R = await rangeOf();
        ok(R && R.a === 0 && R.b === nbT - 1, 'Timeline Desktop: Shift+Rahmen erweitert die Auswahl (' + JSON.stringify(R) + ')');
        // Gezoomt: Mittelklick-Ziehen scrollt, Rahmen am Rand scrollt automatisch weiter
        await page.evaluate(() => { tlSel = -1; tlSelEnd = -1; tlView = tlZoomAt(tlView, 3, 0, tlDur(), _tl.cv.clientWidth); _tl.fit = false; tlRequestDraw(); });
        await page.waitForTimeout(200);
        I = await tlInfo();
        const vs0 = I.vs;
        await page.mouse.move(I.l + 400, yWave);
        await page.mouse.down({ button: 'middle' });
        await page.mouse.move(I.l + 300, yWave, { steps: 5 });
        await page.mouse.up({ button: 'middle' });
        const vs1 = (await tlInfo()).vs;
        ok(vs1 > vs0 + 0.05 && (await rangeOf()) === null, 'Timeline Desktop: Mittelklick-Ziehen scrollt (' + vs0.toFixed(2) + ' → ' + vs1.toFixed(2) + ' s), ohne Auswahl zu ändern');
        await page.evaluate(() => { tlView = tlClampView({ start: 0, pps: tlView.pps }, tlDur(), _tl.cv.clientWidth); tlRequestDraw(); });
        await page.waitForTimeout(150);
        I = await tlInfo();
        await page.mouse.move(I.l + 6, yWave);
        await page.mouse.down();
        await page.mouse.move(I.l + I.w - 8, yWave, { steps: 8 });
        await page.waitForTimeout(700); // am Rand verharren → scrollt weiter
        await shot('02c-timeline-autoscroll');
        await page.mouse.up();
        const I2 = await tlInfo();
        R = await rangeOf();
        ok(I2.vs > 0.3 && R && R.b > R.a, 'Timeline Desktop: Rahmen am Rand scrollt automatisch weiter (Start ' + I2.vs.toFixed(2) + ' s, Bereich ' + JSON.stringify(R) + ')');
        await page.evaluate(() => { tlSel = -1; tlSelEnd = -1; tlFit(); tlRequestDraw(); });
        await page.mouse.move(I.l + 4, yWave);
      } else {
        // Handy: Tab «Timeline», Modus «Select», Wisch über die letzten drei Blöcke, Halten + Ziehen verschiebt sie gemeinsam
        await page.evaluate(() => { switchTab('timeline'); });
        await page.waitForTimeout(500);
        const i0 = nbT - 3;
        await page.evaluate(i => { const b = captionBlocks[i], e = captionBlocks[i + 2]; document.getElementById('mainVid').currentTime = (b.start + e.end) / 2 - (timeOff || 0); _tl.cv.scrollIntoView({ block: 'center' }); }, i0);
        await page.waitForTimeout(600);
        const cdp = await ctx.newCDPSession(page);
        const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
        await page.click('#taMulti');
        ok(await page.evaluate(() => tlMulti), 'Timeline Handy: «Select»-Modus an');
        let I = await tlInfo();
        const yB = I.t + I.g.barY + I.g.bar / 2, bx = i => I.l + (I.blocks[i].x0 + I.blocks[i].x1) / 2;
        await touch('touchStart', bx(i0), yB);
        for (let k = 1; k <= 8; k++) await touch('touchMove', bx(i0) + (bx(i0 + 2) - bx(i0)) * k / 8, yB);
        await shot('02b-timeline-sweep');
        await touch('touchEnd');
        await page.waitForTimeout(200);
        let R = await rangeOf();
        ok(R && R.a === i0 && R.b === nbT - 1, 'Timeline Handy: Wisch im Select-Modus wählt den Bereich (' + JSON.stringify(R) + ')');
        const before = I.starts, dxPx = 0.3 * 70;
        await touch('touchStart', bx(i0 + 1), yB);
        await page.waitForTimeout(650);
        await touch('touchMove', bx(i0 + 1) + dxPx / 2, yB);
        await touch('touchMove', bx(i0 + 1) + dxPx, yB);
        await touch('touchEnd');
        await page.waitForTimeout(200);
        const after = (await tlInfo()).starts;
        ok(before.every((v, i) => i < i0 ? Math.abs(after[i] - v) < 1e-6 : Math.abs(after[i] - v - 0.3) < 0.04), 'Timeline Handy: Bereich gemeinsam um ~0,3 s verschoben (' + (after[i0] - before[i0]).toFixed(3) + ' s)');
        await page.evaluate(() => { undoCaptions(); });
        const back = (await tlInfo()).starts;
        ok(before.every((v, i) => Math.abs(back[i] - v) < 1e-6), 'Timeline Handy: Undo macht es rückgängig');
        // Wisch auf leerer Fläche scrubbt weiter wie bisher (Auswahl bleibt)
        const c0 = await page.evaluate(() => document.getElementById('mainVid').currentTime);
        await touch('touchStart', I.l + 40, I.t + I.g.ruler + 3);
        for (let k = 1; k <= 6; k++) await touch('touchMove', I.l + 40 + k * 10, I.t + I.g.ruler + 3);
        await touch('touchEnd');
        await page.waitForTimeout(300);
        const c1 = await page.evaluate(() => document.getElementById('mainVid').currentTime);
        ok(Math.abs(c1 - c0) > 0.2, 'Timeline Handy: Wisch auf leerer Fläche scrubbt weiterhin (' + c0.toFixed(2) + ' → ' + c1.toFixed(2) + ' s)');
        await page.evaluate(() => { tlMulti = false; tlSel = -1; tlSelEnd = -1; switchTab('captions'); });
      }
      await page.evaluate(() => { tlSnapOn = true; });
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
      // Untertitel-Pixel im MP4 = |MP4-Frame − Quellframe| (gleiches Bild, Export «original» = Quellgrösse, kein Zoom). Verglichen mit
      // (a) dem Export-Renderer (drawCaptionsOnCtx) und (b) der Vorschau (Screenshot von #prevFrame: Video + DOM-Captions, gleiche Zeit):
      // Zeilenprofile → Versatz per kleinster L1-Differenz. Fängt eine Verschiebung im Aufnahme-/Encode-Weg und Vorschau ≠ MP4.
      // Zeitpunkt: Bild k (30 fps) in der Mitte des Blocks um 1.2 s (am Blockanfang blendet die Caption gerade erst ein)
      const kf = await page.evaluate(() => { const t0 = 1.2 + timeOff; let bi = currentBlockIdx(t0); if (bi < 0) bi = nearestBlockIdx(t0); const b = captionBlocks[bi]; return Math.round(((b.start + b.end) / 2 - timeOff) * 30); });
      const tK = kf / 30, ssK = ((kf - 0.5) / 30).toFixed(4); // -ss knapp vor Bild k → ffmpeg liefert genau Bild k
      const mpFr = path.join(os.tmpdir(), 'cr-e2e-mp4-frame.png'), srcFr = path.join(os.tmpdir(), 'cr-e2e-src-frame.png');
      [mpFr, srcFr].forEach(f => { try { fs.unlinkSync(f); } catch (e) {} });
      spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', ssK, '-i', fp, '-frames:v', '1', mpFr]);
      spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', ssK, '-i', VIDEO, '-frames:v', '1', srcFr]);
      ok(fs.existsSync(mpFr) && fs.existsSync(srcFr), 'MP4-/Quell-Frame bei ' + tK.toFixed(3) + ' s extrahiert');
      if (fs.existsSync(mpFr) && fs.existsSync(srcFr)) {
        await page.evaluate(() => { try { closeExportSheet(); } catch (e) {} });
        await page.evaluate(t => new Promise(r => { const v = document.getElementById('mainVid'); v.pause(); let done = false; const f = () => { if (done) return; done = true; v.removeEventListener('seeked', f); _lastKey = null; updateOverlay(); requestAnimationFrame(() => requestAnimationFrame(r)); }; v.addEventListener('seeked', f); v.currentTime = t; setTimeout(f, 2500); }), tK);
        // Vorschau zeitgenau wie beim Abspielen (pausiert zeigt sie sonst den Endzustand der Übergänge, s. capDomMotion)
        await page.evaluate(t0 => { const t = t0 + timeOff, bi = currentBlockIdx(t); if (bi >= 0) capDomMotion(document.getElementById('capOverlay'), caseStyle(STYLES.find(x => x.id === activeId)), captionBlocks[bi], bi, activeWordIdx(captionBlocks[bi], t), t, false, false); }, tK);
        await page.waitForTimeout(150);
        const prv = await page.locator('#prevFrame').screenshot({ animations: 'disabled' });
        const m = await page.evaluate(async a => {
          const load = b64 => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/png;base64,' + b64; });
          const [mp4, src, pv] = await Promise.all([load(a.mp4), load(a.src), load(a.prv)]);
          const W = mp4.width, H = mp4.height;
          const px = im => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(im, 0, 0, W, H); return x.getImageData(0, 0, W, H).data; };
          const dM = px(mp4), dS = px(src), dP = px(pv);
          const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d');
          _capLayoutCache = { key: null, s: null, ctx: null, val: null }; _capStaticLayer = null;
          drawCaptionsOnCtx(cx, a.t, STYLES.find(s => s.id === activeId), W, H, true);
          const dC = cx.getImageData(0, 0, W, H).data, rM = new Array(H).fill(0), rP = new Array(H).fill(0), rC = new Array(H).fill(0);
          const dif = (p, q, i) => Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2])) > 90;
          let ink = 0, hit = 0, nM = 0, nP = 0;
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4, mm = dif(dM, dS, i);
            if (mm) { rM[y]++; nM++; } if (dif(dP, dS, i)) { rP[y]++; nP++; }
            if (dC[i + 3] > 200) { rC[y]++; ink++; if (mm) hit++; }
          }
          return { W, H, rM, rP, rC, cover: ink ? hit / ink : 0, ink, nM, nP };
        }, { mp4: fs.readFileSync(mpFr).toString('base64'), src: fs.readFileSync(srcFr).toString('base64'), prv: prv.toString('base64'), t: tK });
        const shift = (p, q, r, max) => { let best = 0, bv = Infinity; for (let s = -max; s <= max; s++) { let d = 0; for (let i = r; i < p.length - r; i++) { const j = i + s; d += Math.abs(p[i] - (j >= 0 && j < q.length ? q[j] : 0)); } if (d < bv) { bv = d; best = s; } } return best; };
        const edge = Math.round(m.H * 0.03), sC = shift(m.rC, m.rM, edge, 40), sP = shift(m.rP, m.rM, edge, 40), tolC = Math.max(2, m.W * 0.003), tolP = Math.max(2, m.W * 0.004); // vorher (capLayout mit Canvas-Metrik): Vorschau 4 px (von 540) höher
        ok(m.ink > 500 && m.cover > 0.6, 'MP4-Frame (' + tK.toFixed(2) + ' s): Untertitel-Pixel liegen, wo der Export-Renderer zeichnet (' + (m.cover * 100).toFixed(0) + ' % von ' + m.ink + ' px, ' + m.W + '×' + m.H + ')');
        ok(m.ink > 500 && Math.abs(sC) <= tolC, 'MP4-Frame: kein Versatz zum Export-Renderer (' + sC + ' px tiefer, ≤ ' + tolC.toFixed(1) + ')');
        ok(m.nP > 500 && m.nM > 500 && Math.abs(sP) <= tolP, 'MP4-Frame = Vorschau: Untertitel-Zeilen auf gleicher Höhe (' + sP + ' px tiefer, ≤ ' + tolP.toFixed(1) + ' von ' + m.W + ')');
      }
    }
    ok(state.leads.length === 1 && state.leads[0].email === 'e2e@example.com' && state.leads[0].newsletter === true, 'Lead an /api/lead gesendet (E-Mail + Newsletter-Häkchen)');
    await page.waitForTimeout(500);
    await shot('06-export-done');

    // 3b) Auto zoom (Style → Animation → Emphasis): lokaler Ersatz liefert Momente, Umschalten gibt Rückmeldung (Toast + Vorführung bei Pause),
    //     Vorschau zoomt NUR das Video (zu Zeit s+1 scale > 1.05, davor/danach 1), Timeline zeigt Marker, MP4-Export zoomt identisch.
    {
      const scaleOf = () => page.evaluate(() => { const m = /matrix\(([^,]+),/.exec(getComputedStyle(document.getElementById('mainVid')).transform); return m ? +m[1] : 1; });
      const seekTo = t => page.evaluate(t => new Promise(r => { const v = document.getElementById('mainVid'); v.pause(); const f = () => { v.removeEventListener('seeked', f); r(); }; v.addEventListener('seeked', f); v.currentTime = t; setTimeout(r, 1500); }), t);
      await page.evaluate(() => { try { closeExportSheet(); } catch (e) {} switchTab('style'); setEmphZoom('off'); });
      await seekTo(0.4);
      await page.waitForTimeout(3000); // Toast von «Off» (keiner) bzw. früheren Meldungen ausklingen lassen
      await shot('07-zoom-off');
      // Sampler: grösste Skalierung des Videos, Captions-Overlay und Videozeit während der Vorführung
      await page.evaluate(() => {
        window.__z = { max: 1, capSc: 1, t0: document.getElementById('mainVid').currentTime, t1: 0, n: 0 };
        const t0 = performance.now();
        (function tick() {
          const m = /matrix\(([^,]+),/.exec(getComputedStyle(document.getElementById('mainVid')).transform); if (m) window.__z.max = Math.max(window.__z.max, +m[1]);
          const om = /matrix\(([^,]+),/.exec(getComputedStyle(document.getElementById('capOverlay')).transform); if (om) window.__z.capSc = Math.max(window.__z.capSc, +om[1]);
          window.__z.t1 = document.getElementById('mainVid').currentTime; window.__z.n++;
          if (performance.now() - t0 < 1700) requestAnimationFrame(tick);
        })();
        document.querySelector('#emZoomRow [data-z=punchy]').click();
      });
      await page.waitForTimeout(450);
      const toastTxt = await page.evaluate(() => (document.getElementById('capToast') || {}).textContent || '');
      await shot('08-zoom-demo');
      await page.waitForTimeout(1500);
      const zr = await page.evaluate(() => Object.assign({ plan: zoomPlan(), words: captionBlocks.reduce((a, b) => a + b.words.filter(w => w.zm).length, 0), paused: document.getElementById('mainVid').paused, to: timeOff || 0 }, window.__z));
      ok(zr.plan.length >= 1 && zr.words >= 1, 'Auto zoom: mindestens ein Zoom-Moment ohne KI (' + zr.plan.length + ' Momente, Plan ' + JSON.stringify(zr.plan.map(z => [+z.s.toFixed(2), +z.e.toFixed(2)])) + ')');
      ok(new RegExp('^Auto zoom: ' + zr.plan.length + ' moments?$').test(toastTxt), 'Auto zoom: Toast nennt die Anzahl («' + toastTxt + '»)');
      ok(zr.paused && zr.max > 1.1 && zr.max <= 1.19 + 1e-6, 'Auto zoom: Vorführung bei Pause — Video skaliert kurz auf ' + zr.max.toFixed(3) + ' (' + zr.n + ' Bilder)');
      ok(Math.abs(zr.t1 - zr.t0) < 0.01 && zr.capSc <= 1.0001, 'Auto zoom: Vorführung verschiebt das Video nicht und zoomt die Captions nicht (Zeit ' + zr.t0.toFixed(2) + ' → ' + zr.t1.toFixed(2) + ', Captions ×' + zr.capSc.toFixed(3) + ')');
      ok(await scaleOf() === 1, 'Auto zoom: nach der Vorführung wieder scale 1');
      // Seek in den Moment / davor / danach (ohne manuelles updateOverlay): Vorschau-Transform
      const mid = zr.plan[0].s + 1.0 - zr.to, before = Math.max(0.05, zr.plan[0].s - 0.3 - zr.to), after = zr.plan[0].e + 0.25 - zr.to;
      ok(zr.plan[0].s > 0.12, 'Auto zoom: erster Moment beginnt nicht ganz am Anfang (' + zr.plan[0].s.toFixed(2) + ' s)');
      await seekTo(before); await page.waitForTimeout(300); const sB = await scaleOf();
      await seekTo(mid); await page.waitForTimeout(300); const sM = await scaleOf();
      await shot('09-zoom-moment');
      await seekTo(after); await page.waitForTimeout(300); const sA = await scaleOf();
      ok(sM > 1.05 && sB === 1 && sA === 1, 'Auto zoom: Vorschau nach Seek — davor ' + sB.toFixed(3) + ', im Moment ' + sM.toFixed(3) + ' (' + mid.toFixed(2) + ' s), danach ' + sA.toFixed(3));
      // Timeline: Marker (Lupe + Strich in Bernstein) nur bei Auto zoom ≠ Off
      if (prof.mobile) await page.evaluate(() => switchTab('timeline')); else await page.evaluate(() => tlSetOpen(true, false));
      await page.evaluate(() => { _tl.cv.scrollIntoView({ block: 'center' }); if (typeof tlFit === 'function') tlFit(); tlRequestDraw(); });
      await page.waitForTimeout(500);
      const amber = () => page.evaluate(() => {
        tlDraw(); const cv = _tl.cv, ctx = cv.getContext('2d'), g = tlGeom(), dpr = cv.width / cv.clientWidth, d = ctx.getImageData(0, 0, cv.width, Math.round(g.ruler * dpr)).data;
        let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 190 && d[i + 1] > 90 && d[i + 1] < 160 && d[i + 2] < 70) n++;
        return n;
      });
      const aOn = await amber();
      await shot('10-zoom-timeline');
      await page.evaluate(() => setEmphZoom('off')); await page.waitForTimeout(200);
      const aOff = await amber();
      ok(aOn > 10 && aOff === 0, 'Auto zoom: Timeline-Marker nur bei Subtle/Punchy (Bernstein-Pixel am Lineal an/aus: ' + aOn + '/' + aOff + ')');
      if (prof.mobile) await page.evaluate(() => switchTab('style'));
      // MP4-Export: Frame im Moment ist gezoomt (Mitte vergrössert), Frame davor nicht
      await page.evaluate(() => { setEmphZoom('punchy'); openExportSheet(); });
      await page.waitForTimeout(400);
      const dlZ = page.waitForEvent('download', { timeout: 180000 }).catch(() => null);
      await page.click('#btnVideo');
      const dz = await dlZ;
      ok(!!dz, 'Auto zoom: Export mit Zoom gestartet');
      if (dz) {
        const fpz = path.join(os.tmpdir(), 'cr-e2e-zoom-' + prof.name + path.extname(dz.suggestedFilename()));
        await dz.saveAs(fpz);
        const frame = (src, t, out) => { try { fs.unlinkSync(out); } catch (e) {} const k = Math.round(t * 30); spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', ((k - 0.5) / 30).toFixed(4), '-i', src, '-frames:v', '1', out]); return fs.existsSync(out) ? fs.readFileSync(out).toString('base64') : null; };
        const f = n => path.join(os.tmpdir(), 'cr-e2e-z-' + n + '.png');
        const tMid = Math.round(mid * 30) / 30, tBef = Math.round(before * 30) / 30;
        const m1 = frame(fpz, tMid, f('mp4mid')), s1 = frame(VIDEO, tMid, f('srcmid')), m0 = frame(fpz, tBef, f('mp4bef')), s0 = frame(VIDEO, tBef, f('srcbef'));
        ok(m1 && s1 && m0 && s0, 'Auto zoom: MP4-/Quell-Frames extrahiert (' + tBef.toFixed(2) + ' s, ' + tMid.toFixed(2) + ' s)');
        if (m1 && s1 && m0 && s0) {
          fs.copyFileSync(f('mp4mid'), path.join(SHOTS, prof.name + '-zoom-mp4-moment.png')); fs.copyFileSync(f('srcmid'), path.join(SHOTS, prof.name + '-zoom-src-moment.png'));
          const zNow = await page.evaluate(t => zoomAt(t), tMid);
          const r = await page.evaluate(async a => {
            const load = b64 => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/png;base64,' + b64; });
            const [mm, sm, mb, sb] = await Promise.all([load(a.m1), load(a.s1), load(a.m0), load(a.s0)]);
            const W = mm.width, H = mm.height, rows = Math.round(H * 0.5); // obere Hälfte: dort liegen keine Captions
            const px = (im, z) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
              x.drawImage(im, W / 2 - W / (2 * z), H / 2 - H / (2 * z), W / z, H / z, 0, 0, W, H); return x.getImageData(0, 0, W, rows).data; };
            const err = (p, q) => { let s = 0; for (let i = 0; i < p.length; i += 4) s += Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]); return s / (p.length / 4) / 3; };
            return { eZoomed: err(px(mm, 1), px(sm, a.z)), eFlat: err(px(mm, 1), px(sm, 1)), bZoomed: err(px(mb, 1), px(sb, a.z)), bFlat: err(px(mb, 1), px(sb, 1)), W, H };
          }, { m1, s1, m0, s0, z: zNow });
          ok(zNow > 1.1, 'Auto zoom: Export-Faktor im Moment ' + zNow.toFixed(3));
          ok(r.eZoomed < r.eFlat * 0.6, 'Auto zoom: MP4-Frame im Moment entspricht dem gezoomten Quellbild (Fehler gezoomt ' + r.eZoomed.toFixed(1) + ' < ungezoomt ' + r.eFlat.toFixed(1) + ', ' + r.W + '×' + r.H + ')');
          ok(r.bFlat < r.bZoomed * 0.6, 'Auto zoom: MP4-Frame vor dem Moment ist ungezoomt (Fehler ungezoomt ' + r.bFlat.toFixed(1) + ' < gezoomt ' + r.bZoomed.toFixed(1) + ')');
        }
      }
      await page.evaluate(() => { try { closeExportSheet(); } catch (e) {} setEmphZoom('off'); });
    }

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
