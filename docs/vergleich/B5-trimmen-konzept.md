# B5 Trimmen: Konzept (14.10.2026)

## Ausgangslage
- Beide Export-Pfade können schon Bereiche überspringen: `cutRegions` (Liste `{start,end}` in Quellzeit).
  - Fast-Pfad (WebCodecs): rechnet die Zeitstempel neu, Bild und Ton bleiben synchron.
  - Echtzeit-Pfad (MediaRecorder): springt beim Abspielen über die Bereiche.
- Die Bereiche liefert heute nur der Auto-Cut (`computeCutRegions` aus den Wort-Timings).
- Untertitel werden zur **Quellzeit** gezeichnet. Im eingebrannten Video folgen sie dem Schnitt deshalb automatisch.
- **Bestehender Fehler:** SRT und VTT (`captly.html` ~Z. 10564/10572, `offT`) ignorieren Schnitte. Mit Auto-Cut laufen Untertitel-Datei und MP4 auseinander.

## Modell
- `trimIn`, `trimOut` (Quellzeit, Standard 0 / Dauer) und `manualCuts` (`[{start,end}]`) gehören pro Video ins Projekt und ins Autosave. Ins Template gehören sie **nicht**.
- Gemeinsame reine Funktion `allCutRegions(dur)` liefert eine sortierte, zusammengeführte Liste aus:
  - `[0,trimIn]` und `[trimOut,dur]`,
  - `manualCuts`,
  - den Auto-Cut-Bereichen, falls an.
- Beide Export-Pfade, die Längenprüfung (`validateExportBlob`, erwartete Dauer) und die Anzeige «−x,x s» nutzen nur diese Funktion.
- Gemeinsame reine Funktion `srcToOut(t, regions)`: Quellzeit → Ausgabezeit. `null`, wenn `t` in einem Schnitt liegt.
  - SRT, VTT und TXT-Zeitmarken nutzen sie.
  - Cues, die vollständig im Schnitt liegen, entfallen.
  - Teilweise geschnittene Cues werden auf den sichtbaren Rest geklemmt.

## Bedienung
- Timeline: Griffe an Anfang und Ende (Trim). Geschnittene Bereiche erscheinen schraffiert.
- Ausschneiden:
  - Bereich auf der Timeline wählen (vorhandene Bereichsauswahl) → Knopf «Cut out» oder Taste X.
  - Alternativ I und O am Abspielkopf setzen.
  - Ein schraffierter Bereich lässt sich per Klick → «Restore» wiederherstellen.
- Vorschau-Wiedergabe springt über Schnitte (wie der Echtzeit-Pfad). Die Zeitanzeige zeigt optional die Ausgabezeit.
- Undo/Redo: Jede Trim- oder Schnitt-Aktion ist ein Schritt, mit derselben Snapshot-Mechanik wie die Look-Schritte aus A2.
- Handy: Trim-Griffe ≥ 44 px. «Cut out» in der Aktionsleiste der Timeline.

## Grenzen
- Mindestlänge eines Rests 0,2 s.
- Schnitte frame-genau, weil neu kodiert wird. Keyframes spielen keine Rolle.
- Kein Überblenden an Schnitten in v1. Optional später 2–3 Frames Audio-Fade gegen Knackser, im Fast-Pfad pro Schnittkante.

## Tests
- Reine Funktionen:
  - `allCutRegions` zusammenführen und sortieren, mit Trim, manuellen Schnitten und Auto-Cut.
  - `srcToOut` an den Grenzen.
  - SRT mit Schnitten: Zeiten gegen eine Hand-Rechnung.
- Browser mit v1:
  1. Trim 1,0–18,0 s, dazu ein manueller Schnitt 6,0–8,0 s.
  2. Exportdauer = 15,0 s ± 1 Frame.
  3. Frame bei Ausgabezeit 5,5 s = Quellframe bei 8,5 s (1,0 s Trim davor, Schnitt 6,0–8,0 s beginnt bei Ausgabezeit 5,0 s). Vergleich per mittlerer Pixelabweichung gegen die Quelle.
  4. SRT-Zeiten passen zum MP4.

## Aufwand
M (statt L), weil der Export-Kern schon da ist. Hauptarbeit: Timeline-UI, Wiedergabe-Sprung, SRT-Mapping, Undo.
