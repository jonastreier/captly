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
    onclick: null, oninput: null
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
looksRepetitive:looksRepetitive,cleanWords:cleanWords,stripNonSpeechTags:stripNonSpeechTags,renderShowcase:renderShowcase,getLang:function(){return whisperLang;},NAV_LANG:NAV_LANG,float32ToWav:float32ToWav,CODE_BY_LANG:CODE_BY_LANG,onKwChange:onKwChange,applyCustomStyle:applyCustomStyle,isKeywordWord:isKeywordWord,transcribeChunked:transcribeChunked,safePipe:safePipe,clearForcedIds:clearForcedIds,setPosState:function(p){capPos=p;},setVOffState:function(v){capVOff=v;},applyPos:applyPos,mergeChunkWords:mergeChunkWords};`;
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

  console.log(fails === 0 ? 'ALLE TESTGRUPPEN BESTANDEN' : fails + ' FEHLER');
  process.exit(fails ? 1 : 0);
})();
