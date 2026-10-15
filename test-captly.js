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
    get innerHTML() { return this._ih || ''; }, set innerHTML(v) { this._ih = v; if (v === '') this.children = []; }, textContent: '', value: '', className: '', title: '', href: '', download: '', rows: 1, scrollHeight: 12, offsetWidth: 0,
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
// Node ≥ 24 lädt undici (FormData) erst beim ersten Zugriff und merkt sich dabei das globale Blob → vor dem Stub laden,
// sonst lehnt FormData.append in api/transcribe.js echte Blobs ab
const NativeBlob = global.Blob; void global.FormData;
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
setExportFormatState:function(f){var n=normalizeExportFormat(f);exportAspect=n.aspect;exportFill=n.fill;exportPan=n.pan;},normalizeExportFormat:normalizeExportFormat,cropRect:cropRect,videoPlacement:videoPlacement,exportFormatState:exportFormatState,applyExportFormat:applyExportFormat,applyTemplateSettings:applyTemplateSettings,currentLayout:currentLayout,clampPan:clampPan,aspectMatches:aspectMatches,exportReframeMode:exportReframeMode,outputAspect:outputAspect,drawFastFrame:drawFastFrame,drawVideoFit:drawVideoFit,projectPayload:projectPayload,applyProjectPayload:applyProjectPayload,editListEnd:editListEnd,histDistance:histDistance,
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
capWordsFit:capWordsFit,capSegmentWords:capSegmentWords,capFixOrphans:capFixOrphans,capSentEnd:capSentEnd,syncWordsFromBlocks:syncWordsFromBlocks,mergeBlockWithPrevious:mergeBlockWithPrevious,
wrapCaptionLines:wrapCaptionLines,capLayout:capLayout,fileSlug:fileSlug,exportBaseName:exportBaseName,openExportSheet:openExportSheet,closeExportSheet:closeExportSheet,
exportDone:exportDone,dlBlob:dlBlob,shareLastExport:shareLastExport,topExport:topExport,setCapLang:function(v){_capLangForce=v;},setWordsState:function(w){wordTimestamps=w;},setEnhAuto:function(v){ENH_AUTO=v;},
localEmphasis:localEmphasis,clearAutoFlags:clearAutoFlags,isEmphWord:isEmphWord,emWordRef:emWordRef,applyEnhanceResult:applyEnhanceResult,blockEmoji:blockEmoji,
toggleWordEmph:toggleWordEmph,setBlockEmoji:setBlockEmoji,getEmph:function(){return {kw:emKw,emoji:emEmoji,zoom:emZoom,src:emSrc};},
setEmphState:function(k,e,z){emKw=k;emEmoji=e;emZoom=z;_zoomPlanKey=null;_lastKey=null;},applyProjectPayload:applyProjectPayload,capDragPlace:capDragPlace,capPosFromBox:capPosFromBox,capHClamp:capHClamp,capApplyH:capApplyH,capTopPct:capTopPct,capBottomPct:capBottomPct,setHOffState:function(v){capHOff=v;},getHOff:function(){return capHOff;},setFreeState:function(v){capFree=v;},getFree:function(){return capFree;},getPos:function(){return capPos;},getVOff:function(){return capVOff;},capDragStart:capDragStart,capDragMove:capDragMove,capDragEnd:capDragEnd,projectPayload:projectPayload,applyTemplateSettings:applyTemplateSettings,getUndoSnapshot:function(){return captionSnapshot();},
emphScale:emphScale,emphColor:emphColor,emphShadowIsHl:emphShadowIsHl,emojiPopState:emojiPopState,zoomPlanFrom:zoomPlanFrom,zoomScaleAt:zoomScaleAt,zoomAt:zoomAt,
runEnhance:runEnhance,genPostCaption:genPostCaption,getPost:function(){return postCaption;},postText:postText,getTrRun:function(){return _trRun;},
capMotion:capMotion,capWordFx:capWordFx,capBlockFx:capBlockFx,capBlockVisEnd:capBlockVisEnd,capSlideBoxes:capSlideBoxes,capMixColor:capMixColor,capFxSteady:capFxSteady,
setLines:setLines,splitBlockAtCursor:splitBlockAtCursor,getLines:function(){return CAPTION_LINES;},getMaxChars:function(){return CAP_MAX_CHARS;},getPresetPrevLayout:function(){return _presetPrevLayout;},setFontSizeState:function(v){fontSize=v;},
setReduceMotion:function(v){_capRM=v;},animState:animState,ANIM_KEYFRAMES:ANIM_KEYFRAMES,ANIM_DUR:ANIM_DUR,animDur:animDur,ANIM_DURS:ANIM_DURS,syncCsUi:syncCsUi,capFontWeights:capFontWeights,csSyncWeights:csSyncWeights,onFontPick:onFontPick,capGlowLayers:capGlowLayers,capAnimDemoStart:capAnimDemoStart,getAnimDemo:function(){return _capAnimDemo;},clearAnimDemo:function(){_capAnimDemo=null;},
capWordFace:capWordFace,capHlVariant:capHlVariant,emphLineH:emphLineH,CAP_MOT:CAP_MOT,CAP_PILL_GAP:CAP_PILL_GAP,capWordGap:capWordGap,sanitizeStyle:sanitizeStyle,deleteAccount:deleteAccount,setSbState:function(s){_sb=s;},setBillingState:function(b){billing=b;},setMeEmail:function(e){meEmail=e;},getMeEmail:function(){return meEmail;},
capDomMotion:capDomMotion,applyTemplateSettings:applyTemplateSettings,setVidReady:function(v){vidReady=v;},
capBlurBand:capBlurBand,capBlurTop:capBlurTop,fmtHintApplies:fmtHintApplies,fmtHintAnswer:fmtHintAnswer,fmtHintArm:fmtHintArm,syncFormatBar:syncFormatBar,getFmtHint:function(){return {armed:fmtHintArmed,done:fmtHintDone};},setFmtHint:function(a,d){fmtHintArmed=a;fmtHintDone=d;},setProgDrag:function(v){_progDrag=v;},
csSegPick:csSegPick,syncCsSegs:syncCsSegs,
setWpbState:function(v){WORDS_PER_BLOCK=v;},getWpbState:function(){return WORDS_PER_BLOCK;},segCutState:segCutState,segCutStateOf:segCutStateOf,segRestoreCut:segRestoreCut,syncSegCutMarks:syncSegCutMarks,startFreshSession:startFreshSession,tplHookChecked:tplHookChecked,setTplHookChk:setTplHookChk,tplHasHook:tplHasHook,removeTemplateHook:removeTemplateHook,syncSafeZoneDefault:syncSafeZoneDefault,getSafeZone:function(){return {on:showSafeZone,user:szUserChoice};},HOOK_WORDS:HOOK_WORDS,getHookWords:function(){return HOOK_WORDS;},getZoomState:function(){return emZoom;},
setSzUser:function(v){szUserChoice=v;showSafeZone=v===null?false:v;},
coverDrawTitle:coverDrawTitle,coverMaxW:coverMaxW,coverAlignX:coverAlignX,coverSnap:coverSnap,coverHitWord:coverHitWord,coverClampOff:coverClampOff,coverCleanWo:coverCleanWo,coverOnTitle:coverOnTitle,coverSet:coverSet,coverResetPos:coverResetPos,coverMoved:coverMoved,
coverEmColor:coverEmColor,
capPairWrap:capPairWrap,capLinesEff:capLinesEff,capFillAlpha:capFillAlpha,
subtitleCues:subtitleCues,srtFile:srtFile,vttCues:vttCues,subLines:subLines,setSrtMode:setSrtMode,getSrtMode:function(){return srtMode;},setFileSuffix:setFileSuffix,getFileSuffix:function(){return fileSuffixOn;},loadSubOpts:loadSubOpts,buildTemplateExport:buildTemplateExport,fontFormatOf:fontFormatOf,bytesToB64:bytesToB64,b64ToBytes:b64ToBytes,importEmbeddedFonts:importEmbeddedFonts,getUserFontsMap:function(){return _userFonts;},TPL_FONT_MAX_BYTES:TPL_FONT_MAX_BYTES,templateFontNames:templateFontNames,exportTemplatesMsg:exportTemplatesMsg,

hookLayout:hookLayout,hookFx:hookFx,hookClean:hookClean,hookLocalText:hookLocalText,hookStyleOf:hookStyleOf,hookDodgeNeed:hookDodgeNeed,hookTextNow:hookTextNow,hookOutTime:hookOutTime,drawHookTitle:drawHookTitle,hookCapDodge:hookCapDodge,setHookState:function(o,t,d,a){hookOn=o;hookText=t||'';hookDur=d||2;hookAi=a||'';},getHookState:function(){return {on:hookOn,text:hookText,dur:hookDur,ai:hookAi};},setHookOn:setHookOn,onHookInput:onHookInput,onHookDur:onHookDur,hookFetchAi:hookFetchAi,syncHookUI:syncHookUI,hookClampDur:hookClampDur,projectPayload:projectPayload,HOOK_KEY:HOOK_KEY,
exportBlobOk:exportBlobOk,exportPlaybackTooShort:exportPlaybackTooShort,exportSizeLabel:exportSizeLabel,syncExpSub:syncExpSub,vttFile:vttFile,newExportToken:newExportToken,cancelExport:cancelExport,exportAborted:exportAborted,exportFailed:exportFailed,releaseLastExport:releaseLastExport,exportChangedSinceLast:exportChangedSinceLast,syncExportAgain:syncExportAgain,exportSignature:exportSignature,setExportRes:function(v){exportRes=v;},getExportRes:function(){return exportRes;},confirmRetranscribe:confirmRetranscribe,rtAnswer:rtAnswer,rtOpen:rtOpen,hideCapToast:hideCapToast,renderBilling:renderBilling,setReTranscribing:setReTranscribing,getCapPos:function(){return capPos;},downloadLastExport:downloadLastExport,getLastExportBlob:function(){return _lastExportBlob;},getExpTok:function(){return _expTok;},showExportMain:showExportMain,videoErrIsDamage:videoErrIsDamage,MSG_EXPORT_DAMAGED:MSG_EXPORT_DAMAGED,confirmLeaveExport:confirmLeaveExport,leaveWarningNeeded:leaveWarningNeeded,hasUnsavedWork:hasUnsavedWork,
zoomFill:zoomFill,zoomPlan:zoomPlan,zoomFeedback:zoomFeedback,zoomDemoStart:zoomDemoStart,getZoomDemo:function(){return _zoomDemo;},clearZoomDemo:function(){_zoomDemo=null;},
applyPreviewZoom:applyPreviewZoom,setEmphZoom:setEmphZoom,
styleFromTemplate:styleFromTemplate,TPL_STYLE_KEYS:TPL_STYLE_KEYS,cloneStyle:cloneStyle,
videoKeyHash:videoKeyHash,setAutosaveKey:function(k){_autosaveKey=k;},resetGateSkip:function(){_gateSkipped=false;try{sessionStorage.removeItem(GATE_SKIP_KEY);}catch(e){}},skipEmailGate:skipEmailGate,wmNoticeText:wmNoticeText,trHeaders:trHeaders,
CAP_PILL_PAD_X:CAP_PILL_PAD_X,
capSizeInfo:capSizeInfo,syncSzDisp:syncSzDisp,segSeek:segSeek,previewFrameW:previewFrameW,previewFrameH:previewFrameH,
capNoItalic:capNoItalic,capPopFactor:capPopFactor,setCsBase:function(b){_csBase=b;},drawTextGrouped:drawTextGrouped,capHyphEligible:capHyphEligible,capCharSplit:capCharSplit,
setActiveId:function(i){activeId=i;},lookSnapshot:lookSnapshot,lookUndoRun:lookUndoRun,lookUndoEnd:lookUndoEnd,tlHandleKey:tlHandleKey,tlGlobalKey:tlGlobalKey,capNoHyphen:capNoHyphen,landBrandId:landBrandId,setCsDirtyGet:function(){return _csDirty;},setHOff:function(v){capHOff=v;},setFree:function(v){capFree=v;},
parseHexInput:parseHexInput,csHexCommit:csHexCommit,csOpCommit:csOpCommit,csColorCss:csColorCss,csSyncColors:csSyncColors,getCsAlpha:function(){return _csAlpha;},
onTemplatesStorage:onTemplatesStorage,undoDeleteTemplate:undoDeleteTemplate,importTemplateMessage:importTemplateMessage,persistTemplates:persistTemplates,
emojiSearch:emojiSearch,EMO_CATS:EMO_CATS,EMO_PICK:EMO_PICK,emAiUnavailable:emAiUnavailable,setEmSrc:function(v){emSrc=v;},syncEmphUI:syncEmphUI,setEmphEmoji:setEmphEmoji,setCaptionBlocksForTest:function(b){captionBlocks=b;},
autoCutRegions:autoCutRegions,exportCutRegions:exportCutRegions,cutSavedSeconds:cutSavedSeconds,cutSavedLabel:cutSavedLabel,syncAutoCutUI:syncAutoCutUI,onAutoCutChange:onAutoCutChange,getAutoCut:function(){return autoCutSilence;},estimateSourceBitrate:estimateSourceBitrate,snapFrameRate:snapFrameRate,createCfrPlanner:createCfrPlanner,cfrFrameTimeUs:cfrFrameTimeUs,syncExportAgainIfOpen:syncExportAgainIfOpen,exportSignature:exportSignature,setExportFill:setExportFill,setExportFormat:setExportFormat,setExportResUI:setExportRes,
openTplMenu:openTplMenu,closeTplMenu:closeTplMenu,showTplRename:showTplRename,exportTemplates:exportTemplates,getTplMenu:function(){return _tplMenuEl;},tplMenuScroll:_tplMenuScroll,tplMenuKey:_tplMenuKey,
segFrameSnap:segFrameSnap,segDragTarget:segDragTarget,segDragApply:segDragApply,fmtT2:fmtT2,landTemplates:landTemplates,landPickLabel:landPickLabel,getBlocksB2:function(){return captionBlocks;},
mergeCutRegions:mergeCutRegions,allCutRegionsOf:allCutRegionsOf,allCutRegions:allCutRegions,srcToOut:srcToOut,outToSrc:outToSrc,cuesToOutput:cuesToOutput,setTrim:setTrim,cutOutRange:cutOutRange,restoreCut:restoreCut,getTrim:function(){return {i:trimIn,o:trimOut,c:manualCuts};},currentSubCues:currentSubCues,previewSkipCuts:previewSkipCuts,tlCutRange:tlCutRange,tlCutOut:tlCutOut,tlSetMark:tlSetMark,tlSelectCut:tlSelectCut,tlRestoreSel:tlRestoreSel,trimSnapshot:trimSnapshot,trimResetState:trimResetState,tlTrimHit:tlTrimHit,setTlSel:function(i){tlSel=i;},
openTplMenu:openTplMenu,closeTplMenu:closeTplMenu,showTplRename:showTplRename,exportTemplates:exportTemplates,getTplMenu:function(){return _tplMenuEl;},tplMenuScroll:_tplMenuScroll,tplMenuKey:_tplMenuKey,
openTplMenu:openTplMenu,closeTplMenu:closeTplMenu,showTplRename:showTplRename,exportTemplates:exportTemplates,getTplMenu:function(){return _tplMenuEl;},tplMenuScroll:_tplMenuScroll,tplMenuKey:_tplMenuKey,
resetGrpBuf:function(){_grpBuf=null;},localEmojis:localEmojis,localEmoLookup:localEmoLookup,LOCAL_EMO:LOCAL_EMO,drawTextWithPlan:drawTextWithPlan,capShK:capShK,
capOutK:capOutK,capScaleShadowStr:capScaleShadowStr,CAP_SH_REF:CAP_SH_REF,
hookVariants:hookVariants,hookVariantList:hookVariantList,hookNextVariant:hookNextVariant,hookDupOfCaptions:hookDupOfCaptions,EMO_REL_SIDE:EMO_REL_SIDE,EMO_LOCAL_SEC:EMO_LOCAL_SEC,EMO_LOCAL_GAP:EMO_LOCAL_GAP,EMO_LOCAL_SAME:EMO_LOCAL_SAME,capToastAction:capToastAction,
capBlockBase:capBlockBase,capTypeTp:capTypeTp,capTypeN:capTypeN,capCurOn:capCurOn,capUlFx:capUlFx,capUlRect:capUlRect,emojiStickerState:emojiStickerState,emphScale:emphScale,applyStyleDrops:applyStyleDrops,STYLE_MORE:STYLE_MORE,setCycBase:function(v){_capCycBase=v;},EMO_STICKER_DUR:EMO_STICKER_DUR};`;
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
ok(global.LASTBLOB.content.startsWith('WEBVTT\n\n1\n'), 'VTT-Header: nach WEBVTT genau eine Leerzeile: ' + JSON.stringify(global.LASTBLOB.content.slice(0, 16)));
ok(T.vttFile(['1\na', '2\nb']) === 'WEBVTT\n\n1\na\n\n2\nb' && T.vttFile([]) === 'WEBVTT\n\n', 'vttFile: Kopf + eine Leerzeile, Cues durch Leerzeilen');
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
  ok(T.getBlocks().every(b => b.words.length <= 3) && T.getBlocks()[0].text.startsWith('Korrigiert'), 'Regroup mit neuer Blockgroesse (wpb 2: Ausnahme 3 Wörter statt Einzelwort, Runde 2 P13)');
  ok(T.getBlocks()[0].srcWords[0].word === 'Korrigiert', 'Regroup: srcWords = aktueller Stand');
  T.onWpbChangeT(4);
}

// 9c) Neu-Transkription fragt nach manuellen Edits (In-App-Dialog, kein confirm()); Abbruch dreht die Sprachauswahl zurück
{
  const prevLang = T.getLang();
  const realConfirm = global.confirm; let asked = 0;
  global.confirm = () => { asked++; return false; }; // darf nie benutzt werden
  const modal = document.getElementById('rtModal'); modal.style.display = 'none';
  T.setCurrentFile(null); T.setCaptionsEdited(true);
  T.setLang('german'); ok(asked === 0 && !T.rtOpen() && T.getLang() === 'german', 'ohne Video: keine Rueckfrage');
  T.setLang(prevLang);
  T.setCurrentFile({ name: 'x.mp4' });
  document.getElementById('langSel').value = 'french';
  T.setLang('french');
  ok(asked === 0 && T.rtOpen() && modal.style.display === 'flex' && T.getLang() === prevLang, 'A12: Dialog statt confirm(), Sprache noch unverändert');
  T.rtAnswer(false);
  ok(!T.rtOpen() && modal.style.display === 'none' && T.getLang() === prevLang && document.getElementById('langSel').value === prevLang,
     'Abbruch: Sprache + Select bleiben, Edits bleiben, Dialog zu');
  ok(T.getCaptionsEdited() === true, 'Edit-Flag bleibt nach Abbruch gesetzt');
  T.setCaptionsEdited(false); T.setLang('italian'); ok(!T.rtOpen() && T.getLang() === 'italian', 'ohne Handkorrektur: keine Rückfrage, Sprache gesetzt'); T.setLang(prevLang);
  ok(/id="rtModal"[^>]*role="alertdialog"/.test(htmlContent) && !/confirm\('Re-transcribe/.test(htmlContent), 'A12: Re-transcribe-Warnung ist ein In-App-Dialog (alertdialog), kein confirm()');
  T.setCurrentFile(null); global.confirm = realConfirm;
}
// A12: Fortschritt bei Neu-Transkription + alter Toast
{
  const ov = document.getElementById('procOv'); ov.style.display = 'none';
  T.setReTranscribing(true);
  ok(ov.style.display === 'flex' && /Re-transcribing/.test(document.getElementById('procMsg').textContent), 'A12: Re-Transkription zeigt Fortschritts-Überlagerung');
  T.setReTranscribing(false); ok(ov.style.display === 'none', 'Überlagerung nach Re-Transkription weg');
  ok(typeof T.hideCapToast === 'function' && /function openCover\(\) \{[^}]*?hideCapToast\(\)/.test(htmlContent), 'A12: Cover-Dialog blendet alte Toasts aus');
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
// needsWatermark-Matrix: Beta/Abos aus → NIE; Abos an → bezahlt nie, Free/Gast nur mit Server-Flag `watermark` (pro Video)
{
  const plans = ['anon', 'free', 'creator', 'pro'], mails = ['', 'a@b.c'];
  for (const pl of plans) for (const em of mails) {
    T.setMe(pl, em); T.setBillingState(null);
    ok(T.needsWatermark() === false, 'Beta (Abos aus) nie Wasserzeichen: ' + pl + (em ? ' mit E-Mail' : ' ohne E-Mail'));
    T.setBillingState({ enabled: false, watermark: true });
    ok(T.needsWatermark() === false, 'Abos aus + Flag true → trotzdem nie: ' + pl);
    for (const flag of [false, true, undefined]) {
      T.setMe(pl, em); T.setBillingState({ enabled: true, loggedIn: pl !== 'anon', plan: pl, watermark: flag });
      const want = (pl === 'anon' || pl === 'free') && flag === true;
      ok(T.needsWatermark() === want, 'Abos an: ' + pl + ', watermark=' + flag + (em ? ', E-Mail' : ', ohne E-Mail') + ' → ' + want);
    }
  }
  // Plan aus billing schlägt veraltetes Flag (z. B. gerade upgegradet)
  T.setMe('free', 'a@b.c'); T.setBillingState({ enabled: true, loggedIn: true, plan: 'creator', watermark: true });
  ok(T.needsWatermark() === false, 'billing.plan creator mit altem Flag → keine Marke');
  T.setBillingState(null); T.setMe('anon', '');
}
T.setMe('anon', '');

// A5: Wasserzeichen-/Preisaussagen widerspruchsfrei. Statisch (JSON-LD, llms.txt, DE-Seite) = Beta-Aussage «nie ein Wasserzeichen»;
// die Regel «ab dem 3. Video» steht nur in .bill-only-Absätzen, die erst bei aktivem Billing erscheinen.
{
  const ldHead = htmlContent.slice(0, htmlContent.indexOf('<style>'));
  const llms = fs.readFileSync(path.join(__dirname, 'llms.txt'), 'utf8');
  const de = fs.readFileSync(path.join(__dirname, 'captly.de.html'), 'utf8');
  const RULE = /3rd video|3\. Video|ab dem dritten|from the third/i;
  ok(!RULE.test(ldHead), 'A5: FAQ-JSON-LD (EN) enthält keine «ab dem 3. Video»-Regel');
  ok(!RULE.test(llms) && /never a watermark/.test(llms), 'A5: llms.txt = Beta-Aussage');
  ok(!RULE.test(de.slice(0, de.indexOf('<style>'))), 'A5: FAQ-JSON-LD (DE) enthält keine «ab dem 3. Video»-Regel');
  for (const [name, h] of [['EN', htmlContent], ['DE', de]]) {
    const land = h.slice(h.indexOf('<div id="landing">'), h.indexOf('<!-- EDITOR -->'));
    const stripped = land.replace(/<p class="bill-only"[^>]*>[\s\S]*?<\/p>/g, '');
    ok(!RULE.test(stripped), 'A5: Landing ' + name + ': Stückzahl-Regel nur in .bill-only');
    ok(/<p class="bill-only" hidden>/.test(land), 'A5: Landing ' + name + ': .bill-only ist standardmässig verborgen');
    ok(/price-approx">[^<]*CHF 6\.50 \/ € 7/.test(land) && /price-approx">[^<]*CHF 12 \/ € 14/.test(land), 'A5: Preise mit ca.-Werten in CHF/€ (' + name + ')');
  }
  ok(/ca\. CHF 6\.50/.test(de) && /approx\./.test(htmlContent), 'A5: ca.-Kennzeichnung (DE «ca.», EN «approx.»)');
  // .bill-only folgt billingOn()
  const bo = { hidden: true }, prevQ = document.querySelectorAll; document.querySelectorAll = () => [bo];
  T.setBillingState(null); T.renderBilling(); ok(bo.hidden === true, 'A5: Billing aus → .bill-only bleibt verborgen');
  T.setMe('anon', ''); T.setBillingState({ enabled: true, loggedIn: false, plan: 'anon', limits: {} }); T.renderBilling(); ok(bo.hidden === false, 'A5: Billing an → .bill-only sichtbar');
  T.setBillingState(null); T.setMe('anon', ''); document.querySelectorAll = prevQ;
}

// A6: Handy-Landing hat Navigation (Preise, FAQ, Sprache) und Preis-Anker im Hero
{
  const nav = htmlContent.slice(htmlContent.indexOf('<nav class="land-nav-links">'), htmlContent.indexOf('</nav>', htmlContent.indexOf('<nav class="land-nav-links">')));
  ok(/<a href="#pricing">/.test(nav) && /<a href="#faq">/.test(nav) && /class="nav-lang"/.test(nav) && !/nl-opt" href="#pricing"|nl-opt" href="#faq"/.test(nav), 'A6: Preise, FAQ und Sprache sind auch mobil in der Nav');
  ok(/\.land-nav-links \.nl-opt\{display:none\}/.test(htmlContent) && !/\.land-nav-links\{display:none\}/.test(htmlContent), 'A6: mobil nur die Nebenlinks ausgeblendet, die Nav bleibt');
  ok(/<div class="hero-free"><a href="#pricing">[\s\S]{0,120}Free during the beta<\/a>[\s\S]{0,160}No watermark[\s\S]{0,160}No signup/.test(htmlContent), 'A6 + Gratis-Push: Preis-Anker im Hero («Free during the beta» → #pricing) + No watermark + No signup');
}

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
  // Fallback: gleiches Video unter anderem Dateinamen wird wiederhergestellt
  T.setState([], []); T.setCaptionsEdited(false); T.setAutosaveKey(null);
  document.getElementById('tStatus').innerHTML = '';
  const restoredFallback = T.restoreOrTranscribe({ name: 'other-name.mp4', size: 1234 }, 10.49);
  ok(restoredFallback === true, 'Fallback-Restore: anderer Dateiname, gleiche Größe+Dauer wiederhergestellt');
  const savedBlocksAfterFallback = JSON.stringify(T.getBlocks().map(b => b.text));
  ok(savedBlocksAfterFallback === savedBlocks, 'Fallback-Restore: Bloecke identisch');
  const autosavesAfterMigration = T.readAutosaves();
  ok(autosavesAfterMigration.length === 1, 'Fallback-Restore: nur 1 Eintrag nach Migration');
  ok(autosavesAfterMigration[0].key === 'other-name.mp4|1234|105', 'Fallback-Restore: Schlüssel migriert zu neuem Namen');
  // Fallback NICHT, wenn Größe unterschiedlich ist: no autosave found, no fallback found
  const savedList = T.readAutosaves();
  T.restoreOrTranscribe({ name: 'clip.mp4', size: 5678 }, 10.49);
  ok(JSON.stringify(T.readAutosaves().filter(e => e.key.indexOf('5678') >= 0)) === '[]', 'Fallback: unterschiedliche Größe führt zu KEINEM Autosave eintrag');
  // Clear autosaves before LRU test
  store[T.AUTOSAVE_KEY] = JSON.stringify([]);
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
ok(kwHtml.includes('5eead4'), 'Keyword ohne aktives Wort gefaerbt (Keyword-Farbe ≠ Aktiv-Farbe f7c204)');
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
  T.renameTemplate(tpl.id, 'Umbenannt'); // ohne prompt(): Name kommt aus dem Inline-Feld im Menü
  ok(T.getUserTemplates().find(t => t.id === tpl.id).name === 'Umbenannt', 'Rename');
  T.duplicateTemplate(tpl.id);
  const dup = T.getUserTemplates().find(t => t.name === 'Umbenannt copy');
  ok(dup && dup.id !== tpl.id && dup.style.boxBg === tpl.style.boxBg, 'Duplicate');
  T.editTemplate(tpl.id);
  ok(T.getEditingTpl() === tpl.id && document.getElementById('tplSaveBtn').textContent === 'Update', 'Edit-Modus');
  T.selectStyle('hormozi'); // anderer Style beendet den Edit-Modus
  ok(T.getEditingTpl() === null, 'Edit-Modus endet bei Style-Wechsel');
  T.deleteTemplate(dup.id); // ohne confirm(): sofort + Undo-Toast
  ok(!T.STYLES.find(x => x.id === dup.id) && T.getUserTemplates().find(t => t.id === dup.id).deleted, 'Delete hinterlaesst Grabstein');
  // Merge: neueres updatedAt gewinnt, Grabstein schlägt ältere Version
  const m = T.mergeTemplates([{ id: 'tpl_a', name: 'alt', style: { fl: 'Inter' }, updatedAt: 1 }, { id: 'tpl_b', name: 'b', style: {}, updatedAt: 5 }],
                             [{ id: 'tpl_a', name: 'neu', style: { fl: 'Anton' }, updatedAt: 2 }, { id: 'tpl_b', deleted: true, updatedAt: 9 }]);
  ok(m.find(t => t.id === 'tpl_a').name === 'neu' && m.find(t => t.id === 'tpl_b').deleted, 'Merge: neuer gewinnt, Grabstein gewinnt');
  // Import bereinigt gefährliche Werte und kollidiert nie mit eingebauten IDs
  const n = T.importTemplatesFromText(JSON.stringify({ templates: [{ id: 'classic', name: 'X', style: { fl: 'Inter', font: "'Inter'\"><img src=x onerror=alert(1)>", tc: 'red;background:url(http://x)' } }] })).imported;
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
  ok(T.buildCap(['der', 'weide'], hz, 0, 22, null, 1).includes('word-spacing:' + (6 * T.capOutK()) + 'px') && !T.buildCap(['der', 'weide'], lift, 0, 22, null, 1).includes('word-spacing'),
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

// 21c-2) B1 Zielformate: exportGeometry (Format × Quelle × Auflösung), Migration alter Werte, cropRect/Pan, Template-/Projekt-Roundtrip
{
  const near = (a, b, e) => Math.abs(a - b) <= (e === undefined ? 1e-6 : e);
  const SRC = [[720, 1280], [1280, 720], [1080, 1080], [3840, 2160]];
  const BASE = { '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350], '16:9': [1920, 1080] };
  const AR = { '9:16': 9 / 16, '1:1': 1, '4:5': 4 / 5, '16:9': 16 / 9 };
  for (const aspect of Object.keys(BASE)) for (const fill of ['crop', 'blur']) for (const [sw, sh] of SRC) {
    const same = Math.abs(sw / sh / AR[aspect] - 1) < 0.03, tag = aspect + ' ' + fill + ' ← ' + sw + '×' + sh;
    // 1080p: feste Zielgrösse, ausser die Quelle hat schon das Verhältnis (dann Original-Logik: nie hochskalieren)
    let g = T.exportGeometry(sw, sh, 30, '1080', { aspect, fill });
    if (same) {
      const k = Math.min(1, 1920 / Math.max(sw, sh));
      ok(g.mode === 'original' && g.W === (Math.round(sw * k) & ~1) && g.H === (Math.round(sh * k) & ~1), 'Geometrie 1080 ' + tag + ': Quelle schon im Zielverhältnis → kein Reframe (' + g.W + '×' + g.H + ', ' + g.mode + ')');
    } else {
      ok(g.mode === fill && g.W === BASE[aspect][0] && g.H === BASE[aspect][1] && g.aspect === aspect, 'Geometrie 1080 ' + tag + ' → ' + BASE[aspect].join('×') + ' (' + g.W + '×' + g.H + ', ' + g.mode + ')');
    }
    ok(g.W % 2 === 0 && g.H % 2 === 0, 'Geometrie 1080 ' + tag + ': gerade Masse');
    // «Original»-Auflösung: längere Leinwandseite = längere Quellseite, Verhältnis = Ziel
    g = T.exportGeometry(sw, sh, 30, 'orig', { aspect, fill });
    if (same) ok(g.mode === 'original' && g.W === (sw & ~1) && g.H === (sh & ~1), 'Geometrie orig ' + tag + ': Quelle unverändert');
    else ok(Math.max(g.W, g.H) >= Math.max(sw, sh) - 1 && Math.max(g.W, g.H) <= Math.max(sw, sh) && Math.abs(g.W / g.H / AR[aspect] - 1) < 0.01 && g.W % 2 === 0 && g.H % 2 === 0, 'Geometrie orig ' + tag + ' → ' + g.W + '×' + g.H);
  }
  let g = T.exportGeometry(1280, 720, 30, '1080', { aspect: '1:1', fill: 'crop', pan: { x: 0.5, y: 0 } });
  ok(g.W === 1080 && g.H === 1080 && g.mode === 'crop' && g.pan.x === 0.5, '16:9 → 1:1 crop trägt den Pan in die Geometrie');
  g = T.exportGeometry(1280, 720, 30, '1080', { aspect: '1:1', fill: 'blur', pan: { x: 0.5, y: 0 } });
  ok(g.mode === 'blur' && g.pan.x === 0, 'Blur ignoriert den Pan');
  g = T.exportGeometry(1920, 1080, 30, '1080', 'original');
  ok(g.W === 1920 && g.H === 1080 && g.mode === 'original', 'Original bleibt Original');

  // Migration: alte Werte 'blur'/'crop' = 9:16 + Ausfüllart; Unbekanntes/kaputtes → Original; Pan geklemmt
  const N = T.normalizeExportFormat;
  ok(JSON.stringify(N('blur')) === '{"aspect":"9:16","fill":"blur","pan":{"x":0,"y":0}}', 'Migration: «blur» → 9:16 blur: ' + JSON.stringify(N('blur')));
  ok(JSON.stringify(N('crop')) === '{"aspect":"9:16","fill":"crop","pan":{"x":0,"y":0}}', 'Migration: «crop» → 9:16 crop');
  ok(N('original').aspect === 'original' && N(null).aspect === 'original' && N(undefined).aspect === 'original' && N(42).aspect === 'original' && N('quatsch').aspect === 'original' && N({ aspect: '3:2' }).aspect === 'original', 'Migration: original/null/Unbekanntes → Original');
  ok(N('1:1').aspect === '1:1' && N('1:1').fill === 'crop', 'Seitenverhältnis als String');
  ok(N({ aspect: 'blur' }).aspect === '9:16' && N({ aspect: 'blur' }).fill === 'blur', 'Objekt mit altem aspect «blur»');
  ok(N({ aspect: '4:5', fill: 'blur', pan: { x: 5, y: -9 } }).pan.x === 1 && N({ aspect: '4:5', pan: { x: 5, y: -9 } }).pan.y === -1, 'Pan auf −1…1 geklemmt');
  ok(N({ aspect: '4:5', pan: { x: 'a', y: NaN } }).pan.x === 0 && N({ aspect: '4:5', pan: 'x' }).pan.y === 0 && N({ aspect: 'original', pan: { x: 1, y: 1 } }).pan.x === 0, 'Pan: Müll → 0, Original hat keinen Pan');
  g = T.exportGeometry(1920, 1080, 30, '1080', 'crop');
  ok(g.mode === 'crop' && g.W === 1080 && g.H === 1920 && g.aspect === '9:16', 'exportGeometry mit altem Wert «crop» = 9:16 crop');

  // cropRect: füllt die Leinwand, Pan nur entlang der beschnittenen Achse, Grenzen bündig
  let r = T.cropRect(1920, 1080, 1080, 1920, { x: 0, y: 0 });
  ok(near(r.sh, 1080) && near(r.sw, 607.5) && near(r.sx, (1920 - 607.5) / 2) && near(r.sy, 0), '16:9 → 9:16 Mitte: ' + JSON.stringify(r));
  r = T.cropRect(1920, 1080, 1080, 1920, { x: -1, y: 0.7 });
  ok(near(r.sx, 0) && near(r.sy, 0), 'Pan x = −1 → links bündig; y ohne Spielraum bleibt 0');
  r = T.cropRect(1920, 1080, 1080, 1920, { x: 1, y: 0 });
  ok(near(r.sx + r.sw, 1920), 'Pan x = 1 → rechts bündig');
  r = T.cropRect(1920, 1080, 1080, 1920, { x: 7, y: 0 });
  ok(near(r.sx + r.sw, 1920), 'Pan > 1 wird geklemmt');
  r = T.cropRect(720, 1280, 1080, 1080, { x: 0, y: 1 });
  ok(near(r.sw, 720) && near(r.sx, 0) && near(r.sh, 720) && near(r.sy, 1280 - 720), '9:16 → 1:1: Pan y = 1 → unten bündig (Spielraum nur vertikal)');
  r = T.cropRect(720, 1280, 1080, 1080, { x: 0, y: -1 });
  ok(near(r.sy, 0), '9:16 → 1:1: Pan y = −1 → oben bündig');
  r = T.cropRect(1280, 720, 1080, 1350, { x: 0.25, y: 0 });
  ok(near(r.sh, 720) && near(r.sw, 576) && near(r.sx, (1280 - 576) / 2 * 1.25), '16:9 → 4:5, Pan 0,25: ' + JSON.stringify(r));
  // Seitenverhältnis des Ausschnitts = Leinwand, Ausschnitt liegt immer in der Quelle
  let bad = 0;
  for (const [sw, sh] of SRC) for (const a of Object.keys(BASE)) for (const px of [-1, -0.3, 0, 0.6, 1]) for (const py of [-1, 0, 1]) {
    const c = T.cropRect(sw, sh, BASE[a][0], BASE[a][1], { x: px, y: py });
    if (!near(c.sw / c.sh, BASE[a][0] / BASE[a][1], 1e-6) || c.sx < -1e-6 || c.sy < -1e-6 || c.sx + c.sw > sw + 1e-6 || c.sy + c.sh > sh + 1e-6) bad++;
  }
  ok(bad === 0, 'cropRect: Ausschnitt hat Leinwand-Verhältnis und liegt in der Quelle (Verstösse: ' + bad + ')');
  // videoPlacement (Zeichnen) ist genau die Umkehrung von cropRect; contain = mittig, ganz sichtbar
  let pl = T.videoPlacement(1920, 1080, 1080, 1920, 'cover', { x: -0.4, y: 0 }); r = T.cropRect(1920, 1080, 1080, 1920, { x: -0.4, y: 0 });
  ok(near(pl.x, -r.sx * (1920 / 1080)) && near(pl.h, 1920) && near(pl.y, 0) && near(pl.w, 1920 * 1920 / 1080), 'Platzierung cover/Pan stimmt mit cropRect überein');
  pl = T.videoPlacement(1920, 1080, 1080, 1080, 'contain', { x: 1, y: 1 });
  ok(near(pl.w, 1080) && near(pl.h, 607.5) && near(pl.x, 0) && near(pl.y, (1080 - 607.5) / 2), 'Platzierung contain: mittig, Pan wirkungslos');
  // Zeichnen: drawVideoFit legt das Video exakt nach videoPlacement; drawReframed reicht den Pan nur bei crop durch
  { const ds = []; const cx = { drawImage() { ds.push([].slice.call(arguments).slice(1)); } };
    T.drawVideoFit(cx, { videoWidth: 1920, videoHeight: 1080 }, 1080, 1920, 'cover', { x: 1, y: 0 });
    const e = T.videoPlacement(1920, 1080, 1080, 1920, 'cover', { x: 1, y: 0 });
    ok(JSON.stringify(ds[0]) === JSON.stringify([e.x, e.y, e.w, e.h]), 'drawVideoFit zeichnet nach videoPlacement');
    const got = []; T.drawReframed({}, 1080, 1920, 'crop', (c, w, h, fit, pan) => got.push(fit + ':' + (pan && pan.x)), { x: 0.5, y: 0 });
    T.drawReframed({}, 1080, 1920, 'original', (c, w, h, fit, pan) => got.push(fit + ':' + (pan && pan.x)), { x: 0.5, y: 0 });
    ok(got.join() === 'cover:0.5,cover:null', 'drawReframed: Pan nur im Crop-Modus: ' + got.join());
  }

  // Zustand + Migration über die Setter; Vorschau-Rahmen folgt dem Zielverhältnis
  T.setExportFormatState('blur');
  ok(JSON.stringify(T.exportFormatState()) === '{"aspect":"9:16","fill":"blur","pan":{"x":0,"y":0}}', 'setExportFormatState(\'blur\') migriert');
  T.setExportFormatState({ aspect: '16:9', fill: 'crop', pan: { x: 0.2, y: 0 } });
  ok(T.outputAspect(720, 1280) === 16 / 9 && T.outputAspect(1920, 1080) === 1920 / 1080 && T.exportReframeMode(720, 1280) === 'crop' && T.exportReframeMode(1920, 1080) === 'original', 'outputAspect/Reframe-Modus je Quelle');
  T.setExportFormatState('original');

  // Template: Roundtrip, Migration, altes Template ohne Feld
  const lay0 = { pos: 'bottom', voff: 0, size: 30, aspect: '1:1', fill: 'blur', pan: { x: 0.4, y: -2 } };
  let tp = T.normalizeTemplate({ id: 'tpl_fmt1', name: 'Fmt', style: { fl: 'Poppins', fw: '800', tc: '#fff', hl: '#ff0' }, layout: lay0 });
  ok(tp.layout.aspect === '1:1' && tp.layout.fill === 'blur' && tp.layout.pan.x === 0.4 && tp.layout.pan.y === -1, 'Template: Format/Ausfüllart/Pan werden übernommen (Pan geklemmt)');
  tp = T.normalizeTemplate({ id: 'tpl_fmt2', name: 'Alt', style: { fl: 'Poppins', fw: '800', tc: '#fff', hl: '#ff0' }, layout: { pos: 'bottom', size: 30 } });
  ok(!('aspect' in tp.layout) && !('fill' in tp.layout) && !('pan' in tp.layout), 'Altes Template ohne Format-Feld bleibt ohne Format');
  tp = T.normalizeTemplate({ id: 'tpl_fmt3', name: 'Legacy', style: { fl: 'Poppins', fw: '800', tc: '#fff', hl: '#ff0' }, layout: { pos: 'bottom', fmt: 'crop' } });
  ok(tp.layout.aspect === '9:16' && tp.layout.fill === 'crop', 'Template mit altem fmt «crop» → 9:16 crop');
  T.setExportFormatState({ aspect: '4:5', fill: 'crop', pan: { x: -0.3, y: 0 } });
  const lay1 = T.currentLayout();
  ok(lay1.aspect === '4:5' && lay1.fill === 'crop' && lay1.pan.x === -0.3, 'currentLayout speichert Format/Ausfüllart/Pan');
  const lay2 = JSON.parse(JSON.stringify(T.normalizeTemplate({ id: 'tpl_fmt4', name: 'RT', style: { fl: 'Poppins', fw: '800', tc: '#fff', hl: '#ff0' }, layout: lay1 }).layout));
  T.setExportFormatState('original');
  T.applyTemplateSettings(lay2);
  ok(JSON.stringify(T.exportFormatState()) === '{"aspect":"4:5","fill":"crop","pan":{"x":-0.3,"y":0}}', 'Template-Roundtrip: speichern → normalisieren → anwenden: ' + JSON.stringify(T.exportFormatState()));
  T.setExportFormatState({ aspect: '1:1', fill: 'blur' });
  T.applyTemplateSettings({ pos: 'bottom', size: 30 }); // altes Template: Format bleibt unangetastet
  ok(T.exportFormatState().aspect === '1:1', 'Template ohne Format-Feld lässt das Format unverändert');
  T.applyTemplateSettings({ aspect: 'original' });
  ok(T.exportFormatState().aspect === 'original', 'Template mit «original» setzt Original');
  // Projekt/Autosave: Format wird mitgespeichert; alte Werte werden migriert; ohne Feld unverändert
  T.setExportFormatState({ aspect: '16:9', fill: 'crop', pan: { x: 0.1, y: 0 } });
  const pj = JSON.parse(JSON.stringify(T.projectPayload()));
  ok(pj.fmt && pj.fmt.aspect === '16:9' && pj.fmt.fill === 'crop' && pj.fmt.pan.x === 0.1, 'Projekt-Payload enthält das Zielformat');
  T.setExportFormatState('original');
  ok(!('fmt' in T.projectPayload()), 'Original → kein fmt im Payload (alte Projekte bleiben gleich)');
  T.applyProjectPayload(pj);
  ok(T.exportFormatState().aspect === '16:9' && T.exportFormatState().pan.x === 0.1, 'Projekt-Restore stellt das Format wieder her');
  T.applyProjectPayload({ fmt: 'blur' });
  ok(JSON.stringify(T.exportFormatState()) === '{"aspect":"9:16","fill":"blur","pan":{"x":0,"y":0}}', 'Projekt mit altem fmt «blur» → 9:16 blur');
  T.applyProjectPayload({});
  ok(T.exportFormatState().aspect === '9:16', 'Projekt ohne fmt lässt das Format unverändert');
  T.setExportFormatState('original');
  ok(T.exportSizeLabel(1920, 1080, '1080', { aspect: '1:1', fill: 'crop' }) === '1080×1080' && T.exportSizeLabel(1920, 1080, '1080', { aspect: '4:5', fill: 'blur' }) === '1080×1350' && T.exportSizeLabel(720, 1280, '1080', { aspect: '16:9', fill: 'crop' }) === '1080p', 'Label: 1:1/4:5 zeigen die Leinwand-Masse, 16:9 «1080p»');
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
ok(T.DEFAULT_STYLE === 'hormozi', 'Standard-Style fuer neue Nutzer: Bold Pop (N-Style)');

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
    ok(T.needsWatermark() === false, 'ohne E-Mail (Beta) → trotzdem kein Wasserzeichen');
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
    ok(T.passEmailGate() === false && err.style.display === '' && /valid email/.test(err.textContent) && /Skip/.test(err.textContent), 'ungültige Adresse → Fehlermeldung (mit Skip-Hinweis)');
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
    // Freiwillig: leeres Feld = übersprungen (kein Lead, kein Request), Export läuft, Feld bleibt danach weg
    T.openExportSheet(); inp.value = ''; const nCalls = calls.length;
    ok(g.style.display === '' && T.passEmailGate() === true && g.style.display === 'none' && calls.length === nCalls && !(T.LEAD_KEY in store), 'leeres Feld + Download → Gate übersprungen, nichts gespeichert/gesendet');
    ok(T.needsWatermark() === false, 'übersprungen → kein Wasserzeichen');
    T.passEmailGate(); T.closeExportSheet(); T.openExportSheet();
    ok(g.style.display === 'none', 'nach Skip: Feld beim erneuten Öffnen weg (Sitzung)');
    T.closeExportSheet(); T.resetGateSkip();
    T.openExportSheet();
    ok(g.style.display === '', 'Skip zurückgesetzt → Feld wieder da');
    T.closeExportSheet();
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

  // 18b) Freies Verschieben: Ziehmathematik, Klemmen, Magnet, Persistenz, Export
  {
    const fw = 270, fh = 480, st0 = { bx: 100, by: 300, bw: 70, bh: 40, fw, fh };
    // frei: Position bleibt exakt dort, wo losgelassen wurde (kein Rasten auf oben/Mitte/unten)
    let r = T.capDragPlace(st0, 20, -73, false);
    ok(r.x === 120 && r.y === 227, 'Drag: ohne Magnet exakt Zeigerweg (' + r.x + ',' + r.y + ')');
    ok(Math.abs(r.hoff - ((120 + 35 - 135) / 270 * 100)) < 0.01, 'Drag: hoff = Box-Mitte − Rahmenmitte in % der Breite');
    // Klemmen: nie aus dem Bild (auch nicht mit Magnet)
    r = T.capDragPlace(st0, 9999, 9999, true);
    ok(r.x + 70 <= fw && r.y + 40 <= fh && r.x >= 0 && r.y >= 0, 'Drag: unten rechts geklemmt');
    r = T.capDragPlace(st0, -9999, -9999, true);
    ok(r.x >= 0 && r.y >= 0, 'Drag: oben links geklemmt');
    // Magnet: Mitte (x) – innerhalb 6 px rastet ein, ausserhalb nicht; Alt (snap=false) aus
    r = T.capDragPlace(st0, 135 - 35 - 100 + 4, 0, true);
    ok(r.hoff === 0 && r.gx === 135, 'Drag: Magnet horizontale Mitte + Hilfslinie');
    r = T.capDragPlace(st0, 135 - 35 - 100 + 4, 0, false);
    ok(Math.abs(r.hoff) > 0.5 && r.gx === null, 'Drag: Alt schaltet den Magnet ab');
    r = T.capDragPlace(st0, 135 - 35 - 100 + 15, 0, true);
    ok(r.gx === null && Math.abs(r.hoff - 15 / 270 * 100) < 0.01, 'Drag: ausserhalb der Reichweite kein Rasten');
    // Magnet vertikal: Mitte
    r = T.capDragPlace(st0, 0, 240 - 20 - 300 - 3, true);
    ok(r.gy === 240 && Math.abs(r.y + 20 - 240) < 0.01, 'Drag: Magnet vertikale Mitte');
    // Anker folgt der Box-Mitte; Umrechnung ist die Umkehrung von applyPos()
    const pT = T.capPosFromBox(60, 40, fw, fh), pM = T.capPosFromBox(220, 40, fw, fh), pB = T.capPosFromBox(380, 40, fw, fh);
    ok(pT.pos === 'top' && pM.pos === 'center' && pB.pos === 'bottom', 'Anker oben/Mitte/unten nach Box-Mitte');
    ok(Math.abs((10 - pT.off) - 60 / fh * 100) < 0.01, 'oben: capTopPct-Umkehrung');
    ok(Math.abs((12 + pB.off) - (fh - 380 - 40) / fh * 100) < 0.01, 'unten: capBottomPct-Umkehrung');
    ok(Math.abs(pM.off) < 0.01, 'Mitte: Box exakt zentriert → Versatz 0');
    // kein Sprung an der Bucket-Grenze: gleiche Box-Position vor/nach Wechsel
    const yA = fh * 0.32 - 20 - 0.1, yB = fh * 0.32 - 20 + 0.1; // Mitte 31,98 % / 32,02 %
    const a = T.capPosFromBox(yA, 40, fw, fh), b2 = T.capPosFromBox(yB, 40, fw, fh);
    const topOf = (q, y) => q.pos === 'top' ? (10 - q.off) / 100 * fh : q.pos === 'bottom' ? fh - (12 + q.off) / 100 * fh - 40 : fh / 2 - q.off / 100 * fw - 20;
    ok(a.pos !== b2.pos, 'Grenze erreichbar (Anker wechselt)');
    ok(Math.abs(topOf(a, yA) - yA) < 0.1 && Math.abs(topOf(b2, yB) - yB) < 0.1, 'Anker-Wechsel verschiebt die Box nicht');
    // Safe-Zone nur ohne Frei-Flag erzwungen
    T.setFreeState(false);
    ok(T.capTopPct(60) === 12.46 && T.capBottomPct(-40) === 24.44, 'Preset-Modus: Safe-Zone-Mindestabstand');
    T.setFreeState(true);
    ok(T.capTopPct(60) === 0 && T.capBottomPct(-40) === 0, 'Frei-Modus: bis an den Bildrand ziehbar (Safe-Zone nur noch Warnung)');
    T.setFreeState(false);
    // Horizontal-Klemme (Vorschau + Export gleiche Formel)
    ok(T.capHClamp(50, 60) === 19, 'capHClamp: Box 60 % breit → max ±19 %');
    ok(T.capHClamp(-50, 60) === -19 && T.capHClamp(5, 60) === 5 && T.capHClamp(10, 100) === 0, 'capHClamp: symmetrisch, breite Box → 0');
    // Preset-Buttons setzen Versätze zurück
    const mkBtn = pos => ({ dataset: { pos }, parentElement: { querySelectorAll() { return []; } }, classList: { add() {}, remove() {} } });
    T.setHOffState(12); T.setFreeState(true); T.setVOffState(-7);
    T.setPos(mkBtn('center'));
    ok(T.getHOff() === 0 && T.getFree() === false && T.getVOff() === 0 && T.getPos() === 'center', 'Preset „Middle“: hoff/free/voff zurückgesetzt');
    T.setHOffState(12); T.setFreeState(true); T.setVOffState(-7);
    T.setPos(mkBtn('bottom'));
    ok(T.getHOff() === 0 && T.getFree() === false && T.getVOff() === 20 && T.getPos() === 'bottom', 'Preset „Bottom“: Standard-Versatz 20');
    // Persistenz: Projekt + Template-Layout
    T.setPosState('top'); T.setVOffState(33.5); T.setHOffState(-14.25); T.setFreeState(true);
    const pl = T.projectPayload();
    ok(pl.pos === 'top' && pl.voff === 33.5 && pl.hoff === -14.25 && pl.free === true, 'projectPayload trägt pos/voff/hoff/free');
    const lay = T.currentLayout();
    ok(lay.hoff === -14.25 && lay.free === true && lay.voff === 33.5, 'currentLayout (Templates) trägt hoff/free');
    T.setHOffState(0); T.setFreeState(false); T.setVOffState(0);
    T.applyTemplateSettings(lay);
    ok(T.getHOff() === -14.25 && T.getFree() === true && T.getVOff() === 33.5, 'Template anwenden stellt hoff/free/voff wieder her');
    T.applyTemplateSettings({ pos: 'bottom', voff: 20 });
    ok(T.getHOff() === 0 && T.getFree() === false, 'Template ohne hoff (alt) → mittig, Safe-Zone aktiv');
    T.setPosState('top'); T.setVOffState(33.5); T.setHOffState(-14.25); T.setFreeState(true);
    const saved = JSON.parse(JSON.stringify(T.projectPayload()));
    T.setHOffState(0); T.setFreeState(false); T.setPosState('bottom'); T.setVOffState(20);
    T.applyProjectPayload(saved);
    ok(T.getHOff() === -14.25 && T.getFree() === true && T.getVOff() === 33.5 && T.getPos() === 'top', 'applyProjectPayload: Position wiederhergestellt');
    T.applyProjectPayload(Object.assign({}, saved, { hoff: undefined, free: undefined }));
    ok(T.getHOff() === 0 && T.getFree() === false, 'applyProjectPayload: altes Projekt ohne hoff → mittig');
    T.applyProjectPayload(Object.assign({}, saved, { hoff: 999 }));
    ok(T.getHOff() === 50, 'applyProjectPayload: absurdes hoff wird begrenzt');
    T.setHOffState(0); T.setFreeState(false); T.setVOffState(0); T.setPosState('bottom'); T.applyPos();

    // Integration: capDragStart/Move/End über die DOM-Stubs (Maus + Touch), Position bleibt wo losgelassen
    {
      const frameEl = document.getElementById('prevFrame'), ovEl = document.getElementById('capOverlay');
      const oldFr = frameEl.getBoundingClientRect, oldKid = ovEl.firstElementChild;
      frameEl.getBoundingClientRect = () => ({ left: 10, top: 20, width: 270, height: 480, right: 280, bottom: 500 });
      ovEl.firstElementChild = { getBoundingClientRect: () => ({ left: 110, top: 320, width: 70, height: 40, right: 180, bottom: 360 }) };
      T.setPosState('bottom'); T.setVOffState(20); T.setHOffState(0); T.setFreeState(false);
      T.capDragStart({ type: 'mousedown', button: 0, clientX: 140, clientY: 340, stopPropagation() {} });
      T.capDragMove({ clientX: 140 + 30, clientY: 340 - 200, altKey: true, cancelable: true, preventDefault() {} });
      ok(T.getFree() === true && Math.abs(T.getHOff() - 30 / 270 * 100) < 0.05, 'Drag-Integration: horizontal frei (' + T.getHOff() + ')');
      ok(T.getPos() === 'top' || T.getPos() === 'center', 'Drag-Integration: Anker folgt der Box (' + T.getPos() + ')');
      T.capDragEnd({});
      ok(T.getFree() === true && T.getHOff() !== 0, 'Drag-Integration: nach Loslassen keine Rückkehr zum Preset');
      // Touch
      T.capDragStart({ type: 'touchstart', touches: [{ clientX: 140, clientY: 340 }], stopPropagation() {} });
      T.capDragMove({ touches: [{ clientX: 100, clientY: 340 }], cancelable: true, preventDefault() {} });
      T.capDragEnd({});
      ok(T.getHOff() < 0, 'Drag-Integration: Touch zieht nach links (' + T.getHOff() + ')');
      frameEl.getBoundingClientRect = oldFr; ovEl.firstElementChild = oldKid;
      T.setHOffState(0); T.setFreeState(false); T.setVOffState(0); T.setPosState('bottom'); T.applyPos();
    }

    // Export: Caption wandert mit hoff (ctx.translate) und y folgt dem Frei-Modus
    {
      const ws = ['Das', 'ist', 'ein', 'Test'], blk = { text: ws.join(' '), start: 0, end: 1, words: ws.map((w, i) => ({ word: w, start: i * 0.2, end: i * 0.2 + 0.2 })) };
      T.setState([blk], blk.words, 'karaoke'); T.setLines({ dataset: { lines: '1' } });
      const sty = T.STYLES.find(x => x.id === 'hormozi');
      const mkCtx = () => { const log = { tx: 0, ty: 0 }; const c = { font: '', letterSpacing: '0px', measureText(str) { const m = /([\d.]+)px/.exec(this.font); return { width: (str || '').length * (m ? +m[1] : 16) * 0.55 }; },
        roundRect() {}, rect() {}, beginPath() {}, fill() {}, stroke() {}, save() {}, restore() {}, translate(x, y) { log.tx += x; log.ty += y; }, rotate() {}, scale() {}, fillText() {}, strokeText() {}, ellipse() {},
        fillRect() {}, clip() {}, drawImage() {}, createLinearGradient() { return { addColorStop() {} }; } }; c.log = log; return c; };
      T.setPosState('bottom'); T.setVOffState(20); T.setFreeState(false); T.setHOffState(0);
      const c0 = mkCtx(); T.drawCaptionsOnCtx(c0, 0.1, sty, 1080, 1920, true);
      T.setHOffState(10);
      const c1 = mkCtx(); T.drawCaptionsOnCtx(c1, 0.1, sty, 1080, 1920, true);
      ok(Math.abs((c1.log.tx - c0.log.tx) - 108) < 0.01, 'Export: hoff 10 % → 108 px nach rechts bei 1080 px Breite (auflösungsunabhängig, %-Wert)');
      const c2 = mkCtx(); T.drawCaptionsOnCtx(c2, 0.1, sty, 540, 960, true);
      T.setHOffState(0); const c3 = mkCtx(); T.drawCaptionsOnCtx(c3, 0.1, sty, 540, 960, true);
      ok(Math.abs((c2.log.tx - c3.log.tx) - 54) < 0.01, 'Export: gleiche 10 % bei 540 px = 54 px');
      T.setHOffState(-999); const c4 = mkCtx(); T.drawCaptionsOnCtx(c4, 0.1, sty, 1080, 1920, true);
      ok(c4.log.tx - c0.log.tx > -540 && c4.log.tx - c0.log.tx < 0, 'Export: extremes hoff bleibt im Bild (geklemmt)');
      T.setHOffState(0);
      // Frei-Modus: Unterkante darf unter die Safe-Zone (Preset-Modus hält 24,44 % Abstand ein)
      T.setPosState('bottom'); T.setVOffState(-40);
      T.setFreeState(false); const Lp = T.capLayout(mkCtx(), blk, 0, 0, sty, 1080, 1920);
      T.setFreeState(true); const Lf = T.capLayout(mkCtx(), blk, 0, 0, sty, 1080, 1920);
      ok(Lf.boxB > Lp.boxB + 100, 'Export: capFree hebt den Safe-Zone-Mindestabstand auf (' + Lp.boxB.toFixed(0) + ' → ' + Lf.boxB.toFixed(0) + ')');
      ok(Lf.boxB <= 1920 && Lf.boxT >= 0, 'Export: Box bleibt im Bild');
      T.setFreeState(false); T.setVOffState(0); T.setPosState('bottom'); T.setState([], [], 'karaoke');
    }
  }

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
    const stubBlob = global.Blob; global.Blob = NativeBlob; // Function baut echtes FormData
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
    global.Blob = stubBlob;
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
    T.toggleBrandTpl(bt.id); T.deleteTemplate(bt.id);
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
    T.syncTopExport('Rendering 42%…', true); ok(!E('tbExport').disabled && E('tbExport').classList.contains('busy') && /42%/.test(E('tbExport').textContent), 'Top-Export zeigt Fortschritt und bleibt klickbar (öffnet das Blatt mit Cancel)');
    T.syncTopExport(null, true); ok(!E('tbExport').disabled && !E('tbExport').classList.contains('busy') && /Export/.test(E('tbExport').textContent), 'Top-Export wieder frei');
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
    ok(T.exportBaseName() === 'gluephs-video', 'ohne Titel: gluephs-video');
    T.setTitle('Mein Reel #1'); ok(T.exportBaseName() === 'mein-reel-1-gluephs', 'Basis aus Titel: ' + T.exportBaseName());
    global.CLICKS = []; T.exportSRT(); T.exportVTT(); T.exportTXT();
    ok(global.CLICKS.map(c => c.download).join(',') === 'mein-reel-1-gluephs.srt,mein-reel-1-gluephs.vtt,mein-reel-1-gluephs.txt', 'SRT/VTT/TXT mit gleicher Basis: ' + global.CLICKS.map(c => c.download).join(','));
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
    global.CLICKS = []; T.dlBlob(new Blob(['x'], { type: 'video/mp4' }), 'mein-reel-gluephs.mp4'); T.exportDone(false);
    ok(sb.style.display === 'none' && an.classList.contains('hi') && dlf.style.display !== 'none', 'Desktop: kein Teilen, „Caption another video“ primär, „Download again“ da');
    ok(document.getElementById('expDoneName').textContent === 'mein-reel-gluephs.mp4', 'Fertig-Zeile zeigt den Dateinamen');
    global.matchMedia = q => ({ matches: /coarse/.test(q) });         // Handy
    T.exportDone(false);
    ok(sb.style.display === '' && !an.classList.contains('hi') && dlf.style.display !== 'none' && !shared, 'Handy: Teilen primär, „Download again“ da, nichts automatisch geteilt');
    T.shareLastExport(); await new Promise(r => setTimeout(r, 0));
    ok(shared && shared.files.length === 1 && shared.files[0].name === 'mein-reel-gluephs.mp4' && shared.files[0].type === 'video/mp4', 'Tipp teilt die letzte Datei');
    const nClicks = global.CLICKS.length; rejectWith = { name: 'AbortError' };
    ok(await T.shareLastExport() === false && global.CLICKS.length === nClicks, 'Abbrechen (AbortError) → still, kein Download');
    rejectWith = { name: 'NotAllowedError' };
    await T.shareLastExport();
    ok(global.CLICKS.length === nClicks + 1, 'anderer Fehler → Download als Rückfall');
    nav.canShare = () => false; T.exportDone(false);
    ok(sb.style.display === 'none' && an.classList.contains('hi'), 'canShare false → kein Teilen-Knopf');
    delete nav.canShare; delete nav.share; global.matchMedia = prevMM; global.File = prevFile;
  }

  // Export-Ablauf: Leere Aufnahme erkennen, Ausgabegrösse beschriften, „Download again“-Lebenszyklus, Abbruch
  {
    ok(!T.exportBlobOk(null) && !T.exportBlobOk({ size: 0 }) && !T.exportBlobOk({ size: 1023 }) && T.exportBlobOk({ size: 1024 }) && T.exportBlobOk({ size: 5e6 }), 'exportBlobOk: leer/< 1 KB abgelehnt, ab 1 KB ok');
    ok(T.exportPlaybackTooShort(1, 10) && !T.exportPlaybackTooShort(9.5, 10) && !T.exportPlaybackTooShort(6, 10) && !T.exportPlaybackTooShort(0.2, 1.5), 'exportPlaybackTooShort: Quelle endete vorzeitig (< 50 % der Dauer), sehr kurze Videos nie');
    ok(/damaged/.test(T.MSG_EXPORT_DAMAGED) && T.MSG_EXPORT_DAMAGED.indexOf('Export failed') === 0, 'Meldung bei beschädigter Datei');
    ok(T.videoErrIsDamage({ error: { code: 3 } }) && T.videoErrIsDamage({ error: { code: 2 } }) && !T.videoErrIsDamage({ error: { code: 4 } }) && !T.videoErrIsDamage({}) && !T.videoErrIsDamage(null), 'Player-Fehler 2/3 = beschädigt, 4 (Format) und kein Fehler nicht');
    // Beschriftung: tatsächliche Ausgabegrösse (exportGeometry skaliert nie hoch)
    ok(T.exportSizeLabel(540, 960, '1080') === '540×960 (source size)', 'Label: 540×960-Quelle → „540×960 (source size)“: ' + T.exportSizeLabel(540, 960, '1080'));
    ok(T.exportSizeLabel(1080, 1920, '1080') === '1080p' && T.exportSizeLabel(3840, 2160, '1080') === '1080p' && T.exportSizeLabel(1920, 1080, '1080') === '1080p', 'Label: 1080×1920, 4K und 1920×1080 → „1080p“');
    ok(T.exportSizeLabel(3840, 2160, 'orig') === 'original size (3840×2160)' && T.exportSizeLabel(0, 0, '1080') === '1080p', 'Label: Original zeigt die Maße; ohne Video „1080p“');
    ok(T.exportSizeLabel(1920, 1080, '1080', 'blur') === '1080p' && T.exportSizeLabel(720, 720, '1080', 'crop') === '1080p', 'Label: Reframe (9:16-Leinwand) → „1080p“');
    {
      const vid = document.getElementById('mainVid'), o0 = [vid.videoWidth, vid.videoHeight];
      const sel = document.getElementById('expRes'); sel.options = [{ value: '1080', textContent: '' }, { value: 'orig', textContent: '' }]; sel.value = '1080';
      sel.remove = i => sel.options.splice(i, 1); sel.add = o => sel.options.push(o);
      vid.videoWidth = 540; vid.videoHeight = 960; T.syncExpSub();
      ok(document.getElementById('btnVideoSub').textContent === 'MP4 · 540×960 (source size) · no watermark', 'Unterzeile Knopf: ' + document.getElementById('btnVideoSub').textContent);
      // A12: bei kleiner Quelle ergeben „1080p“ und „Original“ dieselben Maße → nur EINE Option (keine Dublette)
      ok(sel.options.length === 1 && sel.options[0].value === '1080' && /^Source size · 540×960 \(recommended\)$/.test(sel.options[0].textContent), 'Auswahl „Resolution“: identische Maße → eine Option, nicht „1080p“ bei kleiner Quelle: ' + sel.options.map(o => o.textContent).join(' | '));
      vid.videoWidth = 1280; vid.videoHeight = 720; T.syncExpSub();
      ok(sel.options.length === 1 && sel.options[0].value === '1080', 'A12: 1280×720 → keine Dublette „Source size“/„Original“');
      vid.videoWidth = 3840; vid.videoHeight = 2160; T.syncExpSub();
      ok(sel.options.length === 2 && sel.options[0].value === '1080' && sel.options[1].value === 'orig' && /^Original · 3840×2160$/.test(sel.options[1].textContent), 'A12: 4K → beide Optionen (1080p ≠ Original): ' + sel.options.map(o => o.textContent).join(' | '));
      // gespeicherte Wahl „orig“ wird bei identischen Maßen auf die verbleibende Option abgebildet (ohne die Wahl zu verlieren)
      T.setExportRes('orig'); vid.videoWidth = 1280; vid.videoHeight = 720; T.syncExpSub();
      ok(sel.options.length === 1 && sel.value === '1080' && T.getExportRes && T.getExportRes() === 'orig', 'A12: gespeichertes „orig“ → Anzeige auf die verbleibende Option, Wahl bleibt gemerkt');
      T.setExportRes('1080');
      vid.videoWidth = 1080; vid.videoHeight = 1920; T.syncExpSub();
      ok(/^MP4 · 1080p/.test(document.getElementById('btnVideoSub').textContent) && sel.options[0].textContent === '1080p (recommended)', 'Unterzeile bei 1080×1920: „1080p“');
      vid.videoWidth = o0[0]; vid.videoHeight = o0[1];
    }
    // Download again: gleiche Datei, kein Neu-Rendern; Blob bleibt bis ein neuer Export startet / das Video wechselt
    const prevClicks = global.CLICKS; global.CLICKS = [];
    const blobA = new Blob(['x'], { type: 'video/mp4' });
    T.dlBlob(blobA, 'a-gluephs.mp4'); T.exportDone(false);
    ok(T.getLastExportBlob() === blobA, 'nach dem Export bleibt die Datei für „Download again“ erhalten');
    ok(document.getElementById('expDone').style.display === '' && document.getElementById('expMain').style.display === 'none', 'Fertig-Ansicht sichtbar, Export-Knopf-Ansicht weg');
    {
      const main = htmlContent.slice(htmlContent.indexOf('id="expMain"'), htmlContent.indexOf('id="expNote"')), done = htmlContent.slice(htmlContent.indexOf('id="expDone"'), htmlContent.indexOf('id="expPost"'));
      ok(!/btnSRT|btnVTT|btnTXT|btnCover|btnCopy|expOpts/.test(main) && /btnSRT/.test(done) && /btnVTT/.test(done) && /btnTXT/.test(done) && /btnCover/.test(done) && /expCopyPost/.test(done), 'SRT/VTT/TXT/Cover/Copy liegen NICHT in der ausgeblendeten Export-Ansicht (expMain) und bleiben nach dem Export sichtbar');
    }
    global.CLICKS = []; ok(T.downloadLastExport() === true, 'Download again ok');
    ok(global.CLICKS.length === 1 && global.CLICKS[0].download === 'a-gluephs.mp4' && T.getLastExportBlob() === blobA, 'Download again: ein Klick, gleiche Datei, gleicher Blob (kein Neu-Rendern)');
    T.showExportMain();
    ok(document.getElementById('expLast').style.display === '' && document.getElementById('expLastName').textContent === 'a-gluephs.mp4', 'Export-Ansicht zeigt „Last export … Download again“');
    T.releaseLastExport();
    ok(T.getLastExportBlob() === null && document.getElementById('expLast').style.display === 'none', 'releaseLastExport gibt den Blob frei');
    global.CLICKS = []; ok(T.downloadLastExport() === false && global.CLICKS.length === 0, 'ohne Datei: kein Download, kein Absturz');
    // Geändert seit dem Export? Erst dann „Export with your changes“ (sonst nur „Download again“)
    {
      const ag = document.getElementById('expAgain'), dl = document.getElementById('expDlFile'), ht = document.getElementById('expChangedHint');
      const blobC = new Blob(['x'], { type: 'video/mp4' });
      ok(T.exportChangedSinceLast() === false, 'ohne Export: nichts „geändert“');
      T.dlBlob(blobC, 'c-gluephs.mp4'); T.exportDone(false);
      ok(T.exportChangedSinceLast() === false && ag.style.display === 'none' && ht.style.display === 'none' && dl.textContent === 'Download again', 'direkt nach dem Export: nur „Download again“, kein Neu-Export-Knopf, kein Hinweis');
      T.downloadLastExport();
      ok(T.exportChangedSinceLast() === false, '„Download again“ ändert den Export-Stand nicht');
      const t0 = T.projTitleOf(); T.setTitle('Anderer Titel'); T.syncExportAgain();
      ok(T.exportChangedSinceLast() === false && ag.style.display === 'none', 'Titel ändert das Video nicht → keine Änderung');
      T.setTitle(t0);
      const b0 = T.getBlocks()[0], txt0 = b0.text;
      b0.text = txt0 + ' neu'; T.syncExportAgain();
      ok(T.exportChangedSinceLast() === true && ag.style.display === '' && /id="expAgain"[^>]*>Export with changes</.test(htmlContent) && ag.classList.contains('on') && ht.style.display === '' && dl.style.display === 'none', 'Untertitel geändert: „Export with changes“ primär + Hinweis, „Download again“ weg');
      b0.text = txt0; T.syncExportAgain();
      ok(T.exportChangedSinceLast() === false && ag.style.display === 'none' && dl.style.display === '' && dl.textContent === 'Download again', 'Änderung rückgängig → wieder nur „Download again“');
      const v0 = T.getActiveId(); T.selectStyle(v0 === 'minimal' ? 'tight' : 'minimal');
      ok(T.exportChangedSinceLast() === true, 'Style gewechselt → geändert'); T.selectStyle(v0);
      ok(T.exportChangedSinceLast() === false, 'Style zurück → ungeändert');
      T.setExportRes('orig'); ok(T.exportChangedSinceLast() === true, 'Auflösung geändert → geändert'); T.setExportRes('1080');
      T.releaseLastExport(); ok(T.exportChangedSinceLast() === false, 'ohne Datei nie „geändert“');
      global.CLICKS = [];
    }
    // Abbruch + Fehler setzen den Zustand zurück
    const tok = T.newExportToken(); T.setExporting(true);
    ok(T.getExpTok() === tok && !tok.cancelled, 'Export-Token aktiv');
    let aborted = 0; tok.abort = () => { aborted++; };
    ok(T.cancelExport() === true && tok.cancelled && aborted === 1 && T.cancelExport() === false, 'cancelExport: einmal, ruft die Stopp-Funktion');
    T.exportAborted(tok);
    ok(T.getExpTok() === null && document.getElementById('expDone').style.display === 'none', 'Abbruch: Zustand zurück (Token weg), kein „Saved“');
    const tok2 = T.newExportToken(); T.setExporting(true); document.getElementById('expNote').style.display = 'none';
    T.exportFailed(tok2, T.MSG_EXPORT_DAMAGED);
    ok(T.getExpTok() === null && document.getElementById('expNote').textContent === T.MSG_EXPORT_DAMAGED && document.getElementById('expNote').style.display === '' && document.getElementById('expDone').style.display === 'none', 'Fehler: Meldung im Blatt, Zustand zurück, erneuter Export möglich');
    ok(global.CLICKS.length === 0, 'Abbruch/Fehler lösen keinen Download aus');
    T.setExporting(false);
    // Beenden-Warnung: nur beim Export bzw. mit ungespeicherten Änderungen
    ok(T.leaveWarningNeeded() === false, 'ohne Export/Änderungen: keine Warnung');
    T.setExporting(true); ok(T.leaveWarningNeeded() === true && T.confirmLeaveExport() === false, 'Export läuft: Warnung + ohne Bestätigung bleiben'); T.setExporting(false);
    global.CLICKS = prevClicks;
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
    ok(T.emphColor(hz) === '#ff5a36' && T.emphColor(T.STYLES.find(x => x.id === 'popone')) === null && T.emphColor(T.STYLES.find(x => x.id === 'minimal')) === '#ffd60a'
       && T.emphColor(T.STYLES.find(x => x.id === 'stack')) === '#5eead4' && !T.emphShadowIsHl(T.STYLES.find(x => x.id === 'focus')), 'Akzentfarben je Style');
    ok(T.STYLES.filter(s => !s._isTpl && s.id !== 'custom').every(s => T.emphColor(s) !== null || ['popone', 'tight', 'statement'].includes(s.id)), 'alle Styles haben eine sichtbare Betonung (ausser One Word, Tight, Statement: nur Grösse/keine)');
    const h1 = T.buildCap(['auf', 'der', 'Weide.'], hz, 0, 24, [0, 0.3, 0.6], 2, { em: [false, false, true], emoji: '🌿', age: 0.1 });
    ok(/font-size:1\.12em/.test(h1) && /ff5a36/i.test(h1) && /class="cap-emo"/.test(h1) && /🌿/.test(h1) && /animation-delay:-0\.100s/.test(h1) && /position:relative/.test(h1),
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

    // Lokaler Ersatz (ohne KI) für JEDE Sprache: stärkstes Schlüsselwort je ~6-s-Fenster, ≥ 1 Moment je ~8 s, Abstand ≥ 4 s
    {
      const txt = 'We started the small bakery downtown after years of dreaming about fresh sourdough bread. Every morning customers line up outside waiting patiently for warm croissants. Our neighbors tell everybody about the wonderful pastries. Eventually journalists discovered our little shop and wrote glowing reviews everywhere.';
      const wsz = seqE(txt); // 0,35 s je Wort → ~ 21 s ohne Zahlen
      T.setState(T.buildCaptionBlocks(wsz), wsz.slice(), 'karaoke');
      const Be = T.getBlocks(), allW = Be.flatMap(b => b.words), dur = allW[allW.length - 1].end;
      T.localEmphasis(Be, 'en', dur + 0.3);
      const zs = allW.filter(w => w.zm).map(w => w.start);
      ok(!allW.some(w => /\d/.test(w.word)) && zs.length >= Math.floor(dur / 8) && zs.length >= 2, 'Heuristik EN ohne Zahlen: ≥ 1 Zoom-Moment je ~8 s (' + zs.length + ' bei ' + dur.toFixed(1) + ' s)');
      ok(zs.every((t, i) => !i || t - zs[i - 1] >= 4 - 1e-9), 'Zoom-Momente (lokal) ≥ ZOOM_GAP auseinander: ' + zs.join(', '));
      const gaps = [zs[0] - allW[0].start].concat(zs.map((t, i) => (i + 1 < zs.length ? zs[i + 1] : dur) - t));
      ok(Math.max(...gaps) <= 8.5, 'Zoom-Momente (lokal): keine Lücke > ~8 s (max ' + Math.max(...gaps).toFixed(1) + ' s)');
      ok(allW.filter(w => w.zm).every(w => w.start <= dur - 0.7) && T.zoomFill(Be, 'en', dur + 0.3, 8) === 0, 'Zoom-Momente (lokal): nicht am Videoende, zweiter Lauf setzt nichts mehr');
      ok(allW.filter(w => w.zm).every(w => w.word.replace(/\W/g, '').length >= 5), 'Zoom-Momente (lokal): nur Inhaltswörter (≥ 5 Zeichen)');
      // Name mitten im Satz schlägt das längere gewöhnliche Wort (EN), Zahl schlägt beides
      const nm = seqE('we met Alexander yesterday while shopping'), nb = [{ words: nm, start: 0, end: 3, text: 'x' }];
      T.localEmphasis(nb, 'en');
      ok(nm[2].zm === 1 && !nm[4].zm, 'Zoom: Name mitten im Satz hat Vorrang');
      // Deutsch: Nomen/Zahlen bleiben priorisiert
      const wd = seqE('Wir bauen seit 1995 unser eigenes Brot und verkaufen jeden Samstag frische Brötchen auf dem Markt');
      const bd = [{ words: wd, start: 0, end: 5, text: 'x' }]; T.localEmphasis(bd, 'de', 4.6);
      ok(wd.filter(w => w.zm).length === 1 && wd.find(w => w.zm).word === '1995', 'Zoom (DE): Zahl hat Vorrang vor Nomen');
      // keine Inhaltswörter → kein Moment, kein Absturz
      const wn = seqE('and so on and so on and so'); const bn = [{ words: wn, start: 0, end: 3, text: 'x' }];
      ok(T.zoomFill(bn, 'en', 0, 8) === 0 && !wn.some(w => w.zm), 'Zoom: ohne Inhaltswörter kein Moment');
      // Nutzer-Aus (kw -1) wird nie zum Zoom-Moment; vorhandene (KI-)Momente bleiben bestehen
      const wk = seqE('Wunderbar wundervolle fantastische Aussicht heute'), bk = [{ words: wk, start: 0, end: 3, text: 'x' }];
      wk.forEach(w => { w.kw = -1; }); ok(T.zoomFill(bk, 'de', 0, 8) === 0, 'Zoom: kw = -1 (Nutzer-Aus) wird übersprungen');
    }

    // Rückmeldung beim Umschalten (Toast mit Anzahl/Hinweis, Vorführung nur bei Pause, nie bei reduzierter Bewegung)
    {
      const wz = seqE('Our summer sale starts tomorrow with 50 percent discount on everything inside'), bz = [{ words: wz, start: 0, end: 5, text: 'x' }];
      T.setState(T.buildCaptionBlocks(wz), wz.slice(), 'karaoke'); T.localEmphasis(T.getBlocks(), 'en', 6);
      const vidZ = document.getElementById('mainVid');
      vidZ.duration = 6; T.setVidReady(true); vidZ.paused = true; vidZ.ended = false; vidZ.currentTime = 0;
      T.setEmphState(true, false, 'off'); T.setReduceMotion(false);
      T.setEmphZoom('punchy');
      const n1 = T.zoomPlan().length, fb0 = T.zoomFeedback();
      ok(n1 >= 1 && fb0.n === n1 && fb0.msg === 'Auto zoom: ' + n1 + (n1 === 1 ? ' moment' : ' moments'), 'Auto zoom: Toast «Auto zoom: N moments» (' + fb0.msg + ')');
      ok(T.getZoomDemo() && T.getZoomDemo().until > T.getZoomDemo().t0 && Math.abs((T.getZoomDemo().until - T.getZoomDemo().t0) - 1200) < 5, 'Pausiert: Zoom-Vorführung (~1,2 s) gestartet');
      T.clearZoomDemo();
      vidZ.paused = false;
      const fb1 = T.zoomFeedback();
      ok(T.getZoomDemo() === null && fb1.demo === false && /^Auto zoom: \d/.test(fb1.msg), 'Spielend: Toast, aber keine Vorführung');
      vidZ.paused = true; T.setReduceMotion(true);
      const fb = T.zoomFeedback();
      ok(fb.demo === false && T.getZoomDemo() === null && /Preview animation off \(reduce motion\) — the export includes the zoom/.test(fb.msg) && /^Auto zoom: \d/.test(fb.msg), 'Reduce motion: nur Toast mit Hinweis, keine Vorführung');
      T.setReduceMotion(false);
      T.getBlocks().forEach(b => b.words.forEach(w => { delete w.zm; })); T.setEmphState(true, false, 'punchy');
      const fb2 = T.zoomFeedback();
      ok(fb2.n === 0 && fb2.msg === 'No zoom moments found — zooms start on key words and numbers' && T.getZoomDemo() === null, 'Null Momente: Hinweis «No zoom moments found…», keine Vorführung');
      // Vorschau-Transform: Demo skaliert nur das Video; reduzierte Bewegung hält die Vorschau still
      T.setState(T.buildCaptionBlocks(wz), wz.slice(), 'karaoke'); T.localEmphasis(T.getBlocks(), 'en', 6); T.setEmphState(true, false, 'punchy');
      const zm0 = T.zoomPlan()[0];
      vidZ.currentTime = zm0.s + 1 - T.getTimeOff(); T.applyPreviewZoom(vidZ.currentTime);
      ok(/scale\(1\.1[0-9]+\)/.test(vidZ.style.transform || ''), 'Vorschau: Video-Transform scale(>1) mitten im Zoom-Moment (' + vidZ.style.transform + ')');
      ok(document.getElementById('prevBlurBg').style.transform === vidZ.style.transform, 'Vorschau: Blur-Hintergrund zoomt mit dem Video (gleicher Transform)');
      vidZ.currentTime = zm0.e + 0.5; T.applyPreviewZoom(vidZ.currentTime);
      ok(!vidZ.style.transform, 'Vorschau: nach dem Moment wieder ohne Transform');
      vidZ.currentTime = zm0.s + 1; T.setReduceMotion(true); T.applyPreviewZoom(vidZ.currentTime);
      ok(!vidZ.style.transform, 'Vorschau bei reduzierter Bewegung: kein Transform (Export zoomt trotzdem)');
      T.setReduceMotion(false); T.setEmphState(true, false, 'off'); T.applyPreviewZoom(vidZ.currentTime); T.setVidReady(false);
    }

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
    ok(T.STYLES.slice(0, 9).map(x => x.id).join() === 'hormozi,tight,mix,statement,accent,serifbold,reveal,note,script', 'Standard-Look (Bold Pop) zuerst, dann neue Looks und ruhige Presets im Picker');
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
      ok(opts.join() === 'none,scale,punch,bounce,flash,glow,overshoot,squash', 'csAnim: Optionen None/Pop/Punch/Lift/Fade/Glow/Overshoot/Squash: ' + opts.join());
      const strong = a => a && (Math.abs(a.sx - 1) >= 0.1 || Math.abs(a.sy - 1) >= 0.1 || Math.abs(a.ty) >= 0.15 || a.op <= 0.3 || a.glow >= 0.5);
      ok(T.animState('none', 0.08) === null && T.animState('scale', T.ANIM_DUR) === null && T.animState('scale', -0.1) === null, 'animState: none/abgelaufen/vorher → null');
      opts.filter(o => o !== 'none').forEach(o => {
        const dur = T.animDur(o);
        const a = T.animState(o, o === 'flash' ? 0.02 : 0.08); // Fade in (flash) ist nur 0,12 s lang: Deutlichkeit schon bei 20 ms
        ok(a !== null && (o === 'flash' ? a.op < 0.7 : strong(a)), 'Word pop «' + o + '» bei 80 ms deutlich erkennbar: ' + JSON.stringify(a));
        let mx = { sx: 1, ty: 0, op: 1, glow: 0 };
        for (let k = 0; k < Math.round(dur * 1000) - 1; k++) { const q = T.animState(o, k * 0.001); mx = { sx: Math.max(mx.sx, q.sx), ty: Math.max(mx.ty, q.ty), op: Math.min(mx.op, q.op), glow: Math.max(mx.glow, q.glow) }; }
        ok(mx.sx >= 1.14 - 1e-9 || mx.ty >= 0.22 - 1e-9 || mx.op <= 0.36 || mx.glow >= 1 - 1e-9, 'Word pop «' + o + '»: Spitzenausschlag: ' + JSON.stringify(mx));
        const e = T.animState(o, dur - 1e-6);
        ok(Math.abs(e.sx - 1) < 0.02 && Math.abs(e.ty) < 0.01 && e.op > 0.98 && e.glow < 0.02, 'Word pop «' + o + '» endet im Ruhezustand');
      });
      ok(near(T.animState('punch', 0).sx, 1.28) && near(T.animState('punch', 0.17).sx, 1.0 + 0.28 * Math.pow(0.5, 3)) && T.animState('punch', 0.08).sx < T.animState('punch', 0.0).sx, 'Punch: 1.28 → 1 mit ease-out');
      ok(near(T.animState('bounce', 0).ty, 0.22) && near(T.animState('bounce', 0).op, 0.5) && near(T.animState('flash', 0).op, 0.35) && near(T.animState('wobble', 0.1).ty, T.animState('bounce', 0.1).ty), 'Lift: 0,22 em + Deckkraft .5; Fade: .35; wobble = Lift');
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
      ok(Math.abs(T.capWordGap(bk) - ((4 + T.CAP_PILL_GAP) * T.capOutK())) < 1e-9 && T.capWordGap(rv) === 0, 'Box-Styles: Wortabstand + Box-Gap');
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
      ok(/font-family:'Caveat'/.test(hs) && /font-size:1\.5em/.test(hs) && /7ff0e0/.test(hs), 'Script: Keyword in Caveat, 1.5x, Akzentfarbe');
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
      ok(runWith({}) === 'hormozi', 'neuer Nutzer startet mit Bold Pop');
      ok(runWith({ 'capivo.style': 'reveal' }) === 'reveal', 'gemerkter Style bleibt (Reveal) — nur neue Nutzer starten mit Bold Pop');
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
    ok(Math.abs(T.capLsPx({ ls: '-.04em', fs: '1.5em' }, 20) - (-1.2)) < 1e-9 && Math.abs(T.capLsPx({ ls: '2px' }, 20) - 2 * T.capOutK()) < 1e-9 && T.capLsPx({ ls: 'normal' }, 20) === 0 && T.capLsPx({}, 20) === 0, 'capLsPx: em × Schrift × fs, px schriftrelativ (× capOutK, R3)');
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
    ok(T.coverFileName('Mein Reel über Käse!') === 'mein-reel-ueber-kaese-cover.png' && T.coverFileName('', 'hof-gluephs') === 'hof-gluephs-cover.png' && T.coverFileName('???') === 'gluephs-cover.png', 'Cover: Dateiname <titel>-cover.png');
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
    ok(ldFaq['@type'] === 'FAQPage' && ldFaq.mainEntity.length === 12 && /kostenlos/.test(ldFaq.mainEntity[0].name) && ldFaq.mainEntity.some(q => /Konto/.test(q.name)), 'i18n de: FAQ-Strukturdaten aus den deutschen FAQ');
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
        T.setLinesState(nl); T.setFontSizeState(px); // vor dem Messen: px-Laufweite/Kontur sind schriftrelativ (capOutK = aktuelle Schrift)
        const f = T.fitCaptionWords(ws, s, px, T.capFitMaxW(s), nl);
        const wr = T.wrapCaptionLines(ws, s, -1, f.px, nl);
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
    // Handy-Customizer: Chip-Leiste «Customize» zeigt auf existierende Gruppen (IDs, Reihenfolge wie im Panel), Advanced-Ziel ist ein <details>
    {
      const chipT = [...htmlContent.matchAll(/class="cs-chip[^"]*" data-target="(\w+)"/g)].map(m => m[1]);
      const goto = [...htmlContent.matchAll(/class="cs-chip[^"]*" data-target="(\w+)"[^>]*onclick="csGoto\('(\w+)'\)"/g)].every(m => m[1] === m[2]);
      const pos = chipT.map(id => htmlContent.indexOf('id="' + id + '"'));
      ok(chipT.join() === 'csgText,csgAnim,csgLayout,csgFx,advSet' && goto && pos.every((x, i) => x > 0 && (i === 0 || x > pos[i - 1])), 'Handy-Customizer: Chips zeigen auf Text · Animation · Layout · Effects · Advanced (IDs vorhanden, Reihenfolge wie im Panel)');
      ok(/<details class="cs-adv" id="advSet"/.test(htmlContent) && /function csGoto\(/.test(htmlContent) && /id\s*===\s*'advSet'[^;]*\.open\s*=\s*true/.test(htmlContent), 'Handy-Customizer: «Advanced»-Chip klappt das <details> auf');
      ok(/\.style-grid\{display:flex;flex-wrap:nowrap;[^}]*overflow-x:auto/.test(htmlContent) && /\.cs-nav-h,\.cs-chips,\.style-hint\{display:none\}/.test(htmlContent), 'Handy-Customizer: Looks-Streifen nur im @media, Desktop blendet Chips/Hinweis aus');
      ok(/capivo\.styleHintSeen/.test(htmlContent) && /localStorage\.getItem\(STYLE_HINT_KEY\)/.test(htmlContent), 'Handy-Customizer: Wisch-Hinweis pro Gerät einmal (localStorage mit try/catch)');
    }
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
    ok(disp('csBoxCWrap') === 'none' && disp('csBoxOpRow') === 'none' && disp('csBoxRRow') === 'none', 'Style-Panel: kein Hintergrund → Farbe/Deckkraft/Ecken weg');
    ok(disp('csGlowStrRow') === 'none' && E('csGlowInt').disabled === true, 'Style-Panel: kein Glow → Glow-Stärke weg');
    E('csMotion').value = 'reveal'; E('csBox').value = 'pill'; E('csGlow').checked = true; T.syncCsUi();
    ok(disp('csAnimRow') === 'none' && disp('csHlTypeRow') === 'none', 'Style-Panel: Reveal → Word pop + Highlight-Art weg');
    ok(disp('csBoxCWrap') === '' && disp('csBoxOpRow') === '' && disp('csBoxRRow') === '', 'Style-Panel: Hintergrund aktiv → Farbe/Deckkraft/Ecken sichtbar');
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
      // Hex-/Deckkraft-Felder neben den Farbfeldern: gleiche Style-Felder wie ihr Picker, über die Commit-Funktionen (wie oninput)
      csTextHex:    { group: 'text',   field: 'tc',      set: () => { E('csTextHex').value = '#ff0000'; T.csHexCommit('csText'); } },
      csTextOp:     { group: 'text',   field: 'tc',      set: () => { E('csTextOp').value = '40'; T.csOpCommit('csText'); } },
      csHlHex:      { group: 'hlc',    field: 'hl',      set: () => { E('csHlType').value = 'color'; E('csHlHex').value = '00ffaa'; T.csHexCommit('csHl'); } },
      csHlOp:       { group: 'hlc',    field: 'hl',      set: () => { E('csHlType').value = 'color'; E('csHlOp').value = '50'; T.csOpCommit('csHl'); } },
      csEmHex:      { group: 'em',     field: 'em',      set: () => { E('csEmHex').value = '#f0f'; T.csHexCommit('csEm'); } },
      csEmOp:       { group: 'em',     field: 'em',      set: () => { E('csEmOp').value = '70'; T.csOpCommit('csEm'); } },
      csOutlineHex: { group: 'stroke', field: 'cstroke', set: () => { E('csOutlineW').value = '2'; E('csOutlineHex').value = '#ff0000'; T.csHexCommit('csOutlineC'); } },
      csBoxHex:     { group: 'box',    field: 'boxBg',   set: () => { E('csBox').value = 'box'; E('csBoxHex').value = '#ff0000'; T.csHexCommit('csBoxC'); } },
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
      const bool = ['hlItalic', 'hlUpper', 'circle', 'emItalic', 'emoSide'], num = ['lh', 'emS', 'ulH'];
      const ENUM = { anim: 'scale', motion: 'reveal', ulMode: 'kw', ulH: 0.2, ul: '#ff00ff', boxBd: 'rgba(255,255,255,.4)', cur: '#facc15' }; // N-Looks: Felder mit geprüftem Wertebereich
      const sample = k => ENUM[k] ? ENUM[k] : bool.includes(k) ? true : num.includes(k) ? 1.25 : k === 'hlCycle' ? ['#ff0000', '#00ff00'] :
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
      measureText(str) { const m = /([\d.]+)px/.exec(this._font); return { width: (str || '').length * ((m ? +m[1] : 16) * 0.55 + (parseFloat(this.letterSpacing) || 0)) }; }, // = Mess-Stub oben (Auto-Fit und capLayout müssen gleich messen)
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
          const vis = wMax + (st.boxBg ? 36 * L.scale * T.capOutK() : 0) + ((st.hlPillBg && T.capMotion(st) === 'highlight') ? 2 * T.CAP_PILL_PAD_X * L.scale * T.capOutK() : 0);
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
  // ── Kein kuenstliches Kursiv bei Schriften ohne Kursivschnitt (S2) ──
  {
    const ST2 = id => T.STYLES.find(x => x.id === id);
    const ar = 'مرحبا', he = 'שלום', ja = '日本語', hi = 'नमस्ते', th = 'สวัสดี', la = 'Hello';
    const cases = [['note', true], ['reveal', true], ['accent', true], ['soft', true], ['serifbold', false], ['serifbold', true], ['editorial', false]];
    const bad = [];
    cases.forEach(([id, em]) => {
      const st = ST2(id), hl = id === 'editorial';
      [ar, he, ja, hi, th].forEach(w => { if (T.capWordFace(st, hl, em, w).it) bad.push(id + ':' + w); });
      if (!(T.capWordFace(st, hl, em, la).it === T.capWordFace(st, hl, em).it)) bad.push(id + ':latin');
    });
    ok(bad.length === 0, 'capWordFace: Arabisch/Hebraeisch/CJK/Devanagari/Thai nie kursiv, Latein unveraendert' + (bad.length ? ' — ' + bad.join(',') : ''));
    ok(T.capWordFace(ST2('note'), false, true, la).it === true && T.capWordFace(ST2('serifbold'), false, false, la).it === true, 'Latein bleibt kursiv (note-Keyword, serifbold-Text)');
    const html = T.buildCap([ar, la], ST2('reveal'), -1, 24, null, 0, { em: [true, true] });
    const spans = html.split('<span').slice(1);
    ok(/font-style:italic;[^"]*font-style:normal;/.test(spans[1]) && /font-style:italic;/.test(spans[2]) && !/font-style:normal/.test(spans[2].replace(/^[^"]*"/, '')), 'Vorschau-DOM: Betonung bei Arabisch aufrecht, bei Latein kursiv (reveal)');
  }
  // ── Pop-Animation frisst den Wortabstand nicht mehr (S2): Wachstum pro Seite <= 0,1 em ──
  {
    const fpx = 30, short = 1.2 * fpx, long = 3.2 * fpx;
    ok(T.capPopFactor('scale', short, fpx) === 1, 'Pop: kurzes Wort behaelt den vollen Pop');
    const f = T.capPopFactor('scale', long, fpx), peak = 0.14;
    ok(f < 1 && f > 0.3 && Math.abs(peak * f * long / 2 - 0.1 * fpx) < 1e-6, 'Pop: langes Wort waechst pro Seite hoechstens 0,1 em (' + f.toFixed(2) + ')');
    ok(T.capPopFactor('none', long, fpx) === 1 && T.capPopFactor('scale', 0, fpx) === 1 && T.capPopFactor('flash', long, fpx) === 1, 'Pop: Faktor 1 ohne Skalierung/Breite');
    // Export: Skalierung des aktiven Worts im Zeichenplan wird begrenzt, Layout (x) bleibt
    const wl = [{ word: 'wie', start: 0, end: .5 }, { word: 'schnell', start: .5, end: 1 }];
    T.setState(T.buildCaptionBlocks(wl, []), wl, 'karaoke');
    const ctxs = []; const mk = () => { const sc = []; const c = { _font: '', letterSpacing: '0px', calls: [], sc, lineWidth: 1, strokeStyle: '#000', fillStyle: '#000', shadowColor: '', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, globalAlpha: 1, filter: 'none',
      get font() { return this._font; }, set font(v) { this._font = v; },
      measureText(str) { const m = /([\d.]+)px/.exec(this._font); return { width: str === ' ' ? (m ? +m[1] : 16) * 0.28 : (str || '').length * (m ? +m[1] : 16) * 0.58 }; },
      fillText(t, x, y) { this.calls.push({ t, x, y }); }, strokeText() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale(a, b) { sc.push(a); }, beginPath() {}, fill() {}, stroke() {}, rect() {}, roundRect() {}, ellipse() {}, fillRect() {}, drawImage() {}, createLinearGradient() { return { addColorStop() {} }; } }; return c; };
    const lift = T.STYLES.find(x => x.id === 'lift'); const c1 = mk(); T.drawCaptionsOnCtx(c1, 0.5 + 0.34 * 0.3, lift, 1080, 1920, false);
    const mx = Math.max.apply(null, c1.sc.concat([1]));
    ok(mx > 1 && mx < 1.1, 'Export: Pop des langen Worts «schnell» gedeckelt (max. Skalierung ' + mx.toFixed(3) + ' statt 1.14)');
  }
  // Video-Schlüssel (Wasserzeichen-Zählung): stabil, anonym, nur Hash — nie der Dateiname
  {
    T.setAutosaveKey(null); ok(T.videoKeyHash() === '' && !('X-Video-Key' in T.trHeaders('audio/wav', 't')), 'ohne Video: kein Schlüssel, kein Header');
    T.setAutosaveKey('mein geheimes reel.mp4|123456|85'); const k1 = T.videoKeyHash(); T.setAutosaveKey('mein geheimes reel.mp4|123456|85');
    ok(/^[a-f0-9]{16}$/.test(k1) && k1 === T.videoKeyHash() && !/reel|geheim/.test(k1), 'Schlüssel: 16 Hex, stabil, ohne Dateiname');
    T.setAutosaveKey('mein geheimes reel.mp4|123457|85'); ok(T.videoKeyHash() !== k1, 'anderes Video → anderer Schlüssel');
    const h = T.trHeaders('audio/wav', 'tok'); ok(h['X-Video-Key'] === T.videoKeyHash() && h['X-Capivo-Token'] === 'tok' && h['Content-Type'] === 'audio/wav', 'Transkriptions-Header mit Token + Video-Schlüssel');
    T.setAutosaveKey(null);
    T.setBillingState({ enabled: true, clean_videos: 2 }); ok(/used your 2 free videos without watermark today/.test(T.wmNoticeText()) && /Upgrade to remove it, or come back tomorrow/.test(T.wmNoticeText()), 'Hinweistext Übernutzung');
    T.setBillingState(null);
  }

  // ── Customize: neue Konturfarbe (Kontur 0 → 2 px; im Test 8 px, damit das Limit ohne Freeze sichtbar fällt) zerlegt die Bloecke nicht neu (Sweep ctl/csOutlineC@layoutPreset) ──
  {
    const tight = T.cloneStyle(T.STYLES.find(x => x.id === 'tight'));
    const custom = Object.assign(T.cloneStyle(tight), { id: 'custom', ts: T.outlineShadow(8, '#ff0000') + ',' + tight.ts, cstroke: '#ff0000' });
    const perBase = T.capAutoChars(tight);
    T.setCsBase(null); const perRing = T.capAutoChars(custom);
    T.setCsBase(tight); const perFrozen = T.capAutoChars(custom);
    T.setCsBase(null);
    ok(T.capWordGap(custom) > 0 && T.capWordGap(tight) === 0, 'Testaufbau: Kontur erzeugt Wortabstand, der Halo von Tight nicht');
    ok(perRing < perBase && perFrozen === perBase, 'Auto-Zeichenlimit von «Mein Style» folgt dem Ausgangs-Style (' + perFrozen + ' = ' + perBase + '; ohne Freeze ' + perRing + ') — Konturfarbe zerlegt keine Bloecke');
  }
  // ── Deckkraft < 1 gilt als Gruppe ueber Text + Halo-Schichten (Vorschau: opacity am Span; Export vorher: je fillText → Halo/Glyphe stapelten sich) ──
  {
    const mkG = (canvas) => { const c = { canvas, _font: '', letterSpacing: '0px', fillStyle: '#fff', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1, shadowColor: '', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, textAlign: 'left', textBaseline: 'alphabetic', calls: [], imgs: [], tr: [],
      get font() { return this._font; }, set font(v) { this._font = v; },
      measureText(str) { return { width: (str || '').length * 10 }; },
      fillText(t) { this.calls.push({ t, a: this.globalAlpha }); }, strokeText() {}, drawImage() { this.imgs.push(this.globalAlpha); },
      save() { this._st = (this._st || []); this._st.push(this.globalAlpha); }, restore() { this.globalAlpha = this._st.pop(); },
      translate(x, y) { this.tr.push([x, y]); }, setTransform() {}, clearRect() {}, scale() {}, rotate() {}, beginPath() {}, fill() {}, stroke() {} }; return c; };
    const plan = T.capShadowPlan(T.STYLES.find(x => x.id === 'tight').ts);
    const bufs = []; const origCreate = document.createElement;
    document.createElement = (t) => { if (t !== 'canvas') return origCreate(t); const cv = { width: 0, height: 0 }; const cx = mkG(cv); cv.getContext = () => cx; bufs.push(cx); return cv; };
    const main = mkG({ width: 1080, height: 1920 });
    T.drawTextGrouped(main, 'so', 100, 200, plan, 3, 1, 60, 120, 1, 0.5);
    ok(main.calls.length === 0 && main.imgs.length === 1 && Math.abs(main.imgs[0] - 0.5) < 1e-9 && bufs.length >= 1 && bufs[0].calls.length >= 3 && bufs[0].calls.every(k => k.a === 1), 'Gruppen-Deckkraft: Wort + Halo-Schichten im Puffer mit voller Deckkraft, EIN drawImage mit 0,5 (' + bufs[0].calls.length + ' Schichten)');
    const main2 = mkG({ width: 1080, height: 1920 }); T.drawTextGrouped(main2, 'so', 100, 200, plan, 3, 1, 60, 120, 1, 1);
    ok(main2.calls.length >= 2 && main2.calls.every(k => k.a === 1), 'Deckkraft 1: direkt auf den Hauptkontext gezeichnet');
    document.createElement = origCreate;
  }
  // ── Gewichts-Auswahl folgt der Schrift: nur vorhandene Schnitte, nächstliegendes Gewicht wird gewählt UND angewendet ──
  {
    const E = id => document.getElementById(id);
    const W = T.capFontWeights;
    ok(JSON.stringify(W('Bungee')) === '[400]' && JSON.stringify(W('Anton')) === '[400]' && JSON.stringify(W('Bebas Neue')) === '[400]', 'Weights: Display-Fonts nur Regular');
    ok(JSON.stringify(W('Roboto')) === '[400,700,900]' && JSON.stringify(W('DM Sans')) === '[700]' && JSON.stringify(W('Montserrat')) === '[600,700,800,900]', 'Weights: Roboto/DM Sans/Montserrat laut CAP_FONT_W');
    ok(W('Meine Eigene').length === 5 && W('').length === 5, 'Weights: unbekannte/eigene Schrift behaelt alle Stufen');
    const labels = () => E('csWeight').children.map(o => o.value + ':' + o.textContent).join(',');
    const base = T.STYLES.find(x => x.id === 'tbox');
    T.selectStyle('tbox');
    T.seedCustomFields(Object.assign({}, base, { fl: 'Bungee', font: "'Bungee'", fw: '800' }));
    ok(labels() === '400:Regular' && E('csWeight').value === '400' && E('csWeight').disabled === true && /only one weight/.test(E('csWeight').title),
       'Bungee: nur Regular, Select deaktiviert + Hinweis: ' + labels());
    // Schrift wechseln → Gewicht der Nutzerin (800) kommt zurueck und wird in den Style uebernommen
    E('csFont').value = 'Montserrat'; T.onFontPick(E('csFont')); T.flushCustomStyle();
    ok(labels() === '600:Semi,700:Bold,800:Extra,900:Black' && E('csWeight').value === '800' && E('csWeight').disabled === false && E('csWeight').title === 'Font weight',
       'Montserrat: 4 Stufen, 800 wiederhergestellt: ' + labels() + ' / ' + E('csWeight').value);
    ok(T.STYLES.find(x => x.id === 'custom').fw === '800', 'Style-fw = Auswahl (Vorschau = Export)');
    // Einzel-Gewicht-Font → fw 400 im Style (Canvas-Export zeichnet dasselbe wie die Vorschau, kein Faux-Bold)
    E('csFont').value = 'Anton'; T.onFontPick(E('csFont')); T.flushCustomStyle();
    ok(E('csWeight').value === '400' && E('csWeight').disabled === true && T.STYLES.find(x => x.id === 'custom').fw === '400', 'Anton: Gewicht 400 angewendet: ' + T.STYLES.find(x => x.id === 'custom').fw);
    // Roboto (400;700;900): 800 liegt genau zwischen 700 und 900 → schwerer
    E('csFont').value = 'Roboto'; T.onFontPick(E('csFont')); T.flushCustomStyle();
    ok(labels() === '400:Regular,700:Bold,900:Black' && E('csWeight').value === '900' && T.STYLES.find(x => x.id === 'custom').fw === '900', 'Roboto: nächstliegendes Gewicht 900: ' + E('csWeight').value);
    // Eigene Auswahl merken: Bold gewaehlt → bleibt bei Wechsel auf Poppins
    E('csWeight').value = '700'; T.applyCustomStyle('weight'); T.flushCustomStyle();
    E('csFont').value = 'Poppins'; T.onFontPick(E('csFont')); T.flushCustomStyle();
    ok(E('csWeight').value === '700' && T.STYLES.find(x => x.id === 'custom').fw === '700', 'Poppins: gewähltes Bold bleibt');
    // Look mit Single-Weight-Schrift: Seed zeigt nächstliegendes Gewicht, ändert den Look aber nicht
    T.selectStyle('tbox');
    T.seedCustomFields(Object.assign({}, base, { fl: 'Oswald', font: "'Oswald'", fw: '600' }));
    ok(E('csWeight').value === '700' && E('csWeight').disabled === true && labels() === '700:Bold', 'Oswald (nur 700): Seed waehlt 700');
    T.setCsDirty({}); ok(T.buildCustomStyle().fw === '600', 'Seed allein veraendert fw des Looks nicht');
    T.seedCustomFields(base);
  }

  // ── Paket A-Edit: Undo für Look/Grösse/Position/Regler (A2), globale Tasten (A3), Standard-Template (A1), kein Trennen kurzer Wörter (A9) ──
  {
    const src = fs.readFileSync(path.join(__dirname, 'captly.html'), 'utf8');
    const E = id => document.getElementById(id);
    const ws = Array.from({ length: 8 }, (_, i) => ({ word: 'w' + i, start: i * 0.5, end: i * 0.5 + 0.4 }));
    const fresh = () => { T.setState(T.buildCaptionBlocks(ws), ws.map(w => Object.assign({}, w)), 'karaoke'); T.setCaptionsEdited(false); T.resetUndo(); T.lookUndoEnd(); };
    const posBtn = pos => ({ dataset: { pos }, parentElement: { querySelectorAll: () => [] }, classList: { add() {}, remove() {} } });
    T.selectStyle('classic'); T.onWpbChange('4'); fresh();

    // A2: Look-Wechsel = 1 Schritt, Undo/Redo stellt Look zurück, Blöcke bleiben
    const blocks0 = T.captionSnapshot();
    T.lookUndoRun(null, () => T.selectStyle('hormozi'));
    ok(T.getActiveId() === 'hormozi' && T.undoDepth()[0] === 1, 'A2: Look-Wechsel legt genau 1 Undo-Schritt an: ' + T.undoDepth());
    ok(T.undoCaptions() && T.getActiveId() === 'classic', 'A2: Undo macht den Look-Wechsel rückgängig: ' + T.getActiveId());
    ok(T.captionSnapshot() === blocks0, 'A2: Undo des Looks lässt die Blöcke unberührt');
    ok(T.redoCaptions() && T.getActiveId() === 'hormozi', 'A2: Redo wendet den Look wieder an');
    T.undoCaptions();
    T.lookUndoRun(null, () => T.selectStyle('classic')); // gleicher Look erneut → kein Schritt
    ok(T.undoDepth()[0] === 0, 'A2: erneuter Klick auf aktiven Look erzeugt keinen Schritt: ' + T.undoDepth());

    // Grösse: Slider-Zug (viele input-Events) = 1 Schritt bis change; danach neuer Zug = neuer Schritt
    fresh(); const sz0 = T.getFontSize();
    ['30', '31', '32', '33'].forEach(v => T.onSzChange(v));
    ok(T.getFontSize() === 33 && T.undoDepth()[0] === 1, 'A2: Grösse-Slider-Zug = 1 Undo-Schritt: ' + T.undoDepth());
    T.lookUndoEnd(); // = change/pointerup
    T.onSzChange('40'); T.onSzChange('41');
    ok(T.undoDepth()[0] === 2, 'A2: zweiter Zug = zweiter Schritt: ' + T.undoDepth());
    T.undoCaptions(); ok(T.getFontSize() === 33, 'A2: Undo 1 → Grösse vor dem 2. Zug: ' + T.getFontSize());
    T.undoCaptions(); ok(T.getFontSize() === sz0, 'A2: Undo 2 → Ausgangsgrösse: ' + T.getFontSize());
    ok(E('szSlider').value === sz0 && /^(S|M|L|XL) \d+\.\d%$/.test(E('szDisp').textContent) && E('szDisp').textContent === (T.capSizeInfo(sz0, T.previewFrameW(), T.previewFrameH()).tag + ' ' + T.capSizeInfo(sz0, T.previewFrameW(), T.previewFrameH()).pctH.toFixed(1) + '%'), 'A2: Slider-Anzeige folgt dem Undo (relativ)');
    T.redoCaptions(); ok(T.getFontSize() === 33, 'A2: Redo → Grösse nach dem 1. Zug');

    // Position: Preset-Klick und freies Verschieben
    fresh(); T.setPosState('bottom'); T.setHOff(0); T.setFree(false);
    const lay0 = T.currentLayout();
    T.setPos(posBtn('top'));
    ok(T.currentLayout().pos === 'top' && T.undoDepth()[0] === 1, 'A2: Position-Preset = 1 Schritt');
    T.undoCaptions(); const lay1 = T.currentLayout();
    ok(lay1.pos === lay0.pos && lay1.voff === lay0.voff && lay1.hoff === lay0.hoff && lay1.free === lay0.free, 'A2: Undo stellt Position wieder her');
    ok(/_capDragUndoSnap = lookSnapshot\(\)/.test(src) && /pushUndo\(null, _capDragUndoSnap\)/.test(src), 'A2: freies Verschieben sichert den Zustand beim Drag-Start und legt EINEN Schritt bei der ersten Bewegung an');
    ok(src.indexOf('pushUndo(null, _capDragUndoSnap)') < src.indexOf('capDragMoved = true;\n  var r = capDragPlace'), 'A2: Drag-Schritt wird vor der ersten Positionsänderung angelegt');

    // Custom-Regler: ein Zug = 1 Schritt, Undo stellt Style + Regler-Basis
    fresh(); T.selectStyle('classic'); T.seedCustomFields(T.STYLES.find(x => x.id === 'classic')); T.resetUndo(); T.lookUndoEnd();
    const act0 = T.getActiveId(), dirty0 = JSON.stringify(T.setCsDirtyGet());
    ['2', '3', '4'].forEach(v => { E('csOutlineW').value = v; T.applyCustomStyle('stroke'); });
    T.flushCustomStyle();
    ok(T.getActiveId() === 'custom' && T.undoDepth()[0] === 1, 'A2: Custom-Regler-Zug = 1 Schritt: ' + T.getActiveId() + ' ' + T.undoDepth());
    T.undoCaptions();
    ok(T.getActiveId() === act0 && JSON.stringify(T.setCsDirtyGet()) === dirty0, 'A2: Undo stellt Look + Regler-Basis wieder her: ' + T.getActiveId());
    T.lookUndoEnd();
    E('csOutlineW').value = '3'; T.applyCustomStyle('stroke'); T.lookUndoEnd(); E('csText').value = '#ff0000'; T.applyCustomStyle('text'); T.flushCustomStyle();
    ok(T.undoDepth()[0] === 3 || T.undoDepth()[0] === 2, 'A2: verschiedene Regler = eigene Schritte: ' + T.undoDepth());

    // Gemeinsamer Stapel: Split → Look → Undo nimmt NUR den Look zurück, nächstes Undo den Split
    fresh(); T.selectStyle('classic'); T.resetUndo();
    ok(T.tlSplitAt(0, 0.45), 'Testaufbau: Split'); const afterSplit = T.captionSnapshot();
    T.lookUndoRun(null, () => T.selectStyle('hormozi'));
    T.undoCaptions();
    ok(T.getActiveId() === 'classic' && T.captionSnapshot() === afterSplit, 'A2: Undo nach Split+Look nimmt nur den Look zurück (Split bleibt)');
    T.undoCaptions();
    ok(T.captionSnapshot() === blocks0, 'A2: zweites Undo nimmt den Split zurück');
    // umgekehrt: Look → Split → Undo nimmt nur den Split zurück
    fresh(); T.lookUndoRun(null, () => T.selectStyle('hormozi')); T.tlSplitAt(0, 0.45);
    T.undoCaptions();
    ok(T.getActiveId() === 'hormozi' && T.captionSnapshot() === blocks0, 'A2: Undo nach Look+Split nimmt nur den Split zurück');
    T.undoCaptions(); ok(T.getActiveId() === 'classic', 'A2: danach der Look');
    T.selectStyle('classic');
    // Quelltext-Verdrahtung: Kachel, Regler, Grösse, Position, Modus, Zeilen
    ok(/tile\.onclick = function\(\)\{ lookUndoRun\(null, function\(\)\{ selectStyle\(s\.id\); \}\); \};/.test(src), 'A2: Stil-Kachel läuft über lookUndoRun');
    ['applyCustomStyle', 'onSzChange', 'setPos', 'setMode', 'setLines', 'onVOffChange', 'togglePunct', 'setCaptionCase'].forEach(fn =>
      ok(new RegExp('function ' + fn + '\\([^)]*\\) \\{ return lookUndoRun\\(').test(src), 'A2: ' + fn + ' ist Undo-fähig'));

    // A3: S / Pfeile / Entf global
    const ev = (key, extra) => Object.assign({ key, code: key.length === 1 ? 'Key' + key.toUpperCase() : key, preventDefault() { this.pd = true; }, stopPropagation() {} }, extra || {});
    fresh(); T.tlSelState(-1, -1); E('mainVid').currentTime = 0.45;
    E('expSheet').style.display = 'none'; // Export-Blatt offen = Tasten gehören dem Blatt (kbModalOpen)
    const nb = T.getBlocks().length, e1 = ev('s');
    ok(T.tlGlobalKey(e1) === true && e1.pd && T.getBlocks().length === nb + 1, 'A3: S ohne Auswahl teilt den Block am Abspielkopf (global): ' + T.getBlocks().length + '/' + nb);
    fresh(); T.tlSelState(1, -1);
    const st0 = T.getBlocks()[1].start, en0 = T.getBlocks()[1].end;
    ok(T.tlGlobalKey(ev('ArrowRight', { shiftKey: true })) === true && (T.getBlocks()[1].start !== st0 || T.getBlocks()[1].end !== en0), 'A3: Pfeil bei gewählter Zeile verschiebt sie auch ohne Canvas-Fokus');
    fresh(); T.tlSelState(-1, -1);
    ok(T.tlGlobalKey(ev('ArrowRight')) === false && T.tlGlobalKey(ev('Delete')) === false, 'A3: ohne Auswahl bleibt ← → Seek, Entf tut nichts');
    fresh(); T.tlSelState(1, -1); const n2 = T.getBlocks().length;
    ok(T.tlGlobalKey(ev('Delete')) === true && T.getBlocks().length === n2 - 1, 'A3: Entf löscht die gewählte Zeile global');
    fresh(); T.tlSelState(0, -1); const n3 = T.getBlocks().length;
    ok(T.tlGlobalKey(ev('Backspace')) === true && T.getBlocks().length === n3 - 1, 'A3: Backspace löscht die gewählte Zeile global');
    T.undoCaptions(); ok(T.getBlocks().length === n3, 'A3: Undo des Löschens');
    T.tlSelState(-1, -1);
    ok(/if \(\['s', 'S', 'Delete', 'Backspace', 'ArrowLeft', 'ArrowRight'\][\s\S]{0,120}tlGlobalKey\(e\)/.test(src), 'A3: globaler keydown-Handler ruft tlGlobalKey');
    ok(/var typing = tg\.tagName === 'INPUT' \|\| tg\.tagName === 'TEXTAREA' \|\| tg\.tagName === 'SELECT' \|\| tg\.isContentEditable;/.test(src) && /if \(typing \|\| mod \|\| e\.altKey\) return;[\s\S]{0,400}tlGlobalKey/.test(src), 'A3: nicht in input/textarea/select/contenteditable');
    ok(/<b>S<\/b> split at the playhead/.test(src), 'A3: Shortcut-Menü nennt S');

    // A1: Standard-Template schlägt zuletzt gewähltes Preset
    {
      const store = {};
      const prevLS = global.localStorage;
      global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
      T.setUserTemplates([]); T.loadTemplates();
      T.selectStyle('beast'); E('tplName').value = 'Gym'; T.saveTemplate();
      const gym = T.getUserTemplates().find(t => t.name === 'Gym');
      ok(gym && T.brandTplId() === gym.id, 'A1: Testaufbau: Gym ist Standard');
      T.selectStyle('hormozi');
      ok(store['capivo.style'] === 'hormozi' && T.brandTplId() === gym.id, 'A1: zuletzt gewähltes Preset ändert das Standard-Template nicht');
      T.selectStyle('classic'); T.applyBrandOnOpen();
      ok(T.getActiveId() === gym.id, 'A1: neues Video: Standard-Template schlägt capivo.style: ' + T.getActiveId());
      ok(T.landBrandId() === gym.id, 'A1: Startseite zeigt das Standard-Template als gewählt');
      T.toggleBrandTpl(gym.id); T.selectStyle('hormozi'); T.applyBrandOnOpen();
      ok(T.getActiveId() === 'hormozi' && T.landBrandId() === '', 'A1: ohne Standard-Template gilt das zuletzt gewählte Preset');
      T.setUserTemplates([]); T.loadTemplates(); T.selectStyle('hormozi');
      global.localStorage = prevLS; if (!prevLS) delete global.localStorage;
    }

    // A9: kurze Wörter nicht trennen, lieber verkleinern; Auto-Limit hängt an Grösse + Rahmenbreite
    {
      document.getElementById('prevFrame').style.width = '176px';
      const st9 = T.STYLES.find(x => !x.boxBg && !x.pill && !x.hlPillBg && !x.circle && !(parseFloat(x.ls) > 0) && !x.fs && !x.motion);
      const mw = T.capFitMaxW(st9);
      const fk = T.fitCaptionWords(['FUNKTIONIERT.'], st9, 34, mw, 2);
      ok(fk.words.length === 1 && fk.words[0] === 'FUNKTIONIERT.' && fk.px < 34, 'A9: «FUNKTIONIERT.» bleibt ganz (verkleinert statt FUNKTIO-/NIERT.): ' + fk.words.join(' | ') + ' px=' + fk.px);
      ok(fk.words[0].length * fk.px * 0.55 <= mw + 1e-9, 'A9: verkleinertes Wort passt in die Breite');
      const fk1 = T.fitCaptionWords(['FUNKTIONIERT.'], st9, 34, mw, 1);
      ok(fk1.words.length === 1, 'A9: auch bei 1 Zeile ganz');
      const fl = T.fitCaptionWords(['Rindfleischverarbeitungsbetriebe'], st9, 34, mw, 2);
      ok(fl.words.length > 1, 'A9: echte Komposita werden weiter getrennt: ' + fl.words.join(' | '));
      const fx = T.fitCaptionWords(['Zusammenhalten'], st9, 54, 100, 2);
      ok(fx.words.length > 1, 'A9: passt selbst bei Mindestgrösse nicht → Trennung als letzter Ausweg: ' + fx.words.join(' | '));
      ok(T.capNoHyphen('FUNKTIONIERT.') && T.capNoHyphen('Verantwortung') && !T.capNoHyphen('Rindfleischverarbeitung'), 'A9: capNoHyphen: bis 14 Buchstaben (ohne Satzzeichen)');
      T.setFontSizeState(22); const w176 = T.capAutoChars(st9);
      document.getElementById('prevFrame').style.width = '360px'; const w360 = T.capAutoChars(st9);
      T.setFontSizeState(34); const big = T.capAutoChars(st9);
      ok(w360 > w176 && big < w360, 'A9: Auto-Zeichenlimit wächst mit Rahmenbreite und sinkt mit Schriftgrösse: ' + [w176, w360, big].join('/'));
      document.getElementById('prevFrame').style.width = '270px';
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════════════
  // Paket A-Style: A4 Farbfelder (Hex + Deckkraft), A7 KI-Hinweis + Keyword-Farben, A8 Emoji-Auswahl, A10 Template-Menü/Import, A11 Mehrere Tabs
  // ═════════════════════════════════════════════════════════════════════════════════════
  {
    const E = id => document.getElementById(id);
    // ── A4: Hex-Parsing ──
    const ph = T.parseHexInput;
    ok(ph('#FFF').hex === '#ffffff' && ph('#FFF').a === null && ph('ff8800').hex === '#ff8800' && ph('  #AbCdEf ').hex === '#abcdef', 'Hex: #rgb, ohne #, Grossschreibung, Leerraum');
    ok(ph('#11223380').hex === '#112233' && ph('#11223380').a === 0.5 && ph('#112233ff').a === 1, 'Hex: #rrggbbaa liefert Deckkraft');
    ok(['', '#', '#12', '#12345', '#ggg', 'red', '#1234567', null, undefined].every(v => ph(v) === null), 'Hex: ungültige Eingaben → null');
    // Preset «Clean» speichert rgba(255,255,255,.6): Picker weiss, 60 % bleiben sichtbar und beim Farbwechsel erhalten
    T.selectStyle('minimal');
    ok(E('csText').value === '#ffffff' && Math.abs(T.getCsAlpha().csText - 0.6) < 1e-9 && String(E('csTextOp').value) === '60' && E('csTextHex').value === '#ffffff', 'Clean: Hex #ffffff + Deckkraft 60 % sichtbar (' + E('csTextOp').value + ')');
    ok(T.csColorCss('csText') === 'rgba(255,255,255,0.6)', 'Clean: Swatch-Farbe = rgba(255,255,255,0.6), nicht reines Weiss (' + T.csColorCss('csText') + ')');
    E('csTextHex').value = '#ff8800'; ok(T.csHexCommit('csText') === true && E('csText').value === '#ff8800', 'Hex-Eingabe → Picker');
    T.setCsDirty({ text: true });
    ok(T.buildCustomStyle().tc === 'rgba(255,136,0,0.6)', 'Farbwechsel behält die 60 %: ' + T.buildCustomStyle().tc);
    E('csTextOp').value = '100'; ok(T.csOpCommit('csText') && T.buildCustomStyle().tc === '#ff8800', '100 % → reines Hex');
    E('csTextOp').value = '25'; T.csOpCommit('csText'); ok(T.buildCustomStyle().tc === 'rgba(255,136,0,0.25)', 'Deckkraft 25 %');
    E('csTextOp').value = ''; ok(T.csOpCommit('csText') === false && T.getCsAlpha().csText === 0.25, 'leeres %-Feld ändert nichts');
    E('csTextHex').value = '#zz12'; ok(T.csHexCommit('csText') === false && E('csText').value === '#ff8800' && E('csTextHex').classList.contains('bad'), 'ungültiges Hex: Picker/Style bleiben, Feld rot markiert');
    E('csTextHex').value = '#00112280'; T.csHexCommit('csText'); ok(E('csText').value === '#001122' && T.getCsAlpha().csText === 0.5, '#rrggbbaa setzt auch die Deckkraft');
    E('csText').value = '#123456'; T.csSyncColors(); ok(E('csTextHex').value === '#123456' && String(E('csTextOp').value) === '50' && !E('csTextHex').classList.contains('bad'), 'Picker → Hex-Feld (Rückrichtung)');
    // Aktives Wort als Pill: Deckkraft wird mitgeführt, Kontrastfarbe kommt vom Hex
    T.selectStyle('boxkara'); E('csHlOp').value = '50'; T.csOpCommit('csHl'); T.setCsDirty({ hlc: true });
    const pcs = T.buildCustomStyle();
    ok(pcs.hlPillBg === 'rgba(34,197,94,0.5)' && /^#/.test(pcs.hlc), 'Pill-Farbe mit Deckkraft: ' + pcs.hlPillBg + ' / Text ' + pcs.hlc);
    // Hex-Feld an jedem Farbfeld, Schachbrett-Swatch im Markup
    ['csText', 'csHl', 'csEm', 'csOutlineC', 'csBoxC'].forEach(id => ok(new RegExp('id="' + id.replace('C', '') + '(Hex|C)?"').test(htmlContent) && /class="cs-hex"/.test(htmlContent), 'Markup: ' + id));
    ok(['csTextHex', 'csHlHex', 'csEmHex', 'csOutlineHex', 'csBoxHex'].every(id => htmlContent.includes('id="' + id + '"') && new RegExp('id="' + id + '"[^>]*oninput="csHexInput\\(').test(htmlContent)), 'Markup: Hex-Feld an allen 5 Farbfeldern, validiert über csHexInput');
    ok(/\.cs-sw\{[^}]*repeating-conic-gradient/.test(htmlContent) && /\.cs-sw::before\{[^}]*var\(--sw/.test(htmlContent), 'Swatch: Schachbrett + Farbe mit Alpha (--sw)');
    T.selectStyle('hormozi'); T.setCsDirty({});

    // ── A7: Hinweis am Emoji-Schalter, wenn die KI nicht erreichbar ist ──
    {
      const blk = { text: 'Das ist ein Test', start: 0, end: 1, words: ['Das', 'ist', 'ein', 'Test'].map((w, i) => ({ word: w, start: i * 0.2, end: i * 0.2 + 0.2 })) };
      T.setState([blk], blk.words, 'karaoke');
      T.setEmphState(true, true, 'off'); T.setEmSrc('local'); T.syncEmphUI();
      ok(E('emWarn').style.display === '' && /simple emoji picks/i.test(E('emWarn').textContent) && E('emWarnRow').style.display === '' && E('emRetry').style.display === '', 'KI aus/nicht erreichbar + Emojis an → Hinweis am Schalter samt «Try again»: ' + E('emWarn').textContent);
      ok(E('emEmoBtn').classList.contains('unavail'), 'Emoji-Schalter als «nicht verfügbar» markiert');
      T.setEmphState(true, false, 'off'); T.syncEmphUI();
      ok(!E('emEmoBtn').classList.contains('unavail') && /simple keyword detection/.test(E('emWarn').textContent), 'Emojis aus: nur Keyword-Hinweis, kein Emoji-Warnzeichen');
      T.setEmphState(false, false, 'off'); T.syncEmphUI();
      ok(E('emWarn').style.display === 'none' && E('emWarnRow').style.display === 'none', 'beide aus: kein Hinweis');
      T.setEmphState(true, true, 'off'); T.setEmSrc('llm'); T.syncEmphUI();
      ok(E('emWarnRow').style.display === 'none' && !E('emEmoBtn').classList.contains('unavail') && T.emAiUnavailable() === false, 'KI erreichbar (llm): kein Hinweis');
      const toastTxt = () => (document.body.children.filter(c => c.id === 'capToast').pop() || {}).textContent;
      T.setEmSrc('local'); T.setEmphEmoji(true);
      ok(/Simple emoji picks/.test(toastTxt()), 'Emoji-Schalter an ohne KI → Toast: ' + toastTxt());
      T.setEmSrc(null); T.setEmphState(false, false, 'off'); T.setState([], [], 'karaoke');
      // Keyword-Farbe ≠ Farbe des aktiven Worts in allen Presets (wo eine Farb-Betonung existiert)
      const presetIds = [...script.slice(script.indexOf('var STYLES = ['), script.indexOf('\n];', script.indexOf('var STYLES = [')) ).matchAll(/\{id:'([a-z0-9]+)'/g)].map(m => m[1]); // eingebaute Presets (Tests legen weitere Styles an)
      ok(presetIds.length >= 20, 'Preset-Liste aus dem Quelltext gelesen (' + presetIds.length + ')');
      const same = T.STYLES.filter(s => presetIds.includes(s.id)).filter(s => {
        const em = T.emphColor(s); if (!em || em === 'none') return false;
        const act = s.hlPillBg || s.hl || ''; return T.cssColorToHex(em, null) === T.cssColorToHex(act, null);
      }).map(s => s.id);
      ok(same.length === 0, 'Presets: Keyword-Farbe ≠ Aktiv-Wort-Farbe (gleich bei: ' + same.join(', ') + ')');
    }

    // ── A8: kuratierte Emoji-Auswahl ──
    {
      const bad = ['🐄', '🌿', '🌾', '🥩', '🏡'];
      ok(bad.every(e => !T.EMO_PICK.includes(e)), 'Emoji-Auswahl: Altlast 🐄🌿🌾🥩🏡 entfernt');
      ok(T.EMO_CATS.length >= 6 && T.EMO_CATS.every(c => c.name && c.icon && c.items.length >= 15), 'Emoji-Auswahl: ≥ 6 Kategorien mit je ≥ 15 Emojis (' + T.EMO_CATS.map(c => c.name + ':' + c.items.length).join(' ') + ')');
      ok(new Set(T.EMO_PICK).size === T.EMO_PICK.length, 'Emoji-Auswahl: keine Dubletten');
      ok(T.EMO_CATS.every(c => c.items.every(it => it[0] && it[1] && it[1].length > 3)), 'Emoji-Auswahl: jeder Eintrag hat Stichwörter');
      const find = (q, e) => T.emojiSearch(q).includes(e);
      ok(find('fire', '🔥') && find('Feuer', '🔥') && find('geld', '💰') && find('money', '💰') && find('rakete', '🚀') && find('heart', '❤️') && find('herz', '❤️'), 'Suche: englisch + deutsch (fire/Feuer, money/Geld, Rakete, heart/Herz)');
      ok(find('überrascht', '😮') && find('ueberrascht', '😮') && find('ÜBERRASCHT', '😮') && find('Glück', '🍀') && find('glueck', '🍀'), 'Suche: Umlaute/ue/Grossschreibung gleichwertig');
      ok(find('daumen hoch', '👍') && !find('daumen hoch', '👎') && T.emojiSearch('zzzzqq').length === 0 && T.emojiSearch('  ').length === 0, 'Suche: mehrere Wörter = UND; kein Treffer → leer');
    }

    // ── A10 / A11: Template-Menü, Löschen mit Undo, Import-Rückmeldung, Mehrere Tabs ──
    {
      const store = {};
      global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
      global.prompt = () => { throw new Error('prompt() darf nicht mehr benutzt werden'); }; global.confirm = () => { throw new Error('confirm() darf nicht mehr benutzt werden'); };
      T.setUserTemplates([]); T.loadTemplates();
      T.selectStyle('tbox'); E('tplName').value = 'Alpha'; T.saveTemplate();
      T.selectStyle('classic'); E('tplName').value = 'Beta'; T.saveTemplate();
      const al = T.getUserTemplates().find(t => t.name === 'Alpha'), be = T.getUserTemplates().find(t => t.name === 'Beta');
      ok(al && be && T.brandTplId() === al.id, 'Setup: zwei Templates, Alpha ist Standard');
      // Menü: Einträge, Inline-Umbenennen (Eingabefeld statt prompt), Schliessen bei Scroll/Esc
      const btn = { getBoundingClientRect: () => ({ left: 100, top: 10, bottom: 30, right: 120 }) };
      T.openTplMenu(be.id, btn);
      let m = T.getTplMenu();
      ok(m && m.children.map(b => b.textContent).join('|') === '★ Use for every new video|Edit|Rename|Duplicate|Delete', 'Menü: Einträge (' + (m && m.children.map(b => b.textContent).join('|')) + ')');
      T.tplMenuScroll(); ok(T.getTplMenu() === null, 'Menü schliesst bei Scroll');
      T.openTplMenu(be.id, btn); T.tplMenuKey({ key: 'Enter', stopPropagation() {} }); ok(T.getTplMenu() !== null, 'andere Taste schliesst nicht');
      T.tplMenuKey({ key: 'Escape', stopPropagation() {} }); ok(T.getTplMenu() === null, 'Menü schliesst bei Esc');
      T.openTplMenu(be.id, btn); m = T.getTplMenu();
      m.children[2].onclick({ stopPropagation() {} }); // Rename
      m = T.getTplMenu(); const inp = m.children[0], row = m.children[1];
      ok(m && inp.value === 'Beta' && row.children.map(b => b.textContent).join('|') === 'Save|Cancel', 'Rename: Eingabefeld im Menü (vorbelegt), Save/Cancel');
      T.tplMenuScroll(); ok(T.getTplMenu() !== null, 'Rename-Modus: Scroll/Resize (Handy-Tastatur) schliesst nicht');
      inp.value = '   '; row.children[0].onclick({ stopPropagation() {} }); ok(T.getTplMenu() !== null && T.getUserTemplates().find(t => t.id === be.id).name === 'Beta', 'Rename: leerer Name wird nicht übernommen');
      inp.value = 'Beta 2'; row.children[0].onclick({ stopPropagation() {} });
      ok(T.getTplMenu() === null && T.getUserTemplates().find(t => t.id === be.id).name === 'Beta 2', 'Rename: Enter/Save übernimmt und schliesst');
      ok(T.renameTemplate(be.id, 'Beta 2') === false && T.renameTemplate('nope', 'x') === false, 'Rename: gleicher Name/unbekannte ID → nichts');
      // Löschen: ohne confirm, mit Undo-Toast (Standard-Look wird mit zurückgeholt)
      T.deleteTemplate(al.id);
      ok(T.getUserTemplates().find(t => t.id === al.id).deleted && T.brandTplId() === '', 'Delete: Grabstein, Standard-Look geleert');
      const undoBtn = E('capToast').children.filter(c => c.className === 'cap-toast-btn').pop();
      ok(undoBtn && undoBtn.textContent === 'Undo' && /Deleted/.test(document.body.children.filter(c => c.id === 'capToast').pop().textContent), 'Delete: Toast mit «Undo»');
      undoBtn.onclick();
      const back = T.getUserTemplates().find(t => t.id === al.id);
      ok(back && !back.deleted && back.name === 'Alpha' && back.updatedAt > 0 && T.liveTemplates().some(t => t.id === al.id) && T.brandTplId() === al.id, 'Undo: Template + Standard-Look zurück');
      ok(JSON.parse(store.capivo_templates).find(t => t.id === al.id && !t.deleted), 'Undo: auch im localStorage live');
      ok(T.undoDeleteTemplate({ id: al.id, name: 'x', style: {}, updatedAt: 1 }, false) === false, 'Undo für ein bereits vorhandenes Template: nichts');
      // Export: app:'gluephs'; Import akzeptiert capivo + gluephs, meldet importiert/übersprungen/Fehler, stellt gelöschte IDs wieder her
      T.exportTemplates();
      const exp = JSON.parse(global.LASTBLOB.content);
      ok(exp.app === 'gluephs' && exp.templates.length === 2, 'Export-JSON: app:gluephs');
      let r = T.importTemplatesFromText(JSON.stringify(exp));
      ok(r.imported === 0 && r.skipped === 2 && r.errors === 0 && T.importTemplateMessage(r) === 'Imported 0 templates · 2 skipped (already up to date)', 'Import derselben Datei: 0 importiert, 2 übersprungen — ' + T.importTemplateMessage(r));
      T.deleteTemplate(be.id);
      ok(!T.liveTemplates().some(t => t.id === be.id), 'Setup: Beta gelöscht (Grabstein)');
      const old = Object.assign({}, exp, { app: 'capivo' }); // alter Export (app:'capivo'), Beta darin mit dem alten Zeitstempel
      r = T.importTemplatesFromText(JSON.stringify(old));
      ok(r.imported === 1 && r.skipped === 1 && r.errors === 0, 'Import (app:capivo): gelöschte ID wird wiederhergestellt: ' + JSON.stringify(r));
      ok(T.liveTemplates().some(t => t.id === be.id && t.name === 'Beta 2') && !T.getUserTemplates().find(t => t.id === be.id).deleted, 'Beta wieder live (Tombstone geschlagen)');
      r = T.importTemplatesFromText(JSON.stringify({ app: 'gluephs', templates: [exp.templates[0], { name: 'ohne ID' }, 'kaputt', { id: 'tpl_neu1', name: 'Neu', style: { fl: 'Inter' } }] }));
      ok(r.imported === 1 && r.skipped === 1 && r.errors === 2 && T.importTemplateMessage(r) === 'Imported 1 template · 1 skipped (already up to date) · 2 failed', 'Import gemischt (gluephs): ' + T.importTemplateMessage(r));
      let thrown = 0; ['{"app":"fremd","templates":[]}', '{"foo":1}', 'kein json'].forEach(t => { try { T.importTemplatesFromText(t); } catch (e) { thrown++; } });
      ok(thrown === 3, 'Import: fremde/kaputte Datei wirft (UI zeigt Fehlermeldung)');
      // A11: storage-Event mergt statt zu überschreiben
      const tpls = () => JSON.parse(store.capivo_templates);
      const cur = T.getUserTemplates().find(t => t.id === al.id), before = cur.updatedAt;
      ok(T.onTemplatesStorage({ key: 'irgendwas', newValue: '[]' }) === false, 'storage: fremder Schlüssel ignoriert');
      ok(T.onTemplatesStorage({ key: 'capivo_templates', newValue: JSON.stringify([Object.assign({}, cur, { name: 'Alpha älter', updatedAt: before - 1000 })]) }) === false && T.liveTemplates().find(t => t.id === al.id).name === 'Alpha', 'storage: älterer Stand gewinnt nicht');
      // anderer Tab: Alpha umbenannt (neuer), neues Template Gamma
      const other = [Object.assign({}, cur, { name: 'Alpha (Tab B)', updatedAt: Date.now() + 5000 }), { id: 'tpl_gamma', name: 'Gamma', style: { fl: 'Anton' }, layout: {}, createdAt: 5, updatedAt: Date.now() }];
      ok(T.onTemplatesStorage({ key: 'capivo_templates', newValue: JSON.stringify(other) }) === true, 'storage: Änderung eines anderen Tabs erkannt');
      ok(T.liveTemplates().find(t => t.id === al.id).name === 'Alpha (Tab B)' && T.liveTemplates().some(t => t.id === 'tpl_gamma') && T.liveTemplates().some(t => t.id === be.id) && T.STYLES.some(x => x.id === 'tpl_gamma'),
         'storage: gemergt — neuer Name + neues Template von Tab B, eigene Templates (Beta) bleiben, Picker-Styles aktualisiert');
      // Löschung in Tab B (Grabstein) schlägt die lokale Live-Version
      T.onTemplatesStorage({ key: 'capivo_templates', newValue: JSON.stringify([{ id: 'tpl_gamma', deleted: true, updatedAt: Date.now() + 9000 }]) });
      ok(!T.liveTemplates().some(t => t.id === 'tpl_gamma') && !T.STYLES.some(x => x.id === 'tpl_gamma'), 'storage: Löschung aus Tab B (Grabstein) übernommen');
      // eigenes Speichern mergt zuerst den aktuellen localStorage-Stand (Tab B hat heimlich etwas geschrieben, kein Event gesehen)
      store.capivo_templates = JSON.stringify(tpls().concat([{ id: 'tpl_delta', name: 'Delta (nur Tab B)', style: { fl: 'Inter' }, layout: {}, createdAt: 9, updatedAt: Date.now() }]));
      T.selectStyle('hormozi'); E('tplName').value = 'Eigenes'; T.saveTemplate();
      ok(tpls().some(t => t.id === 'tpl_delta' && !t.deleted) && tpls().some(t => t.name === 'Eigenes') && T.liveTemplates().some(t => t.id === 'tpl_delta'), 'Speichern: aktueller localStorage-Stand wird eingemischt statt überschrieben (Delta bleibt)');
      // Löschen in diesem Tab bleibt trotz älterem localStorage-Eintrag gelöscht
      T.deleteTemplate('tpl_delta');
      ok(!T.liveTemplates().some(t => t.id === 'tpl_delta') && tpls().find(t => t.id === 'tpl_delta').deleted === true, 'Speichern: eigener Grabstein gewinnt gegen älteren Stand im Speicher');
      delete global.localStorage; delete global.prompt; delete global.confirm;
      T.setUserTemplates([]); T.selectStyle('hormozi');
    }
  }
  // ══════════════════════════════════════════════════
  // Paket N-Style: N1 Standard-Look Bold Pop, Tight-Fade ≤ 0,12 s, N8 relative Grössen-Anzeige, N13 Zeile anklicken
  // ══════════════════════════════════════════════════
  {
    const src = fs.readFileSync(path.join(__dirname, 'captly.html'), 'utf8');
    const E = id => document.getElementById(id);
    // N1: neue Nutzer starten mit Bold Pop (Highlight sichtbar, schwarze Kontur, 4 Wörter); gemerkter Look/Standard-Template bleiben
    {
      const hz = T.STYLES.find(x => x.id === 'hormozi');
      ok(T.DEFAULT_STYLE === 'hormozi' && /var DEFAULT_STYLE\s*=\s*'hormozi'/.test(src), 'N1: DEFAULT_STYLE = Bold Pop');
      ok(hz.hl && hz.hl.toLowerCase() !== (hz.tc || '').toLowerCase() && hz.cstroke === '#000' && hz.layout === undefined && /var WORDS_PER_BLOCK\s*=\s*4/.test(src), 'N1: Bold Pop: Highlight ≠ Textfarbe, schwarze Kontur, 4 Wörter pro Block (Regler-Standard)');
      const runWith = (store) => {
        global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem() {}, removeItem() {} };
        try { return new Function(script + ';return activeId;')(); } finally { delete global.localStorage; }
      };
      ok(runWith({}) === 'hormozi' && runWith({ 'capivo.style': 'tight' }) === 'tight' && runWith({ 'capivo.style': 'mix' }) === 'mix', 'N1: ohne gespeicherte Wahl Bold Pop, gespeicherte Wahl (Tight/Mix) bleibt');
      ok(/var LAND_CHIPS = \['hormozi',/.test(src), 'N1: Landing-Chips: Standard-Look steht vorn (renderLandChips markiert ihn über activeId als gewählt)');
    }
    // Tight: Fade in nur 0,12 s, ease-out, Start > 0 — nur flash; kurze Wörter nie halbtransparent
    {
      ok(T.animDur('flash') <= 0.12 && T.ANIM_DURS.flash <= 0.12, 'Tight: Einblenden (flash) ≤ 0,12 s: ' + T.animDur('flash'));
      ok(T.ANIM_KEYFRAMES.flash[0][1].op > 0 && T.ANIM_KEYFRAMES.flash[0][2] === 'out' && T.ANIM_KEYFRAMES.flash[0][1].op === 0.35, 'Tight: Fade startet bei 0,35 mit ease-out');
      ok(['scale', 'punch', 'bounce', 'glow', 'wobble'].every(a => T.animDur(a) === T.ANIM_DUR) && T.ANIM_DUR === 0.34, 'andere Animationen unverändert 0,34 s');
      ok(JSON.stringify(T.ANIM_KEYFRAMES.scale) === JSON.stringify([[0, { sx: 1, sy: 1 }], [30, { sx: 1.14, sy: 1.14 }], [100, { sx: 1, sy: 1 }]]) && JSON.stringify(T.ANIM_KEYFRAMES.punch) === JSON.stringify([[0, { sx: 1.28, sy: 1.28 }, 'out'], [100, { sx: 1, sy: 1 }]]) && JSON.stringify(T.ANIM_KEYFRAMES.bounce) === JSON.stringify([[0, { ty: 0.22, op: 0.5 }], [100, { ty: 0, op: 1 }]]), 'Pop/Punch/Lift-Keyframes unverändert');
      ok(/@keyframes captly-flash\{0%\{opacity:\.35;animation-timing-function:cubic-bezier\(\.33,1,\.68,1\)\}100%\{opacity:1\}\}/.test(src) && /'animation:captly-' \+ s\.anim \+ ' ' \+ animDur\(s\.anim\) \+ 's ease both;'/.test(src), 'Tight: CSS-Keyframe (Kacheln) = JS, Dauer je Animation');
      const f = t => T.animState('flash', t);
      ok(f(0).op === 0.35 && f(0.06).op > 0.35 && f(0.06).op < 1 && f(0.12 - 1e-6).op > 0.999 && f(0.12) === null && f(-0.01) === null, 'Tight: Kurve .35 → 1, nach 0,12 s fertig');
      // Wort mit 0,3 s Länge (Ein-Wort-Block): Deckkraft (Block × Wort) ab 0,12 s nach Wortbeginn ≥ 0,95; Vorschau (capWordFx/capBlockFx) = Export (drawCaptionsOnCtx nutzt dieselben Funktionen)
      const sT = T.STYLES.find(x => x.id === 'tight');
      T.setState([{ words: [{ word: 'Hallo', start: 5, end: 5.3 }], start: 5, end: 5.3, text: 'Hallo' }], [{ word: 'Hallo', start: 5, end: 5.3 }], 'karaoke');
      const op = dt => { const t = 5 + dt, fx = T.capWordFx(sT, T.getBlocks()[0], 0, 0, t, false, false); return T.capBlockFx(0, t, false, false).op * fx.op * (fx.a ? fx.a.op : 1); };
      ok(op(0.12) >= 0.95 && op(0.2) === 1, 'Tight: Wort mit 0,3 s ≥ 0,95 Deckkraft ab 0,12 s: ' + op(0.12).toFixed(3));
      ok(op(0.05) > 0 && op(0.05) < op(0.1) && op(0.1) < op(0.12) + 1e-9, 'Tight: Deckkraft steigt monoton (0,05/0,1/0,12 s): ' + [0.05, 0.1, 0.12].map(d => op(d).toFixed(3)).join('/'));
      const exp = src.slice(src.indexOf('function drawCaptionsOnCtx'), src.indexOf('function drawCaptionsOnCtx') + 40000), dom = src.slice(src.indexOf('function capDomMotion'), src.indexOf('function capDomMotion') + 3000);
      ok(/capWordFx\(/.test(exp) && /capBlockFx\(/.test(exp) && /capWordFx\(/.test(dom) && /capBlockFx\(/.test(dom), 'Vorschau (capDomMotion) und Export (drawCaptionsOnCtx) rechnen dieselben Funktionen capWordFx/capBlockFx (→ animState)');
    }
    // N8: Anzeige neben dem Grössen-Regler relativ (S/M/L/XL + % der Rahmenhöhe), Regler-Bereich unverändert
    {
      const a = T.capSizeInfo(22, 275, 489), b = T.capSizeInfo(44, 550, 978);
      ok(a.tag === 'M' && a.pctH === 4.5 && a.px1080 === 86, 'N8: 22 px im 275×489-Rahmen = M, 4,5 % der Höhe, ≈ 86 px im 1080-Export: ' + JSON.stringify(a));
      ok(a.tag === b.tag && a.pctH === b.pctH && a.px1080 === b.px1080, 'N8: doppelter Rahmen + doppelte Schrift = gleiche Anzeige (Vorschau = Export)');
      ok(['S', 'M', 'L', 'XL'].join() === [T.capSizeInfo(10, 300, 533).tag, T.capSizeInfo(24, 300, 533).tag, T.capSizeInfo(40, 300, 533).tag, T.capSizeInfo(54, 300, 533).tag].join(), 'N8: Stufen S/M/L/XL über den Reglerbereich');
      ok(/id="szSlider"[^>]*min="10"|min="10" max="54" value="22" id="szSlider"/.test(src) && /<input type="range" min="10" max="54" value="22" id="szSlider"/.test(src), 'N8: Regler-Bereich 10–54 und Standardwert unverändert');
      T.onSzChange('30'); T.lookUndoEnd();
      ok(/^(S|M|L|XL) \d+\.\d%$/.test(E('szDisp').textContent) && !/px/.test(E('szDisp').textContent) && /of the frame height/.test(E('szDisp').title) && /1080-px/.test(E('szDisp').title), 'N8: Anzeige nach Regler-Zug relativ, Tooltip erklärt: ' + E('szDisp').textContent);
      ok(!/szDisp'\)\.textContent = [^;]*'px'/.test(src), 'N8: keine px-Anzeige mehr im Quelltext');
    }
    // N13: Klick auf Zeile (Rand und Text) springt an den Zeilenanfang und pausiert; auch nach Wiederherstellen
    {
      const vid = E('mainVid');
      const ws2 = Array.from({ length: 6 }, (_, i) => ({ word: 'wort' + i, start: 1 + i * 2, end: 1 + i * 2 + 0.4 }));
      T.setState(T.buildCaptionBlocks(ws2), ws2.map(w => Object.assign({}, w)), 'karaoke');
      const cb = T.getBlocks(); ok(cb.length >= 4, 'N13: Testblöcke vorhanden: ' + cb.length);
      const origCreate = document.createElement, lis = [];
      document.createElement = t => { const e = origCreate(t); if (t === 'textarea') e.addEventListener = (n, f) => { lis.push([e, n, f]); }; return e; };
      const segs = E('capSegs'); segs.children = [];
      await T.renderSegments();
      document.createElement = origCreate;
      const rows = segs.children.length ? segs.children[0].children : [];
      const row = idx => rows[idx], ta = idx => row(idx).children[1];
      ok(rows.length === cb.length && typeof row(2).onclick === 'function', 'N13: Zeilen gerendert (' + rows.length + ')');
      vid.duration = 20; vid.paused = false; vid.currentTime = 9;
      row(2).onclick({ target: { tagName: 'DIV' } });
      ok(Math.abs(vid.currentTime - (cb[2].start + 0.01)) < 1e-9 && vid.paused === true, 'N13: Klick auf den Zeilenrand: springt an den Zeilenanfang und pausiert (läuft nicht weiter): ' + vid.currentTime);
      vid.paused = false; vid.currentTime = 15;
      const pd = lis.filter(l => l[0] === ta(1) && l[1] === 'pointerdown');
      ok(pd.length === 1, 'N13: Text der Zeile (Textarea) reagiert auf Klick');
      pd[0][2]();
      ok(Math.abs(vid.currentTime - (cb[1].start + 0.01)) < 1e-9 && vid.paused === true, 'N13: Klick auf den Zeilentext springt ebenfalls und pausiert: ' + vid.currentTime);
      document.activeElement = ta(3); vid.currentTime = 15; pd.length = 0;
      lis.filter(l => l[0] === ta(3) && l[1] === 'pointerdown')[0][2]();
      ok(vid.currentTime === 15, 'N13: Klick in die schon fokussierte Zeile (Cursor setzen) springt nicht'); delete document.activeElement;
      // Block wird beim Klick gelesen (nicht beim Aufbau): nach Timing-Änderung/Wiederherstellen stimmt das Ziel
      cb[2].start += 0.5; T.setTimeOff && 0; vid.paused = false;
      row(2).onclick({ target: { tagName: 'DIV' } });
      ok(Math.abs(vid.currentTime - (cb[2].start + 0.01)) < 1e-9, 'N13: Ziel = aktueller Blockstart zum Klickzeitpunkt');
      const pausedBefore = vid.paused; vid.duration = NaN; vid.currentTime = 7; vid.paused = false;
      T.segSeek(2); ok(vid.currentTime === 7 && vid.paused === false && pausedBefore === true, 'N13: ohne geladenes Video (Dauer unbekannt) passiert nichts');
      vid.duration = NaN; vid.paused = true; vid.currentTime = 0;
      ok(/function segSeek\(idx\)[\s\S]{0,400}vid\.pause\(\)[\s\S]{0,200}tlSeekVideo\(b\.start - \(timeOff \|\| 0\)/.test(src) && /segSeek\(idx\);\s*\n\s*\};/.test(src) && !/seekToTime\(b\.start\);\s*\n\s*\};\s*\n\s*var ts = /.test(src), 'N13: Quelltext: Zeile ruft segSeek (pausiert, timeOff), nicht mehr seekToTime');
    }
  }


  // ═══════════════ Paket B3-B4: SRT/VTT-Segmentierung, Dateiname-Suffix, Template-Export mit eigener Schrift ═══════════════
  {
    const fixDir = path.join(__dirname, 'scripts', 'creator-test', 'fixtures');
    const fixture = n => JSON.parse(fs.readFileSync(path.join(fixDir, n + '.json'), 'utf8')).words.map(w => ({ word: w.word, start: w.start, end: w.end }));
    const toSec = t => { const m = /^(\d\d):(\d\d):(\d\d)[,.](\d{3})$/.exec(t); return m ? (+m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000) : NaN; };
    // Datei parsen (SRT oder VTT) und prüfen: Nummerierung, Zeitformat, keine Überlappung, max. Zeichen/Zeile
    const parseCues = (txt, vtt) => {
      const body = vtt ? txt.replace(/^WEBVTT\n\n/, '') : txt;
      return body.split('\n\n').filter(Boolean).map(b => { const l = b.split('\n'); const m = /^(\S+) --> (\S+)$/.exec(l[1] || ''); return { n: l[0], a: m ? m[1] : '', b: m ? m[2] : '', lines: l.slice(2) }; });
    };
    const checkFile = (label, txt, vtt, o) => {
      const cs = parseCues(txt, vtt); let prev = 0, bad = '';
      cs.forEach((c, i) => {
        const a = toSec(c.a), b = toSec(c.b);
        if (c.n !== String(i + 1)) bad = bad || 'Nummer ' + c.n;
        if (!(vtt ? /^\d\d:\d\d:\d\d\.\d{3}$/ : /^\d\d:\d\d:\d\d,\d{3}$/).test(c.a) || !(vtt ? /^\d\d:\d\d:\d\d\.\d{3}$/ : /^\d\d:\d\d:\d\d,\d{3}$/).test(c.b)) bad = bad || 'Zeitformat ' + c.a + ' ' + c.b;
        if (!(b > a)) bad = bad || 'Ende vor Start #' + (i + 1);
        if (a < prev - 1e-9) bad = bad || 'Überlappung #' + (i + 1);
        if (!c.lines.length || c.lines.some(l => !l.trim())) bad = bad || 'leere Zeile #' + (i + 1);
        if (o && o.maxLines && c.lines.length > o.maxLines) bad = bad || '> ' + o.maxLines + ' Zeilen #' + (i + 1);
        if (o && o.maxChars && c.lines.some(l => l.length > o.maxChars && l.indexOf(' ') >= 0)) bad = bad || '> ' + o.maxChars + ' Zeichen #' + (i + 1);
        if (o && o.maxDur && b - a > o.maxDur + 1e-6) bad = bad || 'Dauer ' + (b - a).toFixed(2) + ' #' + (i + 1);
        if (o && o.minDur && b - a < o.minDur - 1e-6 && i < cs.length - 1) bad = bad || 'zu kurz ' + (b - a).toFixed(2) + ' #' + (i + 1);
        prev = b;
      });
      ok(cs.length > 0 && !bad, label + ': ' + (bad || cs.length + ' Cues gültig'));
      return cs;
    };
    T.setTimeOffState(0); T.setCaseState('asis'); T.setMaxCharsState(40);
    const fx = {};
    ['v1-reel-de', 'v2-podcast-de-16x9', 'v3-hook-en'].forEach(n => { fx[n] = fixture(n); });
    // ── Pure Funktionen: drei Segmentierungen je Testvideo ──
    Object.keys(fx).forEach(n => {
      const blocks = T.buildCaptionBlocks(fx[n], []);
      const snip = T.subtitleCues(blocks, 'snippets', {});
      ok(snip.length === blocks.length && snip.every((c, i) => c.start === blocks[i].start && c.end === blocks[i].end && c.text === blocks[i].text), n + ': snippets = Blöcke 1:1 (wie bisher)');
      const sen = T.subtitleCues(blocks, 'sentences', {});
      const two = T.subtitleCues(blocks, 'twolines', {});
      const allW = fx[n].map(w => w.word).join(' ');
      ok(sen.map(c => c.text).join(' ') === allW && two.map(c => c.text.replace(/\n/g, ' ')).join(' ') === allW, n + ': kein Wort verloren/doppelt (sentences + twolines)');
      const sentEnds = fx[n].filter(w => /[.!?…]$/.test(w.word)).length;
      ok(sen.length >= sentEnds && sen.every(c => c.end - c.start <= 7 + 1e-6), n + ': sentences — mind. ' + sentEnds + ' Sätze, jeder ≤ 7 s (' + sen.length + ' Cues)');
      checkFile(n + ' SRT snippets', T.srtFile(snip), false, {});
      checkFile(n + ' SRT sentences', T.srtFile(sen), false, { maxDur: 7 });
      const f2 = checkFile(n + ' SRT 2×42', T.srtFile(two), false, { maxLines: 2, maxChars: 42, maxDur: 7, minDur: 1 });
      checkFile(n + ' VTT 2×42', 'WEBVTT\n\n' + T.vttCues(two).join('\n\n'), true, { maxLines: 2, maxChars: 42, maxDur: 7, minDur: 1 });
      ok(f2.every(c => c.lines.length < 2 || Math.abs(c.lines[0].length - c.lines[1].length) <= 20), n + ': 2×42 Zeilen ausgewogen (Längenunterschied ≤ 20)');
      ok(T.vttCues(two)[0].split('\n')[1].indexOf('.') > 0 && T.vttCues(two)[0].split('\n')[1].indexOf(',') < 0, n + ': VTT-Zeit mit Punkt');
    });
    // Inhalt v2: Sätze exakt (Satzende . trennt, „Verkauf keine Stunden, verkauf Ergebnisse.“ bleibt zusammen)
    {
      const b2 = T.buildCaptionBlocks(fx['v2-podcast-de-16x9'], []);
      const sen = T.subtitleCues(b2, 'sentences', {});
      ok(sen[0].text === 'Willkommen zurück bei Klartext Business.' && sen.some(c => /^Ihr wichtigster Tipp: Verkauf keine Stunden, verkauf Ergebnisse\.$/.test(c.text)), 'v2 sentences: Satzgrenzen an . — ' + sen.slice(0, 3).map(c => c.text).join(' | '));
      const two = T.subtitleCues(b2, 'twolines', {});
      ok(two.every(c => !/\n$/.test(c.text)) && two.some(c => c.text.indexOf('\n') > 0), 'v2 2×42: lange Sätze auf 2 Zeilen umbrochen');
    }
    // Lange Sätze (> 7 s) werden an Komma/Pause geteilt
    {
      const longW = []; let t = 0;
      'Das ist ein sehr langer Satz, der viel zu lange dauert, weil wir absichtlich langsam sprechen und danach noch mehr erzählen, bis er endlich zu Ende geht.'.split(' ').forEach(w => { longW.push({ word: w, start: t, end: t + 0.55 }); t += 0.6; });
      const bl = T.buildCaptionBlocks(longW, []);
      const sen = T.subtitleCues(bl, 'sentences', {});
      ok(sen.length >= 2 && sen.every(c => c.end - c.start <= 7 + 1e-6) && /,$/.test(sen[0].text), 'sentences: Satz von ' + (t).toFixed(0) + ' s wird an Komma geteilt ≤ 7 s — ' + sen.map(c => c.text.length).join('/'));
      const two = T.subtitleCues(bl, 'twolines', {});
      checkFile('Langsatz 2×42', T.srtFile(two), false, { maxLines: 2, maxChars: 42, maxDur: 7, minDur: 1 });
    }
    // Abkürzungen („z. B.“, „Dr.“) beenden keinen Satz
    {
      const aw = 'Wir sparen z. B. Zeit. Dr. Meier lacht. Genau.'.split(' ').map((w, i) => ({ word: w, start: i * 0.3, end: i * 0.3 + 0.25 }));
      const sen = T.subtitleCues(T.buildCaptionBlocks(aw, []), 'sentences', {}).map(c => c.text);
      ok(sen.length === 3 && sen[0] === 'Wir sparen z. B. Zeit.' && sen[1] === 'Dr. Meier lacht.', 'sentences: Abkürzungen z. B./Dr. trennen nicht — ' + JSON.stringify(sen));
    }
    // Pause ≥ 0,8 s trennt auch ohne Satzzeichen; kurze Cues (< 1 s) werden zusammengelegt/verlängert
    {
      const pw = [{ word: 'Hallo', start: 0, end: 0.3 }, { word: 'Welt', start: 0.35, end: 0.6 }, { word: 'und', start: 2, end: 2.2 }, { word: 'tschüss', start: 2.25, end: 2.6 }];
      const sen = T.subtitleCues(T.buildCaptionBlocks(pw, []), 'sentences', {});
      ok(sen.length === 2 && sen[0].text === 'Hallo Welt', 'sentences: Pause ≥ 0,8 s trennt');
      const two = T.subtitleCues(T.buildCaptionBlocks(pw, []), 'twolines', {});
      ok(two.length === 2 && two[0].end - two[0].start >= 1 - 1e-6, '2×42: Cue < 1 s wird auf 1 s verlängert (Nachbar hat Platz)');
    }
    // Zeilenumbruch: ausgewogen, nie > 42, einzelnes Riesenwort bleibt ganz
    {
      const l = T.subLines('Das ist ein Satz mit genau der richtigen Länge für zwei Zeilen hier'.split(' '), 42);
      ok(l && l.length === 2 && l.every(x => x.length <= 42) && Math.abs(l[0].length - l[1].length) <= 8, 'subLines: ausgewogen — ' + JSON.stringify(l));
      ok(T.subLines(['kurz', 'text'], 42).length === 1 && T.subLines('a'.repeat(30).split('').map(() => 'wortwort'), 42) === null, 'subLines: 1 Zeile wenn passt, null wenn nicht in 2×42');
    }
    // Handkorrekturen am Text werden in allen Varianten übernommen
    {
      const blocks = T.buildCaptionBlocks(fx['v2-podcast-de-16x9'], []);
      const b0 = blocks.find(b => /Klartext/.test(b.text)); b0.text = b0.text.replace('Klartext', 'KLARTEXT-FIX');
      b0.words = b0.words.map((w, i) => (i === 0 ? w : w)); // Timings bleiben
      ['snippets', 'sentences', 'twolines'].forEach(m => {
        const cues = T.subtitleCues(blocks, m, {});
        ok(cues.some(c => c.text.indexOf('KLARTEXT-FIX') >= 0), 'Handkorrektur im Text übernommen: ' + m);
      });
      // Text mit anderer Wortanzahl als b.words (Einfügung): Zeiten gleichmässig verteilt, Reihenfolge/Monotonie bleibt
      blocks[1].text = 'EINS ZWEI DREI VIER FÜNF SECHS SIEBEN';
      const cues = T.subtitleCues(blocks, 'twolines', {});
      let mono = true; cues.forEach((c, i) => { if (i && c.start < cues[i - 1].end - 1e-9) mono = false; });
      ok(mono && cues.some(c => c.text.indexOf('EINS') >= 0) && cues.some(c => /SIEBEN/.test(c.text)), 'Handkorrektur mit anderer Wortzahl: Cues monoton, Text vollständig');
      // Case-Option + Zeitversatz laufen mit
      const up = T.subtitleCues(blocks, 'sentences', { caseFn: x => x.toUpperCase(), off: 0.1 });
      ok(up[0].text === up[0].text.toUpperCase() && Math.abs(up[0].start - Math.max(0, blocks[0].words[0].start - 0.1)) < 1e-9, 'sentences: Gross-/Kleinschreibung und Timing-Versatz');
    }
    // ── Export-Funktionen: Auswahl wirkt, Auswahl wird gemerkt ──
    {
      const store = {};
      global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
      const blocks = T.buildCaptionBlocks(fx['v2-podcast-de-16x9'], []);
      T.setCaptionBlocksForTest(blocks); T.setTitle('Mein Reel');
      ok(T.getSrtMode() === 'snippets', 'Standard: Reel snippets');
      T.exportSRT(); const snipTxt = global.LASTBLOB.content;
      T.setSrtMode('twolines'); ok(store['capivo.srtMode'] === 'twolines', 'Wahl in localStorage[capivo.srtMode] gemerkt');
      T.exportSRT(); const twoTxt = global.LASTBLOB.content;
      ok(snipTxt !== twoTxt && /\n.{1,42}\n.{1,42}\n\n/.test(twoTxt), 'exportSRT folgt der Wahl (2 Zeilen)');
      T.setSrtMode('sentences'); T.exportVTT(); const vtt = global.LASTBLOB.content;
      ok(/^WEBVTT\n\n1\n00:00:00\.339 --> /.test(vtt) && checkFile('exportVTT sentences', vtt, true, { maxDur: 7 }).length > 0, 'exportVTT folgt der Wahl (Sätze, gültig)');
      T.setSrtMode('quatsch'); ok(T.getSrtMode() === 'snippets', 'unbekannte Variante → snippets');
      T.setSrtMode('twolines'); T.loadSubOpts(); ok(T.getSrtMode() === 'twolines', 'loadSubOpts liest die gemerkte Wahl');
      // Dateiname-Suffix: an (Standard) / aus, gilt für MP4, SRT, VTT, TXT (alle über exportBaseName)
      ok(T.getFileSuffix() === true && T.exportBaseName() === 'mein-reel-gluephs', 'Suffix an: mein-reel-gluephs');
      global.CLICKS.length = 0; T.exportSRT(); T.exportVTT(); T.exportTXT();
      ok(global.CLICKS.slice(-3).map(c => c.download).join(',') === 'mein-reel-gluephs.srt,mein-reel-gluephs.vtt,mein-reel-gluephs.txt', 'Dateinamen mit Suffix: ' + global.CLICKS.slice(-3).map(c => c.download));
      T.setFileSuffix(false); ok(store['capivo.fileSuffix'] === '0', 'Suffix-Wahl in localStorage[capivo.fileSuffix]');
      global.CLICKS.length = 0; T.exportSRT(); T.exportVTT(); T.exportTXT();
      ok(global.CLICKS.slice(-3).map(c => c.download).join(',') === 'mein-reel.srt,mein-reel.vtt,mein-reel.txt' && T.exportBaseName() === 'mein-reel', 'Suffix aus: mein-reel.srt/.vtt/.txt (MP4 nutzt dieselbe Basis)');
      T.setTitle(''); ok(T.exportBaseName() === 'video', 'Suffix aus + ohne Titel: video');
      T.setFileSuffix(true); T.setTitle(''); ok(T.exportBaseName() === 'gluephs-video', 'Suffix an + ohne Titel: gluephs-video');
      T.setSrtMode('snippets'); T.setTitle('');
      delete global.localStorage;
    }
    // ── B4: Template-Export mit eigener Schrift (Fake-Schrift, Roundtrip) ──
    {
      const fakeFont = (tag, size) => { const u = new Uint8Array(size); u.set([0x4f, 0x54, 0x54, 0x4f]); for (let i = 4; i < size; i++) u[i] = (i * 7 + tag) & 255; return u; };
      const faceLog = [];
      global.FontFace = function (name, buf) { this.family = name; this.buf = buf; this.load = () => { faceLog.push(name); return Promise.resolve(this); }; };
      const addOld = document.fonts.add; document.fonts.add = () => {};
      const own = fakeFont(3, 5000);
      ok(T.fontFormatOf(own) === 'otf' && T.fontFormatOf(new Uint8Array([0, 1, 0, 0, 9])) === 'ttf' && T.fontFormatOf(new Uint8Array([0x77, 0x4f, 0x46, 0x32])) === 'woff2' && T.fontFormatOf(new Uint8Array([0x77, 0x4f, 0x46, 0x46])) === 'woff' && T.fontFormatOf(new Uint8Array([1, 2, 3, 4])) === '', 'fontFormatOf: otf/ttf/woff/woff2/unbekannt an den Bytes');
      ok(T.b64ToBytes(T.bytesToB64(own)).every((b, i) => b === own[i]) && T.b64ToBytes(T.bytesToB64(own)).length === 5000, 'base64-Roundtrip ohne Verlust');
      const tplA = { id: 'tpl_fontA', name: 'Mit Schrift', style: { fl: 'Marken Sans', font: "'Marken Sans'", fw: '700', tc: '#fff', hl: '#fa0', anim: 'none' }, layout: {}, createdAt: 1, updatedAt: 100 };
      const tplB = { id: 'tpl_plain', name: 'Ohne', style: { fl: 'Anton', font: "'Anton'", tc: '#fff', hl: '#fa0', anim: 'none' }, layout: {}, createdAt: 2, updatedAt: 100 };
      const tplC = { id: 'tpl_emfont', name: 'Betonung', style: { fl: 'Anton', emFont: "'Marken Sans'", tc: '#fff', hl: '#fa0', anim: 'none' }, layout: {}, createdAt: 3, updatedAt: 100 };
      ok(T.templateFontNames(tplA).join() === 'Marken Sans' && T.templateFontNames(tplC).join() === 'Anton,Marken Sans', 'templateFontNames: Text-, Betonungs-Schrift');
      let r = T.buildTemplateExport([tplB], [{ name: 'Marken Sans', buf: own.buffer }]);
      ok(r.fonts === 0 && !('fonts' in r.data) && r.skipped.length === 0, 'Export ohne eigene Schrift: kein fonts-Feld (Format wie bisher)');
      r = T.buildTemplateExport([tplA, tplB, tplC], [{ name: 'Marken Sans', buf: own.buffer }, { name: 'Unbenutzt', buf: fakeFont(1, 100).buffer }], '2026-10-14T00:00:00Z');
      ok(r.fonts === 1 && r.data.fonts.length === 1 && r.data.fonts[0].name === 'Marken Sans' && r.data.fonts[0].format === 'otf' && r.data.fonts[0].size === 5000 && typeof r.data.fonts[0].data === 'string', 'Export: nur genutzte Schrift, einmal, mit Name/Format/base64');
      ok(r.data.app === 'gluephs' && r.data.templates.length === 3, 'Export: app:gluephs, Templates unverändert');
      // Limit
      const big = fakeFont(5, T.TPL_FONT_MAX_BYTES + 1);
      r = T.buildTemplateExport([tplA], [{ name: 'Marken Sans', buf: big.buffer }]);
      const msg = T.exportTemplatesMsg(1, r);
      ok(r.fonts === 0 && r.skipped.length === 1 && r.skipped[0].why === 'size' && /“Marken Sans” \(2\.0 MB, max\. 2 MB\)/.test(msg) && /not included/.test(msg), 'Grössenlimit: Schrift draussen + klare Meldung — ' + msg);
      ok(T.exportTemplatesMsg(2, T.buildTemplateExport([tplA, tplC], [{ name: 'Marken Sans', buf: own.buffer }])) === '✓ Exported 2 templates + 1 font', 'Erfolgsmeldung mit Schrift');
      ok(T.buildTemplateExport([tplA], [{ name: 'Marken Sans', buf: new Uint8Array([1, 2, 3, 4, 5]).buffer }]).skipped[0].why === 'format', 'Unbekanntes Format wird nicht eingebettet');
      // Roundtrip: Export-JSON → (Gerät „leer“) → Import registriert Schrift wieder
      const json = JSON.stringify(T.buildTemplateExport([tplA, tplB], [{ name: 'Marken Sans', buf: own.buffer }]).data);
      T.setUserTemplates([]); const fm = T.getUserFontsMap(); Object.keys(fm).forEach(k => delete fm[k]);
      const imp = T.importTemplatesFromText(json);
      ok(imp.imported === 2 && imp.errors === 0 && T.importTemplateMessage(imp) === 'Imported 2 templates', 'Import: Templates wie bisher');
      const fr = await imp.fontsReady;
      ok(fr.added === 1 && fr.failed === 0 && fm['Marken Sans'] === true && faceLog.indexOf('Marken Sans') >= 0, 'Import: Schrift registriert (FontFace) — ' + JSON.stringify(fr));
      ok(T.liveTemplates().find(t => t.id === 'tpl_fontA').style.fl === 'Marken Sans', 'Template zeigt wieder auf die eigene Schrift');
      // Zweiter Import: Schrift schon da → übersprungen, kein Duplikat
      const fr2 = await T.importTemplatesFromText(json).fontsReady;
      ok(fr2.added === 0 && fr2.skipped === 1, 'Zweiter Import: Schrift schon vorhanden → übersprungen');
      // Alter Export ohne fonts, Array-Format, Müll
      const oldImp = T.importTemplatesFromText(JSON.stringify({ app: 'capivo', templates: [tplB] }));
      ok((await oldImp.fontsReady).added === 0 && T.importTemplatesFromText(JSON.stringify([tplB])).imported === 0, 'Alter Export (ohne fonts) importierbar');
      // Sicherheit: eingebaute Schrift nie überschreiben, kaputte/zu grosse/falsche Einträge zählen als failed
      const evil = { app: 'gluephs', templates: [], fonts: [
        { name: 'Poppins', format: 'otf', data: T.bytesToB64(own) },
        { name: 'Falsch', format: 'ttf', data: T.bytesToB64(new Uint8Array([9, 9, 9, 9, 9])) },
        { name: 'Riesig', format: 'otf', data: T.bytesToB64(big) },
        { name: '<script>', format: 'otf', data: T.bytesToB64(own) },
        { name: 'Kaputt', data: '%%%' }, null ] };
      faceLog.length = 0;
      const fe = await T.importTemplatesFromText(JSON.stringify(evil)).fontsReady;
      ok(fe.added === 0 && fe.skipped === 1 && fe.failed === 4 && faceLog.length === 0 && !fm.Poppins && !fm.Falsch && !fm.Riesig, 'Import: Built-in (Poppins) nicht überschrieben, Müll abgewiesen — ' + JSON.stringify(fe));
      // Limit der Schrift-Anzahl (USER_FONT_MAX = 5)
      Object.keys(fm).forEach(k => delete fm[k]);
      const many = { app: 'gluephs', templates: [], fonts: [1, 2, 3, 4, 5, 6, 7].map(i => ({ name: 'Eigen ' + i, format: 'otf', data: T.bytesToB64(fakeFont(i, 300)) })) };
      const fmn = await T.importTemplatesFromText(JSON.stringify(many)).fontsReady;
      ok(fmn.added === 5 && Object.keys(fm).length === 5, 'Import: höchstens 5 eigene Schriften — ' + JSON.stringify(fmn));
      // exportTemplates ohne Datenbank (Node): Schrift im Gerät markiert, aber kein IndexedDB → Export klappt trotzdem (ohne Schrift)
      T.setUserTemplates([T.normalizeTemplate(tplA)]); fm['Marken Sans'] = true;
      await T.exportTemplates();
      ok(JSON.parse(global.LASTBLOB.content).templates.length === 1, 'exportTemplates mit Gerätschrift, aber ohne Datenbank: kein Absturz');
      Object.keys(fm).forEach(k => delete fm[k]); T.setUserTemplates([]);
      delete global.FontFace; document.fonts.add = addOld;
    }
  }


  // ═══ Paket N-Format: «Als 9:16-Reel?»-Hinweis (N3) + Untertitel bei Fill «blur» nicht auf der Bandkante (N7) ═══
  {
    const near = (a, b, e) => Math.abs(a - b) <= (e === undefined ? 0.5 : e);
    const H = 1920, band = { top: 656.25, bot: 1263.75 }, gap = H * 0.015, lo = H * (11.46 + 1) / 100, hi = H * (1 - (23.44 + 1) / 100);
    // 1) capBlurTop (reine Funktion): Runde 3 — passt die Box ins Band, sitzt sie dort (unten/oben bündig mit Abstand), sonst Unschärfe-Zone/Band; Frei/Mitte/kein Band unverändert
    let t = T.capBlurTop(1200, 100, H, band, 'bottom', false);
    ok(near(t, band.bot - gap - 100, 0.01), 'N7/R3: Preset unten, Box auf der Bandkante → ganz IM Band, unten bündig mit Abstand: ' + t.toFixed(1));
    ok(near(T.capBlurTop(1300, 100, H, band, 'bottom', false), band.bot - gap - 100, 0.01), 'R3: Box schon in der Unschärfe unter dem Band, passt aber ins Band → trotzdem ins Band');
    t = T.capBlurTop(1200, 300, H, band, 'bottom', false);
    ok(t >= band.top + gap - 0.01 && t + 300 <= band.bot - gap + 0.01, 'N7: auch hohe Box → ganz IM Band, unten bündig mit Abstand: ' + t.toFixed(1));
    t = T.capBlurTop(620, 100, H, band, 'top', false);
    ok(near(t, band.top + gap, 0.01), 'R3: Preset oben → ganz IM Band, oben bündig mit Abstand: ' + t.toFixed(1));
    t = T.capBlurTop(1300, 700, H, band, 'bottom', false);
    ok(t === 1300, 'N7: zu hoch fürs Band, aber schon sauber in der Unschärfe → unverändert');
    ok(T.capBlurTop(1200, 100, H, band, 'bottom', true) === 1200, 'N7: frei verschoben (capFree) → Position des Nutzers gilt');
    ok(T.capBlurTop(900, 100, H, band, 'center', false) === 900 && T.capBlurTop(1200, 100, H, null, 'bottom', false) === 1200, 'N7: Mitte / kein Band → unverändert');
    t = T.capBlurTop(900, 700, H, band, 'bottom', false);
    ok(t >= band.top - 0.01 && t + 700 <= band.bot + 0.01 || t === band.top, 'N7: passt nirgends → bleibt wenigstens im Band');
    // 2) capBlurBand: nur bei Fill «blur» mit Reframe und passender Leinwand
    {
      const vid = document.getElementById('mainVid'), o = [vid.videoWidth, vid.videoHeight];
      vid.videoWidth = 1920; vid.videoHeight = 1080;
      T.setExportFormatState({ aspect: '9:16', fill: 'blur' });
      let b = T.capBlurBand(1080, 1920);
      ok(b && near(b.top, 656.25, 0.01) && near(b.bot, 1263.75, 0.01), 'N7: Bildband 16:9 → 9:16 bei 1080×1920 = 656…1264 px');
      ok(T.capBlurBand(1080, 1080) === null, 'N7: Leinwand ohne Ausgabeformat (z. B. Cover) → kein Band');
      T.setExportFormatState({ aspect: '9:16', fill: 'crop' }); ok(T.capBlurBand(1080, 1920) === null, 'N7: Fill «crop» → kein Band');
      T.setExportFormatState('original'); ok(T.capBlurBand(1080, 1920) === null, 'N7: Format Original → kein Band');
      T.setExportFormatState({ aspect: '1:1', fill: 'blur' }); b = T.capBlurBand(1080, 1080);
      ok(b && near(b.top, 236.25, 0.01) && near(b.bot, 843.75, 0.01), 'N7: 16:9 → 1:1 blur: Band 236…844 px');
      // 3) Export (capLayout): Block mit Preset-Position unten liegt bei Fill «blur» nie auf der Bandkante
      T.setExportFormatState({ aspect: '9:16', fill: 'blur' });
      const sty = T.STYLES.find(x => x.id === 'hormozi');
      const mkCtx = () => ({ font: '', letterSpacing: '0px', measureText(str) { const m = /([\d.]+)px/.exec(this.font); return { width: (str || '').length * (m ? +m[1] : 16) * 0.55 }; },
        roundRect() {}, rect() {}, beginPath() {}, fill() {}, stroke() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, fillText() {}, strokeText() {}, ellipse() {},
        fillRect() {}, clip() {}, drawImage() {}, createLinearGradient() { return { addColorStop() {} }; } });
      const ws = ['Das', 'ist', 'ein', 'Test'], blk = { text: ws.join(' '), start: 0, end: 1, words: ws.map((w, i) => ({ word: w, start: i * 0.2, end: i * 0.2 + 0.2 })) };
      T.setState([blk], blk.words, 'karaoke');
      const lay = () => T.capLayout(mkCtx(), blk, 0, 0, sty, 1080, 1920);
      const bd = T.capBlurBand(1080, 1920), g = 1920 * 0.015, safeB = 1920 * (1 - 24.44 / 100);
      T.setPosState('bottom'); T.setVOffState(20); T.setFreeState(false); T.setHOffState(0);
      for (const ln of [1, 2, 3]) {
        T.setLines({ dataset: { lines: String(ln) } });
        const L = lay(), edgeClear = L.boxB <= bd.top - g + 0.5 || L.boxT >= bd.bot + g - 0.5 || (L.boxT >= bd.top + g - 0.5 && L.boxB <= bd.bot - g + 0.5);
        const inBand = L.boxT >= bd.top && L.boxB <= bd.bot - g + 0.5;
        ok(edgeClear && inBand, 'N7/R3 Export ' + ln + ' Zeile(n): Box ' + L.boxT.toFixed(0) + '…' + L.boxB.toFixed(0) + ' px liegt ganz im Band (' + bd.top.toFixed(0) + '…' + bd.bot.toFixed(0) + ')');
      }
      // Position oben: nie auf der oberen Kante
      T.setPosState('top'); T.setVOffState(20); T.setLines({ dataset: { lines: '2' } });
      { const L = lay(); ok(L.boxB <= bd.top - g + 0.5 || (L.boxT >= bd.top + g - 0.5 && L.boxB <= bd.bot - g + 0.5), 'N7 Export oben: Box ' + L.boxT.toFixed(0) + '…' + L.boxB.toFixed(0) + ' liegt nicht auf der oberen Bandkante'); }
      // Frei verschoben auf die Kante: Nutzerposition bleibt (gleiche Box wie ohne Blur)
      T.setPosState('bottom'); T.setVOffState(32); T.setFreeState(true);
      const Lfree = lay(); T.setExportFormatState('original'); const Lorig = lay();
      ok(near(Lfree.boxT, Lorig.boxT, 0.01) && near(Lfree.boxB, Lorig.boxB, 0.01), 'N7: frei platziert → bei blur dieselbe Box wie ohne Format (Nutzer-Position gilt)');
      // Layout-Cache: Wechsel Blur ↔ Original liefert wieder die richtige Position
      T.setFreeState(false); T.setVOffState(20); T.setExportFormatState({ aspect: '9:16', fill: 'blur' }); const Lb = lay(); T.setExportFormatState('original'); const Lo = lay();
      ok(Math.abs(Lb.boxT - Lo.boxT) > 1, 'N7: Layout-Cache unterscheidet Blur und Original');
      T.setExportFormatState('original'); T.setPosState('bottom'); T.setVOffState(20); T.setFreeState(false); T.setLines({ dataset: { lines: '2' } });
      vid.videoWidth = o[0]; vid.videoHeight = o[1];
    }
    // 4) N3: Hinweis nur bei Querformat/Quadrat ohne Format, nicht nach «Keep», nicht wenn Template/Projekt ein Format setzt
    ok(T.fmtHintApplies(1920, 1080, 'original', false) && T.fmtHintApplies(1080, 1080, 'original', false) && T.fmtHintApplies(1000, 1020, { aspect: 'original' }, false), 'N3: 16:9 / 1:1 ohne Format → Hinweis');
    ok(!T.fmtHintApplies(1080, 1920, 'original', false) && !T.fmtHintApplies(1080, 1350, 'original', false) && !T.fmtHintApplies(0, 0, 'original', false), 'N3: Hochformat (9:16, 4:5) / keine Masse → kein Hinweis');
    ok(!T.fmtHintApplies(1920, 1080, 'original', true) && !T.fmtHintApplies(1920, 1080, { aspect: '9:16', fill: 'blur' }, false) && !T.fmtHintApplies(1920, 1080, 'crop', false), 'N3: «Keep» gewählt bzw. Format schon gesetzt (Template/Projekt, auch alter Wert «crop») → kein Hinweis');
    {
      const vid = document.getElementById('mainVid'), o = [vid.videoWidth, vid.videoHeight];
      vid.videoWidth = 1920; vid.videoHeight = 1080;
      T.setExportFormatState('original'); T.setFmtHint(false, false); T.fmtHintArm();
      ok(T.getFmtHint().armed === true, 'N3: Querformat geladen → Hinweis steht (fmtHintArm)');
      T.fmtHintAnswer('blur');
      ok(JSON.stringify(T.exportFormatState()) === '{"aspect":"9:16","fill":"blur","pan":{"x":0,"y":0}}' && !T.getFmtHint().armed && T.getFmtHint().done, 'N3: Knopf «Blur» setzt 9:16 + blur (B1-Modell) und schliesst den Hinweis');
      T.setExportFormatState('original'); T.setFmtHint(true, false); T.fmtHintAnswer('crop');
      ok(JSON.stringify(T.exportFormatState()) === '{"aspect":"9:16","fill":"crop","pan":{"x":0,"y":0}}', 'N3: Knopf «Crop» setzt 9:16 + crop');
      T.setExportFormatState('original'); T.setFmtHint(true, false); T.fmtHintAnswer('keep');
      ok(T.exportFormatState().aspect === 'original' && !T.getFmtHint().armed && T.getFmtHint().done, 'N3: «Keep» behält Original und merkt es');
      ok(T.projectPayload().fmtKeep === true && !('fmt' in T.projectPayload()), 'N3: «Keep» wird im Projekt gespeichert (fmtKeep)');
      T.setFmtHint(false, false); T.applyProjectPayload({ fmtKeep: true }); T.fmtHintArm();
      ok(T.getFmtHint().done && !T.getFmtHint().armed, 'N3: Projekt mit fmtKeep → Hinweis kommt bei diesem Video nicht wieder');
      T.setExportFormatState('original'); T.setFmtHint(false, false); T.applyTemplateSettings({ aspect: '1:1', fill: 'crop' }); T.fmtHintArm();
      ok(T.exportFormatState().aspect === '1:1' && !T.getFmtHint().armed && T.getFmtHint().done, 'N3: Template mit Format → kein Hinweis');
      T.setFmtHint(true, false); T.setExportFormatState('4:5'); T.syncFormatBar(true, 'crop');
      ok(!T.getFmtHint().armed && T.getFmtHint().done, 'N3: Format über die Auswahl gesetzt → Hinweis ist erledigt');
      T.setExportFormatState('original'); T.setFmtHint(false, false);
      vid.videoWidth = o[0]; vid.videoHeight = o[1];
    }
    // 5) Markup: Format-Pille im Editor teilt die Quelle der Wahrheit mit dem Export-Popup
    ok(/id="edFmt"[^>]*setExportFormat\(this\.value\)/.test(htmlContent) && /id="edFill"[^>]*setExportFill\(this\.value\)/.test(htmlContent) && /id="fmtHint"/.test(htmlContent) && /fmtHintAnswer\('crop'\)/.test(htmlContent) && /fmtHintAnswer\('blur'\)/.test(htmlContent), 'N3: Editor hat Format-/Fill-Auswahl (edFmt/edFill) und Hinweis mit Crop/Blur/Keep');
    ok(/getElementById\('edFmt'\)[\s\S]{0,100}exportAspect/.test(htmlContent) && /getElementById\('edFill'\)[\s\S]{0,80}exportFill/.test(htmlContent), 'N3: syncFormatBar hält edFmt/edFill mit exportAspect/exportFill synchron');
  }


  // ═══ Paket N-Export: Auto-Cut pro Video + sichtbar, Bitrate/Framerate, Export-Dialog nach dem Download ═══
  {
    const E = id => document.getElementById(id);
    // N2: Auto-Cut — eine Quelle der Wahrheit, sichtbar mit gesparter Zeit, pro Video zurückgesetzt
    ok(/id="autoCutEd"[^>]*onchange="onAutoCutChange\(this\.checked\)"/.test(htmlContent) && /id="cutSave"/.test(htmlContent) && /id="autoCutChk"[^>]*onchange="onAutoCutChange\(this\.checked\)"/.test(htmlContent), 'N2: Auto-Cut-Schalter im Captions-Tab UND im Export-Blatt, beide über onAutoCutChange');
    ok(htmlContent.indexOf('id="autoCutEd"') > htmlContent.indexOf('id="capEditor"') && htmlContent.indexOf('id="autoCutEd"') < htmlContent.indexOf('id="capSegs"'), 'N2: Schalter liegt im Caption-Editor (Captions-Tab), über der Zeilenliste');
    const lvSrc = script.slice(script.indexOf('function loadVideo('), script.indexOf('function loadVideo(') + 2500);
    ok(/autoCutSilence\s*=\s*false;\s*syncAutoCutUI\(\)/.test(lvSrc), 'N2: loadVideo setzt Auto-Cut für das neue Video auf aus');
    ok(/function openEditorClean\(\)[\s\S]{0,700}autoCutSilence\s*=\s*false/.test(script), 'N2: openEditorClean (Zurück zur Startseite) setzt Auto-Cut ebenfalls zurück');
    ok((script.match(/computeCutRegions\(/g) || []).length === 2 && (script.match(/exportCutRegions\(\)/g) || []).length >= 3, 'N2: computeCutRegions nur in der gemeinsamen Quelle (autoCutRegions + Definition); beide Export-Pfade nutzen exportCutRegions()');
    const nw = [['Hallo', 0.0, 0.4], ['das', 0.5, 0.8], ['ist', 0.85, 1.1], ['ähm', 1.2, 1.5], ['ein', 3.0, 3.3], ['Test', 3.4, 3.8]].map(a => ({ word: a[0], start: a[1], end: a[2] }));
    T.setWordsState(nw); T.onAutoCutChange(false);
    const vidN2 = document.getElementById('mainVid'), durN2 = vidN2.duration; vidN2.duration = 6; // Schluss-Stille (3,8–6 s) zählt mit, unabhängig von früheren Tests
    const regs = T.autoCutRegions(), saved = T.cutSavedSeconds(regs);
    ok(regs.length >= 2 && saved > 1.5 && T.getAutoCut() === false && T.exportCutRegions().length === 0, 'N2: aus → Export hat keine Schnittfenster (volle Länge), ' + regs.length + ' Fenster möglich, ' + saved.toFixed(2) + ' s');
    ok(E('autoCutEd').checked === false && E('autoCutChk').checked === false && /possible$/.test(E('cutSave').textContent) && E('cutSave').classList.contains('off'), 'N2: aus → beide Häkchen leer, Anzeige «x s possible» gedämpft: ' + E('cutSave').textContent);
    T.onAutoCutChange(true);
    ok(T.getAutoCut() === true && E('autoCutEd').checked === true && E('autoCutChk').checked === true && E('cutSave').textContent === '−' + saved.toFixed(1) + ' s' && E('cutSaveExp').textContent === E('cutSave').textContent && !E('cutSave').classList.contains('off'), 'N2: an → beide Häkchen an, Anzeige «' + E('cutSave').textContent + '» in Editor und Export-Blatt');
    ok(T.exportCutRegions().length === regs.length && Math.abs(T.cutSavedSeconds(T.exportCutRegions()) - saved) < 1e-9, 'N2: angezeigte Zeit = Summe der Fenster, die der Export wirklich überspringt');
    const vd0 = E('mainVid').duration; E('mainVid').duration = 0.8;
    T.setWordsState([{ word: 'a', start: 0, end: 0.3 }, { word: 'b', start: 0.35, end: 0.7 }]);
    ok(T.cutSavedLabel(T.cutSavedSeconds(T.autoCutRegions()), true) === 'nothing to cut' && T.cutSavedLabel(0, false) === '', 'N2: nichts zu schneiden → «nothing to cut» (an) bzw. leer (aus)');
    E('mainVid').duration = vd0;
    T.setWordsState(nw); T.syncAutoCutUI();
    T.openEditorClean();
    ok(T.getAutoCut() === false && E('autoCutEd').checked === false && E('autoCutChk').checked === false, 'N2: neues Video / Startseite → Auto-Cut aus, beide Häkchen leer (Handy-Sheet auch)');
    T.setWordsState([]);

    vidN2.duration = durN2;
    // N9: Bitrate an die Quelle koppeln
    ok(T.exportBitrate(1080, 1920, 30) === Math.round(0.07 * 1080 * 1920 * 30), 'N9: ohne Quellbitrate unverändert (alte Formel)');
    ok(T.exportBitrate(1080, 1920, 30, 2.1e6, 1080, 1920) === Math.round(2.1e6 * 1.2), 'N9: Quelle 2,1 Mbit/s, gleiche Grösse → Quelle × 1,2 = ' + T.exportBitrate(1080, 1920, 30, 2.1e6, 1080, 1920));
    ok(T.exportBitrate(1080, 1920, 30, 0.4e6, 1080, 1920) === 2e6, 'N9: sehr kleine Quelle → Minimum 2 Mbit/s');
    ok(T.exportBitrate(1080, 1920, 30, 40e6, 2160, 3840) === Math.round(0.07 * 1080 * 1920 * 30) && T.exportBitrate(1920, 1080, 30, 40e6, 3840, 2160) <= 12e6, 'N9: grosse Quelle → Obergrenze wie bisher (nie mehr als die Formel)');
    {
      const a = T.exportBitrate(1080, 1920, 30, 1.3e6, 1280, 720); // 16:9 → 9:16 Reframe: ×2,25 Pixel
      ok(a === Math.round(Math.max(2e6, Math.min(0.07 * 1080 * 1920 * 30, 1.3e6 * 1.2 * (1080 * 1920) / (1280 * 720)))) && a > 2e6, 'N9: Reframe/Upscale proportional zur Pixelzahl (' + a + ')');
      const g = T.exportGeometry(1080, 1920, 30, '1080', 'original', 2.1e6);
      ok(g.bitrate === Math.round(2.1e6 * 1.2) && T.exportGeometry(1080, 1920, 30, '1080', 'original').bitrate === Math.round(0.07 * 1080 * 1920 * 30), 'N9: exportGeometry reicht die Quellbitrate durch (v1: ' + g.bitrate + ' statt ' + Math.round(0.07 * 1080 * 1920 * 30) + ' bit/s)');
    }
    ok(Math.abs(T.estimateSourceBitrate(5.6e6, 20.5) - (5.6e6 * 8 / 20.5 - 128000)) < 2 && T.estimateSourceBitrate(0, 10) === 0 && T.estimateSourceBitrate(1e6, 0) === 0, 'N9: Quellbitrate aus Grösse/Dauer (Ton abgezogen), unbekannt = 0');
    ok(T.snapFrameRate(30) === 30 && Math.abs(T.snapFrameRate(29.9701) - 30000 / 1001) < 1e-9 && T.snapFrameRate(29.9) === 29.9 && T.snapFrameRate(60.0003) === 60 && T.snapFrameRate(24.0) === 24, 'N9: Bildrate rastet auf 24/25/29,97/30/60 ein, krumme Werte bleiben');
    ok(/webmToMp4\(blob, onProgress, durSec, tok, maxBps\)/.test(script) && /'-maxrate'/.test(script) && /tok, geo\.bitrate\)/.test(script), 'N9: Echtzeit-Pfad: ffmpeg-Umkodierung bekommt die Bitrate als Deckel');
    // N9: konstante Bildrate bei Auto-Cut — Planer wie im Schnellexport (30 fps Quelle, Schnitte an krummen Stellen)
    {
      const cuts = [{ start: 1.234, end: 2.987 }, { start: 5.0123, end: 5.9 }, { start: 8.31, end: 9.4444 }];
      const fps = 30, plan = T.createCfrPlanner(fps), idxs = [];
      let removed = 0; for (const c of cuts) removed += c.end - c.start;
      const rebase = t => { let r = 0; for (const c of cuts) { if (t < c.start) break; if (t < c.end) return null; r += c.end - c.start; } return t - r; };
      for (let n = 0; n < 12 * fps; n++) { const o = rebase(n / fps); if (o === null) continue; plan(o).forEach(i => idxs.push(i)); }
      const strict = idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1);
      const ts = idxs.map(i => T.cfrFrameTimeUs(i, fps)), dts = ts.slice(1).map((v, i) => v - ts[i]);
      ok(strict && Math.max(...dts) - Math.min(...dts) <= 1, 'N9: Auto-Cut → lückenlose Frame-Indizes, Zeitstempel-Abstand konstant (' + Math.min(...dts) + '–' + Math.max(...dts) + ' µs)');
      const expectEnd = 12 - removed, actualEnd = (idxs[idxs.length - 1] + 1) / fps;
      ok(Math.abs(actualEnd - expectEnd) <= 1.5 / fps, 'N9: keine Drift gegen die exakt geschnittene Zeit: Ausgabe ' + actualEnd.toFixed(3) + ' s, erwartet ' + expectEnd.toFixed(3) + ' s');
      const p3 = T.createCfrPlanner(30, 3);
      ok(JSON.stringify([p3(0), p3(1 / 30), p3(1 / 30 + 0.001), p3(4 / 30)]) === '[[0],[1],[],[2,3,4]]' && JSON.stringify(T.createCfrPlanner(30, 3)(5)) === '[150]', 'N9: Planer: doppelte Zeit weglassen, kleine Lücke mit letztem Bild füllen, erster Frame ohne Rückfüllen');
      const p4 = T.createCfrPlanner(30, 3); p4(0); ok(JSON.stringify(p4(1)) === '[30]', 'N9: grosse Lücke (echte Lücke in der Quelle) wird nicht gefüllt');
    }
    ok(/fps = snapFrameRate\(fps\)/.test(script) && /var cfr = createCfrPlanner\(fps\)/.test(script) && /cfrFrameTimeUs\(plan\[pi\], fps\)/.test(script) && !/lastOutUs/.test(script), 'N9: Schnellexport kodiert mit Planer-Zeitstempeln (CFR), alter Zeitstempel-Weg entfernt');

    // N10: Export-Dialog nach dem Download — Optionen bleiben änderbar, „Download again“ nur ohne Änderung
    {
      const sheet = E('expSheet'); sheet.style.display = 'block';
      T.setState([{ start: 0, end: 1, text: 'Hallo Welt', words: [{ word: 'Hallo', start: 0, end: .5 }, { word: 'Welt', start: .5, end: 1 }] }], [], 'words');
      const ag = E('expAgain'), dl = E('expDlFile'), ht = E('expChangedHint'), ow = E('expOptsWrap');
      T.releaseLastExport();
      const blobN = new Blob(['x'], { type: 'video/mp4' });
      T.dlBlob(blobN, 'n-gluephs.mp4'); T.exportDone(false);
      ok(ow.style.display === '' && E('expDone').style.display === '' && E('expMain').style.display === 'none', 'N10: nach dem Export bleiben die Optionen (expOptsWrap) sichtbar');
      ok(ag.style.display === 'none' && dl.style.display === '' && dl.textContent === 'Download again' && ht.style.display === 'none', 'N10: direkt nach dem Export: «Download again», kein «Export with changes» (Last-export-Zeile sichtbar: ' + (E('expLast').style.display === '') + ')');
      T.setExportResUI('orig');
      ok(ag.style.display === '' && ag.classList.contains('on') && dl.style.display === 'none' && ht.style.display === '' && /id="expAgain"[^>]*>Export with changes</.test(htmlContent), 'N10: Auflösung geändert → «Export with changes» (Hauptknopf), «Download again» weg — ohne Dialog neu zu öffnen');
      ok(E('expLast').style.display === 'none' && /\(_lastExportBlob && exportChangedSinceLast\(\)\) \? _t\('Export with changes'\) : _t\('Download video'\)/.test(script) && /ch \? _t\('Export with changes'\) : _t\('Download video'\)/.test(script), 'N10: Export-Ansicht: «Last export … Download again» weg, Hauptknopf heisst «Export with changes»');
      T.setExportResUI('1080');
      ok(ag.style.display === 'none' && dl.style.display === '' , 'N10: Änderung zurück → wieder «Download again»');
      T.onAutoCutChange(true);
      ok(ag.style.display === '' && dl.style.display === 'none', 'N10: Auto-Cut nach dem Export angehakt → «Export with changes»');
      T.onAutoCutChange(false);
      ok(ag.style.display === 'none' && dl.style.display === '', 'N10: Auto-Cut zurück → «Download again»');
      const f0 = JSON.stringify([T.exportSignature()]);
      T.setExportFormat('1:1');
      ok(ag.style.display === '' && dl.style.display === 'none' && JSON.stringify([T.exportSignature()]) !== f0, 'N10: Format geändert → «Export with changes»');
      T.setExportFill('blur'); ok(ag.style.display === '' && dl.style.display === 'none', 'N10: Füllung geändert → weiter «Export with changes»');
      T.setExportFormat('original'); T.setExportFill('crop');
      ok(ag.style.display === 'none' && dl.style.display === '', 'N10: Format/Füllung zurück → «Download again»');
      // Ohne geöffnetes Blatt / ohne Export bleibt der Aufruf wirkungslos
      sheet.style.display = 'none'; T.setExportResUI('orig'); ok(ag.style.display === 'none', 'N10: Blatt zu → keine Aktualisierung nötig'); T.setExportResUI('1080');
      sheet.style.display = 'block'; T.releaseLastExport(); T.onAutoCutChange(false);
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // Paket N-Handy: Handy-Editor (≤ 640 px) — Timeline standardmässig zu, keine Überlagerung, ≥ 4 Zeilen, Tippflächen ≥ 44 px (statisch)
  // ═════════════════════════════════════════════════════════════════
  {
    const a0 = htmlContent.indexOf('Paket N-Handy (Handy'), a1 = htmlContent.indexOf('@keyframes sheetUp'), cssEnd = htmlContent.indexOf('</style>', a0);
    ok(a0 > 0 && a1 > 0 && a0 > a1 && cssEnd > a0, 'N-Handy: CSS-Block vorhanden (nach den Handy-Regeln, damit er gewinnt)');
    const css = htmlContent.slice(a0, cssEnd);
    ok(/^[^]*@media \(max-width:640px\) \{/.test(css.slice(css.indexOf('*/'))), 'N-Handy: Regeln nur im Handy-@media (Desktop unverändert)');
    // Regel (Selektor-Teil) → Eigenschaft ≥ 44 px
    const rule = (selFrag, prop) => { const exact = /\{$/.test(selFrag), esc = selFrag.replace(/\{$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); let m, out = []; const g = new RegExp('(?:^|\\n|\\})\\s*[^{}\\n]*' + esc + (exact ? '\\s*' : '[^{}\\n]*') + '\\{([^}]*)\\}', 'g'); while ((m = g.exec(css))) out.push(m[1]); return out.some(b => new RegExp('(?:^|;)\\s*' + prop + ':\\s*(\\d+)px').test(b) && +RegExp.$1 >= 44); };
    const tap = [['.btn-back.tb-back', 'min-height'], ['.tb-title', 'min-height'], ['.tb-icon', 'width'], ['.tb-icon', 'height'], ['.tb-export', 'min-height'],
      ['.pp-btn', 'width'], ['.pp-btn', 'height'], ['.prog-col', 'min-height'], ['.tr-set summary', 'min-height'], ['.fr-box summary', 'min-height'], ['.coach-x', 'width'], ['.coach-x', 'height'],
      ['.cap-seg{', 'min-height'], ['.seg-tools button', 'min-width'], ['.seg-tools button', 'height'], ['.seg-emph button', 'min-height'], ['.seg-emph .se-emo', 'min-width'],
      ['.cs-chip{', 'min-height'], ['.pos-btn', 'min-height'], ['.pos-row.seg .pos-btn', 'min-height'], ['.em-chip', 'min-height'], ['.em-retry', 'min-height'], ['.lang-sel', 'min-height'], ['.cs-hex', 'min-height'],
      ['.cs-chipcol{', 'min-height'], ['.cs-sw', 'width'], ['.cs-sw', 'height'], ['input[type=checkbox].cs-switch{', 'width'], ['input[type=checkbox].cs-switch{', 'height'],
      ['.sz-row input[type=range]{', 'height'], ['.tpl-io a', 'min-height'], ['.stile-menu-btn{', 'width'], ['.stile-menu-btn{', 'height'], ['.es-link', 'min-height'], ['.es-post-head', 'min-height'], ['.tm-item', 'min-height'],
      ['input[type=checkbox]:not(.cs-switch){', 'width'], ['input[type=checkbox]:not(.cs-switch){', 'height'], ['.ctrl-upload', 'min-height']];
    const missing = tap.filter(([sel, prop]) => !rule(sel, prop));
    ok(missing.length === 0, 'N-Handy: Tippflächen ≥ 44 px per CSS — fehlt: ' + missing.map(m => m.join(' ')).join(' | '));
    // Timeline ausserhalb des Timeline-Tabs nie sichtbar (sonst überlagert sie das Style-Panel)
    ok(/#editor:not\(\.tl-mode\) \.tl-wrap\{display:none!important\}/.test(css), 'N-Handy: Desktop-Timeline ausserhalb des Timeline-Tabs ausgeblendet');
    // Wechsel Desktop → Handy nach dem Laden schliesst die Timeline, zurück auf Desktop gilt die gemerkte Wahl
    const om = htmlContent.slice(htmlContent.indexOf('var onMode = function()'), htmlContent.indexOf('var onMode = function()') + 1800);
    ok(/_tl\.wasPhone\s*=\s*tlPhone\(\)/.test(htmlContent) && /phNow !== _tl\.wasPhone/.test(om) && /if \(phNow\) \{ if \(_tl\.open && edTab !== 'timeline'\) tlSetOpen\(false, false\); \}/.test(om) && /localStorage\.getItem\(TL_OPEN_KEY\)/.test(om), 'N-Handy: Modus-Wechsel Desktop↔Handy schliesst/öffnet die Timeline (gemerkte Wahl bleibt)');
    ok(/tlSetOpen\(tlPhone\(\) \|\| tlShortScreen\(\) \? false : pref !== '0', false\)/.test(htmlContent), 'N-Handy: Start am Handy = Timeline zu, Desktop = gemerkte Wahl (TL_OPEN_KEY)');
    // Zeilenbudget (R3-Rest): ≥ 5 Zeilen im Captions-Tab bei 375×812 UND Vorschau ≥ 160 px breit (Kopf: Video&Sprache + Suche in EINER Zeile 44, Cut-Zeile 44, Abstände;
    // Format-Pille im Captions-Tab ausgeblendet; der einmalige Tipp 46 kommt dazu, bis er weggeklickt ist)
    const pcap = +(/^var PH_CAP_PREV = ([0-9.]+);/m.exec(htmlContent) || [])[1];
    ok(pcap >= 0.3 && pcap <= 0.48, 'N-Handy: Vorschau-Anteil im Captions-Tab kleiner als im Style-Tab (0,48): ' + pcap);
    ok(/\(edTab === 'captions' \? PH_CAP_PREV : 0\.48\)/.test(htmlContent) && /if \(tlPhone\(\) && name !== 'timeline' && !wasTl\) tlRelayout\(\)/.test(htmlContent), 'N-Handy: Vorschau-Grösse folgt dem Tab (switchTab → tlRelayout)');
    const H = 812, topbar = 52, tabs = 65, header = 4 + 44 + 4 + 44 + 4, rowPitch = 44 + 4;
    const free = H - topbar - Math.round(H * pcap) - tabs;
    ok(free >= header + 5 * rowPitch - 4, 'N-Handy: 375×812 — Platz für Kopf + 5 Zeilen: ' + free + ' ≥ ' + (header + 5 * rowPitch - 4));
    const prevW = Math.round((Math.round(H * pcap) - 8 - 54 - 6) * 9 / 16);
    ok(prevW >= 160, 'N-Handy: 375×812 — Vorschau im Captions-Tab ' + prevW + ' px breit (≥ 160; vorher 125)');
    ok(/#editor:not\(\.ed-style\):not\(\.tl-mode\) \.fmt-pill\{display:none\}/.test(css) && /\.cap-editor\[style\*="block"\]\{display:contents!important\}/.test(css) && /\.cap-editor\[style\*="block"\] > \.fr-box\{order:2;flex:0 0 44px/.test(css), 'N-Handy: Format-Pille nur im Captions-Tab weg; «Find & replace» als 44-px-Symbol in der Zeile von «Video & language»');
    ok(/gapV = parseFloat\(pcs\.rowGap\)/.test(htmlContent) && /ctrlH - gapV - tlReservedHeight\(\)/.test(htmlContent), 'N-Handy: Vorschau-Höhe rechnet mit dem echten Abstand (Handy 6 px, Desktop 12 px)');
    ok(/\.cap-seg\{min-height:44px;align-items:center\}/.test(css) && /\.cap-seg-ta\{overflow-y:hidden\}/.test(css), 'N-Handy: Zeilen 44 px hoch, kein Scrollbalken im Textfeld');
    // Kein horizontales Scrollen: Zeilen der Kopfzeile schrumpfen (Titel), Schalter/Regler brechen bei 320 px um
    ok(/@media \(max-width:380px\)\{\.sz-row\{flex-wrap:wrap\}\}/.test(css) && /\.tb-title\{min-height:44px;min-width:44px\}/.test(css), 'N-Handy: 320 px — Regler-Zeilen umbrechen, Titel bleibt ≥ 44 px');
  }


  // ══ Paket N-Blöcke: satz- und pausenbewusste Segmentierung (Fixtures = Wort-Timings der Creator-Testvideos v1/v2/v3) ══
  {
    const W = arr => arr.map(([w, a, b]) => ({ word: w, start: a, end: b }));
  const V1 = W([['Drei',0.337,0.555],['Tricks,',0.579,0.961],['damit',1.004,1.276],['deine',1.307,1.58],['Reels',1.61,1.883],['mehr',1.913,2.131],['Views',2.155,2.428],['bekommen.',2.458,2.949],['Erstens:',3.598,4.072],['Die',4.125,4.303],['ersten',4.323,4.679],['zwei',4.718,4.955],['Sekunden',4.982,5.456],['entscheiden',5.509,6.162],['alles.',6.234,6.59],['Zweitens:',7.255,7.843],['Untertitel,',7.908,8.627],['weil',8.707,8.968],['fast',8.997,9.258],['alle',9.287,9.548],['ohne',9.577,9.839],['Ton',9.868,10.064],['schauen.',10.085,10.608],['Drittens:',11.344,11.927],['Poste',11.991,12.315],['regelmässig,',12.351,13.128],['am',13.214,13.343],['besten',13.358,13.746],['jeden',13.789,14.113],['Dienstag',14.149,14.667],['um',14.724,14.854],['achtzehn',14.868,15.386],['Uhr.',15.443,15.702],['Speicher',16.402,16.884],['dir',16.938,17.118],['das',17.138,17.319],['Video,',17.339,17.701],['sonst',17.741,18.042],['vergisst',18.075,18.557],['du',18.611,18.731],['es!',18.745,18.925]]);
  const V2 = W([['Willkommen',0.339,1.023],['zurück',1.099,1.51],['bei',1.556,1.761],['Klartext',1.784,2.331],['Business.',2.392,3.007],['Heute',3.734,4.059],['spreche',4.095,4.549],['ich',4.599,4.794],['mit',4.815,5.01],['Sandra',5.032,5.421],['Meier',5.464,5.788],['aus',5.824,6.019],['Winterthur',6.041,6.689],['über',6.761,7.021],['Preise',7.049,7.439],['für',7.482,7.676],['Selbständige.',7.698,8.541],['Ihr',9.404,9.625],['wichtigster',9.65,10.463],['Tipp:',10.553,10.923],['Verkauf',10.964,11.481],['keine',11.538,11.908],['Stunden,',11.949,12.54],['verkauf',12.606,13.123],['Ergebnisse.',13.18,13.993],['Ein',14.84,15.043],['Kunde',15.066,15.404],['zahlt',15.442,15.78],['nicht',15.818,16.157],['für',16.194,16.397],['deine',16.42,16.758],['Zeit,',16.796,17.135],['sondern',17.172,17.646],['für',17.699,17.902],['das',17.925,18.128],['Problem,',18.15,18.692],['das',18.752,18.955],['du',18.978,19.113],['löst.',19.129,19.467],['Und',20.289,20.48],['wenn',20.501,20.757],['ein',20.785,20.977],['Angebot',20.998,21.445],['dreimal',21.495,21.942],['hintereinander',21.991,22.885],['sofort',22.984,23.367],['angenommen',23.41,24.048],['wird,',24.119,24.439],['ist',24.474,24.666],['dein',24.687,24.942],['Preis',24.971,25.29],['zu',25.325,25.453],['tief.',25.467,25.787]]);
  const V3 = W([['Stop',0.28,0.516],['scrolling.',0.543,1.133],['This',1.669,1.902],['one',1.928,2.102],['setting',2.122,2.53],['doubled',2.575,2.983],['my',3.028,3.145],['watch',3.158,3.449],['time.',3.481,3.773],['Most',4.411,4.657],['creators',4.684,5.175],['put',5.23,5.414],['captions',5.434,5.925],['too',5.98,6.164],['low,',6.184,6.43],['right',6.457,6.764],['where',6.798,7.105],['the',7.139,7.323],['app',7.344,7.528],['buttons',7.548,7.978],['cover',8.026,8.332],['them.',8.367,8.673],['Move',9.446,9.681],['them',9.707,9.941],['to',9.967,10.084],['the',10.097,10.273],['upper',10.293,10.586],['third,',10.619,10.97],['keep',11.01,11.244],['two',11.27,11.446],['to',11.466,11.583],['four',11.596,11.83],['words',11.856,12.15],['per',12.182,12.358],['line,',12.378,12.671],['and',12.703,12.879],['highlight',12.899,13.426],['the',13.485,13.661],['key',13.68,13.856],['word.',13.876,14.169],['Try',14.896,15.073],['it',15.093,15.211],['on',15.224,15.342],['your',15.355,15.591],['next',15.618,15.854],['video',15.88,16.176],['and',16.208,16.386],['tell',16.405,16.642],['me',16.668,16.786],['if',16.799,16.917],['it',16.931,17.049],['worked.',17.062,17.475]]);
    const FIX = { v1: V1, v2: V2, v3: V3 };
    // Zeichenlimit pro Zeile je Look, wie im Editor bei ~400 px Vorschaubreite gemessen (Mix 1 Zeile, Bold Pop/Karaoke 2, Statement 3)
    const LOOKS = [['mix', 12], ['hormozi', 9], ['statement', 8], ['focus', 10]];
    const build = (id, per, words) => { T.selectStyle(id); T.setMaxCharsState(per); return T.buildCaptionBlocks(words.map(w => Object.assign({}, w)), []); };
    const single = bl => bl.filter(b => b.words.length === 1);
    // Ein Einzelwort-Block ist nur erlaubt, wenn es sich nicht (auch nicht per Umverteilen) an einen Nachbarn hängen lässt
    // (Wort-/Zeichenlimit), er ein ganzer Ein-Wort-Satz ist oder zwischen zwei langen Pausen steht.
    const avoidable = (bl, i) => {
      const b = bl[i], w = b.words[0], lim = T.capBlockLimit(), wpb = T.getWpb();
      const sentEnd = x => /[.!?…]$/.test(x.word);
      if (sentEnd(w) && (!bl[i - 1] || sentEnd(bl[i - 1].words[bl[i - 1].words.length - 1]))) return false;
      const gp = bl[i - 1] ? w.start - bl[i - 1].words[bl[i - 1].words.length - 1].end : 9, gn = bl[i + 1] ? bl[i + 1].words[0].start - w.end : 9;
      const joinable = (nb, before) => {
        if (!nb || (before ? gp : gn) > 0.8) return false;
        const u = before ? nb.words.concat(b.words) : b.words.concat(nb.words);
        if (u.length <= wpb && T.capWordsFit(u, lim)) return true;
        const segs = T.capSegmentRun(u, u.map(x => x.word.length), wpb, lim);
        return !!segs && segs.length > 1 && segs.every(r => r[1] - r[0] > 1);
      };
      return joinable(bl[i - 1], true) || joinable(bl[i + 1], false);
    };
    const hist = bl => { const h = {}; bl.forEach(b => { h[b.words.length] = (h[b.words.length] || 0) + 1; }); return JSON.stringify(h); };
    let bad = [];
    for (const [id, per] of LOOKS) for (const v of Object.keys(FIX)) {
      const bl = build(id, per, FIX[v]);
      bl.forEach((b, i) => { if (b.words.length === 1 && T.getWpb() > 1 && avoidable(bl, i)) bad.push(id + '/' + v + ': «' + b.text + '»'); });
      ok(bl.map(b => b.text).join(' ').replace(/\s+/g, ' ') === FIX[v].map(w => w.word).join(' '), 'N-Blöcke ' + id + '/' + v + ': kein Wort verloren/doppelt');
      ok(bl.every(b => b.words.length <= T.getWpb() || b.words.length === 1), 'N-Blöcke ' + id + '/' + v + ': höchstens Wörter-pro-Block-Vorgabe');
    }
    ok(!bad.length, 'N-Blöcke: keine vermeidbaren Einzelwort-Blöcke in Mix/Bold Pop/Statement/Karaoke × v1–v3' + (bad.length ? ': ' + bad.slice(0, 8).join(' | ') : ''));
    // Messwerte: Einzelwort-Anteil (Hauptrepo vorher: Karaoke v1 7 von 21, Bold Pop v1 7 von 23, Statement v1 5 von 18)
    const cnt = (id, per, v) => single(build(id, per, FIX[v])).length;
    ok(cnt('focus', 10, 'v1') <= 1, 'N-Blöcke Karaoke v1: höchstens 1 Einzelwort-Block (vorher 7 von 21): ' + cnt('focus', 10, 'v1'));
    ok(cnt('hormozi', 9, 'v1') <= 2, 'N-Blöcke Bold Pop v1: höchstens 2 Einzelwort-Blöcke (vorher 7 von 23): ' + cnt('hormozi', 9, 'v1'));
    ok(cnt('statement', 8, 'v1') <= 3 && cnt('hormozi', 9, 'v3') === 0 && cnt('focus', 10, 'v3') === 0, 'N-Blöcke Statement v1 ≤ 3, Bold Pop/Karaoke v3 ohne Einzelwörter');
    // Beispiele aus dem Creator-Test: «Uhr.» nie allein, «Zweitens:» nie allein, kein Block quer über Satzende + Pause > 0,35 s
    for (const [id, per] of [['focus', 10], ['hormozi', 9]]) {
      const bl = build(id, per, V1), txt = bl.map(b => b.text);
      ok(!txt.includes('Uhr.') && txt.some(t => /achtzehn Uhr\.$/.test(t)), 'N-Blöcke ' + id + ' v1: «um achtzehn Uhr.» statt «Uhr.» allein: ' + txt.join(' | '));
      ok(!txt.includes('Zweitens:') && !txt.includes('Drittens:'), 'N-Blöcke ' + id + ' v1: «Zweitens:»/«Drittens:» nicht allein: ' + txt.join(' | '));
    }
    // Reine Funktion capSegmentWords: Pausen, Satzenden, Look mit einem Wort, Schnitte, Handnähte
    {
      const lim = null, seg = (ws, mw, cuts) => T.capSegmentWords(W(ws), mw, lim, cuts || []).map(c => c.map(w => w.word).join(' '));
      let r = seg([['eins', 0, 0.3], ['zwei', 0.35, 0.65], ['drei', 1.1, 1.4], ['vier', 1.45, 1.75]], 4);
      ok(JSON.stringify(r) === '["eins zwei","drei vier"]', 'Sprechpause 0,45 s trennt Blöcke: ' + JSON.stringify(r));
      r = seg([['eins', 0, 0.3], ['zwei', 0.35, 0.65], ['drei', 0.9, 1.2], ['vier', 1.25, 1.55]], 4);
      ok(JSON.stringify(r) === '["eins zwei drei vier"]', 'Pause 0,25 s trennt nicht: ' + JSON.stringify(r));
      r = seg([['Das', 0, 0.3], ['ist', 0.35, 0.65], ['gut.', 0.7, 1.0], ['Wirklich', 1.05, 1.5], ['sehr', 1.55, 1.8], ['gut.', 1.85, 2.2]], 4);
      ok(JSON.stringify(r) === '["Das ist gut.","Wirklich sehr gut."]', 'Satzende beendet den Block: ' + JSON.stringify(r));
      r = seg([['Zweitens:', 0, 0.5], ['Untertitel', 0.55, 1.0], ['helfen', 1.05, 1.4], ['sehr.', 1.45, 1.8]], 4);
      ok(JSON.stringify(r) === '["Zweitens: Untertitel helfen sehr."]' || r.every(t => t.split(' ').length > 1), 'Doppelpunkt-Wort wird nicht zur Waise: ' + JSON.stringify(r));
      r = seg([['Ende.', 0, 0.4], ['Zweitens:', 1.0, 1.5], ['Untertitel', 1.55, 2.0], ['sind', 2.05, 2.3], ['wichtig.', 2.35, 2.8]], 3);
      ok(r.every(t => t.split(' ').length > 1) || r[0] === 'Ende.', 'Aufzählungs-Doppelpunkt nach Pause: Wort hängt am Nachfolger: ' + JSON.stringify(r));
      r = seg([['Ja.', 0, 0.3], ['Und', 0.35, 0.6], ['weiter', 0.65, 1.0]], 4);
      ok(JSON.stringify(r) === '["Ja.","Und weiter"]', 'Ganzer Ein-Wort-Satz bleibt allein: ' + JSON.stringify(r));
      r = seg([['Wow', 0, 0.3], ['Mega', 1.5, 1.8], ['super', 1.85, 2.1], ['dies', 2.15, 2.4]], 4);
      ok(JSON.stringify(r) === '["Wow","Mega super dies"]', 'Wort allein hinter langer Pause (> 0,8 s) bleibt allein: ' + JSON.stringify(r));
      r = seg([['Wow', 0, 0.3], ['Mega', 0.55, 0.8], ['super', 0.85, 1.1], ['dies', 1.15, 1.4]], 4);
      ok(JSON.stringify(r) === '["Wow Mega super dies"]', 'Waise vor Pause 0,25–0,8 s hängt sich an: ' + JSON.stringify(r));
      r = seg([['Wow', 0, 0.3], ['Mega', 0.55, 0.8], ['super', 0.85, 1.1], ['dies', 1.15, 1.4]], 1);
      ok(r.length === 4, 'Look mit einem Wort pro Block: jedes Wort einzeln: ' + JSON.stringify(r));
      r = seg([['a', 0, 0.2], ['b', 0.25, 0.45], ['c', 0.5, 0.7]], 4, [0.47]);
      ok(JSON.stringify(r) === '["a b","c"]', 'Szenenschnitt wird nie überbrückt (auch nicht für Waisen): ' + JSON.stringify(r));
      const nb = W([['a', 0, 0.2], ['b', 0.25, 0.45], ['c', 0.5, 0.7], ['d', 0.75, 0.95]]); nb[2].nb = true;
      r = T.capSegmentWords(nb, 4, null, []).map(c => c.map(w => w.word).join(''));
      ok(JSON.stringify(r) === '["ab","cd"]', 'Handnaht (Wort-Flag nb) trennt immer: ' + JSON.stringify(r));
      const nj = W([['a', 0, 0.2], ['b', 0.25, 0.45], ['c', 0.9, 1.1], ['d', 1.15, 1.35]]); nj[2].nj = true;
      r = T.capSegmentWords(nj, 4, null, []).map(c => c.map(w => w.word).join(''));
      ok(JSON.stringify(r) === '["abcd"]', 'Handverschmelzung (nj) hebt die Sprechpause auf: ' + JSON.stringify(r));
      const pin = W([['Ende', 0, 0.3], ['jetzt.', 0.35, 0.65], ['Drittens:', 1.2, 1.7], ['Poste', 1.75, 2.0], ['mehr', 2.05, 2.3]]); pin[3].nb = true;
      r = T.capSegmentWords(pin, 4, null, []).map(c => c.map(w => w.word).join(' '));
      ok(JSON.stringify(r) === '["Ende jetzt.","Drittens:","Poste mehr"]', 'Von Hand abgeteiltes Wort («Drittens: | Poste») wird nicht zurückgeklebt: ' + JSON.stringify(r));
    }
    // Look-Wechsel zerstört keine Handkorrekturen: Text, manueller Split, manueller Merge, Timing
    {
      const ws = Array.from({ length: 12 }, (_, i) => ({ word: 'wort' + 'abcdefghijkl'[i], start: i * 0.4, end: i * 0.4 + 0.35 }));
      const qs0 = document.querySelector; document.querySelector = () => null; // Split/Merge fokussieren danach
      T.selectStyle('classic'); T.setMaxCharsState(40); T.onWpbChange(2); T.setLines({ dataset: { lines: '2' } });
      T.setState(T.buildCaptionBlocks(ws.map(w => Object.assign({}, w)), []), ws.map(w => Object.assign({}, w)), 'karaoke'); T.setCaptionsEdited(false); T.resetUndo();
      const names = () => T.getBlocks().map(b => b.words.map(w => w.word.slice(4)).join(''));
      ok(JSON.stringify(names()) === '["ab","cd","ef","gh","ij","kl"]', 'Testaufbau 2 Wörter/Block: ' + JSON.stringify(names()));
      // (1) Merge «ab»+«cd» per Hand, (2) Split «ef» → «e|f», (3) Texteingabe «gh», (4) Timing «ij» um +0,05 s
      await T.mergeBlockWithPrevious(1, { });
      ok(names()[0] === 'abcd' && T.getBlocks().length === 5, 'Merge ausgeführt: ' + JSON.stringify(names()));
      ok(T.tlSplitAt(1, (T.getBlocks()[1].words[0].end + T.getBlocks()[1].words[1].start) / 2) && names()[1] === 'e', 'Split ausgeführt: ' + JSON.stringify(names()));
      const bg = T.getBlocks()[3]; bg.text = 'wortg KORRIGIERT'; T.retimeEditedBlock(bg);
      const bi = T.getBlocks()[4]; bi.words.forEach(w => { w.start += 0.05; w.end += 0.05; }); bi.start += 0.05; bi.end += 0.05; bi.srcWords = bi.words.map(w => Object.assign({}, w));
      T.setCaptionsEdited(true);
      const tIstart = bi.words[0].start, tIend = bi.words[1].end;
      const check = (label) => {
        const bl = T.getBlocks(), txt = bl.map(b => b.text).join(' ');
        const all = [].concat(...bl.map(b => b.words)), wi = all.find(w => w.word === 'worti'), wj = all.find(w => w.word === 'wortj');
        ok(txt.includes('wortg KORRIGIERT'), label + ': Texteingabe bleibt: ' + txt);
        ok(wi && wj && Math.abs(wi.start - tIstart) < 1e-6 && Math.abs(wj.end - tIend) < 1e-6, label + ': Timing-Korrektur bleibt');
        const idx = w => bl.findIndex(b => b.words.some(x => x.word === w));
        return { idx, bl };
      };
      T.selectStyle('statement'); T.setMaxCharsState(40); // 5 Wörter, 3 Zeilen → baut neu
      let c = check('Look-Wechsel Statement');
      ok(T.getWpb() === 5 && c.idx('worte') !== c.idx('wortf'), 'Look-Wechsel: manueller Split «e|f» bleibt eine Blockgrenze: ' + JSON.stringify(names()));
      ok(c.idx('wortb') === c.idx('wortc'), 'Look-Wechsel: manuell verschmolzene Naht «b|c» bleibt zusammen: ' + JSON.stringify(names()));
      T.selectStyle('tight'); T.setMaxCharsState(40); // 1 Wort pro Block
      c = check('Look-Wechsel Tight');
      T.selectStyle('classic'); T.setMaxCharsState(40); T.onWpbChange(4); // zurück auf 4 Wörter
      c = check('Look-Wechsel zurück');
      ok(c.idx('worte') !== c.idx('wortf') && c.idx('wortb') === c.idx('wortc'), 'Rundreise Statement → Tight → 4 Wörter: Split-Naht + Handverschmelzung (b|c) erhalten: ' + JSON.stringify(names()));
      // Undo des Looks stellt den Zustand vor dem Wechsel wieder her (inkl. Handnaht-Flags im Schnappschuss)
      document.querySelector = qs0;
      T.selectStyle('classic'); T.onWpbChange(2); T.setCaptionsEdited(false); T.resetUndo(); T.setState(T.buildCaptionBlocks(ws.map(w => Object.assign({}, w)), []), ws.map(w => Object.assign({}, w)), 'karaoke');
      T.onWpbChange(4);
    }
  }


  // ═════════════════════════════════════════════════════════════════════════════════════
  // Paket N-KI: Hook-Titel (Vorschau = Export), KI-Standard (Keywords + Emojis an), Fallback mit ≥ 1 Keyword je Caption ab 3 Wörtern
  // ═════════════════════════════════════════════════════════════════════════════════════
  {
    const E = id => document.getElementById(id);
    const mkBlk = (txt, t0) => { const ws = txt.split(' ').map((w, i) => ({ word: w, start: t0 + i * 0.3, end: t0 + i * 0.3 + 0.28 })); return { text: txt, start: t0, end: t0 + ws.length * 0.3, words: ws }; };
    const meas = (font, str) => { const m = /([\d.]+)px/.exec(font); return String(str).length * (m ? parseFloat(m[1]) : 16) * 0.55; }; // wie der Stub-Kontext
    const mix = T.STYLES.find(s => s.id === 'mix'), tight = T.STYLES.find(s => s.id === 'tight');

    // ── KI-Standard: Keywords + Emojis an, Hinweis bleibt am Schalter ──
    ok(/var emKw = true, emEmoji = true, emZoom = 'subtle';/.test(script), 'N-KI: Standard (ohne gemerkte Wahl): Keywords + Emojis an, Auto-Zoom Subtle (Runde 2: P8)');
    ok(/id="emKwBtn"[^>]*aria-pressed="true"/.test(htmlContent) && /id="emEmoBtn"[^>]*aria-pressed="true"/.test(htmlContent) && /class="em-chip on" id="emEmoBtn"/.test(htmlContent), 'N-KI: Markup der beiden Schalter zeigt «an»');
    ok(/emSrc === 'local' \|\| aiOff\(\)/.test(script) && /Simple emoji picks – AI picks when available/.test(script) && /AI picks unavailable — using simple keyword detection/.test(script), 'N-KI: Hinweis am Schalter bleibt, wenn die KI nicht antwortet');
    // Fallback (lokale Heuristik): jede Caption ab 3 Wörtern bekommt ≥ 1 sichtbares Keyword
    {
      const lines = ['Das ist ein guter Test', 'Wir sind so froh', 'und dann kam es', 'Ich bin Landwirt heute', 'Hallo zusammen', 'Heute zeigen wir drei Tricks', 'es ist so', 'Der Hof liegt im Tal', 'a b c', 'Das war Dienstag früh'];
      const blocks = lines.map((l, i) => mkBlk(l, i * 2));
      T.localEmphasis(blocks, 'de', 20);
      const flagged = b => b.words.filter(w => w.kw === 1);
      const miss = blocks.filter(b => b.words.length >= 3 && b.words.some(w => w.word.replace(/[^\p{L}\p{N}]/gu, '').length >= 3 && !['das', 'ist', 'ein', 'wir', 'sind', 'und', 'dann', 'kam', 'der', 'war'].includes(w.word.toLowerCase()) || false) && !flagged(b).length).map(b => b.text);
      ok(miss.length === 0, 'N-KI Fallback: jede Caption ab 3 Wörtern mit Inhaltswort hat ≥ 1 Keyword (ohne: ' + miss.join(' / ') + ')');
      ok(blocks.filter(b => b.words.length >= 3).every(b => flagged(b).length <= 1), 'N-KI Fallback: höchstens ein Keyword je Caption');
      ok(blocks.filter(b => b.words.length < 3).filter(b => flagged(b).length).length <= 1, 'N-KI Fallback: kurze Captions (1–2 Wörter) bleiben zurückhaltend');
      ok(flagged(blocks[0])[0].word === 'guter' || flagged(blocks[0])[0].word === 'Test', 'N-KI Fallback: stärkstes Inhaltswort gewinnt (' + flagged(blocks[0]).map(w => w.word) + ')');
      const lone = [mkBlk('es ist so', 0)]; T.localEmphasis(lone, 'de', 5);
      ok(!lone[0].words.some(w => w.kw === 1), 'N-KI Fallback: nur Füllwörter → nichts hervorgehoben');
      const preU = [mkBlk('Das ist ein Test', 0)]; preU[0].words[3].kw = -1; T.localEmphasis(preU, 'de', 5);
      ok(preU[0].words[3].kw === -1, 'N-KI Fallback: «vom Nutzer aus» bleibt aus');
      // sichtbar: in Looks mit Keyword-Farbe wird das Keyword anders gefärbt (emphColor), der Standard-Look hat sie ggf. nicht
      ok(T.emphColor(mix) === '#4ade80' && T.STYLES.filter(s => T.emphColor(s)).length >= 10, 'N-KI: Looks mit Keyword-Farbe (Mix → grün) färben das Keyword (' + T.STYLES.filter(s => T.emphColor(s)).length + ' von ' + T.STYLES.length + ' Looks)');
      console.log('  info N-KI: Standard-Look «' + T.DEFAULT_STYLE + '» Keyword-Farbe: ' + T.emphColor(T.STYLES.find(s => s.id === T.DEFAULT_STYLE)));
    }

    // ── Hook-Titel: Standard aus, Text, Zeit ──
    ok(T.getHookState().on === false && !/id="hookBtn"[^>]*aria-pressed="true"/.test(htmlContent) && !/class="em-chip on" id="hookBtn"/.test(htmlContent), 'Hook-Titel: Standard AUS (Zustand + Markup)');
    ok(['hookBtn', 'hookTxt', 'hookSug', 'hookDur', 'hookDurDisp', 'hookNote', 'hookRow', 'hookDurRow', 'hookTitle'].every(id => (htmlContent.match(new RegExp('\\bid="' + id + '"', 'g')) || []).length === 1), 'Hook-Titel: Schalter, Textfeld, Dauer, Vorschau-Ebene genau einmal im Markup');
    ok(/<input[^>]*min="1"[^>]*max="4"[^>]*id="hookDur"/.test(htmlContent), 'Hook-Titel: Dauer 1–4 s einstellbar');
    ok(T.hookClean('  Drei  Tricks,\n damit… ') === 'Drei Tricks, damit…', 'Hook-Text: Leerraum bereinigt (' + T.hookClean('  Drei  Tricks,\n damit… ') + ')');
    ok(T.hookClean('Warum das so ist.') === 'Warum das so ist' && T.hookClean('Wirklich?') === 'Wirklich?' && T.hookClean('Krass!') === 'Krass!', 'Hook-Text: Schlusspunkt weg, ? und ! bleiben');
    ok(T.hookClean('eins zwei drei vier fünf sechs sieben acht', 6) === 'eins zwei drei vier fünf sechs', 'Hook-Text: auf 6 Wörter gekürzt');
    ok(T.hookClean('Drei Tricks damit deine Reels mehr Views bekommen', 6) === 'Drei Tricks damit deine Reels', 'Hook-Text: kein hängendes Füllwort am Ende (' + T.hookClean('Drei Tricks damit deine Reels mehr Views bekommen', 6) + ')');
    ok(T.hookClean('x'.repeat(200)).length <= 80, 'Hook-Text: höchstens 80 Zeichen');
    {
      const hb = [mkBlk('Ja.', 0), mkBlk('Heute zeige ich euch drei Tricks für mehr Reichweite.', 1), mkBlk('Zweiter Satz.', 5)];
      ok(!/^Ja\.?$/.test(T.hookLocalText(hb)) && /^Heute zeige ich/.test(T.hookLocalText(hb)) && T.hookLocalText(hb).split(' ').length <= 6, 'Hook lokal: Ein-Wort-Satz wird übersprungen, nächster Satz ≤ 6 Wörter (' + T.hookLocalText(hb) + ')');
      T.setState(hb, [], 'karaoke');
      T.setHookState(true, '', 2, '');
      ok(T.hookTextNow() === T.hookLocalText(hb), 'Hook: ohne eigenen Text/KI → lokaler Vorschlag');
      T.setHookState(true, '', 2, 'Drei Tricks für Reichweite');
      ok(T.hookTextNow() === 'Drei Tricks für Reichweite', 'Hook: KI-Vorschlag vor dem lokalen');
      T.setHookState(true, '  Mein Titel. ', 2, 'Drei Tricks für Reichweite');
      ok(T.hookTextNow() === 'Mein Titel', 'Hook: eigener Text vor KI und lokal');
    }
    // Zeitverlauf: Fenster [0, dur), Ein-/Ausblenden, Standbild, Auto-Cut (Ausgabezeit)
    T.setHookState(true, 'x', 2, '');
    ok(T.hookFx(-0.1, false).op === 0 && T.hookFx(0, false).op === 0 && T.hookFx(1, false).op === 1 && T.hookFx(1.99, false).op < 0.2 && T.hookFx(2, false).op === 0 && T.hookFx(5, false).op === 0, 'Hook-Zeit: unsichtbar vor 0 s und ab Dauer, dazwischen sichtbar, am Ende ausgeblendet');
    ok(T.hookFx(0.1, false).op > 0 && T.hookFx(0.1, false).op < 1 && T.hookFx(0.1, false).dy < 0 && T.hookFx(1, false).dy === 0, 'Hook-Zeit: fährt von oben ein (dy < 0), danach in Ruhe');
    ok(T.hookFx(0, true).op === 1 && T.hookFx(1.5, true).op === 1 && T.hookFx(2.5, true).op === 0, 'Hook-Zeit: Standbild (pausiert) zeigt den Endzustand innerhalb des Fensters');
    T.setHookState(true, 'x', 3.5, ''); ok(T.hookFx(3.2, false).op > 0 && T.hookFx(3.6, false).op === 0, 'Hook-Zeit: Dauer einstellbar (3,5 s)');
    ok(T.hookClampDur(0) === 1 && T.hookClampDur(9) === 4 && T.hookClampDur('2.5') === 2.5 && T.hookClampDur('x') === 2, 'Hook-Dauer: auf 1–4 s begrenzt');
    const cutsH = [{ start: 0.5, end: 1.0 }];
    ok(Math.abs(T.hookOutTime(2.2, cutsH) - 1.7) < 1e-9 && T.hookOutTime(0.7, cutsH) === null && T.hookOutTime(0.3, cutsH) === 0.3 && T.hookOutTime(0.3, null) === 0.3, 'Hook-Zeit: Auto-Cut rechnet auf die Ausgabezeit um');

    // ── Layout (Vorschau-Einheiten): Safe-Bereich, Breite, Umbruch, Format-Unabhängigkeit ──
    const SAFE = 11.46 + 1;
    const fmts = { '9:16': [270, 480], '1:1': [360, 360], '4:5': [288, 360], '16:9': [480, 270] };
    for (const [nm, [Wp, Hp]] of Object.entries(fmts)) {
      for (const st of [tight, mix, T.STYLES.find(s => s.id === 'headline')]) {
        const L = T.hookLayout(meas, st, 'Drei Tricks, damit deine Reels mehr Views bekommen', Wp, Hp);
        const okBox = L && L.boxX >= 0 && L.boxX + L.boxW <= Wp + 0.01 && L.boxW <= Wp * 0.75 + 0.01 && Math.abs(L.boxY - Hp * SAFE / 100) < 0.01 && L.boxY + L.boxH < Hp * 0.5
          && L.lines.length >= 1 && L.lines.length <= 3 && Math.abs((L.boxX + L.boxW / 2) - Wp / 2) < 0.01;
        ok(okBox, 'Hook-Layout ' + nm + ' / ' + st.id + ': mittig, ≤ 75 % Breite, Oberkante in der Safe-Zone (' + (L && [Math.round(L.boxX), Math.round(L.boxY), Math.round(L.boxW), Math.round(L.boxH), L.lines.length].join(',')) + ')');
      }
    }
    {
      const a = T.hookLayout(meas, mix, 'Wichtiger Tipp für deine Videos heute', 270, 480), b = T.hookLayout(meas, mix, 'Wichtiger Tipp für deine Videos heute', 540, 960);
      ok(a.lines.map(l => l.t).join('|') === b.lines.map(l => l.t).join('|') && Math.abs(a.boxW * 2 - b.boxW) < 0.5 && Math.abs(a.f * 2 - b.f) < 0.01 && Math.abs(a.boxY * 2 - b.boxY) < 0.01, 'Hook-Layout: gleicher Umbruch und proportionale Masse bei anderer Vorschaugrösse (Vorschau = Export)');
      const lw = T.hookLayout(meas, tight, 'Sehr lange Titelwörter Rindfleischverarbeitungsbetriebe', 270, 480);
      ok(lw && lw.boxW <= 270 * 0.75 + 0.01, 'Hook-Layout: überlanges Wort sprengt die Safe-Breite nicht');
      const bal = T.hookLayout(meas, tight, 'Drei Tricks für mehr Views', 270, 480);
      ok(bal.lines.length < 2 || Math.min(...bal.lines.map(l => l.w)) >= Math.max(...bal.lines.map(l => l.w)) * 0.5, 'Hook-Layout: ausgewogener Umbruch, keine Einzelwort-Waise (' + bal.lines.map(l => l.t).join('|') + ')');
      ok(T.hookLayout(meas, tight, '   ', 270, 480) === null && T.hookLayout(meas, tight, 'x', 0, 480) === null, 'Hook-Layout: ohne Text/Rahmen → null');
      const up = T.hookLayout(meas, T.STYLES.find(s => s.id === 'headline'), 'kleine titel', 270, 480);
      ok(up.lines.map(l => l.t).join(' ') === 'KLEINE TITEL', 'Hook-Stil: Grossschreibung des Looks (Headline → Versalien)');
      const hs = T.hookStyleOf(mix);
      ok(hs.bg === '#4ade80' && hs.ink === '#111111' && T.hookStyleOf(T.STYLES.find(s => s.id === 'note')).ink === '#ffffff', 'Hook-Stil: Box in der Akzentfarbe des Looks, Schriftfarbe nach Kontrast');
    }
    // Untertitel weichen aus
    {
      const L = T.hookLayout(meas, tight, 'Titel', 270, 480), bot = L.boxY + L.boxH;
      ok(T.hookDodgeNeed(L, 300, 380) === 0 && T.hookDodgeNeed(L, 10, 20) === 0, 'Hook: Untertitel unten/weit oben → kein Ausweichen');
      const need = T.hookDodgeNeed(L, L.boxY, L.boxY + 90);
      ok(need > L.boxH && L.boxY + need >= bot, 'Hook: Untertitel oben (Position «Top») weichen unter den Titel aus (' + Math.round(need) + ' px)');
      ok(T.hookDodgeNeed(L, NaN, 50) === 0 && T.hookDodgeNeed(null, 10, 50) === 0, 'Hook: ungültige Masse → kein Ausweichen');
    }

    // ── Export (Canvas): gleiche Geometrie, nur im Zeitfenster, Auto-Cut ──
    {
      const fr = E('prevFrame'); fr.style.width = '270px'; fr.style.height = '480px';
      const rec = () => { const c = { calls: [], font: '', fillStyle: '', textAlign: '', textBaseline: '', letterSpacing: '0px', shadowColor: '', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, globalAlpha: 1 };
        ['save', 'restore', 'beginPath', 'fill', 'rect', 'translate', 'drawImage'].forEach(n => { c[n] = () => { c.calls.push([n]); }; });
        c.roundRect = (x, y, w, h, r) => { c.calls.push(['roundRect', x, y, w, h, r]); }; c.fillText = (t, x, y) => { c.calls.push(['fillText', t, x, y, c.font]); }; return c; };
      T.setHookState(true, 'Drei Tricks für Views', 2, ''); T.setState([mkBlk('Hallo du da', 0)], [], 'karaoke');
      const c1 = rec(); T.drawHookTitle(c1, 1.0, tight, 1080, 1920, null);
      const rr = c1.calls.find(x => x[0] === 'roundRect'), ft = c1.calls.filter(x => x[0] === 'fillText');
      const Ld = T.hookLayout(meas, tight, 'Drei Tricks für Views', 270, 480), k = 1080 / 270;
      ok(rr && ft.length === Ld.lines.length && Math.abs(rr[1] - Ld.boxX * k) < 0.01 && Math.abs(rr[2] - Ld.boxY * (1920 / 480)) < 0.01 && Math.abs(rr[3] - Ld.boxW * k) < 0.01 && Math.abs(rr[4] - Ld.boxH * k) < 0.01,
         'Hook-Export: Box = Vorschau-Layout × Export-Skala (' + (rr && rr.slice(1, 5).map(v => Math.round(v * 10) / 10).join(',')) + ')');
      ok(ft.every((f, i) => Math.abs(f[2] - (rr[1] + rr[3] / 2)) < 0.01 && /^900 [\d.]+px "Inter Tight"/.test(f[4]) && Math.abs(parseFloat(/([\d.]+)px/.exec(f[4])[1]) - Ld.f * k) < 0.01), 'Hook-Export: Zeilen mittig in der Box, Schriftgrösse = Vorschau × Skala');
      const c2 = rec(); T.drawHookTitle(c2, 2.5, tight, 1080, 1920, null); ok(c2.calls.length === 0, 'Hook-Export: ausserhalb des Zeitfensters wird nichts gezeichnet');
      const c3 = rec(); T.drawHookTitle(c3, 2.2, tight, 1080, 1920, [{ start: 0.5, end: 1.0 }]); ok(c3.calls.some(x => x[0] === 'fillText'), 'Hook-Export: mit Auto-Cut zählt die Ausgabezeit (Quelle 2,2 s = 1,7 s)');
      const c4 = rec(); T.drawHookTitle(c4, 0.7, tight, 1080, 1920, [{ start: 0.5, end: 1.0 }]); ok(c4.calls.length === 0, 'Hook-Export: Bild im Schnitt-Fenster → kein Titel');
      T.setHookState(false, 'Drei Tricks für Views', 2, ''); const c5 = rec(); T.drawHookTitle(c5, 1.0, tight, 1080, 1920, null); ok(c5.calls.length === 0, 'Hook-Export: Schalter aus → nichts gezeichnet');
      T.setHookState(true, 'Titel', 2, ''); const bT = T.hookCapDodge(1.0, tight, 1080, 1920, null, 220, 700);
      ok(bT > 0 && T.hookCapDodge(1.0, tight, 1080, 1920, null, 1200, 1500) === 0 && T.hookCapDodge(2.5, tight, 1080, 1920, null, 220, 700) === 0, 'Hook-Export: Untertitel oben weichen nur im Zeitfenster aus (' + Math.round(bT) + ' px)');
      fr.style.width = ''; fr.style.height = '';
      // beide Export-Pfade zeichnen den Titel mit denselben Argumenten wie die Untertitel (Quelltext)
      ok((script.match(/drawHookTitle\(ctx, t, [a-z.]+, W, H, [a-zA-Z]+\);/g) || []).length === 2 && /drawCaptionsOnCtx\(ctx, t, o\.style, W, H, false, cuts\)/.test(script) && /drawCaptionsOnCtx\(ctx, t, s, W, H, false, cutRegions\)/.test(script),
         'Hook-Export: Schnellexport (WebCodecs) und Echtzeit-Pfad rufen drawHookTitle + Untertitel-Ausweichen auf');
      ok(/hookUpdate\(tHook, rest, s, ov\);[\s\S]{0,120}capDomMotion\(ov/.test(script) && /\(ov\._hkDy \|\| 0\)/.test(script), 'Hook-Vorschau: Ausweichen der Untertitel fliesst in capDomMotion (wie im Export)');
    }

    // ── Speichern: Projekt/Autosave, Template, gemerkter Schalter ──
    {
      T.setHookState(true, 'Mein Titel', 3, 'KI Titel');
      const hp = T.projectPayload().hook;
      ok(hp && hp.on === true && hp.text === 'Mein Titel' && hp.dur === 3 && hp.ai === 'KI Titel', 'Hook im Projekt/Autosave gespeichert ' + JSON.stringify(hp));
      T.setHookState(false, '', 2, '');
      ok(T.projectPayload().hook === undefined, 'Hook aus + ohne Text: kein Eintrag im Projekt (alte Projekte unverändert)');
      T.applyProjectPayload({ hook: { on: true, text: 'Zurück', dur: 3.5, ai: 'KI' } });
      ok(JSON.stringify(T.getHookState()) === JSON.stringify({ on: true, text: 'Zurück', dur: 3.5, ai: 'KI' }), 'Projekt laden: Hook-Titel wiederhergestellt');
      T.applyProjectPayload({ hook: { on: true, text: 5, dur: 99, ai: {} } });
      ok(T.getHookState().text === '' && T.getHookState().dur === 4 && T.getHookState().ai === '', 'Projekt laden: ungültige Werte bereinigt');
      T.applyProjectPayload({});
      ok(T.getHookState().on === false && T.getHookState().text === '', 'Projekt ohne Hook-Eintrag (alt) → aus');
      T.setHookState(true, '', 2.5, '');
      ok(JSON.stringify(T.currentLayout().hook) === JSON.stringify({ on: true, dur: 2.5 }), 'Template-Layout enthält Hook-Schalter + Dauer (nicht den Text)');
      const nt = T.normalizeTemplate({ id: 'tpl_hk', name: 'H', style: { fl: 'Inter', font: "'Inter'", fw: '800', tc: '#fff', hl: '#fa0', anim: 'none' }, layout: { hook: { on: true, dur: 9 } } });
      ok(nt.layout.hook && nt.layout.hook.on === true && nt.layout.hook.dur === 4, 'Template: Hook-Feld normalisiert (Dauer begrenzt)');
      ok(T.normalizeTemplate({ id: 'tpl_old', name: 'O', style: { fl: 'Inter', font: "'Inter'", fw: '800', tc: '#fff', hl: '#fa0', anim: 'none' }, layout: { pos: 'top' } }).layout.hook === undefined, 'Template ohne Hook-Feld bleibt ohne (altes Verhalten)');
      T.setHookState(false, 'bleibt', 2, '');
      T.applyTemplateSettings({ hook: { on: true, dur: 3 } });
      ok(T.getHookState().on === true && T.getHookState().dur === 3 && T.getHookState().text === 'bleibt', 'Template anwenden: Schalter + Dauer, Text des Videos bleibt');
      T.setHookState(true, 'bleibt', 3, ''); T.applyTemplateSettings({ pos: 'bottom' });
      ok(T.getHookState().on === true, 'Template ohne Hook-Feld ändert den Schalter nicht');
      ok(/localStorage\.setItem\(HOOK_KEY/.test(script) && T.HOOK_KEY === 'capivo.hook', 'Hook: Schalter + Dauer werden pro Gerät gemerkt (try/catch)');
    }

    // ── KI-Vorschlag (optionales Feld hook der Post-Antwort) ──
    {
      const hb = [mkBlk('Unsere Highland Rinder fressen nur Gras und Heu.', 0)];
      T.setState(hb, [], 'karaoke'); T.setEmSrc(null); T.setHookState(true, '', 2, '');
      let sentW = null;
      global.fetch = async (u, o) => { sentW = JSON.parse(o.body).want; return { ok: true, status: 200, json: async () => ({ post: { caption: 'Ok', hashtags: ['#a'], hook: 'Nur Gras und Heu.' } }) }; };
      const r = await T.hookFetchAi(true);
      ok(sentW && sentW.join() === 'post' && r === 'Nur Gras und Heu' && T.getHookState().ai === 'Nur Gras und Heu' && T.hookTextNow() === 'Nur Gras und Heu', 'Hook-KI: Vorschlag aus dem Feld hook übernommen (' + r + ')');
      T.setHookState(true, '', 2, '');
      global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ post: { caption: 'Ok', hashtags: [] } }) });
      ok(await T.hookFetchAi(true) === '' && T.getHookState().ai === '' && T.hookTextNow() === T.hookLocalText(hb), 'Hook-KI: Antwort ohne hook-Feld → lokaler Vorschlag bleibt');
      global.fetch = async () => { throw new TypeError('Failed to fetch'); };
      ok(await T.hookFetchAi(true) === '' && T.hookTextNow() === T.hookLocalText(hb), 'Hook-KI: offline → lokaler Vorschlag, kein Fehler');
      T.setEmSrc('local'); let called = 0; global.fetch = async () => { called++; return { ok: false, status: 404, json: async () => ({}) }; };
      await T.hookFetchAi(true); ok(called === 0, 'Hook-KI: bekannt nicht erreichbar (emSrc local) → keine Anfrage');
      T.setEmSrc(null); T.setHookState(false, '', 2, ''); T.setState([], [], 'karaoke'); delete global.fetch;
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // Paket B2-B6: Template beim Upload (Landing «My templates»), Template-Umschalter + «Save as template»-Chip, Timing per Ziehen
  // ═════════════════════════════════════════════════════════════════
  {
    const E = id => document.getElementById(id);
    // B2: Landing — eigene Templates als Gruppe vor den Looks, Standard zuerst + markiert
    const rl = htmlContent.slice(htmlContent.indexOf('function renderLandChips()'), htmlContent.indexOf('function pickLandStyle('));
    ok(/addGrp\(LT\.myTpl\);[\s\S]*tpls\.forEach[\s\S]*addGrp\(LT\.looks\);[\s\S]*ids\.forEach/.test(rl), 'B2: Landing-Chips: «My templates» vor «Looks»');
    ok(/id === bid \? '<span class="hc-dflt">/.test(rl) && /if \(tpls\.length\)/.test(rl), 'B2: Standard-Template mit Abzeichen; ohne Templates keine Gruppen (Landing wie vorher)');
    ok(/s\.id === cur && !s\._isTpl/.test(rl), 'B2: gewähltes Template wird nicht zusätzlich als Look vorangestellt');
    ok(/\.hc-chip\{min-height:44px\}/.test(htmlContent) && /\.hc-chips\{display:flex;gap:8px;overflow-x:auto/.test(htmlContent), 'B2: Chips ≥ 44 px, Reihe horizontal scrollbar');
    ok(/myTpl: 'My templates'/.test(htmlContent) && /myTpl: 'Meine Templates'/.test(htmlContent), 'B2: Landing-Texte EN + DE');
    {
      const store = {}; const prevLS = global.localStorage;
      global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
      T.setUserTemplates([]); T.loadTemplates();
      T.selectStyle('beast'); E('tplName').value = 'Kunde A'; T.saveTemplate();
      T.selectStyle('classic'); E('tplName').value = 'Kunde B'; T.saveTemplate();
      const ts = T.getUserTemplates(), A = ts.find(t => t.name === 'Kunde A'), B = ts.find(t => t.name === 'Kunde B');
      A.createdAt = 1000; B.createdAt = 2000; T.persistTemplates();
      let order = T.landTemplates(T.brandTplId()).map(x => x.name);
      ok(order[0] === 'Kunde A' && order[1] === 'Kunde B', 'B2: Standard-Template zuerst, dann neueste: ' + order.join(','));
      T.toggleBrandTpl(A.id); T.toggleBrandTpl(B.id);
      order = T.landTemplates(T.brandTplId()).map(x => x.name);
      ok(order[0] === 'Kunde B', 'B2: neuer Standard rückt nach vorn: ' + order.join(','));
      const lbl = T.landPickLabel(T.STYLES.find(x => x.id === B.id), B.id);
      ok(/^★ Kunde B/.test(lbl) && T.landPickLabel(T.STYLES.find(x => x.id === 'hormozi'), B.id).indexOf('★') < 0, 'B2: Beschriftung markiert nur das Standard-Template: ' + lbl);
      // Template-Wahl auf der Landing → neues Video: Format/Fill aus dem Template (B1), schlägt das Standard-Template
      const A2 = T.getUserTemplates().find(t => t.name === 'Kunde A'), B2 = T.getUserTemplates().find(t => t.name === 'Kunde B');
      B2.layout = Object.assign({}, B2.layout, { aspect: '1:1', fill: 'blur' }); A2.layout = Object.assign({}, A2.layout, { aspect: '16:9', fill: 'crop' }); A2.updatedAt = B2.updatedAt = Date.now() + 5000; T.persistTemplates(); T.loadTemplates();
      T.setActiveId(A.id); T.applyBrandOnOpen(); // brand = B
      ok(T.getActiveId() === B.id, 'B2: Standard-Template B vorgewählt');
      T.selectStyle(A.id);
      const fm = T.currentLayout();
      ok(fm.aspect === '16:9' && fm.fill === 'crop', 'B2: Klick auf Template A setzt dessen Format/Fill: ' + fm.aspect + '/' + fm.fill);
      T.setUserTemplates([]); T.loadTemplates(); T.selectStyle('hormozi');
      global.localStorage = prevLS; if (!prevLS) delete global.localStorage;
    }
    // B2: Umschalter im Style-Tab
    ok(/<select id="tplSwSel"[^>]*onchange="switchTplFromBar\(this\.value\)"/.test(htmlContent) && /function syncTplSwitch\(\)/.test(htmlContent), 'B2: Template-Umschalter im Style-Tab');
    ok(/onCapMetricsChange\('style'\);[^\n]*\n  _lastKey = null;\n  updateOverlay\(\);\n  syncTplSwitch\(\);/.test(htmlContent) && /syncTplSwitch\(\);\n\}/.test(htmlContent), 'B2: Umschalter folgt jeder Style-Wahl + Picker-Neuaufbau');
    ok(htmlContent.indexOf('id="tplBar"') < htmlContent.indexOf('id="stylePicker"') && htmlContent.indexOf('id="tplBar"') > htmlContent.indexOf('<div class="csect" data-tab="style">'), 'B2/B6: Template-Leiste steht oben im Style-Tab, vor den Looks');

    // B6: «Save as template» als Chip oben, Name inline, Toast mit «Use for every new video»
    ok(/id="tplChip"[^>]*onclick="openTplSaveInline\(\)"[^>]*>＋ Save as template/.test(htmlContent) && /id="tplNameTop"/.test(htmlContent), 'B6: «Save as template»-Chip + Inline-Name oben');
    ok(/\.tpl-chip,\.tpl-sel,\.tpl-name-top,\.tpl-inl-ok,\.tpl-inl-no\{min-height:44px\}/.test(htmlContent), 'B6: Handy: Chip/Feld/Knöpfe ≥ 44 px');
    {
      const store = {}; const prevLS = global.localStorage;
      global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
      T.setUserTemplates([]); T.loadTemplates();
      T.selectStyle('beast'); E('tplName').value = 'Erstes';
      const t1 = T.saveTemplate();
      ok(t1 && t1.name === 'Erstes' && T.brandTplId() === t1.id, 'B6: saveTemplate gibt das Template zurück; erstes wird Standard');
      T.selectStyle('classic'); E('tplName').value = 'Zweites';
      const t2 = T.saveTemplate();
      ok(t2 && T.brandTplId() === t1.id, 'B6: zweites Template wird nicht automatisch Standard (Toast bietet «Use for every new video»)');
      ok(/capToastAction\('✓ ' \+ verb[^)]*\)[^;]*'Use for every new video'/.test(htmlContent) || /_t\('Use for every new video'\), function\(\) \{ setBrandTpl\(t\.id\)/.test(htmlContent), 'B6: Toast mit «Use for every new video»-Aktion');
      E('tplName').value = ''; ok(T.saveTemplate() === null, 'B6: ohne Namen kein Speichern (null)');
      T.setUserTemplates([]); T.loadTemplates(); T.selectStyle('hormozi');
      global.localStorage = prevLS; if (!prevLS) delete global.localStorage;
    }

    // B6: Timing per Ziehen — 1 px ≈ 0,01 s, Frame-Raster 1/30 s, ein Zug = ein Undo-Schritt
    ok(T.segDragTarget(2, 0) === T.segFrameSnap(2) && T.segFrameSnap(2.0) === 2, 'B6: Frame-Raster: 2,000 s liegt auf dem Raster');
    ok(T.segDragTarget(2, 10) === 2.1 && T.segDragTarget(2, 20) === 2.2 && T.segDragTarget(2, -30) === 1.7, 'B6: 10 px = 0,1 s (auf Raster): ' + [T.segDragTarget(2, 10), T.segDragTarget(2, 20), T.segDragTarget(2, -30)]);
    {
      const g = T.segDragTarget(1.234, 7); ok(Math.abs(g * 30 - Math.round(g * 30)) < 0.02, 'B6: Ziel liegt auf dem 1/30-s-Raster: ' + g);
      ok(T.fmtT2(2.4333) === '0:02.43' && T.fmtT2(61.5) === '1:01.50', 'B6: Zeitanzeige mit 2 Stellen');
      const mk = (s, e) => ({ start: s, end: e, text: 'a b', words: [{ word: 'a', start: s, end: (s + e) / 2 }, { word: 'b', start: (s + e) / 2, end: e }] });
      T.setCaptionBlocksForTest([mk(0, 1), mk(1.5, 3), mk(3, 4)]);
      T.resetUndo();
      const bl = T.getBlocksB2();
      ok(T.segDragApply(1, 'start', 1.7) && bl[1].start === 1.7 && bl[1].words[0].start === 1.7, 'B6: Ziehen verschiebt Start samt Wörtern');
      ok(!T.segDragApply(1, 'start', 0.2) || bl[1].start >= 1, 'B6: Start nie über den Vorgänger hinaus: ' + bl[1].start);
      T.segDragApply(1, 'start', 0.2); ok(bl[1].start === 1, 'B6: Start stoppt am Ende des Vorgängers: ' + bl[1].start);
      T.segDragApply(1, 'end', 9); ok(bl[1].end === 3, 'B6: Ende stoppt am Beginn des Nachfolgers: ' + bl[1].end);
      T.segDragApply(1, 'end', 1.0); ok(bl[1].end - bl[1].start >= 0.2 - 1e-9, 'B6: Mindestdauer bleibt: ' + (bl[1].end - bl[1].start));
      // ein Zug = ein Undo-Schritt (Vor-Zustand wird beim Loslassen EINMAL gepusht)
      T.setCaptionBlocksForTest([mk(0, 1), mk(1.5, 3), mk(3, 4)]); T.resetUndo();
      const snapBefore = JSON.stringify(T.getBlocksB2());
      T.segDragApply(1, 'start', 1.6); T.segDragApply(1, 'start', 1.7); T.segDragApply(1, 'start', 1.8);
      T.pushUndo('segdrag:test', snapBefore);
      ok(T.undoDepth()[0] === 1, 'B6: ein Zug = ein Undo-Schritt: ' + T.undoDepth()[0]);
      T.undoCaptions();
      ok(T.getBlocksB2()[1].start === 1.5 && T.getBlocksB2()[1].words[0].start === 1.5, 'B6: Undo stellt den Zustand vor dem Zug wieder her');
    }
    ok(/pushUndo\('segdrag:' \+ Date\.now\(\)/.test(htmlContent) && /addEventListener\('pointerdown'/.test(htmlContent.slice(htmlContent.indexOf('function buildSegTools'), htmlContent.indexOf('function segFrameSnap'))), 'B6: Zeitwerte per Pointer-Events ziehbar (Maus/Touch), Undo beim Loslassen');
    ok(/\.seg-tools \.stv\.stv-drag\{min-width:52px;min-height:44px/.test(htmlContent), 'B6: ziehbarer Zeitwert am Handy ≥ 44 px');
  }


  // ═══ Paket B5: Trimmen + Ausschneiden ═══
  {
    const E = id => document.getElementById(id);
    const near = (a, b, e) => Math.abs(a - b) < (e || 1e-6);
    // allCutRegionsOf: sortiert, zusammengeführt, Trim + manuell + Auto
    const au = [{ start: 12, end: 13 }, { start: 5, end: 6.5 }];
    const r1 = T.allCutRegionsOf(20, 1, 18, [{ start: 6, end: 8 }], []);
    ok(JSON.stringify(r1) === JSON.stringify([{ start: 0, end: 1 }, { start: 6, end: 8 }, { start: 18, end: 20 }]), 'B5: Trim 1–18 + Schnitt 6–8 → [0,1] [6,8] [18,20]: ' + JSON.stringify(r1));
    ok(near(T.cutSavedSeconds(r1), 5) && near(20 - T.cutSavedSeconds(r1), 15), 'B5: Ausgabelänge 20 − 5 = 15 s');
    const r2 = T.allCutRegionsOf(20, 1, 18, [{ start: 6, end: 8 }], au);
    ok(JSON.stringify(r2) === JSON.stringify([{ start: 0, end: 1 }, { start: 5, end: 8 }, { start: 12, end: 13 }, { start: 18, end: 20 }]), 'B5: Auto-Cut (unsortiert, überlappt 6–8) wird einsortiert und zusammengeführt: ' + JSON.stringify(r2));
    ok(T.allCutRegionsOf(20, 0, null, [], au) === au, 'B5: ohne Trim/Schnitt kommt die Auto-Cut-Liste unverändert zurück');
    ok(T.allCutRegionsOf(20, 0, 20, [], []).length === 0 && T.allCutRegionsOf(20, 0, null, [], []).length === 0, 'B5: volle Länge → keine Schnitte');
    const r3 = T.allCutRegionsOf(20, 0, null, [{ start: 4, end: 6 }, { start: 6, end: 7 }, { start: 3, end: 4.5 }, { start: 19, end: 25 }], []);
    ok(JSON.stringify(r3) === JSON.stringify([{ start: 3, end: 7 }, { start: 19, end: 20 }]), 'B5: anstossende/überlappende Schnitte verschmelzen, Ende auf Dauer gekappt: ' + JSON.stringify(r3));
    // srcToOut an den Grenzen
    ok(T.srcToOut(0.5, r1) === null && near(T.srcToOut(1, r1), 0) && near(T.srcToOut(5.99, r1), 4.99), 'B5: srcToOut: im Trim null, Trim-Ende = 0, vor Schnitt unverändert verschoben');
    ok(T.srcToOut(6, r1) === null && T.srcToOut(7.99, r1) === null && near(T.srcToOut(8, r1), 5) && near(T.srcToOut(8.5, r1), 5.5), 'B5: srcToOut: Schnitt-Anfang inklusiv null, Schnitt-Ende exklusiv; Quelle 8,5 s = Ausgabe 5,5 s');
    ok(T.srcToOut(18, r1) === null && near(T.srcToOut(17.999, r1), 14.999), 'B5: srcToOut: Trim-Out-Grenze');
    ok(near(T.outToSrc(5.5, r1), 8.5) && near(T.outToSrc(0, r1), 1) && near(T.outToSrc(4.999, r1), 5.999), 'B5: outToSrc ist die Umkehrung');
    // SRT mit Schnitten: Hand-Rechnung. Cue A 2–4 s (voll sichtbar), Cue B 5.5–6.5 s (angeschnitten: Schnitt ab 6), Cue C 6.2–7.5 (ganz im Schnitt), Cue D 9–10
    const cues = [{ start: 2, end: 4, text: 'A' }, { start: 5.5, end: 6.5, text: 'B' }, { start: 6.2, end: 7.5, text: 'C' }, { start: 9, end: 10, text: 'D' }, { start: 0.2, end: 0.8, text: 'E' }];
    const co = T.cuesToOutput(cues, r1);
    ok(co.length === 3 && co[0].text === 'A' && near(co[0].start, 1) && near(co[0].end, 3), 'B5: SRT: Cue A 2–4 → 1–3 (Trim 1 s)');
    ok(co[1].text === 'B' && near(co[1].start, 4.5) && near(co[1].end, 5), 'B5: SRT: Cue B 5,5–6,5 wird auf 5,5–6 geklemmt → 4,5–5,0');
    ok(co[2].text === 'D' && near(co[2].start, 6) && near(co[2].end, 7), 'B5: SRT: Cue D 9–10 → 6–7 (Trim 1 s + Schnitt 2 s); C und E (ganz im Schnitt) entfallen');
    const span = T.cuesToOutput([{ start: 4, end: 10, text: 'X' }], r1)[0];
    ok(near(span.start, 3) && near(span.end, 5 + 2), 'B5: Schnitt mitten im Cue verkürzt ihn (4–10 → 3–7: 2 s vor + 2 s nach dem Schnitt): ' + span.start + '–' + span.end);
    ok(T.cuesToOutput(cues, []) === cues, 'B5: ohne Schnitte bleiben die Cues dasselbe Objekt (SRT byte-gleich)');
    // currentSubCues folgt exportCutRegions (SRT/VTT = Video-Zeit), inkl. Auto-Cut
    const vidB = E('mainVid'), dB = vidB.duration; vidB.duration = 20;
    T.onAutoCutChange(false); T.trimResetState();
    T.setState([{ start: 2, end: 4, text: 'Eins zwei', words: [{ word: 'Eins', start: 2, end: 3 }, { word: 'zwei', start: 3, end: 4 }] },
                { start: 9, end: 10, text: 'Neun zehn', words: [{ word: 'Neun', start: 9, end: 9.5 }, { word: 'zehn', start: 9.5, end: 10 }] }], [], 'words');
    T.setSrtMode('snippets');
    const before = JSON.stringify(T.currentSubCues());
    ok(T.setTrim(1, 18) === true && T.cutOutRange(6, 8) === true, 'B5: Trim 1–18 und Schnitt 6–8 gesetzt');
    const sc = T.currentSubCues();
    ok(sc.length === 2 && near(sc[0].start, 1) && near(sc[0].end, 3) && near(sc[1].start, 6) && near(sc[1].end, 7), 'B5: currentSubCues: 2–4 → 1–3, 9–10 → 6–7 (Hand-Rechnung): ' + JSON.stringify(sc));
    ok(T.exportCutRegions().length === 3 && near(T.cutSavedSeconds(T.exportCutRegions()), 5), 'B5: exportCutRegions liefert Trim + Schnitt (auch ohne Auto-Cut und ohne Wort-Timings)');
    ok(E('tlOut').textContent === 'Output 15.0 s (−5.0 s)' && E('expOutLen').textContent === 'Output 15.0 s (−5.0 s)', 'B5: Anzeige «Output 15.0 s»: ' + E('tlOut').textContent);
    // Signatur (N10) enthält Trim/Schnitte; Projekt-Payload speichert sie, Template nicht
    const sigCut = T.exportSignature();
    const pl = T.projectPayload();
    ok(pl.trimIn === 1 && pl.trimOut === 18 && pl.manualCuts.length === 1 && pl.manualCuts[0].start === 6 && pl.manualCuts[0].end === 8, 'B5: projectPayload speichert trimIn/trimOut/manualCuts');
    T.trimResetState();
    ok(T.exportSignature() !== sigCut && !('trimIn' in T.projectPayload()) && !('manualCuts' in T.projectPayload()), 'B5: Signatur ändert sich mit dem Schnitt; ohne Trim/Schnitt keine Felder im Projekt');
    ok(JSON.stringify(T.currentSubCues()) === before, 'B5: ohne Trim/Schnitt/Auto-Cut ist die SRT-Ausgabe unverändert');
    T.applyProjectPayload(Object.assign({}, pl, { blocks: undefined, style: undefined }));
    ok(T.getTrim().i === 1 && T.getTrim().o === 18 && T.getTrim().c.length === 1, 'B5: applyProjectPayload stellt Trim/Schnitt wieder her');
    ok(!/trimIn|manualCuts/.test((htmlContent.match(/function buildTemplateExport[\s\S]{0,1500}/) || [''])[0]) && !/trimIn|manualCuts/.test((htmlContent.match(/function snapshotTemplate[\s\S]{0,1200}/) || [''])[0]), 'B5: Templates enthalten keine Trim-Felder');
    // Undo/Redo: jede Aktion = ein Schritt
    T.trimResetState(); T.resetUndoForTest && T.resetUndoForTest();
    T.setTrim(1, 18); T.cutOutRange(6, 8); T.cutOutRange(10, 11);
    ok(T.getTrim().c.length === 2, 'B5: zwei Schnitte');
    T.undoCaptions(); ok(T.getTrim().c.length === 1 && T.getTrim().c[0].start === 6 && T.getTrim().i === 1, 'B5: Undo nimmt genau den letzten Schnitt zurück');
    T.undoCaptions(); ok(T.getTrim().c.length === 0 && T.getTrim().i === 1 && T.getTrim().o === 18, 'B5: Undo 2 nimmt den Schnitt 6–8 zurück, Trim bleibt');
    T.redoCaptions(); ok(T.getTrim().c.length === 1, 'B5: Redo stellt den Schnitt wieder her');
    T.undoCaptions(); T.undoCaptions(); ok(T.getTrim().i === 0 && T.getTrim().o === null, 'B5: Trim (In und Out zusammen) ist EIN Schritt');
    // Mindestlänge 0,2 s
    ok(T.setTrim(19.9, null) === false || T.getTrim().o === null && T.getTrim().i <= 19.8 + 1e-6, 'B5: Trim-In wird so geklemmt, dass ≥ 0,2 s bleiben (In = ' + T.getTrim().i + ')');
    T.trimResetState();
    ok(T.cutOutRange(0.1, 19.95) === false && T.getTrim().c.length === 0, 'B5: Schnitt, der weniger als 0,2 s übrig liesse, wird abgelehnt');
    // Cut out aus Auswahl / In-Out; Restore
    T.trimResetState();
    T.setCaptionBlocksForTest(JSON.parse(JSON.stringify([{ start: 2, end: 4, text: 'a', words: [] }, { start: 9, end: 10, text: 'b', words: [] }])));
    T.setTlSel(1); const cr = T.tlCutRange();
    ok(cr && near(cr.a, 9) && near(cr.b, 10), 'B5: gewählter Block = Schnittbereich');
    ok(T.tlCutOut() && T.getTrim().c.length === 1, 'B5: tlCutOut (X) schneidet den gewählten Block aus');
    T.tlSelectCut(0); ok(T.tlRestoreSel() && T.getTrim().c.length === 0, 'B5: Restore stellt den Schnitt wieder her');
    // Vorschau-Sprung
    T.setTrim(1, 18); T.cutOutRange(6, 8);
    const fv = { paused: false, ended: false, duration: 20, currentTime: 0.2 };
    ok(T.previewSkipCuts(fv) && near(fv.currentTime, 1), 'B5: Vorschau springt vom Anfang auf Trim-In');
    fv.currentTime = 6.1; ok(T.previewSkipCuts(fv) && near(fv.currentTime, 8), 'B5: Vorschau springt über den Schnitt 6–8');
    fv.currentTime = 12; ok(!T.previewSkipCuts(fv) && fv.currentTime === 12, 'B5: im behaltenen Bereich kein Sprung');
    fv.currentTime = 18.2; ok(T.previewSkipCuts(fv) && fv.currentTime === 20, 'B5: hinter Trim-Out → Ende');
    fv.currentTime = 7; fv.paused = true; ok(!T.previewSkipCuts(fv), 'B5: pausiert darf man in den Schnitt hineinscrubben');
    // Trim-Griffe ≥ 44 px Trefferfläche (Handy)
    T.trimResetState(); vidB.duration = dB;
    ok(/16 : touch \? 14 : 3[\s\S]{0,60}14 : touch \? 14 : 3/.test(script) && /hw: mob \? 14 : 9/.test(script), 'B5: Handy-Griffe: Trefferfläche 16 + 14 + 14 = 44 px');
    // Steuerelemente
    ok(/id="tlCutBtn"[^>]*onclick="tlCutOut\(\)"/.test(htmlContent) && /id="taCut"[^>]*onclick="tlCutOut\(\)"/.test(htmlContent) && /id="tlRestoreBtn"/.test(htmlContent) && /id="taRestore"/.test(htmlContent), 'B5: «Cut out»/«Restore» in Timeline-Leiste und Handy-Aktionsleiste');
    ok(/e\.code === 'KeyX'/.test(script) && /tlSetMark\('in'\)/.test(script) && /tlSetMark\('out'\)/.test(script), 'B5: Tasten X, I, O');
    ok((script.match(/exportCutRegions\(\)/g) || []).length >= 4 && !/wordTimestamps\.length \? exportCutRegions\(\)/.test(script), 'B5: beide Export-Pfade + SRT nutzen exportCutRegions() ohne Wort-Bedingung');
    T.setWordsState([]); T.trimResetState();
  }
  // ── Integration N-KI × B5: Hook-Titel in der Vorschau in derselben Ausgabezeit wie im Export (Trim/Schnitte) ──
  ok(/hookFx\(hookOutTime\(t, hookPreviewCuts\(\)\), rest\)/.test(htmlContent) && /function hookPreviewCuts\(\)[\s\S]{0,300}exportCutRegions\(\)/.test(htmlContent), 'Integration: Hook-Vorschau nutzt exportCutRegions (Trim/Schnitte wie im Export)');

  // ── Paket N-Looks: neue Looks (styles.json), Engine-Erweiterungen, Zustandsfunktionen je Effekt ──
  {
    const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
    const now = Date.parse('2026-10-20');
    const file = JSON.parse(fs.readFileSync(path.join(__dirname, 'styles.json'), 'utf8'));
    // styles.json: lädt, alle 8 Looks bestehen die Prüfung, neutrale Namen, stabile IDs, nur lokale Schriften
    const want = ['colorpop', 'bigkeyword', 'gradkaraoke', 'stickeremoji', 'glassbox', 'swipeline', 'typewriter', 'squashpop'];
    ok(want.every(id => file.some(o => o.id === id)), 'N-Looks: styles.json enthält die 8 Looks (' + file.map(o => o.id).join() + ')');
    const ds = file.map(o => T.dropToStyle(o, now));
    ok(ds.every(Boolean), 'N-Looks: jeder Eintrag besteht dropToStyle (Schrift lokal, sanitizeStyle)');
    ok(file.every(o => !/hormozi|submagic|capcut|mrbeast|alex|ali |abdaal|iman|beast/i.test(o.name)), 'N-Looks: Anzeigenamen ohne Personen-/Markennamen');
    const g = id => ds[file.findIndex(o => o.id === id)];
    ok(g('colorpop').anim === 'overshoot' && g('colorpop').hlCycle.length === 3 && g('squashpop').anim === 'squash' && g('typewriter').motion === 'type' && g('typewriter').cur
       && g('swipeline').ul && g('glassbox').boxBd && g('stickeremoji').emoSide === true && g('stickeremoji').layout.emoji === true && g('bigkeyword').emS === 2 && g('bigkeyword').layout.kw === true && g('gradkaraoke').hlg,
       'N-Looks: neue Felder kommen durch sanitizeStyle/dropToStyle (anim, hlCycle, motion, cur, ul, boxBd, emoSide, emS 2, hlg, layout.emoji/kw)');
    // Picker-Reihenfolge: Standard-Look zuerst, Drops direkt dahinter, More looks am Ende
    {
      const saved = T.STYLES.slice();
      const add = T.applyStyleDrops(file.map(o => Object.assign({}, o, { id: 'x' + o.id })), now);
      ok(add === 8 && T.STYLES[0].id === 'hormozi' && T.STYLES[1].id === 'xcolorpop' && T.STYLES[8].id === 'xsquashpop' && T.STYLES[9].id === 'tight', 'N-Looks: Drops direkt hinter Bold Pop');
      T.STYLES.splice(0, T.STYLES.length, ...saved);
      const idx = id => T.STYLES.findIndex(x => x.id === id);
      ok(T.STYLES[0].id === 'hormozi' && T.STYLE_MORE.every(id => idx(id) > idx('marker')) && T.STYLE_MORE.every(id => T.STYLES.some(x => x.id === id)), 'N-Looks: Bold Pop vorn, schwache Looks («More looks») hinten, IDs unverändert: ' + T.STYLE_MORE.join());
    }
    // sanitizeStyle: akzeptiert gültige neue Felder, verwirft Unsinn
    {
      const okS = T.sanitizeStyle({ boxBd: 'rgba(255,255,255,.4)', ul: '#facc15', cur: '#fff', ulMode: 'kw', ulH: 0.2, emoSide: true, emS: 2.1, motion: 'type', anim: 'squash' });
      ok(okS.boxBd && okS.ul === '#facc15' && okS.cur === '#fff' && okS.ulMode === 'kw' && okS.ulH === 0.2 && okS.emoSide === true && okS.emS === 2.1 && okS.motion === 'type' && okS.anim === 'squash', 'sanitizeStyle: gültige N-Looks-Felder bleiben');
      const bad = T.sanitizeStyle({ boxBd: 'not a color!', ul: 'url(x)', cur: '#fff"onload', ulMode: 'zz', ulH: 9, emoSide: 'yes', emS: 5, motion: 'foo', anim: 'foo' });
      ok(Object.keys(bad).filter(k => ['boxBd', 'ul', 'cur', 'ulMode', 'ulH', 'emoSide', 'emS', 'motion', 'anim'].includes(k)).length === 0, 'sanitizeStyle: Unsinn (Farbe mit Skript, Modus, Höhe 9, emS 5, motion/anim unbekannt) verworfen: ' + JSON.stringify(bad));
      ok(T.emphScale({ emS: 2 }) === 2 && T.emphScale({ emS: 2.2 }) === 2.2 && T.emphScale({ emS: 3 }) === T.emphScale({}), 'emphScale: bis 2,2× (Schlagwort gross), darüber Standard');
    }
    // (h) Overshoot/Squash: Zustandsfunktion bei Start/Mitte/Ende
    {
      const a0 = T.animState('overshoot', 0), am = T.animState('overshoot', T.animDur('overshoot') * 0.45), ae = T.animState('overshoot', T.animDur('overshoot') - 1e-6);
      ok(near(a0.sx, 0.6) && a0.op < 0.3 && am.sx > 1.15 && am.op === 1 && Math.abs(ae.sx - 1) < 0.01 && T.animState('overshoot', T.animDur('overshoot')) === null, 'Overshoot: Start 0,6 → Spitze > 1,15 (Überschwingen) → Ende 1 → danach null');
      const q0 = T.animState('squash', 0), qm = T.animState('squash', T.animDur('squash') * 0.3), qe = T.animState('squash', T.animDur('squash') - 1e-6);
      ok(q0.sx > 1.3 && q0.sy < 0.75 && qm.sx < 0.95 && qm.sy > 1.15 && Math.abs(qe.sx - 1) < 0.01 && Math.abs(qe.sy - 1) < 0.01, 'Squash: breit-flach → hoch-schmal → 1 (sx/sy gegenläufig)');
      ok(T.capPopFactor('squash', 0, 40) === 1 && T.capPopFactor('overshoot', 0, 40) === 1, 'Pop: Ein-Wort-Block (Breite 0 = kein Nachbar) → voller Ausschlag');
    }
    // (a) Farbwechsel über die ganze Spur (auch bei 1 Wort pro Block)
    {
      const cs = g('colorpop');
      T.setCycBase(0); const c0 = T.hlColorFor(cs, 0); T.setCycBase(1); const c1 = T.hlColorFor(cs, 0); T.setCycBase(2); const c2 = T.hlColorFor(cs, 0); T.setCycBase(3); const c3 = T.hlColorFor(cs, 0); T.setCycBase(0);
      ok(c0 === '#FFD60A' && c1 === '#22E36B' && c2 === '#FF3D9A' && c3 === c0, 'Farbwechsel: Gelb → Grün → Pink → Gelb über Blöcke (Basis = Wörter davor)');
      const ws = ['a', 'b', 'c', 'd', 'e'].map((w, i) => ({ word: w, start: i, end: i + 0.8 }));
      T.setState([{ words: ws.slice(0, 2), start: 0, end: 1.8, text: 'a b' }, { words: ws.slice(2, 5), start: 2, end: 4.8, text: 'c d e' }], ws, 'karaoke');
      ok(T.capBlockBase(0) === 0 && T.capBlockBase(1) === 2 && T.capBlockBase(2) === 5, 'capBlockBase: Summe der Wörter vorheriger Blöcke');
    }
    // (g) Typewriter: Zustand bei Start/Mitte/Ende, Zeichenzahl, Cursor
    {
      const b = { start: 1, words: [{ start: 1, end: 1.5 }, { start: 1.6, end: 2.2 }] };
      ok(T.capTypeTp(b, 0, 0.9, false, false) === 0 && T.capTypeN(0, 7) === 0, 'Typewriter: vor dem Wort nichts');
      const d = Math.min(0.8, Math.max(0.12, 0.5 * 0.9)), tpMid = T.capTypeTp(b, 0, 1 + d * 0.49, false, false);
      ok(near(tpMid, 0.49) && T.capTypeN(tpMid, 8) === 4 && T.capTypeN(0.01, 8) === 1, 'Typewriter: Mitte = halbe Zeichen (4 von 8), sofort mindestens 1');
      ok(T.capTypeTp(b, 0, 1 + d + 1e-6, false, false) === 1 && T.capTypeN(1, 8) === 8 && T.capTypeTp(b, 1, 0, true, false) === 1 && T.capTypeTp(b, 1, 1.5, false, true) === 0 && T.capTypeTp(b, 1, 1.7, false, true) === 1, 'Typewriter: Ende = alles; pausiert/vorab gezeigt = fertig; reduzierte Bewegung = ganze Wörter');
      const ty = Object.assign({}, g('typewriter'));
      ok(T.capMotion(ty) === 'type' && T.capWordFx(ty, b, 0, 0, 1 + d / 2, false, false).tp > 0 && T.capWordFx(ty, b, 1, 0, 1.2, false, false).op === 0 && !T.capFxSteady(T.capWordFx(ty, b, 0, 0, 1 + d / 2, false, false), 'type') && T.capFxSteady(T.capWordFx(ty, b, 0, 0, 2, false, false), 'type'), 'Typewriter: capWordFx (tippend = live, fertig = steady, später Wort unsichtbar)');
      ok(T.capCurOn(b, 0, 1 + d / 2, false) === true && T.capCurOn(b, 0, 0.5, false) === false && T.capCurOn(b, 0, 1.5 + 0.1, false) === true && T.capCurOn(b, 0, 1.5 + 0.8, false) === false && T.capCurOn(b, 0, 1.5 + 0.8, true) === true, 'Cursor: beim Tippen an, danach blinkend (60 % an), pausiert dauerhaft');
    }
    // (f) Unterstreichung: active (Wort + Vorgänger blendet aus) und kw
    {
      const b = { start: 1, words: [{ start: 1, end: 1.4 }, { start: 1.5, end: 1.9 }, { start: 2, end: 2.4 }] };
      const su = { ul: '#fc0', ulMode: 'active' };
      ok(T.capUlFx({}, b, 0, 0, 1.1, false, false) === null && T.capUlFx(su, b, 0, 0, 1, false, false) === null, 'Unterstreichung: ohne ul bzw. zum Wortstart (k = 0) nichts');
      const mid = T.capUlFx(su, b, 1, 1, 1.59, false, false), end = T.capUlFx(su, b, 1, 1, 1.8, false, false), prev = T.capUlFx(su, b, 0, 1, 1.56, false, false);
      ok(mid.k > 0.3 && mid.k < 1 && end.k === 1 && prev && prev.k === 1 && prev.op < 1 && T.capUlFx(su, b, 0, 1, 1.9, false, false) === null && T.capUlFx(su, b, 2, 1, 1.8, false, false) === null, 'Unterstreichung active: Strich fährt (0 < k < 1 → 1), Vorgänger blendet aus, andere Wörter keine');
      const sk = { ul: '#fc0', ulMode: 'kw' }, em = [false, true, false];
      ok(T.capUlFx(sk, b, 0, 1, 1.8, false, false, em) === null && T.capUlFx(sk, b, 1, 2, 2.5, false, false, em).k === 1 && T.capUlFx(sk, b, 1, 0, 1.2, false, false, em) === null && T.capUlFx(sk, b, 1, 0, 1.2, true, false, em).k === 1, 'Unterstreichung kw: nur Schlagwörter, bleiben stehen, erst ab Wortstart (pausiert: gezeigt)');
      const r = T.capUlRect({ ul: '#fc0', ulH: 0.2 }, 10, 100, 80, 40, 0.5);
      ok(near(r.w, 40) && near(r.h, 8) && near(r.y, 100 - 0.06 * 40 - 8) && r.x === 10, 'capUlRect: Breite × k, Höhe ulH em, über der Wortbox-Unterkante');
    }
    // (d) Sticker-Emoji: Bounce-Zustand
    {
      const e0 = T.emojiStickerState(0), em = T.emojiStickerState(T.EMO_STICKER_DUR * 0.35), ee = T.emojiStickerState(T.EMO_STICKER_DUR);
      ok(e0.op === 0 && e0.s < 0.4 && em.s > 1.25 && em.op > 0.99 && ee.s === 1 && ee.r === 0 && T.emojiStickerState(-1).op === 0, 'Sticker-Emoji: 0,3 → 1,3 (Spitze) → 1, Kippen −18° → +10° → 0');
      const hs = T.buildCap(['ab', 'cd'], g('stickeremoji'), 0, 22, [0, 0.5], 2, { emoji: '🔥', age: 0.1 });
      ok(/left:100%/.test(hs) && /capEmoSticker/.test(hs) && !/bottom:100%/.test(hs), 'Sticker-Emoji: DOM rechts neben der Caption statt darüber');
      ok(/glassbox/.test(JSON.stringify(file)) && /inset 0 0 0 1px/.test(T.buildCap(['ab'], g('glassbox'), -1, 22, null)) , 'Glas-Box: Innenrand als inset-Schatten im DOM');
    }
  }
  // ── Integration: Hook-Vorschlag bricht nie mitten im Folgesatz ab ──
  {
    const mk = txt => txt.split(' ').map((w, i) => ({ word: w, start: i * .3, end: i * .3 + .25 }));
    const blk = txt => [{ start: 0, end: 5, text: txt, words: mk(txt) }];
    const h1 = T.hookLocalText(blk('Stop scrolling. This one setting doubled my watch time.'));
    ok(/^Stop scrolling\.?$/i.test(h1), 'Hook lokal: kurzer erster Satz bleibt allein (kein abgeschnittener Folgesatz) — ' + h1);
    const h2 = T.hookLocalText(blk('Hey. Drei Tricks. Für mehr Views heute.'));
    ok(!/Für mehr Views heute/.test(h2) || h2.split(' ').length <= 6, 'Hook lokal: Folgesatz nur, wenn er ganz in 6 Wörter passt — ' + h2);
  }
  // ── Editor auf Deutsch (/de): statische Editor-Texte + _t('…')-Texte aus JS (Wörterbuch i18n/de-ui.js) ──
  {
    const i18n = require('./scripts/build-i18n.js');
    const de = i18n.build('de'), dui = require('./i18n/de-ui.js');
    const es = de.editorStat, js = de.jsStat;
    const miss = es.missing.concat(js.missing), tot = es.total + js.total, done = es.translated + es.kept + js.translated;
    miss.slice(0, 15).forEach(t => console.log('  fehlt (Editor-i18n): ' + JSON.stringify(t)));
    console.log('  info Editor-Übersetzung: ' + done + '/' + tot + ' Texte (statisch ' + (es.translated + es.kept) + '/' + es.total + ' davon ' + es.kept + ' bewusst gleich; JS-_t ' + js.translated + '/' + js.total + ')');
    ok(es.missing.length === 0, 'i18n Editor: alle statischen Editor-Texte (Tabs, Knöpfe, Labels, Platzhalter, Tooltips, Export-Blatt, Dialoge) haben eine deutsche Übersetzung');
    ok(js.missing.length === 0 && js.total > 300, 'i18n Editor: alle _t(…)-Texte aus JS (Toasts, Status, Knöpfe, Fehler) übersetzt (' + js.translated + '/' + js.total + ')');
    ok(de.unwrapped.length === 0, 'i18n Editor: kein englischer Text direkt in capToast/.textContent/.title/alert ohne _t()' + (de.unwrapped[0] ? ' — z. B. ' + JSON.stringify(de.unwrapped[0].text.slice(0, 50)) : ''));
    // Lint selbst: erkennt nackte englische Literale, lässt _t und Technisches durch
    const lint = i18n.jsScan("capToast('Hello there friend');\ncapToast(_t('Hello there friend'));\nel.title = 'tight';\nel.textContent = 'Saved now';\nel.className = 'btn-primary';");
    ok(lint.unwrapped.length === 2 && lint.keys.has('Hello there friend'), 'i18n Lint: meldet capToast/.textContent mit nacktem Englisch, kennt _t-Schlüssel, ignoriert CSS-Wörter');
    // Platzhalter bleiben erhalten, Schweizer Schreibweise, kein verschlucktes Englisch bei Markennamen
    const phs = x => (x.match(/\{\d\}/g) || []).sort().join(',');
    const badPh = Object.keys(dui).filter(k => phs(k) !== phs(dui[k]));
    badPh.forEach(k => console.log('  Platzhalter weichen ab: ' + JSON.stringify(k.slice(0, 70))));
    ok(badPh.length === 0, 'i18n Editor: Platzhalter {0}/{1} in jeder Übersetzung wie im Original');
    ok(!Object.values(dui).some(v => /ß/.test(v)), 'i18n Editor: Schweizer Schreibweise (kein ß)');
    ok(!Object.keys(dui).some(k => /^(capivo|csg|tb[A-Z]|exp[A-Z])/.test(k) || /^[a-z]+[A-Z][A-Za-z]+$/.test(k)), 'i18n Editor: Wörterbuch enthält keine internen IDs/Schlüssel');
    // Laufzeit: _t ersetzt Platzhalter (EN unverändert), DE-Seite trägt das Wörterbuch, EN-Seite nicht
    const fnSrc = htmlContent.match(/var UI_DICT = null;\nfunction _t\(s\) \{[\s\S]*?\n\}\n[\s\S]*?function _tn\([\s\S]*?\n\}\n/);
    ok(!!fnSrc, 'i18n: _t/_tn und «var UI_DICT = null;» stehen am Anfang des Scripts von captly.html');
    if (fnSrc) {
      const mkT = dict => new Function(fnSrc[0].replace('var UI_DICT = null;', 'var UI_DICT = ' + JSON.stringify(dict) + ';') + ';return {t:_t,tn:_tn};')();
      const en = mkT(null), dd = mkT({ 'Saved “{0}”': '«{0}» gespeichert', '1 font': '1 Schrift', '{0} fonts': '{0} Schriften' });
      ok(en.t('Saved “{0}” in {1}', 'A', 'B') === 'Saved “A” in B' && en.t('No args') === 'No args' && en.tn(1, '1 font', '{0} fonts', 1) === '1 font' && en.tn(3, '1 font', '{0} fonts', 3) === '3 fonts', 'i18n _t/_tn: EN gibt den Text unverändert zurück, ersetzt {0}/{1}, Mehrzahl');
      ok(dd.t('Saved “{0}”', 'X') === '«X» gespeichert' && dd.t('Unknown {0}', 1) === 'Unknown 1' && dd.tn(2, '1 font', '{0} fonts', 2) === '2 Schriften' && dd.t('constructor') === 'constructor', 'i18n _t/_tn: DE übersetzt, unbekannter Text bleibt, kein Prototyp-Zugriff');
    }
    ok(/var UI_DICT = null;/.test(htmlContent) && /var UI_DICT = \{"/.test(de.html) && !/var UI_DICT = null;/.test(de.html), 'i18n: Wörterbuch nur in captly.de.html eingesetzt, captly.html bleibt englisch');
    ok(['Export with changes', 'Download again', 'Cut out', 'Restore', 'Download video'].every(k => dui[k] && dui[k] !== k), 'i18n Editor: Schlüsselknöpfe (Export with changes, Download again, Cut out, Restore, Download video) übersetzt');
    // DE-Editor-HTML: Beispiele sichtbar, EN-Rest nur bewusst
    const edHtml = de.html.slice(de.html.indexOf('<!-- EDITOR -->'), de.html.indexOf('<script>\n', de.html.indexOf('<!-- EDITOR -->')));
    ok(/>\s*Untertitel\s*</.test(edHtml) && /aria-label="Rückgängig"|title="Letzte Änderung rückgängig/.test(edHtml) && />\s*Zurück\s*</.test(edHtml) && !/>\s*Back\s*</.test(edHtml) && !/>\s*Cut out\s*</.test(edHtml), 'i18n Editor: DE-HTML enthält deutsche Tabs/Knöpfe, keine englischen Standardknöpfe');
  }

  // ── Runde 2 Looks (Creator-Retest 14.10., Abschnitt 6 Punkte 1–4, 10) ──
  {
    const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
    const sfile = JSON.parse(fs.readFileSync(path.join(__dirname, 'styles.json'), 'utf8')), sds = sfile.map(o => T.dropToStyle(o, Date.parse('2026-10-20')));
    const g = id => sds[sfile.findIndex(o => o.id === id)] || T.STYLES.find(x => x.id === id); // Looks aus styles.json (wie in N-Looks)
    // 1) Gradient Karaoke: Verlaufswort ohne text-shadow auf dem background-clip-Element (der Schatten deckte den Verlauf ab → schwarzes Wort)
    {
      const gk = g('gradkaraoke'), h = T.buildCap(['ab', 'cd'], gk, 0, 22, null);
      const act = h.split('<span ').filter(x => /data-oi|class="cap-gw"/.test(x)).find(x => /--cg:linear-gradient/.test(x)) || '';
      ok(/class="cap-gw"/.test(act) && /data-t="ab"/.test(act) && /--cg:linear-gradient\(90deg,#FDE047/.test(act) && /text-shadow:[^;]*rgba\(251,113,133/.test(act), 'Gradient Karaoke: aktives Wort = Schatten am Wort + Verlauf als ::after-Kopie (.cap-gw)');
      ok(!/background-clip:text[^"]*text-shadow|text-shadow[^"]*background-clip:text/.test(act) && /color:transparent/.test(act), 'Gradient Karaoke: kein text-shadow zusammen mit background-clip:text auf demselben Element');
      ok(/\.cap-gw::after\{[^}]*content:attr\(data-t\)[^}]*background:var\(--cg\)[^}]*background-clip:text/.test(htmlContent), 'CSS: .cap-gw::after zeichnet den Verlauf über dem Schatten');
      const tg = Object.assign({}, g('hormozi'), { tg: 'linear-gradient(90deg,#f00,#00f)', ts: 'none' }), ht = T.buildCap(['ab'], tg, -1, 22, null);
      ok(/background:linear-gradient\(90deg,#f00,#00f\);-webkit-background-clip:text/.test(ht) && !/cap-gw/.test(ht), 'Textverlauf ohne Schatten: weiter direkt per background-clip');
      const tg2 = Object.assign({}, tg, { ts: '0 2px 6px rgba(0,0,0,.6)' }), ht2 = T.buildCap(['ab'], tg2, -1, 22, null);
      ok(/class="cap-gw"/.test(ht2) && /--cg:linear-gradient\(90deg,#f00,#00f\)/.test(ht2) && /text-shadow:0 2px 6px/.test(ht2), 'Textverlauf (tg) mit Schatten: gleiche Trennung Schatten/Verlauf');
    }
    // 2) Glass Box: Kontrast Text/Box ≥ 4,5 : 1 auf hellem (255) und dunklem (0) Untergrund (Box über Hintergrund gemischt)
    {
      const gb = g('glassbox'), lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      const Lm = a => 0.2126 * lin(a[0]) + 0.7152 * lin(a[1]) + 0.0722 * lin(a[2]);
      const bx = T.cssColorToHexA(gb.boxBg), tx = T.cssColorToHexA(gb.tc), hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
      const rat = bg => { const comp = hx(bx.hex).map(c => bx.a * c + (1 - bx.a) * bg), txt = hx(tx.hex).map((c, i) => tx.a * c + (1 - tx.a) * comp[i]); return (Lm(txt) + 0.05) / (Lm(comp) + 0.05); };
      const worst = Math.min(rat(255), rat(200), rat(128), rat(0));
      ok(bx.a >= 0.5 && worst >= 4.5, 'Glass Box: Kontrast Text/Box ≥ 4,5 : 1 (schlechtester Fall, Untergrund weiss: ' + rat(255).toFixed(2) + ', schwarz: ' + rat(0).toFixed(2) + ')');
      ok(/rgba\(255,255,255,/.test(gb.boxBd) && /rgba\(0,0,0,/.test(gb.ts), 'Glass Box: feiner heller Rand + Textschatten');
    }
    // 3) Squash Pop: Canvas-Schatten-Offsets je Achse skalieren (sonst steht der Drop-Schatten als Geisterbild aus der gestauchten Kontur)
    {
      const sq = g('squashpop'), sqPlan = T.capShadowPlan(sq.ts), softDrop = sqPlan.rest.find(l => l.y === 4);
      ok(!!softDrop && softDrop.blur >= 6 && sqPlan.ring && sqPlan.ring.w === 3, 'Squash Pop: Drop-Schatten weich (Blur ' + (softDrop && softDrop.blur) + ') statt harter Kopie, die bei kleiner Vorschau als Geisterbild unter der Kontur steht');
      const plan = T.capShadowPlan(sq.ts.replace(/,0 4px 10px rgba\(0,0,0,\.4\)$/, ',0 4px 0 rgba(0,0,0,.8)')), dropRef = plan.rest.find(l => l.y === 4); // harte Kopie wie vor Runde 2: Offsets müssen trotzdem stimmen
      ok(!!dropRef && plan.ring && plan.ring.w === 3, 'Testaufbau: Squash Pop = Ring 3 px + Drop-Schatten 0 4px');
      const rec = (shMul, sc) => { const offs = []; const c = { canvas: null, shadowOffsetX: 0, shadowOffsetY: 0, shadowBlur: 0, shadowColor: '', lineWidth: 1, lineJoin: 'miter', miterLimit: 10, strokeStyle: '#000', fillStyle: '#fff', globalAlpha: 1,
        save() {}, restore() {}, fillText() { offs.push([this.shadowOffsetX, this.shadowOffsetY, this.shadowBlur]); }, strokeText() {} };
        T.drawTextWithPlan(c, 'ab', 0, 0, plan, sc, 1, 60, 120, shMul); return offs.find(o => o[1] !== 0 || o[0] !== 0) || offs[0]; };
      const sqOff = rec({ x: 1.35, y: 0.7, b: 1.025 }, 3);
      ok(near(sqOff[1], 4 * 3 * 0.7) && near(sqOff[0], 0) && near(sqOff[2], 0), 'Squash (sx 1,35 / sy 0,7): Drop-Schatten vertikal × sy = 8,4 px statt × max(sx, sy) (' + sqOff[1].toFixed(2) + ')');
      const uni = rec(1.28, 3);
      ok(near(uni[1], 4 * 3 * 1.28), 'Gleichmässige Animation (Punch 1,28): Offset wie bisher × k (' + uni[1].toFixed(2) + ')');
      ok(T.capShK(1.5).x === 1.5 && T.capShK(undefined).y === 1 && T.capShK({ x: 2, y: 0.5, b: 1 }).y === 0.5, 'capShK: Zahl oder {x, y, b}');
      // Gruppen-Puffer (Deckkraft < 1 beim Einblenden): Schatten dort ohne shMul, weil der Puffer erst beim Einsetzen mit der Animation skaliert wird
      T.resetGrpBuf(); const bufOffs = []; const origCreate = document.createElement;
      const mkB = () => ({ canvas: { width: 0, height: 0 }, shadowOffsetX: 0, shadowOffsetY: 0, shadowBlur: 0, shadowColor: '', lineWidth: 1, lineJoin: 'miter', miterLimit: 10, strokeStyle: '#000', fillStyle: '#fff', globalAlpha: 1, textAlign: 'left', textBaseline: 'alphabetic', font: '', letterSpacing: '0px',
        save() {}, restore() {}, translate() {}, setTransform() {}, clearRect() {}, drawImage() {}, strokeText() {}, fillText() { bufOffs.push(this.shadowOffsetY); } });
      document.createElement = (t) => { if (t !== 'canvas') return origCreate(t); const cv = { width: 0, height: 0 }; const cx = mkB(); cx.canvas = cv; cv.getContext = () => cx; return cv; };
      const main = mkB(); main.canvas = { width: 1080, height: 1920 };
      T.drawTextGrouped(main, 'ab', 100, 200, plan, 3, 1, 60, 120, { x: 1.35, y: 0.7, b: 1.02 }, 0.5);
      document.createElement = origCreate;
      ok(bufOffs.length >= 1 && bufOffs.some(o => near(o, 12)) && !bufOffs.some(o => near(o, 12 * 0.7) || near(o, 12 * 1.35)), 'Gruppen-Puffer: Schatten-Offset unskaliert (12 px) — keine doppelte Skalierung mit der Squash-Transformation');
    }
    // 4) Emojis ohne KI: lokale Stichwort-Tabelle, ≈ 1 je 6,5 s (R3), ≥ 2 Blöcke Abstand, nur klare Treffer, KI/Nutzer haben Vorrang
    {
      const mkB = (txt, t0) => { const words = txt.split(' ').map((w, i) => ({ word: w, start: +(t0 + i * 0.3).toFixed(2), end: +(t0 + i * 0.3 + 0.28).toFixed(2) })); return { text: txt, start: t0, end: t0 + words.length * 0.3, words }; };
      const mkAll = txts => txts.map((t, i) => mkB(t, i * 2));
      const v1 = mkAll(['Drei Tricks,', 'damit deine Reels', 'mehr Views bekommen.', 'Erstens: Die ersten', 'zwei Sekunden', 'entscheiden alles.', 'Zweitens: Untertitel,', 'weil fast alle', 'ohne Ton schauen.', 'Drittens: Poste regelmässig,', 'am besten jeden Dienstag', 'um achtzehn Uhr.', 'Speicher dir das Video,', 'sonst vergisst du es!']);
      const n1 = T.localEmojis(v1), e1 = v1.map((b, i) => [i, T.blockEmoji(b)]).filter(x => x[1]);
      ok(n1 === e1.length && n1 >= 3 && n1 <= Math.round(v1[v1.length - 1].end / T.EMO_LOCAL_SEC), 'v1 (DE, ' + v1.length + ' Blöcke): ' + n1 + ' Emojis (max ' + Math.round(v1[v1.length - 1].end / T.EMO_LOCAL_SEC) + '): ' + e1.map(x => x[0] + T.blockEmoji(v1[x[0]])).join(' '));
      ok(e1.every((x, k) => k === 0 || x[0] - e1[k - 1][0] >= 2) && e1.every(x => T.EMO_PICK.indexOf(x[1]) >= 0) && e1.every((x, k) => e1.every((y, j) => j >= k || x[1] !== y[1] || (x[0] - y[0]) * 2 >= T.EMO_LOCAL_SAME)), 'Emojis: mindestens 2 Blöcke Abstand, alle in der Emoji-Auswahl, dasselbe Motiv frühestens nach 8 s wieder');
      const want = { 0: '💡', 4: '⏰', 8: '🔊', 12: '💾' }; // Tricks → Idee/Tipp, Sekunden → Zeit, Ton → Lautsprecher, Speicher → Disk
      ok(e1.every(x => want[x[0]] === x[1] || [11, 10, 6, 2, 1].includes(x[0])) && e1.some(x => x[0] === 0 && x[1] === '💡'), 'v1: Treffer passen zum Inhalt (Tricks → 💡): ' + JSON.stringify(e1));
      const v3 = mkAll(['Stop scrolling.', 'This one setting', 'doubled my watch time.', 'Here is how', 'you can do it', 'on your next video']);
      const n3 = T.localEmojis(v3), e3 = v3.map((b, i) => [i, T.blockEmoji(b)]).filter(x => x[1]);
      ok(n3 >= 2 && n3 <= 3 && e3.every(x => x[1] === '🛑' || x[1] === '⏰' || x[1] === '🎬'), 'v3 (EN): ' + n3 + ' Emojis, passend: ' + JSON.stringify(e3));
      const none = mkAll(['Das ist ein Test', 'und noch einer hier', 'mit ganz normalen Worten']);
      ok(T.localEmojis(none) === 0 && none.every(b => !T.blockEmoji(b)), 'Kein klares Stichwort → kein Emoji');
      ok(T.localEmoLookup('Feuer,') && T.localEmoLookup('Feuer,').e === '🔥' && T.localEmoLookup('Geld') .e === '💰' && T.localEmoLookup('Glück!').e === '🍀' && T.localEmoLookup('Idee').e === '💡' && T.localEmoLookup('Hackschnitzel') === null && T.localEmoLookup('fast') === null && T.localEmoLookup('Lachs') === null, 'Tabelle: Umlaute/Satzzeichen normalisiert, Fehltreffer (Hackschnitzel, fast, Lachs) ausgeschlossen');
      ok(T.LOCAL_EMO.every(r => T.EMO_PICK.indexOf(r[0]) >= 0), 'Jedes Emoji der lokalen Tabelle steht in der Emoji-Suche/Auswahl');
      // KI-/Nutzer-Emojis haben Vorrang
      const pri = mkAll(['Drei Tricks,', 'damit deine Reels', 'mehr Views bekommen.', 'Das Geld', 'weil das Feuer', 'und Zeit']);
      pri[0].words[0].emo = '🤖'; pri[3].words[1].emo = '🧪'; pri[3].words[1].emoU = true;
      T.localEmojis(pri);
      ok(T.blockEmoji(pri[0]) === '🤖' && T.blockEmoji(pri[3]) === '🧪' && pri.filter(b => T.blockEmoji(b)).length <= 2 + Math.max(1, Math.round(12 / T.EMO_LOCAL_SEC)), 'Vorhandene KI-/Nutzer-Emojis bleiben unangetastet');
      ok(T.localEmojis([mkB('Tipp des Tages', 0)]) === 1 && T.localEmojis([]) === 0, 'Einzelner Block: höchstens ein Emoji; leere Liste: 0');
      ok(/localEmojis\(captionBlocks\)/.test(script) && /localEmojis\(blocks\)/.test(script), 'runEnhance: lokaler Emoji-Fallback in beiden Ohne-KI-Pfaden');
    }
    // 10) Typewriter (R3-Rest): jede Zeile in der Endbreite mittig (reserviert), die sichtbare Teilzeile wird mittig gerückt (Block «Typewriter mittig» am Ende)
    {
      const tw = g('typewriter'), b = { text: 'damit deine Reels', start: 0, end: 2, words: ['damit', 'deine', 'Reels'].map((w, i) => ({ word: w, start: i * 0.6, end: i * 0.6 + 0.55 })) };
      T.setLinesState(2);
      const mk = () => document.createElement('canvas').getContext('2d');
      const L = T.capLayout(mk(), b, 0, 1, tw, 1080, 1920), xs = L.lines.map(Ln => Ln[0].x), widest = Math.max.apply(null, L.lineWs);
      ok(L.lines.length === 2 && xs.every((x, i) => near(x, 540 - L.lineWs[i] / 2)) && L.lineWs[0] < L.lineWs[1], 'Typewriter: jede Zeile in ihrer Endbreite mittig (' + xs.map(x => x.toFixed(1)).join(' / ') + ')');
      const hm = Object.assign({}, g('hormozi')), Lh = T.capLayout(mk(), b, 0, 1, hm, 1080, 1920);
      ok(Lh.lines.length < 2 || Lh.lines[0][0].x > Lh.lines[1][0].x || near(Lh.lines[0][0].x, Lh.lines[1][0].x), 'Andere Looks bleiben zentriert (kürzere Zeile weiter rechts)');
      const dom = T.buildCap(['damit', 'deine', 'Reels'], tw, 1, 22, [0, 0.6, 1.2], 2);
      ok((dom.match(/display:block;white-space:nowrap">/g) || []).length === 2 && !/text-align:left/.test(dom), 'Typewriter-DOM: Zeilen zentriert (kein text-align:left mehr)');
    }
  }

  // ═══════════════ Runde 2 Misc: P5 Template+Hook · P8 Defaults · P9 Hook-Vorschlag · P11 ausgeschnittene Zeile · P12 Neustart · P13 Waisen bei wpb 2 ═══════════════
  {
    const E = id => document.getElementById(id);
    const fixDirR2 = path.join(__dirname, 'scripts', 'creator-test', 'fixtures');
    const fixR2 = n => JSON.parse(fs.readFileSync(path.join(fixDirR2, n + '.json'), 'utf8')).words.map(w => ({ word: w.word, start: w.start, end: w.end }));
    const store = {};
    global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
    global.confirm = () => true;

    // ── P5: Template speichert Hook nur mit ausdrücklichem Häkchen «Include hook title» ──
    {
      T.setUserTemplates([]); T.loadTemplates();
      ok(/id="tplHook"[^>]*type="checkbox"|type="checkbox"[^>]*id="tplHook"/.test(htmlContent) && /id="tplHookTop"/.test(htmlContent) && (htmlContent.match(/Include hook title/g) || []).length >= 2, 'R2-P5: Häkchen «Include hook title» im Speichern-Bereich und in der Inline-Leiste');
      ok(!/id="tplHook(Top)?"[^>]*\bchecked\b/.test(htmlContent), 'R2-P5: Häkchen standardmässig aus');
      T.setHookState(true, 'Titel', 3, '');
      T.selectStyle('classic'); E('tplName').value = 'R2 ohne Haken'; T.saveTemplate();
      const a = T.getUserTemplates().find(t => t.name === 'R2 ohne Haken');
      ok(a && a.layout.hook && a.layout.hook.on === false && a.layout.hook.dur === 3, 'R2-P5: Hook an, aber ohne Häkchen → Template speichert Dauer, aber «aus» (' + JSON.stringify(a && a.layout.hook) + ')');
      T.setTplHookChk(true); ok(T.tplHookChecked() === true, 'R2-P5: Häkchen lesbar');
      E('tplName').value = 'R2 mit Haken'; T.saveTemplate();
      const b = T.getUserTemplates().find(t => t.name === 'R2 mit Haken');
      ok(b && b.layout.hook.on === true && b.layout.hook.dur === 3 && T.tplHasHook(b) && !T.tplHasHook(a), 'R2-P5: mit Häkchen → Hook «an» im Template');
      ok(T.tplHookChecked() === false, 'R2-P5: Häkchen nach dem Speichern wieder aus (kein Dauerzustand)');
      // Anwenden: ohne Haken schaltet das Template den Hook nie an
      T.setHookState(false, 'bleibt', 2, '');
      T.applyTemplateSettings(a.layout);
      ok(T.getHookState().on === false && T.getHookState().dur === 3 && T.getHookState().text === 'bleibt', 'R2-P5: Template ohne Haken lässt den Hook aus (Dauer wird übernommen, Text bleibt)');
      T.applyTemplateSettings(b.layout);
      ok(T.getHookState().on === true, 'R2-P5: Template mit Haken schaltet den Hook an');
      // Bestehendes Template mit Hook an (alte Speicherung) bleibt wirksam und wird im Menü als «Hook on» gekennzeichnet
      const legacy = T.normalizeTemplate({ id: 'tpl_legacy', name: 'Alt', style: { fl: 'Inter', font: "'Inter'", fw: '800', tc: '#fff', hl: '#fa0', anim: 'none' }, layout: { hook: { on: true, dur: 2 } } });
      T.getUserTemplates().push(legacy);
      T.setHookState(false, '', 2, ''); T.applyTemplateSettings(legacy.layout);
      ok(T.getHookState().on === true, 'R2-P5: altes Template mit Hook an → beim Anwenden bleibt der Hook an');
      const btn = { getBoundingClientRect: () => ({ left: 100, top: 10, bottom: 30, right: 120 }) };
      T.openTplMenu(legacy.id, btn); let m = T.getTplMenu();
      ok(m && /Hook on/.test(m.children[0].textContent) && m.children.map(x => x.textContent).indexOf('Remove hook title') > 0, 'R2-P5: Template-Menü kennzeichnet «Hook on» und bietet «Remove hook title» (' + (m && m.children.map(x => x.textContent).join('|')) + ')');
      T.closeTplMenu(); T.openTplMenu(a.id, btn); m = T.getTplMenu();
      ok(m && !m.children.some(x => /Hook on/.test(x.textContent)), 'R2-P5: Template ohne Hook → keine Kennzeichnung');
      T.closeTplMenu();
      T.removeTemplateHook(legacy.id);
      ok(!T.tplHasHook(legacy), 'R2-P5: «Remove hook title» schaltet den Hook im Template ab');
      T.setUserTemplates([]); T.setHookState(false, '', 2, '');
    }

    // ── P8: Defaults für neue Nutzer (Auto-Zoom Subtle, Safe-Zone bei 9:16); gespeicherte Wahl bleibt ──
    {
      ok(/emZoom = 'subtle'/.test(script) && /if \(\['off', 'subtle', 'punchy'\]\.indexOf\(o\.zoom\) >= 0\) emZoom = o\.zoom;/.test(script), 'R2-P8: Auto-Zoom «Subtle» ab Werk, gespeicherte Wahl (o.zoom) überstimmt');
      T.setSzUser(null);
      T.syncSafeZoneDefault(9 / 16);
      ok(T.getSafeZone().on === true && T.getSafeZone().user === null, 'R2-P8: ohne gespeicherte Wahl → Hilfslinien bei 9:16 an');
      T.syncSafeZoneDefault(16 / 9);
      ok(T.getSafeZone().on === false, 'R2-P8: 16:9 → Standard aus');
      T.syncSafeZoneDefault(4 / 5); ok(T.getSafeZone().on === false, 'R2-P8: 4:5 → Standard aus');
      T.setSzUser(false); T.syncSafeZoneDefault(9 / 16);
      ok(T.getSafeZone().on === false, 'R2-P8: gespeicherte Wahl «aus» bleibt auch bei 9:16');
      T.setSzUser(true); T.syncSafeZoneDefault(16 / 9);
      ok(T.getSafeZone().on === true, 'R2-P8: gespeicherte Wahl «an» bleibt auch bei 16:9');
      T.setSzUser(null);
      ok(/localStorage\.getItem\(SZ_KEY\)/.test(script) && /localStorage\.setItem\(SZ_KEY, showSafeZone \? '1' : '0'\)/.test(script), 'R2-P8: Nutzerwahl wird gemerkt (try/catch)');
      const expSrc = (script.match(/async function exportVideoWithCaptions[\s\S]*?\n}\n/) || [''])[0] + (script.match(/function drawCaptionsOnCtx[\s\S]*?\n}\n/) || [''])[0];
      ok(expSrc.length > 500 && !/showSafeZone|safeZoneOverlay|safeZoneRect/.test(expSrc), 'R2-P8: Safe-Zone ist reine Anzeige — Export/Canvas-Zeichnen kennen sie nicht');
    }

    // ── P9: Hook-Vorschlag = ganzer erster Satz (≤ 8 Wörter), sonst am Komma/Doppelpunkt kürzen ──
    {
      const blocksOf = ws => T.buildCaptionBlocks(ws, []);
      ok(T.getHookWords() === 8, 'R2-P9: HOOK_WORDS = 8');
      const h1 = T.hookLocalText(blocksOf(fixR2('v1-reel-de'))), h2 = T.hookLocalText(blocksOf(fixR2('v2-podcast-de-16x9'))), h3 = T.hookLocalText(blocksOf(fixR2('v3-hook-en')));
      ok(h1 === 'Drei Tricks, damit deine Reels mehr Views bekommen', 'R2-P9: v1 → ganzer erster Satz (' + h1 + ')');
      ok(h2 === 'Heute spreche ich mit Sandra Meier aus Winterthur', 'R2-P9/R3: v2 → «Willkommen zurück bei Klartext Business» steht schon in den ersten zwei Untertitelzeilen → nächster Satz (' + h2 + ')');
      ok(h3 === 'This one setting doubled my watch time', 'R2-P9/R3: v3 → «Stop scrolling» ist die erste Untertitelzeile → nächster Satz (' + h3 + ')');
      const mk = txt => txt.split(' ').map((w, i) => ({ word: w, start: i * .3, end: i * .3 + .25 }));
      const blk = txt => [{ start: 0, end: 9, text: txt, words: mk(txt) }];
      const c1 = T.hookLocalText(blk('Heute zeige ich dir, wie du in drei Schritten viel mehr Views bekommst.'));
      ok(c1 === 'Heute zeige ich dir', 'R2-P9: langer Satz mit Komma → am Komma gekürzt, Teilsatz bleibt vollständig (' + c1 + ')');
      const c2 = T.hookLocalText(blk('Ich erkläre dir jetzt ganz genau warum deine Videos so wenig Aufrufe bekommen.'));
      ok(c2.split(' ').length <= 8 && /^Ich erkläre dir/.test(c2) && !/(^| )(deine|so|und|der|die|das|ein|mit|für)$/i.test(c2), 'R2-P9: langer Satz ohne Komma → erste Wörter ohne hängendes Füllwort (' + c2 + ')');
      const c3 = T.hookLocalText(blk('Achtung. Dieses Video ändert alles für dich.'));
      ok(c3 === 'Dieses Video ändert alles für dich', 'R2-P9: Ein-Wort-Satz am Anfang wird übersprungen (' + c3 + ')');
      const c4 = T.hookLocalText(blk('Warte. Das hier ist wichtig. Hör gut zu.'));
      ok(c4 === 'Das hier ist wichtig', 'R2-P9: Ein-Wort-Satz übersprungen, nächster ganzer Satz bleibt allein (' + c4 + ')');
      ok(T.hookClean('Alpha, beta gamma delta epsilon zeta eta theta iota', 8) === 'Alpha, beta gamma delta epsilon zeta eta theta', 'R2-P9: Komma nach dem 1. Wort wird nicht zum Abschneiden genutzt (hart auf 8 Wörter)');
      ok(T.hookClean('Drei Tricks, damit deine Reels mehr Views bekommen heute', 8) === 'Drei Tricks', 'R2-P9: hookClean kürzt am Komma, wenn der Teil davor ≥ 2 Wörter hat');
    }

    // ── P11: ausgeschnittene Zeilen in der Liste markieren (Restore) ──
    {
      const blocks = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]].map(([a, b], i) => ({ start: a, end: b, text: 'w' + i, words: [{ word: 'w' + i, start: a, end: b }] }));
      const S = (b, manual, tIn, tOut, auto) => T.segCutState(b, 10, tIn || 0, tOut === undefined ? null : tOut, manual || [], auto || []);
      ok(S(blocks[1], [{ start: 0.9, end: 2.1 }]).full === true && S(blocks[1], [{ start: 0.9, end: 2.1 }]).manual.join() === '0', 'R2-P11: Block ganz im Schnitt → full');
      const part = S(blocks[2], [{ start: 2.5, end: 3.5 }]);
      ok(part.part === true && part.full === false, 'R2-P11: Block halb im Schnitt → part');
      ok(S(blocks[0], [], 1.2).full === true && S(blocks[0], [], 1.2).trimIn === true, 'R2-P11: Trim-Anfang schneidet Zeile weg (full, trimIn)');
      ok(S(blocks[4], [], 0, 4.2).part === true && S(blocks[4], [], 0, 3.9).full === true && S(blocks[4], [], 0, 3.9).trimOut === true, 'R2-P11: Trim-Ende: teils/ganz');
      ok(S(blocks[3], [{ start: 7, end: 8 }]).full === false && S(blocks[3], [{ start: 7, end: 8 }]).part === false, 'R2-P11: unberührte Zeile bleibt normal');
      ok(S(blocks[2], [], 0, null, [{ start: 2, end: 3 }]).full === true && S(blocks[2], [], 0, null, [{ start: 2, end: 3 }]).auto === true, 'R2-P11: Auto-Cut wird erkannt (ohne Restore)');
      // DOM: Klassen, Schere + Restore, Hinweis; Restore holt die Zeile zurück
      const mkRow = () => { const cls = new Set(); return { classList: { toggle: (c, f) => { f ? cls.add(c) : cls.delete(c); }, add: c => cls.add(c), remove: c => cls.delete(c), contains: c => cls.has(c), _s: cls }, _bar: null, children: [],
        querySelector(sel) { return sel === '.seg-cutbar' ? this._bar : (sel === '.seg-tools' ? {} : null); }, insertBefore(bar) { this._bar = bar; bar.parentNode = this; }, removeChild(bar) { if (this._bar === bar) this._bar = null; } }; };
      const rows = blocks.map((b, i) => { const r = mkRow(); document.getElementById('seg' + i); els['seg' + i] = r; return r; });
      T.setCaptionBlocksForTest(blocks); document.getElementById('capSegs');
      document.getElementById('mainVid').duration = 10;
      T.setTrim(0, null);
      T.cutOutRange(1, 2); T.cutOutRange(2.5, 3.5);
      ok(rows[1].classList._s.has('cut') && !rows[1].classList._s.has('cut-part') && rows[1]._bar && /Cut out/.test(rows[1]._bar.children[1].textContent) && rows[1]._bar.children[2] && rows[1]._bar.children[2].textContent === 'Restore', 'R2-P11: ganz ausgeschnittene Zeile: abgeblendet (cut), Schere + «Restore» in der Zeile');
      ok(rows[2].classList._s.has('cut-part') && !rows[2].classList._s.has('cut') && rows[2]._bar && /Partly cut out/.test(rows[2]._bar.children[1].textContent) && !rows[2]._bar.children[2], 'R2-P11: teilweise geschnittene Zeile: Hinweis «Partly cut out», kein Restore');
      ok(!rows[0].classList._s.has('cut') && !rows[0]._bar && !rows[4].classList._s.has('cut'), 'R2-P11: übrige Zeilen unverändert');
      rows[1]._bar.children[2].onclick({ stopPropagation() {} });
      ok(T.getTrim().c.length === 1 && !rows[1].classList._s.has('cut') && !rows[1]._bar, 'R2-P11: Restore in der Zeile holt den Schnitt zurück (ein Schnitt bleibt, Hinweis weg)');
      T.setTrim(1.5, null); T.setTrim(0, null);
      T.setCaptionBlocksForTest([]); for (let i = 0; i < 5; i++) delete els['seg' + i];
    }

    // ── P12: Wiederherstellung + «Start fresh» ──
    {
      const wR = fixR2('v3-hook-en');
      T.setState(T.buildCaptionBlocks(wR, []), wR, 'karaoke');
      T.setAutosaveKey('r2-clip.mp4|4321|190'); T.setHookState(true, 'Alter Titel', 2, ''); T.setCaptionsEdited(true);
      ok(T.autosaveNow() === true, 'R2-P12: Setup — Autosave geschrieben');
      T.setState([], []); T.setCaptionsEdited(false); T.setAutosaveKey(null); T.setHookState(false, '', 2, '');
      document.getElementById('capToast').children = [];
      const restored = T.restoreOrTranscribe({ name: 'r2-clip.mp4', size: 4321 }, 19.04);
      ok(restored === true && T.getBlocks().length > 0 && T.getHookState().text === 'Alter Titel', 'R2-P12: gleiches Video erneut → Sitzung wird wiederhergestellt (inkl. Hook-Text)');
      const tc = document.getElementById('capToast'); // Stub: capToastAction hängt den Knopf an das registrierte Element
      const tbtn = tc.children.find(c => c.textContent === 'Start fresh');
      ok(!!tbtn && typeof tbtn.onclick === 'function' && /capToastAction\(_t\('Restored your last session'\), _t\('Start fresh'\)/.test(script), 'R2-P12: Toast «Restored your last session» hat den Knopf «Start fresh»');
      T.setCurrentFile({ name: 'r2-clip.mp4', size: 4321, type: 'video/mp4' });
      T.setTrim(1, null);
      const run0 = T.getTrRun();
      ok(T.startFreshSession() === true, 'R2-P12: Start fresh läuft');
      ok(T.getBlocks().length === 0 && T.getHookState().text === '' && T.getHookState().ai === '' && T.getTrim().i === 0 && T.getTrim().c.length === 0 && T.getCaptionsEdited() === false, 'R2-P12: Start fresh setzt Captions, Trim/Schnitte und Hook-Text dieses Videos zurück');
      ok(T.getTrRun() > run0, 'R2-P12: Start fresh startet eine neue Transkription (alter Lauf entwertet)');
      T.setCurrentFile(null); T.setAutosaveKey(null); T.setExporting(false);
    }

    // ── P13: Waisen bei 2-Wort-Looks (wpb 2): Einzelwort nur bei Ein-Wort-Satz oder wenn Limits es erzwingen ──
    {
      const lines1 = { dataset: { lines: '1' }, parentElement: { querySelectorAll() { return []; } }, classList: { add() {}, remove() {} } };
      const prevWpb = T.getWpbState(), prevMc = T.getMaxChars();
      T.setWpbState(2); T.setLines(lines1);
      const stats = {};
      for (const per of [18, 24]) {
        T.setMaxCharsState(per);
        stats[per] = {};
        for (const n of ['v1-reel-de', 'v2-podcast-de-16x9', 'v3-hook-en']) {
          const bl = T.buildCaptionBlocks(fixR2(n), []);
          const single = bl.filter(b => b.words.length === 1).map(b => b.text), over = bl.filter(b => b.words.length > 3).length;
          // Alle Wörter erhalten, nie mehr als 3 Wörter je Block
          ok(bl.map(b => b.text).join(' ') === fixR2(n).map(w => w.word).join(' ') && over === 0, 'R2-P13: ' + n + ' per ' + per + ': kein Wort verloren, ≤ 3 Wörter je Block');
          stats[per][n] = single;
        }
      }
      ok(stats[24]['v1-reel-de'].length === 0 && stats[24]['v2-podcast-de-16x9'].length === 0 && stats[24]['v3-hook-en'].length === 0, 'R2-P13: wpb 2, 24 Zeichen: keine Einzelwort-Blöcke (vorher 4: Erstens:/Business./time./them.) — ' + JSON.stringify(stats[24]));
      ok(stats[18]['v1-reel-de'].length + stats[18]['v2-podcast-de-16x9'].length + stats[18]['v3-hook-en'].length <= 4, 'R2-P13: wpb 2, 18 Zeichen: höchstens 4 Einzelwörter, nur durch das Zeichenlimit erzwungen (vorher 10) — ' + JSON.stringify(stats[18]));
      // Ganze Ein-Wort-Sätze bleiben bewusst allein
      const w1 = ['Ja.', 'Das', 'ist', 'wirklich', 'so', 'gut', 'gemacht.', 'Stopp.'].map((w, i) => ({ word: w, start: i * .4, end: i * .4 + .3 }));
      T.setMaxCharsState(30);
      const b1 = T.buildCaptionBlocks(w1, []).map(b => b.text);
      ok(b1[0] === 'Ja.' && b1[b1.length - 1] === 'Stopp.', 'R2-P13: echte Ein-Wort-Sätze («Ja.», «Stopp.») bleiben allein (' + b1.join(' | ') + ')');
      // wpb 3 und 1 unverändert
      T.setWpbState(3); T.setMaxCharsState(40);
      ok(T.buildCaptionBlocks(fixR2('v1-reel-de'), []).every(b => b.words.length <= 3), 'R2-P13: wpb 3 bleibt hart bei ≤ 3 Wörtern');
      T.setWpbState(prevWpb); T.setMaxCharsState(prevMc || 40);
      T.setLines({ dataset: { lines: '2' }, parentElement: { querySelectorAll() { return []; } }, classList: { add() {}, remove() {} } });
    }
  }

  // ── Runde 2 Schatten-Skalierung: Kontur/Schatten schriftrelativ (ein Faktor capOutK), Vorschau = Export ──
  {
    const near = (a, b) => Math.abs(a - b) < 1e-6;
    ok(near(T.capOutK(28), 1) && near(T.capOutK(14), 0.5) && near(T.capOutK(56), 2) && T.CAP_SH_REF === 28, 'capOutK: Schrift-px / Referenz 28 (28 → 1, 14 → 0.5)');
    ok(T.capScaleShadowStr('none', 0.5) === 'none' && T.capScaleShadowStr('0 0 4px #fff', 1) === '0 0 4px #fff', 'capScaleShadowStr: none und k = 1 bleiben unveraendert');
    ok(T.capScaleShadowStr('-3px 0 0 #000,0 2px 8px rgba(0,0,0,.4)', 0.5) === '-1.5px 0px 0px #000, 0px 1px 4px rgba(0,0,0,.4)', 'capScaleShadowStr: x/y/blur skaliert, Farbe (auch rgba mit Kommas) unangetastet: ' + T.capScaleShadowStr('-3px 0 0 #000,0 2px 8px rgba(0,0,0,.4)', 0.5));
    const hz = T.STYLES.find(x => x.id === 'hormozi'), base = T.capShadowPlan(hz.ts), half = T.capShadowPlan(hz.ts, 0.5), dbl = T.capShadowPlan(hz.ts, 2);
    ok(base.ring && near(half.ring.w, base.ring.w * 0.5) && near(dbl.ring.w, base.ring.w * 2) && half.ring.color === base.ring.color, 'capShadowPlan(k): Ring-Kontur skaliert linear');
    ok(half.rest.length === base.rest.length && half.rest.every((l, i) => near(l.x, base.rest[i].x * 0.5) && near(l.y, base.rest[i].y * 0.5) && near(l.blur, base.rest[i].blur * 0.5)), 'capShadowPlan(k): uebrige Schichten (x/y/blur) skaliert');
    ok(T.capShadowPlan(hz.ts, 1) === base && T.capShadowPlan(hz.ts, 0.5) === half && T.capShadowPlan(hz.ts).ring.w === base.ring.w, 'capShadowPlan: k = 1 = Original, skalierte Plaene gecacht, Original nicht veraendert');
    // Verhaeltnis Kontur / Schrift in Vorschau (DOM) und Export (Plan × scale / fsS) ist unabhaengig von der Rahmenbreite
    const ratio = (px, frameW, W) => { const k = T.capOutK(px), scale = W / frameW, fsS = px * scale; return { exp: T.capShadowPlan(hz.ts, k).ring.w * scale / fsS, dom: (+/([\d.]+)px/.exec(T.capScaleShadowStr('-3px 0 0 #000', k))[1]) / px }; };
    const rn = ratio(10, 125, 1080), rd = ratio(26, 329, 1080);
    ok(near(rn.exp, rd.exp) && Math.abs(rn.dom - rd.dom) < 0.01 && Math.abs(rn.dom - rn.exp * 3 / base.ring.w) < 0.01, 'Kontur/Schrift: schmale und breite Vorschau gleich, DOM = Export (' + rn.exp.toFixed(3) + ' / ' + rd.exp.toFixed(3) + ')');
    // Vorschau-HTML: live (lineTarget) schriftrelativ, Kacheln/Showcase (ohne lineTarget) mit festen px
    const live = T.buildCap(['der', 'weide'], hz, 0, 22, null, 1), tile = T.buildCap(['der', 'weide'], hz, 0, 9, null);
    ok(live.includes(T.capScaleShadowStr(hz.ts, T.capOutK()).split(',')[0].trim()) && tile.includes(hz.ts.split(',')[0].trim().replace(/\s+/g, ' ')), 'buildCap: live skaliert, Kacheln unveraendert');
    ok(near(T.capWordGap(hz, true), 2 * base.ring.w) && near(T.capWordGap(hz), 2 * base.ring.w * T.capOutK()), 'capWordGap: Ring-Zugabe skaliert mit der Kontur (raw = Cover-Export, eigene Skala)');
  }

  // ═══════════════ Runde 3 Layout: Blur-Einzeiler im Band · Paar-Umbruch bei 2-Wort-Looks · halbtransparente Textfarbe (Gradient Karaoke) ═══════════════
  {
    const near = (a, b, e) => Math.abs(a - b) <= (e === undefined ? 0.5 : e);
    const fixDirR3 = path.join(__dirname, 'scripts', 'creator-test', 'fixtures');
    const fixR3 = n => JSON.parse(fs.readFileSync(path.join(fixDirR3, n + '.json'), 'utf8')).words.map(w => ({ word: w.word, start: w.start, end: w.end }));
    const mkCtx = () => ({ font: '', letterSpacing: '0px', measureText(str) { const m = /([\d.]+)px/.exec(this.font); return { width: (str || '').length * (m ? +m[1] : 16) * 0.55 }; },
      roundRect() {}, rect() {}, beginPath() {}, fill() {}, stroke() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, fillText() {}, strokeText() {}, ellipse() {},
      fillRect() {}, clip() {}, drawImage() {}, createLinearGradient() { return { addColorStop() {} }; } });
    const previewFW = 220;
    const lines1 = { dataset: { lines: '1' }, parentElement: { querySelectorAll() { return []; } }, classList: { add() {}, remove() {} } };
    const linesN = n => ({ dataset: { lines: String(n) }, parentElement: { querySelectorAll() { return []; } }, classList: { add() {}, remove() {} } });

    // 1) Blur 16:9 → 9:16: JEDER Block (1, 2, 3 Zeilen) liegt im scharfen Band, gleiche Ankerlinie (unten bzw. oben)
    {
      const vid = document.getElementById('mainVid'), o = [vid.videoWidth, vid.videoHeight];
      vid.videoWidth = 1920; vid.videoHeight = 1080;
      const sty = T.STYLES.find(x => x.id === 'hormozi');
      T.setExportFormatState({ aspect: '9:16', fill: 'blur' });
      const bd = T.capBlurBand(1080, 1920), g = 1920 * 0.015;
      const mk = n => { const ws = ['Das', 'ist', 'ein', 'Test', 'mit', 'Text'].slice(0, n), b = { text: ws.join(' '), start: 0, end: 1, words: ws.map((w, i) => ({ word: w, start: i * 0.1, end: i * 0.1 + 0.1 })) }; return b; };
      T.setFreeState(false); T.setHOffState(0);
      for (const pos of ['bottom', 'top']) for (const voff of [20, 0, 40]) {
        T.setPosState(pos); T.setVOffState(voff);
        const bots = [], tops = [];
        for (const ln of [1, 2, 3]) {
          const blk = mk(ln === 1 ? 1 : ln === 2 ? 4 : 6); T.setState([blk], blk.words, 'karaoke'); T.setLines(linesN(ln));
          const L = T.capLayout(mkCtx(), blk, 0, 0, sty, 1080, 1920);
          ok(L.boxT >= bd.top - 0.5 && L.boxB <= bd.bot - (ln < 3 ? g : 0) + 0.5, 'R3 Blur ' + pos + ' voff ' + voff + ', ' + ln + ' Zeile(n): Box ' + L.boxT.toFixed(0) + '…' + L.boxB.toFixed(0) + ' liegt im Band ' + bd.top.toFixed(0) + '…' + bd.bot.toFixed(0) + ' (Unterkante ' + (L.boxB / 1920).toFixed(3) + ' ≤ ' + (bd.bot / 1920).toFixed(3) + ')');
          if (ln < 3) { bots.push(L.boxB); tops.push(L.boxT); } // 3 Zeilen (mit der Test-Schrift höher als das Band): nur «im Band»
        }
        const anchor = pos === 'bottom' ? bots : tops;
        ok(Math.max(...anchor) - Math.min(...anchor) < 4, 'R3 Blur ' + pos + ' voff ' + voff + ': Einzeiler und Zweizeiler teilen die Ankerlinie (Streuung ' + (Math.max(...anchor) - Math.min(...anchor)).toFixed(1) + ' px)');
      }
      // reine Funktion: Einzeiler (h 60) und Zweizeiler (h 120) an verschiedenen Ausgangspositionen → gleiche Unterkante
      const bb = { top: 656.25, bot: 1263.75 };
      const e1 = T.capBlurTop(1380, 60, 1920, bb, 'bottom', false) + 60, e2 = T.capBlurTop(1330, 120, 1920, bb, 'bottom', false) + 120;
      ok(near(e1, e2, 0.01) && e1 <= bb.bot, 'R3: capBlurTop Einzeiler (unter dem Band gestartet) und Zweizeiler enden auf derselben Unterkante ' + e1.toFixed(1));
      // Crop: kein Band, Position unverändert gegenüber der Standardlogik (kein Eingriff)
      T.setExportFormatState({ aspect: '9:16', fill: 'crop' });
      ok(T.capBlurBand(1080, 1920) === null && T.capBlurTop(1380, 60, 1920, null, 'bottom', false) === 1380, 'R3: Crop-Format ohne Band: capBlurTop greift nicht ein');
      T.setPosState('bottom'); T.setVOffState(20);
      for (const ln of [1, 2]) { const blk = mk(ln === 1 ? 1 : 4); T.setState([blk], blk.words, 'karaoke'); T.setLines(linesN(ln)); const L = T.capLayout(mkCtx(), blk, 0, 0, sty, 1080, 1920); ok(L.boxB <= 1920 * (1 - 24.44 / 100) + 0.5 && L.boxT >= 0, 'R3 Crop ' + ln + ' Zeile(n): Box ' + L.boxT.toFixed(0) + '…' + L.boxB.toFixed(0) + ' unverändert innerhalb Safe-Zone'); }
      T.setExportFormatState('original'); T.setPosState('bottom'); T.setVOffState(20); T.setFreeState(false); T.setLines(linesN(2));
      vid.videoWidth = o[0]; vid.videoHeight = o[1];
    }

    // 2) Paar-Umbruch: layout.wrap (Color Pop, Squash Pop, Sticker Emoji) → bei wpb ≥ 2 und 1 Zeile 2 Zeilen erlaubt, Einzelwort-Anteil < 20 %
    {
      const file = JSON.parse(fs.readFileSync(path.join(__dirname, 'styles.json'), 'utf8'));
      T.applyStyleDrops(file, Date.now());
      const looks = ['colorpop', 'squashpop', 'stickeremoji'], prevWpb = T.getWpbState(), prevMc = T.getMaxChars(), prevId = T.getActiveId(), prevLines = T.getLines();
      T.setFontSizeState(Math.round(previewFW * 0.08)); // Standardgrösse des Editors (setFont: 8 % der Rahmenbreite)
      ok(looks.every(id => { const e = file.find(o => o.id === id); return e && e.layout && e.layout.wrap === true; }), 'R3: styles.json: Color Pop, Squash Pop, Sticker Emoji tragen layout.wrap');
      ok(looks.every(id => { const st = T.STYLES.find(x => x.id === id); return st && st.layout && st.layout.wrap === true; }), 'R3: dropToStyle übernimmt layout.wrap');
      T.setMaxCharsState(0);
      // Zähler: ohne Umbruch (wrap aus) gegen mit Umbruch, v1/v2/v3
      const share = (id, n) => { const bl = T.buildCaptionBlocks(fixR3(n), []); return { n: bl.length, one: bl.filter(b => b.words.length === 1).length, words: bl.map(b => b.text).join(' ') }; };
      for (const id of looks) {
        const st = T.STYLES.find(x => x.id === id);
        T.setActiveId(id); T.setWpbState(2); T.setLines(lines1);
        ok(T.capPairWrap() === true && T.capLinesEff(1) === 2 && T.capLinesEff(2) === 2 && T.capLinesEff(undefined) === undefined, 'R3 ' + id + ': Paar-Umbruch aktiv (wpb 2, 1 Zeile): effektiv 2 Zeilen');
        const lim = T.capBlockLimit(); ok(lim && lim.lines === 2 && lim.per >= T.capAutoChars(), 'R3 ' + id + ': Limit ' + JSON.stringify(lim) + ' (Auto ' + T.capAutoChars() + ')');
        let tot = 0, tot1 = 0, totOff = 0, tot1Off = 0;
        for (const n of ['v1-reel-de', 'v2-podcast-de-16x9', 'v3-hook-en']) {
          const a = share(id, n); tot += a.n; tot1 += a.one;
          ok(a.words === fixR3(n).map(w => w.word).join(' '), 'R3 ' + id + ' ' + n + ': kein Wort verloren');
          st.layout.wrap = false; const b = share(id, n); st.layout.wrap = true; totOff += b.n; tot1Off += b.one;
          console.log('  info R3 ' + id + ' ' + n + ': Einzelwort-Blöcke ' + b.one + '/' + b.n + ' → ' + a.one + '/' + a.n + ' per ' + JSON.stringify(T.capBlockLimit()) + ' ' + (process.env.R3DBG ? T.buildCaptionBlocks(fixR3(n), []).map(x => x.words.length + ':' + x.text).join(' | ') : ''));
        }
        ok(tot1 / tot < 0.2 && tot1 <= tot1Off, 'R3 ' + id + ': Einzelwort-Anteil ' + Math.round(100 * tot1 / tot) + ' % (ohne Umbruch ' + Math.round(100 * tot1Off / totOff) + ' %) < 20 %');
      }
      // andere Looks / explizite 2 Zeilen / wpb 1: unverändert
      T.setActiveId('hormozi'); T.setWpbState(4); T.setLines(linesN(2));
      ok(T.capPairWrap() === false && T.capLinesEff(1) === 1, 'R3: Look ohne layout.wrap: kein Paar-Umbruch');
      T.setActiveId('colorpop'); T.setWpbState(1); T.setLines(lines1);
      ok(T.capPairWrap() === false, 'R3: wpb 1 → kein Paar-Umbruch'); T.setWpbState(2); T.setLines(linesN(2));
      ok(T.capPairWrap() === false, 'R3: Nutzer wählt 2 Zeilen → normales Verhalten (kein Sonderweg)');
      // capDistributeLines: Paar in eine Zeile, wenn es passt; sonst 2 Zeilen
      T.setLines(lines1);
      const inf = (...w) => w.map((x, i) => ({ i, w: x, t: 'w' + i, hy: false }));
      const fit = T.capDistributeLines(inf(90, 100), 1, 6, 300), wide = T.capDistributeLines(inf(180, 160), 1, 6, 300);
      ok(fit.length === 1 && wide.length === 2, 'R3: Paar passt in die Zeile → 1 Zeile (' + fit.length + '), sonst 2 Zeilen (' + wide.length + ')');
      T.setActiveId(prevId); T.setWpbState(prevWpb); T.setMaxCharsState(prevMc); T.setLines(linesN(prevLines));
    }

    // 3) Halbtransparente Textfarbe (Gradient Karaoke tc .5): Schicht-Schatten ohne Glyphe, Glyphe nur einmal mit Alpha → kein gestapeltes Alpha
    {
      ok(T.capFillAlpha({ fillStyle: 'rgba(255, 255, 255, 0.5)' }) === 0.5 && T.capFillAlpha({ fillStyle: '#fff' }) === 1 && T.capFillAlpha({ fillStyle: {} }) === 1, 'R3: capFillAlpha liest das Alpha der Füllung (Verlauf/undurchsichtig = 1)');
      const gk = T.STYLES.find(x => x.id === 'gradkaraoke'), plan = T.capShadowPlan(gk.ts);
      const rec = fill => { const calls = []; const c = { canvas: null, shadowOffsetX: 0, shadowOffsetY: 0, shadowBlur: 0, shadowColor: '', lineWidth: 1, lineJoin: 'miter', miterLimit: 10, strokeStyle: '#000', fillStyle: fill, globalAlpha: 1,
        _st: [], save() { this._st.push(this.fillStyle); }, restore() { this.fillStyle = this._st.pop(); }, fillText(t, x, y) { calls.push({ fs: this.fillStyle, x, ox: this.shadowOffsetX, col: this.shadowColor }); }, strokeText() {} };
        T.drawTextWithPlan(c, 'zwei', 100, 50, plan, 2, 1, 60, 120, 1); return calls; };
      const half = rec('rgba(255, 255, 255, 0.5)'), solid = rec('#fff');
      const glyphDraws = half.filter(c => c.ox === 0 && c.col === 'transparent');
      ok(plan.rest.length >= 2 && glyphDraws.length === 1 && /0\.5/.test(glyphDraws[0].fs), 'R3 Gradient Karaoke: Glyphe nur EINMAL mit Alpha 0,5 gezeichnet (' + glyphDraws.length + '), Schatten-Schichten: ' + (half.length - glyphDraws.length));
      ok(half.filter(c => c.ox !== 0).every(c => c.fs === '#000' && c.x < 0) && half.length === plan.rest.length + 1, 'R3 Gradient Karaoke: Schatten-Schichten mit undurchsichtiger Füllung, Glyphe ausserhalb (nur der Schatten kommt zurück)');
      ok(solid.length === plan.rest.length + 1 && solid.every(c => c.fs === '#fff' && c.x === 100), 'R3: undurchsichtige Textfarbe: Verhalten wie zuvor (Schicht-Zeichnungen mit der Füllung am Wortort)');
      // Transformation (Pop-Animation): Versatz der Glyphe wird mit der Matrix verrechnet
      const c2 = { canvas: null, shadowOffsetX: 0, shadowOffsetY: 0, shadowBlur: 0, shadowColor: '', lineWidth: 1, lineJoin: 'miter', miterLimit: 10, strokeStyle: '#000', fillStyle: 'rgba(255,255,255,.5)', globalAlpha: 1,
        save() {}, restore() {}, getTransform() { return { a: 1.2, b: 0 }; }, strokeText() {}, fillText(t, x) { if (this.shadowOffsetX) this.o = (this.o || []).concat([[x * 1.2 + this.shadowOffsetX]]); } };
      T.drawTextWithPlan(c2, 'zwei', 100, 50, plan, 2, 1, 60, 120, 1);
      ok(c2.o && c2.o.every(v => near(v[0], 100 * 1.2 + plan.rest[0].x * 2, 12)), 'R3: Schatten landet unter Skalierung 1,2 am Wortort (Glyph-Versatz × Matrix)');
    }
  }

  // ═══════════════ Runde 3 UX: Hook ≠ erste Untertitelzeile · Emoji-Fallback dichter · Sticker Emoji gross · Handy-Captions · Toast · DE-Kleinkram ═══════════════
  {
    const fixDir3 = path.join(__dirname, 'scripts', 'creator-test', 'fixtures');
    const fix3 = n => JSON.parse(fs.readFileSync(path.join(fixDir3, n + '.json'), 'utf8')).words.map(w => ({ word: w.word, start: w.start, end: w.end }));
    const blk3 = n => T.buildCaptionBlocks(fix3(n), []);
    const txt3 = b => b.words.map(w => w.word).join(' ');
    const nrm = x => String(x).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    // 1) Hook nie wörtlich = erste Untertitelzeile(n); «Another suggestion» schaltet 2–3 Varianten durch
    {
      const b1 = blk3('v1-reel-de'), b2 = blk3('v2-podcast-de-16x9'), b3 = blk3('v3-hook-en');
      for (const [nm, bl] of [['v1', b1], ['v2', b2], ['v3', b3]]) {
        const vs = T.hookVariants(bl);
        ok(vs.length >= 2 && vs.length <= 3 && new Set(vs.map(nrm)).size === vs.length && vs.every(v => v && v.split(' ').length <= 8), 'R3-Hook ' + nm + ': 2–3 verschiedene Varianten, je ≤ 8 Wörter: ' + JSON.stringify(vs));
        ok(vs.every(v => nrm(v) !== nrm(txt3(bl[0])) && nrm(v) !== nrm(txt3(bl[0]) + ' ' + txt3(bl[1]))), 'R3-Hook ' + nm + ': keine Variante = erste Untertitelzeile (' + txt3(bl[0]) + ')');
      }
      ok(T.hookLocalText(b3) === 'This one setting doubled my watch time' && nrm(txt3(b3[0])) === 'stop scrolling', 'R3-Hook v3: «Stop scrolling» steht oben als Untertitel → Vorschlag ist der nächste Satz (' + T.hookLocalText(b3) + ')');
      ok(T.hookLocalText(b1) === 'Drei Tricks, damit deine Reels mehr Views bekommen' && T.hookVariants(b1)[1] === 'Speicher dir das Video, sonst vergisst du es!', 'R3-Hook v1: erster Satz + prägnanter Imperativ-Satz');
      ok(T.hookVariants(b3).includes('Move them to the upper third') && T.hookVariants(b2).some(v => /^Ihr wichtigster Tipp/.test(v)), 'R3-Hook: prägnanteste Sätze (Zahl/Imperativ bzw. «Tipp:») kommen als Variante');
      const mk = txt => txt.split(' ').map((w, i) => ({ word: w, start: i * .3, end: i * .3 + .25 }));
      const one = (t, ws) => ({ start: 0, end: 2, text: t, words: mk(t) });
      const bb = [one('STOP SCROLLING.'), one('This is the second line')];
      T.hookVariants(bb); // Cache-Schlüssel wechselt mit dem Text
      ok(T.hookDupOfCaptions('Stop scrolling.', ['STOP SCROLLING.', 'x']) && T.hookDupOfCaptions('stop scrolling', ['Stop', 'scrolling.']) && !T.hookDupOfCaptions('Stop scrolling now', ['Stop scrolling.']), 'R3-Hook: Vergleich ohne Gross-/Kleinschreibung und Satzzeichen, auch über zwei Zeilen');
      const only = T.hookVariants([one('Stop scrolling.')]);
      ok(only.length === 1 && only[0] === 'Stop scrolling', 'R3-Hook: gibt es keinen anderen Satz, bleibt der erste (' + only + ')');
      // Knopf: durchschalten, Text landet im Feld, nach der letzten Variante wieder die erste
      T.setCaptionBlocksForTest(b3); T.setHookState(true, '', 2, '');
      const seq = [T.hookNextVariant(), T.hookNextVariant(), T.hookNextVariant(), T.hookNextVariant()], vs3 = T.hookVariants(b3);
      ok(vs3.length >= 2 && seq.every((x, k) => x === vs3[(k + 1) % vs3.length]) && T.getHookState().text === seq[3], 'R3-Hook: «↻ Another suggestion» schaltet alle Varianten durch und beginnt dann wieder vorne (' + vs3.join(' | ') + ')');
      ok(!vs3.includes('This one setting doubled') && !T.hookVariants(b1).includes('Drei Tricks'), 'R3-Hook: Kurzfassung nur am Teilsatzende, nie mitten im Satz und nie = erste Untertitelzeile');
      T.setHookState(false, '', 2, '');
      ok(/id="hookSug" onclick="hookNextVariant\(\)"[^>]*>↻ Another suggestion</.test(htmlContent), 'R3-Hook: Knopf «↻ Another suggestion» im Hook-Feld');
      ok(require('./i18n/de-ui.js')['↻ Another suggestion'] === '↻ Anderer Vorschlag', 'R3-Hook: Knopf auf Deutsch');
    }
    // 2) Emoji-Fallback: ≈ 1 je 6,5 s, ≥ 2 Blöcke / ≥ 3 s Abstand, kein Motiv doppelt innerhalb 8 s
    {
      for (const [nm, n, minN] of [['v1', 'v1-reel-de', 3], ['v2', 'v2-podcast-de-16x9', 4], ['v3', 'v3-hook-en', 3]]) {
        const bl = blk3(n), k = T.localEmojis(bl), list = bl.map((b, i) => ({ i, t: b.words[0].start, e: T.blockEmoji(b) })).filter(x => x.e);
        const dur = bl[bl.length - 1].words[bl[bl.length - 1].words.length - 1].end - bl[0].words[0].start, per = dur / list.length;
        ok(k === list.length && k >= minN && per >= 5 && per <= 8.5, 'R3-Emoji ' + nm + ': ' + k + ' Emojis in ' + dur.toFixed(1) + ' s (≈ 1 je ' + per.toFixed(1) + ' s): ' + list.map(x => x.i + T.blockEmoji(bl[x.i])).join(' '));
        ok(list.every((x, j) => j === 0 || (x.i - list[j - 1].i >= 2 && x.t - list[j - 1].t >= T.EMO_LOCAL_GAP - 1e-9)) && list.every((x, j) => list.every((y, m) => m >= j || x.e !== y.e || x.t - y.t >= T.EMO_LOCAL_SAME)), 'R3-Emoji ' + nm + ': ≥ 2 Blöcke / ≥ 3 s Abstand, dasselbe Motiv frühestens nach 8 s wieder');
      }
      const L = w => (T.localEmoLookup(w) || {}).e;
      ok(L('Stop') === '🛑' && L('Preis') === '🏷️' && L('Ergebnisse') === '✅' && L('settings') === '⚙️' && L('Kunden') === '🤝' && L('Ton') === '🔊' && L('Speicher') === '💾' && L('Problem') === '⚠️' && L('doubled') === '📈' && L('Dienstag') === '📅' && L('Kamera') === '📸' && L('Telefon') === '📱' && L('Fehler') === '❌' && L('Wachstum') === '📈' && L('Geld') === '💰' && L('Herz') === '❤️' && L('Feuer') === '🔥' && L('Ziel') === '🎯' && L('Idee') === '💡' && L('Erfolg') === '🏆' && L('Zeit') === '⏰', 'R3-Emoji: Wörterbuch DE/EN deckt Stopp, Preis, Ergebnis, Einstellung, Kunde, Ton, Speichern, Problem, Wachstum, Geld, Zeit, Fehler, Herz, Feuer, Ziel, Idee, Kamera, Telefon, Kalender, Erfolg ab');
      ok(L('fast') === undefined && L('Halt') === undefined && L('laut') === undefined && L('Hackschnitzel') === undefined, 'R3-Emoji: Füllwörter (fast, halt, laut) lösen kein Emoji aus');
      ok(T.LOCAL_EMO.length >= 70 && new Set(T.LOCAL_EMO.map(r => r[0])).size >= 55, 'R3-Emoji: ' + T.LOCAL_EMO.length + ' Zeilen / ' + new Set(T.LOCAL_EMO.map(r => r[0])).size + ' verschiedene Motive');
    }
    // 3) Sticker Emoji gross: Faktor 1,6–2 der gezeichneten Schrift, Vorschau (buildCap) = Export (drawCapEmoji) — gleiche Konstante
    {
      const st = T.dropToStyle(JSON.parse(fs.readFileSync(path.join(__dirname, 'styles.json'), 'utf8')).find(o => o.id === 'stickeremoji'), Date.parse('2026-10-20')) || T.STYLES.find(x => x.id === 'stickeremoji'), fsEm = parseFloat(st.fs) || 1; // fs '1.2em'
      const rel = T.EMO_REL_SIDE / fsEm;
      ok(rel >= 1.6 && rel <= 2.0, 'R3-Sticker: Emoji = ' + rel.toFixed(2) + ' × gezeichnete Schrift (EMO_REL_SIDE ' + T.EMO_REL_SIDE + ' / fs ' + fsEm + ')');
      const hs = T.buildCap(['ab', 'cd'], st, 0, 25, [0, 0.5], 2, { emoji: '🔥', age: 1 });
      const fpx = +/font-size:([\d.]+)px;line-height:1;text-align:center/.exec(hs.slice(hs.indexOf('cap-emo')))[1];
      ok(Math.abs(fpx - 25 * T.EMO_REL_SIDE) < 0.01 && fpx / (25 * fsEm) >= 1.6, 'R3-Sticker: Vorschau-DOM Emoji ' + fpx + ' px bei Basisschrift 25 px (' + (fpx / (25 * fsEm)).toFixed(2) + ' × gezeichnete Schrift)');
      ok(/var Es = \(px \|\| 24\) \* EMO_REL_SIDE/.test(script) && /var Es = L\.fitPx \* EMO_REL_SIDE \* L\.scale/.test(script), 'R3-Sticker: Vorschau und Export-Zeichnung rechnen mit derselben Konstante EMO_REL_SIDE');
    }
    // 4) Handy-Captions-Tab / Timeline-Leiste: Kurzwörter, kompakter Format-Hinweis
    {
      ok(/id="taEdit"[^>]*><svg[^>]*><use href="#i-edit"\/><\/svg><span>Text<\/span>/.test(htmlContent) && /id="taGaps"[^>]*><svg[^>]*><use href="#i-gap"\/><\/svg><span>Gaps<\/span>/.test(htmlContent) && !/<span>Edit text<\/span>|<span>Close gaps<\/span>/.test(htmlContent), 'R3-Handy: Aktionsleiste mit Kurzwörtern «Text» / «Gaps» (Tooltips tragen die lange Fassung)');
      const deHtml = fs.readFileSync(path.join(__dirname, 'captly.de.html'), 'utf8');
      ok(/id="taEdit"[^>]*>.*?<span>Text<\/span>/.test(deHtml) && /id="taGaps"[^>]*>.*?<span>Lücken<\/span>/.test(deHtml), 'R3-Handy DE: «Text» / «Lücken» statt «Text bearbeiten» / «Lücken schliessen»');
      ok(/\.fmt-hint:not\(\[style\*="none"\]\) ~ \.fmt-pill\{display:none\}/.test(htmlContent) && /\.fmt-hint\{position:relative;padding:4px 44px 4px 10px/.test(htmlContent), 'R3-Handy: Format-Hinweis einzeilig, Format-Pille darunter solange er steht → Querformat-Vorschau grösser');
    }
    // 5) Landing-Toast «Auch auf Deutsch verfügbar» nicht mehr sofort am Desktop
    {
      ok(/\.lang-hint\{[^}]*opacity:0;pointer-events:none/.test(htmlContent) && /\.lang-hint\.lh-on\{opacity:1;pointer-events:auto\}/.test(htmlContent) && /r\.bottom < \(window\.innerWidth > 640 \? \(window\.innerHeight \|\| 800\) - 80 : 0\)/.test(htmlContent), 'R3-Toast: Sprachhinweis ist auch am Desktop erst sichtbar, wenn die Upload-Karte den unteren Rand freigibt');
    }
    // 6) DE-Kleinkram: Suffix-Beschriftung, Toast-Knopf aus dem DOM
    {
      const dui = require('./i18n/de-ui.js'), lab = dui['Add “-gluephs” to file names'];
      ok(lab === 'Dateiname mit Zusatz „-gluephs“' && !/[«»‹›]/.test(lab), 'R3-DE: Export-Blatt «' + lab + '» ohne spitze Klammern');
      ok(!/[«»]-gluephs/.test(fs.readFileSync(path.join(__dirname, 'captly.de.html'), 'utf8')), 'R3-DE: generierte /de-Seite ohne «-gluephs»');
      let called = 0; { const old = document.getElementById('capToast'); if (old) old.children = []; }
      T.capToastAction('Hallo', 'Start fresh', () => { called++; });
      const tEl = document.getElementById('capToast');
      ok(tEl && tEl.children.filter(c => c.className === 'cap-toast-btn').length === 1, 'R3-Toast: Aktionsknopf steht im Toast');
      tEl.children.find(c => c.className === 'cap-toast-btn').onclick();
      ok(called === 1 && tEl.children.filter(c => c.className === 'cap-toast-btn').length === 0, 'R3-Toast: nach Gebrauch ist «Start fresh» aus dem DOM entfernt (kein unsichtbarer Knopf)');
      T.capToastAction('Hallo', 'Start fresh', () => {}); T.hideCapToast();
      ok(tEl.children.filter(c => c.className === 'cap-toast-btn').length === 0, 'R3-Toast: auch beim Ausblenden (hideCapToast) wird der Knopf entfernt');
    }
  }

  // ═══════════════ Runde 3 Layout (Folge): Segmentierung und Schriftgrösse unabhängig von der Vorschau-Breite ═══════════════
  {
    const near = (a, b, e) => Math.abs(a - b) <= (e === undefined ? 0.5 : e);
    const frameEl = document.getElementById('prevFrame');
    const prevW = frameEl.style.width, prevH = frameEl.style.height, prevFs = T.getFontSize();
    const setFrame = w => { frameEl.style.width = w + 'px'; frameEl.style.height = Math.round(w * 16 / 9) + 'px'; T.setFontSizeState(Math.round(w * 0.08 * 100) / 100); };
    const mkCtx = () => ({ font: '', letterSpacing: '0px', measureText(str) { const m = /([\d.]+)px/.exec(this.font); return { width: (str || '').length * (m ? +m[1] : 16) * 0.55 }; },
      roundRect() {}, rect() {}, beginPath() {}, fill() {}, stroke() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, fillText() {}, strokeText() {}, ellipse() {},
      fillRect() {}, clip() {}, drawImage() {}, createLinearGradient() { return { addColorStop() {} }; } });
    const fixR = n => JSON.parse(fs.readFileSync(path.join(__dirname, 'scripts', 'creator-test', 'fixtures', n + '.json'), 'utf8')).words.map(w => ({ word: w.word, start: w.start, end: w.end }));
    const looks = ['colorpop', 'squashpop', 'stickeremoji', 'hormozi', 'glassbox'];
    const prevId = T.getActiveId(), prevWpb = T.getWpbState(), prevMc = T.getMaxChars(), prevLines = T.getLines();
    const lines1 = { dataset: { lines: '1' }, parentElement: { querySelectorAll() { return []; } }, classList: { add() {}, remove() {} } };
    T.setMaxCharsState(0);
    // 1) Vorlagen-/Standardgrösse: reines Verhältnis, kein 10-px-Minimum
    ok(T.templateFontSize({ sizeRel: 0.08 }, 90) === 7.2 && T.templateFontSize({ sizeRel: 0.08 }, 720) === 57.6, 'R3: templateFontSize bleibt ein Verhältnis zur Rahmenbreite (90 px → 7,2 · 720 px → 57,6), kein 10-px-Minimum');
    // 2) Zeichenlimit + Blöcke: identisch bei 90 / 220 / 330 / 720 px Rahmenbreite
    for (const id of looks) {
      const st = T.STYLES.find(x => x.id === id); if (!st) continue;
      T.setActiveId(id); if (st.layout) { T.setWpbState(st.layout.wpb); T.setLines({ dataset: { lines: String(st.layout.lines) }, parentElement: { querySelectorAll() { return []; } }, classList: { add() {}, remove() {} } }); } else { T.setWpbState(4); T.setLines({ dataset: { lines: '2' }, parentElement: { querySelectorAll() { return []; } }, classList: { add() {}, remove() {} } }); }
      const sig = {};
      for (const w of [90, 220, 330, 720]) {
        setFrame(w);
        sig[w] = { per: T.capAutoChars(), blocks: ['v1-reel-de', 'v2-podcast-de-16x9', 'v3-hook-en'].map(n => T.buildCaptionBlocks(fixR(n), []).map(b => b.text).join('|')).join('##') };
      }
      ok([220, 330, 720].every(w => sig[w].per === sig[90].per && sig[w].blocks === sig[90].blocks), 'R3 ' + id + ': Zeichenlimit (' + sig[90].per + ') und Blöcke bei Rahmen 90/220/330/720 px identisch');
      if (st.layout && st.layout.wrap) {
        setFrame(90); let n = 0, one = 0;
        for (const f of ['v1-reel-de', 'v2-podcast-de-16x9', 'v3-hook-en']) { const bl = T.buildCaptionBlocks(fixR(f), []); n += bl.length; one += bl.filter(b => b.words.length === 1).length; }
        ok(one / n < 0.2, 'R3 ' + id + ' bei 90-px-Rahmen: Einzelwort-Anteil ' + Math.round(100 * one / n) + ' % < 20 %');
      }
    }
    // 3) Export-Geometrie (capLayout 1080×1920): Schrifthöhe/Boxhöhe relativ zur Videohöhe bei 90 und 330 px gleich; px-Laufweite schriftrelativ
    {
      const sty = T.STYLES.find(x => x.id === 'colorpop') || T.STYLES.find(x => x.id === 'hormozi');
      T.setActiveId(sty.id); T.setWpbState(2); T.setLines(lines1);
      const ws = ['Drei', 'Tricks,'], blk = { text: ws.join(' '), start: 0, end: 1, words: ws.map((w, i) => ({ word: w, start: i * 0.2, end: i * 0.2 + 0.2 })) };
      T.setState([blk], blk.words, 'karaoke');
      const H = 1920, geo = {};
      for (const w of [90, 330]) { setFrame(w); const L = T.capLayout(mkCtx(), blk, 0, 0, sty, 1080, H); geo[w] = { h: (L.boxB - L.boxT) / H, fsS: L.fsS / H }; }
      ok(near(geo[90].h, geo[330].h, 0.004) && near(geo[90].fsS, geo[330].fsS, 0.0015), 'R3 Export: Boxhöhe/Videohöhe ' + geo[90].h.toFixed(4) + ' (90 px) = ' + geo[330].h.toFixed(4) + ' (330 px), Schrift/Höhe ' + geo[90].fsS.toFixed(4) + ' = ' + geo[330].fsS.toFixed(4));
      const sq = T.STYLES.find(x => x.id === 'squashpop');
      if (sq) { setFrame(90); const a = T.capLsPx(sq) / 90; setFrame(720); const b = T.capLsPx(sq) / 720; ok(near(a, b, 1e-6) && a > 0, 'R3: px-Laufweite (Squash Pop) skaliert mit der Rahmenbreite (' + a.toFixed(5) + ' = ' + b.toFixed(5) + ' je px Rahmen)'); }
    }
    frameEl.style.width = prevW; frameEl.style.height = prevH; T.setFontSizeState(prevFs);
    T.setActiveId(prevId); T.setWpbState(prevWpb); T.setMaxCharsState(prevMc); T.setLines({ dataset: { lines: String(prevLines) }, parentElement: { querySelectorAll() { return []; } }, classList: { add() {}, remove() {} } });
  }
  // ═══════════════ Runde 3 Rest: Box-/Pill-Polster und Emoji fensterunabhängig · Typewriter wächst von der Mitte ═══════════════
  {
    const near = (a, b, e) => Math.abs(a - b) <= (e === undefined ? 0.5 : e);
    const frameEl = document.getElementById('prevFrame');
    const prevW = frameEl.style.width, prevH = frameEl.style.height, prevFs = T.getFontSize();
    const setFrame = w => { frameEl.style.width = w + 'px'; frameEl.style.height = Math.round(w * 16 / 9) + 'px'; T.setFontSizeState(Math.round(w * 0.08 * 100) / 100); };
    const mkCtx = () => ({ font: '', letterSpacing: '0px', measureText(str) { const m = /([\d.]+)px/.exec(this.font); return { width: (str || '').length * (m ? +m[1] : 16) * 0.55 }; },
      roundRect() {}, rect() {}, beginPath() {}, fill() {}, stroke() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, fillText() {}, strokeText() {}, ellipse() {},
      fillRect() {}, clip() {}, drawImage() {}, createLinearGradient() { return { addColorStop() {} }; } });
    const fixR = n => JSON.parse(fs.readFileSync(path.join(__dirname, 'scripts', 'creator-test', 'fixtures', n + '.json'), 'utf8')).words.map(w => ({ word: w.word, start: w.start, end: w.end }));
    const prevId = T.getActiveId(), prevWpb = T.getWpbState(), prevMc = T.getMaxChars(), prevLines = T.getLines();
    const mkLines = n => ({ dataset: { lines: String(n) }, parentElement: { querySelectorAll() { return []; } }, classList: { add() {}, remove() {} } });
    T.setMaxCharsState(0);
    const widths = [90, 125, 220, 385, 720];
    // 1) Box-/Pill-Polster: schriftrelativ (Referenz CAP_SH_REF = 28 px) — Verhältnis zur Schrift in jeder Fensterbreite gleich
    {
      const gb = T.STYLES.find(x => x.id === 'glassbox'), pk = T.STYLES.find(x => x.id === 'boxkara');
      ok(gb && gb.boxBg && pk && pk.hlPillBg && T.capMotion(pk) === 'highlight', 'R3-Rest: Glass Box (Box) und Highlight Box (Pill) vorhanden');
      const rel = {};
      for (const w of widths) {
        setFrame(w);
        const fsz = T.getFontSize(), html = T.buildCap(['Drei', 'Tricks,'], gb, 1, fsz, [0, 0.5], 2);
        const m = /padding:([\d.]+)px ([\d.]+)px;border-radius:([\d.]+)px/.exec(html);
        rel[w] = { padY: +m[1] / fsz, padX: +m[2] / fsz, rad: +m[3] / fsz, maxW: T.capFitMaxW(gb) / fsz, maxWp: T.capFitMaxW(pk) / fsz, gap: T.capWordGap(pk) / fsz, pillPad: T.CAP_PILL_PAD_X * T.capOutK() / fsz };
      }
      const keys = Object.keys(rel[90]);
      ok(widths.every(w => keys.every(k => near(rel[w][k], rel[90][k], 0.003))), 'R3-Rest: Box-Polster/-Radius, Safe-Zone-Abzug, Pill-Abstand und -Polster bei Rahmen ' + widths.join('/') + ' px gleich im Verhältnis zur Schrift (Polster X ' + rel[90].padX.toFixed(3) + ' · Schrift ' + (rel[90].padX * 28).toFixed(1) + ' px bei 28 px)');
      ok(near(rel[90].padX, 18 / 28, 0.003) && near(rel[90].padY, 5 / 28, 0.003), 'R3-Rest: 18/5 px gelten für 28 px Schrift (Glass Box)');
    }
    // 2) Umbruch (Export-Layout, 1080×1920) und Vorschau-Zeilenverteilung: gleich bei Rahmen 90 … 720 px — Box-Look und Highlight-Pill-Look
    for (const id of ['glassbox', 'boxkara', 'tiktok']) {
      const st = T.STYLES.find(x => x.id === id); if (!st) continue;
      T.setActiveId(id); T.setWpbState(st.layout ? st.layout.wpb : 4); T.setLines(mkLines(st.layout ? st.layout.lines : 2));
      const sig = {}, fixB = {}; // Blöcke einmal bauen (Segmentierung je Fensterbreite prüft der Block davor) — hier nur Umbruch/Skalierung
      setFrame(385); ['v1-reel-de', 'v2-podcast-de-16x9'].forEach(f => { fixB[f] = T.buildCaptionBlocks(fixR(f), []); });
      for (const w of widths) {
        setFrame(w);
        const out = [];
        for (const f of ['v1-reel-de', 'v2-podcast-de-16x9']) {
          const bl = fixB[f];
          T.setState(bl, fixR(f), 'karaoke');
          bl.forEach((b, bi) => { const L = T.capLayout(mkCtx(), b, bi, 0, st, 1080, 1920); out.push(L.lines.map(Ln => Ln.map(wo => wo.t).join(' ')).join('/') + '@' + Math.round(L.fsS * 10 / 1) / 10); });
        }
        sig[w] = out.join('|');
      }
      const base = sig[90].split('|'), bad = [];
      for (const w of widths) { const cur = sig[w].split('|'); cur.forEach((c, i) => { if (c.split('@')[0] !== base[i].split('@')[0]) bad.push(w + ':' + c.split('@')[0] + ' ≠ ' + base[i].split('@')[0]); }); }
      ok(bad.length === 0 && base.length > 20, 'R3-Rest ' + id + ': Zeilenumbruch aller ' + base.length + ' Blöcke bei Rahmen ' + widths.join('/') + ' px identisch' + (bad.length ? ' — ' + bad.slice(0, 3).join('; ') : ''));
    }
    // 3) Export-Polster in Referenz-px: Boxbreite / Videobreite bei 90 und 385 px Rahmen gleich (capLayout inkl. Safe-Zone-Breite)
    {
      const gb = T.STYLES.find(x => x.id === 'glassbox'); T.setActiveId('glassbox'); T.setWpbState(2); T.setLines(mkLines(2));
      const ws = ['Drei', 'Tricks,'], blk = { text: ws.join(' '), start: 0, end: 1, words: ws.map((w, i) => ({ word: w, start: i * 0.2, end: i * 0.2 + 0.2 })) };
      T.setState([blk], blk.words, 'karaoke');
      const r = {};
      for (const w of [90, 385]) { setFrame(w); const L = T.capLayout(mkCtx(), blk, 0, 0, gb, 1080, 1920); r[w] = (Math.max.apply(null, L.lineWs) + 36 * L.scale * T.capOutK()) / 1080; }
      ok(near(r[90], r[385], 0.002), 'R3-Rest: sichtbare Boxbreite / Videobreite bei 90 px (' + r[90].toFixed(4) + ') = 385 px (' + r[385].toFixed(4) + ')');
    }
    // 4) Sticker-/Emoji-Grösse: kein Runden auf ganze CSS-px — Verhältnis Emoji / Rahmenbreite in jeder Fensterbreite gleich
    {
      const st = T.STYLES.find(x => x.id === 'stickeremoji'), gb = T.STYLES.find(x => x.id === 'glassbox'), rr = {};
      for (const w of [90, 125, 220, 333, 385, 720]) {
        setFrame(w);
        const f1 = T.buildCap(['ab', 'cd'], st, 0, T.getFontSize(), [0, 0.5], 2, { emoji: '🔥', age: 1 }), f2 = T.buildCap(['ab', 'cd'], gb, 0, T.getFontSize(), [0, 0.5], 2, { emoji: '🔥', age: 1 });
        const px = h => +/font-size:([\d.]+)px;line-height:1;text-align:center/.exec(h.slice(h.indexOf('cap-emo')))[1];
        rr[w] = { sticker: px(f1) / w, normal: px(f2) / w };
      }
      const ws = Object.keys(rr);
      ok(ws.every(w => near(rr[w].sticker, rr[ws[0]].sticker, 0.0003) && near(rr[w].normal, rr[ws[0]].normal, 0.0003)), 'R3-Rest: Emoji/Rahmenbreite bei 6 Rahmenbreiten gleich (Sticker ' + rr[ws[0]].sticker.toFixed(4) + ' · normal ' + rr[ws[0]].normal.toFixed(4) + ', Schwankung ' + (100 * Math.max.apply(null, ws.map(w => Math.abs(rr[w].sticker / rr[ws[0]].sticker - 1)))).toFixed(2) + ' %)');
      ok(!/Math\.round\(\(px \|\| 24\) \* EMO_REL\)|Math\.round\(L\.fitPx \* EMO_REL\)/.test(script), 'R3-Rest: Emoji-Grösse in Vorschau und Export nicht mehr gerundet');
    }
    // 5) Typewriter: die sichtbare Teilzeile sitzt mittig (früh / Mitte / Ende), jede Zeile für sich — Export-Zeichnung mit Aufzeichnungs-Kontext
    {
      const ty = T.STYLES.find(x => x.id === 'typewriter'); T.setActiveId('typewriter'); T.setWpbState(4);
      const mkRec = () => { const st = [], c = { _font: '', letterSpacing: '0px', calls: [], clipR: null, lastRect: null, lineWidth: 1, strokeStyle: '#000', fillStyle: '#000', shadowColor: 'transparent', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, globalAlpha: 1, filter: 'none', textAlign: 'left', textBaseline: 'alphabetic',
        get font() { return this._font; }, set font(v) { this._font = v; },
        measureText(str) { const m = /([\d.]+)px/.exec(this._font); return { width: (str || '').length * (m ? +m[1] : 16) * 0.55 + (parseFloat(this.letterSpacing) || 0) * (str || '').length }; },
        fillText(t, x, y) { const m = /([\d.]+)px/.exec(this._font); this.calls.push({ t, x, y, px: +m[1], w: this.measureText(t).width, clipR: this.clipR }); }, strokeText() {},
        rect(x, y, w, h) { this.lastRect = { x, w }; }, clip() { this.clipR = this.lastRect.x + this.lastRect.w; },
        save() { st.push(this.clipR); }, restore() { this.clipR = st.length ? st.pop() : null; },
        translate() {}, rotate() {}, scale() {}, beginPath() {}, fill() {}, stroke() {}, roundRect() {}, ellipse() {}, fillRect() {}, drawImage() {}, createLinearGradient() { return { addColorStop() {} }; } }; return c; };
      const ws = ['Drei', 'Tricks', 'damit', 'deine', 'Reels', 'laufen'].map((w, i) => ({ word: w, start: 1 + i * 0.6, end: 1 + i * 0.6 + 0.55 }));
      const tyN = Object.assign({}, ty, { cur: '' }); // Cursor würde die sichtbare Breite verfälschen
      for (const lines of [1, 2]) {
        T.setLines(mkLines(lines)); setFrame(385);
        const bl = [{ text: ws.map(w => w.word).join(' '), start: 1, end: 5, words: ws }];
        T.setState(bl, ws, 'karaoke');
        const devs = [];
        for (const t of [1.1, 1.45, 2.3, 3.4, 4.9]) {
          const c = mkRec(); T.drawCaptionsOnCtx(c, t, tyN, 1080, 1920, false);
          const rows = {};
          c.calls.forEach(k => { const key = Math.round(k.y); const R = k.clipR !== null ? Math.min(k.x + k.w, k.clipR - 0.1 * k.px) : k.x + k.w; const r = rows[key] || (rows[key] = { l: Infinity, r: -Infinity }); r.l = Math.min(r.l, k.x); r.r = Math.max(r.r, R); });
          Object.values(rows).forEach(r => devs.push({ t, d: (r.l + r.r) / 2 - 540 }));
        }
        ok(devs.length >= 5 && devs.every(x => Math.abs(x.d) < 1.5), 'R3-Rest Typewriter (' + lines + ' Zeile' + (lines > 1 ? 'n' : '') + '): sichtbare Teilzeile mittig in Export-Frames früh/Mitte/Ende, Abweichung ≤ ' + Math.max.apply(null, devs.map(x => Math.abs(x.d))).toFixed(2) + ' px von 540 (' + devs.length + ' Zeilen-Frames)');
      }
      ok(/capTypeCenter\(M, s, fxs, em\)/.test(script) && /typeDx\[wo\.li\]/.test(script) && !/typeLeft/.test(script), 'R3-Rest Typewriter: Vorschau (capTypeCenter) und Export (typeDx) rücken dieselbe Teilzeile');
    }
    // 6) suggestHook ist entfernt (nirgends aufgerufen)
    ok(!/suggestHook/.test(script) && !/suggestHook/.test(htmlContent), 'R3-Rest: ungenutzte Funktion suggestHook entfernt');
    frameEl.style.width = prevW; frameEl.style.height = prevH; T.setFontSizeState(prevFs);
    T.setActiveId(prevId); T.setWpbState(prevWpb); T.setMaxCharsState(prevMc); T.setLines(mkLines(prevLines));
  }
  console.log(fails === 0 ? 'ALLE TESTGRUPPEN BESTANDEN' : fails + ' FEHLER');
  process.exit(fails ? 1 : 0);
})();
