# Creator-Test 14.10.2026: Noah (31, Zürich, Vollzeit-Creator, 180k)

Profil: 3–5 Kurzvideos pro Tag (DE/EN) plus Schnitt für 4 KMU-Kunden. Heute Submagic und CapCut. Getestet wurde Gluephs (Stand `main`, Mock-Server `localhost:8800`) mit denselben drei Videos, die auch in Submagic und CapCut hätten laufen sollen. **Konkurrenz-Login fehlte in beiden Fällen** (siehe Kapitel 9); die Konkurrenz-Aussagen unten stützen sich deshalb auf Gast-Zugang, öffentliche Seiten und Preisliste, nicht auf einen Export.

Bilder liegen im selben Ordner (`01-…` bis `09-…`).

---

## 1. Kurzurteil

- **Wechseln? Noch nicht.** Gluephs ist beim Tempo und beim Zugang klar besser (kein Login, kein Wasserzeichen, Export 20 s Reel in 3 s), aber Looks und Standard-Einstellungen wirken 2024, und was Submagic als «alles in einem» verkauft (Auto-Zoom, B-Roll, Hook-Titel, Füllwörter, Publishing), gibt es nur halb.
- **Als Zweitwerkzeug sofort brauchbar** für schnelle Untertitel-Jobs und 16:9→9:16 aus Kunden-Podcasts, weil alles lokal läuft und ohne Konto geht.
- **Dann wechsle ich, wenn:** (1) der Standard-Look sofort gut aussieht (kein halbtransparenter Text, Highlight an), (2) Handy-Editor ohne Überlagerungen, (3) Batch/Queue mit Kunden-Template, (4) KI-Emoji/Keyword-Highlight verlässlich läuft, (5) 3–4 echte Trend-Looks mit Wort-für-Wort-Farbe.
- **Zahlungsbereitschaft:** CHF 8–12 pro Monat für Einzelnutzung, bis ca. CHF 20 mit Batch + Brand-Kit für Kundenarbeit. Submagic Starter kostet laut Preisseite heute $12/Monat (jährlich), mit nur 15 Videos und 2 Min. Länge; da wäre Gluephs mit «ab $7.99» (Landing) günstiger, sobald der Rest stimmt; Limits der Gluephs-Pläne habe ich nicht geprüft.
- **Nicht beurteilt:** Transkriptionsgenauigkeit (Mock), Handy-Touch auf echtem Gerät.

---

## 2. Messtabelle

Gluephs: Mock-Transkription, Pane 1280×800 bzw. 375×812, Export im Fast-Pfad (WebCodecs). «Klicks» = Mausklicks ab Landing, Dateiauswahl zählt als 1.

| Tool | Video | Klicks bis Untertitel sichtbar | Zeit bis Untertitel | Klicks bis Export | Zeit Export | Ergebnis |
|---|---|---|---|---|---|---|
| Gluephs | v1 Reel DE (Tight, Standard) | 1 | Editor sofort (0,05 s), Text 1,16 s (davon 0,9 s Mock-Verzögerung) | 3 (Upload, Export, «Skip») | 3,05 s | 1080×1920, 30 fps konstant, H.264+AAC, 10,2 MB (Quelle 5,6 MB), 20,5 s, ohne Wasserzeichen |
| Gluephs | v2 Podcast 16:9 → 9:16 (Crop) | 1 | 1,2 s | 5 (Upload, Export, Options, Format, Download) | 4,0 s | 1080×1920, 30 fps, 11,1 MB, 27,6 s |
| Gluephs | v2 (Blur + «Cut silences») | 1 | 1,2 s | 6 | 3,5 s | 1080×1920, avg 29,9 fps (variabel, tbr 120), 7,4 MB, 22,55 s statt 27,6 s |
| Gluephs | v3 Hook EN (Bold Pop, Handy-Sheet) | 2 (Look-Chip, Upload) | 1,2 s | 2 (Export, Download) | 2,3 s | 1080×1920, 6,9 MB, 15,3 s statt 19,1 s (Auto-Cut war aus v2 noch an, siehe 6.2) |
| Submagic | v1, v2, v3 | – | **Login fehlte** | – | – | `app.submagic.co` zeigt Anmeldung, 3 Versuche über ca. 25 Min. |
| CapCut | v1 (nur Gast) | Upload 1, danach «Untertitel» → «Automatische Untertitel» → Sprache → «Generieren» = 4 | – | – | – | Video-Upload im Gast-Editor ging. **Generieren und Exportieren verlangen Login** (Bild 08). Eigene Wahrheits-SRT liess sich importieren (nur Look/Editor beurteilbar). |

Messungen zur Genauigkeit (Wortfehler, Namen «Sandra Meier», «Winterthur», «Klartext Business»): **nicht möglich**, Mock bei Gluephs, Login bei den anderen.

Vorschau = Export (Gluephs): gleicher Look, gleiche Position, Emoji und Auto-Cut-Zeiten stimmen in den Export-Frames (Bilder 02–05); ein Pixelvergleich Vorschau gegen Export war nicht möglich, weil die Pane das Videobild im Screenshot grau zeigte (Kapitel 9).

---

## 3. Bedienung

**Gluephs, Ablauf.** Landing mit Dropzone im ersten Bildschirm, Sprache («Auto-detect»), 10 Look-Chips direkt darunter. Nach dem Upload öffnet der Editor sofort, man kann schon den Look wählen, während transkribiert wird («Choose a style while we transcribe»). Rechts Tabs Captions / Style, links Vorschau mit Wellenform-Timeline (Snap, Close gaps, Split). Export-Popup: E-Mail optional («Skip — download now»), grosser Button «MP4 · 1080p · no watermark», darunter SRT/VTT/TXT/Copy text/Create cover, «Options», und «Caption & hashtags for your post». Nach dem Export: «Caption another video — Keeps your style». Das ist der schnellste Weg, den ich in den drei Tools gesehen habe: Upload und Export in 3 Klicks.

**Textkorrektur.** Zeile anklicken, tippen (Wort korrigiert, das Keyword-Highlight wandert mit: «Views» → «Klicks»), Enter teilt (funktioniert nur zwischen Wörtern, nicht mitten im Wort), Start/Ende per ±0,1-s-Knöpfe, Emoji-Picker mit Suche («Feuer» findet 🔥, sechs Kategorien), Highlight-Chips pro Wort, Undo/Redo oben. Manuelle Korrekturen überleben einen Look-Wechsel (getestet: «This ONE!»). Im Vergleich zu CapCut (Text rechts im Panel «Einfach», Zeilenliste links, SRT wird beim Import neu segmentiert) ist die Gluephs-Liste klarer; sie kennt aber kein Trimmen des Videos.

**Tempo.** Wegen des Mock kann ich nur sagen: Editor in 50 ms, Export 3 s für 20 s. CapCut und Submagic rendern in der Cloud; echte Zeiten konnte ich nicht messen.

**16:9 → 9:16 (v2).** Das Format steckt in Export → Options (Format, Fill: Crop/Blur, «Drag the video in the preview to move the crop»). Wenn man es dort setzt, springt die Vorschau auf 9:16 (Bild 04). Kein Gesichts-/Fokus-Tracking, nur Mitte oder manuell verschieben. Beim 16:9-Upload gibt es keinen Hinweis oder Vorschlag «als Reel ausgeben» (6.3).

**Handy (375×812).** Bottom-Tabs Captions/Style/Timeline, Export als Bottom-Sheet mit grossem Download-Button (gut). Problem: Vorschau nur ca. 240 px breit, geöffnete Timeline plus Aktionsleiste fressen die halbe Höhe, von der Zeilenliste sieht man 2 Zeilen; im Style-Tab liegt das Look-Karussell über der Timeline-Leiste (Bild 06, 6.4).

**Zum Vergleich Submagic / CapCut.** CapCut-Gast: viele Hinweis-Blasen nacheinander («Elementressourcen», «Inhalte generieren», «Elemente», «Eigene Schriftarten mit KI», «Bereit zum Exportieren») plus Pro-Pop-up; jedes davon kostet einen Klick. Standardsprache bei «Automatische Untertitel» ist **Englisch (US)**, nicht Auto-Erkennung; wer vergisst, auf Deutsch zu stellen, verbrennt eine Generierung. Submagic: nur Anmeldung gesehen; die öffentliche Seite bietet eine Dropzone («MP4 oder MOV, bis 500 MB, max. 5 Minuten»), die ich nicht ausgelöst habe, weil sie auf ein Konto hinauslaufen dürfte.

---

## 4. Styles

**Gluephs: 24 Looks** (Bild 01, Reihenfolge von links oben): Tight, Mix, Statement, Accent, Serif Bold, Reveal, Note, Script, Soft, Classic, Bold Pop, Highlight Box, Comic, Clean, Clean Highlight, One Word, Pill Box, Subtitle, Karaoke, Headline, Dark Box, Neon, Elegant, Marker. Dazu ca. 55 Schriften plus eigene, Animation (Highlight/Reveal/Fill/None), Wort-Pop (Pop/Punch/Lift/Fade in/Glow), Auto-Zoom (Off/Subtle/Punchy), Hintergrund Box/Pill, Outline, Schatten, Position Top/Middle/Bottom, Hex-Farben, Template speichern.

**Was davon 2026 trägt:** Mix (fette weisse Sans, Keyword in kursiver Serif mit grünem Glow; der modernste Look), Statement (gelbe Grossbuchstaben, gestapelt, aktives Wort weiss), Highlight Box (grüne Box auf dem aktiven Wort), Karaoke (violette Box wandert mit), Marker (gelbes Marker-Rechteck), Bold Pop mit Wort-Farbwechsel (Bild 05). **Altbacken oder schwach:** Comic, Headline (kondensiert, klein, wirkt wie 2019-Meme), Classic (dünn umrandet), Neon (flach, kaum Leuchten), Soft, Script (zu klein und zu dünn für 9:16 auf dem Handy), Clean (zu dezent für Hook-Videos).

**Look-Beschreibungen, die Gluephs fehlen** (ohne Personen-/Markennamen):
1. «Pop-Wort mit Farbwechsel»: jedes aktive Wort wechselt die Farbe (Gelb → Grün → Pink), eingeblendet mit leichtem Überschwingen und Schatten, 1–2 Wörter pro Block.
2. «Schlagwort gross, Rest klein»: Füllwörter klein in Weiss, das Keyword im Block doppelt so gross in einer Signalfarbe.
3. «Gradient-Karaoke»: aktives Wort mit Farbverlauf und weichem Glow, Rest halbtransparent.
4. «Typewriter»: Buchstaben erscheinen einzeln mit Cursor, für ruhige Erklär-Reels.
5. «Sticker-Emoji»: Emoji gross neben dem Wort, mit Mini-Bounce, nicht klein über dem Text.
6. «Glas-Box»: unscharfe, halbtransparente Box mit weissem Text, passt zu hellen Business-Videos.
7. «Unterstreichung/Swipe»: Marker-Strich fährt unter das Schlagwort.
8. «Hook-Titel»: grosser Titel in den ersten 2 s oben (Submagic nennt das «Hook-Titel per KI»).

**Animationen.** Pop, Punch, Lift, Fade, Glow sind sauber umgesetzt und im Export identisch. Die Dauer ist aber fix 0,34 s und der Standard-Look blendet linear von 0 ein (6.1); es gibt keinen Squash/Overshoot, keinen Shake, kein Wort-für-Wort-Verschieben.

**CapCut (Gast-Eindruck).** «Stile» sind statische Textkästen (Schwarz/Weiss-Box, Outline, Violett, Gelb), «Vorlagen» sind Text-Effekt-Designs (Comic-«Explosionen», Pink-Blasen, Serif); die meisten wirken wie Titel-Effekte, nicht wie Karaoke-Untertitel. Eine importierte SRT landet als **winzige Schrift knapp über dem unteren Rand** (Bild 08), also in der Zone, die TikTok/Reels mit UI überdeckt. Wortweises Highlight habe ich im Gast-Modus nicht gefunden. «Auf alle anwenden» als Häkchen unter «Format» ist praktisch. Pro-Funktionen sind mit Diamant markiert.

**Submagic (öffentliche Angaben, Stand Preisseite 14.10.2026).** Untertitel-Vorlagen «Standard» (Starter) und «Premium» (Pro/Business), 123 Sprachen, «99 % Genauigkeit» (Eigenaussage, nicht geprüft), Brand-Kit ab Pro, eigene Vorlagen (3 bei Pro, 5/10 bei Business je nach Seite), eigene Schriften, Benutzerdefiniertes Wörterbuch ab Business. Wasserzeichen: «Kein Wasserzeichen» in allen Stufen.

---

## 5. Best Practice

Was die Konkurrenz ab Werk richtig macht, laut Preisseite/Produktseite von Submagic und Gast-Editor von CapCut (nicht alles selbst geprüft), und was Gluephs übernehmen sollte:

| Thema | Konkurrenz | Gluephs heute | Empfehlung |
|---|---|---|---|
| Defaults sofort erfolgreich | Submagic: gewählter Premium-Look, Keyword-Farbe, Zoom, Emoji ab Werk | Default «Tight»: weiss auf weiss (Highlight = Textfarbe), Fade-in 0,34 s (Bild 02) | Default-Look «Mix» oder «Bold Pop» mit Keyword-Farbe |
| Safe Zone | CapCut-Gast: keine Hilfe gesehen; Submagic nicht zugänglich | **Schild-Knopf blendet Safe Zone ein**, Text liegt bei ca. 60 % Höhe | Beibehalten, Knopf prominenter, Default an für 9:16 und beim Blur-Format auch die Videokante beachten (6.5) |
| Wörter pro Zeile | 2–4 | Look-abhängig, Tight 1, Mix 3, Bold Pop 3–4 | Satz-/Pausenbewusstes Umbrechen, keine Einzelwort-Waisen wie «Uhr.» |
| Hook-Highlight | Submagic: Hook-Titel per KI (Pro) | Nicht vorhanden | Titel-Overlay in den ersten 2 s |
| Auto-Emoji | Submagic: KI; CapCut: manuell | Emoji pro Zeile manuell, KI «unavailable» im Mock | KI-Emoji im Standard, Emoji gross und neben dem Wort |
| Pausen/Füllwörter | Submagic Pro: «Remove silences», «Bad takes», «Füllwörter» | **«Cut silences & filler words» im Export-Dialog, funktioniert** (27,6 → 22,55 s, Untertitel folgen dem Schnitt) | Als eigener Schalter im Editor mit Vorschau der Schnitte, nicht nur im Export (6.2) |
| B-Roll | Submagic: Standard/Premium, Storyblocks | Nicht vorhanden | Mittelfristig, grosser Aufwand |
| Musik/SFX | Submagic: Audio, «AI-Soundeffekte» | Nicht vorhanden | Nur Musik-Bett mit Ducking, sonst weglassen |
| Auto-Zoom | Submagic Pro | **Vorhanden** (Off/Subtle/Punchy) | Ab Werk «Subtle» |
| Brand-Kit | Submagic Pro | Templates + «Use for every new video» | Logo/Safe-Zone-Paket (Paket C5) |
| Reframe | Submagic Magic Clips | Crop/Blur, manuell verschiebbar | Gesichtsfokus lokal, optional |
| Batch | Submagic Business | Fehlt | Queue mit Template pro Clip |

---

## 6. Was mich noch stört an Gluephs

| # | Schwere | Fund | Beleg | Stelle |
|---|---|---|---|---|
| 1 | hoch | **Standard-Look wirkt blass.** «Tight» blendet jedes Wort linear von 0 auf 1 ein (0,34 s). Bei Einzelwörtern von 0,3–0,5 s ist der Text fast die ganze Zeit halbtransparent; zudem Highlight = Textfarbe, also gar kein Highlight. | Bild 02 (5,0–5,5 s des Exports), Bild 03 | `ANIM_KEYFRAMES.flash`/`ANIM_DUR` (captly.html Z. 11987–11995); Look `tight` mit `hl:'#fff'` (Z. 2035–2041) |
| 2 | hoch | **Auto-Cut bleibt für das nächste Video eingeschaltet.** Ich hatte «Cut silences» bei v2 gesetzt; bei v3 war der Haken noch an und der Export wurde ungefragt 3,8 s kürzer (19,1 → 15,3 s). Die Option liegt in der eingeklappten «Options». | Export v3, Handy-Sheet (Bild 06 rechts) | `autoCutSilence` wird nirgends zurückgesetzt, nur Z. 2242 und `onAutoCutChange` Z. 10685 |
| 3 | hoch | **9:16 für 16:9-Quellen nur im Export versteckt.** Beim Upload kommt kein Hinweis, der Editor zeigt 16:9 mit riesiger Schrift; das Format findet man nur über Export → Options → Format. Wer Podcast-Clips täglich macht, will das beim Upload wählen. | Schritt: v2 hochladen, Editor-Screenshot | `#fmtRow` im Export-Popup (Z. 1498), `setExportFormat` Z. 11377 |
| 4 | hoch | **Handy: Style-Tab überlagert die Timeline, Liste kaum nutzbar.** 375×812: Look-Karussell liegt über der Timeline-Leiste (Text «Split / Edit text / Select» scheint durch), Zeilenliste zeigt 2 Zeilen, Vorschau ca. 240 px breit. | Bild 06 | Editor-Layout `@media`-Block für `#ctrlCol`/Timeline (Mobile) |
| 5 | mittel | **Blur-Format: Untertitel sitzt auf der Kante.** Bei 16:9 → 9:16 mit Blur liegt die Position (ca. 62 %) genau am unteren Rand des scharfen Bandes; Wörter halb auf Video, halb auf Unschärfe, schlechter Kontrast. | Bild 04 unten | Positionslogik für Format `blur` (Vorschau `reframe-blur`, Z. 309/10138) |
| 6 | mittel | **Waisen-Blöcke.** Segmentierung unabhängig vom Satz: «Uhr.», «alles.», «damit», «Zweitens:» einzeln (7 von 21 Blöcken in v1 sind Einzelwörter). Look-Wechsel formt die Blöcke neu (Mix 3 Wörter, Statement 3 Zeilen). | Block-Dump v1 | `layout.wpb`/`lines` je Look (Z. 2035 ff.) |
| 7 | mittel | **Emoji/Keyword-KI nicht nachvollziehbar.** Hinweis «AI picks unavailable — using simple keyword detection» erscheint im Style-Panel, im Standard-Look bleibt aber alles weiss; ob die KI im echten Betrieb läuft, kann ich so nicht sagen. | Style-Panel Text | Z. 4595 (`warnKw`) |
| 8 | mittel | **Schriftgrösse «10px» / «22px» ohne Bezug.** Der Regler zeigt Pixelwerte, die nichts mit dem 1080-px-Export zu tun haben; Bold Pop ist im Export (ca. 60 px Kapitälchen) deutlich kleiner als ich es für Hooks wähle. | Style-Tab, Bild 05 | Size-Regler im Text-Abschnitt |
| 9 | mittel | **Bitrate/Grösse.** Export-Video 3,9 Mbit/s gegenüber 2,1 Mbit/s Quelle (10,2 MB statt 5,6 MB). Bei Auto-Cut/Blur variable Framerate (tbr 120, avg 29,9). Für Kunden mit Upload-Limits unpraktisch; VFR-Verhalten in Premiere nicht geprüft. | ffprobe v1/v2 | Export-Geometrie Z. 11230 ff. |
| 10 | mittel | **Export-Optionen nach dem Export nicht änderbar.** Direkt nach dem Download zeigt der Dialog nur «Caption another video» und «Download again» (gibt die alte Datei); wer Format/Fill noch ändern will, muss Dialog schliessen und neu öffnen. | Screenshot Saved-Zustand | Export-Popup-Zustand «Saved» |
| 11 | niedrig | **Editor nur Englisch**, obwohl Landing «Auch auf Deutsch verfügbar» einblendet; der Toast liegt zudem auf der Dropzone-Unterkante (Landing 1024×768). | Landing-Screenshot | `captly.de.html` vs. Editor |
| 12 | niedrig | **Kein Video-Trimmen, kein Batch** (bekannt, B5/C1). | – | – |
| 13 | niedrig | **Zeile anklicken springt nicht verlässlich zur Stelle** (im ersten Durchgang ja, nach «Restored your last session» nein) und das Video lief danach teils weiter. Nicht reproduzierbar genug für einen klaren Fehler. | Beobachtung | – |

---

## 7. Wo Gluephs schon besser ist

- **Kein Login, kein Wasserzeichen, kein Zwang zur E-Mail** (Export-Popup hat «Skip — download now»). CapCut verlangt im Gast-Editor schon fürs Generieren und Exportieren ein Konto, Submagic sofort.
- **Tempo:** 20-s-Reel in 3 s exportiert, lokal. Dazu «Caption another video — Keeps your style» als Dauerschleife für Serien.
- **Safe-Zone-Knopf** (Schild) mit Vorschau der gesperrten Bereiche; das habe ich bei CapCut (Gast) nicht gesehen, bei Submagic konnte ich es nicht prüfen.
- **Auto-Cut Stille/Füllwörter inklusive** (bei Submagic Pro für $23), und die Untertitel folgen dem Schnitt sauber (Bild 04).
- **Format-Optionen** 9:16/1:1/4:5/16:9 mit Crop oder Blur, per Drag verschiebbar; bei CapCut Gast nur über die Projekt-Verhältnis-Kachel.
- **Textkorrektur:** Find & Replace, Enter-Teilen, Emoji-Suche (DE/EN), Highlight pro Wort, korrigiertes Wort behält Highlight.
- **Datenschutz:** Video bleibt auf dem Gerät, nur Audio geht an die Transkription; für Kunden-Material ein echtes Argument.
- **SRT/VTT/TXT** ohne E-Mail-Gate, «Copy text» und «Caption & hashtags for your post» direkt im Dialog.

---

## 8. Top-10-Empfehlungen (Hebel gegen Aufwand)

| # | Empfehlung | Hebel | Aufwand |
|---|---|---|---|
| 1 | Standard-Look wechseln (Mix oder Bold Pop) und beim Tight-Look Fade auf ≤ 0,12 s, Highlight-Farbe ≠ Textfarbe | sehr hoch | S |
| 2 | Auto-Cut pro Video zurücksetzen und im Editor sichtbar machen (Toggle + Anzeige «−4,8 s») | hoch | S |
| 3 | Beim Upload eines 16:9-Videos fragen «Als 9:16 Reel ausgeben?» und Format in den Editor holen | hoch | S |
| 4 | Handy-Layout: Timeline standardmässig zu, Style-Sheet ohne Überlagerung, Zeilenliste grösser | hoch | M |
| 5 | Satz-/Pausenbewusste Blöcke: keine Einzelwort-Waisen, 2–4 Wörter, Satzende beendet Block | hoch | M |
| 6 | 3–4 neue Trend-Looks: Wort-Farbwechsel, Schlagwort gross/Rest klein, Gradient-Karaoke, Sticker-Emoji | hoch | M |
| 7 | Position für Blur-Format an die Videokante anpassen (oder Caption in die Mitte des Bandes) | mittel | S |
| 8 | KI-Keyword/Emoji/Hook-Titel im Standard aktivieren und Ausfall klar anzeigen | hoch | M |
| 9 | Batch/Queue mit Kunden-Template, ZIP-Export (Paket C1/B2) | sehr hoch für Kundenarbeit | L |
| 10 | Bitrate an die Quelle koppeln, konstante Framerate auch bei Auto-Cut | mittel | S–M |

---

## 9. Testgrenzen

- **Submagic:** `app.submagic.co` zeigte in drei Versuchen (zwei Minuten und später ca. 25 Minuten Abstand) nur die Anmeldung. Getestet habe ich öffentliche Seiten (Start, Preise, Untertitel-Generator-Landing). Dropzone auf der Landing nicht ausgelöst. Kein Konto angelegt, nichts eingegeben. **Login fehlte.** Alle Submagic-Angaben sind Herstellerangaben von der Preis-/Produktseite.
- **CapCut:** Gast-Editor ohne Konto. Upload von v1 ging, die Untertitel-Erzeugung und der Export verlangen Login (Bild 08). Die SRT-Import-Variante mit der Wahrheits-SRT zeigt nur Look und Editor, nicht die CapCut-Transkription; v2 und v3 habe ich dort nicht hochgeladen. Cookie-Banner abgelehnt, keine Pro-Aktion ausgelöst.
- **Gluephs:** Transkription gemockt (liefert den Wahrheitstext); Genauigkeit, Namen und Zahlen daher nicht bewertet. KI-Emoji/Keyword-Auswahl war im Mock «unavailable».
- **Synthetische Videos** (Farbverlauf, Computerstimme): keine Gesichter, daher kein Reframe-/Fokus-Test; Lesbarkeit auf echtem Bildmaterial und gegen die Plattform-UI nicht geprüft.
- **Pane-Artefakt:** In den Screenshots erschien das Videobild nach Viewport-Wechsel grau (Dekodierung laut DOM in Ordnung, `readyState` 4, Export-Frames korrekt). Looks-Kontaktbogen (Bild 01) und alle Export-Urteile stützen sich daher auf Pane-Screenshots mit Verlaufshintergrund bzw. auf ffmpeg-Frames des Exports. Die Pane war zeitweise ausgeblendet; JS-Timer liefen dann verzögert.
- **Timeline per Maus** (Drag, Trim, Mehrfachauswahl) nicht belastbar geprüft; Undo nur oberflächlich (ein Klick wirkte, Granularität nicht geprüft).
- **Handy** nur per Emulation 375×812, keine echten Touch-Gesten (Pinch, Swipe).
- **Sandbox-Eigenheit:** Die Pane teilte `localStorage` mit früheren Testern; ich habe es zu Beginn geleert. Nach Neuladen stellt Gluephs die letzte Sitzung wieder her («Restored your last session»).
- **Zeiten:** Exportzeiten stammen vom Fast-Pfad in der Pane; auf echten Handys sind sie langsamer, Cloud-Zeiten der Konkurrenz nicht gemessen.
