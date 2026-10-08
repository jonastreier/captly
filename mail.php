<?php
/**
 * CaptionRush – Mailversand ohne Abhängigkeiten (nur include, kein Endpunkt).
 * SMTP mit Login über SSL (Port 465) oder STARTTLS (Port 587); ohne SMTP_HOST fällt es auf PHP mail() zurück.
 * Konfiguration aus config.php: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_FROM_NAME
 * (optional SMTP_SECURE = ssl | starttls; Standard: Port 465 → ssl, sonst starttls).
 */
if (!defined('CR_INCLUDE')) { http_response_code(404); exit; }

function cr_smtp_read($fp) {
  $out = '';
  while (($line = fgets($fp, 1024)) !== false) {
    $out .= $line;
    if (strlen($line) < 4 || $line[3] === ' ') break; // letzte Zeile einer (mehrzeiligen) Antwort
  }
  return $out;
}
function cr_smtp_cmd($fp, $cmd, $expect) {
  if ($cmd !== null) fwrite($fp, $cmd . "\r\n");
  $r = cr_smtp_read($fp);
  return strpos($r, (string)$expect) === 0 ? true : $r;
}
function cr_header_safe($s) { return trim(preg_replace('/[\r\n]+/', ' ', (string)$s)); }

/** Plain-Text-Mail senden. Gibt true oder false zurück (nie eine Exception). */
function cr_send_mail($cfg, $to, $subject, $text, $extraHeaders = []) {
  $to = cr_header_safe($to);
  if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
  $from = cr_header_safe($cfg['MAIL_FROM'] ?? '');
  if (!filter_var($from, FILTER_VALIDATE_EMAIL)) return false;
  $fromName = cr_header_safe($cfg['MAIL_FROM_NAME'] ?? 'CaptionRush');
  $subj = '=?UTF-8?B?' . base64_encode(cr_header_safe($subject)) . '?=';
  $headers = [
    'From: =?UTF-8?B?' . base64_encode($fromName) . "?= <$from>",
    'To: <' . $to . '>',
    'Subject: ' . $subj,
    'Date: ' . date('r'),
    'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . (preg_replace('/^.*@/', '', $from)) . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    'Auto-Submitted: auto-generated',
  ];
  foreach ($extraHeaders as $h) $headers[] = cr_header_safe($h);
  $body = rtrim(chunk_split(base64_encode(str_replace(["\r\n", "\r"], "\n", $text)), 76, "\r\n"));

  $host = (string)($cfg['SMTP_HOST'] ?? '');
  if ($host === '') { // kein SMTP konfiguriert: PHP mail() (Hostpoint liefert dafür einen lokalen Mailserver)
    return @mail($to, $subj, $body, implode("\r\n", array_merge([$headers[0]], array_slice($headers, 3))), '-f' . $from);
  }

  $port = (int)($cfg['SMTP_PORT'] ?? 465);
  $secure = (string)($cfg['SMTP_SECURE'] ?? ($port === 465 ? 'ssl' : 'starttls')); // ssl | starttls | none (nur für Tests)
  $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
  $fp = @stream_socket_client(($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port, $en, $es, 12, STREAM_CLIENT_CONNECT, $ctx);
  if (!$fp) return false;
  stream_set_timeout($fp, 12);
  $ok = false;
  try {
    if (strpos(cr_smtp_read($fp), '220') !== 0) throw new Exception('greeting');
    $ehlo = 'EHLO ' . (preg_replace('/[^a-z0-9.-]/i', '', $_SERVER['SERVER_NAME'] ?? 'localhost') ?: 'localhost');
    if (cr_smtp_cmd($fp, $ehlo, '250') !== true) throw new Exception('ehlo');
    if ($secure === 'starttls') {
      if (cr_smtp_cmd($fp, 'STARTTLS', '220') !== true) throw new Exception('starttls');
      if (!@stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) throw new Exception('tls');
      if (cr_smtp_cmd($fp, $ehlo, '250') !== true) throw new Exception('ehlo2');
    }
    $user = (string)($cfg['SMTP_USER'] ?? '');
    if ($user !== '') {
      if (cr_smtp_cmd($fp, 'AUTH LOGIN', '334') !== true) throw new Exception('auth');
      if (cr_smtp_cmd($fp, base64_encode($user), '334') !== true) throw new Exception('user');
      if (cr_smtp_cmd($fp, base64_encode((string)($cfg['SMTP_PASS'] ?? '')), '235') !== true) throw new Exception('pass');
    }
    if (cr_smtp_cmd($fp, "MAIL FROM:<$from>", '250') !== true) throw new Exception('from');
    if (cr_smtp_cmd($fp, "RCPT TO:<$to>", '250') !== true) throw new Exception('rcpt');
    if (cr_smtp_cmd($fp, 'DATA', '354') !== true) throw new Exception('data');
    $msg = implode("\r\n", $headers) . "\r\n\r\n" . $body;
    $msg = preg_replace('/^\./m', '..', $msg); // Dot-Stuffing
    fwrite($fp, $msg . "\r\n.\r\n");
    $ok = strpos(cr_smtp_read($fp), '250') === 0;
    @fwrite($fp, "QUIT\r\n");
  } catch (Exception $e) { $ok = false; }
  @fclose($fp);
  return $ok;
}

/** Signierter Abmelde-Link (HMAC-SHA256 über die Adresse, Schlüssel = LEAD_SECRET). Kein Token in der DB nötig. */
function cr_unsub_sig($cfg, $email) {
  $key = (string)($cfg['LEAD_SECRET'] ?? '') ?: (string)($cfg['SUPABASE_SERVICE_KEY'] ?? '');
  return $key === '' ? '' : substr(hash_hmac('sha256', 'unsub:' . strtolower($email), $key), 0, 32);
}
function cr_unsub_link($cfg, $email) {
  $sig = cr_unsub_sig($cfg, $email);
  if ($sig === '') return '';
  $site = rtrim((string)($cfg['SITE_URL'] ?? 'https://captionrush.com'), '/');
  return $site . '/api/unsubscribe?e=' . rtrim(strtr(base64_encode(strtolower($email)), '+/', '-_'), '=') . '&s=' . $sig;
}
/** Zusatz-Header für Newsletter-Mails (RFC 8058: Ein-Klick-Abmeldung, von Gmail/Yahoo verlangt). */
function cr_unsub_headers($cfg, $email) {
  $l = cr_unsub_link($cfg, $email);
  return $l === '' ? [] : ['List-Unsubscribe: <' . $l . '>', 'List-Unsubscribe-Post: List-Unsubscribe=One-Click'];
}
