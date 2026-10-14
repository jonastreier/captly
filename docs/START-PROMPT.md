# Start-Prompt für die nächste Session (zum Kopieren)

```
Projekt: Gluephs (vormals CaptionRush/Capivo) – Untertitel-Tool für Reels/TikTok. Repo jonastreier/captly (lokal ~/Documents/claude/captly, origin per SSH), Live-Domain https://gluephs.com (Hostpoint, Server sl52). Lies zuerst CLAUDE.md, dann docs/vergleich/creator-2026-10-14-runde3/noah-runde3.md (Creator-Test Runde 3, Kapitel 6 und 8 sind der Massstab); ältere Runden (creator-2026-10-14/, -retest/) nur bei Bedarf. Antworten auf Deutsch (Schweizer Schreibweise, ss statt ß), knapp und kritisch. Ohne Rückfragen bis zum Ende durchführen; nur Merge nach main braucht meine Freigabe.

## Arbeitsweise (verbindlich)
- Du (Opus) planst, dirigierst und integrierst. Umsetzung pro Paket an Sonnet-Subagents (Haiku nur für mechanische Edits/Doku), jeder in eigenem git-worktree: `git worktree add -b claude/<thema> ../captly-wt/<thema> <basis>`; committet dort, pusht nicht. Integrations-Branch pro Runde, Merges dort, danach alle Pflicht-Tests.
- Brief für Subagents: Worktree-Pfad, eigener Mock-Port, CLAUDE.md lesen, captly.html nur chirurgisch (grep + Offset + gezielte Edits), neue Tests als eigener Block am Ende von test-captly.js (tail-Exporte auf eigener Zeile), Commit mit «Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>», Bericht ≤ 12 Zeilen inkl. «nicht verifiziert».
- **Editor ist zweisprachig (EN `/`, DE `/de`):** jeder neue sichtbare JS-Text als `_t('English')` bzw. `_tn(n,…)`, Übersetzung in `i18n/de-ui.js`; statisches Editor-HTML wird über dasselbe Wörterbuch übersetzt, Landing-Texte über Paare in `i18n/de.js`. `node scripts/build-i18n.js` bricht bei fehlender Übersetzung ab. `captly.de.html` nie direkt editieren (bei Merge-Konflikt `--theirs` + neu bauen).
- Pflicht-Tests: `node scripts/build-i18n.js && node --check server.js && node test-captly.js && node test-polish.js && node test-enhance.js && node test-lead.js && node test-telemetry.js && node test-billing.js && node test-ops.js` (php ist lokal da; Playwright fehlt → `test-ui-sweep.js`/`test-e2e.js` laufen nicht: benennen, nicht als grün ausgeben).
- Browser-Prüfung jeder sichtbaren Änderung mit dem Mock (Testmaterial unten); Vorschau = Export beweisen, wo Geometrie/Animation betroffen ist (Export per `URL.createObjectURL`-Hook abfangen, Frame per `<video>` + Canvas gegen DOM/Quelle; Zahl angeben). Mehrere Agents in der Browser-Pane: jeder im eigenen Tab.
- Ein Merge nach `main` löst den Deploy aus → erst nach meiner Freigabe. Push per SSH (id_ed25519_github).
- Nie: Personen-/Markennamen für Looks, Google/CDN im Browser, interne `capivo`-Schlüssel umbenennen, service_role-Key ins Frontend, Konten bei Konkurrenten anlegen oder Passwörter eingeben, Secrets in Chat/Felder.

## Stand (14.10.2026, nach Creator-Runde 3)
- Auf `main`: Creator-Pakete A, B1–B7, N (Schnell, Handy, Blöcke, Looks, KI), Trimmen/Ausschneiden (B5, Konzept docs/vergleich/B5-trimmen-konzept.md), Free-Push auf der Landing («kostenlos während der Beta», ohne Wasserzeichen, ohne Anmeldung; H1 «Auto captions in seconds.»), Editor auf Deutsch unter /de, Runde-2/3-Korrekturen (Looks Vorschau = Export, Konturdicke unabhängig von der Fensterbreite, Emoji-Fallback ohne KI, Template-Hook per Häkchen, Handy-Layout, Auto-Zoom Subtle + Safe-Zone ab Werk, Cut-Markierung in der Liste, «Start fresh», Blur-Band, Zeichenlimit, Hook-Varianten).
- Noah Runde 3: «Für Einzel-Reels wechsle ich jetzt; für den Tagesbetrieb mit 4 Kunden fehlt Batch.» Zahlungsbereitschaft CHF 8–12, mit Batch + Brand-Kit bis CHF 20.
- Live: Deploy per GitHub Actions braucht die Pflicht-Secrets FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, GROQ_API_KEY und empfohlen FTP_DIR (Jonas trägt sie selbst ein) – sonst lädt Jonas `gluephs-dist.zip` (`node scripts/build-dist.js --zip`, Inhalt inkl. .htaccess) per FTP hoch. Zuerst prüfen: `curl -s https://gluephs.com/ | grep -o '<title>[^<]*'` (neu: «Free Auto Captions for Reels & TikTok – No Watermark | Gluephs») und `curl -s 'https://api.github.com/repos/jonastreier/captly/actions/runs?per_page=5'`. Ist der neue Stand live: Live-Check zusammenfassen, an Search Console erinnern (Sitemap, Indexierung `/` und `/de`).
- Konkurrenz (Submagic, CapCut) in drei Runden nie getestet: kein Login in Chrome. Nur testen, wenn Jonas eingeloggt ist (vorher per Tab prüfen).

## Auftrag (Reihenfolge)
1. **Live-Abnahme (S, selbst):** Ist der neue Stand live, mit echter Transkription v1/v2/v3 (siehe Testmaterial) gegen die Wahrheits-JSON zählen: Wortfehlerrate, Namen («Sandra Meier», «Winterthur», «Klartext Business»), Zeitversatz der Wort-Timings (im Mock ~80 ms durch VAD-Kompaktierung – live klären), KI-Emojis/Keywords (`/api/enhance`) und Hook-KI echt prüfen. Funde als eigenes Paket.
2. **C1 Batch/Queue (L, Sonnet, 1–2 Agents; Noahs einziger «hoch»-Punkt):** mehrere Dateien auf einmal (Landing und Editor), Template pro Clip wählbar (Standard = Default-Template), Liste mit Status (transkribiert/bearbeitet/exportiert), Clip öffnen → Editor, «Alle exportieren» nacheinander (Speicher sparsam: ein Video gleichzeitig im Speicher, Blobs sofort freigeben), Download einzeln oder als ZIP (ohne Fremdbibliothek, STORE-ZIP selbst schreiben), SRT pro Clip optional. Handy: Queue bedienbar, mind. 3 Clips. Autosave pro Clip. Grenzen klar anzeigen (z. B. max. 10 Clips/Durchgang). Tests: reine Queue-Logik, ZIP-Struktur (Prüfsummen), Browser mit v1+v2+v3 in einem Durchgang, Exportdauer/-format je Clip.
3. **C5 Brand-Kit (M):** pro Kunde Template + Schrift + Farben + Logo-Wasserzeichen (optional, nur eigenes Logo) + Safe-Zone-Vorgabe; in der Queue pro Clip wählbar. Template-Export/-Import (B4) als Basis.
4. Restpunkte Runde 3 (niedrig), falls nicht erledigt: Typewriter wächst zentriert statt links; Handy-Captions-Vorschau fix oben.
5. **Danach Creator-Runde 4** («Noah», Sonnet-Subagent, Profil wie noah.md): Schwerpunkt Batch/Brand-Kit im Tagesablauf (5 Clips, 2 Kunden), Bericht nach docs/vergleich/creator-<datum>-runde4/ mit Vorher/Nachher zu Runde 3; sinnvolle Funde direkt umsetzen und testen.
Vorschlagen, nicht ungefragt bauen: C2 Cloud-Sync (braucht Supabase), C4 Auto-Reframe mit Gesichtsfokus (lokal), Musik-Bett mit Ducking, Preismodell nach der Beta.

## Testmaterial (Skripte im Repo, Ausgabe ausserhalb)
- `python3 scripts/creator-test/gen.py /tmp/gluephs-creator` erzeugt drei Videos mit Sprache (macOS `say` + ffmpeg) samt Wahrheit `<name>.json` (`text`, `language`, Wort-Timings): v1-reel-de (9:16, 20,5 s), v2-podcast-de-16x9 (27,6 s, Namen «Sandra Meier», «Winterthur», «Klartext Business»), v3-hook-en (9:16, 19,1 s).
- `node scripts/creator-test/creator-mock.js <worktree> <port> /tmp/gluephs-creator` liefert den Worktree statisch, `/de`, `/test/<datei>` und `/api/transcribe` mit den Timings des per `GET /mock/use?v=<name>` gewählten Videos (kein `/api/enhance` → KI-Ausfall-Pfad).
- Upload im Browser: `await fetch('/mock/use?v=<name>')`, dann Blob von `/test/<name>.mp4` → `new File` → `DataTransfer` → `#landInput.files` + `change`-Event.

## Abnahme
- Pro Paket: Tests grün (Playwright-Lücke benennen), Browser-Check EN und /de, Vorschau = Export, wo Geometrie/Animation betroffen ist; Status in noah-runde3.md (bzw. Runde 4) nachführen.
- Schluss: Zusammenfassung in 10 Zeilen; offene Punkte nur noch die, die Jonas selbst erledigen muss.
```
