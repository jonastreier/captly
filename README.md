# Capivo

Web-Tool für Instagram/TikTok-Untertitel (Auto-Captions im Stil von captions.ai).
Upload → Auto-Transkript → Karaoke-Preview in 20 Styles → Export als **MP4** (mit
eingebrannten Captions), SRT oder VTT. Rendering läuft komplett im Browser.

- **⚡ Fast** = `whisper-large-v3-turbo`, **💎 Perfect** = `whisper-large-v3` — beide **serverseitig**
  über einen schlanken PHP-Proxy ([`transcribe.php`](transcribe.php)). **Kein Modell-Download für den
  Nutzer**, läuft auf jedem Gerät (auch iPhone). Transkribiert wird über **Groq** (kostenloser Free-Tier,
  OpenAI-kompatible API).
- **Fallback:** Ist der Proxy nicht erreichbar (z. B. reine Vercel-Demo ohne PHP), transkribiert Capivo
  automatisch **lokal im Browser** (transformers.js) — dann einmaliger Modell-Download.

Dateien, kein Build:
- [`captly.html`](captly.html) — kompletter Editor + Landing (Single-File).
- [`transcribe.php`](transcribe.php) — serverseitiger Transkriptions-Proxy für Webhosting (hält den
  API-Key, ruft Groq). **Primärer Weg.**
- [`schema.sql`](schema.sql) — Datenbankschema für Login & Cloud-Projekte, einmalig im
  Supabase-SQL-Editor ausführen (s. unten).
- [`server.js`](server.js) — **altes, optionales** Node-Backend. Wird nicht mehr gebraucht:
  Transkription läuft über `transcribe.php`, Login/Projekte über Supabase. Bleibt als Referenz
  für Quota- und Stripe-Logik liegen, falls Bezahlung dazukommt.

## Transkription einrichten (Groq-Proxy)

Auf klassischem **Webhosting mit PHP** — kein Node-Server nötig:

1. Kostenlosen Groq-Key holen: <https://console.groq.com> → **API Keys** (kein Kreditkartenzwang).
2. `config.example.php` → **`config.php`** kopieren und den Key eintragen (`config.php` ist per
   `.gitignore` ausgeschlossen, kommt **nie** ins Repo/den Browser).
3. `captly.html` **und** `transcribe.php` (+ `config.php`) in dasselbe Verzeichnis auf dem Webhosting
   legen. Fertig — Fast/Perfect laufen ohne Download für den Nutzer.

Voraussetzungen: PHP mit **cURL** aktiv; für längere Videos ggf. `upload_max_filesize` / `post_max_size`
/ `max_execution_time` erhöhen (WAV ≈ 1,9 MB/Min — Reels sind unkritisch). Anbieterwechsel (Deepgram,
paid) ist im Proxy gekapselt → wenige Zeilen.

## Login & Projekte einrichten (Supabase)

Konten und „Projekt speichern/laden" laufen über **Supabase** (Postgres + eingebauter
Magic-Code-Login). Kein Build, kein npm — `supabase-js` wird per ESM-CDN geladen.

1. Auf <https://supabase.com> ein Projekt anlegen, **Region EU (Frankfurt)** wählen.
2. **SQL Editor** öffnen und [`schema.sql`](schema.sql) einfügen + ausführen (Tabelle `projects`
   inkl. Row-Level-Security).
3. **Authentication → Emails → Magic Link**: im Template `{{ .Token }}` einbauen, damit der
   6-stellige Code in der Mail steht (Capivo fragt den Code ab, nicht den Link).
4. **Project Settings → API**: `Project URL` und `anon public` key kopieren und in
   `captly.html` oben im Abschnitt „KONTO" bei `SUPABASE_URL` / `SUPABASE_ANON_KEY` eintragen.
   Beide Werte sind **öffentlich** und gehören ins Frontend — geschützt wird über RLS.
   Den `service_role`-Key **niemals** eintragen.

Ohne diese Werte bleibt Capivo voll nutzbar (Editor, Transkription, Export) — nur der
Sign-in-Button meldet dann, dass Konten auf dieser Instanz nicht eingerichtet sind.

Der Supabase-Mailversand im Free-Tier ist stark rate-limitiert (nur für Tests). Für echte
Nutzer unter *Authentication → SMTP Settings* einen eigenen Absender hinterlegen, sobald
die Domain steht.

## Schnellstart (lokal)

```bash
OPENAI_API_KEY=sk-... node server.js
# → http://localhost:8787   (Login-Codes erscheinen im Terminal-Log)
```

Ohne `OPENAI_API_KEY` startet der Server nicht. Ohne `RESEND_API_KEY` kommen Login-Codes
nur ins Log (gut zum Testen, nicht für echte Nutzer). Ohne Stripe-Keys ist der Kern voll
nutzbar, nur der Kauf-Endpoint antwortet mit 501.

## Konfiguration

Alle Variablen sind in [`.env.example`](.env.example) dokumentiert. Kopieren und ausfüllen:

```bash
cp .env.example .env       # Werte eintragen
set -a; . ./.env; set +a   # laden
node server.js
```

Wichtigste Variablen:

| Variable | Zweck | Ohne sie |
|---|---|---|
| `OPENAI_API_KEY` | Perfect-Transkription | **Server startet nicht** |
| `RESEND_API_KEY` + `MAIL_FROM` | echte Login-Mails | Codes nur im Log |
| `STRIPE_SECRET` + 3 `STRIPE_PRICE_*` | Abos & Minuten-Packs | Kein Kauf (501) |
| `APP_URL` | öffentliche URL, Stripe-Redirects, CORS-Standard | localhost |
| `CORS_ORIGINS` | erlaubte Fremd-Origins (Standard: `APP_URL`) | nur eigene Domain |
| `DB_PATH` | **persistenter** SQLite-Pfad | `./captly.db` im Arbeitsverzeichnis |
| `ADMIN_PASS` | Basic-Auth für `/admin` | `/admin` gesperrt |

## Daten & Backup (SQLite)

Der Server nutzt eine einzelne SQLite-Datei (`DB_PATH`). Für den Launch reicht das für
tausende Nutzer — eine separate Datenbank ist **nicht** nötig.

- **Persistenz:** `DB_PATH` MUSS auf dauerhaftem Speicher liegen (z. B. `/var/lib/captly/captly.db`),
  **nicht** auf ephemeren Container-Dateisystemen (Heroku/manche PaaS) — sonst sind Konten
  und Abos nach jedem Deploy weg.
- **Backup (Cron, konsistent trotz laufendem Server):**
  ```bash
  # /etc/cron.d/captly-backup — täglich 3:15 Uhr
  15 3 * * * root sqlite3 /var/lib/captly/captly.db ".backup '/var/backups/captly-$(date +\%F).db'"
  ```
- Erst auf Postgres wechseln, wenn du **mehrere** Server-Instanzen brauchst (SQLite skaliert
  nicht über Prozessgrenzen).

## Deployment (eigener Host)

Node lauscht auf `PORT`; **HTTPS** übernimmt ein Reverse-Proxy davor.

**1) Prozess dauerhaft laufen lassen** — systemd (`/etc/systemd/system/captly.service`):

```ini
[Unit]
Description=Captly
After=network.target

[Service]
WorkingDirectory=/opt/captly
EnvironmentFile=/opt/captly/.env
ExecStart=/usr/bin/node server.js
Restart=always
User=captly

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now captly
```

**2) HTTPS-Reverse-Proxy** — Caddy (automatisches Let's-Encrypt-Zertifikat), `Caddyfile`:

```
captly.deinedomain.ch {
    reverse_proxy localhost:8787
}
```

**3) Stripe-Webhook** in Stripe eintragen: `https://captly.deinedomain.ch/billing/webhook`
(Events: `checkout.session.completed`, `customer.subscription.deleted`).

**Deploy-Checkliste (aktuelle Architektur — statisches Hosting + `transcribe.php` + Supabase):**
`config.php` mit Groq-Key auf dem Webhosting · `schema.sql` im Supabase-Projekt ausgeführt ·
`SUPABASE_URL`/`SUPABASE_ANON_KEY` in `captly.html` eingetragen · Magic-Link-Template enthält
`{{ .Token }}` · eigenes SMTP in Supabase hinterlegt · echte Domain in `canonical`/`og:url`/
`og:image` statt `capivo.app` · HTTPS aktiv · einmal end-to-end testen (Upload → Fast → Perfect
→ Export → Login-Code kommt an → Projekt speichern & wieder laden).

## Tests

```bash
node test-captly.js
```

Führt das komplette `captly.html`-Script mit DOM-Stub in Node aus (Zeitformate, Karaoke-Logik,
Halluzinations-Filter, Export, Landing-Widgets, WAV-Encoder u. a.). Nicht automatisiert testbar
(braucht echten Browser + Video): Whisper-Inferenz, MediaRecorder/ffmpeg-Export, Canvas-Rendering
→ manuell in Chrome **und** Firefox prüfen (MP4-Export cross-browser).
