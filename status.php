<?php
/**
 * Gluephs – Auslastung für das Status-Banner: GET /api/status → {state: ok|busy|full, busy_sec, reset_sec, used_pct}
 *   full = beide Whisper-Modelle haben das heutige Kontingent (MAX_AUDIO_SEC_PER_DAY_PER_MODEL) praktisch aufgebraucht,
 *   busy = Groq hat in den letzten Minuten gedrosselt (429); busy_sec = ehrliche Restwartezeit,
 *   reset_sec = Sekunden bis das Tageskontingent zurückgesetzt wird (UTC-Mitternacht).
 * Nur Lesen von zwei Zählerdateien in sys_get_temp_dir (gleiche Namen wie in transcribe.php); keine Nutzerdaten.
 */
$cfg = is_file(__DIR__ . '/config.php') ? (include __DIR__ . '/config.php') : [];
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
$cap = (int)($cfg['MAX_AUDIO_SEC_PER_DAY_PER_MODEL'] ?? 27000);
$now = time();
$reset = max(60, strtotime('tomorrow 00:00 UTC') - $now);
$used = [];
foreach (['whisper-large-v3', 'whisper-large-v3-turbo'] as $m) {
  $f = sys_get_temp_dir() . '/capivo_gday_' . preg_replace('/[^a-z0-9]/', '', $m) . '_' . gmdate('Ymd') . '.txt';
  $used[$m] = is_file($f) ? (float)trim((string)@file_get_contents($f)) : 0.0;
}
$state = 'ok'; $busy = 0;
// «voll»: in keinem Modell passt noch ein typischer Clip (60 s) hinein
if ($cap > 0 && min($cap - $used['whisper-large-v3'], $cap - $used['whisper-large-v3-turbo']) < 60) $state = 'full';
$bf = sys_get_temp_dir() . '/capivo_busy.txt';
if ($state !== 'full' && is_file($bf)) { $until = (int)trim((string)@file_get_contents($bf)); if ($until > $now) { $state = 'busy'; $busy = $until - $now; } }
$pct = $cap > 0 ? (int)round(100 * ($used['whisper-large-v3'] + $used['whisper-large-v3-turbo']) / (2 * $cap)) : 0;
echo json_encode(['state' => $state, 'busy_sec' => $busy, 'reset_sec' => $reset, 'used_pct' => min(100, $pct)]);
