# Capivo — Agent-Leitfaden

Capivo (Repo/Dateinamen weiterhin `captly*` — siehe unten) ist ein Untertitel-Tool für Instagram/TikTok-Reels (Klon von captions.ai). **Kein Build, keine npm-Dependencies.** Details & Deploy: siehe [README.md](README.md).

Kern-Dateien:
- `captly.html` — kompletter Editor + Landing als **Single-File** mit Inline-`<script>`.
- `transcribe.php` — **primärer** Transkriptions-Proxy für Webhosting: hält den Groq-Key (aus nicht-committeter `config.php`), ruft Groq `whisper-large-v3(-turbo)`, gibt Wort-Timings zurück. **Kein Modell-Download für den Nutzer.** Frontend (`serverTranscribe`) ruft ihn; ist er nicht da → lokaler transformers.js-Fallback.
- Login & Cloud-Projekte laufen über **Supabase** (Magic-Code-Login + Postgres mit RLS), buildless per ESM-CDN direkt aus `captly.html`. Schema: `schema.sql`. Credentials (`SUPABASE_URL`/`SUPABASE_ANON_KEY`) stehen bewusst öffentlich im Frontend — geschützt wird über RLS, nie den service_role-Key eintragen.
- `server.js` — **altes** Node-Backend, nicht mehr im Einsatz (Transkription → `transcribe.php`, Login/Projekte → Supabase). Bleibt als Referenz für Quota-/Stripe-Logik.

## Effizient arbeiten (Token & Modellwahl)

- **Kleines Modell wählen, wenn die Aufgabe es zulässt.** Mechanische/lokale Edits, Doku, Test-Anpassungen, Umbenennungen → **Haiku**. Querschnittslogik, subtile Korrektheit, mehrdateiige Umbauten mit Nebenwirkungen → **Sonnet/Opus**. Wechsle nur zu einem kleineren Modell, wenn die Qualität nicht darunter leidet.
- **Token sparen:** Nur die relevanten Stellen lesen (`grep`/Offset statt Ganzdatei), Dateien nicht doppelt lesen, keine ganzen Dateien ins Gespräch dumpen. Unabhängige Tool-Calls bündeln.
- `captly.html` ist groß (Single-File) → Änderungen **chirurgisch** per gezieltem `Edit`, nie die Datei neu schreiben.
- Vor Commit: `node --check server.js` und `node test-captly.js` müssen grün sein.
