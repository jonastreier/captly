# Runde 3, 14.10.2026: Noah (31, Zürich, Vollzeit-Creator, 180k)

Vorgänger: `../creator-2026-10-14/noah.md` (Runde 1) und `../creator-2026-10-14-retest/noah-retest.md` (Runde 2).
Getestet wurde Gluephs auf `http://localhost:8851/` (EN) und `/de` (Mock-Server, neuer Stand) mit v1 (Reel DE), v2 (Podcast 16:9 DE), v3 (Hook EN). Desktop 1280×800, Handy 375×812, für die Kontur-Probe 1000×700 und 1700×950. Zusätzlich habe ich **ein eigenes Testvideo `v1-light`** gebaut (v1-Ton, Hintergrund hellcreme statt Verlauf), um Glass Box auf wirklich hellem Grund zu prüfen. Bilder `01-…` bis `09-…` im selben Ordner (9 JPEGs, alle unter 120 KB). **Submagic und CapCut waren nicht eingeloggt**, siehe Kapitel 7.

Wichtig zur Methode (Details in Kapitel 9): Die Exporte konnte ich nicht als Datei auf die Platte schreiben (der Empfangsserver dafür wurde vom Berechtigungssystem abgelehnt). Stattdessen habe ich jedes exportierte MP4 im Browser aufgebrochen (Dauer, Bildrate, Grösse, Spuren aus den MP4-Boxen) und die Frames per `<video>`/Canvas dekodiert und vermessen. Das ersetzt `ffprobe`, ist aber kein Ersatz für Premiere-Test oder Abspielen in Instagram.

---

## 1. Kurzurteil

- **Wechseln? Für Einzel-Reels und Podcast-Ausschnitte: ja, Gluephs ist ab jetzt mein erstes Werkzeug. Für meinen Tagesbetrieb mit 3–5 Reels und 4 Kundenmarken: noch nicht, weil Batch/Queue fehlt.** Alles, was ich in Runde 2 als «hoch» oder «mittel» im Look- und Editor-Bereich gemeldet hatte, ist behoben oder sauber messbar besser (Tabelle in Kapitel 2: 12 Punkte behoben, 1 als Mock-Artefakt geklärt, 4 teilweise, 1 offen).
- **Was neu überzeugt (mit Messwert):** Gradient Karaoke zeigt das aktive Wort in Vorschau und Export als Verlauf (nicht mehr schwarz); Glass Box hat auf hellcremem Grund 6,25:1 Kontrast (weisse Schrift auf dunkelgrauer Pille, vorher unlesbar); Squash Pop hat im 780-px-Zoom nur noch eine Kontur, kein Geisterbild; Emojis erscheinen ohne KI (3 in v1, 2 in v3); Kontur ist in 1000- und 1700-px-Fenster gleich dick (Kontur-Pixel 27 627 vs. 27 870, Color Pop 20 534 vs. 20 535); Editor auf `/de` ist durchgehend deutsch; Handy-Style-Vorschau ist 245 px statt 180 px breit.
- **Was mich noch abhält:** (1) **Kein Batch/Queue** (hoch). (2) **Blur-Format: 7 von 21 Untertitel-Blöcken (alle Einzeiler) sitzen unterhalb des scharfen Bands**, Vorschau = Export (mittel). (3) **Bei 2-Wort-Looks bleiben viele Einzelwort-Blöcke** (Color Pop 27 von 34, Squash Pop 15 von 28) (mittel). (4) KI-Teil (Emoji/Keywords/Hook per KI) bleibt im Mock unbeurteilbar.
- **Zahlungsbereitschaft:** unverändert **CHF 8–12 pro Monat** für Einzelnutzung, **bis ca. CHF 20** mit Batch + Brand-Kit (Template ist da, Queue fehlt). Mit dem jetzigen Stand würde ich bei «ab $7.99» abonnieren, sobald die echte Transkription sauber läuft (hier nicht bewertbar).
- **Nicht beurteilt:** Transkriptionsgenauigkeit (Mock), KI-Auswahl, echte Handy-Gesten, Konkurrenz-Export.

---

## 2. Vorher/Nachher (alle offenen Punkte aus Runde 2, Abschnitte 2, 4, 6, 8)

Legende: **behoben** / **teilweise** / **nicht behoben** / **neu kaputt**. Keine neuen Regressionen gefunden (Kapitel 6 enthält nur Funde, die auch Runde 2 hätten treffen können).

| # alt | Thema | Status | Beleg Runde 3 |
|---|---|---|---|
| R2-6.1 / 4 | Gradient Karaoke: Vorschau ≠ Export (aktives Wort schwarz) | **behoben** (kleiner Rest) | Vorschau 5,3 s: «Sekunden» Verlauf Gelb → Rosa, nicht mehr schwarz; Export-Frame zeigt denselben Verlauf (Bild 01). **Rest:** Nicht aktive Wörter sind in der Vorschau deutlich blasser (hellster Pixel ca. 148 vs. 232 im Export), in der Vorschau wirkt «zwei» grau, im Export weiss. |
| R2-6.2 | Glass Box auf hellem Grund unlesbar | **behoben** | Export auf `v1-light` (Hintergrund RGB 234/228/211): Pille RGB 98/96/95, weisser Text, **Kontrast 6,25:1** (Bild 02). Auf dem Verlauf-Video ebenfalls dunkle Pille, lesbar. |
| R2-6.3 | Squash Pop: Geisterbild-Schatten | **behoben** | Export-Frame 8,36 s auf 780 px vergrössert: eine Kontur, weicher Fallschatten, keine zweite gestauchte Kopie (Bild 03). Zusätzlich 6 Frames (8,3 / 8,4 / 8,5 / 8,62 / 5,3 / 5,45 s) geprüft. |
| R2-6.4 | Emojis ohne KI wirkungslos | **behoben** | Ohne `/api/enhance` setzt der lokale Fallback v1: 3 Emojis in 28 Blöcken (Glühbirne bei «Tricks», Wecker bei «Sekunden», Klappe bei «Video»), v3: 2 in 17 (Wecker «time.», Klappe «video»). Hinweis im Style-Tab: «Simple emoji picks — AI picks when available (AI service not reachable right now). Try again». Sticker Emoji zeigt das Emoji hinter dem Wort (Bild 04). |
| R2-6.5 | Template übernimmt «Hook an» automatisch | **behoben** | Template «Kunde Meier» mit eingeschaltetem Hook gespeichert, Häkchen «Include hook title» **aus** → im Template `hook:{on:false}`; v2 und v3 danach ohne Hook. Template «Mit Hook» (Häkchen an) zeigt in der Kachel **«Hook on»** (Bild 09). |
| R2-6.6 | Handy: Vorschau im Style-Tab 180 px, Liste 3 Zeilen, Toast | **teilweise** | 375×812: Style-Tab Vorschau **245×433 px** (vorher ca. 180), Timeline-Tab 188×331, aber **Captions-Tab nur 129×227 px**. Zeilenliste: 4 Zeilen sichtbar nach Schliessen des Tipps (3 mit Tipp). Landing-Toast erscheint am Handy erst, wenn die Upload-Karte weggescrollt ist (kein Verdecken mehr). Am Desktop (1280×800) sitzt der Toast weiterhin auf der letzten Look-Chip-Reihe. |
| R2-6.7 | Editor auf `/de` Englisch | **behoben** | Statischer Text-Scan (962 Strings): nur Eigennamen/Lehnwörter bleiben englisch (Style-Namen, «Template», «Style», Schriftnamen). Tabs, Tipps, Export-Blatt, Toasts, Statuszeilen deutsch (Kapitel 3, Bild 05). |
| R2-6.8 | Auto-Zoom und Safe-Zone nicht ab Werk | **behoben** | Frische Sitzung: `emZoom = 'subtle'`, `showSafeZone = true` (Rahmen sichtbar). Zoom im Export wirksam: v2-Frame 12,4 s mit/ohne Zoom Differenz 1,49 (Mittel/Kanal), Frame 3,0 s ohne Zoommoment 0,00. Bei 16:9-Original ist die Safe-Zone aus, bei 9:16 an (sinnvoll). |
| R2-6.9 | Hook-Vorschlag schneidet mitten im Satz | **behoben** | v1: «Drei Tricks, damit deine Reels mehr Views bekommen» (8 Wörter, ganzer Satz). v2: «Willkommen zurück bei Klartext Business» (5). v3: «Stop scrolling» (2, Punkt entfernt). Maximum 8 Wörter in allen drei. |
| R2-6.10 | Typewriter: Zeilen springen | **behoben** | 15 Export-Frames 4,85–5,55 s: linke Textkante 336–340 px (± 4 px), Zeilen stehen fest, nur der Text wächst (Bild 04). |
| R2-6.11 | Ausgeschnittene Zeile wirkt aktiv | **behoben** | Zeile grau, Beschriftung «Cut out — not in the video» mit Knopf «Restore», Timeline schraffiert, «Output 18.1 s (−1.0 s)». Restore bringt die Zeile zurück (`.cap-seg.cut` 1 → 0). Export 19,133 → **18,1 s** (Bild 07). |
| R2-6.12 | Alte Sitzung ohne Wahl «Neu» | **behoben** | Dieselbe Datei erneut: Status «Restored your last session · Re-transcribe», Korrektur «captions way too low,» ist zurück, Knopf **«Start fresh»** bleibt stehen und verwirft die Korrektur (Text wieder «captions too low,»). Andere Datei danach: frisch. |
| R2-6.13 | Einzelwort-Blöcke bei 2-Wort-Looks | **teilweise** | v1: Bold Pop, Big Keyword, Gradient, Glass, Typewriter, Statement 0 Einzelwörter. **Sticker Emoji 10/25, Squash Pop 15/28, Color Pop 27/34, Swipe Underline (3 Wörter) 5/23, Mix 2/20.** Ursache: Zeichenlimit pro Zeile (Color Pop 10 Zeichen; «DAMIT DEINE» hat 11). |
| R2-6.14 (neu in R3: Konturdicke) | Kontur unabhängig von Fensterbreite | **behoben** | Export aus 1000-px- und 1700-px-Fenster (Vorschaubreite 221 vs. 361 px) bei 5,3 s: Bold Pop dunkle Kontur-Pixel **27 627 vs. 27 870** (0,9 %), Color Pop **20 534 vs. 20 535**, Textbox gleich ±1 px. Mehrfach-Export im selben Fenster: 0 abweichende Pixel. |
| R2-Beobachtung | 80 ms Zeitversatz Editor vs. Wahrheits-JSON | **geklärt: Mock-Artefakt** | Konstant +0,080 s auf allen Wörtern. Ursache: Der Editor schneidet führende Stille per Sprach-Erkennung ab (erster Sprachbereich beginnt bei 0,08 s) und rechnet die Wortzeiten über diese Spur zurück. Der Mock liefert aber schon Original-Zeiten und nicht Spur-Zeiten, deshalb wird 0,08 s doppelt addiert. Mit einer echten Transkription nicht reproduzierbar, ich werte es nicht als Fehler. |
| R2-6.12 | Kein Batch/Queue | **nicht behoben** | Weiter nur Einzelvideo; «Caption another video» behält den Style. |
| R2-8.9 | Template ist da, Queue/ZIP fehlt | **teilweise** | Template (Standard, «Use for every new video») funktioniert; Queue/ZIP fehlt. |
| R2-5 | Blur-Position (in R2 «behoben») | **teilweise** | Zweizeiler sitzen im Band, **Einzeiler unterhalb** (Kapitel 6, Punkt 2). In R2 nur ein Zweizeiler geprüft. |

Zusätzlich geprüft, ohne Befund: Auto-Cut setzt sich pro Video zurück (nach v2 mit Cut ist beim nächsten Upload der Haken aus); 16:9-Hinweis «Make this a 9:16 Reel?» beim Upload; Trimmen/Cut-out-Export korrekt; Undo/Redo nach Cut-out (`.cap-seg.cut` 1 → 0 → 1); Hook im Export (2 s, danach weg, Bild 09); Konsole zeigt nur die erwarteten 404 des Mocks (`/api/enhance`, `/api/polish`, `/api/stat`, `/api/plan`).

---

## 3. Bedienung

**Ablauf v1 (Klick für Klick, Desktop):** Upload (Dateiauswahl = 1) → Editor sofort offen, Text nach der Mock-Verzögerung → Style-Tab → Look → «Hook title» → Zeile anklicken, Wort doppelklicken → «Save as template» → Export → «Skip — download now»: **3 Klicks bis zur Datei** (Upload, Export, Download), bei «Skip this next time» direkt Download.

**Exportwerte (aus den MP4-Boxen, Exportzeit = Start bis Blob):**

| Video / Einstellung | Auflösung | Bildrate | Dauer | Grösse | Zeit |
|---|---|---|---|---|---|
| v1, Gradient Karaoke | 1080×1920 | 30,0 konstant | 20,533 s | 6,09 MB | 3,6 s |
| v1, Glass Box | 1080×1920 | 30,0 konstant | 20,533 s | 6,34 MB | 3,8 s |
| v1, Big Keyword + Hook | 1080×1920 | 30,0 konstant | 20,533 s | 6,15 MB | unter 6 s |
| v1, Color Pop | 1080×1920 | 30,0 konstant | 20,533 s | 6,22 MB | unter 6 s |
| v2, Blur | 1080×1920 | 30,0 konstant | 27,6 s | 6,48 MB | unter 6 s |
| v2, Crop + «Cut silences» | 1080×1920 | 30,0 konstant | 22,567 s (Vorschau «−5,0 s») | 5,79 MB | unter 6 s |
| v3, ein Cut-out | 1080×1920 | 30,0 konstant | 18,1 s (19,133 − 1,0) | 4,25 MB | unter 6 s |

Quelle v1 5,6 MB. Der Audiospur-Teil ist bei v1 19,68 s lang (wie in der Quelle), nicht 20,53 s; das ist kein Exportfehler.

**Editor auf `/de`:** Tabs «Untertitel / Style», Zeitleiste «Einrasten», «Lücken schliessen», «Teilen», «Ausschneiden», «Wiederherstellen»; Tipp «Zeile anklicken, um ein Wort zu korrigieren — Enter teilt sie, ⌫ am Anfang verbindet.»; Export-Blatt «E-Mail für deinen kostenlosen Download (optional)», «Überspringen — jetzt herunterladen», «Video herunterladen · MP4 · 1080p · ohne Wasserzeichen», «Gespeichert — v1-reel-de-gluephs.mp4», «Weiteres Video untertiteln · Dein Style bleibt erhalten», «Nochmals herunterladen», «Text & Hashtags für deinen Beitrag · Schreiben»; Toasts «Untertitel fertig — korrigiere Wörter, dann exportiere.», «0:04.5 – 0:05.5 ausgeschnitten — Rückgängig mit Ctrl/⌘+Z»; Status «Deine letzte Sitzung wurde wiederhergestellt · Neu transkribieren» mit Knopf «Neu starten»; Hinweis «Einfache Emoji-Auswahl – KI-Auswahl, sobald verfügbar (KI-Dienst gerade nicht erreichbar). Nochmals versuchen»; Wort-Pop «Anheben / Weich einblenden / Leuchten / Überschwingen / Stauchen». **Urteil: klingt natürlich**, Schweizer Schreibweise (Grösse, schliessen, Dezimalpunkt «18.1 s»). Kleinigkeiten: Die Option «‹-gluephs› an Dateinamen anhängen» wirkt mit den spitzen Klammern wie Code; «Black» (Schriftschnitt) und «Style» bleiben englisch.

**Template-Weg:** Speichern fragt Name und «Include hook title» (Standard aus, auch wenn der Hook gerade an ist). Danach ★ Standard; nächster Upload kommt im Look, **ohne** Hook. Mit Häkchen steht «Hook on» in der Kachel, und der Hook-Text wird pro Video neu vorgeschlagen.

**Hook-Titel:** Overlay oben (Safe-Zone), Farbe/Schrift des Looks, 2 s, blendet aus (Bild 09). Weiter gilt: der Hook wiederholt die ersten gesprochenen Wörter, in v3 steht «STOP SCROLLING» oben und «STOP SCROLLING.» als Untertitel gleichzeitig.

**Cut-out:** Zeile wählen (Cut-out-Knopf wird mit kurzer Verzögerung aktiv), «Cut out», Toast, Zeile bleibt als grau markierter Eintrag mit «Restore» stehen, Output-Dauer in der Zeitleiste. Auto-Cut markiert Zeilen am linken Rand orange («Partly cut out — only some words stay in the video»).

**Handy 375×812:** Bottom-Tabs Captions / Style / Timeline. Style: grosse Vorschau (245 px) mit Look-Karussell darunter, Export-Knopf oben rechts. Timeline: Aktionsleiste (Split, Edit t…, Select, Delete, Snap, Close…, Cut out, Restore), Hinweis «Tap a caption to adjust it · swipe to scrub · pinch to zoom»; die Beschriftungen «Edit t…» und «Close…» sind abgeschnitten (Bild 06).

---

## 4. Styles

Alle Looks auf Verlauf-Video (v1) und, wo nötig, auf `v1-light` gerendert und vermessen.

| Look | Urteil | Grund / Messwert |
|---|---|---|
| **Gradient Karaoke** | **top** (Vorschau jetzt ok) | Aktives Wort Verlauf Gelb → Rosa → Violett, Rest hell, 2 Zeilen, Export und Vorschau stimmen beim Verlauf überein (Bild 01). Rest: inaktive Wörter in der Vorschau blasser als im Export. |
| **Glass Box** | **ok, jetzt lesbar** | Dunkle Milchglas-Pille: 6,25:1 auf Cremeweiss; auf Verlauf ebenfalls sauber (Bild 02). |
| **Squash Pop** | **ok** | Dicke Kontur, federndes Wort, kein Geisterbild mehr (Bild 03). 15 von 28 Blöcken sind Einzelwörter. |
| **Sticker Emoji** | **ok** | Emoji hinter dem Wort, poppt. Aber **nur wenig grösser als die Schrift**, nicht «gross neben dem Wort» (Bild 04). 10 von 25 Blöcken einzeln («damit», «bekommen.», «Erstens:» …). |
| **Typewriter** | **ok** | Monospace, Cursor, Schlagwort gelb; Zeilen springen nicht mehr (Bild 04). Text steht beim Tippen links in der Endbreite des Blocks, wirkt am Anfang nach links versetzt. |
| **Color Pop** | **top, aber Einzelwörter** | Wort-für-Wort-Farbwechsel (Rosa, Grün, Weiss, Gelb), dicke schwarze Kontur. In v1 sind 27 von 34 Blöcken **ein Wort allein**; das wirkt wie «One Word» statt «2 Wörter». |
| **Big Keyword** | **top** | Füllwörter klein weiss, Schlagwort gross gelb; 16 Blöcke, 0 Einzelwörter; mit Hook-Kasten darüber sauber (Bild 09). |
| **Swipe Underline** | **ok** | Nicht neu geprüft; 5 von 23 Blöcken einzeln. |
| **Bold Pop** (Standard) | **trägt** | 16 Blöcke, 0 Einzelwörter, Kontur im Export unabhängig vom Fenster. |
| **Tight** | **ok** | 1-Wort-Look, naturgemäss 27 von 34 einzeln. |

**Animationen/Vorschau = Export:** Verlauf-Wort (Gradient) und Kontur (Bold Pop, Color Pop) stimmen überein; Preview-Positionen der Blur-Blöcke stimmen mit dem Export überein (0,69–0,74 vs. 0,70–0,73 der Höhe), die Abweichung ist also konsistent, kein Vorschau-Fehler.

---

## 5. Best Practice

Konkurrenz-Stand weiterhin aus Bericht 1 (kein Login, Kapitel 7).

| Thema | Konkurrenz (laut Bericht 1) | Gluephs jetzt | Lücke / Empfehlung |
|---|---|---|---|
| Defaults | Premium-Look, Keyword-Farbe, Zoom, Emoji ab Werk | Bold Pop, Keyword-Farbe, Emojis (lokal), **Zoom Subtle**, **Safe-Zone an bei 9:16** | Zoom und Safe-Zone sind jetzt da. Fehlend: KI-Qualität (unbeurteilbar). |
| Emoji ohne KI | KI | Lokale Wortliste, höchstens jeder 3. Block, Abstand ≥ 2 Blöcke: 3 Emojis in 20 s | Ehrlich gekennzeichnet; etwas wenig für Kurz-Reels, gern 1 Emoji mehr pro 20 s zulassen. |
| Hook-Titel | KI (Pro) | Vorhanden, ≤ 8 Wörter, per Häkchen im Template | Wiederholt die erste Untertitelzeile; Variante «zweiter Satz» anbieten. |
| Safe Zone | – | Standard an (9:16) | Blur-Format: Einzeiler müssten ins Band. |
| Trim/Cut | Ja | Ja, Export korrekt, Markierung + Restore | Multi-Cut per Drag nicht geprüft. |
| Format | Magic Clips | Crop/Blur, Hinweis beim Upload | Kein Gesichtsfokus. |
| Brand-Kit | Pro | Templates, ★ Standard, «Hook on»-Kennzeichnung | Kein Logo-Overlay. |
| Batch | Business | **Fehlt** | Queue + ZIP bleibt mein wichtigster Wunsch. |
| Sprache im Editor | Mehrsprachig | **Deutsch vollständig** | Nur Kleinigkeiten (Kapitel 3). |
| Handy | App/Web | Style-Tab gross, Captions-Tab klein | Captions-Tab: Vorschau ausblendbar oder Mini-Vorschau oben fixiert. |

---

## 6. Was mich noch stört

| # | Schwere | Fund | Beleg | Reproduktion |
|---|---|---|---|---|
| 1 | **hoch** | **Kein Batch/Queue.** Bei 3–5 Reels am Tag und 4 Kunden muss ich jede Datei einzeln hochladen und exportieren (3 Klicks pro Clip, plus Template wählen). | Bekannt (C1/B2), unverändert. | Zwei Videos nacheinander: «Caption another video» behält nur den Style. |
| 2 | **mittel** | **Blur-Format: Einzeiler sitzen unterhalb des scharfen Bands.** 7 von 21 Blöcken von v2 (alle Einzeiler: «über Preise», «Ihr wichtigster», «keine Stunden,», «Und wenn ein», «hintereinander», «zu tief.», «für deine Zeit,»). Zweizeiler sind mittig im Band (Unterkante 0,64 der Höhe), Einzeiler bei 0,69–0,74 (Band endet bei ca. 0,66, also Text auf unscharfem/dunklem Teil). Im Crop-Format sind beide bündig (Unterkante 0,68). Vorschau = Export. | Bild 08 (Export-Frames 0,5 / 10,0 / 22,0 s); Vermessung 21 Blöcke Vorschau. | v2 hochladen → «Blur» → Zeitleiste auf 10 s. |
| 3 | **mittel** | **Bei 2-Wort-Looks viele Einzelwort-Blöcke:** Color Pop 27/34 (79 %), Squash Pop 15/28 (54 %), Sticker Emoji 10/25 (40 %). Ursache Zeichenlimit pro Zeile (Color Pop 10); «DAMIT DEINE» passt nicht. Bei 1080 px Breite wäre viel mehr Platz. | Block-Dump je Look; `capAutoChars()` = 10. | v1 → Color Pop → Captions-Tab. |
| 4 | niedrig | **Gradient Karaoke: Nicht aktive Wörter in der Vorschau blasser als im Export** (hellster Pixel ca. 148 vs. 232). Der Verlauf selbst stimmt. | Bild 01 («zwei» grau in der Vorschau, weiss im Export). | Gradient Karaoke → Vorschau 5,3 s gegen Export-Frame. |
| 5 | niedrig | **Hook wiederholt die erste Untertitelzeile** (v3: «STOP SCROLLING» oben und «STOP SCROLLING.» unten zugleich). Schlägt kein Alternativ-Hook vor. | Bild 09 / v3-Editor. | v3 → «Hook title». |
| 6 | niedrig | **Sticker Emoji ist nicht «gross»:** das Emoji ist nur etwas grösser als die Schrift und hängt hinter dem Wort. | Bild 04 oben. | Sticker Emoji → Export. |
| 7 | niedrig | **Handy-Captions-Tab: Vorschau nur 129 px**, 4 Zeilen sichtbar (nach Schliessen des Tipps), «Edit t…»/«Close…» in der Zeitleiste abgeschnitten. | Bild 06; Messung per JS. | 375×812 → Captions / Timeline. |
| 8 | niedrig | **Desktop-Landing: Toast «Auch auf Deutsch verfügbar» deckt die letzte Look-Chip-Reihe** bei 800 px Höhe (Toast y 742–784 px, darunter `hc-chip`). Am Handy gelöst. | `elementsFromPoint` an Toast-Rand. | `/` bei 1280×800. |
| 9 | niedrig | **Emoji-Fallback ist dünn:** 3 Emojis in 20 s, v3 nur 2, immer die gleichen Motive (Wecker, Klappe, Glühbirne). KI-Auswahl nicht prüfbar. | Emoji-Dump je Video. | v1/v3 Emojis auflisten. |
| 10 | niedrig | **Typewriter: Text beginnt links** in der Endbreite des Blocks statt zentriert zu wachsen; wirkt zu Beginn nach links verschoben. Stabil, aber nicht mittig. | Bild 04 unten (Frames 4,3 / 4,6 / 4,9 s). | Typewriter → Export. |
| 11 | niedrig | **Kleinkram DE:** «‹-gluephs› an Dateinamen anhängen» mit spitzen Klammern; verwaister Knopf «Start fresh» bleibt nach Gebrauch unsichtbar im DOM. | Bild 05. | `/de` → Export-Blatt. |

Beobachtungen, die ich nicht als Fehler zähle: Nach einem Export zeigt die Editor-Vorschau bei 0:00 zeitweise ein graues Bild, bis man einmal sucht (`readyState` 4, Frame nach Seek korrekt); das ist das bekannte Pane-Artefakt aus Runde 1. Die zwei Blobs je Export sind Quell- und Ausgabedatei.

---

## 7. Konkurrenz

**Nicht eingeloggt, deshalb kein Vergleichstest.** Geprüft in Claude in Chrome mit eigenem Tab (danach geschlossen):
- `https://app.submagic.co/` leitet auf `/login` weiter («Anmelden», Google, E-Mail/Passwort, «Hier registrieren»).
- `https://www.capcut.com/editor` öffnet den Dialog «Willkommen bei CapCut» (Weiter mit Google / E-Mail / TikTok / Facebook).
Nichts eingegeben, nichts angelegt, nichts hochgeladen, keine Einstellung verändert. Alle Konkurrenz-Aussagen stammen aus Bericht 1 (öffentliche Seiten, Gast-Editor, Preisseite). Folge: Kein Zählen von Transkriptionsfehlern gegen die Wahrheits-JSON, kein Look-/Default-/Export-Vergleich in dieser Runde.

---

## 8. Top-Empfehlungen (Hebel / Aufwand)

| # | Empfehlung | Hebel | Aufwand |
|---|---|---|---|
| 1 | **Batch/Queue** mit Template pro Clip und ZIP-Export | sehr hoch | L |
| 2 | **Blur-Format: Einzeiler ins Band setzen** (gleiche Ankerlogik wie bei Zweizeilern; Unterkante ≤ Band-Unterkante) | hoch | S |
| 3 | **Zeichenlimit pro Zeile bei Looks mit 2 Wörtern lockern** oder aus der Videobreite statt der Vorschau-Schriftgrösse ableiten (Color Pop 10 → ca. 16) | hoch | S–M |
| 4 | Hook-Vorschlag: nie wörtlich identisch mit der ersten Untertitelzeile, 2–3 Varianten zur Wahl | mittel | S |
| 5 | Emoji-Fallback mit etwas mehr Treffern (1 pro 6–7 s) und Sticker Emoji grösser (Faktor 1,6–2) | mittel | S |
| 6 | Handy-Captions-Tab: Vorschau fix oben, Liste mit 5+ Zeilen | mittel | M |
| 7 | Gradient Karaoke: inaktive Wörter in der Vorschau wie im Export (gleiche Deckkraft) und Vorschau-/Export-Pixeltest für alle Verlauf-Looks | mittel | S |
| 8 | Desktop-Toast unter 900 px Höhe auf der Landing weg vom Chip-Bereich | niedrig | S |
| 9 | Echte Transkription gegen die Wahrheits-JSON prüfen (80-ms-Frage dann abschliessen) | hoch | S |

---

## 9. Testgrenzen

- **Mock:** Transkription liefert die Wahrheitstexte; `/api/enhance`, `/api/polish`, `/api/stat`, `/api/plan` antworten 404 (erwartet). Genauigkeit, Namen und KI-Auswahl nicht bewertet; Emojis nur über den lokalen Fallback beurteilt. Die 80-ms-Differenz ist ein Mock-Artefakt (Kapitel 2), nicht Fehler und nicht bestätigt mit echter Transkription.
- **Exporte nicht als Dateien geprüft:** Kein `ffprobe`/`ffmpeg` auf den Export-MP4s. Der Versuch, die Blobs über einen lokalen Empfangsserver auf die Platte zu schreiben, wurde vom Berechtigungssystem abgelehnt; ich habe ihn nicht umgangen. Stattdessen: MP4-Boxen (`mvhd`, `mdhd`, `stts`, `stsd`) im Browser gelesen (Dauer, Bildrate konstant/variabel, Abmessungen, Grösse), Frames mit `<video>` + Canvas dekodiert und per Pixelzählung vermessen (Kontur, Kontrast, Position). Bitrate, Profil/Level, Farbraum und die Frame-Gleichheit gegen `ffmpeg` sind damit nicht abgedeckt.
- **Kontur-Probe:** 1000×700 gegen 1700×950, nicht 375 px; die Bilder sind nicht bitgleich (10 814 Pixel weichen um mehr als 60 ab, alle im Text-/Emoji-Bereich, vermutlich Subpixel-Position), die Kontur-Dicke ist es.
- **Konkurrenz:** weder Submagic noch CapCut eingeloggt, kein Vergleich (Kapitel 7).
- **Eigenes Testvideo:** `v1-light` (Hintergrund hellcreme, Ton von v1) für Glass Box; sonst nur die drei vorgegebenen Videos. Synthetische Videos, keine Gesichter: kein Reframe-/Fokus-Test; Kontrast auf echtem Material kann abweichen.
- **Browser-Pane:** Screenshots hinken oft eine Aktion hinterher (zeigen den Zustand davor), Mausklicks per Koordinate trafen teils nicht. Ich habe deshalb Klicks und Seitenfunktionen per JavaScript ausgelöst (`exportVideoWithCaptions()`, `skipEmailGate()`, `selectStyle()`, `setHookOn()`, `setEmphZoom()`) und die Wirkung per DOM/Pixel geprüft; die UI-Texte und Zustände sind echt, die Klickwege nicht Stück für Stück als Mausklicks nachgespielt (Ausnahme: Handy-Tabs, «Cut out» und Zeilenklick im Desktop-Editor wurden zusätzlich per Maus versucht, der Zeilenklick traf nicht). Beim Wechsel Handy → Desktop blieb das Layout einmal im falschen Massstab hängen; erst ein Reset der Emulation behob es.
- **Handy:** nur Emulation 375×812, keine echten Touch-Gesten, kein Handy-Export.
- **Nicht getestet:** Template-Export/-Import als Datei, Mehrfach-Cuts per Mehrfachauswahl, Hook-Vorschlag über 8 Wörter (kein Eingangsmaterial dafür), Handy-Download, DE-Texte im Fehlerfall (z. B. Mikrofonfehler).
- **Bilder:** 9 JPEGs (≤ 80 KB), Editor-Screenshots sind Pane-Aufnahmen (800×500, teils auf 2 Aufnahmen zusammengesetzt), Frame-Bilder stammen aus den dekodierten Export-MP4.
