<?php
/**
 * CaptionRush – minimale Fehlerüberwachung: POST /api/log {m, s, p} → Zeile in public.client_errors.
 * Ohne personenbezogene Daten: keine IP, kein User-Agent-String (nur Browser-Familie), keine Dateinamen,
 * keine Adressen mit Query, keine E-Mail-Adressen oder langen Zahlen. Client sendet gesampelt (max. 5 pro Seitenaufruf),
 * der Server begrenzt zusätzlich pro IP (Dateien in sys_get_temp_dir, nur gehashte IP, 1 Stunde).
 * Auswertung: Supabase → SQL Editor → `select * from public.error_summary;`
 */
$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function out($code, $arr = null) { http_response_code($code); if ($arr !== null) echo json_encode($arr); exit; }

$SB = rtrim((string)($cfg['SUPABASE_URL'] ?? ''), '/'); $KEY = (string)($cfg['SUPABASE_SERVICE_KEY'] ?? '');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(200, ['ok' => true, 'service' => 'captionrush-log', 'configured' => $SB !== '' && $KEY !== '']);
if ($SB === '' || $KEY === '') out(503, ['error' => 'not_configured']);

$ip = $_SERVER['REMOTE_ADDR'] ?? 'x'; $now = time();
$rf = sys_get_temp_dir() . '/capivo_log_' . md5($ip) . '.json'; $hits = [];
if (is_file($rf)) { $d = json_decode((string)@file_get_contents($rf), true); if (is_array($d)) $hits = array_values(array_filter($d, function($t) use ($now) { return $t > $now - 3600; })); }
if (count($hits) >= 20) out(429, ['error' => 'rate_limited']);
$hits[] = $now; @file_put_contents($rf, json_encode($hits), LOCK_EX);

$in = json_decode((string)file_get_contents('php://input', false, null, 0, 2048), true);
if (!is_array($in)) out(400, ['error' => 'bad_request']);

/** Entfernt alles, was auf eine Person oder ein Video schliessen lässt. */
function scrub($s, $max) {
  $s = (string)$s;
  $s = preg_replace('/[\w.+-]+@[\w-]+(\.[\w-]+)+/u', '<email>', $s);                       // E-Mail-Adressen
  $s = preg_replace('~(https?://[^\s?#"\')]+)[?#][^\s"\')]*~i', '$1', $s);               // Query/Fragment von Adressen
  $s = preg_replace('/[^\s\/\\\\"\'()<>]+\.(mp4|mov|m4v|webm|mkv|avi|m4a|mp3|wav|aac|ogg|opus|srt|vtt|txt|ttf|otf|woff2?|jpe?g|png|webp|gif|json)\b/iu', '<file>', $s); // Dateinamen
  $s = preg_replace('/\b[A-Za-z0-9_-]{24,}\b/', '<id>', $s);                              // Tokens/IDs
  $s = preg_replace('/\d{6,}/', '<n>', $s);                                                // lange Zahlen
  $s = preg_replace('/[\x00-\x1f\x7f]+/u', ' ', $s);
  return mb_substr(trim($s), 0, $max);
}
function page_path($p) {
  $path = parse_url((string)$p, PHP_URL_PATH);
  $path = is_string($path) ? $path : '/';
  return mb_substr(preg_replace('/[^A-Za-z0-9\/._-]/', '', $path), 0, 80) ?: '/';
}
$ua = (string)($_SERVER['HTTP_USER_AGENT'] ?? '');
$fam = preg_match('/Edg\//', $ua) ? 'Edge' : (preg_match('/Firefox\//', $ua) ? 'Firefox' : (preg_match('/Chrome\/|CriOS\//', $ua) ? 'Chrome' : (preg_match('/Safari\//', $ua) ? 'Safari' : 'Other')));
$browser = $fam . (preg_match('/Mobile|Android|iPhone/', $ua) ? ' mobile' : ' desktop');

$msg = scrub($in['m'] ?? '', 240);
if ($msg === '') out(400, ['error' => 'empty']);
$row = ['msg' => $msg, 'src' => scrub($in['s'] ?? '', 120) ?: null, 'page' => page_path($in['p'] ?? '/'), 'browser' => $browser];

function sbreq($method, $path, $body = null) {
  global $SB, $KEY;
  $c = curl_init($SB . '/rest/v1/' . $path);
  curl_setopt_array($c, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8,
    CURLOPT_HTTPHEADER => ['apikey: ' . $KEY, 'Authorization: Bearer ' . $KEY, 'Content-Type: application/json', 'Prefer: return=minimal']]);
  if ($body !== null) curl_setopt($c, CURLOPT_POSTFIELDS, json_encode($body));
  curl_exec($c); $st = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
  return $st;
}
$st = sbreq('POST', 'client_errors', $row);
if ($st < 200 || $st >= 300) out(502, ['error' => 'db']);
// Aufbewahrung: gelegentlich (1 %) Einträge älter als 30 Tage löschen
if (random_int(1, 100) === 1) sbreq('DELETE', 'client_errors?created_at=lt.' . rawurlencode(gmdate('c', $now - 30 * 86400)));
out(204);
