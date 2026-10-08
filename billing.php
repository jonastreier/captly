<?php
/**
 * CaptionRush – Abo-Hilfsfunktionen (nur include, kein Endpunkt). Alles hinter dem Schalter BILLING_ENABLED in config.php
 * (Standard: aus → die Seite verhält sich wie in der Beta, nichts ändert sich).
 *
 * Pläne: free = 30 Min./Monat (mit Login), creator = 300 Min., pro = 1200 Min. (config: PLAN_MINUTES).
 * Nutzung: public.usage (Sekunden pro Tag und Nutzer), Plan: public.profiles (von paddle-webhook.php gepflegt).
 */
if (!defined('CR_INCLUDE')) { http_response_code(404); exit; }

function cr_billing_on($cfg) { return !empty($cfg['BILLING_ENABLED']); }
function cr_sb_base($cfg) { return rtrim((string)($cfg['SUPABASE_URL'] ?? ''), '/'); }

/** Minuten pro Plan (Sekunden = *60); config.php kann PLAN_MINUTES überschreiben. */
function cr_plan_seconds($cfg) {
  $d = ['free' => 30, 'creator' => 300, 'pro' => 1200];
  $c = is_array($cfg['PLAN_MINUTES'] ?? null) ? $cfg['PLAN_MINUTES'] : [];
  foreach ($d as $k => $v) $d[$k] = max(0, (int)($c[$k] ?? $v)) * 60;
  return $d;
}

/** Supabase-REST mit service_role-Key. Gibt [status, json] zurück. */
function cr_sb($cfg, $method, $path, $body = null, $prefer = 'return=representation') {
  $c = curl_init(cr_sb_base($cfg) . '/rest/v1/' . $path);
  $key = (string)($cfg['SUPABASE_SERVICE_KEY'] ?? '');
  curl_setopt_array($c, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => ['apikey: ' . $key, 'Authorization: Bearer ' . $key, 'Content-Type: application/json', 'Prefer: ' . $prefer]]);
  if ($body !== null) curl_setopt($c, CURLOPT_POSTFIELDS, json_encode($body));
  $r = curl_exec($c); $st = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
  return [$st, $r === false ? null : json_decode($r, true)];
}

/** Session-Token → ['id','email'] (Supabase prüft das Token), 5 Min. gecacht; null = nicht eingeloggt. */
function cr_user_from_token($cfg, $tok) {
  $tok = trim((string)$tok);
  if ($tok === '' || strlen($tok) > 4096) return null;
  $sbUrl = cr_sb_base($cfg); $anon = (string)($cfg['SUPABASE_ANON_KEY'] ?? '');
  if ($sbUrl === '' || $anon === '') return null;
  $cf = sys_get_temp_dir() . '/capivo_tokuser_' . md5($tok);
  if (is_file($cf) && filemtime($cf) > time() - 300) { $u = json_decode((string)@file_get_contents($cf), true); if (is_array($u) && !empty($u['id'])) return $u; }
  $c = curl_init($sbUrl . '/auth/v1/user');
  curl_setopt_array($c, [CURLOPT_HTTPHEADER => ['apikey: ' . $anon, 'Authorization: Bearer ' . $tok], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_CONNECTTIMEOUT => 5]);
  $r = curl_exec($c); $sc = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
  $u = json_decode((string)$r, true);
  if ($sc !== 200 || !is_array($u) || empty($u['id']) || !preg_match('/^[0-9a-f-]{36}$/i', (string)$u['id'])) return null;
  $out = ['id' => (string)$u['id'], 'email' => (string)($u['email'] ?? '')];
  @file_put_contents($cf, json_encode($out), LOCK_EX);
  return $out;
}

/**
 * Wirksamer Plan aus der Profilzeile. Bezahlte Pläne gelten, solange die Laufzeit nicht abgelaufen ist
 * (status active/trialing/past_due → bis period_end, bei past_due mit 3 Tagen Kulanz); 'canceled', 'paused' oder
 * abgelaufen → free.
 */
function cr_effective_plan($row, $now = null) {
  $now = $now ?: time();
  if (!is_array($row)) return 'free';
  $plan = (string)($row['plan'] ?? 'free');
  if (!in_array($plan, ['creator', 'pro'], true)) return 'free';
  $st = (string)($row['status'] ?? 'active');
  if (!in_array($st, ['active', 'trialing', 'past_due'], true)) return 'free';
  $end = !empty($row['period_end']) ? strtotime((string)$row['period_end']) : 0;
  if ($end && $end + ($st === 'past_due' ? 3 * 86400 : 0) < $now) return 'free';
  return $plan;
}

function cr_profile($cfg, $uid) {
  [$st, $rows] = cr_sb($cfg, 'GET', 'profiles?select=plan,status,period_end,paddle_customer_id&user_id=eq.' . rawurlencode($uid) . '&limit=1');
  return ($st >= 200 && $st < 300 && is_array($rows) && count($rows)) ? $rows[0] : null;
}
/** Verbrauchte Sekunden im laufenden Kalendermonat (UTC). */
function cr_month_used($cfg, $uid) {
  [$st, $rows] = cr_sb($cfg, 'GET', 'usage?select=seconds&user_id=eq.' . rawurlencode($uid) . '&day=gte.' . gmdate('Y-m-01') . '&limit=40');
  if ($st < 200 || $st >= 300 || !is_array($rows)) return null;
  $sum = 0; foreach ($rows as $r) $sum += (int)($r['seconds'] ?? 0);
  return $sum;
}
function cr_add_usage($cfg, $uid, $sec) {
  $sec = (int)ceil($sec);
  if ($sec < 1) return true;
  [$st] = cr_sb($cfg, 'POST', 'rpc/add_usage', ['p_user' => $uid, 'p_seconds' => $sec], 'return=minimal');
  return $st >= 200 && $st < 300;
}

/** Paddle-Preis-ID → Plan (config: PADDLE_PRICE_CREATOR / PADDLE_PRICE_PRO). */
function cr_plan_for_price($cfg, $priceId) {
  if ($priceId !== '' && $priceId === (string)($cfg['PADDLE_PRICE_CREATOR'] ?? '')) return 'creator';
  if ($priceId !== '' && $priceId === (string)($cfg['PADDLE_PRICE_PRO'] ?? '')) return 'pro';
  return null;
}
function cr_paddle_base($cfg) {
  $o = (string)($cfg['PADDLE_API_BASE'] ?? '');
  if ($o !== '') return rtrim($o, '/');
  return (($cfg['PADDLE_ENV'] ?? 'sandbox') === 'production') ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';
}
