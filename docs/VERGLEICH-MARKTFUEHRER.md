# CaptionRush im Vergleich mit dem Marktführer «Captions»

Stand: 10.10.2026 · Code-Stand der Messung: Commit `d2509a9` (Branch `claude/brave-hopper-u6e756`) · Belege: [`docs/vergleich/`](vergleich/)
(Tester-Digest [`tester-berichte.md`](vergleich/tester-berichte.md), Aufträge [`tester-auftraege.md`](vergleich/tester-auftraege.md),
Rohdaten/Bilder in `reise/`, `looks/`, `robust/`).

Kennzeichen im ganzen Bericht: **M** = gemessen (Browser/ffprobe), **C** = aus dem Code abgelesen, **R** = Konkurrenz recherchiert,
**«seit Testlauf behoben»** bzw. **«in Arbeit»** = Stand im Hauptbranch nach der Messung (Angabe des Auftraggebers, hier nicht nachgemessen,
ausser wo «gemessen» steht).

## 1. Fazit

1. **Verkaufsreif: nein, aber mit Auflagen erreichbar.** Bedienung, Export und Robustheit sind im Test solide (13 Grenzfälle, kein Absturz,
   kein Hänger). Es fehlen Belege für die Kernleistung und einige sichtbare Mängel.
2. **«Besser als die Konkurrenz» ist nicht belegt.** Wo beide Seiten belegt sind (8 Kriterien, 19 von 64 Gewichtspunkten), liegt Captions
   vorn: **73 von 95 Punkten gegenüber 60 von 95** (Abschnitt 3). Diese Teilmenge enthält aber weder die Transkription noch die Stärken, die
   nur bei CaptionRush gemessen wurden.
3. **Vorn (Beleg):** kein Konto bis zum MP4 (4 Klicks, ≈ 14 s ohne Transkription), kein Wasserzeichen in der Beta. Captions verlangt ein Konto,
   und der Gratis-Plan hat je nach Quelle Credits und/oder ein Wasserzeichen.
4. **Hinten (Beleg):** 16 Sprachen gegenüber «100+», Übersetzen nur nach Englisch, kein Videoschnitt und keine KI-Bearbeitung, keine native
   App, wenig Reife (Beta, keine Bewertungen).
5. **Stark, aber ohne Vergleichswert:** Vorschau = Export (0 px Versatz, Standbild-IoU ≥ 0,98, 146/146 Sweep-Prüfungen), saubere Ausgabe
   (H.264/AAC, 30 fps, Dauer ±0,03 s), SRT/VTT/TXT gültig, Wiederherstellung nach Neuladen ohne neue Transkription.
6. **Offen und launch-kritisch:** Genauigkeit und Tempo der echten Transkription (nur Mock gemessen). Ausserdem ist das Exporttempo des
   eigentlichen Schnellwegs (WebCodecs, Chrome mit H.264) nie gemessen worden. Gemessen wurde nur der Ersatzweg: **1,75–3,0 × Videolänge**.
7. **Sichtbarster Mangel:** Der Standard-Look «Tight» ist auf hellem Material kaum lesbar (Kontrast ≈ 2:1). Das gilt für die Hälfte der Looks:
   weisse Schrift ohne Kontur.
8. **Ärgerlich im Ablauf:** Nach dem MP4-Export verschwinden SRT/VTT/TXT aus dem Export-Blatt, und «Export again» rendert neu. Bei einer
   defekten Datei entsteht ein 0-Byte-Export mit Erfolgsmeldung.
9. **Wasserzeichen-Widerspruch entschärft** (Entscheid des Inhabers): In der Beta gibt es nie ein Wasserzeichen; nach dem Planstart erst ab dem
   3. Video pro Tag im Gratis-Plan. Code und Texte werden angepasst (in Arbeit).
10. **Empfehlung:** die Launch-Blocker aus Abschnitt 9 abarbeiten (überwiegend S/M) und mit «ohne Konto, ohne Wasserzeichen, Video bleibt auf
    deinem Gerät» werben, nicht mit «besser als Captions».

## 2. Annahmen und Grenzen

- **Marktführer-Annahme:** «Captions» (captions.ai, App von Mirage), weil CaptionRush dieses Produkt nachbaut. CapCut, Submagic und VEED
  dienen nur als Nebenreferenz (8.2).
- **Konkurrenz nur recherchiert:** kein Konto, kein Bezahl-Export, keine Bedienung. WebFetch war für jede Domain gesperrt (DNS-Fehler); jede
  Angabe stammt aus WebSearch-Auszügen vom 10.10.2026, offizielle Seiten wurden nie direkt gelesen. Höchstes Vertrauen ist deshalb «mittel».
  Store-Treffer zu «Captions: for Talking Videos» u. ä. waren Nachahmer-Apps und wurden verworfen.
- **Transkription = Mock** (feste Wörter, ≈ 19 ms). Genauigkeit, Tempo, Dialekt, Polish und Enhance (Keywords/Emojis/Zoom/Post-Text per KI)
  sind nicht gemessen.
- **Headless-Chromium 141 ohne H.264-Decoder und -Encoder.** Quellen waren VP8/WebM, der Export lief über MediaRecorder (WebM) und danach
  ffmpeg.wasm (Umkodierung nach H.264-MP4). **Nicht gemessen:** der WebCodecs-Schnellexport (laut README «schneller als Echtzeit») und der
  direkte MediaRecorder-MP4-Weg. Beide nimmt ein Nutzer mit Chrome/Edge/Safari und einer MP4-Quelle. Wie schnell der Export dort ist, bleibt
  **offen**; die gemessenen Zeiten gelten nur für den Ersatzweg (Firefox, WebM-Quellen, Browser ohne WebCodecs).
- **Last:** Die drei Tester liefen parallel auf 4 Kernen (Last 2–15). Zeiten sind eher pessimistisch, aber Hoch- und Niedriglast liegen nah
  beieinander (Tabelle in Abschnitt 4).
- **Nicht geprüft:** echtes Handy, Safari/iOS, Android, Rotations-Metadaten (nur Code gelesen), Speicherbedarf grosser Dateien.
- Punkte 0–5 vergibt der Dirigent nur mit Beleg. Die Gesamtsumme wird **nur über Kriterien gebildet, die auf beiden Seiten belegt sind**.

### Plausibilitätsprüfung der Tester-Zahlen (Dirigent)

- **Exportzeit 1,75–3,0 ×:** schlüssig. Der Ersatzweg nimmt das Video in **Echtzeit** auf (MediaRecorder; 6-s-Video: Phase «Rendering» von
  2,0 s bis 8,1 s ≈ 1 ×), danach kodiert ffmpeg.wasm (Single-Thread-WASM) von WebM nach H.264 um: 30 s bei 540p ≈ 17 s, bei 1080p ≈ 47 s.
  Dazu kommen beim ersten Mal ≈ 15 MB Konverter-Download und ≈ 2 s Vorbereitung. Deshalb ist das Verhältnis bei 1080p höher als bei 540p und
  bei kurzen Videos höher als bei langen. Stichprobe in `reise/export-zeiten-last-niedrig.json` bestätigt die Tabelle (6 s/540p: 11,5–11,9 s).
- **Funde im Code nachgesehen:** `exportDone` blendet `expMain` aus (captly.html:11385–11396) → SRT/VTT/TXT weg. `recorder.onstop` prüft
  keine leere Aufnahme vor `webmToMp4`/`dlBlob` (captly.html:10405–10427) → 0-Byte-Datei möglich.
- **Kontaktbogen angesehen** (`looks/kontaktbogen-24-looks.jpg`): weisse Looks ohne Kontur (Tight, Accent, Soft, Clean, Neon, Elegant) auf
  Sand-Ton kaum lesbar, Kontur- und Box-Looks klar. Bei «Dark Box» ist der fehlende Wortabstand sichtbar («DIR WIESCHNELL»). Bei Tight/dunkel
  zeigen Vorschau und Export verschiedene Wörter; laut Tester B ist das Zeitversatz des Echtzeit-Wegs unter Last (0–9 Frames), nicht
  repräsentativ.
- **Baseline Dirigent:** `node test-e2e.js` 118/118 grün (Desktop + 390 px), MP4-Frame gegenüber Vorschau 0 px Versatz.

## 3. Bewertungsmatrix

Urteil «vorn/gleich/hinten» nur, wenn beide Seiten belegt sind, sonst «offen». CR = CaptionRush, Cap = Captions; Punkte 0–5. Quellen-IDs (Q…) in
Abschnitt 8, Tester A/B/C = `vergleich/tester-berichte.md`.

| # | Phase | Kriterium | Gew. | Art | CaptionRush (Beleg) | CR | Captions (Quelle, Vertrauen) | Cap | Urteil |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Einstieg | Konto nötig bis zum ersten Ergebnis | 3 | M/R | Kein Konto; E-Mail vor dem ersten MP4; kürzester Weg 4 Klicks, ≈ 14 s ohne Transkription (A) | 5 | Konto mit Abo je Plattform (Q2, mittel) | 3 | **vorn** |
| 2 | Einstieg | Installation / Plattformen | 2 | C/R | Nur Browser, keine App | 3 | iOS-App, Desktop/Web (Q2, Q7, mittel) | 4 | **hinten** |
| 3 | Einstieg | Dateiarten, Grösse, Länge | 2 | M | 4K, 317 MB, 3 min, 0,5 s, Querformat ok; ohne Ton, .txt/PNG mit klarer Meldung; HEVC mit Hinweis; defekte WebM → 0-Byte-Export (C) | 4 | Studio-Ablauf 4–60 s, 9:16 (Q5, niedrig) | — | offen |
| 4 | Transkription | Sprachen | 2 | C/R | 16 (FAQ) | 2 | «100+» (Q3, Q10, niedrig–mittel) | 5 | **hinten** |
| 5 | Transkription | Genauigkeit (de, CH-Dialekt, en) | 3 | — | **nicht gemessen** (Mock) | — | nicht verifizierbar | — | offen |
| 6 | Transkription | Tempo | 2 | — | **nicht gemessen** (Mock); Fehlerfälle 429/500/offline verständlich, Retry ok (C) | — | nicht verifizierbar | — | offen |
| 7 | Transkription | Namen/Begriffe, Korrektur-KI | 1 | C | «Names & terms» + Polish-LLM (nicht gemessen) | 4 | nicht verifiziert | — | offen |
| 8 | Transkription | Übersetzen | 2 | C/R | Nur nach Englisch | 1 | Dubbing, Lip-Sync (Q8, mittel) | 5 | **hinten** |
| 9 | Looks | Anzahl Looks | 2 | C | 24 + «Style Drops» (`styles.json` leer) | 3 | Anzahl nicht verifiziert (Q6) | — | offen |
| 10 | Looks | Anpassbarkeit | 3 | C/R | Schrift (auch eigene), Farben, Grösse, Position, Schreibweise | 4 | Farben für Text/Hervorhebung/Aktivwort/Hintergrund, Kontur, Schatten (Q6, mittel) | 4 | **gleich** |
| 11 | Looks | Wort-Animation | 2 | M | Pop/Reveal/Fill sichtbar, Vorschau = Export (Sweep anim ok); Pop kurz (≈ 0,3 s), schluckt bei lift/stack den Wortabstand (B) | 3 | «Active word» (Q6), Qualität nicht verifizierbar | — | offen |
| 12 | Looks | Keyword-/Emoji-Hervorhebung | 2 | C | KI-Keywords/Emojis/Auto-Zoom vorhanden, nicht gemessen; Auto-Zoom ohne KI wirkungslos (in Arbeit) | — | Hervorhebungsfarbe (Q6); KI-Emojis nicht verifiziert | — | offen |
| 13 | Looks | Lesbarkeit, Safe-Area, Umbruch | 3 | M | 9 gut / 11 ok / 4 schwach; weisse Looks ohne Kontur ≈ 2:1 auf hell, **Standard «Tight» betroffen**; Safe-Zone rechts verletzt bei stack (92 %) und note (93,5 %); Umbruch de/fi sauber; CJK mit Bindestrich mitten im Wort (B) | 3 | nicht verifizierbar | — | offen |
| 14 | Bearbeiten | Text korrigieren | 3 | M | 2 Klicks, 0,7 s; Korrektur landet in MP4/SRT/VTT/TXT (A) | 5 | vorhanden (Q6, mittel) | — | offen |
| 15 | Bearbeiten | Timeline | 2 | M | Verschieben/Teilen/Mehrfachauswahl: 7 Klicks/4,5 s Desktop, 9 Taps/5,8 s Handy; kein Split-Knopf am Desktop (A) | 3 | nicht verifiziert | — | offen |
| 16 | Bearbeiten | Undo, Autosave, Projekte | 2 | M/C | Undo 100 Schritte (C); Neuladen stellt Edits + Look ohne neue Transkription wieder her; anderer Dateiname wird nicht erkannt; kein Schutz bei Zurück (C) | 4 | Cloud-Projekte mit Konto (Q2, mittel) | — | offen |
| 17 | Bearbeiten | Videobearbeitung über Untertitel hinaus | 2 | C/R | Zoom-Punch-in, 9:16 Blur/Crop; kein Trim/Schnitt | 1 | AI Edit, Eye Contact, Rauschentfernung (Q8, mittel) | 5 | **hinten** |
| 18 | Vorschau | Vorschau = Export | 3 | M | Sweep 146 ok / 0 FAIL; IoU ≥ 0,98 (Ausreisser 0,90–0,92), Position ≤ 3 px; F1: 0 px Versatz MP4-Frame gegenüber Vorschau (B, E2E) | 5 | nicht verifizierbar | — | offen |
| 19 | Export | Formate | 2 | M | MP4, SRT/VTT/TXT gültig (7/7 Blöcke), Cover-PNG; SRT/VTT/TXT nach MP4-Export ausgeblendet (A) | 4 | MP4; SRT nicht verifiziert | — | offen |
| 20 | Export | Auflösung, fps, Qualität | 2 | M | H.264 CB, 30 fps, AAC 48 kHz, 4,2 Mbit/s (540p) / 8,2–8,6 (1080p); kein Hochskalieren, 4K → 1080p (Option Original: 2160p); Beschriftung «1080p» bei kleiner Quelle falsch (A) | 4 | 4:5-Export (Q7); Auflösung nicht verifiziert | — | offen |
| 21 | Export | Wasserzeichen / Gratis-Limits | 3 | C/R | Beta: nie Wasserzeichen; nach Planstart ab dem 3. Video/Tag im Gratis-Plan (Inhaber-Entscheid, in Arbeit) | 5 | Gratis: Credits und/oder Wasserzeichen; Basic mit KI-Funktionen → Wasserzeichen (Q1 mittel, Q9 niedrig) | 2 | **vorn** (Beta) |
| 22 | Export | Exporttempo, Stabilität | 2 | M | Nur Ersatzweg gemessen: 1,75–3,0 × Videolänge; Schnellweg nicht gemessen. Stabil (zweiter Export ok, Reload ok), aber kein Abbrechen-Knopf (A, C) | — | nicht verifizierbar | — | offen |
| 23 | Extras | Cover / Titelbild | 1 | M | PNG 1080 × 1920, Titel sichtbar (A); Akzent-Chips seit Testlauf behoben (F2) | 4 | nicht verifiziert | — | offen |
| 24 | Extras | Post-Text + Hashtags | 1 | C | KI-Vorschlag im Export-Blatt, nicht gemessen | 4 | nicht verifiziert | — | offen |
| 25 | Extras | Vorlagen / Brand-Standard | 1 | C | Vorlagen speichern/importieren, «Use for every new video» | 3 | Vorlagen (Q6), Brand Kit nicht verifiziert | — | offen |
| 26 | Handy | Handy-Erlebnis | 3 | M | Reise vollständig, 27 Taps; kein horizontales Scrollen; ≈ 130 Tippflächen < 44 px (seit Testlauf ≥ 32 px, F2); Customizer schlecht auffindbar (in Arbeit) (A) | 3 | native iOS-App (Q7); Qualität nicht verifizierbar | — | offen |
| 27 | Datenschutz | Datenfluss, Anbieter | 2 | C | Video bleibt lokal; Ton → Hostpoint (CH) → Groq (USA); keine CDNs (Test) | 4 | nicht verifiziert (Upload ins Studio plausibel, ohne Quelle) | — | offen |
| 28 | Preis | Preis / Wert | 3 | C/R | Beta gratis; geplant $7.99/300 min, $14.99/1200 min | — | Basic $9.99/200 Credits, Max $24.99/500 (Q2, mittel); Credits ≠ Minuten | — | offen |
| 29 | Reife | Support, Rechtliches, Vertrauen | 2 | C/R | Impressum, Datenschutz, AGB, Kontaktformular; Beta, keine Bewertungen | 2 | etabliertes Produkt, Hilfe-Center (Q2, mittel) | 4 | **hinten** |
| 30 | Reife | Sprache der Oberfläche | 1 | M | Editor nur Englisch, auch unter `/de` (A) | 2 | nicht verifiziert | — | offen |

**Gesamtpunkte**

| Auswertung | Kriterien | Gewichtspunkte | CaptionRush | Captions |
|---|---|---|---|---|
| Beidseitig belegt (Nr. 1, 2, 4, 8, 10, 17, 21, 29) | 8 | 19 von 64 | **60 / 95 (63 %)** | **73 / 95 (77 %)** |
| Nur CaptionRush, alle belegten Kriterien (Selbstbewertung) | 25 | 52 von 64 | 183 / 260 (70 %) | — |
| Ohne Beleg auf CR-Seite (5, 6, 12, 22, 28) | 5 | 12 von 64 | — | — |

Urteile: 2 × vorn (1, 21), 1 × gleich (10), 5 × hinten (2, 4, 8, 17, 29), 22 × offen (45 von 64 Gewichtspunkten).
Lesart: Die beidseitig belegte Teilmenge besteht vor allem aus Funktionsumfang, und da hat Captions mehr. Kernqualität (Transkription) und
Ausführungsqualität (Vorschau-Treue, Export, Robustheit) sind nur bei CaptionRush gemessen. Deshalb gibt es **kein Gesamturteil**.

## 4. Messergebnisse der Reise (Tester A)

6-s-Video 540 × 960 (WebM), Look «Bold Pop», Desktop 1280 × 800 und Handy 390 × 844 (Touch).

| Schritt | Desktop Klicks / s | Handy Taps / s |
|---|---|---|
| Landing laden | 0 / 0,9 | 0 / 0,5 |
| Video wählen → Untertitel (davon Mock 19 ms) | 1 / 1,4 | 1 / 1,1 |
| Look wählen | 2 / 0,9 | 2 / 0,7 |
| Wort korrigieren | 2 / 0,7 | 2 / 0,7 |
| Timeline: verschieben, teilen, Mehrfachauswahl + gemeinsam verschieben | 7 / 4,5 | 9 / 5,8 |
| Export-Sheet + E-Mail-Gate | 3 / 0,9 | 4 / 1,2 |
| MP4-Download (Ersatzweg) | 1 / 10,1 | 1 / 10,2 |
| SRT + VTT + TXT | 5 / 0,5 | 5 / 0,5 |
| Cover-PNG | 3 / 1,1 | 3 / 1,2 |
| **Summe** | **24** | **27** |

Kürzester Weg zum ersten MP4: **4 Klicks** (Upload, Export, E-Mail-Feld, Download), **≈ 14 s ohne Transkription**. Echte Transkriptionszeit
kommt dazu und ist nicht gemessen.

### Exportdauer und Ausgabe (Desktop, Median von 3, Ersatzweg MediaRecorder + ffmpeg.wasm)

| Quelle | Länge | Last hoch | Last niedrig | Faktor (niedrig) | Ausgabe |
|---|---|---|---|---|---|
| 540 × 960 | 6 s | 13,9 s | 11,8 s | 2,0 × | 540 × 960, 3,2 MB |
| 1080 × 1920 | 6 s | 19,3 s | 17,8 s | 3,0 × | 1080 × 1920, 6,1 MB |
| 540 × 960 | 30 s | 55,3 s | 52,5 s | 1,75 × | 540 × 960, 15,7 MB |
| 1080 × 1920 | 30 s | 84,4 s | 85,9 s | 2,9 × | 1080 × 1920, 32,4 MB |

ffprobe (alle 4): MP4, H.264 Constrained Baseline yuv420p, 30 fps, AAC-LC 48 kHz mono, Dauer = Quelle ±0,03 s. Aus Tester C: Querformat
1920 × 1080/6 s → 20 s; 4K/10 s → 45 s (Ausgabe 1080p); 3 min (320 × 568) → 247 s; 317 MB/19 s → 150 s.

**Was das für Nutzer heisst (nur benannt, nicht geschätzt):** Wer Firefox nutzt, eine WebM-Quelle hat oder einen Browser ohne WebCodecs, wartet
rund 2–3 × die Videolänge. Für Chrome/Edge/Safari mit MP4/H.264-Quelle gilt der WebCodecs-Weg; dessen Tempo ist **nicht gemessen**.

Frames: Untertitel sichtbar, nicht abgeschnitten, mittig bei 50–65 % der Bildhöhe, unteres Fünftel frei. SRT/VTT/TXT gültig (Zeitstempel,
`WEBVTT`-Kopf), Inhalt = Editor (7/7 Blöcke), Korrektur enthalten. Cover-PNG 1080 × 1920, 724 KB. Konsole: 0 Seitenfehler.

## 5. Looks-Qualität (Tester B)

24 Looks, Satz «Heute zeigen wir dir wie schnell das wirklich geht», Hintergründe hell/dunkel/bunt. Kontaktbogen:
`vergleich/looks/kontaktbogen-24-looks.jpg`; Umbruch: `umbruch-de-fi.jpg`, `umbruch-ar-ja.jpg`.

| Urteil | Looks |
|---|---|
| gut (9) | Bold Pop, Note, Classic, Highlight Box, Comic, One Word, Pill Box, Subtitle, Headline |
| ok (11) | Tight (Standard), Mix, Statement, Accent, Serif Bold, Reveal, Script, Clean Highlight, Karaoke, Dark Box, Marker |
| schwach (4) | Soft, Clean, Neon, Elegant (auf hell/bunt) |

- **Lesbarkeit:** Auf allen Hintergründen sicher sind nur die Kontur-/Box-Looks (≈ 19–21:1 lokaler Kontrast). Weisse Looks ohne Kontur
  erreichen auf hell ≈ 2:1; betroffen sind 12–13 von 24 (je nach Zählung, Marker hat eine Teil-Box), darunter der **Standard «Tight»**.
- **Safe-Area:** unten enden alle bei 68 % (Grenze 76,6 %), oben bei ≥ 53 %. Rechts (Grenze 87,5 %) verletzen **Dark Box** (92 %, schon beim
  Standardsatz; `checkSafeZoneCollision` captly.html:7215 schlägt an, Breite 3122–3128) und **Note** bei Langwort (93,5 %).
- **Umbruch:** Ein Satz mit 25 Wörtern wird korrekt in Blöcke mit 1–3 Zeilen geteilt; Kompositum und finnisches Langwort sauber getrennt
  (Schrift schrumpft bis 34 px). Japanisch bekommt einen **Bindestrich mitten im Wort** (Fallback `capHyphLang` → «en», captly.html:3449–3455,
  3519–3522). Arabisch/Japanisch ohne Tofu, aber nur über **Systemschriften** (nicht gebündelt, Risiko auf Geräten ohne Schrift). Arabisch
  wird bei Kursiv-Looks künstlich schräg gestellt.
- **Vorschau = Export:** Sweep `--quick --only=geom,pixel,anim` 146 ok, 0 FAIL, 0 XPASS. Seit dem Testlauf zusätzlich F1 (Export-Position =
  Vorschau, 0 px gemessen).
- **Gesamteindruck:** Typografie, Abstände, Kontur und Schatten sind sauber, die Schriftmischungen (Mix, Accent, Script, Serif Bold) wirken
  gestaltet. Animation (Pop ≈ 0,3 s) und Farbpalette (Gelb/Weiss/Türkis/Violett) sind knapp; mehrere Looks sind bekannte Genre-Vorlagen.
  Urteil: **professionell, aber nicht unverwechselbar**. Ob das mit Captions mithält, ist offen; deren Ausgabe lag nicht vor.

## 6. Robustheit (Tester C)

13 Fälle, **kein Absturz, kein Hänger**.

| Fall | Ergebnis | Schwere |
|---|---|---|
| Querformat 1920 × 1080 | Untertitel 2,6 s, Export 20 s, MP4 1920 × 1080 | ok |
| Rotation (Display-Matrix) | nicht prüfbar (Headless), nur Code (`rotationFromMatrix` captly.html:9811) | nicht geprüft |
| HEVC-MP4 | klare Meldung | ok |
| 4K 3840 × 2160, 10 s | Untertitel 3 s, Export 45 s, Ausgabe 1080p | ok |
| ohne Tonspur | «This video has no audio track — nothing to transcribe.» | ok |
| 0,5 s | Export 3 s, gültig | ok |
| 3 min | Export 247 s, gültig | ok |
| .txt/PNG als Video | abgelehnt, verständlich | ok |
| WebM bei 4 KB abgeschnitten | «Could not read the audio. Please use MP4, MOV or WebM.» (passt nicht zu defekter Datei) | niedrig |
| WebM bei 100 KB von 1,5 MB abgeschnitten | angenommen; **0-Byte-Export gilt als gespeichert**; Alert «MP4 conversion failed (maybe offline)…» (captly.html:10406, 10423–10427) | mittel |
| ~317 MB WebM | Untertitel 17–20 s, Export 150 s, gültig | ok |
| Export abbrechen | kein Abbrechen-Knopf; ✕ schliesst nur das Blatt, Export läuft weiter (captly.html:1329, 11337) | niedrig |
| Reload mitten im Export | bricht ab, Stand wiederhergestellt, zweiter Export gültig | ok |
| Reload, gleiches Video | Edits + Look zurück, keine neue Transkription; anderer Dateiname wird nicht erkannt (Schlüssel `name|size|dur`) | ok |
| Offline | «Network problem — check your connection.» nach ≈ 20 s, «Try again» ok | ok |
| Browser-Zurück | verlässt die App ohne Warnung (kein `beforeunload`); Autosave nach 800 ms | niedrig |
| Transkription 500/429 | verständliche Meldungen, Retry ok, einmaliges 429 heilt selbst | ok |

## 7. Reibungspunkte und Fehler (priorisiert)

Aufwand: S (< 1 Tag), M (1–3 Tage), L (> 3 Tage). Quelle: A/B/C = Tester, D = Dirigent (Code/Doku).

| # | Schwere | Fund | Beleg | Aufwand | Status |
|---|---|---|---|---|---|
| 1 | kritisch | Echte Transkription (Genauigkeit, Tempo) nicht gemessen; die Kernleistung ist unbelegt | D | M | offen |
| 2 | hoch | Schnellexport (WebCodecs, Chrome/Safari mit H.264) nie gemessen; gemessen nur Ersatzweg 1,75–3,0 × | A | S | offen |
| 3 | hoch | Standard-Look «Tight» und weitere 11–12 weisse Looks ohne Kontur auf hellem Material kaum lesbar (≈ 2:1) | B, Kontaktbogen | S–M | offen |
| 4 | hoch | Nach MP4-Export verschwinden SRT/VTT/TXT; «Export again» rendert neu (≈ 10 s+) | A, captly.html:11385–11396 | S | offen |
| 5 | hoch | Bezahlung abgeschaltet; ohne Live-Checkout kein Verkauf | D, `docs/abo-aktivierung.md` | M | offen |
| 6 | hoch | Dark Box verletzt die Safe-Zone rechts schon beim Standardsatz (92 %) | B, captly.html:7215, 3122–3128 | S | offen |
| 7 | hoch | Groq-Free-Tier: Kapazität bei Launch-Last ungeklärt | D, README | S | offen |
| 8 | mittel | Defekte Datei → 0-Byte-Export mit Erfolgsmeldung und irreführendem Alert | C, captly.html:10405–10427 | S | offen |
| 9 | mittel | Wasserzeichen-Regel und Texte (Landing, FAQ, JSON-LD, `llms.txt`) an Inhaber-Entscheid angleichen | D | S | in Arbeit |
| 10 | mittel | «1080p»-Beschriftung bei kleinerer Quelle falsch (kein Hochskalieren) | A, captly.html:11344 | S | offen |
| 11 | mittel | Editor nur Englisch, auch unter `/de` | A | L | offen |
| 12 | mittel | Kein Abbrechen-Knopf beim Export, keine Warnung bei Zurück/Schliessen | C, captly.html:1329, 11337 | S | offen |
| 13 | mittel | Note: Box ragt bei Langwort aus der Safe-Zone (93,5 %) | B | S | offen |
| 14 | mittel | CJK-Langwort mit Bindestrich mitten im Wort | B, captly.html:3449–3455, 3519–3522 | S | offen |
| 15 | mittel | Customizer auf dem Handy schlecht auffindbar | Auftraggeber | S–M | in Arbeit |
| 16 | mittel | Auto-Zoom ohne KI wirkungslos | Auftraggeber | S | in Arbeit |
| 17 | mittel | Handy-Tippflächen < 44 px (≈ 130 Stellen) | A, `reise/flow-phone.json` | M | teilweise behoben (≥ 32 px, F2) |
| 18 | mittel | Desktop-Timeline ohne Split-Knopf | A | S | offen |
| 19 | mittel | Arabisch/CJK nur Systemschriften (Tofu-Risiko) | B | M | offen |
| 20 | mittel | 16 Sprachen, Übersetzen nur nach Englisch | D | M | offen |
| 21 | mittel | Kein Trimmen/Schneiden | D | M–L | offen |
| 22 | niedrig | Pop-Animation schluckt bei lift/stack ≈ 0,3 s den Wortabstand | B, `looks/pop-wortabstand-lift.png` | S | offen |
| 23 | niedrig | Arabisch in Kursiv-Looks künstlich schräg | B | S | offen |
| 24 | niedrig | Meldung bei stark abgeschnittener WebM passt nicht («Could not read the audio») | C | S | offen |
| 25 | niedrig | Gleiches Video mit anderem Dateinamen wird nicht wiederhergestellt | C | S | offen |
| 26 | niedrig | Look-Wechsel gruppiert Untertitel neu (8 → 6 Blöcke); Verlust manueller Edits nicht geprüft | A | S | offen |
| — | — | Export-Position = Vorschau | F1, 0 px gemessen | — | **seit Testlauf behoben** |
| — | — | Cover-Akzent-Chips | F2 | — | **seit Testlauf behoben** |

## 8. Konkurrenz-Angaben mit Quellen

### 8.1 Captions (Marktführer-Annahme)

| Angabe | Quelle | Vertrauen |
|---|---|---|
| Pläne: Basic $9.99/Mt. (200 Credits; früher «Pro»), Max $24.99 (500), Frontier $69.99 (1 400), 2× $139.99, 4× $279.99; Guthaben max. 3 × Monatsmenge | Q2 | mittel |
| Abo gilt je Plattform (Desktop, iPhone) separat | Q2 | mittel |
| Basic/Pro-Export mit Wasserzeichen, wenn Co-Editor, AI Edit, KI-Medien oder AI Creator genutzt | Q1 | mittel |
| Gratis-Plan: 60–200 einmalige Credits, eine Vorlage, Export mit Wasserzeichen; andere Quelle: Gratis-Export ohne Wasserzeichen | Q9 vs. Q11 | niedrig (widersprüchlich) |
| «100+» Untertitel-Sprachen | Q3, Q10 | niedrig–mittel |
| Untertitel-Styling: Farben für Text, Hervorhebung, Aktivwort, Hintergrund; Kontur, Schatten | Q6 | mittel |
| iOS-Updates: neue Sprachen (Hindi, Slowenisch), Import/Export in 4:5 | Q7 | mittel |
| AI Edit (≤ 3 min, ein Sprecher), Eye Contact, Dubbing; Lipdub ab Max | Q8 | mittel |
| Studio-Untertitel-Ablauf: 4–60 s, nur 9:16 | Q5 | niedrig (unklar, ob gleiches Produkt) |
| Pro-Stufe im Juli 2026 von der Preisseite entfernt (vermutlich Umbenennung in Basic, vgl. Q2) | Q4 | niedrig |
| Genauigkeit, Tempo, Exportauflösung, Anzahl Looks, SRT-Export, Android-App, Datenfluss | — | nicht verifizierbar |

### 8.2 Nebenreferenzen (kurz)

| Produkt | Angabe | Quelle | Vertrauen |
|---|---|---|---|
| Submagic | Starter $19, Pro $39, Business $69/Mt.; gratis 3 Videos/Mt. ≤ 1:30 mit Wasserzeichen | Q12 | niedrig–mittel |
| CapCut | Auto-Untertitel teils gratis, Wasserzeichen nur bei Pro-Elementen; Pro $7.99–19.99 je nach Region; Angaben widersprüchlich | Q13 | niedrig |
| VEED | gratis 720p mit Wasserzeichen, max. 10 min; bezahlt ca. $9–24/Mt. | Q14 | niedrig |

### 8.3 Quellenliste (alle abgerufen am 10.10.2026 über WebSearch; Seiten selbst wegen DNS-Sperre nicht geöffnet)

- Q1 https://captions.ai/help/docs/troubleshooting/watermark (auch help.mirage.app/docs/troubleshooting/watermark)
- Q2 https://captions.ai/help/docs/subscriptions · https://captions.ai/help/docs/ai-usage
- Q3 https://captions.ai/pricing (laut Suchwerkzeug veraltet)
- Q4 https://usagepricing.com/blueprint/activity/captions-2026-07-23-packaging
- Q5 https://help.mirage.app/mirage/edit-videos/generate-captions
- Q6 https://captions.ai/help/docs/captions/styles · https://captions.ai/help/docs/api/video-caption-templates.md
- Q7 https://help.captions.ai/updates/ios
- Q8 https://captions.ai/features/correct-your-eye-contact · https://captions.ai/tools/lip-sync-ai · https://help.mirage.app/docs/project/ai-edit
- Q9 Captions-Hilfe-Center zum Gratis-Plan (Auszug in den Suchergebnissen, genaue URL nicht ausgewiesen)
- Q10 https://yespress.io/captions
- Q11 https://www.eesel.ai/blog/captions-ai-pricing (2025)
- Q12 https://fluxnote.io/guides/submagic-pricing-2026
- Q13 https://www.bigvu.tv/blog/capcut-pricing-2026-free-vs-pro-included-alternatives · https://vidpros.com/capcut-pro-vs-free/
- Q14 https://dupple.com/pricing/veed · https://www.capterra.com/p/193780/VEED/pricing/

## 9. Empfehlungen

### 9.1 Launch-Blocker (ohne diese kein Verkauf)

| # | Massnahme | Aufwand |
|---|---|---|
| 1 | Echte Transkription messen: 10–20 reale Reels (Hochdeutsch, Schweizerdeutsch, Englisch, eines mit Musik); Wortfehler grob zählen, Zeit bis zu den Untertiteln, Verhalten bei Groq-Limit | M |
| 2 | Export auf echten Geräten messen: Chrome/Windows und macOS mit MP4/H.264 (Schnellweg), iPhone Safari (HEVC), Android Chrome; Dauer, Datei, Lesbarkeit | S |
| 3 | Standard-Look lesbar machen: Standard auf einen Kontur- oder Box-Look stellen oder weisse Looks mit Kontur/Schatten versehen | S–M |
| 4 | SRT/VTT/TXT nach dem MP4-Export im Blatt lassen; «Export again» ohne Neu-Rendern (letzte Datei erneut speichern) | S |
| 5 | Bezahlung live schalten und testen; Wasserzeichen-Regel (Beta nie, danach ab 3. Video/Tag) in Code und Texten umsetzen (in Arbeit) | M |
| 6 | 0-Byte-Export abfangen (leere Aufnahme = Fehler mit klarer Meldung, kein «Saved») | S |
| 7 | Groq-Kapazität klären (Bezahl-Tier oder Limit pro Nutzer), Alarm über `ALERT_URL` prüfen | S |

### 9.2 Vor dem Verkaufsstart (stark empfohlen)

- Safe-Zone bei Dark Box und Note korrigieren (S).
- Beschriftung «1080p» an die tatsächliche Ausgabegrösse koppeln (S).
- Abbrechen-Knopf beim Export und `beforeunload`-Warnung bei laufendem Export oder ungesicherten Edits (S).
- Customizer auf dem Handy auffindbar machen, Auto-Zoom ohne KI wirksam machen (in Arbeit) (S–M).
- Split-Knopf in der Desktop-Timeline (S).
- CJK nicht mit Bindestrich trennen (S).

### 9.3 Danach

- Editor auf Deutsch, mindestens unter `/de` (L).
- Arabisch/CJK-Schriften lokal bündeln (Datenschutz-Regel: nie per CDN) (M); Arabisch nicht künstlich kursiv (S).
- Tippflächen am Handy auf 44 px (M).
- Übersetzen in weitere Sprachen über das vorhandene LLM (Untertitel, kein Dubbing) (M).
- Einfaches Trimmen von Anfang und Ende (M).
- Pop-Animation: Wortabstand halten, Animationsvielfalt erweitern (S–M).
- Wiederherstellung auch bei anderem Dateinamen; passende Meldung bei defekten Dateien (S).
- Echte Beispiele und Nutzerstimmen auf der Landing (S).

### 9.4 Nicht versuchen

- KI-Avatare, Dubbing/Lip-Sync, Eye Contact, Auto-Schnitt: Kernfelder von Captions mit hohem Rechen- und Entwicklungsaufwand.
- Eine native App, bevor belegt ist, dass die Web-Version auf echten Handys trägt.
- Mit «besser als Captions» werben, solange die Messung fehlt. Belegbar ist: «ohne Konto, ohne Wasserzeichen in der Beta, Video bleibt auf
  deinem Gerät, Vorschau = Export».
