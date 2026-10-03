<?php
/**
 * Capivo – KI-Hervorhebung („Enhance“) für klassisches PHP-Webhosting (Groq Chat Completions).
 * Gleiche Schnittstelle und Regeln wie api/enhance.js (Vercel) – Details/Vertrag siehe dort.
 *
 * Ein LLM WÄHLT nur aus (schreibt nie Text um): Keywords (0–2 Wort-Indizes je Caption), ein Emoji auf
 * ~20–30 % der Captions, sparsame Zoom-Momente (max. einer pro ~4 s) — oder auf Wunsch einen Post-Text
 * mit 3–6 Hashtags. Alles wird serverseitig geprüft (ids, Indizes, Emoji aus fester Liste, Quoten).
 *
 * POST enhance.php   Content-Type: application/json   (optional Header X-Capivo-Token bei REQUIRE_LOGIN)
 *   { "lang": "de", "want": ["keywords","emojis","zoom"], "segments": [ { "id": 0, "text": "...", "start": 1.2 } ] }
 *   { "lang": "de", "want": ["post"], "text": "ganzes Transkript" }
 * 200 → { "segments": [ { "id", "kw": [..], "emoji": "…"|null, "zoom": bool } ], "model", "dropped" }
 *     | { "post": { "caption", "hashtags": [..] }, "model" }
 * Fehler → { "error": "..." }: 400, 401 login_required, 413, 429, 500 „Server nicht konfiguriert“, 502.
 *
 * Setup: dieselbe config.php wie transcribe.php (GROQ_API_KEY, optional CORS_ORIGIN, RATE_LIMIT_PER_HOUR
 * (eigener Zähler), REQUIRE_LOGIN + SUPABASE_URL + SUPABASE_ANON_KEY). Benötigt PHP mit cURL + mbstring.
 */

const ENH_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
const ENH_MAX_CHARS = 12000;
const ENH_MAX_SEGMENTS = 1000;
const ENH_MAX_BYTES = 262144;
const ENH_BUDGET_S = 20;
const ENH_MIN_FALLBACK_S = 4;
const ENH_KW_MAX = 2;
const ENH_EMOJI_SHARE = 0.3;
const ENH_ZOOM_GAP_S = 4;
const ENH_ZOOM_SHARE = 0.2;
const ENH_CAPTION_MAX = 300;
const ENH_TAGS_MAX = 6;
const ENH_WANT_SEG = ['keywords', 'emojis', 'zoom'];

// Identisch zu api/enhance.js (test-enhance.js prüft die Parität)
const ENH_EMOJI_LIST = '🔥 💯 😂 🤣 😍 🥰 😎 🤔 😮 😱 🙌 👏 👍 👀 💪 🎉 ✨ ⭐ 🌟 ❤️ 💚 💙 💛 🧡 💜 🤍 💡 📈 📉 💰 💸 🚀 ⚡ 🎯 ✅ ❌ ⚠️ 🤯 😅 😊 🙂 😉 😭 🥲 🤝 🙏 👋 '
  . '☀️ 🌧️ ❄️ 🌱 🌿 🍀 🌳 🌲 🌾 🌻 🌸 🍂 🐄 🐮 🐂 🐑 🐐 🐖 🐷 🐔 🐓 🐴 🐶 🐱 🐝 🦋 🐟 🐦 🦌 🍔 🍕 🥩 🍖 🥗 🍎 🍓 🥕 🧀 🍞 🥚 🥛 ☕ 🍷 🍺 🍽️ '
  . '🎵 🎶 🎬 📸 📱 💻 ⏰ ⏳ 📅 🏆 🥇 🎁 🛒 🏠 🏡 🚜 🚗 ✈️ 🌍 🗺️ ⛰️ 🏔️ 🌊 🏖️ 🎓 📚 ✏️ 💬 🗣️ 👉 👆 🤷 🤦 😴 🥳 😋 🤤 😬 🙈 🧠 ❓ ❗ 💥 🌈 🌙 '
  . '🔑 🔧 🛠️ 📦 💼 🏃 🧘 ⚽ 🎾 🚴 🏋️ 🎨 🎤 🎧 🍿 🧁 🎂 🍫 🍦 🌶️ 🥑 🍋 🍇 🍉 🌽 🥔 🧄 🍯 💧 🔋 🌡️ 💎 👑 🎈 🔔 📣 🆕 🆓 ⬇️ ⬆️ ➡️ 🔝 👌 ✌️ 🤞';
const ENH_STOP = 'der die das den dem des ein eine einen einem einer eines und oder aber doch denn weil dass wenn als wie '
  . 'ich du er sie es wir ihr mich dich sich uns euch mir dir ihm ihn ihnen mein dein sein unser euer meine deine seine unsere '
  . 'ist sind war waren bin bist seid hat haben habe hast hatte wird werden wurde kann können muss müssen soll will '
  . 'in im ins an am auf aus bei mit nach von vom zu zum zur für über unter vor hinter neben zwischen durch gegen ohne um '
  . 'nicht auch noch schon nur so da dann hier dort ja nein mal eben halt also quasi gell gäll eh äh ähm öhm hm hmm '
  . 'de d dr s es isch si mer mir üs eus em am im is i u o oder ond und gsi ha hät het hend '
  . 'the a an and or but if as of to in on at by for with from into onto is are was were be been am do does did '
  . 'i you he she it we they me him her us them my your his its our their this that these those so um uh uhm like just really '
  . 'le la les un une des du et ou mais je tu il elle nous vous ils elles est sont à au aux en dans sur pour par avec '
  . 'il lo la gli le un una e o ma io tu lui lei noi voi loro è sono di da in su per con tra fra '
  . 'el la los las un una y o pero yo tú él ella nosotros es son de en con por para';

const ENH_SEG_PROMPT = <<<'TXT'
You add visual emphasis to the subtitles of a short social video (Reels/TikTok). You only SELECT — you never rewrite, correct, translate or reorder any text.
Input: JSON {"lang": ISO code, "want": list of tasks, "segments": [{"id", "text"}]} — consecutive captions of one video.
Output: ONLY a JSON object {"segments":[{"id":<same id>,"kw":["<word>"],"emoji":"<emoji>"|null,"zoom":true|false}]} with every input id exactly once.

kw (task "keywords"): 0 to 2 words copied EXACTLY as they appear in that segment's text (same spelling and case, including dialect / Swiss German) that carry the meaning: nouns, names, numbers, strong verbs or adjectives.
  Never articles, pronouns, prepositions, conjunctions, auxiliary verbs or filler words (äh, ähm, also, halt, gell, um, uh, like, so). Many segments need only one keyword; empty list if nothing stands out.
emoji (task "emojis"): exactly ONE common emoji, only where it clearly matches something said in that segment (an object, animal, food, place, feeling or action). Use it on about 1 in 4 segments, never on two consecutive segments; otherwise null. No flags, no text, no emoji sequences.
zoom (task "zoom"): true only for the strongest moments — the key claim, a punchline, a surprising number. Roughly one in 5 to 8 segments, never two in a row; otherwise false.
Fields for tasks that are not in "want" may be omitted. Keep everything else as it is — do not add fields.
TXT;

const ENH_POST_PROMPT = <<<'TXT'
You write the post text for a short social video (Instagram Reels / TikTok) from its transcript.
Input: JSON {"lang": ISO code, "text": transcript}. Output: ONLY a JSON object {"caption":"...","hashtags":["#...", ...]}.
caption: in the language of the transcript (a Swiss German transcript gets Swiss Standard German: "ss", never "ß"). A short hook plus at most one more sentence, max. 180 characters, at most 2 emojis, no hashtags inside.
Use ONLY facts that are in the transcript. Never invent names, places, prices, dates, numbers, offers or claims. If unsure, stay general.
hashtags: 3 to 6 relevant hashtags (topic, product, place or name only if mentioned), each starting with #, no spaces, no generic spam like #fyp #viral #foryou.
TXT;

function enh_few_shot() {
  return [[
    ['lang' => 'de', 'want' => ['keywords', 'emojis', 'zoom'], 'segments' => [
      ['id' => 0, 'text' => 'Hallo zäme, willkomme uf üsem Hof.'],
      ['id' => 1, 'text' => 'Hüt zeig ich euch üsi Highland Rinder'],
      ['id' => 2, 'text' => 'uf de Weid. Die sind'],
      ['id' => 3, 'text' => 'äh 365 Täg im Johr dusse'],
      ['id' => 4, 'text' => 'und frässed nur Gras und Heu.']]],
    ['segments' => [
      ['id' => 0, 'kw' => ['Hof.'], 'emoji' => '👋', 'zoom' => false],
      ['id' => 1, 'kw' => ['Highland', 'Rinder'], 'emoji' => null, 'zoom' => false],
      ['id' => 2, 'kw' => ['Weid.'], 'emoji' => '🐄', 'zoom' => false],
      ['id' => 3, 'kw' => ['365'], 'emoji' => null, 'zoom' => true],
      ['id' => 4, 'kw' => ['Gras', 'Heu.'], 'emoji' => '🌾', 'zoom' => false]]]
  ]];
}

function enh_json($v) { return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE); }
function enh_clean($s) {
  $s = preg_replace('/[\x{0000}-\x{001F}\x{007F}-\x{009F}]/u', ' ', (string)$s);
  return $s === null ? '' : trim(preg_replace('/\s+/u', ' ', $s));
}
function enh_len($s) { return preg_match_all('/./us', (string)$s); }
function enh_tokens($text) { $t = enh_clean($text); return $t === '' ? [] : explode(' ', $t); }
function enh_norm_word($w) {
  $w = function_exists('mb_strtolower') ? mb_strtolower((string)$w, 'UTF-8') : strtolower((string)$w);
  $w = preg_replace('/[^\p{L}\p{N}]+/u', '', str_replace('ß', 'ss', $w));
  return $w === null ? '' : $w;
}
function enh_vs_key($e) { return str_replace(["\u{FE0E}", "\u{FE0F}"], '', (string)$e); }
function enh_emoji_map() {
  static $m = null;
  if ($m === null) { $m = []; foreach (preg_split('/\s+/u', ENH_EMOJI_LIST, -1, PREG_SPLIT_NO_EMPTY) as $e) $m[enh_vs_key($e)] = $e; }
  return $m;
}
function enh_stop() {
  static $s = null;
  if ($s === null) $s = array_flip(preg_split('/\s+/u', ENH_STOP, -1, PREG_SPLIT_NO_EMPTY));
  return $s;
}
function enh_kw_eligible($tok) {
  $n = enh_norm_word($tok);
  if ($n === '') return false;
  if (preg_match('/\p{N}/u', $n)) return true;
  return enh_len($n) >= 2 && !isset(enh_stop()[$n]);
}
function enh_norm_emoji($e) {
  if (!is_string($e)) return null;
  $m = enh_emoji_map(); $k = enh_vs_key(trim($e));
  return $m[$k] ?? null;
}
function enh_messages($kind, $payload) {
  if ($kind === 'post') return [['role' => 'system', 'content' => ENH_POST_PROMPT], ['role' => 'user', 'content' => enh_json($payload)]];
  $m = [['role' => 'system', 'content' => ENH_SEG_PROMPT]];
  foreach (enh_few_shot() as $ex) {
    $m[] = ['role' => 'user', 'content' => enh_json($ex[0])];
    $m[] = ['role' => 'assistant', 'content' => enh_json($ex[1])];
  }
  $m[] = ['role' => 'user', 'content' => enh_json($payload)];
  return $m;
}
function enh_parse_llm($content) {
  if (!is_string($content)) return null;
  $s = trim($content);
  $obj = json_decode($s, true);
  if (!is_array($obj)) {
    $i = strpos($s, '{'); $j = strrpos($s, '}');
    if ($i === false || $j === false || $j <= $i) return null;
    $obj = json_decode(substr($s, $i, $j - $i + 1), true);
  }
  return (is_array($obj) && array_values($obj) !== $obj) ? $obj : null;
}
/** Segment-Antwort → [id-string => Rohobjekt] oder null. */
function enh_parse_seg($obj) {
  if (!is_array($obj) || !isset($obj['segments']) || !is_array($obj['segments'])) return null;
  $out = [];
  foreach ($obj['segments'] as $x) {
    if (!is_array($x) || !array_key_exists('id', $x)) continue;
    $id = $x['id'];
    if (is_string($id) && is_numeric(trim($id))) $id = trim($id) + 0;
    if (!is_int($id) && !(is_float($id) && is_finite($id))) continue;
    $k = (string)$id;
    if (array_key_exists($k, $out)) continue;
    $out[$k] = $x;
  }
  return $out;
}
function enh_map_keywords($raw, $toks) {
  $list = is_array($raw) && array_values($raw) === $raw ? $raw : ($raw === null ? [] : [$raw]);
  $used = []; $out = []; $bad = 0; $n = count($toks);
  foreach ($list as $k) {
    if (count($out) >= ENH_KW_MAX) { $bad++; continue; }
    $idx = -1;
    if (is_int($k)) $idx = $k;
    elseif (is_string($k) && trim($k) !== '') {
      $want = enh_norm_word($k);
      $parts = array_values(array_filter(array_map('enh_norm_word', explode(' ', enh_clean($k))), 'strlen'));
      for ($i = 0; $i < $n && $idx < 0; $i++) if (!isset($used[$i]) && $want !== '' && enh_norm_word($toks[$i]) === $want) $idx = $i;
      if (count($parts) > 1) {
        for ($p = 0; $p < count($parts) && $idx < 0; $p++)
          for ($i = 0; $i < $n && $idx < 0; $i++) if (!isset($used[$i]) && enh_norm_word($toks[$i]) === $parts[$p]) $idx = $i;
      }
    }
    if ($idx < 0 || $idx >= $n || isset($used[$idx]) || !enh_kw_eligible($toks[$idx])) { $bad++; continue; }
    $used[$idx] = true; $out[] = $idx;
  }
  sort($out);
  return ['kw' => $out, 'bad' => $bad];
}
/** $segs: [[id,text,start?]], $map: [id-string => obj], $want: [name => true] */
function enh_apply_seg($segs, $map, $want) {
  $dropped = 0; $out = [];
  foreach ($segs as $s) {
    $raw = $map[(string)$s['id']] ?? [];
    if (!is_array($raw)) $raw = [];
    $o = ['id' => $s['id']];
    $has = trim($s['text']) !== '';
    if (isset($want['keywords'])) {
      $r = enh_map_keywords(array_key_exists('kw', $raw) ? $raw['kw'] : ($raw['keywords'] ?? null), enh_tokens($s['text']));
      $o['kw'] = $r['kw']; $dropped += $r['bad'];
    }
    if (isset($want['emojis'])) {
      $re = $raw['emoji'] ?? null;
      $e = ($re === null || $re === '') ? null : enh_norm_emoji($re);
      if ($re !== null && $re !== '' && $e === null) $dropped++;
      $o['emoji'] = $has ? $e : null;
    }
    if (isset($want['zoom'])) $o['zoom'] = (($raw['zoom'] ?? null) === true) && $has;
    $out[] = $o;
  }
  $n = count($segs);
  if (isset($want['emojis'])) {
    $maxE = $n ? max(1, (int)floor($n * ENH_EMOJI_SHARE)) : 0; $cnt = 0; $prev = false;
    foreach ($out as &$o) {
      if ($o['emoji'] === null) { $prev = false; continue; }
      if ($prev || $cnt >= $maxE) { $o['emoji'] = null; $dropped++; $prev = false; continue; }
      $cnt++; $prev = true;
    }
    unset($o);
  }
  if (isset($want['zoom'])) {
    $timed = true; foreach ($segs as $s) if (!isset($s['start'])) $timed = false;
    $maxZ = $timed ? PHP_INT_MAX : max(1, (int)floor($n * ENH_ZOOM_SHARE));
    $cnt = 0; $lastT = -INF; $prevIdx = -2;
    foreach ($out as $i => &$o) {
      if (!$o['zoom']) continue;
      $t = $timed ? $segs[$i]['start'] : $i;
      $okGap = $timed ? ($t - $lastT >= ENH_ZOOM_GAP_S) : ($i - $prevIdx > 1);
      if (!$okGap || $cnt >= $maxZ) { $o['zoom'] = false; $dropped++; continue; }
      $cnt++; $lastT = $t; $prevIdx = $i;
    }
    unset($o);
  }
  return ['segments' => $out, 'dropped' => $dropped];
}
function enh_clean_post($obj, $src) {
  if (!is_array($obj)) return null;
  $cap = is_string($obj['caption'] ?? null) ? enh_clean($obj['caption']) : '';
  $raw = $obj['hashtags'] ?? [];
  if (is_string($raw)) $raw = preg_split('/[\s,]+/u', $raw, -1, PREG_SPLIT_NO_EMPTY);
  if (!is_array($raw)) $raw = [];
  preg_match_all('/#[\p{L}\p{N}_]+/u', $cap, $mm); $inCap = $mm[0];
  $cap = preg_replace('/\s+([.,!?…])/u', '$1', enh_clean(preg_replace('/#[\p{L}\p{N}_]+/u', ' ', $cap)));
  $noSz = !preg_match('/[ßẞ]/u', (string)$src);
  if ($noSz) $cap = str_replace(['ẞ', 'ß'], ['SS', 'ss'], $cap);
  if (enh_len($cap) > ENH_CAPTION_MAX) {
    preg_match('/^.{0,' . (ENH_CAPTION_MAX - 1) . '}/us', $cap, $cm);
    $cap = preg_replace('/\s+\S*$/u', '', $cm[0]) . '…';
  }
  $seen = []; $tags = [];
  foreach (array_merge(array_values($raw), $inCap) as $t) {
    if (!is_string($t)) continue;
    $h = preg_replace('/[^\p{L}\p{N}_]/u', '', preg_replace('/^#+/u', '', trim($t)));
    if ($noSz) $h = str_replace('ß', 'ss', $h);
    $len = enh_len($h);
    if ($len < 2 || $len > 40 || preg_match('/^\d+$/', $h)) continue;
    $k = function_exists('mb_strtolower') ? mb_strtolower($h, 'UTF-8') : strtolower($h);
    if (isset($seen[$k]) || in_array($k, ['fyp', 'foryou', 'foryoupage', 'viral', 'fy', 'fypシ'], true)) continue;
    $seen[$k] = true; $tags[] = '#' . $h;
    if (count($tags) >= ENH_TAGS_MAX) break;
  }
  if ($cap === '' && !$tags) return null;
  return ['caption' => $cap, 'hashtags' => $tags];
}
/** Request prüfen → ['kind'..] oder ['code','msg'] */
function enh_parse_input($in) {
  if (!is_array($in) || (array_values($in) === $in && $in !== [])) return ['code' => 400, 'msg' => 'Ungültige Anfrage.'];
  $lang = substr(preg_replace('/[^a-z]/', '', strtolower(is_string($in['lang'] ?? null) ? $in['lang'] : '')), 0, 8);
  $wantIn = is_array($in['want'] ?? null) ? $in['want'] : [];
  $want = [];
  foreach ($wantIn as $w) if (is_string($w) && ($w === 'post' || in_array($w, ENH_WANT_SEG, true))) $want[$w] = true;
  if ($wantIn && !$want) return ['code' => 400, 'msg' => 'Ungültige Anfrage: want unbekannt.'];
  $isPost = isset($want['post']);
  if ($isPost && count($want) > 1) return ['code' => 400, 'msg' => 'Ungültige Anfrage: post lässt sich nicht mit keywords/emojis/zoom kombinieren.'];
  $segs = null;
  if (array_key_exists('segments', $in)) {
    if (!is_array($in['segments']) || array_values($in['segments']) !== $in['segments']) return ['code' => 400, 'msg' => 'Ungültige Anfrage: segments muss eine Liste sein.'];
    if (count($in['segments']) > ENH_MAX_SEGMENTS) return ['code' => 413, 'msg' => 'Zu viele Segmente (max. ' . ENH_MAX_SEGMENTS . ').'];
    $segs = []; $seen = []; $chars = 0;
    foreach ($in['segments'] as $s) {
      $id = is_array($s) ? ($s['id'] ?? null) : null;
      if (!is_array($s) || !(is_int($id) || (is_float($id) && is_finite($id))) || isset($seen[(string)$id]) || !is_string($s['text'] ?? null))
        return ['code' => 400, 'msg' => 'Ungültige Anfrage: jedes Segment braucht eine eindeutige numerische id und text.'];
      $seen[(string)$id] = true; $chars += enh_len($s['text']);
      $seg = ['id' => $id, 'text' => $s['text']];
      foreach (['start', 'end'] as $k) { $v = $s[$k] ?? null; if ((is_int($v) || is_float($v)) && is_finite($v) && $v >= 0) $seg[$k] = $v; }
      $segs[] = $seg;
    }
    if ($chars > ENH_MAX_CHARS) return ['code' => 413, 'msg' => 'Transkript zu lang (max. ' . ENH_MAX_CHARS . ' Zeichen).'];
  }
  if ($isPost) {
    $text = is_string($in['text'] ?? null) ? $in['text'] : ($segs !== null ? implode(' ', array_column($segs, 'text')) : null);
    if (!is_string($text)) return ['code' => 400, 'msg' => 'Ungültige Anfrage: text fehlt.'];
    if (enh_len($text) > ENH_MAX_CHARS) return ['code' => 413, 'msg' => 'Transkript zu lang (max. ' . ENH_MAX_CHARS . ' Zeichen).'];
    return ['kind' => 'post', 'lang' => $lang, 'want' => $want, 'text' => enh_clean($text)];
  }
  if ($segs === null) return ['code' => 400, 'msg' => 'Ungültige Anfrage: segments fehlt.'];
  if (!$want) foreach (ENH_WANT_SEG as $w) $want[$w] = true;
  return ['kind' => 'segments', 'lang' => $lang, 'want' => $want, 'segments' => $segs];
}
function enh_groq($key, $model, $messages, $timeout, $temperature, $check) {
  $body = ['model' => $model, 'messages' => $messages, 'temperature' => $temperature, 'response_format' => ['type' => 'json_object']];
  if (strpos($model, 'gpt-oss') !== false) $body['reasoning_effort'] = 'low';
  $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
  curl_setopt_array($ch, [
    CURLOPT_POST => true, CURLOPT_POSTFIELDS => enh_json($body),
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $key, 'Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => max(1, (int)$timeout), CURLOPT_CONNECTTIMEOUT => min(10, max(1, (int)$timeout)),
  ]);
  $res = curl_exec($ch); $status = curl_getinfo($ch, CURLINFO_HTTP_CODE); $errno = curl_errno($ch); curl_close($ch);
  if ($res === false) return ['ok' => false, 'status' => 0, 'retry' => true, 'err' => $errno === 28 ? 'timeout' : 'network'];
  if ($status < 200 || $status >= 300) return ['ok' => false, 'status' => $status, 'retry' => $status !== 401 && $status !== 403, 'err' => 'http'];
  $data = json_decode($res, true);
  $val = $check(enh_parse_llm($data['choices'][0]['message']['content'] ?? null));
  if ($val === null) return ['ok' => false, 'status' => $status, 'retry' => true, 'err' => 'unparseable'];
  return ['ok' => true, 'val' => $val];
}

// Für Tests: nur Funktionen laden, keinen Request bearbeiten.
if (defined('CAPIVO_ENHANCE_LIB')) return;

$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];
if (!is_array($cfg)) $cfg = [];
$KEY  = $cfg['GROQ_API_KEY'] ?? getenv('GROQ_API_KEY') ?: '';
$CORS = $cfg['CORS_ORIGIN']  ?? getenv('GROQ_CORS_ORIGIN') ?: '';

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

function enh_fail($code, $msg, $extra = []) {
  http_response_code($code);
  echo enh_json(['error' => $msg] + $extra);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  echo json_encode(['ok' => true, 'service' => 'capivo-enhance', 'configured' => $KEY !== '']);
  exit;
}
@set_time_limit(60);
if ($KEY === '') enh_fail(500, 'Server nicht konfiguriert: GROQ_API_KEY fehlt (config.php anlegen).');

if (!empty($cfg['REQUIRE_LOGIN'])) {
  $tok = trim($_SERVER['HTTP_X_CAPIVO_TOKEN'] ?? '');
  $sbUrl = rtrim($cfg['SUPABASE_URL'] ?? '', '/'); $sbKey = $cfg['SUPABASE_ANON_KEY'] ?? '';
  if ($sbUrl === '' || $sbKey === '') enh_fail(500, 'REQUIRE_LOGIN aktiv, aber SUPABASE_URL/SUPABASE_ANON_KEY fehlen in config.php.');
  if ($tok === '' || strlen($tok) > 4096) enh_fail(401, 'login_required');
  $cf = sys_get_temp_dir() . '/capivo_tok_' . md5($tok);
  if (!(is_file($cf) && filemtime($cf) > time() - 300)) {
    $c = curl_init($sbUrl . '/auth/v1/user');
    curl_setopt_array($c, [CURLOPT_HTTPHEADER => ['apikey: ' . $sbKey, 'Authorization: Bearer ' . $tok],
      CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_CONNECTTIMEOUT => 5]);
    $r = curl_exec($c); $sc = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
    $u = json_decode((string)$r, true);
    if ($sc !== 200 || empty($u['id'])) enh_fail(401, 'login_required');
    @file_put_contents($cf, '1');
  }
}

$LIMIT = (int)($cfg['RATE_LIMIT_PER_HOUR'] ?? 120);
if ($LIMIT > 0) {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
  $rf = sys_get_temp_dir() . '/capivo_rle_' . md5($ip) . '.json';
  $now = time(); $hits = [];
  if (is_file($rf)) { $d = json_decode((string)@file_get_contents($rf), true); if (is_array($d)) $hits = array_filter($d, function($t) use ($now) { return $t > $now - 3600; }); }
  if (count($hits) >= $LIMIT) { header('Retry-After: 300'); enh_fail(429, 'Zu viele Anfragen von dieser Adresse – bitte später erneut versuchen.'); }
  $hits[] = $now;
  @file_put_contents($rf, json_encode(array_values($hits)), LOCK_EX);
}

if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > ENH_MAX_BYTES) enh_fail(413, 'Anfrage zu gross.');
$raw = file_get_contents('php://input');
if ($raw === false || $raw === '') enh_fail(400, 'Ungültige Anfrage.');
if (strlen($raw) > ENH_MAX_BYTES) enh_fail(413, 'Anfrage zu gross.');
$in = json_decode($raw, true);
if (!is_array($in)) enh_fail(400, 'Ungültiges JSON.');
$inp = enh_parse_input($in);
if (isset($inp['code'])) enh_fail($inp['code'], $inp['msg']);

if ($inp['kind'] === 'post') {
  if ($inp['text'] === '') enh_fail(400, 'Ungültige Anfrage: text ist leer.');
  $src = $inp['text'];
  $messages = enh_messages('post', ['lang' => $inp['lang'], 'text' => $src]);
  $temperature = 0.4;
  $check = function($o) use ($src) { return enh_clean_post($o, $src); };
} else {
  $todo = [];
  foreach ($inp['segments'] as $s) if (trim($s['text']) !== '') $todo[] = ['id' => $s['id'], 'text' => enh_clean($s['text'])];
  if (!$todo) {
    $r = enh_apply_seg($inp['segments'], [], $inp['want']);
    echo enh_json(['segments' => $r['segments'], 'model' => null, 'dropped' => $r['dropped']]); exit;
  }
  $messages = enh_messages('segments', ['lang' => $inp['lang'], 'want' => array_keys($inp['want']), 'segments' => $todo]);
  $temperature = 0.2;
  $check = function($o) { return enh_parse_seg($o); };
}
$deadline = microtime(true) + ENH_BUDGET_S;
$last = null;
foreach (ENH_MODELS as $i => $model) {
  $left = $deadline - microtime(true);
  if ($i > 0 && ($left < ENH_MIN_FALLBACK_S || !$last['retry'])) break;
  $last = enh_groq($KEY, $model, $messages, $left, $temperature, $check);
  if ($last['ok']) {
    if ($inp['kind'] === 'post') { echo enh_json(['post' => $last['val'], 'model' => $model]); exit; }
    $r = enh_apply_seg($inp['segments'], $last['val'], $inp['want']);
    echo enh_json(['segments' => $r['segments'], 'model' => $model, 'dropped' => $r['dropped']]);
    exit;
  }
}
$msg = $last['err'] === 'timeout' ? 'KI-Dienst hat nicht rechtzeitig geantwortet.'
  : ($last['err'] === 'network' ? 'KI-Dienst nicht erreichbar.'
  : ($last['err'] === 'unparseable' ? 'KI-Dienst hat nicht-lesbar geantwortet.'
  : 'KI-Dienst meldet Fehler (HTTP ' . $last['status'] . ').'));
enh_fail(502, $msg, ['upstream' => $last['status'] ?: null]);
