# Captly — Handoff v3 (Stand: 19.07.2026)

> Diese Datei ist der **Einstiegspunkt für jede neue Umgebung/Session** (anderes Studio, Claude-Extension, neuer Rechner). Zusammen mit [CLAUDE.md](CLAUDE.md) und [README.md](README.md) reicht sie, um ohne Vorwissen weiterzuarbeiten. Repo: `git clone https://github.com/jonastreier/captly.git`.

## 0. In 30 Sekunden startklar

```bash
git clone https://github.com/jonastreier/captly.git && cd captly
node test-captly.js        # muss "ALLE TESTGRUPPEN BESTANDEN" zeigen
node --check server.js     # muss ohne Fehler durchlaufen
```
Editor lokal ansehen: `python3 -m http.server 8788` (oder `OPENAI_API_KEY=sk-test node server.js` für volle Fidelity inkl. `/vendor`) → `http://localhost:8788`.

**Vor jedem Commit:** `node test-captly.js` + `node --check server.js` müssen grün sein (steht auch in CLAUDE.md).

## 1. Was Captly ist (aktueller Stand)

Web-Tool für Instagram/TikTok/Reels-Untertitel (Klon von captions.ai). **Kein Build, keine npm-Dependencies.** Drei Kern-Dateien, jede für einen anderen Einsatzzweck:

| Datei | Zweck | Läuft wo |
|---|---|---|
| `captly.html` | Kompletter Editor + Landing, Single-File mit Inline-`<script>` | überall (auch Vercel, statisch) |
| `transcribe.php` | **Primärer** Transkriptions-Proxy: hält den Groq-Key, ruft Groq Whisper, gibt Wort-Timings zurück | eigenes Webhosting mit PHP |
| `server.js` | **Optionales** Node-Backend: Login, Projekte, Quota, Stripe, Admin | eigener Node-Host (NICHT Vercel, NICHT reines Webhosting) |

**Architektur-Prinzip:** Vercel = **nur** die statische Demo (`captly.html` + `/vendor/ffmpeg`). Alles Serverseitige (`server.js`, `transcribe.php`, `config.php`) ist per `.vercelignore` davon ausgeschlossen.

## 2. Transkription: Fast/Perfect, serverseitig, kein Download

**Architektur-Pivot (12.07.–19.07.2026):** Früher lief Whisper im Browser des Nutzers (Modell-Download 145 MB–1 GB). Jetzt läuft die Transkription **serverseitig über Groq** (kostenloser Free-Tier, `whisper-large-v3`/`whisper-large-v3-turbo`, OpenAI-kompatible API) — **kein Download für den Creator**, funktioniert auch auf dem iPhone.

- **⚡ Fast** = `whisper-large-v3-turbo` (schnell), **💎 Perfect** = `whisper-large-v3` (Maximum). Beide serverseitig, beide gratis (Groq Free-Tier ist rate-limitiert, nicht zeitlich begrenzt).
- Frontend-Funktion `serverTranscribe()` in `captly.html` ruft `transcribe.php` auf. Läuft dort kein PHP (z. B. Vercel-Demo) → **automatischer Fallback auf lokales transformers.js-Modell** im Browser (dann mit Download).
- **Wichtiger Fallback-Trigger:** `serverTranscribe()` behandelt HTTP **403, 404 und 405** als "Proxy nicht vorhanden → lokal weitermachen" (nicht als Fehler). 403 ist speziell, weil Vercel genau das für per `.vercelignore` ausgeschlossene Dateien zurückgibt — **nicht 404**. Das war ein realer Bug, der auf der Live-Demo jede Transkription hat scheitern lassen (Fix: Commit `b02eea6`).
- Sprache: **Auto-Detect ist Standard**, manuelle Wahl (17 Sprachen) bleibt möglich.
- Lokaler Fallback bekannte Schwäche: `base`-Modell erkennt bei nicht-deutschem Audio manchmal fälschlich Deutsch (verifiziert mit echtem Test-Clip). Groq/large-v3 hat dieses Problem nicht — noch ein Grund, den Proxy zu aktivieren.

### Groq-Proxy einrichten (auf Webhosting, nicht Vercel)
1. Kostenlosen Key holen: [console.groq.com](https://console.groq.com) → API Keys.
2. `config.example.php` → `config.php` kopieren, Key eintragen. `config.php` ist per `.gitignore` ausgeschlossen — **nie committen**.
3. `captly.html` + `transcribe.php` + `config.php` ins selbe Verzeichnis auf dem Webhosting (PHP mit cURL nötig).
4. **Offener TODO:** Der Groq-Key wurde bisher noch nicht bereitgestellt/eingerichtet — das ist der wichtigste nächste Schritt, um aus der Demo ein voll funktionierendes Produkt zu machen.

## 3. Deployment-Status

- **Vercel** (`jonas-projects55/captly`, verbunden mit diesem GitHub-Repo, Auto-Deploy auf `main`): **läuft** (Stand Commit `b02eea6`, Build erfolgreich, Live-Check bestanden). URL: `https://captly.vercel.app` (Zweck: **nur Demo/Live-Test**, keine zahlenden Kunden, kein Login/Perfect-Backend dort).
- **Wichtiger, bereits gelöster Bug:** Vercel-Projekteinstellungen (Dashboard) hatten Framework-Preset **„Node.js"** statt „Other/Static" — dadurch versuchte Vercel, `server.js` als Serverless-Function auszuführen (crashte mit 500, später mit „No entrypoint found" komplett). **Fix liegt in `vercel.json`:** `"framework": null, "buildCommand": null` überschreibt die falsche Dashboard-Einstellung im Code. Falls der Build je wieder bricht: zuerst hier nachsehen, bevor man rätselt.
- **Eigenes Webhosting** (für `transcribe.php` + später `server.js`): noch nicht eingerichtet/verifiziert — der Nutzer muss Zugangsdaten/Domain bereitstellen.
- **Domain-Platzhalter:** `<head>` in `captly.html` verweist noch auf `captly.app` (canonical, og:url) — TODO: durch echte Domain ersetzen, sobald vorhanden.

## 4. UI-Sprache & SEO

Komplette UI ist **Englisch** (international, seit 16.07.2026 — vorher Deutsch). SEO/GEO im `<head>`: `lang="en"`, Title/Description/Keywords, Open Graph + Twitter Cards, JSON-LD (`SoftwareApplication` + `FAQPage`) für Google und AI-Antwort-Engines. Bei neuen UI-Texten: **immer Englisch**, kurz und klar, keine überflüssigen Wörter.

## 5. Styles, Editor-Design

- **26 Styles** (`STYLES`-Array in `captly.html`, IDs siehe Code): 20 aus dem captions.ai-Katalog (Bloom, Elevate, Ember, Ignite, Impact II, Paper II, Prime, Sketch, Sonnet, Volt, Y2K, Chalk, Evo, Focus, Lift, Linen, Prism Pro, Stack, Align, Neon) + 6 eigene Trend-Styles (Tokyo, Chrome, Editorial, Marker, Muse, Carbon).
- Style-Rendering: `buildCap()` baut DOM-HTML aus Style-Props (`font`, `tc`, `hl`, `hls`, `hlFont`, `hlItalic`, `hlUpper`, `circle`, `pill`, `boxBg`, `tg`/`hlg` für Gradient-Text, `anim` für Highlight-Animation).
- **Eigener Style** (`applyCustomStyle`) startet jetzt vom **gewählten Style/Template** (Farben/Font werden vorbelegt, `seedCustomFields()`), zusätzlich Glow-Regler (an/aus + Intensität).
- **Benannte Templates**: lokal in `localStorage` (`captly_templates`), speichern Style + Position + Höhe + Größe + Modus + Glow; erscheinen als eigene Kachel im Style-Picker.
- **Editor-Design**: lila Gradient (`#7c3aed → #6366f1`) statt Schwarz für aktive Zustände (Position/Modus/Modell-Buttons, primärer Export, Sign-in), Regler (`<input type=range>`) sind lila Verlaufs-Slider statt blauem `accent-color`.
- Landing hat eine **Template-Showcase** unter der Hero (Gradient-Phone-Mockups aus den echten Styles, `renderShowcase()`) + Footer mit Terms/Privacy.
- Entfernt: „Timing-Feinschliff"-Slider (überflüssig, Sync kommt aus Wort-Timestamps), PNG-Frame-Export (selten genutzt).

## 6. Zuverlässigkeits-Fix: Chunk-Merge (lokaler Fallback)

`transcribeChunked()`/`mergeChunkWords()` verarbeiten lange Videos in 28s-Fenstern mit 2s Overlap. **Alter Bug:** Fehlende Wort-Timestamps wurden verkettet (`prev.end + 0.35`), liefen über die Fensterlänge hinaus, und eine `lastEnd`-Dedup-Regel löschte dadurch echte Wörter des Folgefensters → **Untertitel brachen am Videoende ab**. **Fix:** Timestamps werden jetzt pro Fenster auf die Fensterlänge geclampt, Dedup ist inhaltsbasiert und nur in der Overlap-Zone aktiv. Regressionstest in `test-captly.js` (Abschnitt „driftende null-Timestamps").

## 6b. Video-Export-Internas (ffmpeg.wasm) — nicht offensichtliche Fallen

Chrome/Edge liefern via `MediaRecorder` direkt `video/mp4` (H.264/AAC) — kein ffmpeg nötig. Firefox/ältere Safari liefern nur WebM/VP9 → wird via ffmpeg.wasm zu MP4 transcodiert (`webmToMp4`, `getFFmpeg()`).

- **Self-hosted** unter `vendor/ffmpeg/{ffmpeg,core}/` (via `scripts/fetch-ffmpeg.sh`, ~31 MB, committed). `getFFmpeg()` versucht zuerst same-origin `/vendor/...` (same-origin-Worker, kein Blob nötig), Fallback auf CDN (unpkg) nur wenn same-origin scheitert (z. B. `file://`).
- **Worker MUSS same-origin oder Blob sein** (Cross-Origin-Worker ist verboten). Beim CDN-Fallback: npm-Worker hat relative Imports → auf absolute unpkg-URLs umschreiben, dann als Blob laden.
- **Core = ESM-Build** (`@ffmpeg/core@0.12.6/dist/esm`), **nicht UMD** — UMD bricht im Module-Worker (`importScripts` fehlt).
- **Bewusst Single-Thread-Core** → kein `SharedArrayBuffer`, also keine COOP/COEP-Header nötig (die würden mit dem Whisper-Modell-Laden von esm.sh kollidieren).
- **Falle:** `esm.sh/@ffmpeg/ffmpeg/.../worker.js` gibt 404 → Ladevorgang hängt endlos. Diesen Pfad nicht verwenden.

## 6c. Falls `server.js`/Monetarisierung reaktiviert wird — Go-Live-Blocker

Reihenfolge, falls die Phase-1-Roadmap aus [captly-produktplan.md](captly-produktplan.md) umgesetzt wird:
1. **ENV setzen** (siehe `.env.example`): `OPENAI_API_KEY` (sonst startet der Server gar nicht — auch wenn Perfect inzwischen primär über Groq läuft, braucht `server.js` selbst weiterhin diesen Key zum Booten), `RESEND_API_KEY`+`MAIL_FROM` (sonst Login-Codes nur im Server-Log, kein echtes Login), `STRIPE_SECRET`+3 Price-IDs (sonst `/billing` → 501).
2. HTTPS-Reverse-Proxy + Prozessmanager vor `server.js`.
3. CORS von `*` auf die eigene Domain einschränken (`server.js`, `CORS_ORIGINS`).
4. SQLite-Datei (`DB_PATH`) auf **persistentem** Speicher, nicht `/tmp` — sonst sind Konten/Abos nach jedem Neustart weg.

## 7. Nicht-lokal-testbare Dinge (echten Browser/Video nötig)

Whisper-Inferenz-Qualität, MediaRecorder-Video-Export (Ton-Sync), ffmpeg.wasm-Transcode (Firefox/Safari-Pfad), Groq-Proxy mit echtem Key. `test-captly.js` deckt alles ab, was ohne Browser/Netzwerk testbar ist (20 Testgruppen, DOM-Stub-Harness).

## 8. Bekannte offene Punkte (Priorität für die nächste Session)

1. **Groq-Key besorgen & `config.php` auf dem Webhosting einrichten** — größter Hebel, macht Perfect-Qualität live.
2. **Echte Domain** statt `captly.app`-Platzhalter im `<head>` eintragen.
3. **Eigenes Webhosting für `transcribe.php`** einrichten und end-to-end mit echtem Video testen (bisher nur mit synthetischem Test-Audio + isolierten Unit-Checks verifiziert, kein echter Groq-Call möglich ohne Key).
4. Optional/später: `server.js`-Monetarisierung (Login/Stripe/Quota) — Architektur & Preismodell stehen in [captly-produktplan.md](captly-produktplan.md), ist aber **bewusst noch nicht das Ziel** (aktuell nur Demo).

## 9. Für Claude/Agenten: Arbeitsweise (siehe auch CLAUDE.md)

- `captly.html` ist eine große Single-File-Datei → Änderungen **chirurgisch per `Edit`**, nie neu schreiben.
- Kleines Modell (Haiku) für mechanische Edits/Doku/Tests, Sonnet/Opus für Logik mit Nebenwirkungen.
- Vor jedem Commit: `node test-captly.js` + `node --check server.js` grün.
- Bei Vercel-Problemen: zuerst `vercel.json` (`framework`/`buildCommand`) und `.vercelignore` prüfen, siehe Abschnitt 3.
- Debugging von Live-Deploys ohne Vercel-Login: `curl -s "https://api.github.com/repos/jonastreier/captly/commits/<sha>/status"` zeigt Build-Erfolg/-Fehler inkl. Deployment-ID (GitHub-Vercel-Integration postet Commit-Status öffentlich, kein Auth nötig für dieses öffentliche Repo).
