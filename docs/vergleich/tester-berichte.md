# Berichte der Tester A, B, C (Auszug des Orchestrators, 10.10.2026)

Alle Messungen: Chromium 141 headless (Playwright), Mock-Server (Mock-Transkription, Mock-Supabase), 4 Kerne, drei Tester liefen parallel (Zeiten pessimistisch, Load 2–15). Kein H.264-Decoder/-Encoder im Headless: der schnelle WebCodecs-Exportweg und der MediaRecorder-MP4-Weg sind NICHT gemessen (Quelle VP8/WebM, Export über MediaRecorder + ffmpeg.wasm). Belege: `docs/vergleich/reise/`, `looks/`, `robust/`.

## Tester A «Reise» (6-s-Video 540×960, Look Hormozi)

| Schritt | Desktop Klicks / s | Handy Taps / s |
|---|---|---|
| Landing laden | 0 / 0,9 | 0 / 0,5 |
| Video wählen → Untertitel (Mock-Transkription 19 ms) | 1 / 1,4 | 1 / 1,1 |
| Look wählen | 2 / 0,9 | 2 / 0,7 |
| Wort korrigieren | 2 / 0,7 | 2 / 0,7 |
| Timeline: verschieben, teilen, Mehrfachauswahl + gemeinsam verschieben | 7 / 4,5 | 9 / 5,8 |
| Export-Sheet + E-Mail-Gate | 3 / 0,9 | 4 / 1,2 |
| MP4-Download | 1 / 10,1 | 1 / 10,2 |
| SRT+VTT+TXT | 5 / 0,5 | 5 / 0,5 |
| Cover-PNG | 3 / 1,1 | 3 / 1,2 |
| Summe | 24 | 27 |

Kürzester Weg bis zum ersten MP4: 4 Klicks (Upload, Export, E-Mail-Feld, Download); ≈ 14 s ohne Mock-Anteil.

Exportdauer Desktop (Median von 3; Echtzeit-Weg MediaRecorder + ffmpeg.wasm → H.264/AAC-MP4; Phasen 30 s: Rendern ≈ 38 s, Umkodierung 17 s (540p) / 47 s (1080p)):

| Quelle | Länge | Last hoch | Last niedrig | Verhältnis (niedrig) | Ausgabe |
|---|---|---|---|---|---|
| 540×960 | 6 s | 13,9 s | 11,8 s | 2,0× | 540×960, 3,2 MB |
| 1080×1920 | 6 s | 19,3 s | 17,8 s | 3,0× | 1080×1920, 6,1 MB |
| 540×960 | 30 s | 55,3 s | 52,5 s | 1,75× | 540×960, 15,7 MB |
| 1080×1920 | 30 s | 84,4 s | 85,9 s | 2,9× | 1080×1920, 32,4 MB |

ffprobe (alle 4): mov/mp4, H.264 Constrained Baseline yuv420p, 30 fps, AAC LC 48 kHz mono, Dauer = Quelle ±0,03 s, 4,2 Mbit/s (540p) bzw. 8,2–8,6 Mbit/s (1080p).
«1080p by default» nur teilweise zutreffend: 540×960-Quelle → 540×960-Ausgabe (kein Hochskalieren, `exportGeometry` captly.html:10214); 4K → 1920×1080 (Option «Original»: 3840×2160). Beschriftung «MP4 · 1080p · no watermark» (captly.html:11344) und «1080p (recommended)» stimmt bei kleinerer Quelle nicht.
Frames: Untertitel sichtbar, nicht abgeschnitten, Position mittig 50–65 % Bildhöhe (unteres Fünftel frei). SRT/VTT/TXT gültig, Inhalt = Editor-Blöcke (7/7), Korrektur enthalten. Cover-PNG 1080×1920, 724 KB, Titel sichtbar. Konsole: 0 pageerror, 0 Dialoge (nur Mock-404/503).

Reibungspunkte (A):
1. (hoch) Nach dem MP4-Export verschwinden SRT/VTT/TXT aus dem Sheet (`exportDone` blendet `expMain` aus, captly.html:11385–11396); «Export again» rendert das Video NEU (≈ 10 s+). SRT/VTT/TXT nur über Sheet schliessen und neu öffnen.
2. (mittel) «1080p»-Beschriftung bei kleinerer Quelle.
3. (mittel) Handy: ~130 Elemente mit Tippfläche < 44 px (SRT/VTT/TXT 37×35, Undo/Redo/More 38×40, Checkboxen 18–20 px, −/+ und «Delete caption» 32×32 destruktiv, Slider 8–16 px). Liste in `reise/flow-phone.json` (`smallTargets`). Hinweis: nach A-Messung hat F2 viele Handy-Tippflächen auf ≥ 32–36 px vergrössert (Sweep: 0 Warnungen < 32 px); die 44-px-Empfehlung wird noch nicht überall erreicht.
4. (mittel) Editor komplett Englisch, auch unter `/de`; nur die Landing ist übersetzt.
5. (mittel) Desktop-Timeline hat keinen Split-Knopf (nur Enter im Textfeld; Handy: Split disabled bis ein Block gewählt).
6. (niedrig) Blöcke grenzen lückenlos: mittlerer Block lässt sich nicht verschieben (klemmt am Nachbarn); Rückmeldung nicht geprüft.
7. (niedrig) E-Mail-Gate kostet +1 Tap (Handy +2 mit Häkchen).
8. (niedrig) Look-Wechsel gruppiert Untertitel neu (8 → 6 Blöcke bei Hormozi); Verlust manueller Edits nicht geprüft (P1/P7 haben Layout-Resets für Regler behoben).
9. (info) H.264-MP4-Quelle im Headless: klare Meldung «This browser can't play this H.264 video — open CaptionRush in Chrome, Safari or Edge.» (Headless-Grenze).
Fund Tester B nebenbei: Exportdefault «1080p (recommended)» liefert bei 540×960-Quelle 540×960, kein Upscale.

## Tester B «Looks» (24 Looks, Satz «Heute zeigen wir dir wie schnell das wirklich geht», 3 Hintergründe hell/dunkel/bunt)

Sweep `--quick --only=geom,pixel,anim`: 146 ok, 0 FAIL, 0 xfail, 0 XPASS, 0 Warnungen. Vorschau = Export: Standbild-IoU ≥ 0,98 (Ausnahmen minimal hell 0,91, lift bunt 0,90, statement bunt 0,92, tight bunt 0,92); Position ≤ 3 px (1080er-Referenz), Grösse meist ≤ 4 px; Ausreisser soft (dx 9, dw 14), minimal/hush/tiktok (dh 8–10), vermutlich Mess-Rauschen bei hellen Texten.
Safe-Area: unten alle Looks enden bei 68 % (Grenze 76,6 %); oben höchste Caption 53 % (Grenze 11,5 %); rechts Grenze 87,5 % — Verletzung bei stack (92 %) und note bei Langwort (93,5 %).
Lesbarkeit (lokaler Kontrast Text/Umgebung, hell/dunkel/bunt): sicher auf allen Hintergründen nur die 6 Outline-/Box-Looks hormozi, classic, boxkara, beast, popone, headline (≈ 19–21:1), dazu tiktok/hush/stack (Box). Weisse Looks ohne Kontur ≈ 2:1 auf hell (und teils bunt): tight (Standard), mix, statement, accent, serifbold, reveal, script, soft, minimal, lift, neon, editorial, marker.
Urteile: gut 9 (hormozi, note, classic, boxkara, beast, popone, tiktok, hush, headline), ok 11 (tight, mix, statement, accent, serifbold, reveal, script, lift, focus, stack, marker), schwach 4 (soft, minimal, neon, editorial: auf hell/bunt).
Umbruch: 25-Wörter-Satz korrekt in 1–3-Zeilen-Blöcke; Kompositum und finnisches Langwort sauber getrennt (Schrift schrumpft auf 34–70 px; classic/stack nur 34 px); Arabisch/Japanisch ohne Tofu (Systemschriften), 0 Tofu im Canvas-Test.
Funde: (1) stack verletzt Safe-Zone beim Standardsatz (Box 7,8–92,2 %; `checkSafeZoneCollision` captly.html:7215 schlägt bei 3/9 Blöcken an; Breitenberechnung 3122–3128) — hoch. (2) note: Box ragt bei Langwort bis 93,5 % — mittel. (3) CJK-Langwort bekommt Bindestrich mitten im Wort («国際連合安全保障理事会-», `capHyphEligible`/`capHyphenate` 3449–3455, Fallback `capHyphLang` 3519–3522 «en») — mittel. (4) Arabisch wird bei Kursiv-Looks künstlich schräg gestellt — niedrig. (5) Weisse Looks ohne Kontur auf hell/bunt kaum lesbar; Standard-Look tight gehört dazu — mittel (Design-Entscheidung, aber betrifft jeden Nutzer). (6) Pop-Animation (lift, stack) schluckt Wortabstand ~0,3 s — niedrig.
Gesamteindruck: Typografie, Abstände, Kontur/Schatten sauber; Schriftmischungen (mix, accent, script, serifbold) gestaltet; Animation und Farbpalette eher knapp (Pop ~0,3 s, Gelb/Weiss/Türkis/Violett); mehrere Looks Genre-Vorlagen. Grenzen: Headless, Systemlast, Export über Echtzeit-Weg (Zeitversatz 0–9 Frames unter Last nicht repräsentativ), Arabisch/CJK nur Systemschriften (nicht gebündelt; Tofu-Risiko auf Geräten ohne Schrift), Safari/iOS nicht geprüft.

## Tester C «Robustheit» (13 Fälle, kein Absturz/Hänger)

| Fall | Ergebnis | Schwere |
|---|---|---|
| Querformat 1920×1080 (6 s) | Untertitel 2,6 s, Export 20 s, MP4 1920×1080 H.264/AAC | ok |
| Rotation (Display-Matrix) | im Headless nicht prüfbar (kein H.264-Decoder); nur Code gelesen (`rotationFromMatrix` captly.html:9811) | nicht geprüft |
| HEVC-MP4 | klare Meldung «Most Compatible…» | ok |
| 4K 3840×2160 (10 s) | Untertitel 3 s, Export 45 s, Ausgabe 1920×1080 (Standard) | ok |
| ohne Tonspur | «This video has no audio track — nothing to transcribe.» | ok |
| sehr kurz 0,5 s | Export 3 s, 0,486-s-MP4 | ok |
| 3 min (320×568) | Untertitel 6 s, Export 247 s, 180 s Ausgabe gültig | ok |
| `.txt`/PNG als Video | abgelehnt mit verständlicher Meldung | ok |
| WebM bei 4 KB abgeschnitten | «Could not read the audio. Please use MP4, MOV or WebM.» (passt nicht zu defekter Datei) | niedrig |
| WebM bei 100 KB von 1,5 MB abgeschnitten | wird angenommen; Export erzeugt 0-Byte-Datei, gilt als «gespeichert»; alert «MP4 conversion failed (maybe offline) — saving as WebM instead…» | **mittel** (captly.html:10406, 10423–10427) |
| ~317 MB WebM (19 s) | Untertitel 17–20 s, Export 150 s, MP4 gültig | ok (Speicherbedarf nicht gemessen) |
| Export «abbrechen» | es gibt keinen Abbrechen-Knopf; ✕ schliesst nur das Sheet, Export läuft weiter und lädt herunter (captly.html:1329, 11337); zweiter Export danach gültig | niedrig |
| Reload mitten im Export | bricht ab ohne Download; Stand wiederhergestellt; zweiter Export gültig | ok |
| Reload, gleiches Video | Edit und Look kommen zurück, 0 neue Transkription; gleiches Video unter anderem Dateinamen wird nicht erkannt (Schlüssel `name|size|dur`, Z. 8046) | ok |
| Offline vor/während Transkription | «Network problem — check your connection. Please try again.» (nach ~20 s), danach «Try again» ok | ok |
| Browser-Zurück im Editor | verlässt App ohne Warnung (kein `beforeunload`); Autosave nach 800 ms (Z. 8080) | niedrig |
| Transkription 500 / 429 | verständliche Meldungen («Transcription service is busy…», «Free-tier limit reached… ~2 min»), Retry ok, einmal-429 heilt automatisch | ok |

Konsole: nur Mock-Rauschen. Grenzen: Headless ohne H.264 (WebCodecs-Schnellweg und Rotation nicht geprüft), Mock statt Groq, kein echtes Handy, kein Safari/iOS; 20-Min-Kürzung (`MAX_AUDIO_SEC`, Z. 2285, Hinweis 8993) nur abgelesen.
