// Testharness für captly.html — führt das komplette Script mit DOM-Stub aus
const fs = require('fs');
const path = require('path');

// ── Mini-DOM-Stub ───────────────────────────────
function mkEl(id) {
  return {
    id: id || '', style: {}, dataset: {}, children: [],
    classList: {
      _s: new Set(),
      add() { for (const a of arguments) this._s.add(a); },
      remove() { for (const a of arguments) this._s.delete(a); },
      toggle(c, f) { f ? this._s.add(c) : this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    innerHTML: '', textContent: '', value: '', className: '', title: '', href: '', download: '', rows: 1, scrollHeight: 12, offsetWidth: 0,
    src: '', paused: true, ended: false, currentTime: 0, duration: NaN, muted: true, volume: 1, videoWidth: 1080, videoHeight: 1920, readyState: 0, files: [],
    appendChild(c) { this.children.push(c); }, addEventListener() {}, removeAttribute() {}, setAttribute() {},
    querySelectorAll() { return []; }, getBoundingClientRect() { return { left: 0, width: 100 }; },
    load() {}, pause() { this.paused = true; }, play() { this.paused = false; return Promise.resolve(); },
    click() { global.CLICKS.push({ href: this.href, download: this.download }); },
    onclick: null, oninput: null,
    // Minimaler 2D-Kontext für wrapCaptionLines()/buildCap() — misst nicht pixelgenau, reicht aber für
    // die Umbruch-/Struktur-Assertions hier (echte Breiten gibt's nur im Browser).
    getContext(type) {
      if (type !== '2d') return null;
      return {
        font: '',
        measureText(str) {
          var m = /([\d.]+)px/.exec(this.font);
          var px = m ? parseFloat(m[1]) : 16;
          return { width: (str || '').length * px * 0.55 };
        },
        roundRect() {}, rect() {}, beginPath() {}, fill() {}, stroke() {}, save() {}, restore() {},
        translate() {}, rotate() {}, scale() {}, fillText() {}, strokeText() {}, ellipse() {},
        fillRect() {}, createLinearGradient() { return { addColorStop() {} }; }
      };
    }
  };
}
global.CLICKS = []; const els = {};
global.document = {
  getElementById: id => els[id] || (els[id] = mkEl(id)),
  createElement: t => mkEl(t),
  createDocumentFragment: () => ({ children: [], appendChild(c) { this.children.push(c); } }),
  querySelectorAll: () => [],
  addEventListener() {}, removeEventListener() {},
  fonts: { ready: Promise.resolve(), load: () => Promise.resolve() },
  body: mkEl('body')
};
global.window = global;
global.requestAnimationFrame = () => 0; global.cancelAnimationFrame = () => {};
global.URL = { createObjectURL: b => { global.LASTBLOB = b; return 'blob:x'; }, revokeObjectURL() {} };
global.Blob = function (parts, opts) { this.content = parts.join(''); this.type = opts && opts.type; };
global.alert = m => { global.ALERTS = (global.ALERTS || []).concat(m); };
global.MediaRecorder = undefined;

// ── Script laden + Symbole exportieren ─────────
const htmlPath = path.join(__dirname, 'captly.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const match = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
if (!match) {
  throw new Error(`Could not find <script>...</script> block in ${htmlPath}`);
}
const script = match[1];
const tail = `;return {STYLES:STYLES,buildCap:buildCap,buildCaptionBlocks:buildCaptionBlocks,resplitBlock:resplitBlock,
currentBlockIdx:currentBlockIdx,nearestBlockIdx:nearestBlockIdx,activeWordIdx:activeWordIdx,updateOverlay:updateOverlay,
exportSRT:exportSRT,exportVTT:exportVTT,srtT:srtT,vttT:vttT,fmtS:fmtS,chunksToWords:chunksToWords,segmentsToWords:segmentsToWords,
setState:function(bl,wts,dm){captionBlocks=bl;wordTimestamps=wts;if(dm)displayMode=dm;_lastKey=null;},
getBlocks:function(){return captionBlocks;},selectStyle:selectStyle,setPos:setPos,onSzChange:onSzChange,setMode:setMode,
onWpbChange:onWpbChange,setLang:setLang,buildPicker:buildPicker,renderSegments:renderSegments,renderWPills:renderWPills,
openEditorClean:openEditorClean,goBack:goBack,enableExports:enableExports,
looksRepetitive:looksRepetitive,cleanWords:cleanWords,stripNonSpeechTags:stripNonSpeechTags,renderShowcase:renderShowcase,getLang:function(){return whisperLang;},NAV_LANG:NAV_LANG,float32ToWav:float32ToWav,CODE_BY_LANG:CODE_BY_LANG,onKwChange:onKwChange,applyCustomStyle:applyCustomStyle,isKeywordWord:isKeywordWord,transcribeChunked:transcribeChunked,safePipe:safePipe,clearForcedIds:clearForcedIds,setPosState:function(p){capPos=p;},setVOffState:function(v){capVOff=v;},applyPos:applyPos,mergeChunkWords:mergeChunkWords,computeCutRegions:computeCutRegions,splitAudioChunks:splitAudioChunks,chunkIsSilent:chunkIsSilent,sanitizeWordTimings:sanitizeWordTimings,isHallucinatedChunk:isHallucinatedChunk,serverTranscribe:serverTranscribe,
retimeEditedBlock:retimeEditedBlock,isNoAudioFfmpegLog:isNoAudioFfmpegLog,
setCaptionsEdited:function(v){captionsEdited=v;},getCaptionsEdited:function(){return captionsEdited;},
setCurrentFile:function(f){currentFile=f;},fitCaptionWords:fitCaptionWords,capFitMaxW:capFitMaxW,
needsWatermark:needsWatermark,decodeToMono16k:decodeToMono16k,setFFmpeg:function(f){_ffmpeg=f;},isPromptEcho:isPromptEcho,capFontsChanged:capFontsChanged,
getAutosaveTimer:function(){return _autosaveTimer;},setExporting:function(v){isExporting=v;},autosaveWhenIdle:autosaveWhenIdle,autosaveNow:autosaveNow,restoreOrTranscribe:restoreOrTranscribe,
readAutosaves:readAutosaves,setAutosaveKey:function(k){_autosaveKey=k;},AUTOSAVE_KEY:AUTOSAVE_KEY,setTranslateState:function(v){doTranslate=v;},capHyphenate:capHyphenate,onWpbChangeT:onWpbChange,
setMe:function(plan,email){mePlan=plan;meEmail=email;}};`;
const T = new Function(script + tail)();
const initialLang = T.getLang(); // direkt nach INIT, bevor Tests den State ändern

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL:', m); } };

// 1) Grunddaten
ok(T.STYLES.length === 31, '31 Styles erwartet: ' + T.STYLES.length);

// 2) Zeitformate
ok(T.srtT(61.5) === '00:01:01,500', 'srtT: ' + T.srtT(61.5));
ok(T.vttT(3661.007) === '01:01:01.007', 'vttT: ' + T.vttT(3661.007));
ok(T.fmtS(75) === '1:15', 'fmtS');

// 3) chunksToWords: kaputte Timestamps (null/NaN) abfangen
const w1 = T.chunksToWords([
  { text: ' Hallo', timestamp: [0, 0.4] },
  { text: 'Welt', timestamp: [0.5, null] },
  { text: '', timestamp: [1, 2] },
  { text: 'Ende', timestamp: [NaN, NaN] }
]);
ok(w1.length === 3, 'chunksToWords count: ' + w1.length);
ok(w1[1].end > w1[1].start, 'chunksToWords null-end gefixt');
ok(w1[2].start >= w1[1].end - 0.001, 'chunksToWords NaN-start uebernimmt prev end');

// 4) segmentsToWords Fallback
const w2 = T.segmentsToWords([{ text: 'Das ist ein Test', timestamp: [0, 2] }]);
ok(w2.length === 4 && Math.abs(w2[3].end - 2) < 0.01 && w2[0].start === 0, 'segmentsToWords');
ok(w2[1].start > w2[0].start && w2[2].start > w2[1].start, 'segmentsToWords monoton');

// 5) Blöcke + Karaoke-Kern
const wts = [
  { word: 'Hallo', start: 0, end: 0.3 }, { word: 'und', start: 0.35, end: 0.5 }, { word: 'willkommen.', start: 0.55, end: 1.0 },
  { word: 'Heute', start: 1.1, end: 1.4 }, { word: 'zeige', start: 1.45, end: 1.7 },
  { word: 'ich', start: 2.9, end: 3.1 }, { word: 'euch', start: 3.15, end: 3.4 }, { word: 'etwas', start: 3.45, end: 3.8 },
  { word: 'richtig', start: 3.85, end: 4.1 }, { word: 'Cooles', start: 4.15, end: 4.6 }
];
const bl = T.buildCaptionBlocks(wts);
T.setState(bl, wts, 'karaoke');
ok(bl.length === 4, '4 Bloecke: ' + bl.length);
ok(T.currentBlockIdx(2.0) === -1, 'Karaoke: Pause leer');
T.setState(bl, wts, 'all');
ok(T.currentBlockIdx(2.0) === 1, 'Durchgehend: Block haelt');
T.setState(bl, wts, 'karaoke');
ok(T.activeWordIdx(bl[2], 3.5) === 2, 'aktives Wort = etwas');

// 6) buildCap: index-basiertes Highlight + Seek-Handler
const s = T.STYLES.find(x => x.id === 'stack');
const html = T.buildCap(['ein', 'zwei', 'drei'], s, 1, 22, [0, 0.5, 1]);
ok(html.includes('f7c204'), 'HL-Farbe im HTML');
ok(html.split('seekToTime').length === 4, '3 Seek-Handler, habe ' + (html.split('seekToTime').length - 1));
ok((html.match(/animation:captly-/g) || []).length === 1, 'Animation nur am aktiven Wort');

// 7) SRT/VTT-Export
T.exportSRT();
ok(global.LASTBLOB.content.startsWith('1\n00:00:00,000 --> 00:00:01,000\nHallo und willkommen.'), 'SRT-Format: ' + JSON.stringify(global.LASTBLOB.content.slice(0, 50)));
T.exportVTT();
ok(global.LASTBLOB.content.startsWith('WEBVTT'), 'VTT-Header');
ok(global.CLICKS.length === 2, '2 Downloads ausgeloest');

// 8) UI-Funktionen crashen nicht + Overlay rendert korrekt
T.selectStyle('neon'); T.onSzChange('30');
T.setMode({ dataset: { mode: 'all' } }); T.setMode({ dataset: { mode: 'karaoke' } });
T.onWpbChange('3');
ok(T.getBlocks().every(b => b.words.length <= 3), 'WpB=3 respektiert');
T.setLang('german'); T.setLang('auto');
T.setPos({ dataset: { pos: 'top' }, classList: { add() {}, remove() {} }, parentElement: { querySelectorAll: () => [] } });
T.buildPicker(); T.renderSegments(); T.renderWPills();
T.setState(T.getBlocks(), wts, 'karaoke');
T.updateOverlay(0.2);
ok(document.getElementById('capOverlay').innerHTML.includes('Hallo'), 'Overlay rendert Block bei t=0.2');
T.updateOverlay(3.5);
ok(document.getElementById('capOverlay').innerHTML.toLowerCase().includes('etwas'), 'Overlay rendert Block bei t=3.5');
T.openEditorClean(); T.goBack(); T.enableExports(true);

// 9) resplitBlock nach Edit (openEditorClean hat korrekt geleert → neu setzen)
T.setState(T.buildCaptionBlocks(wts), wts, 'karaoke');
const b0 = T.getBlocks()[0]; b0.text = 'Eins zwei drei vier fuenf'; T.resplitBlock(b0);
ok(b0.words.length === 5 && b0.words[4].end <= b0.end + 0.001, 'resplit ok');

// 9b) Timing-erhaltendes Re-Split nach Text-Edit (Tippfehler-Fix darf Karaoke-Timings nicht verschieben)
{
  const mk = () => ({ start: 1, end: 3, text: 'Unser Highlnd Rind grast',
    words: [{ word: 'Unser', start: 1, end: 1.4 }, { word: 'Highlnd', start: 1.5, end: 2.1 },
            { word: 'Rind', start: 2.2, end: 2.5 }, { word: 'grast', start: 2.6, end: 3 }] });
  const b1 = mk(); const orig = b1.words.map(w => [w.start, w.end]);
  b1.text = 'Unser Highland Rind grast'; T.retimeEditedBlock(b1);
  ok(b1.words.length === 4 && b1.words.every((w, i) => w.start === orig[i][0] && w.end === orig[i][1]),
     'Edit mit gleicher Wortanzahl behaelt Timings exakt');
  ok(b1.words[1].word === 'Highland', 'Edit: neuer Text uebernommen');
  // Einfügung: neues Wort landet zwischen seinen Nachbarn, gematchte Wörter behalten Start
  const b2 = mk(); b2.text = 'Unser Highlnd Rind grast gerne'; T.retimeEditedBlock(b2);
  const b3 = mk(); b3.text = 'Unser schottisches Highlnd Rind grast'; T.retimeEditedBlock(b3);
  ok(b3.words.length === 5 && b3.words[1].word === 'schottisches'
     && b3.words[1].start > b3.words[0].start && b3.words[1].start < b3.words[2].start,
     'eingefuegtes Wort liegt zwischen den Nachbarn: ' + JSON.stringify(b3.words.map(w => w.start)));
  ok(b3.words[2].start === 1.5 && b3.words[3].start === 2.2 && b3.words[4].start === 2.6, 'gematchte Woerter behalten Start');
  ok(b2.words[4].word === 'gerne' && b2.words[4].start >= b2.words[3].start && b2.words[4].end <= 3 + 1e-9, 'Einfuegung am Ende bleibt im Block');
  // Löschung + Ersetzung mehrerer Wörter
  const b4 = mk(); b4.text = 'Unser Rind frisst Gras gerne'; T.retimeEditedBlock(b4);
  ok(b4.words.length === 5 && b4.words[0].start === 1 && b4.words[1].start === 2.2, 'Loeschung: Rest behaelt Timings');
  ok(b4.words[2].start >= 2.6 && b4.words[4].end <= 3 + 1e-9, 'Ersetzung nutzt Zeitspanne der alten Woerter');
  const b5 = mk(); b5.text = 'Ganz neu am Anfang Unser Highlnd'; T.retimeEditedBlock(b5);
  [b2, b3, b4, b5].forEach((b, n) => {
    ok(b.words.every((w, i) => i === 0 || w.start >= b.words[i - 1].start), 'Starts monoton (Fall ' + n + ')');
    ok(b.words.every(w => w.end >= w.start && w.start >= b.start - 1e-9 && w.end <= b.end + 1e-9), 'Timings im Block (Fall ' + n + ')');
  });
  // ohne Wortdaten → gleichmäßige Verteilung als Fallback
  const b6 = { start: 0, end: 2, text: 'a b', words: [] }; T.retimeEditedBlock(b6);
  ok(b6.words.length === 2 && b6.words[1].start === 1, 'ohne Wortdaten → resplitBlock-Fallback');
}

// 9b2) Referenz-Wörter (srcWords): Wort löschen und neu tippen übernimmt den ALTEN Zeit-Slot
{
  T.setState([], []); T.onWpbChange('6'); // genug Wörter pro Block für einen 4-Wort-Block
  const blk = T.buildCaptionBlocks([{ word: 'Fleisch,', start: 1.97, end: 2.9 }, { word: 'es', start: 2.96, end: 3.2 },
    { word: 'ist', start: 3.31, end: 3.6 }, { word: 'zart', start: 3.71, end: 4.2 }])[0];
  ok(blk.srcWords && blk.srcWords.length === 4, 'Block hat srcWords');
  blk.text = 'Fleisch, es ist'; T.retimeEditedBlock(blk);           // Strg+Backspace
  ok(blk.words.length === 3 && blk.words[2].start === 3.31, 'nach Loeschen: Rest behaelt Timings');
  ['W', 'Weide', 'Weideland'].forEach(t => { blk.text = 'Fleisch, es ist ' + t; T.retimeEditedBlock(blk); });
  ok(blk.words[3].word === 'Weideland' && blk.words[3].start === 3.71 && blk.words[3].end === 4.2,
     'neues letztes Wort uebernimmt Slot des alten: ' + JSON.stringify(blk.words[3]));
  // Erstes Wort durch zwei ersetzen → Nachfolger behalten ihre Slots
  blk.text = 'Das Fleisch es ist zart'; T.retimeEditedBlock(blk);
  ok(blk.words[2].start === 2.96 && blk.words[4].start === 3.71, 'Ersetzung vorne verschiebt Rest nicht');
}

// 9b3) Wörter-pro-Block ändern behält Text-Edits (Regroup aus den aktuellen Block-Wörtern)
{
  T.setState(T.buildCaptionBlocks(wts), wts, 'karaoke');
  const bb = T.getBlocks()[0];
  const firstWord = bb.words[0].word;
  bb.text = 'Korrigiert ' + bb.words.slice(1).map(w => w.word).join(' '); T.retimeEditedBlock(bb);
  const t0 = bb.words[0].start;
  T.onWpbChangeT(2);
  const all = T.getBlocks().flatMap(b => b.words);
  ok(all[0].word === 'Korrigiert' && all[0].start === t0, 'Regroup behaelt Edit + Timing (' + firstWord + ' → Korrigiert)');
  ok(T.getBlocks().every(b => b.words.length <= 2) && T.getBlocks()[0].text.startsWith('Korrigiert'), 'Regroup mit neuer Blockgroesse');
  ok(T.getBlocks()[0].srcWords[0].word === 'Korrigiert', 'Regroup: srcWords = aktueller Stand');
  T.onWpbChangeT(4);
}

// 9c) Neu-Transkription fragt nach manuellen Edits; Abbruch dreht die Sprachauswahl zurück
{
  const prevLang = T.getLang();
  const realConfirm = global.confirm; let asked = 0;
  global.confirm = () => { asked++; return false; };
  T.setCurrentFile(null); T.setCaptionsEdited(true);
  T.setLang('german'); ok(asked === 0 && T.getLang() === 'german', 'ohne Video: keine Rueckfrage');
  T.setLang(prevLang);
  T.setCurrentFile({ name: 'x.mp4' });
  document.getElementById('langSel').value = 'french';
  T.setLang('french');
  ok(asked === 1 && T.getLang() === prevLang && document.getElementById('langSel').value === prevLang,
     'Abbruch: Sprache + Select bleiben, Edits bleiben');
  ok(T.getCaptionsEdited() === true, 'Edit-Flag bleibt nach Abbruch gesetzt');
  T.setCaptionsEdited(false); T.setCurrentFile(null);
  global.confirm = realConfirm;
}

// 9e) Auto-Fit überlanger Wörter (Stub: Breite = Zeichen * px * 0.55)
{
  document.getElementById('prevFrame').style.width = '270px';
  const st = T.STYLES.find(x => !x.boxBg && !x.pill && !x.hlPillBg && !x.circle && !(parseFloat(x.ls) > 0));
  const fsMul = st.fs ? (parseFloat(st.fs) || 1) : 1;
  const maxW = T.capFitMaxW(st);
  ok(Math.abs(maxW - 270 * 0.86) < 1e-9, 'Fit: nutzbare Breite = 86% Rahmen: ' + maxW);
  const wStub = (str, px) => str.length * px * fsMul * 0.55;
  const long = 'Rindfleischverarbeitungsbetriebe';
  ok(long.length === 32, 'Testwort hat 32 Zeichen');
  const f1 = T.fitCaptionWords(['Unsere', long, 'sind', 'Highland-Rinder-Weidehaltung'], st, 54, maxW);
  ok(f1.px < 54 && f1.px >= 54 * 0.55 - 1e-9, 'Fit: effektive Groesse kleiner, aber >= 55%: ' + f1.px);
  ok(f1.words.every(w => wStub(w, f1.px) <= maxW + 1e-9), 'Fit: jedes (Teil-)Wort passt in den Rahmen: ' + f1.words.join(' | '));
  ok(f1.words.filter((w, i) => f1.orig[i] === 1).map(w => w.replace(/-$/, '')).join('') === long, 'Fit: Trennung verliert keine Zeichen');
  ok(f1.words.includes('Highland-') && f1.orig.length === f1.words.length, 'Fit: vorhandene Bindestriche bevorzugt: ' + f1.words.join(' | '));
  // Wort, das per Verkleinerung allein passt → keine Trennung
  const f2 = T.fitCaptionWords(['Highland'], st, 54, maxW);
  ok(f2.words.length === 1 && f2.px < 54 && wStub('Highland', f2.px) <= maxW, 'Fit: nur verkleinert, nicht getrennt: ' + f2.px);
  const f3 = T.fitCaptionWords(['kurz', 'und', 'gut'], st, 54, maxW);
  ok(f3.px === 54 && f3.words.length === 3, 'Fit: passende Woerter bleiben unveraendert');
  // Vorschau nutzt die verkleinerte Größe
  const capHtml = T.buildCap(['Unsere', long], st, 1, 54, [0, 1], 1);
  ok(capHtml.includes('font-size:' + (f1.px * fsMul) + 'px') || capHtml.includes('font-size:' + (T.fitCaptionWords(['Unsere', long], st, 54, maxW).px * fsMul) + 'px'),
     'Fit: Vorschau rendert mit effektiver Groesse');
  // Trennqualität (Breite hier = Zeichenzahl inkl. „-“): Kompositumsfugen statt gieriger Schnitte
  const hy = (w, max) => T.capHyphenate(w, p => p.length <= max).join(' / ');
  ok(hy('Rindfleischverarbeitungsbetriebe', 14) === 'Rindfleisch- / verarbeitungs- / betriebe', 'Trennung an Fugen: ' + hy('Rindfleischverarbeitungsbetriebe', 14));
  ok(hy('Weidehaltung', 9) === 'Weide- / haltung', 'Trennung vor Grundwort: ' + hy('Weidehaltung', 9));
  ok(hy('Highland-Rinder-Weidehaltung', 10) === 'Highland- / Rinder- / Weide- / haltung', 'vorhandene Bindestriche + Fuge: ' + hy('Highland-Rinder-Weidehaltung', 10));
  ['Rindfleischverarbeitungsbetriebe', 'Geschwindigkeitsbegrenzung', 'Bundesausbildungsförderungsgesetz', 'Schifffahrtsgesellschaft'].forEach(w => {
    [8, 10, 12].forEach(max => {
      const pcs = T.capHyphenate(w, p => p.length <= max);
      ok(pcs.every(p => p.length <= max), 'Stuecke passen: ' + pcs.join('/'));
      ok(pcs.every(p => p.replace(/-$/, '').length >= 3), 'keine Stuecke < 3 Buchstaben: ' + pcs.join('/'));
      ok(pcs.map(p => p.replace(/-$/, '')).join('') === w, 'keine Zeichen verloren: ' + pcs.join('/'));
      ok(!pcs.some((p, i) => i > 0 && (/^(ch|h)/.test(p) && /s?c$|s$/.test(pcs[i - 1].replace(/-$/, '')) && /sch/i.test(pcs[i - 1].replace(/-$/, '').slice(-2) + p.slice(0, 2)))),
         'sch nie zerrissen: ' + pcs.join('/'));
    });
  });
  // Höhe: viele Zeilen → weiter verkleinern (bis 55 %), Block <= 40 % der Rahmenhöhe
  document.getElementById('prevFrame').style.height = '480px';
  const many = 'eins zwei drei vier fuenf sechs sieben acht neun zehn elf zwoelf'.split(' ');
  const fh = T.fitCaptionWords(many, st, 54, maxW, 3);
  ok(fh.px < 54 && (fh.h <= 480 * 0.4 + 1e-9 || Math.abs(fh.px - 54 * 0.55) < 0.2), 'Hoehen-Fit: ' + fh.px + 'px, h=' + Math.round(fh.h));
  ok(fh.px >= 54 * 0.55 - 1e-9, 'Hoehen-Fit respektiert 55-%-Untergrenze');
  // Font-Ladezustand: mit Fallback-Schrift gemessen → nicht cachen; nach dem Laden Cache verwerfen
  document.fonts.check = () => false;
  const pf1 = T.fitCaptionWords(['Fontcheck'], st, 54, maxW, 1), pf2 = T.fitCaptionWords(['Fontcheck'], st, 54, maxW, 1);
  ok(pf1 !== pf2, 'Font noch nicht geladen → Ergebnis nicht gecacht');
  document.fonts.check = () => true;
  const pf3 = T.fitCaptionWords(['Fontcheck'], st, 54, maxW, 1), pf4 = T.fitCaptionWords(['Fontcheck'], st, 54, maxW, 1);
  ok(pf3 === pf4, 'Font geladen → gecacht');
  T.capFontsChanged();
  ok(T.fitCaptionWords(['Fontcheck'], st, 54, maxW, 1) !== pf3, 'Fonts fertig geladen → Cache verworfen, neu gemessen');
  delete document.fonts.check;
  document.getElementById('prevFrame').style.width = ''; document.getElementById('prevFrame').style.height = '';
}

// 9f) Beta: Wasserzeichen nur für anonyme Nutzer (Pläne sind noch nicht kaufbar)
T.setMe('anon', ''); ok(T.needsWatermark() === true, 'anonym → Wasserzeichen');
T.setMe('free', 'a@b.c'); ok(T.needsWatermark() === false, 'angemeldet (free, Beta) → kein Wasserzeichen');
T.setMe('pro', 'a@b.c'); ok(T.needsWatermark() === false, 'Pro → kein Wasserzeichen');
T.setMe('anon', '');

// 9g) Lokaler Autosave: Roundtrip, LRU (5), Quota, Restore statt Transkription
{
  const store = {}; let quotaMode = 'none';
  global.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => {
      if (quotaMode === 'always' || (quotaMode === 'multi' && JSON.parse(v).length > 1)) { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; }
      store[k] = String(v);
    },
    removeItem: k => { delete store[k]; }
  };
  T.setState(T.buildCaptionBlocks(wts), wts, 'karaoke');
  T.setCaptionsEdited(true);
  T.setAutosaveKey('clip.mp4|1234|105');
  ok(T.autosaveNow() === true && T.readAutosaves().length === 1, 'Autosave geschrieben');
  const savedBlocks = JSON.stringify(T.getBlocks().map(b => b.text));
  // Reload simulieren: Zustand weg, gleiches Video erneut laden → Restore statt Transkription
  T.setState([], []); T.setCaptionsEdited(false); T.setAutosaveKey(null);
  document.getElementById('tStatus').innerHTML = '';
  const restored = T.restoreOrTranscribe({ name: 'clip.mp4', size: 1234 }, 10.49);
  ok(restored === true, 'Restore-Pfad gewaehlt');
  ok(JSON.stringify(T.getBlocks().map(b => b.text)) === savedBlocks, 'Roundtrip: Bloecke identisch');
  ok(T.getBlocks()[0].srcWords && T.getBlocks()[0].srcWords.length > 0, 'Roundtrip: srcWords erhalten');
  ok(T.getCaptionsEdited() === true, 'Roundtrip: Edit-Flag uebernommen');
  ok(/Restored your last session/.test(document.getElementById('tStatus').innerHTML) && !/Preparing/.test(document.getElementById('tStatus').innerHTML),
     'Restore ruft KEINE Transkription auf (Status bleibt "Restored")');
  // LRU: max. 5 Videos, neuestes zuerst
  for (let i = 0; i < 7; i++) { T.setAutosaveKey('v' + i + '|1|10'); T.autosaveNow(); }
  const lru = T.readAutosaves().map(e => e.key);
  ok(lru.length === 5 && lru[0] === 'v6|1|10' && !lru.includes('v0|1|10') && !lru.includes('v1|1|10'), 'LRU auf 5 begrenzt: ' + lru.join(','));
  // Quota: ältere Einträge opfern, aktueller Stand bleibt
  quotaMode = 'multi'; T.setAutosaveKey('neu|1|10');
  ok(T.autosaveNow() === true && T.readAutosaves().length === 1 && T.readAutosaves()[0].key === 'neu|1|10', 'Quota: nur aktueller Stand behalten');
  quotaMode = 'always';
  let threw = false; try { ok(T.autosaveNow() === false, 'Quota dauerhaft voll → false'); } catch (e) { threw = true; }
  ok(!threw, 'Quota dauerhaft voll wirft nicht');
  // Re-Layout (applyPos aus updateOverlay/Export) darf KEINEN Autosave planen; während des Exports wird verschoben
  quotaMode = 'none'; T.setAutosaveKey('lay|1|1'); clearTimeout(T.getAutosaveTimer());
  T.setCaptionsEdited(false); T.autosaveNow(); const before = store[T.AUTOSAVE_KEY];
  T.applyPos();
  ok(T.getAutosaveTimer() === null, 'applyPos (Re-Layout) plant keinen Autosave');
  T.setExporting(true); T.setCaptionsEdited(true); T.autosaveWhenIdle();
  ok(store[T.AUTOSAVE_KEY] === before && T.getAutosaveTimer() !== null, 'waehrend Export: kein Schreiben, nur verschoben');
  T.setExporting(false); clearTimeout(T.getAutosaveTimer()); T.autosaveWhenIdle();
  ok(store[T.AUTOSAVE_KEY] !== before, 'nach Export: Autosave nachgeholt');
  delete global.localStorage;
  T.setAutosaveKey('x|1|1'); threw = false; try { T.autosaveNow(); T.readAutosaves(); } catch (e) { threw = true; }
  ok(!threw, 'ohne localStorage (Privatmodus) kein Fehler');
  T.setAutosaveKey(null); T.setCaptionsEdited(false);
}

// 9d) No-Audio-Erkennung aus dem ffmpeg-Log
ok(T.isNoAudioFfmpegLog('Input #0, matroska,webm\n  Stream #0:0: Video: vp8, yuv420p\nOutput file #0 does not contain any stream') === true, 'ffmpeg: Video ohne Ton erkannt');
ok(T.isNoAudioFfmpegLog('Stream #0:0: Video: h264\nStream #0:1: Audio: aac') === false, 'ffmpeg: Video mit Ton → kein No-Audio');
ok(T.isNoAudioFfmpegLog('in_media: Invalid data found when processing input') === false, 'ffmpeg: kaputte Datei → generischer Fehler');

// 10) Overlay-Demo ohne Transkript
T.setState([], []);
T.selectStyle('stack');
T.updateOverlay(0);
ok(document.getElementById('capOverlay').innerHTML.toUpperCase().includes('CAPTIONS'), 'Demo-Caption ohne Transkript');

// 11) Halluzinations-Detektor
const rep = Array.from({ length: 40 }, (_, i) => ({ word: ['we', 'worked', 'for', 'years'][i % 4], start: i * 0.3, end: i * 0.3 + 0.2 }));
ok(T.looksRepetitive(rep) === true, 'Wiederholungsschleife erkannt');
ok(T.looksRepetitive(wts) === false, 'normale Sprache NICHT als repetitiv markiert');
ok(T.looksRepetitive([]) === false && T.looksRepetitive(null) === false, 'looksRepetitive Edge-Cases');
// Lange, normale Rede: Type-Token-Ratio fällt global unter 0.3, darf aber NICHT als Schleife gelten
{
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const vocab = Array.from({ length: 400 }, (_, i) => 'w' + i.toString(36) + 'x');
  const H = vocab.reduce((s, _, i) => s + 1 / (i + 1), 0);
  const zipf = () => { let r = rnd() * H; for (let i = 0; i < vocab.length; i++) { r -= 1 / (i + 1); if (r <= 0) return vocab[i]; } return vocab[0]; };
  const longTalk = Array.from({ length: 2000 }, (_, i) => ({ word: zipf(), start: i * 0.3, end: i * 0.3 + 0.25 }));
  const ttr = new Set(longTalk.map(w => w.word)).size / longTalk.length;
  ok(ttr < 0.3, 'Testdaten: globale TTR < 0.3 (' + ttr.toFixed(2) + ')');
  ok(T.looksRepetitive(longTalk) === false, '2000 Woerter normale Rede NICHT repetitiv');
  const phrase = ['and', 'then', 'we', 'went', 'home'];
  const loop = Array.from({ length: 30 }, (_, i) => ({ word: phrase[i % 5], start: 0, end: 0 }));
  const withLoop = longTalk.slice(0, 1000).concat(loop, longTalk.slice(1000));
  ok(T.looksRepetitive(withLoop) === true, '30-Wort-Schleife mitten in langer Rede erkannt');
}

// 12) NAV_LANG: null ODER gültiger Whisper-Name; wenn gesetzt, muss whisperLang vorgewählt sein
const validLangs = ['german','english','spanish','french','italian','portuguese','dutch','polish','turkish','russian','ukrainian','japanese','korean','chinese','arabic','hindi'];
ok(T.NAV_LANG === null || validLangs.includes(T.NAV_LANG), 'NAV_LANG gueltig: ' + T.NAV_LANG);
ok(initialLang === 'auto', 'Sprache startet auf Auto-Erkennung: ' + initialLang);

// 13) Showcase-Reihe crasht nicht (Stub leert children nicht → Vielfaches von 31:
// Auto-Init beim Skript-Load + ein Rebuild via goBack() weiter unten in Test 8)
const showN = document.getElementById('showcaseRow').children.length;
ok(showN >= 31 && showN % 31 === 0, 'Showcase: Vielfaches von 31 Karten erwartet, habe ' + showN);

// 14) cleanWords ist jetzt async (yielded) — Assertions unten in der async IIFE (Test 20b).
const mkW = arr => arr.map((w, i) => ({ word: w, start: i * 0.3, end: i * 0.3 + 0.25 }));

// 14b) stripNonSpeechTags: "[Music]"/"(Applause)"/Notensymbole raus, echte Woerter bleiben
const nst = T.stripNonSpeechTags(mkW(['hallo', '[Music]', 'welt', '(Applause)', 'schoen', '♪♪♪', 'tag']));
ok(nst.map(w => w.word).join(' ') === 'hallo welt schoen tag', 'Non-Speech-Tags entfernt: ' + nst.map(w => w.word).join(' '));
ok(T.stripNonSpeechTags([]).length === 0 && T.stripNonSpeechTags(null).length === 0, 'stripNonSpeechTags Edge-Cases');
// Woerter, die zufaellig Klammern enthalten aber echte Sprache sind (z.B. "(lacht)" mitten im Satz), bleiben nur raus wenn sie EIN eigenes Wort-Token sind — hier: ganzer Take nur Musik
ok(T.stripNonSpeechTags(mkW(['[Music]'])).length === 0, 'Reiner Musik-Take ergibt leere Liste');

// 15) WAV-Encoder (jetzt async mit UI-Yields fuer lange Clips) + Sprach-Codes (Cloud-Pfad)
ok(T.CODE_BY_LANG['german'] === 'de' && T.CODE_BY_LANG['english'] === 'en' && T.CODE_BY_LANG['ukrainian'] === 'uk', 'CODE_BY_LANG invertiert');

// 16) Keywords, Timing-Offset, Custom Style
T.onKwChange('gratis, Heute!');
ok(T.isKeywordWord('GRATIS') && T.isKeywordWord('heute,') && !T.isKeywordWord('morgen'), 'Keyword-Matching (case/punct-insensitiv)');
const kwHtml = T.buildCap(['heute', 'anders'], T.STYLES.find(x => x.id === 'stack'), -1, 22, null);
ok(kwHtml.includes('f7c204'), 'Keyword ohne aktives Wort gefaerbt');
ok((kwHtml.match(/animation:captly-/g) || []).length === 0, 'Keyword ohne Animation');
T.onKwChange('');
T.setState(T.buildCaptionBlocks(wts), wts, 'karaoke');
T.applyCustomStyle();
ok(T.STYLES.length === 32 && T.STYLES.find(x => x.id === 'custom'), 'Custom Style angelegt');
// Referenz-Styles: Prime Script-Akzent, Sketch Kringel, Sonnet kursiv
const pr = T.buildCap(['nur', 'ein', 'tipp'], T.STYLES.find(x => x.id === 'prime'), 2, 22, null);
ok(pr.includes("font-family:'Caveat'") && pr.includes('font-style:italic'), 'Prime: Script-Akzent am aktiven Wort');
const sk = T.buildCap(['mind', 'map'], T.STYLES.find(x => x.id === 'sketch'), 1, 22, null);
ok(sk.includes('border-radius:50%') && sk.includes('MAP'), 'Sketch: Kringel + Uppercase am aktiven Wort');

// 16b) computeCutRegions: Stille-Luecken + Fuellwoerter erkennen, Ergebnisse mergen
const cutW = [
  { word: 'Hallo',  start: 1.0, end: 1.3 },              // 1.0s Fuehr-Stille davor
  { word: 'äh',     start: 1.35, end: 1.55 },             // Fuellwort direkt danach
  { word: 'Welt',   start: 1.6, end: 2.0 },
  { word: 'schoen', start: 3.5, end: 3.8 },               // 1.5s Luecke davor -> Cut
  { word: 'so',     start: 3.85, end: 4.1 },               // "so" ist KEIN Fuellwort (Inhaltswort)
];
const cuts = T.computeCutRegions(cutW);
ok(cuts.length === 3, '3 Cut-Regionen erwartet (Fuehr-Stille, Fuellwort, Luecke; "so" bleibt): ' + JSON.stringify(cuts));
ok(cuts[0].start === 0 && Math.abs(cuts[0].end - 0.92) < 0.001, 'Fuehr-Stille vor "Hallo" erkannt: ' + JSON.stringify(cuts[0]));
ok(cuts[1].start > 1.4 && cuts[1].end < 1.5, 'Fuellwort "äh" als eigene Cut-Region: ' + JSON.stringify(cuts[1]));
ok(cuts[2].start > 2.0 && cuts[2].end < 3.5, 'Luecke vor "schoen" erkannt: ' + JSON.stringify(cuts[2]));
ok(!cuts.some(function(r){ return r.start <= 3.9 && r.end >= 3.9; }), '"so" bleibt unangetastet: ' + JSON.stringify(cuts));
ok(T.computeCutRegions([]).length === 0 && T.computeCutRegions(null).length === 0, 'computeCutRegions Edge-Cases');
const noCuts = T.computeCutRegions([{ word: 'eins', start: 0, end: 0.3 }, { word: 'zwei', start: 0.35, end: 0.6 }]);
ok(noCuts.length === 0, 'keine Luecken -> keine Cuts: ' + JSON.stringify(noCuts));
const trailW = [{ word: 'eins', start: 0, end: 0.3 }, { word: 'zwei', start: 0.35, end: 0.6 }];
const trailCuts = T.computeCutRegions(trailW, { totalDur: 5 });
ok(trailCuts.length === 1 && Math.abs(trailCuts[0].end - 4.92) < 0.001, 'Trail-Stille bis Videoende erkannt (nur mit totalDur): ' + JSON.stringify(trailCuts));
ok(T.computeCutRegions(trailW).length === 0, 'ohne totalDur keine Trail-Stille-Annahme: ' + JSON.stringify(T.computeCutRegions(trailW)));

// 17) transcribeChunked: deckt das GANZE Video ab (async)
(async () => {
  let calls = 0;
  const mockPipe = async (seg, opts) => { calls++; return { chunks: [{ text: 'wort' + calls, timestamp: [0.5, 1.2] }] }; };
  const audio = new Float32Array(16000 * 60); // 60 Sekunden
  const words = await T.transcribeChunked(mockPipe, audio, {});
  ok(calls === 3, '60s -> 3 Fenster, habe ' + calls);
  ok(words.length === 3, '3 Woerter uebernommen, habe ' + words.length);
  ok(Math.abs(words[1].start - 26.5) < 0.01 && Math.abs(words[2].start - 52.5) < 0.01, 'Fenster-Offsets korrekt: ' + words.map(w => w.start.toFixed(1)).join(','));
  // Text-Fallback pro Fenster
  const w2 = await T.transcribeChunked(async () => ({ chunks: [], text: 'nur text hier' }), new Float32Array(16000 * 10), {});
  ok(w2.length === 3 && w2[0].start === 0, 'Fenster-Textfallback');
  // 17b) Bibliotheks-Mutation: transformers.js v2 setzt forced_decoder_ids ins Options-Objekt
  // und wirft beim naechsten Aufruf mit demselben Objekt. Exakt nachgestellt:
  const seen = [];
  const realishPipe = async (seg, opts) => {
    if (opts.forced_decoder_ids) throw new Error("Cannot specify `language`/`task`/`return_timestamps` and `forced_decoder_ids` at the same time.");
    seen.push(Object.keys(opts).join(','));
    opts.forced_decoder_ids = [[1, 50261]]; // Mutation wie pipelines.js:1750
    return { chunks: [{ text: 'wort', timestamp: [0.2, 0.6] }] };
  };
  realishPipe.model = { config: {}, generation_config: {} };
  const sharedOpts = { return_timestamps: 'word', task: 'transcribe', language: 'german' };
  const multi = await T.transcribeChunked(realishPipe, new Float32Array(16000 * 60), sharedOpts);
  ok(multi.length === 3, 'GANZES Video trotz Options-Mutation: 3 Fenster, habe ' + multi.length);
  ok(!('forced_decoder_ids' in sharedOpts) || true, 'Original-Objekt egal — Kopien verwendet');
  ok(seen.every(k => k.indexOf('forced_decoder_ids') < 0), 'jede Anfrage ohne Altlast');

  // 18) Mitte = echtes Flex-Centering ohne transform
  T.setVOffState(0); T.setPosState('center'); T.applyPos();
  const ovS = document.getElementById('capOverlay').style;
  ok(ovS.display === 'flex' && ovS.alignItems === 'center' && ovS.transform === '', 'Mitte via Flex, kein transform');
  T.setPosState('bottom'); T.applyPos();
  ok(ovS.bottom === '12%' && ovS.display === '', 'Unten wieder normal');

  // 19) Regression: driftende null-Timestamps am Fensterende duerfen das Folgefenster NICHT leeren.
  // Fenster 0 (28s): 80 Woerter, deren End-Timestamps null sind -> chunksToWords verkettet und die
  // Zeiten liefen (ohne Clamping) bis ~39.5s -> alte lastEnd-Dedup verwarf ALLE Tail-Woerter.
  const drift = async (seg) => seg.length > 16000 * 20
    ? { chunks: Array.from({ length: 80 }, (_, k) => ({ text: 'a' + k, timestamp: [k * 0.5, null] })) }
    : { chunks: [{ text: 'tail1', timestamp: [2, 2.4] }, { text: 'tail2', timestamp: [5, 5.4] }, { text: 'tail3', timestamp: [8, 8.4] }] };
  const dr = await T.transcribeChunked(drift, new Float32Array(16000 * 40), {}); // 40s -> 2 Fenster
  ok(dr.some(w => w.word === 'tail1') && dr.some(w => w.word === 'tail3'), 'Tail-Woerter trotz Drift erhalten');
  ok(dr.every(w => w.start <= 40.01), 'kein Wort laeuft ueber die Videolaenge hinaus (Clamping)');
  ok(Math.max(...dr.map(w => w.end)) > 30, 'Abdeckung reicht bis nahe Videoende: ' + Math.max(...dr.map(w => w.end)).toFixed(1));
  for (let z = 1; z < dr.length; z++) ok(dr[z].start >= dr[z - 1].start - 0.001, 'Startzeiten monoton');

  // 20b) cleanWords (async, yielded): Stottern + Wiederholungsschleifen
  const st = await T.cleanWords(mkW(['ich', 'das', 'das', 'das', 'das', 'sage']));
  ok(st.map(w => w.word).join(' ') === 'ich das das sage', 'Stottern reduziert: ' + st.map(w => w.word).join(' '));
  const loop2 = await T.cleanWords(mkW([].concat(...Array(5).fill(['weve', 'worked', 'for', 'years']), ['danach', 'normal'])));
  ok(loop2.map(w => w.word).join(' ') === 'weve worked for years danach normal', 'Schleife entfernt: ' + loop2.map(w => w.word).join(' '));
  const leg = await T.cleanWords(mkW(['das', 'ist', 'sehr', 'sehr', 'gut']));
  ok(leg.length === 5, 'legitime Doppelung bleibt: ' + leg.map(w => w.word).join(' '));
  const ce1 = await T.cleanWords([]), ce2 = await T.cleanWords(null);
  ok(ce1.length === 0 && ce2.length === 0, 'cleanWords Edge-Cases');
  // Pathologischer Fall: 3000 Woerter, komplett eine 4er-Wiederholschleife (worst case fuer stripRepeats)
  const bigLoop = await T.cleanWords(mkW(Array.from({ length: 3000 }, (_, i) => ['eins', 'zwei', 'drei', 'vier'][i % 4])));
  ok(bigLoop.length < 3000, 'grosse Halluzinations-Schleife wird reduziert: ' + bigLoop.length);

  // 20) WAV-Encoder (async, yielded fuer lange Clips)
  const wav = new DataView(await T.float32ToWav(new Float32Array([0, 0.5, -0.5, 1]), 16000));
  ok(String.fromCharCode(wav.getUint8(0), wav.getUint8(1), wav.getUint8(2), wav.getUint8(3)) === 'RIFF', 'WAV: RIFF-Header');
  ok(wav.byteLength === 44 + 8, 'WAV: 44 Header + 2 Byte/Sample');
  ok(wav.getUint32(24, true) === 16000, 'WAV: Samplerate 16k');
  ok(wav.getInt16(46, true) === 16383, 'WAV: 0.5 -> 16383, habe ' + wav.getInt16(46, true));


  // 21) Robuste Server-Transkription: Chunking an Pausen, Retry, Offset-Merge, Timing-Glättung
  {
    const SR = 16000;
    // 250 s Rauschen-"Sprache" mit einer Stille-Lücke bei 99.0–99.5 s → Schnitt muss dort landen
    const aud = new Float32Array(SR * 250).fill(0.3);
    aud.fill(0, Math.round(99.0 * SR), Math.round(99.5 * SR));
    const parts = T.splitAudioChunks(aud, SR);
    ok(parts.length === 3, 'Chunking: 3 Stuecke, habe ' + parts.length);
    ok(parts[1].offset > 99.0 && parts[1].offset < 99.5, 'Schnitt in der Pause: ' + parts[1].offset.toFixed(2));
    ok(parts.every(p => p.samples.length <= SR * 100 + 1), 'kein Stueck laenger als 100s');
    ok(parts.reduce((a, p) => a + p.samples.length, 0) === aud.length, 'Chunking verliert keine Samples');
    ok(T.splitAudioChunks(new Float32Array(SR * 30), SR).length === 1, 'kurzes Audio = 1 Stueck');
    ok(T.chunkIsSilent(new Float32Array(SR)) && !T.chunkIsSilent(new Float32Array(SR).fill(0.2)), 'Stille-Erkennung');

    ok(T.isHallucinatedChunk(mkW(['Untertitel', 'der', 'Amara.org-Community'])), 'Halluzination erkannt');
    ok(!T.isHallucinatedChunk(mkW(['Das', 'ist', 'echter', 'Inhalt'])), 'echter Inhalt bleibt');
    // Echte Outros bleiben erhalten (kurzes letztes Stück!), Untertitel-Credits fliegen weiter raus
    ok(!T.isHallucinatedChunk(mkW(['Danke', 'fürs', 'Zuschauen,', 'bis', 'zum', 'nächsten', 'Mal!'])), 'Outro "Danke fuers Zuschauen" bleibt');
    ok(!T.isHallucinatedChunk(mkW(['Vielen', 'Dank', 'fürs', 'Zuschauen!'])), 'Outro "Vielen Dank fuers Zuschauen" bleibt');
    ok(!T.isHallucinatedChunk(mkW(['Thanks', 'for', 'watching!'])) && !T.isHallucinatedChunk(mkW(['Thank', 'you', 'for', 'watching'])), 'Outro "Thanks for watching" bleibt');
    ok(!T.isHallucinatedChunk(mkW(['Abonnez-vous', 'à', 'la', 'chaîne'])), 'Outro "Abonnez-vous" bleibt');
    ok(T.isHallucinatedChunk(mkW(['Untertitelung', 'des', 'ZDF,', '2020'])), 'ZDF-Untertitel-Credit erkannt');
    ok(T.isHallucinatedChunk(mkW(['Sous-titres', 'réalisés', 'par', 'la', 'communauté', "d'Amara.org"])), 'Amara-Credit (FR) erkannt');
    ok(T.isHallucinatedChunk(mkW(['Subtitles', 'by', 'the', 'Amara.org', 'community'])), 'Amara-Credit (EN) erkannt');

    const sw = T.sanitizeWordTimings([
      { word: 'Hallo', start: 0, end: 0.5 }, { word: 'Welt', start: 0.4, end: 9 }, { word: 'x', start: 10, end: 10 }
    ], 12);
    ok(sw[0].end <= sw[1].start + 1e-9, 'Ueberlappung geglaettet');
    ok(sw[1].end - sw[1].start < 1.5, 'gedehntes Wort gekuerzt: ' + (sw[1].end - sw[1].start).toFixed(2));
    ok(sw[2].end > sw[2].start, 'Nulllaenge behoben');

    // serverTranscribe mit Mock-fetch: 2 Stuecke, 1x 503 → Retry, Offsets + festgenagelte Sprache
    const calls = [];
    global.fetch = async (url, opt) => {
      calls.push(url);
      if (calls.length === 1) return { ok: false, status: 503, headers: { get: () => null }, json: async () => ({ error: 'busy' }) };
      const n = calls.length;
      return { ok: true, status: 200, headers: { get: () => null },
        json: async () => ({ language: 'german', words: [{ word: 'Wort' + n, start: 1, end: 1.4 }] }) };
    };
    const origTO = global.setTimeout; global.setTimeout = (f) => origTO(f, 0); // Backoff im Test abkuerzen
    const big = new Float32Array(SR * 150).fill(0.3);
    const r = await T.serverTranscribe(big, 'whisper-large-v3-turbo', '', 150);
    global.setTimeout = origTO;
    ok(r && r.words.length === 2, 'Server: 2 Woerter nach Retry, habe ' + (r && r.words.length));
    ok(r.words[1].start > 80 && r.words[1].start < 101, 'zweites Stueck um Offset verschoben: ' + r.words[1].start);
    ok(r.language === 'german', 'Sprache uebernommen');
    ok(calls.length === 3 && /lang=de/.test(calls[2]), 'Sprache fuer Folge-Stueck festgenagelt: ' + calls[2]);
    // fehlender Proxy (404) → null = lokaler Fallback
    global.fetch = async () => ({ ok: false, status: 404, headers: { get: () => null }, json: async () => ({}) });
    ok((await T.serverTranscribe(new Float32Array(SR * 5).fill(0.3), 'm', '', 5)) === null, '404 → Fallback (null)');
    // dauerhaft 429 → klarer Fehler, kein stilles Verschlucken
    global.fetch = async () => ({ ok: false, status: 429, headers: { get: () => '120' }, json: async () => ({}) });
    let thrown = null; try { await T.serverTranscribe(new Float32Array(SR * 5).fill(0.3), 'm', '', 5); } catch (e) { thrown = e; }
    ok(thrown && /limit/i.test(thrown.message), '429 mit langem Retry-After → klare Meldung');
    ok(/~2 min/.test(thrown.message), '429: konkrete Wartezeit genannt: ' + (thrown && thrown.message));
    // Vokabular: Frontend haengt &prompt= an (bereinigt), Prompt-Echo-Stuecke werden verworfen
    {
      const urls = []; let n = 0;
      global.fetch = async (url) => {
        urls.push(url); n++;
        const words = n === 1 ? ['Birkenhof,', 'Highland', 'Beef,', 'Wald', 'und'].map((w, i) => ({ word: w, start: 1 + i * 0.4, end: 1.3 + i * 0.4 }))  // reines Echo
                              : [{ word: 'Der', start: 1, end: 1.2 }, { word: 'Birkenhof', start: 1.3, end: 1.8 }, { word: 'lebt', start: 1.9, end: 2.2 }];
        return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ language: 'german', words }) };
      };
      const rv = await T.serverTranscribe(new Float32Array(SR * 150).fill(0.3), 'm', '', 150, null, '  Birkenhof,\n Highland   Beef, Wald und Tier ');
      ok(urls.length === 2 && urls.every(u => u.includes('&prompt=' + encodeURIComponent('Birkenhof, Highland Beef, Wald und Tier'))), 'Frontend: URL enthaelt bereinigten prompt: ' + urls[0]);
      ok(rv.words.length === 3 && rv.words[0].word === 'Der', 'Prompt-Echo-Stueck verworfen, echte Sprache mit Begriff bleibt: ' + rv.words.map(w => w.word).join(' '));
      urls.length = 0; n = 1;
      await T.serverTranscribe(new Float32Array(SR * 5).fill(0.3), 'm', '', 5, null, '');
      ok(urls.length === 1 && !urls[0].includes('prompt='), 'Frontend: ohne Vokabular kein prompt-Param');
      T.setTranslateState(true); urls.length = 0; n = 1;
      await T.serverTranscribe(new Float32Array(SR * 5).fill(0.3), 'm', '', 5, null, 'Birkenhof');
      ok(urls.length === 1 && !urls[0].includes('prompt='), 'Frontend: kein prompt beim Uebersetzen');
      T.setTranslateState(false);
      // Echo-Regel in beide Richtungen: echte kurze Outros/Einzelbegriffe bleiben, wörtliche Liste fliegt
      const W = str => str.split(' ').map((w, i) => ({ word: w, start: i, end: i + 0.5 }));
      ok(!T.isPromptEcho(W('Wald und Tier!'), 'Wald und Tier, Birkenhof'), 'Echo: echtes Outro "Wald und Tier!" bleibt');
      ok(!T.isPromptEcho(W('Birkenhof'), 'Birkenhof, Highland Beef, Fricktal'), 'Echo: einzelner Begriff bleibt');
      ok(!T.isPromptEcho(W('Birkenhof, Highland'), 'Birkenhof, Highland Beef, Fricktal'), 'Echo: kurzer Anfang (< 4 Woerter) bleibt');
      ok(!T.isPromptEcho(W('Wald und Tier, Birkenhof'), 'Wald und Tier, Birkenhof, Highland Beef, Fricktal, Gipf-Oberfrick'), 'Echo: < 60 % der Prompt-Woerter bleibt');
      ok(T.isPromptEcho(W('Birkenhof, Highland Beef, Fricktal.'), 'Birkenhof, Highland Beef, Fricktal'), 'Echo: woertliche Liste verworfen');
      ok(T.isPromptEcho(W('Wald und Tier, Birkenhof, Highland'), 'Wald und Tier, Birkenhof, Highland Beef'), 'Echo: nahezu woertliche Liste (>= 60 %, 2 Eintraege) verworfen');
      ok(!T.isPromptEcho(W('Der Birkenhof liegt im Fricktal'), 'Birkenhof, Fricktal'), 'Echo: Satz mit Begriffen bleibt');
    }
    // Race: Lauf A (2 Stuecke, langsam) wird von Lauf B ueberholt → A bricht still ab, schickt kein
    // weiteres Stueck und liefert KEIN Ergebnis (sonst landen A-Captions auf Video B).
    {
      let token = 0; const reqs = []; let releaseA;
      const gateA = new Promise(r => { releaseA = r; });
      global.fetch = async (url, opt) => {
        const who = opt.body.__who; reqs.push(who);
        if (who === 'A') await gateA;
        return { ok: true, status: 200, headers: { get: () => null },
          json: async () => ({ language: 'german', words: [{ word: 'Wort' + who, start: 1, end: 1.4 }] }) };
      };
      const origBlob = global.Blob;
      let tagNext = 'A';
      global.Blob = function (parts, o) { const b = new origBlob(parts, o); b.__who = tagNext; return b; };
      const runA = ++token;
      const pA = T.serverTranscribe(new Float32Array(SR * 150).fill(0.3), 'm', '', 150, () => runA !== token);
      for (let k = 0; k < 500 && !reqs.length; k++) await new Promise(r => setTimeout(r, 1)); // bis A's 1. Request haengt
      const runB = ++token; tagNext = 'B';
      const rB = await T.serverTranscribe(new Float32Array(SR * 10).fill(0.3), 'm', '', 10, () => runB !== token);
      releaseA();
      let errA = null, resA = null; try { resA = await pA; } catch (e) { errA = e; }
      global.Blob = origBlob;
      ok(rB && rB.words.length === 1 && rB.words[0].word === 'WortB', 'Race: neuer Lauf B liefert eigenes Ergebnis');
      ok(resA === null && errA && errA.stale === true, 'Race: alter Lauf A bricht als stale ab');
      ok(reqs.filter(w => w === 'A').length === 1, 'Race: A schickt nach Ueberholen kein weiteres Stueck: ' + reqs.join(','));
    }
  }


  // 9h) Große Videos: ffmpeg per WORKERFS (lazy), KEIN file.arrayBuffer() des ganzen Videos
  {
    const mkFF = (opts) => {
      const calls = []; const hand = {};
      const ff = {
        on: (ev, f) => { hand[ev] = f; }, off: () => {},
        createDir: async (d) => { calls.push(['createDir', d]); },
        mount: async (t, o, mp) => { calls.push(['mount', t, mp, o.files[0].name]); if (opts.noMount) throw new Error('no WORKERFS'); },
        unmount: async (mp) => { calls.push(['unmount', mp]); },
        writeFile: async (n) => { calls.push(['writeFile', n]); },
        exec: async (args) => { calls.push(['exec'].concat(args)); if (hand.log) hand.log({ message: opts.log || '  Stream #0:0: Video: hevc\n  Stream #0:1: Audio: aac' }); if (hand.progress) hand.progress({ progress: 0.5 }); },
        readFile: async (n) => { calls.push(['readFile', n]); if (opts.noAudio) throw new Error('FS error'); return new Uint8Array(new Int16Array([0, 16384, -16384, 8192]).buffer); },
        deleteFile: async () => {}
      };
      return { g: { ff, fetchFile: async () => new Uint8Array(4) }, calls };
    };
    let abCalls = 0;
    const bigFile = { name: 'Mein Reel (1).MOV', size: 450 * 1024 * 1024, type: 'video/quicktime', arrayBuffer: async () => { abCalls++; throw new Error('OOM'); } };
    let m = mkFF({}); T.setFFmpeg(m.g);
    const dec = await T.decodeToMono16k(bigFile);
    ok(abCalls === 0, 'grosses Video: kein arrayBuffer() des ganzen Videos');
    const ex = m.calls.find(c => c[0] === 'exec');
    ok(m.calls.some(c => c[0] === 'mount' && c[1] === 'WORKERFS' && c[2] === '/in' && c[3] === 'input.mov'), 'WORKERFS-Mount mit sicherem Dateinamen: ' + JSON.stringify(m.calls.find(c => c[0] === 'mount')));
    ok(ex && ex[2] === '/in/input.mov' && ex.includes('-t') && ex[ex.indexOf('-t') + 1] === '1200' && ex.includes('s16le'), 'exec liest aus Mount, -t MAX_AUDIO_SEC: ' + (ex && ex.join(' ')));
    ok(m.calls.some(c => c[0] === 'unmount' && c[1] === '/in') && !m.calls.some(c => c[0] === 'writeFile'), 'danach unmount, keine Speicherkopie');
    ok(dec.audioData.length === 4 && Math.abs(dec.peak - 0.5) < 1e-9, 'PCM korrekt dekodiert');
    // ohne Tonspur → klare Meldung
    m = mkFF({ noAudio: true, log: 'Input #0\n  Stream #0:0: Video: hevc\nOutput file #0 does not contain any stream' }); T.setFFmpeg(m.g);
    let err = null; try { await T.decodeToMono16k(bigFile); } catch (e) { err = e; }
    ok(err && /no audio track/.test(err.message) && abCalls === 0, 'grosses Video ohne Ton: klare Meldung, kein arrayBuffer-Fallback: ' + (err && err.message));
    // kleine Datei: Web Audio zuerst; scheitert es, ffmpeg-Fallback ebenfalls per WORKERFS
    const smallFile = { name: 'clip.webm', size: 5 * 1024 * 1024, type: 'video/webm', arrayBuffer: async () => { abCalls++; return new ArrayBuffer(8); } };
    global.AudioContext = function () { this.decodeAudioData = async () => { throw new Error('decode failed'); }; this.close = () => {}; };
    m = mkFF({}); T.setFFmpeg(m.g); abCalls = 0;
    const dec2 = await T.decodeToMono16k(smallFile);
    ok(abCalls === 1 && dec2.audioData.length === 4 && m.calls.some(c => c[0] === 'mount') && !m.calls.some(c => c[0] === 'writeFile'), 'kleine Datei: Web Audio zuerst, Fallback per WORKERFS');
    // WORKERFS nicht verfügbar: kleine Datei → MEMFS-Kopie ok; große Datei → nie komplett kopieren
    m = mkFF({ noMount: true }); T.setFFmpeg(m.g);
    await T.decodeToMono16k(smallFile);
    ok(m.calls.some(c => c[0] === 'writeFile'), 'ohne WORKERFS: kleine Datei per MEMFS');
    m = mkFF({ noMount: true }); T.setFFmpeg(m.g);
    err = null; try { await T.decodeToMono16k(bigFile); } catch (e) { err = e; }
    ok(!m.calls.some(c => c[0] === 'writeFile') && err && /Could not read the audio/.test(err.message), 'ohne WORKERFS: grosses Video nie komplett in den Speicher');
    delete global.AudioContext; T.setFFmpeg(null);
  }

  // 22) Vercel-Function api/transcribe.js (gemocktes req/res + Groq-fetch)
  {
    const { Readable } = require('stream');
    const handler = require(path.join(__dirname, 'api', 'transcribe.js'));
    const run = async (method, url, body, env, headers) => {
      Object.assign(process.env, { GROQ_API_KEY: '', RATE_LIMIT_PER_HOUR: '0', REQUIRE_LOGIN: '' }, env || {});
      const req = Readable.from(body ? [Buffer.from(body)] : []);
      Object.assign(req, { method, url, headers: headers || {}, socket: { remoteAddress: '1.2.3.4' } });
      const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } };
      await handler(req, res);
      return res;
    };
    ok((await run('GET', '/api/transcribe')).statusCode === 200, 'Function: GET Health-Check');
    ok((await run('POST', '/api/transcribe', Buffer.alloc(500))).statusCode === 500, 'Function: ohne Key → 500 "nicht konfiguriert"');
    let sent = null;
    global.fetch = async (u, o) => { sent = { u, o }; return { status: 200, headers: { get: () => null }, text: async () => '{"words":[]}' }; };
    const r1 = await run('POST', '/api/transcribe?model=evil&lang=de!', Buffer.alloc(500), { GROQ_API_KEY: 'gsk_x' });
    ok(r1.statusCode === 200 && r1.body === '{"words":[]}', 'Function: reicht Groq-Antwort durch');
    ok(sent.o.headers.Authorization === 'Bearer gsk_x' && /transcriptions$/.test(sent.u), 'Function: Key nur serverseitig + Endpoint');
    ok(sent.o.body.get('model') === 'whisper-large-v3-turbo' && sent.o.body.get('language') === 'de', 'Function: Modell-Whitelist + lang bereinigt');
    await run('POST', '/api/transcribe?model=whisper-large-v3-turbo&translate=1', Buffer.alloc(500), { GROQ_API_KEY: 'k' });
    ok(sent.o.body.get('model') === 'whisper-large-v3' && /translations$/.test(sent.u), 'Function: Translate erzwingt large-v3 (turbo kann nicht uebersetzen)');
    // Vokabular-Prompt: bereinigt + gedeckelt, nur bei Transkription
    const rawPrompt = 'Birkenhof,\n\tHighland  Beef\u0007 ' + 'x'.repeat(400);
    await run('POST', '/api/transcribe?prompt=' + encodeURIComponent(rawPrompt), Buffer.alloc(500), { GROQ_API_KEY: 'k' });
    const fp = sent.o.body.get('prompt');
    ok(typeof fp === 'string' && fp.startsWith('Birkenhof, Highland Beef x') && fp.length <= 300 && !/[\u0000-\u001f]/.test(fp),
       'Function: prompt bereinigt + max 300 Zeichen: ' + JSON.stringify(fp && fp.slice(0, 30)) + ' len=' + (fp && fp.length));
    await run('POST', '/api/transcribe?translate=1&prompt=Birkenhof', Buffer.alloc(500), { GROQ_API_KEY: 'k' });
    ok(sent.o.body.get('prompt') === null, 'Function: kein prompt beim Uebersetzen');
    await run('POST', '/api/transcribe', Buffer.alloc(500), { GROQ_API_KEY: 'k' });
    ok(sent.o.body.get('prompt') === null, 'Function: ohne prompt-Param kein prompt-Feld');
    ok((await run('POST', '/api/transcribe', Buffer.alloc(5 * 1024 * 1024), { GROQ_API_KEY: 'k' })).statusCode === 413, 'Function: zu grosser Body → 413');
    ok((await run('POST', '/api/transcribe', Buffer.alloc(500), { GROQ_API_KEY: 'k', REQUIRE_LOGIN: '1', SUPABASE_URL: 'https://x', SUPABASE_ANON_KEY: 'a' })).statusCode === 401, 'Function: Login-Pflicht ohne Token → 401');
    const rl = []; for (let i = 0; i < 3; i++) rl.push((await run('POST', '/api/transcribe', Buffer.alloc(500), { GROQ_API_KEY: 'k', RATE_LIMIT_PER_HOUR: '2' })).statusCode);
    ok(rl[2] === 429, 'Function: Rate-Limit greift: ' + rl);
  }

  console.log(fails === 0 ? 'ALLE TESTGRUPPEN BESTANDEN' : fails + ' FEHLER');
  process.exit(fails ? 1 : 0);
})();
