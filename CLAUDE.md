# Captly — Agent-Leitfaden

Captly ist ein Untertitel-Tool für Instagram/TikTok-Reels (Klon von captions.ai). **Kein Build, keine npm-Dependencies.** Details & Deploy: siehe [README.md](README.md).

Kern-Dateien:
- `captly.html` — kompletter Editor + Landing als **Single-File** mit Inline-`<script>`.
- `transcribe.php` — **primärer** Transkriptions-Proxy für Webhosting: hält den Groq-Key (aus nicht-committeter `config.php`), ruft Groq `whisper-large-v3(-turbo)`, gibt Wort-Timings zurück. **Kein Modell-Download für den Nutzer.** Frontend (`serverTranscribe`) ruft ihn; ist er nicht da → lokaler transformers.js-Fallback.
- `server.js` — **optionales** Node-Backend (Node 22+, `node:sqlite`): Magic-Code-Login, Projekte, Quota/Stripe/Admin. Für die Transkription NICHT nötig; läuft nicht auf reinem Webhosting.

## Effizient arbeiten (Token & Modellwahl)

- **Kleines Modell wählen, wenn die Aufgabe es zulässt.** Mechanische/lokale Edits, Doku, Test-Anpassungen, Umbenennungen → **Haiku**. Querschnittslogik, subtile Korrektheit, mehrdateiige Umbauten mit Nebenwirkungen → **Sonnet/Opus**. Wechsle nur zu einem kleineren Modell, wenn die Qualität nicht darunter leidet.
- **Token sparen:** Nur die relevanten Stellen lesen (`grep`/Offset statt Ganzdatei), Dateien nicht doppelt lesen, keine ganzen Dateien ins Gespräch dumpen. Unabhängige Tool-Calls bündeln.
- `captly.html` ist groß (Single-File) → Änderungen **chirurgisch** per gezieltem `Edit`, nie die Datei neu schreiben.
- Vor Commit: `node --check server.js` und `node test-captly.js` müssen grün sein.
