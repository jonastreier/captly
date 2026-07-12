<?php
/**
 * Captly – Beispiel-Konfiguration für den Transkriptions-Proxy.
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
];
