<?php
/**
 * CaptionRush – Double-Opt-in-Bestätigung: GET /api/confirm?t=<token> (Link aus der Bestätigungsmail).
 * Setzt confirmed_at (Nachweis der Einwilligung: Zeitpunkt + gehashte IP). Token ist einmalig.
 */
$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex');

$de = stripos((string)($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? ''), 'de') === 0;
$t = (string)($_GET['t'] ?? '');
$state = 'invalid';
if (preg_match('/^[a-f0-9]{48}$/', $t)) {
  $SB = rtrim((string)($cfg['SUPABASE_URL'] ?? ''), '/'); $KEY = (string)($cfg['SUPABASE_SERVICE_KEY'] ?? '');
  if ($SB !== '' && $KEY !== '') {
    $salt = (string)($cfg['LEAD_SECRET'] ?? $KEY);
    $c = curl_init($SB . '/rest/v1/leads?confirm_hash=eq.' . hash('sha256', $t) . '&confirmed_at=is.null');
    curl_setopt_array($c, [CURLOPT_CUSTOMREQUEST => 'PATCH', CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 12,
      CURLOPT_HTTPHEADER => ['apikey: ' . $KEY, 'Authorization: Bearer ' . $KEY, 'Content-Type: application/json', 'Prefer: return=representation'],
      CURLOPT_POSTFIELDS => json_encode(['confirmed_at' => gmdate('c'), 'confirmed_ip' => substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . $salt), 0, 16), 'confirm_hash' => null])]);
    $r = curl_exec($c); $st = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
    $rows = json_decode((string)$r, true);
    $state = ($st >= 200 && $st < 300) ? (is_array($rows) && count($rows) ? 'ok' : 'invalid') : 'error';
  } else { $state = 'error'; }
}
$msg = [
  'ok'      => [$de ? 'Danke, bestätigt!' : 'Thanks, you\'re confirmed!', $de ? 'Du bekommst ab jetzt gelegentlich Neuigkeiten von CaptionRush. Abmelden kannst du dich in jeder Mail.' : 'You\'ll now get occasional news from CaptionRush. You can unsubscribe in every email.'],
  'invalid' => [$de ? 'Link ungültig' : 'Link not valid', $de ? 'Der Link wurde schon benutzt oder ist abgelaufen. Falls du dich anmelden wolltest, trage deine Adresse im Export-Fenster nochmals ein.' : 'This link was already used or has expired. If you wanted to subscribe, enter your address again in the export window.'],
  'error'   => [$de ? 'Das hat nicht geklappt' : 'Something went wrong', $de ? 'Bitte versuche es später nochmals oder schreib uns an contact@captionrush.com.' : 'Please try again later or write to contact@captionrush.com.'],
][$state];
http_response_code($state === 'error' ? 503 : 200);
?><!doctype html>
<html lang="<?= $de ? 'de' : 'en' ?>"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title><?= htmlspecialchars($msg[0]) ?> · CaptionRush</title>
<style>:root{--ink:#16181d;--muted:#5d6470;--brand:#7c3aed;--bg:#f5f7f8;--card:#fff;--line:#e3e7ea}@media(prefers-color-scheme:dark){:root{--ink:#f2f3f5;--muted:#a0a7b3;--bg:#14161a;--card:#1c1f25;--line:#2b2f37}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:420px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:32px 24px;text-align:center}h1{margin:0 0 8px;font-size:22px}p{margin:0 0 20px;color:var(--muted)}a{display:inline-block;background:var(--brand);color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px}</style>
</head><body><main><h1><?= htmlspecialchars($msg[0]) ?></h1><p><?= htmlspecialchars($msg[1]) ?></p><a href="<?= $de ? '/de' : '/' ?>">CaptionRush</a></main></body></html>
