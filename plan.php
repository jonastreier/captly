<?php
/**
 * CaptionRush – Plan und Restminuten: GET /api/plan (Header X-Capivo-Token = Supabase-Session).
 * Mit BILLING_ENABLED=false (Standard) immer {enabled:false} → das Frontend zeigt nichts davon an.
 * Antwort enthält nur öffentliche Werte (Paddle-Client-Token, Preis-IDs), nie Secrets.
 */
define('CR_INCLUDE', 1);
require __DIR__ . '/billing.php';
$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function out($code, $arr) { http_response_code($code); echo json_encode($arr); exit; }

if (!cr_billing_on($cfg)) out(200, ['enabled' => false]);
if (cr_sb_base($cfg) === '' || empty($cfg['SUPABASE_SERVICE_KEY'])) out(503, ['enabled' => false, 'error' => 'not_configured']);

$limits = cr_plan_seconds($cfg);
$paddle = ['env' => (($cfg['PADDLE_ENV'] ?? 'sandbox') === 'production') ? 'production' : 'sandbox',
           'clientToken' => (string)($cfg['PADDLE_CLIENT_TOKEN'] ?? ''),
           'prices' => ['creator' => (string)($cfg['PADDLE_PRICE_CREATOR'] ?? ''), 'pro' => (string)($cfg['PADDLE_PRICE_PRO'] ?? '')]];
$u = cr_user_from_token($cfg, $_SERVER['HTTP_X_CAPIVO_TOKEN'] ?? '');
if (!$u) out(200, ['enabled' => true, 'loggedIn' => false, 'plan' => 'anon', 'limits' => $limits, 'paddle' => $paddle]);

$row = cr_profile($cfg, $u['id']);
$plan = cr_effective_plan($row);
$used = cr_month_used($cfg, $u['id']);
if ($used === null) out(502, ['enabled' => true, 'error' => 'db']);
$limit = $limits[$plan];
out(200, ['enabled' => true, 'loggedIn' => true, 'plan' => $plan, 'status' => $row['status'] ?? 'active', 'period_end' => $row['period_end'] ?? null,
          'limit_sec' => $limit, 'used_sec' => $used, 'left_sec' => max(0, $limit - $used), 'limits' => $limits,
          'canPortal' => !empty($row['paddle_customer_id']), 'userId' => $u['id'], 'email' => $u['email'], 'paddle' => $paddle]);
