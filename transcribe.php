<?php
/**
 * Capivo – serverseitiger Transkriptions-Proxy (Groq Whisper large-v3).
 *
 * Zweck: Der geheime API-Key darf NIE in den Browser. Der Browser lädt die Tonspur
 * (WAV, 16 kHz mono) per POST hierher; dieses Skript hängt den Key an und ruft die
 * OpenAI-kompatible Groq-API. Läuft auf klassischem Webhosting (kein Node-Prozess nötig).
 *
 * Setup: `config.example.php` → `config.php` kopieren und Groq-Key eintragen
 * (config.php ist per .gitignore vom Repo ausgeschlossen).
 *
 * Frontend ruft:  POST transcribe.php?model=<groq-model>&lang=<iso>&translate=<0|1>&prompt=<Namen/Begriffe>
 *   Body = rohe WAV-Bytes (Content-Type: audio/wav)  ODER  multipart mit Feld "file".
 * Das Frontend schickt das Audio in ~100-s-Stücken (≤ ~3,2 MB), daher keine Probleme mit post_max_size.
 * Antwort = Groq-JSON (verbose_json): { text, language, words:[{word,start,end}], segments:[...] }
 */

// ── Config / Key laden ───────────────────────────────────────────────
$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];
if (!is_array($cfg)) $cfg = [];
$KEY  = $cfg['GROQ_API_KEY'] ?? getenv('GROQ_API_KEY') ?: '';
$CORS = $cfg['CORS_ORIGIN']  ?? getenv('GROQ_CORS_ORIGIN') ?: '';

// ── CORS (nur wenn konfiguriert; z. B. für die Vercel-Demo) ──────────
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($CORS !== '' && $origin !== '') {
  $allow = array_map('trim', explode(',', $CORS));
  if (in_array($origin, $allow, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Capivo-Token');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
  }
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function fail($code, $msg) {
  http_response_code($code);
  echo json_encode(['error' => $msg]);
  exit;
}

// GET = kleiner Health-Check (kein Key-Leak), damit man den Endpunkt im Browser sieht.
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  echo json_encode(['ok' => true, 'service' => 'capivo-transcribe', 'configured' => $KEY !== '']);
  exit;
}
@set_time_limit(130); // Groq kann bei grösseren Stücken ein paar Sekunden brauchen
if ($KEY === '') fail(500, 'Server nicht konfiguriert: GROQ_API_KEY fehlt (config.php anlegen).');

// ── Modell whitelisten (verhindert Missbrauch beliebiger Werte) ──────
$ALLOWED = ['whisper-large-v3', 'whisper-large-v3-turbo'];
$model = $_GET['model'] ?? 'whisper-large-v3-turbo';
if (!in_array($model, $ALLOWED, true)) $model = 'whisper-large-v3-turbo';

$translate = (($_GET['translate'] ?? '0') === '1');
// whisper-large-v3-turbo ist nicht auf Übersetzung trainiert (Groq/OpenAI) → für Translate immer large-v3
if ($translate) $model = 'whisper-large-v3';
$lang = preg_replace('/[^a-z]/', '', strtolower($_GET['lang'] ?? '')); // ISO-Kürzel, sonst leer
// Optionales Vokabular („Names & terms“) als Whisper-Prompt: Steuerzeichen raus, Whitespace glätten,
// max. 300 Zeichen (UTF-8-sicher, ohne mbstring-Abhängigkeit). Ungültiges UTF-8 → verworfen.
$prompt = is_string($_GET['prompt'] ?? null) ? $_GET['prompt'] : '';
$prompt = preg_replace('/[\x{0000}-\x{001F}\x{007F}-\x{009F}]/u', ' ', $prompt);
$prompt = $prompt === null ? '' : trim(preg_replace('/\s+/u', ' ', $prompt));
if (preg_match('/^.{0,300}/us', $prompt, $pm)) $prompt = trim($pm[0]); else $prompt = '';

// ── Optional: nur eingeloggte Nutzer (Supabase) dürfen transkribieren ──────────────────────
// Aktivieren in config.php: REQUIRE_LOGIN=true + SUPABASE_URL + SUPABASE_ANON_KEY (beides öffentliche Werte).
// Das Frontend schickt das Session-Token im Header X-Capivo-Token (Authorization wird von manchen
// Hostern gefiltert). Ergebnis wird 5 Min. gecacht → kein Supabase-Call pro Audio-Stück.
if (!empty($cfg['REQUIRE_LOGIN'])) {
  $tok = trim($_SERVER['HTTP_X_CAPIVO_TOKEN'] ?? '');
  $sbUrl = rtrim($cfg['SUPABASE_URL'] ?? '', '/'); $sbKey = $cfg['SUPABASE_ANON_KEY'] ?? '';
  if ($sbUrl === '' || $sbKey === '') fail(500, 'REQUIRE_LOGIN aktiv, aber SUPABASE_URL/SUPABASE_ANON_KEY fehlen in config.php.');
  if ($tok === '' || strlen($tok) > 4096) fail(401, 'login_required');
  $cf = sys_get_temp_dir() . '/capivo_tok_' . md5($tok);
  if (!(is_file($cf) && filemtime($cf) > time() - 300)) {
    $c = curl_init($sbUrl . '/auth/v1/user');
    curl_setopt_array($c, [CURLOPT_HTTPHEADER => ['apikey: ' . $sbKey, 'Authorization: Bearer ' . $tok],
      CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_CONNECTTIMEOUT => 5]);
    $r = curl_exec($c); $sc = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
    $u = json_decode((string)$r, true);
    if ($sc !== 200 || empty($u['id'])) fail(401, 'login_required');
    @file_put_contents($cf, '1');
  }
}

// ── Missbrauchsschutz: einfaches Limit pro IP (der Endpunkt ist öffentlich, der Key kostet) ──
// Das Frontend schickt pro ~100 s Audio einen Request; Default 120/Stunde ≈ 3 h Audio pro IP.
$LIMIT = (int)($cfg['RATE_LIMIT_PER_HOUR'] ?? 120);
if ($LIMIT > 0) {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
  $rf = sys_get_temp_dir() . '/capivo_rl_' . md5($ip) . '.json';
  $now = time(); $hits = [];
  if (is_file($rf)) { $d = json_decode((string)@file_get_contents($rf), true); if (is_array($d)) $hits = array_filter($d, function($t) use ($now) { return $t > $now - 3600; }); }
  if (count($hits) >= $LIMIT) { header('Retry-After: 300'); fail(429, 'Zu viele Anfragen von dieser Adresse – bitte später erneut versuchen.'); }
  $hits[] = $now;
  @file_put_contents($rf, json_encode(array_values($hits)), LOCK_EX);
}

// ── Zu grosser Request? PHP verwirft den Body still, wenn er post_max_size überschreitet ──
function ini_bytes($v) {
  $v = trim((string)$v); if ($v === '') return 0;
  $n = (float)$v; $u = strtolower(substr($v, -1));
  if ($u === 'g') $n *= 1024 * 1024 * 1024; elseif ($u === 'm') $n *= 1024 * 1024; elseif ($u === 'k') $n *= 1024;
  return (int)$n;
}
$cl = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
$pm = ini_bytes(ini_get('post_max_size'));
if ($pm > 0 && $cl > $pm) fail(413, 'Upload überschreitet post_max_size (' . ini_get('post_max_size') . ') des Servers.');

// ── Audio besorgen: multipart-Feld "file" ODER roher Body ────────────
$tmp = null; $cleanup = false;
if (!empty($_FILES['file']['tmp_name']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
  $tmp = $_FILES['file']['tmp_name'];
} else {
  $raw = file_get_contents('php://input');
  if ($raw === false || strlen($raw) < 100) fail(400, 'Keine Audiodaten empfangen.');
  if (strlen($raw) > 40 * 1024 * 1024) fail(413, 'Audio zu groß (max ~40 MB). Video kürzen.');
  $tmp = tempnam(sys_get_temp_dir(), 'capivo_');
  if ($tmp === false || file_put_contents($tmp, $raw) === false) fail(500, 'Temp-Datei konnte nicht geschrieben werden.');
  $cleanup = true;
}

// ── Multipart-Request an Groq bauen ──────────────────────────────────
$endpoint = 'https://api.groq.com/openai/v1/audio/' . ($translate ? 'translations' : 'transcriptions');
$post = [
  'model'           => $model,
  'response_format' => 'verbose_json',
  'file'            => new CURLFile($tmp, 'audio/wav', 'audio.wav'),
];
if (!$translate) {
  $post['timestamp_granularities[]'] = 'word'; // Wort-Timings für Karaoke
  if ($lang !== '') $post['language'] = $lang;  // sonst Auto-Detect durch Groq
  if ($prompt !== '') $post['prompt'] = $prompt; // nur Transkription — beim Übersetzen stört der Prompt die Zielsprache
}

$ch = curl_init($endpoint);
curl_setopt_array($ch, [
  CURLOPT_POST           => true,
  CURLOPT_POSTFIELDS     => $post,
  CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $KEY],
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT        => 120,
  CURLOPT_CONNECTTIMEOUT => 15,
]);
$retryAfter = null;
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($c, $h) use (&$retryAfter) {
  if (stripos($h, 'retry-after:') === 0) $retryAfter = trim(substr($h, 12));
  return strlen($h);
});
$body   = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$cerr   = curl_error($ch);
curl_close($ch);
if ($cleanup && $tmp) @unlink($tmp);

if ($body === false) fail(502, 'Transkriptions-Dienst nicht erreichbar: ' . $cerr);

// Groq-Status & -Body 1:1 durchreichen (Frontend kennt 401/402/413/429/503 und wiederholt 429/5xx selbst).
if ($retryAfter !== null && is_numeric($retryAfter)) header('Retry-After: ' . (int)$retryAfter);
if ($status >= 400 && json_decode($body) === null) fail($status, 'Transkriptions-Dienst hat nicht-lesbar geantwortet.');
http_response_code($status ?: 502);
echo $body;
