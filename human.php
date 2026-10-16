<?php
/**
 * Gluephs – Bot-Check (Cloudflare Turnstile), s. gl_require_human() in ratelimit.php.
 *   GET  /api/human          → {enabled, sitekey}   (enabled = TURNSTILE_SITE_KEY + TURNSTILE_SECRET gesetzt)
 *   POST /api/human {token}  → Turnstile-Token serverseitig bei Cloudflare prüfen → {pass, ttl} (2 h, an das Absender-Netz gebunden)
 * Ohne Konfiguration ist der Check aus und alle Endpunkte arbeiten wie bisher.
 */
$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];
if (!is_array($cfg)) $cfg = [];
require_once __DIR__ . '/ratelimit.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function out($code, $arr) { http_response_code($code); echo json_encode($arr); exit; }

$on = gl_human_on($cfg);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(200, ['enabled' => $on, 'sitekey' => $on ? (string)$cfg['TURNSTILE_SITE_KEY'] : '']);
if (!$on) out(200, ['enabled' => false, 'pass' => '']);
if (!gl_rl_take('human', 3600, 60)) { header('Retry-After: 600'); out(429, ['error' => 'rate_limited']); }

$in = json_decode((string)file_get_contents('php://input', false, null, 0, 4096), true);
$token = is_array($in) ? (string)($in['token'] ?? '') : '';
if ($token === '' || strlen($token) > 2048) out(400, ['error' => 'bad_token']);

$url = (string)($cfg['TURNSTILE_VERIFY_URL'] ?? 'https://challenges.cloudflare.com/turnstile/v0/siteverify'); // Tests: Mock-Server
$c = curl_init($url);
curl_setopt_array($c, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_CONNECTTIMEOUT => 5,
  CURLOPT_POSTFIELDS => http_build_query(['secret' => (string)$cfg['TURNSTILE_SECRET'], 'response' => $token, 'remoteip' => (string)($_SERVER['REMOTE_ADDR'] ?? '')])]);
$r = curl_exec($c); $st = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
$j = json_decode((string)$r, true);
if ($st < 200 || $st >= 300 || !is_array($j)) out(502, ['error' => 'verify_unavailable']);
if (empty($j['success'])) out(403, ['error' => 'not_human']);
out(200, ['pass' => gl_pass_make($cfg, 7200), 'ttl' => 7200]);
