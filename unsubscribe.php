<?php
/**
 * CaptionRush – Newsletter abmelden: /api/unsubscribe?e=<base64url(email)>&s=<HMAC> (Link in jeder Newsletter-Mail).
 * GET zeigt nur eine Bestätigungsseite (Mail-Scanner rufen Links vorab ab); erst POST setzt unsubscribed_at.
 * POST ohne Formular (RFC 8058, «List-Unsubscribe=One-Click» von Gmail/Apple Mail) meldet ebenfalls ab.
 */
define('CR_INCLUDE', 1);
require __DIR__ . '/mail.php';
$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex');

$de = stripos((string)($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? ''), 'de') === 0;
$e = (string)($_GET['e'] ?? ''); $s = (string)($_GET['s'] ?? '');
$email = '';
if (preg_match('/^[A-Za-z0-9_-]{4,340}$/', $e)) $email = (string)base64_decode(strtr($e, '-_', '+/'), true);
$sig = $email !== '' ? cr_unsub_sig($cfg, $email) : '';
$valid = $sig !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) && hash_equals($sig, $s);
$post = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$state = $valid ? 'ask' : 'invalid';

if ($valid && $post) {
  $SB = rtrim((string)($cfg['SUPABASE_URL'] ?? ''), '/'); $KEY = (string)($cfg['SUPABASE_SERVICE_KEY'] ?? '');
  $state = 'error';
  if ($SB !== '' && $KEY !== '') {
    $c = curl_init($SB . '/rest/v1/leads?email=eq.' . rawurlencode($email));
    curl_setopt_array($c, [CURLOPT_CUSTOMREQUEST => 'PATCH', CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 12,
      CURLOPT_HTTPHEADER => ['apikey: ' . $KEY, 'Authorization: Bearer ' . $KEY, 'Content-Type: application/json', 'Prefer: return=minimal'],
      CURLOPT_POSTFIELDS => json_encode(['unsubscribed_at' => gmdate('c')])]);
    curl_exec($c); $st = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
    if ($st >= 200 && $st < 300) $state = 'done'; // auch wenn keine Zeile passte: Antwort verrät nichts über Adressen
  }
}
$msg = [
  'ask'     => [$de ? 'Newsletter abmelden?' : 'Unsubscribe from the newsletter?', $de ? 'Mit einem Klick erhältst du keine Neuigkeiten mehr von CaptionRush.' : 'One click and you won\'t get news from CaptionRush any more.'],
  'done'    => [$de ? 'Abgemeldet' : 'You\'re unsubscribed', $de ? 'Du bekommst keine Newsletter mehr. Der Export ohne Anmeldung funktioniert weiterhin.' : 'You won\'t get any more newsletters. Exporting without signing up still works.'],
  'invalid' => [$de ? 'Link ungültig' : 'Link not valid', $de ? 'Der Abmelde-Link ist unvollständig oder verändert. Schreib uns an contact@captionrush.com, dann tragen wir dich aus.' : 'This unsubscribe link is incomplete or was altered. Write to contact@captionrush.com and we\'ll remove you.'],
  'error'   => [$de ? 'Das hat nicht geklappt' : 'Something went wrong', $de ? 'Bitte versuche es später nochmals oder schreib uns an contact@captionrush.com.' : 'Please try again later or write to contact@captionrush.com.'],
][$state];
http_response_code($state === 'error' ? 503 : 200);
?><!doctype html>
<html lang="<?= $de ? 'de' : 'en' ?>"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title><?= htmlspecialchars($msg[0]) ?> · CaptionRush</title>
<style>:root{--ink:#16181d;--muted:#5d6470;--brand:#7c3aed;--bg:#f5f7f8;--card:#fff;--line:#e3e7ea}@media(prefers-color-scheme:dark){:root{--ink:#f2f3f5;--muted:#a0a7b3;--bg:#14161a;--card:#1c1f25;--line:#2b2f37}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:420px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:32px 24px;text-align:center}h1{margin:0 0 8px;font-size:22px}p{margin:0 0 20px;color:var(--muted)}a,button{display:inline-block;background:var(--brand);color:#fff;text-decoration:none;font:600 16px system-ui,sans-serif;padding:12px 20px;border:0;border-radius:10px;cursor:pointer}</style>
</head><body><main><h1><?= htmlspecialchars($msg[0]) ?></h1><p><?= htmlspecialchars($msg[1]) ?></p>
<?php if ($state === 'ask'): ?><form method="post" action="?e=<?= htmlspecialchars($e) ?>&amp;s=<?= htmlspecialchars($s) ?>"><button type="submit"><?= $de ? 'Ja, abmelden' : 'Yes, unsubscribe' ?></button></form>
<?php else: ?><a href="<?= $de ? '/de' : '/' ?>">CaptionRush</a><?php endif; ?></main></body></html>
