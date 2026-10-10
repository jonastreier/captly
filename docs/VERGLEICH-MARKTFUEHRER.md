# CaptionRush im Vergleich mit dem Marktführer «Captions»

Stand: 10.10.2026 · Code-Stand: Commit `d2509a9` (Branch `claude/brave-hopper-u6e756`) · Status des Berichts: **Gerüst mit Teilmessung**

> **Wichtig vorab:** In dieser Sitzung stand dem Dirigenten **kein Agent-Werkzeug** zur Verfügung. Die geplanten Tester A (Reise), B (Looks) und
> C (Robustheit) konnten deshalb nicht gestartet werden. Die Aufträge liegen fertig formuliert in
> [`docs/vergleich/tester-auftraege.md`](vergleich/tester-auftraege.md). Felder, die erst diese Tester füllen, sind mit **«— (Tester A/B/C)»** markiert.
> Gemessen hat der Dirigent nur eine Stichprobe: den bestehenden Browser-Test `node test-e2e.js` (Abschnitt 4.1).
> Zusätzlich war **WebFetch komplett gesperrt** (DNS-Fehler für jede Domain); die Konkurrenzseite stützt sich nur auf Suchergebnis-Auszüge
> (WebSearch). Offizielle Seiten wurden also nie direkt gelesen — höchstes Vertrauen deshalb «mittel».

## 1. Fazit (vorläufig)

1. **Verkaufsreif: noch nein.** Bezahlen ist abgeschaltet (`BILLING_ENABLED=false`, Preise «Coming soon»), und die wichtigste Produktleistung —
   die Genauigkeit der echten Transkription — ist in diesem Vergleich nicht gemessen. Als **kostenlose Beta** ist das Tool vorzeigbar.
2. **«Besser als die Konkurrenz»** lässt sich **nicht belegen**, weder insgesamt noch für die Kernleistung. Belegt sind nur einzelne Punkte.
3. **Vorn (vorläufig, aus dem Code):** kein Konto bis zum Download, MP4 ohne Wasserzeichen in der Beta, Video bleibt im Browser (nur Ton
   geht an Groq/USA). **Stärken ohne Konkurrenzbeleg:** Vorschau = Export (0 px Versatz gemessen), SRT/VTT/TXT, Cover und Post-Text inklusive.
4. **Hinten (recherchiert, Vertrauen mittel):** Sprachen (16 gegenüber «100+»), Übersetzen nur nach Englisch (Captions: Dubbing/Lip-Sync),
   kein KI-Videoschnitt (AI Edit, Eye Contact, Rauschentfernung), keine native App, Editor nur Englisch, keine Marke, keine Bewertungen.
5. **Offen:** Transkriptions-Genauigkeit und -Tempo, Look-Qualität im direkten Vergleich, Handy-Erlebnis gegen eine native App, Exporttempo
   auf echten Geräten, Robustheit bei 4K/HEVC/grossen Dateien.
6. **Positionierung, die tragen kann:** «Untertitel für Reels, ohne Konto, ohne Wasserzeichen, datensparsam, DACH-tauglich» — ein schmales,
   klares Angebot. Ein Gegenentwurf zum KI-Komplettstudio von Captions, kein Ersatz dafür.
7. **Preis:** geplant $7.99/300 min und $14.99/1200 min; Captions laut Hilfe-Center $9.99 (Basic) bis $24.99 (Max) mit Credits, die sich nicht
   1:1 in Minuten umrechnen lassen. Nominell günstiger, Wert-Vergleich offen.
8. **Risiko Botschaft:** Sobald Abos aktiv sind, bekommt der Gratis-Plan laut Code ein Wasserzeichen (`needsWatermark()`, captly.html:8237–8240).
   Das Hauptargument «no watermark» kippt dann; Landing, FAQ und `llms.txt` müssen vorher angepasst werden.
9. **Launch-Blocker** (Abschnitt 9): echte Transkription an 10–20 realen Reels messen, Bezahlung live schalten und testen, Groq-Kapazität klären,
   die Tester A–C laufen lassen und deren kritische Funde beheben.
10. **Nicht versuchen:** Captions bei KI-Avataren, Dubbing oder Auto-Schnitt einzuholen; das ist ein anderes Produkt mit anderem Budget.

## 2. Annahmen und Grenzen

- **Marktführer-Annahme:** «Captions» (captions.ai, App von Mirage; Hilfe-Center unter captions.ai/help bzw. help.mirage.app). CapCut,
  Submagic und VEED nur als Nebenreferenz (Abschnitt 8.2).
- **Konkurrenz nur recherchiert.** Kein Konto, kein Bezahl-Export, keine Bedienung. WebFetch war gesperrt; jede Angabe stammt aus
  WebSearch-Auszügen (Abruf 10.10.2026). Quellen widersprechen sich teilweise (z. B. Gratis-Plan mit oder ohne Wasserzeichen). Store-Treffer
  für «Captions: for Talking Videos» u. ä. waren **Nachahmer-Apps** und wurden verworfen.
- **CaptionRush gemessen, aber nur teilweise.** Transkription lief gegen einen **Mock** (feste Wörter aus `test-e2e.js`), nicht gegen Groq.
  Genauigkeit, Tempo und Ausfallverhalten der echten Transkription sind **nicht gemessen**. Headless-Chromium hat **keinen H.264-Decoder**:
  Testquellen sind VP8/WebM; der WebCodecs-Schnellexport für MP4-Quellen ist damit nicht abgedeckt.
- **«Aus dem Code»** (Kennzeichen C) heisst: abgelesen, nicht im Browser beobachtet. **«Gemessen»** (M) heisst: im Browser/ffprobe beobachtet.
- Punkte 0–5 sind **vorläufig**. Eine Gesamtpunktzahl wird erst berechnet, wenn beide Seiten belegt sind; vorher wäre sie irreführend.

## 3. Bewertungsmatrix

Art: **M** = an CaptionRush messbar (Tester), **C** = aus dem Code abgelesen, **R** = Konkurrenz nur recherchiert. Quellen-IDs (Q…) siehe Abschnitt 8.
Urteil «vorn/gleich/hinten» nur mit Beleg, sonst «offen».

| # | Phase | Kriterium | Gew. | Art | CaptionRush (Beleg) | CR | Captions (Quelle, Vertrauen) | Cap | Urteil |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Einstieg | Konto nötig bis zum ersten Ergebnis | 3 | C/M | Nein; E-Mail erst vor dem ersten MP4 (README «Beta», E2E: Gate vor Export) | 5 | Konto mit Abo je Plattform (Q2, mittel) | 3 | vorn (vorläufig) |
| 2 | Einstieg | Installation / Plattformen | 2 | C | Nur Browser, keine App | 3 | iOS-App, Desktop/Web (Q2, Q7, mittel) | 4 | hinten (vorläufig) |
| 3 | Einstieg | Dateiarten, Grösse, Länge | 2 | C/M | `video/*`; max. 20 Min Ton (`MAX_AUDIO_SEC`, captly.html:2285); > 150 MB über ffmpeg.wasm; HEVC nur mit Decoder | — (C) | Studio-Ablauf 4–60 s, 9:16 (Q5, niedrig) | — | offen |
| 4 | Transkription | Sprachen | 2 | C/R | 16 (FAQ captly.html:37) | 2 | «100+» (Q3, Q10, niedrig–mittel) | 5 | hinten |
| 5 | Transkription | Genauigkeit (de, CH-Dialekt, en) | 3 | — | **nicht gemessen** (Mock) | — | nicht verifizierbar | — | offen |
| 6 | Transkription | Tempo | 2 | — | **nicht gemessen** (Mock) | — | nicht verifizierbar | — | offen |
| 7 | Transkription | Namen/Begriffe, Korrektur-KI | 1 | C | «Names & terms» + Polish-LLM | 4 | nicht verifiziert | — | offen |
| 8 | Transkription | Übersetzen | 2 | C/R | Nur nach Englisch (Whisper translate, captly.html:1549) | 1 | Dubbing, Lip-Sync (Lipdub ab Max) (Q8, mittel) | 5 | hinten |
| 9 | Looks | Anzahl Looks | 2 | C/R | 24 + «Style Drops» (`styles.json`, derzeit leer) | 3 | Vorlagen-Galerie, Anzahl nicht verifiziert (Q6) | — | offen |
| 10 | Looks | Anpassbarkeit | 3 | C/R | Schrift (auch eigene, 5 × 3 MB), Farben, Grösse, Position, Gross-/Kleinschreibung | 4 | Text-, Hervorhebungs-, Aktivwort-, Hintergrundfarbe, Kontur, Schatten (Q6, mittel) | 4 | gleich (vorläufig) |
| 11 | Looks | Wort-Animation (Pop, Reveal, Fill) | 2 | M | E2E: Word pop Skalierung 1,28 in < 300 ms; Rest — (Tester B) | — | «Active word» (Q6, mittel) | — | offen |
| 12 | Looks | Keyword-/Emoji-Hervorhebung | 2 | C/M | KI-Keywords (Standard an), Emojis, Auto-Zoom (README «Enhance») | — | Hervorhebungsfarbe (Q6); KI-Emojis nicht verifiziert | — | offen |
| 13 | Looks | Lesbarkeit, Safe-Area, Umbruch | 3 | M | Silbentrennung de/en/fr/it/es, Umbruchregeln (C); — (Tester B) | — | nicht verifizierbar | — | offen |
| 14 | Bearbeiten | Text korrigieren | 3 | M | E2E grün; Klicks/Zeit — (Tester A) | — | vorhanden (Q6, mittel) | — | offen |
| 15 | Bearbeiten | Timeline (verschieben, teilen, Mehrfachauswahl) | 2 | M | E2E: Bereich verschoben Desktop +0,5 s, Handy +0,3 s; Rest — (Tester A) | — | nicht verifiziert | — | offen |
| 16 | Bearbeiten | Undo, Autosave, Projekte | 2 | C/M | Undo 100 Schritte (captly.html:11943), lokales Autosave (5 Videos), Cloud-Projekte nur mit Login | — | Cloud-Projekte mit Konto (Q2, mittel) | — | offen |
| 17 | Bearbeiten | Videobearbeitung über Untertitel hinaus | 2 | C/R | Zoom-Punch-in, 9:16 Blur/Crop; **kein Trim/Schnitt** im Code gefunden | 1 | AI Edit (≤ 3 min, 1 Sprecher), Eye Contact, Rauschentfernung (Q8, mittel) | 5 | hinten |
| 18 | Vorschau | Vorschau = Export | 3 | M | **0 px Versatz**, 90–94 % der Untertitel-Pixel am erwarteten Ort (E2E, Abschnitt 4.1) | 5 | nicht verifizierbar | — | offen (CR belegt) |
| 19 | Export | Formate | 2 | C/M | MP4 + SRT + VTT + TXT + Cover-PNG | 5 | MP4; SRT nicht verifiziert | — | offen |
| 20 | Export | Auflösung, fps, Qualität | 2 | M | Standard «1080p», wahlweise Originalgrösse (C); ffprobe — (Tester A) | — | 4:5-Export (Q7); Auflösung nicht verifiziert | — | offen |
| 21 | Export | Wasserzeichen / Gratis-Limits | 3 | C/R | Beta: kein Wasserzeichen gegen E-Mail; Server: 30 Min Ton/h/IP, 120 Anfragen/h | 5 | Gratis: Credits (60–200 einmalig) und/oder Wasserzeichen; Pro/Basic mit KI-Funktionen → Wasserzeichen (Q1 mittel, Q9 niedrig) | 2 | vorn (nur solange Beta) |
| 22 | Export | Exporttempo, Stabilität | 2 | M | 6-s-Export ok (E2E); Tempo — (Tester A), Abbruch/Wiederholung — (Tester C) | — | nicht verifizierbar | — | offen |
| 23 | Extras | Cover / Titelbild | 1 | C/M | PNG 1080 × 1920, 7 Looks, Profilraster-Hilfslinien | 4 | nicht verifiziert | — | offen |
| 24 | Extras | Post-Text + Hashtags | 1 | C | KI-Vorschlag im Export-Blatt | 4 | nicht verifiziert | — | offen |
| 25 | Extras | Vorlagen / Brand-Standard | 1 | C | Vorlagen speichern/importieren (JSON), «Use for every new video» | 3 | Vorlagen (Q6, API-Galerie), Brand Kit nicht verifiziert | — | offen |
| 26 | Handy | Handy-Erlebnis | 3 | M | E2E 390 px: kein horizontales Scrollen, keine Konsolenfehler; Rest — (Tester A) | — | native iOS-App (Q7, mittel); Qualität nicht verifizierbar | — | offen |
| 27 | Datenschutz | Datenfluss, Anbieter | 2 | C/R | Video bleibt lokal; Ton → Hostpoint (CH) → Groq (USA); keine CDNs/Google-Fonts (Test) | 4 | Video-Upload in die Cloud (Funktionsweise), Details nicht verifiziert | — | vorn (vorläufig, Architektur) |
| 28 | Preis | Preis / Wert | 3 | C/R | Beta gratis; geplant $7.99/300 min, $14.99/1200 min (captly.html:1853–1854) | — | Basic $9.99/200 Credits, Max $24.99/500, Frontier ab $69.99 (Q2, mittel) | — | offen (nominell günstiger) |
| 29 | Reife | Support, Rechtliches, Vertrauen | 2 | C | Impressum, Datenschutz (DE/EN), AGB, Kontaktformular; Beta, keine Bewertungen | 2 | etabliertes Produkt, Hilfe-Center (Q2) | 4 | hinten |
| 30 | Reife | Sprache der Oberfläche | 1 | C | Landing DE/EN, **Editor nur Englisch** (README) | 2 | nicht verifiziert | — | offen |

**Zwischenstand:** 3 × vorn (1, 21, 27; alle vorläufig), 1 × gleich (10), 5 × hinten (2, 4, 8, 17, 29), 21 × offen (darunter 18: nur die
CaptionRush-Seite ist belegt; 30: wahrscheinlich hinten). Eine gewichtete Gesamtsumme ist erst nach den Tester-Läufen sinnvoll; die offenen
Kriterien tragen 43 von 64 Gewichtspunkten.

## 4. Messergebnisse der Reise

### 4.1 Stichprobe Dirigent: `node test-e2e.js` (10.10.2026, Headless-Chromium, Mock-Server)

| Messung | Desktop 1280 × 800 | Handy 390 × 844 |
|---|---|---|
| Prüfungen gesamt | 118 grün, 0 rot (beide Viewports zusammen) | |
| E-Mail-Gate vor erstem Export | sichtbar | sichtbar |
| MP4-Download (6-s-Quelle 540 × 960 WebM) | 2 993 561 B | 3 051 620 B |
| Dauer der Ausgabe | 6,033 s | 6,033 s |
| Bild und Ton im Export | ja | ja |
| Untertitel-Pixel am erwarteten Ort | 94 % von 19 808 px | 90 % von 30 464 px |
| Versatz MP4 gegenüber Vorschau | 0 px | 0 px |
| Konsolen-/Seitenfehler | keine | keine |
| Horizontales Scrollen | — | keines |

Grenze: Mock-Transkription; WebM-Quelle (kein H.264 im Headless-Chromium); Zeiten pro Schritt hat der Test nicht ausgewiesen.

### 4.2 Reise Schritt für Schritt — (Tester A)

| Schritt | Desktop Klicks | Desktop s | Handy Taps | Handy s | Bemerkung |
|---|---|---|---|---|---|
| Landing → Editor | — | — | — | — | |
| Upload → Untertitel (Mock, separat) | — | — | — | — | Mock-Zeit nicht repräsentativ |
| Look wählen | — | — | — | — | |
| Text korrigieren | — | — | — | — | |
| Timeline: verschieben/teilen/Mehrfachauswahl | — | — | — | — | |
| Export-Sheet + E-Mail-Gate | — | — | — | — | |
| MP4-Download | — | — | — | — | |
| SRT/VTT/TXT | — | — | — | — | |
| Cover-PNG | — | — | — | — | |
| **Zeit bis zum ersten Download (ohne Mock)** | | — | | — | |

### 4.3 Export und Ausgabedatei — (Tester A)

| Quelle | Exportdauer | Faktor zur Videolänge | Weg (WebCodecs/MediaRecorder) | Codec | Auflösung | fps | Audio | Grösse |
|---|---|---|---|---|---|---|---|---|
| 6 s, 540 × 960 | — | — | — | — | — | — | — | — |
| 6 s, 1080 × 1920 | — | — | — | — | — | — | — | — |
| 30 s, 540 × 960 | — | — | — | — | — | — | — | — |
| 30 s, 1080 × 1920 | — | — | — | — | — | — | — | — |

Offene Prüffrage: Bedeutet «1080p by default», dass eine 540 × 960-Quelle hochskaliert wird? — (Tester A)

## 5. Looks-Qualität — (Tester B)

Eingebaut (aus dem Code, 24): Tight, Mix, Statement, Accent, Serif Bold, Reveal, Note, Script, Soft, Classic, Bold Pop, Highlight Box, Comic,
Clean, Clean Highlight, One Word, Pill Box, Subtitle, Karaoke, Headline, Dark Box, Neon, Elegant, Marker.

| Look | hell | dunkel | bunt | Safe-Area | Umbruch (de/fi/ar/ja) | Animation | Vorschau ↔ Export (px) | Urteil |
|---|---|---|---|---|---|---|---|---|
| (24 Zeilen) | — | — | — | — | — | — | — | — |

Gesamteindruck «professionell, nicht generisch?»: — (Tester B). Kontaktbogen: `docs/vergleich/looks/` (noch leer).

## 6. Robustheit — (Tester C)

Aus dem Code bekannt (nicht gemessen): max. 20 Min Ton werden transkribiert (sichtbarer Hinweis bei Kürzung, captly.html:8993); Video ohne
Tonspur → Meldung «This video has no audio track — nothing to transcribe.» (captly.html:8586); > 150 MB und iOS → ffmpeg.wasm (captly.html:8579);
HEVC ohne Decoder → Video-Export gesperrt, SRT/TXT gehen (README); 4K-Export ≈ 1,5 × Videolänge (README, nicht gemessen).

| Fall | Ergebnis | Meldung (Wortlaut) | verständlich | Absturz/Hänger | Schwere |
|---|---|---|---|---|---|
| Querformat | — | — | — | — | — |
| Hochformat mit Rotation | — | — | — | — | — |
| 4K | — | — | — | — | — |
| Ohne Tonspur | — | — | — | — | — |
| < 1 s | — | — | — | — | — |
| 3 min | — | — | — | — | — |
| Kaputte / falsche Datei | — | — | — | — | — |
| ~300 MB | — | — | — | — | — |
| Abbruch Export + zweiter Export | — | — | — | — | — |
| Neu laden + Wiederherstellen | — | — | — | — | — |
| Offline | — | — | — | — | — |
| Browser-Zurück | — | — | — | — | — |
| Transkription 429/500 | — | — | — | — | — |

## 7. Reibungspunkte und Fehler (priorisiert)

Bisher nur aus Code und Doku; Tester-Funde werden ergänzt. Aufwand: S (< 1 Tag), M (1–3 Tage), L (> 3 Tage).

| # | Schwere | Fund | Beleg | Aufwand |
|---|---|---|---|---|
| 1 | kritisch | Echte Transkription (Genauigkeit, Tempo, Fehlerfälle) für den Vergleich nie gemessen — Kernleistung unbelegt | Abschnitt 2 | M |
| 2 | hoch | Bezahlen abgeschaltet; ohne Live-Checkout kein Verkauf | README «Abos», `docs/abo-aktivierung.md` | M |
| 3 | hoch | Mit aktiven Abos: Gratis-Export mit Wasserzeichen → Werbeversprechen «no watermark» (Landing, FAQ, JSON-LD, `llms.txt`) muss vorher angepasst werden | captly.html:8237–8240, 1164, 37 | S |
| 4 | hoch | Transkription läuft über Groq-Free-Tier (README); Kapazität und Limits bei Launch-Last nicht geklärt | README Z. 10, 72 | S |
| 5 | hoch | Login/Cloud-Projekte funktionieren nur mit eigenem SMTP in Supabase (README); Status für die Live-Instanz hier nicht prüfbar | README «Mailversand» | S |
| 6 | mittel | Editor nur Englisch, obwohl Zielmarkt DACH (Landing ist deutsch) | README Z. 34 | L |
| 7 | mittel | Übersetzen nur nach Englisch; 16 Sprachen gegenüber «100+» beim Marktführer | captly.html:1549, 37 | M |
| 8 | mittel | Kein Trimmen/Schneiden des Videos; Nutzer brauchen für Schnitt ein zweites Tool | grep nach Trim ohne Treffer | L |
| 9 | niedrig | HEVC-Quellen ohne Decoder: kein Video-Export (häufig bei iPhone-Videos in Chrome/Windows) | README «Bekannte Grenzen» | M |
| — | — | Funde Tester A/B/C | — | — |

## 8. Konkurrenz-Angaben mit Quellen

### 8.1 Captions (Marktführer-Annahme)

| Angabe | Quelle | Vertrauen |
|---|---|---|
| Pläne: Basic $9.99/Mt. (200 Credits; früher «Pro»), Max $24.99 (500), Frontier $69.99 (1 400), 2× $139.99, 4× $279.99; Guthaben max. 3 × Monatsmenge | Q2 | mittel |
| Abo gilt je Plattform (Desktop, iPhone) separat | Q2 | mittel |
| Pro/Basic-Export mit Wasserzeichen, wenn Co-Editor, AI Edit, KI-Medien oder AI Creator genutzt | Q1 | mittel |
| Gratis-Plan: 60–200 einmalige Credits, eine Vorlage; Export mit Wasserzeichen — andere Quelle: Gratis-Export ohne Wasserzeichen | Q9 vs. Q11 | niedrig (widersprüchlich) |
| «100+» Untertitel-Sprachen | Q3, Q10 | niedrig–mittel |
| Untertitel-Styling: Text-, Hervorhebungs-, Aktivwort-, Hintergrundfarbe, Kontur, Schatten | Q6 | mittel |
| iOS-Updates: neue Sprachen (Hindi, Slowenisch), Import/Export in 4:5 | Q7 | mittel |
| AI Edit (≤ 3 min, ein Sprecher), Eye Contact, Dubbing; Lipdub ab Max | Q8 | mittel |
| Studio-Untertitel-Ablauf: 4–60 s, nur 9:16 | Q5 | niedrig (unklar, ob gleiches Produkt) |
| Pro-Stufe im Juli 2026 von der Preisseite entfernt (vermutlich Umbenennung in Basic, vgl. Q2) | Q4 | niedrig |
| Genauigkeit, Tempo, Exportauflösung, Anzahl Looks, SRT-Export, Android-App | — | nicht verifizierbar |

### 8.2 Nebenreferenzen (kurz)

| Produkt | Angabe | Quelle | Vertrauen |
|---|---|---|---|
| Submagic | Starter $19, Pro $39, Business $69/Mt.; Gratis 3 Videos/Mt. ≤ 1:30 mit Wasserzeichen | Q12 | niedrig–mittel |
| CapCut | Auto-Untertitel teils gratis, Wasserzeichen nur bei Pro-Elementen; Pro $7.99–19.99 je nach Region; Angaben widersprüchlich | Q13 | niedrig |
| VEED | Gratis 720p mit Wasserzeichen, max. 10 min; bezahlt ca. $9–24/Mt. | Q14 | niedrig |

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

**Vor dem Verkaufsstart (Launch-Blocker)**
1. Echte Transkription messen: 10–20 reale Reels (Hochdeutsch, Schweizerdeutsch, Englisch, ein Video mit Musik), Wortfehlerrate grob zählen,
   Zeit bis zu den Untertiteln, Verhalten bei Groq-Limit. Ohne diese Zahl kein Qualitätsversprechen (M).
2. Tester A–C laufen lassen (`docs/vergleich/tester-auftraege.md`), kritische und hohe Funde beheben, danach diesen Bericht vervollständigen (M).
3. Bezahlung in der Sandbox und einmal live testen (`docs/abo-aktivierung.md`); Gratis-Regeln festlegen und Landing/FAQ/`llms.txt` daran
   anpassen (Wasserzeichen ja/nein) (M).
4. Groq-Kapazität klären (Bezahl-Tier oder Limit pro Nutzer) und den Alarm über `ALERT_URL` prüfen (S).
5. Einmal end-to-end auf echten Geräten: iPhone Safari (HEVC-Video), Android Chrome, Windows Chrome mit MP4/H.264 (S).

**Nach dem Start**
- Editor auf Deutsch (grösster Hebel für DACH) (L).
- Übersetzen in weitere Sprachen über das vorhandene LLM (Untertitel, nicht Dubbing) (M).
- Einfaches Trimmen (Anfang/Ende) (M).
- Sichtbare Belege auf der Landing: echte Vorher/Nachher-Beispiele, Nutzerstimmen, sobald vorhanden (S).

**Nicht versuchen**
- KI-Avatare, Dubbing/Lip-Sync, Eye Contact, Auto-Schnitt: Kernfelder von Captions mit hohem Rechen- und Entwicklungsaufwand.
- Eine native App vor dem Nachweis, dass die Web-Version auf dem Handy trägt.
- Mit «besser als Captions» werben, solange die Messung fehlt; besser: «ohne Konto, ohne Wasserzeichen, Video bleibt auf deinem Gerät».
