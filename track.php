<?php
/**
 * Gluephs – anonymer Trichter-Zähler: POST /api/track {e: Ereignis, s: Quelle, l: 'de'|'en'} → +1 in gluephs-data/track-JJJJMM.json.
 * Keine Cookies, keine Nutzer-ID, keine IP-Speicherung (nur ein gehashter Zähler pro Stunde zur Drosselung in sys_get_temp_dir).
 * Das Frontend sendet nichts bei «Do Not Track»/GPC und nicht auf localhost (siehe TELE_ON in captly.html).
 */
require __DIR__ . '/trackstore.php';
$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function out($code, $arr = null) { http_response_code($code); if ($arr !== null) echo json_encode($arr); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(200, ['ok' => true, 'service' => 'gluephs-track']);

$ip = $_SERVER['REMOTE_ADDR'] ?? 'x'; $now = time();
$rf = sys_get_temp_dir() . '/capivo_track_' . md5($ip) . '.json'; $hits = [];
if (is_file($rf)) { $d = json_decode((string)@file_get_contents($rf), true); if (is_array($d)) $hits = array_values(array_filter($d, function($t) use ($now) { return $t > $now - 3600; })); }
if (count($hits) >= 120) out(429, ['error' => 'rate_limited']);
$hits[] = $now; @file_put_contents($rf, json_encode($hits), LOCK_EX);

$in = json_decode((string)file_get_contents('php://input', false, null, 0, 512), true);
if (!is_array($in)) out(400, ['error' => 'bad_request']);
$e = (string)($in['e'] ?? '');
// Serverseitige Ereignisse (limit_*) kommen nie vom Browser
if (!in_array($e, ['visit', 'upload', 'transcribed', 'export_click', 'gate_pass', 'export_done', 'pro_interest', 'seo_view'], true)) out(400, ['error' => 'bad_event']);
gl_track_add($cfg, $e, (string)($in['s'] ?? 'direct'), ($in['l'] ?? '') === 'de' ? 'de' : 'en');
out(204);
