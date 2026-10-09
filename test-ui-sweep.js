// UI-Sweep: systematisches QA-Gerüst im echten Browser (Playwright + Chromium) gegen den Mock-Server aus test-e2e.js.
// Findet Fehler der Sorte «Regler bewirkt nichts / zu viel», «Vorschau ≠ Export», «Animation unsichtbar», «dunkler Rand».
//
//   node test-ui-sweep.js                 alles, Desktop 1280×800 + Handy 390×844 (Touch)
//   node test-ui-sweep.js --quick         schnell: weniger Werte / Styles (Laufzeit ≈ Hälfte)
//   node test-ui-sweep.js --only=ctl,geom   nur Abschnitte: hyg, ctl, geom, pixel, anim, edge
//   node test-ui-sweep.js --viewport=phone  nur ein Viewport (desktop|phone)
//   node test-ui-sweep.js --verbose         auch bestandene Prüfungen auflisten
//   node test-ui-sweep.js --strict          unerwartetes PASS (XPASS) zählt als Fehler
//   SWEEP_SHOTS=/pfad                       bei Fehlern Screenshots dorthin (sonst nur Meldungen)
//
// Abschnitte
//   hyg    Hygiene nach jedem Tab/Sheet/Dialog: keine Konsolen-/Seitenfehler, kein horizontales Scrollen, nichts ragt aus dem
//          Viewport, Tippflächen auf dem Handy ≥ 32 px (Warnung)
//   ctl    Kontroll-Tabelle: JEDE Kontrolle (Style-Tab, Customize, Captions, Timeline, Export-Sheet, Cover, Einstellungen) wird
//          bedient; pro Wert wird eine Signatur (Style-Objekt, Layout-Zustand, Zeilenzahl, DOM-Hash, computed Style) erfasst.
//          Erwartete Felder ändern sich, Invarianten (Zeilen, Wörter/Block, Blockanzahl, Schriftgrösse …) bleiben.
//          Eine Kontrolle, die GAR NICHTS ändert, ist ein Fehler — ausser sie ist als noopOk (mit Begründung) markiert.
//   geom   Vorschau = Export (Geometrie): DOM-Wortrechtecke × Export-Skala vs. capLayout (alle Presets × Zeilen × Position × Zeilenhöhe)
//   pixel  Vorschau = Export (Pixel): Video aus, Hintergrund #808080, binarisieren, IoU ≥ 0.9
//   anim   Animation: bei Wortstart + 0.08 s ist die gewählte Wort-Animation am aktiven Span sichtbar
//   edge   Rand-Check: einfarbig helles Video — in den untersten 3 Pixelreihen (innerhalb der Rundung) nichts Dunkles (Zoom 1 und 1.25)
//
// expectFail: bekannte, in anderen Branches behobene Fehler stehen in EXPECT_FAIL (Regex auf die Prüfungs-ID + Begründung). Sie zählen
// nicht als Fehler, solange sie scheitern; BESTEHT eine solche Prüfung, warnt der Lauf («XPASS») → Eintrag dann löschen.
// Nicht Teil der CI (braucht Browser); vor grösseren UI-/Export-Änderungen von Hand laufen lassen.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const e2e = require('./test-e2e.js'); // beendet sich selbst (exit 0), wenn playwright/ffmpeg fehlen
const { chromium, startServer, routeSupabase, VIDEO } = e2e;

const ARGS = process.argv.slice(2);
const QUICK = ARGS.includes('--quick');
const VERBOSE = ARGS.includes('--verbose');
const STRICT = ARGS.includes('--strict');
const argVal = n => { const a = ARGS.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : ''; };
const ONLY = argVal('only').split(',').filter(Boolean);
const want = sec => !ONLY.length || ONLY.includes(sec);
const SHOTS = process.env.SWEEP_SHOTS || '';
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const T0 = Date.now();

// ═══════════ Bekannte Fehler (expectFail) ═══════════
// Jeder Eintrag: re = Regex auf die Prüfungs-ID (ohne Viewport), why = Begründung (Branch/Fehler). Scheitert die Prüfung → «xfail» (erwartet).
// Besteht sie → «XPASS»-Warnung: der Fehler ist behoben (Branch gemergt) → Eintrag entfernen.
const EXPECT_FAIL = [
  { re: /^ctl\/[^/]*@layoutPreset\/inv:(cfg\.(lines|wpb|blocks)|dom\.lines)$/, why: 'P1: Customize-Regler wenden das Layout-Preset des Ausgangs-Styles bei jedem Zug neu an (Zeilen/Wörter pro Block springen zurück, z. B. Line height → 1 Zeile)' },
  { re: /^anim\/(visible|transform)\//, why: 'P2: «Word pop» ist bei Wortstart + 0.08 s kaum/gar nicht sichtbar bzw. nicht als Transformation umgesetzt' },
  { re: /^geom\/linepitch/, why: 'P4: Export-Zeilenabstand 1.28 × (lh/1.3) statt lh (Vorschau 1.3) — drawCaptionsOnCtx/capLayout, «const lh = fsS * 1.28 * …»' },
  { re: /^edge\//, why: 'P3: dunkler Rand am unteren Rand abgerundeter Karten (Hintergrund blutet durch)' },
];

// ═══════════ Ergebnis-Buchhaltung ═══════════
const R = { ok: 0, fail: 0, xfail: 0, xpass: 0, warn: 0 }, LOG = [];
let curVp = '';
function expectedWhy(id) { const e = EXPECT_FAIL.find(x => x.re.test(id)); return e ? e.why : ''; }
const xpassSeen = new Set();
// check(id, cond, msg): id ohne Viewport (für expectFail), der Viewport kommt in die Ausgabe
function check(id, cond, msg) {
  const why = expectedWhy(id), tag = '[' + curVp + '] ' + id + ' — ' + msg;
  if (cond) {
    if (why) { R.xpass++; LOG.push(['XPASS', tag + '  (erwartet: ' + why + ')']); xpassSeen.add(id); }
    else { R.ok++; if (VERBOSE) LOG.push(['ok', tag]); }
  } else if (why) { R.xfail++; LOG.push(['xfail', tag + '  [erwartet: ' + why + ']']); }
  else { R.fail++; LOG.push(['FAIL', tag]); }
  return !!cond;
}
function warn(id, msg) { R.warn++; LOG.push(['warn', '[' + curVp + '] ' + id + ' — ' + msg]); }
function flush(section) {
  if (!LOG.length) return;
  for (const [k, m] of LOG) {
    if (k === 'ok' && !VERBOSE) continue;
    console.log('  ' + (k === 'ok' ? 'ok   ' : k === 'FAIL' ? 'FAIL ' : k === 'xfail' ? 'xfail' : k === 'XPASS' ? 'XPASS' : 'warn ') + ' ' + m);
  }
  LOG.length = 0;
}

// ═══════════ In der Seite: QA-Helfer (läuft im Script-Scope der App → greift auf deren Globals zu) ═══════════
function qaMain() {
  function hash(s) { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0; return (x >>> 0).toString(36); }
  const CSK = ['fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'letterSpacing', 'textTransform', 'color', 'textShadow', 'lineHeight', 'opacity', 'transform', 'filter', 'backgroundColor', 'borderRadius', 'boxShadow', 'padding', 'webkitTextFillColor'];
  function csOf(el, p, o) {
    if (!el) { CSK.forEach(k => { o[p + '.' + k] = null; }); return; }
    const c = getComputedStyle(el); CSK.forEach(k => { o[p + '.' + k] = c[k]; });
  }
  const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const vid = () => document.getElementById('mainVid');
  const frame = () => document.getElementById('prevFrame');
  function curBi() { const t = (vid().currentTime || 0) + timeOff; let bi = currentBlockIdx(t); if (bi < 0) bi = nearestBlockIdx(t); return bi; }
  const qa = {
    hash,
    raf2, wait, curBi,
    // Videozeit setzen (pausiert) und Overlay rendern, wie es ein Scrub tut
    seekTo(t) {
      return new Promise(res => {
        const v = vid(); if (!v.paused) v.pause();
        let done = false;
        const fin = () => { if (done) return; done = true; v.removeEventListener('seeked', fin); _lastKey = null; updateOverlay(); raf2().then(res); };
        v.addEventListener('seeked', fin);
        if (Math.abs(v.currentTime - t) < 0.002) fin(); else v.currentTime = t;
        setTimeout(fin, 2500);
      });
    },
    // Zeilen (= verschiedene offsetTop der Wort-Spans) im aktuellen Overlay
    domLines() {
      const sp = document.getElementById('capOverlay').querySelectorAll('[data-oi]'), tops = {};
      sp.forEach(s => { tops[Math.round(s.offsetTop)] = 1; });
      return Object.keys(tops).length;
    },
    // Block wählen: need.lines = genau so viele DOM-Zeilen, need.emph = enthält hervorgehobenes Wort, need.words ≥ n. → { bi, t }
    async pickBlock(need) {
      need = need || {};
      let best = null;
      for (let bi = 0; bi < captionBlocks.length; bi++) {
        const b = captionBlocks[bi];
        if (need.words && b.words.length < need.words) continue;
        if (need.emph && !b.words.some(isEmphWord)) continue;
        const t = (b.start + b.end) / 2 - timeOff;
        await qa.seekTo(t);
        const n = qa.domLines();
        if (!need.lines || n === need.lines) return { bi, t, lines: n };
        if (!best) best = { bi, t, lines: n };
      }
      if (best) await qa.seekTo(best.t);
      return best;
    },
    // Schrift(en) des Styles vollständig laden, bevor gemessen wird
    async useStyle(id) {
      selectStyle(id);
      const s = STYLES.find(x => x.id === activeId);
      await ensureCapFont(styleFontName(s), 8000); await ensureStyleFaces(s, 8000);
      try { await document.fonts.ready; } catch (e) {}
      _lastKey = null; updateOverlay(); await raf2();
    },
    // Signatur: flaches Objekt aus Konfiguration, Style-Feldern und DOM-Zustand des Overlays
    sig() {
      const o = {};
      const s = STYLES.find(x => x.id === activeId) || {};
      Object.keys(s).forEach(k => { if (['id', 'name', 'badge', '_tpl', '_isTpl', '_tplId'].indexOf(k) >= 0) return; const v = s[k]; o['style.' + k] = (v !== null && typeof v === 'object') ? JSON.stringify(v) : v; });
      o['cfg.active'] = activeId; o['cfg.lines'] = CAPTION_LINES; o['cfg.wpb'] = WORDS_PER_BLOCK; o['cfg.maxChars'] = CAP_MAX_CHARS;
      o['cfg.fontSize'] = fontSize; o['cfg.pos'] = capPos; o['cfg.voff'] = capVOff; o['cfg.mode'] = displayMode; o['cfg.case'] = capCase;
      o['cfg.punct'] = capNoPunct ? 1 : 0; o['cfg.kw'] = emKw ? 1 : 0; o['cfg.emoji'] = emEmoji ? 1 : 0; o['cfg.zoom'] = emZoom; o['cfg.timeOff'] = timeOff;
      o['cfg.blocks'] = captionBlocks.length;
      o['cfg.text'] = hash(captionBlocks.map(b => b.text).join('|'));
      o['cfg.timing'] = hash(captionBlocks.map(b => b.start.toFixed(2) + '-' + b.end.toFixed(2)).join('|'));
      o['cfg.cuts'] = (typeof tlSnapOn !== 'undefined' ? (tlSnapOn ? 1 : 0) : '');
      const ov = document.getElementById('capOverlay'), sp = ov.querySelectorAll('[data-oi]');
      o['dom.lines'] = qa.domLines(); o['dom.words'] = sp.length; o['dom.hash'] = hash(ov.innerHTML);
      const root = ov.querySelector('.cap-root'), fr = frame().getBoundingClientRect();
      if (root) { const r = root.getBoundingClientRect(); o['dom.root.top'] = Math.round(r.top - fr.top); o['dom.root.height'] = Math.round(r.height); o['dom.root.width'] = Math.round(r.width); o['dom.root.left'] = Math.round(r.left - fr.left); }
      else { o['dom.root.top'] = o['dom.root.height'] = o['dom.root.width'] = o['dom.root.left'] = null; }
      csOf(root, 'dom.root', o);
      const bi = curBi(), b = captionBlocks[bi], wi = b ? activeWordIdx(b, (vid().currentTime || 0) + timeOff) : -1;
      csOf(sp[0] || null, 'dom.span0', o);
      csOf(Array.prototype.find.call(sp, x => +x.getAttribute('data-oi') === wi) || null, 'dom.act', o);
      o['dom.vidTransform'] = getComputedStyle(vid()).transform;
      o['cfg.time'] = Math.round((vid().currentTime || 0) * 100) / 100;
      o['cfg.lang'] = whisperLang; o['cfg.translate'] = doTranslate ? 1 : 0; o['cfg.vocab'] = vocabText; o['cfg.exportRes'] = exportRes; o['cfg.exportFmt'] = exportFormat;
      o['cfg.autoCut'] = autoCutSilence ? 1 : 0; o['cfg.breakCuts'] = typeof breakAtCuts !== 'undefined' ? (breakAtCuts ? 1 : 0) : null;
      o['cfg.templates'] = userTemplates.filter(t => !t.deleted).length; o['cfg.undo'] = _undoStack.length; o['cfg.redo'] = _redoStack.length;
      try { o['cfg.expSkip'] = localStorage.getItem(EXP_SKIP_KEY); } catch (e) { o['cfg.expSkip'] = null; }
      const sub = document.getElementById('btnVideoSub'); o['ui.btnVideoSub'] = sub ? sub.textContent : null;
      const sel = document.querySelector('#capSegs .cap-seg.active'); o['ui.segActive'] = sel ? sel.id : null;
      const pt = document.getElementById('expPostTa'); o['ui.postTa'] = pt ? pt.value : null;
      const ie = document.getElementById('capInlineEd'); o['ui.inlineEd'] = ie ? ie.style.display : null;
      const cm = document.getElementById('coverModal');
      if (cm && cm.style.display !== 'none') { o['cover.hash'] = hash(document.getElementById('cvCanvas').toDataURL()); o['cover.state'] = JSON.stringify(coverState); }
      o['tl.snap'] = typeof tlSnapOn !== 'undefined' ? (tlSnapOn ? 1 : 0) : null; o['tl.sel'] = typeof tlSel !== 'undefined' ? tlSel : null;
      o['tl.multi'] = typeof tlMulti !== 'undefined' ? (tlMulti ? 1 : 0) : null; o['tl.pps'] = typeof tlView !== 'undefined' ? Math.round(tlView.pps * 100) / 100 : null;
      o['tl.start'] = typeof tlView !== 'undefined' ? Math.round(tlView.start * 100) / 100 : null;
      o['tl.fit'] = typeof _tl !== 'undefined' ? (_tl.fit ? 1 : 0) : null; o['tl.mpps'] = typeof _tl !== 'undefined' ? _tl.mpps : null;
      o['tl.open'] = typeof _tl !== 'undefined' ? (_tl.open ? 1 : 0) : null;
      o['tl.gaps'] = hash(captionBlocks.map(b => b.end.toFixed(2)).join('|'));
      return o;
    },
    // Horizontale Hygiene + Tippflächen der aktuell SICHTBAREN Elemente
    hygiene(minTap) {
      const vw = document.documentElement.clientWidth, vh = innerHeight, out = { overflowX: false, outside: [], small: [] };
      out.overflowX = document.documentElement.scrollWidth > vw + 1;
      function desc(el) {
        const t = (el.getAttribute('aria-label') || el.title || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28);
        return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '') + (t ? ' «' + t + '»' : '');
      }
      function visible(el) {
        for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; }
        return el.getClientRects().length > 0;
      }
      // sichtbarer Ausschnitt eines Elements: von allen Vorfahren mit overflow ≠ visible beschnitten
      function clipped(el) {
        let r = el.getBoundingClientRect(), L = r.left, R = r.right, T = r.top, B = r.bottom;
        for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
          const c = getComputedStyle(n);
          if (c.overflowX !== 'visible' || c.overflowY !== 'visible') { const q = n.getBoundingClientRect(); if (c.overflowX !== 'visible') { L = Math.max(L, q.left); R = Math.min(R, q.right); } if (c.overflowY !== 'visible') { T = Math.max(T, q.top); B = Math.min(B, q.bottom); } }
        }
        return { L, R, T, B };
      }
      const seen = {};
      document.querySelectorAll('body *').forEach(el => {
        if (/^(SCRIPT|STYLE|PATH|G|DEFS|USE|CIRCLE|RECT|LINE|POLYLINE|POLYGON|ELLIPSE)$/i.test(el.tagName) || el.closest('svg') && el.tagName.toLowerCase() !== 'svg') return;
        if (!visible(el)) return;
        const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return;
        const c = clipped(el);
        if (c.R - c.L > 0.5 && (c.R > vw + 1 || c.L < -1) && !el.closest('#capOverlay,#tlWrap,.show-row,#toast,.toast')) {
          const d = desc(el); if (!seen[d]) { seen[d] = 1; out.outside.push(d + ' [' + Math.round(c.L) + '…' + Math.round(c.R) + ' von ' + vw + ']'); }
        }
        if (minTap && /^(BUTTON|A|SELECT|SUMMARY)$/.test(el.tagName) || minTap && (el.tagName === 'INPUT' && el.type !== 'hidden') || minTap && el.getAttribute('role') === 'button') {
          if (el.tagName === 'INPUT' && el.type === 'file') return;
          let q = r; if (el.tagName === 'INPUT' && /checkbox|radio/.test(el.type)) { const lb = el.closest('label'); if (lb) q = lb.getBoundingClientRect(); }
          if (el.tagName === 'INPUT' && el.type === 'range') q = { width: r.width, height: Math.max(r.height, 32) }; // Regler: Daumen ist grösser als die Spur
          if (c.R - c.L > 0.5 && c.B > 0 && c.T < vh && Math.min(q.width, q.height) < minTap) { const d = desc(el); if (!seen['s' + d]) { seen['s' + d] = 1; out.small.push(d + ' ' + Math.round(q.width) + '×' + Math.round(q.height)); } }
        }
      });
      return out;
    },
    // Geometrie-Fall: DOM-Wortrechtecke (auf Export-Breite W skaliert) vs. capLayout
    geom(W) {
      const bi = curBi(), b = captionBlocks[bi]; if (!b) return null;
      const s0 = STYLES.find(x => x.id === activeId), s = caseStyle(s0), t = (vid().currentTime || 0) + timeOff;
      const wi = activeWordIdx(b, t), H = Math.round(W * previewFrameH() / previewFrameW());
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      _capLayoutCache = { key: null, s: null, ctx: null, val: null }; _capFitCache = {}; _capFitN = 0;
      const L = capLayout(cv.getContext('2d'), b, bi, wi, s, W, H);
      const ov = document.getElementById('capOverlay'), fr = frame().getBoundingClientRect(), ratio = fr.width / previewFrameW();
      const spans = Array.prototype.slice.call(ov.querySelectorAll('[data-oi]'));
      spans.forEach(x => { x.style.transform = 'none'; }); // laufende Pop-/Lift-Animation würde die Rechtecke verschieben
      const pieces = []; L.lines.forEach((ln, li) => ln.forEach(wo => pieces.push({ wo, li })));
      const out = { n: spans.length, nExp: pieces.length, linesDom: qa.domLines(), linesExp: L.lines.length, scale: L.scale, fsS: L.fsS, lhExp: L.lh, dx: 0, dw: 0, dy: 0, dh: 0, pitchDom: null, W, H, worst: '' };
      const rows = {};
      for (let i = 0; i < Math.min(spans.length, pieces.length); i++) {
        const r = spans[i].getBoundingClientRect(), p = pieces[i].wo, k = W / (previewFrameW() * ratio);
        const x = (r.left - fr.left) * k, w = r.width * k, top = (r.top - fr.top) * k, h = r.height * k;
        const dx = Math.abs(x - p.x), dw = Math.abs(w - p.w), dy = Math.abs(top - (p.y - L.capA)), dh = Math.abs(h - (L.capA + L.capD));
        if (dx > out.dx) { out.dx = dx; out.worst = 'x ' + spans[i].textContent; }
        out.dw = Math.max(out.dw, dw); out.dy = Math.max(out.dy, dy); out.dh = Math.max(out.dh, dh);
        rows[pieces[i].li] = top;
      }
      const ks = Object.keys(rows).sort();
      if (ks.length > 1) out.pitchDom = (rows[ks[1]] - rows[ks[0]]);
      out.topDom = rows[ks[0]]; out.topExp = pieces.length ? pieces[0].wo.y - L.capA : null;
      out.pitchExp = L.lh;
      return out;
    },
    // Pixel-Fall: Export-Render des aktuellen Blocks (Hintergrund #808080) als ImageData-Maske in Zielgrösse w×h
    exportMask(W, w) {
      const bi = curBi(), b = captionBlocks[bi]; if (!b) return null;
      const s0 = STYLES.find(x => x.id === activeId), H = Math.round(W * previewFrameH() / previewFrameW());
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
      _capLayoutCache = { key: null, s: null, ctx: null, val: null }; _capStaticLayer = null;
      drawCaptionsOnCtx(ctx, (vid().currentTime || 0), s0, W, H, true);
      return qa.mask(cv, w);
    },
    // Canvas → Binärmaske (Zelle gesetzt, wenn ≥ 18 % ihrer Pixel von #808080 abweichen), Ecken (r) ausgeblendet
    mask(src, w, cornerR) {
      const h = Math.round(w * src.height / src.width), c2 = document.createElement('canvas'); c2.width = src.width; c2.height = src.height;
      const x2 = c2.getContext('2d'); x2.drawImage(src, 0, 0);
      const d = x2.getImageData(0, 0, src.width, src.height).data, cw = src.width / w, ch = src.height / h, m = new Uint8Array(w * h);
      const diff = new Uint8Array(src.width * src.height);
      for (let i = 0, j = 0; i < d.length; i += 4, j++) diff[j] = (Math.abs(d[i] - 128) + Math.abs(d[i + 1] - 128) + Math.abs(d[i + 2] - 128) > 60) ? 1 : 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let n = 0, tot = 0; const x0 = Math.floor(x * cw), x1 = Math.floor((x + 1) * cw), y0 = Math.floor(y * ch), y1 = Math.floor((y + 1) * ch);
        for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { n += diff[yy * src.width + xx]; tot++; }
        m[y * w + x] = tot && n / tot >= 0.18 ? 1 : 0;
      }
      return { w, h, bits: Array.from(m) };
    },
    maskFromImage(dataUrl, W, H, w) {
      return new Promise(res => {
        const img = new Image(); img.onload = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(img, 0, 0, W, H); res(qa.mask(cv, w)); };
        img.src = dataUrl;
      });
    },
  };
  return qa;
}
const QA_SRC = '(' + qaMain.toString() + ')()';

// ═══════════ Szenario: frischer Browser-Kontext + geladener Editor ═══════════
const BASE = { url: '' };
const PROFILES = [
  { name: 'desktop', viewport: { width: 1280, height: 800 }, mobile: false },
  { name: 'phone', viewport: { width: 390, height: 844 }, mobile: true },
];
async function newScenario(browser, prof, opts) {
  opts = opts || {};
  const ctx = await browser.newContext({ viewport: prof.viewport, isMobile: prof.mobile, hasTouch: prof.mobile, acceptDownloads: true, deviceScaleFactor: opts.dpr || 1 });
  await routeSupabase(ctx, BASE.url);
  try { await ctx.grantPermissions(['clipboard-read', 'clipboard-write']); } catch (e) {}
  const page = await ctx.newPage();
  const sc = { ctx, page, errors: [], failed: [], prof };
  page.on('dialog', d => { sc.errors.push('dialog: ' + d.message()); d.dismiss(); });
  page.on('pageerror', e => sc.errors.push('pageerror: ' + String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) sc.errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(BASE.url) && !/\/api\//.test(r.url())) sc.failed.push(r.status() + ' ' + r.url().replace(BASE.url, '')); });
  if (opts.route) await opts.route(ctx);
  await page.goto(BASE.url + '/', { waitUntil: 'load' });
  if (opts.beforeUpload) await opts.beforeUpload(page);
  await page.setInputFiles('#landInput', opts.video || VIDEO);
  await page.waitForFunction(() => typeof captionBlocks !== 'undefined' && captionBlocks.length > 0 && vidReady, null, { timeout: 60000 });
  await page.evaluate(QA_SRC.replace(/^/, 'window.__qa = ')); // setzt window.__qa
  await page.evaluate(() => { document.querySelectorAll('.coach').forEach(c => { c.style.display = 'none'; }); });
  sc.close = () => ctx.close();
  return sc;
}
const sigOf = sc => sc.page.evaluate(() => window.__qa.sig());
async function shot(sc, name) { if (SHOTS) try { await sc.page.screenshot({ path: path.join(SHOTS, curVp + '-' + name.replace(/[^\w.-]+/g, '_') + '.png') }); } catch (e) {} }
function diffSig(a, b) { const d = []; for (const k of new Set(Object.keys(a).concat(Object.keys(b)))) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) d.push(k); return d; }
// Muster: exakter Schlüssel, «dom.span0.*» (Präfix) oder «style.*»
const matches = (k, pat) => pat.endsWith('*') ? k.startsWith(pat.slice(0, -1)) : k === pat;

// ═══════════ Abschnitte (registrieren sich in SECTIONS) ═══════════
const SECTIONS = {};


// ═══════════ Abschnitt ctl: datengetriebene Kontroll-Tabelle ═══════════
// Felder je Eintrag:
//   id, tab ('style'|'captions'|'timeline'|'export'|'cover'|'settings'), sel, op ('range'|'color'|'select'|'check'|'click'|'run'), values[]
//   changes[]    Signatur-Schlüssel, die sich bei MINDESTENS einem Wert ändern müssen («style.lh», «dom.span0.*», «cfg.fontSize» …)
//   inv[]        Schlüssel, die sich bei KEINEM Wert ändern dürfen (Invarianten: Zeilen, Wörter/Block, Blockanzahl, Schriftgrösse …)
//   styleOnly[]  erlaubte Style-Felder (Änderungen an anderen Feldern = Übersprechen zwischen Reglern)
//   noopOk       Begründung, falls die Kontrolle in diesem Testaufbau legitim nichts ändert (sonst ist «ändert nichts» ein Fehler)
//   custom       Customize-Regler (läuft zusätzlich mit einem Ausgangs-Style MIT Layout-Preset → variants)
//   emph/punct   Testblock muss ein hervorgehobenes Wort / Satzzeichen enthalten
//   seek         { word, dt }: statt Blockmitte auf Wortstart + dt pausieren
//   pre/setup    async function(sc): pre = erste Anpassung VOR den Layout-Einstellungen des Nutzers, setup = nach der Blockwahl (Zustand herstellen);  vp: nur in diesen Viewports;  hiddenOk: Begründung, falls nicht sichtbar
const LAYOUT_INV = ['cfg.lines', 'cfg.wpb', 'cfg.blocks', 'cfg.fontSize', 'cfg.pos', 'cfg.maxChars', 'dom.lines'];
const inv = (...drop) => LAYOUT_INV.filter(k => !drop.includes(k));
const NOCHANGE_FS = k => k; // Lesehilfe
const CUSTOM_VARIANTS = ['plain', 'layoutPreset'];
const HL_FIELDS = ['hl', 'hlg', 'hlCycle', 'hlPillBg', 'hlc', 'hls'];
const CTL = [
  // ── Style-Tab: Layout ──
  { id: 'szSlider', tab: 'style', op: 'range', sel: '#szSlider', values: [14, 34], changes: ['cfg.fontSize', 'dom.span0.fontSize'], inv: inv('cfg.fontSize', 'cfg.blocks', 'dom.lines', 'cfg.maxChars') },
  { id: 'pos', tab: 'style', op: 'click', values: ['#posRow [data-pos="top"]', '#posRow [data-pos="center"]'], changes: ['cfg.pos', 'dom.root.top'], inv: inv('cfg.pos').concat('dom.span0.fontSize') },
  { id: 'wpbSlider', tab: 'style', op: 'range', sel: '#wpbSlider', values: [1, 6], changes: ['cfg.wpb', 'cfg.blocks'], inv: ['cfg.lines', 'cfg.fontSize', 'cfg.pos'] },
  { id: 'mcAuto', tab: 'style', op: 'click', sel: '#mcAuto', values: [null], changes: ['cfg.maxChars'], inv: ['cfg.lines', 'cfg.wpb', 'cfg.fontSize', 'cfg.pos'] },
  { id: 'mcSel', tab: 'style', op: 'range', sel: '#mcSel', values: [8, 30], changes: ['cfg.maxChars', 'cfg.blocks'], inv: ['cfg.lines', 'cfg.wpb', 'cfg.fontSize', 'cfg.pos'] },
  { id: 'lines', tab: 'style', op: 'click', values: ['#linesRow [data-lines="1"]'], changes: ['cfg.lines', 'dom.lines'], inv: ['cfg.wpb', 'cfg.fontSize', 'cfg.pos'] },
  { id: 'caseSel', tab: 'style', op: 'select', sel: '#caseSel', values: ['lower', 'orig'], changes: ['cfg.case', 'dom.hash'], inv: ['cfg.wpb', 'cfg.lines', 'cfg.pos', 'cfg.fontSize'] },
  // ── Style-Tab: Emphasis ──
  { id: 'emKwBtn', tab: 'style', op: 'click', sel: '#emKwBtn', values: [null], emph: true, changes: ['cfg.kw', 'dom.hash'], inv: ['cfg.wpb', 'cfg.lines', 'cfg.pos', 'cfg.fontSize'] },
  { id: 'emEmoBtn', tab: 'style', op: 'click', sel: '#emEmoBtn', values: [null], changes: ['cfg.emoji', 'dom.hash'], inv: ['cfg.wpb', 'cfg.lines', 'cfg.pos', 'cfg.fontSize'],
    setup: sc => sc.page.evaluate(() => { setBlockEmoji(__qa.curBi(), '🔥'); setEmphEmoji(false); }) },
  { id: 'emZoomRow', tab: 'style', op: 'click', values: ['#emZoomRow [data-z="subtle"]', '#emZoomRow [data-z="punchy"]'], changes: ['cfg.zoom', 'dom.vidTransform'], inv: ['cfg.wpb', 'cfg.lines', 'cfg.pos', 'cfg.fontSize', 'dom.lines'],
    setup: sc => sc.page.evaluate(() => { captionBlocks[__qa.curBi()].words[0].zm = 1; _zoomPlanKey = null; }), seek: { word: 0, dt: 1.0 } },
  // ── Style-Tab: Customize ──
  { id: 'csLs', tab: 'style', custom: true, op: 'range', sel: '#csLs', values: [-1, 4], changes: ['style.ls', 'dom.span0.letterSpacing'], styleOnly: ['ls'], inv: inv('dom.lines', 'cfg.blocks') },
  { id: 'csLh', tab: 'style', custom: true, op: 'range', sel: '#csLh', values: [0.9, 1.8], changes: ['style.lh', 'dom.span0.lineHeight'], styleOnly: ['lh'], inv: LAYOUT_INV.concat('dom.span0.fontSize') },
  { id: 'csText', tab: 'style', custom: true, op: 'color', sel: '#csText', values: ['#ff0000', '#22cc88'], changes: ['style.tc', 'dom.span0.color'], styleOnly: ['tc', 'tg'], inv: LAYOUT_INV.concat('dom.span0.fontSize') },
  { id: 'csHl', tab: 'style', custom: true, op: 'color', sel: '#csHl', values: ['#ff0000', '#00ffaa'], changes: ['dom.act.color'], styleOnly: HL_FIELDS, inv: LAYOUT_INV.concat('dom.span0.color', 'dom.span0.fontSize') },
  { id: 'csFont', tab: 'style', custom: true, op: 'select', sel: '#csFont', values: ['Anton', 'Playfair Display'], changes: ['style.fl', 'style.font', 'dom.span0.fontFamily'], styleOnly: ['fl', 'font', 'hlFont'], inv: ['cfg.lines', 'cfg.wpb', 'cfg.pos', 'cfg.fontSize'], wait: 900 },
  { id: 'csWeight', tab: 'style', custom: true, op: 'select', sel: '#csWeight', values: ['400', '900'], changes: ['style.fw', 'dom.span0.fontWeight'], styleOnly: ['fw'], inv: ['cfg.lines', 'cfg.wpb', 'cfg.pos', 'cfg.fontSize'] },
  { id: 'csEm', tab: 'style', custom: true, op: 'color', sel: '#csEm', values: ['#ff00ff', '#00aaff'], emph: true, changes: ['style.em', 'dom.hash'], styleOnly: ['em'], inv: LAYOUT_INV.concat('dom.span0.fontSize') },
  { id: 'csEmFont', tab: 'style', custom: true, op: 'select', sel: '#csEmFont', values: ['Anton'], emph: true, changes: ['style.emFont', 'dom.hash'], styleOnly: ['emFont'], inv: ['cfg.lines', 'cfg.wpb', 'cfg.pos', 'cfg.fontSize'], wait: 900 },
  { id: 'csOutlineW', tab: 'style', custom: true, op: 'range', sel: '#csOutlineW', values: [3, 8], changes: ['style.ts', 'dom.span0.textShadow'], styleOnly: ['ts', 'cstroke', 'hls'], inv: inv('dom.lines', 'cfg.blocks').concat('dom.span0.fontSize') },
  { id: 'csOutlineC', tab: 'style', custom: true, op: 'color', sel: '#csOutlineC', values: ['#ff0000'], changes: ['style.ts', 'dom.span0.textShadow'], styleOnly: ['ts', 'cstroke', 'hls'], inv: LAYOUT_INV.concat('dom.span0.fontSize') },
  { id: 'csShadow', tab: 'style', custom: true, op: 'check', sel: '#csShadow', values: [null], changes: ['style.ts'], styleOnly: ['ts', 'cstroke', 'hls'], inv: LAYOUT_INV.concat('dom.span0.fontSize') },
  { id: 'csGlow', tab: 'style', custom: true, op: 'check', sel: '#csGlow', values: [null], changes: ['style.hls'], styleOnly: HL_FIELDS, inv: LAYOUT_INV.concat('dom.span0.fontSize') },
  { id: 'csGlowInt', tab: 'style', custom: true, op: 'range', sel: '#csGlowInt', values: [4, 30], changes: ['style.hls'], styleOnly: HL_FIELDS, inv: LAYOUT_INV.concat('dom.span0.fontSize'),
    pre: sc => sc.page.evaluate(() => { const g = document.getElementById('csGlow'); if (!g.checked) g.click(); }) },
  { id: 'csBox', tab: 'style', custom: true, op: 'select', sel: '#csBox', values: ['box', 'pill'], changes: ['style.boxBg', 'style.boxBr', 'dom.root.backgroundColor'], styleOnly: ['boxBg', 'boxBr'], inv: ['cfg.lines', 'cfg.wpb', 'cfg.pos', 'cfg.fontSize'] },
  { id: 'csBoxC', tab: 'style', custom: true, op: 'color', sel: '#csBoxC', values: ['#ff0000'], changes: ['style.boxBg', 'dom.root.backgroundColor'], styleOnly: ['boxBg', 'boxBr'], inv: ['cfg.lines', 'cfg.wpb', 'cfg.pos', 'cfg.fontSize'] },
  { id: 'csBoxO', tab: 'style', custom: true, op: 'range', sel: '#csBoxO', values: [30, 100], changes: ['style.boxBg', 'dom.root.backgroundColor'], styleOnly: ['boxBg', 'boxBr'], inv: ['cfg.lines', 'cfg.wpb', 'cfg.pos', 'cfg.fontSize'] },
  { id: 'csBoxR', tab: 'style', custom: true, op: 'range', sel: '#csBoxR', values: [0, 30], changes: ['style.boxBr', 'dom.root.borderRadius'], styleOnly: ['boxBg', 'boxBr'], inv: ['cfg.lines', 'cfg.wpb', 'cfg.pos', 'cfg.fontSize'] },
  { id: 'csHlType', tab: 'style', custom: true, op: 'select', sel: '#csHlType', values: ['pill'], changes: ['style.hlPillBg'], styleOnly: HL_FIELDS, inv: inv('dom.lines', 'cfg.blocks').concat('dom.span0.fontSize') },
  { id: 'csMotion', tab: 'style', custom: true, op: 'select', sel: '#csMotion', values: ['reveal', 'fill', 'none'], changes: ['style.motion', 'dom.hash'], styleOnly: ['motion'], inv: LAYOUT_INV.concat('dom.span0.fontSize') },
  { id: 'csAnim', tab: 'style', custom: true, op: 'select', sel: '#csAnim', values: ['scale', 'punch', 'bounce', 'flash', 'glow'], changes: ['style.anim', 'dom.act.*'], styleOnly: ['anim'], inv: LAYOUT_INV.concat('dom.span0.fontSize'),
    pre: sc => sc.page.selectOption('#csAnim', 'none'), seek: { word: 1, dt: 0.08 } },
  // ── Style-Tab: Customize › Timing & text ──
  { id: 'toSlider', tab: 'style', custom: false, op: 'range', sel: '#toSlider', values: [-0.3, 0.3], changes: ['cfg.timeOff'], inv: ['cfg.lines', 'cfg.wpb', 'cfg.pos', 'cfg.fontSize'], customize: true },
  { id: 'pauseChk', tab: 'style', op: 'check', sel: '#pauseChk', values: [null], changes: ['cfg.mode'], inv: LAYOUT_INV, customize: true },
  { id: 'punctBtn', tab: 'style', op: 'check', sel: '#punctBtn', values: [null], punct: true, changes: ['cfg.punct', 'dom.hash'], inv: ['cfg.wpb', 'cfg.lines', 'cfg.pos', 'cfg.fontSize'], customize: true },
];



// ── weitere Gruppen: Captions-Tab, Timeline, Export-Sheet, Cover, Einstellungen ──
const tapSel = (sc, sel, o) => sc.prof.mobile ? sc.page.tap(sel, Object.assign({ timeout: 4000 }, o)) : sc.page.click(sel, Object.assign({ timeout: 4000 }, o));
const OPEN_EXPORT = async sc => { await tapSel(sc, '#tbExport'); await sc.page.waitForSelector('#expSheet', { state: 'visible', timeout: 4000 }); await sc.page.waitForTimeout(250); };
const OPEN_EXPOPTS = async sc => { await OPEN_EXPORT(sc); await tapSel(sc, '#expOpts > summary'); await sc.page.waitForTimeout(150); };
const OPEN_COVER = async sc => { await OPEN_EXPORT(sc); await tapSel(sc, '#btnCover'); await sc.page.waitForSelector('#coverModal', { state: 'visible', timeout: 4000 }); await sc.page.waitForTimeout(1000); };
const OPEN_TRSET = async sc => { await tapSel(sc, '#trSet > summary'); await sc.page.waitForTimeout(150); };
const GOTO_TL = async sc => { if (sc.prof.mobile) await goTab(sc, 'timeline'); else await sc.page.evaluate(() => { if (!_tl.open) tlSetOpen(true, false); }); await sc.page.waitForTimeout(400); };
const COVER_INV = ['cfg.lines', 'cfg.wpb', 'cfg.blocks', 'cfg.text', 'cfg.fontSize', 'cfg.pos'];
const CAP_INV = ['cfg.wpb', 'cfg.lines', 'cfg.pos', 'cfg.fontSize'];
const tlClickBlock = async (sc, idx) => { // Balken idx in der Timeline antippen/anklicken (Maus bzw. Finger)
  const pt = await sc.page.evaluate(i => { const g = tlGeom(), b = captionBlocks[i], r = _tl.cv.getBoundingClientRect(), v = tlView, off = timeOff || 0;
    const x = tlTimeToX((b.start + b.end) / 2 - off, v); return { x: r.left + x, y: r.top + g.barY + 6 }; }, idx);
  if (sc.prof.mobile) await sc.page.touchscreen.tap(pt.x, pt.y); else await sc.page.mouse.click(pt.x, pt.y);
  await sc.page.waitForTimeout(200);
};
CTL.push(
  // ── Captions-Tab ──
  { id: 'segEdit', tab: 'captions', op: 'run', values: [null], run: async sc => { await tapSel(sc, '#seg1 .cap-seg-ta'); await sc.page.fill('#seg1 .cap-seg-ta', 'Neuer Text'); await sc.page.keyboard.press('Tab'); }, changes: ['cfg.text'], inv: ['cfg.blocks', 'cfg.wpb', 'cfg.lines'], lines: 0 },
  { id: 'segTimeShift', tab: 'captions', op: 'run', values: [null], run: async sc => { await tapSel(sc, '#seg2'); await tapSel(sc, '#seg2 [data-a="start:0.1"]'); }, changes: ['cfg.timing'], inv: ['cfg.blocks', 'cfg.text', 'cfg.wpb', 'cfg.lines'], lines: 0 },
  { id: 'segDel', tab: 'captions', op: 'run', values: [null], run: async sc => { await tapSel(sc, '#seg2'); await tapSel(sc, '#seg2 [data-a="del"]'); }, changes: ['cfg.blocks', 'cfg.text'], inv: ['cfg.wpb', 'cfg.lines', 'cfg.fontSize'], lines: 0 },
  { id: 'segWordEmph', tab: 'captions', op: 'run', values: [null], emph: true, run: async sc => { await tapSel(sc, '#seg0'); await tapSel(sc, '#seg0 .se-w[data-a="w:0"]'); }, changes: ['dom.hash'], inv: CAP_INV.concat('cfg.blocks') },
  { id: 'segEmoji', tab: 'captions', op: 'run', values: [null], run: async sc => { await tapSel(sc, '#seg0'); await tapSel(sc, '#seg0 .se-emo'); await sc.page.waitForSelector('#emoPick', { state: 'visible', timeout: 3000 }); await tapSel(sc, '#emoPick button >> nth=1'); },
    changes: ['cfg.emoji', 'dom.hash'], inv: CAP_INV.concat('cfg.blocks'), lines: 0 },
  { id: 'findReplace', tab: 'captions', op: 'run', values: [null], run: async sc => { await tapSel(sc, '#frBox > summary'); await sc.page.fill('#frFind', 'Das'); await sc.page.fill('#frRepl', 'Dies'); await tapSel(sc, '#frBtn'); }, changes: ['cfg.text', 'cfg.undo'], inv: ['cfg.blocks', 'cfg.wpb', 'cfg.lines'], lines: 0 },
  { id: 'undoBtn', tab: 'captions', op: 'click', sel: '#undoBtn', values: [null], setup: sc => sc.page.evaluate(() => deleteSeg(2)), changes: ['cfg.blocks', 'cfg.redo'], inv: ['cfg.wpb', 'cfg.lines'], lines: 0, wait: 500 },
  { id: 'redoBtn', tab: 'captions', op: 'click', sel: '#redoBtn', values: [null], setup: async sc => { await sc.page.evaluate(() => { deleteSeg(2); undoCaptions(); }); }, changes: ['cfg.blocks', 'cfg.redo'], inv: ['cfg.wpb', 'cfg.lines'], lines: 0, wait: 500 },
  // ── Einstellungen (Video & language) ──
  { id: 'langSel', tab: 'captions', op: 'select', sel: '#langSel', values: ['english'], pre: OPEN_TRSET, changes: ['cfg.lang'], inv: CAP_INV, lines: 0 },
  { id: 'vocabInput', tab: 'captions', op: 'range', sel: '#vocabInput', values: ['Birkenhof'], pre: OPEN_TRSET, changes: ['cfg.vocab'], inv: CAP_INV, lines: 0 },
  { id: 'trEn', tab: 'captions', op: 'check', sel: '#trEn', values: [null], pre: OPEN_TRSET, changes: ['cfg.translate'], inv: CAP_INV, lines: 0 },
  // ── Timeline ──
  { id: 'tlSnap', tab: 'timeline', op: 'click', sel: '#tlSnapBtn', values: [null], vp: ['desktop'], pre: GOTO_TL, changes: ['tl.snap'], inv: ['cfg.blocks', 'cfg.text', 'cfg.timing'], lines: 0 },
  { id: 'taSnap', tab: 'timeline', op: 'click', sel: '#taSnap', values: [null], vp: ['phone'], pre: GOTO_TL, changes: ['tl.snap'], inv: ['cfg.blocks', 'cfg.text', 'cfg.timing'], lines: 0 },
  { id: 'tlZoomIn', tab: 'timeline', op: 'click', sel: '#tlWrap button[aria-label="Zoom timeline in"]', values: [null], pre: GOTO_TL, changesAny: ['tl.pps', 'tl.mpps'], inv: ['cfg.blocks', 'cfg.text', 'cfg.timing'], lines: 0 },
  { id: 'tlZoomOut', tab: 'timeline', op: 'click', sel: '#tlWrap button[aria-label="Zoom timeline out"]', values: [null], pre: GOTO_TL, setup: sc => sc.page.evaluate(() => { tlZoomBtn(2.5); tlRequestDraw(); }), changesAny: ['tl.pps', 'tl.mpps'], inv: ['cfg.blocks', 'cfg.text', 'cfg.timing'], lines: 0 },
  { id: 'tlFit', tab: 'timeline', op: 'click', sel: '#tlWrap .tl-fit', values: [null], vp: ['desktop'], pre: GOTO_TL, setup: sc => sc.page.evaluate(() => { tlZoomBtn(2.5); tlRequestDraw(); }), changes: ['tl.fit', 'tl.pps'], inv: ['cfg.blocks', 'cfg.text', 'cfg.timing'], lines: 0 },
  { id: 'tlGaps', tab: 'timeline', op: 'click', sel: '#tlGapBtn', values: [null], vp: ['desktop'], pre: GOTO_TL, setup: sc => sc.page.evaluate(() => { captionBlocks[1].end -= 0.3; captionBlocks[1].words[captionBlocks[1].words.length - 1].end -= 0.3; }), changes: ['cfg.timing'], inv: ['cfg.blocks', 'cfg.text'], lines: 0 },
  { id: 'taGaps', tab: 'timeline', op: 'click', sel: '#taGaps', values: [null], vp: ['phone'], pre: GOTO_TL, setup: sc => sc.page.evaluate(() => { captionBlocks[1].end -= 0.3; captionBlocks[1].words[captionBlocks[1].words.length - 1].end -= 0.3; }), changes: ['cfg.timing'], inv: ['cfg.blocks', 'cfg.text'], lines: 0 },
  { id: 'tlSelect', tab: 'timeline', op: 'run', values: [null], pre: GOTO_TL, run: sc => tlClickBlock(sc, 2), changes: ['tl.sel'], inv: ['cfg.blocks', 'cfg.text', 'cfg.timing'], lines: 0 },
  { id: 'taSplit', tab: 'timeline', op: 'click', sel: '#taSplit', values: [null], vp: ['phone'], pre: GOTO_TL, setup: sc => sc.page.evaluate(async () => { tlSelect(0, false); const b = captionBlocks[0]; await __qa.seekTo((b.words[1].start + b.words[2].start) / 2 - timeOff); }), changes: ['cfg.blocks', 'cfg.text'], inv: ['cfg.wpb', 'cfg.lines'], lines: 0 },
  { id: 'taDel', tab: 'timeline', op: 'click', sel: '#taDel', values: [null], vp: ['phone'], pre: GOTO_TL, setup: sc => sc.page.evaluate(() => tlSelect(2, false)), changes: ['cfg.blocks', 'cfg.text'], inv: ['cfg.wpb', 'cfg.lines'], lines: 0 },
  { id: 'tlDelKey', tab: 'timeline', op: 'run', values: [null], vp: ['desktop'], pre: GOTO_TL, setup: sc => sc.page.evaluate(() => { tlSelect(2, false); document.getElementById('tlCanvas').focus(); }), run: sc => sc.page.keyboard.press('Delete'), changes: ['cfg.blocks', 'cfg.text'], inv: ['cfg.wpb', 'cfg.lines'], lines: 0 },
  { id: 'taMulti', tab: 'timeline', op: 'click', sel: '#taMulti', values: [null], vp: ['phone'], pre: GOTO_TL, changes: ['tl.multi'], inv: ['cfg.blocks', 'cfg.text'], lines: 0 },
  { id: 'taEdit', tab: 'timeline', op: 'click', sel: '#taEdit', values: [null], vp: ['phone'], pre: GOTO_TL, setup: sc => sc.page.evaluate(() => tlSelect(1, true)), changes: ['ui.inlineEd'], inv: ['cfg.blocks', 'cfg.text'], lines: 0, wait: 600 },
  // ── Export-Sheet ──
  { id: 'expRes', tab: 'style', op: 'select', sel: '#expRes', values: ['orig'], pre: OPEN_EXPOPTS, changes: ['cfg.exportRes', 'ui.btnVideoSub'], inv: ['cfg.blocks', 'cfg.text', 'cfg.wpb'], lines: 0 },
  { id: 'expFmt', tab: 'style', op: 'select', sel: '#expFmt', values: ['crop'], pre: OPEN_EXPOPTS, changes: ['cfg.exportFmt'], inv: ['cfg.blocks', 'cfg.text'], lines: 0, hiddenOk: 'Format-Wahl erscheint nur bei Videos, die nicht 9:16 sind (Testvideo ist 9:16)' },
  { id: 'autoCutChk', tab: 'style', op: 'check', sel: '#autoCutChk', values: [null], pre: OPEN_EXPOPTS, changes: ['cfg.autoCut'], inv: ['cfg.blocks', 'cfg.text'], lines: 0 },
  { id: 'expSkipChk', tab: 'style', op: 'check', sel: '#expSkipChk', values: [null], pre: OPEN_EXPORT, changes: ['cfg.expSkip'], inv: ['cfg.blocks', 'cfg.text'], lines: 0 },
  { id: 'gateNews', tab: 'style', op: 'check', sel: '#gateNews', values: [null], pre: OPEN_EXPORT, noopOk: 'reines Formularfeld — wirkt erst beim Download (test-e2e prüft den Lead-Eintrag)', inv: ['cfg.blocks', 'cfg.text'], lines: 0 },
  { id: 'btnSRT', tab: 'style', op: 'click', sel: '#btnSRT', values: [null], pre: OPEN_EXPORT, download: { re: /\.srt$/, has: '-->' }, inv: ['cfg.blocks', 'cfg.text'], lines: 0 },
  { id: 'btnVTT', tab: 'style', op: 'click', sel: '#btnVTT', values: [null], pre: OPEN_EXPORT, download: { re: /\.vtt$/, has: 'WEBVTT' }, inv: ['cfg.blocks', 'cfg.text'], lines: 0 },
  { id: 'btnTXT', tab: 'style', op: 'click', sel: '#btnTXT', values: [null], pre: OPEN_EXPORT, download: { re: /\.txt$/, has: 'Das ist' }, inv: ['cfg.blocks', 'cfg.text'], lines: 0 },
  { id: 'btnCopy', tab: 'style', op: 'click', sel: '#btnCopy', values: [null], pre: OPEN_EXPORT, clipboard: 'Das ist', inv: ['cfg.blocks', 'cfg.text'], lines: 0 },
  { id: 'expPost', tab: 'style', op: 'click', sel: '#expPostBtn', values: [null], pre: OPEN_EXPORT, changes: ['ui.postTa'], inv: ['cfg.blocks', 'cfg.text'], lines: 0, wait: 900 },
  // ── Cover-Dialog ──
  { id: 'cvTime', tab: 'style', op: 'range', sel: '#cvTime', values: [1, 4], setup: OPEN_COVER, changes: ['cover.hash', 'cover.state'], inv: COVER_INV, lines: 0, wait: 900 },
  { id: 'cvDark', tab: 'style', op: 'range', sel: '#cvDark', values: [0, 70], setup: OPEN_COVER, changes: ['cover.hash', 'cover.state'], inv: COVER_INV, lines: 0 },
  { id: 'cvGrad', tab: 'style', op: 'check', sel: '#cvGrad', values: [null], setup: OPEN_COVER, changes: ['cover.hash', 'cover.state'], inv: COVER_INV, lines: 0 },
  { id: 'cvTitle', tab: 'style', op: 'range', sel: '#cvTitle', values: ['Ein ganz neuer Hook'], setup: OPEN_COVER, changes: ['cover.hash', 'cover.state'], inv: COVER_INV, lines: 0 },
  { id: 'cvSize', tab: 'style', op: 'range', sel: '#cvSize', values: [0.6, 1.4], setup: OPEN_COVER, changes: ['cover.hash', 'cover.state'], inv: COVER_INV, lines: 0 },
  { id: 'cvPos', tab: 'style', op: 'click', values: ['#cvPos [data-pos="top"]', '#cvPos [data-pos="mid"]'], setup: OPEN_COVER, changes: ['cover.hash', 'cover.state'], inv: COVER_INV, lines: 0 },
  { id: 'cvGuides', tab: 'style', op: 'check', sel: '#cvGuides', values: [null], setup: OPEN_COVER, changes: ['cover.hash', 'cover.state'], inv: COVER_INV, lines: 0 },
  { id: 'cvLooks', tab: 'style', op: 'click', values: ['#cvLooks .cv-chip >> nth=2', '#cvLooks .cv-chip >> nth=4'], setup: OPEN_COVER, changes: ['cover.hash', 'cover.state'], inv: COVER_INV, lines: 0 },
  { id: 'cvWords', tab: 'style', op: 'click', values: ['#cvWords .cv-chip >> nth=0'], setup: OPEN_COVER, changes: ['cover.hash', 'cover.state'], inv: COVER_INV, lines: 0 },
  { id: 'cvDl', tab: 'style', op: 'click', sel: '#cvDl', values: [null], setup: OPEN_COVER, download: { re: /\.png$/, bin: true }, inv: COVER_INV, lines: 0 },
);

const IGNORE_FOR_EFFECT = new Set(['cfg.active']); // Customize macht aus jedem Style «custom» — das allein ist keine Wirkung
const DUMP = ARGS.includes('--dump');

async function openCustomize(sc) {
  const open = await sc.page.evaluate(() => document.getElementById('advSet').open);
  if (!open) { const sel = '#advSet > summary'; sc.prof.mobile ? await sc.page.tap(sel) : await sc.page.click(sel); }
  await sc.page.waitForTimeout(150);
}
async function goTab(sc, tab) {
  if (tab === 'style' || tab === 'captions') { const sel = '.ed-tab[data-tab="' + tab + '"]'; sc.prof.mobile ? await sc.page.tap(sel) : await sc.page.click(sel); }
  else if (tab === 'timeline' && sc.prof.mobile) await sc.page.tap('#tabTl');
  await sc.page.waitForTimeout(200);
}
// Ausgangszustand herstellen: Style, Tab, Testblock, Setup; Variante «layoutPreset» = Ausgangs-Style mit eigenem Layout + Nutzer-Einstellung 2 Zeilen / 4 Wörter
async function prepare(sc, def, variant) {
  const p = sc.page, tap = sel => sc.prof.mobile ? p.tap(sel, { timeout: 4000 }) : p.click(sel, { timeout: 4000 });
  const base = variant === 'layoutPreset' ? 'tight' : (def.base || 'hormozi');
  await p.evaluate(id => window.__qa.useStyle(id), base);
  await goTab(sc, def.tab === 'timeline' && !sc.prof.mobile ? 'captions' : (def.tab === 'style' || def.tab === 'captions' ? def.tab : 'style'));
  if (def.custom || def.customize) await openCustomize(sc);
  if (def.pre) await def.pre(sc); // erste Customize-Anpassung (wendet ein Layout-Preset des Ausgangs-Styles einmal an)
  if (variant === 'layoutPreset') { // Nutzer stellt danach selbst 2 Zeilen / 4 Wörter ein — der nächste Regler darf das nicht zurücksetzen
    await tap('#linesRow [data-lines="2"]'); await p.fill('#wpbSlider', '4'); await p.waitForTimeout(250);
  }
  const need = { lines: def.lines === undefined ? 2 : def.lines, emph: !!def.emph };
  let pk = await p.evaluate(n => window.__qa.pickBlock(n), need);
  if (def.punct) { // Block mit Satzzeichen
    pk = await p.evaluate(async () => { for (let bi = 0; bi < captionBlocks.length; bi++) if (/[.,!?]/.test(captionBlocks[bi].text)) { const t = (captionBlocks[bi].start + captionBlocks[bi].end) / 2 - timeOff; await __qa.seekTo(t); return { bi, t }; } return null; });
  }
  if (def.setup) await def.setup(sc);
  if (def.seek) {
    pk = await p.evaluate(async sk => { const bi = __qa.curBi(), b = captionBlocks[bi], t = b.words[sk.word].start + sk.dt - timeOff; await __qa.seekTo(t); return { bi, t }; }, def.seek);
  }
  await p.waitForTimeout(250);
  return pk;
}
async function act(sc, def, v) {
  const p = sc.page, T = { timeout: 4000 }, phone = sc.prof.mobile;
  switch (def.op) {
    case 'range': case 'color': await p.fill(def.sel, String(v), T); break;
    case 'select': await p.selectOption(def.sel, String(v), T); break;
    case 'check': await p.setChecked(def.sel, v === null || v === undefined ? !(await p.isChecked(def.sel)) : !!v, T); break;
    case 'click': { const sel = v || def.sel; if (phone) await p.tap(sel, T); else await p.click(sel, T); break; }
    case 'run': await def.run(sc, v); break;
    default: throw new Error('unbekannte op ' + def.op);
  }
}
async function runControl(browser, prof, def, variant) {
  const id = 'ctl/' + def.id + (variant === 'plain' ? '' : '@' + variant);
  const sc = await newScenario(browser, prof);
  try {
    await prepare(sc, def, variant);
    const vis = def.sel ? await sc.page.isVisible(def.sel) : true;
    if (!vis && def.hiddenOk) { await sc.close(); return; }
    const s0 = await sigOf(sc), err0 = sc.errors.length;
    const diffs = [], holds = []; let operable = true;
    const vals = QUICK && def.values.length > 2 ? [def.values[0], def.values[def.values.length - 1]] : def.values;
    let gotDownload = null, gotClip = null;
    for (const v of vals) {
      try {
        if (def.download) { const dp = sc.page.waitForEvent('download', { timeout: 5000 }).catch(() => null); await act(sc, def, v); const d = await dp; if (d) { const fp = path.join(os.tmpdir(), 'sweep-' + d.suggestedFilename()); await d.saveAs(fp); gotDownload = { name: d.suggestedFilename(), buf: fs.readFileSync(fp) }; } }
        else await act(sc, def, v);
        if (def.clipboard) { await sc.page.waitForTimeout(300); gotClip = await sc.page.evaluate(() => navigator.clipboard.readText().catch(e => 'ERR ' + e.message)); }
      } catch (e) { operable = false; check(id + '/operable', false, 'nicht bedienbar (Wert ' + v + '): ' + String(e.message).split('\n')[0].slice(0, 110)); break; }
      await sc.page.waitForTimeout(def.wait || 380);
      await sc.page.evaluate(() => window.__qa.raf2());
      const si = await sigOf(sc); diffs.push(diffSig(s0, si));
      if (def.sel && (def.op === 'range' || def.op === 'select' || def.op === 'color')) { // Regler springt nach dem Anwenden nicht zurück
        const now = await sc.page.inputValue(def.sel);
        holds.push([v, now]);
      }
      if (DUMP) console.log('   dump ' + id + ' [' + v + ']: ' + diffs[diffs.length - 1].filter(k => !/^dom\.(span0|act|root)\./.test(k) || /fontSize|lineHeight|letterSpacing|color|textShadow|transform|opacity|filter|fontWeight|fontFamily|backgroundColor|borderRadius/.test(k)).join(', '));
    }
    if (operable) {
      const union = new Set(diffs.flat());
      for (const pat of def.changes || []) check(id + '/changes:' + pat, [...union].some(k => matches(k, pat)), pat + ' ändert sich (Werte ' + vals.join(', ') + ')');
      if (def.changesAny) check(id + '/changesAny', def.changesAny.some(pat => [...union].some(k => matches(k, pat))), 'eines von ' + def.changesAny.join(', ') + ' ändert sich');
      if (def.download) {
        const txt = gotDownload ? gotDownload.buf.toString('utf8') : '';
        check(id + '/download', !!gotDownload && def.download.re.test(gotDownload.name) && (def.download.bin ? gotDownload.buf.length > 2000 : txt.includes(def.download.has)), gotDownload ? 'Download ' + gotDownload.name + ' (' + gotDownload.buf.length + ' B)' + (def.download.has && !txt.includes(def.download.has) ? ' ohne «' + def.download.has + '»' : '') : 'Download startet nicht');
      }
      if (def.clipboard) check(id + '/clipboard', typeof gotClip === 'string' && gotClip.includes(def.clipboard), 'Zwischenablage enthält «' + def.clipboard + '» (ist: ' + String(gotClip).slice(0, 40) + ')');
      for (const key of def.inv || []) {
        const bad = vals.filter((v, i) => diffs[i].includes(key));
        check(id + '/inv:' + key, !bad.length, key + ' bleibt unverändert' + (bad.length ? ' — änderte sich bei Wert ' + bad.join(', ') + ' (vorher ' + JSON.stringify(s0[key]) + ')' : ''));
      }
      if (def.styleOnly) {
        const extra = [...union].filter(k => k.startsWith('style.') && !def.styleOnly.includes(k.slice(6)));
        check(id + '/styleOnly', !extra.length, 'nur Style-Felder ' + def.styleOnly.join('/') + ' ändern sich' + (extra.length ? ' — zusätzlich: ' + extra.join(', ') : ''));
      }
      if (holds.length) { const bad = holds.filter(([v, n]) => String(v).toLowerCase() !== String(n).toLowerCase() && !(Math.abs(parseFloat(v) - parseFloat(n)) < 1e-6)); check(id + '/holds', !bad.length, 'Regler behält den eingestellten Wert' + (bad.length ? ' — gesetzt ' + bad[0][0] + ', danach ' + bad[0][1] : '')); }
      const eff = [...union].filter(k => !IGNORE_FOR_EFFECT.has(k));
      check(id + '/effect', !!def.noopOk || eff.length > 0 || !!gotDownload || !!(def.clipboard && gotClip), def.noopOk ? 'ändert nichts (noopOk: ' + def.noopOk + ')' : 'ändert irgendetwas (sonst tote Kontrolle)');
      check(id + '/errors', sc.errors.length === err0, 'keine Konsolen-/Seitenfehler' + (sc.errors.length > err0 ? ': ' + sc.errors.slice(err0, err0 + 2).join(' | ') : ''));
    }
    if (SHOTS && R.fail) await shot(sc, id);
  } catch (e) {
    check(id + '/setup', false, 'Aufbau fehlgeschlagen: ' + String(e.message).split('\n')[0].slice(0, 160));
  }
  await sc.close();
}
SECTIONS.ctl = async (browser, prof) => {
  const only = argVal('ctl');
  for (const def of CTL) {
    if (def.vp && !def.vp.includes(prof.name)) continue;
    if (only && !only.split(',').includes(def.id)) continue;
    const variants = def.custom && !QUICK ? CUSTOM_VARIANTS : ['plain'];
    for (const variant of variants) await runControl(browser, prof, def, variant);
  }
};


// ═══════════ Abschnitt hyg: Hygiene nach jedem Tab / Sheet / Dialog ═══════════
const TAP_MIN = 32; // px, Handy (Warnung)
const tapWarned = new Set();
async function hygieneStep(sc, name) {
  await sc.page.waitForTimeout(350);
  const id = 'hyg/' + name;
  const h = await sc.page.evaluate(m => window.__qa.hygiene(m), sc.prof.mobile ? TAP_MIN : 0);
  check(id + '/overflowX', !h.overflowX, 'kein horizontales Scrollen (scrollWidth ≤ clientWidth)');
  check(id + '/outside', !h.outside.length, 'nichts ragt seitlich aus dem Viewport' + (h.outside.length ? ': ' + h.outside.slice(0, 3).join(' | ') : ''));
  const fresh = h.small.filter(d => !tapWarned.has(curVp + d));
  fresh.forEach(d => tapWarned.add(curVp + d));
  if (fresh.length) warn(id + '/tap', fresh.length + ' Tippfläche(n) < ' + TAP_MIN + ' px: ' + fresh.slice(0, 6).join(' | ') + (fresh.length > 6 ? ' …' : ''));
  check(id + '/errors', !sc.errors.length, 'keine Konsolen-/Seitenfehler' + (sc.errors.length ? ': ' + sc.errors.slice(0, 2).join(' | ') : ''));
  sc.errors.length = 0;
  if (SHOTS) await shot(sc, id);
}
const CLOSE_ALL = () => { try { closeExportSheet(); closeCover(); closeMoreMenu(); document.getElementById('acctModal').style.display = 'none'; } catch (e) {} };
SECTIONS.hyg = async (browser, prof) => {
  // Landing (EN + DE): ohne Video
  for (const url of ['/', '/de']) {
    const ctx = await browser.newContext({ viewport: prof.viewport, isMobile: prof.mobile, hasTouch: prof.mobile, deviceScaleFactor: 1 });
    await routeSupabase(ctx, BASE.url);
    const page = await ctx.newPage(); const sc = { ctx, page, errors: [], prof };
    page.on('pageerror', e => sc.errors.push('pageerror: ' + String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) sc.errors.push('console: ' + m.text()); });
    await page.goto(BASE.url + url, { waitUntil: 'load' });
    await page.evaluate(QA_SRC.replace(/^/, 'window.__qa = '));
    await hygieneStep(sc, 'landing' + (url === '/' ? '-en' : '-de'));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(400);
    await hygieneStep(sc, 'landing' + (url === '/' ? '-en' : '-de') + '-bottom');
    await ctx.close();
  }
  const sc = await newScenario(browser, prof);
  const p = sc.page, tap = sel => tapSel(sc, sel);
  sc.errors.length = 0;
  await hygieneStep(sc, 'editor-captions');
  await goTab(sc, 'style'); await hygieneStep(sc, 'tab-style');
  await openCustomize(sc); await hygieneStep(sc, 'tab-style-customize');
  await goTab(sc, 'captions'); await tap('#trSet > summary'); await hygieneStep(sc, 'captions-videolang');
  await tap('#frBox > summary'); await hygieneStep(sc, 'captions-findreplace');
  await tap('#seg1'); await hygieneStep(sc, 'captions-segment-selected');
  await GOTO_TL(sc); await hygieneStep(sc, 'timeline');
  if (!sc.prof.mobile) { await p.evaluate(() => tlSelect(1, false)); await hygieneStep(sc, 'timeline-selected'); }
  await goTab(sc, 'captions');
  await OPEN_EXPORT(sc); await hygieneStep(sc, 'export-sheet');
  await tap('#expOpts > summary'); await hygieneStep(sc, 'export-options');
  await tap('#btnCover'); await p.waitForSelector('#coverModal', { state: 'visible' }); await p.waitForTimeout(900); await hygieneStep(sc, 'cover');
  await p.evaluate(CLOSE_ALL);
  await tap('#moreBtn'); await hygieneStep(sc, 'more-menu');
  await p.evaluate(CLOSE_ALL);
  await p.evaluate(() => showAcct()); await hygieneStep(sc, 'account');
  await p.evaluate(CLOSE_ALL);
  await sc.close();
};

//__SECTIONS__

(async () => {
  BASE.url = await startServer();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
  const profs = PROFILES.filter(p => !argVal('viewport') || p.name === argVal('viewport'));
  for (const prof of profs) {
    curVp = prof.name;
    console.log('\n== ' + prof.name + ' ' + prof.viewport.width + '×' + prof.viewport.height + (QUICK ? ' (quick)' : '') + ' ==');
    for (const sec of ['hyg', 'ctl', 'geom', 'pixel', 'anim', 'edge']) {
      if (!want(sec) || !SECTIONS[sec]) continue;
      const t1 = Date.now();
      console.log('-- ' + sec);
      try { await SECTIONS[sec](browser, prof); } catch (e) { check(sec + '/crash', false, 'Abschnitt abgebrochen: ' + (e && e.stack || e).toString().split('\n').slice(0, 3).join(' | ')); }
      flush(sec);
      console.log('   (' + ((Date.now() - t1) / 1000).toFixed(1) + ' s)');
    }
  }
  await browser.close(); e2e.server.close();
  // XPASS: erwartete Fehler, die nicht mehr auftreten
  const dead = EXPECT_FAIL.filter(e => ![...xpassSeen].some(id => e.re.test(id)) ? false : true);
  if (R.xpass) console.log('\nWARNUNG: ' + R.xpass + ' erwartete(r) Fehler bestehen jetzt (XPASS) → expectFail-Eintrag in EXPECT_FAIL entfernen:\n  ' + dead.map(e => e.re + ' — ' + e.why).join('\n  '));
  const secs = ((Date.now() - T0) / 1000).toFixed(0);
  console.log(`\ntest-ui-sweep: ${R.ok} ok, ${R.fail} FAIL, ${R.xfail} erwartet fehlgeschlagen (xfail), ${R.xpass} XPASS, ${R.warn} Warnungen — ${secs} s`);
  process.exit(R.fail || (STRICT && R.xpass) ? 1 : 0);
})();
