<?php
/**
 * CaptionRush – Transkript-Feinschliff („Polish“) für klassisches PHP-Webhosting (Groq Chat Completions).
 * Gleiche Schnittstelle und Regeln wie api/polish.js (Vercel) – Details/Vertrag siehe dort.
 *
 * Nach Whisper large-v3 korrigiert ein LLM NUR offensichtliche Erkennungsfehler (verhörte Wörter,
 * v. a. aus dem Vokabular; Rechtschreibung; Gross-/Kleinschreibung; Satzzeichen; Satzgrenzen).
 * Jede Korrektur wird serverseitig geprüft; zu starke Abweichungen → Original bleibt.
 *
 * POST polish.php   Content-Type: application/json   (optional Header X-Capivo-Token bei REQUIRE_LOGIN)
 *   { "lang": "de", "vocab": "Birkenhof, Highland Beef", "segments": [ { "id": 0, "text": "..." }, ... ] }
 *   Gesamttext ≤ 12 000 Zeichen, ≤ 1000 Segmente (sonst 413); ids = eindeutige Zahlen.
 * 200 → { "segments": [ { "id", "text" } ... ] (gleiche ids/Reihenfolge), "model": "...|null", "changed": n, "rejected": n }
 * Fehler → { "error": "..." }: 400, 401 login_required, 413, 429, 500 „Server nicht konfiguriert“, 502 (Groq fehlgeschlagen).
 *
 * Setup: dieselbe config.php wie transcribe.php (GROQ_API_KEY, optional CORS_ORIGIN,
 * RATE_LIMIT_PER_HOUR (eigener Zähler), REQUIRE_LOGIN + SUPABASE_URL + SUPABASE_ANON_KEY).
 * Benötigt PHP mit cURL; mbstring optional (ohne: Umlaut-Grossbuchstaben zählen als Wortänderung).
 */

const POLISH_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
const POLISH_MAX_CHARS = 12000;
const POLISH_MAX_SEGMENTS = 1000;
const POLISH_MAX_BYTES = 262144;
const POLISH_BUDGET_S = 20;
const POLISH_MIN_FALLBACK_S = 4;

const POLISH_SYSTEM_PROMPT = <<<'TXT'
You proofread automatic speech-recognition (Whisper) transcripts that become video subtitles.
Input: JSON {"lang": ISO code, "vocab": comma-separated names/terms (may be empty), "segments": [{"id", "text"}]}.
Output: ONLY a JSON object {"segments":[{"id":<same id>,"text":"<corrected text>"}]} containing every input id exactly once, in the same order. Return unchanged segments verbatim.

Fix ONLY obvious recognition errors:
1. Misheard words: if a word or phrase sounds like an entry in "vocab", write it exactly as in vocab (e.g. "Birkehof" -> "Birkenhof", "Highland Biff" -> "Highland Beef"). Also fix clearly misheard common words that make no sense in context.
2. Spelling mistakes.
3. Capitalization: sentence starts, proper names; in German ALL nouns are capitalized.
4. Punctuation and sentence boundaries: periods, commas, question marks, apostrophes.

NEVER:
- paraphrase, rephrase, translate, summarize, shorten, expand or "improve" style or grammar;
- add, remove or reorder words, or move words between segments; never merge or split segments;
- remove filler words (äh, ähm, also, halt, quasi, gell, eh, um, like), repetitions, colloquial, Swiss or dialect phrasing — keep them exactly as spoken;
- change numbers between digits and words;
- change "ss" to "ß". Swiss spelling uses "ss": if the input text has no "ß", the output must not contain "ß".
- "translate" Swiss German / dialect into Standard German: dialect words stay as written (e.g. "üsi", "zäme", "uf", "hüt", "zeig", "Weid", "willkomme" stay — only fix their capitalization);
- join separate words with hyphens or merge/split words (e.g. never "Highland Rinder" -> "Highland-Rinder"); use only plain ASCII hyphens if a hyphen is already in the input.
- replace a correctly recognised real word with a vocab entry just because they share a word: vocab only fixes words that SOUND like the entry and make no sense as heard ("Highland Rinder" stays "Highland Rinder"; "Highland Biff" -> "Highland Beef");
Keep the language of the input. If you are not sure a change is needed, leave the text unchanged.
TXT;

function polish_few_shot() {
  return [
    [['lang' => 'de', 'vocab' => 'Birkenhof, Highland Beef', 'segments' => [
        ['id' => 1, 'text' => 'äh willkommen auf dem birkehof bei uns gibts highland biff'],
        ['id' => 2, 'text' => 'die rinder sind das ganze jahr draussen gell']]],
     ['segments' => [
        ['id' => 1, 'text' => "Äh, willkommen auf dem Birkenhof, bei uns gibt's Highland Beef."],
        ['id' => 2, 'text' => 'Die Rinder sind das ganze Jahr draussen, gell?']]]],
    [['lang' => 'de', 'vocab' => '', 'segments' => [
        ['id' => 7, 'text' => 'also wir haben halt heute morgen die schaafe geschoren und das war mega streng'],
        ['id' => 8, 'text' => 'ich weiss nicht ob das jetzt so gut ist wie letztes jahr was meinst du']]],
     ['segments' => [
        ['id' => 7, 'text' => 'Also, wir haben halt heute Morgen die Schafe geschoren und das war mega streng.'],
        ['id' => 8, 'text' => 'Ich weiss nicht, ob das jetzt so gut ist wie letztes Jahr. Was meinst du?']]]],
  ];
}

function polish_json($v) { return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE); }

function polish_messages($lang, $vocab, $segs) {
  $m = [['role' => 'system', 'content' => POLISH_SYSTEM_PROMPT]];
  foreach (polish_few_shot() as $ex) {
    $m[] = ['role' => 'user', 'content' => polish_json($ex[0])];
    $m[] = ['role' => 'assistant', 'content' => polish_json($ex[1])];
  }
  $m[] = ['role' => 'user', 'content' => polish_json(['lang' => $lang, 'vocab' => $vocab, 'segments' => $segs])];
  return $m;
}

// ── Prüfung der LLM-Vorschläge (identisch zu api/polish.js) ─────────────────────────────────
function polish_clean($s) {
  $s = preg_replace('/[\x{0000}-\x{001F}\x{007F}-\x{009F}]/u', ' ', (string)$s);
  return $s === null ? '' : trim(preg_replace('/\s+/u', ' ', $s));
}
function polish_len($s) { return preg_match_all('/./us', (string)$s); }
function polish_norm_words($s) {
  $out = [];
  foreach (preg_split('/\s+/u', (string)$s, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $w) {
    $w = function_exists('mb_strtolower') ? mb_strtolower($w, 'UTF-8') : strtolower($w);
    $w = preg_replace('/[^\p{L}\p{N}]+/u', '', str_replace('ß', 'ss', $w));
    if ($w !== null && $w !== '') $out[] = $w;
  }
  return $out;
}
function polish_word_distance($a, $b) {
  $nb = count($b); $prev = range(0, $nb);
  for ($i = 1, $na = count($a); $i <= $na; $i++) {
    $cur = [$i];
    for ($j = 1; $j <= $nb; $j++) {
      $cur[$j] = min($prev[$j] + 1, $cur[$j - 1] + 1, $prev[$j - 1] + ($a[$i - 1] === $b[$j - 1] ? 0 : 1));
    }
    $prev = $cur;
  }
  return $prev[$nb];
}
/** Akzeptierter (ggf. ß→ss reparierter) Text oder null (→ Original behalten). */
function polish_accept($orig, $cand) {
  if (!is_string($cand)) return null;
  $t = polish_clean($cand);
  if ($t === '') return null;
  if (!preg_match('/[ßẞ]/u', $orig)) $t = str_replace(['ẞ', 'ß'], ['SS', 'ss'], $t);
  // Exotische Bindestriche → normaler; neu eingefügte Bindestriche (Original ohne '-') → Leerzeichen (Wortzahl/Timings)
  $t = str_replace(["\u{2010}", "\u{2011}"], '-', $t);
  if (strpos($orig, '-') === false) $t = preg_replace('/(\S)-(\S)/u', '$1 $2', $t);
  $a = polish_norm_words($orig); $b = polish_norm_words($t); $n = count($a);
  if ($n === 0 || count($b) === 0) return null;
  if (abs(count($b) - $n) > max(2, (int)floor($n * 0.15))) return null;
  if (polish_word_distance($a, $b) > max(1, (int)floor($n * 0.35))) return null;
  if (polish_len($t) > polish_len($orig) * 2 + 40) return null;
  return $t;
}
/** LLM-Antwort → [id-string => text] oder null wenn unlesbar. */
function polish_parse_llm($content) {
  if (!is_string($content)) return null;
  $s = trim($content);
  $obj = json_decode($s, true);
  if (!is_array($obj)) {
    $i = strpos($s, '{'); $j = strrpos($s, '}');
    if ($i === false || $j === false || $j <= $i) return null;
    $obj = json_decode(substr($s, $i, $j - $i + 1), true);
  }
  if (!is_array($obj) || !isset($obj['segments']) || !is_array($obj['segments'])) return null;
  $out = [];
  foreach ($obj['segments'] as $x) {
    if (!is_array($x) || !array_key_exists('id', $x)) continue;
    $id = $x['id'];
    if (is_string($id) && is_numeric(trim($id))) $id = trim($id) + 0;
    if (!is_int($id) && !(is_float($id) && is_finite($id))) continue;
    $k = (string)$id;
    if (array_key_exists($k, $out)) continue;
    $out[$k] = $x['text'] ?? null;
  }
  return $out;
}
function polish_apply($segs, $map) {
  $changed = 0; $rejected = 0; $out = [];
  foreach ($segs as $s) {
    $k = (string)$s['id'];
    if (!array_key_exists($k, $map)) { $out[] = $s; continue; }
    $prop = $map[$k]; $ok = polish_accept($s['text'], $prop);
    if ($ok === null) {
      if (!is_string($prop) || polish_clean($prop) !== polish_clean($s['text'])) $rejected++;
      $out[] = $s; continue;
    }
    if ($ok !== $s['text']) $changed++;
    $out[] = ['id' => $s['id'], 'text' => $ok];
  }
  return ['segments' => $out, 'changed' => $changed, 'rejected' => $rejected];
}
function polish_groq($key, $model, $messages, $timeout) {
  $body = ['model' => $model, 'messages' => $messages, 'temperature' => 0, 'response_format' => ['type' => 'json_object']];
  if (strpos($model, 'gpt-oss') !== false) $body['reasoning_effort'] = 'low';
  $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
  curl_setopt_array($ch, [
    CURLOPT_POST => true, CURLOPT_POSTFIELDS => polish_json($body),
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $key, 'Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => max(1, (int)$timeout), CURLOPT_CONNECTTIMEOUT => min(10, max(1, (int)$timeout)),
  ]);
  $res = curl_exec($ch); $status = curl_getinfo($ch, CURLINFO_HTTP_CODE); $errno = curl_errno($ch); curl_close($ch);
  if ($res === false) return ['ok' => false, 'status' => 0, 'retry' => true, 'err' => $errno === 28 ? 'timeout' : 'network'];
  if ($status < 200 || $status >= 300) return ['ok' => false, 'status' => $status, 'retry' => $status !== 401 && $status !== 403, 'err' => 'http'];
  $data = json_decode($res, true);
  $content = $data['choices'][0]['message']['content'] ?? null;
  $map = polish_parse_llm($content);
  if ($map === null) return ['ok' => false, 'status' => $status, 'retry' => true, 'err' => 'unparseable'];
  return ['ok' => true, 'map' => $map];
}

// Für Tests: nur Funktionen laden, keinen Request bearbeiten.
if (defined('CAPIVO_POLISH_LIB')) return;

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

function fail($code, $msg, $extra = []) {
  http_response_code($code);
  echo polish_json(['error' => $msg] + $extra);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  echo json_encode(['ok' => true, 'service' => 'capivo-polish', 'configured' => $KEY !== '']);
  exit;
}
@set_time_limit(60);
if ($KEY === '') fail(500, 'Server nicht konfiguriert: GROQ_API_KEY fehlt (config.php anlegen).');

// ── Optional: nur eingeloggte Nutzer (Supabase) – wie transcribe.php ──
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

// ── IP-Limit (eigener Zähler, getrennt von transcribe.php) ───────────
$LIMIT = (int)($cfg['RATE_LIMIT_PER_HOUR'] ?? 120);
if ($LIMIT > 0) {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
  $rf = sys_get_temp_dir() . '/capivo_rlp_' . md5($ip) . '.json';
  $now = time(); $hits = [];
  if (is_file($rf)) { $d = json_decode((string)@file_get_contents($rf), true); if (is_array($d)) $hits = array_filter($d, function($t) use ($now) { return $t > $now - 3600; }); }
  if (count($hits) >= $LIMIT) { header('Retry-After: 300'); fail(429, 'Zu viele Anfragen von dieser Adresse – bitte später erneut versuchen.'); }
  $hits[] = $now;
  @file_put_contents($rf, json_encode(array_values($hits)), LOCK_EX);
}

// ── Body lesen + prüfen ──────────────────────────────────────────────
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > POLISH_MAX_BYTES) fail(413, 'Anfrage zu gross.');
$raw = file_get_contents('php://input');
if ($raw === false || $raw === '') fail(400, 'Ungültige Anfrage: segments fehlt.');
if (strlen($raw) > POLISH_MAX_BYTES) fail(413, 'Anfrage zu gross.');
$in = json_decode($raw, true);
if (!is_array($in)) fail(400, 'Ungültiges JSON.');
if (!isset($in['segments']) || !is_array($in['segments']) || array_values($in['segments']) !== $in['segments']) fail(400, 'Ungültige Anfrage: segments fehlt.');
if (count($in['segments']) > POLISH_MAX_SEGMENTS) fail(413, 'Zu viele Segmente (max. ' . POLISH_MAX_SEGMENTS . ').');
$segs = []; $seen = []; $chars = 0;
foreach ($in['segments'] as $s) {
  $id = is_array($s) ? ($s['id'] ?? null) : null;
  if (!is_array($s) || !(is_int($id) || (is_float($id) && is_finite($id))) || isset($seen[(string)$id]) || !is_string($s['text'] ?? null))
    fail(400, 'Ungültige Anfrage: jedes Segment braucht eine eindeutige numerische id und text.');
  $seen[(string)$id] = true; $chars += polish_len($s['text']);
  $segs[] = ['id' => $id, 'text' => $s['text']];
}
if ($chars > POLISH_MAX_CHARS) fail(413, 'Transkript zu lang für die Korrektur (max. ' . POLISH_MAX_CHARS . ' Zeichen).');
$lang = substr(preg_replace('/[^a-z]/', '', strtolower(is_string($in['lang'] ?? null) ? $in['lang'] : '')), 0, 8);
$vocab = polish_clean(is_string($in['vocab'] ?? null) ? $in['vocab'] : '');
if (preg_match('/^.{0,300}/us', $vocab, $vm)) $vocab = trim($vm[0]); else $vocab = '';

$todo = [];
foreach ($segs as $s) if (trim($s['text']) !== '') $todo[] = ['id' => $s['id'], 'text' => polish_clean($s['text'])];
if (!$todo) { echo polish_json(['segments' => $segs, 'model' => null, 'changed' => 0, 'rejected' => 0]); exit; }

// ── Groq: Hauptmodell, dann Fallback ─────────────────────────────────
$messages = polish_messages($lang, $vocab, $todo);
$deadline = microtime(true) + POLISH_BUDGET_S;
$last = null;
foreach (POLISH_MODELS as $i => $model) {
  $left = $deadline - microtime(true);
  if ($i > 0 && ($left < POLISH_MIN_FALLBACK_S || !$last['retry'])) break;
  $last = polish_groq($KEY, $model, $messages, $left);
  if ($last['ok']) {
    $out = polish_apply($segs, $last['map']);
    echo polish_json(['segments' => $out['segments'], 'model' => $model, 'changed' => $out['changed'], 'rejected' => $out['rejected']]);
    exit;
  }
}
$msg = $last['err'] === 'timeout' ? 'Korrektur-Dienst hat nicht rechtzeitig geantwortet.'
  : ($last['err'] === 'network' ? 'Korrektur-Dienst nicht erreichbar.'
  : ($last['err'] === 'unparseable' ? 'Korrektur-Dienst hat nicht-lesbar geantwortet.'
  : 'Korrektur-Dienst meldet Fehler (HTTP ' . $last['status'] . ').'));
fail(502, $msg, ['upstream' => $last['status'] ?: null]);
