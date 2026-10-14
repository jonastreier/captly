# Start-Prompt für die nächste Session (zum Kopieren)

```
Projekt: Gluephs (vormals CaptionRush/Capivo) – Untertitel-Tool für Reels/TikTok. Repo jonastreier/captly (lokal ~/Documents/claude/captly, origin per SSH), Live-Domain https://gluephs.com (Hostpoint, Server sl52). Lies zuerst CLAUDE.md, dann docs/vergleich/creator-2026-10-14/noah.md (Creator-Test 14.10.) und die Status-Spalten in docs/vergleich/creator-2026-10-13.md; README.md/SETUP.md nur bei Bedarf. Antworten auf Deutsch (Schweizer Schreibweise, ss statt ß), knapp und kritisch. Ohne Rückfragen bis zum Ende durchführen; nur Merge nach main braucht meine Freigabe.

## Arbeitsweise (verbindlich)
- Du (Opus) planst, dirigierst und integrierst. Umsetzung pro Paket an Subagents mit dem kleinsten passenden Modell: Sonnet für UI/Logik/Export-Geometrie, Haiku nur für rein mechanische Edits/Doku (Ergebnisse immer selbst nachtesten). Jeder Subagent in eigenem git-worktree: `git worktree add -b claude/<thema> ../captly-wt/<thema> <basis>`; committet dort, pusht nicht.
- Brief für Subagents: Worktree-Pfad, CLAUDE.md lesen, captly.html nur chirurgisch (grep + Offset + gezielte Edits, nie ganz lesen), Tests + `node scripts/build-i18n.js`, Commit mit «Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>», Bericht ≤ 10 Zeilen inkl. «nicht verifiziert».
- Danach selbst: Branches in einen Integrations-Branch mergen, alle Pflicht-Tests aus CLAUDE.md, jede sichtbare Änderung im Browser-Pane mit lokalem Mock-Server prüfen (Testmaterial unten): `/mock/use?v=<video>` vor jedem Upload, Upload per `DataTransfer` auf `#landInput`. Vorschau = Export beweisen, wo Geometrie/Animation betroffen ist: exportierte Datei per `URL.createObjectURL`-Hook abfangen, Frame per `<video>` + Canvas gegen Quelle/DOM vergleichen (mittlere Pixelabweichung bzw. px-Versatz angeben).
- Lokal fehlen `php` (PHP-Tests überspringen sich) und Playwright (`test-ui-sweep.js` läuft nicht): im Bericht nennen, nicht als grün ausgeben.
- Ein Merge nach `main` löst den Deploy aus → erst nach meiner Freigabe. Push per SSH (id_ed25519_github).
- Nie: Personen-/Markennamen für Looks, Google/CDN im Browser, interne `capivo`-Schlüssel umbenennen, service_role-Key ins Frontend, Konten bei Konkurrenten anlegen oder Passwörter eingeben.

## Stand (14.10.2026)
- Auf `main`: Creator-Paket A (A1–A12), B1 Ausgabeformate (9:16/1:1/4:5/16:9, Crop/Blur, Pan, im Template), vereinfachter Deploy (Pflicht-Secrets nur FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, FTP_DIR, GROQ_API_KEY; Supabase/SMTP/LEAD_SECRET nur Hinweis; Repo-Reste per .htaccess gesperrt; Live-Check prüft sie), Creator-Test 14.10. + dieser Prompt.
- Live: gluephs.com zeigte zuletzt den alten CaptionRush-Handupload (deshalb nennt die Google-KI «CaptionRush»). Jonas lädt `gluephs-dist.zip` hoch (Inhalt inkl. .htaccess) oder trägt die 5 Secrets ein. Zuerst prüfen: `curl -s https://gluephs.com/ | grep -o '<title>[^<]*'` und `curl -s 'https://api.github.com/repos/jonastreier/captly/actions/runs?per_page=5'`. Ist der neue Stand live: Live-Check-Ergebnis zusammenfassen, an Search Console erinnern (Sitemap einreichen, Indexierung `/` und `/de` beantragen).
- Creator-Test 14.10. (Noah): nur Gluephs echt getestet. Submagic und CapCut scheiterten am fehlenden Login (CapCut-Gast: Upload ja, Untertitel/Export nur mit Konto). Konkurrenzvergleich nachholen, sobald Jonas in Chrome eingeloggt ist (siehe Abnahme).

## Auftrag: Creator-Feedback umsetzen
Reihenfolge, je ein Branch pro Paket; Status in noah.md (Abschnitte 6 und 8) bzw. creator-2026-10-13.md nachführen.

1. **Paket N-Schnell (alle S, parallel in 2–3 Sonnet-Subagents)**
   - N1 Standard-Look: neue Nutzer starten mit einem kräftigen Look (Mix oder Bold Pop, begründen; `DEFAULT_STYLE`; eine gespeicherte Wahl in `capivo.style` bleibt). Look «Tight»: Einblenden ≤ 0,12 s mit Ease-out und Startdeckkraft > 0 (nur `ANIM_KEYFRAMES.flash`/Dauer für flash, andere Animationen unverändert), damit kurze Wörter nie halbtransparent stehen. Vorschau = Export für Tight und den neuen Default beweisen.
   - N2 Auto-Cut (`autoCutSilence`, heute nur in `onAutoCutChange` gesetzt): beim Laden eines neuen Videos zurücksetzen; im Editor sichtbar machen (Schalter + Anzeige «−x,x s»), Export-Option bleibt synchron. Test: v2 mit Cut → v3 laden → Export hat volle Länge.
   - N3 16:9-Quelle: beim Upload Chip/Hinweis «Als 9:16-Reel ausgeben?» (Crop/Blur), Format-Wahl auch im Editor statt nur Export → Options; nutzt das B1-Modell (`exportAspect`/`exportFill`/`exportPan`).
   - N7 Blur-Format: Untertitel nie auf der Kante zwischen scharfem Band und Unschärfe; in die Zone unterhalb des Bandes oder ins Band klemmen (Vorschau = Export).
   - N9 Export: Bitrate an die Quelle koppeln (≈ Quelle × 1,2, min. 2 Mbit/s, Obergrenze wie heute) und konstante Framerate auch bei Auto-Cut/Blur (ffprobe: `avg_frame_rate` = `r_frame_rate`).
   - N10 Export-Dialog nach dem Download: Optionen bleiben änderbar; «Download again» nur ohne Änderung, sonst «Export with changes».
   - N8 Grössen-Regler: Anzeige relativ (z. B. % der Rahmenhöhe oder S/M/L/XL) statt bezugsloser px.
   - N13 Zeile anklicken springt zuverlässig zur Stelle und pausiert, auch nach «Restored your last session»: reproduzieren, beheben, Test.
2. **Paket N-Handy (M, Sonnet)**: 375×812: Timeline standardmässig zu, Look-Karussell ohne Überlagerung der Timeline-Leiste, Zeilenliste mind. 4 Zeilen sichtbar, Vorschau so gross wie möglich, Tippflächen ≥ 44 px. Vorher/Nachher-Screenshots bei 375 und 390 px.
3. **Paket N-Blöcke (M, Sonnet)**: satz- und pausenbewusste Segmentierung: Satzende beendet einen Block, Pausen > ~0,35 s trennen, keine Einzelwort-Waisen (ausser Looks mit `wpb:1`), Ziel 2–4 Wörter; ein Look-Wechsel darf Handkorrekturen und manuelle Splits nicht zerstören. Test mit v1/v2/v3-Timings: Anteil Einzelwort-Blöcke vorher/nachher (v1 heute 7 von 21).
4. **Paket N-Looks (= B7, M, Sonnet)** über `styles.json` (Style Drops), nicht `STYLES`, neutrale Namen: Wort-Farbwechsel mit leichtem Überschwingen, Schlagwort gross/Rest klein, Gradient-Karaoke mit Glow, Typewriter, Sticker-Emoji (gross neben dem Wort, Mini-Bounce), Glas-Box, Unterstreichung/Swipe, Squash/Overshoot als Pop-Variante. Schwache Looks (Comic, Headline, Classic, Neon, Soft, Script) überarbeiten oder hinter «Mehr» legen. Vorschau = Export je neuem Effekt.
5. **Paket N-KI (M)**: Keyword-/Emoji-KI und optional «Hook-Titel» (grosser Titel in den ersten 2 s aus dem ersten Satz bzw. per KI) standardmässig an, sobald `/api/enhance` live konfiguriert ist; Ausfall klar am Schalter (A7 besteht). Erst prüfen, ob enhance.php live läuft; sonst nur UI + Fallback.
6. Danach der Rest vom 13.10.: **B2+B6** (Template-Wahl beim Upload, Handy «Save as template» sichtbar, Timing-Feinschritte per Ziehen), **B3+B4** (SRT-Varianten, Suffix abschaltbar, Template-Export inkl. Schrift), **B5 Trimmen** (erst Konzept-Notiz an mich: WebCodecs + ffmpeg-Fallback, Audio-Sync, Ripple der Untertitel; dann bauen).
Danach vorschlagen, nicht ungefragt bauen: C1 Batch/Queue (Noah und Sina: Kernargument für Pro), C2 Cloud-Sync (braucht Supabase), C3 Editor auf Deutsch, C4 Auto-Reframe mit Gesichtsfokus (lokal), C5 Brand-Kit, Musik-Bett mit Ducking.

## Testmaterial (Skripte im Repo, Ausgabe ausserhalb)
- `python3 scripts/creator-test/gen.py /tmp/gluephs-creator` erzeugt drei Videos mit Sprache (macOS `say` + ffmpeg) samt Wahrheit `<name>.json` (`text`, `language`, Wort-Timings): v1-reel-de (9:16, 20,5 s), v2-podcast-de-16x9 (27,4 s, Namen «Sandra Meier», «Winterthur», «Klartext Business»), v3-hook-en (9:16, 19 s).
- `node scripts/creator-test/creator-mock.js <worktree> <port> /tmp/gluephs-creator` liefert den Worktree statisch, `/de`, `/test/<datei>` und `/api/transcribe` mit den Timings des per `GET /mock/use?v=<name>` gewählten Videos.

## Abnahme
- Pro Paket: Tests grün (PHP-/Playwright-Lücke benennen), Browser-Check mit Screenshot, Vorschau = Export, wo Geometrie/Animation betroffen ist; Status nachführen.
- Am Ende Creator-Retest: «Noah» (Sonnet-Subagent, Profil wie in noah.md) mit denselben 3 Videos in Gluephs und, sofern Jonas in Chrome bei Submagic und CapCut eingeloggt ist (vorher per Tab prüfen, nie selbst einloggen oder Konten anlegen), auch dort: Transkriptionsgenauigkeit der Konkurrenz gegen die JSON-Wahrheit zählen, Looks/Defaults/Exporte vergleichen. Bericht nach docs/vergleich/creator-<datum>/ mit Vorher/Nachher-Tabelle zu noah.md.
- Schluss: Zusammenfassung in 10 Zeilen; offene Punkte nur noch die, die Jonas selbst erledigen muss.
```
