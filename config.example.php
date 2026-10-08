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

  // Optional: max. Sekunden Ton pro IP und Stunde (Default 1800 = 30 Min.). 0 = aus.
  'MAX_AUDIO_SEC_PER_HOUR' => 1800,

  // Optional: Push-Meldung an dich, wenn Groq sein Limit meldet (z. B. https://ntfy.sh/<geheimes-thema>,
  // dazu die ntfy-App abonnieren). Leer = aus.
  'ALERT_URL' => '',

  // Optional: Transkription nur für eingeloggte Nutzer (Supabase-Session wird serverseitig geprüft).
  // Werte = dieselben öffentlichen wie in captly.html (SUPABASE_URL / publishable key). Standard: aus.
  'REQUIRE_LOGIN'     => false,
  'SUPABASE_URL'      => '',
  'SUPABASE_ANON_KEY' => '',

  // ── Abos (Vorbereitung, Standard: AUS). Erst einschalten, wenn schema.sql ausgeführt und Paddle eingerichtet ist (docs/paddle-sandbox.md).
  // Aus = die Seite verhält sich wie in der Beta (E-Mail-Gate statt Wasserzeichen, keine Limits, kein Plan-Abzeichen).
  'BILLING_ENABLED'        => false,
  'PLAN_MINUTES'           => ['free' => 30, 'creator' => 300, 'pro' => 1200], // Minuten pro Monat und Plan
  'ANON_SEC_PER_DAY'       => 600,         // ohne Login: Sekunden Ton pro Tag und IP (nur bei BILLING_ENABLED)
  'PADDLE_ENV'             => 'sandbox',   // sandbox | production
  'PADDLE_CLIENT_TOKEN'    => '',          // öffentlich (test_… bzw. live_…), für das Checkout-Overlay im Browser
  'PADDLE_PRICE_CREATOR'   => '',          // Preis-ID (pri_…) von «Creator», 7.99 pro Monat
  'PADDLE_PRICE_PRO'       => '',          // Preis-ID (pri_…) von «Pro», 14.99 pro Monat
  'PADDLE_API_KEY'         => '',          // GEHEIM, nur für den Link zum Kundenportal (paddle-portal.php)
  'PADDLE_WEBHOOK_SECRET'  => '',          // GEHEIM, pdl_ntfset_… des Webhook-Ziels (paddle-webhook.php)
  'PADDLE_TOLERANCE_SEC'   => 300,         // erlaubte Abweichung des Webhook-Zeitstempels; 0 = nicht prüfen
  'SUPABASE_SERVICE_KEY'   => '',          // wie bei den Leads: nur auf dem Server
];
