# CaptionRush — Agent-Leitfaden

CaptionRush (vormals Capivo; Repo/Dateinamen weiterhin `captly*`, interne Schlüssel wie `localStorage`-Keys, `X-Capivo-Token` und `capivo_templates` bleiben bewusst `capivo` — sonst gehen gespeicherte Nutzerdaten verloren) ist ein Untertitel-Tool für Instagram/TikTok-Reels. **Kein Build, keine npm-Dependencies.** Details & Deploy: siehe [README.md](README.md).

Kern-Dateien:
- `captly.html` — kompletter Editor + Landing als **Single-File** mit Inline-`<script>`.
- `captly.de.html` — **generiert** (deutsche Landing, live unter `/de`) aus `captly.html` + `i18n/de.js` via `node scripts/build-i18n.js`. Nie direkt bearbeiten. Landing-Text in `captly.html` geändert → passendes Paar in `i18n/de.js` nachziehen und neu generieren (der Test meldet fehlende/unübersetzte Texte).
- `api/transcribe.js` — optionales Vercel-Gegenstück zu `transcribe.php` (Serverless Function, Key als Env `GROQ_API_KEY`); live läuft `/api/transcribe` per `.htaccess` auf `transcribe.php`. Frontend probiert `api/transcribe` → `transcribe.php` → lokal.
- `transcribe.php` — gleicher Proxy für klassisches PHP-Webhosting: hält den Groq-Key (aus nicht-committeter `config.php`), ruft Groq `whisper-large-v3(-turbo)`, gibt Wort-Timings zurück. **Kein Modell-Download für den Nutzer.** Frontend (`serverTranscribe`) ruft ihn; ist er nicht da → lokaler transformers.js-Fallback.
- Login & Cloud-Projekte laufen über **Supabase** (Magic-Code-Login + Postgres mit RLS), buildless per ESM-CDN direkt aus `captly.html`. Schema: `schema.sql`. Credentials (`SUPABASE_URL`/`SUPABASE_ANON_KEY`) stehen bewusst öffentlich im Frontend — geschützt wird über RLS, nie den service_role-Key eintragen.
- **Live-Betrieb auf Hostpoint** (Apache/PHP): `.htaccess`, `.github/workflows/deploy.yml` (FTPS-Deploy bei Merge), `scripts/build-dist.js`/`write-config.js`, `lead.php`/`confirm.php`/`unsubscribe.php`/`mail.php`. Einrichtung (nur Jonas): [SETUP.md](SETUP.md). Vercel (`vercel.json`, `api/*.js`) ist nur noch **optional** (Vorschau-Alternative), nicht der Live-Weg.
- **Datenschutz:** Schriften (`vendor/fonts`, `scripts/fetch-fonts.js`) und supabase-js (`vendor/supabase`) liegen lokal — im Browser nie Google/CDN einbinden (Test prüft das). Neue Schrift → in `CAP_FONT_GROUPS` eintragen + `node scripts/fetch-fonts.js`.
- **Style Drops:** neue Looks gehören in [`styles.json`](styles.json) (Format: Kommentar bei `dropToStyle` in `captly.html`), nicht in `STYLES`. Anzeigenamen nie nach Personen/Marken benennen; IDs bleiben stabil.
- `server.js` — **altes** Node-Backend, nicht mehr im Einsatz (Transkription → `transcribe.php`, Login/Projekte → Supabase). Bleibt als Referenz für Quota-/Stripe-Logik.

## Effizient arbeiten (Token & Modellwahl)

- **Kleines Modell wählen, wenn die Aufgabe es zulässt.** Mechanische/lokale Edits, Doku, Test-Anpassungen, Umbenennungen → **Haiku**. Querschnittslogik, subtile Korrektheit, mehrdateiige Umbauten mit Nebenwirkungen → **Sonnet/Opus**. Wechsle nur zu einem kleineren Modell, wenn die Qualität nicht darunter leidet.
- **Token sparen:** Nur die relevanten Stellen lesen (`grep`/Offset statt Ganzdatei), Dateien nicht doppelt lesen, keine ganzen Dateien ins Gespräch dumpen. Unabhängige Tool-Calls bündeln.
- `captly.html` ist groß (Single-File) → Änderungen **chirurgisch** per gezieltem `Edit`, nie die Datei neu schreiben.
- Vor Commit: `node scripts/build-i18n.js` (bei Landing-/Head-Änderungen), dann `node --check server.js`, `node test-captly.js`, `node test-polish.js`, `node test-enhance.js` und `node test-lead.js` müssen grün sein.
