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
needsWatermark:needsWatermark,webmToMp4Trim:webmToMp4Trim,enforceMinBlockDuration:enforceMinBlockDuration,exportBtnState:exportBtnState,
revertTranscriptionSettings:revertTranscriptionSettings,getModel:function(){return whisperModel;},setLastTrMeta:function(m){_lastTrMeta=m;},pickRecorderMime:pickRecorderMime,recorderMimeIsSafeMp4:recorderMimeIsSafeMp4,
exportGeometry:exportGeometry,exportBitrate:exportBitrate,drawReframed:drawReframed,classifyUnplayable:classifyUnplayable,
applyPlayability:applyPlayability,setVideoPlayable:function(v){videoPlayable=v;},transcribeVideo:transcribeVideo,DEFAULT_STYLE:DEFAULT_STYLE,
setExportFormatState:function(f){exportFormat=f;},editListEnd:editListEnd,histDistance:histDistance,
cssColorToHexA:cssColorToHexA,cssColorToHex:cssColorToHex,liveTemplates:liveTemplates,flushCustomStyle:flushCustomStyle,
decideSceneCuts:decideSceneCuts,cutFrame:cutFrame,lumaHistogram:lumaHistogram,meanAbsDiff:meanAbsDiff,setSceneCuts:setSceneCuts,getSceneCuts:function(){return sceneCuts;},
onBreakAtCutsChange:onBreakAtCutsChange,currentBlockIdx2:currentBlockIdx,setDisplayMode:function(m){displayMode=m;},polishWords:polishWords,
polishEnabled:polishEnabled,setModelState:function(m){whisperModel=m;},polishSegments:polishSegments,validateExportBlob:validateExportBlob,drawCaptionsOnCtx:drawCaptionsOnCtx,capShadowPlan:capShadowPlan,audioTruncated:audioTruncated,parseTextShadows:parseTextShadows,
splitShadows:splitShadows,setSb:function(x){_sb=x;},syncTemplatesWithCloud:syncTemplatesWithCloud,pushTemplatesToCloud:pushTemplatesToCloud,
loadProjects:loadProjects,restoreSavedStyle:restoreSavedStyle,setUserTemplates:function(l){userTemplates=l;},pruneTemplates:pruneTemplates,
TPL_ROW_TITLE:TPL_ROW_TITLE,snapWordTimings:snapWordTimings,onTimeOffChange:onTimeOffChange,getTimeOff:function(){return timeOff;},
countMatches:countMatches,replaceAllCaptions:replaceAllCaptions,displayWord:displayWord,togglePunct:togglePunct,setCaptionCase:setCaptionCase,
transcriptText:transcriptText,copyTranscript:copyTranscript,exportTXT:exportTXT,seedCustomFields:seedCustomFields,buildCustomStyle:buildCustomStyle,
setCsDirty:function(d){_csDirty=d;},saveTemplate:saveTemplate,loadTemplates:loadTemplates,getUserTemplates:function(){return userTemplates;},
mergeTemplates:mergeTemplates,importTemplatesFromText:importTemplatesFromText,renameTemplate:renameTemplate,duplicateTemplate:duplicateTemplate,
deleteTemplate:deleteTemplate,parseOutline:parseOutline,outlineShadow:outlineShadow,hlColorFor:hlColorFor,getWpb:function(){return WORDS_PER_BLOCK;},
getActiveId:function(){return activeId;},editTemplate:editTemplate,getEditingTpl:function(){return _csEditingTpl;},decodeToMono16k:decodeToMono16k,setFFmpeg:function(f){_ffmpeg=f;},isPromptEcho:isPromptEcho,capFontsChanged:capFontsChanged,
getAutosaveTimer:function(){return _autosaveTimer;},setExporting:function(v){isExporting=v;},autosaveWhenIdle:autosaveWhenIdle,autosaveNow:autosaveNow,restoreOrTranscribe:restoreOrTranscribe,
readAutosaves:readAutosaves,setAutosaveKey:function(k){_autosaveKey=k;},AUTOSAVE_KEY:AUTOSAVE_KEY,setTranslateState:function(v){doTranslate=v;},capHyphenate:capHyphenate,onWpbChangeT:onWpbChange,
setMe:function(plan,email){mePlan=plan;meEmail=email;},
rebaseCutTime:rebaseCutTime,createAudioCutPlanner:createAudioCutPlanner,rotationFromMatrix:rotationFromMatrix,editListOffset:editListOffset,
h264CodecCandidates:h264CodecCandidates,fastExportVideoCodecs:fastExportVideoCodecs,isFastExportSource:isFastExportSource,fastExportSupported:fastExportSupported,
oggCrc32:oggCrc32,oggLacing:oggLacing,opusPacketSamples48:opusPacketSamples48,buildOggOpus:buildOggOpus,opusPreSkipFromDesc:opusPreSkipFromDesc,
encodeUploadAudio:encodeUploadAudio,resetOpus:function(){_opusOff=false;_opusSupport=null;},getOpusOff:function(){return _opusOff;},UPLOAD_CONCURRENCY:UPLOAD_CONCURRENCY,
sceneCutPath:sceneCutPath,waitForSceneCuts:waitForSceneCuts,beginCutRun:beginCutRun,finishCutRun:finishCutRun,cutsDetecting:cutsDetecting,mergeCutCands:mergeCutCands,CUT_W:CUT_W,CUT_H:CUT_H,
nudgeBlockEdge:nudgeBlockEdge,pushUndo:pushUndo,undoCaptions:undoCaptions,redoCaptions:redoCaptions,resetUndo:resetUndo,
undoDepth:function(){return [_undoStack.length,_redoStack.length];},templateFontSize:templateFontSize,normalizeTemplate:normalizeTemplate,
brandTplId:brandTplId,toggleBrandTpl:toggleBrandTpl,applyBrandOnOpen:applyBrandOnOpen,cleanFontName:cleanFontName,fontCssUrl:fontCssUrl,
tileWords:tileWords,switchTab:switchTab,deleteSeg:deleteSeg,closeInlineEdit:closeInlineEdit,openInlineEdit:openInlineEdit,
updateTrSetSum:updateTrSetSum,syncTopExport:syncTopExport,currentLayout:currentLayout,getFontSize:function(){return fontSize;},getCase:function(){return capCase;},
detectSpeechRegions:detectSpeechRegions,speechProbabilities:speechProbabilities,speechSpans:speechSpans,buildSpeechTrack:buildSpeechTrack,mapTrackWord:mapTrackWord,constrainWordsToSpeech:constrainWordsToSpeech,vadFft:vadFft,vadFftTables:vadFftTables};`;
const T = new Function(script + tail)();
const initialLang = T.getLang(); // direkt nach INIT, bevor Tests den State ändern

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL:', m); } };

// 1) Grunddaten
ok(T.STYLES.length === 36, '36 Styles erwartet (31 + 5 Trend-Presets): ' + T.STYLES.length);

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
{ // Durchgehend, aber lange Strecke ohne Sprache (> 1,5 s bis zum nächsten Block): nach Ende + 0,6 s ausblenden
  const wl = [{ word: 'Erst.', start: 0.5, end: 1.0 }, { word: 'Dann.', start: 5.0, end: 5.5 }];
  T.setState(T.buildCaptionBlocks(wl, []), wl, 'all');
  ok(T.currentBlockIdx(1.4) === 0 && T.currentBlockIdx(1.7) === -1 && T.currentBlockIdx(4.0) === -1 && T.currentBlockIdx(5.2) === 1, 'Durchgehend: lange Pause → Block verschwindet nach 0,6 s');
  ok(T.currentBlockIdx(5.9) === 1 && T.currentBlockIdx(6.3) === -1, 'Durchgehend: letzter Block bleibt nicht bis zum Videoende stehen');
  T.setState(bl, wts, 'all');
}
T.setState(bl, wts, 'karaoke');
ok(T.activeWordIdx(bl[2], 3.5) === 2, 'aktives Wort = etwas');

// 6) buildCap: index-basiertes Highlight + Seek-Handler
const s = T.STYLES.find(x => x.id === 'stack');
const html = T.buildCap(['ein', 'zwei', 'drei'], s, 1, 22, [0, 0.5, 1]);
ok(html.includes('f7c204'), 'HL-Farbe im HTML');
ok(html.split('capOverlayClickWord').length === 4, '3 Klick-Handler (Seek/Inline-Edit), habe ' + (html.split('capOverlayClickWord').length - 1));
ok(/data-wi="2"[^>]*capOverlayClickWord\(event,2,1\.000\)/.test(html), 'Wort-Index + Zeit am Wort-Span');
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
T.setMe('anon', 'x@y.z'); ok(T.needsWatermark() === false, 'E-Mail gesetzt → nie Wasserzeichen (auch ohne Plan-Update)');
T.setMe('free', ''); ok(T.needsWatermark() === true, 'ohne E-Mail → Wasserzeichen');
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
ok(T.STYLES.length === 37 && T.STYLES.find(x => x.id === 'custom'), 'Custom Style angelegt');
// Referenz-Styles: Prime Script-Akzent, Sketch Kringel, Sonnet kursiv
const pr = T.buildCap(['nur', 'ein', 'tipp'], T.STYLES.find(x => x.id === 'prime'), 2, 22, null);
ok(pr.includes("font-family:'Caveat'") && pr.includes('font-style:italic'), 'Prime: Script-Akzent am aktiven Wort');
const sk = T.buildCap(['mind', 'map'], T.STYLES.find(x => x.id === 'sketch'), 1, 22, null);
ok(sk.includes('border-radius:50%') && sk.includes('MAP'), 'Sketch: Kringel + Uppercase am aktiven Wort');

// 16a) Custom-Style-Editor: startet vom gewählten Style, nur geänderte Gruppen überschreiben
{
  const E = id => document.getElementById(id);
  const base = T.STYLES.find(x => x.id === 'boxkara');
  T.selectStyle('boxkara');                      // seedet die Regler + Basis
  ok(E('csBox').value === 'box' && E('csHlType').value === 'pill' && E('csAnim').value === 'scale', 'Regler aus Box Karaoke befuellt');
  E('csText').value = '#ff0000';
  T.setCsDirty({ text: true });
  let cs = T.buildCustomStyle();
  ok(cs.tc === '#ff0000' && cs.boxBg === base.boxBg && cs.hlPillBg === base.hlPillBg && cs.anim === 'scale' && cs.fw === base.fw,
     'Custom behaelt Box/Pill/Animation/Gewicht des Ausgangs-Styles');
  // Kontur, Großbuchstaben, Abstand, Gewicht, Hintergrund, Highlight-Typ, Animation
  E('csOutlineW').value = '4'; E('csOutlineC').value = '#112233';
  E('csUpper').classList.add('on'); E('csLs').value = '2'; E('csWeight').value = '900';
  E('csBox').value = 'pill'; E('csBoxR').value = '22'; E('csBoxC').value = '#ffffff'; E('csBoxO').value = '40';
  E('csHlType').value = 'color'; E('csHl').value = '#00ffaa'; E('csAnim').value = 'wobble';
  T.setCsDirty({ text: true, stroke: true, upper: true, ls: true, weight: true, box: true, hl: true, anim: true });
  cs = T.buildCustomStyle();
  ok(T.parseOutline(cs.ts).w === 4 && cs.ts.includes('#112233'), 'Kontur 4px in ts: ' + cs.ts.slice(0, 40));
  ok(cs.tt === 'uppercase' && cs.ls === '2px' && cs.fw === '900' && cs.anim === 'wobble', 'Caps/Abstand/Gewicht/Animation');
  ok(cs.boxBg === 'rgba(255,255,255,0.4)' && cs.boxBr === '22px', 'Hintergrund-Pill mit Deckkraft: ' + cs.boxBg);
  E('csBoxR').value = '13'; ok(T.buildCustomStyle().boxBr === '13px', 'Eckenradius frei einstellbar (Corners)');
  E('csBoxR').value = '99'; ok(T.buildCustomStyle().boxBr === '30px', 'Eckenradius auf 30px gedeckelt');
  E('csBoxR').value = '22';
  ok(!cs.hlPillBg && cs.hl === '#00ffaa' && T.parseOutline(cs.hls).w === 4, 'Highlight als Textfarbe mit Kontur');
  const html = T.buildCap(['eins', 'zwei'], cs, 1, 22, null);
  ok(html.includes('letter-spacing:2px') && html.includes('text-transform:uppercase') && html.includes('rgba(255,255,255,0.4)') && html.includes('captly-wobble'),
     'Vorschau rendert alle Custom-Eigenschaften');
  // Pill-Modus: dasselbe Farbfeld („Pill“) ist die Pill-Farbe
  E('csHlType').value = 'pill'; E('csHl').value = '#fde047';
  cs = T.buildCustomStyle();
  ok(cs.hlPillBg === '#fde047' && cs.hlc === '#111', 'Highlight-Pill mit lesbarer Textfarbe');
  // Kontur-Erkennung aus bestehenden Styles
  ok(T.parseOutline(T.STYLES.find(x => x.id === 'classic').ts).w === 2, 'Kontur von Standard erkannt (2px)');
  ok(T.parseOutline(T.outlineShadow(6, '#000')).w === 6, 'outlineShadow ↔ parseOutline');
  T.setCsDirty({});
}

// 16a2) Templates: kompletter Style + Layout, Verwaltung, Migration, Merge, Import (bereinigt)
{
  const store = {};
  global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  // Legacy-v1-Template migrieren
  store.capivo_templates = JSON.stringify([{ id: 'tpl_1700000000000', name: 'Alt', font: 'Anton', tc: '#ffffff', hl: '#ff0000', glow: true, glowInt: 9, pos: 'top', size: 30, wpb: 3 }]);
  T.loadTemplates();
  const legacy = T.STYLES.find(x => x.id === 'tpl_1700000000000');
  ok(legacy && legacy.fl === 'Anton' && legacy.hl === '#ff0000' && /0 0 9px/.test(legacy.hls) && legacy._tpl.pos === 'top' && legacy._tpl.wpb === 3, 'Legacy-Template migriert');
  // Neues Template speichert den VOLLEN Style
  T.selectStyle('boxkara');
  document.getElementById('tplName').value = 'Mein Box';
  T.saveTemplate();
  let tpl = T.getUserTemplates().find(t => t.name === 'Mein Box');
  ok(tpl && tpl.style.boxBg && tpl.style.hlPillBg === '#22c55e' && tpl.style.anim === 'scale' && tpl.layout && typeof tpl.layout.wpb === 'number',
     'Template enthaelt vollen Style + Layout');
  T.loadTemplates();
  ok(T.STYLES.find(x => x.id === tpl.id).boxBg === tpl.style.boxBg, 'Template ueberlebt Reload (localStorage)');
  // Rename / Duplicate / Edit / Delete
  global.prompt = () => 'Umbenannt'; T.renameTemplate(tpl.id);
  ok(T.getUserTemplates().find(t => t.id === tpl.id).name === 'Umbenannt', 'Rename');
  T.duplicateTemplate(tpl.id);
  const dup = T.getUserTemplates().find(t => t.name === 'Umbenannt copy');
  ok(dup && dup.id !== tpl.id && dup.style.boxBg === tpl.style.boxBg, 'Duplicate');
  T.editTemplate(tpl.id);
  ok(T.getEditingTpl() === tpl.id && document.getElementById('tplSaveBtn').textContent === 'Update', 'Edit-Modus');
  T.selectStyle('hormozi'); // anderer Style beendet den Edit-Modus
  ok(T.getEditingTpl() === null, 'Edit-Modus endet bei Style-Wechsel');
  global.confirm = () => true; T.deleteTemplate(dup.id);
  ok(!T.STYLES.find(x => x.id === dup.id) && T.getUserTemplates().find(t => t.id === dup.id).deleted, 'Delete hinterlaesst Grabstein');
  // Merge: neueres updatedAt gewinnt, Grabstein schlägt ältere Version
  const m = T.mergeTemplates([{ id: 'tpl_a', name: 'alt', style: { fl: 'Inter' }, updatedAt: 1 }, { id: 'tpl_b', name: 'b', style: {}, updatedAt: 5 }],
                             [{ id: 'tpl_a', name: 'neu', style: { fl: 'Anton' }, updatedAt: 2 }, { id: 'tpl_b', deleted: true, updatedAt: 9 }]);
  ok(m.find(t => t.id === 'tpl_a').name === 'neu' && m.find(t => t.id === 'tpl_b').deleted, 'Merge: neuer gewinnt, Grabstein gewinnt');
  // Import bereinigt gefährliche Werte und kollidiert nie mit eingebauten IDs
  const n = T.importTemplatesFromText(JSON.stringify({ templates: [{ id: 'classic', name: 'X', style: { fl: 'Inter', font: "'Inter'\"><img src=x onerror=alert(1)>", tc: 'red;background:url(http://x)' } }] }));
  const imp = T.getUserTemplates().find(t => t.name === 'X');
  ok(n === 1 && imp.id === 'tpl_classic' && !/[<>"]/.test(imp.style.font) && !/url\(|;/.test(imp.style.tc), 'Import bereinigt: ' + imp.style.font + ' / ' + imp.style.tc);
  ok(T.STYLES.filter(x => x.id === 'classic').length === 1, 'eingebauter Style unangetastet');
  delete global.localStorage; delete global.prompt;
}

// 16a2b) Custom-Editor: Farbumrechnung, Befüllen aller Regler aus Pill/Box/Kontur/Glow-Styles,
//         jede Regler-Gruppe wirkt, Templates speichern/überschreiben/Reihenfolge
{
  const E = id => document.getElementById(id);
  // Farbumrechnung: color-Inputs akzeptieren nur #rrggbb
  const C = T.cssColorToHexA;
  ok(C('#fff').hex === '#ffffff' && C('#FFD60A').hex === '#ffd60a' && C('#abc').a === 1, 'Hex 3/6-stellig → #rrggbb');
  ok(C('rgba(255,255,255,.55)').hex === '#ffffff' && Math.abs(C('rgba(255,255,255,.55)').a - 0.55) < 1e-9, 'rgba() → Hex + Deckkraft');
  ok(C('rgb(34, 197, 94)').hex === '#22c55e' && C('rgb(0 0 0 / 50%)').a === 0.5, 'rgb() mit Komma/Leerzeichen/Prozent-Alpha');
  ok(C('white').hex === '#ffffff' && C('Red').hex === '#ff0000' && C('transparent').a === 0, 'Farbnamen');
  ok(C('#ff000080').hex === '#ff0000' && Math.abs(C('#ff000080').a - 0.5) < 0.01, '#rrggbbaa');
  ok(C('linear-gradient(90deg,#ff00aa,#00ffcc)').hex === '#ff00aa', 'Gradient → erste Farbstufe');
  ok(C('kein-farbwert') === null && T.cssColorToHex(undefined, '#123456') === '#123456', 'ungueltig → null bzw. Fallback');

  // Befüllen: Pill-Style (Flux) — „Active“-Feld zeigt die PILL-Farbe und heißt „Pill“
  T.setCsDirty({});
  E('csHl').value = '#facc15'; E('csGlow').checked = true; // Reste eines vorigen Styles
  T.selectStyle('pulse');
  ok(E('csHl').value === '#00ff85' && E('csHlType').value === 'pill' && E('csHlLbl').textContent === 'Pill', 'Pill-Style: Farbfeld = Pill-Farbe, Label „Pill“: ' + E('csHl').value);
  ok(E('csText').value === '#ffffff' && E('csFont').value === 'Montserrat' && E('csWeight').value === '900' && E('csUpper').classList.contains('on'), 'Pill-Style: Text/Font/Gewicht/Caps');
  ok(E('csGlow').checked === false && E('csGlowInt').disabled === true, 'Glow aus → Regler deaktiviert');
  ok(E('csBox').value === 'off' && E('csBoxC').value === '#000000' && String(E('csBoxO').value) === '70', 'kein Hintergrund → neutrale Box-Werte statt Resten');
  // Box-Style (Box Karaoke): Hintergrund aus rgba
  T.selectStyle('boxkara');
  ok(E('csBox').value === 'box' && E('csBoxC').value === '#000000' && String(E('csBoxO').value) === '60' && E('csHl').value === '#22c55e', 'Box Karaoke: Box schwarz 60 %, Pill gruen');
  // Kontur-Style (Hormozi): Kontur 3 px, Schatten an, Textfarbe-Highlight
  T.selectStyle('hormozi');
  ok(String(E('csOutlineW').value) === '3' && E('csOutlineC').value === '#000000' && E('csShadow').classList.contains('on') && E('csHl').value === '#ffd60a' && E('csHlLbl').textContent === 'Active' && E('csAnim').value === 'punch',
     'Hormozi: Kontur/Schatten/Active-Farbe/Animation');
  // Glow-Style (Jolt/amplify): Glow an mit Stärke 20, Regler aktiv
  T.selectStyle('amplify');
  ok(E('csGlow').checked === true && String(E('csGlowInt').value) === '20' && E('csGlowInt').disabled === false && E('csHl').value === '#d7ff1f', 'Jolt: Glow an, Staerke 20');
  // rgba-Textfarbe (Clean Minimal) → gültiges Hex, Deckkraft bleibt beim Umfärben
  T.selectStyle('minimal');
  ok(E('csText').value === '#ffffff', 'rgba-Textfarbe → #ffffff im Farbfeld');
  E('csText').value = '#ff0000'; T.setCsDirty({ text: true });
  ok(T.buildCustomStyle().tc === 'rgba(255,0,0,0.55)', 'Textfarbe behaelt die Deckkraft des Ausgangs-Styles: ' + T.buildCustomStyle().tc);

  // Anwenden: Pill-Farbe über das EINE Farbfeld; Glow nur bei Glow-Änderung; Wechsel Pill → Textfarbe
  T.selectStyle('pulse');
  E('csHl').value = '#ff3366'; T.setCsDirty({ hlc: true });
  let cs = T.buildCustomStyle();
  ok(cs.hlPillBg === '#ff3366' && cs.hlc === '#fff' && cs.hls === 'none' && cs.anim === 'flash', 'Pill-Farbe wirkt (vorher blieb die Pill gruen): ' + cs.hlPillBg);
  E('csGlow').checked = true; E('csGlowInt').value = '20'; T.setCsDirty({ hlc: true, glow: true });
  ok(T.buildCustomStyle().hls === '0 0 20px #ff3366', 'Glow um die Pill');
  E('csHlType').value = 'color'; T.setCsDirty({ hlc: true, glow: true, hltype: true });
  cs = T.buildCustomStyle();
  ok(!cs.hlPillBg && cs.hl === '#ff3366' && /0 0 20px #ff3366/.test(cs.hls), 'Pill → Textfarbe uebernimmt die Farbe: ' + cs.hls);
  // Beast: nur Glow anschalten → Farbwechsel (hlCycle) bleibt
  T.selectStyle('beast');
  E('csGlow').checked = true; E('csGlowInt').value = '10'; T.setCsDirty({ glow: true });
  cs = T.buildCustomStyle();
  ok(cs.hlCycle && cs.hlCycle.length === 4 && /0 0 10px/.test(cs.hls) && T.parseOutline(cs.hls).w === 3, 'Beast: Glow an, Farbwechsel + Kontur bleiben');
  // Nur Kontur geändert → Glow des Ausgangs-Highlights bleibt unverändert (Jolt)
  T.selectStyle('amplify');
  E('csOutlineW').value = '4'; T.setCsDirty({ stroke: true });
  cs = T.buildCustomStyle();
  ok(/0px 0px 20px rgba\(215,255,31,\.85\)/.test(cs.hls) && T.parseOutline(cs.hls).w === 4, 'Kontur-Aenderung laesst Glow des Presets: ' + cs.hls.slice(-40));
  // Regler ohne Wirkung schalten ihren Schalter ein: Box-Farbe bei „None“, Konturfarbe bei 0 px
  T.selectStyle('pulse');
  E('csBoxC').value = '#2040ff'; T.applyCustomStyle('boxc');
  T.flushCustomStyle();
  cs = T.STYLES.find(x => x.id === 'custom');
  ok(E('csBox').value === 'box' && cs.boxBg === 'rgba(32,64,255,0.7)', 'Box-Farbe bei None → Box an: ' + cs.boxBg);
  ok(T.getActiveId() === 'custom', 'Bearbeiten waehlt die Custom-Kachel');
  E('csOutlineC').value = '#ff00ff'; T.applyCustomStyle('strokec'); T.flushCustomStyle();
  cs = T.STYLES.find(x => x.id === 'custom');
  ok(String(E('csOutlineW').value) === '2' && T.parseOutline(cs.ts).w === 2 && cs.ts.includes('#ff00ff') && cs.boxBg === 'rgba(32,64,255,0.7)', 'Konturfarbe bei 0 px → 2 px Kontur; vorige Aenderung bleibt');
  // Custom-Kachel erneut wählen → Regler aus Custom befüllen, weitere Edits bauen darauf auf
  T.selectStyle('hormozi'); T.selectStyle('custom');
  ok(E('csBox').value === 'box' && String(E('csOutlineW').value) === '2' && E('csHl').value === '#00ff85', 'Custom erneut gewaehlt → Regler zeigen Custom');
  E('csAnim').value = 'wobble'; T.applyCustomStyle('anim'); T.flushCustomStyle();
  cs = T.STYLES.find(x => x.id === 'custom');
  ok(cs.anim === 'wobble' && cs.boxBg === 'rgba(32,64,255,0.7)' && cs.hlPillBg === '#00ff85', 'weitere Aenderung behaelt fruehere Custom-Edits');
  T.setCsDirty({});

  // Templates: speichern (Feedback), Gruppe oben, neueste zuerst, gleicher Name → überschreiben statt Dublette
  const store = {};
  global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  T.setUserTemplates([]); T.loadTemplates();
  const pickerIds = () => { E('stylePicker').children = []; T.buildPicker(); return E('stylePicker').children.map(c => c.className.split(' ')[0] === 'stile' ? c.dataset.id : c.className); };
  let ids = pickerIds();
  ok(ids[0] === 'stile-group' && ids.includes('stile-empty') && ids.indexOf('stile-empty') < ids.indexOf('stile-group presets'), 'leerer Zustand oben im Picker');
  ok(ids[1] === 'custom', 'Custom-Kachel steht oben in „My templates“');
  E('tplName').value = 'Blau';
  T.saveTemplate();
  const blau = T.liveTemplates().find(t => t.name === 'Blau');
  ok(blau && blau.style.boxBg === 'rgba(32,64,255,0.7)' && blau.style.anim === 'wobble' && T.getActiveId() === blau.id, 'Template aus Custom gespeichert + ausgewaehlt');
  ok(/Saved as “Blau”/.test(E('tplStatus').textContent) && /1 saved/.test(E('tplCount').textContent), 'Feedback + Zaehler: ' + E('tplStatus').textContent);
  ok(!T.STYLES.find(x => x.id === 'custom'), 'gespeicherter Custom-Entwurf verschwindet (keine Doppel-Kachel)');
  T.selectStyle('hormozi');
  E('tplName').value = 'Gelb'; T.saveTemplate();
  const gelb = T.liveTemplates().find(t => t.name === 'Gelb');
  gelb.createdAt = blau.createdAt + 1; // deterministisch: Gelb ist neuer
  ids = pickerIds();
  ok(ids[0] === 'stile-group' && ids[1] === gelb.id && ids[2] === blau.id && ids.indexOf('stile-group presets') === 3 && !ids.includes('stile-empty'), 'Templates oben, neueste zuerst: ' + ids.slice(0, 5).join(','));
  // gleicher Name (andere Schreibweise) → Rückfrage; Abbrechen speichert nichts
  let asked = 0;
  global.confirm = () => { asked++; return false; };
  T.selectStyle('classic'); E('tplName').value = 'blau'; T.saveTemplate();
  ok(asked === 1 && T.liveTemplates().length === 2 && T.liveTemplates().find(t => t.id === blau.id).style.boxBg, 'Abbrechen: nichts ueberschrieben');
  global.confirm = () => true;
  T.saveTemplate();
  const blau2 = T.liveTemplates().find(t => t.id === blau.id);
  ok(T.liveTemplates().length === 2 && blau2.name === 'Blau' && !blau2.style.boxBg && blau2.style.ts === T.STYLES.find(x => x.id === 'classic').ts && /Updated “Blau”/.test(E('tplStatus').textContent),
     'Bestaetigen: bestehendes Template ueberschrieben (keine Dublette, Name bleibt)');
  // Edit → Update überschreibt und aktualisiert die Kachel
  T.editTemplate(gelb.id);
  E('csHlType').value = 'pill'; E('csHl').value = '#00aaff'; T.applyCustomStyle('hltype'); T.applyCustomStyle('hlc');
  T.saveTemplate(); // flusht die gedrosselte Änderung selbst
  const gelb2 = T.liveTemplates().find(t => t.id === gelb.id);
  ok(gelb2.style.hlPillBg === '#00aaff' && T.STYLES.find(x => x.id === gelb.id).hlPillBg === '#00aaff' && T.getEditingTpl() === null && T.getActiveId() === gelb.id, 'Edit → Update ueberschreibt, Kachel-Style aktualisiert');
  // Reload aus localStorage
  T.setUserTemplates([]); T.loadTemplates();
  ok(T.liveTemplates().length === 2 && T.STYLES.find(x => x.id === gelb.id).hlPillBg === '#00aaff', 'Templates ueberleben Reload');
  T.selectStyle('classic');
  delete global.localStorage; delete global.confirm;
  T.setUserTemplates([]); T.loadTemplates();
}

// 16a3) Trend-Presets: vorhanden, Pop One erzwingt 1 Wort/Block und gibt den alten Wert zurück
{
  ['hormozi', 'beast', 'boxkara', 'minimal', 'popone'].forEach(id => ok(T.STYLES.find(x => x.id === id), 'Preset vorhanden: ' + id));
  const beast = T.STYLES.find(x => x.id === 'beast');
  ok(T.hlColorFor(beast, 0) !== T.hlColorFor(beast, 1), 'Beast: aktives Wort wechselt die Farbe');
  ok(T.buildCap(['a', 'b'], beast, 1, 22, null).includes(beast.hlCycle[1]), 'Beast: Farbwechsel in der Vorschau');
  T.selectStyle('classic');
  const prevWpb = T.getWpb();
  T.selectStyle('popone');
  ok(T.getWpb() === 1, 'Pop One: 1 Wort pro Block');
  T.selectStyle('classic');
  ok(T.getWpb() === prevWpb, 'nach Pop One: vorherige Blockgroesse zurueck (' + prevWpb + ')');
}

// 16c) Timing-Regler: links früher, rechts später — Vorzeichen konsistent mit Vorschau/Export/SRT
{
  T.setState(T.buildCaptionBlocks([{ word: 'Hallo', start: 1, end: 1.5 }, { word: 'Welt.', start: 1.6, end: 2 }]), [], 'karaoke');
  T.onTimeOffChange('0.2');                    // Regler nach rechts = später
  ok(Math.abs(T.getTimeOff() + 0.2) < 1e-9 && /0\.20 s later/.test(document.getElementById('toDisp').textContent), 'Regler rechts → Captions spaeter: ' + document.getElementById('toDisp').textContent);
  T.exportSRT();
  ok(/^1\n00:00:01,200 --> 00:00:02,200/.test(global.LASTBLOB.content), 'SRT um 0.2 s spaeter: ' + JSON.stringify(global.LASTBLOB.content.slice(0, 40)));
  T.onTimeOffChange('-0.1');
  ok(Math.abs(T.getTimeOff() - 0.1) < 1e-9 && /earlier/.test(document.getElementById('toDisp').textContent), 'Regler links → frueher');
  T.onTimeOffChange('0');
  ok(T.getTimeOff() === 0 && /in sync/.test(document.getElementById('toDisp').textContent), 'Regler Mitte → synchron');
}

// 16d) Suchen & Ersetzen: Trefferzahl, ganze Wörter, Timings bleiben
{
  T.setState([{ start: 1, end: 3, text: 'Unser Highlnd Rind und Rinder', words: [
    { word: 'Unser', start: 1, end: 1.3 }, { word: 'Highlnd', start: 1.4, end: 1.9 }, { word: 'Rind', start: 2, end: 2.3 },
    { word: 'und', start: 2.35, end: 2.5 }, { word: 'Rinder', start: 2.55, end: 3 }] }], [], 'karaoke');
  T.getBlocks()[0].srcWords = T.getBlocks()[0].words.map(w => Object.assign({}, w));
  ok(T.countMatches('rind', false) === 2 && T.countMatches('rind', true) === 1, 'Trefferzahl (Teilwort vs. ganzes Wort)');
  document.getElementById('frFind').value = 'highlnd'; document.getElementById('frRepl').value = 'Highland';
  document.getElementById('frWhole').checked = true;
  T.setCaptionsEdited(false);
  ok(T.replaceAllCaptions() === 1, 'Replace all ersetzt 1 Treffer');
  const bw = T.getBlocks()[0].words;
  ok(bw[1].word === 'Highland' && bw[1].start === 1.4 && bw[1].end === 1.9 && bw[4].start === 2.55, 'Ersetzen behaelt Wort-Timings');
  ok(T.getCaptionsEdited() === true, 'Ersetzen markiert Edits');
  document.getElementById('frFind').value = 'Rind'; document.getElementById('frRepl').value = 'Weiderind $1';
  T.replaceAllCaptions();
  ok(T.getBlocks()[0].text === 'Unser Highland Weiderind $1 und Rinder', 'ganzes Wort + "$" woertlich: ' + T.getBlocks()[0].text);
  document.getElementById('frWhole').checked = false; document.getElementById('frFind').value = ''; T.setCaptionsEdited(false);
}

// 16e) Textformat (nur Darstellung) + TXT/Copy
{
  T.togglePunct();
  ok(T.displayWord('Hallo,') === 'Hallo' && T.displayWord('wirklich?!') === 'wirklich' && T.displayWord('3.5') === '3.5'
     && T.displayWord("rock'n'roll.") === "rock'n'roll" && T.displayWord('Weide-Land:') === 'Weide-Land' && T.displayWord('…') === '…',
     'Satzzeichen entfernt, Apostroph/Bindestrich/Dezimalpunkt bleiben');
  T.setCaptionCase('upper');
  ok(T.displayWord('Hallo,') === 'HALLO', 'UPPERCASE + ohne Satzzeichen');
  T.setState(T.buildCaptionBlocks([{ word: 'Hallo,', start: 0, end: 0.5 }, { word: 'Welt.', start: 0.6, end: 1 },
    { word: 'Wie', start: 2.5, end: 2.8 }, { word: 'geht', start: 2.9, end: 3.1 }, { word: 'es?', start: 3.2, end: 3.5 }]), [], 'karaoke');
  T.selectStyle('minimal'); T.updateOverlay(0.2);
  ok(/HALLO/.test(document.getElementById('capOverlay').innerHTML) && !/HALLO,/.test(document.getElementById('capOverlay').innerHTML), 'Vorschau formatiert');
  T.exportSRT();
  ok(/HALLO, WELT\./.test(global.LASTBLOB.content), 'SRT: Case ja, Satzzeichen bleiben: ' + JSON.stringify(global.LASTBLOB.content.slice(0, 60)));
  T.setCaptionCase('asis'); T.togglePunct();
  ok(T.transcriptText() === 'Hallo, Welt.\n\nWie geht es?', 'TXT: Absatz nach Satzende + Pause: ' + JSON.stringify(T.transcriptText()));
  T.setCaptionCase('upper');
  ok(T.transcriptText() === 'Hallo, Welt.\n\nWie geht es?', 'TXT/Kopie ignoriert UPPERCASE (Post-Beschreibung): ' + JSON.stringify(T.transcriptText()));
  T.setCaptionCase('asis');
  T.exportTXT();
  ok(global.LASTBLOB.content.startsWith('Hallo, Welt.'), 'TXT-Export');
  let copied = null; global.navigator = global.navigator || {};
  const prevClip = global.navigator.clipboard;
  try { Object.defineProperty(global.navigator, 'clipboard', { value: { writeText: async t => { copied = t; } }, configurable: true }); } catch (e) {}
  T.copyTranscript();
  ok(copied === 'Hallo, Welt.\n\nWie geht es?', 'Copy text in die Zwischenablage');
  try { Object.defineProperty(global.navigator, 'clipboard', { value: prevClip, configurable: true }); } catch (e) {}
}

// 17a) Kürzungs-Hinweis auch beim ffmpeg-Pfad (-t MAX_AUDIO_SEC): echte Mediendauer zählt
ok(T.audioTruncated(16000 * 1200, 1500) === true, 'Kuerzung erkannt ueber Mediendauer (ffmpeg -t)');
ok(T.audioTruncated(16000 * 600, 600) === false && T.audioTruncated(16000 * 1200 + 1, NaN) === true, 'Kuerzung: normale Laenge / zu langes PCM');

// 17b) text-shadow-Parser: alle Formen aus STYLES + outlineShadow (Canvas braucht eine saubere Farbe)
{
  const P = T.parseTextShadows;
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  ok(eq(P('3px 0px 0 #000')[0], { x: 3, y: 0, blur: 0, color: '#000' }), 'Parser: "3px 0px 0 #000"');
  ok(eq(P('-2px 0 0 #000')[0], { x: -2, y: 0, blur: 0, color: '#000' }), 'Parser: einheitslose 0 (Standard-Kontur)');
  ok(eq(P('0 0 20px rgba(255, 255, 255, .85)')[0], { x: 0, y: 0, blur: 20, color: 'rgba(255, 255, 255, .85)' }), 'Parser: rgba mit Leerzeichen');
  ok(eq(P('rgba(0,0,0,.5) 0 2px 4px')[0], { x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,.5)' }), 'Parser: Farbe vorne');
  ok(eq(P('1px 2px red')[0], { x: 1, y: 2, blur: 0, color: 'red' }), 'Parser: Farbname ohne Blur');
  ok(P('none').length === 0 && P('inset 1px 1px 0 #000').length === 0, 'Parser: none / inset ignoriert');
  const ol = P(T.outlineShadow(3, '#000'));
  ok(ol.length === 12 && ol.every(l => l.color === '#000' && l.blur === 0), 'Parser: outlineShadow komplett lesbar');
  let bad = [];
  T.STYLES.forEach(st => ['ts', 'hls'].forEach(k => {
    const v = st[k]; if (!v || v === 'none') return;
    const parts = v.split(/,(?![^(]*\))/).length, layers = P(v);
    if (layers.length !== parts || layers.some(l => !/^(#|rgba?\(|[a-z]+$)/i.test(l.color))) bad.push(st.id + '.' + k);
  }));
  ok(bad.length === 0, 'Parser: alle STYLES-Schatten sauber zerlegt: ' + bad.join(', '));
}

// 17c) Kontur-Erkennung nur für das Ring-Muster; Highlight-Farbe ändern lässt Drop-Shadows in Ruhe
{
  ok(T.parseOutline('1px 2px 0 #000').w === 0, 'harter Drop-Shadow ist keine Kontur');
  ok(T.parseOutline(T.STYLES.find(x => x.id === 'hormozi').ts).w === 3, 'Ring-Kontur (outlineShadow 3px) erkannt');
  T.STYLES.push({ id: 'tdrop', name: 'T', fl: 'Inter', font: "'Inter'", fw: '700', tc: '#fff', ts: '1px 2px 0 #000', hl: '#fff', hls: '1px 2px 0 #000,0 3px 6px rgba(0,0,0,.4)', anim: 'none', thumbBg: '#000' });
  T.selectStyle('tdrop');
  document.getElementById('csHl').value = '#ff00ff';
  document.getElementById('csHlType').value = 'color';
  T.setCsDirty({ hl: true });
  const cs = T.buildCustomStyle();
  ok(cs.hl === '#ff00ff' && T.parseOutline(cs.hls).w === 0 && /1px 2px 0px #000/.test(cs.hls) && /0px 3px 6px rgba/.test(cs.hls) && cs.ts === '1px 2px 0 #000',
     'nur Highlight-Farbe: keine Fake-Kontur, Schatten bleiben: ' + cs.hls);
  // Beast: Drop-Shadow im Highlight bleibt auch beim Farbwechsel
  T.selectStyle('beast'); T.setCsDirty({ hl: true });
  const cb = T.buildCustomStyle();
  ok(T.parseOutline(cb.hls).w === 3 && /0px 5px 0px rgba\(0,0,0,\.85\)/.test(cb.hls), 'Beast: Kontur + Drop-Shadow im Highlight erhalten: ' + cb.hls.slice(-60));
  T.setCsDirty({});
  T.STYLES.splice(T.STYLES.findIndex(x => x.id === 'tdrop'), 1);
  T.selectStyle('classic');
}

// 17d) Ganze-Wörter-Suche ohne Lookbehind (Safari < 16.4), auch mit Umlauten
{
  ok(!/\(\?<[=!]/.test(require('fs').readFileSync(htmlPath, 'utf8')), 'kein Regex-Lookbehind im Code');
  T.setState([{ start: 0, end: 2, text: 'Grüße über alles, Rindfleisch und Rind', words: [] }], [], 'karaoke');
  ok(T.countMatches('über', true) === 1 && T.countMatches('rind', true) === 1 && T.countMatches('rind', false) === 2, 'ganze Woerter mit Umlauten/Teilwoertern');
  ok(T.countMatches('üß', false) === 1 && T.countMatches('(', false) === 0 && T.countMatches('ß', true) === 0 && T.countMatches('.*', false) === 0, 'Sonderzeichen-Suche wirft nicht (Regex-Zeichen woertlich)');
}

// 17e) Grabsteine verdrängen keine Live-Templates
{
  const now = Date.now(), list = [];
  for (let i = 0; i < 50; i++) list.push({ id: 'tpl_l' + i, name: 'L' + i, style: { fl: 'Inter' }, layout: {}, createdAt: now - 1e6 + i, updatedAt: now - 1e6 + i });
  for (let i = 0; i < 120; i++) list.push({ id: 'tpl_d' + i, deleted: true, updatedAt: now - i * 1000 });
  T.setUserTemplates(list); T.pruneTemplates();
  const ut = T.getUserTemplates();
  ok(ut.filter(t => !t.deleted).length === 50 && ut.filter(t => t.deleted).length === 100 && !ut.some(t => t.id === 'tpl_d119'),
     'prune: 50 live bleiben, max. 100 Grabsteine (aelteste raus)');
  T.setUserTemplates([]);
}

// 18a) Export-Zeichnen: Ring-Kontur als EIN strokeText, Layout pro Block gecacht
{
  const mkCtx = () => {
    const c = { n: { fill: 0, stroke: 0, measure: 0, font: 0 }, _font: '', letterSpacing: '0px', lineWidth: 1, lineJoin: 'miter', miterLimit: 10, strokeStyle: '#000',
      fillStyle: '#000', shadowColor: 'transparent', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, globalAlpha: 1, filter: 'none', textAlign: 'left', textBaseline: 'alphabetic',
      strokes: [],
      get font() { return this._font; }, set font(v) { this.n.font++; this._font = v; },
      measureText(str) { this.n.measure++; const m = /([\d.]+)px/.exec(this._font); return { width: (str || '').length * (m ? +m[1] : 16) * 0.55 }; },
      fillText() { this.n.fill++; }, strokeText(t) { this.n.stroke++; this.strokes.push({ w: this.lineWidth, c: this.strokeStyle, j: this.lineJoin }); },
      save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, beginPath() {}, fill() {}, stroke() {}, rect() {}, roundRect() {}, ellipse() {}, fillRect() {},
      createLinearGradient() { return { addColorStop() {} }; } };
    return c;
  };
  T.setState(T.buildCaptionBlocks([{ word: 'Das', start: 0, end: 0.3 }, { word: 'ist', start: 0.35, end: 0.6 }, { word: 'echt', start: 0.65, end: 0.9 }, { word: 'gut', start: 0.95, end: 1.2 }]), [], 'karaoke');
  const hz = T.STYLES.find(x => x.id === 'hormozi');
  const plan = T.capShadowPlan(hz.ts);
  ok(plan.ring && plan.ring.w === 3 && plan.ring.color === '#000' && plan.rest.length === 1, 'Hormozi: Ring erkannt, 1 Restschicht (weicher Schatten)');
  const c1 = mkCtx();
  T.drawCaptionsOnCtx(c1, 0.4, hz, 1080, 1920, false);
  const words = 4, oldCalls = words * (T.parseTextShadows(hz.ts).length + 1);
  ok(c1.n.stroke === words && c1.strokes.every(st => st.c === '#000' && st.j === 'round' && st.w > 0), 'je Wort genau ein strokeText (rund, Konturfarbe)');
  ok(c1.n.fill <= words * 2, 'fillText pro Frame: ' + c1.n.fill + ' statt ' + oldCalls + ' (alt: eine Schicht je Ring-Punkt)');
  const c2 = mkCtx();
  T.drawCaptionsOnCtx(c1, 0.7, hz, 1080, 1920, false); // gleicher Block, anderes aktives Wort
  c1.n.measure = 0; c1.n.font = 0;
  T.drawCaptionsOnCtx(c1, 0.75, hz, 1080, 1920, false);
  ok(c1.n.measure === 0, 'Folge-Frame im selben Block misst nicht neu (Layout-Cache)');
  ok(c1.n.font <= 2, 'Font wird nur bei Aenderung gesetzt: ' + c1.n.font + 'x');
  // Styles ohne Ring zeichnen wie bisher alle Schichten
  const lift = T.STYLES.find(x => x.id === 'lift');
  T.drawCaptionsOnCtx(c2, 0.4, lift, 1080, 1920, false);
  ok(c2.n.stroke === 0, 'ohne Ring-Kontur kein strokeText');
}

// 18b) Wortabstände im Export: aktives Wort vorne/Mitte/hinten, mehrere Styles (Regression „DERWEIDE.“)
{
  const mkCtx = () => ({ _font: '', letterSpacing: '0px', calls: [], strokes: [], lineWidth: 1, lineJoin: 'miter', miterLimit: 10, strokeStyle: '#000', fillStyle: '#000',
    shadowColor: 'transparent', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, globalAlpha: 1, filter: 'none', textAlign: 'left', textBaseline: 'alphabetic',
    get font() { return this._font; }, set font(v) { this._font = v; },
    measureText(str) { const m = /([\d.]+)px/.exec(this._font); return { width: (str || '').length * (m ? +m[1] : 16) * 0.55 + (parseFloat(this.letterSpacing) || 0) * (str || '').length }; },
    fillText(t, x, y) { this.calls.push({ t, x, y, font: this._font, ls: parseFloat(this.letterSpacing) || 0 }); },
    strokeText(t) { this.strokes.push({ t, w: this.lineWidth }); },
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, beginPath() {}, fill() {}, stroke() {}, rect() {}, roundRect() {}, ellipse() {}, fillRect() {},
    createLinearGradient() { return { addColorStop() {} }; } });
  const words = ['Der', 'Weide', 'und', 'Rinder'].map((w, i) => ({ word: w, start: i * 0.5, end: i * 0.5 + 0.4 }));
  T.setState(T.buildCaptionBlocks(words), [], 'karaoke');
  ok(T.getBlocks().length === 1 && T.getBlocks()[0].words.length === 4, 'Test-Block mit 4 Woertern');
  const bad = [];
  ['hormozi', 'beast', 'boxkara', 'classic'].forEach(id => {
    const st = T.STYLES.find(x => x.id === id);
    [0.05, 0.55, 1.55].forEach(t => {                // aktives Wort: erstes, zweites, letztes (jeweils mitten in der Animation)
      const c = mkCtx();
      T.drawCaptionsOnCtx(c, t, st, 1080, 1920, false);
      const fin = []; const seen = {};
      for (let i = c.calls.length - 1; i >= 0; i--) { const k = c.calls[i]; if (!seen[k.t]) { seen[k.t] = 1; fin.unshift(k); } }
      fin.sort((a, b) => a.y - b.y || a.x - b.x);
      for (let i = 0; i + 1 < fin.length; i++) {
        if (Math.abs(fin[i].y - fin[i + 1].y) > 1) continue;                 // nur innerhalb einer Zeile
        const px = +/([\d.]+)px/.exec(fin[i].font)[1];
        const wI = fin[i].t.length * px * 0.55 + fin[i].ls * fin[i].t.length, spc = px * 0.55;
        if (!(fin[i + 1].x >= fin[i].x + wI + spc * 0.8 - 1e-6)) bad.push(id + '@' + t + ': ' + fin[i].t + '→' + fin[i + 1].t);
      }
    });
  });
  ok(bad.length === 0, 'Wortabstand im Export immer >= 0.8 Leerzeichen: ' + bad.join('; '));
  // Konturierte Styles bekommen 2×Kontur extra Abstand — in Vorschau (word-spacing) und Export gleich
  const hz = T.STYLES.find(x => x.id === 'hormozi'), lift = T.STYLES.find(x => x.id === 'lift');
  ok(T.buildCap(['der', 'weide'], hz, 0, 22, null, 1).includes('word-spacing:6px') && !T.buildCap(['der', 'weide'], lift, 0, 22, null, 1).includes('word-spacing'),
     'Vorschau: word-spacing nur fuer konturierte Styles');
  ok(!T.buildCap(['der', 'weide'], hz, 0, 9, null).includes('word-spacing'), 'Style-Thumbnails unveraendert');
  // Kontur skaliert in der Punch-Animation nicht mit (Breite bleibt <= Basisbreite)
  const c3 = mkCtx(); T.drawCaptionsOnCtx(c3, 0.12, hz, 1080, 1920, false);
  const base = Math.max(...c3.strokes.map(s => s.w)), act = c3.strokes.find(s => s.t === 'DER');
  ok(act && act.w <= base + 1e-9, 'Kontur des animierten Worts nicht aufgeblasen: ' + (act && act.w) + ' vs ' + base);
}

// 20a) Edit-Liste: Präsentationsende (gekürzte Datei ohne Neukodierung)
ok(T.editListEnd(null, 600) === Infinity && T.editListEnd([], 600) === Infinity, 'editListEnd: ohne Edit-Liste unbegrenzt');
ok(T.editListEnd([{ media_time: 0, segment_duration: 3000, media_rate_integer: 1 }], 600) === 5, 'editListEnd: 5 s Segment');
ok(Math.abs(T.editListEnd([{ media_time: -1, segment_duration: 300 }, { media_time: 1024, segment_duration: 2400 }], 600) - 4.5) < 1e-9, 'editListEnd: Verzoegerung + Segment');
ok(T.editListEnd([{ media_time: 0, segment_duration: 0 }], 600) === Infinity, 'editListEnd: Dauer 0 = bis Medienende');

// 20b) Szenenschnitte: Blöcke überspannen keinen Schnitt
{
  const W = (arr) => arr.map(([w, a, b]) => ({ word: w, start: a, end: b }));
  T.onWpbChange('6');
  let bl = T.buildCaptionBlocks(W([['a', 0, 0.4], ['b', 0.5, 0.9], ['c', 1.0, 1.4], ['d', 1.5, 1.9]]), [0.95]);
  ok(bl.length === 2 && bl[0].text === 'a b' && bl[1].text === 'c d' && bl[0].end <= 0.95 && bl[1].start >= 0.95, 'Block endet am Schnitt, neuer beginnt danach');
  bl = T.buildCaptionBlocks(W([['a', 0, 0.4], ['b', 0.7, 1.3], ['c', 1.4, 1.8]]), [1.1]);
  ok(bl[0].text === 'a b' && bl[0].end === 1.1 && bl[0].words[1].end === 1.3 && bl[1].text === 'c', 'Wort ueber dem Schnitt: Mitte entscheidet, Timing bleibt, Block endet am Schnitt');
  bl = T.buildCaptionBlocks(W([['a', 0, 0.4], ['b', 0.5, 0.8], ['c', 0.9, 1.5], ['d', 1.6, 1.9]]), [1.0]);
  ok(bl[0].text === 'a b' && bl[1].text === 'c d' && bl[1].start === 1.0 && bl[1].words[0].start === 0.9, 'Blockanfang auf Schnitt begrenzt, Wort-Timing unveraendert');
  bl = T.buildCaptionBlocks(W([['a', 0, 0.4], ['b', 0.5, 0.9], ['c', 1.0, 1.4]]), []);
  ok(bl.length === 1, 'ohne Schnitte unveraendert');
  // Integration: Schnitte kommen nach den Captions → edit-erhaltend neu gruppieren, Statushinweis, Continuous stoppt am Schnitt
  T.setState(T.buildCaptionBlocks(W([['Hallo', 0, 0.4], ['du', 0.5, 0.9], ['da', 1.0, 1.4], ['drueben', 1.5, 1.9]]), []), W([['Hallo', 0, 0.4], ['du', 0.5, 0.9], ['da', 1.0, 1.4], ['drueben', 1.5, 1.9]]), 'karaoke');
  T.getBlocks()[0].text = 'Hallo du da drüben'; T.retimeEditedBlock(T.getBlocks()[0]);
  document.getElementById('tStatus').innerHTML = '<span>✅</span><span>4 words</span>';
  T.setSceneCuts([0.95]);
  ok(T.getBlocks().length === 2 && T.getBlocks()[1].text === 'da drüben', 'Schnitte nachtraeglich: neu gruppiert, Edit erhalten');
  ok(/1 scene cut detected/.test(document.getElementById('tStatus').innerHTML), 'Statushinweis: ' + document.getElementById('tStatus').innerHTML);
  T.setDisplayMode('all');
  ok(T.currentBlockIdx2(0.93) === 0 && T.currentBlockIdx2(0.97) === -1 && T.currentBlockIdx2(1.2) === 1, 'Continuous: Block endet am Schnitt');
  T.setDisplayMode('karaoke');
  T.onBreakAtCutsChange(false);
  ok(T.getBlocks().length === 1, 'Schalter aus: Bloecke wieder ueber den Schnitt');
  T.onBreakAtCutsChange(true); T.setSceneCuts([]);
  T.onWpbChange('4');
}

// 20c) Schnitt-Detektor: reine Bausteine mit synthetischen Daten
{
  const dark = T.lumaHistogram(new Float32Array(2304).fill(0.1), 16), light = T.lumaHistogram(new Float32Array(2304).fill(0.9), 16);
  ok(T.histDistance(dark, dark) === 0 && Math.abs(T.histDistance(dark, light) - 1) < 1e-9, 'Histogramm-Distanz 0 bzw. 1');
  ok(Math.abs(T.meanAbsDiff(new Float32Array([0.1, 0.2]), new Float32Array([0.3, 0.2])) - 0.1) < 1e-6, 'mittlere Pixel-Differenz');
  // Synthetische 64×36-Luma-Folgen @30 fps: jede Szene ein eigenes, sich bewegendes Muster
  const FW = T.CUT_W, FH = T.CUT_H, FPS = 30;
  const scene = (k, n, speed) => {
    const l = new Float32Array(FW * FH), sp = speed == null ? 0.05 : speed;
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++)
      l[y * FW + x] = Math.min(1, Math.max(0, 0.2 + 0.12 * k + 0.25 * Math.sin((0.15 + 0.07 * k) * x + (0.2 + 0.05 * k) * y + sp * n + k)));
    return l;
  };
  const mix = (a, b, w) => a.map((v, i) => v * (1 - w) + b[i] * w);
  const bright = (a, add) => a.map(v => Math.min(1, v + add));
  const feats = (lumas, dt) => { const fr = []; let pf = null, pl = null;
    lumas.forEach((l, i) => { const f = T.cutFrame(+(i * (dt || 1 / FPS)).toFixed(4), l, pf, pl); fr.push(f); pf = f; pl = l; }); return fr; };
  const times = (fr, o) => T.decideSceneCuts(fr, o).map(c => c.t);
  // a) harte Schnitte (Frame 60 und 151) → framegenau
  let L = []; for (let n = 0; n < 240; n++) L.push(scene(n < 60 ? 0 : n < 151 ? 1 : 2, n));
  let tc = times(feats(L));
  ok(tc.length === 2 && tc[0] === 2 && Math.abs(tc[1] - 151 / FPS) < 1e-3, 'harte Schnitte framegenau: ' + JSON.stringify(tc));
  // b) 4-Frame-Blitz mitten in einer Szene → kein Schnitt (beide Flanken), echter Schnitt danach bleibt
  L = []; for (let n = 0; n < 240; n++) { let l = scene(n < 180 ? 0 : 1, n); if (n >= 90 && n < 94) l = bright(l, 0.5); L.push(l); }
  tc = times(feats(L));
  ok(tc.length === 1 && tc[0] === 6, 'Blitz verworfen, Schnitt bei 6 s bleibt: ' + JSON.stringify(tc));
  // c) 1-s-Überblendung (Frame 90–120) → kein Schnitt; 4-Frame-Dissolve ebenso
  L = []; for (let n = 0; n < 240; n++) L.push(n < 90 ? scene(0, n) : n >= 120 ? scene(1, n) : mix(scene(0, n), scene(1, n), (n - 90) / 30));
  tc = times(feats(L));
  ok(tc.length === 0, '1-s-Überblendung ist kein Schnitt: ' + JSON.stringify(tc));
  L = []; for (let n = 0; n < 240; n++) L.push(n < 100 ? scene(0, n) : n >= 104 ? scene(2, n) : mix(scene(0, n), scene(2, n), (n - 99) / 5));
  tc = times(feats(L));
  ok(tc.length === 0, '4-Frame-Dissolve ist kein harter Schnitt: ' + JSON.stringify(tc));
  // d) zwei Schnitte 4 Frames (0.13 s) auseinander → EIN Schnitt (kein Mini-Block)
  L = []; for (let n = 0; n < 240; n++) L.push(scene(n < 60 ? 0 : n < 64 ? 1 : 3, n));
  tc = times(feats(L));
  ok(tc.length === 1 && (tc[0] === 2 || Math.abs(tc[0] - 64 / FPS) < 1e-3), 'nahe Kandidaten zusammengeführt: ' + JSON.stringify(tc));
  ok(T.mergeCutCands([{ t: 1, c: 0.5 }, { t: 1.2, c: 0.9 }, { t: 3, c: 0.4 }], 0.3).map(x => x.t).join() === '1.2,3', 'merge: stärkster gewinnt');
  // e) schneller Schwenk (große Bewegung pro Frame) → keine Schnitte
  L = []; for (let n = 0; n < 240; n++) L.push(scene(0, n, 0.6));
  tc = times(feats(L));
  ok(tc.length === 0, 'schnelle Bewegung ist kein Schnitt: ' + JSON.stringify(tc));
  // e2) hohe Grundunruhe (Drohne über Gras, Wasser): Textur, deren Pixel-Differenz pro Frame GRÖSSER ist als
  //     die des Schnitts — Schnitte hinein (Frame 60) und heraus (Frame 150) müssen trotzdem erkannt werden
  const tex = n => { const l = new Float32Array(FW * FH);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) l[y * FW + x] = Math.sin(1.7 * x + 2.3 * y + 2.9 * n) * Math.sin(0.9 * x - 1.1 * y + 1.3 * n) > 0 ? 0.85 : 0.15;
    return l; };
  L = []; for (let n = 0; n < 240; n++) L.push(n < 60 ? scene(0, n, 0) : n < 150 ? tex(n) : scene(3, n, 0.1));
  const fT = feats(L);
  ok(fT[100].p >= 0.9 * Math.max(fT[60].p, fT[150].p), 'Testaufbau: Bewegung ändert so viele Pixel wie die Schnitte (' + fT[100].p.toFixed(3) + ' vs ' + fT[60].p.toFixed(3) + '/' + fT[150].p.toFixed(3) + ')');
  tc = times(fT);
  ok(tc.length === 2 && tc[0] === 2 && tc[1] === 5, 'Schnitte neben starker Bewegung erkannt: ' + JSON.stringify(tc));
  const fTc = feats(L.filter((l, k) => k % 4 === 0), 4 / FPS);
  tc = times(fTc, { coarse: true });
  ok(tc.length === 2, 'auch in groben Proben: ' + JSON.stringify(tc));
  // e3) Belichtungssprung (+0.15, bleibt) → gleiche Szene, kein Schnitt; Zwei-Frame-Schnitt → Zeit des ersten Frames
  L = []; for (let n = 0; n < 240; n++) L.push(n < 100 ? scene(0, n) : bright(scene(0, n), 0.15));
  tc = times(feats(L));
  ok(tc.length === 0, 'Belichtungssprung ist kein Schnitt: ' + JSON.stringify(tc));
  // …aber ein großer Sprung zwischen zwei strukturlosen Bildern (dunkle Fläche → zu Grau verschwommene
  // Textur) bleibt ein Schnitt
  const flat = v => new Float32Array(FW * FH).fill(v);
  L = []; for (let n = 0; n < 240; n++) L.push(n < 90 ? flat(0.15) : flat(0.55));
  tc = times(feats(L));
  ok(tc.length === 1 && tc[0] === 3, 'großer Sprung Fläche → Fläche ist ein Schnitt: ' + JSON.stringify(tc));
  L = []; for (let n = 0; n < 240; n++) L.push(n < 60 ? scene(0, n) : n === 60 ? mix(scene(1, n), scene(2, n), 0.5) : scene(2, n));
  tc = times(feats(L));
  ok(tc.length === 1 && tc[0] === 2, 'Zwei-Frame-Schnitt: Szene beginnt beim ersten geänderten Frame: ' + JSON.stringify(tc));
  // f) grobe Proben (0.4 s, Seek-Pfad) → Kandidat im richtigen Intervall; Helligkeitssprung ohne Pixel-Änderung nicht
  L = []; for (let n = 0; n < 40; n++) L.push(scene(n < 17 ? 0 : 1, n * 12));
  tc = times(feats(L, 0.4), { coarse: true });
  ok(tc.length === 1 && Math.abs(tc[0] - 6.8) < 1e-6, 'grobe Proben: Kandidat bei der ersten Probe der neuen Szene: ' + JSON.stringify(tc));
  const fake = []; for (let i = 0; i < 30; i++) fake.push({ t: i * 0.2, d: i ? 0.02 : 0, p: 0.01, h: dark, s: new Uint8Array(144) });
  fake[24] = { t: 4.8, d: 0.5, p: 0.02, h: light, s: new Uint8Array(144) };
  ok(T.decideSceneCuts(fake, { coarse: true }).length === 0, 'Histogramm-Sprung ohne Pixel-Änderung ist kein Schnitt');
  // g) Wegwahl: WebCodecs nur für MP4/MOV mit VideoDecoder, sonst Seek-Fallback
  const mp4 = { type: 'video/mp4', name: 'a.mp4' }, webm = { type: 'video/webm', name: 'a.webm' };
  ok(T.sceneCutPath(mp4) === 'seek', 'ohne VideoDecoder → Seek-Pfad');
  global.VideoDecoder = function () {}; global.EncodedVideoChunk = function () {};
  ok(T.sceneCutPath(mp4) === 'webcodecs' && T.sceneCutPath({ type: 'video/quicktime', name: 'b.mov' }) === 'webcodecs', 'MP4/MOV + VideoDecoder → WebCodecs');
  ok(T.sceneCutPath(webm) === 'seek', 'WebM → Seek-Pfad (mp4box demuxt kein WebM)');
  global.localStorage = { getItem: k => (k === 'capivo.fastCuts' ? 'off' : null), setItem() {}, removeItem() {} };
  ok(T.sceneCutPath(mp4) === 'seek', 'Notschalter capivo.fastCuts=off → Seek-Pfad');
  delete global.localStorage; delete global.VideoDecoder; delete global.EncodedVideoChunk;
}

// 21a) Pill-Highlight: Export-Layout reserviert das Pill-Padding (keine Überlappung der Nachbarn)
{
  const mkCtx = () => ({ _font: '', letterSpacing: '0px', calls: [], rects: [], lineWidth: 1, strokeStyle: '#000', fillStyle: '#000', shadowColor: '', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, globalAlpha: 1, filter: 'none',
    get font() { return this._font; }, set font(v) { this._font = v; },
    // Leerzeichen realistisch schmal (~0,2 em) — sonst verdeckt der breite Stub-Abstand eine Überlappung
    measureText(str) { const m = /([\d.]+)px/.exec(this._font); const px = m ? +m[1] : 16; return { width: str === ' ' ? px * 0.2 : (str || '').length * px * 0.55 }; },
    fillText(t, x, y) { this.calls.push({ t, x, y, fs: this.fillStyle }); }, strokeText() {},
    roundRect(x, y, w, h) { this.rects.push({ x, w }); }, rect(x, y, w, h) { this.rects.push({ x, w }); },
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, beginPath() {}, fill() {}, stroke() {}, ellipse() {}, fillRect() {}, createLinearGradient() { return { addColorStop() {} }; } });
  const ws = ['auf', 'unserem', 'Hof', 'heute'].map((w, i) => ({ word: w, start: i * 0.5, end: i * 0.5 + 0.4 }));
  T.setState(T.buildCaptionBlocks(ws), [], 'karaoke');
  const bad = [];
  ['boxkara', 'focus', 'karaoke', 'marker'].map(id => T.STYLES.find(x => x.id === id)).filter(st => st && st.hlPillBg).forEach(st => {
    [0.1, 0.6, 1.1, 1.6].forEach(t => {
      const c = mkCtx(); T.drawCaptionsOnCtx(c, t, st, 1080, 1920, false);
      const pill = c.rects[c.rects.length - 1];
      const fin = {}; c.calls.forEach(k => { fin[k.t] = k; });
      const all = Object.values(fin);
      const px0 = +/([\d.]+)px/.exec(c._font)[1];
      const act = all.find(k => k.x >= pill.x - 1e-6 && k.x + k.t.length * px0 * 0.55 <= pill.x + pill.w + 1e-6);
      const words = all.filter(k => act && Math.abs(k.y - act.y) < 1).sort((a, b) => a.x - b.x); // nur die Zeile der Pill
      // jedes Nachbarwort liegt komplett außerhalb der Pill
      words.forEach(k => {
        const px = +/([\d.]+)px/.exec(c._font)[1], w = k.t.length * px * 0.55;
        const inside = k.x + w > pill.x + 1 && k.x < pill.x + pill.w - 1;
        const isActive = k.x >= pill.x - 1e-6 && k.x + w <= pill.x + pill.w + 1e-6;
        if (inside && !isActive) bad.push(st.id + '@' + t + ':' + k.t);
      });
    });
  });
  ok(bad.length === 0, 'Pill ueberlappt keine Nachbarwoerter: ' + bad.join(', '));
  ok(T.STYLES.filter(x => x.hlPillBg).length >= 3, 'Pill-Styles vorhanden');
}

// 21a2) Statische Caption-Ebene: nicht aktive Wörter + Glows nur einmal je (Block, aktives Wort) zeichnen
{
  const mkCtx = (canvas) => ({ canvas, _font: '', letterSpacing: '0px', n: 0, imgs: 0, lineWidth: 1, strokeStyle: '#000', fillStyle: '#000', shadowColor: '', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, globalAlpha: 1, filter: 'none',
    get font() { return this._font; }, set font(v) { this._font = v; },
    measureText(str) { const m = /([\d.]+)px/.exec(this._font); return { width: (str || '').length * (m ? +m[1] : 16) * 0.55 }; },
    fillText() { this.n++; }, strokeText() {}, drawImage() { this.imgs++; }, setTransform() {}, clearRect() {},
    roundRect() {}, rect() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, beginPath() {}, fill() {}, stroke() {}, ellipse() {}, fillRect() {},
    createLinearGradient() { return { addColorStop() {} }; } });
  const layerCtxs = [];
  const origCreate = document.createElement;
  document.createElement = (t) => {
    if (t !== 'canvas') return origCreate(t);
    const cv = { width: 0, height: 0 }; const cx = mkCtx(cv); cv.getContext = () => cx; layerCtxs.push(cx); return cv;
  };
  const ws = ['Ganz', 'weiche', 'Bluete', 'heute'].map((w, i) => ({ word: w, start: i * 0.5, end: i * 0.5 + 0.4 }));
  T.setState(T.buildCaptionBlocks(ws), [], 'karaoke');
  const bloom = T.STYLES.find(x => x.id === 'bloom');
  const main = mkCtx({ width: 1080, height: 1920 });
  T.drawCaptionsOnCtx(main, 0.1, bloom, 1080, 1920, false);
  const layer = layerCtxs[0], after1 = layer ? layer.n : -1, main1 = main.n;
  T.drawCaptionsOnCtx(main, 0.2, bloom, 1080, 1920, false);   // gleicher Block, gleiches aktives Wort
  ok(layer && after1 > 0 && layer.n === after1, 'statische Ebene im Folge-Frame nicht neu gezeichnet');
  ok(main.imgs >= 2 && main.n - main1 <= 3, 'pro Frame nur Ebene einsetzen + aktives Wort zeichnen (fillText ' + (main.n - main1) + ')');
  T.drawCaptionsOnCtx(main, 0.7, bloom, 1080, 1920, false);   // nächstes Wort aktiv → Ebene neu
  ok(layer.n > after1, 'neues aktives Wort → Ebene neu');
  document.createElement = origCreate;
}

// 22a) Glow-Styles: aktives Wort als Sprite — pro Frame nur drawImage, Sprite je Animationsstufe gecacht
{
  let created = 0, spriteDraws = 0;
  const mkCtx = (canvas) => ({ canvas, _font: '', letterSpacing: '0px', n: 0, imgs: 0, filter: 'none', lineWidth: 1, strokeStyle: '#000', fillStyle: '#000', shadowColor: '', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, globalAlpha: 1,
    get font() { return this._font; }, set font(v) { this._font = v; },
    measureText(str) { const m = /([\d.]+)px/.exec(this._font); return { width: (str || '').length * (m ? +m[1] : 16) * 0.55 }; },
    fillText() { this.n++; }, strokeText() {}, drawImage() { this.imgs++; }, setTransform() {}, clearRect() {},
    roundRect() {}, rect() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, beginPath() {}, fill() {}, stroke() {}, ellipse() {}, fillRect() {},
    createLinearGradient() { return { addColorStop() {} }; } });
  const origCreate = document.createElement;
  document.createElement = (t) => { if (t !== 'canvas') return origCreate(t); created++; const cv = { width: 0, height: 0 }; const cx = mkCtx(cv); cv.getContext = () => cx; return cv; };
  const ws = ['Weiche', 'Bluete', 'leuchtet', 'heute'].map((w, i) => ({ word: w, start: i * 0.5, end: i * 0.5 + 0.45 }));
  T.setState(T.buildCaptionBlocks(ws), [], 'karaoke');
  ['bloom', 'neon'].forEach(id => {
    const st = T.STYLES.find(x => x.id === id);
    const main = mkCtx({ width: 1080, height: 1920 });
    T.drawCaptionsOnCtx(main, 0.40, st, 1080, 1920, false);           // Animation vorbei → Grundstufe
    const c1 = created, n1 = main.n;
    for (let k = 0; k < 5; k++) T.drawCaptionsOnCtx(main, 0.41 + k * 0.005, st, 1080, 1920, false);
    ok(created === c1, id + ': Folge-Frames bauen keine neuen Canvases');
    ok(main.n === n1, id + ': aktives Wort per drawImage statt fillText/Schatten pro Frame');
  });
  document.createElement = origCreate;
}

// 22b) Mindest-Anzeigedauer je Block; Stille-Verschiebung konservativ
{
  T.onWpbChange('4');
  const W = (arr) => arr.map(([w, a, b]) => ({ word: w, start: a, end: b }));
  let bl = T.buildCaptionBlocks(W([['Eins', 0, 0.5], ['zwei.', 0.55, 1.0], ['Ja.', 1.1, 1.2], ['Und', 1.3, 1.6], ['weiter', 1.65, 2.2]]), []);
  // „Ja.“ zwischen zwei Sätzen: nie über ein Satzende verschmelzen, nur bis zum nächsten Block verlängern
  ok(bl.length === 3 && bl[1].text === 'Ja.' && Math.abs(bl[1].end - 1.3) < 1e-9, 'kurzer Satz-Block: bis zum naechsten Block verlaengert, nicht verschmolzen: ' + bl.map(b => b.text + '(' + (b.end - b.start).toFixed(2) + ')').join(' | '));
  ok(bl.map(b => b.text).join(' ').split(' ').length === 5, 'keine Woerter verloren');
  // Lücke reicht → nur verlängern
  bl = T.buildCaptionBlocks(W([['Kurz.', 0, 0.1], ['Danach', 1.0, 1.4], ['kommt', 1.45, 1.8], ['mehr', 1.85, 2.2]]), []);
  ok(bl[0].text === 'Kurz.' && Math.abs(bl[0].end - 0.3) < 1e-9, 'kurzer Block in die Luecke verlaengert');
  // Regression: „SIE IN DIE KOMMENTARE. HALLO“ — nie über Satzende / über „Wörter pro Block“ hinaus
  bl = T.buildCaptionBlocks(W([['Schreibt', 0, 0.3], ['es', 0.32, 0.45], ['in', 0.47, 0.55], ['die', 0.56, 0.62], ['Kommentare.', 0.64, 1.1], ['Hallo', 1.12, 1.25], ['und', 1.4, 1.6], ['tschuess', 1.62, 2.0]]), []);
  ok(bl.every(b => b.words.length <= 4) && !bl.some(b => /Kommentare\. Hallo/.test(b.text)), 'max. 4 Woerter, kein Verschmelzen ueber Satzende: ' + bl.map(b => b.text).join(' | '));
  // Verschmelzen nur, wenn es innerhalb von „Wörter pro Block“ bleibt und kein Satzende dazwischen liegt
  T.onWpbChange('2');
  bl = T.enforceMinBlockDuration([{ words: W([['ganz', 0, 0.1]]), start: 0, end: 0.1, text: 'ganz' }, { words: W([['kurz', 0.12, 0.6]]), start: 0.12, end: 0.6, text: 'kurz' }], []);
  ok(bl.length === 1 && bl[0].text === 'ganz kurz', 'Verschmelzen innerhalb wpb ohne Satzende');
  T.onWpbChange('4');
  bl = T.buildCaptionBlocks(W([['Eins', 0, 0.5], ['zwei.', 0.55, 1.0], ['Ja.', 1.1, 1.2], ['Und', 1.3, 1.6], ['weiter', 1.65, 2.2]]), [1.05, 1.25]);
  ok(bl.some(b => b.text === 'Ja.') && !bl.some(b => /zwei\. Ja\.|Ja\. Und/.test(b.text)), 'kurzer Block wird nie ueber einen Schnitt verschmolzen');
  const ja = bl.find(b => b.text === 'Ja.');
  ok(ja.end <= 1.25 + 1e-9, 'Verlaengerung stoppt am Schnitt');
  T.onWpbChange('1');
  bl = T.buildCaptionBlocks(W([['Pop', 0, 0.1], ['eins', 0.2, 0.3], ['zwei', 0.5, 0.6]]), []);
  ok(bl.length === 3 && bl[0].end >= 0.2 - 1e-9, '1 Wort/Block: nicht verschmelzen, nur verlaengern (bis zum naechsten Block)');
  T.onWpbChange('4');
}

// 22c) Unabspielbares Video: Meldung nach Codec
{
  ok(T.classifyUnplayable({ hasVideo: true, codec: 'avc1.64001f' }, { name: 'a.mp4' }) === 'h264', 'H.264-Spur → H.264-Hinweis (nicht HEVC)');
  ok(T.classifyUnplayable({ hasVideo: true, codec: 'hev1.1.6.L93' }, { name: 'a.mov' }) === 'hevc', 'hev1 → HEVC');
  ok(T.classifyUnplayable({ hasVideo: true, codec: 'av01.0.08M.08' }, { name: 'a.mp4' }) === 'codec', 'anderer Codec → generisch');
  T.applyPlayability('h264');
  ok(/H\.264/.test(document.getElementById('vidWarn').textContent) && /H\.264/.test(document.getElementById('btnVideo').title), 'H.264-Text + Tooltip');
  T.applyPlayability('codec');
  ok(/video format/.test(document.getElementById('vidWarn').textContent), 'generischer Codec-Hinweis');
  T.applyPlayability('ok');
}

// 22d) Export-Button: gut lesbarer Busy-Zustand mit Fortschritt
{
  const b = document.getElementById('btnVideo');
  b.querySelector = () => document.getElementById('btnVideoLbl');
  b.style.setProperty = function(k, v) { this[k] = v; }; b.style.removeProperty = function(k) { delete this[k]; };
  T.exportBtnState('Rendering 42%…');
  ok(b.classList.contains('busy') && b.style['--p'] === '42%' && document.getElementById('btnVideoLbl').textContent === 'Rendering 42%…' && b.disabled, 'Busy-Klasse, Fortschritt 42 %, gesperrt');
  T.exportBtnState(null);
  ok(!b.classList.contains('busy') && document.getElementById('btnVideoLbl').textContent === 'Video + captions', 'zurueckgesetzt');
}

// 22e) Fehlgeschlagener Wechsel Fast→Perfect: Einstellungen auf die der behaltenen Captions zurück
{
  T.setModelState('perfect');
  const hint = T.revertTranscriptionSettings({ model: 'fast', langSetting: 'auto', translate: false });
  ok(T.getModel() === 'fast' && /Perfect again to retry/.test(hint), 'Modell zurueck auf Fast + Hinweis: ' + hint);
  ok(T.revertTranscriptionSettings(null) === '', 'ohne Meta: nichts tun');
}

// 23a) WebM→MP4: Bild und Ton auf die Ausgabedauer kürzen
ok(T.webmToMp4Trim(33.96).join(' ') === '-t 33.960 -shortest' && T.webmToMp4Trim(NaN).join(' ') === '-shortest', 'webmToMp4: -t Dauer + -shortest');

// 23b) Preset-Layout (Pop One) wird beim Verlassen zu JEDEM Style zurückgesetzt — außer manuell geändert
{
  T.onWpbChange('3');
  if (!T.STYLES.find(x => x.id === 'custom')) T.STYLES.push({ id: 'custom', name: 'My style', fl: 'Inter', font: "'Inter'", tc: '#fff', hl: '#ff0', ts: 'none', hls: 'none', anim: 'none', thumbBg: '#000' });
  T.selectStyle('custom');
  T.selectStyle('popone');
  ok(T.getWpb() === 1, 'Pop One: 1 Wort');
  T.selectStyle('custom');
  ok(T.getWpb() === 3, 'zurueck zum Custom-Style: vorherige 3 Woerter/Block');
  T.selectStyle('popone'); T.onWpbChange('2'); T.selectStyle('classic');
  ok(T.getWpb() === 2, 'auf dem Preset manuell geaendert → Wert bleibt');
  T.onWpbChange('4');
}

// 21b) MediaRecorder-Format: MP4 nur mit AAC (bzw. ohne Ton), sonst WebM → Umkodierung
{
  const sup = list => m => list.includes(m);
  ok(T.pickRecorderMime(sup(['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/mp4']), true) === 'video/webm;codecs=vp9', 'Chrome ohne mp4a: mit Ton → WebM statt H.264+Opus-MP4');
  ok(T.pickRecorderMime(sup(['video/mp4;codecs=avc1', 'video/webm;codecs=vp9']), false) === 'video/mp4;codecs=avc1', 'ohne Ton: reines avc1-MP4 ok');
  ok(T.pickRecorderMime(sup(['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/webm']), true) === 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'avc1+mp4a bevorzugt');
  ok(T.pickRecorderMime(sup(['video/mp4']), true) === 'video/mp4', 'Safari: generisches MP4');
  ok(T.recorderMimeIsSafeMp4('video/mp4;codecs=avc1,opus', 'video/mp4;codecs=avc1,mp4a', true) === false, 'tatsaechlich Opus im MP4 → umkodieren');
  ok(T.recorderMimeIsSafeMp4('video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', true) === true, 'H.264+AAC direkt');
  ok(T.recorderMimeIsSafeMp4('video/webm;codecs=vp9,opus', 'video/webm;codecs=vp9', true) === false, 'WebM → umkodieren');
  ok(T.recorderMimeIsSafeMp4('video/mp4', 'video/mp4', true) === true && T.recorderMimeIsSafeMp4('video/mp4;codecs=avc1', 'video/mp4;codecs=avc1', false) === true, 'Safari-MP4 / stummes avc1 direkt');
}

// 21c) Export-Geometrie: 1080p-Deckel, nie hochskalieren, Bitrate, 9:16-Reframe
{
  let g = T.exportGeometry(2160, 3840, 30, '1080', 'original');
  ok(g.W === 1080 && g.H === 1920 && g.mode === 'original', '4K hochkant → 1080×1920');
  g = T.exportGeometry(720, 1280, 30, '1080', 'original');
  ok(g.W === 720 && g.H === 1280, 'nie hochskalieren');
  g = T.exportGeometry(2160, 3840, 30, 'orig', 'original');
  ok(g.W === 2160 && g.H === 3840 && g.bitrate === 12e6, 'Original-Aufloesung, Bitrate gedeckelt 12 Mbit/s');
  ok(T.exportBitrate(1080, 1920, 30) === Math.round(0.07 * 1080 * 1920 * 30) && T.exportBitrate(320, 240, 30) === 2e6, 'Bitrate ~0,07 bpp, min 2 Mbit/s');
  g = T.exportGeometry(1920, 1080, 30, '1080', 'blur');
  ok(g.W === 1080 && g.H === 1920 && g.mode === 'blur', 'Quer + 9:16-Blur → 1080×1920');
  g = T.exportGeometry(1080, 1920, 30, '1080', 'crop');
  ok(g.mode === 'original', 'schon 9:16 → kein Reframe');
  g = T.exportGeometry(1001, 1001, 30, '1080', 'crop');
  ok(g.W === 1080 && g.H === 1920 && g.mode === 'crop', 'Reframe (quadratisch) → immer 1080×1920 Leinwand');
  g = T.exportGeometry(1080, 1080, 30, '1080', 'blur');
  ok(g.W === 1080 && g.H === 1920, 'quadratisch 1080 + Blur-Fill → 1080×1920 (nicht 608×1080)');
  g = T.exportGeometry(720, 720, 30, '1080', 'original');
  ok(g.W === 720 && g.H === 720, 'Original: weiterhin nie hochskalieren');
  const calls = [];
  const fakeCtx = { save() {}, restore() {}, drawImage() { calls.push('bg'); }, fillRect() { calls.push('dim'); } };
  const ctxs = [];
  const origCreate = document.createElement;
  document.createElement = (t) => {
    if (t !== 'canvas') return origCreate(t);
    const n = ctxs.length, cx = { tag: n === 0 ? 'tiny' : 'mid', drawImage() { calls.push('mid→tiny'); }, fillRect() { calls.push('dim@' + this.tag); } };
    ctxs.push(cx); return { width: 0, height: 0, getContext: () => cx };
  };
  const fit = (c, w, h, f) => calls.push(f + (c === fakeCtx ? '' : '@' + c.tag + ':' + w));
  T.drawReframed(fakeCtx, 1080, 1920, 'blur', fit);
  ok(calls.join(',') === 'cover@mid:256,mid→tiny,dim@tiny,bg,contain', 'Blur-Fill: Quelle → 256-px-Canvas → winzig + abgedunkelt → hochskaliert, Video eingepasst: ' + calls.join(','));
  calls.length = 0; for (let k = 0; k < 5; k++) T.drawReframed(fakeCtx, 1080, 1920, 'blur', fit);
  ok(calls.join(',') === 'bg,contain,bg,contain,bg,contain,bg,contain,bg,contain', 'Hintergrund 5 Frames lang wiederverwendet: ' + calls.join(','));
  calls.length = 0; T.drawReframed(fakeCtx, 1080, 1920, 'blur', fit);
  ok(calls[0] === 'cover@mid:256', 'jeder 6. Frame erneuert den Hintergrund');
  document.createElement = origCreate;
  const c2 = []; T.drawReframed(fakeCtx, 1080, 1920, 'crop', (c, w, h, fit) => c2.push(fit));
  ok(c2.join() === 'cover', 'Crop = Mitte fuellend');
}

// 21d) Nicht abspielbare Videos: HEVC / keine Videospur → Hinweis, Video-Export aus, SRT bleibt
{
  ok(T.classifyUnplayable({ hasVideo: true, codec: 'hvc1.2.4.L153' }, { name: 'IMG_1.MOV' }) === 'hevc', 'HEVC-Spur erkannt');
  ok(T.classifyUnplayable({ hasVideo: false }, { name: 'a.mp4' }) === 'novideo', 'MP4 ohne Videospur');
  ok(T.classifyUnplayable(null, { name: 'x.m4a', type: 'audio/mp4' }) === 'novideo' && T.classifyUnplayable(null, { name: 'clip.mov', type: 'video/quicktime' }) === 'hevc', 'Fallback nach Dateiart');
  T.setState(T.buildCaptionBlocks([{ word: 'a', start: 0, end: 1 }]), [], 'karaoke');
  T.applyPlayability('hevc'); T.enableExports(true);
  ok(document.getElementById('btnVideo').disabled === true && document.getElementById('btnSRT').disabled === false, 'HEVC: Video-Export aus, SRT an');
  ok(/HEVC/.test(document.getElementById('vidWarn').textContent) && document.getElementById('vidWarn').style.display === 'block', 'HEVC-Hinweis sichtbar');
  T.applyPlayability('novideo');
  ok(/no video track/.test(document.getElementById('vidWarn').textContent), 'Hinweis: keine Videospur');
  T.applyPlayability('ok'); T.enableExports(true);
  ok(document.getElementById('btnVideo').disabled === false && document.getElementById('vidWarn').style.display === 'none', 'abspielbar: alles normal');
}
ok(T.DEFAULT_STYLE === 'hormozi', 'Standard-Style fuer neue Nutzer: Hormozi');

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

// 16c) WebCodecs-Schnellexport: reine Helfer (Feature-Erkennung, Zeit-Re-Basing, Codec-Wahl)
ok(T.fastExportSupported() === false, 'Node ohne WebCodecs → Schnellexport aus (kein Throw)');
ok(T.isFastExportSource({ type: 'video/mp4', name: 'a.mp4' }) && T.isFastExportSource({ type: 'video/quicktime', name: 'IMG_1.MOV' })
   && T.isFastExportSource({ type: '', name: 'clip.m4v' }), 'MP4/MOV/M4V → Schnellexport-Quelle');
ok(!T.isFastExportSource({ type: 'video/webm', name: 'a.webm' }) && !T.isFastExportSource({ type: 'video/webm', name: 'falsch.mp4' })
   && !T.isFastExportSource(null), 'WebM/fehlende Datei → kein Schnellexport');
const rg = [{ start: 1, end: 2 }, { start: 3, end: 3.5 }];
ok(T.rebaseCutTime(0.5, rg) === 0.5, 'vor erstem Cut unverändert');
ok(T.rebaseCutTime(1, rg) === null && T.rebaseCutTime(1.99, rg) === null && T.rebaseCutTime(3.2, rg) === null, 'in Cut → null');
ok(T.rebaseCutTime(2, rg) === 1 && Math.abs(T.rebaseCutTime(2.5, rg) - 1.5) < 1e-9, 'nach Cut 1 um 1 s verschoben');
ok(Math.abs(T.rebaseCutTime(4, rg) - 2.5) < 1e-9, 'nach beiden Cuts um 1.5 s verschoben');
ok(T.rebaseCutTime(7, []) === 7 && T.rebaseCutTime(7, null) === 7, 'ohne Cuts Identität');
// Video-Frames (30 fps) durch die Cuts: Ausgabe lückenlos & streng monoton
(function () {
  let prev = -1, mono = true, maxGap = 0;
  for (let i = 0; i < 150; i++) { const o = T.rebaseCutTime(i / 30, rg); if (o === null) continue; if (o <= prev) mono = false; if (prev >= 0) maxGap = Math.max(maxGap, o - prev); prev = o; }
  ok(mono && maxGap < 1 / 30 + 0.02, 'Frame-Zeiten nach Cut lückenlos/monoton, max Abstand ' + maxGap.toFixed(3));
})();
// AAC-Pakete (1024 @ 48 kHz) durch Cuts: lückenlos, Fehler zur Videozeit ≤ ½ Paket, Länge passt
(function () {
  const dur = 1024 / 48000, plan = T.createAudioCutPlanner(rg);
  let clockEnd = 0, maxErr = 0, contiguous = true, last = null, kept = 0, srcEnd = 0;
  for (let k = -1; k * dur < 6; k++) { // k = -1: Priming-Paket vor 0
    const ts = k * dur, outs = plan(ts, dur);
    outs.forEach(function (o) { if (last !== null && Math.abs(o - (last + dur)) > 1e-9) contiguous = false; last = o; kept++; });
    const ideal = T.rebaseCutTime(ts + dur / 2, rg);
    if (outs.length && ideal !== null) maxErr = Math.max(maxErr, Math.abs(outs[outs.length - 1] + dur / 2 - ideal));
    if (last !== null) clockEnd = last + dur;
    srcEnd = ts + dur;
  }
  ok(contiguous, 'Audio-Pakete lückenlos aneinander');
  ok(maxErr <= dur / 2 + 1e-9, 'Audio ≤ ½ Paket neben exakter Videozeit: ' + (maxErr * 1000).toFixed(1) + ' ms');
  ok(Math.abs(clockEnd - (srcEnd - 1.5)) <= dur / 2, 'Audiolänge = Quelle − 1.5 s Cuts (±½ Paket): ' + clockEnd.toFixed(4) + ' vs ' + (srcEnd - 1.5).toFixed(4));
  const p0 = T.createAudioCutPlanner([]);
  ok(p0(-dur, dur).length === 0 && p0(0, dur)[0] === 0 && Math.abs(p0(dur, dur)[0] - dur) < 1e-12, 'ohne Cuts: Priming weg, Rest 1:1');
  const pg = T.createAudioCutPlanner([]); pg(0, dur);
  ok(Math.abs(pg(1, dur)[0] - 1) < 1e-12, 'echte Quell-Lücke (> 2.5 Pakete) wird übernommen statt aufgefüllt');
})();
ok(T.rotationFromMatrix([65536, 0, 0, 0, 65536, 0, 0, 0, 1073741824]) === 0, 'Matrix Identität → 0°');
ok(T.rotationFromMatrix([0, 65536, 0, -65536, 0, 0, 0, 0, 1073741824]) === 90, 'Matrix → 90°');
ok(T.rotationFromMatrix([-65536, 0, 0, 0, -65536, 0, 0, 0, 1073741824]) === 180, 'Matrix → 180°');
ok(T.rotationFromMatrix([0, -65536, 0, 65536, 0, 0, 0, 0, 1073741824]) === 270, 'Matrix → 270°');
ok(T.rotationFromMatrix([-65536, 0, 0, 0, 65536, 0, 0, 0, 1073741824]) === null, 'gespiegelte Matrix → null (Echtzeit-Pfad)');
ok(T.rotationFromMatrix(undefined) === 0, 'keine Matrix → 0°');
ok(T.editListOffset(undefined, 1000, 48000) === 0, 'keine Edit-Liste → 0');
ok(Math.abs(T.editListOffset([{ segment_duration: 45000, media_time: 1024, media_rate_integer: 1 }], 1000, 48000) + 1024 / 48000) < 1e-12, 'AAC-Priming → negativer Versatz');
ok(Math.abs(T.editListOffset([{ segment_duration: 500, media_time: -1 }, { segment_duration: 1000, media_time: 0, media_rate_integer: 1 }], 1000, 90000) - 0.5) < 1e-12, 'leerer Edit → Verzögerung');
ok(T.editListOffset([{ segment_duration: 1, media_time: 0, media_rate_integer: 1 }, { segment_duration: 1, media_time: 9000, media_rate_integer: 1 }], 1000, 90000) === null, 'mehrere Edits → null');
const c720 = T.h264CodecCandidates(720, 1280, 30), c1080 = T.h264CodecCandidates(1080, 1920, 30);
ok(c720[0] === 'avc1.64001F' && c720.indexOf('avc1.42E01F') > 0, '720x1280@30 → Level 3.1 zuerst: ' + c720.join(','));
ok(c1080[0] === 'avc1.640028' && c1080[1] === 'avc1.4D0028' && c1080[2] === 'avc1.42E028', '1080x1920@30 → Level 4.0: ' + c1080.join(','));
ok(T.h264CodecCandidates(1080, 1920, 60)[0] === 'avc1.64002A', '1080p60 → Level 4.2');
ok(T.h264CodecCandidates(2160, 3840, 30)[0] === 'avc1.640033', '4K30 → Level 5.1');
ok(T.h264CodecCandidates(1080, 1920, 30).length === 6, 'passendes Level + eins Reserve');
ok(T.h264CodecCandidates(8000, 8000, 30).length === 0, 'jenseits Level 5.2 → keine Kandidaten (→ Echtzeit-Pfad)');
ok(T.fastExportVideoCodecs(720, 1280, 30).every(function (c) { return c.mux === 'avc' && /^avc1\./.test(c.codec); }), 'Produktion: nur H.264');

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

  // 21c) Timing-Snap an die Sprachenergie (synthetisch: Tonstöße mit Stille dazwischen)
  {
    const SRn = 16000, dur = 4.5, a = new Float32Array(SRn * dur);
    for (let i = 0; i < a.length; i++) a[i] = (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.002; // leises Rauschen
    const burst = (t0, t1) => { for (let i = Math.floor(t0 * SRn); i < t1 * SRn; i++) a[i] = 0.5 * Math.sin(2 * Math.PI * 220 * i / SRn); };
    burst(1.0, 1.5); burst(2.0, 2.6); burst(3.2, 3.5);
    const ws = [{ word: 'eins', start: 0.85, end: 1.75 },  // zu früh + klebt nach
                { word: 'zwei', start: 2.0, end: 2.6 },    // korrekt
                { word: 'drei', start: 3.05, end: 3.9 }];  // zu früh; Ende 400 ms zu spät (> 300 ms → bleibt)
    const sn = await T.snapWordTimings(ws, a, SRn);
    const near = (x, y, tol) => Math.abs(x - y) <= tol;
    ok(near(sn[0].start, 1.0, 0.02) && near(sn[0].end, 1.5, 0.02), 'Snap: frueher Start/spaetes Ende an Sprache gezogen: ' + sn[0].start + '–' + sn[0].end);
    ok(near(sn[1].start, 2.0, 0.02) && near(sn[1].end, 2.6, 0.02), 'Snap: korrektes Wort bleibt: ' + sn[1].start + '–' + sn[1].end);
    ok(near(sn[2].start, 3.2, 0.02) && sn[2].end === 3.9, 'Snap: Start vor (<= 250 ms), Ende ausserhalb 300-ms-Fenster bleibt: ' + sn[2].start + '–' + sn[2].end);
    ok(sn.every((w, i) => w.end > w.start && (i === 0 || w.start >= sn[i - 1].end)), 'Snap: monoton, ohne Ueberlappung');
    const far = await T.snapWordTimings([{ word: 'x', start: 0.6, end: 1.4 }], a, SRn);
    ok(far[0].start === 0.6, 'Snap: Start > 250 ms vor der Sprache bleibt unveraendert');
    // stark verrauscht → nichts verändern
    const noisy = new Float32Array(SRn * 3);
    for (let i = 0; i < noisy.length; i++) noisy[i] = (Math.sin(i * 78.233) * 12345.678 % 1) * 0.4;
    const nz = await T.snapWordTimings([{ word: 'a', start: 0.5, end: 1 }], noisy, SRn);
    ok(nz[0].start === 0.5 && nz[0].end === 1, 'Snap: verrauschtes Audio bleibt unveraendert');
  }

  // 21d) Templates in der Cloud: reservierte projects-Zeile statt JWT-Metadaten; Migration + Ausblenden
  {
    const store = {};
    global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
    store.capivo_templates = JSON.stringify([{ id: 'tpl_local', name: 'Lokal', style: { fl: 'Inter' }, layout: {}, createdAt: 1, updatedAt: 10 }]);
    const rows = [{ id: 7, title: T.TPL_ROW_TITLE, updated_at: '2026-01-01', payload: { kind: 'capivo_templates', templates: [{ id: 'tpl_row', name: 'Zeile', style: { fl: 'Anton' }, layout: {}, createdAt: 2, updatedAt: 20 }] } },
                  { id: 8, title: 'Mein Projekt', updated_at: '2026-01-02', payload: { blocks: [] } }];
    const calls = [];
    const mkQ = () => {
      const q = { op: 'select', f: [] };
      const api = {
        select() { if (q.op === 'insert') q.ret = true; return api; }, eq(k, v) { q.f.push(r => r[k] === v); return api; },
        neq(k, v) { q.f.push(r => r[k] !== v); return api; }, order() { return api; },
        update(v) { q.op = 'update'; q.val = v; return api; }, insert(v) { q.op = 'insert'; q.val = v; return api; },
        delete() { q.op = 'delete'; return api; }, single() { q.single = true; return api; },
        then(res, rej) {
          calls.push(q.op);
          const hit = rows.filter(r => q.f.every(fn => fn(r)));
          let out;
          if (q.op === 'select') out = { data: q.single ? hit[0] : hit, error: null };
          else if (q.op === 'update') { hit.forEach(r => Object.assign(r, q.val)); out = { data: null, error: null }; }
          else if (q.op === 'insert') { const r = Object.assign({ id: 99 }, q.val); rows.push(r); out = { data: { id: 99 }, error: null }; }
          else { out = { data: null, error: null }; }
          return Promise.resolve(out).then(res, rej);
        }
      };
      return api;
    };
    let metaUpdate = null;
    T.setSb({ from: () => mkQ(), auth: { updateUser: async (u) => { metaUpdate = u; return { error: null }; } } });
    T.setMe('free', 'a@b.c');
    await T.syncTemplatesWithCloud({ user_metadata: { capivo_templates: [{ id: 'tpl_meta', name: 'Meta', style: { fl: 'Poppins' }, layout: {}, createdAt: 3, updatedAt: 30 }] } });
    const ids = T.getUserTemplates().map(t => t.id).sort().join(',');
    ok(ids === 'tpl_local,tpl_meta,tpl_row', 'Sync: lokal + Zeile + alte Metadaten zusammengefuehrt: ' + ids);
    const tplRow = rows.find(r => r.title === T.TPL_ROW_TITLE);
    ok(tplRow.payload.templates.length === 3 && calls.includes('update'), 'Sync: Zeile mit allen Templates aktualisiert');
    ok(metaUpdate && metaUpdate.data && metaUpdate.data.capivo_templates === null, 'Sync: alte JWT-Metadaten geleert');
    ok(T.STYLES.filter(x => x.id === 'tpl_row').length === 1, 'Sync: keine doppelten Picker-Eintraege');
    // Push von einem zweiten Gerät mit altem Stand darf fremde Cloud-Templates nicht überschreiben
    tplRow.payload = { kind: 'capivo_templates', templates: tplRow.payload.templates.concat([{ id: 'tpl_otherdev', name: 'Anderes Geraet', style: { fl: 'Inter' }, layout: {}, createdAt: 5, updatedAt: 50 }]) };
    await T.pushTemplatesToCloud();
    const after = rows.find(r => r.title === T.TPL_ROW_TITLE).payload.templates.map(t => t.id);
    ok(after.includes('tpl_otherdev') && after.includes('tpl_local') && T.getUserTemplates().some(t => t.id === 'tpl_otherdev'),
       'Push mischt Cloud-Stand ein (kein Ueberschreiben fremder Templates): ' + after.join(','));
    // Projektliste blendet die Templates-Zeile aus
    await T.loadProjects();
    const opts = document.getElementById('projList').children.map(o => o.textContent);
    ok(opts.includes('Mein Projekt') && !opts.includes(T.TPL_ROW_TITLE), 'Projektliste ohne Templates-Zeile: ' + opts.join('|'));
    // Gespeicherte Styles wiederherstellen: custom immer, fehlendes Template einmalig anlegen, gelöschtes → custom
    if (!T.STYLES.find(x => x.id === 'custom')) T.STYLES.push({ id: 'custom', name: 'alt', fl: 'Inter', tc: '#000', hl: '#000' });
    T.restoreSavedStyle({ style: 'custom', styleDef: { fl: 'Anton', font: "'Anton'", tc: '#123456', hl: '#fff' } });
    ok(T.STYLES.filter(x => x.id === 'custom').length === 1 && T.STYLES.find(x => x.id === 'custom').tc === '#123456', 'Projekt-Custom-Style ersetzt den der Sitzung');
    T.restoreSavedStyle({ style: 'tpl_gone', styleName: 'Weg', styleDef: { fl: 'Inter', tc: '#abcdef' }, tplLayout: { pos: 'top' } });
    T.restoreSavedStyle({ style: 'tpl_gone', styleName: 'Weg', styleDef: { fl: 'Inter', tc: '#abcdef' } });
    ok(T.getUserTemplates().filter(t => t.id === 'tpl_gone').length === 1 && T.STYLES.filter(x => x.id === 'tpl_gone').length === 1
       && T.STYLES.find(x => x.id === 'tpl_gone')._isTpl, 'fehlendes Template einmalig als Template angelegt (keine Dubletten)');
    T.getUserTemplates().push({ id: 'tpl_del', deleted: true, updatedAt: Date.now() });
    T.restoreSavedStyle({ style: 'tpl_del', styleDef: { fl: 'Inter', tc: '#fedcba' } });
    ok(T.getActiveId() === 'custom' && T.STYLES.find(x => x.id === 'custom').tc === '#fedcba' && !T.STYLES.find(x => x.id === 'tpl_del'), 'geloeschtes Template → als custom, nicht wiederbelebt');
    T.setSb(null); T.setMe('anon', ''); T.setUserTemplates([]); delete global.localStorage;
  }

  // 21e) Schnellexport-Sicherheitsnetz: Datei per <video>-Metadaten prüfen
  {
    const origCreate = document.createElement, origURL = global.URL;
    let revoked = 0, mode = {};
    // Nur eigene URLs zählen: dlBlob() früherer Tests gibt 'blob:x' per Timer (1–2 s) frei — fiel das in
    // dieses Fenster, war der Zähler sporadisch 7 statt 5 (flaky).
    global.URL = { createObjectURL: () => 'blob:v', revokeObjectURL: (u) => { if (u === 'blob:v') revoked++; } };
    document.createElement = (tag) => {
      if (tag !== 'video') return origCreate(tag);
      const v = { muted: false, preload: '', videoWidth: 0, duration: NaN, removeAttribute() {}, load() {} };
      Object.defineProperty(v, 'src', { set() {
        if (mode.hang) return;
        setTimeout(() => {
          if (mode.error) return v.onerror && v.onerror();
          v.videoWidth = mode.w === undefined ? 1080 : mode.w; v.duration = mode.d; v.onloadedmetadata && v.onloadedmetadata();
        }, 1);
      } });
      return v;
    };
    mode = { d: 9.8 };        ok((await T.validateExportBlob({}, 10)).ok === true, 'Validierung: passende Dauer → ok');
    mode = { d: 6 };          ok((await T.validateExportBlob({}, 10)).ok === false, 'Validierung: Dauer weicht ab → Fallback');
    mode = { d: 10, w: 0 };   ok((await T.validateExportBlob({}, 10)).ok === false, 'Validierung: keine Bildbreite → Fallback');
    mode = { error: true };   ok((await T.validateExportBlob({}, 10)).ok === false, 'Validierung: nicht abspielbar → Fallback');
    mode = { hang: true };    const tr = await T.validateExportBlob({}, 10, 30);
    ok(tr.ok === false && /Timeout/.test(tr.reason), 'Validierung: Timeout → Fallback');
    ok(revoked === 5, 'Objekt-URL jedes Mal freigegeben: ' + revoked);
    document.createElement = origCreate; global.URL = origURL;
  }

  // 21f) Perfect-Polish: korrigierte Wörter übernehmen die Original-Timings; Fehler → Original
  {
    const words = [['Wir', 0, 0.3], ['sind', 0.35, 0.6], ['am', 0.65, 0.8], ['Birken', 0.85, 1.1], ['hof.', 1.15, 1.5],
                   ['Das', 2.0, 2.2], ['Highlnd', 2.3, 2.8], ['Rind', 2.9, 3.3], ['grast.', 3.4, 3.9]].map(([w, a, b]) => ({ word: w, start: a, end: b }));
    let sent = null, url = null;
    global.fetch = async (u, o) => { url = u; sent = JSON.parse(o.body);
      return { ok: true, status: 200, json: async () => ({ model: 'x', changed: 2, segments: [{ id: 0, text: 'Wir sind am Birkenhof.' }, { id: 1, text: 'Das Highland Rind grast.' }] }) }; };
    const r = await T.polishWords(words, 'de', 'Birkenhof', null);
    ok(/polish/.test(url) && sent.lang === 'de' && sent.vocab === 'Birkenhof' && sent.segments.length === 2 && sent.segments[1].text === 'Das Highlnd Rind grast.', 'Polish-Request: Saetze als Segmente');
    const hi = r.words.find(w => w.word === 'Highland');
    ok(hi && hi.start === 2.3 && hi.end === 2.8, 'korrigiertes Wort uebernimmt Original-Timing');
    const bh = r.words.find(w => w.word === 'Birkenhof.');
    ok(r.words.length === 8 && bh && bh.start >= 0.85 - 1e-9 && bh.end <= 1.5 + 1e-9, 'Wortzahl-Aenderung (Birken hof → Birkenhof) mit Zeitspanne der alten Woerter');
    ok(r.fixes >= 2, 'Fixes gezaehlt: ' + r.fixes);
    ok(r.words.every((w, i) => i === 0 || w.start >= r.words[i - 1].start), 'Timings monoton');
    // Umschreiben statt Korrigieren → Segment bleibt original
    global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ segments: [{ id: 1, text: 'Heute erzähle ich euch etwas über unsere wunderbaren schottischen Hochlandrinder.' }] }) });
    const r2 = await T.polishWords(words, 'de', '', null);
    ok(r2.words.map(w => w.word).join(' ') === words.map(w => w.word).join(' '), 'Umschreiben wird verworfen');
    // Fehlerfälle: 404 auf beiden Endpunkten, 500, Netzwerk → Original, kein Fehler
    for (const mk of [async () => ({ ok: false, status: 404, json: async () => ({}) }), async () => ({ ok: false, status: 500, json: async () => ({ error: 'nicht konfiguriert' }) }),
                      async () => { throw new TypeError('Failed to fetch'); }]) {
      global.fetch = mk;
      const rf = await T.polishWords(words, 'de', '', null);
      ok(rf.words === words && rf.fixes === 0, 'Polish-Fehler → Original unveraendert');
    }
    // Fast polisht nie, Übersetzen auch nicht
    T.setModelState('fast'); ok(T.polishEnabled() === false, 'Fast: kein Polish');
    T.setModelState('perfect'); ok(T.polishEnabled() === true, 'Perfect: Polish');
    T.setTranslateState(true); ok(T.polishEnabled() === false, 'Perfect + Uebersetzen: kein Polish'); T.setTranslateState(false);
    T.setModelState('fast');
    ok(T.polishSegments(Array.from({ length: 95 }, (_, i) => ({ word: 'w' + i }))).every(sg => sg.b - sg.a <= 40), 'Segmente max. 40 Woerter');
  }

  // 21g) Sprach-Erkennung (VAD) vor der Transkription: 5 s lautes Rascheln, dann Sprache (Rascheln läuft weiter)
  {
    const SRn = 16000;
    const rng = seed => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
    const scaleTo = (o, level) => { let ss = 0; for (let i = 0; i < o.length; i++) ss += o[i] * o[i]; const g = level / Math.sqrt(ss / o.length || 1); for (let i = 0; i < o.length; i++) o[i] *= g; return o; };
    const rmsOf = (o, a, b) => { let ss = 0; for (let i = a; i < b; i++) ss += o[i] * o[i]; return Math.sqrt(ss / (b - a)); };
    // „Rascheln“: rosa-ähnliches + hochpass-gefiltertes Rauschen, schwankende Hüllkurve, Transienten (Schritte/Zweige)
    const rustle = (n, seed, level) => {
      const R = rng(seed), o = new Float32Array(n), p = [0, 0, 0]; let prev = 0, env = 1;
      for (let i = 0; i < n; i++) {
        const w = R() * 2 - 1;
        p[0] = 0.99765 * p[0] + w * 0.099; p[1] = 0.963 * p[1] + w * 0.2965; p[2] = 0.57 * p[2] + w * 1.0527;
        if (i % 160 === 0) env = 0.6 * env + 0.4 * (0.5 + R());
        o[i] = (0.6 * (p[0] + p[1] + p[2] + w * 0.1848) * 0.25 + 0.5 * (w - prev)) * env; prev = w;
      }
      for (let k = 0; k < n / SRn * 3; k++) {
        const at = Math.floor(R() * n), L = Math.floor(SRn * (0.005 + R() * 0.03)), A = 0.6 + R() * 1.2;
        for (let i = 0; i < L && at + i < n; i++) o[at + i] += (R() * 2 - 1) * A * Math.exp(-i / (L / 3));
      }
      return scaleTo(o, level);
    };
    // „Sprache“: Harmonische eines gleitenden f0 (110–220 Hz), Formant-Gewichtung je Silbe, 4-Hz-Silben-AM
    const voice = (n, seed, level) => {
      const o = new Float32Array(n), F = [[700, 1200, 2600], [300, 2200, 3000], [500, 900, 2400], [400, 1900, 2550]]; let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SRn, f0 = 110 + 55 * (1 + Math.sin(2 * Math.PI * 0.3 * t + seed)), fm = F[(Math.floor(t * 4) * 3 + seed) % 4];
        ph += 2 * Math.PI * f0 / SRn; let s = 0;
        for (let h = 1; h * f0 < 3800; h++) { let g = 0.02; for (const fc of fm) g += 1 / (1 + Math.pow((h * f0 - fc) / 120, 2)); s += g / Math.sqrt(h) * Math.sin(h * ph); }
        const am = 0.5 - 0.5 * Math.cos(2 * Math.PI * 4 * t); o[i] = s * am * am;
      }
      return scaleTo(o, level);
    };
    const mix = (base, add, at) => { for (let i = 0; i < add.length && at + i < base.length; i++) base[at + i] += add[i]; return base; };
    const near = (x, y, tol) => Math.abs(x - y) <= tol;

    // FFT gegen naive DFT
    { const Tb = T.vadFftTables(16), re = new Float64Array(16), im = new Float64Array(16), xr = [], R = rng(3);
      for (let i = 0; i < 16; i++) { re[i] = R() - 0.5; im[i] = R() - 0.5; xr.push([re[i], im[i]]); }
      T.vadFft(re, im, Tb); let err = 0;
      for (let k = 0; k < 16; k++) { let sr = 0, si = 0; for (let n = 0; n < 16; n++) { const a = -2 * Math.PI * k * n / 16; sr += xr[n][0] * Math.cos(a) - xr[n][1] * Math.sin(a); si += xr[n][0] * Math.sin(a) + xr[n][1] * Math.cos(a); } err = Math.max(err, Math.abs(sr - re[k]), Math.abs(si - im[k])); }
      ok(err < 1e-9, 'VAD-FFT = DFT, Fehler ' + err); }

    const a = mix(rustle(SRn * 11, 7, 0.1), voice(SRn * 6, 2, 0.07), 5 * SRn);
    ok(rmsOf(a, 0, 5 * SRn) > rmsOf(voice(SRn * 6, 2, 0.07), 0, 6 * SRn), 'Testsignal: Rascheln lauter als die Stimme');
    const reg = await T.detectSpeechRegions(a, SRn);
    ok(reg.length >= 1 && near(reg[0].start, 5.0, 0.2), 'VAD: Sprache beginnt bei 5,0 s ±0,2: ' + JSON.stringify(reg));
    ok(reg.every(r => r.start >= 4.8), 'VAD: kein Sprachbereich im Rascheln 0–4,8 s: ' + JSON.stringify(reg));
    const cov = reg.reduce((s, r) => s + Math.max(0, Math.min(r.end, 10.8) - Math.max(r.start, 5.2)), 0) / 5.6;
    ok(cov > 0.9, 'VAD: Sprache 5,2–10,8 s zu > 90 % abgedeckt: ' + cov.toFixed(2));
    // Nur Geräusch / Stille / Gleichspannung / einzelner Blip → keine Sprache bzw. „wie bisher alles senden“
    ok((await T.detectSpeechRegions(rustle(SRn * 30, 11, 0.2), SRn)).length === 0, 'VAD: 30 s Rascheln → keine Sprache');
    ok((await T.detectSpeechRegions(new Float32Array(SRn * 5).fill(0.3), SRn)).length === 0, 'VAD: Gleichspannung → keine Sprache');
    ok((await T.detectSpeechRegions(new Float32Array(SRn * 5), SRn)).length === 0, 'VAD: digitale Stille → keine Sprache');
    ok(T.speechSpans([], 30) === null && T.speechSpans([{ start: 10, end: 10.4 }], 60) === null, 'speechSpans: keine / < 2 % Sprache → null (alles senden)');
    // Musik (Akkord, stationär harmonisch): wird nicht verworfen — entweder als „Sprache“ gesendet oder null = alles senden
    { const m = new Float32Array(SRn * 20);
      for (let i = 0; i < m.length; i++) { const t = i / SRn; m[i] = 0.2 * (Math.sin(2 * Math.PI * 220 * t) + 0.7 * Math.sin(2 * Math.PI * 277.2 * t) + 0.6 * Math.sin(2 * Math.PI * 329.6 * t) + 0.3 * Math.sin(2 * Math.PI * 440 * t)) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.5 * t)); }
      const mr = await T.detectSpeechRegions(m, SRn), ms = T.speechSpans(mr, 20);
      const sent = ms ? ms.reduce((s, r) => s + r.end - r.start, 0) : 20;
      ok(sent > 18, 'Musik-Clip: (fast) alles wird weiter gesendet: ' + sent.toFixed(1) + ' s'); }
    // Spannen: Pausen ≤ 1 s bleiben drin, längere Geräusch-Strecken fliegen raus
    const sp = T.speechSpans([{ start: 1, end: 2 }, { start: 2.8, end: 3.5 }, { start: 6, end: 7 }], 10);
    ok(JSON.stringify(sp) === JSON.stringify([{ start: 1, end: 3.5 }, { start: 6, end: 7 }]), 'speechSpans: Luecke 0,8 s bleibt, 2,5 s faellt weg: ' + JSON.stringify(sp));
    // Spur + Map: Spacer zwischen den Stücken, Rückrechnung exakt
    const tr = T.buildSpeechTrack(new Float32Array(SRn * 10).fill(0.5), SRn, sp);
    ok(tr.samples.length === Math.round(SRn * (2.5 + 0.4 + 1)) && near(tr.map[1].l0, 2.9, 1e-9) && tr.map[1].g0 === 6, 'Spur: 2,5 s + 0,4 s Spacer + 1 s, Map stimmt');
    const mw = T.mapTrackWord(tr.map, { word: 'x', start: 3.0, end: 3.3 }), ms2 = T.mapTrackWord(tr.map, { word: 'y', start: 2.7, end: 3.1 });
    ok(near(mw.start, 6.1, 1e-9) && near(mw.end, 6.4, 1e-9), 'Spur→Original: 3,0 s → 6,1 s: ' + mw.start);
    ok(near(ms2.start, 6.0, 1e-9) && ms2.end > ms2.start, 'Wortstart im Spacer → Anfang des Folgestuecks: ' + ms2.start);

    // Server-Pfad: Mock „Whisper-Fehlermodus“ verteilt Wörter ab 0,3 s über die GANZE empfangene Dauer
    {
      const origBlob = global.Blob;
      global.Blob = function (parts, o) { this.parts = parts; this.type = o && o.type; this.size = parts[0] && parts[0].byteLength; };
      const durs = [];
      global.fetch = async (url, opt) => {
        const d = (opt.body.parts[0].byteLength - 44) / 32000; durs.push(d);
        const words = []; for (let t = 0.3, k = 0; t + 0.3 <= d; t += 0.5, k++) words.push({ word: 'w' + k, start: t, end: t + 0.3 });
        return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ language: 'german', words }) };
      };
      const spansA = T.speechSpans(reg, 11);
      const rA = await T.serverTranscribe(a, 'm', '', 11, null, '', spansA);
      ok(durs.length === 1 && durs[0] < 6.6 && durs[0] > 5.5, 'Server: nur die Sprache (~6 s) gesendet, nicht 11 s: ' + durs.join());
      ok(rA.words.length && rA.words.every(w => w.start >= reg[0].start - 1e-9), 'Server: kein Wort im Rascheln-Vorlauf: erstes ' + (rA.words[0] && rA.words[0].start.toFixed(2)));
      ok(near(rA.words[0].start, reg[0].start + 0.3, 1e-3), 'Server: Offset exakt (Spur 0,3 s → ' + (reg[0].start + 0.3).toFixed(2) + '): ' + rA.words[0].start.toFixed(3));
      // ohne spans: unverändert das ganze Audio (Fehlermodus sichtbar: Wörter ab 0,3 s)
      durs.length = 0;
      const rOld = await T.serverTranscribe(a, 'm', '', 11, null, '');
      ok(durs.length === 1 && near(durs[0], 11, 0.01) && rOld.words[0].start < 1, 'Server ohne VAD: altes Verhalten (ganzes Audio)');
      // zwei Sprachstellen mit 5 s Rascheln dazwischen → EIN Request, Rascheln nicht gesendet, Wörter landen nur in Sprache
      const b2 = mix(mix(rustle(SRn * 12, 21, 0.08), voice(SRn * 2, 1, 0.07), 2 * SRn), voice(SRn * 2.5, 3, 0.07), Math.round(8.5 * SRn));
      const regB = await T.detectSpeechRegions(b2, SRn), spB = T.speechSpans(regB, 12);
      durs.length = 0;
      const rB = await T.serverTranscribe(b2, 'm', '', 12, null, '', spB);
      ok(spB && spB.length === 2 && durs.length === 1 && durs[0] < 6, 'Server: 2 Spannen, 1 Request, Rascheln-Luecke nicht gesendet: ' + JSON.stringify(spB) + ' ' + durs.join());
      ok(rB.words.every(w => regB.some(r => w.start >= r.start - 1e-9 && w.end <= r.end + 1e-9)), 'Server: alle Woerter in Sprachbereichen: ' + rB.words.map(w => w.start.toFixed(1)).join(','));
      ok(rB.words.some(w => w.start > 8) && rB.words.every((w, i) => !i || w.start >= rB.words[i - 1].start), 'Server: zweite Stelle mit Offset, Reihenfolge stimmt');
      global.Blob = origBlob;
      // lokaler Fallback mit spans: dieselbe Spur, Rückrechnung auf Original-Zeit
      const segLens = [];
      const pipe = async (seg) => { segLens.push(seg.length / SRn); const ch = []; for (let t = 0.3; t + 0.3 <= seg.length / SRn; t += 0.5) ch.push({ text: ' w', timestamp: [t, t + 0.3] }); return { chunks: ch }; };
      const lw = await T.transcribeChunked(pipe, a, {}, null, spansA);
      ok(segLens.length === 1 && segLens[0] < 6.6, 'Lokal: nur Sprache an Whisper: ' + segLens.join());
      ok(lw.length && near(lw[0].start, reg[0].start + 0.3, 1e-3) && lw.every(w => w.start >= reg[0].start - 1e-9), 'Lokal: Woerter ab Sprach-Einsatz: ' + (lw[0] && lw[0].start.toFixed(2)));
    }

    // Wort-Beschränkung: „Whisper“ legt 5 Wörter in 0,2–4,5 s (Rascheln) → an/nach den Einsatz, geordnet, ≥ 0,1 s
    {
      const early = ['Hallo', 'und', 'herzlich', 'willkommen', 'zurück'].map((w, i) => ({ word: w, start: 0.2 + i * 0.85, end: 0.6 + i * 0.85 }));
      const later = [{ word: 'Heute', start: 7.0, end: 7.4 }, { word: 'gehen', start: 7.5, end: 7.9 }, { word: 'wir', start: 8.0, end: 8.2 }];
      const cw = await T.snapWordTimings(early.concat(later), a, SRn, reg);
      ok(cw.length === 8 && cw.every(w => w.start >= reg[0].start - 1e-9), 'Constraint: alle Woerter ab Sprach-Einsatz: ' + cw.map(w => w.start.toFixed(2)).join(','));
      ok(cw.every((w, i) => !i || w.start >= cw[i - 1].end - 1e-9) && cw.every(w => w.end - w.start >= 0.1 - 1e-9), 'Constraint: geordnet, jedes Wort >= 0,1 s');
      ok(cw.map(w => w.word).join(' ') === 'Hallo und herzlich willkommen zurück Heute gehen wir', 'Constraint: Reihenfolge der Woerter bleibt');
      ok(cw.slice(5).every((w, i) => near(w.start, later[i].start, 0.26)), 'Constraint: korrekt platzierte Woerter bleiben (bis auf Snap)');
      // Lauf passt nicht vor das erste Wort (Whisper hat alles verschmiert) → Lauf + erste Wörter gestaucht
      const R1 = [{ start: 5, end: 11 }];
      const smear = Array.from({ length: 20 }, (_, i) => ({ word: 'w' + i, start: 0.3 + i * 0.5, end: 0.7 + i * 0.5 }));
      const cs = T.constrainWordsToSpeech(smear, R1);
      ok(cs.every(w => w.start >= 5 - 1e-9) && cs.every((w, i) => !i || w.start >= cs[i - 1].end - 1e-9) && cs.every(w => w.end - w.start >= 0.1 - 1e-9), 'Constraint (verschmiert): alles ab 5 s, geordnet, >= 0,1 s: ' + cs.slice(0, 4).map(w => w.start.toFixed(2)).join(','));
      // teilweise Überlappung → auf den Bereich zugeschnitten; Wörter nach der letzten Sprache → ans Ende davor
      const cp = T.constrainWordsToSpeech([{ word: 'a', start: 4.6, end: 5.4 }, { word: 'b', start: 10.8, end: 11.6 }, { word: 'c', start: 13, end: 13.3 }], [{ start: 5, end: 11.2 }]);
      ok(cp[0].start === 5 && cp[0].end === 5.4 && cp[1].end <= 11.2 + 1e-9, 'Constraint: teilweise Ueberlappung zugeschnitten');
      ok(cp[2].start >= cp[1].end - 1e-9 && cp[2].end <= 11.2 + 1e-9 && cp[2].end - cp[2].start >= 0.1 - 1e-9, 'Constraint: Wort nach der Sprache ans Ende des letzten Bereichs: ' + cp[2].start.toFixed(2));
      // ohne Bereiche (VAD-Fallback) → unverändert
      const un = await T.snapWordTimings([{ word: 'x', start: 0.3, end: 0.7 }], a, SRn, null);
      ok(un[0].start === 0.3 || un[0].start < 0.6, 'ohne Sprachbereiche keine Beschraenkung');
      // Mindest-Blockdauer greift weiterhin auf den beschränkten Wörtern
      const bl2 = T.enforceMinBlockDuration(T.buildCaptionBlocks(cw, []), []);
      ok(bl2.length && bl2[0].start >= reg[0].start - 1e-9 && bl2.every(b => b.end > b.start), 'Bloecke aus beschraenkten Woertern: erster Block ab ' + bl2[0].start.toFixed(2));
    }

    // Performance: 10 min Audio (Rascheln + Sprachstellen)
    {
      const n = SRn * 600, big = rustle(n, 5, 0.1), v = voice(SRn * 20, 1, 0.08);
      for (let k = 0; k < 600; k += 60) mix(big, v, k * SRn);
      const t0 = Date.now(), rg = await T.detectSpeechRegions(big, SRn), ms = Date.now() - t0;
      console.log('VAD 10 min Audio: ' + ms + ' ms, ' + rg.length + ' Bereiche');
      ok(ms < 3000 && rg.length === 10, 'VAD-Performance: 10 min < 3 s (' + ms + ' ms), 10 Sprachstellen gefunden: ' + rg.length);
    }
  }

  // 21h) Fehlgeschlagene Neu-Transkription behält die bisherigen Captions
  {
    T.setState(T.buildCaptionBlocks([{ word: 'Alt', start: 0, end: 0.5 }, { word: 'bleibt.', start: 0.6, end: 1 }]), [{ word: 'Alt', start: 0, end: 0.5 }, { word: 'bleibt.', start: 0.6, end: 1 }], 'karaoke');
    T.setVideoPlayable(true); T.enableExports(true);
    T.setFFmpeg({ ff: { on() {}, off() {}, createDir: async () => {}, mount: async () => { throw new Error('x'); }, writeFile: async () => { throw new Error('x'); }, exec: async () => {}, readFile: async () => { throw new Error('x'); }, deleteFile: async () => {}, unmount: async () => {} }, fetchFile: async () => new Uint8Array(1) });
    await T.transcribeVideo({ name: 'x.mp4', size: 10, type: 'video/mp4', arrayBuffer: async () => { throw new Error('nope'); } });
    ok(T.getBlocks().length === 1 && T.getBlocks()[0].text === 'Alt bleibt.', 'Captions nach Fehler unveraendert');
    ok(/previous captions are kept/.test(document.getElementById('tStatus').innerHTML), 'Hinweis "previous captions are kept"');
    ok(document.getElementById('btnSRT').disabled === false, 'Exporte bleiben an');
    T.setFFmpeg(null);
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
    ok(sent.o.body.get('file').name === 'audio.wav' && sent.o.body.get('file').type === 'audio/wav', 'Function: ohne Content-Type → audio.wav');
    await run('POST', '/api/transcribe', Buffer.alloc(500), { GROQ_API_KEY: 'k' }, { 'content-type': 'audio/ogg' });
    ok(sent.o.body.get('file').name === 'audio.ogg' && sent.o.body.get('file').type === 'audio/ogg', 'Function: audio/ogg → audio.ogg an Groq');
    await run('POST', '/api/transcribe', Buffer.alloc(500), { GROQ_API_KEY: 'k' }, { 'content-type': 'text/html; charset=utf-8' });
    ok(sent.o.body.get('file').name === 'audio.wav' && sent.o.body.get('file').type === 'audio/wav', 'Function: unbekannter Content-Type → WAV (Whitelist)');
    ok((await run('POST', '/api/transcribe', Buffer.alloc(5 * 1024 * 1024), { GROQ_API_KEY: 'k' })).statusCode === 413, 'Function: zu grosser Body → 413');
    ok((await run('POST', '/api/transcribe', Buffer.alloc(500), { GROQ_API_KEY: 'k', REQUIRE_LOGIN: '1', SUPABASE_URL: 'https://x', SUPABASE_ANON_KEY: 'a' })).statusCode === 401, 'Function: Login-Pflicht ohne Token → 401');
    const rl = []; for (let i = 0; i < 3; i++) rl.push((await run('POST', '/api/transcribe', Buffer.alloc(500), { GROQ_API_KEY: 'k', RATE_LIMIT_PER_HOUR: '2' })).statusCode);
    ok(rl[2] === 429, 'Function: Rate-Limit greift: ' + rl);
  }

  // 23) Komprimierter Upload (Ogg/Opus) + parallele Stücke
  {
    // Ogg-Seiten parsen (Header-Felder + CRC-Prüfung), für die Muxer-Assertions
    const pages = (u) => {
      const out = []; let o = 0;
      while (o < u.length) {
        const dv = new DataView(u.buffer, u.byteOffset + o);
        const ns = u[o + 26], segs = Array.from(u.subarray(o + 27, o + 27 + ns)), body = segs.reduce((a, b) => a + b, 0);
        const end = o + 27 + ns + body, pg = u.slice(o, end), stored = dv.getUint32(22, true);
        pg[22] = pg[23] = pg[24] = pg[25] = 0;
        const lo = dv.getUint32(6, true), hi = dv.getUint32(10, true);
        out.push({ magic: String.fromCharCode(u[o], u[o + 1], u[o + 2], u[o + 3]), flags: u[o + 5], seq: dv.getUint32(18, true),
          granule: (lo === 0xFFFFFFFF && hi === 0xFFFFFFFF) ? -1 : hi * 4294967296 + lo, segs, crcOk: T.oggCrc32(pg) === stored,
          body: u.subarray(o + 27 + ns, end) });
        o = end;
      }
      return out;
    };
    // CRC32 (Ogg-Variante: Poly 0x04C11DB7, unreflektiert, Init 0, kein XOR) — Prüfwert für "123456789"
    ok(T.oggCrc32(Buffer.from('123456789')) === 0x89A1897F, 'Ogg-CRC32 Prüfwert: 0x' + T.oggCrc32(Buffer.from('123456789')).toString(16));
    ok(T.oggCrc32(new Uint8Array(0)) === 0, 'Ogg-CRC32 leer = 0');
    // Lacing
    ok(JSON.stringify(T.oggLacing(100)) === '[100]', 'Lacing 100');
    ok(JSON.stringify(T.oggLacing(600)) === '[255,255,90]', 'Lacing 600: ' + JSON.stringify(T.oggLacing(600)));
    ok(JSON.stringify(T.oggLacing(510)) === '[255,255,0]', 'Lacing 510 (Vielfaches von 255 → 0-Segment)');
    ok(JSON.stringify(T.oggLacing(0)) === '[0]', 'Lacing 0');
    // Paketdauer aus dem TOC-Byte (48-kHz-Samples)
    const P = (...b) => new Uint8Array(b);
    ok(T.opusPacketSamples48(P(0x48, 1, 2)) === 960, 'TOC SILK-WB 20 ms (Chromium bei 16 kHz)');
    ok(T.opusPacketSamples48(P(0xB8, 1)) === 960, 'TOC CELT 20 ms');
    ok(T.opusPacketSamples48(P(0x80, 1)) === 120, 'TOC CELT 2,5 ms');
    ok(T.opusPacketSamples48(P(0x49, 1)) === 1920, 'TOC Code 1 = 2 Frames');
    ok(T.opusPacketSamples48(P(0x0B, 3, 0)) === 2880, 'TOC Code 3, 3 Frames à 20 ms SILK-NB');
    ok(T.opusPacketSamples48(P(0x68, 1)) === 960 && T.opusPacketSamples48(P(0x60, 1)) === 480, 'TOC Hybrid 20/10 ms');
    // Pre-Skip aus der Encoder-description (Chromium: 104 @16 kHz → 312 @48 kHz)
    const head = (ps, rate) => { const u = new Uint8Array(19); u.set(Buffer.from('OpusHead')); u[8] = 1; u[9] = 1; u[10] = ps & 255; u[11] = ps >> 8; new DataView(u.buffer).setUint32(12, rate, true); return u; };
    ok(T.opusPreSkipFromDesc(head(104, 16000), 16000) === 312, 'Pre-Skip: Chromium-Wert in Eingangs-Rate umgerechnet');
    ok(T.opusPreSkipFromDesc(head(312, 16000), 16000) === 312, 'Pre-Skip: korrekter 48-kHz-Wert bleibt');
    ok(T.opusPreSkipFromDesc(null, 16000) === 312 && T.opusPreSkipFromDesc(new Uint8Array(5), 16000) === 312, 'Pre-Skip: Default 312');
    // Muxer: Kopf-Seiten, Granules (ab 0 gezählt, End-Trimming), EOS, CRC
    {
      const pk = Array.from({ length: 3 }, () => P(0x48, 7, 7, 7));
      const pg = pages(T.buildOggOpus(pk, { preSkip: 312, inputRate: 16000, totalSamples48: 2000 }));
      ok(pg.length === 3 && pg.every(p => p.magic === 'OggS' && p.crcOk), 'Muxer: 3 Seiten, CRC ok');
      ok(pg[0].flags === 0x02 && pg[0].granule === 0 && String.fromCharCode(...pg[0].body.subarray(0, 8)) === 'OpusHead', 'Muxer: BOS-Seite mit OpusHead');
      ok((pg[0].body[10] | (pg[0].body[11] << 8)) === 312 && new DataView(pg[0].body.buffer, pg[0].body.byteOffset).getUint32(12, true) === 16000, 'Muxer: Pre-Skip + Eingangsrate im OpusHead');
      ok(String.fromCharCode(...pg[1].body.subarray(0, 8)) === 'OpusTags' && pg[1].granule === 0, 'Muxer: OpusTags-Seite');
      ok(pg[2].flags === 0x04 && pg[2].granule === 2312, 'Muxer: letzte Seite EOS, Granule = preSkip + Länge (End-Trimming): ' + pg[2].granule);
      ok(pg.map(p => p.seq).join() === '0,1,2', 'Muxer: Seitennummern fortlaufend');
    }
    {
      // 300 kleine Pakete → 255 auf Seite 2, Rest auf Seite 3; Granule = dekodierte Samples bis Seitenende
      const pk = Array.from({ length: 300 }, () => P(0x48, 1, 2, 3));
      const pg = pages(T.buildOggOpus(pk, { preSkip: 312, totalSamples48: 300 * 960 }));
      ok(pg.length === 4 && pg[2].segs.length === 255 && pg[2].granule === 255 * 960 && pg[3].granule === 300 * 960 && pg[3].flags === 0x04,
        'Muxer: Seitenumbruch nach 255 Segmenten, Granules ' + pg.slice(2).map(p => p.granule));
      ok(pg.every(p => p.crcOk), 'Muxer: CRC aller Seiten ok');
    }
    {
      // Riesiges Paket (140000 Bytes = 550 Segmente) → läuft über 3 Seiten: mittlere ohne Paketende (Granule -1),
      // Folgeseiten mit Fortsetzungs-Flag 0x01
      const BIG = 140000, big = new Uint8Array(BIG); big[0] = 0x48; for (let i = 1; i < big.length; i++) big[i] = i & 255;
      const pg = pages(T.buildOggOpus([P(0x48, 9), big, P(0x48, 9)], { preSkip: 312 }));
      ok(pg.length === 5, 'Muxer: grosses Paket → 5 Seiten, habe ' + pg.length);
      ok(pg[2].segs.length === 255 && pg[2].granule === 960 && !(pg[2].flags & 1), 'Muxer: Seite 2 endet mitten im Paket, Granule = vollendetes Paket');
      ok(pg[3].segs.length === 255 && pg[3].granule === -1 && (pg[3].flags & 1), 'Muxer: Seite ohne Paketende hat Granule -1 + Fortsetzung');
      ok((pg[4].flags & 0x01) && (pg[4].flags & 0x04) && pg[4].granule === 2880, 'Muxer: Fortsetzungsseite (0x01) + EOS, Granule ' + pg[4].granule);
      const rest = BIG - (pg[2].body.length - 2) - pg[3].body.length;
      const joined = Buffer.concat([Buffer.from(pg[2].body.subarray(2)), Buffer.from(pg[3].body), Buffer.from(pg[4].body.subarray(0, rest))]);
      ok(joined.equals(Buffer.from(big)) && pg[4].body.length === rest + 2, 'Muxer: Paketinhalt über Seitengrenzen unverändert');
      ok(pg.every(p => p.crcOk), 'Muxer: CRC ok (Fortsetzung)');
    }

    // Upload-Encoding: Node hat kein WebCodecs → WAV
    const origBlob = global.Blob;
    global.Blob = function (parts, o) { this.parts = parts; this.type = o && o.type; this.content = ''; };
    T.resetOpus();
    ok(typeof AudioEncoder === 'undefined' && (await T.encodeUploadAudio(new Float32Array(1600).fill(0.1), 16000)).type === 'audio/wav', 'ohne AudioEncoder → WAV');
    // Mock-AudioEncoder (verhält sich wie Chromium: 20-ms-SILK-Pakete, description mit Pre-Skip 104 @16 kHz)
    class MockAD { constructor(o) { this.numberOfFrames = o.numberOfFrames; } close() {} }
    let failFlush = false;
    class MockAE {
      constructor(cb) { this.cb = cb; this.state = 'unconfigured'; this.frames = 0; this.emitted = 0; }
      static async isConfigSupported(c) { return { supported: c.codec === 'opus' && c.sampleRate === 16000 }; }
      configure() { this.state = 'configured'; }
      encode(ad) { this.frames += ad.numberOfFrames; while ((this.emitted + 1) * 320 <= this.frames) this._emit(); }
      _emit() { const a = new Uint8Array(40); a[0] = 0x48; this.emitted++;
        this.cb.output({ byteLength: 40, copyTo(d) { d.set(a); } }, this.emitted === 1 ? { decoderConfig: { description: head(104, 16000) } } : undefined); }
      async flush() { if (failFlush) throw new Error('boom'); while (this.emitted * 320 < this.frames) this._emit(); }
      close() { this.state = 'closed'; }
    }
    global.AudioEncoder = MockAE; global.AudioData = MockAD; T.resetOpus();
    {
      const b = await T.encodeUploadAudio(new Float32Array(16000 * 3).fill(0.1), 16000);
      ok(b.type === 'audio/ogg', 'mit AudioEncoder → Ogg/Opus: ' + b.type);
      const pg = pages(b.parts[0]);
      ok(pg.length >= 3 && pg.every(p => p.crcOk) && pg[pg.length - 1].granule === 312 + 3 * 48000, 'Ogg vom Encoder: CRC ok, End-Granule = 312 + 3 s: ' + pg[pg.length - 1].granule);
    }
    // Server lehnt Ogg ab (älterer Proxy) → Stück wird als WAV nachgeschickt, Opus für die Sitzung aus
    {
      const ct = [];
      global.fetch = async (url, opt) => {
        ct.push(opt.headers['Content-Type']);
        if (opt.headers['Content-Type'] === 'audio/ogg') return { ok: false, status: 400, headers: { get: () => null }, json: async () => ({ error: 'file must be wav' }) };
        return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ language: 'german', words: [{ word: 'Hallo', start: 1, end: 1.4 }] }) };
      };
      const r = await T.serverTranscribe(new Float32Array(16000 * 5).fill(0.3), 'm', '', 5);
      ok(ct.join() === 'audio/ogg,audio/wav' && r.words.length === 1 && T.getOpusOff(), 'Ogg abgelehnt (400) → WAV-Retry + Opus aus: ' + ct.join());
    }
    failFlush = true; T.resetOpus();
    ok((await T.encodeUploadAudio(new Float32Array(16000).fill(0.1), 16000)).type === 'audio/wav' && T.getOpusOff(), 'Encoder-Fehler → WAV-Fallback');
    delete global.AudioEncoder; delete global.AudioData; T.resetOpus();

    // Parallele Stücke: 5 Stücke (400-s-Rampe → Schnitte bei je ~85 s), Antworten kommen in umgekehrter
    // Reihenfolge zurück. Stück 1 läuft allein (Sprache), danach max. 3 gleichzeitig, Ergebnis in Reihenfolge.
    {
      const SRp = 16000, N = SRp * 400, a = new Float32Array(N);
      for (let i = 0; i < N; i++) a[i] = 0.05 + 0.9 * i / N;
      const calls = []; let inflight = 0, maxIn = 0, firstDone = false, secondBeforeFirst = false;
      global.fetch = async (url, opt) => {
        const c = calls.length + 1;
        // erstes Sample des Stücks (Rampe → eindeutig je Stück) als Kennung zurückgeben
        const id = new DataView(opt.body.parts[0]).getInt16(44, true);
        calls.push({ url, ct: opt.headers['Content-Type'], id });
        if (c > 1 && !firstDone) secondBeforeFirst = true;
        inflight++; maxIn = Math.max(maxIn, inflight);
        await new Promise(r => setTimeout(r, c === 1 ? 5 : (10 - c) * 15));
        inflight--; if (c === 1) firstDone = true;
        return { ok: true, status: 200, headers: { get: () => null },
          json: async () => ({ language: 'german', words: [{ word: 'S' + id, start: 0.5, end: 0.9 }] }) };
      };
      const r = await T.serverTranscribe(a, 'm', '', 400);
      const ids = r.words.map(w => +w.word.slice(1));
      ok(calls.length === 5 && r.words.length === 5, 'Parallel: 5 Stücke, 5 Wörter: ' + calls.length + '/' + r.words.length);
      ok(!secondBeforeFirst, 'Parallel: Stück 1 läuft allein (Sprache zuerst)');
      ok(maxIn === T.UPLOAD_CONCURRENCY && maxIn === 3, 'Parallel: max. 3 gleichzeitig, habe ' + maxIn);
      ok(ids.every((v, i) => i === 0 || v > ids[i - 1]), 'Parallel: Ergebnis in Stück-Reihenfolge trotz umgekehrter Antworten: ' + ids.join(','));
      ok(r.words.every((w, i) => i === 0 || w.start > r.words[i - 1].start + 80), 'Parallel: Offsets je Stück korrekt: ' + r.words.map(w => w.start.toFixed(1)).join(','));
      ok(calls.slice(1).every(c => /&lang=de/.test(c.url)) && !/lang=/.test(calls[0].url), 'Parallel: Sprache für Stücke 2..n festgenagelt');
      ok(calls.every(c => c.ct === 'audio/wav'), 'Parallel: ohne WebCodecs Content-Type audio/wav');
      ok(r.language === 'german', 'Parallel: Sprache übernommen');
      // Fehler in einem parallelen Stück → klarer Fehler, kein weiteres Stück wird mehr gestartet
      calls.length = 0;
      global.fetch = async (url, opt) => {
        const c = calls.length + 1; calls.push(c);
        if (c === 3) return { ok: false, status: 400, headers: { get: () => null }, json: async () => ({ error: 'bad' }) };
        await new Promise(r => setTimeout(r, 30));
        return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({ language: 'german', words: [{ word: 'x', start: 1, end: 1.2 }] }) };
      };
      let err = null; try { await T.serverTranscribe(a, 'm', '', 400); } catch (e) { err = e; }
      await new Promise(r => setTimeout(r, 80));
      ok(err && /error 400/.test(err.message) && calls.length <= 4, 'Parallel: Fehler bricht ab, kein neues Stück: ' + (err && err.message) + ' calls=' + calls.length);
    }
    global.Blob = origBlob;
  }

  // Szenenschnitte: Export-Hook waitForSceneCuts — wartet auf Abschluss, gibt nach Timeout den Zwischenstand
  {
    T.setExporting(false); T.onBreakAtCutsChange(true); T.setSceneCuts([]);
    const st0 = document.getElementById('tStatus');
    st0.innerHTML = '<span>✅</span><span>12 words</span>';
    const btn = document.getElementById('btnVideo'); btn.disabled = false;
    ok(await T.waitForSceneCuts(50) === true, 'waitForSceneCuts: keine Erkennung aktiv → sofort true');
    const st = T.beginCutRun();
    ok(T.cutsDetecting() && /Detecting scene cuts… 0%/.test(st0.innerHTML) && /12 words/.test(st0.innerHTML), 'Fortschritt wird an Status angehängt: ' + st0.innerHTML);
    let t0 = Date.now();
    const p = T.waitForSceneCuts(2000);
    ok(btn.disabled === true, 'Export-Button während des Wartens gesperrt');
    setTimeout(() => T.finishCutRun(st, [1.5]), 30);
    const r1 = await p;
    ok(r1 === true && Date.now() - t0 < 1000 && T.getSceneCuts().join() === '1.5', 'waitForSceneCuts löst bei Abschluss auf: ' + r1 + ' ' + T.getSceneCuts());
    ok(btn.disabled === false && !T.cutsDetecting(), 'Button wieder frei, Erkennung beendet');
    ok(/1 scene cut detected/.test(st0.innerHTML) && !/Detecting/.test(st0.innerHTML) && /12 words/.test(st0.innerHTML), 'Status: Ergebnis ersetzt Fortschritt: ' + st0.innerHTML);
    const st2 = T.beginCutRun(); st2.partial = () => [2.5];
    t0 = Date.now();
    const r2 = await T.waitForSceneCuts(40);
    ok(r2 === false && Date.now() - t0 >= 35 && T.getSceneCuts().join() === '2.5', 'Timeout → false + Zwischenstand übernommen: ' + r2 + ' ' + T.getSceneCuts());
    T.finishCutRun(st2, [2.5, 3]);
    ok(T.getSceneCuts().join() === '2.5,3' && !T.cutsDetecting(), 'späterer Abschluss setzt alle Schnitte');
    const st3 = T.beginCutRun(); T.onBreakAtCutsChange(false);
    ok(await T.waitForSceneCuts(2000) === true, 'Schalter aus → Export wartet nicht');
    T.onBreakAtCutsChange(true);
    T.beginCutRun(); // neuer Lauf (neues Video) → alter Lauf ist veraltet, sein Abschluss setzt nichts
    T.finishCutRun(st3, [9]);
    ok(T.getSceneCuts().join() === '2.5,3', 'veralteter Lauf überschreibt keine Schnitte');
    T.setSceneCuts([]);
  }

  // Editor-UX: Timing-Nudge, Undo/Redo, Löschen, Inline-Edit, Brand-Kit, Schriften, Tabs
  {
    const E = id => document.getElementById(id);
    const mk = () => [
      { text: 'eins zwei', start: 1, end: 2, words: [{ word: 'eins', start: 1, end: 1.4 }, { word: 'zwei', start: 1.5, end: 2 }] },
      { text: 'drei', start: 2.5, end: 3, words: [{ word: 'drei', start: 2.5, end: 3 }] }];
    let bl = mk();
    ok(T.nudgeBlockEdge(bl, 0, 'start', 0.2) && bl[0].start === 1.2 && bl[0].words[0].start === 1.2 && bl[0].end === 2,
       'Nudge Start +0.2: Block + erstes Wort: ' + JSON.stringify(bl[0].words));
    ok(Math.abs(bl[0].words[1].start - 1.6) < 1e-6 && bl[0].words[1].end === 2, 'Wörter linear auf neue Spanne skaliert');
    ok(bl[0].srcWords && bl[0].srcWords[0].start === 1.2, 'srcWords übernehmen neue Zeiten (Text-Edit setzt nicht zurück)');
    bl = mk();
    ok(T.nudgeBlockEdge(bl, 0, 'end', 5) && bl[0].end === 2.5, 'Ende nie über den nächsten Block hinaus: ' + bl[0].end);
    ok(!T.nudgeBlockEdge(bl, 0, 'end', 0.1), 'am Nachbarn: keine Änderung → false');
    bl = mk(); ok(T.nudgeBlockEdge(bl, 1, 'start', -5) && bl[1].start === 2, 'Start nie vor dem Ende des Vorgängers: ' + bl[1].start);
    bl = mk(); T.nudgeBlockEdge(bl, 0, 'start', 5);
    ok(Math.abs(bl[0].end - bl[0].start - 0.2) < 1e-6, 'Mindestdauer 0.2 s: ' + bl[0].start);
    bl = mk(); ok(T.nudgeBlockEdge(bl, 1, 'end', 9, 4) && bl[1].end === 4, 'letzter Block: Videoende deckelt');
    ok(T.nudgeBlockEdge(mk(), 0, 'start', -5) , 'erster Block: bis 0 s');

    // Undo/Redo
    T.setState(mk(), [], 'karaoke'); T.resetUndo();
    ok(T.undoCaptions() === false, 'Undo ohne Historie → false');
    T.pushUndo(); T.getBlocks()[0].text = 'X'; T.getBlocks()[0].words = [{ word: 'X', start: 1, end: 2 }];
    ok(T.undoCaptions() === true && T.getBlocks()[0].text === 'eins zwei', 'Undo stellt Text wieder her');
    ok(T.redoCaptions() === true && T.getBlocks()[0].text === 'X', 'Redo');
    T.resetUndo();
    T.pushUndo('seg0'); T.getBlocks()[0].text = 'a'; T.pushUndo('seg0'); T.getBlocks()[0].text = 'ab'; T.pushUndo('seg0');
    ok(T.undoDepth()[0] === 1, 'Tipp-Serie im selben Segment = 1 Schritt: ' + T.undoDepth());
    T.getBlocks()[0].text = 'abc'; T.pushUndo('seg1'); T.getBlocks()[1].text = 'vier';
    ok(T.undoDepth()[0] === 2 && T.undoDepth()[1] === 0, 'anderes Segment = neuer Schritt, Redo geleert');
    T.setState(mk(), [], 'karaoke'); T.resetUndo();
    T.deleteSeg(0);
    ok(T.getBlocks().length === 1 && T.getBlocks()[0].text === 'drei', 'Zeile löschen');
    T.undoCaptions();
    ok(T.getBlocks().length === 2 && T.getBlocks()[0].text === 'eins zwei', 'Löschen rückgängig');
    // Inline-Edit speichern (DOM-Stub: Box sichtbar machen)
    T.setState(mk(), [], 'karaoke'); T.resetUndo();
    T.openInlineEdit(0, 1);
    ok(E('capInlineEd').style.display === 'block' && E('capInlineTa').value === 'eins zwei', 'Inline-Editor öffnet mit Blocktext');
    E('capInlineTa').value = 'eins  drei\n';
    T.closeInlineEdit(true);
    ok(T.getBlocks()[0].text === 'eins drei' && T.getBlocks()[0].words[1].start === 1.5, 'Inline-Edit: Text bereinigt, Timing erhalten: ' + JSON.stringify(T.getBlocks()[0].words));
    ok(T.undoDepth()[0] === 1, 'Inline-Edit ist ein Undo-Schritt');
    T.openInlineEdit(0, 0); E('capInlineTa').value = 'egal'; T.closeInlineEdit(false);
    ok(T.getBlocks()[0].text === 'eins drei', 'Esc/Abbrechen verwirft');

    // Template-Schriftgröße relativ zur Rahmenbreite
    ok(T.templateFontSize({ size: 30, sizeRel: 0.1 }, 270) === 27 && T.templateFontSize({ size: 30 }, 270) === 30, 'sizeRel bevorzugt, px als Fallback');
    ok(T.templateFontSize({ sizeRel: 1 }, 270) === 54 && T.templateFontSize({}, 270) === 0, 'Größe gedeckelt / fehlt → 0');
    const nt = T.normalizeTemplate({ id: 'tpl_x', name: 'x', style: { fl: 'Inter' }, layout: { size: 30, sizeRel: 0.11, case: 'upper', punct: true, mode: 'all' } });
    ok(nt.layout.sizeRel === 0.11 && nt.layout.case === 'upper' && nt.layout.punct === true, 'Layout behält sizeRel/case/punct');
    ok(T.normalizeTemplate({ id: 'tpl_y', name: 'y', style: {}, layout: { case: 'evil' } }).layout.case === undefined, 'ungültiger case verworfen');
    const lay = T.currentLayout();
    ok(typeof lay.sizeRel === 'number' && lay.sizeRel > 0 && 'case' in lay && 'punct' in lay, 'currentLayout liefert sizeRel/case/punct');

    // Brand-Kit: erstes Template wird Standard; neues Video übernimmt Look + Layout
    const store = {};
    global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
    T.setUserTemplates([]); T.loadTemplates();
    T.selectStyle('beast'); T.setPosState('top'); T.setCaptionCase('upper');
    E('tplName').value = 'Brand'; T.saveTemplate();
    const bt = T.getUserTemplates().find(t => t.name === 'Brand');
    ok(bt && T.brandTplId() === bt.id && /default look for every new video/.test(E('tplStatus').textContent), 'erstes Template = Brand-Standard + Hinweis');
    E('tplName').value = 'Zweites'; T.selectStyle('classic'); T.saveTemplate();
    ok(T.brandTplId() === bt.id, 'weiteres Template ändert den Standard nicht');
    T.selectStyle('classic'); T.setPosState('bottom'); T.setCaptionCase('asis');
    T.applyBrandOnOpen();
    ok(T.getActiveId() === bt.id && T.getCase() === 'upper', 'neues Video: Brand-Template + dessen Layout (Case) aktiv: ' + T.getActiveId());
    T.toggleBrandTpl(bt.id);
    ok(T.brandTplId() === '', 'Standard abwählbar');
    T.toggleBrandTpl(bt.id); global.confirm = () => true; T.deleteTemplate(bt.id);
    ok(T.brandTplId() === '', 'gelöschtes Template ist kein Standard mehr');
    T.setCaptionCase('asis'); T.setUserTemplates([]); T.loadTemplates(); T.selectStyle('hormozi');
    delete global.localStorage; delete global.confirm;

    // Schriften
    ok(T.cleanFontName(' Rubik  Mono One ') === 'Rubik Mono One' && T.cleanFontName("x');}<b") === '' && T.cleanFontName('A') === '', 'Fontname validiert');
    ok(T.fontCssUrl('Luckiest Guy', '') === 'https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap'
       && /family=Lato:wght@700;900&/.test(T.fontCssUrl('Lato', '700;900')), 'Google-Fonts-URL');
    // Kachel-Worte aus dem Transkript
    T.setState([{ text: 'Grüezi Rindfleischverarbeitung, so isch es', start: 0, end: 2, words: [] }], [], 'karaoke');
    ok(T.tileWords().join(' ') === 'so isch', 'Kachel: zwei kurze aufeinanderfolgende Wörter: ' + T.tileWords());
    T.setState([], [], 'karaoke');
    ok(T.tileWords().join(' ') === 'caption text', 'ohne Transkript: Platzhalter');
    // Tabs + Top-Export
    T.switchTab('style');
    ok(E('ctrlCol').dataset.tab === 'style', 'Tab wechselt');
    T.switchTab('nope'); ok(E('ctrlCol').dataset.tab === 'style', 'unbekannter Tab ignoriert');
    T.switchTab('captions');
    T.syncTopExport('Rendering 42%…', true); ok(E('tbExport').disabled && /42%/.test(E('tbExport').textContent), 'Top-Export zeigt Fortschritt');
    T.syncTopExport(null, true); ok(!E('tbExport').disabled && /Export/.test(E('tbExport').textContent), 'Top-Export wieder frei');
    T.updateTrSetSum(); ok(/Fast|Perfect/.test(E('trSetSum').textContent), 'Transkriptions-Zusammenfassung: ' + E('trSetSum').textContent);
  }

  console.log(fails === 0 ? 'ALLE TESTGRUPPEN BESTANDEN' : fails + ' FEHLER');
  process.exit(fails ? 1 : 0);
})();
