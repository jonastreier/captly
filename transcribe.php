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
 * Frontend ruft:  POST transcribe.php?model=<groq-model>&lang=<iso>&translate=<0|1>
 *   Body = rohe WAV-Bytes (Content-Type: audio/wav)  ODER  multipart mit Feld "file".
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
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
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
if ($KEY === '') fail(500, 'Server nicht konfiguriert: GROQ_API_KEY fehlt (config.php anlegen).');

// ── Modell whitelisten (verhindert Missbrauch beliebiger Werte) ──────
$ALLOWED = ['whisper-large-v3', 'whisper-large-v3-turbo'];
$model = $_GET['model'] ?? 'whisper-large-v3-turbo';
if (!in_array($model, $ALLOWED, true)) $model = 'whisper-large-v3-turbo';

$translate = (($_GET['translate'] ?? '0') === '1');
$lang = preg_replace('/[^a-z]/', '', strtolower($_GET['lang'] ?? '')); // ISO-Kürzel, sonst leer

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
$body   = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$cerr   = curl_error($ch);
curl_close($ch);
if ($cleanup && $tmp) @unlink($tmp);

if ($body === false) fail(502, 'Transkriptions-Dienst nicht erreichbar: ' . $cerr);

// Groq-Status & -Body 1:1 durchreichen (Frontend kennt 401/402/413/429/503).
http_response_code($status ?: 502);
echo $body;
