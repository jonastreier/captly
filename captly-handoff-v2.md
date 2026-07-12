# Captly — Handoff v2 (Stand: 11.07.2026)

> **QA-Status: ✅ getestet.** `test-captly.js` (beiliegend) führt das komplette Script mit DOM-Stub in Node aus — 13 Testgruppen, alle grün (inkl. Halluzinations-Detektor, Sprach-Vorwahl, Landing-Widgets): Zeitformate (SRT/VTT), Timestamp-Sanitizing (null/NaN), Segment-Fallback, Block-Splits (Pause/Satzende), Karaoke- vs. Durchgehend-Modus, index-basiertes Highlight, Seek-Handler, SRT/VTT-Dateiformat, alle UI-Funktionen, Demo-Overlay, resplit nach Edit. Rerun: `python3 -c "import re;open('/tmp/c.js','w').write(re.search(r'<script>(.*)</script>',open('captly.html').read(),re.S).group(1))" && node test-captly.js`
> **Nicht automatisiert testbar** (braucht echten Browser + Video): Whisper-Inferenz, MediaRecorder-Export, Canvas-Rendering. → Manuell in Chrome testen: kurzes Video laden, DE + EN prüfen, Video-Export abspielen (Ton synchron?), PNG bei pausiertem Video.

Web-Tool für Instagram/TikTok-Captions, Klon von **captions.ai**. Eine Datei: `captly.html` (kein Build, kein Backend). Whisper läuft lokal im Browser via `@xenova/transformers@2.17.2` (esm.sh).

## ✅ Fertig (diese Version)

**Echter Karaoke-Modus (wie captions.ai)**
- Nur aktueller Block (2–6 Wörter, Slider) sichtbar; aktives Wort per Zeitstempel gehighlightet (Index-basiert, nicht mehr Wort-String-Vergleich)
- Blöcke splitten bei Sprechpausen >0.8s und Satzenden (`/[.!?…]$/`)
- Sync via `requestAnimationFrame` (`startCapLoop`), nicht mehr grobes `timeupdate`
- Modi: `karaoke` (Block nur während Sprechzeit) / `all` ("Durchgehend", Block bleibt bis zum nächsten)
- Render-Cache `_lastKey` verhindert DOM-Flackern; `capIn`-Animation nur bei Blockwechsel
- Pausiert: nächstliegender Block als Vorschau (`nearestBlockIdx`)
- Wort-Klick im Overlay + Word-Pills → seekt zur Stelle

**Whisper-Verbesserungen**
- Modellwahl Tiny (~40 MB) / Base (~145 MB), Pipelines gecacht in `whisperPipes{}`
- Sprachwahl-Dropdown `#langSel`: auto + 17 Sprachen (Whisper-Namen: `german`, `english`, …)
- Fix "Keine Sprache erkannt": Mono-Mix über alle Kanäle, Peak-Normalisierung auf 0.95, `language` wird nur gesetzt wenn manuell gewählt (kein `language:null` mehr)
- Fallback-Kette: Wort-Timestamps → Segment-Timestamps (`return_timestamps:true`, Wörter gleichmäßig verteilt via `segmentsToWords`) → purer Text über Audiodauer
- Modell-/Sprachwechsel triggert automatische Neu-Transkription

**Mehrzeilige Captions**: DOM bricht natürlich um (max-width 100%); Canvas-Export bricht bei 86 % Breite um, zentriert, `lh = fsS*1.28`

**Video-Export**: rendert aktiven Block (nicht mehr ganzes Transkript) mit Highlight-Farbe, Pill (`hlPillBg`), Outline (`cstroke` bei Viral/Impact), Glow, Gradient (Prism via `gradColors()`); `document.fonts.ready` vor Start; Seek auf 0 vor `recorder.start()` (Audio-Sync); VP9→VP8-Fallback, 8 Mbps; 120ms-Flush am Ende; Mute-Zustand wird restauriert

**Datenmodell**: `captionBlocks = [{words:[{word,start,end}], start, end, text}]` — Editor-Edit ruft `resplitBlock()` (verteilt Timestamps gleichmäßig neu)

## ✅ Design-Upgrade UMGESETZT (v2.1)

- **Landing im captions.ai-Stil**: Aurora-Background (3 Blobs, GPU-Transforms, `prefers-reduced-motion`-Fallback), Headline „Captions, die *knallen*. In Sekunden." mit animiertem Gradient, Live-Karaoke-Demo (4 Wörter, 420ms-Takt, stoppt bei `openEditor()`), Style-Marquee (20 Styles × 2, 30s-Loop, Fade-Mask, Hover pausiert), Stats-Zeile, Upload-Zone mit Lift+Glow
- **Editor-Polish**: Glass-Topbar, Grautöne aufgehellt
- **Perf**: ungenutzte Font (Caveat) entfernt

## ✅ Sprach-Fix v2 (Schweizerdeutsch-Bug) UMGESETZT

Problem: Tiny-Autodetect hielt CH-Deutsch für Englisch → Halluzinations-Schleife („We've worked for over 3 years" ×N).
Lösung (3 Schichten):
1. **Browser-Sprache als Default**: `navigator.language` (z. B. `de-CH` → `german`) wird beim Start im Dropdown vorgewählt — 'auto' bleibt wählbar
2. **Halluzinations-Detektor** `looksRepetitive()`: unique/total Wörter < 0.3 bei ≥12 Wörtern
3. **Smart-Retry**: Wenn 'auto' repetitiven Output liefert → automatisch mit Browser-Sprache erzwingen, nur übernehmen wenn Ergebnis sauber. Status zeigt verwendete Sprache an.

## ✅ Qualitäts-Upgrade v2.2 (Transkription)

- **Whisper-Small** als dritte Modellstufe (~250 MB, deutlich besser bei Dialekten/CH-Deutsch als Tiny/Base)
- **`cleanWords()`-Nachbearbeitung**: entfernt Stottern (>2 gleiche Wörter in Folge) und direkt wiederholte 3–8-Wort-Sequenzen (Halluzinations-Schleifen), iterativ bis stabil; legitime Doppelungen ("sehr sehr gut") bleiben
- **Qualitätswarnung**: Status zeigt ⚠️ + Tipp (Small + Sprache manuell), wenn Ergebnis noch repetitiv/zu kurz

**Realistische Einordnung**: captions.ai nutzt serverseitig Whisper-large. Im Browser (transformers.js v2, WASM/CPU) ist Small die praktische Obergrenze — gut, aber nicht large-Niveau. Der Sprung auf echtes Studio-Niveau ist Roadmap-Punkt 0.

## ✅ v2.4: Turbo-Modell + captions.ai-Style-Katalog

**🚀 Turbo (Studio-Qualität)**: 4. Modellstufe via `getPipe()`-Factory — tiny/base/small laufen weiter über transformers.js v2 (WASM, stabil), `turbo` lädt lazy `@huggingface/transformers@3.7.1` (jsdelivr) mit `device:'webgpu'`, `dtype:{encoder_model:'fp16',decoder_model_merged:'q4'}`, Modell `onnx-community/whisper-large-v3-turbo` (~1 GB, gecacht). WebGPU-Guard in `setModel()` (Alert + Verbleib, wenn `navigator.gpu` fehlt). **⚠️ Ungetestet im echten Browser — Turbo mit CH-Video in aktuellem Chrome verifizieren!**

**Styles = offizieller captions.ai-Katalog** (von captions.ai/styles übernommen, IDs in Klammern): Bloom (bloom, Featured/Default), Elevate, Ember, Ignite, Impact II (impact2), Paper II (paper2 — dunkler Serif-Text auf Creme-Box; Canvas nutzt jetzt `s.boxBg`-Farbe statt hardcoded Schwarz, heller Box-Hintergrund ohne dunklen Text-Halo), Prime, Sketch, Sonnet, Volt, Y2K, Chalk, Evo, Focus (Pill-Highlight, "built to convert"), Lift, Linen, Prism Pro (prismpro), Stack (stack — Ex-Hormozi-Look), Align, Neon. Entfernt: Hormozi/Viral/Karaoke/Orbit/Pop/Story/Kai/Editorial. Fonts: Bangers+Quicksand raus, Playfair non-italic 700 rein.

## ✅ v2.5: Cloud-Transkription (OpenAI API) + Light-Theme

**✨ Cloud · Maximum**: 5. Modellstufe = OpenAI Whisper API (`whisper-1`, `verbose_json`, `timestamp_granularities[]=word`). Audio wird als 16-kHz-Mono-WAV hochgeladen (`float32ToWav`, ~1.9 MB/Min, API-Limit 25 MB ≈ 13 Min). API-Key nur im Speicher (`openaiKey`, nie persistiert), Passwortfeld erscheint bei Cloud-Auswahl, Key-Eingabe triggert Transkription. Sprache als ISO-Code via `CODE_BY_LANG`. Fehler 401/413 mit klaren Meldungen. **Beste Qualität für CH-Deutsch — das ist jetzt der empfohlene Modus.**
⚠️ Sicherheit: Key liegt clientseitig — okay für persönliches Tool. Wenn öffentlich gehostet wird: Key NIE einbauen, stattdessen Mini-Proxy auf eigenem Host (siehe Roadmap).

**Light-Theme wie captions.ai-Website**: Pastell-Verlauf (rosa→lila→hellblau) auf der Landing, Aurora-Blobs pastellig, weiße Karten, schwarze Pill-Buttons (aktive Zustände `#111`), heller Editor (weiße Sidebar, `#eceaf0`-Preview-Bereich), Live-Demo in dunkler "Video-Pille", Marquee-Chips dunkel (Caption-Preview-Optik). Alle Grautöne für hellen Grund neu gesetzt.

## ✅ v3.0: Roadmap 1–6 umgesetzt + Fast/Perfect + Referenz-Styles

**Vereinfachte Modellwahl (User-Wunsch)**: nur noch **⚡ Fast · gratis** (= whisper-tiny lokal) und **💎 Perfect** (= OpenAI API, Key-Feld). base/small/turbo-Codepfade existieren weiter (getPipe), nur ohne Buttons.

**Referenz-Styles mit Font-Mix** (neue Style-Props `hlFont`, `hlItalic`, `hlUpper`, `circle` — in DOM `buildCap` UND Canvas `wordFont()` umgesetzt):
- **Prime**: Poppins 800 weiß + aktives Wort in Cyan-Caveat-Script kursiv (wie "know this *one tip*")
- **Sketch**: Kalam-Handschrift + aktives Wort uppercase Barlow Condensed mit gezeichnetem Kringel (Canvas: `ctx.ellipse`, wie "MINDMAP")
- **Sonnet**: Playfair-Serif, aktives Wort kursiv-weiß (wie "making *peace*")
- **Bloom**: + Caveat-Script-Akzent. Caveat-Font wieder geladen.

**Features 1–6**: ① MP4-Export: MediaRecorder versucht `video/mp4` zuerst (aktuelles Chrome), sonst WebM; Dateiendung passt sich an. ② Timing-Feinschliff: Slider ±500 ms (`timeOff`), wirkt auf Preview, Video-Burn-in UND SRT/VTT (`offT()`). ③ Eigener Style: 2 Farbwähler + Font-Dropdown → Style "Mein Style" (`applyCustomStyle`). ④ Keywords: Textfeld, kommagetrennt → Wörter dauerhaft in Highlight-Farbe (`isKeywordWord`, ohne Animation). ⑤ ~~Reframe~~ auf User-Wunsch wieder entfernt (v3.2) — Tool ist rein 9:16, Export immer im Originalformat. ⑥ Übersetzung: Checkbox "→ Englisch" — lokal `task:'translate'`, Cloud `/v1/audio/translations` (Segment-Timestamps → `segmentsToWords`).

**Bewusst NICHT umgesetzt** (User wollte "einfach & selbsterklärend"): ⑦ Batch-Queue (widerspricht Ein-Video-Editor-Einfachheit) und ⑧ Progressive Whisper (durch Fast/Perfect-Zweiteilung obsolet). Bei Bedarf später.

## 💎 Pro-Creator-Roadmap (Features, für die Creator zahlen würden)

0b. ✅ **Eigener Host — UMGESETZT (v3.1)**: `server.js` beiliegend (Node 18+, keine Dependencies). Hält den OpenAI-Key serverseitig, liefert captly.html aus, `POST /transcribe?lang=de&translate=0` nimmt WAV entgegen und proxied zu OpenAI (CORS offen, 25-MB-Limit). **Frontend-Logik**: Perfect ohne eingegebenen Key → automatisch same-origin `transcribe`-Proxy; mit Key → direkt zu OpenAI. Deploy: beide Dateien in einen Ordner, `OPENAI_API_KEY=sk-… node server.js`, fertig — Endnutzer brauchen keinen Key. Smoke-getestet (Routing/Static ✓; OpenAI-Call in Sandbox nicht möglich, auf echtem Host verifizieren). Noch offen: DB für Projekte/Konten (SQLite), Rate-Limiting gegen Missbrauch empfohlen bevor öffentlich!

Priorisiert nach Impact/Aufwand:

1. **MP4-Export** statt WebM — WebM kann Instagram/TikTok nicht direkt hochladen. Option A: `MediaRecorder` mit `video/mp4`-mimeType (Chrome 126+ unterstützt das teils). Option B: ffmpeg.wasm (~25 MB, lazy laden) für WebM→MP4-Remux. Das ist DER Kaufgrund #1.
2. **Wort-Timing manuell justieren**: Im Editor pro Wort Start/Ende per Drag oder ±0.1s-Buttons — Whisper liegt manchmal 100–200ms daneben, Pros wollen das fixen.
3. **Eigene Brand-Styles**: Farbe (Basis + Highlight), Font-Upload (.woff2 via FileReader), als Preset speichern — kein localStorage in Artifacts, stattdessen Export/Import als JSON-Datei.
4. **Emoji-/Keyword-Hervorhebung**: bestimmte Wörter dauerhaft in Highlight-Farbe oder mit Emoji dahinter (captions.ai "AI Emphasis").
5. **Auto-Reframe 9:16/1:1/16:9**: Export-Format wählbar, Video wird gecovert.
6. **Übersetzung**: Whisper `task:'translate'` liefert EN gratis dazu → zweite Caption-Spur.
7. **Batch-Queue**: mehrere Videos nacheinander transkribieren.
8. **Progressive Whisper**: erst Tiny-Ergebnis sofort zeigen, Base im Hintergrund nachladen und Ergebnis austauschen ("in Sekunden"-Gefühl).

## Bekannte Limits
- Video-Export am besten in Chrome (MediaRecorder/`captureStream`); Safari eingeschränkt
- Tonspur im Export: Element darf nicht gemutet sein (wird automatisch gehandhabt), User hört Video während Export
- Whisper Tiny bleibt bei schwierigem Audio ungenau → Base wählen

## Nächster Prompt (Vorlage)
```
Arbeite an captly.html weiter (beigefügt, alles in einer Datei, Stand v2.1 —
Karaoke-Modus, Sprach-Fix, Landing-Design und Qualitäts-Upgrade v2.2 sind
fertig, siehe captly-handoff-v2.md). Setze Roadmap-Punkt 0 um: WebGPU +
whisper-large-v3-turbo via @huggingface/transformers@3.x als Option
"Turbo · Studio" mit Fallback auf den bestehenden v2-Pfad. Danach Punkt 1:
MP4-Export via ffmpeg.wasm (lazy, WebM→MP4-Remux, Fallback WebM).
Teste mit test-captly.js (DOM-Stub-Harness, beiliegend) und erweitere ihn.
```
