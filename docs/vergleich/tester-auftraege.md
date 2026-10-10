# Tester-Aufträge (Marktvergleich CaptionRush)

Fertig formuliert zum Starten als eigenständige Agenten (Modell `sonnet`, parallel). Jeder Auftrag ist ohne weiteren Kontext ausführbar.
Gemeinsamer Teil steht jeweils im Auftrag (bewusst wiederholt).

---

## Tester A «Reise»

Du bist Tester A für einen Marktvergleich des Untertitel-Tools CaptionRush. Arbeitsverzeichnis (git-Worktree):
`/home/user/captly/.claude/worktrees/agent-a90bf426975366802`. Lies dort zuerst `CLAUDE.md` (kurz) und `test-e2e.js` (Vorlage).

Regeln: Du änderst KEINEN Produktcode (captly.html, *.php, i18n, Tests) und committest nichts. Schreiben im Repo nur unter
`docs/vergleich/reise/` (Screenshots/Kontaktbögen JPEG/PNG ≤ 600 KB je Datei, JSON-Messdaten). Eigene Skripte und grosse Dateien nach
`/tmp/claude-0/vergleich-reise/`. Du berichtest, du behebst nichts.

Technik: `const { startServer, routeSupabase, server, VIDEO, chromium } = require('<worktree>/test-e2e.js')` liefert Mock-Server (Mock-Transkription,
Mock-Supabase) und Playwright-Chromium. Achtung: `require` startet den Test nicht (prüfe `require.main`); falls doch, kopiere die nötigen Teile in dein
Skript. Headless-Chromium hat **keinen H.264-Decoder**: Quellvideos als VP8/WebM erzeugen (wie in test-e2e.js), MP4-Quellen nur zusätzlich probieren und
das Ergebnis als «nicht repräsentativ für Chrome mit H.264» kennzeichnen. Testvideos mit ffmpeg: `testsrc2` + Sinuston + Rauschen (sonst meldet die
Sprach-Erkennung Stille): 6 s und 30 s, jeweils 1080×1920 (Hochformat) und 540×960.

Ablauf je Viewport — Desktop 1280×800 und Handy 390×844 (`hasTouch:true, isMobile:true`):
Landing → Editor öffnen → Video hochladen → Untertitel erscheinen → Look wählen → ein Wort korrigieren → Timeline: Block verschieben, teilen,
Mehrfachauswahl → Export-Sheet öffnen (E-Mail-Gate + Newsletter-Häkchen wie in der App) → MP4-Download → SRT, VTT, TXT → Cover-PNG.

Messen und als Tabelle liefern:
1. Klicks/Taps und Sekunden pro Schritt; Transkription (Mock) getrennt ausweisen; Zeit bis zum ersten Download (ohne Mock-Anteil).
2. Exportdauer für 6 s und 30 s, je 540×960 und 1080×1920 (Verhältnis Exportzeit/Videolänge). Export-Weg notieren (WebCodecs oder MediaRecorder/ffmpeg.wasm).
3. Ausgabe per `ffprobe -v error -show_streams -show_format -of json`: Container, Video-Codec, Auflösung, fps, Audio-Codec, Dauer, Grösse.
   Prüfe die Behauptung «1080p by default» (Exportgrösse bei 540×960-Quelle?).
4. Drei Frames je Export extrahieren (`ffmpeg -ss … -frames:v 1`), ansehen und urteilen: Untertitel sichtbar, lesbar, korrekt positioniert, nicht abgeschnitten.
5. SRT/VTT/TXT: Format gültig (Zeitstempel, Nummerierung, `WEBVTT`-Kopf), Inhalt = Editor-Text inkl. Korrektur.
6. Cover-PNG: Grösse (erwartet 1080×1920), Titel sichtbar.
7. Konsolenfehler und `pageerror` je Schritt.
8. Reibungspunkte als nummerierte Liste mit Schweregrad (kritisch/hoch/mittel/niedrig): verwirrende oder blockierende Stellen, Wortlaut, tote
   Klicks, zu kleine Tippflächen (< 44 px am Handy), Englisch-only im Editor. Bei Produktfehlern Datei:Zeile in `captly.html`.

Bericht (max. ca. 60 Zeilen): Tabellen + Funde + Grenzen der Messung (Mock-Transkription, Headless ohne H.264, keine echte Netzlatenz).

---

## Tester B «Looks»

Du bist Tester B für einen Marktvergleich des Untertitel-Tools CaptionRush. Arbeitsverzeichnis (git-Worktree):
`/home/user/captly/.claude/worktrees/agent-a90bf426975366802`. Lies `CLAUDE.md` (kurz), `test-e2e.js` (Mock-Server, Export-Ablauf) und
`test-ui-sweep.js` (Vorschau-=-Export-Prüfungen, Optionen `--quick`, `--only=geom,pixel,anim`).

Regeln: KEIN Produktcode ändern, nichts committen. Schreiben im Repo nur unter `docs/vergleich/looks/` (ein Kontaktbogen-JPEG ≤ 600 KB, evtl. 2–3
Detailbilder, JSON-Daten). Skripte und Zwischendateien nach `/tmp/claude-0/vergleich-looks/`. Du berichtest, du behebst nichts.

Technik: `require('<worktree>/test-e2e.js')` exportiert `startServer`, `routeSupabase`, `server`, `VIDEO`, `chromium`. Headless-Chromium hat keinen
H.264-Decoder → Testvideos als VP8/WebM (ffmpeg). Die 24 eingebauten Looks stehen in `captly.html` ab `var STYLES = [` (ids: tight, mix, statement,
accent, serifbold, reveal, note, script, soft, classic, hormozi, boxkara, beast, minimal, lift, popone, tiktok, hush, focus, headline, stack, neon,
editorial, marker); dazu `styles.json` (aktuell leer). Untertiteltext kommt aus der Mock-Transkription; für eigene Sätze den Text im Captions-Tab
ersetzen (wie ein Nutzer).

Aufgaben:
1. Jeden Look mit demselben Satz rendern, in Vorschau (Screenshot) und Export (Frame aus dem MP4), auf drei Hintergründen: hell (`color=0xd8c8a8`),
   dunkel (`color=0x101010`), bunt (`testsrc2`). Ein Kontaktbogen (z. B. `ffmpeg … tile`, klein, JPEG q≈5).
2. Lesbarkeit je Look: Kontrast Text/Hintergrund (grob messen: Luminanz Text vs. Umgebung), Lage in der Reels/TikTok-Safe-Area (unten ca. 20 %, rechts
   ca. 12 % frei; Cover-Code in captly.html nennt die App-eigene Zone — such «safe»), Zeilenzahl.
3. Umbruch: langer Satz (> 15 Wörter), deutsches Kompositum («Donaudampfschifffahrtsgesellschaftskapitän»), finnisches Langwort
   («lentokonesuihkuturbiinimoottoriapumekaanikkoaliupseerioppilas»), RTL (Arabisch) und CJK (Japanisch) — soweit die App die Sprache unterstützt
   (16 Sprachen inkl. ar, ja; fi ist KEINE Transkriptionssprache, nur Text-Umbruch testen). Abgeschnitten? Falsche Richtung? Tofu-Zeichen (fehlende Schrift)?
4. Animationen: Word pop, Reveal, Fill/Karaoke über 5 Zeitpunkte sichtbar? Im Export gleich wie in der Vorschau?
5. Vorschau = Export: `node test-ui-sweep.js --quick --only=geom,pixel,anim` ausführen (Ausgabe nach /tmp umleiten), Ergebnis + XPASS/EXPECT_FAIL zusammenfassen.
6. Urteil pro Look (gut/ok/schwach, ein Satz Begründung) und Gesamteindruck «wirkt professionell, nicht generisch?» mit Begründung (Typografie,
   Abstände, Farben, Animation). Ehrlich; Vergleichsmassstab sind aktuelle Reels-Caption-Looks (z. B. Captions, Submagic, CapCut), aber du hast
   deren Ausgabe nicht vor dir — also nur das eigene Bild beurteilen.

Bericht (max. ca. 60 Zeilen): Tabelle 24 Looks × (Lesbarkeit hell/dunkel/bunt, Safe-Area, Umbruch, Animation, Abweichung Vorschau/Export px, Urteil),
Funde mit Datei:Zeile bei Produktfehlern, Grenzen (Headless-Rendering, Schriften lokal, keine echten Sprachaufnahmen).

---

## Tester C «Robustheit»

Du bist Tester C für einen Marktvergleich des Untertitel-Tools CaptionRush. Arbeitsverzeichnis (git-Worktree):
`/home/user/captly/.claude/worktrees/agent-a90bf426975366802`. Lies `CLAUDE.md` (kurz), `test-e2e.js` (Vorlage) und gezielt in `captly.html`:
`MAX_AUDIO_SEC` (20 Min), `BIG_MEDIA_BYTES` (150 MB → ffmpeg.wasm), `noAudioTrackErr`, HEVC-Hinweis, Autosave («Restored your last session»).

Regeln: KEIN Produktcode ändern, nichts committen. Schreiben im Repo nur unter `docs/vergleich/robust/` (Screenshots ≤ 600 KB, JSON). Testdateien
(auch grosse) nach `/tmp/claude-0/vergleich-robust/`, danach löschen. Du berichtest, du behebst nichts.

Technik: `require('<worktree>/test-e2e.js')` exportiert `startServer`, `routeSupabase`, `server`, `VIDEO`, `chromium`. Headless-Chromium ohne
H.264-Decoder → Standard-Quelle VP8/WebM; H.264/HEVC-Fälle trotzdem probieren und Ergebnis als «Headless-Grenze» kennzeichnen.

Fälle (je: Ergebnis, Meldung im Wortlaut, verständlich ja/nein, Absturz/Hänger, Zeit):
1. Querformat 1920×1080. 2. Hochformat mit Rotations-Metadaten (1920×1080 + `-metadata:s:v rotate=90` bzw. Display-Matrix). 3. 4K 3840×2160 (10 s).
4. Ohne Tonspur. 5. Sehr kurz (0,5 s). 6. 3 min (nur wenn Export < 5 min dauert; sonst nur Upload+Untertitel). 7. Kaputte Datei (abgeschnittenes WebM)
und nicht unterstützte Datei (`.txt` umbenannt in `.mp4`, ein PNG). 8. Grosse Datei ~300 MB (wenn Platz/Zeit es erlauben; sonst Limits aus dem Code
ablesen und als «abgelesen, nicht gemessen» markieren). 9. Abbruch während des Exports (Abbrechen-Knopf bzw. Sheet schliessen) → danach sofort
zweiter Export: klappt er, ist die Datei vollständig (ffprobe)? 10. Seite neu laden → gleiches Video erneut laden → Zustand wiederhergestellt
(Edits, Look)? 11. Offline (`context.setOffline(true)`) vor Upload und während Transkription → Meldung? 12. Browser-Zurück im Editor → Datenverlust,
Warnung? 13. Mock-Transkription liefert Fehler 429/500 (Route im Mock überschreiben) → Meldung, Retry?
Zusätzlich: Konsolenfehler je Fall.

Bericht (max. ca. 50 Zeilen): Tabelle Fall × (Ergebnis, Meldung, verständlich, Absturz/Hänger, Schweregrad), Funde mit Datei:Zeile bei Produktfehlern,
Grenzen (Headless, Mock statt Groq, kein echtes Handy, kein Safari/iOS).
