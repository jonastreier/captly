<?php
/**
 * CaptionRush – anonyme Style-Zählung.
 *   POST /api/stat {style}  → zählt einen Export pro Tag und Style hoch (public.style_stats, keine Nutzerdaten, keine IP gespeichert)
 *   GET  /api/stat          → {total, top:[{style,n}]} der letzten 30 Tage, 1 Stunde gecached (für das «Trending»-Abzeichen)
 */
$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
function out($code, $arr = null) { http_response_code($code); if ($arr !== null) echo json_encode($arr); exit; }
$SB = rtrim((string)($cfg['SUPABASE_URL'] ?? ''), '/'); $KEY = (string)($cfg['SUPABASE_SERVICE_KEY'] ?? '');
if ($SB === '' || $KEY === '') { header('Cache-Control: no-store'); out(($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' ? 503 : 200, ['configured' => false, 'total' => 0, 'top' => []]); }

function sbcall($method, $path, $body = null) {
  global $SB, $KEY;
  $c = curl_init($SB . '/rest/v1/' . $path);
  curl_setopt_array($c, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8,
    CURLOPT_HTTPHEADER => ['apikey: ' . $KEY, 'Authorization: Bearer ' . $KEY, 'Content-Type: application/json']]);
  if ($body !== null) curl_setopt($c, CURLOPT_POSTFIELDS, json_encode($body));
  $r = curl_exec($c); $st = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
  return [$st, $r === false ? null : json_decode($r, true)];
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  header('Cache-Control: no-store');
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'x'; $now = time();
  $rf = sys_get_temp_dir() . '/capivo_stat_' . md5($ip) . '.json'; $hits = [];
  if (is_file($rf)) { $d = json_decode((string)@file_get_contents($rf), true); if (is_array($d)) $hits = array_values(array_filter($d, function($t) use ($now) { return $t > $now - 3600; })); }
  if (count($hits) >= 20) out(429, ['error' => 'rate_limited']);
  $hits[] = $now; @file_put_contents($rf, json_encode($hits), LOCK_EX);
  $in = json_decode((string)file_get_contents('php://input', false, null, 0, 512), true);
  $style = is_array($in) ? (string)($in['style'] ?? '') : '';
  if (!preg_match('/^[a-z0-9_-]{1,32}$/', $style)) out(400, ['error' => 'bad_style']);
  [$st] = sbcall('POST', 'rpc/bump_style', ['p_style' => $style]);
  out($st >= 200 && $st < 300 ? 204 : 502, $st >= 200 && $st < 300 ? null : ['error' => 'db']);
}

// GET: Rangliste der letzten 30 Tage, Datei-Cache 1 Stunde
header('Cache-Control: public, max-age=3600');
$cf = sys_get_temp_dir() . '/capivo_stat_cache.json';
if (is_file($cf) && filemtime($cf) > time() - 3600) { echo (string)file_get_contents($cf); exit; }
[$st, $rows] = sbcall('GET', 'style_stats?select=style,n&day=gte.' . gmdate('Y-m-d', time() - 30 * 86400) . '&limit=5000');
if ($st < 200 || $st >= 300 || !is_array($rows)) out(200, ['configured' => true, 'total' => 0, 'top' => []]);
$sum = []; $total = 0;
foreach ($rows as $r) { if (!isset($r['style'], $r['n'])) continue; $sum[$r['style']] = ($sum[$r['style']] ?? 0) + (int)$r['n']; $total += (int)$r['n']; }
arsort($sum);
$top = []; foreach (array_slice($sum, 0, 5, true) as $s => $n) $top[] = ['style' => (string)$s, 'n' => $n];
$json = json_encode(['configured' => true, 'total' => $total, 'top' => $top]);
@file_put_contents($cf, $json, LOCK_EX);
echo $json;
