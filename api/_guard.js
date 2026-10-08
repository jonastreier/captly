// CaptionRush – gemeinsamer Missbrauchsschutz + Betreiber-Alarm für /api/* (kein eigener Endpunkt:
// Dateien mit „_“ werden von Vercel nicht als Route ausgeliefert).
//
//   audioSeconds(buf, isOgg)  Dauer eines Upload-Stücks aus dem Header (WAV) bzw. der letzten Ogg-Seite
//   takeAudio(ip, secs)       Audio-Kontingent pro IP und Stunde (best effort pro Function-Instanz)
//   alertOps(msg)             Push an den Betreiber, z. B. wenn Groq das Limit meldet (429)
//
// Vercel → Environment Variables (alle optional):
//   MAX_AUDIO_SEC_PER_HOUR  Default 1800 (= 30 Min. Ton pro IP und Stunde)
//   ALERT_URL               z. B. https://ntfy.sh/<geheimes-thema> — die ntfy-App auf dem Handy zeigt dann eine
//                           Push-Meldung. Höchstens eine Meldung pro Stunde und Grund (pro Instanz).
'use strict';

const MAX_CHUNK_SEC = 130; // Frontend schickt ≤ 100-s-Stücke; Luft für Rundung/Header

// WAV: Datenlänge / Bytes pro Sekunde. Ogg/Opus: Granule-Position der letzten Seite (48 kHz) minus Pre-Skip.
// Unlesbar → null (der Aufrufer lehnt dann ab; Groq könnte das Format ohnehin nicht lesen).
function audioSeconds(buf, isOgg) {
  if (!buf || buf.length < 44) return null;
  if (!isOgg) {
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') return null;
    const byteRate = buf.readUInt32LE(28);
    if (!byteRate) return null;
    let p = 12, dataLen = 0;
    while (p + 8 <= buf.length) {
      const id = buf.toString('ascii', p, p + 4), len = buf.readUInt32LE(p + 4);
      if (id === 'data') { dataLen = Math.min(len, buf.length - p - 8); break; }
      p += 8 + len + (len & 1);
    }
    return dataLen > 0 ? dataLen / byteRate : null;
  }
  // Seite für Seite laufen (27-Byte-Kopf + Segmenttabelle) statt nach „OggS“ zu suchen — sonst könnte ein
  // zufälliges „OggS“ in den Audiodaten als Seite gelesen werden.
  let p = 0, granule = -1, preSkip = 0;
  while (p + 27 <= buf.length && buf.toString('ascii', p, p + 4) === 'OggS') {
    const nSeg = buf[p + 26];
    if (p + 27 + nSeg > buf.length) break;
    let body = 0;
    for (let i = 0; i < nSeg; i++) body += buf[p + 27 + i];
    const start = p + 27 + nSeg;
    if (start + body > buf.length) break;
    if (p === 0 && body >= 12 && buf.toString('ascii', start, start + 8) === 'OpusHead') preSkip = buf.readUInt16LE(start + 10);
    granule = Number(buf.readBigUInt64LE(p + 6));
    p = start + body;
  }
  return granule > 0 ? Math.max(0, granule - preSkip) / 48000 : null;
}

const audioUse = new Map(); // ip -> [[t, secs], …]
function takeAudio(ip, secs, now) {
  now = now || Date.now();
  const cap = parseInt(process.env.MAX_AUDIO_SEC_PER_HOUR || '1800', 10);
  if (!(cap > 0)) return true;
  const list = (audioUse.get(ip) || []).filter(e => e[0] > now - 3600000);
  const used = list.reduce((a, e) => a + e[1], 0);
  if (used + secs > cap) { audioUse.set(ip, list); return false; }
  list.push([now, secs]); audioUse.set(ip, list);
  if (audioUse.size > 5000) audioUse.clear();
  return true;
}

const lastAlert = new Map();
async function alertOps(key, msg) {
  const url = process.env.ALERT_URL || '';
  if (!/^https:\/\//.test(url)) return;
  const now = Date.now();
  if ((lastAlert.get(key) || 0) > now - 3600000) return;
  lastAlert.set(key, now);
  try {
    await fetch(url, { method: 'POST', headers: { Title: 'CaptionRush', Tags: 'warning' }, body: String(msg).slice(0, 500),
      signal: AbortSignal.timeout(3000) });
  } catch (e) { /* Alarm ist best effort — nie den Nutzer-Request scheitern lassen */ }
}

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'x').split(',')[0].trim();
}

module.exports = { audioSeconds, takeAudio, alertOps, clientIp, MAX_CHUNK_SEC };
