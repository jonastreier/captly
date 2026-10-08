<?php
/**
 * CaptionRush – Link zum Paddle-Kundenportal (Rechnungen, Zahlungsart, Kündigen): POST /api/portal
 * Header X-Capivo-Token = Supabase-Session. Antwort {url}. Nur mit BILLING_ENABLED und PADDLE_API_KEY; der Key bleibt auf dem Server.
 * Das Portal-Link ist kurzlebig und wird jedes Mal neu erzeugt (nicht cachen).
 */
define('CR_INCLUDE', 1);
require __DIR__ . '/billing.php';
$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function out($code, $arr) { http_response_code($code); echo json_encode($arr); exit; }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(200, ['ok' => true, 'service' => 'captionrush-portal', 'configured' => cr_billing_on($cfg) && !empty($cfg['PADDLE_API_KEY'])]);
if (!cr_billing_on($cfg) || empty($cfg['PADDLE_API_KEY'])) out(503, ['error' => 'billing_disabled']);
$u = cr_user_from_token($cfg, $_SERVER['HTTP_X_CAPIVO_TOKEN'] ?? '');
if (!$u) out(401, ['error' => 'login_required']);
$row = cr_profile($cfg, $u['id']);
$cust = is_array($row) ? (string)($row['paddle_customer_id'] ?? '') : '';
if (!preg_match('/^ctm_[A-Za-z0-9]+$/', $cust)) out(404, ['error' => 'no_subscription']);

$c = curl_init(cr_paddle_base($cfg) . '/customers/' . $cust . '/portal-sessions');
curl_setopt_array($c, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => '{}', CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 12,
  CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $cfg['PADDLE_API_KEY'], 'Content-Type: application/json']]);
$r = curl_exec($c); $st = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
$j = json_decode((string)$r, true);
$url = is_array($j) ? ($j['data']['urls']['general']['overview'] ?? '') : '';
if ($st < 200 || $st >= 300 || !preg_match('~^https://~', (string)$url)) out(502, ['error' => 'paddle']);
out(200, ['url' => $url]);
