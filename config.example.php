<?php
/**
 * CaptionRush – Beispiel-Konfiguration für den Transkriptions-Proxy.
 *
 * 1. Diese Datei zu `config.php` kopieren (im selben Ordner wie transcribe.php).
 * 2. Groq-API-Key eintragen (kostenlos: https://console.groq.com → API Keys).
 * 3. config.php NICHT committen — sie ist per .gitignore ausgeschlossen.
 */
return [
  // Pflicht: dein Groq-API-Key (beginnt mit "gsk_...").
  'GROQ_API_KEY' => 'gsk_DEIN_KEY_HIER',

  // Optional: erlaubte Origin(s) für Cross-Origin-Aufrufe (z. B. die Vercel-Demo).
  // Komma-getrennt, exakte Origins inkl. https://. Leer = nur same-origin (empfohlen).
  'CORS_ORIGIN' => '',

  // Optional: max. Requests pro IP und Stunde (jedes ~100 s Audio = 1 Request). 0 = aus.
  'RATE_LIMIT_PER_HOUR' => 120,

  // Optional: Transkription nur für eingeloggte Nutzer (Supabase-Session wird serverseitig geprüft).
  // Werte = dieselben öffentlichen wie in captly.html (SUPABASE_URL / publishable key). Standard: aus.
  'REQUIRE_LOGIN'     => false,
  'SUPABASE_URL'      => '',
  'SUPABASE_ANON_KEY' => '',
];
