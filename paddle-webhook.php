<?php
/**
 * CaptionRush – Paddle-Webhook (Paddle Billing): POST /api/paddle-webhook
 * Nur aktiv mit BILLING_ENABLED=true und PADDLE_WEBHOOK_SECRET in config.php (sonst 503).
 *
 * Sicherheit: Header `Paddle-Signature: ts=<unix>;h1=<hex>` = HMAC-SHA256("<ts>:<roher Body>", Secret). Mehrere h1-Werte
 * (Secret-Rotation) sind erlaubt, Vergleich zeitkonstant, Zeitstempel muss innerhalb PADDLE_TOLERANCE_SEC (Standard 300) liegen.
 * Idempotenz: public.paddle_events (event_id primary key) — ein Event wird genau einmal verarbeitet; schlägt die Verarbeitung fehl,
 * wird die Zeile wieder gelöscht und 500 gesendet (Paddle wiederholt). Reihenfolge: ältere Events (occurred_at) überschreiben nichts Neueres.
 * Behandelt: subscription.created / activated / updated / resumed / trialing / past_due / paused / canceled.
 */
define('CR_INCLUDE', 1);
require __DIR__ . '/billing.php';
$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function out($code, $arr) { http_response_code($code); echo json_encode($arr); exit; }

$secret = (string)($cfg['PADDLE_WEBHOOK_SECRET'] ?? '');
$ready = cr_billing_on($cfg) && $secret !== '' && cr_sb_base($cfg) !== '' && !empty($cfg['SUPABASE_SERVICE_KEY']);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(200, ['ok' => true, 'service' => 'captionrush-paddle-webhook', 'configured' => $ready]);
if (!$ready) out(503, ['error' => 'billing_disabled']);

$raw = file_get_contents('php://input', false, null, 0, 262145);
if ($raw === false || $raw === '' || strlen($raw) > 262144) out(400, ['error' => 'bad_body']);

// ── Signatur prüfen (vor jedem Parsen des Inhalts) ──
$hdr = (string)($_SERVER['HTTP_PADDLE_SIGNATURE'] ?? '');
$ts = 0; $sigs = [];
foreach (explode(';', $hdr) as $part) {
  $kv = explode('=', trim($part), 2);
  if (count($kv) !== 2) continue;
  if ($kv[0] === 'ts' && ctype_digit($kv[1])) $ts = (int)$kv[1];
  if ($kv[0] === 'h1' && preg_match('/^[0-9a-f]{64}$/i', $kv[1])) $sigs[] = strtolower($kv[1]);
}
if (!$ts || !$sigs) out(401, ['error' => 'bad_signature']);
$tol = array_key_exists('PADDLE_TOLERANCE_SEC', $cfg) ? (int)$cfg['PADDLE_TOLERANCE_SEC'] : 300;
if ($tol > 0 && abs(time() - $ts) > $tol) out(401, ['error' => 'stale_timestamp']);
$calc = hash_hmac('sha256', $ts . ':' . $raw, $secret);
$good = false; foreach ($sigs as $s) if (hash_equals($calc, $s)) $good = true;
if (!$good) out(401, ['error' => 'bad_signature']);

$ev = json_decode($raw, true);
if (!is_array($ev) || empty($ev['event_id']) || empty($ev['event_type']) || !is_array($ev['data'] ?? null)) out(400, ['error' => 'bad_event']);
$eventId = (string)$ev['event_id']; $type = (string)$ev['event_type'];
if (!preg_match('/^[A-Za-z0-9_.-]{1,80}$/', $eventId)) out(400, ['error' => 'bad_event']);
$handled = ['subscription.created', 'subscription.activated', 'subscription.updated', 'subscription.resumed', 'subscription.trialing',
            'subscription.past_due', 'subscription.paused', 'subscription.canceled'];
if (!in_array($type, $handled, true)) out(200, ['ok' => true, 'ignored' => $type]);

// ── Idempotenz: Event-ID zuerst eintragen; Duplikat → nichts tun ──
[$st, $ins] = cr_sb($cfg, 'POST', 'paddle_events?on_conflict=event_id', ['event_id' => $eventId, 'type' => $type], 'resolution=ignore-duplicates,return=representation');
if ($st < 200 || $st >= 300) out(500, ['error' => 'db']);
if (!is_array($ins) || !count($ins)) out(200, ['ok' => true, 'duplicate' => true]);
function undo_event($cfg, $eventId) { cr_sb($cfg, 'DELETE', 'paddle_events?event_id=eq.' . rawurlencode($eventId), null, 'return=minimal'); }

$d = $ev['data'];
$custId = (string)($d['customer_id'] ?? ''); $subId = (string)($d['id'] ?? '');
$uid = (string)($d['custom_data']['user_id'] ?? '');
if (!preg_match('/^[0-9a-f-]{36}$/i', $uid)) {
  $uid = '';
  if ($custId !== '') { // Folge-Events ohne custom_data: Nutzer über die gespeicherte Kunden-ID finden
    [$s2, $rows] = cr_sb($cfg, 'GET', 'profiles?select=user_id&paddle_customer_id=eq.' . rawurlencode($custId) . '&limit=1');
    if ($s2 >= 200 && $s2 < 300 && is_array($rows) && count($rows)) $uid = (string)$rows[0]['user_id'];
  }
}
if ($uid === '') out(200, ['ok' => true, 'ignored' => 'no_user']); // Event bleibt als verarbeitet markiert; nichts zu tun

$plan = null;
foreach ((array)($d['items'] ?? []) as $it) { $p = cr_plan_for_price($cfg, (string)($it['price']['id'] ?? '')); if ($p) { $plan = $p; break; } }
if ($plan === null) out(200, ['ok' => true, 'ignored' => 'unknown_price']);

$status = (string)($d['status'] ?? 'active');
if (!in_array($status, ['active', 'trialing', 'past_due', 'paused', 'canceled'], true)) $status = 'active';
if ($type === 'subscription.canceled') $status = 'canceled';
if ($type === 'subscription.past_due') $status = 'past_due';
$end = $d['current_billing_period']['ends_at'] ?? ($d['canceled_at'] ?? null);
$occ = (string)($ev['occurred_at'] ?? gmdate('c'));
if (strtotime($occ) === false) $occ = gmdate('c');

// ── Reihenfolge: nur übernehmen, wenn das Event neuer ist als der gespeicherte Stand ──
[$s3, $cur] = cr_sb($cfg, 'GET', 'profiles?select=last_event_at&user_id=eq.' . rawurlencode($uid) . '&limit=1');
if ($s3 < 200 || $s3 >= 300) { undo_event($cfg, $eventId); out(500, ['error' => 'db']); }
if (is_array($cur) && count($cur) && !empty($cur[0]['last_event_at']) && strtotime((string)$cur[0]['last_event_at']) > strtotime($occ)) out(200, ['ok' => true, 'ignored' => 'older_event']);

$row = ['user_id' => $uid, 'plan' => $plan, 'status' => $status, 'period_end' => $end ? gmdate('c', strtotime((string)$end)) : null,
        'paddle_customer_id' => $custId ?: null, 'paddle_subscription_id' => $subId ?: null, 'last_event_at' => gmdate('c', strtotime($occ)), 'updated_at' => gmdate('c')];
[$s4] = cr_sb($cfg, 'POST', 'profiles?on_conflict=user_id', $row, 'resolution=merge-duplicates,return=minimal');
if ($s4 < 200 || $s4 >= 300) { undo_event($cfg, $eventId); out(500, ['error' => 'db']); }
out(200, ['ok' => true, 'plan' => $plan, 'status' => $status]);
