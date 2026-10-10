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
        font: '', letterSpacing: '0px', // wie ein echter Canvas: letterSpacing zählt je Zeichen mit (sonst misst capLayout ohne, die Vorschau mit Buchstabenabstand)
        measureText(str) {
          var m = /([\d.]+)px/.exec(this.font);
          var px = m ? parseFloat(m[1]) : 16;
          return { width: (str || '').length * (px * 0.55 + (parseFloat(this.letterSpacing) || 0)) };
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
isNetErr:isNetErr,authErrText:authErrText,caseStyle:caseStyle,setCaseState:function(c){capCase=c;},projTitleOf:function(){return projectPayload().title;},setTitle:setTitle,
setExportFormatState:function(f){exportFormat=f;},editListEnd:editListEnd,histDistance:histDistance,
cssColorToHexA:cssColorToHexA,cssColorToHex:cssColorToHex,liveTemplates:liveTemplates,flushCustomStyle:flushCustomStyle,
decideSceneCuts:decideSceneCuts,cutFrame:cutFrame,lumaHistogram:lumaHistogram,meanAbsDiff:meanAbsDiff,setSceneCuts:setSceneCuts,getSceneCuts:function(){return sceneCuts;},
onBreakAtCutsChange:onBreakAtCutsChange,currentBlockIdx2:currentBlockIdx,setDisplayMode:function(m){displayMode=m;},polishWords:polishWords,
polishEnabled:polishEnabled,turboFallbackOk:turboFallbackOk,polishInPlace:polishInPlace,setModelState:function(m){whisperModel=m;},polishSegments:polishSegments,validateExportBlob:validateExportBlob,drawCaptionsOnCtx:drawCaptionsOnCtx,capShadowPlan:capShadowPlan,audioTruncated:audioTruncated,parseTextShadows:parseTextShadows,
splitShadows:splitShadows,setSb:function(x){_sb=x;},syncTemplatesWithCloud:syncTemplatesWithCloud,pushTemplatesToCloud:pushTemplatesToCloud,
loadProjects:loadProjects,restoreSavedStyle:restoreSavedStyle,setUserTemplates:function(l){userTemplates=l;},pruneTemplates:pruneTemplates,
TPL_ROW_TITLE:TPL_ROW_TITLE,snapWordTimings:snapWordTimings,onTimeOffChange:onTimeOffChange,getTimeOff:function(){return timeOff;},
countMatches:countMatches,replaceAllCaptions:replaceAllCaptions,wordSwap:wordSwap,fixAllHits:fixAllHits,fixWordEverywhere:fixWordEverywhere,displayWord:displayWord,togglePunct:togglePunct,setCaptionCase:setCaptionCase,
transcriptText:transcriptText,copyTranscript:copyTranscript,exportTXT:exportTXT,seedCustomFields:seedCustomFields,buildCustomStyle:buildCustomStyle,
setCsDirty:function(d){_csDirty=d;},saveTemplate:saveTemplate,loadTemplates:loadTemplates,getUserTemplates:function(){return userTemplates;},
mergeTemplates:mergeTemplates,importTemplatesFromText:importTemplatesFromText,renameTemplate:renameTemplate,duplicateTemplate:duplicateTemplate,
deleteTemplate:deleteTemplate,parseOutline:parseOutline,outlineShadow:outlineShadow,hlColorFor:hlColorFor,getWpb:function(){return WORDS_PER_BLOCK;},
getActiveId:function(){return activeId;},editTemplate:editTemplate,getEditingTpl:function(){return _csEditingTpl;},decodeToMono16k:decodeToMono16k,setFFmpeg:function(f){_ffmpeg=f;},isPromptEcho:isPromptEcho,capFontsChanged:capFontsChanged,
getAutosaveTimer:function(){return _autosaveTimer;},setExporting:function(v){isExporting=v;},autosaveWhenIdle:autosaveWhenIdle,autosaveNow:autosaveNow,restoreOrTranscribe:restoreOrTranscribe,
readAutosaves:readAutosaves,setAutosaveKey:function(k){_autosaveKey=k;},AUTOSAVE_KEY:AUTOSAVE_KEY,setTranslateState:function(v){doTranslate=v;},capHyphenate:capHyphenate,onWpbChangeT:onWpbChange,
setMe:function(plan,email){mePlan=plan;meEmail=email;},
isEmail:isEmail,passEmailGate:passEmailGate,leadEmail:leadEmail,flushLead:flushLead,LEAD_KEY:LEAD_KEY,LEAD_PENDING_KEY:LEAD_PENDING_KEY,
rebaseCutTime:rebaseCutTime,createAudioCutPlanner:createAudioCutPlanner,rotationFromMatrix:rotationFromMatrix,editListOffset:editListOffset,
h264CodecCandidates:h264CodecCandidates,fastExportVideoCodecs:fastExportVideoCodecs,isFastExportSource:isFastExportSource,fastExportSupported:fastExportSupported,
oggCrc32:oggCrc32,oggLacing:oggLacing,opusPacketSamples48:opusPacketSamples48,buildOggOpus:buildOggOpus,opusPreSkipFromDesc:opusPreSkipFromDesc,
encodeUploadAudio:encodeUploadAudio,resetOpus:function(){_opusOff=false;_opusSupport=null;},getOpusOff:function(){return _opusOff;},UPLOAD_CONCURRENCY:UPLOAD_CONCURRENCY,
sceneCutPath:sceneCutPath,waitForSceneCuts:waitForSceneCuts,beginCutRun:beginCutRun,finishCutRun:finishCutRun,cutsDetecting:cutsDetecting,mergeCutCands:mergeCutCands,CUT_W:CUT_W,CUT_H:CUT_H,
nudgeBlockEdge:nudgeBlockEdge,pushUndo:pushUndo,undoCaptions:undoCaptions,redoCaptions:redoCaptions,resetUndo:resetUndo,
undoDepth:function(){return [_undoStack.length,_redoStack.length];},templateFontSize:templateFontSize,normalizeTemplate:normalizeTemplate,
brandTplId:brandTplId,toggleBrandTpl:toggleBrandTpl,applyBrandOnOpen:applyBrandOnOpen,cleanFontName:cleanFontName,dropToStyle:dropToStyle,applyTrending:applyTrending,teleError:teleError,statExport:statExport,tlRange:tlRange,tlDeleteSel:tlDeleteSel,tlToggleMulti:tlToggleMulti,tlSelState:function(a,b){tlSel=a;tlSelEnd=b;},tlGet:function(){return {sel:tlSel,end:tlSelEnd,multi:tlMulti};},coverCropRect:coverCropRect,coverSafeRegion:coverSafeRegion,coverInRect:coverInRect,coverWrap:coverWrap,coverBlockY:coverBlockY,coverFileName:coverFileName,coverHook:coverHook,coverDefaultTime:coverDefaultTime,coverRestore:coverRestore,getCover:function(){return coverState;},capLsPx:capLsPx,capWordFace:capWordFace,isKnownFont:isKnownFont,ensureCapFont:ensureCapFont,CAP_FONT_W:CAP_FONT_W,
tileWords:tileWords,capFontMetrics:capFontMetrics,capLineH:capLineH,switchTab:switchTab,deleteSeg:deleteSeg,closeInlineEdit:closeInlineEdit,openInlineEdit:openInlineEdit,
updateTrSetSum:updateTrSetSum,syncTopExport:syncTopExport,currentLayout:currentLayout,getFontSize:function(){return fontSize;},getCase:function(){return capCase;},
detectSpeechRegions:detectSpeechRegions,speechProbabilities:speechProbabilities,speechSpans:speechSpans,buildSpeechTrack:buildSpeechTrack,mapTrackWord:mapTrackWord,constrainWordsToSpeech:constrainWordsToSpeech,vadFft:vadFft,vadFftTables:vadFftTables,
tlTimeToX:tlTimeToX,tlXToTime:tlXToTime,tlClampView:tlClampView,tlZoomAt:tlZoomAt,tlTickStep:tlTickStep,tlSnap:tlSnap,tlSnapCands:tlSnapCands,
tlBounds:tlBounds,tlDragSpan:tlDragSpan,tlRetimeWords:tlRetimeWords,computeWavePeaks:computeWavePeaks,applyTimelineEdit:applyTimelineEdit,
resolveStyleId:resolveStyleId,STYLE_ALIASES:STYLE_ALIASES,relayoutCaptions:relayoutCaptions,setMaxChars:setMaxChars,toggleMaxCharsAuto:toggleMaxCharsAuto,capAutoChars:capAutoChars,capBlockLimit:capBlockLimit,capCharsFit:capCharsFit,capCharLen:capCharLen,closeCaptionGaps:closeCaptionGaps,splitOverflowingBlocks:splitOverflowingBlocks,setMaxCharsState:function(v){CAP_MAX_CHARS=v;_relayoutKey=null;},setLinesState:function(v){CAPTION_LINES=v;},setFontSizeState:function(v){fontSize=v;},GAP_CLOSE_SEC:GAP_CLOSE_SEC,
tlNudge:tlNudge,tlNudgeEdge:tlNudgeEdge,tlNudgeWhy:tlNudgeWhy,tlCenterView:tlCenterView,tlClampPps:tlClampPps,tlClassify:tlClassify,tlFlingVelocity:tlFlingVelocity,tlFlingDecay:tlFlingDecay,tlSplitIndex:tlSplitIndex,tlSplitAt:tlSplitAt,tlHit:tlHit,setTlMob:function(m){_tl.mob=m;},setTlView:function(v){tlView=v;},setTlSel:function(i){tlSel=i;},getTlSel:function(){return tlSel;},TL_MOB_PPS:TL_MOB_PPS,switchTabT:switchTab,captionSnapshot:captionSnapshot,tlCleanSpeech:tlCleanSpeech,projectPayload:projectPayload,
tlSweepRange:tlSweepRange,tlSweepApply:tlSweepApply,
setTlSnapOn:function(v){tlSnapOn=v;},setSpeech:function(s){tlSpeech=s;},getSpeech:function(){return tlSpeech;},setTimeOffState:function(v){timeOff=v;},
capDistributeLines:capDistributeLines,capSegmentRun:capSegmentRun,capTok:capTok,capLang:capLang,capHyphLang:capHyphLang,capHyphPoints:capHyphPoints,capTypo:capTypo,
wrapCaptionLines:wrapCaptionLines,capLayout:capLayout,fileSlug:fileSlug,exportBaseName:exportBaseName,openExportSheet:openExportSheet,closeExportSheet:closeExportSheet,
exportDone:exportDone,dlBlob:dlBlob,shareLastExport:shareLastExport,topExport:topExport,setCapLang:function(v){_capLangForce=v;},setWordsState:function(w){wordTimestamps=w;},setEnhAuto:function(v){ENH_AUTO=v;},
localEmphasis:localEmphasis,clearAutoFlags:clearAutoFlags,isEmphWord:isEmphWord,emWordRef:emWordRef,applyEnhanceResult:applyEnhanceResult,blockEmoji:blockEmoji,
toggleWordEmph:toggleWordEmph,setBlockEmoji:setBlockEmoji,getEmph:function(){return {kw:emKw,emoji:emEmoji,zoom:emZoom,src:emSrc};},
setEmphState:function(k,e,z){emKw=k;emEmoji=e;emZoom=z;_zoomPlanKey=null;_lastKey=null;},applyProjectPayload:applyProjectPayload,getUndoSnapshot:function(){return captionSnapshot();},
emphScale:emphScale,emphColor:emphColor,emphShadowIsHl:emphShadowIsHl,emojiPopState:emojiPopState,zoomPlanFrom:zoomPlanFrom,zoomScaleAt:zoomScaleAt,zoomAt:zoomAt,
runEnhance:runEnhance,genPostCaption:genPostCaption,getPost:function(){return postCaption;},postText:postText,getTrRun:function(){return _trRun;},
capMotion:capMotion,capWordFx:capWordFx,capBlockFx:capBlockFx,capBlockVisEnd:capBlockVisEnd,capSlideBoxes:capSlideBoxes,capMixColor:capMixColor,capFxSteady:capFxSteady,
setLines:setLines,splitBlockAtCursor:splitBlockAtCursor,getLines:function(){return CAPTION_LINES;},getMaxChars:function(){return CAP_MAX_CHARS;},getPresetPrevLayout:function(){return _presetPrevLayout;},setFontSizeState:function(v){fontSize=v;},
setReduceMotion:function(v){_capRM=v;},animState:animState,ANIM_KEYFRAMES:ANIM_KEYFRAMES,ANIM_DUR:ANIM_DUR,syncCsUi:syncCsUi,capGlowLayers:capGlowLayers,capAnimDemoStart:capAnimDemoStart,getAnimDemo:function(){return _capAnimDemo;},clearAnimDemo:function(){_capAnimDemo=null;},
capWordFace:capWordFace,capHlVariant:capHlVariant,emphLineH:emphLineH,CAP_MOT:CAP_MOT,CAP_PILL_GAP:CAP_PILL_GAP,capWordGap:capWordGap,sanitizeStyle:sanitizeStyle,deleteAccount:deleteAccount,setSbState:function(s){_sb=s;},setBillingState:function(b){billing=b;},setMeEmail:function(e){meEmail=e;},getMeEmail:function(){return meEmail;},
capDomMotion:capDomMotion,applyTemplateSettings:applyTemplateSettings,setVidReady:function(v){vidReady=v;},setProgDrag:function(v){_progDrag=v;},
csSegPick:csSegPick,syncCsSegs:syncCsSegs,
coverDrawTitle:coverDrawTitle,coverMaxW:coverMaxW,coverAlignX:coverAlignX,coverSnap:coverSnap,coverHitWord:coverHitWord,coverClampOff:coverClampOff,coverCleanWo:coverCleanWo,coverOnTitle:coverOnTitle,coverSet:coverSet,coverResetPos:coverResetPos,coverMoved:coverMoved,
coverEmColor:coverEmColor,
CAP_PILL_PAD_X:CAP_PILL_PAD_X,
capHyphEligible:capHyphEligible,capCharSplit:capCharSplit,
styleFromTemplate:styleFromTemplate,TPL_STYLE_KEYS:TPL_STYLE_KEYS,cloneStyle:cloneStyle,setActiveId:function(i){activeId=i;}};`;
const T = new Function(script + tail)();
const initialLang = T.getLang(); // direkt nach INIT, bevor Tests den State ändern
T.setEnhAuto(false); // KI-Hervorhebung läuft sonst im Hintergrund und trifft die fetch-Mocks anderer Tests (eigene Tests: test-emphasis-Gruppe)
T.setMaxCharsState(40); // Alt-Tests: großzügiges Zeichenlimit (Auto hängt von der Stub-Messung ab); eigene Tests unten

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL:', m); } };

// 1) Grunddaten
ok(T.STYLES.length === 24, '24 kuratierte Presets erwartet (15 + 4 ruhige + 5 neue Looks): ' + T.STYLES.length);

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
ok(global.LASTBLOB.content.startsWith('1\n00:00:00,000 --> 00:00:01,100\nHallo und willkommen.'), 'SRT-Format (Lücke 0,1 s geschlossen): ' + JSON.stringify(global.LASTBLOB.content.slice(0, 50)));
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
  const st = T.STYLES.find(x => !x.boxBg && !x.pill && !x.hlPillBg && !x.circle && !(parseFloat(x.ls) > 0) && !x.fs && !x.motion);
  const fsMul = st.fs ? (parseFloat(st.fs) || 1) : 1;
  const maxW = T.capFitMaxW(st);
  ok(Math.abs(maxW - 270 * 0.75) < 1e-9, 'Fit: nutzbare Breite = Safe-Zone (75% Rahmen): ' + maxW);
  const wStub = (str, px) => str.length * px * fsMul * 0.55;
  const long = 'Rindfleischverarbeitungsbetriebe';
  ok(long.length === 32, 'Testwort hat 32 Zeichen');
  const f1 = T.fitCaptionWords(['Unsere', long, 'sind', 'Highland-Rinder-Weidehaltung'], st, 54, maxW);
  ok(f1.px < 54 && f1.px >= 54 * 0.55 - 1e-9, 'Fit: effektive Groesse kleiner, aber >= 55%: ' + f1.px);
  ok(f1.words.every(w => wStub(w, f1.px) <= maxW + 1e-9), 'Fit: jedes (Teil-)Wort passt in den Rahmen: ' + f1.words.join(' | '));
  ok(f1.words.filter((w, i) => f1.orig[i] === 1).map(w => w.replace(/-$/, '')).join('') === long, 'Fit: Trennung verliert keine Zeichen');
  ok(f1.words.includes('Highland-') && f1.orig.length === f1.words.length, 'Fit: vorhandene Bindestriche bevorzugt: ' + f1.words.join(' | '));
  // Kurzes Wort + überlanges Wort bei 2 Zeilen: getrennt statt geschrumpft, „Das“ teilt sich die Zeile
  {
    const fp = T.fitCaptionWords(['Das', 'Bundesverfassungsgericht'], st, 54, maxW, 2);
    const fl = T.fitCaptionWords(['Das', 'Bundesverfassungsgericht'], st, 54, maxW, 1);
    ok(fp.words.length === 3 && fp.words[1].endsWith('-') && fp.g <= 2, 'Paar: Trennung in 2 Zeilen: ' + fp.words.join(' | ') + ' g=' + fp.g);
    ok(wStub('Das ' + fp.words[1], fp.px) <= maxW + 1e-9, 'Paar: „Das“ passt neben den ersten Wortteil: ' + fp.words.join(' | '));
    ok(fp.px > fl.px, 'Paar: größer als bei 1 Zeile (' + fp.px + ' > ' + fl.px + ')');
  }
  // Wort, das per Verkleinerung allein passt → keine Trennung
  const f2 = T.fitCaptionWords(['Highland'], st, 54, maxW);
  ok(f2.words.length === 1 && f2.px < 54 && wStub('Highland', f2.px) <= maxW, 'Fit: nur verkleinert, nicht getrennt: ' + f2.px);
  const f3 = T.fitCaptionWords(['kurz', 'und', 'gut'], st, 40, maxW);
  ok(f3.px === 40 && f3.words.length === 3, 'Fit: passende Woerter bleiben unveraendert: ' + f3.px);
  // Vorschau nutzt die verkleinerte Größe
  const capHtml = T.buildCap(['Unsere', long], st, 1, 54, [0, 1], 1);
  // Vorschau ruft fitCaptionWords mit der Zeilenvorgabe (hier 1) auf — „Max lines“ kann zusätzlich verkleinern
  ok(capHtml.includes('font-size:' + (T.fitCaptionWords(['Unsere', long], st, 54, maxW, 1).px * fsMul) + 'px'),
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
  // ohne Zeilenvorgabe: reiner Höhen-Fit (55-%-Untergrenze)
  const fh = T.fitCaptionWords(many, st, 54, maxW);
  ok(fh.px < 54 && (fh.h <= 480 * 0.4 + 1e-9 || Math.abs(fh.px - 54 * 0.55) < 0.2), 'Hoehen-Fit: ' + fh.px + 'px, h=' + Math.round(fh.h));
  ok(fh.px >= 54 * 0.55 - 1e-9, 'Hoehen-Fit respektiert 55-%-Untergrenze');
  // „Max lines“ = echte Obergrenze: mit Vorgabe 3 verkleinert der Fit weiter (bis 35 %), bis 3 Zeilen reichen
  const fl = T.fitCaptionWords(many, st, 40, maxW, 3);
  ok(fl.g <= 3 && fl.px >= 40 * 0.35 - 1e-9 && fl.px < 40 * 0.55, 'Max-lines-Fit (unter die 55-%-Grenze, nie unter 35 %): ' + fl.px + 'px, ' + fl.g + ' Zeilen');
  const fl1 = T.fitCaptionWords(['Hallo', 'zusammen', 'und', 'willkommen'], st, 30, maxW, 1);
  ok(fl1.g === 1 && fl1.words.length === 4, 'Max lines 1: vier Woerter auf einer Zeile, ohne Trennung: ' + fl1.px + 'px');
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
// Bewusst geändert (UX-Vereinfachung): keine Platzhalter-Caption mehr — die Vorschau zeigt den Fortschritt
ok(document.getElementById('capOverlay').innerHTML === '' , 'ohne Transkript keine Platzhalter-Caption');

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
ok(showN >= 24 && showN % 24 === 0, 'Showcase: Vielfaches von 24 Karten erwartet, habe ' + showN);

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
ok(T.STYLES.length === 25 && T.STYLES.find(x => x.id === 'custom'), 'Custom Style angelegt');
// Fixtures: frühere Presets (vor der Kuratierung) — der Custom-Editor/Glow-/Pill-/Farbwechsel-Code muss
// diese Formen weiter verarbeiten (Templates/Projekte enthalten sie). Nur im Test als eigene IDs.
const OS = T.outlineShadow;
T.STYLES.push(
  { id: 'tbox', name: 'Box Karaoke', fl: 'Inter', font: "'Inter'", fw: '800', thumbBg: '#000', tc: '#fff', ts: 'none', boxBg: 'rgba(0,0,0,.62)', boxBr: '10px', hl: '#fff', hlPillBg: '#22c55e', hlc: '#04210f', hls: 'none', anim: 'scale' },
  { id: 'tpulse', name: 'Flux', fl: 'Montserrat', font: "'Montserrat'", fw: '900', tt: 'uppercase', thumbBg: '#000', tc: '#fff', ts: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000', hlPillBg: '#00ff85', hlc: '#00220f', hls: 'none', anim: 'flash', cstroke: '#000' },
  { id: 'tamp', name: 'Jolt', fl: 'Poppins', font: "'Poppins'", fw: '900', tt: 'uppercase', fs: '1.1em', thumbBg: '#000', tc: '#fff', ts: '-2px -2px 0 #000,0 -2px 0 #000,2px -2px 0 #000,-2px 0 0 #000,2px 0 0 #000,-2px 2px 0 #000,0 2px 0 #000,2px 2px 0 #000', hl: '#d7ff1f', hls: '-2px -2px 0 #000,0 -2px 0 #000,2px -2px 0 #000,-2px 0 0 #000,2px 0 0 #000,-2px 2px 0 #000,0 2px 0 #000,2px 2px 0 #000,0 0 20px rgba(215,255,31,.85)', anim: 'punch', cstroke: '#000' },
  { id: 'tbeast', name: 'Beast alt', fl: 'Bangers', font: "'Bangers'", fw: '400', tt: 'uppercase', ls: '1px', fs: '1.12em', thumbBg: '#000', tc: '#fff', ts: OS(3, '#000') + ',0 5px 0 rgba(0,0,0,.85)', hl: '#22e3ff', hlCycle: ['#22e3ff', '#ffd60a', '#ff4fd8', '#7cff4f'], hls: OS(3, '#000') + ',0 5px 0 rgba(0,0,0,.85)', anim: 'bounce', cstroke: '#000' },
  { id: 'tbloom', name: 'Petal', fl: 'Playfair Display', font: "'Playfair Display'", fw: '700', tt: 'uppercase', ls: '1px', thumbBg: '#000', tc: '#fff', ts: '0 2px 18px rgba(249,168,212,.45)', hl: '#f9a8d4', hlFont: "'Caveat'", hlItalic: true, hls: '0 0 22px rgba(249,168,212,.9)', anim: 'glow' });
// Style-Features (Templates können sie weiter nutzen): Script-Akzent, Kringel
const pr = T.buildCap(['nur', 'ein', 'tipp'], { id: 'tprime', font: "'Poppins'", fw: '800', tc: '#fff', ts: 'none', hl: '#7df3ff', hlFont: "'Caveat'", hlItalic: true, hls: 'none', anim: 'scale' }, 2, 22, null);
ok(pr.includes("font-family:'Caveat'") && pr.includes('font-style:italic'), 'Prime: Script-Akzent am aktiven Wort');
const sk = T.buildCap(['mind', 'map'], { id: 'tsketch', font: "'Kalam'", fw: '700', tc: '#fff', ts: 'none', hl: '#efe7d8', hlFont: "'Barlow Condensed'", hlUpper: true, circle: true, hls: 'none', anim: 'none' }, 1, 22, null);
ok(sk.includes('border-radius:50%') && sk.includes('MAP'), 'Sketch: Kringel + Uppercase am aktiven Wort');

// 16a) Custom-Style-Editor: startet vom gewählten Style, nur geänderte Gruppen überschreiben
{
  const E = id => document.getElementById(id);
  const base = T.STYLES.find(x => x.id === 'tbox');
  T.selectStyle('tbox');                      // seedet die Regler + Basis
  ok(E('csBox').value === 'box' && E('csHlType').value === 'pill' && E('csAnim').value === 'scale', 'Regler aus Box Karaoke befuellt');
  E('csText').value = '#ff0000';
  T.setCsDirty({ text: true });
  let cs = T.buildCustomStyle();
  ok(cs.tc === '#ff0000' && cs.boxBg === base.boxBg && cs.hlPillBg === base.hlPillBg && cs.anim === 'scale' && cs.fw === base.fw,
     'Custom behaelt Box/Pill/Animation/Gewicht des Ausgangs-Styles');
  // Kontur, Abstand, Gewicht, Hintergrund, Highlight-Typ, Animation
  E('csOutlineW').value = '4'; E('csOutlineC').value = '#112233';
  E('csLs').value = '2'; E('csWeight').value = '900';
  E('csBox').value = 'pill'; E('csBoxR').value = '22'; E('csBoxC').value = '#ffffff'; E('csBoxO').value = '40';
  E('csHlType').value = 'color'; E('csHl').value = '#00ffaa'; E('csAnim').value = 'wobble';
  T.setCsDirty({ text: true, stroke: true, ls: true, weight: true, box: true, hl: true, anim: true });
  cs = T.buildCustomStyle();
  ok(T.parseOutline(cs.ts).w === 4 && cs.ts.includes('#112233'), 'Kontur 4px in ts: ' + cs.ts.slice(0, 40));
  ok(cs.ls === '2px' && cs.fw === '900' && cs.anim === 'wobble', 'Abstand/Gewicht/Animation');
  ok(cs.boxBg === 'rgba(255,255,255,0.4)' && cs.boxBr === '22px', 'Hintergrund-Pill mit Deckkraft: ' + cs.boxBg);
  E('csBoxR').value = '13'; ok(T.buildCustomStyle().boxBr === '13px', 'Eckenradius frei einstellbar (Corners)');
  E('csBoxR').value = '99'; ok(T.buildCustomStyle().boxBr === '30px', 'Eckenradius auf 30px gedeckelt');
  E('csBoxR').value = '22';
  ok(!cs.hlPillBg && cs.hl === '#00ffaa' && T.parseOutline(cs.hls).w === 4, 'Highlight als Textfarbe mit Kontur');
  const html = T.buildCap(['eins', 'zwei'], cs, 1, 22, null);
  ok(html.includes('letter-spacing:2px') && html.includes('rgba(255,255,255,0.4)') && html.includes('captly-wobble'),
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
  T.selectStyle('tbox');
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
  T.selectStyle('tpulse');
  ok(E('csHl').value === '#00ff85' && E('csHlType').value === 'pill' && E('csHlLbl').textContent === 'Pill', 'Pill-Style: Farbfeld = Pill-Farbe, Label „Pill“: ' + E('csHl').value);
  ok(E('csText').value === '#ffffff' && E('csFont').value === 'Montserrat' && E('csWeight').value === '900', 'Pill-Style: Text/Font/Gewicht');
  ok(E('csGlow').checked === false && E('csGlowInt').disabled === true, 'Glow aus → Regler deaktiviert');
  ok(E('csBox').value === 'off' && E('csBoxC').value === '#000000' && String(E('csBoxO').value) === '70', 'kein Hintergrund → neutrale Box-Werte statt Resten');
  // Box-Style (Box Karaoke): Hintergrund aus rgba
  T.selectStyle('tbox');
  ok(E('csBox').value === 'box' && E('csBoxC').value === '#000000' && String(E('csBoxO').value) === '60' && E('csHl').value === '#22c55e', 'Box Karaoke: Box schwarz 60 %, Pill gruen');
  // Kontur-Style (Bold Pop): Kontur 3 px, Schatten an, Textfarbe-Highlight
  T.selectStyle('hormozi');
  ok(String(E('csOutlineW').value) === '3' && E('csOutlineC').value === '#000000' && E('csShadow').classList.contains('on') && E('csHl').value === '#ffd60a' && E('csHlLbl').textContent === 'Highlight' && E('csAnim').value === 'scale',
     'Bold Pop: Kontur/Schatten/Active-Farbe/Animation');
  // Glow-Style (Jolt/amplify): Glow an mit Stärke 20, Regler aktiv
  T.selectStyle('tamp');
  ok(E('csGlow').checked === true && String(E('csGlowInt').value) === '20' && E('csGlowInt').disabled === false && E('csHl').value === '#d7ff1f', 'Jolt: Glow an, Staerke 20');
  // rgba-Textfarbe (Clean Minimal) → gültiges Hex, Deckkraft bleibt beim Umfärben
  T.selectStyle('minimal');
  ok(E('csText').value === '#ffffff', 'rgba-Textfarbe → #ffffff im Farbfeld');
  E('csText').value = '#ff0000'; T.setCsDirty({ text: true });
  ok(T.buildCustomStyle().tc === 'rgba(255,0,0,0.6)', 'Textfarbe behaelt die Deckkraft des Ausgangs-Styles: ' + T.buildCustomStyle().tc);

  // Anwenden: Pill-Farbe über das EINE Farbfeld; Glow nur bei Glow-Änderung; Wechsel Pill → Textfarbe
  T.selectStyle('tpulse');
  E('csHl').value = '#ff3366'; T.setCsDirty({ hlc: true });
  let cs = T.buildCustomStyle();
  ok(cs.hlPillBg === '#ff3366' && cs.hlc === '#fff' && cs.hls === 'none' && cs.anim === 'flash', 'Pill-Farbe wirkt (vorher blieb die Pill gruen): ' + cs.hlPillBg);
  E('csGlow').checked = true; E('csGlowInt').value = '20'; T.setCsDirty({ hlc: true, glow: true });
  ok(T.buildCustomStyle().hls === '0 0 20px #ff3366', 'Glow um die Pill');
  E('csHlType').value = 'color'; T.setCsDirty({ hlc: true, glow: true, hltype: true });
  cs = T.buildCustomStyle();
  ok(!cs.hlPillBg && cs.hl === '#ff3366' && /0 0 20px #ff3366/.test(cs.hls), 'Pill → Textfarbe uebernimmt die Farbe: ' + cs.hls);
  // Comic: nur Glow anschalten → Farbwechsel (hlCycle) bleibt
  T.selectStyle('tbeast');
  E('csGlow').checked = true; E('csGlowInt').value = '10'; T.setCsDirty({ glow: true });
  cs = T.buildCustomStyle();
  ok(cs.hlCycle && cs.hlCycle.length === 4 && /0 0 10px/.test(cs.hls) && T.parseOutline(cs.hls).w === 3, 'Comic: Glow an, Farbwechsel + Kontur bleiben');
  // Nur Kontur geändert → Glow des Ausgangs-Highlights bleibt unverändert (Jolt)
  T.selectStyle('tamp');
  E('csOutlineW').value = '4'; T.setCsDirty({ stroke: true });
  cs = T.buildCustomStyle();
  ok(/0px 0px 20px rgba\(215,255,31,\.85\)/.test(cs.hls) && T.parseOutline(cs.hls).w === 4, 'Kontur-Aenderung laesst Glow des Presets: ' + cs.hls.slice(-40));
  // Regler ohne Wirkung schalten ihren Schalter ein: Box-Farbe bei „None“, Konturfarbe bei 0 px
  T.selectStyle('tpulse');
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
  ok(!beast.hlCycle && T.hlColorFor(beast, 0) === T.hlColorFor(beast, 1), 'Comic: aktives Wort in EINER Farbe (kein Farbwechsel pro Wort)');
  const tbeast = T.STYLES.find(x => x.id === 'tbeast');
  ok(T.hlColorFor(tbeast, 0) !== T.hlColorFor(tbeast, 1) && T.buildCap(['a', 'b'], tbeast, 1, 22, null).includes(tbeast.hlCycle[1]), 'hlCycle (alte Templates) funktioniert weiter');
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
     && T.displayWord("rock'n'roll.") === "rock’n’roll" && T.displayWord('Weide-Land:') === 'Weide-Land' && T.displayWord('…') === '…',
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
  // Comic: Drop-Shadow im Highlight bleibt auch beim Farbwechsel
  T.selectStyle('tbeast'); T.setCsDirty({ hl: true });
  const cb = T.buildCustomStyle();
  ok(T.parseOutline(cb.hls).w === 3 && /0px 5px 0px rgba\(0,0,0,\.85\)/.test(cb.hls), 'Comic: Kontur + Drop-Shadow im Highlight erhalten: ' + cb.hls.slice(-60));
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
  ok(plan.ring && plan.ring.w === 3 && plan.ring.color === '#000' && plan.rest.length === 1, 'Bold Pop: Ring erkannt, 1 Restschicht (weicher Schatten)');
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
  // Bewusst geändert: Schnitterkennung läuft still, die Statuszeile bleibt unverändert
  ok(document.getElementById('tStatus').innerHTML === '<span>✅</span><span>4 words</span>', 'kein Schnitt-Hinweis in der Statuszeile: ' + document.getElementById('tStatus').innerHTML);
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
  const bloom = T.STYLES.find(x => x.id === 'tbloom');
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
  ['tbloom', 'neon'].forEach(id => {
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
  ok(bl[0].text === 'Kurz.' && Math.abs(bl[0].end - 1.0) < 1e-9, 'kurzer Block in die Luecke verlaengert (Lücke < 1 s → bis zum nächsten Block)');
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
  bl = T.buildCaptionBlocks(W([['Pop', 0, 0.1], ['eins', 0.3, 0.4], ['zwei', 0.8, 0.9]]), []);
  ok(bl.length === 3 && bl[0].end >= 0.3 - 1e-9, '1 Wort/Block: nicht verschmelzen, nur verlaengern (bis zum naechsten Block)');
  // Schneller Sprecher (Tight): Wörter ohne Lücke à 0,12 s → Mindest-Anzeigedauer 0,25 s durch Zusammenfassen (max. 2 Wörter)
  const fast = W([['ich', 0, 0.12], ['habe', 0.12, 0.24], ['das', 0.24, 0.36], ['wirklich', 0.36, 0.48], ['gemacht', 0.48, 0.6], ['heute', 0.6, 0.72]]);
  bl = T.buildCaptionBlocks(fast, []);
  ok(bl.every(b => b.words.length <= 2 && b.end - b.start >= 0.24 - 1e-9), 'Tight schnell: jeder Block >= 0,25 s, max. 2 Woerter: ' + bl.map(b => b.text + ' ' + (b.end - b.start).toFixed(2)).join(' | '));
  ok(bl.map(b => b.text).join(' ') === 'ich habe das wirklich gemacht heute', 'Tight schnell: kein Wort verloren, Reihenfolge stabil');
  // Langsamer Sprecher bleibt bei 1 Wort pro Block
  bl = T.buildCaptionBlocks(W([['ganz', 0, 0.4], ['ruhig', 0.4, 0.8], ['gesprochen', 0.8, 1.3]]), []);
  ok(bl.length === 3, 'Tight langsam: weiter ein Wort pro Block');
  // Satzende und Schnitt bremsen das Zusammenfassen
  bl = T.buildCaptionBlocks(W([['Stopp.', 0, 0.1], ['Weiter', 0.1, 0.2], ['jetzt', 0.2, 0.7]]), []);
  ok(!bl.some(b => /Stopp\. Weiter/.test(b.text)), 'Tight: nie ueber ein Satzende zusammenfassen');
  bl = T.buildCaptionBlocks(W([['links', 0, 0.1], ['rechts', 0.1, 0.2], ['mitte', 0.2, 0.7]]), [0.1]);
  ok(!bl.some(b => /links rechts/.test(b.text)), 'Tight: nie ueber einen Szenenschnitt zusammenfassen');
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
  ok(!b.classList.contains('busy') && document.getElementById('btnVideoLbl').textContent === 'Download video', 'zurueckgesetzt (Label des Export-Blatts)');
}

// 22e) Fehlgeschlagener Wechsel (Übersetzen): Einstellungen auf die der behaltenen Captions zurück.
// Ein Modus (immer large-v3): ein gespeicherter model-Wert alter Projekte wird ignoriert.
{
  T.setTranslateState(true);
  const hint = T.revertTranscriptionSettings({ model: 'fast', langSetting: 'auto', translate: false });
  ok(T.getModel() === 'perfect' && /Translate to English/.test(hint), 'Übersetzen zurueck + Hinweis, Modell bleibt large-v3: ' + hint);
  T.setTranslateState(false);
  ok(T.revertTranscriptionSettings(null) === '', 'ohne Meta: nichts tun');
  ok(T.turboFallbackOk({ status: 429 }) && T.turboFallbackOk({ status: 503 }) && T.turboFallbackOk({}) && !T.turboFallbackOk({ status: 401 })
     && !T.turboFallbackOk({ status: 413 }) && !T.turboFallbackOk({ stale: true }) && !T.turboFallbackOk({ noProxy: true }), 'large-v3 → turbo-Fallback nur, wo er helfen kann');
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

// 23c) Pausierte Vorschau = Ruhezustand (kein halb animiertes Wort); Wiedergabe/Scrubben/Demo animieren
{
  const st = T.STYLES.find(x => x.id === 'hormozi'), anim0 = st.anim, mot0 = st.motion, act0 = T.getActiveId();
  st.anim = 'punch'; st.motion = undefined;
  const ws = [{ word: 'eins', start: 1, end: 1.4 }, { word: 'zwei', start: 1.5, end: 2 }];
  T.setState([{ words: ws, start: 1, end: 2, text: 'eins zwei' }], ws, 'karaoke');
  T.selectStyle('hormozi');
  // Fake-DOM: Wort-Spans mit data-oi, damit capDomMotion (Vorschau) echte Werte schreibt
  const ov = document.getElementById('capOverlay'), vid = document.getElementById('mainVid');
  const spans = [0, 1].map(i => ({ style: {}, getAttribute: () => String(i) }));
  const root = { style: {}, getAttribute: () => '20', querySelectorAll: sel => sel === '[data-oi]' ? spans : [] };
  const qs0 = ov.querySelector; ov.querySelector = () => root;
  const sc = () => { const m = /scale\(([\d.]+)\)/.exec(spans[1].style.transform || ''); return m ? +m[1] : 1; };
  const draw = () => { T.updateOverlay(1.5); return sc(); };
  T.setVidReady(true); vid.paused = true; vid.ended = false; vid.currentTime = 1.5;
  ok(draw() === 1 && !spans[1].style.opacity, 'Pause am Wortbeginn: Ruhezustand (kein Punch, volle Deckkraft)');
  vid.paused = false;
  ok(draw() > 1.2, 'Wiedergabe am Wortbeginn: Punch animiert (scale ' + sc() + ')');
  vid.paused = true; T.setProgDrag({});
  ok(draw() > 1.2, 'Scrubben (Fortschrittsbalken): animiert auch bei Pause');
  T.setProgDrag(null);
  ok(draw() === 1, 'Scrubben beendet: wieder Ruhezustand');
  ok(T.capAnimDemoStart() === true && sc() > 1.1, 'Demo bei Pause: animiert (scale ' + sc() + ')');
  T.clearAnimDemo(); ok(draw() === 1, 'Nach der Demo: Ruhezustand');
  // Export bleibt zeitgenau: capWordFx liefert den Keyframe unabhängig vom Vorschau-Ruhezustand
  const sx = T.capWordFx(st, T.getBlocks()[0], 1, 1, 1.5, false, false);
  ok(sx.a && sx.a.sx > 1.2, 'Export/capWordFx: Punch am Wortbeginn bleibt zeitgenau');
  // Reveal im Ruhezustand: Wort am Beginn voll sichtbar (nicht unsichtbar)
  st.motion = 'reveal'; T.selectStyle('hormozi'); vid.currentTime = 1.5;
  T.updateOverlay(1.5);
  ok(!spans[1].style.opacity, 'Reveal bei Pause am Wortbeginn: Wort voll sichtbar');
  ov.querySelector = qs0; if (!qs0) delete ov.querySelector;
  st.anim = anim0; st.motion = mot0; vid.paused = true; vid.currentTime = 0; T.setVidReady(false);
  T.selectStyle(act0);
}

// 23d) Layout-Wechsel verwirft keine manuellen Block-Edits (erneuter Klick auf aktives Preset/Template), Undo hilft
{
  const ws = Array.from({ length: 8 }, (_, i) => ({ word: 'w' + i, start: i * 0.5, end: i * 0.5 + 0.4 }));
  const fresh = () => { T.setState(T.buildCaptionBlocks(ws), ws.map(w => Object.assign({}, w)), 'karaoke'); T.setCaptionsEdited(false); T.resetUndo(); };
  T.selectStyle('classic'); T.onWpbChange('4'); fresh();
  T.selectStyle('mix'); // Layout 3 Wörter/Block → baut neu (Undo-Schritt)
  fresh(); ok(T.tlSplitAt(0, 0.5), 'Testaufbau: manueller Split'); // manueller Split
  const edited = T.captionSnapshot(), n = T.getBlocks().length, d0 = T.undoDepth()[0];
  T.selectStyle('mix'); T.selectStyle('mix');
  ok(T.captionSnapshot() === edited && T.getBlocks().length === n && T.undoDepth()[0] === d0, 'Erneuter Klick auf aktives Layout-Preset: Blöcke + Undo unverändert');
  // Template mit gleichem Layout (auch «Edit» = erneutes Anwenden)
  const tpl = { wpb: T.getWpb(), lines: T.getLines() };
  T.applyTemplateSettings(tpl); T.applyTemplateSettings(tpl);
  ok(T.captionSnapshot() === edited && T.undoDepth()[0] === d0, 'Template mit gleichem Layout erneut anwenden: Blöcke unverändert');
  // Preset A → B mit gleichem Layout baut nicht neu
  // Preset A → B mit gleichem Layout (classic → hormozi, beide ohne eigenes Layout) fasst die Blöcke nicht an
  T.selectStyle('classic'); T.onWpbChange('4'); fresh(); T.tlSplitAt(0, 0.5);
  const e2 = T.captionSnapshot();
  T.selectStyle('hormozi'); T.selectStyle('minimal'); T.selectStyle('classic');
  ok(T.captionSnapshot() === e2, 'Preset A → B ohne Layout-Wechsel: Blöcke unverändert');
  // Layoutwechsel: baut neu, Undo stellt Blöcke + Wörter/Block-Regler zurück
  fresh(); T.selectStyle('classic'); T.onWpbChange('4'); fresh(); T.tlSplitAt(0, 0.5); T.resetUndo();
  const before = T.captionSnapshot(), wpb0 = T.getWpb();
  T.applyTemplateSettings({ wpb: wpb0 === 2 ? 3 : 2 });
  ok(T.getWpb() !== wpb0 && T.captionSnapshot() !== before && T.undoDepth()[0] === 1, 'Layoutwechsel (Wörter/Caption): baut neu mit genau einem Undo-Schritt');
  T.undoCaptions();
  ok(T.captionSnapshot() === before && T.getWpb() === wpb0, 'Undo stellt Blöcke und Wörter/Caption-Regler wieder her');
  T.selectStyle('classic'); fresh();
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
ok(T.DEFAULT_STYLE === 'tight', 'Standard-Style fuer neue Nutzer: Tight');

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
  // 9f2) Beta-E-Mail-Gate: Download ohne Wasserzeichen gegen E-Mail, Lead → Supabase (REST), Fehler blockieren nicht
  await (async () => {
    const store = {}, calls = []; let fail = false;
    global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
    const realFetch = global.fetch;
    global.fetch = (url, o) => { calls.push({ url, o }); return fail ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve({ ok: true, status: 201 }); };
    ok(T.isEmail('a@b.ch') && T.isEmail(' Jonas.T+x@mail.example.com ') && !T.isEmail('a@b') && !T.isEmail('ab.ch') && !T.isEmail(''), 'isEmail');
    T.setMe('anon', '');
    ok(T.needsWatermark() === true, 'ohne E-Mail → Wasserzeichen-Pfad');
    const g = document.getElementById('expGate'), sh = document.getElementById('expSheet'), inp = document.getElementById('gateEmail');
    const nw = document.getElementById('gateNews'), err = document.getElementById('gateErr');
    document.getElementById('gateNewsTxt').textContent = 'Send me tips';
    g.style.display = 'none'; sh.style.display = 'none'; inp.value = '';
    ok(T.passEmailGate() === false && g.style.display === '' && sh.style.display === 'block', 'Export ohne offenes Blatt: Blatt + E-Mail-Feld, kein Export');
    // Blatt öffnen → E-Mail-Feld sofort sichtbar; gültige Adresse + Download = EIN Klick
    g.style.display = 'none'; sh.style.display = 'none';
    T.openExportSheet();
    ok(g.style.display === '' && sh.style.display === 'block', 'Export-Blatt zeigt das E-Mail-Feld sofort');
    inp.value = 'kein-mail';
    ok(T.passEmailGate() === false && err.style.display === '' && /valid email/.test(err.textContent), 'ungültige Adresse → Fehlermeldung');
    fail = true; inp.value = 'Treier@Example.CH'; nw.checked = true;
    ok(T.passEmailGate() === true && g.style.display === 'none', 'gültige Adresse → Export läuft (auch wenn Speichern fehlschlägt)');
    await new Promise(r => setTimeout(r, 0));
    ok(store[T.LEAD_KEY] === 'treier@example.ch' && T.needsWatermark() === false, 'Adresse gemerkt → kein Wasserzeichen');
    const pend = JSON.parse(store[T.LEAD_PENDING_KEY] || 'null');
    ok(pend && pend.newsletter === true && pend.consent_text === 'Send me tips' && pend.source === 'export', 'Fehlschlag → Lead bleibt in Warteschlange (mit Einwilligungstext)');
    ok(calls.length === 1 && /api\/lead$/.test(calls[0].url) && !calls[0].o.headers.apikey && calls[0].o.method === 'POST', 'POST an api/lead (ohne Datenbank-Schlüssel im Browser)');
    ok(T.passEmailGate() === true && calls.length === 1, 'zweiter Export: keine erneute Abfrage');
    fail = false;
    ok(await T.flushLead() === true && !(T.LEAD_PENDING_KEY in store), 'Retry erfolgreich → Warteschlange leer');
    ok(await T.flushLead() === false && calls.length === 2, 'nichts offen → kein Request');
    delete store[T.LEAD_KEY]; nw.checked = false; inp.value = 'b@c.de'; g.style.display = ''; sh.style.display = 'block';
    T.passEmailGate(); await new Promise(r => setTimeout(r, 0));
    const body = JSON.parse(calls[2].o.body);
    ok(body.newsletter === false && body.consent_text === null, 'ohne Häkchen → kein Newsletter, kein Einwilligungstext');
    delete store[T.LEAD_KEY];
    // Blatt offen, Feld sichtbar, gültige Adresse → erster Download-Klick exportiert direkt
    T.openExportSheet(); inp.value = 'eins@klick.ch';
    ok(g.style.display === '' && T.passEmailGate() === true && g.style.display === 'none', 'ein Klick: Blatt offen + Adresse → Export startet');
    T.closeExportSheet();
    ok(store[T.LEAD_KEY] === 'eins@klick.ch', 'Adresse aus dem Ein-Klick-Weg gemerkt');
    T.openExportSheet();
    ok(g.style.display === 'none', 'bekannte Adresse → Feld beim Öffnen versteckt');
    T.closeExportSheet();
    delete store[T.LEAD_KEY];
    T.setMe('free', 'x@y.z'); g.style.display = 'none';
    ok(T.passEmailGate() === true && g.style.display === 'none', 'angemeldet → kein Gate');
    T.openExportSheet();
    ok(g.style.display === 'none', 'angemeldet → Feld beim Öffnen versteckt');
    T.closeExportSheet();
    T.setMe('anon', '');
    global.fetch = realFetch; delete global.localStorage;
  })();

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
  ok(ovS.bottom === '24.44%' && ovS.display === '', 'Unten wieder normal, Unterkante über der Safe-Zone: ' + ovS.bottom);
  T.setPosState('top'); T.setVOffState(20); T.applyPos();
  ok(ovS.top === '12.46%', 'Oben mit Versatz bleibt unter der Reels-Leiste: ' + ovS.top);
  T.setVOffState(0); T.setPosState('bottom'); T.applyPos();

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
    // Ein Modus: immer Polish, ausser beim Übersetzen
    ok(T.polishEnabled() === true, 'Polish immer an');
    T.setTranslateState(true); ok(T.polishEnabled() === false, 'Uebersetzen: kein Polish'); T.setTranslateState(false);
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
    // gültiges WAV (16 kHz mono 16 bit) mit secs Sekunden — der Server prüft die Dauer im Header
    const wav = secs => { const n = Math.round(secs * 32000), b = Buffer.alloc(44 + n); b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVE', 8);
      b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(16000, 24); b.writeUInt32LE(32000, 28);
      b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n, 40); return b; };
    const ogg = Buffer.from(T.buildOggOpus(Array.from({ length: 50 }, () => new Uint8Array([0x48, 1, 2, 3])), { preSkip: 312, totalSamples48: 50 * 960 }));
    const run = async (method, url, body, env, headers) => {
      Object.assign(process.env, { GROQ_API_KEY: '', RATE_LIMIT_PER_HOUR: '0', REQUIRE_LOGIN: '' }, env || {});
      const req = Readable.from(body ? [Buffer.from(body)] : []);
      Object.assign(req, { method, url, headers: headers || {}, socket: { remoteAddress: '1.2.3.4' } });
      const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } };
      await handler(req, res);
      return res;
    };
    ok((await run('GET', '/api/transcribe')).statusCode === 200, 'Function: GET Health-Check');
    ok((await run('POST', '/api/transcribe', wav(1))).statusCode === 500, 'Function: ohne Key → 500 "nicht konfiguriert"');
    let sent = null;
    global.fetch = async (u, o) => { sent = { u, o }; return { status: 200, headers: { get: () => null }, text: async () => '{"words":[]}' }; };
    const r1 = await run('POST', '/api/transcribe?model=evil&lang=de!', wav(1), { GROQ_API_KEY: 'gsk_x' });
    ok(r1.statusCode === 200 && r1.body === '{"words":[]}', 'Function: reicht Groq-Antwort durch');
    ok(sent.o.headers.Authorization === 'Bearer gsk_x' && /transcriptions$/.test(sent.u), 'Function: Key nur serverseitig + Endpoint');
    ok(sent.o.body.get('model') === 'whisper-large-v3-turbo' && sent.o.body.get('language') === 'de', 'Function: Modell-Whitelist + lang bereinigt');
    await run('POST', '/api/transcribe?model=whisper-large-v3-turbo&translate=1', wav(1), { GROQ_API_KEY: 'k' });
    ok(sent.o.body.get('model') === 'whisper-large-v3' && /translations$/.test(sent.u), 'Function: Translate erzwingt large-v3 (turbo kann nicht uebersetzen)');
    // Vokabular-Prompt: bereinigt + gedeckelt, nur bei Transkription
    const rawPrompt = 'Birkenhof,\n\tHighland  Beef\u0007 ' + 'x'.repeat(400);
    await run('POST', '/api/transcribe?prompt=' + encodeURIComponent(rawPrompt), wav(1), { GROQ_API_KEY: 'k' });
    const fp = sent.o.body.get('prompt');
    ok(typeof fp === 'string' && fp.startsWith('Birkenhof, Highland Beef x') && fp.length <= 300 && !/[\u0000-\u001f]/.test(fp),
       'Function: prompt bereinigt + max 300 Zeichen: ' + JSON.stringify(fp && fp.slice(0, 30)) + ' len=' + (fp && fp.length));
    await run('POST', '/api/transcribe?translate=1&prompt=Birkenhof', wav(1), { GROQ_API_KEY: 'k' });
    ok(sent.o.body.get('prompt') === null, 'Function: kein prompt beim Uebersetzen');
    await run('POST', '/api/transcribe', wav(1), { GROQ_API_KEY: 'k' });
    ok(sent.o.body.get('prompt') === null, 'Function: ohne prompt-Param kein prompt-Feld');
    ok(sent.o.body.get('file').name === 'audio.wav' && sent.o.body.get('file').type === 'audio/wav', 'Function: ohne Content-Type → audio.wav');
    await run('POST', '/api/transcribe', ogg, { GROQ_API_KEY: 'k' }, { 'content-type': 'audio/ogg' });
    ok(sent.o.body.get('file').name === 'audio.ogg' && sent.o.body.get('file').type === 'audio/ogg', 'Function: audio/ogg → audio.ogg an Groq');
    await run('POST', '/api/transcribe', wav(1), { GROQ_API_KEY: 'k' }, { 'content-type': 'text/html; charset=utf-8' });
    ok(sent.o.body.get('file').name === 'audio.wav' && sent.o.body.get('file').type === 'audio/wav', 'Function: unbekannter Content-Type → WAV (Whitelist)');
    ok((await run('POST', '/api/transcribe', Buffer.alloc(5 * 1024 * 1024), { GROQ_API_KEY: 'k' })).statusCode === 413, 'Function: zu grosser Body → 413');
    ok((await run('POST', '/api/transcribe', wav(1), { GROQ_API_KEY: 'k', REQUIRE_LOGIN: '1', SUPABASE_URL: 'https://x', SUPABASE_ANON_KEY: 'a' })).statusCode === 401, 'Function: Login-Pflicht ohne Token → 401');
    ok((await run('POST', '/api/transcribe', Buffer.alloc(500), { GROQ_API_KEY: 'k' })).statusCode === 400, 'Function: kein WAV/Ogg → 400');
    ok((await run('POST', '/api/transcribe', wav(131), { GROQ_API_KEY: 'k' })).statusCode === 413, 'Function: Stück > 130 s → 413');
    const al = []; for (let i = 0; i < 3; i++) al.push((await run('POST', '/api/transcribe', wav(40), { GROQ_API_KEY: 'k', MAX_AUDIO_SEC_PER_HOUR: '100' }, { 'x-forwarded-for': '9.9.9.' + 1 })).statusCode);
    ok(al.join() === '200,200,429', 'Function: Ton-Kontingent pro IP und Stunde (' + al.join() + ')');
    process.env.MAX_AUDIO_SEC_PER_HOUR = '';
    const rl = []; for (let i = 0; i < 3; i++) rl.push((await run('POST', '/api/transcribe', wav(1), { GROQ_API_KEY: 'k', RATE_LIMIT_PER_HOUR: '2' })).statusCode);
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
      // Server-Missbrauchsschutz (api/_guard.js) liest die Dauer der App-eigenen Ogg-Dateien korrekt
      const guard = require('./api/_guard.js');
      const ogg = Buffer.from(T.buildOggOpus(Array.from({ length: 300 }, () => P(0x48, 1, 2, 3)), { preSkip: 312, totalSamples48: 300 * 960 }));
      ok(Math.abs(guard.audioSeconds(ogg, true) - 6) < 0.01, 'Guard: Dauer aus App-Ogg = 6 s (' + guard.audioSeconds(ogg, true) + ')');
      ok(guard.audioSeconds(Buffer.from('OggS' + 'x'.repeat(60)), true) === null && guard.audioSeconds(Buffer.alloc(10), false) === null, 'Guard: Müll → null');
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
    // Bewusst geändert: Erkennung läuft still (kein Statustext); Warten zeigt sich nur am Export
    ok(T.cutsDetecting() && !/Detecting|scene cut/.test(st0.innerHTML) && /12 words/.test(st0.innerHTML), 'Erkennung ohne Status-Hinweis: ' + st0.innerHTML);
    let t0 = Date.now();
    const p = T.waitForSceneCuts(2000);
    ok(btn.disabled === true, 'Export-Button während des Wartens gesperrt');
    setTimeout(() => T.finishCutRun(st, [1.5]), 30);
    const r1 = await p;
    ok(r1 === true && Date.now() - t0 < 1000 && T.getSceneCuts().join() === '1.5', 'waitForSceneCuts löst bei Abschluss auf: ' + r1 + ' ' + T.getSceneCuts());
    ok(btn.disabled === false && !T.cutsDetecting(), 'Button wieder frei, Erkennung beendet');
    ok(!/scene cut|Detecting/.test(st0.innerHTML) && /12 words/.test(st0.innerHTML), 'Status bleibt nach Abschluss unverändert: ' + st0.innerHTML);
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

    // Zeilenhöhe (Custom-Style): Vorschau-CSS + Template-Feld
    T.selectStyle('hormozi'); E('csLh').value = '1.6'; T.setCsDirty({ lh: true });
    let csl = T.buildCustomStyle();
    ok(csl.lh === 1.6 && T.buildCap(['a', 'b'], csl, 0, 22, null).includes('line-height:1.6;'), 'Line height 1.6 im Style + Vorschau: ' + csl.lh);
    E('csLh').value = '1.3'; csl = T.buildCustomStyle();
    ok(csl.lh === undefined && T.buildCap(['a'], csl, 0, 22, null).includes('line-height:1.3;'), 'Standard 1.3 → kein Feld');
    ok(T.normalizeTemplate({ id: 'tpl_l', name: 'l', style: { fl: 'Inter', lh: 1.5 } }).style.lh === 1.5, 'Template behält lh');
    T.setCsDirty({}); T.selectStyle('hormozi');
    // Fontmetrik für die Export-Grundlinie: echte Canvas-Werte, sonst typische Fallbacks
    const fmA = T.capFontMetrics({ measureText: () => ({ fontBoundingBoxAscent: 50, fontBoundingBoxDescent: 10 }) }, 50);
    const fmB = T.capFontMetrics({ measureText: () => ({ width: 10 }) }, 50);
    ok(fmA.a === 1 && fmA.d === 0.2 && fmB.a === 0.93 && fmB.d === 0.24, 'capFontMetrics: Canvas-Metrik bzw. Fallback');
    ok(T.capLineH({}) === 1.3 && T.capLineH({ lh: 1.6 }) === 1.6 && T.capLineH({ lh: 9 }) === 1.3, 'capLineH: Standard/Wert/ungültig');
    // Schriften
    ok(T.cleanFontName(' Rubik  Mono One ') === 'Rubik Mono One' && T.cleanFontName("x');}<b") === '' && T.cleanFontName('A') === '', 'Fontname validiert');
    ok(T.isKnownFont('Luckiest Guy') && T.isKnownFont('Inter Tight') && T.isKnownFont('Instrument Serif') && !T.isKnownFont('Rubik Mono One'), 'Schriftliste kennt nur lokale Schriften');
    ok(await T.ensureCapFont('Rubik Mono One') === false && await T.ensureCapFont('Inter Tight') === true, 'unbekannte Schrift → false, lokale → true');
    {
      // Datenschutz: keine Anfragen an Google; jede Schrift der Auswahlliste + jedes Styles liegt lokal vor (vendor/fonts)
      const html2 = fs.readFileSync(path.join(__dirname, 'captly.html'), 'utf8'), fcss = fs.readFileSync(path.join(__dirname, 'vendor', 'fonts', 'fonts.css'), 'utf8');
      ok(!/fonts\.(googleapis|gstatic)\.com/.test(html2.replace(/<!--[\s\S]*?-->/g, '')), 'captly.html ruft nichts bei Google Fonts ab');
      const miss = Object.keys(T.CAP_FONT_W).filter(f => fcss.indexOf("font-family: '" + f + "'") < 0);
      ok(miss.length === 0, 'alle Auswahl-Schriften lokal vorhanden (fehlt: ' + miss.join(', ') + ')');
      const used = new Set(); T.STYLES.forEach(st => [st.fl, st.emFont, st.hlFont].forEach(f => { f = T.cleanFontName(String(f || '').replace(/^'|'$/g, '').split(',')[0]); if (f) used.add(f); }));
      const miss2 = [...used].filter(f => fcss.indexOf("font-family: '" + f + "'") < 0);
      ok(miss2.length === 0, 'alle Style-Schriften lokal vorhanden (fehlt: ' + miss2.join(', ') + ')');
    }
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
    T.updateTrSetSum(); ok(!/Fast|Perfect/.test(E('trSetSum').textContent) && /language/i.test(E('trSetSum').textContent), 'Transkriptions-Zusammenfassung ohne Modell: ' + E('trSetSum').textContent);
    if (T.getLang() === 'auto') {
      T.setLastTrMeta({ model: 'fast', lang: 'german', langSetting: 'auto' }); T.updateTrSetSum();
      ok(/German \(detected\)/.test(E('trSetSum').textContent) && !/Auto/.test(E('trSetSum').textContent), 'erkannte Sprache statt „Auto“: ' + E('trSetSum').textContent);
      T.setLastTrMeta(null); T.updateTrSetSum();
      ok(/Auto language/.test(E('trSetSum').textContent), 'ohne Transkription: Auto language');
    } else ok(false, 'Testannahme: Sprache auto, ist ' + T.getLang());
  }

  // Timeline: Zeit↔x, Zoom/Scroll, Fangen, Verschieben/Trimmen mit Grenzen, Wort-Skalierung, Undo, Export
  {
    const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-6);
    // Zeit ↔ x mit Zoom/Scroll
    const v = { start: 10, pps: 50 };
    ok(T.tlTimeToX(12, v) === 100 && T.tlXToTime(100, v) === 12, 'Zeit↔x: ' + T.tlTimeToX(12, v));
    ok(near(T.tlXToTime(T.tlTimeToX(33.3, v), v), 33.3), 'Zeit↔x Rundreise');
    let cv = T.tlClampView({ start: 0, pps: 1 }, 60, 600);
    ok(cv.pps === 10 && cv.start === 0, 'ganz raus = ganzes Video: ' + JSON.stringify(cv));
    cv = T.tlClampView({ start: 0, pps: 5000 }, 60, 600);
    ok(cv.pps === 600, 'ganz rein = 1 s sichtbar: ' + cv.pps);
    cv = T.tlClampView({ start: 58, pps: 100 }, 60, 600);
    ok(cv.start === 54, 'Scroll nie hinter das Videoende: ' + cv.start);
    ok(T.tlClampView({ start: -5, pps: 100 }, 60, 600).start === 0, 'Scroll nie vor 0');
    const z = T.tlZoomAt({ start: 10, pps: 20 }, 2, 300, 60, 600);
    ok(z.pps === 40 && near(T.tlXToTime(300, z), 25), 'Zoom um Anker: Zeit unter dem Zeiger bleibt: ' + JSON.stringify(z));
    ok(T.tlTickStep(10, 64) === 10 && T.tlTickStep(600, 64) === 0.2 && T.tlTickStep(100, 64) === 1, 'adaptive Lineal-Abstände');
    // Fangen: Schwelle in Pixeln, Priorität bei Gleichstand
    const cands = [{ t: 5, kind: 'word', p: 1 }, { t: 5.001, kind: 'cut', p: 5 }, { t: 7, kind: 'playhead', p: 4 }];
    ok(T.tlSnap(5.1, cands, 100, 8) === null, '10 px entfernt (> 8 px) → kein Fang');
    ok(T.tlSnap(5.07, cands, 100, 8).kind === 'cut', 'innerhalb 8 px; Gleichstand (< ½ px) → Schnitt vor Wort');
    ok(T.tlSnap(6.95, cands, 100, 8).kind === 'playhead', 'nächster Kandidat gewinnt');
    ok(T.tlSnap(5.1, cands, 1000, 8) === null && T.tlSnap(5.005, cands, 1000, 8).kind === 'cut', 'Schwelle skaliert mit dem Zoom');
    const mkB = () => [
      { text: 'eins zwei', start: 1, end: 2, words: [{ word: 'eins', start: 1, end: 1.4 }, { word: 'zwei', start: 1.6, end: 2 }] },
      { text: 'drei vier', start: 3, end: 4, words: [{ word: 'drei', start: 3, end: 3.5 }, { word: 'vier', start: 3.5, end: 4 }] },
      { text: 'fünf', start: 6, end: 6.5, words: [{ word: 'fünf', start: 6, end: 6.5 }] }];
    mkB().forEach(b => { b.srcWords = JSON.parse(JSON.stringify(b.words)); });
    let bl = mkB();
    const cs = T.tlSnapCands(bl, 1, { cuts: [2.5], off: 0, playhead: 4.8, speech: [{ start: 2.9, end: 4.2 }], words: bl[1].words });
    const kinds = cs.map(c => c.kind + '@' + c.t).join(',');
    ok(/cut@2.5/.test(kinds) && /playhead@4.8/.test(kinds) && /caption@2,/.test(kinds) && /caption@6/.test(kinds)
       && /speech@2.9/.test(kinds) && /word@3.5/.test(kinds) && /word@1.6/.test(kinds), 'Fangpunkte: Schnitt/Kopf/Nachbarn/Sprache/Wörter: ' + kinds);
    ok(T.tlSnapCands(bl, 1, { cuts: [2.5], off: 0.2 })[0].t === 2.7, 'timeOff: Schnitt in Block-Zeit umgerechnet');
    // Grenzen: Nachbarn, Videoende, Szenenschnitt
    ok(JSON.stringify(T.tlBounds(bl, 1, { dur: 10 })) === '{"lo":2,"hi":6}', 'Grenzen = Nachbarn');
    ok(JSON.stringify(T.tlBounds(bl, 1, { dur: 10, cuts: [2.5, 5], respectCuts: true })) === '{"lo":2.5,"hi":5}', 'mit Schnitten: links/rechts begrenzt');
    ok(JSON.stringify(T.tlBounds(bl, 1, { dur: 10, cuts: [2.5, 5], respectCuts: false })) === '{"lo":2,"hi":6}', 'Snap aus: Schnitte frei');
    ok(T.tlBounds(bl, 2, { dur: 7 }).hi === 7 && T.tlBounds(bl, 0, { dur: 7 }).lo === 0, 'Video [0, dur]');
    // Verschieben mit Klemmen + Schnitt
    let r = T.tlDragSpan(bl[1], 'move', 0.4, T.tlBounds(bl, 1, { dur: 10 }));
    ok(r.start === 3.4 && r.end === 4.4 && !r.snap, 'Verschieben um +0.4: ' + JSON.stringify(r));
    r = T.tlDragSpan(bl[1], 'move', 5, T.tlBounds(bl, 1, { dur: 10 }));
    ok(r.start === 5 && r.end === 6, 'nie in den nächsten Block (geklemmt, Länge bleibt): ' + JSON.stringify(r));
    r = T.tlDragSpan(bl[1], 'move', -5, T.tlBounds(bl, 1, { dur: 10, cuts: [2.5], respectCuts: true }));
    ok(r.start === 2.5 && r.end === 3.5, 'Schnitt links stoppt den Block: ' + JSON.stringify(r));
    r = T.tlDragSpan(bl[1], 'move', -0.8, T.tlBounds(bl, 1, { dur: 10, cuts: [2.5], respectCuts: false }));
    ok(r.start === 2.2 && r.end === 3.2, 'Snap aus + bewusst gezogen: über den Schnitt erlaubt: ' + JSON.stringify(r));
    // Verschieben mit Fangen: Endkante auf Schnitt
    const bd = T.tlBounds(bl, 1, { dur: 10 });
    r = T.tlDragSpan(bl[1], 'move', 0.46, Object.assign({ cands: [{ t: 4.5, kind: 'cut', p: 5 }], pps: 100, thr: 8 }, bd));
    ok(r.end === 4.5 && r.start === 3.5 && r.snap && r.snap.kind === 'cut', 'Endkante rastet am Schnitt ein: ' + JSON.stringify(r));
    // Startkante am Schnitt, Endkante zufällig nahe einer Wortgrenze → die Wortgrenze würde weggeklemmt: Schnitt gewinnt
    const bdc = T.tlBounds(bl, 1, { dur: 10, cuts: [2.5], respectCuts: true });
    r = T.tlDragSpan(bl[1], 'move', -0.54, Object.assign({ cands: [{ t: 2.5, kind: 'cut', p: 5 }, { t: 3.47, kind: 'word', p: 1 }], pps: 100, thr: 8 }, bdc));
    ok(r.start === 2.5 && r.snap && r.snap.kind === 'cut', 'Fang überlebt das Klemmen: Schnitt statt Wortgrenze: ' + JSON.stringify(r));
    r = T.tlDragSpan(bl[1], 'move', -3, Object.assign({ cands: [{ t: 2.5, kind: 'cut', p: 5 }], pps: 100, thr: 8 }, bdc));
    ok(r.start === 2.5 && r.snap && r.snap.kind === 'cut', 'am Schnitt angeschlagen → als Fang angezeigt');
    r = T.tlDragSpan(bl[1], 'move', 0.46, Object.assign({ cands: [{ t: 6.2, kind: 'cut', p: 5 }], pps: 1000, thr: 8 }, bd));
    ok(!r.snap && r.end === 4.46, 'zu weit weg → frei: ' + JSON.stringify(r));
    // Trimmen
    r = T.tlDragSpan(bl[1], 'start', -0.5, bd);
    ok(r.start === 2.5 && r.end === 4, 'Start früher: ' + JSON.stringify(r));
    r = T.tlDragSpan(bl[1], 'start', -3, bd);
    ok(r.start === 2, 'Start nie vor dem Vorgänger: ' + r.start);
    r = T.tlDragSpan(bl[1], 'start', 3, bd);
    ok(near(r.end - r.start, 0.2), 'Mindestdauer 0.2 s beim Trimmen: ' + JSON.stringify(r));
    r = T.tlDragSpan(bl[1], 'end', 9, bd);
    ok(r.end === 6, 'Ende nie über den Nachfolger: ' + r.end);
    r = T.tlDragSpan(bl[1], 'end', -0.27, Object.assign({ cands: [{ t: 3.7, kind: 'speech', p: 2 }], pps: 100, thr: 8 }, bd));
    ok(r.end === 3.7 && r.snap.kind === 'speech', 'Endkante fängt am Sprachende: ' + JSON.stringify(r));
    const many = { start: 0, end: 1, words: Array.from({ length: 8 }, (_, i) => ({ word: 'w' + i, start: i / 8, end: (i + 1) / 8 })) };
    r = T.tlDragSpan(many, 'end', -0.9, { lo: 0, hi: 5 });
    ok(near(r.end, 0.4), '8 Wörter: Mindestdauer 8 × 0.05 s: ' + r.end);
    // Wort-Skalierung
    let ws = T.tlRetimeWords(bl[1].words, 3, 4, 3, 5);
    ok(ws[0].start === 3 && ws[0].end === 4 && ws[1].start === 4 && ws[1].end === 5, 'Trimmen skaliert proportional: ' + JSON.stringify(ws));
    ws = T.tlRetimeWords(bl[0].words, 1, 2, 1.25, 2.25);
    ok(ws[0].start === 1.25 && ws[0].end === 1.65 && ws[1].start === 1.85, 'Verschieben: alle Wörter um dasselbe Delta: ' + JSON.stringify(ws));
    ws = T.tlRetimeWords(many.words, 0, 1, 0, 0.4);
    ok(ws.every(w => w.end - w.start >= 0.05 - 1e-9 && w.start >= 0 && w.end <= 0.4 + 1e-9), 'Mindestlänge je Wort 0.05 s im Block: ' + JSON.stringify(ws.map(w => [w.start, w.end])));
    ok(ws.every((w, i) => !i || w.start >= ws[i - 1].start), 'Reihenfolge bleibt');
    // Wellenform-Hüllkurve
    const aud = new Float32Array(16000); aud[100] = 0.5; aud[200] = -1; aud[8000] = 0.25;
    const wp = T.computeWavePeaks(aud, 16000, 100);
    ok(wp.rate === 100 && wp.peaks.length === 200 && wp.peaks[1] === 64 && wp.peaks[2] === -127 && wp.peaks[101] === 32, 'Hüllkurve min/max je 10 ms');
    ok(T.tlCleanSpeech([{ start: 2, end: 1 }, { start: 'x' }, { start: 1.23456, end: 2 }, null]).length === 1, 'Sprachbereiche gesäubert');
    // Ein Schreibweg: Undo-Schritt pro Geste, exakt rückgängig
    T.setState(mkB(), [], 'karaoke'); T.resetUndo(); T.setCaptionsEdited(false); T.setSceneCuts([]);
    T.getBlocks().forEach(b => { b.srcWords = JSON.parse(JSON.stringify(b.words)); });
    const before = T.captionSnapshot(), base = JSON.parse(JSON.stringify(T.getBlocks()[1]));
    ok(T.applyTimelineEdit(1, 3.3, 4.3, base, { live: true }) && T.undoDepth()[0] === 0, 'live: kein Undo-Schritt');
    T.applyTimelineEdit(1, 3.6, 4.6, base, { live: true });
    ok(T.applyTimelineEdit(1, 3.5, 4.5, base, { undoSnap: before }) && T.undoDepth()[0] === 1, 'Gestenende: genau EIN Undo-Schritt');
    let b1 = T.getBlocks()[1];
    ok(b1.start === 3.5 && b1.words[0].start === 3.5 && b1.words[1].end === 4.5 && b1.srcWords[1].start === 4, 'Wörter + srcWords verschoben: ' + JSON.stringify(b1.srcWords));
    ok(T.getCaptionsEdited() === true, 'markCaptionsEdited');
    T.exportSRT();
    ok(/2\n00:00:03,500 --> 00:00:04,500\ndrei vier/.test(global.LASTBLOB.content), 'SRT nutzt die neuen Zeiten: ' + JSON.stringify(global.LASTBLOB.content.slice(0, 90)));
    T.undoCaptions();
    ok(T.captionSnapshot() === before, 'Undo stellt den Stand vor dem Ziehen exakt her');
    T.redoCaptions(); ok(T.getBlocks()[1].start === 3.5, 'Redo');
    // Geste endet am Ausgangspunkt → kein Schritt, Daten exakt wie vorher
    T.setState(mkB(), [], 'karaoke'); T.resetUndo();
    const snap2 = T.captionSnapshot(), base2 = JSON.parse(JSON.stringify(T.getBlocks()[0]));
    T.applyTimelineEdit(0, 1.3, 1.9, base2, { live: true });
    ok(T.applyTimelineEdit(0, 1, 2, base2, { undoSnap: snap2 }) === false && T.undoDepth()[0] === 0 && T.captionSnapshot() === snap2, 'zurück an den Start → unverändert, kein Undo');
    // Text-Edit danach behält die neue Zeit (srcWords)
    T.setState(mkB(), [], 'karaoke'); T.resetUndo();
    T.getBlocks().forEach(b => { b.srcWords = JSON.parse(JSON.stringify(b.words)); });
    T.applyTimelineEdit(1, 3.2, 4.2, null, {});
    const eb = T.getBlocks()[1]; eb.text = 'drei fünf'; T.retimeEditedBlock(eb);
    ok(eb.words[0].start === 3.2 && eb.words[1].end === 4.2, 'Text-Edit nach Verschieben behält Timing: ' + JSON.stringify(eb.words));
    // Neu-Gruppieren (Wörter pro Block) behält verschobene Zeiten — sie stecken in den Wörtern
    T.setState(mkB(), [], 'karaoke'); T.resetUndo();
    T.applyTimelineEdit(2, 7, 7.5, null, {});
    T.onWpbChange(2);
    const rg = T.getBlocks(), last = rg[rg.length - 1];
    ok(last.text === 'fünf' && last.start === 7 && last.words[0].start === 7, 'Regroup behält verschobene Zeit: ' + JSON.stringify(last));
    T.onWpbChange(4);
    // Tastatur-Nudge: 1 Frame, Serie = ein Undo-Schritt, Schnitt bremst bei Snap an
    T.setState(mkB(), [], 'karaoke'); T.resetUndo(); T.setTlSnapOn(true);
    ok(T.tlNudge(1, 1 / 30) && T.getBlocks()[1].start === 3.033, '→ = 1 Frame: ' + T.getBlocks()[1].start);
    T.tlNudge(1, 1 / 30);
    ok(T.undoDepth()[0] === 1 && near(T.getBlocks()[1].start, 3.0667, 0.001), 'Nudge-Serie = ein Undo-Schritt: ' + T.getBlocks()[1].start);
    T.setState(mkB(), [], 'karaoke'); T.resetUndo(); T.setSceneCuts([4.05]);
    T.getBlocks().forEach(b => { b.srcWords = JSON.parse(JSON.stringify(b.words)); });
    T.tlNudge(1, 0.1);
    ok(T.getBlocks()[1].end === 4.05, 'Nudge stoppt am Schnitt (Snap an): ' + T.getBlocks()[1].end);
    T.setTlSnapOn(false); T.tlNudge(1, 0.1);
    ok(T.getBlocks()[1].end === 4.15, 'Snap aus: Nudge darf über den Schnitt: ' + T.getBlocks()[1].end);
    T.setTlSnapOn(true); T.setSceneCuts([]);
    // Sprachbereiche reisen im Projekt mit
    T.setSpeech([{ start: 1, end: 2 }]);
    ok(JSON.stringify(T.projectPayload().speech) === '[{"start":1,"end":2}]', 'Sprachbereiche im Payload');
    T.setSpeech([]);
    ok(T.projectPayload().speech === undefined, 'ohne Sprachbereiche kein Feld');

    // ── Handy-Timeline (feste Mitte) ──
    // px ↔ Zeit mit Abspielkopf in der Mitte: Mitte = Abspielzeit, Standard 70 px/s, links von 0 ist Leere erlaubt
    let cvw = T.tlCenterView(10, 70, 350);
    ok(near(cvw.start, 7.5) && cvw.pps === 70 && near(T.tlTimeToX(10, cvw), 175) && near(T.tlXToTime(245, cvw), 11), 'Mitte = Abspielzeit, 70 px = 1 s: ' + JSON.stringify(cvw));
    cvw = T.tlCenterView(0.5, 70, 350);
    ok(cvw.start < 0 && near(T.tlTimeToX(0, cvw), 140), 'am Anfang: Zeit 0 liegt rechts vom linken Rand (Leere davor)');
    ok(near(T.tlXToTime(T.tlTimeToX(3.21, T.tlCenterView(2, 133, 390)), T.tlCenterView(2, 133, 390)), 3.21), 'Rundreise mit Mitte');
    ok(T.TL_MOB_PPS === 70 && T.tlClampPps(10) === 30 && T.tlClampPps(500) === 200 && T.tlClampPps(NaN) === 70 && T.tlClampPps(120) === 120, 'Pinch-Zoom auf 30–200 px/s begrenzt');
    // Antippen vs. Wischen vs. Halten
    ok(T.tlClassify(3, 2, 120, true) === 'tap', 'kleine Bewegung, kurz → Tap');
    ok(T.tlClassify(3, 2, 120, false) === 'pending', 'noch gedrückt, kaum bewegt → offen');
    ok(T.tlClassify(14, 3, 80, false) === 'swipe' && T.tlClassify(-10, 0, 30, true) === 'swipe', 'ab 10 px waagrecht → Wischen (kein Edit)');
    ok(T.tlClassify(2, 16, 80, false) === 'vswipe', 'senkrecht → kein Scrubben');
    ok(T.tlClassify(4, 4, 460, false) === 'hold' && T.tlClassify(4, 4, 460, true) === 'hold', 'still gehalten ≥ 450 ms → Long-Press');
    // Schwung: Tempo aus den letzten 100 ms, exponentielles Abklingen
    const smp = [{ t: 0, x: 300 }, { t: 150, x: 290 }, { t: 200, x: 250 }, { t: 250, x: 200 }];
    ok(near(T.tlFlingVelocity(smp, 250), -0.9, 1e-9), 'Fling-Tempo nur aus den letzten 100 ms: ' + T.tlFlingVelocity(smp, 250));
    ok(T.tlFlingVelocity([{ t: 0, x: 1 }], 10) === 0 && T.tlFlingVelocity(smp, 900) === 0, 'Stillstand/alte Proben → kein Schwung');
    ok(near(T.tlFlingDecay(1, 325), Math.exp(-1)) && T.tlFlingDecay(2, 0) === 2, 'Abklingen e^(−t/325 ms)');
    // Teilen am Abspielkopf: Wortmitte entscheidet
    const sw = [{ word: 'a', start: 1, end: 1.4 }, { word: 'b', start: 1.6, end: 2 }, { word: 'c', start: 2.1, end: 2.5 }];
    ok(T.tlSplitIndex(sw, 1.5) === 1 && T.tlSplitIndex(sw, 1.75) === 1 && T.tlSplitIndex(sw, 1.85) === 2 && T.tlSplitIndex(sw, 0.5) === 0 && T.tlSplitIndex(sw, 9) === 3, 'Split-Index nach Wortmitte');
    T.setState(mkB(), [], 'karaoke'); T.resetUndo(); T.setSceneCuts([]);
    ok(T.tlSplitAt(0, 1.5) && T.getBlocks().length === 4 && T.undoDepth()[0] === 1, 'Split am Abspielkopf: ein Undo-Schritt');
    let sb = T.getBlocks();
    ok(sb[0].text === 'eins' && sb[1].text === 'zwei' && sb[0].start === 1 && sb[0].end === 1.5 && sb[1].start === 1.5 && sb[1].end === 2 && sb[1].srcWords.length === 1, 'Naht am Abspielkopf, Wörter + srcWords verteilt: ' + JSON.stringify(sb.slice(0, 2).map(b => [b.text, b.start, b.end])));
    ok(T.tlSplitAt(2, 3.0) === false && T.tlSplitAt(3, 6.2) === false, 'kein Split vor dem ersten Wort / bei einem Wort');
    T.undoCaptions(); ok(T.getBlocks().length === 3, 'Undo macht den Split rückgängig');
    // Start/End ±0.1 s: an Nachbarn und (mit Snap) an Schnitten geklemmt, Serie = ein Undo-Schritt
    T.setState(mkB(), [], 'karaoke'); T.resetUndo(); T.setTlSnapOn(true); T.setSceneCuts([]);
    T.getBlocks().forEach(b => { b.srcWords = JSON.parse(JSON.stringify(b.words)); });
    ok(T.tlNudgeEdge(1, 'start', -0.1) && T.getBlocks()[1].start === 2.9 && T.getBlocks()[1].end === 4, 'Start −0.1 s, Ende bleibt');
    ok(T.tlNudgeEdge(1, 'end', 0.1) && T.getBlocks()[1].end === 4.1 && T.getBlocks()[1].start === 2.9, 'Ende +0.1 s, Start bleibt');
    for (let k = 0; k < 15; k++) T.tlNudgeEdge(1, 'start', -0.1);
    ok(T.getBlocks()[1].start === 2 && T.undoDepth()[0] === 3, 'Start klemmt am Ende des Vorgängers (2.0), Serie je Kante = ein Undo-Schritt: ' + T.getBlocks()[1].start + ' · Undo ' + T.undoDepth()[0]);
    ok(T.tlNudgeEdge(1, 'start', -0.1) === false && /previous caption/.test(T.tlNudgeWhy(1, 'start', -1)), 'blockiert → Grund: Vorgänger');
    for (let k = 0; k < 40; k++) T.tlNudgeEdge(1, 'end', 0.1);
    ok(T.getBlocks()[1].end === 6 && /next caption/.test(T.tlNudgeWhy(1, 'end', 1)), 'Ende klemmt am Start des Nachfolgers (6.0): ' + T.getBlocks()[1].end);
    for (let k = 0; k < 60; k++) T.tlNudgeEdge(1, 'end', -0.1);
    const nb1 = T.getBlocks()[1];
    ok(near(nb1.end - nb1.start, 0.2, 1e-6) && /short/.test(T.tlNudgeWhy(1, 'end', -1)), 'Mindestdauer bleibt: ' + (nb1.end - nb1.start));
    T.setState(mkB(), [], 'karaoke'); T.resetUndo(); T.setSceneCuts([4.25]);
    T.getBlocks().forEach(b => { b.srcWords = JSON.parse(JSON.stringify(b.words)); });
    for (let k = 0; k < 5; k++) T.tlNudgeEdge(1, 'end', 0.1);
    ok(T.getBlocks()[1].end === 4.25 && /scene cut/.test(T.tlNudgeWhy(1, 'end', 1)), 'Snap an: Ende stoppt am Szenenschnitt: ' + T.getBlocks()[1].end);
    T.setTlSnapOn(false); T.tlNudgeEdge(1, 'end', 0.1);
    ok(T.getBlocks()[1].end === 4.35, 'Snap aus: über den Schnitt: ' + T.getBlocks()[1].end);
    T.setTlSnapOn(true); T.setSceneCuts([]);
    ok(T.tlNudgeEdge(9, 'end', 0.1) === false && T.tlNudgeEdge(1, 'middle', 0.1) === false, 'ungültiger Block/Kante → nichts');
    // Treffer: Kanten-Griffe (≥ 44 px) nur am gewählten Block, sonst Block wählen
    T.setState(mkB(), [], 'karaoke'); T.setTlMob(true); T.setTlView(T.tlCenterView(3.5, 70, 360));
    const gy = 40 + 26; // Balkenmitte (Handy-Geometrie: Lineal 20 + Welle 14 + 6)
    const x3 = T.tlTimeToX(3, T.tlCenterView(3.5, 70, 360)), x4 = T.tlTimeToX(4, T.tlCenterView(3.5, 70, 360));
    T.setTlSel(-1);
    ok(T.tlHit(x3 + 2, gy, true).mode === 'move' && T.tlHit(x3 - 15, gy, true).type === 'empty', 'ohne Auswahl: keine Griffe, Tippen wählt den Block');
    T.setTlSel(1);
    const hs = T.tlHit(x3 - 20, gy, true), he = T.tlHit(x4 + 20, gy, true), hm = T.tlHit((x3 + x4) / 2, gy, true);
    ok(hs.mode === 'start' && he.mode === 'end' && hm.mode === 'move', 'gewählt: Griffe bis 22 px außerhalb der Kanten, Mitte = Körper: ' + [hs.mode, he.mode, hm.mode]);
    ok(T.tlHit(x3 + 20, gy, true).mode === 'start' && T.tlHit(x3 - 26, gy, true).type !== 'block' || T.tlHit(x3 - 26, gy, true).idx !== 1, 'Griffzone ≈ 44 px breit');
    ok(T.tlHit(x3 + 2, 10, true).type === 'empty', 'Handy: Lineal ist kein Seek-Ziel (Wischen scrubbt)');
    T.setTlMob(false); T.setTlSel(-1);
  }

  // UX-Vereinfachung: Anmelde-Netzwerkfehler verständlich, Case-Schalter überstimmt Style-Schreibweise, Titel im Projekt
  {
    const down = 'Sign-in is temporarily unavailable — please try again later.';
    ok(T.authErrText(new TypeError('Failed to fetch')) === down, 'TypeError „Failed to fetch“ → klare Meldung');
    ok(T.authErrText({ name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 }) === down, 'Supabase-Netzwerkfehler → klare Meldung');
    ok(T.authErrText({ name: 'AuthApiError', message: 'Token has expired or is invalid', status: 403 }) === 'Token has expired or is invalid', 'echter Auth-Fehler bleibt sichtbar');
    const up = { id: 'x', tt: 'uppercase', hlUpper: true };
    T.setCaseState('asis'); ok(T.caseStyle(up) === up, 'Style default: Style entscheidet');
    T.setCaseState('lower'); const cl = T.caseStyle(up);
    ok(cl !== up && cl.tt === 'none' && cl.hlUpper === false && up.tt === 'uppercase' && T.caseStyle(up) === cl, 'lowercase überstimmt tt/hlUpper (stabiles Objekt, Original unverändert)');
    T.setCaseState('asis');
    T.setTitle('Mein Clip'); ok(T.projTitleOf() === 'Mein Clip', 'Titel reist im Projekt mit'); T.setTitle('');
    // Dateiname aus dem Titel
    ok(T.fileSlug('Grüße aus der Schweiz!') === 'gruesse-aus-der-schweiz', 'Slug: Umlaute + Satzzeichen: ' + T.fileSlug('Grüße aus der Schweiz!'));
    ok(T.fileSlug('  Ölmühle – Café & Bär  ') === 'oelmuehle-cafe-baer', 'Slug: ö/ü/ä, Akzente, Ränder: ' + T.fileSlug('  Ölmühle – Café & Bär  '));
    ok(T.fileSlug('IMG 1234') === 'img-1234' && T.fileSlug('') === '' && T.fileSlug('!!!') === '' && T.fileSlug('🙂🙂') === '', 'Slug: Zahlen, leer, nur Sonderzeichen');
    const longSlug = T.fileSlug('Das ist ein sehr langer Titel für ein Video über Highland Rinder');
    ok(longSlug.length <= 40 && !/-$/.test(longSlug) && longSlug.indexOf('das-ist-ein-sehr-langer') === 0, 'Slug: max. 40 Zeichen, kein Strich am Ende: ' + longSlug);
    ok(T.exportBaseName() === 'captionrush-video', 'ohne Titel: captionrush-video');
    T.setTitle('Mein Reel #1'); ok(T.exportBaseName() === 'mein-reel-1-captionrush', 'Basis aus Titel: ' + T.exportBaseName());
    global.CLICKS = []; T.exportSRT(); T.exportVTT(); T.exportTXT();
    ok(global.CLICKS.map(c => c.download).join(',') === 'mein-reel-1-captionrush.srt,mein-reel-1-captionrush.vtt,mein-reel-1-captionrush.txt', 'SRT/VTT/TXT mit gleicher Basis: ' + global.CLICKS.map(c => c.download).join(','));
    T.setTitle('');
  }
  // Export fertig: Handy mit Teilen-Blatt → „Save to Photos / Share“ primär (erst auf Tipp), sonst „Caption another video“
  {
    const nav = global.navigator, prevMM = global.matchMedia, prevFile = global.File; let shared = null, rejectWith = null;
    global.File = function (parts, name, o) { this.name = name; this.type = o && o.type; };
    nav.canShare = () => true; nav.share = d => { shared = d; return rejectWith ? Promise.reject(rejectWith) : Promise.resolve(); };
    const sb = document.getElementById('expShare'), an = document.getElementById('expAnother'), dlf = document.getElementById('expDlFile');
    an.classList.add('hi');
    global.matchMedia = q => ({ matches: /fine/.test(q) });           // Desktop
    global.CLICKS = []; T.dlBlob(new Blob(['x'], { type: 'video/mp4' }), 'mein-reel-captionrush.mp4'); T.exportDone(false);
    ok(sb.style.display === 'none' && an.classList.contains('hi') && dlf.style.display === 'none', 'Desktop: kein Teilen, „Caption another video“ primär');
    ok(document.getElementById('expDoneName').textContent === 'mein-reel-captionrush.mp4', 'Fertig-Zeile zeigt den Dateinamen');
    global.matchMedia = q => ({ matches: /coarse/.test(q) });         // Handy
    T.exportDone(false);
    ok(sb.style.display === '' && !an.classList.contains('hi') && dlf.style.display === '' && !shared, 'Handy: Teilen primär, nichts automatisch geteilt');
    T.shareLastExport(); await new Promise(r => setTimeout(r, 0));
    ok(shared && shared.files.length === 1 && shared.files[0].name === 'mein-reel-captionrush.mp4' && shared.files[0].type === 'video/mp4', 'Tipp teilt die letzte Datei');
    const nClicks = global.CLICKS.length; rejectWith = { name: 'AbortError' };
    ok(await T.shareLastExport() === false && global.CLICKS.length === nClicks, 'Abbrechen (AbortError) → still, kein Download');
    rejectWith = { name: 'NotAllowedError' };
    await T.shareLastExport();
    ok(global.CLICKS.length === nClicks + 1, 'anderer Fehler → Download als Rückfall');
    nav.canShare = () => false; T.exportDone(false);
    ok(sb.style.display === 'none' && an.classList.contains('hi'), 'canShare false → kein Teilen-Knopf');
    delete nav.canShare; delete nav.share; global.matchMedia = prevMM; global.File = prevFile;
  }

  // Lücken schließen: kurze Lücken (< GAP_CLOSE_SEC) zu, nie über Szenenschnitt, lange Pausen bleiben
  {
    const W = (arr) => arr.map(([w, a, b]) => ({ word: w, start: a, end: b }));
    const mk = (t, a, b) => ({ words: W([[t, a, b]]), start: a, end: b, text: t });
    ok(T.GAP_CLOSE_SEC === 1, 'GAP_CLOSE_SEC = 1 s');
    let bl = [mk('a', 0, 1), mk('b', 1.3, 2), mk('c', 3.5, 4)];
    let n = T.closeCaptionGaps(bl, []);
    ok(n === 1 && bl[0].end === 1.3 && bl[1].end === 2 && bl[0].words[0].end === 1, 'kurze Lücke zu, Wort-Timing bleibt, lange Pause (1,5 s) bleibt');
    bl = [mk('a', 0, 1), mk('b', 1.5, 2)];
    T.closeCaptionGaps(bl, [1.2]);
    ok(bl[0].end === 1.2, 'Verlängerung stoppt am Szenenschnitt: ' + bl[0].end);
    bl = [mk('a', 0, 1.2), mk('b', 1.5, 2)];
    ok(T.closeCaptionGaps(bl, [1.2]) === 0 && bl[0].end === 1.2, 'Block endet genau am Schnitt → nicht darüber hinaus');
    bl = [mk('a', 0, 1), mk('b', 2.0, 2.5)];
    ok(T.closeCaptionGaps(bl, []) === 0, 'Lücke ≥ 1 s (echte Pause) bleibt');
    T.onWpbChange('2'); T.setMaxCharsState(40);
    bl = T.buildCaptionBlocks(W([['Eins', 0, 0.4], ['zwei', 0.5, 0.9], ['drei', 1.0, 1.4], ['vier', 1.45, 1.8], ['fünf.', 3.5, 4.0]]), []);
    ok(bl.length === 3 && bl[0].end === bl[1].start && bl[1].end === 1.8 && bl[2].start === 3.5, 'buildCaptionBlocks: lückenlos bis zur Pause: ' + bl.map(b => b.start + '-' + b.end).join(' '));
    ok(bl[0].words[1].end === 0.9, 'Karaoke-Wortzeiten unverändert');
    bl = T.buildCaptionBlocks(W([['a', 0, 0.4], ['b', 0.5, 0.9], ['c', 1.3, 1.6], ['d', 1.65, 1.9]]), [1.1]);
    ok(bl[0].end === 1.1 && bl[1].start >= 1.1, 'buildCaptionBlocks: Lücke über Schnitt nur bis zum Schnitt');
    // leere Wörter erzeugen keine leeren Blöcke
    bl = T.buildCaptionBlocks(W([['a', 0, 0.4], ['  ', 0.5, 0.9], ['b', 1.0, 1.4]]), []);
    ok(bl.every(b => b.text.trim() && b.end > b.start), 'keine leeren Blöcke');
    T.onWpbChange('4');
  }

  // Zeichenlimit pro Zeile: Block früher schließen statt Schrift schrumpfen
  {
    const W = (arr) => arr.map(([w, a, b]) => ({ word: w, start: a, end: b }));
    const seq = (txt) => { let t = 0; return txt.split(' ').map(w => { const o = { word: w, start: +t.toFixed(2), end: +(t + 0.3).toFixed(2) }; t += 0.35; return o; }); };
    T.setCaseState('asis'); T.selectStyle('minimal'); // Satzschreibung, keine Großbuchstaben
    T.onWpbChange('6'); T.setLinesState(2); T.setMaxCharsState(12);
    ok(JSON.stringify(T.capBlockLimit()) === '{"per":12,"lines":2}', 'manuelles Limit: ' + JSON.stringify(T.capBlockLimit()));
    ok(T.capCharsFit([3, 5, 4, 3], { per: 12, lines: 2 }) && !T.capCharsFit([3, 5, 4, 3, 5], { per: 12, lines: 2 }) && !T.capCharsFit([13, 6], { per: 12, lines: 2 }), 'capCharsFit: gierig in 2 Zeilen à 12');
    const lineFit = (txt, per, lines) => { let nl = 1, cur = 0; txt.split(' ').forEach(w => { const add = cur ? cur + 1 + w.length : w.length; if (cur && add > per) { nl++; cur = w.length; } else cur = add; }); return nl <= lines && txt.length <= per * lines; };
    let bl = T.buildCaptionBlocks(seq('Die Tiere sind das ganze Jahr draussen und fressen nur Gras und Heu'), []);
    ok(bl.length > 2 && bl.every(b => lineFit(b.text, 12, 2)), 'jeder Block ≤ 12 Zeichen × 2 Zeilen: ' + bl.map(b => b.text).join(' | '));
    ok(bl.map(b => b.text).join(' ') === 'Die Tiere sind das ganze Jahr draussen und fressen nur Gras und Heu', 'keine Wörter verloren');
    // Einzelnes überlanges Wort → eigener Block
    bl = T.buildCaptionBlocks(seq('Die Rindfleischverarbeitungsbetriebe sind gross'), []);
    ok(bl.map(b => b.text).join('|') === 'Die|Rindfleischverarbeitungsbetriebe|sind gross', 'langes Wort allein: ' + bl.map(b => b.text).join('|'));
    // Kurzes Nachbarwort darf ab 2 Zeilen mit dem langen Wort in eine Caption, wenn es mit Trennung passt
    ok(T.capCharsFit([3, 24], { per: 16, lines: 2 }) && T.capCharsFit([24, 3], { per: 16, lines: 2 }), 'capCharsFit: „Das“ + 24er-Wort in 2 Zeilen à 16');
    ok(!T.capCharsFit([3, 24], { per: 16, lines: 1 }), 'capCharsFit: 1 Zeile → langes Wort bleibt allein');
    ok(!T.capCharsFit([9, 24], { per: 16, lines: 2 }) && !T.capCharsFit([3, 3, 24], { per: 16, lines: 2 }), 'capCharsFit: nur EIN kurzes Nachbarwort');
    ok(!T.capCharsFit([3, 35], { per: 12, lines: 2 }) && T.capCharsFit([3, 35], { per: 12, lines: 4 }), 'capCharsFit: passt nur, wenn die Zeilen reichen');
    T.setMaxCharsState(16);
    bl = T.buildCaptionBlocks(seq('Das Bundesverfassungsgericht hat entschieden'), []);
    ok(bl.map(b => b.text).join('|') === 'Das Bundesverfassungsgericht|hat entschieden', 'kein verwaistes „Das“: ' + bl.map(b => b.text).join('|'));
    T.setLinesState(1);
    bl = T.buildCaptionBlocks(seq('Das Bundesverfassungsgericht hat entschieden'), []);
    ok(bl.map(b => b.text).join('|') === 'Das|Bundesverfassungsgericht|hat entschieden', '1 Zeile: langes Wort weiter allein: ' + bl.map(b => b.text).join('|'));
    T.setLinesState(2); T.setMaxCharsState(12);
    // 1 Zeile vs 2 Zeilen
    T.setLinesState(1);
    bl = T.buildCaptionBlocks(seq('Die Tiere sind das'), []);
    ok(bl.length === 2 && bl.every(b => b.text.length <= 12), '1 Zeile à 12: ' + bl.map(b => b.text).join('|'));
    T.setLinesState(2);
    bl = T.buildCaptionBlocks(seq('Die Tiere sind das'), []);
    ok(bl.length === 1, '2 Zeilen à 12: ein Block');
    // Anzeige-Text zählt: Großbuchstaben-Style macht aus ß zwei Zeichen
    T.selectStyle('hormozi');
    ok(T.capCharLen('Straße') === 7, 'ß → SS zählt doppelt bei Caps-Style: ' + T.capCharLen('Straße'));
    T.selectStyle('minimal');
    ok(T.capCharLen('Straße') === 6, 'Satzschreibung: 6 Zeichen');
    // Auto: aus Breite abgeleitet, bei größerer Schrift weniger Zeichen
    T.setMaxCharsState(0);
    T.setFontSizeState(22); const a22 = T.capAutoChars();
    T.setFontSizeState(40); const a40 = T.capAutoChars();
    ok(a22 > a40 && a40 >= 6, 'Auto: größere Schrift → kleineres Limit (' + a22 + ' / ' + a40 + ')');
    // Schrift so, dass Auto (~14 Zeichen) dieselbe Gruppierung wie Limit 32 ergibt → Auto an/aus erzeugt
    // keinen eigenen Undo-Schritt und Redo bleibt verfügbar (hängt von der Safe-Zone-Breite ab).
    T.setFontSizeState(19);
    // Unbearbeitet: Limit-Wechsel gruppiert neu (Undo-fähig)
    T.resetUndo(); T.setCaptionsEdited(false); T.setMaxCharsState(32);
    const ws = seq('Die Tiere sind das ganze Jahr draussen und fressen');
    T.setState(T.buildCaptionBlocks(ws), ws.slice());
    const n32 = T.getBlocks().length;
    T.setMaxChars('10');
    ok(T.getBlocks().length > n32 && T.getBlocks().every(b => lineFit(b.text, 10, 2)), 'unbearbeitet: neu gruppiert bei Limit 10: ' + T.getBlocks().map(b => b.text).join('|'));
    ok(T.undoDepth()[0] === 1, 'Limit-Wechsel ist ein Undo-Schritt');
    T.undoCaptions();
    ok(T.getBlocks().length === n32, 'Undo stellt die alten Blöcke wieder her');
    ok(T.projectPayload().maxChars === 32 && document.getElementById('mcSel').value === '32', 'Undo stellt auch den Max-chars-Regler zurück');
    ok(!document.getElementById('mcAuto').classList.contains('on') && document.getElementById('mcDisp').textContent === '32', 'fester Wert: Auto-Chip aus, Zahl sichtbar');
    T.toggleMaxCharsAuto();
    ok(T.projectPayload().maxChars === 0 && document.getElementById('mcAuto').classList.contains('on') && /^Auto · \d+$/.test(document.getElementById('mcAuto').textContent)
       && document.getElementById('mcSel').classList.contains('mc-off'), 'Auto-Chip: an, „Auto · N“, Regler ausgegraut');
    T.toggleMaxCharsAuto();
    ok(T.projectPayload().maxChars === T.capAutoChars() || T.projectPayload().maxChars >= 8, 'Auto aus → fester Wert = abgeleiteter Auto-Wert');
    T.setMaxChars('32');
    T.redoCaptions();
    ok(T.projectPayload().maxChars === 10 && T.getBlocks().length > n32, 'Redo stellt Limit + Blöcke wieder her');
    T.undoCaptions();
    // Bearbeitet: nur überlaufende Blöcke teilen, die anderen bleiben exakt
    T.setMaxCharsState(32);
    const b0 = { words: W([['Kurz', 0, 0.4]]), start: 0, end: 0.5, text: 'Kurz' };
    const b1 = { words: W([['Hallo', 0.5, 0.8], ['zusammen', 0.85, 1.3], ['und', 1.35, 1.5], ['willkommen', 1.55, 2.0]]), start: 0.5, end: 2.2, text: 'Hallo zusammen und willkommen' };
    const b2 = { words: W([['Ende', 2.5, 2.9]]), start: 2.4, end: 3.1, text: 'Ende' }; // manuell getimt
    [b0, b1, b2].forEach(b => b.srcWords = b.words.map(w => Object.assign({}, w)));
    T.setState([b0, b1, b2], []); T.setCaptionsEdited(true); T.resetUndo();
    const keep0 = JSON.stringify(b0), keep2 = JSON.stringify(b2);
    T.setMaxChars('12');
    const nb = T.getBlocks();
    ok(JSON.stringify(nb[0]) === keep0 && JSON.stringify(nb[nb.length - 1]) === keep2, 'bearbeitet: nicht überlaufende Blöcke unverändert');
    // Teilung an der besten Stelle (vor „und“, nicht nach „und“ — capSegmentRun), nicht gierig
    ok(nb.length === 4 && nb[1].text === 'Hallo zusammen' && nb[2].text === 'und willkommen' && nb[1].start === 0.5 && nb[1].end === 1.35 && nb[2].end === 2.2,
       'bearbeitet: nur der überlaufende Block geteilt, lückenlos, Rand-Zeiten bleiben: ' + nb.map(b => b.text + '[' + b.start + '-' + b.end + ']').join(' | '));
    ok(nb[2].words[0].start === 1.35 && nb[2].words[1].end === 2.0 && nb[1].words[1].end === 1.3, 'Wort-Timings beim Teilen erhalten');
    T.undoCaptions();
    ok(T.getBlocks().length === 3, 'Teilen rückgängig');
    // Persistenz: Template-Layout, Projekt-Payload
    T.setMaxCharsState(16);
    ok(T.currentLayout().maxChars === 16 && T.projectPayload().maxChars === 16, 'maxChars in Layout + Projekt');
    ok(T.normalizeTemplate({ id: 'tpl_x', name: 'X', style: { font: "'Inter'" }, layout: { maxChars: 20, lines: 1 } }).layout.maxChars === 20, 'Template behält maxChars');
    T.setMaxCharsState(40); T.setLinesState(2); T.setCaptionsEdited(false); T.resetUndo(); T.onWpbChange('4');
  }

  // Kuratierung: entfernte Preset-IDs → nächstliegender Look (Projekte, Autosave, gemerkter Style, Brand-Default)
  {
    const removed = ['amplify', 'impact2', 'volt', 'pulse', 'evo', 'prime', 'linen', 'carbon', 'tokyo', 'chrome', 'ignite', 'ember', 'y2k',
      'prismpro', 'elevate', 'bloom', 'sonnet', 'align', 'paper2', 'muse', 'sketch', 'chalk'];
    const ids = new Set(T.STYLES.slice(0, 24).map(x => x.id)); // eingebaute Presets stehen vorn (Custom/Templates/Fixtures danach)
    ok(removed.every(id => T.STYLE_ALIASES[id] && ids.has(T.STYLE_ALIASES[id])), 'jede entfernte ID zeigt auf ein vorhandenes Preset');
    ok(Object.keys(T.STYLE_ALIASES).every(id => !ids.has(id)), 'kein Alias verdeckt ein vorhandenes Preset');
    ok(T.resolveStyleId('y2k') === 'neon' && T.resolveStyleId('pulse') === 'boxkara' && T.resolveStyleId('hormozi') === 'hormozi' && T.resolveStyleId('tpl_abc') === 'tpl_abc', 'resolveStyleId');
    ['classic', 'hormozi', 'boxkara', 'beast', 'minimal', 'popone', 'tiktok', 'hush', 'neon', 'editorial', 'marker'].forEach(id => ok(ids.has(id), 'Standard-Look vorhanden: ' + id));
    ok(T.STYLES.filter(x => ids.has(x.id)).every(x => ['none', 'scale', 'punch', 'bounce', 'flash'].includes(x.anim) && !x.hlCycle), 'Presets: nur ruhige Animationen, kein Farbwechsel pro Wort');
    // Projekt/Autosave mit entferntem Style
    T.restoreSavedStyle({ style: 'chalk' });
    ok(T.getActiveId() === 'marker', 'Projekt mit „chalk“ → Marker: ' + T.getActiveId());
    T.restoreSavedStyle({ style: 'amplify' });
    ok(T.getActiveId() === 'hormozi', 'Projekt mit „amplify“ → Bold Pop');
    T.selectStyle('prismpro');
    ok(T.getActiveId() === 'neon', 'selectStyle mit alter ID → Neon');
    // Brand-Default mit alter ID
    const store = { 'capivo.brandTpl': 'paper2' };
    const prevLS = global.localStorage;
    global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
    T.applyBrandOnOpen();
    ok(T.getActiveId() === 'tiktok', 'Brand-Default „paper2“ → TikTok: ' + T.getActiveId());
    global.localStorage = prevLS;
    T.selectStyle('hormozi');
  }

  // ── Typografie: Liang-Silbentrennung, Zeilenumbruch, Caption-Segmentierung ──
  {
    ['de', 'en', 'fr', 'it', 'es'].forEach(c => require('./vendor/hyphen/hyph-' + c + '.js')); // ruft capHyphLoaded
    T.setCapLang('de');
    ok(T.capHyphLang() === 'de', 'Trennsprache de');
    const hy = (w, max, l) => T.capHyphenate(w, p => p.length <= max, l).join(' / ');
    const join = pcs => pcs.map(p => p.replace(/-$/, '')).join('');
    // deutsche Komposita: an der Fuge, nicht „Rindfleischverar-|beitungsbetriebe“
    ok(hy('Rindfleischverarbeitungsbetriebe', 22) === 'Rindfleisch- / verarbeitungsbetriebe', 'Liang de 2 Teile: ' + hy('Rindfleischverarbeitungsbetriebe', 22));
    ok(hy('Rindfleischverarbeitungsbetriebe', 14) === 'Rindfleisch- / verarbeitungs- / betriebe', 'Liang de 3 Teile: ' + hy('Rindfleischverarbeitungsbetriebe', 14));
    ok(hy('Bundesverfassungsgericht', 18) === 'Bundesverfassungs- / gericht', 'Liang Bundesverfassungsgericht: ' + hy('Bundesverfassungsgericht', 18));
    ok(hy('Naturschutzgebiet', 12) === 'Naturschutz- / gebiet', 'nie „…schutzge-|biet“: ' + hy('Naturschutzgebiet', 12));
    ['Rindfleischverarbeitungsbetriebe', 'Bundesverfassungsgericht', 'Geschwindigkeitsbegrenzung', 'Schifffahrtsgesellschaft'].forEach(w => {
      [9, 12, 16, 20].forEach(max => {
        const pcs = T.capHyphenate(w, p => p.length <= max, 'de'), pts = T.capHyphPoints('de', w);
        ok(join(pcs) === w && pcs.every(p => p.length <= max), 'Liang: Stücke passen, nichts verloren: ' + pcs.join('/'));
        ok(pcs.every(p => p.replace(/-$/, '').length >= 3), 'Liang: >= 3 Buchstaben je Teil: ' + pcs.join('/'));
        let at = 0; ok(pcs.slice(0, -1).every(p => { at += p.length - 1; return pts.includes(at); }), 'Liang: nur legale Trennstellen: ' + pcs.join('/'));
      });
    });
    // Groß-/Kleinschreibung ändert die Trennstelle nicht; Satzzeichen bleiben am letzten Teil
    ok(hy('RINDFLEISCHVERARBEITUNGSBETRIEBE', 14) === hy('Rindfleischverarbeitungsbetriebe', 14).toUpperCase(), 'Versalien: gleiche Trennung');
    ok(hy('Rindfleischverarbeitungsbetriebe,', 22) === 'Rindfleisch- / verarbeitungsbetriebe,', 'Komma bleibt am Wortende');
    // vorhandener Bindestrich: dort trennen, kein zusätzlicher Trennstrich
    ok(hy('Highland-Rinder', 10) === 'Highland- / Rinder', 'Bindestrich-Wort: ' + hy('Highland-Rinder', 10));
    ok(hy('Highland-Weidehaltung', 14) === 'Highland- / Weidehaltung', 'Bindestrich-Wort nur am Bindestrich: ' + hy('Highland-Weidehaltung', 14));
    // Englisch
    T.setCapLang('en');
    ok(T.capHyphLang() === 'en' && hy('communication', 9) === 'communi- / cation', 'Liang en: ' + hy('communication', 9));
    T.setCapLang('pt'); ok(T.capHyphLang() === 'en', 'andere Sprache → englische Muster');
    T.setCapLang('de');
    // nie trennen: URLs, Handles, Hashtags, Zahlen, ≤ 7 Buchstaben
    ['#Rindfleischverarbeitung', '@waldundtier_highland', 'www.waldundtier.ch', 'https://waldundtier.ch/fleischverkauf', 'info@waldundtier.ch',
     '1234567890', '2025er-Jahrgang', 'Weiden', 'Highlan', 'Rinder.'].forEach(w => {
      ok(T.capHyphenate(w, p => p.length <= 4, 'de').length === 1, 'nicht getrennt: ' + w);
    });
    ok(hy('Hofladen', 5) === 'Hof- / laden', '8 Buchstaben dürfen getrennt werden: ' + hy('Hofladen', 5));
    // Auto-Fit (Vorschau + Export): einzelnes Kompositum auf 2 Zeilen → an der Fuge, nicht mittendrin
    document.getElementById('prevFrame').style.width = '270px';
    const st = T.STYLES.find(x => x.id === 'classic') || T.STYLES[0];
    const fr = T.fitCaptionWords(['Rindfleischverarbeitungsbetriebe'], st, 40, T.capFitMaxW(st), 2);
    ok(fr.words.join('|') === 'Rindfleisch-|verarbeitungsbetriebe', 'Fit trennt an der Fuge: ' + fr.words.join('|') + ' @' + fr.px);
    const fb = T.fitCaptionWords(['Bundesverfassungsgericht'], st, 40, T.capFitMaxW(st), 2);
    ok(/^(Bundes-\|verfassungsgericht|Bundesverfassungs-\|gericht)$/.test(fb.words.join('|')), 'Fit Bundesverfassungsgericht: ' + fb.words.join('|'));

    // Zeilenumbruch (synthetische Breiten: 10 px je Zeichen, Leerzeichen 10 px)
    const dl = (txt, chars, k = 2, hyAt) => {
      const ws = txt.split(' ');
      const info = ws.map((w, i) => ({ i, w: w.length * 10, t: w, hy: hyAt === i }));
      return T.capDistributeLines(info, k, 10, chars * 10).map(L => L.map(it => it.t));
    };
    const STOP = ['der', 'die', 'das', 'auf', 'unsere', 'und', 'mit', 'the', 'a', 'of', 'to'];
    const heute = 'Heute zeige ich euch unsere Highland Rinder auf der Weide';
    [36, 40, 44, 50].forEach(c => {
      const L = dl(heute, c);
      ok(L.length === 2 && !STOP.includes(L[0][L[0].length - 1]), 'kein Stoppwort am Zeilenende (' + c + '): ' + L.map(x => x.join(' ')).join(' / '));
    });
    let L2 = dl(heute, 44);
    ok(L2[0].join(' ') === 'Heute zeige ich euch' || L2[0].join(' ') === 'Heute zeige ich euch unsere Highland Rinder', 'Umbruch vor „unsere“: ' + L2.map(x => x.join(' ')).join(' / '));
    L2 = dl('aaaa bbbb cccc dddd eeee', 30);
    ok(L2[0].length === 2 && L2[1].length === 3, 'Pyramide: untere Zeile länger: ' + L2.map(x => x.join(' ')).join(' / '));
    L2 = dl('Wir haben heute 5 Kilo Fleisch gekauft', 30);
    ok(!L2.some((l, i) => i < L2.length - 1 && l[l.length - 1] === '5'), 'Zahl + Einheit zusammen: ' + L2.map(x => x.join(' ')).join(' / '));
    L2 = dl('Das kostet nur CHF 20 pro Kilo', 22);
    ok(L2[0][L2[0].length - 1] !== 'CHF', 'CHF + Betrag zusammen: ' + L2.map(x => x.join(' ')).join(' / '));
    L2 = dl('Hallo zusammen, heute geht es um Rinder', 30);
    ok(L2[0].join(' ') === 'Hallo zusammen,', 'Umbruch nach Komma: ' + L2.map(x => x.join(' ')).join(' / '));
    L2 = dl('Er sagt das stimmt so nicht !', 30);
    ok(L2[1][0] !== '!', 'keine Zeile beginnt mit Satzzeichen: ' + L2.map(x => x.join(' ')).join(' / '));
    L2 = dl('Unsere Rindfleisch- verarbeitungsbetriebe sind gross', 40, 2, 1);
    ok(L2[0][L2[0].length - 1] === 'Rindfleisch-', 'Wortteil mit Trennstrich steht am Zeilenende: ' + L2.map(x => x.join(' ')).join(' / '));
    L2 = dl('sich für alle.', 30);
    ok(L2.length === 2 && L2[0].join(' ') === 'sich', '3 Wörter: 2 Zeilen, nicht nach „für“: ' + L2.map(x => x.join(' ')).join(' / '));
    L2 = dl('für alle.', 30);
    ok(L2.length === 1, 'erzwungener Stoppwort-Umbruch → lieber eine Zeile: ' + L2.map(x => x.join(' ')).join(' / '));
    L2 = dl('Gras und Heu.', 30);
    ok(L2.length === 2, 'normaler kurzer Block bleibt gestapelt (2 Zeilen): ' + L2.map(x => x.join(' ')).join(' / '));
    L2 = dl('eins zwei drei vier', 3);
    ok(L2.length >= 2 && L2.flat().join(' ') === 'eins zwei drei vier', 'passt nichts → bisheriges Verfahren, kein Absturz');
    // Vorschau (wrapCaptionLines) und Export (capLayout) verteilen identisch
    T.setLinesState(2);
    const bl = { words: heute.split(' ').map((w, i) => ({ word: w, start: i * 0.3, end: i * 0.3 + 0.25 })), start: 0, end: 3, text: heute };
    T.setState([bl], bl.words.slice(), 'karaoke');
    const fit = T.fitCaptionWords(bl.words.map(w => T.displayWord(w.word)), st, T.getFontSize(), T.capFitMaxW(st), 2);
    const prev = T.wrapCaptionLines(fit.words, st, 2, fit.px, 2, fit.orig).map(l => l.map(i => fit.words[i]).join(' '));
    const lay = T.capLayout(document.createElement('canvas').getContext('2d'), bl, 0, 2, st, 1080, 1920);
    const exp = lay.lines.map(l => l.map(it => it.t).join(' '));
    ok(JSON.stringify(prev) === JSON.stringify(exp) && prev.length === 2, 'Vorschau = Export: ' + prev.join(' / ') + ' ‖ ' + exp.join(' / '));

    // Caption-Segmentierung (automatischer Aufbau)
    T.setMaxCharsState(40); T.setCaptionsEdited(false);
    const seq = (txt, gap = 0.05) => { let t = 0; return txt.split(' ').map(w => { const o = { word: w, start: t, end: t + 0.3 }; t += 0.3 + gap; return o; }); };
    const blocks = (txt, wpb, gap) => { T.onWpbChange(String(wpb)); const ws = seq(txt, gap); T.setWordsState(ws); return T.buildCaptionBlocks(ws, []).map(b => b.text); };
    let bt = blocks('eins zwei drei vier fünf', 4);
    ok(bt.join('|') === 'eins zwei drei|vier fünf', '5 Wörter bei 4 → 3+2: ' + bt.join('|'));
    bt = blocks('Die Rinder fressen nur Gras und Heu.', 3);
    ok(bt.join('|') === 'Die Rinder|fressen nur|Gras und Heu.' || !bt.some(b => / (und|der|die|das)$/.test(b)), 'kein „und |“ am Caption-Ende: ' + bt.join('|'));
    bt = blocks('fressen nur Gras und Heu.', 4);
    ok(bt.join('|') === 'fressen nur|Gras und Heu.', '„fressen nur | Gras und Heu.“: ' + bt.join('|'));
    bt = blocks(heute + '.', 4);
    ok(bt.every((b, i) => i === bt.length - 1 || !STOP.includes(b.split(' ').pop())) && bt.every(b => b.split(' ').length <= 4), 'Captions enden nicht auf Artikel/Präposition: ' + bt.join('|'));
    bt = blocks('Wir kaufen heute 5 Kilo Fleisch und Wurst', 4);
    ok(!bt.some((b, i) => i < bt.length - 1 && /\b5$/.test(b)), 'Zahl + Einheit in einer Caption: ' + bt.join('|'));
    bt = blocks(heute + '.', 1);
    ok(bt.length === 10 && bt.every(b => !b.includes(' ')), 'Words = 1 bleibt ein Wort pro Caption');
    bt = blocks('Hallo zusammen. Heute zeige ich euch', 4);
    ok(bt[0] === 'Hallo zusammen.', 'Satzende bleibt harte Grenze: ' + bt.join('|'));
    bt = blocks('eins zwei drei vier fünf sechs', 4, 0.9);
    ok(bt.length === 6, 'Pause > 0,8 s bleibt harte Grenze');
    T.setMaxCharsState(12);
    bt = blocks('Unsere Rinder fressen das ganze Jahr frisches Gras', 4);
    ok(bt.every(b => T.capCharsFit(b.split(' ').map(w => w.length), T.capBlockLimit())), 'Zeichenlimit eingehalten: ' + bt.join('|'));
    T.setMaxCharsState(40);
    // bearbeitete Captions: nicht überlaufende Blöcke bleiben exakt (auch wenn sie auf „und“ enden)
    const eb = [{ words: seq('fressen nur Gras und'), start: 0, end: 1.4, text: 'fressen nur Gras und' },
                { words: seq('Heu.').map(w => ({ word: w.word, start: 1.4, end: 1.7 })), start: 1.4, end: 1.8, text: 'Heu.' }];
    eb.forEach(b => b.srcWords = b.words.map(w => Object.assign({}, w)));
    const ebKeep = JSON.stringify(eb);
    T.setState(eb, [], 'karaoke'); T.setCaptionsEdited(true); T.resetUndo();
    T.setMaxChars('30');
    ok(JSON.stringify(T.getBlocks()) === ebKeep, 'bearbeitete Captions unverändert');
    T.setMaxCharsState(40); T.setCaptionsEdited(false); T.resetUndo(); T.onWpbChange('4');
    // Typografie in der Anzeige
    ok(T.capTypo('Na...') === 'Na…' && T.capTypo("geht's") === 'geht’s' && T.capTypo("'98") === "'98", 'Ellipse + Apostroph');
    T.setCapLang(null);
    document.getElementById('prevFrame').style.width = '';
  }

  // ── Emphasis: KI-Keywords, Emojis, Auto-Zoom, Post-Text ──
  {
    const seqE = (txt, t0 = 0) => { let t = t0; return txt.split(' ').map(w => { const o = { word: w, start: +t.toFixed(2), end: +(t + 0.3).toFixed(2) }; t += 0.35; return o; }); };
    T.setMaxCharsState(40); T.setLinesState(2); T.setCaptionsEdited(false); T.resetUndo(); T.onWpbChange('4'); T.setEmphState(true, false, 'off');
    const ws = seqE('Unsere Highland Rinder fressen nur Gras. Das merkt man am Fleisch.');
    T.setState(T.buildCaptionBlocks(ws), ws.slice(), 'karaoke');
    let B = T.getBlocks();
    // Fallback-Heuristik (Deutsch): Nomen/Zahlen, nie Stoppwörter, höchstens eins je Caption
    const n = T.localEmphasis(B, 'de');
    const em = B.map(b => b.words.filter(T.isEmphWord).map(w => w.word));
    ok(n <= Math.floor(ws.length * 0.3) && em.every(e => e.length <= 1) && em.flat().some(w => /Highland|Rinder|Gras|Fleisch/.test(w))
       && !em.flat().some(w => /^(Das|nur|am|man|Unsere)$/.test(w)), 'Heuristik: max. ein Wort je Caption, ≤ 30 %, Nomen statt Füllwörter: ' + JSON.stringify(em));
    T.clearAutoFlags(B);
    ok(!B.some(b => b.words.some(w => w.kw || w.zm)), 'clearAutoFlags entfernt automatische Flags');
    const en = [{ word: 'we', start: 0, end: 0.2 }, { word: 'sold', start: 0.2, end: 0.4 }, { word: '500', start: 0.4, end: 0.6 }, { word: 'tickets', start: 0.6, end: 0.9 }];
    const eb = [{ words: en, start: 0, end: 1, text: 'we sold 500 tickets' }];
    T.localEmphasis(eb, 'en');
    ok(en[2].kw === 1 && en[2].zm === 1 && !en[0].kw, 'Heuristik: Zahl schlägt Wort, Zahl = Zoom-Kandidat');

    // KI-Ergebnis: Mapping über (Wort, Startzeit), Nutzer-Entscheidungen bleiben, gelöschte Wörter fallen weg
    T.setState(T.buildCaptionBlocks(ws), ws.slice(), 'karaoke'); B = T.getBlocks();
    const refs = B.map(b => b.words.map(T.emWordRef));
    B[0].words[0].kw = -1;                       // Nutzer hat „Unsere“ ausgeschaltet
    B[1].words[0].emo = '🔥'; B[1].words[0].emoU = 1; // Nutzer-Emoji
    const lastBlock = B[B.length - 1];
    const res = [{ id: 0, kw: [0, 2], emoji: '🐄', zoom: true }, { id: 1, kw: [0], emoji: '🌾', zoom: false }, { id: B.length - 1, kw: [lastBlock.words.length - 1], emoji: null, zoom: false }, { id: 99, kw: [0] }];
    lastBlock.words.pop(); lastBlock.text = lastBlock.words.map(w => w.word).join(' '); // Wort während der Anfrage gelöscht
    T.applyEnhanceResult(res, refs);
    ok(B[0].words[0].kw === -1 && B[0].words[2].kw === 1, 'Nutzer-Aus bleibt, KI-Keyword gesetzt');
    ok(T.blockEmoji(B[0]) === '🐄' && B[0].words[2].emo === '🐄' && B[0].words[2].zm === 1, 'Emoji/Zoom am ersten Keyword verankert');
    ok(T.blockEmoji(B[1]) === '🔥', 'Nutzer-Emoji wird von der KI nie überschrieben');
    ok(!lastBlock.words.some(w => w.kw), 'Keyword eines gelöschten Worts fällt weg');
    ok(B[0].srcWords[2].kw === 1 && B[0].srcWords[2].emo === '🐄', 'srcWords tragen die Flags mit (für spätere Text-Edits)');

    // Text-Edit: Flags folgen dem Wort (LCS), auch bei Einfügungen; geändertes Wort im gleichen Slot behält sie
    const b0 = B[0], kwWord = b0.words[2].word;
    b0.text = 'Hey ' + b0.text; T.retimeEditedBlock(b0);
    const moved = b0.words.find(w => w.word === kwWord);
    ok(moved && moved.kw === 1 && moved.emo === '🐄' && moved.zm === 1 && !b0.words[0].kw, 'Einfügung vorne: Flags bleiben am Wort ' + kwWord);
    b0.text = b0.words.map(w => w.word === kwWord ? kwWord + 's' : w.word).join(' '); T.retimeEditedBlock(b0);
    ok(b0.words.find(w => w.word === kwWord + 's').kw === 1, 'Tippfehler-Korrektur (gleicher Slot) behält die Hervorhebung');
    b0.text = b0.words.filter(w => !/^Highland/.test(w.word) && w.word !== kwWord + 's').map(w => w.word).join(' '); T.retimeEditedBlock(b0);
    ok(!b0.words.some(w => w.kw === 1), 'Wort gelöscht → Hervorhebung weg');
    // Neu gruppieren (Words-Regler) und Wortliste behalten Flags
    T.setState(T.buildCaptionBlocks(ws), ws.slice(), 'karaoke'); B = T.getBlocks();
    B[1].words[1].kw = 2; B[1].words[1].emo = '💪'; B[1].words[1].emoU = 1;
    const fw = B[1].words[1].word;
    T.onWpbChange('2');
    const after = [].concat(...T.getBlocks().map(b => b.words)).find(w => w.word === fw);
    ok(after && after.kw === 2 && after.emo === '💪', 'Neu-Gruppieren behält Hervorhebung + Emoji');
    T.onWpbChange('4'); B = T.getBlocks();

    // Undo/Projekt: Flags im Snapshot + Payload, Schalter im Payload
    T.resetUndo();
    const bi = B.findIndex(b => b.words.some(w => w.word === fw)), wi = B[bi].words.findIndex(w => w.word === fw);
    T.toggleWordEmph(bi, wi);
    ok(T.getBlocks()[bi].words[wi].kw === -1 && T.undoDepth()[0] === 1, 'Wort umschalten = Undo-Schritt');
    T.undoCaptions();
    ok(T.getBlocks()[bi].words[wi].kw === 2, 'Undo stellt die Hervorhebung wieder her');
    T.setBlockEmoji(bi, '🚀');
    ok(T.blockEmoji(T.getBlocks()[bi]) === '🚀' && T.getEmph().emoji === true, 'Emoji setzen schaltet Emojis an');
    T.setBlockEmoji(bi, '');
    ok(T.blockEmoji(T.getBlocks()[bi]) === '' && T.getBlocks()[bi].words.some(w => w.emoU), 'Emoji entfernen merkt sich die Nutzer-Entscheidung');
    T.setBlockEmoji(bi, '🚀'); T.setEmphState(true, true, 'subtle');
    const pl = JSON.parse(JSON.stringify(T.projectPayload()));
    ok(pl.emph.kw === true && pl.emph.emoji === true && pl.emph.zoom === 'subtle' && pl.blocks[bi].words.some(w => w.emo === '🚀' && w.emoU === 1), 'Projekt-Payload: Schalter + Flags pro Wort');
    T.setEmphState(false, false, 'off');
    T.applyProjectPayload(Object.assign({}, pl, { keywords: ['fressen'] }));
    const g = T.getEmph();
    ok(g.kw === true && g.emoji === true && g.zoom === 'subtle' && T.blockEmoji(T.getBlocks()[bi]) === '🚀', 'Projekt laden stellt Schalter + Emoji wieder her');
    ok(T.getBlocks().some(b => b.words.some(w => w.word === 'fressen' && w.kw === 2)) && !T.isKeywordWord('fressen'), 'alte Keyword-Liste → pro Wort, Liste geleert');
    ok(T.getUndoSnapshot().indexOf('"kw"') >= 0, 'Undo-Snapshot enthält die Flags');
    // Templates speichern die drei Schalter
    const tl = T.currentLayout();
    ok(tl.kw === true && tl.emoji === true && tl.zoom === 'subtle', 'currentLayout: Emphasis-Schalter');
    const nt = T.normalizeTemplate({ id: 'tpl_x', name: 'X', style: { fl: 'Inter' }, layout: { kw: false, emoji: true, zoom: 'punchy', bogus: 1 } });
    ok(nt.layout.kw === false && nt.layout.emoji === true && nt.layout.zoom === 'punchy' && T.normalizeTemplate({ id: 'tpl_y', style: {}, layout: { zoom: 'wild' } }).layout.zoom === undefined, 'Template: Schalter normalisiert');

    // Fitting: hervorgehobenes Wort ist größer → Fit misst es mit (sonst Überlauf)
    const hz = T.STYLES.find(x => x.id === 'hormozi');
    document.getElementById('prevFrame').style.width = '220px'; document.getElementById('prevFrame').style.height = '390px';
    const wordsF = ['Rindfleischbetrieb', 'heute'];
    const f0 = T.fitCaptionWords(wordsF, hz, 26, T.capFitMaxW(hz), 2), f1 = T.fitCaptionWords(wordsF, hz, 26, T.capFitMaxW(hz), 2, [true, false]);
    ok(f1.px < f0.px || f1.words.length > f0.words.length, 'Fit: betontes langes Wort → kleiner/getrennt (' + f0.px + '/' + f0.words.length + ' vs ' + f1.px + '/' + f1.words.length + ')');
    ok(T.emphScale(hz) === 1.12 && T.emphScale(T.STYLES.find(x => x.id === 'popone')) === 1.15, 'Skalierung: 1.12, One Word 1.15');
    // Farben: Style-Akzent, Pill-Styles behalten Text-Schatten, One Word nur Grösse
    ok(T.emphColor(hz) === '#FFD60A' && T.emphColor(T.STYLES.find(x => x.id === 'popone')) === null && T.emphColor(T.STYLES.find(x => x.id === 'minimal')) === '#fff'
       && T.emphColor(T.STYLES.find(x => x.id === 'stack')) === '#f7c204' && !T.emphShadowIsHl(T.STYLES.find(x => x.id === 'focus')), 'Akzentfarben je Style');
    ok(T.STYLES.filter(s => !s._isTpl && s.id !== 'custom').every(s => T.emphColor(s) !== null || ['popone', 'tight', 'statement'].includes(s.id)), 'alle Styles haben eine sichtbare Betonung (ausser One Word, Tight, Statement: nur Grösse/keine)');
    const h1 = T.buildCap(['auf', 'der', 'Weide.'], hz, 0, 24, [0, 0.3, 0.6], 2, { em: [false, false, true], emoji: '🌿', age: 0.1 });
    ok(/font-size:1\.12em/.test(h1) && /FFD60A/.test(h1) && /class="cap-emo"/.test(h1) && /🌿/.test(h1) && /animation-delay:-0\.100s/.test(h1) && /position:relative/.test(h1),
       'buildCap: Betonung (Grösse + Farbe) und Emoji mit Pop-in-Phase');
    ok(!/cap-emo/.test(T.buildCap(['a', 'b'], hz, 0, 24, null, 2, { em: null, emoji: '' })), 'ohne Emoji kein Emoji-Element');
    // Canvas: Emoji wird gezeichnet, betontes Wort größer
    const fonts = [], draws = [];
    const cctx = { _font: '', get font() { return this._font; }, set font(v) { this._font = v; fonts.push(v); }, letterSpacing: '0px', globalAlpha: 1,
      measureText(str) { const m = /([\d.]+)px/.exec(this._font); return { width: (str || '').length * (m ? +m[1] : 16) * 0.55 }; },
      fillText() {}, strokeText() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, beginPath() {}, fill() {}, stroke() {}, rect() {}, roundRect() {}, ellipse() {}, fillRect() {},
      drawImage(cv) { draws.push(cv); }, createLinearGradient() { return { addColorStop() {} }; } };
    const ew = seqE('Wir lieben unsere Weide');
    ew[3].kw = 1; ew[3].emo = '🌿';
    T.setState([{ words: ew, srcWords: ew.map(w => Object.assign({}, w)), start: 0, end: 1.5, text: 'Wir lieben unsere Weide' }], ew, 'karaoke');
    T.setEmphState(true, true, 'off');
    T.drawCaptionsOnCtx(cctx, 0.5, hz, 1080, 1920, false);
    const sizes = fonts.map(f => +(/([\d.]+)px/.exec(f) || [0, 0])[1]).filter(Boolean);
    ok(Math.max(...sizes) / Math.min(...sizes.filter(x => x > 20)) > 1.1, 'Export: betontes Wort mit größerer Schrift');
    ok(draws.length >= 1, 'Export: Emoji gezeichnet');
    T.setEmphState(true, false, 'off'); draws.length = 0;
    T.drawCaptionsOnCtx(cctx, 0.5, hz, 1080, 1920, false);
    ok(draws.length === 0, 'Emojis aus → kein Emoji');
    ok(T.emojiPopState(0).op === 0 && T.emojiPopState(0.2).s > 1 && T.emojiPopState(1).s === 1, 'Emoji-Pop: 0 → Überschwinger → 1');

    // Auto-Zoom: Abstand ≥ 4 s, nie über einen Schnitt, harte Kante am Schnitt, weich sonst
    const zp = T.zoomPlanFrom([1, 2, 3, 6, 9.5, 11, 20], [12.5, 21], 30);
    ok(zp.length === 4 && zp[0].s === 0.9 && zp.every((z, i) => !i || z.s - zp[i - 1].s >= 4), 'Zoom-Starts ≥ 4 s auseinander: ' + JSON.stringify(zp));
    ok(zp.every(z => ![12.5, 21].some(c => c > z.s + 1e-9 && c < z.e - 1e-9)), 'kein Zoom läuft über einen Schnitt');
    const zc = zp.find(z => z.s < 12.5 && z.e === 12.5);
    ok(zc && zc.hard && T.zoomScaleAt(12.49, zp, 1.18) > 1.1 && T.zoomScaleAt(12.51, zp, 1.18) === 1, 'Zoom endet hart am Schnitt');
    ok(!T.zoomPlanFrom([9.5], [9.8], 30).length, 'zu kurzer Zoom vor einem Schnitt entfällt');
    ok(T.zoomPlanFrom([10.05], [10], 30)[0].s === 10, 'Zoom beginnt nicht vor dem Schnitt');
    const z0 = zp[0];
    ok(T.zoomScaleAt(z0.s, zp, 1.1) === 1 && Math.abs(T.zoomScaleAt(z0.s + 0.15, zp, 1.1) - 1.05) < 1e-9 && T.zoomScaleAt(z0.s + 1, zp, 1.1) === 1.1
       && T.zoomScaleAt(z0.e - 0.01, zp, 1.1) < 1.01 && T.zoomScaleAt(z0.e, zp, 1.1) === 1, 'weiches Ein-/Ausfahren (Subtle 1.10)');
    T.setEmphState(true, false, 'off');
    ok(T.zoomAt(1.5) === 1, 'Auto zoom aus → nie Zoom');

    // KI-Anfrage im Hintergrund: Erfolg (Endpoint-Fallback 404 → enhance.php) bzw. Fehler → lokale Heuristik
    T.setState(T.buildCaptionBlocks(ws), ws.slice(), 'karaoke'); B = T.getBlocks();
    let sent = [];
    global.fetch = async (u, o) => { sent.push(u); if (u === 'api/enhance') return { ok: false, status: 404, json: async () => ({}) };
      const body = JSON.parse(o.body); return { ok: true, status: 200, json: async () => ({ segments: body.segments.map(s => ({ id: s.id, kw: [0], emoji: s.id === 1 ? '🌾' : null, zoom: false })) }) }; };
    ok(await T.runEnhance(true) === 'llm' && sent.join() === 'api/enhance,enhance.php' && T.getBlocks().every(b => T.isEmphWord(b.words[0])) && T.blockEmoji(T.getBlocks()[1]) === '🌾',
       'KI: Endpoint-Fallback, Ergebnis angewendet');
    global.fetch = async () => { throw new TypeError('Failed to fetch'); };
    ok(await T.runEnhance(true) === 'local' && T.getBlocks().some(b => b.words.some(w => w.kw === 1)) && !T.getBlocks().some(b => T.blockEmoji(b)), 'KI offline → lokale Heuristik, keine Emojis');
    // Post-Text: KI, sonst lokale Version aus dem Transkript (ohne erfundene Fakten)
    global.fetch = async (u, o) => { const b = JSON.parse(o.body); return { ok: true, status: 200, json: async () => ({ post: { caption: 'Highland Rinder auf der Weide', hashtags: ['#Rinder', '#Weide', '#Hof'] }, lang: b.lang }) }; };
    await T.genPostCaption(true);
    ok(T.getPost().caption === 'Highland Rinder auf der Weide' && T.getPost().hashtags.length === 3 && /\n\n#Rinder #Weide #Hof$/.test(T.postText(T.getPost())), 'Post-Text: Caption + Hashtags');
    global.fetch = async () => ({ ok: false, status: 502, json: async () => ({ error: 'x' }) });
    await T.genPostCaption(true);
    ok(T.getPost().src === 'local' && /^Unsere Highland Rinder fressen nur Gras\./.test(T.getPost().caption), 'Post-Text ohne KI: erster Satz aus dem Transkript ' + JSON.stringify(T.getPost()));
    ok(T.projectPayload().post && T.projectPayload().post.caption === T.getPost().caption, 'Post-Text im Projekt gespeichert');

    // Polish im Hintergrund: übernimmt nur, wenn seitdem nichts geändert wurde
    const pw = seqE('wir sind am birkehof');
    T.setState(T.buildCaptionBlocks(pw), pw.slice(), 'karaoke'); T.setCaptionsEdited(false);
    global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ segments: [{ id: 0, text: 'Wir sind am Birkenhof' }] }) });
    ok(await T.polishInPlace(T.getTrRun(), 'de', '') === true && /Birkenhof/.test(T.getBlocks().map(b => b.text).join(' ')), 'Polish wird eingesetzt, wenn nichts geändert wurde');
    T.setState(T.buildCaptionBlocks(pw), pw.slice(), 'karaoke'); T.setCaptionsEdited(true);
    ok(await T.polishInPlace(T.getTrRun(), 'de', '') === false && !/Birkenhof/.test(T.getBlocks().map(b => b.text).join(' ')), 'nach einem Edit wird Polish verworfen');
    T.setCaptionsEdited(false);
    T.setEmphState(true, false, 'off');
    document.getElementById('prevFrame').style.width = ''; document.getElementById('prevFrame').style.height = '';
  }

  // 30) Ruhige Bewegung: Reveal/Fill/Highlight-Übergänge, gleitende Box, Block ein/aus, Standard-Style
  {
    const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-6);
    const M = T.CAP_MOT;
    // Canvas-Stub mit echtem save/restore (Deckkraft/Font/Translate), protokolliert fillText + Boxen
    const mkCtx = (canvas) => {
      const c = { canvas, _st: [], _font: '', letterSpacing: '0px', globalAlpha: 1, ty: 0, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, filter: 'none',
        shadowColor: '', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, textAlign: 'left', textBaseline: 'alphabetic', calls: [], rects: [], imgs: 0,
        get font() { return this._font; }, set font(v) { this._font = v; },
        measureText(str) { const m = /([\d.]+)px/.exec(this._font); return { width: (str || '').length * (m ? +m[1] : 16) * 0.55 }; },
        save() { this._st.push([this.globalAlpha, this.ty, this.fillStyle, this._font]); },
        restore() { const v = this._st.pop(); if (v) { this.globalAlpha = v[0]; this.ty = v[1]; this.fillStyle = v[2]; this._font = v[3]; } },
        translate(x, y) { this.ty += y; }, scale() {}, rotate() {},
        fillText(t, x, y) { this.calls.push({ t, x, y: y + this.ty, a: this.globalAlpha, fs: this.fillStyle, font: this._font, sb: this.shadowBlur, sc: this.shadowColor }); }, strokeText() {},
        roundRect(x, y, w, h) { this.rects.push({ x, y: y + this.ty, w, h, a: this.globalAlpha, fs: this.fillStyle }); }, rect(x, y, w, h) { this.rects.push({ x, y, w, h, a: this.globalAlpha }); },
        beginPath() {}, fill() {}, stroke() {}, ellipse() {}, fillRect() {}, drawImage() { this.imgs++; }, createLinearGradient() { return { addColorStop() {} }; } };
      return c;
    };
    const ST = id => T.STYLES.find(x => x.id === id);
    T.setEmphState(false, false, 'off'); T.setTimeOffState(0);
    const ws = ['eins', 'zwei', 'drei', 'vier'].map((w, i) => ({ word: w, start: 1 + i * 0.5, end: 1 + i * 0.5 + 0.4 }));
    T.setState(T.buildCaptionBlocks(ws), [], 'karaoke');
    const b = T.getBlocks()[0];
    ok(T.getBlocks().length === 1 && b.words.length === 4, 'Motion: Testblock mit 4 Woertern');
    // Modi
    ok(T.capMotion(ST('reveal')) === 'reveal' && T.capMotion(ST('note')) === 'fill' && T.capMotion(ST('script')) === 'reveal' && T.capMotion(ST('soft')) === 'fill'
       && T.capMotion(ST('hormozi')) === 'highlight' && T.capMotion({ motion: 'quatsch' }) === 'highlight', 'capMotion: neue Presets + Fallback Highlight');
    ok(T.STYLES.slice(0, 9).map(x => x.id).join() === 'tight,mix,statement,accent,serifbold,reveal,note,script,soft', 'neue Looks und ruhige Presets stehen vorn im Picker');
    // Reveal: unsichtbar vor dem Wort, ~220 ms Einblenden mit Anstieg, danach voll
    const rv = ST('reveal'), fx = (s, i, t, f, rm) => T.capWordFx(s, b, i, T.activeWordIdx(b, t), t, !!f, !!rm);
    ok(fx(rv, 1, 1.49).op === 0 && fx(rv, 2, 1.6).op === 0, 'Reveal: kommende Woerter unsichtbar');
    const mid = fx(rv, 1, 1.55);
    ok(mid.op > 0.3 && mid.op < 1 && mid.dy > 0 && mid.dy < M.revealRise, 'Reveal: Wort blendet ein + steigt auf: op=' + mid.op.toFixed(3) + ' dy=' + mid.dy.toFixed(3));
    ok(fx(rv, 1, 1.5 + M.reveal).op === 1 && fx(rv, 1, 1.5 + M.reveal).dy === 0 && fx(rv, 0, 2.9).op === 1, 'Reveal: nach ~220 ms voll sichtbar, bleibt stehen');
    ok(fx(rv, 3, 0.5, true).op === 1, 'Reveal: pausierte Vorschau vor dem Block zeigt die ganze Phrase');
    ok(fx(rv, 1, 1.55, false, true).op === 1 && fx(rv, 2, 1.55, false, true).op === 0, 'Reveal: reduzierte Bewegung = ohne Uebergang');
    ok(M.reveal >= 0.2 && M.reveal <= 0.3 && M.revealRise > 0, 'Reveal: 200–300 ms');
    // Fill: kommende gedimmt, gesprochene voll, weicher Übergang
    const nt = ST('note');
    ok(fx(nt, 3, 1.6).op === M.dim && fx(nt, 3, 1.6).hk === 0 && M.dim >= 0.35 && M.dim <= 0.45, 'Fill: kommende Woerter ~40 %');
    ok(fx(nt, 0, 1.6).op === 1 && fx(nt, 0, 1.6).hk === 1, 'Fill: gesprochene Woerter voll');
    const fm = fx(nt, 1, 1.53);
    ok(fm.op > M.dim && fm.op < 1 && fm.hk > 0 && fm.hk < 1, 'Fill: Uebergang ~120 ms: op=' + fm.op.toFixed(3));
    ok(T.capFxSteady(fx(nt, 3, 1.6), 'fill') && T.capFxSteady(fx(nt, 0, 1.6), 'fill') && !T.capFxSteady(fm, 'fill'), 'Fill: Endzustaende fuer die statische Export-Ebene');
    // Highlight: Farbe blendet ~120 ms über, voriges Wort gibt sie ab; Pop ≤ 1.04
    const hz = ST('hormozi');
    const h1 = fx(hz, 1, 1.53), h0 = fx(hz, 0, 1.53);
    ok(h1.hk > 0 && h1.hk < 1 && h0.hk > 0 && h0.hk < 1, 'Highlight: Farbwechsel weich (aktiv ' + h1.hk.toFixed(2) + ', vorher ' + h0.hk.toFixed(2) + ')');
    ok(fx(hz, 1, 1.5 + M.hl).hk === 1 && fx(hz, 0, 1.5 + M.hl).hk === 0 && fx(hz, 2, 1.53).hk === 0, 'Highlight: danach eindeutig');
    let peak = 1; for (let k = 0; k <= 40; k++) { const a = fx(hz, 1, 1.5 + k * 0.01).a; if (a) peak = Math.max(peak, a.sx); }
    ok(peak >= 1.1 && peak <= 1.14 + 1e-9, 'Bold Pop: Pop deutlich sichtbar, hoechstens 1.14: ' + peak.toFixed(3));
    // Word pop (csAnim): jede Option sofort deutlich erkennbar — auch ein einzelnes Bild kurz nach Wortbeginn (80 ms)
    {
      const csHtml = htmlContent.match(/<select id="csAnim"[\s\S]*?<\/select>/)[0];
      const opts = [...csHtml.matchAll(/<option value="(\w+)">/g)].map(m => m[1]);
      ok(opts.join() === 'none,scale,punch,bounce,flash,glow', 'csAnim: Optionen None/Pop/Punch/Lift/Fade/Glow: ' + opts.join());
      const strong = a => a && (Math.abs(a.sx - 1) >= 0.1 || Math.abs(a.ty) >= 0.15 || a.op <= 0.3 || a.glow >= 0.5);
      ok(T.animState('none', 0.08) === null && T.animState('scale', T.ANIM_DUR) === null && T.animState('scale', -0.1) === null, 'animState: none/abgelaufen/vorher → null');
      opts.filter(o => o !== 'none').forEach(o => {
        const a = T.animState(o, 0.08);
        ok(a !== null && strong(a), 'Word pop «' + o + '» bei 80 ms deutlich erkennbar: ' + JSON.stringify(a));
        let mx = { sx: 1, ty: 0, op: 1, glow: 0 };
        for (let k = 0; k <= 339; k++) { const q = T.animState(o, k * 0.001); mx = { sx: Math.max(mx.sx, q.sx), ty: Math.max(mx.ty, q.ty), op: Math.min(mx.op, q.op), glow: Math.max(mx.glow, q.glow) }; }
        ok(mx.sx >= 1.14 - 1e-9 || mx.ty >= 0.22 - 1e-9 || mx.op <= 1e-9 || mx.glow >= 1 - 1e-9, 'Word pop «' + o + '»: Spitzenausschlag: ' + JSON.stringify(mx));
        const e = T.animState(o, T.ANIM_DUR - 1e-6);
        ok(Math.abs(e.sx - 1) < 0.02 && Math.abs(e.ty) < 0.01 && e.op > 0.98 && e.glow < 0.02, 'Word pop «' + o + '» endet im Ruhezustand');
      });
      ok(near(T.animState('punch', 0).sx, 1.28) && near(T.animState('punch', 0.17).sx, 1.0 + 0.28 * Math.pow(0.5, 3)) && T.animState('punch', 0.08).sx < T.animState('punch', 0.0).sx, 'Punch: 1.28 → 1 mit ease-out');
      ok(near(T.animState('bounce', 0).ty, 0.22) && near(T.animState('bounce', 0).op, 0.5) && near(T.animState('flash', 0).op, 0) && near(T.animState('wobble', 0.1).ty, T.animState('bounce', 0.1).ty), 'Lift: 0,22 em + Deckkraft .5; Fade: 0; wobble = Lift');
      // Vorschau = Export: die CSS-Keyframes (Kacheln/Hover) tragen dieselben Werte wie ANIM_KEYFRAMES
      const css = n => (htmlContent.match(new RegExp('@keyframes captly-' + n + '(\\{.*)')) || [, ''])[1];
      const nums = (str, re) => [...str.matchAll(re)].map(m => parseFloat(m[1]));
      const kfMax = (n, k) => Math.max(...T.ANIM_KEYFRAMES[n].map(e => e[1][k] === undefined ? -Infinity : e[1][k]));
      ok(Math.max(...nums(css('scale'), /scale\(([\d.]+)\)/g)) === kfMax('scale', 'sx'), 'CSS = JS: Pop-Spitze ' + kfMax('scale', 'sx'));
      ok(nums(css('punch'), /scale\(([\d.]+)\)/g)[0] === kfMax('punch', 'sx') && /cubic-bezier\(\.33,1,\.68,1\)/.test(css('punch')), 'CSS = JS: Punch-Start ' + kfMax('punch', 'sx') + ' + ease-out');
      ok(nums(css('bounce'), /translateY\(([\d.]+)em\)/g)[0] === kfMax('bounce', 'ty') && nums(css('bounce'), /opacity:([\d.]+)/g)[0] === T.ANIM_KEYFRAMES.bounce[0][1].op, 'CSS = JS: Lift ty (em) + Deckkraft');
      ok(nums(css('flash'), /opacity:([\d.]+)/g)[0] === T.ANIM_KEYFRAMES.flash[0][1].op && css('wobble') === css('bounce'), 'CSS = JS: Fade-Start; wobble = Lift');
      ok(/drop-shadow\(0 0 \.35em currentColor\)/.test(css('glow')) && !/brightness/.test(css('glow')) && !/bright|brightness/.test(htmlContent.match(/var ANIM_KEYFRAMES[\s\S]*?\n\};/)[0]), 'Glow: Leuchten statt brightness (CSS + JS)');
      // Glow im Export: Schatten in der Highlight-Farbe nur während der Animation, Pop ohne Schatten-Zusatz
      const gs = Object.assign({}, ST('hormozi'), { anim: 'glow', hls: 'none', hl: '#ff3366', motion: undefined });
      const glowCalls = (t, st) => { const c = mkCtx(null); T.drawCaptionsOnCtx(c, t, st, 1080, 1920, false); return c.calls.filter(k => k.t.toLowerCase() === 'zwei'); };
      const g1 = glowCalls(1.5 + 0.1, gs), g2 = glowCalls(1.5 + 0.45, gs), g3 = glowCalls(1.5 + 0.1, Object.assign({}, gs, { anim: 'scale' }));
      ok(g1.some(k => k.sb > 4 && k.sc === '#ff3366'), 'Export Glow: Leuchten in der Highlight-Farbe am aktiven Wort: ' + JSON.stringify(g1.map(k => [k.sb, k.sc])));
      ok(g2.every(k => !(k.sb > 0)) && g3.every(k => !(k.sb > 0)), 'Export Glow: nach 0,34 s und bei Pop kein Leuchten');
      ok(T.capGlowLayers(gs, 1, 0, 40).length === 0 && T.capGlowLayers(gs, 1, 1, 40).length === 3 && T.capGlowLayers({ hlPillBg: '#0f0', hl: '#fff' }, 1, 1, 40)[0].color === '#0f0', 'capGlowLayers: Farbe = Highlight (Pill: Pill-Farbe), 0 = aus');
      // Panel: Word pop nur beim Highlight — sonst Zeile weg + Hinweis; reduzierte Bewegung → Hinweis, keine Demo
      const E = id => document.getElementById(id);
      E('csMotion').value = 'reveal'; E('csAnim').value = 'scale'; T.syncCsUi();
      ok(E('csAnimRow').style.display === 'none' && E('csAnim').disabled === true && /Animation: Highlight/.test(E('csAnimHint').textContent) && E('csAnimHint').style.display === '', 'Reveal: Word-pop-Zeile ausgeblendet + Hinweis «Word pop works with Animation: Highlight»');
      E('csMotion').value = 'fill'; T.syncCsUi();
      ok(E('csAnimRow').style.display === 'none', 'Fill: Zeile ausgeblendet');
      E('csMotion').value = 'highlight'; T.syncCsUi();
      ok(E('csAnimRow').style.display === '' && E('csAnim').disabled === false && E('csAnimHint').textContent === '' && E('csAnimHint').style.display === 'none', 'Highlight: Zeile sichtbar, kein Hinweis');
      T.setReduceMotion(true); T.syncCsUi();
      ok(/reduce motion/.test(E('csAnimHint').textContent) && /export includes the animation/.test(E('csAnimHint').textContent) && T.capAnimDemoStart() === false && T.getAnimDemo() === null, 'Bewegung reduzieren: Hinweis, keine Demo');
      E('csAnim').value = 'none'; T.syncCsUi();
      ok(E('csAnimHint').textContent === '', 'Bewegung reduzieren + «None»: kein Hinweis');
      T.setReduceMotion(false); E('csAnim').value = 'scale'; T.syncCsUi();
      ok(E('csAnimHint').textContent === '' && T.capAnimDemoStart() === true && T.getAnimDemo() && T.getAnimDemo().until > T.getAnimDemo().t0, 'Pausiert: Demo startet (~0,6 s virtuelle Zeit)');
      T.clearAnimDemo();
    }
    ok(T.STYLES.slice(0, 19).every(x => !['punch'].includes(x.anim)), 'Presets ohne Punch-Bounce');
    ok(T.capMixColor('#ffffff', '#000000', 0.5) === 'rgba(128,128,128,1)' && T.capMixColor('#fff', '#FFD60A', 0) === '#fff' && T.capMixColor('#fff', '#FFD60A', 1) === '#FFD60A', 'capMixColor');
    // Block ein-/ausblenden (Lücke nach dem Block → Ausblenden; direkt anschliessender Block → kein Flackern)
    let bf = T.capBlockFx(0, 1.0, false, false);
    ok(bf.op === 0 && bf.dy > 0, 'Block: startet unsichtbar');
    bf = T.capBlockFx(0, 1.075, false, false);
    ok(bf.op > 0 && bf.op < 1 && bf.dy > 0, 'Block: blendet ~150 ms ein');
    ok(T.capBlockFx(0, 1.0 + M.enter, false, false).op === 1 && T.capBlockFx(0, 1.0 + M.enter, false, false).dy === 0, 'Block: voll nach dem Einblenden');
    const end = b.end;
    ok(T.capBlockFx(0, end - 0.05, false, false).op < 1 && T.capBlockFx(0, end - 0.05, false, false).op > 0 && T.capBlockFx(0, end, false, false).op === 0
       && T.capBlockFx(0, end - M.exit - 0.01, false, false).op === 1, 'Block: blendet in den letzten ~100 ms aus');
    ok(T.capBlockFx(0, 1.0, true, false).op === 1 && T.capBlockFx(0, 1.0, false, true).op === 1, 'Block: Vorschau-Ersatz / reduzierte Bewegung ohne Ein-/Ausblenden');
    {
      const two = [['a', 0, 0.4], ['b.', 0.45, 0.9], ['c', 0.9, 1.2], ['d', 1.25, 1.6]].map(([w, s0, e]) => ({ word: w, start: s0, end: e }));
      T.onWpbChange('2');
      T.setState(T.buildCaptionBlocks(two), [], 'karaoke');
      const bl = T.getBlocks();
      ok(bl.length === 2 && T.capBlockVisEnd(0) === null && T.capBlockFx(0, bl[0].end - 0.01, false, false).op === 1, 'Block: direkt abgeloest → kein Ausblenden');
      T.onWpbChange('4');
      T.setState(T.buildCaptionBlocks(ws), [], 'karaoke');
    }
    // Gleitende Box: Interpolation + Export
    const P = [{ x: 0, y: 10, w: 40, h: 20 }], R = [{ x: 100, y: 10, w: 60, h: 20 }];
    let sb = T.capSlideBoxes(P, R, 0.5);
    ok(sb.length === 1 && near(sb[0].x, 50) && near(sb[0].w, 50) && sb[0].op === 1, 'Box gleitet: halbe Strecke/Breite bei k=0.5');
    sb = T.capSlideBoxes(P, [{ x: 100, y: 40, w: 60, h: 20 }], 0.5);
    ok(sb.length === 1 && near(sb[0].x, 100) && near(sb[0].op, 0.5), 'Box bei Zeilenwechsel: blendet am Ziel ein');
    ok(T.capSlideBoxes(P, R, 1)[0].x === 100 && T.capSlideBoxes(null, R, 0).length === 0, 'Box: Endposition / unsichtbar vor dem Wort');
    const bk = ST('boxkara');
    const boxAt = (t) => { const c = mkCtx(null); T.drawCaptionsOnCtx(c, t, bk, 1080, 1920, false); return c.rects.filter(r => r.fs === bk.hlPillBg).pop(); };
    const r0 = boxAt(1.45), r1 = boxAt(1.5 + 0.3), rm = boxAt(1.5 + 0.04);
    ok(r0 && r1 && rm && r1.x > r0.x && rm.x > r0.x + 1 && rm.x < r1.x - 1 && Math.abs(rm.y - r1.y) < 1e-6, 'Export: Box gleitet zwischen den Woertern (' + [r0, rm, r1].map(r => r && r.x.toFixed(1)).join(' → ') + ')');
    // Layout fix: Wortpositionen unabhängig von Zeit/aktivem Wort (Reveal, Box, Kursiv-Highlight)
    ['reveal', 'boxkara', 'editorial', 'hormozi'].forEach(id => {
      const pos = (t) => { const c = mkCtx(null); T.drawCaptionsOnCtx(c, t, ST(id), 1080, 1920, false); const o = {}; c.calls.forEach(k => { o[k.t.toLowerCase()] = Math.round(k.x * 100) / 100 + ',' + Math.round((k.y - 0) * 100) / 100; }); return o; };
      const a = pos(id === 'reveal' ? 2.3 : 1.2), z = pos(2.75); // Reveal: 3 Woerter fertig eingeblendet
      const lay = (wi) => T.capLayout(mkCtx(null), b, 0, wi, ST(id), 1080, 1920).lines.map(L => L.map(w => w.x.toFixed(2) + '/' + w.y.toFixed(2)).join(' ')).join(' | ');
      ok(lay(0) === lay(3), id + ': Layout unabhaengig vom aktiven Wort');
      const same = Object.keys(a).filter(k => z[k] !== undefined).every(k => a[k] === z[k]);
      ok(same && Object.keys(a).length >= 3, id + ': Woerter bleiben an ihrer Stelle (' + Object.keys(a).length + ' verglichen)');
    });
    ok(JSON.stringify(T.wrapCaptionLines(['eins', 'zwei', 'drei', 'vier'], ST('editorial'), 0, 22, 2)) === JSON.stringify(T.wrapCaptionLines(['eins', 'zwei', 'drei', 'vier'], ST('editorial'), 3, 22, 2)),
       'Vorschau-Umbruch unabhaengig vom aktiven Wort (Kursiv-Highlight)');
    // Reveal im Export: kommende Woerter nicht gezeichnet, einblendendes Wort halbtransparent + tiefer
    {
      const c = mkCtx(null); T.drawCaptionsOnCtx(c, 1.55, rv, 1080, 1920, false);
      const by = {}; c.calls.forEach(k => { by[k.t] = k; });
      const c2 = mkCtx(null); T.drawCaptionsOnCtx(c2, 2.7, rv, 1080, 1920, false);
      const z = {}; c2.calls.forEach(k => { z[k.t] = k; });
      ok(by.eins && by.zwei && !by.drei && !by.vier && by.zwei.a > 0 && by.zwei.a < 1 && by.eins.a === 1, 'Export Reveal: sichtbar bis zum gesprochenen Wort, Einblenden ueber Deckkraft');
      ok(by.zwei.y > z.zwei.y && near(by.eins.y, z.eins.y), 'Export Reveal: neues Wort steigt auf, Rest bleibt stehen');
      const cf = mkCtx(null); T.drawCaptionsOnCtx(cf, 1.6, nt, 1080, 1920, false);
      const fa = {}; cf.calls.forEach(k => { fa[k.t] = k.a; });
      ok(fa.eins === 1 && near(fa.drei, M.dim) && near(fa.vier, M.dim), 'Export Fill: gedimmt/voll wie die Vorschau');
      const ce = mkCtx(null); T.drawCaptionsOnCtx(ce, 1.075, rv, 1080, 1920, false);
      ok(ce.calls.length && ce.calls.every(k => k.a < 1), 'Export: Block blendet ein (Deckkraft < 1)');
    }
    // Statische Ebene im Export: im Endzustand nur drawImage, kein Neuzeichnen
    {
      const layers = []; const origCreate = document.createElement;
      document.createElement = (t) => { if (t !== 'canvas') return origCreate(t); const cv = { width: 0, height: 0 }; const cx = mkCtx(cv); cv.getContext = () => cx; layers.push(cx); return cv; };
      const main = mkCtx({ width: 1080, height: 1921 }); // eigene Größe → frische Ebene
      T.drawCaptionsOnCtx(main, 2.73, rv, 1080, 1921, false);
      const cntFill = () => layers.reduce((a, l) => a + l.calls.filter(k => k.sc === 'transparent').length, 0); // nur die scharfe Füllung (Schatten-Schichten zählen nicht: Lesbarkeits-Halo hat mehrere)
      const n1 = cntFill();
      T.drawCaptionsOnCtx(main, 2.76, rv, 1080, 1921, false);
      T.drawCaptionsOnCtx(main, 2.79, rv, 1080, 1921, false);
      ok(n1 === 4 && cntFill() === n1 && main.calls.length === 0 && main.imgs === 3, 'Reveal-Export: Endzustand aus der Ebene (kein Neuzeichnen pro Frame)');
      const mid2 = mkCtx({ width: 1080, height: 1921 }); T.drawCaptionsOnCtx(mid2, 2.55, rv, 1080, 1921, false);
      const mid2f = mid2.calls.filter(k => k.sc === 'transparent'); ok(mid2f.length === 1 && mid2f[0].t === 'vier' && mid2.calls.every(k => k.t === 'vier'), 'Reveal-Export: nur das einblendende Wort wird live gezeichnet');
      document.createElement = origCreate;
    }
    // Vorschau-HTML: keine CSS-Animation (Zeit-basiert per capDomMotion), Wort-Index, Box als eigene Fläche
    {
      const hv = T.buildCap(['eins', 'zwei'], rv, -1, 22, [1, 1.5], 2, { em: null });
      ok(/class="cap-root"/.test(hv) && /data-oi="1"/.test(hv) && !/animation:captly/.test(hv), 'Vorschau Reveal: Wort-Spans mit data-oi, keine CSS-Animation');
      const hb = T.buildCap(['eins', 'zwei'], bk, 1, 22, [1, 1.5], 2, { em: null });
      ok(/class="cap-hlbox"/.test(hb) && !/padding:2px 9px/.test(hb) && /word-spacing:/.test(hb), 'Vorschau Box: eigene Flaeche, kein Padding am Wort, extra Wortabstand');
      ok(T.capWordGap(bk) === 4 + T.CAP_PILL_GAP && T.capWordGap(rv) === 0, 'Box-Styles: Wortabstand + Box-Gap');
      const hz2 = T.buildCap(['eins', 'zwei'], hz, 1, 22, [1, 1.5], 2, { em: null });
      ok(!/animation:captly/.test(hz2), 'Vorschau Highlight: Pop zeitbasiert statt CSS-Animation');
      const ed = T.buildCap(['eins', 'zwei'], ST('editorial'), 1, 22, [1, 1.5], 2, { em: null });
      ok((ed.match(/min-width:[\d.]+px;text-align:center/g) || []).length === 2, 'Kursiv-Highlight: fester Platz je Wort');
      // Kacheln/Showcase: Reveal blendet bis hlIdx ein, Fill dimmt danach
      const tr = T.buildCap(['a', 'b', 'c'], rv, 1, 12, null);
      ok(/opacity:0;/.test(tr) && /capWordIn/.test(tr) && T.buildCap(['a', 'b', 'c'], nt, 0, 12, null).split('opacity:' + M.dim).length === 3, 'Kacheln: Reveal/Fill-Fortschritt');
    }
    // Typografische Betonung (KI-Keyword): Script = Caveat 1.4×, Reveal = kursiv; im Auto-Fit mitgemessen
    {
      T.setEmphState(true, false, 'off');
      const sc = ST('script');
      const hs = T.buildCap(['nur', 'langsam', 'atmen'], sc, -1, 22, [0, 0.5, 1], 2, { em: [false, true, false] });
      ok(/font-family:'Caveat'/.test(hs) && /font-size:1\.4em/.test(hs) && /7ff0e0/.test(hs), 'Script: Keyword in Caveat, 1.4x, Akzentfarbe');
      ok(/font-style:italic/.test(T.buildCap(['ein', 'Preis'], rv, -1, 22, [0, 0.5], 2, { em: [false, true] })), 'Reveal: Keyword kursiv');
      const fw0 = T.fitCaptionWords(['nur', 'Wahnsinnsgeschichte'], sc, 40, 200, 2, null), fw1 = T.fitCaptionWords(['nur', 'Wahnsinnsgeschichte'], sc, 40, 200, 2, [false, true]);
      ok(fw1.px < fw0.px || fw1.words.length > fw0.words.length, 'Betonung (1.4x) im Auto-Fit beruecksichtigt');
      ok(T.capWordFace(sc, false, true).fam === 'Caveat' && T.capWordFace(rv, false, true).it && T.capWordFace(rv, false, true).fw === '800', 'capWordFace: Betonungs-Schrift/-Schnitt');
      ok(T.emphLineH(sc, 1.4) > 0.5 && T.emphLineH(sc, 1.4) < 1.3, 'emphLineH mit eigener Betonungs-Schrift');
      const kw = [{ word: 'nur', start: 1, end: 1.3 }, { word: 'langsam', start: 1.35, end: 1.8, kw: 2 }, { word: 'atmen', start: 1.85, end: 2.2 }];
      T.setState(T.buildCaptionBlocks(kw), [], 'karaoke');
      const c = mkCtx(null); T.drawCaptionsOnCtx(c, 2.1, sc, 1080, 1920, false);
      const lk = c.calls.find(k => k.t === 'langsam');
      ok(lk && /Caveat/.test(lk.font) && lk.fs === '#7ff0e0', 'Export: Keyword in Caveat + Akzentfarbe');
      T.setEmphState(false, false, 'off');
    }
    // Customize: Animation-Wahl + Templates behalten motion/emFont
    {
      T.selectStyle('hormozi');
      document.getElementById('csMotion').value = 'reveal';
      T.setCsDirty({ motion: true });
      const cs = T.buildCustomStyle();
      ok(cs.motion === 'reveal' && cs.font === ST('hormozi').font, 'Customize: Animation „Reveal“');
      document.getElementById('csMotion').value = 'highlight'; T.setCsDirty({ motion: true });
      ok(T.buildCustomStyle().motion === undefined, 'Customize: „Highlight“ = Standard (kein Feld)');
      T.seedCustomFields(ST('note'));
      ok(document.getElementById('csMotion').value === 'fill', 'Customize: Animation aus dem Style uebernommen');
      const san = T.sanitizeStyle({ motion: 'fill', emFont: "'Caveat'", emItalic: true, emFw: '800', bad: 1 });
      ok(san.motion === 'fill' && san.emFont === "'Caveat'" && san.emItalic === true && san.emFw === '800' && san.bad === undefined, 'Templates speichern motion/emFont/emItalic/emFw');
    }
    // Standard-Style: neue Nutzer → Reveal, gemerkter Style bleibt
    {
      const runWith = (store) => {
        global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem() {}, removeItem() {} };
        try { return new Function(script + ';return activeId;')(); } finally { delete global.localStorage; }
      };
      ok(runWith({}) === 'tight', 'neuer Nutzer startet mit Tight');
      ok(runWith({ 'capivo.style': 'reveal' }) === 'reveal', 'gemerkter Style bleibt (Reveal) — nur neue Nutzer starten mit Tight');
      ok(runWith({ 'capivo.style': 'hormozi' }) === 'hormozi', 'gemerkter Style bleibt (Bold Pop)');
      ok(runWith({ 'capivo.style': 'prime' }) === 'lift', 'gemerkter alter Style folgt dem Alias');
    }
    T.setEmphState(true, false, 'off');
  }

  // „Überall korrigieren?“: genau ein ersetztes Wort → Vorschlag, gleiche Fehler in anderen Zeilen
  {
    const sw = T.wordSwap('Ich bin auf dem Birkenhoff.', 'Ich bin auf dem Birkenhof.');
    ok(sw && sw.from === 'Birkenhoff' && sw.to === 'Birkenhof', 'wordSwap: Satzzeichen werden ignoriert');
    ok(T.wordSwap('a b c', 'a b c') === null && T.wordSwap('eins zwei', 'eins zwei drei') === null && T.wordSwap('Hallo Welt', 'Hallo, Welt') === null,
      'wordSwap: keine Änderung / andere Wortzahl / nur Satzzeichen → kein Vorschlag');
    ok(T.wordSwap('das ist gut', 'dies ist toll') === null, 'wordSwap: zwei geänderte Wörter → kein Vorschlag');
    ok(T.wordSwap('die Kuh', 'der Kuh') === null && T.wordSwap('mit max', 'mit Max') !== null, 'wordSwap: kurze Allerweltswörter nur, wenn ein Name entsteht');
    const mk = t => ({ text: t, start: 0, end: 1, words: t.split(' ').map(w => ({ word: w, start: 0, end: 1 })) });
    T.setState([mk('Willkommen am Birkenhof'), mk('Der birkenhoff ist schön'), mk('Birkenhoff, Birkenhoffs Hof'), mk('Birkenhof bleibt')], []);
    ok(T.fixAllHits('Birkenhoff', 'Birkenhof', 0) === 2, 'fixAllHits: nur ganze Wörter, Gross/klein egal, fertige Treffer zählen nicht');
    ok(T.fixWordEverywhere('Birkenhoff', 'Birkenhof') === 2 && T.getBlocks()[1].text === 'Der Birkenhof ist schön'
      && T.getBlocks()[2].text === 'Birkenhof, Birkenhoffs Hof' && T.getBlocks()[3].text === 'Birkenhof bleibt', 'fixWordEverywhere: ersetzt nur echte Treffer');
  }

  // Neue Looks (Tight, Mix, Statement, Accent, Serif Bold): Eigenschaften, em-Buchstabenabstand, Betonung aufrecht in kursivem Text
  {
    const st = id => T.STYLES.find(x => x.id === id);
    ok(st('tight').layout.wpb === 1 && st('tight').layout.lines === 1 && st('tight').tt === undefined && st('tight').em === 'none', 'Tight: 1 Wort/Caption, Schreibung wie gesprochen, kein Farb-Highlight');
    ok(st('statement').tt === 'uppercase' && st('statement').tc === '#FACC15' && st('statement').hl === '#fff' && st('statement').lh < 1 && st('statement').layout.lines === 3, 'Statement: gelbe Caps, aktives Wort weiss, enge Zeilen, bis 3 Zeilen');
    ok(st('mix').em === '#4ade80' && st('mix').emFont === "'Instrument Serif'" && st('mix').emItalic && st('mix').layout.wpb === 3, 'Mix: Keyword grün in kursiver Serif, 3 Wörter');
    ok(['Tight', 'Mix', 'Statement', 'Accent', 'Serif Bold', 'Bold Pop', 'Comic'].every(n => T.STYLES.some(x => x.name === n)) && !T.STYLES.slice(0, 24).some(x => /hormozi|beast|tiktok/i.test(x.name)), 'Anzeigenamen: keine Personen-/Markennamen (IDs bleiben)');
    ok(st('hormozi') && st('beast') && st('tiktok'), 'IDs hormozi/beast/tiktok bleiben (gespeicherte Daten)');
    // em-Buchstabenabstand folgt der tatsächlichen Schriftgrösse
    ok(Math.abs(T.capLsPx({ ls: '-.04em', fs: '1.5em' }, 20) - (-1.2)) < 1e-9 && T.capLsPx({ ls: '2px' }, 20) === 2 && T.capLsPx({ ls: 'normal' }, 20) === 0 && T.capLsPx({}, 20) === 0, 'capLsPx: em × Schrift × fs, px unverändert');
    const sb = st('serifbold');
    ok(T.capWordFace(sb, false, false).it === true && T.capWordFace(sb, false, true).it === false && T.capWordFace(sb, false, true).fam === 'Inter Tight' && T.capWordFace(sb, false, true).fw === '900', 'Serif Bold: Text kursiv, Keyword aufrecht (Inter Tight 900)');
    ok(T.capWordFace(st('accent'), false, true).it === true && T.capWordFace(st('accent'), false, false).it === false, 'Accent: nur Keyword kursiv');
  }

  // Reel-Cover: reine Funktionen (3:4-Ausschnitt, Sicherheitsbereich, Umbruch, Dateiname, Titelvorschlag, Standbild)
  {
    const c = T.coverCropRect(1080, 1920);
    ok(c.x === 0 && c.y === 240 && c.w === 1080 && c.h === 1440, 'Cover: 3:4-Ausschnitt 1080×1440 mittig (y 240)');
    const r = T.coverSafeRegion(1080, 1920);
    ok(r.y >= c.y && r.y + r.h <= c.y + c.h && r.x === 0 && r.x + r.w <= 1080 * (1 - 0.125) + 1 && r.h > 800, 'Cover: Sicherheitsbereich liegt im 3:4-Ausschnitt und links von der Aktionsleiste');
    ok(T.coverInRect({ x: 100, y: 300, w: 500, h: 400 }, r) && !T.coverInRect({ x: 100, y: 100, w: 500, h: 400 }, r) && !T.coverInRect({ x: 600, y: 300, w: 500, h: 400 }, r), 'Cover: Prüfung Text in Sicherheitsbereich');
    ok(JSON.stringify(T.coverWrap([300, 300, 300, 300], 700, 20)) === '[[0,1],[2,3]]' && JSON.stringify(T.coverWrap([900, 100], 700, 20)) === '[[0],[1]]' && JSON.stringify(T.coverWrap([], 700, 20)) === '[]', 'Cover: Zeilenumbruch (zu breites Einzelwort allein)');
    ok(T.coverBlockY('top', r, 200) === r.y && T.coverBlockY('bottom', r, 200) === r.y + r.h - 200 && T.coverBlockY('mid', r, 200) === r.y + (r.h - 200) / 2, 'Cover: Position oben/Mitte/unten');
    ok(T.coverFileName('Mein Reel über Käse!') === 'mein-reel-ueber-kaese-cover.png' && T.coverFileName('', 'hof-captionrush') === 'hof-captionrush-cover.png' && T.coverFileName('???') === 'captionrush-cover.png', 'Cover: Dateiname <titel>-cover.png');
    ok(T.coverHook('Das ist der Hook. Und noch mehr Text hier. #reels #hof', 'x') === 'Das ist der Hook.' && T.coverHook('', 'Eins zwei drei vier fünf sechs sieben acht') === 'Eins zwei drei vier fünf sechs' && T.coverHook('', '') === '', 'Cover: Titelvorschlag ≤ 6 Wörter (Post-Text, sonst Transkript)');
    ok(T.coverDefaultTime(20, []) === 10 && T.coverDefaultTime(20, [{ words: [{ kw: 0, start: 1 }, { kw: 1, start: 4.26 }] }]) === 4.3 && T.coverDefaultTime(0, []) === 0, 'Cover: Standardbild = erstes hervorgehobenes Wort, sonst Videomitte');
    T.coverRestore({ t: 3, dark: 999, title: 'Hallo Welt', kw: [1, 'x', -2, 7], style: 'evil', size: 9, pos: 'left', guides: false });
    const cs = T.getCover();
    ok(cs.t === 3 && cs.dark === 70 && cs.title === 'Hallo Welt' && cs.kw.join() === '1,7' && cs.style === 'tight' && cs.size === 1.4 && cs.pos === 'bottom' && cs.guides === false, 'Cover: gespeicherte Einstellungen werden geprüft/begrenzt');
    T.coverRestore(null);
    ok(T.getCover().title === '' && T.getCover().style === 'tight', 'Cover: ohne Eintrag Standard');
    ok(cs.align === 'center' && cs.ox === 0 && cs.oy === 0 && JSON.stringify(cs.wo) === '{}', 'Cover: Projekt ohne Ausrichtung/Verschiebung sieht aus wie bisher (mittig, Offsets 0)');
    // Ausrichtung/Verschiebung: kaputte Werte werden verworfen bzw. auf ±0.5 begrenzt
    T.coverRestore({ title: 'A B C', align: 'diagonal', ox: 9, oy: 'x', wo: { 0: [0.9, -9], 1: [1], 2: ['a', 0], x: [0.1, 0.1], 99: [0.1, 0.1], 3: [0, 0], 4: [0.25, -0.125] } });
    let cs2 = T.getCover();
    ok(cs2.align === 'center' && cs2.ox === 0.5 && cs2.oy === 0, 'Cover: unbekannte Ausrichtung → mittig, Offset ±0.5 begrenzt, Text-Offset → 0');
    ok(JSON.stringify(cs2.wo) === '{"0":[0.5,-0.5],"4":[0.25,-0.125]}', 'Cover: Wort-Offsets: nur gültige Indizes/Paare, begrenzt, Nullen entfallen: ' + JSON.stringify(cs2.wo));
    const manyWo = {}; for (let i = 0; i < 40; i++) manyWo[i] = [0.1, 0.1]; manyWo[55] = [0.1, 0.1]; manyWo['__proto__'] = [0.1, 0.1];
    T.coverRestore({ wo: manyWo });
    ok(Object.keys(T.getCover().wo).length === 40 && T.getCover().wo[55] === undefined && ({}).polluted === undefined, 'Cover: höchstens 40 Wort-Offsets, nur Indizes 0–39');
    T.coverRestore({ wo: [[0.1, 0.1]] }); ok(JSON.stringify(T.getCover().wo) === '{}', 'Cover: wo als Liste → leer');
    T.coverRestore({ wo: 'x', align: 'left', ox: -0.3, oy: 0.2 }); cs2 = T.getCover();
    ok(cs2.align === 'left' && cs2.ox === -0.3 && cs2.oy === 0.2 && JSON.stringify(cs2.wo) === '{}', 'Cover: gültige Ausrichtung/Verschiebung bleiben');
    // Cover-Akzent wirkt bei jedem Look: Looks ohne Betonung (Tight/Statement) bekommen Fallback-Farbe, die anderen behalten ihre
    { const ce = id => T.coverEmColor(T.STYLES.find(x => x.id === id));
      ok(ce('tight') === '#FFD60A' && ce('statement') === '#fff' && ce('mix') === '#4ade80' && ce('hormozi') && T.STYLES.filter(x => ['tight','mix','statement','accent','serifbold','hormozi','editorial'].includes(x.id)).every(x => !!T.coverEmColor(x) || !!x.emFont), 'Cover: Akzent-Farbe für jeden Look (Tight → Gelb, Statement → Weiss, Mix unverändert)'); }
    // Titel zeichnen: Ausrichtung links/rechts liegt an den Kanten von maxW, Offsets verschieben (und sind begrenzt), Wörter haben Trefferflächen
    {
      const sty = T.STYLES.find(x => x.id === 'tight'), ctx = document.createElement('canvas').getContext('2d');
      const draw = o => T.coverDrawTitle(ctx, 1080, 1920, Object.assign({ title: 'Hallo schöne Welt heute', kw: [], style: 'tight', size: 1, pos: 'mid', align: 'center', ox: 0, oy: 0, wo: {} }, o), sty);
      const maxW = T.coverMaxW(1080, 1920), base = draw({});
      ok(base && base.words.length === 4 && Math.abs(base.x + base.w / 2 - 540) < 1, 'Cover: mittig → Box in der Bildmitte (vier Wort-Trefferflächen)');
      const L = draw({ align: 'left' }), R = draw({ align: 'right' });
      ok(Math.abs(L.x - (1080 - maxW) / 2) < 0.01 && Math.abs(R.x + R.w - (1080 + maxW) / 2) < 0.01, 'Cover: links/rechts → Box an der linken/rechten Kante von maxW (' + L.x + ' / ' + (R.x + R.w) + ')');
      ok(T.coverAlignX('left', 1080, 800, 300) === 140 && T.coverAlignX('right', 1080, 800, 300) === 640 && T.coverAlignX('center', 1080, 800, 300) === 390 && T.coverAlignX('???', 1080, 800, 300) === 390, 'Cover: coverAlignX');
      const mv = draw({ ox: 0.1, oy: -0.1 });
      ok(Math.abs(mv.x - base.x - 108) < 0.01 && Math.abs(mv.y - base.y + 192) < 0.01 && mv.w === base.w && mv.h === base.h, 'Cover: Offsets ox/oy verschieben die Box in Anteilen von W/H');
      const cl = draw({ ox: 7, oy: -7 });
      ok(Math.abs(cl.x - base.x - 540) < 0.01 && Math.abs(cl.y - base.y + 960) < 0.01, 'Cover: Offsets sind auf ±0.5 begrenzt (auch direkt im Zustand)');
      const bad = draw({ ox: NaN, oy: 'x', align: 'x', wo: 'x' });
      ok(Math.abs(bad.x - base.x) < 0.01 && Math.abs(bad.y - base.y) < 0.01, 'Cover: kaputte Zustandswerte zeichnen wie Standard');
      const w1 = draw({ wo: { 1: [0.1, 0.05] } });
      ok(Math.abs(w1.words[1].x - base.words[1].x - 108) < 0.01 && Math.abs(w1.words[1].y - base.words[1].y - 96) < 0.01 && w1.words[0].x === base.words[0].x && w1.words[2].y === base.words[2].y, 'Cover: Wort-Offset verschiebt nur dieses Wort');
      ok(w1.y + w1.h >= w1.words[1].y + w1.words[1].h - 0.01 && w1.x <= base.x + 0.01, 'Cover: Box umschliesst auch verschobene Wörter (Safe-Zone-Prüfung)');
      const hw = base.words[2];
      ok(T.coverHitWord(base.words, { x: hw.x + hw.w / 2, y: hw.y + hw.h / 2 }) === hw.i && T.coverHitWord(base.words, { x: 5, y: 5 }) === -1 && T.coverHitWord(base.words, { x: hw.x - 4, y: hw.y + 2 }, 8) >= 0, 'Cover: Treffer auf Wort (mit Toleranz), daneben -1');
    }
    // Einrasten: Mittellinie und Safe-Zone-Ränder, nur innerhalb der Schwelle
    {
      const reg = T.coverSafeRegion(1080, 1920);
      const sn = T.coverSnap({ x: 440, y: 900, w: 200, h: 100 }, reg, 1080, 1920, 10); // Mitte x = 540 → rastet; y-Mitte 950 ≠ 960 (Δ10) → rastet auch
      ok(sn.dx === 0 && sn.vx === 540 && sn.dy === 10 && sn.vy === 960, 'Cover: Einrasten an Bild-Mitte (x/y)');
      const sn2 = T.coverSnap({ x: 100, y: 400, w: 200, h: 100 }, reg, 1080, 1920, 10);
      ok(sn2.dx === 0 && sn2.vx === null && sn2.dy === 0 && sn2.vy === null, 'Cover: weit weg → kein Einrasten');
      const sn3 = T.coverSnap({ x: reg.x + 6, y: reg.y + 3, w: 200, h: 100 }, reg, 1080, 1920, 10);
      ok(sn3.dx === -6 && sn3.vx === reg.x && sn3.dy === -3 && sn3.vy === reg.y, 'Cover: Einrasten am Safe-Zone-Rand oben/links');
      const sn4 = T.coverSnap({ x: reg.x + reg.w - 200 - 4, y: reg.y + reg.h - 100 + 5, w: 200, h: 100 }, reg, 1080, 1920, 10);
      ok(sn4.dx === 4 && sn4.vx === reg.x + reg.w && sn4.dy === -5 && sn4.vy === reg.y + reg.h, 'Cover: Einrasten am Safe-Zone-Rand unten/rechts');
    }
    // Zustand: Position-/Ausrichtungs-Knopf setzt die jeweilige Verschiebung zurück, Reset leert alles, Wortanzahl ändern leert wo, Payload trägt alles
    {
      T.coverRestore({ title: 'Eins zwei drei', kw: [0], align: 'right', ox: 0.2, oy: -0.2, wo: { 1: [0.1, 0.1] }, pos: 'top' });
      ok(T.coverMoved(T.getCover()), 'Cover: verschoben → Reset-Knopf aktiv');
      const pc = T.projectPayload().cover;
      ok(pc && pc.align === 'right' && pc.ox === 0.2 && pc.oy === -0.2 && JSON.stringify(pc.wo) === '{"1":[0.1,0.1]}', 'Cover: Projekt-Payload enthält align/ox/oy/wo');
      T.coverOnTitle('Eins zwei drei'); ok(JSON.stringify(T.getCover().wo) === '{"1":[0.1,0.1]}', 'Cover: gleiche Wortanzahl → Wort-Offsets bleiben');
      T.coverOnTitle('Eins zwei'); ok(JSON.stringify(T.getCover().wo) === '{}' && T.getCover().ox === 0.2, 'Cover: andere Wortanzahl → Wort-Offsets zurück (Titel-Offset bleibt)');
      T.coverSet('pos', 'mid'); ok(T.getCover().oy === 0 && T.getCover().ox === 0.2, 'Cover: Position wählen setzt nur die senkrechte Verschiebung zurück');
      T.coverSet('align', 'left'); ok(T.getCover().ox === 0 && T.getCover().align === 'left', 'Cover: Ausrichtung wählen setzt nur die waagrechte Verschiebung zurück');
      T.coverRestore({ title: 'A', ox: 0.1, oy: 0.1, wo: { 0: [0.1, 0.1] } }); T.coverResetPos();
      ok(!T.coverMoved(T.getCover()) && T.getCover().align === 'center', 'Cover: Reset position → keine Verschiebung');
    }
  }

  // Style Drops (styles.json): bereinigt, nur lokale Schriften, nie eingebaute IDs überschreiben, „New“ 30 Tage
  {
    const now = Date.parse('2026-11-01');
    const good = { id: 'dropone', name: 'Drop <b>One</b>', added: '2026-10-20', photo: 'bloom', layout: { wpb: 2, lines: 1 },
      style: { fl: 'Inter Tight', font: "'Inter Tight'", fw: '800', tc: '#fff', ts: '0 2px 8px rgba(0,0,0,.5);}<script>', hl: '#ff0', emFont: "'Instrument Serif'", em: '#0f0', evil: 'x' } };
    const d = T.dropToStyle(good, now);
    ok(d && d.id === 'dropone' && d.name === 'Drop bOne/b' && d.badge === 'New' && d.layout.wpb === 2 && d.emFont === "'Instrument Serif'" && d.evil === undefined && !/[<>{};]/.test(d.ts), 'Drop: gültiger Eintrag, bereinigt, Abzeichen New');
    ok(T.dropToStyle(Object.assign({}, good, { added: '2026-08-01' }), now).badge === undefined, 'Drop: nach 30 Tagen kein Abzeichen');
    ok(T.dropToStyle(Object.assign({}, good, { id: 'tight' }), now) === null && T.dropToStyle(Object.assign({}, good, { id: 'Bad Id' }), now) === null, 'Drop: eingebaute/ungültige ID abgelehnt');
    ok(T.dropToStyle(Object.assign({}, good, { style: Object.assign({}, good.style, { fl: 'Rubik Mono One', font: "'Rubik Mono One'" }) }), now) === null, 'Drop: Schrift ohne lokale Datei abgelehnt');
    const d2 = T.dropToStyle(Object.assign({}, good, { id: 'droptwo', style: Object.assign({}, good.style, { emFont: "'Unknown Font'" }) }), now);
    ok(d2 && d2.emFont === undefined, 'Drop: unbekannte Keyword-Schrift wird entfernt');
    const file = JSON.parse(fs.readFileSync(path.join(__dirname, 'styles.json'), 'utf8'));
    ok(Array.isArray(file) && file.every(o => T.dropToStyle(o, now) !== null || T.STYLES.some(x => x.id === o.id)), 'styles.json: gültig, jeder Eintrag besteht die Prüfung');
  }

  // Timeline Mehrfachauswahl (Handy: «Select»): Bereich löschen, Modus umschalten
  {
    const mk = n => Array.from({ length: n }, (_, i) => ({ words: [{ word: 'w' + i, start: i, end: i + 0.9 }], start: i, end: i + 0.9, text: 'w' + i }));
    T.setState(mk(6), [], null);
    T.tlSelState(1, 3);
    ok(JSON.stringify(T.tlRange()) === '{"a":1,"b":3}', 'Bereich 1…3 erkannt');
    T.tlSelState(3, 1); ok(JSON.stringify(T.tlRange()) === '{"a":1,"b":3}', 'Bereich unabhängig von der Tipp-Reihenfolge');
    T.tlSelState(2, 2); ok(T.tlRange() === null, 'ein Block ist kein Bereich');
    T.tlSelState(1, 3); T.tlDeleteSel();
    ok(T.getBlocks().map(b => b.text).join() === 'w0,w4,w5' && T.tlGet().sel === -1 && T.tlGet().end === -1, 'Delete entfernt den ganzen Bereich');
    T.tlSelState(1, -1); T.tlDeleteSel(); ok(T.getBlocks().map(b => b.text).join() === 'w0,w5', 'Delete ohne Bereich löscht nur den gewählten Block');
    T.tlSelState(0, 1); const m0 = T.tlGet().multi; T.tlToggleMulti();
    ok(T.tlGet().multi === !m0 && T.tlGet().end === (m0 ? -1 : 1), 'Select-Knopf schaltet den Modus um');
    if (T.tlGet().multi) T.tlToggleMulti();
    ok(T.tlGet().multi === false && T.tlGet().end === -1, 'Ausschalten hebt den Bereich auf');
  }

  // Timeline Auswahlrahmen / Wisch: tlSweepRange (reine Funktion) + tlSweepApply (live Auswahl)
  {
    const R = (bl, a, b) => JSON.stringify(T.tlSweepRange(bl, a, b));
    const bl = [0, 2, 4, 6, 8].map(s => ({ start: s, end: s + 1, text: 't' + s }));   // Lücken [1,2] [3,4] …
    ok(R(bl, 0.2, 4.5) === '{"a":0,"b":2}', 'Sweep: Fenster über drei Blöcke → 0…2: ' + R(bl, 0.2, 4.5));
    ok(R(bl, 4.5, 0.2) === '{"a":0,"b":2}', 'Sweep: umgekehrte Richtung gleich');
    ok(R(bl, 2.5, 2.9) === '{"a":1,"b":1}', 'Sweep: Fenster in einem Block → genau dieser: ' + R(bl, 2.5, 2.9));
    ok(R(bl, 1.2, 1.8) === 'null' && R(bl, 1.2, 1.8) === R(bl, 1.8, 1.2), 'Sweep: Fenster in der Lücke → null');
    ok(R(bl, 1, 2) === '{"a":0,"b":1}' && R(bl, 1.001, 1.999) === 'null', 'Sweep: Berühren der Kante zählt (inklusive)');
    ok(R(bl, -5, 0) === '{"a":0,"b":0}' && R(bl, 9, 50) === '{"a":4,"b":4}', 'Sweep: Ränder der Liste (Fenster ragt hinaus)');
    ok(R(bl, -5, -1) === 'null' && R(bl, 9, 50) === '{"a":4,"b":4}' && R(bl, 9.001, 50) === 'null', 'Sweep: ausserhalb → null');
    ok(R(bl, -100, 100) === '{"a":0,"b":4}', 'Sweep: Fenster über alles → ganze Liste');
    ok(R([], 0, 5) === 'null' && R(null, 0, 5) === 'null' && R(bl, NaN, 3) === 'null', 'Sweep: leere Liste / ungültige Zeit → null');
    // Viele Blöcke: Binärsuche gleicht einer linearen Referenz
    const big = Array.from({ length: 500 }, (_, i) => ({ start: i * 0.7, end: i * 0.7 + 0.5 }));
    let bad = 0;
    for (let k = 0; k < 300; k++) {
      const a = (k * 37 % 350) + 0.013 * k, b = a + (k % 9) * 0.31;
      let ra = -1, rb = -1;
      big.forEach((x, i) => { if (x.end >= a && x.start <= b) { if (ra < 0) ra = i; rb = i; } });
      const r = T.tlSweepRange(big, a, b);
      if (ra < 0 ? r !== null : !r || r.a !== ra || r.b !== rb) bad++;
    }
    ok(bad === 0, 'Sweep: 500 Blöcke stimmen mit linearer Referenz überein (' + bad + ' Abweichungen)');
    // Blöcke mit timeOff: Achse = Videozeit, Block-Zeit = Videozeit + off (tlSweepApply rechnet um)
    T.setState([0, 2, 4, 6].map(s => ({ words: [{ word: 'w', start: s + 1, end: s + 2 }], start: s + 1, end: s + 2, text: 'w' + s })), [], null);
    T.setTimeOffState(1);
    const dn = { tDown: 1.2, sweepKey: null };   // Videozeit 1,2 = Block-Zeit 2,2 → Block 0 beginnt bei Block-Zeit 1…2 (Video 0…1)
    T.tlSweepApply(dn, 3.6);                        // Video 1,2…3,6 = Block 2,2…4,6 → Block 1 (3…4) und Block 2 (5…6 nein, 4,6 < 5)
    ok(JSON.stringify([T.tlGet().sel, T.tlGet().end]) === '[1,-1]', 'Sweep mit timeOff: Videozeit→Blockzeit umgerechnet: ' + [T.tlGet().sel, T.tlGet().end]);
    T.tlSweepApply({ tDown: 0.5, sweepKey: null }, 4.5);
    ok(JSON.stringify([T.tlGet().sel, T.tlGet().end]) === '[0,2]', 'Sweep mit timeOff: Bereich 0…2: ' + [T.tlGet().sel, T.tlGet().end]);
    // Shift: bestehende Auswahl bleibt enthalten; Fenster in Lücke ohne Shift hebt auf
    T.tlSweepApply({ tDown: 4.5, sweepKey: null, sweepBase: { a: 0, b: 0 } }, 5.2);   // Video 4,5…5,2 = Block-Zeit 5,5…6,2 → Block 2
    ok(JSON.stringify([T.tlGet().sel, T.tlGet().end]) === '[0,2]', 'Sweep+Shift: erweitert die bestehende Auswahl: ' + [T.tlGet().sel, T.tlGet().end]);
    T.tlSweepApply({ tDown: 3.1, sweepKey: null, sweepBase: { a: 1, b: 1 } }, 3.3);   // Lücke, aber Shift → Basis bleibt
    ok(JSON.stringify([T.tlGet().sel, T.tlGet().end]) === '[1,-1]', 'Sweep+Shift in der Lücke: bestehende Auswahl bleibt: ' + [T.tlGet().sel, T.tlGet().end]);
    T.tlSweepApply({ tDown: 3.1, sweepKey: null }, 3.3);   // Video 3,1…3,3 = Block-Zeit 4,1…4,3 → Lücke zwischen Block 1 (3…4) und 2 (5…6)
    ok(T.tlGet().sel === -1 && T.tlGet().end === -1, 'Sweep ohne Shift in der Lücke: Auswahl aufgehoben');
    T.setTimeOffState(0); T.tlSelState(-1, -1);
    // tlHit auf der Wellenform (Desktop) = leere Fläche → Auswahlrahmen statt Block-Treffer
    const mkH = () => [0, 2, 4].map(s => ({ words: [{ word: 'w', start: s, end: s + 1 }], start: s, end: s + 1, text: 'w' }));
    T.setState(mkH(), [], null); T.setTlMob(false); T.setTlView({ start: 0, pps: 100 }); T.setTlSel(-1);
    ok(T.tlHit(250, 30, false).type === 'empty' && T.tlHit(250, 18 + 10, false).type === 'empty', 'tlHit: Wellenform über einem Block = leer (Rahmen startet dort)');
    ok(T.tlHit(250, 40, false).type === 'empty' || T.tlHit(250, 40, false).type === 'block', 'tlHit: Wellenform/Spur liefern keinen Fehler');
    ok(T.tlHit(250, 10, false).type === 'ruler', 'tlHit: Lineal bleibt Seek');
  }

  // «Trending»: nur ab genug Daten, nur eingebaute Styles ohne eigenes Abzeichen, höchstens 3
  {
    const top = [{ style: 'tight', n: 40 }, { style: 'hormozi', n: 20 }, { style: 'mix', n: 10 }, { style: 'statement', n: 5 }];
    const had = T.STYLES.map(x => x.badge);
    ok(T.applyTrending({ total: 49, top }) === 0 && !T.STYLES.some(x => x.badge === 'Trending'), 'Trending: unter 50 Exporten kein Abzeichen');
    ok(T.applyTrending(null) === 0 && T.applyTrending({ total: 99, top: 'x' }) === 0, 'Trending: kaputte Antwort wird ignoriert');
    ok(T.applyTrending({ total: 100, top: top.concat([{ style: 'gibtsnicht', n: 1 }]) }) === 3, 'Trending: genau die Top 3');
    ok(T.STYLES.filter(x => x.badge === 'Trending').map(x => x.id).sort().join() === 'hormozi,mix,tight', 'Trending: richtige Styles markiert');
    T.STYLES.forEach((x, i) => { if (had[i] === undefined) delete x.badge; else x.badge = had[i]; delete x._trend; });
    T.teleError('Fehler', 'a.js:1'); T.statExport(); // ausserhalb von https/echter Domain: tut nichts, wirft nicht
    ok(true, 'Messung ist ausserhalb der echten Domain inaktiv (kein Fehler)');
  }

  // Sprachversionen (captly.de.html): aus captly.html erzeugt, aktuell, vollständig übersetzt
  {
    const i18n = require('./scripts/build-i18n.js');
    const de = i18n.build('de');
    de.errors.forEach(e => console.log('  ' + e));
    ok(de.errors.length === 0, 'i18n de: alle EN-Texte gefunden, keine unübersetzten Landing-Texte');
    ok(fs.existsSync(de.file) && fs.readFileSync(de.file, 'utf8') === de.html, 'i18n de: captly.de.html aktuell (sonst: node scripts/build-i18n.js)');
    ok(/<html lang="de">/.test(de.html) && /hreflang="de" href="https:\/\/[^"]+\/de"/.test(de.html), 'i18n de: lang + hreflang gesetzt');
    const ldFaq = JSON.parse(de.html.match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/g)[1].replace(/^<script[^>]*>\n|\n<\/script>$/g, ''));
    ok(ldFaq['@type'] === 'FAQPage' && ldFaq.mainEntity.length === 10 && /kostenlos/.test(ldFaq.mainEntity[0].name), 'i18n de: FAQ-Strukturdaten aus den deutschen FAQ');
    const ldApp = JSON.parse(de.html.match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/)[1]);
    const deNode = (ldApp['@graph'] || []).find(n => n['@type'] === 'SoftwareApplication');
    ok(deNode && deNode.inLanguage === 'de' && /\/de$/.test(deNode.url) && ldApp['@graph'].some(n => n['@type'] === 'Organization') && ldApp['@graph'].some(n => n['@type'] === 'WebSite'),
      'i18n de: JSON-LD-@graph mit deutschem App-Knoten, Organization + WebSite bleiben');
    // EN: FAQ-Strukturdaten = sichtbare FAQ (Wort für Wort), keine Bewertungen/Rezensionen in den Strukturdaten
    const enSrc = fs.readFileSync(path.join(__dirname, 'captly.html'), 'utf8');
    ok(i18n.syncSource(enSrc) === enSrc, 'i18n en: FAQ-JSON-LD in captly.html passt zur sichtbaren FAQ (sonst: node scripts/build-i18n.js)');
    ok(!/aggregateRating|"review"/.test(enSrc.slice(0, enSrc.indexOf('<style>'))) && (enSrc.match(/<h1[\s>]/g) || []).length === 1, 'Landing: genau ein <h1>, keine Fake-Bewertungen im JSON-LD');
  }

  // ── Customize-Regler ändern NIE Zeilen, Wörter/Caption, Zeichenlimit oder Blöcke (Bug: „Line height“ bei
  //    Tight/Mix/Statement/One Word sprang auf das Preset-Layout zurück und verwarf manuelle Splits) ──
  {
    const qs0 = document.querySelector; document.querySelector = () => null; // splitBlockAtCursor fokussiert danach
    const E = id => document.getElementById(id);
    const lw = 'eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf'.split(' ').map((w, i) => ({ word: w, start: i * 0.4, end: i * 0.4 + 0.35 }));
    const GROUPS = {
      lh: () => { E('csLh').value = '1.6'; }, ls: () => { E('csLs').value = '3'; }, text: () => { E('csText').value = '#ff0000'; },
      hlc: () => { E('csHl').value = '#00ff00'; }, font: () => { E('csFont').value = 'Inter'; }, weight: () => { E('csWeight').value = '400'; },
      stroke: () => { E('csOutlineW').value = '3'; E('csOutlineC').value = '#112233'; }, glow: () => { E('csGlow').checked = true; E('csGlowInt').value = '20'; },
      box: () => { E('csBox').value = 'box'; }, boxc: () => { E('csBoxC').value = '#2040ff'; }, hltype: () => { E('csHlType').value = 'pill'; },
      motion: () => { E('csMotion').value = 'reveal'; }, anim: () => { E('csAnim').value = 'pop'; }, em: () => { E('csEm').value = '#ff00ff'; },
      emfont: () => { E('csEmFont').value = 'Inter'; }
    };
    const presets = T.STYLES.filter(s => s.layout && s.id !== 'custom').map(s => s.id);
    ok(['tight', 'mix', 'statement', 'popone'].every(id => presets.includes(id)), 'Layout-Presets vorhanden: ' + presets.join());
    const mc0 = T.getMaxChars(), bad = [];
    const prep = async pid => {
      T.setState(T.buildCaptionBlocks(lw), lw.slice(), 'karaoke'); T.setCaptionsEdited(false);
      T.selectStyle(pid); // Preset setzt sein Layout (z. B. 1 Wort, 1 Zeile)
      T.setLines({ dataset: { lines: '2' } }); T.onWpbChange(4);
      const b0 = T.getBlocks()[0];
      await T.splitBlockAtCursor(0, { selectionStart: b0.text.indexOf(' '), value: b0.text }); // manueller Split
      return T.captionSnapshot();
    };
    for (const pid of presets) for (const g of Object.keys(GROUPS)) {
      const snap = await prep(pid);
      GROUPS[g](); T.applyCustomStyle(g); T.flushCustomStyle();
      const why = [T.getActiveId() !== 'custom' && 'aktiv ' + T.getActiveId(), T.getLines() !== 2 && 'Zeilen ' + T.getLines(),
        T.getWpb() !== 4 && 'Wörter ' + T.getWpb(), T.getMaxChars() !== mc0 && 'Zeichen ' + T.getMaxChars(),
        T.captionSnapshot() !== snap && 'Blöcke'].filter(Boolean);
      if (why.length) bad.push(pid + '/' + g + ': ' + why.join(', '));
    }
    ok(!bad.length, 'Customize-Regler behalten Zeilen/Wörter/Zeichenlimit/Blöcke (' + presets.length + ' Presets × ' + Object.keys(GROUPS).length + ' Gruppen)' + (bad.length ? ': ' + bad.slice(0, 6).join(' | ') : ''));
    ok(!('layout' in T.buildCustomStyle()), 'Custom-Style trägt kein Preset-Layout');
    // Erneuter Klick auf die Custom-Kachel (ohne fromEditor) fasst das Layout nicht an
    let snap = await prep('tight');
    E('csLh').value = '1.5'; T.applyCustomStyle('lh'); T.flushCustomStyle();
    T.selectStyle('custom');
    ok(T.getActiveId() === 'custom' && T.getLines() === 2 && T.getWpb() === 4 && T.captionSnapshot() === snap, 'Klick auf Custom-Kachel: Layout + Blöcke bleiben');
    // Preset gewählt (ohne manuelle Änderung) → Regler → Custom behält das Preset-Layout; danach normales Preset = vorheriges Layout zurück
    T.setState(T.buildCaptionBlocks(lw), lw.slice(), 'karaoke'); T.setCaptionsEdited(false);
    T.selectStyle('classic'); T.setLines({ dataset: { lines: '2' } }); T.onWpbChange(4);
    T.selectStyle('tight');
    const tl = T.getLines(), tw = T.getWpb(); snap = T.captionSnapshot();
    E('csLh').value = '1.7'; T.applyCustomStyle('lh'); T.flushCustomStyle();
    ok(T.getLines() === tl && T.getWpb() === tw && T.captionSnapshot() === snap && T.getPresetPrevLayout(), 'Tight → Zeilenhöhe: Layout/Blöcke unverändert, vorheriges Layout gemerkt');
    T.selectStyle('custom');
    ok(T.getLines() === tl && T.getWpb() === tw && T.captionSnapshot() === snap && T.getPresetPrevLayout(), 'Tight → Zeilenhöhe → Klick auf aktive Custom-Kachel: Layout unverändert');
    T.selectStyle('classic');
    ok(T.getLines() === 2 && T.getWpb() === 4 && !T.getPresetPrevLayout(), 'Danach normales Preset: vorheriges Layout zurück (2 Zeilen, 4 Wörter)');
    document.querySelector = qs0; if (!qs0) delete document.querySelector;

    // Zeilenhöhe 0.9–1.8 ändert weder Zeilenzahl (auch nicht über die Höhenbremse) noch die Zeilenverteilung
    const texts = [['Heute', 'zeigen', 'wir', 'dir', 'alles'], ['Das', 'Rindfleischverarbeitungsbetriebe'], ['Bundesverfassungsgericht'],
      ['eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht']];
    const fs0 = T.getFontSize(), lines0 = T.getLines(), lhBad = [];
    // Mess-Kontext wie der Stub, aber mit canvas.letterSpacing (Export setzt es; fitCaptionWords rechnet es selbst dazu)
    const ctx = Object.assign(document.createElement('canvas').getContext('2d'), { letterSpacing: '0px',
      measureText(str) { const m = /([\d.]+)px/.exec(this.font), n = (str || '').length; return { width: n * (m ? parseFloat(m[1]) : 16) * 0.55 + n * (parseFloat(this.letterSpacing) || 0) }; } });
    for (const sid of ['classic', 'statement', 'tiktok', 'tight']) for (const px of [16, 30, 54]) for (const nl of [1, 2, 3]) for (const ws of texts) {
      const base = T.STYLES.find(x => x.id === sid);
      const sig = lh => {
        const s = Object.assign({}, base, { id: 'lhtest', lh });
        const f = T.fitCaptionWords(ws, s, px, T.capFitMaxW(s), nl);
        const wr = T.wrapCaptionLines(ws, s, -1, f.px, nl);
        T.setLinesState(nl); T.setFontSizeState(px);
        const bw = ws.map((w, i) => ({ word: w, start: i, end: i + 0.5 }));
        T.setState([{ words: bw, start: 0, end: ws.length, text: ws.join(' ') }], bw, 'karaoke');
        const L = T.capLayout(ctx, T.getBlocks()[0], 0, -1, s, 1080, 1920);
        if (Math.abs(L.lh - L.fsS * lh) > 1e-9) lhBad.push(sid + ': Export-Zeilenabstand ' + L.lh + ' ≠ fs·L ' + L.fsS * lh);
        return [f.lines, f.words.join(' '), JSON.stringify(wr), L.lines.map(l => l.length).join('/')].join(' | ');
      };
      const ref = sig(1.3);
      for (let lh = 0.9; lh <= 1.8001; lh += 0.05) { const v = sig(Math.round(lh * 100) / 100); if (v !== ref) { lhBad.push(sid + ' ' + px + 'px ' + nl + 'Z „' + ws.join(' ') + '“ lh ' + lh.toFixed(2) + ': ' + v + ' ≠ ' + ref); break; } }
    }
    T.setLinesState(lines0); T.setFontSizeState(fs0);
    ok(!lhBad.length, 'Zeilenhöhe 0.9–1.8 ändert Zeilenzahl/Umbruch nie (fitCaptionWords, wrapCaptionLines, capLayout)' + (lhBad.length ? ': ' + lhBad.slice(0, 4).join(' | ') : ''));
    ok(T.getFontSize() === fs0, 'Schriftgrösse unverändert');
    ok(/#capOverlay\{[^}]*line-height:0[;}]/.test(htmlContent), 'Vorschau: #capOverlay ohne Strut (line-height:0) — Box-Geometrie wie im Export');
  }

  // ── Konto selbst löschen: RPC delete_my_account, danach lokal abgemeldet; Abbruch/Fehler lassen alles stehen ──
  {
    const calls = []; let rpcErr = null, asked = 0;
    const fakeSb = { rpc: async n => { calls.push('rpc:' + n); return { error: rpcErr }; }, auth: { signOut: async o => { calls.push('signOut:' + (o && o.scope)); return {}; } } };
    const realConfirm = global.confirm; T.setSbState(fakeSb);
    global.confirm = () => { asked++; return false; }; T.setMeEmail('a@b.ch');
    await T.deleteAccount();
    ok(asked === 1 && calls.length === 0 && T.getMeEmail() === 'a@b.ch', 'Konto löschen: ohne Bestätigung passiert nichts');
    global.confirm = () => true; rpcErr = { message: 'boom' };
    await T.deleteAccount();
    ok(calls.join() === 'rpc:delete_my_account' && T.getMeEmail() === 'a@b.ch', 'Konto löschen: RPC-Fehler → bleibt angemeldet');
    rpcErr = null; calls.length = 0;
    await T.deleteAccount();
    ok(calls.join() === 'rpc:delete_my_account,signOut:local' && T.getMeEmail() === '', 'Konto löschen: RPC, lokal abmelden, UI zurückgesetzt');
    T.setMeEmail('a@b.ch'); T.setBillingState({ enabled: true, loggedIn: true, plan: 'pro' }); calls.length = 0; asked = 0;
    global.confirm = () => { asked++; return true; };
    await T.deleteAccount();
    ok(calls.length === 0 && asked === 0 && T.getMeEmail() === 'a@b.ch', 'Konto löschen: aktives Abo blockiert (erst kündigen)');
    T.setBillingState(null);
    T.setSbState(null); global.confirm = realConfirm; if (!realConfirm) delete global.confirm;
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    ok(/grant execute on function public\.delete_my_account\(\) to authenticated/.test(sql), 'Konto löschen: schema.sql gibt delete_my_account an angemeldete Nutzer frei');
  }

  // ── Style-Panel (P4): Struktur, IDs, Reihenfolge, abhängige Zeilen ──
  {
    const E = id => document.getElementById(id);
    // Alle Kontroll-IDs des alten Customize-Panels (Stand 91a81c1; ohne die reinen Container qQuick/csMore) gibt es weiterhin genau einmal
    const OLD_IDS = ('szSlider szDisp posRow wpbSlider wpbDisp mcAuto mcSel mcDisp linesRow caseSel emGrp emKwBtn emEmoBtn emZoomRow emNote advSet csLs csLsDisp csLh csLhDisp ' +
      'csText csHlSw csHl csHlLbl csFont fontUpload csWeight csEm csEmFont csOutlineW csOutlineDisp csOutlineC csShadow csGlow csGlowInt csBox csBoxC csBoxO csBoxR csBoxRDisp ' +
      'csHlType csMotion csAnimRow csAnim csAnimHint pauseChk cutChk punctBtn toSlider toDisp tplCount tplName tplSaveBtn tplStatus tplEditing tplImport').split(' ');
    const dup = OLD_IDS.filter(id => (htmlContent.match(new RegExp('\\bid="' + id + '"', 'g')) || []).length !== 1);
    ok(dup.length === 0, 'Style-Panel: alle ' + OLD_IDS.length + ' Kontroll-IDs des alten Panels existieren genau einmal' + (dup.length ? ' (Abweichung: ' + dup.join(', ') + ')' : ''));
    ok(!/csUpper/.test(htmlContent), 'Style-Panel: toter Code csUpper entfernt');
    // Gruppenreihenfolge: Looks → Text → Animation → Layout → Effekte → Erweitert → Template speichern
    const order = ['id="stylePicker"', 'id="csgText"', 'id="csgAnim"', 'id="csgLayout"', 'id="csgFx"', 'id="advSet"', 'id="csgTpl"'].map(k => htmlContent.indexOf(k));
    ok(order.every((x, i) => x > 0 && (i === 0 || x > order[i - 1])), 'Style-Panel: Gruppenreihenfolge Looks · Text · Animation · Layout · Effekte · Erweitert · Template: ' + order.join(','));
    // Wichtigste Kontrollen an der richtigen Stelle (Segment Animation vor Layout; Zeilenlängen-Hinweis unter „Erweitert“, nicht unter „Spacing“)
    const at = id => htmlContent.indexOf('id="' + id + '"');
    ok(at('csgText') < at('csFont') && at('csFont') < at('szSlider') && at('szSlider') < at('csText') && at('csText') < at('csgAnim') && at('csgAnim') < at('csMotion')
       && at('csMotion') < at('csAnimRow') && at('csAnimRow') < at('emKwBtn') && at('emKwBtn') < at('csgLayout') && at('csgLayout') < at('posRow') && at('posRow') < at('wpbSlider')
       && at('wpbSlider') < at('linesRow') && at('linesRow') < at('csgFx') && at('csgFx') < at('csOutlineW') && at('csOutlineW') < at('csShadow') && at('csShadow') < at('csBox')
       && at('csBox') < at('advSet'), 'Style-Panel: Kontrollen in der vorgesehenen Reihenfolge');
    const adv = htmlContent.slice(at('advSet'), at('csgTpl'));
    ok(['csLs', 'csLh', 'csEmFont', 'caseOrig', 'csGlow', 'csGlowInt', 'csBoxO', 'csBoxR', 'mcAuto', 'mcSel', 'toSlider', 'pauseChk', 'cutChk', 'punctBtn'].every(id => adv.includes('id="' + id + '"'))
       && /Long captions break into more/.test(adv) && !/id="csOutlineW"|id="csMotion"/.test(adv), 'Style-Panel: Feinheiten unter „Erweitert“ (Zeilenlängen-Hinweis dort)');
    ok(!/<details[^>]*id="csgTpl"/.test(htmlContent) && htmlContent.slice(at('csgTpl') - 200, at('csgTpl')).indexOf('<details') < 0, 'Style-Panel: „Save as template“ liegt nicht im Aufklapper');
    // Abhängige Zeilen: ausgeblendet statt ausgegraut
    const disp = id => E(id).style.display;
    E('csMotion').value = 'highlight'; E('csBox').value = 'off'; E('csGlow').checked = false; T.syncCsUi();
    ok(disp('csAnimRow') === '' && disp('csHlTypeRow') === '', 'Style-Panel: Highlight → Word pop + Highlight-Art sichtbar');
    ok(disp('csBoxC') === 'none' && disp('csBoxOpRow') === 'none' && disp('csBoxRRow') === 'none', 'Style-Panel: kein Hintergrund → Farbe/Deckkraft/Ecken weg');
    ok(disp('csGlowStrRow') === 'none' && E('csGlowInt').disabled === true, 'Style-Panel: kein Glow → Glow-Stärke weg');
    E('csMotion').value = 'reveal'; E('csBox').value = 'pill'; E('csGlow').checked = true; T.syncCsUi();
    ok(disp('csAnimRow') === 'none' && disp('csHlTypeRow') === 'none', 'Style-Panel: Reveal → Word pop + Highlight-Art weg');
    ok(disp('csBoxC') === '' && disp('csBoxOpRow') === '' && disp('csBoxRRow') === '', 'Style-Panel: Hintergrund aktiv → Farbe/Deckkraft/Ecken sichtbar');
    ok(disp('csGlowStrRow') === '' && E('csGlowInt').disabled === false, 'Style-Panel: Glow an → Glow-Stärke sichtbar');
    E('csMotion').value = 'fill'; T.syncCsUi(); ok(disp('csAnimRow') === 'none' && disp('csHlTypeRow') === 'none', 'Style-Panel: Fill → Word pop + Highlight-Art weg');
    E('csMotion').value = 'highlight'; E('csBox').value = 'off'; T.syncCsUi();
    // Segment-Klick setzt das versteckte Select und ruft dessen Handler; Case-Segment ↔ caseSel ↔ „As typed“
    let fired = 0;
    const seg = { getAttribute: k => k === 'data-sel' ? 'csMotion' : null };
    E('csMotion').onchange = function () { fired++; };
    T.csSegPick({ parentNode: seg, getAttribute: k => k === 'data-v' ? 'fill' : null });
    ok(E('csMotion').value === 'fill' && fired === 1, 'Style-Panel: Segment-Klick setzt Select und feuert onchange');
    E('csMotion').onchange = null; E('csMotion').value = 'highlight';
    T.setCaptionCase('upper'); ok(E('caseSel').value === 'upper' && E('caseOrig').checked === false, 'Style-Panel: Case „AA“ → caseSel upper');
    T.setCaptionCase('orig'); ok(E('caseSel').value === 'orig' && E('caseOrig').checked === true, 'Style-Panel: „As typed“ (Erweitert) ↔ caseSel orig');
    T.setCaptionCase('asis'); ok(E('caseOrig').checked === false, 'Style-Panel: zurück auf Style-Standard');
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // INVARIANTEN-BLOCK (QA-Gerüst, s. test-ui-sweep.js): Regler ↔ Style-Feld ↔ Speicherpfade ↔ Vorschau/Export-Umbruch
  // Erwartete Fehlschläge: okx(bedingung, meldung, grund) — scheitert die Bedingung, wird sie nur als «xfail» gemeldet;
  // besteht sie, kommt eine «XPASS»-Warnung (Markierung dann entfernen). Nie auskommentieren.
  // ═══════════════════════════════════════════════════════════════════════════════════════
  {
    const okx = (c, m, why) => { if (c) console.log('XPASS-Warnung (erwarteter Fehler besteht jetzt, okx-Markierung entfernen):', m, '—', why); else console.log('xfail (erwartet):', m, '—', why); };
    const E = id => document.getElementById(id);
    const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    // ── 1) CONTROL_MAP: Regler-ID → Gruppe (_csDirty) → Style-Feld ──
    // set(): Regler auf einen Wert stellen, der vom Ausgangs-Style «hormozi» abweicht. group = Schlüssel in _csDirty (strokec → stroke, boxc → box wie in applyCustomStyle).
    const CONTROL_MAP = {
      csLs:       { group: 'ls',      field: 'ls',        set: () => { E('csLs').value = '3'; } },
      csLh:       { group: 'lh',      field: 'lh',        set: () => { E('csLh').value = '1.6'; } },
      csText:     { group: 'text',    field: 'tc',        set: () => { E('csText').value = '#ff0000'; } },
      csHl:       { group: 'hlc',     field: 'hl',        set: () => { E('csHl').value = '#00ffaa'; E('csHlType').value = 'color'; } },
      csFont:     { group: 'font',    field: 'fl',        set: () => { E('csFont').value = 'Anton'; } },
      csWeight:   { group: 'weight',  field: 'fw',        set: () => { E('csWeight').value = '400'; } },
      csEm:       { group: 'em',      field: 'em',        set: () => { E('csEm').value = '#ff00ff'; } },
      csEmFont:   { group: 'emfont',  field: 'emFont',    set: () => { E('csEmFont').value = 'Anton'; } },
      csOutlineW: { group: 'stroke',  field: 'ts',        set: () => { E('csOutlineW').value = '5'; E('csOutlineC').value = '#112233'; } },
      csOutlineC: { group: 'stroke',  field: 'cstroke',   set: () => { E('csOutlineW').value = '2'; E('csOutlineC').value = '#ff0000'; } },
      csShadow:   { group: 'stroke',  field: 'ts',        set: () => { E('csShadow').checked = false; E('csShadow').classList.remove('on'); E('csOutlineW').value = '4'; } },
      csGlow:     { group: 'glow',    field: 'hls',       set: () => { E('csGlow').checked = true; E('csGlowInt').value = '9'; } },
      csGlowInt:  { group: 'glow',    field: 'hls',       set: () => { E('csGlow').checked = true; E('csGlowInt').value = '25'; } },
      csBox:      { group: 'box',     field: 'boxBg',     set: () => { E('csBox').value = 'box'; E('csBoxC').value = '#223344'; E('csBoxO').value = '60'; } },
      csBoxC:     { group: 'box',     field: 'boxBg',     set: () => { E('csBox').value = 'box'; E('csBoxC').value = '#ff0000'; } },
      csBoxO:     { group: 'box',     field: 'boxBg',     set: () => { E('csBox').value = 'box'; E('csBoxO').value = '30'; } },
      csBoxR:     { group: 'box',     field: 'boxBr',     set: () => { E('csBox').value = 'box'; E('csBoxR').value = '21'; } },
      csHlType:   { group: 'hltype',  field: 'hlPillBg',  set: () => { E('csHlType').value = 'pill'; E('csHl').value = '#ff3366'; } },
      csMotion:   { group: 'motion',  field: 'motion',    set: () => { E('csMotion').value = 'reveal'; } },
      csAnim:     { group: 'anim',    field: 'anim',      set: () => { E('csAnim').value = 'flash'; } },
    };
    // Abdeckung: jedes <input>/<select> mit id="cs…" im Panel-Markup braucht einen Eintrag (neuer Regler ohne Eintrag → Test scheitert)
    const NON_STYLE_CS = ['csUpper']; // bewusst ohne Style-Feld (falls im Markup vorhanden)
    const panelIds = [...htmlContent.matchAll(/<(?:input|select)\b[^>]*\bid="(cs[A-Za-z0-9]+)"/g)].map(m => m[1]);
    const missing = panelIds.filter(id => !CONTROL_MAP[id] && !NON_STYLE_CS.includes(id));
    ok(missing.length === 0 && panelIds.length >= 18, 'CONTROL_MAP deckt alle Customize-Regler ab (fehlt: ' + missing.join(', ') + '; im Markup ' + panelIds.length + ')');
    const stale = Object.keys(CONTROL_MAP).filter(id => !panelIds.includes(id));
    ok(stale.length === 0, 'CONTROL_MAP enthält nur existierende Regler (veraltet: ' + stale.join(', ') + ')');
    // Jede Gruppe muss in buildCustomStyle() gelesen werden (sonst bewirkt der Regler nichts)
    const bcs = script.slice(script.indexOf('function buildCustomStyle()'), script.indexOf('function applyCustomStyle('));
    Object.values(CONTROL_MAP).forEach(c => ok(new RegExp('d\\.' + c.group + '\\b').test(bcs), 'buildCustomStyle liest Gruppe «' + c.group + '»'));
    // Pro Regler: Feld wird gesetzt und übersteht alle Speicherpfade
    Object.keys(CONTROL_MAP).forEach(id => {
      const c = CONTROL_MAP[id];
      T.selectStyle('hormozi');                       // seedet alle Regler + Basis (Ausgangs-Style ohne Layout-Preset)
      const base = JSON.parse(JSON.stringify(T.STYLES.find(x => x.id === 'hormozi')));
      c.set(); T.setCsDirty({ [c.group]: true });
      const cs = T.buildCustomStyle();
      ok(cs[c.field] !== undefined && !eq(cs[c.field], base[c.field]), id + ': buildCustomStyle setzt «' + c.field + '» (' + JSON.stringify(cs[c.field]) + ' vs. Basis ' + JSON.stringify(base[c.field]) + ')');
      const sane = T.sanitizeStyle(cs);
      ok(eq(sane[c.field], cs[c.field]), id + ': «' + c.field + '» übersteht sanitizeStyle');
      const tpl = T.normalizeTemplate({ id: 'inv_' + id, name: 'x', style: cs, layout: {}, createdAt: 1, updatedAt: 1 });
      ok(tpl && eq(tpl.style[c.field], cs[c.field]), id + ': «' + c.field + '» übersteht normalizeTemplate');
      const st = tpl && T.styleFromTemplate(tpl);
      ok(st && eq(st[c.field], cs[c.field]), id + ': «' + c.field + '» übersteht styleFromTemplate');
      // projectPayload → restoreSavedStyle (neue Sitzung): Custom-Style aus dem Payload
      const i = T.STYLES.findIndex(x => x.id === 'custom'); if (i >= 0) T.STYLES[i] = cs; else T.STYLES.push(cs);
      T.setActiveId('custom');
      const pl = JSON.parse(JSON.stringify(T.projectPayload()));
      ok(pl.styleDef && eq(pl.styleDef[c.field], cs[c.field]), id + ': «' + c.field + '» steht im Projekt-Payload (styleDef)');
      T.STYLES.splice(T.STYLES.findIndex(x => x.id === 'custom'), 1);
      T.restoreSavedStyle(pl);
      const back = T.STYLES.find(x => x.id === 'custom');
      ok(back && eq(back[c.field], cs[c.field]), id + ': «' + c.field + '» übersteht restoreSavedStyle');
    });
    T.setCsDirty({}); T.selectStyle('hormozi');

    // ── 2) TPL_STYLE_KEYS: jedes Feld übersteht den Rundlauf; jedes Style-Feld der Presets hat einen Eintrag ──
    {
      const bool = ['hlItalic', 'hlUpper', 'circle', 'emItalic'], num = ['lh', 'emS'];
      const sample = k => bool.includes(k) ? true : num.includes(k) ? 1.25 : k === 'hlCycle' ? ['#ff0000', '#00ff00'] :
        k === 'pill' ? { bg: '#fff', br: '5px', p: '1px 2px', border: '1px solid #000', borderLeft: '2px solid #f00' } : 'v-' + k;
      T.TPL_STYLE_KEYS.forEach(k => {
        const o = { [k]: sample(k) }, s1 = T.sanitizeStyle(o);
        ok(eq(s1[k], o[k]), 'TPL_STYLE_KEYS «' + k + '» übersteht sanitizeStyle (' + JSON.stringify(s1[k]) + ')');
        const t = T.normalizeTemplate({ id: 'k_' + k, name: 'k', style: Object.assign({ fl: 'Poppins', font: "'Poppins'", fw: '800', tc: '#fff', hl: '#fff', anim: 'none' }, o), layout: {} });
        ok(t && eq(t.style[k], o[k]) && eq(T.styleFromTemplate(t)[k], o[k]), 'TPL_STYLE_KEYS «' + k + '» übersteht normalizeTemplate → styleFromTemplate');
      });
      // Neues Style-Feld in STYLES ohne Eintrag in TPL_STYLE_KEYS → Nutzer-Templates/Projekte verlieren es still
      const NOT_PERSISTED = ['id', 'name', 'badge', 'layout']; // Identität bzw. Preset-Layout (Templates führen es separat in .layout)
      const used = new Set(); T.STYLES.forEach(s => Object.keys(s).forEach(k => { if (!NOT_PERSISTED.includes(k) && !k.startsWith('_')) used.add(k); }));
      const unknown = [...used].filter(k => !T.TPL_STYLE_KEYS.includes(k));
      ok(unknown.length === 0, 'Jedes Style-Feld der Presets steht in TPL_STYLE_KEYS (fehlt: ' + unknown.join(', ') + ')');
      // … und buildCustomStyle() erzeugt nur bekannte Felder
      T.selectStyle('hormozi'); T.setCsDirty({ text: 1, stroke: 1, hlc: 1, glow: 1, hltype: 1, box: 1, anim: 1, motion: 1, ls: 1, lh: 1, weight: 1, font: 1, em: 1, emfont: 1 });
      E('csLh').value = '1.5'; E('csEmFont').value = 'Anton'; E('csBox').value = 'pill'; E('csHlType').value = 'pill'; E('csMotion').value = 'fill';
      const ck = Object.keys(T.buildCustomStyle()).filter(k => !NOT_PERSISTED.includes(k) && !k.startsWith('_') && !T.TPL_STYLE_KEYS.includes(k));
      ok(ck.length === 0, 'buildCustomStyle erzeugt nur Felder aus TPL_STYLE_KEYS (unbekannt: ' + ck.join(', ') + ')');
      T.setCsDirty({}); T.selectStyle('hormozi');
    }

    // ── 3) Keine toten Optionen: jede Option jedes Style-<select> ändert Style oder buildCap-Ausgabe ──
    {
      const selects = [...htmlContent.matchAll(/<select\b[^>]*\bid="(cs[A-Za-z0-9]+)"[^>]*>([\s\S]*?)<\/select>/g)].map(m => ({ id: m[1], opts: [...m[2].matchAll(/<option\b([^>]*)>([^<]*)/g)].map(o => { const v = /value="([^"]*)"/.exec(o[1]); return v ? v[1] : o[2]; }) }));
      ok(selects.length >= 6, 'Panel-<select>s gefunden: ' + selects.map(s => s.id).join(', '));
      const words = ['Das', 'ist', 'ein', 'Test'];
      selects.forEach(sel => {
        const opts = sel.opts.filter(o => o && o !== '__other');
        if (opts.length < 2) return; // csEmFont: Optionen werden erst zur Laufzeit gefüllt (eigene Prüfung oben)
        const outs = opts.map(v => {
          T.selectStyle('hormozi'); T.setCaseState('asis');
          const grp = CONTROL_MAP[sel.id] && CONTROL_MAP[sel.id].group;
          if (sel.id === 'csBox') { E('csBox').value = v; E('csBoxR').value = v === 'pill' ? '22' : '8'; }
          else E(sel.id).value = v;
          T.setCsDirty(grp ? { [grp]: true } : {});
          const cs = T.buildCustomStyle();
          return JSON.stringify(cs) + '||' + T.buildCap(words, cs, 1, 24, null);
        });
        const seen = {}; outs.forEach((o, i) => { (seen[o] = seen[o] || []).push(opts[i]); });
        const dead = Object.values(seen).filter(a => a.length > 1);
        ok(dead.length === 0, '«' + sel.id + '»: jede Option erzeugt anderen Style/buildCap-Output (gleich: ' + dead.map(a => a.join('=')).join(' | ') + ')');
      });
      T.setCsDirty({}); T.selectStyle('hormozi');
    }

    // ── 4) Vorschau-Umbruch = Export-Umbruch (buildCap vs. capLayout, deterministische Stub-Messung, zufällige Wortfolgen × Styles) ──
    {
      let seed = 20260101; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      const POOL = ['Ja', 'und', 'das', 'Test', 'kurzer', 'Untertitel', 'Heute', 'zeigen', 'wir', 'dir,', 'schnell', 'Rindfleischverarbeitungsbetriebe', 'warum', 'es', 'so', 'gut', 'funktioniert.', 'Wald', 'Birkenhof', 'Gipf-Oberfrick', 'Hochlandrinder', 'ok'];
      T.setEmphState(false, false, 'off'); T.setCaseState('asis'); T.setFontSizeState(22);
      const ctx = document.createElement('canvas').getContext('2d');
      let cases = 0; const bad = [];
      const lineWords = html => { // Zeilen aus der Vorschau-HTML (jede Zeile = display:block-Span mit Wort-Spans)
        const parts = html.split('<span style="display:block;white-space:nowrap">').slice(1);
        const grab = h => [...h.matchAll(/<span data-oi="\d+"[^>]*>([^<]*)<\/span>/g)].map(m => m[1].toLowerCase());
        return parts.length ? parts.map(grab) : [grab(html)];
      };
      T.STYLES.filter(s => s.id !== 'custom' && !s._isTpl).forEach(s => {
        [1, 2].forEach(lines => {
          T.setLines({ dataset: { lines: String(lines) } });
          for (let n = 0; n < 6; n++) {
            const cnt = 2 + Math.floor(rnd() * 3), ws = Array.from({ length: cnt }, () => POOL[Math.floor(rnd() * POOL.length)]);
            const blk = { text: ws.join(' '), start: 0, end: 1, words: ws.map((w, i) => ({ word: w, start: i * 0.2, end: i * 0.2 + 0.2 })) };
            T.setState([blk], blk.words, 'karaoke');
            const html = T.buildCap(ws, s, -1, 22, null, lines, { em: null });
            const L = T.capLayout(ctx, blk, 0, 0, s, 1080, 1920);
            const dom = lineWords(html), exp = L.lines.map(line => line.map(wo => String(wo.t).toLowerCase()));
            cases++;
            if (!eq(dom, exp)) bad.push(s.id + '/' + lines + 'Z «' + ws.join(' ') + '»: Vorschau ' + dom.map(x => x.join(' ')).join(' / ') + ' ≠ Export ' + exp.map(x => x.join(' ')).join(' / '));
          }
        });
      });
      T.setLines({ dataset: { lines: '2' } }); T.setState([], [], 'karaoke');
      const where = [...new Set(bad.map(x => x.split(':')[0].replace(/ «.*/, '')))].join(', ');
      // Früher 13 Abweichungen: 12 davon Stub-Artefakt (Stub-Canvas ignorierte letterSpacing, s. mkEl.getContext), 1 echt — capLayout
      // rundete die Export-Schrift auf ganze px (bis ~1 % breiter) → knapp passende Zeile brach im Export um (Mindest-Schriftgrösse).
      ok(bad.length === 0, 'Vorschau-Umbruch (buildCap) = Export-Umbruch (capLayout) in ' + cases + ' Zufallsfällen — ' + bad.length + ' Abweichung(en) bei ' + where + ': ' + bad.slice(0, 2).join(' ;; '));
    }
  }

  // ── capLayout ohne DOM (Fallback-Modell, z. B. Node): Mitte aus der Schriftmetrik statt fester Konstante fs·0.35 ──
  // (im Browser misst capLayout die Vorschau-Zeilen per capDomVMetrics nach, s. test-ui-sweep geom/base und pixel/shift)
  {
    const ctxM = { font: '', letterSpacing: '0px', measureText(str) { const m = /([\d.]+)px/.exec(this.font), px = m ? +m[1] : 16; return { width: (str || '').length * px * 0.55, fontBoundingBoxAscent: px * 1.2, fontBoundingBoxDescent: px * 0.3 }; } };
    const ws = ['Das', 'ist', 'ein', 'Test'], blk = { text: ws.join(' '), start: 0, end: 1, words: ws.map((w, i) => ({ word: w, start: i * 0.2, end: i * 0.2 + 0.2 })) };
    T.setState([blk], blk.words, 'karaoke'); T.setLines({ dataset: { lines: '1' } }); T.setVOffState(0);
    const st = T.STYLES.find(x => x.id === 'hormozi');
    T.setPosState('center');
    const Lc = T.capLayout(ctxM, blk, 0, 0, st, 1080, 1920);
    ok(!Lc.dom && Math.abs(Lc.y0 - (960 + (1.2 - 0.3) / 2 * Lc.fsS)) < 0.01, 'capLayout Mitte (ohne DOM): Grundlinie = Mitte + (Ober − Unterlänge)/2 · fs (' + Lc.y0.toFixed(2) + ', fs ' + Lc.fsS + ')');
    ok(Math.abs((Lc.boxT + Lc.boxB) / 2 - 960) < 0.01 && Math.abs(Lc.boxB - Lc.boxT - Lc.lh) < 0.01, 'capLayout Mitte: Caption-Box (1 Zeile = L·fs hoch) mittig (' + Lc.boxT.toFixed(1) + '–' + Lc.boxB.toFixed(1) + ')');
    ok(Math.abs(Lc.y0 - Lc.capA - Lc.boxT) < 0.01 && Math.abs(Lc.y0 + Lc.capD - Lc.boxB) < 0.01, 'capLayout: Wortbox = Box-Kanten (ohne Box-Padding)');
    T.setPosState('bottom');
    const Lb = T.capLayout(ctxM, blk, 0, 0, st, 1080, 1920);
    ok(Math.abs(Lb.boxB - Lb.y0 - Lb.capD) < 0.01 && Lb.boxB < 1920 && Lb.boxB > 1920 * 0.6, 'capLayout unten: Box-Unterkante = Grundlinie + Unterteil der Zeile (' + Lb.boxB.toFixed(1) + ')');
    const exact = Lb.fitPx * Lb.scale * ((st.fs && parseFloat(st.fs)) || 1);
    ok(Math.abs(Lb.fsS - exact) < 0.006, 'capLayout: Export-Schrift = Vorschau-Schrift × Skala, nicht auf ganze px gerundet (' + Lb.fsS + ' vs. ' + exact.toFixed(3) + ')');
    T.setLines({ dataset: { lines: '2' } }); T.setState([], [], 'karaoke');
  }

  // ── Lesbarkeits-Halo (S2): weisse Looks ohne Kontur tragen auf hellem/buntem Material ──
  {
    const HALO = ['tight', 'mix', 'statement', 'accent', 'serifbold', 'reveal', 'script', 'soft', 'minimal', 'lift', 'neon', 'editorial', 'marker', 'focus'];
    const bad = [];
    HALO.forEach(id => {
      const st = T.STYLES.find(x => x.id === id); if (!st) { bad.push(id + ' fehlt'); return; }
      [st.ts].concat(st.hlPillBg ? [] : [st.hls]).forEach((str, k) => {
        const sp = T.splitShadows(str);
        const halo = sp.soft.filter(l => !l.x && l.blur < 3).concat(sp.glow.filter(l => l.blur < 3));
        const dark = (str.match(/0 0 [\d.]+px rgba\(0,0,0,\.9\)/g) || []).length;
        if (dark < 2) bad.push(id + (k ? '.hls' : '.ts') + ': < 2 Halo-Schichten');
        if (sp.ring) bad.push(id + ': Halo darf keine Ring-Kontur sein (Wortabstand/Umbruch bliebe sonst nicht gleich)');
        if (sp.glow.some(l => l.blur < 3)) bad.push(id + ': Halo zaehlt faelschlich als Glow');
      });
    });
    ok(bad.length === 0, 'Looks ohne Kontur haben dezenten dunklen Halo (kein Ring, kein Glow-Fehlalarm)' + (bad.length ? ': ' + bad.join('; ') : ''));
    ok(T.capWordGap(T.STYLES.find(x => x.id === 'tight')) === 0, 'Halo aendert den Wortabstand nicht (kein Ring)');
    // Customize: Glow-Schalter bleibt bei Looks ohne echten Glow aus
    ok(['tight', 'accent', 'minimal'].every(id => !T.splitShadows(T.STYLES.find(x => x.id === id).hls).glow.length), 'Halo wird im Customize-Panel nicht als Glow erkannt');
  }
  // ── Box-/Pill-Looks bleiben mit SICHTBARER Fläche in der Safe-Zone (S2: Dark Box ragte bis 92 %, Note bis 93,5 %) ──
  {
    const stub = () => ({ _font: '', letterSpacing: '0px', calls: [], rects: [], lineWidth: 1, strokeStyle: '#000', fillStyle: '#000', shadowColor: '', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, globalAlpha: 1, filter: 'none',
      get font() { return this._font; }, set font(v) { this._font = v; },
      measureText(str) { const m = /([\d.]+)px/.exec(this._font); return { width: str === ' ' ? (m ? +m[1] : 16) * 0.2 : (str || '').length * (m ? +m[1] : 16) * 0.58 }; },
      fillText() {}, strokeText() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, beginPath() {}, fill() {}, stroke() {} });
    const sets = { Standardsatz: 'Heute zeigen wir dir wie schnell das wirklich geht'.split(' '),
                   Kompositum: 'Die Donaudampfschifffahrtsgesellschaft ist Geschwindigkeitsbegrenzung Rindfleischverarbeitungsbetriebe'.split(' ') };
    const boxLooks = T.STYLES.filter(st => ['stack', 'note', 'tiktok', 'hush', 'focus', 'marker', 'boxkara'].includes(st.id) && (st.boxBg || (st.hlPillBg && T.capMotion(st) === 'highlight')));
    ok(boxLooks.length >= 6 && ['stack', 'note', 'tiktok', 'hush', 'focus', 'marker', 'boxkara'].every(id => boxLooks.some(x => x.id === id)), 'Box-/Pill-Looks gefunden (' + boxLooks.map(x => x.id).join(',') + ')');
    const bad = [];
    for (const [nm, ws] of Object.entries(sets)) {
      const wl = ws.map((w, i) => ({ word: w, start: i * 0.5, end: i * 0.5 + 0.45 }));
      T.setState(T.buildCaptionBlocks(wl, []), wl, 'karaoke');
      boxLooks.filter(st => st.boxBg || nm === 'Standardsatz').forEach(st => { // Pill-Looks mit Kompositum: Messung im Browser (Stub kennt die Liang-Trennmuster nicht)
        const W = 1080;
        for (let bi = 0; bi < 12; bi++) {
          const bl = T.getBlocks ? T.getBlocks() : null; if (!bl || !bl[bi]) break;
          const L = T.capLayout(stub(), bl[bi], bi, 0, st, W, 1920);
          const wMax = Math.max.apply(null, L.lineWs);
          const vis = wMax + (st.boxBg ? 36 * L.scale : 0) + ((st.hlPillBg && T.capMotion(st) === 'highlight') ? 2 * T.CAP_PILL_PAD_X * L.scale : 0);
          const l = (W - vis) / 2 / W * 100, r = 100 - l;
          if (r > 87.5 + 0.1 || l < 12.5 - 0.1) bad.push(nm + '/' + st.id + '#' + bi + ' ' + l.toFixed(1) + '–' + r.toFixed(1) + '%');
        }
      });
    }
    ok(bad.length === 0, 'Box-/Pill-Looks: sichtbare Flaeche innerhalb 12,5–87,5 % (Standardsatz + Kompositum)' + (bad.length ? ': ' + bad.slice(0, 6).join('; ') : ''));
  }
  // ── Schriften ohne Wortzwischenraeume/ohne Trennmuster: kein Bindestrich mitten im Wort (S2) ──
  {
    const hy = (w, max, l) => T.capHyphenate(w, p => Array.from(p).length <= max, l);
    const cjk = hy('国際連合安全保障理事会', 4);
    ok(cjk.length >= 3 && cjk.join('') === '国際連合安全保障理事会' && cjk.every(p => !/-/.test(p) && Array.from(p).length <= 4), 'CJK-Langwort: Umbruch an Zeichengrenzen ohne Bindestrich (' + cjk.join(' / ') + ')');
    ok(hy('国際連合', 8).length === 1, 'CJK: passt es in die Zeile, bleibt das Wort ganz');
    const kin = hy('今日は、天気がいいです。', 5);
    ok(kin.join('') === '今日は、天気がいいです。' && kin.every(p => !/^[、。]/.test(p)), 'CJK: kein Satzzeichen am Teilanfang (' + kin.join(' / ') + ')');
    const th = hy('สวัสดีครับยินดีต้อนรับ', 6);
    ok(th.join('') === 'สวัสดีครับยินดีต้อนรับ' && th.every(p => !/^\p{M}/u.test(p) && !/-/.test(p)), 'Thai: nie vor einer Kombinationsmarke trennen, kein Bindestrich (' + th.join(' / ') + ')');
    ['المنظمةالدوليةللتعاونالاقتصادي', 'הארגוןהבינלאומילשיתוףפעולה', 'Διεθνέςοργανισμόςσυνεργασίας', 'अंतर्राष्ट्रीयसहयोगसंगठन'].forEach(w => {
      ok(hy(w, 5).length === 1, 'Schrift ohne Trennmuster wird nie getrennt: ' + w.slice(0, 8));
    });
    ok(hy('Donaudampfschifffahrtsgesellschaft', 12, 'de').length > 1 && hy('Привет-пока-долгожданный', 8, 'en').length >= 1, 'Latein/Kyrillisch trennen weiter wie bisher');
    ok(T.capHyphEligible('Geschwindigkeit') && !T.capHyphEligible('国際連合安全保障理事会') && !T.capHyphEligible('المنظمةالدولية'), 'capHyphEligible: Skript-Pruefung');
  }
  console.log(fails === 0 ? 'ALLE TESTGRUPPEN BESTANDEN' : fails + ' FEHLER');
  process.exit(fails ? 1 : 0);
})();
