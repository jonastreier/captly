# Start-Prompt für die nächste Session (zum Kopieren)

```
Projekt: Gluephs (vormals CaptionRush/Capivo) – Untertitel-Tool für Reels/TikTok. Repo jonastreier/captly (lokal ~/Documents/claude/captly, origin per SSH), Live-Domain https://gluephs.com (Hostpoint, Server sl52). Lies zuerst CLAUDE.md, dann docs/vergleich/creator-2026-10-15-runde4/noah-runde4.md (Creator-Test Runde 4, Kapitel «Was mich noch stört» und «Top-Empfehlungen» sind der Massstab); ältere Runden (runde3/, creator-2026-10-14/, -retest/) nur bei Bedarf. Antworten auf Deutsch (Schweizer Schreibweise, ss statt ß), knapp und kritisch. Ohne Rückfragen bis zum Ende durchführen; nur Merge nach main braucht meine Freigabe.

## Arbeitsweise (verbindlich)
- Du (Opus) planst, dirigierst und integrierst. Umsetzung pro Paket an Sonnet-Subagents (Haiku nur für mechanische Edits/Doku), jeder in eigenem git-worktree: `git worktree add -b claude/<thema> ../captly-wt/<thema> <basis>`; committet dort, pusht nicht. Integrations-Branch pro Runde, Merges dort, danach alle Pflicht-Tests.
- Brief für Subagents: Worktree-Pfad, eigener Mock-Port, CLAUDE.md lesen, captly.html nur chirurgisch (grep + Offset + gezielte Edits), neue Tests als eigener Block am Ende von test-captly.js (tail-Exporte auf eigener Zeile), Commit mit «Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>», Bericht ≤ 12 Zeilen inkl. «nicht verifiziert».
- **Editor ist zweisprachig (EN `/`, DE `/de`):** jeder neue sichtbare JS-Text als `_t('English')` bzw. `_tn(n,…)`, Übersetzung in `i18n/de-ui.js`; statisches Editor-HTML wird über dasselbe Wörterbuch übersetzt, Landing-Texte über Paare in `i18n/de.js`. `node scripts/build-i18n.js` bricht bei fehlender Übersetzung ab. `captly.de.html` nie direkt editieren (bei Merge-Konflikt `--theirs` + neu bauen).
- Pflicht-Tests: `node scripts/build-i18n.js && node --check server.js && node test-captly.js && node test-polish.js && node test-enhance.js && node test-lead.js && node test-telemetry.js && node test-billing.js && node test-ops.js` (php ist lokal da; Playwright fehlt → `test-ui-sweep.js`/`test-e2e.js` laufen nicht: benennen, nicht als grün ausgeben).
- Browser-Prüfung jeder sichtbaren Änderung mit dem Mock (Testmaterial unten); Vorschau = Export beweisen, wo Geometrie/Animation betroffen ist (Export per `URL.createObjectURL`-Hook abfangen, Frame per `<video>` + Canvas gegen DOM/Quelle; Zahl angeben). Mehrere Agents in der Browser-Pane: jeder im eigenen Tab.
- Ein Merge nach `main` löst den Deploy aus → erst nach meiner Freigabe. Push per SSH (id_ed25519_github).
- Nie: Personen-/Markennamen für Looks, Google/CDN im Browser, interne `capivo`-Schlüssel umbenennen, service_role-Key ins Frontend, Konten bei Konkurrenten anlegen oder Passwörter eingeben, Secrets in Chat/Felder.

## Stand (15.10.2026, nach Runde 5)
- `main` enthält alles bis Runde 5 (gepusht), ist aber NICHT live, bis Jonas deployt (GitHub-Deploy scheitert ohne Secrets; Jonas deployt von seinem anderen Computer). Live zeigte zuletzt noch «CaptionRush».
- Runde 5: Untertitel weichen dem Kit-Logo aus, mit EINEM Modus pro Clip (`capLogoDecision`/`capLogoMode`: seitlich mit gemeinsamem Versatz, wenn es für alle kollidierenden Blöcke reicht, sonst senkrecht; Faktor `CAP_DODGE_SIDE_K`), Vorschau = Fast-Export ±3–9 px; Hook-Export nutzt den Kit-Schnappschuss; Kit-Templates nie still Standard; ◈ im Clips-Blatt; Batch-Gate beschriftet; «Restored» nur aus früherer Sitzung; ZIP-Ordner pro Template; Bitrate-Untergrenze 0,02 bit/Pixel/Frame (v1 1,14×); Emoji-Fallback ~1 je 4,5 s; Landing 375 px; Sprach-Pille nur oben bei Platz; Neulade-Hinweis Queue (`entry.q`); Brand-Kit im UI-Sweep.
- **Playwright läuft jetzt** (ohne Repo-Änderung): `cd /tmp/pw && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i playwright`, dann `NODE_PATH=/tmp/pw/node_modules CHROMIUM="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node test-ui-sweep.js --quick` bzw. `node test-e2e.js`. Stand Runde 5: Sweep 1315 ok / 0 FAIL, e2e 251 grün (veraltete Tests in `062c567` nachgeführt, kein Produktfehler).
- Noah Runde 4 (docs/vergleich/creator-2026-10-15-runde4/noah-runde4.md): «Für Kundenarbeit: ja.» Zahlungsbereitschaft Einzelnutzung CHF 8–12, mit Batch + Kit CHF 18–20 – Bedingung: echte Transkription geprüft und Logo-gegen-Untertitel-oben gelöst.
- Live: Deploy per GitHub Actions braucht die Pflicht-Secrets FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, GROQ_API_KEY und empfohlen FTP_DIR (Jonas trägt sie selbst ein) – sonst lädt Jonas `gluephs-dist.zip` (`node scripts/build-dist.js --zip`, Inhalt inkl. .htaccess) per FTP hoch. Zuerst prüfen: `curl -s https://gluephs.com/ | grep -o '<title>[^<]*'` (neu: «Free Auto Captions for Reels & TikTok – No Watermark | Gluephs») und `curl -s 'https://api.github.com/repos/jonastreier/captly/actions/runs?per_page=5'`. Ist der neue Stand live: Live-Check zusammenfassen, an Search Console erinnern (Sitemap, Indexierung `/` und `/de`).
- Konkurrenz (Submagic, CapCut) in drei Runden nie getestet: kein Login in Chrome. Nur testen, wenn Jonas eingeloggt ist (vorher per Tab prüfen).

## Auftrag (Reihenfolge)
0. **Zuerst fragen:** Ist `claude/runde5` nach `main` gemergt und der Deploy grün (Secrets eingetragen)? Wenn nicht: Jonas um Freigabe bzw. Secrets bitten; bis dahin auf `claude/runde5` weiterarbeiten.
1. **Live-Abnahme (S, selbst):** nur wenn der neue Stand live ist (Titel prüfen), mit echter Transkription v1/v2/v3 gegen die Wahrheits-JSON zählen (Wortfehlerrate, Namen «Sandra Meier», «Winterthur», «Klartext Business», Zeitversatz, `/api/enhance`, Hook-KI). Funde als eigenes Paket.
2. **Creator-Runde 5 (Noah) gegen Runde 4**, sobald live: Schwerpunkt echte Transkription + Kit-Konflikte (Logo × Top/Bottom × Safe-Zone × Hook × Wasserzeichen, Echtzeit- und PNG-Export sowie Batch-Export mit Kit im Browser – in Runde 5 nur per Unit-Test belegt).
3. Offen/klein: 16:9 mit Standardschrift und Logo unten → alle Untertitel springen senkrecht um ~26 % der Höhe (seitlich reicht nicht für die breitesten Blöcke); evtl. Logo in Gegenecke ausweichen lassen – erst nach Noahs Urteil.

Vorschlagen, nicht ungefragt bauen: C2 Cloud-Sync (braucht Supabase), C4 Auto-Reframe mit Gesichtsfokus (lokal), Musik-Bett mit Ducking, Preismodell nach der Beta.

## Testmaterial (Skripte im Repo, Ausgabe ausserhalb)
- `python3 scripts/creator-test/gen.py /tmp/gluephs-creator` erzeugt drei Videos mit Sprache (macOS `say` + ffmpeg) samt Wahrheit `<name>.json` (`text`, `language`, Wort-Timings): v1-reel-de (9:16, 20,5 s), v2-podcast-de-16x9 (27,6 s, Namen «Sandra Meier», «Winterthur», «Klartext Business»), v3-hook-en (9:16, 19,1 s).
- `node scripts/creator-test/creator-mock.js <worktree> <port> /tmp/gluephs-creator` liefert den Worktree statisch, `/de`, `/test/<datei>` und `/api/transcribe` mit den Timings des per `GET /mock/use?v=<name>` gewählten Videos (kein `/api/enhance` → KI-Ausfall-Pfad); für Batch erkennt er das Video pro Anfrage über den Header `X-Video-Key`.
- Upload im Browser: `await fetch('/mock/use?v=<name>')`, dann Blob von `/test/<name>.mp4` → `new File` → `DataTransfer` → `#landInput.files` + `change`-Event.

## Abnahme
- Pro Paket: Tests grün (Playwright-Lücke benennen), Browser-Check EN und /de, Vorschau = Export, wo Geometrie/Animation betroffen ist; Status in noah-runde4.md (bzw. Runde 5) nachführen.
- Schluss: Zusammenfassung in 10 Zeilen; offene Punkte nur noch die, die Jonas selbst erledigen muss.
```
