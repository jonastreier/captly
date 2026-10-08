<?php
/**
 * CaptionRush – Kontaktformular: /contact (Sprache nach Browser) und /kontakt (deutsch).
 * GET zeigt das Formular, POST verschickt die Nachricht per Mail an CONTACT_TO (Standard: contact@captionrush.com)
 * mit Reply-To = Adresse der Absenderin. Es wird nichts gespeichert, auch keine IP (nur ein Zähler pro IP-Hash in /tmp).
 * Schutz gegen Spam ohne Drittanbieter: unsichtbares Feld (Honeypot), signierter Zeitstempel (mind. 4 s zwischen
 * Anzeige und Absenden), höchstens 5 Nachrichten pro Stunde und IP, Längenlimits.
 */
define('CR_INCLUDE', 1);
require __DIR__ . '/mail.php';
$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex');

$qlang = (string)($_GET['lang'] ?? '');
$de = $qlang === 'de' || ($qlang !== 'en' && stripos((string)($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? ''), 'de') === 0);
$to = (string)($cfg['CONTACT_TO'] ?? 'contact@captionrush.com');
$secret = (string)($cfg['LEAD_SECRET'] ?? '');
$post = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';

function cr_form_token($secret, $ts) { return $ts . '.' . substr(hash_hmac('sha256', 'contact|' . $ts, $secret), 0, 24); }
function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

$name = $email = $message = ''; $state = 'form'; $err = '';
if ($post) {
  $name = trim(mb_substr((string)($_POST['name'] ?? ''), 0, 100));
  $email = strtolower(trim((string)($_POST['email'] ?? '')));
  $message = trim(mb_substr((string)($_POST['message'] ?? ''), 0, 4000));
  $tok = (string)($_POST['t'] ?? '');
  $bot = trim((string)($_POST['website'] ?? '')) !== ''; // Honeypot ausgefüllt
  if ($secret !== '') { // Zeitstempel muss von uns stammen, mindestens 4 s und höchstens 2 h alt sein
    $ts = (int)explode('.', $tok . '.')[0];
    if (!hash_equals(cr_form_token($secret, $ts), $tok) || time() - $ts < 4 || time() - $ts > 7200) $bot = true;
  }
  if ($bot) {
    $state = 'done'; // Bots bekommen dieselbe Antwort wie alle anderen, es wird nichts verschickt
  } elseif ($email === '' || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $err = $de ? 'Bitte gib eine gültige E-Mail-Adresse an, damit wir antworten können.' : 'Please enter a valid email address so we can reply.';
  } elseif (mb_strlen($message) < 5) {
    $err = $de ? 'Bitte schreib uns eine Nachricht.' : 'Please write a message.';
  } else {
    // Drosselung pro IP: 5 Nachrichten pro Stunde (Datei mit IP-Hash, nur Zeitstempel)
    $rf = sys_get_temp_dir() . '/capivo_contact_' . md5($_SERVER['REMOTE_ADDR'] ?? 'x') . '.json'; $now = time(); $hits = [];
    if (is_file($rf)) { $d = json_decode((string)@file_get_contents($rf), true); if (is_array($d)) $hits = array_values(array_filter($d, function($t) use ($now) { return $t > $now - 3600; })); }
    if (count($hits) >= 5) {
      http_response_code(429); header('Retry-After: 900');
      $err = $de ? 'Du hast gerade viele Nachrichten geschickt. Bitte versuche es in einer Stunde nochmals.' : 'You have sent a lot of messages just now. Please try again in an hour.';
    } else {
      $hits[] = $now; @file_put_contents($rf, json_encode($hits), LOCK_EX);
      $subject = '[CaptionRush] ' . ($de ? 'Kontakt' : 'Contact') . ': ' . mb_substr(preg_replace('/\s+/', ' ', $message), 0, 60);
      $text = ($name !== '' ? "Name: $name\n" : '') . "E-Mail: $email\n" . ($de ? 'Sprache: de' : 'Sprache: en') . "\n\n" . $message . "\n";
      $okSend = cr_send_mail($cfg, $to, $subject, $text, ['Reply-To: <' . $email . '>']);
      if ($okSend) $state = 'done';
      else { http_response_code(503); $err = $de ? 'Die Nachricht konnte nicht gesendet werden. Bitte schreib uns direkt an ' . $to . '.' : 'The message could not be sent. Please write to us directly at ' . $to . '.'; }
    }
  }
}
$tokOut = $secret !== '' ? cr_form_token($secret, time()) : '';
$T = $de
  ? ['title' => 'Kontakt', 'lead' => 'Eine Frage, ein Fehler oder eine Idee? Schreib uns, wir antworten per E-Mail.', 'name' => 'Name (optional)', 'email' => 'Deine E-Mail-Adresse', 'msg' => 'Nachricht', 'send' => 'Senden',
     'doneH' => 'Danke, das hat geklappt', 'doneP' => 'Wir haben deine Nachricht erhalten und melden uns per E-Mail.', 'priv' => 'Wir verwenden deine Angaben nur, um dir zu antworten. Mehr dazu in der <a href="/datenschutz">Datenschutzerklärung</a>.', 'home' => 'Zurück zu CaptionRush', 'homeUrl' => '/de']
  : ['title' => 'Contact', 'lead' => 'A question, a bug or an idea? Write to us and we\'ll reply by email.', 'name' => 'Name (optional)', 'email' => 'Your email address', 'msg' => 'Message', 'send' => 'Send',
     'doneH' => 'Thanks, that worked', 'doneP' => 'We received your message and will reply by email.', 'priv' => 'We only use your details to reply to you. More in the <a href="/privacy">privacy policy</a>.', 'home' => 'Back to CaptionRush', 'homeUrl' => '/'];
?><!doctype html>
<html lang="<?= $de ? 'de' : 'en' ?>"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title><?= h($T['title']) ?> · CaptionRush</title>
<style>:root{--ink:#16181d;--muted:#5d6470;--brand:#7c3aed;--bg:#f5f7f8;--card:#fff;--line:#d5dbe0;--err:#b3261e}@media(prefers-color-scheme:dark){:root{--ink:#f2f3f5;--muted:#a0a7b3;--bg:#14161a;--card:#1c1f25;--line:#3a3f49;--err:#ff8a80}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{width:100%;max-width:520px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px 24px}h1{margin:0 0 8px;font-size:22px}p{margin:0 0 16px;color:var(--muted)}
label{display:block;margin:0 0 14px;font-weight:600;font-size:14px}input,textarea{display:block;width:100%;margin-top:6px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font:16px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}textarea{min-height:150px;resize:vertical}
input:focus,textarea:focus{outline:2px solid var(--brand);outline-offset:1px}.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}.err{color:var(--err);font-weight:600}
button,.btn{display:inline-block;background:var(--brand);color:#fff;text-decoration:none;font:600 16px system-ui,sans-serif;padding:12px 22px;border:0;border-radius:10px;cursor:pointer}small{display:block;margin-top:14px;color:var(--muted)}small a,.back{color:var(--brand)}.back{display:inline-block;margin-bottom:14px;font-size:14px;text-decoration:none}</style>
</head><body><main>
<?php if ($state === 'done'): ?>
<h1><?= h($T['doneH']) ?></h1><p><?= h($T['doneP']) ?></p><a class="btn" href="<?= h($T['homeUrl']) ?>">CaptionRush</a>
<?php else: ?>
<a class="back" href="<?= h($T['homeUrl']) ?>">← <?= h($T['home']) ?></a>
<h1><?= h($T['title']) ?></h1><p><?= h($T['lead']) ?></p>
<?php if ($err !== ''): ?><p class="err" role="alert"><?= h($err) ?></p><?php endif; ?>
<form method="post" action="" novalidate>
  <label><?= h($T['name']) ?><input type="text" name="name" maxlength="100" autocomplete="name" value="<?= h($name) ?>"></label>
  <label><?= h($T['email']) ?><input type="email" name="email" required maxlength="254" autocomplete="email" value="<?= h($email) ?>"></label>
  <label><?= h($T['msg']) ?><textarea name="message" required maxlength="4000"><?= h($message) ?></textarea></label>
  <div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
  <input type="hidden" name="t" value="<?= h($tokOut) ?>">
  <button type="submit"><?= h($T['send']) ?></button>
  <small><?= $T['priv'] ?></small>
</form>
<?php endif; ?>
</main></body></html>
