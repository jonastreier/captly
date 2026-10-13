# Start-Prompt für die nächste Session (zum Kopieren)

```
Projekt: Gluephs (vormals CaptionRush/Capivo) – Untertitel-Tool für Reels/TikTok. Repo jonastreier/captly (lokal ~/Documents/claude/captly, origin per SSH), Live-Domain https://gluephs.com (Hostpoint). Lies zuerst CLAUDE.md, dann docs/vergleich/creator-2026-10-13.md (Auswertung des Creator-Tests) und nur bei Bedarf README.md/SETUP.md. Antworten auf Deutsch (Schweizer Schreibweise, ss statt ß), knapp und kritisch.

## Arbeitsweise (verbindlich)
- Du (Opus) planst, dirigierst und integrierst. Umsetzung pro Thema an einen Subagent mit dem kleinsten passenden Modell: Sonnet für UI/Logik mit Nebenwirkungen, Haiku nur für rein mechanische Edits/Doku. Jeder Subagent arbeitet in einem eigenen git-worktree (`git worktree add -b claude/<thema> ../captly-wt/<thema> <basis>`), committet dort, pusht nicht. Haiku-Ergebnisse immer selbst nachtesten (hat schon einen roten Test als «fertig» gemeldet).
- Brief für Subagents: Worktree-Pfad, CLAUDE.md lesen, captly.html nur chirurgisch (grep + gezielte Edits), Tests + `node scripts/build-i18n.js`, Commit mit «Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>», Bericht ≤ 10 Zeilen.
- Danach selbst: in Integrations-Branch mergen, alle Pflicht-Tests aus CLAUDE.md, und jede sichtbare Änderung im Browser (Claude Browser Pane) mit lokalem Mock-Server prüfen: kleiner Node-Server, der das Repo statisch ausliefert, `/api/transcribe` mit festen Wort-Timings beantwortet und Testvideos (ffmpeg testsrc2, 9:16 und 16:9) ausliefert; Upload per `DataTransfer` auf `#landInput`. Vorschau = Export prüfen (drawCaptionsOnCtx auf grauem Canvas vs. DOM-Boxen der Wörter, Zeitpunkt mitten im Block, nicht am Blockanfang).
- Ein Merge nach `main` löst den Deploy aus → erst nach meiner Freigabe mergen und pushen. Push geht per SSH (Schlüssel id_ed25519_github).
- Nie: Personen-/Markennamen für Looks, Google/CDN im Browser, interne `capivo`-Schlüssel umbenennen, service_role-Key ins Frontend.

## Stand (13.10.2026)
- Auf `main`: Feedback-Fixes (freies Verschieben inkl. Export, Gewichte je Schrift, «Export with your changes», Showcase-Grössen am Handy, Split-Knopf/Taste S am Desktop, Autosave bei anderem Dateinamen, Handy-Querformat), Rebrand auf Gluephs inkl. SEO/Logo/OG-Bilder, Deploy auf gluephs.com vorbereitet (Supabase-URL/Key per Secrets, `scripts/inject-supabase.js`), Anleitung `docs/SECRETS-GLUEPHS.md`.
- Blockiert durch mich (Jonas): GitHub-Secrets + neues Supabase-Projekt (altes `tghodbtdraqkfwcmedcv` existiert nicht mehr → Login tot). Bis dahin scheitert der Deploy bei «Secrets prüfen»; gluephs.com ist ein unvollständiger Handupload (keine .htaccess, keine fonts.css → Schriften, `/de`, `/api/*` kaputt). Zuerst fragen, ob die Secrets drin sind; wenn ja: Actions → Deploy + Live-Check verfolgen (öffentliche API: `curl -s https://api.github.com/repos/jonastreier/captly/actions/runs`, Jobs/Steps unter `/actions/runs/<id>/jobs`), Fehler aus den Step-Namen herleiten, Fix als PR.

## Auftrag: Creator-Feedback umsetzen (docs/vergleich/creator-2026-10-13.md)
Reihenfolge, je ein Branch/PR pro Paket:
1. **Paket A (Fehler, alle S)**, parallel in 3 Subagents gebündelt:
   - A-Edit: A1 Standard-Template schlägt zuletzt gewähltes Preset · A2 Undo/Redo auch für Look/Grösse/Position/Custom-Regler (ein Schritt pro Aktion, Slider-Drag = 1 Schritt) · A3 S/Pfeile/Entf wirken global im Editor (nicht nur mit Canvas-Fokus/Auswahl; S teilt am Abspielkopf), Shortcut-Menü ergänzen · A9 Umbruch: keine Trennung bei kurzen Wörtern, Auto-Zeichenlimit an Schriftgrösse/Rahmenbreite koppeln.
   - A-Style: A4 Hex-Feld neben jedem Farbfeld + Deckkraft sichtbar (Swatch darf nie «weiss» zeigen, wenn 60 % gespeichert sind) · A7 Emoji-/Keyword-Schalter mit Hinweis, wenn KI nicht verfügbar; Keyword-Farbe ≠ Aktiv-Farbe im Preset · A8 Emoji-Auswahl kuratiert (Kategorien, Suche, Altlast 🐄🌿🌾🥩🏡 raus) · A10 Template-Menü (Esc/Scroll schliesst, Rename/Delete inline statt prompt/confirm, mit Undo-Toast; Import mit Rückmeldung und Wiederherstellen gelöschter IDs; Export `app:'gluephs'`, Import akzeptiert weiter `capivo`) · A11 `storage`-Event: Templates zwischen Tabs mergen statt überschreiben.
   - A-Copy: A5 Wasserzeichen-/Preisaussagen überall gleich (Beta: nie; danach Regel W1 nur, wenn BILLING_ENABLED) in captly.html, i18n/de.js, FAQ-JSON-LD, llms.txt; Preise zusätzlich «≈ CHF/EUR» · A6 Handy-Nav (Preise/FAQ/Sprache) + Preis-Anker im Hero · A12 Auflösungs-Dropdown ohne Dubletten, alter Toast im Cover-Dialog weg, «Re-transcribe» mit Fortschritt + Warnung bei Handkorrekturen.
2. **Paket B1 Ausgabeformate** (Sonnet, sorgfältig: Export-Geometrie): 9:16/1:1/4:5/16:9, Crop per Drag schwenkbar (in Vorschau und Export identisch), Format im Template; test-ui-sweep `CTL`/`CONTROL_MAP` nachziehen.
3. **Paket B2 + B6 Tempo pro Video**: Template-Wahl schon auf der Landing/beim Upload («My templates», Standard markiert); Handy: «Save as template» als sichtbarer Chip oben im Style-Tab, Tippflächen ≥ 44 px, Timing-Feinschritte per Ziehen.
4. **Paket B3 + B4**: SRT-Varianten (Reel-Schnipsel / Sätze / 2×42 Zeichen), Dateinamen-Suffix abschaltbar; Template-Export inkl. eigener Schriftdatei.
5. **Paket B7 Trend-Looks** über `styles.json` (Style Drops), nicht `STYLES`: Verlauf-Highlight, Farb-Cycling, Bounce mit Squash, Typewriter, Shake, Glass-Box, Marker-Sweep; Vorschau = Export für jeden neuen Effekt beweisen.
6. **Paket B5 Trimmen** (Anfang/Ende, dann Ausschneiden mit Ripple der Untertitel): erst Konzept (Export-Pfad WebCodecs + ffmpeg-Fallback, Audio-Sync) als kurze Notiz an mich, dann bauen.
Danach vorschlagen (nicht ungefragt bauen): C1 Batch/Queue, C2 Cloud-Sync (braucht Supabase), C3 Editor auf Deutsch, C4 Auto-Reframe (Machbarkeit im Browser prüfen), C5 Brand-Kit.

## Abnahme
- Pro Paket: Tests grün, Browser-Check mit Screenshot, Vorschau = Export, wo Geometrie betroffen ist; Status-Spalte in `docs/vergleich/creator-2026-10-13.md` nachführen.
- Am Ende: dasselbe 3er-Creator-Panel (Lea Handy, Marco Desktop 16:9 + Brand, Sina Power-User mit 3 Kunden-Templates) erneut als Sonnet-Subagents laufen lassen – **jeder auf eigener Origin** (`lea.localhost:PORT`, `marco.localhost:PORT`, `sina.localhost:PORT`), damit localStorage getrennt ist; Berichte nach docs/vergleich/creator-<datum>/, Vorher/Nachher-Tabelle.
- Schluss: Zusammenfassung in 10 Zeilen; offene Punkte nur noch die, die ich selbst erledigen muss.
```
