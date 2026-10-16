// SRT ↔ VTT lokal im Browser (kein Upload). Reine Funktionen, auch von test-ops.js geladen (UMD).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.SrtConvert = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function norm(t) { return String(t == null ? '' : t).replace(/^﻿/, '').replace(/\r\n?/g, '\n'); }
  var TS = /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})|(\d{1,2}):(\d{2})[,.](\d{1,3})/;
  // Zeitstempel in Millisekunden → "hh:mm:ss,mmm" bzw. "hh:mm:ss.mmm"
  function parseTs(s) {
    var m = String(s).trim().match(/^(?:(\d{1,3}):)?(\d{1,2}):(\d{2})[,.](\d{1,3})$/);
    if (!m) return null;
    var ms = (m[4] + '00').slice(0, 3);
    return (((+(m[1] || 0)) * 60 + (+m[2])) * 60 + (+m[3])) * 1000 + (+ms);
  }
  function fmtTs(ms, sep) {
    ms = Math.max(0, Math.round(ms));
    var h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, r = ms % 1000;
    var p = function (n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; };
    return p(h, 2) + ':' + p(m, 2) + ':' + p(s, 2) + sep + p(r, 3);
  }
  // Blöcke (durch Leerzeilen getrennt) → [{start, end, text, settings}]
  function parseCues(text) {
    var cues = [];
    norm(text).split(/\n{2,}/).forEach(function (blk) {
      var lines = blk.split('\n').filter(function (l, i, a) { return !(l === '' && (i === 0 || i === a.length - 1)); });
      if (!lines.length || /^(WEBVTT|NOTE|STYLE|REGION)\b/.test(lines[0])) return;
      var ti = -1;
      for (var i = 0; i < lines.length; i++) if (lines[i].indexOf('-->') >= 0) { ti = i; break; }
      if (ti < 0) return;
      var parts = lines[ti].split('-->');
      var start = parseTs(parts[0]), rest = (parts[1] || '').trim().split(/\s+/), end = parseTs(rest[0]);
      if (start == null || end == null) return;
      cues.push({ start: start, end: end, settings: rest.slice(1).join(' '), text: lines.slice(ti + 1).join('\n').replace(/\s+$/, '') });
    });
    return cues;
  }
  function srtToVtt(text) {
    var cues = parseCues(text);
    return 'WEBVTT\n\n' + cues.map(function (c) {
      return fmtTs(c.start, '.') + ' --> ' + fmtTs(c.end, '.') + '\n' + c.text;
    }).join('\n\n') + (cues.length ? '\n' : '');
  }
  function vttToSrt(text) {
    var cues = parseCues(text);
    return cues.map(function (c, i) {
      return (i + 1) + '\n' + fmtTs(c.start, ',') + ' --> ' + fmtTs(c.end, ',') + '\n' + c.text;
    }).join('\n\n') + (cues.length ? '\n' : '');
  }
  // Alle Zeitstempel um offsetMs verschieben (auch negativ, nie unter 0). format: 'srt' | 'vtt'
  function shift(text, offsetMs, format) {
    var cues = parseCues(text).map(function (c) { return { start: c.start + offsetMs, end: c.end + offsetMs, settings: c.settings, text: c.text }; });
    var sep = format === 'vtt' ? '.' : ',';
    var body = cues.map(function (c, i) {
      return (format === 'vtt' ? '' : (i + 1) + '\n') + fmtTs(c.start, sep) + ' --> ' + fmtTs(c.end, sep) + '\n' + c.text;
    }).join('\n\n') + (cues.length ? '\n' : '');
    return format === 'vtt' ? 'WEBVTT\n\n' + body : body;
  }
  return { srtToVtt: srtToVtt, vttToSrt: vttToSrt, shift: shift, parseCues: parseCues };
});
