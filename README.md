# CaptionRush

Web-Tool für Instagram/TikTok-Untertitel (Auto-Captions im Stil von captions.ai).
Upload → Auto-Transkript → Karaoke-Preview in 24 kuratierten Styles → Export als **MP4** (mit
eingebrannten Captions), SRT oder VTT. Rendering läuft komplett im Browser.

- **Ein Modus, immer beste Qualität:** `whisper-large-v3` + KI-Feinschliff (Polish, läuft nach dem Anzeigen im
  Hintergrund); scheitert large-v3 (Limit/Timeout/5xx), automatisch einmal `whisper-large-v3-turbo`. **Serverseitig**
  über einen schlanken PHP-Proxy ([`transcribe.php`](transcribe.php)). **Kein Modell-Download für den
  Nutzer**, läuft auf jedem Gerät (auch iPhone). Transkribiert wird über **Groq** (kostenloser Free-Tier,
  OpenAI-kompatible API).
- **Fallback:** Ist der Proxy nicht erreichbar (z. B. reine Vercel-Demo ohne PHP), transkribiert CaptionRush
  automatisch **lokal im Browser** (transformers.js) — dann einmaliger Modell-Download.
- **Video-Export:** MP4/MOV-Quellen laufen über einen **WebCodecs-Schnellexport** (Demux mit mp4box,
  H.264-Encode, Mux mit mp4-muxer, Original-AAC wird kopiert) — schneller als Echtzeit. Bei jedem Problem
  (Browser ohne WebCodecs/H.264-Encoder, WebM-Quelle, exotische Datei) fällt CaptionRush automatisch auf den
  Echtzeit-Export (MediaRecorder, ggf. ffmpeg.wasm) zurück. Libs self-hosted unter `vendor/mp4box` +
  `vendor/mp4-muxer` (Versionen: [`scripts/fetch-webcodecs-libs.sh`](scripts/fetch-webcodecs-libs.sh)).
  Notschalter: `localStorage['capivo.fastExport'] = 'off'`.
- **Caption-Typografie:** Silbentrennung nach Liang/TeX (hyph-utf8-Muster für de/en/fr/it/es, lazy pro
  Transkriptsprache aus `vendor/hyphen/`, Quelle + Lizenzen: [`scripts/fetch-hyphen-patterns.sh`](scripts/fetch-hyphen-patterns.sh)),
  nur als letzter Ausweg für ein einzelnes zu breites Wort, bevorzugt an Kompositumsfugen. Zeilen- und
  Caption-Umbruch nach Untertitel-Regeln (Balance/Pyramide, nie nach Artikel/Präposition, Zahl + Einheit
  zusammen, keine Einzelwort-Waisen) — `capSmartLines` / `capSegmentRun`, gleicher Code für Vorschau und Export.
- **Szenenschnitte** (Captions brechen an harten Schnitten): MP4/MOV werden im Hintergrund per WebCodecs
  Frame für Frame dekodiert (gleiche mp4box-Lib) → framegenau, 34-s-Reel in ~6 s; Blitze und Überblendungen
  werden verworfen. Sonst (WebM, kein VideoDecoder) Wiedergabe-Scan + Seeks. Der Video-Export wartet bis
  20 s auf eine laufende Erkennung. Notschalter: `localStorage['capivo.fastCuts'] = 'off'`.

Dateien, kein Build:
- [`captly.html`](captly.html) — kompletter Editor + Landing (Single-File).
- [`captly.de.html`](captly.de.html) — deutsche Landing unter `/de`, **generiert** aus `captly.html` + [`i18n/de.js`](i18n/de.js)
  mit `node scripts/build-i18n.js` (`--check` prüft nur). Übersetzt sind `<head>` (Titel, Description, OG, JSON-LD) und
  die Landing; der Editor bleibt englisch. Beide Seiten verlinken sich per `hreflang` + Sprachumschalter (Nav/Footer);
  kein Auto-Redirect, nur ein wegklickbarer Hinweis für deutschsprachige Browser auf der EN-Seite.
  Die FAQ-Strukturdaten (JSON-LD) entstehen aus der sichtbaren FAQ: der Build schreibt sie auch in `captly.html` zurück
  (EN), der erste JSON-LD-Block ist ein `@graph` (Organization, WebSite, SoftwareApplication; DE ersetzt nur den App-Knoten).
  [`llms.txt`](llms.txt) fasst die Fakten für KI-Suchmaschinen zusammen (bei Feature-/Preisänderungen mitpflegen).
  `sitemap.xml`/`robots.txt` listen beide Versionen. **Domainwechsel** (z. B. `captionrush.com`): Basis-URL in
  `captly.html` (canonical, hreflang, og:url/og:image), `i18n/de.js` (canonical, og:url, og:image) und `sitemap.xml`/`robots.txt` ersetzen.
- [`transcribe.php`](transcribe.php) — serverseitiger Transkriptions-Proxy für Webhosting (hält den
  API-Key, ruft Groq). **Primärer Weg.**
- [`schema.sql`](schema.sql) — Datenbankschema für Login & Cloud-Projekte, einmalig im
  Supabase-SQL-Editor ausführen (s. unten).
- [`server.js`](server.js) — **altes, optionales** Node-Backend. Wird nicht mehr gebraucht:
  Transkription läuft über `transcribe.php`, Login/Projekte über Supabase. Bleibt als Referenz
  für Quota- und Stripe-Logik liegen, falls Bezahlung dazukommt.

## Live-Betrieb auf Hostpoint (Ziel-Setup)

Die Seite läuft als statische Dateien + die PHP-Dateien (`transcribe.php`, `polish.php`, `enhance.php`, `lead.php`, `confirm.php`) auf
Hostpoint (Apache/PHP). **Schritt-für-Schritt-Einrichtung: [`SETUP.md`](SETUP.md).** Deployment: GitHub-Action [`deploy.yml`](.github/workflows/deploy.yml)
(FTPS, bei jedem Merge nach `main`; `scripts/build-dist.js` baut das Paket, `scripts/write-config.js` schreibt `config.php` aus GitHub-Secrets).
[`.htaccess`](.htaccess) bildet `vercel.json` nach (`/`, `/de`, `/api/*` → PHP, Header, Caching).
Schriften (`vendor/fonts`, `scripts/fetch-fonts.js`) und supabase-js (`vendor/supabase`, `scripts/fetch-supabase.sh`) liegen lokal —
der Browser ruft beim normalen Besuch **keinen** Fremdserver auf (Datenschutz). Missbrauchsschutz: Audiodauer wird serverseitig aus dem
Header gelesen (≤ 130 s pro Anfrage, 30 Min./Stunde und IP), bei Groq-Limit Push über `ALERT_URL` (ntfy).
Leads/Newsletter: `lead.php` schreibt mit dem service_role-Key serverseitig, Double-Opt-in über `confirm.php`, Mail per SMTP (`mail.php`).
Vercel bleibt als Alternative nutzbar (`api/*.js`, `vercel.json`), ist aber nicht mehr der Haupt-Weg.

## Transkription einrichten auf Vercel (empfohlen, aktueller Live-Weg)

Vercel führt kein PHP aus, deshalb gibt es den Proxy zusätzlich als **Serverless Function**
[`api/transcribe.js`](api/transcribe.js) (gleiche Schnittstelle, kein npm nötig). Das Frontend probiert
zuerst `/api/transcribe`, dann `transcribe.php`, erst danach den lokalen Fallback.

1. Groq-Key holen: <https://console.groq.com> → **API Keys**.
2. Vercel → Projekt → **Settings → Environment Variables**: `GROQ_API_KEY = gsk_…` (Production + Preview).
   Optional: `RATE_LIMIT_PER_HOUR` (Default 120/IP, best effort pro Instanz), `REQUIRE_LOGIN=1` +
   `SUPABASE_URL` + `SUPABASE_ANON_KEY` (nur Eingeloggte).
3. **Redeploy** (Env-Variablen greifen erst im nächsten Deployment). Check: `GET /api/transcribe` →
   `{"configured":true}`.

Vercel kappt Request-Bodies bei 4,5 MB; das Frontend schickt ~100-s-Stücke (≤ ~3,2 MB), passt also.
Wo der Browser es kann (WebCodecs `AudioEncoder`), gehen die Stücke als **Ogg/Opus 32 kbit/s** raus
(`Content-Type: audio/ogg`, ~0,4 MB statt 3,2 MB → auf dem Handy ~3–4× schneller); sonst WAV. Stück 1 läuft
allein (Sprache erkennen), der Rest mit 3 parallelen Requests.
Fehlt der Key, fällt die App automatisch auf die lokale Erkennung zurück (langsam, Modell-Download).

## Transkription einrichten (Groq-Proxy, klassisches PHP-Webhosting)

Auf klassischem **Webhosting mit PHP** — kein Node-Server nötig:

1. Kostenlosen Groq-Key holen: <https://console.groq.com> → **API Keys** (kein Kreditkartenzwang).
2. `config.example.php` → **`config.php`** kopieren und den Key eintragen (`config.php` ist per
   `.gitignore` ausgeschlossen, kommt **nie** ins Repo/den Browser).
3. `captly.html` **und** `transcribe.php` (+ `config.php`) in dasselbe Verzeichnis auf dem Webhosting
   legen. Fertig — die Transkription läuft ohne Download für den Nutzer.

Voraussetzungen: PHP mit **cURL** aktiv. Das Frontend zerlegt die Tonspur an Sprechpausen in ~100-s-Stücke
(≤ ~3,2 MB je Request als WAV bzw. ~0,4 MB als Ogg/Opus, jeweils mit Retry bei Netz-/429-/5xx-Fehlern), dadurch sind `post_max_size` &
Timeouts auch auf billigem Hosting unkritisch; Stille-Stücke werden gar nicht gesendet (verhindert
Whisper-Halluzinationen). Max. 20 Min Audio pro Video. Der Proxy hat ein IP-Limit
(`RATE_LIMIT_PER_HOUR`, Default 120/h), damit niemand deinen Key leerzieht. Optional: `REQUIRE_LOGIN => true` (+ `SUPABASE_URL`/`SUPABASE_ANON_KEY`) erlaubt Transkription nur
Eingeloggten; das Session-Token wird serverseitig bei Supabase geprüft. Anbieterwechsel (Deepgram,
paid) ist im Proxy gekapselt → wenige Zeilen.

## Transkript-Feinschliff („Polish“)

Nach Whisper large-v3 kann das Frontend das Transkript an **`/api/polish`** (Vercel,
[`api/polish.js`](api/polish.js)) bzw. **`polish.php`** (PHP-Hosting) schicken. Ein LLM auf Groq
(`openai/gpt-oss-120b`, Fallback `openai/gpt-oss-20b`, gleicher `GROQ_API_KEY`) korrigiert **nur**
offensichtliche Erkennungsfehler: verhörte Wörter (v. a. Namen/Marken/Orte aus „Names & terms“),
Rechtschreibung, Gross-/Kleinschreibung, Satzzeichen, Satzgrenzen — kein Umformulieren, Übersetzen,
Kürzen; Füllwörter/Dialekt bleiben, „ss“ wird nie zu „ß“.

- Request: `POST {"lang":"de","vocab":"Birkenhof, Highland Beef","segments":[{"id":0,"text":"…"}]}`
  (max. 12 000 Zeichen Text / 1000 Segmente, sonst 413).
- Antwort: `{"segments":[{"id":0,"text":"…"}],"model":"…","changed":n,"rejected":n}` — gleiche ids/Reihenfolge.
- Jede Korrektur wird serverseitig geprüft (Wortzahl ±max(2, 15 %), Wort-Editierdistanz ≤ max(1, 35 %),
  kein neues „ß“, nicht leer); sonst bleibt das Original-Segment. Groq komplett fehlgeschlagen → 502,
  das Frontend behält dann das unpolierte Transkript.
- Setup: nichts zusätzlich — dieselben Env-Variablen bzw. dieselbe `config.php` wie die Transkription
  (`RATE_LIMIT_PER_HOUR` zählt separat, `REQUIRE_LOGIN` gilt auch hier). Vercel: `maxDuration` 30 s
  in `vercel.json`; Groq-Budget ~25 s. Check: `GET /api/polish` → `{"configured":true}`.
- Tests: `node test-polish.js` (gemockter Groq; prüft bei vorhandenem `php` auch die PHP-Parität).

## KI-Hervorhebung („Enhance“: Keywords, Emojis, Auto-Zoom, Post-Text)

Nach der Transkription schickt das Frontend die Captions im Hintergrund an **`/api/enhance`** (Vercel,
[`api/enhance.js`](api/enhance.js)) bzw. **`enhance.php`** (PHP-Hosting). Ein LLM auf Groq (gleiche Modelle
wie Polish, gleicher `GROQ_API_KEY`) **wählt nur aus** — es schreibt nie Text um (Dialekt bleibt unangetastet):

- `keywords`: 0–2 bedeutungstragende Wörter je Caption (Wort-Indizes; nie Artikel/Füllwörter) → Hervorhebung
  in der Akzentfarbe des Styles + ~1,12× Grösse.
- `emojis`: ein Emoji aus einer festen Liste (~180, keine Flaggen/Hauttöne/ZWJ) auf höchstens 30 % der Captions,
  nie zwei hintereinander.
- `zoom`: sparsame „Punch-in“-Momente, mindestens 4 s Abstand (wenn `start` mitgeschickt wird).
- `post` (auf Knopfdruck im Export-Blatt): kurzer Post-Text in der Sprache des Videos + 3–6 Hashtags, ohne
  erfundene Fakten.

- Request: `POST {"lang":"de","want":["keywords","emojis","zoom"],"segments":[{"id":0,"text":"…","start":1.2}]}`
  bzw. `{"lang":"de","want":["post"],"text":"…"}` (max. 12 000 Zeichen / 1000 Segmente, sonst 413).
- Antwort: `{"segments":[{"id":0,"kw":[2],"emoji":"🐄","zoom":false}],"model":"…","dropped":n}` bzw.
  `{"post":{"caption":"…","hashtags":["#…"]},"model":"…"}`. Alles wird serverseitig geprüft (ids, Indizes,
  Emoji-Liste, Quoten); unpassende Vorschläge werden verworfen (`dropped`).
- Fehler/fehlender Endpoint → das Frontend nutzt still eine lokale Heuristik (nur Keywords, keine Emojis);
  Auto-Zoom nimmt dann hervorgehobene Zahlen/Wörter. Transkripttext wird nie geloggt.
- Setup: nichts zusätzlich (gleiche Env-Variablen bzw. `config.php`; `RATE_LIMIT_PER_HOUR` zählt separat).
  `maxDuration` 30 s in `vercel.json`. Check: `GET /api/enhance` → `{"configured":true}`.
- Tests: `node test-enhance.js` (gemockter Groq; prüft bei vorhandenem `php` auch die PHP-Parität).
- **Editor:** Style-Tab → „Emphasis“: *Highlight keywords* (Default an), *Emojis* (Default aus), *Auto zoom*
  Off/Subtle (1,10×)/Punchy (1,18×) (Default aus). Captions-Tab: unter der gewählten Zeile Wörter antippen
  (hervorheben an/aus) und ein Emoji wählen/entfernen. Gespeichert pro Wort (`kw`/`emo`/`zm`) — übersteht
  Text-Edits, Split/Merge, Neu-Gruppieren, Undo, Autosave und Projekte; Templates/Brand-Default merken die
  drei Schalter. Vorschau und Export (WebCodecs + MediaRecorder, inkl. 9:16-Blur) rendern identisch; der Zoom
  wirkt nur aufs Video, nie auf die Captions, und nie über einen Szenenschnitt. Export-Blatt: „Caption &
  hashtags for your post“ (Copy/Regenerate). Notschalter: `localStorage['capivo.ai'] = 'off'`.

## Zuverlässigkeit & Komfort (Editor)

- **Timeline auf Handy/Touch** (≤ 760 px oder grober Zeiger): Abspielkopf fest in der Mitte, Wischen scrubbt
  (mit Schwung), Abspielen scrollt mit, Pinch-Zoom 30–200 px/s (Start 70). Antippen wählt einen Block (Bewegung
  < 10 px = Tippen, sonst Wischen → nie versehentliche Edits); Kanten nur am gewählten Block (≥ 44-px-Griffe),
  Long-Press verschiebt. Aktionsleiste darunter: Start/End ±0,1 s (gedrückt halten = wiederholen, an Nachbarn/
  Schnitten geklemmt, Grund als Toast), Split am Abspielkopf, Edit text, Delete, Snap, Close gaps. Auf dem Handy
  (≤ 640 px) ist „Timeline“ der dritte Tab unten. Pure Helfer (`tlCenterView`, `tlClassify`, `tlFlingVelocity`,
  `tlSplitIndex`, `tlNudgeEdge`) sind in `test-captly.js` abgedeckt; der Desktop-Weg bleibt unverändert.

- **Names & terms:** optionales Feld unter „Video & language“; wird als Whisper-`prompt` mitgeschickt
  (nur Transkription, max. 300 Zeichen), damit Namen/Marken/Orte richtig geschrieben werden.
  Gespeichert pro Gerät (localStorage). Änderungen greifen erst nach „Re-transcribe to apply".
- **Lokale Zwischenspeicherung:** Untertitel + Edits + Stil werden pro Video (Name|Grösse|Dauer)
  automatisch im Browser gesichert (max. 5 Videos). Gleiches Video erneut laden → Zustand wird
  ohne neue Transkription wiederhergestellt („Restored your last session").
- **Schutz vor Datenverlust:** Neu-Transkription (Sprache, Übersetzen) fragt nach,
  wenn Untertitel bearbeitet wurden; Wort-Timings bleiben beim Korrigieren erhalten.

### Bekannte Grenzen (Export)

- **4K-Quellen:** Der Schnellexport (WebCodecs) muss jedes 4K-Bild in voller Auflösung dekodieren —
  WebCodecs kann beim Dekodieren nicht verkleinern. Gezeichnet und kodiert wird direkt in der
  Zielgröße (Standard 1080p, kein Vollauflösungs-Zwischenschritt), die Dauer wird aber vom 4K-Dekodieren
  bestimmt (≈ 1,5× Videolänge auf einem Mittelklasse-Laptop).
- **HEVC („High Efficiency“ vom iPhone):** nur in Browsern mit HEVC-Decoder (Safari, Chrome auf
  Mac/iPhone/neueren Windows-Geräten). Sonst: Hinweis im Editor, Untertitel/SRT/TXT funktionieren,
  Video-Export ist deaktiviert.

## Login & Projekte einrichten (Supabase)

Konten und „Projekt speichern/laden" laufen über **Supabase** (Postgres + eingebauter
Magic-Code-Login). Kein Build, kein npm — `supabase-js` wird per ESM-CDN geladen.

1. Auf <https://supabase.com> ein Projekt anlegen, **Region EU (Frankfurt)** wählen.
2. **SQL Editor** öffnen und [`schema.sql`](schema.sql) einfügen + ausführen (Tabelle `projects`
   inkl. Row-Level-Security).
3. **Project Settings → API Keys**: `Project URL` und den **publishable key**
   (`sb_publishable_…`, früher „anon public") kopieren und in `captly.html` oben im Abschnitt
   „KONTO" bei `SUPABASE_URL` / `SUPABASE_ANON_KEY` eintragen. Beide Werte sind **öffentlich**
   und gehören ins Frontend — geschützt wird über RLS. Einen **secret**- bzw. `service_role`-Key
   dort **niemals** eintragen.
4. **Authentication → Sign In / Providers**: Provider *Email* aktiviert, „Allow new users to
   sign up" an.

Ohne diese Werte bleibt CaptionRush voll nutzbar (Editor, Transkription, Export) — nur der
Sign-in-Button meldet dann, dass Konten auf dieser Instanz nicht eingerichtet sind.

### Mailversand: eigenes SMTP ist Pflicht, nicht optional

CaptionRush fragt einen **6-stelligen Code** ab, nicht den Magic-Link. Der Code steht nur dann in der
Mail, wenn das Template die Variable `{{ .Token }}` enthält — und **Templates lassen sich in
Supabase erst bearbeiten, wenn eigenes SMTP hinterlegt ist** („Set up custom SMTP to edit
templates"). Der eingebaute Free-Tier-Mailer verschickt ausschließlich das Standard-Template mit
`{{ .ConfirmationURL }}` und ist zusätzlich auf wenige Mails/Stunde begrenzt. **Ohne SMTP
funktioniert der Login also nicht** — auch nicht zum Testen.

1. *Authentication → Emails → SMTP Settings* → **Enable Custom SMTP**, Zugangsdaten des
   Mailanbieters eintragen (Host, Port 587, Login, SMTP-Key als Passwort, Absenderadresse).
   Der Anbieter muss die Absenderadresse verifiziert haben.
2. Danach unter *Authentication → Emails → Templates* **beide** relevanten Templates anpassen —
   sie müssen `{{ .Token }}` enthalten:
   - **„Magic Link"** → Login bestehender Nutzer.
   - **„Confirm signup"** → erster Login eines neuen Nutzers, solange *Confirm email* aktiv ist.
     Wird das übersehen, können sich Bestandsnutzer einloggen, neue Nutzer aber nicht registrieren.
3. *Authentication → Rate Limits*: nach SMTP-Einrichtung stehen Auth-Mails auf ~30/Stunde —
   bei Bedarf anheben.

### Beta: E-Mail statt Login für den Download

Solange der Mailversand (SMTP) nicht eingerichtet ist, braucht der Download **keinen Login**: Beim
ersten Export fragt das Export-Blatt nach der E-Mail-Adresse (plus optionales, nicht vorausgewähltes
Newsletter-Häkchen) und exportiert dann **ohne Wasserzeichen**. Die Adresse wird pro Gerät gemerkt
und per REST in die Tabelle `public.leads` geschrieben (Tabelle + Policy: `schema.sql`, Abschnitt
„Leads“ — einmal im SQL Editor ausführen). Die Tabelle ist per API nur beschreibbar, nicht lesbar;
die Liste exportiert man im Dashboard (*Table Editor → leads → Export → CSV*), z. B. für Brevo.
Newsletter nur an Zeilen mit `newsletter = true` schicken. Ist Supabase nicht erreichbar, blockiert
das den Export nicht — der Eintrag wird beim nächsten Öffnen des Export-Blatts erneut gesendet.

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
`SUPABASE_URL`/`SUPABASE_ANON_KEY` in `captly.html` eingetragen · eigenes SMTP in Supabase
hinterlegt · Templates „Magic Link" **und** „Confirm signup" enthalten `{{ .Token }}` ·
`canonical`/`og:url`/`og:image` zeigen auf die Live-Domain
(aktuell `https://captionrush.com` — **nicht** `capivo.app`, das ist eine fremde Seite) · HTTPS aktiv · einmal end-to-end testen (Upload → Transkription + Polish
→ Export → Login-Code kommt an → Projekt speichern & wieder laden).

## Tests

```bash
node test-captly.js     # Editor-Logik (DOM-Stub)
node test-polish.js     # /api/polish + polish.php
node test-enhance.js    # /api/enhance + enhance.php
```

Führt das komplette `captly.html`-Script mit DOM-Stub in Node aus (Zeitformate, Karaoke-Logik,
Halluzinations-Filter, Export, Landing-Widgets, WAV-Encoder u. a.). Nicht automatisiert testbar
(braucht echten Browser + Video): Whisper-Inferenz, WebCodecs-/MediaRecorder-/ffmpeg-Export, Canvas-Rendering
→ manuell in Chrome **und** Firefox prüfen (MP4-Export cross-browser).
