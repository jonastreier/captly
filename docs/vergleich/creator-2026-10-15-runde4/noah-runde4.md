# Runde 4, 15.10.2026: Noah (31, Zürich, Vollzeit-Creator, 180k)

Vorgänger: `../creator-2026-10-14/noah.md` (Runde 1), `../creator-2026-10-14-retest/noah-retest.md` (Runde 2), `../creator-2026-10-14-runde3/noah-runde3.md` (Runde 3, dort Kapitel 6 mit Status «Runde 4» nachgeführt).

Getestet wurde Gluephs auf `http://localhost:8814/` (EN) und `/de` (Mock-Server, Worktree `claude/runde4-noah`, Basis `claude/runde4`). Neu seit Runde 3: **C1 Batch/Queue**, **C5 Brand-Kit**, Restpunkte R3. Szenario: ein Arbeitstag mit 5 Clips für 2 Kunden. Kunde A: 9:16-Reels, Logo oben rechts, eigene Farben (Text Weiss, Akzent Pink `#ff2d87`, Montserrat), Safe-Zone Reels. Kunde B: 16:9-Podcast → 9:16 (Crop), Logo oben links (Kreis, 90 % Deckkraft), Text Gelb `#ffe600`, Akzent Türkis `#00e5c0`, Playfair Display, Safe-Zone TikTok. Die Test-Logos habe ich per Canvas als PNG erzeugt (orange Quadrat «A», türkiser Kreis «B»).

Clips: `v1-reel-de` (9:16, 20,3 s), `v1b-reel-de-kurz` (9:16, 13 s, aus v1 geschnitten), `v3-hook-en` (9:16, 18,9 s), `v2-podcast-de-16x9` (27,6 s), `v2b-podcast-de-16x9-kurz` (16:9, 18 s, aus v2 geschnitten). v1b und v2b habe ich ausserhalb des Repos mit ffmpeg erzeugt, samt passender Wahrheits-JSON für den Mock. Belegbilder `01-…` bis `12-…` im selben Ordner (12 JPEGs, je unter 40 KB).

Methode in einem Satz: Die Exporte habe ich im Browser aufgebrochen (MP4-Boxen `mvhd`/`tkhd`, Frames per `<video>` + Canvas, Logo-Pixel gegen das Kit) und das ZIP im Browser geparst (Signaturen, CRC-32). Die Mausklicks im Browser-Pane trafen nicht verlässlich (Kapitel 9); die Klickzahlen unten sind deshalb aus dem Bedienpfad gezählt, nicht gestoppt.

---

## 1. Kurzurteil

- **Wechseln? Für Kundenarbeit mit mehreren Reels pro Tag: ja, mit einer Einschränkung, die ich in dieser Runde gefunden und gleich behoben sehe.** Batch und Brand-Kit tun, was versprochen ist: 5 Clips in einem Zug hochladen, je Clip ein Kunden-Template, «Alle exportieren», ein ZIP mit 5 MP4 und 5 SRT (CRC aller 10 Einträge stimmt). Die Logos sitzen pixelgenau (Kunde A: `#ff6a00` exakt, Kunde B: 90 % Deckkraft, gemessen `(1,168,159)` gegen erwartet `(2,166,157)`), Vorschau und Export stimmen in Position und Farbe überein.
- **Was mich im ersten Durchlauf fast getroffen hätte (alle behoben, Commit `12d1910`):** (1) Kunde B, dem ich das Template erst im Clips-Blatt zugewiesen hatte, exportierte als **1920×1080 statt 1080×1920**, das 9:16-Format des Templates kam nie an (hoch). (2) Der **Hook-Titel wurde über das Logo gezeichnet** und verdeckte «DAMIT»/«MEHR» (hoch). (3) Die **Kit-Akzentfarbe und -Schrift erreichten die Schlagwörter nicht**, sie blieben orange bzw. grün in der Look-Farbe (mittel). (4) Nach **Neuladen** bekamen alle Clips das Standard-Template (mittel). (5) Der **ZIP-Knopf lag am Handy unter dem Falz** (mittel).
- **Was noch offen ist:** Untertitel auf «Top» kollidieren mit einem Logo oben (mittel, Aufwand M, nicht umgesetzt); das erste gespeicherte Template wird still zum Standard und bringt Logo A auf jedes neue Video (niedrig); Desktop-Toast auf der Landing (aus Runde 3) und Bitrate (aus Runde 1) unverändert.
- **Zahlungsbereitschaft:** Einzelnutzung unverändert **CHF 8–12 pro Monat**. Für Kundenarbeit mit Batch und Kit gehe ich auf **CHF 18–20** (obere Grenze meiner Runde-1-Schätzung), weil das Versprochene jetzt da ist und ich 2–4 Kunden-Kits sauber ablegen kann. Bedingung: echte Transkription (hier Mock) und dass Kit-Konflikte (Logo gegen Untertitel oben) gelöst sind. Limits und Preise der Gluephs-Pläne habe ich nicht geprüft.
- **Nicht beurteilt:** Transkriptionsgenauigkeit (Mock), KI-Emoji/Keywords, echte Handy-Gesten, Konkurrenz (kein Login, siehe Kapitel 9).

---

## 2. Vorher/Nachher gegen Runde 3, Kapitel 6

Alle 11 Punkte aus Runde 3 geprüft. Die Spalte «Stand Runde 4» steht auch in `noah-runde3.md`.

| # R3 | Thema | Stand Runde 4 | Beleg Runde 4 |
|---|---|---|---|
| 1 | Kein Batch/Queue (hoch) | **behoben** | 5 Clips per Mehrfachauswahl, Clips-Blatt, Template je Clip, «Alle exportieren», ZIP + SRT (Kapitel 4) |
| 2 | Blur: Einzeiler unterhalb des Bands | **behoben** | v2 mit Blur: 21 von 21 Blöcken enden bei 0,638–0,643 der Höhe, scharfes Band bei 0,658 (Vorschau gemessen; vorher 0,69–0,74 bei 7 Blöcken) |
| 3 | Einzelwort-Blöcke bei 2-Wort-Looks | **behoben** | v1: Color Pop 0/20, Squash Pop 0/20, Sticker Emoji 0/20 (vorher 27/34, 15/28, 10/25). Unverändert: Swipe Underline 5/23, Mix 2/20 (3-Wort-Looks) |
| 4 | Gradient Karaoke: inaktive Wörter blasser | **behoben** (Vorschau) | Inaktives Wort: effektives Alpha 0,5 = Stilwert, nicht doppelt angewendet. Pixelvergleich Vorschau/Export nicht wiederholt |
| 5 | Hook wiederholt erste Zeile | **behoben** | v3: Hook «This one setting doubled my watch time», erste Untertitelzeile «Stop scrolling.» |
| 6 | Sticker Emoji nicht gross | **behoben** | Emoji 43,7 px bei 26,2 px Schrift = 1,67× |
| 7 | Handy-Captions-Tab: Vorschau 129 px | **behoben** | 375×812: Vorschau 161×286 px, 4 volle Zeilen + angeschnittene fünfte (Bild 09). «Edit t…»/«Close…» nicht erneut geprüft |
| 8 | Desktop-Toast deckt Look-Chips | **offen** | 1280×800: Toast y 742–784 überdeckt 4 Chips |
| 9 | Emoji-Fallback dünn | **teilweise** | v1: 3 (💡💬⏰), v3: 3 (🛑💬🎬) statt 3 und 2; Dichte 1 pro 6–7 s |
| 10 | Typewriter beginnt links | **behoben** | laut Commit a82cf12 und Test (Canvas-Stub); im Browser nicht erneut als Export vermessen |
| 11 | Kleinkram DE | **behoben** | Export-Blatt: «Dateiname mit Zusatz „-gluephs“». Verwaisten «Start fresh»-Knopf nicht erneut geprüft |

Zusätzlich unverändert und ohne Befund: **Einzeldatei-Weg** (eine Datei → kein Queue-Zustand, `_q.clips` leer, Untertitel nach 1,27 s da, Export 3,83 s, 3 Klicks Upload/Export/«Skip», Datei 5,15 MB, gleiche Grösse wie im Queue-Export desselben Clips); **`/de`** durchgehend deutsch (Kapitel 3).

---

## 3. Bedienung

**Kits anlegen (einmalig, je ca. 12–16 Klicks):** Style-Tab → «Brand kit» aufklappen → «Upload» (Dateidialog) → Ecke → Grösse/Deckkraft/Abstand → Text- und Akzentfarbe (je Farbwähler) → Schrift → Safe-Zone → Name → «Save». Das Kit ist Teil des Templates, die Tooltips erklären den Zweck («Wo Untertitel und Logo frei von der App-Oberfläche bleiben»). Positiv: Das Logo liegt immer **innerhalb der Safe-Zone** des Kits (Kunde A, Reels: links 67,5 % statt 80 %, oben 13,7 %), ich muss nicht selbst Abstand halten. Das Kit-Template speichert auch das Format (Kunde B: `aspect: 9:16`, Crop), also ist «Kunde B» wirklich ein Ein-Klick-Look für 16:9-Quellen.

**Der Tag, Schritt für Schritt (Desktop):**
1. Mehrfachauswahl auf der Landing: 5 Dateien, 1 Klick plus Dateidialog. Der Editor öffnet nach 0,3 s, das **Clips-Blatt** erscheint von selbst, die Transkription läuft nacheinander im Hintergrund (alle fünf fertig nach **5,8 s**; im Mock 0,9 s Verzögerung je Clip).
2. Template je Clip: ein Auswahlfeld pro Zeile, 2 Klicks je Clip. Neue Clips bekommen das zuletzt gewählte bzw. das Standard-Template (★); bei mir alle «Kunde B», also 3 × 2 Klicks für Kunde A (Bild 03).
3. Bearbeiten: Clip 1 «Views» → «Klicks» per Suchen und Ersetzen + Hook-Titel an (Hook-Text kommt als Vorschlag aus dem ersten Satz); Clip 4 «Meier» → «Meyer». Die Status wechseln auf «Edited». Eine Änderung am einen Clip erscheint nicht in den anderen (SRT-Prüfung: «Klicks» nur in v1, «Meyer» nur in v2).
4. «Alle exportieren» → beim ersten Mal die E-Mail-Abfrage, «Skip — download now» → alle 5 nacheinander → «Download 5 clips as ZIP» (SRT-Häkchen standardmässig an).

**Klicks und Zeit (Upload bis ZIP):** ca. **17 Klicks** (Upload 1, Template 6, Clip 1 bearbeiten 3, Clip 4 bearbeiten 3, Clips-Blatt/Alle exportieren/Skip/ZIP 4) plus 2 Texteingaben. Reine Maschinenzeit **ca. 34 s**: Transkription 5,8 s, Export 27,1 s, ZIP 0,46 s. Mit 5 Einzelläufen wären es 3–4 Klicks je Clip (15–20), dazu 5 einzelne Downloads und die SRT je einzeln (+5). Der Gewinn liegt weniger bei der Klickzahl als bei **einer Dateiauswahl, einem ZIP mit SRT und der sichtbaren Zuordnung Clip ↔ Kunde**.

**Exportdauer je Clip (Queue, erster Lauf):**

| Clip | Material | Zeit im Lauf |
|---|---|---|
| v1 | 20,3 s | 2,9 s |
| v1b | 13 s | 4,4 s (enthält Laden des Clips in den Editor) |
| v3 + v2 | 18,9 s + 27,6 s | 13,6 s zusammen |
| v2b | 18 s | 5,7 s |
| **Summe** | 97,8 s Material | **27,1 s**, im Mittel 5,4 s je Clip |

Spätere Läufe mit Hook auf zwei Clips: 30,7 s und 32,3 s. 3 Clips auf `/de`: 13,8 s. 3 Clips bei 375×812: 18,5 s. Einzelexport v1: 3,83 s.

**Dateien gegen Quelle (aus den MP4-Boxen, nach den Fixes):**

| Datei | Quelle | Export | Dauer Quelle / Export | Grösse Quelle → Export |
|---|---|---|---|---|
| v1 | 1080×1920 | 1080×1920 | 20,333 / 20,333 s | 3,48 → 5,15 MB |
| v1b | 1080×1920 | 1080×1920 | 13 / 13 s | 1,45 → 3,06 MB |
| v3 | 1080×1920 | 1080×1920 | 18,933 / 18,933 s | 3,62 → 4,55 MB |
| v2 | 1920×1080 | **1080×1920** | 27,6 / 27,6 s | 4,01 → 6,53 MB |
| v2b | 1920×1080 | **1080×1920** | 18 / 18 s | 2,18 → 3,98 MB |

Alle mit Video- und Audiospur. Die Bitrate liegt weiter bei 1,5–2× der Quelle (Runde 1, Punkt 9, unverändert).

**Logo je Export-Frame gegen das Kit:**

| Kit | Erwartet (aus dem Kit) | Gemessen im Export-Frame | Vorschau |
|---|---|---|---|
| A, Ecke oben rechts, Grösse 16 %, Reels | Quadrat 173 px, links 67,5 % (729 px), oben 13,7 % (263 px) | orange Fläche x 736–894, y 270–428 (= Quadrat 729–902 × 263–436 ohne den 10/300-Rand), Farbe exakt `(255,106,0)` | `left 67,5 %`, `top 13,7 %` |
| B, oben links, 14 %, Deckkraft 90 %, TikTok | Kreis 151 px | Kreis x 117–261, y 187–331, Pixel `(1,168,159)` (erwartet `(2,166,157)`) | `left 10,56 %`, `top 9,58 %` gegen Export 10,8 % / 9,7 % |

**Vorschau = Export (Kunde A, v1b bei 4,0 s):** Untertitel Vorschau x 0,269–0,731, y 0,620–0,675; Export (Kontur-Pixel) x 0,265–0,738, y 0,625–0,671. Abweichung unter 1 %. Aktives Wort in der Vorschau `rgb(255,45,135)` = Kit-Akzent. Kunde B: Textfarbe `rgb(255,230,0)`, Schrift Playfair Display in der Vorschau und im Export.

**Abbrechen/Pause (geprüft):**
- «Pause after this clip» stoppt nach dem laufenden Clip (Stand `rrqqq`), «Export all 2 clips» steht dann bereit, «Transcribe the remaining 3 clips» setzt fort. Alle 5 danach «Transcribed».
- «Cancel export» nach 4,2 s (erster Clip bei 19 %): innerhalb von 2,5 s wieder alle auf «Transcribed», kein Rest-Export, `isExporting` falsch, Editor bleibt auf dem Startclip.
- **Clip entfernen während der Transkription:** v3 entfernt, als es transkribiert wurde (2,4 s). Der Durchgang läuft mit den übrigen vier weiter, alle vier fertig nach 5,0 s, der Editor bleibt auf v1.

**Neuladen mitten in der Queue:** Die Clips-Liste selbst ist danach weg und die Startseite sagt nichts dazu. Erhalten bleiben **alle fünf Autosaves** (Texte, Hook, Template, Format). Wähle ich dieselben fünf Dateien wieder, sind sie nach **0,3 s** zurück («Edited»/«Transcribed»). Das Browserfenster kann die Dateien nicht selbst behalten; Export-Ergebnisse gehen verloren (liegen nur im Speicher). Vor dem Fix bekamen dabei alle Clips das Standard-Template (Kapitel 6, Punkt 4).

**Template-Export/-Import mit Kit-Logo:** «Export templates» → 24,6 KB JSON mit beiden Kits (Logo als Base64, 7 086 und 13 734 Zeichen, Farben, Schrift, Safe-Zone). Nach Löschen beider Templates und Import: beide Kits zurück mit Logo, Ecke, Farben, Schrift, Safe-Zone; Standard-Stern nicht mitimportiert. Ein manipuliertes Template mit SVG-Logo: «Imported 3 templates · 1 logo skipped (not PNG/JPEG/WebP or too large)», das Template kommt ohne Logo an.

**ZIP (aus dem Browser geparst):** 23,28 MB, 10 Einträge (5 MP4, 5 SRT), Methode STORE, UTF-8-Namenflag, lokale und zentrale Header passen, **CRC-32 aller 10 Einträge stimmt**, Dateinamen `v1-reel-de-gluephs.mp4` + `….srt`. Das SRT enthält die Korrekturen. Erzeugung 0,46 s.

**`/de`:** Clips-Blatt, Brand-Kit-Panel (inkl. Titel-Attribute: «Logo-Ecke», «Kit-Akzentfarbe (aktives Wort)», «Safe-Zone-Vorgabe»), Statusmeldungen, Exportfortschritt («Export 1 von 3 — 2 %»), Toasts («3 Clips transkribiert — wähle pro Clip ein Template und exportiere dann alle.») und ZIP-Knopf («3 Clips als ZIP herunterladen», «SRT-Dateien dazulegen») sind **vollständig deutsch**. Nur Look-/Schriftnamen und «Brand-Kit» bleiben, wie gewollt.

**Handy 375×812, Queue mit 3 Clips:** Das Clips-Blatt ist ein Bottom-Sheet (641 von 812 px), je Clip ein Auswahlfeld, «Open», «×». Toast und Sheet überlagern sich kurz («Add clips» ist beim Toast verdeckt). Der Style-Tab zeigt Kit-Panel und Vorschau (248 px breit) lesbar (Bild 07). Exportzeit 18,5 s für 66,8 s Material. Nach dem Export lag der ZIP-Knopf bei y 793–837 von 812 und war nicht sichtbar (vorher, Bild 06), jetzt bei y 727–771 und ganz oben im Aktionsbereich (nachher, Bild 10).

---

## 4. Batch und Brand-Kit im Tagesablauf: Funde im Detail

**Hook über Logo (Fund 2, behoben).** Kunde A, Hook an: Der orange Hook-Kasten (Look-Farbe) wurde mittig oben gezeichnet und das Logo `A` darüber, sodass «DAMIT» und «MEHR» halb verdeckt waren (Bild 05, links). Nach dem Fix rutscht der Titel unter das Logo (Bild 08, links, rosa Kasten in der Kit-Akzentfarbe; Kunde B: türkiser Kasten unter dem Kreis).

**Template pro Clip ohne Layout (Fund 1, behoben).** `queueSetStyle` trug bei einem noch nicht geöffneten Clip nur die Look-ID in den Speicher-Schnappschuss ein, nicht das Layout des Templates (Format 9:16, Crop, Wörter/Zeilen). Beim Öffnen zeigte der Editor Logo und Farben von Kunde B, aber das Format «Original»; der Export war 1920×1080 (v2 und v2b). Der erste Durchlauf war nur zufällig richtig, weil «Kunde B» dort schon Standard war. Nach dem Fix wird das Layout beim Öffnen angewendet: Format 9:16, Logo links oben, alle fünf Exporte 1080×1920.

**Kit-Akzent/-Schrift bei Schlagwörtern (Fund 3, behoben).** Der Akzent setzte nur `hl` (aktives Wort). Fast alle Looks färben Schlagwörter aber mit `em` und eigener Schrift `emFont`. Messung vorher: Kunde B (Mix) Schlagwort `rgb(74,222,128)` in Instrument Serif statt Türkis und Playfair; Kunde A (Bold Pop) «WATCH» in Look-Orange statt Pink (Bild 05, Mitte). Nachher: Schlagwort in Kit-Akzent, Kit-Schrift (Bild 08).

**Neuladen und Kunden-Zuordnung (Fund 4, behoben).** Beim erneuten Wählen derselben Dateien wurden alle Clips auf das Standard-Template gesetzt (alle «Kunde A» bzw. alle «Kunde B»), der gespeicherte Look kam nicht zum Zug. Nach dem Fix: A, A, A, B, B kommen zurück, mit Hook und Format.

**Offen (Fund 6).** Untertitel auf «Top» unter einem Kit mit Logo oben rechts: Untertitel x 0,238–0,762, y 0,125–0,243 gegen Logo x 0,675–0,835, y 0,137–0,227. Der Hook weicht dem Logo jetzt aus, die Untertitel nicht.

---

## 5. Best Practice

Konkurrenz weiterhin nur aus Runde 1 (kein Zugriff, Kapitel 9).

| Thema | Konkurrenz (laut Runde 1) | Gluephs jetzt | Empfehlung |
|---|---|---|---|
| Batch | Submagic Business | Mehrfachauswahl, Clips-Blatt, ZIP + SRT, bis 10 Clips | Dateiname/ZIP nach Kunde (Wunsch) |
| Brand-Kit | Submagic Pro | Logo, Farben, Schrift, Safe-Zone am Template, Export/Import als Datei | Kit-Marker auch im Clips-Blatt |
| Zuordnung Kunde ↔ Clip | – | Auswahlfeld je Clip, überlebt Neuladen (jetzt) | Hinweis auf der Landing: «5 Clips zuletzt bearbeitet, Dateien wieder wählen» |
| Logo und Hook/Untertitel | – | Hook weicht aus (jetzt), Untertitel oben nicht | Untertitel ebenfalls ausweichen lassen |

---

## 6. Was mich noch stört (und was behoben ist)

| # | Schwere | Fund | Beleg | Reproduktion | Stand |
|---|---|---|---|---|---|
| 1 | **hoch** | **Template im Clips-Blatt gewechselt → Layout (9:16-Format) kommt nicht an.** Kunde B exportiert als 1920×1080 statt 1080×1920, im Editor «Original» mit Kit-Logo. | `tkhd` der Exporte v2/v2b: 1920×1080 | 5 Clips, Standard-Template A, in der Liste für v2 «Kunde B» wählen, «Alle exportieren» | **behoben in `12d1910`** (Layout beim Öffnen anwenden); Test «R4 Look pro Clip» |
| 2 | **hoch** | **Hook-Titel wird über das Brand-Logo gezeichnet** (Kit oben), verdeckt Text. | Bild 05 (vorher), Bild 08 (nachher) | Kunde A (Logo oben rechts), Hook an, Frame bei 1,0 s | **behoben in `12d1910`** (`hookLayout(…, avoid)`: Titel rutscht unter das Logo, Vorschau = Export, ein Layout) |
| 3 | **mittel** | **Kit-Akzent und -Schrift erreichen Schlagwörter nicht** (`em`/`emFont`). | Pixel/DOM: `rgb(74,222,128)` Instrument Serif bei Kit B; «WATCH» orange bei Kit A | Kit mit Akzent, Mix oder Bold Pop, Frame bei Schlagwort | **behoben in `12d1910`** (`applyBrandToStyle`) |
| 4 | **mittel** | **Neuladen + gleiche Dateien: Template-Zuordnung geht verloren**, alle Clips bekommen das Standard-Template (Logo A auf Kunde B). | `_q.clips[].styleId` alle gleich nach Re-Upload | 5 Clips mit A/B, Seite neu laden, dieselben Dateien wählen | **behoben in `12d1910`** (`restored && !styleUser`) |
| 5 | **mittel** | **ZIP-Knopf am Handy unter dem Falz**, «Alle exportieren» bleibt Hauptknopf nach dem Export. | y 793–837 bei Höhe 812 (Bild 06) | 375×812, 3 Clips exportieren | **behoben in `12d1910`** (ZIP zuerst, y 727–771, Bild 10) |
| 6 | **mittel** | **Untertitel «Top» kollidieren mit Logo oben.** | Untertitel x 0,238–0,762 / y 0,125–0,243 gegen Logo x 0,675–0,835 / y 0,137–0,227 | Kit A, v1b, Position «Top», Zeit 4 s | **offen, Aufwand M** (Logo als Hindernis für den Untertitel-Ausweichweg wie beim Hook, Vorschau und beide Exportwege) |
| 7 | niedrig | **Erstes gespeichertes Template wird still Standard (★)** und bringt Logo A auf jedes neue Video, auch von Kunde B. Hinweis nur in der Statuszeile. | Podcast-Clip (Kunde B) lud direkt nach dem Speichern von «Kunde A» mit riesigem Logo A über der Schrift (Bild 11) | Erstes Kit speichern, anderes Video laden | offen |
| 8 | niedrig | **Clips-Blatt zeigt keinen Kit-Marker** (◈ gibt es nur in der Template-Leiste im Style-Tab). | Auswahlfeld im Blatt zeigt «Kunde A» ohne ◈ | Clips-Blatt öffnen | offen |
| 9 | niedrig | **E-Mail-Abfrage beim ersten «Alle exportieren» öffnet das Einzel-Export-Blatt** mit «Download video». Skip und «Download video» setzen beide den Batch fort, die Beschriftung passt aber nicht. | Bild 12, Toast «Enter your email — or skip — to start exporting all clips.» | `sessionStorage` leeren, «Export all» | offen |
| 10 | niedrig | **«Restored your last session»** erscheint auch für Clips, die in derselben Sitzung gerade transkribiert wurden (Rückkehr zum Startclip). | tStatus nach dem Durchgang | 5 Clips hochladen, Durchgang abwarten | offen |
| 11 | niedrig | **Desktop-Toast auf der Landing deckt 4 Look-Chips** (Runde 3, Punkt 8). | Toast y 742–784 bei 1280×800 | `/` laden | offen |
| 12 | niedrig | **Bitrate 1,5–2× der Quelle** (Runde 1, Punkt 9). | 5,15 MB gegen 3,48 MB | Export v1 | offen |
| 13 | niedrig | **ZIP ohne Kundenordner**, Kundenname steckt nirgends im Dateinamen. Für 4 Kunden will ich pro Kunde sortieren. | ZIP-Inhalt flach | «Download as ZIP» | Wunsch, offen |

Beobachtung, nicht als Fehler gezählt: Beim allerersten Öffnen von Clip 4 stand einmal Look A statt der zugewiesenen Kunde-B-Vorlage. Mit drei Wiederholungen und zwei vollständigen Läufen nicht mehr reproduzierbar; wahrscheinlich dieselbe Ursache wie Punkt 1.

---

## 7. Wo Gluephs schon besser ist

- **Alles lokal, kein Login, kein Wasserzeichen:** Ein Kunden-Kit mit Logo bleibt auf dem Gerät, die Videos auch (nur Audio geht an die Transkription). Für Kundenmaterial ein echtes Argument gegenüber Cloud-Tools.
- **Kit ist eine Datei:** Template-Export enthält Logo, Farben, Schrift, Safe-Zone; Import bereinigt manipulierte Dateien (SVG-Logo wird verworfen, mit klarer Meldung).
- **Safe-Zone-bewusstes Logo:** Die Ecke bezieht sich auf die sichere Fläche des gewählten Kits (Reels, TikTok, Shorts, Aus).
- **ZIP in 0,5 s, fehlerfrei:** STORE mit korrekten CRC-32 und UTF-8-Namen, SRT optional dabei.
- **Pause, Abbrechen und Clip-Entfernen während der Arbeit** gehen ohne Rest und ohne Datenverlust.

---

## 8. Top-Empfehlungen (Hebel / Aufwand)

| # | Empfehlung | Hebel | Aufwand | Stand |
|---|---|---|---|---|
| 1 | Template-Wechsel pro Clip muss das Template-Layout (Format) anwenden | sehr hoch | S | **erledigt `12d1910`** |
| 2 | Hook-Titel weicht dem Logo aus | hoch | S | **erledigt `12d1910`** |
| 3 | Kit-Akzent/-Schrift auch für Schlagwörter | hoch | S | **erledigt `12d1910`** |
| 4 | Gespeicherte Zuordnung Clip ↔ Kunde nach Neuladen | hoch | S | **erledigt `12d1910`** |
| 5 | ZIP-Knopf nach dem Export vorn | mittel | S | **erledigt `12d1910`** |
| 6 | Untertitel weichen dem Logo aus (Position «Top»), Vorschau und Export | hoch | M | offen |
| 7 | Landing-Hinweis «n Clips zuletzt bearbeitet: Dateien wieder wählen» beim Neuladen | mittel | S–M | offen |
| 8 | Brand-Kit-Template nicht stillschweigend zum Standard machen (Rückfrage oder Hinweis-Toast) | mittel | S | offen |
| 9 | Kit-Marker ◈ im Clips-Blatt, Kundenordner im ZIP | niedrig | S | offen |
| 10 | Bitrate an die Quelle koppeln | mittel | S–M | offen |

---

## 9. Testgrenzen

- **Mausklicks im Browser-Pane:** Koordinatenklicks trafen nicht (der Klick landete beim Faktor 3,64 verschoben; mit Umrechnung klappten einzelne Klicks, z. B. Style-Tab, «Skip — download now»). Referenzklicks auf `ref_…` landeten ebenfalls verschoben. Ich habe Seitenfunktionen deshalb per JavaScript ausgelöst (`queueSetStyle`, `queueExportAll`, `setHookOn`, `switchTab`, `selectStyle`, Dateien per `DataTransfer` in `#landInput`) und Zustand/Text/Pixel geprüft. **Klickzahlen und Wegzeiten sind aus dem Bedienpfad gezählt, nicht per Mausklick gestoppt; die Menschenzeit (Lesen, Zielen, Tippen) ist nicht gemessen.** Die Maschinenzeit (Transkription, Export, ZIP) ist gemessen.
- **Mock:** Transkription liefert die Wahrheits-JSON mit 0,9 s Verzögerung; Genauigkeit, Namen und KI-Auswahl nicht bewertet. v1b und v2b sind zugeschnittene Varianten von v1 und v2, mit eigener JSON.
- **Exporte:** nicht per `ffprobe` auf der Platte, sondern im Browser aus `mvhd`/`tkhd`/`mdhd`, Frames per `<video>`/Canvas und Pixelvermessung. Bitrate, Profil/Level und Farbraum nicht geprüft. ZIP im Browser geparst, nicht mit `unzip` entpackt.
- **Browser-Pane-Artefakte:** Nach `navigate` sass die Seite mehrmals verkleinert in einer Ecke des Screenshots; ein `resize_window` auf «desktop» und danach 1280×800 stellte das richtig. Contact-Sheet-Bilder (05, 08) sind verkleinerte Canvas-Darstellungen der dekodierten Export-Frames.
- **Handy:** Emulation 375×812, keine echten Touch-Gesten, kein Handy-Export, native Auswahlfelder nicht geöffnet.
- **Nicht geprüft:** Logo bei Safe-Zone «Aus»/«Shorts», Logo mit Transparenz (PNG mit Alpha, nur ein deckendes Test-Logo), mehr als 5 Clips (Limit 10 nur im Code-Test), Wasserzeichen-Modus (mit Gluephs-Wasserzeichen rutscht ein unteres Logo darüber), Untertitel «Middle»/«Top» im Export, Abbruch bei echten Fehlern (Netz, Kontingent), Wechsel der Queue beim Hinzufügen weiterer Clips («Add more clips…»).
- **Konkurrenz:** Nicht getestet. Kein Login vorhanden, ich habe nichts versucht, nichts angelegt, nichts eingegeben. Alle Konkurrenzangaben stammen aus Runde 1.
- **Nicht lauffähig:** `test-ui-sweep.js` und `test-e2e.js` (Playwright fehlt, «playwright nicht gefunden – test-e2e übersprungen»). Alle anderen Pflicht-Tests sind grün.
- **Zustand:** Mock (PID 24178) und Test-Tab sind beendet; das `localStorage` des Test-Tabs (Kits «Kunde A»/«Kunde B», Autosaves) bleibt im Browser-Profil des Panes.
