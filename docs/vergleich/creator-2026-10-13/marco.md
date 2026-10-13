# Marco (38, Business-Coach & Podcaster, CH) - Usability-Test Gluephs

## Persona
Marco schneidet 3-4 Clips/Woche aus 16:9-Podcast-Aufnahmen (Mac/Chrome) fuer LinkedIn, YT Shorts, Instagram. Braucht Brand-Look (Font, Hex-Farben, Logo-safe), exakte Namen, SRT, minimale Zeit pro Clip. Heute: Descript + Premiere. Tests: Chrome-Pane 1440x900, Mock-Transkription. Hinweis: Screenshots fielen ab ca. der Halbzeit aus (Pane versteckt), Rest per DOM geprueft. Fuer sauberen Test lief ich auf 127.0.0.1:8791 (eigener localStorage), weil localhost:8791 mit anderen Testern geteilt wird.

## Top 5 Probleme
1. **HOCH - Output-Format zu eng** (Export > Options > Format): nur "Original / 9:16 blur fill / 9:16 crop". Erwartet: 9:16, 1:1, 4:5, 16:9 waehlbar, am besten mehrere in einem Rutsch. Passiert: kein 1:1/4:5. Crop ist fix zentriert, Drag im Preview schwenkt nicht (Klick startet nur Play) -> Sprecher bei Zwei-Personen-Podcast ausserhalb Mitte wird abgeschnitten. Formatwahl steckt in einem eingeklappten "Options"-Dropdown und ist nicht Teil des Templates.
2. **HOCH - Farben ohne Hex-Eingabe** (Style > Text/Highlight/Keywords/Box/Outline): nur native `<input type=color>`, kein Hex-Feld, keine Markenfarben-Palette, kein Pipette-Hinweis. Zusaetzlich zeigt Preset "Clean" im Text-Swatch #ffffff, gespeichert wird aber `rgba(255,255,255,0.6)` -> Text bleibt 60 % grau, obwohl Swatch "weiss" zeigt. Brandfarbe nicht verlaesslich exakt.
3. **MITTEL/HOCH - Deutsche Seite, englischer Editor** (captly.de.html -> Upload -> Editor): Editor komplett englisch ("Export", "Names & terms", "Re-transcribe to apply", Tooltips, Platzhalter "Untitled video"). Auch DE-FAQ nennt Feld «Names & terms», Chips "So good" / "+14 more in the editor" unuebersetzt. Fuer einen deutschsprachigen Business-Coach wirkt das unfertig. Zudem ist `/de` lokal 404 ("nf"), der DE-Link der Landing fuehrt ins Leere (evtl. nur lokal).
4. **MITTEL - Preis-/Wasserzeichen-Kommunikation widerspruechlich**: Pricing "Free ... no watermark", Export-Sheet "never a watermark", FAQ aber "ab dem 3. Video pro Tag kleines Wasserzeichen" (und im Export-Sheet versteckter Button "Upgrade to remove the watermark"). Preise nur in USD ($7.99/$14.99), Creator/Pro "Coming soon", nichts zu Rechnung/MwSt/CHF. Vertrauensrisiko, kein Plan, den Marco heute buchen koennte.
5. **MITTEL - SRT nicht fuer YouTube/LinkedIn gedacht**: SRT folgt den Reel-Schnipseln (3-4 Woerter, z.B. "Das ist ein kurzer"), keine Option fuer 2 Zeilen/42 Zeichen oder Satz-Segmente; Dateiname `<Titel>-gluephs.srt` (Branding-Suffix, nicht abschaltbar). Cover ist nur 1080x1920, kein 16:9-Thumbnail (YouTube) und kein Logo-Overlay.

Weitere Reibung: Sicherheitszone-Button zeigt beim 16:9-Original ein irrefuehrendes Raster (sinnvoll erst in 9:16), nicht je Plattform (LinkedIn/Shorts/Reels). Schrift-Groesse max 54 px (relativ zur Bildbreite), Gewichte nur Regular/Semi/Bold/Extra/Black (kein Light/Medium). Keine Logo-Einblendung, keine Markenkit-Seite. Template-Export enthaelt keine Fonts/Format.

## Top 5 positiv
1. **Sehr schnell**: Upload -> Editor mit Captions in ~2 s; MP4-Export (8 s, 540x960) in wenigen Sekunden, ~2 MB, ohne Wasserzeichen, ohne Konto.
2. **Template-Workflow gut**: "Save as template" speichert Font, Gewicht, Farben, Box (inkl. Deckkraft/Radius), freie Position (hoff/voff), Groesse, Woerter/Zeilen. Erstes Template wird automatisch Standard; 2. Video uebernahm Manrope/Bold/#f5a623/Box #0a2540 sofort. Menue: Standard setzen, Edit, Rename, Duplicate, Delete.
3. **Freie Positionierung** per Drag im Preview (horizontal + vertikal), Top/Mittel/Unten als Schnellwahl, eigene Schrift hochladbar (+ 56 Google-Fonts).
4. **Textkorrektur stark**: Find & Replace mit Zaehler ("Replace all (1)") + "Ganzes Wort"; "Names & terms" bleibt ueber Videos erhalten (capivo.vocab); Enter teilt, Backspace am Anfang verbindet, Shift+Enter = manueller Umbruch (nicht dokumentiert, funktioniert); START/END +/-0.1 s pro Caption; max. Zeichen/Zeile (8-40), Timing-Offset, "Satzzeichen entfernen".
5. **Timeline + Undo/Redo**: S teilt am Playhead (sinnvoller Toast "Move the playhead between two words to split"), Delete loescht, Ctrl+Z / Ctrl+Shift+Z stellen korrekt wieder her. SRT/VTT/TXT/Copy Text direkt ohne E-Mail-Gate; Template-Export als JSON (gluephs-templates.json) zur Weitergabe an die Assistenz; Re-Export zeigt "Last export ... Download again" neben neuem "Download video".

## Vergleich zu Descript / Captions
- Vs. Descript: Gluephs ist viel schneller zum ersten MP4 und hat gutes Brand-Template; Descript hat Texteditor-Schnitt, Multitrack, Speaker-Labels, Team-Brand-Kit, Auto-Reframe. Gluephs wird bei Marco Descript fuer Captions ersetzen koennen, den Schnitt aber nicht.
- Vs. Captions/Submagic/Opus: dort Auto-Reframe mit Gesichtstracking, B-Roll, mehrere Formate - hier nur zentrierter Crop. Dafuer wirkt Gluephs deutlich "erwachsener" (Clean/Subtitle/Serif-Looks) und ohne Abo-Zwang.

## Zahlungsbereitschaft
- Heute: 0, bis Hex-Eingabe, 1:1/4:5/Reframe und CH-Preise da sind.
- Dann CHF 12-20/Monat (Creator-Plan) fuer: Brand-Kit (Fonts/Farben/Logo/Position fix), 1080p-Export in mehreren Formaten, SRT-Optionen, 12+ Clips/Monat. Bis CHF 25-30 mit Auto-Reframe/Batch/Team-Sharing von Templates. $7.99 wirkt attraktiv, aber nur wenn Brand-Funktionen drin sind.

## Wunsch-Features
1. **Multi-Format-Export + Auto-Reframe (Gesicht folgen)**: ein 16:9-Clip -> 9:16, 1:1, 4:5 gleichzeitig; Crop manuell schwenkbar. Spart pro Clip 10+ Min Premiere.
2. **Brand-Kit statt Einzel-Template**: Hex-Eingabe, Logo-Overlay mit Safe-Zone, Glossar (Namen) und Export-Preset (Format + Aufloesung + SRT-Variante) in einem teilbaren Link/Datei.
3. **Batch/Queue**: 3-4 Clips hochladen, gleiche Marke + Glossar, am Ende alle MP4/SRT als ZIP.

## Bugs / Auffaelligkeiten mit Repro
1. **Editor nicht uebersetzt auf DE-Seite**: `http://localhost:8791/captly.de.html` -> Video hochladen -> alle Editor-Labels englisch (`document.documentElement.lang`="de").
2. **`/de` 404 lokal**: Landing (EN) -> Link "DE" -> Seite zeigt nur "nf". (Wahrscheinlich nur Dev-Server-Rewrite.)
3. **Farb-Swatch luegt**: Style "Clean" waehlen -> Text-Swatch #ffffff, Template speichern -> JSON `tc: rgba(255,255,255,0.6)`; Text bleibt grau.
4. **Pfeiltasten tun nichts nach Klick auf Timeline-Chip** (Hinweis im Shortcut-Menue: Pfeile/Shift+Pfeile verschieben Caption bzw. Playhead): Chip anklicken, ArrowRight/Shift+ArrowRight -> Start/End und Playhead unveraendert, Fokus bleibt auf `<canvas>`. Evtl. Artefakt der Test-Tastatur (KeyboardEvent kam an, Handler griff nicht). Vor Release manuell pruefen. "S" fehlt im Shortcut-Menue (funktioniert aber).
5. **Template-"..."-Menue bleibt offen**: Style > "My templates" > "..." -> Escape und Scrollen schliessen es nicht; es schwebt ueber anderen Controls bis zum Klick daneben.
6. **Irrefuehrende Aufloesungs-Dropdown**: Export > Options > Resolution zeigt bei 16:9/720p zwei Eintraege "Source size ... (recommended)" und "Original ... " (beide 1280x720, Werte "1080"/"orig") - nicht unterscheidbar; bei 9:16-Crop erscheint "1080p (recommended)" erst nach Formatwechsel. 540x960-Quelle wird nicht auf 1080x1920 hochskaliert (kein Hinweis).
7. **Toast "Saved as 'Brunner Coaching Brand'"** erscheint nochmals beim Oeffnen des Cover-Dialogs (alter Toast, verwirrend).
8. **"Re-transcribe to apply"** hat kein sichtbares Feedback und keine Warnung, ob Handkorrekturen ueberschrieben werden (im Test blieben sie erhalten).
9. **Shared localStorage ueber Testtabs**: capivo_templates/Default-Template werden zwischen Tabs derselben Origin geteilt (nur fuer Tester relevant; fuer Nutzer: Templates leben nur im Browser, kein Konto-Sync, Anmeldung lokal nicht testbar).
