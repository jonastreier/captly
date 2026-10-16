<?php
/**
 * Gluephs – anonymer Ereigniszähler (Trichter). Speichert NUR Zähler je Tag|Ereignis|Quelle|Sprache, nie IP, nie Nutzer-ID,
 * nie Dateinamen. Datei: <Home>/gluephs-data/track-JJJJMM.json (ausserhalb des Webroots; bei Test/Fremdumgebung: Temp-Ordner).
 * Auswertung: ssh hostpoint 'for f in ~/gluephs-data/track-*.json; do cat $f; echo; done' | node scripts/track-report.js
 */
const GL_TRACK_EVENTS = ['visit', 'upload', 'transcribed', 'export_click', 'gate_pass', 'export_done', 'pro_interest', 'limit_user', 'limit_site'];

function gl_track_dir($cfg) {
  $d = (string)($cfg['TRACK_DIR'] ?? '');
  if ($d === '' && basename(dirname(__DIR__)) === 'www') $d = dirname(__DIR__, 2) . '/gluephs-data'; // Hostpoint: /home/<user>/gluephs-data
  if ($d === '') $d = sys_get_temp_dir() . '/gluephs-track';
  if (!is_dir($d)) @mkdir($d, 0700, true);
  if (!is_dir($d) || !is_writable($d)) { $d = sys_get_temp_dir() . '/gluephs-track'; if (!is_dir($d)) @mkdir($d, 0700, true); }
  return $d;
}
function gl_track_clean($s, $max, $def) {
  $s = strtolower((string)$s);
  $s = preg_replace('/[^a-z0-9._-]/', '', $s);
  return $s === '' ? $def : substr($s, 0, $max);
}
function gl_track_add($cfg, $event, $src = 'direct', $lang = 'en') {
  if (!in_array($event, GL_TRACK_EVENTS, true)) return false;
  $key = gmdate('Y-m-d') . '|' . $event . '|' . gl_track_clean($src, 40, 'direct') . '|' . ($lang === 'de' ? 'de' : 'en');
  $f = gl_track_dir($cfg) . '/track-' . gmdate('Ym') . '.json';
  $h = @fopen($f, 'c+');
  if (!$h) return false;
  if (!flock($h, LOCK_EX)) { fclose($h); return false; }
  $d = json_decode((string)stream_get_contents($h), true);
  if (!is_array($d)) $d = [];
  $d[$key] = (int)($d[$key] ?? 0) + 1;
  ftruncate($h, 0); rewind($h); fwrite($h, json_encode($d)); fflush($h);
  flock($h, LOCK_UN); fclose($h);
  return true;
}
