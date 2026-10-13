# Usability-Report Gluephs: Sina (Freelance-Editorin, 6 Kunden, 15-25 Reels/Woche)

**Testumgebung:** Desktop 1280x800, kurz Tablet 768x1024. Transkription gemockt, Sign-in nicht verfügbar. Die Browser-Pane war ab der Hälfte "nicht angezeigt": keine Screenshots möglich. Visuelles Urteil nur aus DOM/CSS (Fonts, Farben, Animationsnamen). Die Canvas-Timeline konnte ich nicht per Maus ziehen (Drag/Trim/Multi-Select UNGETESTET). Ich habe auf eine eigene Origin (sina.localhost) gewechselt, weil localStorage zwischen den parallelen Testern geteilt wurde (siehe Bug 6).

## Persona
Sina, 29, Ein-Frau-Agentur: Gym, Café, Makler, 2 Coaches, DJ. Braucht pro Kunde ein festes Caption-Template, eigene Fonts, schnelle Wiederholung, bezahlbaren Export ohne Wasserzeichen. Vergleicht mit CapCut Pro, Submagic ($19+), Captions ($10-25).

## Top 5 Probleme
1. **HOCH: Templates nur im Browser (localStorage), Eigene Fonts nur in IndexedDB.** Ort: Style > "Save as template" / Export templates. Erwartet: Marken-Set (Template + Font) portabel. Passiert: Export-JSON (`gluephs-templates.json`, enthält intern noch `"app":"capivo"`) enthält nur den Fontnamen, nicht die Fontdatei. Auf neuem Rechner fehlt "Figtree Bold", Fallback-Font. Cache löschen = alles weg. Kein Cloud-Sync ohne Konto (Sign-in lokal nicht testbar).
2. **HOCH: Kein Batch/Queue, Kunden-Template wird nicht beim Upload gewählt.** Landing-Seite zeigt nur 11 Presets, keine "Meine Templates". `landInput` hat `multiple=false`. Pro Video: Datei wählen > Style-Tab > Template-Kachel > Export. Pro-Plan wirbt mit "Batch (coming soon)".
3. **MITTEL: Undo deckt nur Text/Timing, nicht Style.** Ort: Strg+Z nach Look-Wechsel (Comic). Erwartet: Look-Wechsel rückgängig. Passiert: Strg+Z machte stattdessen den vorherigen Caption-Split rückgängig, Look blieb. Gefährlich für schnellen Workflow.
4. **MITTEL: Kein Schneiden des Videos.** Weder Trim Anfang/Ende noch Teile entfernen. Einziger Weg: Export-Option "Cut silences & filler words" (Checkbox, ungetestet wegen Mock) und "Hide captions in pauses". Fehler/Versprecher entfernen geht nicht, also doch wieder CapCut/Premiere.
5. **MITTEL: Template-Handling.** "Rename" und "Delete" nutzen native `prompt()`/`confirm()` (keine Inline-Bearbeitung, kein Undo für Löschen). "Edit" verwirft stillschweigend vorher gemachte, ungespeicherte Änderungen (setzt auf gespeicherten Stand zurück), Button heißt dann "Update". Export-Button für Templates gibt kein Feedback; Import desselben Files zeigt keine Meldung und restauriert kein gelöschtes Template (Tombstone mit gleicher ID gewinnt).

## Top 5 positiv
1. **Export extrem schnell:** WebCodecs-Schnellexport, 8-s-Clip in 0.7 s, H.264 (avc1.64001F), 2 MB; **nie Wasserzeichen**, Dateiname `<titel>-gluephs.mp4` (Titel = Dateiname, editierbar).
2. **Template-System ist gut gedacht:** Save/Update/Duplicate/Rename/Delete, Standard-Template ("Use for every new video", Stern), speichert Font, Farben, Animation, Motion, Position, Zeilen, Emoji/Keyword/Zoom-Flags.
3. **Tiefe Anpassung:** 55+ Fonts + Upload eigener Font (klappte mit .ttf), Keyword-Font separat, Glow/Box/Pill/Outline, Buchstaben-/Zeilenabstand, Timing-Offset, "Break at scene cuts", Auto-Zoom (Subtle/Punchy).
4. **"Caption another video / Keeps your style"** nach dem Export: 1 Klick zurück zur Dateiauswahl; E-Mail-Gate nur einmal, "Skip this next time" vorhanden.
5. **Ehrliche Preise:** Free Beta, Creator $7.99, Pro $14.99, SRT/VTT/TXT, 16:9 > 9:16 (blur fill/crop), Shortcuts (Space, Pfeile ±1 s/±0.1 s, Strg+Z/Shift+Z, Enter teilt, Backspace verschmilzt), Safe-Zone-Overlay.

## Klick-Messung (3 Videos, Templates Gym/Café/DJ)
- Video 1 (Standard-Template Gym): Upload (1) + Export (1) + "Skip" (1) + "Download video" (1) = ca. 4 Klicks.
- Video 2/3 mit anderem Template: "Caption another" (1) + Datei (1) + Style-Tab (1) + Template-Kachel (1) + Export (1) + Skip/Download (2) = **ca. 7 Klicks, ~5 mit "Skip next time"**. Rechenzeit pro Clip < 2 s (Mock), Rest ist Klicken. Bei 20 Reels/Woche ca. 100-140 Klicks, ohne Batch/Queue zu viel.
- App merkt sich Einstellungen: Standard-Template greift bei neuem Video; aber siehe Bug 2.

## Fehlende Trend-Looks (konkret)
Vorhanden: Bold Pop (Hormozi), Comic (Beast), Karaoke, Neon, Highlight/Pill/Dark Box, One Word, Marker usw. = 24 Looks, solide, aber 2024-Stand. Fehlt für 2026:
1. **Gradient-/Verlaufsfüllung** (z. B. Gelb>Orange auf Highlight-Wort) und **Multi-Color-Cycling** pro Wort (grün/gelb/weiß im Wechsel, Submagic-Stil).
2. **Per-Wort-Farbe/-Größe** (nur Ein/Aus-Highlight, 1 Farbe) und **Emoji/Sticker zwischen Wörtern** statt am Zeilenende (nur 40 feste Emoji, keine Suche).
3. **Bounce/Overshoot mit Squash & Stretch** pro Wort, **Shake/Glitch-Reveal** (Pop, Punch, Lift, Fade, Glow reichen nicht), **Typewriter** und **Karaoke-Wischer** mit Weichzeichner-Einlauf.
4. **3D-/Extrude-Text und weiche Hintergrundunschärfe-Box** (Glassmorphism), **animierte Unterstreichung / Marker-Sweep** pro Keyword.
5. Presets mit Namen, die Kunden suchen ("Hormozi", "MrBeast", "Iman Gadzhi", "Ali Abdaal"): Namen existieren intern (`hormozi`, `beast`), in der UI nur als "Bold Pop"/"Comic". SEO/Wiedererkennung.

## Vergleich
- **CapCut Pro** (ca. 8-10 EUR): echtes Schneiden, Effekte, Musik, Mobile+Desktop, Cloud-Templates. Gluephs: schneller, ohne Account, sauberer Export, aber **kein Schnitt**. CapCut gewinnt als Allrounder.
- **Submagic ($19+):** mehr Trend-Looks, B-Roll, Emoji-Auto, Cloud, Batch. Gluephs: günstiger, Templates besser kontrollierbar, aber weniger "wow"-Looks und Konto/Sync fehlen.
- **Captions ($10-25):** Gluephs ist als reines Caption-Tool konkurrenzfähig bei Speed und Preis.

## Zahlungsbereitschaft
**8-12 EUR/Monat**, wenn: Batch/Queue (mehrere Videos, je Video ein Template), Cloud-Sync der Templates inkl. Fonts, Basis-Trim. Mit Batch + Sync wären **$14.99 (Pro) vertretbar**; $7.99 (Creator) nur, wenn Sync/Projekte enthalten sind. Ohne Schnitt zahlt sie nichts über 8 EUR, weil CapCut Pro dann reicht.

## Wunsch-Features
1. **Batch/Queue mit Kunden-Zuordnung:** 10 Clips droppen, Template pro Clip oder pro Ordner, ein Klick "alle exportieren" (Ersparnis ca. 1 h/Woche).
2. **Brand-Kit je Kunde (Template + Font + Farben + Logo/Intro) als Cloud-Workspace, exportierbar als ein File inkl. Font:** Wechsel zwischen 6 Kunden und Rechnerwechsel ohne Verlust.
3. **Trim/Cut im Editor** (Start/Ende ziehen, Pausen löschen, ripple), dazu "Look für alle Videos des Kunden anwenden" und Style-Undo.

## Bugs mit Reproduktion
1. **Standard-Template vs. zuletzt benutzter Look:** Gym als Standard setzen > Video 1/2 öffnen: Gym wird angewendet. Dann Preset "Comic" klicken > "Back" > neue Datei hochladen: Comic (`capivo.style=beast`) statt Gym (`capivo.brandTpl` blieb auf Gym). Erwartet: Standard-Template immer.
2. **Strg+Z macht Look-Wechsel nicht rückgängig** (siehe Problem 3): Caption splitten, Preset "Comic" klicken, Strg+Z > Split weg, Look bleibt.
3. **Taste "S" (Split, Tooltip nennt "(S)") tat nichts** bei pausiertem Video mit Playhead in Caption (Tool-Tastendruck `s` und `KeyS`); Button "Split" funktioniert ("Split into two captions"). Evtl. Tool-Artefakt, bitte gegenprüfen.
4. **Klick auf Template-Kachel wirkte per Automations-Klick auf die Kachelmitte nicht** (Style bleibt, `capivo.style` ändert sich), Klick auf das Namenslabel oder `.click()` wirkte. Unklar, ob nur Tool-Artefakt, sonst kritisch (Kachel-Thumbnail anklicken ist der natürliche Weg).
5. **Template-Import:** Export > Template löschen > dieselbe Datei importieren: kein Fehler, keine Meldung, Template bleibt gelöscht (gleiche ID). Mit neuer ID klappt der Import, aber ebenfalls ohne Bestätigung.
6. **Mehrere Tabs/Fenster überschreiben sich:** Mit zwei Tabs auf derselben Origin (hier 3 parallele Tester) verschwanden meine Templates und `capivo.style` sprang auf fremde IDs (Last-Write-Wins in `capivo_templates`). Wer 2 Fenster offen hat, verliert Templates.
7. **Kleinkram:** Auflösungs-Dropdown bietet "Source size (recommended)" und "Original" mit identischer Auflösung (verwirrend); Template-Dateiname/JSON zeigt noch "capivo"; Rename/Delete per nativem Dialog; Emoji-Picker ohne Suche (40 Emojis inkl. 🐄🌿🌾🥩🏡, passt nicht zu Gym/DJ).
8. **Tablet (768x1024):** kein horizontales Scrollen, aber 30 Bedienelemente < 32 px (Splitt/Snap/Close gaps 26 px hoch), Vorschau nur ca. 390 px breit. Für iPad grenzwertig (Apple empfiehlt 44 px).

*Aufräumen:* Mein Tab ist geschlossen, der Hilfs-Webserver (nur für Font-Upload-Test) beendet. Der "seed"-Tab, der beim Öffnen der Pane entstand, ist noch offen.
