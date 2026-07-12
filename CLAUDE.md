# Captly — Agent-Leitfaden

Captly ist ein Untertitel-Tool für Instagram/TikTok-Reels (Klon von captions.ai). **Kein Build, keine npm-Dependencies.** Details & Deploy: siehe [README.md](README.md).

Zwei Kern-Dateien:
- `captly.html` — kompletter Editor + Landing als **Single-File** mit Inline-`<script>`.
- `server.js` — Backend (Node 22+, `node:sqlite`): Magic-Code-Login, Projekte, Quota/Stripe/Admin.

## Effizient arbeiten (Token & Modellwahl)

- **Kleines Modell wählen, wenn die Aufgabe es zulässt.** Mechanische/lokale Edits, Doku, Test-Anpassungen, Umbenennungen → **Haiku**. Querschnittslogik, subtile Korrektheit, mehrdateiige Umbauten mit Nebenwirkungen → **Sonnet/Opus**. Wechsle nur zu einem kleineren Modell, wenn die Qualität nicht darunter leidet.
- **Token sparen:** Nur die relevanten Stellen lesen (`grep`/Offset statt Ganzdatei), Dateien nicht doppelt lesen, keine ganzen Dateien ins Gespräch dumpen. Unabhängige Tool-Calls bündeln.
- `captly.html` ist groß (Single-File) → Änderungen **chirurgisch** per gezieltem `Edit`, nie die Datei neu schreiben.
- Vor Commit: `node --check server.js` und `node test-captly.js` müssen grün sein.
