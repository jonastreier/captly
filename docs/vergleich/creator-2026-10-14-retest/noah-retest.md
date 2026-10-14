# Retest 14.10.2026: Noah (31, Zürich, Vollzeit-Creator, 180k)

Vorher-Stand: `../creator-2026-10-14/noah.md`. Getestet wurde Gluephs auf `http://localhost:8830/` (Mock-Server, neuer Stand) mit denselben drei Videos v1 (Reel DE), v2 (Podcast 16:9 DE), v3 (Hook EN). Desktop (1280×800) und v1 am Handy (375×812). Alle Exporte habe ich abgefangen, auf die Platte geschrieben und mit ffprobe/ffmpeg geprüft. Bilder `01-…` bis `08-…` liegen im selben Ordner. **Konkurrenz: Submagic und CapCut waren in Jonas' Chrome nicht eingeloggt**, siehe Kapitel 7.

---

## 1. Kurzurteil

- **Wechseln? Fast, aber noch nicht für den Tagesbetrieb.** Der Sprung gegenüber meinem ersten Test ist gross: Der Standard sieht jetzt sofort nach 2026 aus (Bold Pop mit Keyword-Farbe), Auto-Cut ist sichtbar und setzt sich zurück, 16:9 → 9:16 wird beim Upload angeboten, Blur sitzt richtig, der Export ist kleiner und konstant 30 fps, die Blöcke folgen Sätzen, Handy-Editor ist benutzbar, Hook-Titel, Trimmen/Ausschneiden und Templates gibt es. Für Einzelclips ist Gluephs jetzt mein erstes Werkzeug für «schnell untertiteln».
- **Was mich noch abhält:** (1) Kein Batch/Queue, bei 3–5 Reels am Tag und 4 Kunden bleibe ich für Serien bei Submagic/CapCut-Vorlagen. (2) Preview und Export stimmen bei «Gradient Karaoke» nicht überein (Vorschau schwarzer Text, Export Verlauf). (3) KI-Emoji/-Keywords konnte ich im Mock nicht beurteilen; ohne KI bleibt «Emojis an» wirkungslos. (4) Der Editor ist auf `/de` weiterhin Englisch.
- **Zahlungsbereitschaft:** unverändert CHF 8–12 pro Monat für Einzelnutzung. Mit Batch + Brand-Kit (Template ist da, Queue fehlt) bis ca. CHF 20. Mit dem jetzigen Stand würde ich bei «ab $7.99» abonnieren, wenn Transkription im echten Betrieb sauber ist (hier nicht bewertbar).
- **Nicht beurteilt:** Transkriptionsgenauigkeit (Mock), echte Handy-Touch-Gesten, Konkurrenz-Export (kein Login).

---

## 2. Vorher/Nachher (alle Punkte aus Bericht 1, Abschnitte 6 und 8)

Legende: **behoben** / **teilweise** / **nicht behoben** / **neu kaputt**.

| # alt | Thema | Status | Beleg beim Retest |
|---|---|---|---|
| 6.1 / 8.1 | Standard-Look blass, Fade, Highlight = Textfarbe | **behoben** | Standard ist jetzt Bold Pop: weiss/gelb mit Outline, Keyword-Farbe (Bild 02, Zeile 4). «Tight» blendet in 0,12 s von 35 % ein (Bild 03: ein Frame 60 ms nach Wortbeginn ist noch blass, 130 ms später voll). Tight selbst hat weiterhin kein Highlight (alles weiss), ist aber nicht mehr Standard. |
| 6.2 / 8.2 | Auto-Cut bleibt für das nächste Video an | **behoben** | v2 mit Cut an exportiert, v3 danach hochgeladen: Haken aus (`autoCutEd` false). Im Editor gibt es jetzt «Cut silences & filler words · 3.7 s possible» direkt über der Liste, und beim Anhaken «−3.7 s» plus «Output 16.9 s (−3.7 s)» in der Timeline. |
| 6.3 / 8.3 | 9:16 nur im Export versteckt | **behoben** | Beim Upload von v2 erscheint «Make this a 9:16 Reel?» mit Crop / Blur / Keep, dazu «Format»-Auswahl direkt über der Vorschau. |
| 6.4 / 8.4 | Handy-Layout überlagert, Liste unbrauchbar | **teilweise** | 375×812: Bottom-Tabs Captions / Style / Timeline, Timeline standardmässig zu, im Style-Tab keine Überlagerung mehr, Timeline-Tab mit Aktionsleiste (Split / Edit / Select / Delete / Snap / Close gaps / Cut out / Restore) und Hinweis «pinch to zoom». Es bleiben: Vorschau im Style-Tab nur ca. 180 px breit; Liste zeigt 3 Zeilen; das Toast «Auch auf Deutsch verfügbar» deckt die Look-Chips der Landing ab. |
| 6.5 / 8.7 | Blur: Untertitel auf der Kante | **behoben** | Export v2 Blur: Text liegt mitten im scharfen Band (Bild 05, obere Reihe). |
| 6.6 / 8.5 | Waisen-Blöcke, Satz-Unbewusstsein | **teilweise** | v1 mit Bold Pop: 16 Blöcke, **kein** Einzelwort-Block (SRT-Dump: «Drei Tricks,», «damit deine Reels», «mehr Views bekommen.»). Bei Looks mit 2 Wörtern (Sticker Emoji) entstehen wieder «damit», «bekommen.», «Erstens:» einzeln, bei 1-Wort-Looks naturgemäss. |
| 6.7 / 8.8 | KI-Emoji/Keyword nicht nachvollziehbar | **teilweise** | Standard: «Highlight keywords» und «Emojis» an. Bei Ausfall steht ein klarer gelber Kasten «Emojis need the AI service, which isn't reachable right now — none will appear. Try again». Echter KI-Betrieb im Mock nicht prüfbar, ohne KI erscheinen im Standard keine Emojis. |
| 6.8 | Schriftgrösse «10px» ohne Bezug | **behoben** | Regler zeigt jetzt «M 4.5%» (Anteil der Videobreite). |
| 6.9 / 8.10 | Bitrate/Grösse, VFR bei Auto-Cut | **behoben** | v1: 6,1 MB statt 10,2 MB (Quelle 5,6 MB), 30/1 konstant. v2 Crop + Auto-Cut: 5,5 MB, avg = r = 30/1 (vorher 29,9 variabel), 22,57 s. |
| 6.10 | Export-Optionen nach Export nicht änderbar | **behoben** | Nach dem Download bleibt «Options» offen; Format auf 1:1 gestellt → Vorschau springt, Button wird «Export with changes · Something changed after the last export». |
| 6.11 | Editor nur Englisch | **nicht behoben** | `/de`: Landing Deutsch, Editor (Tabs, Buttons, Texte) Englisch. |
| 6.12 | Kein Trimmen / kein Batch | **teilweise** | Trimmen (Griffe an den Timeline-Enden) und Ausschneiden (Zeile wählen → «Cut out») funktionieren, Export folgt exakt (v3: 19,1 s − 0,8 − 2,0 − 1,0 = 15,33 s, Bild 06). Batch/Queue fehlt weiter. |
| 6.13 | Zeilenklick springt nicht verlässlich | **behoben** | Klick auf Zeile 3 setzt die Vorschau auf 0:02 und zeigt die Zeile; auch nach «Restored your last session» (Handy-Test) und nach Block-Teilung. |
| 8.6 | 3–4 Trend-Looks | **behoben** | 8 neue Looks, siehe Kapitel 4. |
| 8.9 | Batch/Queue + Kunden-Template | **teilweise** | Template: «Save as template» (Chip oben im Style-Tab), Umschalter «Template ▾», auf der Landing Gruppe «My templates» + «★ Default», «your default template for every new video». Funktioniert ohne Aufwand (v2/v3 kamen automatisch im Template-Look). Queue/ZIP fehlt. |
| 5 (Best Practice) | Hook-Titel | **behoben** | Siehe 3. |
| 5 | Auto-Zoom ab Werk | **nicht behoben** | Default «Off» (hätte «Subtle» sein sollen). |
| 5 | Safe-Zone Default an | **nicht behoben** | Knopf vorhanden, standardmässig aus. |

---

## 3. Bedienung

**Mein Ablauf mit v1 (Handlungen wie ein Mensch, Klick für Klick):**
Upload (Template ist vorgewählt) → Editor sofort da, Text nach ca. 1 s (Mock-Verzögerung) → Style-Tab → «Hook title» an → Vorschlag «Drei Tricks, damit deine Reels» (der Satz wird nach vier Wörtern abgeschnitten, obwohl der ganze Satz «…mehr Views bekommen.» lautet), ich tippe «3 Tricks für mehr Views» → Captions-Tab → Zeile «mehr Views bekommen.» → Wort «Views» doppelklicken, «Klicks» tippen (Highlight wandert mit) → Cursor nach «mehr», Enter: Block teilt sauber in «mehr» / «Klicks bekommen.» → Block «Erstens: Die ersten» in der Timeline um ca. 0,1 s nach rechts ziehen: Start/Ende ändern sich auf 3,68 / 4,80 und die Zeile springt mit → Look «Big Keyword» → «Save as template» → «Kunde Meier» → Export: 6,1 MB, 20,53 s, 1080×1920, 30 fps, AAC (Bild 04).

- **Hook-Titel:** Das Overlay erscheint oben in der Safe-Zone, übernimmt Schrift und Akzentfarbe des Looks (gelber Kasten bei Big Keyword), dauert 2 s (Regler), blendet im Export aus. Schön. Einziges Manko: der Hook wiederholt oft die ersten gesprochenen Wörter («STOP SCROLLING» gross oben und «STOP SCROLLING.» als Untertitel zeitgleich, Bild 06 Frame 1–2). Wer das nicht will, muss selbst umschreiben.
- **Template-Weg:** Neu gespeichert → wird automatisch Standard. Beim nächsten Upload (v2, v3) war der Look sofort drauf, **inklusive eingeschaltetem Hook-Titel**, dessen Text aus dem neuen Video neu vorgeschlagen wird (nicht der alte). Das ist praktisch, aber überraschend, wenn man den Hook nicht will; im Template-Namen steht davon nichts.
- **Export:** «Skip — download now» (E-Mail optional) und «Skip this next time — Export downloads right away» sparen Klicks. Nach dem ersten Skip öffnet sich der Dialog beim nächsten Video direkt mit «Download video». Der ganze Weg Upload → Datei ist 3 Klicks (Upload, Export, Download).
- **Trimmen/Ausschneiden:** Griffe links/rechts an der Wellenform (Bereich wird schraffiert, «Output 16.4 s (−2.8 s)»), Ausschneiden über «Cut out» auf der gewählten Zeile (Toast «Cut out 0:04.5 – 0:05.5 — Ctrl/⌘Z to undo»). Untertitel, SRT und Export folgen dem Schnitt. Die ausgeschnittene Zeile bleibt in der Liste stehen (nur nicht im Export).
- **Auto-Cut:** Haken im Editor mit Vorschau der Zeit. Export 27,6 → 22,57 s (v2). Gut.
- **SRT:** drei Varianten, alle sauber: «Reel snippets» (kurze Blöcke), «sentences» (ganze Sätze, z. B. «Drei Tricks, damit deine Reels mehr Klicks bekommen.»), «twolines» (zwei Zeilen). Folgen meinen Korrekturen («Klicks»).
- **Handy:** siehe Tabelle 6.4. Export-Sheet unten mit grossem «Download video»-Knopf, gut erreichbar.
- **Landing:** Template-Gruppe vor den Looks, Look-Chips jetzt 13 + «+20 more in the editor». Das Toast «Auch auf Deutsch verfügbar» liegt auf der Dropzone-Unterkante/den Chips (Desktop und Handy).
- **Wiederhochladen derselben Datei:** v1 erneut hochgeladen → «Restored your last session · Re-transcribe», alte Korrekturen und Hook-Text sind wieder da. Für meinen Kunden-Alltag (gleiche Datei, neue Version) ist das praktisch, aber ohne «Neu starten»-Knopf in der Zeile sichtbar.

---

## 4. Styles

Alle 8 neuen Looks sind als Export auf dem Verlaufs-Testvideo gerendert (Bilder 01/02), an drei Zeitpunkten (1,7 s / 5,1 s / 8,3 s). Auf echtem Videomaterial können Urteile zu Kontrast anders ausfallen.

| Look | Urteil | Grund |
|---|---|---|
| **Big Keyword** | **top** | Füllwörter klein weiss, Schlagwort gross gelb (Hook «STOP / SCROLLING.»). Genau meine Beschreibung 2 aus Bericht 1. Die Zeilenhöhe passt jetzt (kleines Wort berührt das grosse nur knapp). Nachteil: Blöcke ohne Schlagwort werden klein («DRITTENS: POSTE»), und bei 9:16-Blur/Crop wirkt die Schrift im Band klein (Bild 05). |
| **Gradient Karaoke** | **top im Export, im Editor kaputt** | Export: aktives Wort mit Verlauf Gelb → Pink → Violett, Rest hell, schön (Bild 01, Zeile 1). Die Editor-Vorschau zeigt das aktive Wort aber **schwarz** (siehe 6, Punkt 1). |
| **Color Pop** | **top** | Wort-für-Wort-Farbwechsel (Gelb/Orange/Grün) mit starker schwarzer Outline und Überschwingen, Grossbuchstaben (Bild 01, Zeile 2). Meine Beschreibung 1 erfüllt. |
| **Squash Pop** | **ok** | Kräftiges Gelb/Weiss mit dicker Outline und federndem Wort (breit-flach → hoch-schmal). Mängel: Der harte Versatz-Schatten bildet unter und über der Outline eine Doppelkontur wie ein Geisterbild des Wortes (Bild 08), wirkt wie ein Glitch. |
| **Swipe Underline** | **ok** | Weisse Schrift, gelber Strich fährt unter das aktive Wort (Bild 02, Zeile 1). Sauber und ruhig, für Erklär-Reels gut; auf hellem Hintergrund ist der Strich dünn. |
| **Typewriter** | **ok** | Monospace, Buchstaben einzeln mit Cursor, Schlagwort gelb (Bild 02, Zeile 2). Genau Beschreibung 4. Nur für ruhige Inhalte; wegen Zeilenumbruch beim Tippen springt der Text in der zweiten Zeile (links ausgerichtet, erste Zeile zentriert). |
| **Sticker Emoji** | **ok** | Gelb/Weiss mit Outline, Emoji hängt direkt hinter dem Wort und poppt (Bild 07). Es ist aber **kein** «grosses Sticker-Emoji neben dem Wort», sondern nur etwas grösser als die Schrift; ohne KI (Mock) erscheinen gar keine Emojis, nur manuell (Picker mit Suche klappt). |
| **Glass Box** | **flop (auf hellem Grund)** | Milchglas-Pille mit weisser Schrift. Auf meinem hellen rosa Verlauf fast unlesbar (Bild 01, Zeile 5), auf dunklem Video sieht es gut aus. Ohne Kontrast-Absicherung (z. B. leicht abgedunkelte Pille) riskant. |

Zu den bestehenden Looks: Bold Pop (neuer Standard) und Mix tragen. Mix zeigt Wörter versetzt (erst «damit», dann «damit deine», dann Schlagwort «Reels» kursiv grün allein, dann «Reels mehr»); schick, aber der Block ist oft nur 40 % der Zeit komplett sichtbar. «Tight» ist jetzt brauchbar (Fade 0,12 s).

**Animationen:** Dauer pro Animation (Fade 0,12 s, Overshoot 0,30 s, Squash 0,32 s) statt fix 0,34 s. Overshoot und Squash gibt es als wählbares «Word pop» im Style-Tab (Pop/Punch/Lift/Fade in/Glow/Overshoot/Squash).

---

## 5. Best Practice (was fehlt noch zur Konkurrenz)

Konkurrenz-Stand weiterhin aus Bericht 1 (kein Login, siehe 7).

| Thema | Konkurrenz (laut Bericht 1) | Gluephs jetzt | Lücke |
|---|---|---|---|
| Defaults | Premium-Look, Keyword-Farbe, Zoom, Emoji ab Werk | Bold Pop, Keyword-Farbe, Emojis an (KI nötig); **Auto-Zoom aus** | Zoom «Subtle» ab Werk fehlt |
| Hook-Titel | KI (Pro) | Vorhanden, anpassbar, Look-Farbe | Vorschlag kürzt mitten im Satz; keine Varianten |
| Auto-Emoji | KI | Wirkungslos ohne KI-Dienst, Ausfall wird angezeigt | Fallback ohne KI (einfache Wort→Emoji-Tabelle) fehlt |
| Safe Zone | – | Knopf, Default aus | Default an für 9:16 |
| Trim/Cut | Ja | Ja, Export korrekt | Kein Multi-Cut per Drag (nur Zeile → Cut out) im Test |
| Format | Magic Clips | 9:16 mit Crop/Blur, Hinweis beim Upload | Kein Gesichts-Fokus |
| Brand-Kit | Pro | Templates, Default, Export mit Schrift | Kein Logo/Wasserzeichen-Overlay |
| Batch | Business | Fehlt | Queue + ZIP |
| B-Roll / Musik / SFX | Ja | Fehlt | bewusst offen |
| Sprache im Editor | Mehrsprachig | Englisch auf `/de` | Übersetzung Editor |

---

## 6. Was mich noch stört

| # | Schwere | Fund | Reproduktionsweg | Stelle in `captly.html` |
|---|---|---|---|---|
| 1 | **hoch** | **Gradient Karaoke: Vorschau ≠ Export.** In der Editor-Vorschau erscheint das aktive Wort (und Schlagwörter) **schwarz** mit Unschärfe, im exportierten MP4 ist es ein Farbverlauf. Ursache: `background-clip:text` + `-webkit-text-fill-color:transparent` zusammen mit `text-shadow`; der Schatten schimmert durch die transparente Füllung und deckt den Verlauf ab (berechnet: `color rgb(29,31,32)`, `text-fill transparent`, Schatten `0 0 1.5px rgba(0,0,0,.9)`). Gleiches gilt für alle Looks mit Textverlauf (`hlg`/`tg`). | Datei hochladen → Style → «Gradient Karaoke» → Video auf 5,3 s: aktives Wort schwarz. Export-Frame bei 5,1 s: Gelb→Violett. | `wordHtml()` in der Overlay-Erzeugung, Z. 4423–4450 (`s.hlg`/`s.tg` gleichzeitig mit `text-shadow:` Z. 4435/4446/4451); Schatten bei Verlaufswörtern weglassen oder per `filter:drop-shadow` auf dem Wrapper. |
| 2 | **mittel** | **Glass Box ist auf hellen Videos unlesbar** (weisse Schrift auf milchweisser Pille, kein Kontrast). | Look «Glass Box» wählen, helles Video oder Verlauf. | Look-Definition `glassbox` in `styles.json`. |
| 3 | **mittel** | **Squash Pop: Geisterbild-Schatten.** Unter und über der schwarzen Outline erscheint eine zweite, gestauchte Kopie des Wortes. | Look «Squash Pop», Export, Frame bei 8,3 s (Bild 08). | Look `xsquashpop` in `styles.json` (Schatten/Outline-Kombination), Zeichnen in `drawCaptionsOnCtx` Z. 13764 ff. |
| 4 | **mittel** | **«Emojis» standardmässig an, aber ohne KI nichts sichtbar.** Der Hinweis ist ehrlich, aber der Look «Sticker Emoji» (neu) verspricht Emoji; ohne KI-Dienst bleibt er ein gelber Pillentext. Kein lokaler Fallback. | Sticker Emoji wählen, Mock ohne `/api/enhance`: kein Emoji. | KI-Aufruf `/api/enhance`, Status-Text im Style-Panel («Emojis need the AI service…»). |
| 5 | **mittel** | **Template übernimmt «Hook-Titel an» automatisch** für jedes neue Video, ohne dass das im Template-Namen steht. Erster Upload nach dem Speichern zeigt sofort einen Hook-Kasten. | Look mit Hook speichern → «Save as template» → neues Video hochladen. | Template-Speicherung `saveTemplate()` (Style-Feld `hook`). |
| 6 | **mittel** | **Handy: Vorschau im Style-Tab nur ca. 180 px breit**, Liste zeigt 3 Zeilen; Toast «Auch auf Deutsch verfügbar» überdeckt Chips/Dropzone der Landing. | 375×812, Upload → Style-Tab; Landing scrollen. | `@media`-Block des Editor-Layouts (mobile), Toast `langToast` auf der Landing. |
| 7 | **mittel** | **Editor auf `/de` weiterhin Englisch** (Tabs, Buttons, Hinweise). | `http://localhost:8830/de` → Video hochladen. | `captly.de.html` vs. Editor-Texte (nur Landing übersetzt). |
| 8 | **niedrig** | **Auto-Zoom und Safe-Zone nicht ab Werk** (Zoom Off, Schild aus). | Frischer Start, Style-Tab «Auto zoom». | Standard-Style in `styles.json` / `autoZoom`. |
| 9 | **niedrig** | **Hook-Vorschlag schneidet mitten im ersten Satz** («Drei Tricks, damit deine Reels» statt des ganzen Satzes). Ein Test in v3 («Stop scrolling.») ergab sauber den ganzen Satz. | v1 hochladen → Hook title einschalten → Textfeld. | Hook-Vorschlag-Funktion (Commit 48f7180). |
| 10 | **niedrig** | **Typewriter: Zeilen springen** (erste Zeile zentriert, zweite linksbündig mit Cursor). | Look «Typewriter», 5,1 s. | Look `typewriter` (`motion:'type'`). |
| 11 | **niedrig** | **Ausgeschnittene Zeile bleibt in der Liste**, wirkt wie noch aktiv (nur im Export weg). | v3: Zeile «Most creators put» wählen → «Cut out». | Cut-out-Logik Timeline, Listenaufbau. |
| 12 | **niedrig** | **Dasselbe Video erneut hochladen stellt die alte Sitzung wieder her** (inkl. altem Hook-Text), ohne Wahl «Neu». | v1 nach Edit nochmal hochladen. | `Restored your last session`, Z. 10136. |
| 13 | **niedrig** | **Look-Wechsel formt Blöcke neu, 2-Wort-Looks erzeugen Einzelwort-Blöcke** («damit», «bekommen.», «Erstens:»). | v1 → Sticker Emoji → Captions-Tab. | `layout.wpb` je Look. |

Beobachtungen, die ich **nicht** als Fehler werte: Im Mock sind alle SRT-/Editorzeiten gegenüber der Wahrheits-JSON um ca. 80 ms später (z. B. «Erstens:» 3,678 statt 3,598 s, erstes Wort 0,417 statt 0,337 s). Ob das vom Mock oder von einem Zeitversatz im Editor kommt, konnte ich nicht klären. Wenn es im Editor liegt, wäre das ein Fehler (Untertitel 80 ms zu spät); bitte gegen die echte Transkription prüfen.

---

## 7. Konkurrenz

**Nicht eingeloggt, deshalb kein Vergleichstest.**
- `app.submagic.co` leitet auf `/login` weiter (Anmeldung mit Google/E-Mail, «Noch kein Konto? Hier registrieren»).
- `capcut.com/editor` öffnet einen Dialog «Willkommen bei CapCut» (Weiter mit Google/E-Mail/TikTok/Facebook).
Nichts eingegeben, kein Konto angelegt, nichts hochgeladen. Alle Konkurrenz-Aussagen in diesem Bericht stammen aus Bericht 1 (öffentliche Seiten, Gast-Editor).

---

## 8. Top-Empfehlungen (Hebel / Aufwand)

| # | Empfehlung | Hebel | Aufwand |
|---|---|---|---|
| 1 | Gradient-Karaoke-Vorschau reparieren (kein `text-shadow` bei `background-clip:text`) und Vorschau-/Export-Vergleich für alle Verlauf-Looks als Test | hoch | S |
| 2 | Auto-Zoom «Subtle» und Safe-Zone an im Standard für 9:16 | mittel | S |
| 3 | Glass Box mit Mindestkontrast (dunklere Pille/Rand) und Squash-Pop-Schatten entschärfen | mittel | S |
| 4 | Template-Dialog mit Haken «Hook-Titel mitspeichern», Anzeige was gespeichert wird | mittel | S |
| 5 | Lokaler Emoji-Fallback ohne KI (Wortliste), damit «Emojis an» immer etwas tut | hoch | M |
| 6 | Batch/Queue mit Template pro Clip, ZIP-Export | sehr hoch für Kundenarbeit | L |
| 7 | Editor auf `/de` übersetzen | mittel | M |
| 8 | Handy: Vorschau im Style-Tab grösser (Style-Panel als halbhohes Sheet) | mittel | M |
| 9 | Hook-Vorschlag immer ganzer erster Satz, optional drei Varianten | niedrig | S |
| 10 | Klärung 80-ms-Zeitversatz (Editor oder Mock) | hoch falls echt | S |

---

## 9. Testgrenzen

- **Mock:** Transkription liefert den Wahrheitstext, KI-Anreicherung (`/api/enhance`) nicht verfügbar. Genauigkeit, Namen («Sandra Meier», «Winterthur», «Klartext Business» wurden korrekt geliefert, aber das ist Mock) nicht bewertet; Emojis nur manuell getestet.
- **Konkurrenz:** weder Submagic noch CapCut eingeloggt, kein Vergleich möglich (Kapitel 7).
- **Browser-Pane:** Die Pane ist schmal (ca. 404 px) und rechnet 1280×800 per Emulation herunter. Mausklicks landeten dabei zunächst um Faktor 5 versetzt; ich habe die Koordinaten umgerechnet und die Wirkung per Screenshot geprüft. Das Zurücksetzen der Emulation zwischendurch erzwang mehrfaches Neu-Setzen. Einige Schritte (Look-Wechsel in der Schleife, Export-Start) habe ich per JS-Aufruf der Seitenfunktionen ausgelöst und mit Klicks gegengeprüft; die Zeitmessung «3 s Export» stammt aus diesen Läufen.
- **Landing-Zwischenstand:** Beim ersten Laden zeigte der Browser eine zwischengespeicherte ältere Landing («24 caption styles»); nach Neuladen stimmt die Quelle (`One video. 30+ caption styles.`). Das habe ich nicht als Fehler gezählt.
- **Synthetische Testvideos** (Verlauf, Computerstimme): kein Gesichts-/Fokus-Test, Kontrast (z. B. Glass Box) auf echtem Material anders.
- **Nicht getestet:** Template-Export/-Import als Datei (inkl. Schrift), Undo-Granularität, Pinch/Swipe auf echtem Handy, Mehrfach-Cuts per Mehrfachauswahl, Handy-Export-Download (nur Sheet angesehen), Safe-Zone-Overlay in dieser Runde.
- **Bilder:** 8 JPEGs (≤ 112 KB). Editor-Screenshots der Pane wurden nicht gespeichert; alle Bilder sind Frames der exportierten MP4.
