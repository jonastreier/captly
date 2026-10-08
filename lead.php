<?php
/**
 * CaptionRush – Lead-Erfassung (E-Mail für den Download, optional Newsletter mit Double-Opt-in).
 * POST /api/lead  {email, newsletter, consent_text, source, lang}  →  {ok:true}
 *
 * Schreibt mit dem service_role-Key NUR serverseitig in public.leads (RLS: anon hat dort keinen Zugriff).
 * Bei Newsletter-Wunsch geht eine Bestätigungsmail mit einmaligem Link raus (confirm.php); erst danach
 * gilt die Einwilligung (confirmed_at). Antworten verraten nie, ob eine Adresse schon existiert.
 */
define('CR_INCLUDE', 1);
require __DIR__ . '/mail.php';
$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function out($code, $arr) { http_response_code($code); echo json_encode($arr); exit; }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(200, ['ok' => true, 'service' => 'captionrush-lead', 'configured' => !empty($cfg['SUPABASE_SERVICE_KEY'])]);
$SB  = rtrim((string)($cfg['SUPABASE_URL'] ?? ''), '/');
$KEY = (string)($cfg['SUPABASE_SERVICE_KEY'] ?? '');
if ($SB === '' || $KEY === '') out(503, ['error' => 'not_configured']);

// Drosselung pro IP (Dateien in sys_get_temp_dir): 20 Einträge pro Stunde
$ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
$rf = sys_get_temp_dir() . '/capivo_lead_' . md5($ip) . '.json'; $now = time(); $hits = [];
if (is_file($rf)) { $d = json_decode((string)@file_get_contents($rf), true); if (is_array($d)) $hits = array_values(array_filter($d, function($t) use ($now) { return $t > $now - 3600; })); }
if (count($hits) >= 20) { header('Retry-After: 900'); out(429, ['error' => 'rate_limited']); }
$hits[] = $now; @file_put_contents($rf, json_encode($hits), LOCK_EX);

$raw = file_get_contents('php://input', false, null, 0, 4096);
$in = json_decode((string)$raw, true);
if (!is_array($in)) out(400, ['error' => 'bad_request']);
$email = strtolower(trim((string)($in['email'] ?? '')));
if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) out(400, ['error' => 'invalid_email']);
$news = !empty($in['newsletter']);
$consent = $news ? mb_substr((string)($in['consent_text'] ?? ''), 0, 300) : null;
$source = mb_substr(preg_replace('/[^a-z0-9_-]/i', '', (string)($in['source'] ?? 'export')), 0, 40);
$lang = mb_substr(preg_replace('/[^a-zA-Z-]/', '', (string)($in['lang'] ?? '')), 0, 20);

function sb($method, $path, $body = null, $prefer = 'return=representation') {
  global $SB, $KEY;
  $c = curl_init($SB . '/rest/v1/' . $path);
  curl_setopt_array($c, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 12,
    CURLOPT_HTTPHEADER => ['apikey: ' . $KEY, 'Authorization: Bearer ' . $KEY, 'Content-Type: application/json', 'Prefer: ' . $prefer]]);
  if ($body !== null) curl_setopt($c, CURLOPT_POSTFIELDS, json_encode($body));
  $r = curl_exec($c); $st = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
  return [$st, $r === false ? null : json_decode($r, true)];
}

[$st, $rows] = sb('GET', 'leads?select=id,newsletter,confirmed_at,confirm_sent&email=eq.' . rawurlencode($email) . '&limit=1');
if ($st < 200 || $st >= 300) out(502, ['error' => 'db']);
$row = is_array($rows) && count($rows) ? $rows[0] : null;

if ($row) {
  $patch = [];
  if ($news && empty($row['newsletter'])) { $patch['newsletter'] = true; $patch['consent_text'] = $consent; }
  if ($patch) { [$st2] = sb('PATCH', 'leads?id=eq.' . rawurlencode($row['id']), $patch, 'return=minimal'); if ($st2 >= 300) out(502, ['error' => 'db']); }
  $id = $row['id'];
  $needMail = $news && empty($row['confirmed_at']) && (empty($row['confirm_sent']) || strtotime($row['confirm_sent']) < $now - 600);
} else {
  [$st2, $ins] = sb('POST', 'leads', ['email' => $email, 'newsletter' => $news, 'consent_text' => $consent, 'source' => $source, 'lang' => $lang ?: null]);
  if ($st2 < 200 || $st2 >= 300 || !is_array($ins) || empty($ins[0]['id'])) out(502, ['error' => 'db']);
  $id = $ins[0]['id']; $needMail = $news;
}

$mailed = false;
if ($needMail) {
  $token = bin2hex(random_bytes(24));
  [$st3] = sb('PATCH', 'leads?id=eq.' . rawurlencode($id), ['confirm_hash' => hash('sha256', $token), 'confirm_sent' => gmdate('c')], 'return=minimal');
  if ($st3 < 300) {
    $site = rtrim((string)($cfg['SITE_URL'] ?? 'https://captionrush.com'), '/');
    $link = $site . '/api/confirm?t=' . $token;
    $de = stripos($lang, 'de') === 0;
    $subject = $de ? 'Bitte bestätige deine Anmeldung bei CaptionRush' : 'Please confirm your CaptionRush subscription';
    $text = $de
      ? "Hallo\n\nDu hast dich für Neuigkeiten von CaptionRush angemeldet. Bitte bestätige das mit diesem Link:\n\n$link\n\nHast du dich nicht angemeldet, ignoriere diese Mail – du bekommst dann nichts von uns.\n\nCaptionRush · Jonas Treier · Hauptstrasse 84A · 5070 Frick · Schweiz\n"
      : "Hi\n\nYou signed up for CaptionRush news. Please confirm with this link:\n\n$link\n\nIf you didn't sign up, just ignore this email – you won't hear from us.\n\nCaptionRush · Jonas Treier · Hauptstrasse 84A · 5070 Frick · Switzerland\n";
    $mailed = cr_send_mail($cfg, $email, $subject, $text);
  }
}
out(200, ['ok' => true, 'confirm_mail' => $needMail ? $mailed : null]);
