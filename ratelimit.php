<?php
/**
 * Gluephs – gemeinsame Bausteine für Missbrauchs-/Kostenschutz (eingebunden per require_once, kein eigener Endpunkt).
 *   gl_rl_ip()                        → Schlüssel des Absenders: IPv4 wie sie ist, IPv6 auf das /64-Netz gekürzt
 *                                       (ein Anschluss hat 2^64 IPv6-Adressen — pro Adresse zu zählen hebelte jedes Limit aus)
 *   gl_rl_take($name, $win, $limit, $w) → gleitendes Fenster je Absender, Lesen+Schreiben unter EINEM flock (parallele
 *                                       Requests sahen vorher denselben alten Stand); true = erlaubt und gezählt
 *   gl_day_take($name, $limit, $add)  → globaler Zähler je UTC-Tag (alle Absender zusammen), atomar; true = erlaubt und gezählt
 * Zählerdateien liegen in sys_get_temp_dir() (capivo_*), alte werden gelegentlich aufgeräumt.
 */
if (defined('GL_RATELIMIT')) return;
define('GL_RATELIMIT', 1);

function gl_rl_ip() {
  $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'x');
  if (strpos($ip, ':') !== false) {
    $bin = @inet_pton($ip);
    if ($bin !== false && strlen($bin) === 16) return 'v6:' . bin2hex(substr($bin, 0, 8));
  }
  return $ip;
}

function gl_rl_cleanup() {
  if (mt_rand(1, 100) !== 1) return;
  $old = time() - 2 * 86400;
  foreach ((array)@glob(sys_get_temp_dir() . '/capivo_*') as $f) { if (is_file($f) && @filemtime($f) < $old) @unlink($f); }
}

// Gleitendes Fenster: Einträge [zeit, gewicht]; erlaubt, solange Summe + $w ≤ $limit. $limit ≤ 0 = aus.
function gl_rl_take($name, $win, $limit, $w = 1, $key = null) {
  if ($limit <= 0) return true;
  gl_rl_cleanup();
  $f = sys_get_temp_dir() . '/capivo_' . preg_replace('/[^a-z0-9_]/', '', $name) . '_' . md5($key === null ? gl_rl_ip() : $key) . '.json';
  $h = @fopen($f, 'c+');
  if (!$h) return true; // Zähler nicht schreibbar → nicht blockieren (wie bisher)
  $ok = true;
  if (flock($h, LOCK_EX)) {
    $now = time(); $d = json_decode((string)stream_get_contents($h), true); $use = [];
    if (is_array($d)) foreach ($d as $e) { if (is_array($e) && $e[0] > $now - $win) $use[] = $e; }
    $sum = 0; foreach ($use as $e) $sum += $e[1];
    if ($sum + $w > $limit) $ok = false;
    else { $use[] = [$now, $w]; ftruncate($h, 0); rewind($h); fwrite($h, json_encode($use)); fflush($h); }
    flock($h, LOCK_UN);
  }
  fclose($h);
  return $ok;
}

function gl_day_take($name, $limit, $add = 1) {
  if ($limit <= 0) return true;
  $f = sys_get_temp_dir() . '/capivo_day_' . preg_replace('/[^a-z0-9_]/', '', $name) . '_' . gmdate('Ymd') . '.txt';
  $h = @fopen($f, 'c+');
  if (!$h) return true;
  $ok = true;
  if (flock($h, LOCK_EX)) {
    $cur = (float)trim((string)stream_get_contents($h));
    if ($cur + $add > $limit) $ok = false;
    else { ftruncate($h, 0); rewind($h); fwrite($h, (string)($cur + $add)); fflush($h); }
    flock($h, LOCK_UN);
  }
  fclose($h);
  return $ok;
}

// ── Bot-Check (Cloudflare Turnstile): an, sobald TURNSTILE_SITE_KEY + TURNSTILE_SECRET gesetzt sind (sonst ändert sich nichts).
// Der Browser löst EINMAL eine Turnstile-Prüfung (api/human → human.php) und bekommt einen signierten Pass (2 h, an das
// Absender-Netz gl_rl_ip() gebunden), den er als Header X-Gluephs-Pass mitschickt. Kostenpflichtige Endpunkte rufen
// gl_require_human(): ohne gültigen Pass 428 {error:'human_required'} → das Frontend holt einen neuen Pass und wiederholt.
// 428 statt 403: 403 deutet das Frontend als «Proxy fehlt» (Vercel-Demo).
function gl_human_on($cfg) { return (string)($cfg['TURNSTILE_SECRET'] ?? '') !== '' && (string)($cfg['TURNSTILE_SITE_KEY'] ?? '') !== ''; }
function gl_pass_mac($cfg, $exp, $net) { return substr(hash_hmac('sha256', $exp . '|' . $net, 'gluephs-pass|' . (string)($cfg['TURNSTILE_SECRET'] ?? '')), 0, 32); }
function gl_pass_make($cfg, $ttl = 7200) {
  $exp = time() + $ttl; $net = substr(md5(gl_rl_ip()), 0, 12);
  return $exp . '.' . $net . '.' . gl_pass_mac($cfg, $exp, $net);
}
function gl_pass_ok($cfg, $p) {
  if (!preg_match('/^(\d{10})\.([a-f0-9]{12})\.([a-f0-9]{32})$/', (string)$p, $m)) return false;
  if ((int)$m[1] < time() || (int)$m[1] > time() + 86400) return false;
  if ($m[2] !== substr(md5(gl_rl_ip()), 0, 12)) return false; // anderes Netz (z. B. Mobilfunk gewechselt) → neu prüfen
  return hash_equals(gl_pass_mac($cfg, $m[1], $m[2]), $m[3]);
}
function gl_require_human($cfg) {
  if (!gl_human_on($cfg) || gl_pass_ok($cfg, $_SERVER['HTTP_X_GLUEPHS_PASS'] ?? '')) return;
  http_response_code(428); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
  echo json_encode(['error' => 'human_required']); exit;
}
