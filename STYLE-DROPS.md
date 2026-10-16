# Style Drops — wöchentliche Trend-Rotation

Neue Untertitel-Looks kommen **jede Woche** über [`styles.json`](styles.json) — ohne App-Code, ohne Build.
Der Editor sortiert die Drops automatisch **neueste zuerst** (Feld `added`), zeigt sie direkt hinter dem Standard-Look
und markiert sie 21 Tage mit «New». Höchstens 16 Drops sind gleichzeitig sichtbar; ältere fallen automatisch aus der Auswahl.

## Ablauf jede Woche (Routine oder von Hand)

1. **Branch:** `git fetch && git switch -c claude/style-drop-JJJJ-MM-TT origin/main` — nie direkt auf `main` (Push auf `main` = Live-Deploy).
2. **Trends recherchieren** (letzte 7–14 Tage): Pinterest «caption style reels», TikTok/Instagram Creator-Edits, neue Vorlagen bei
   CapCut, Submagic, Captions, Opus Clip, VEED. Gesucht: wiederkehrende Muster (Typografie, Grössen-Hierarchie, Platzierung,
   Farben, Bewegung) — **nicht** einzelne Creator kopieren.
3. **1–3 neue Looks** vorn in `styles.json` einfügen (Format: Kommentar bei `dropToStyle` in `captly.html`):
   - `id`: klein, 3–20 Zeichen, stabil für immer · `name`: neutral, **nie nach Personen oder Marken** (kein «MrBeast», «Hormozi», «Submagic»)
   - `added`: heutiges Datum · Schriften nur aus `CAP_FONT_GROUPS` (lokal in `vendor/fonts`); neue Schrift → `node scripts/fetch-fonts.js`
   - Bausteine: `layout.kw` + `em`/`emFont`/`emS` (Schlagwort gross, bis 2.2×), `scatter: true` (Wörter frei rund um die Person),
     `motion` (`reveal`/`fill`/`type`/`highlight`), `anim`, `hlCycle`, `hlg`, `boxBg`, `ul`, `layout.emoji`, `layout.wrap`.
   - Braucht ein Trend einen neuen Effekt (z. B. Echo-Kontur, Text hinter der Person), gehört das als eigene Engine-Aufgabe
     in `captly.html` — mit Vorschau = Export (`test-ui-sweep.js`).
4. **Alte Looks in Rente:** `node scripts/style-report.js` zeigt Nutzung (Exporte der letzten 30 Tage, `/api/stat`).
   Mit `--apply` bekommen selten genutzte Drops `"retired": true` (Regel: ≥ 42 Tage live, Anteil < 1,5 %, ≥ 200 Exporte gesamt).
   **Nie Einträge löschen** — Ruhestands-Looks verschwinden nur aus Auswahl und Showcase; gespeicherte Projekte, Vorlagen
   und Autosaves rendern weiter exakt gleich.
5. **Prüfen:** `node test-captly.js` (+ übrige Tests laut CLAUDE.md), bei neuen Effekten `node test-ui-sweep.js --quick`.
6. **Pull Request** gegen `main` mit Screenshots/Beschreibung der neuen Looks und der Rotation. Gemergt wird von Jonas
   (Merge = Deploy).

## Trend-Log

| Datum | Neu | Quelle / Muster |
|---|---|---|
| 2026-10-16 | Floating Words, Clean Sentence, Italic Punch, Golden Word, Red Script, Thick Thin, Soft Serif | Pinterest-Inspiration (Jonas), Creator-Reels: Grössen-Hierarchie (kleine Einleitung + riesiges Schlagwort in anderer Schrift), frei platzierte Einzelwörter, ruhige enge Sans, Script-/Serif-Akzente |
| 2026-10-14 | Color Pop, Big Keyword, Gradient Karaoke, Sticker Emoji, Glass Box, Swipe Underline, Typewriter, Squash Pop | N-Looks |

**Offene Trend-Ideen (brauchen Engine-Arbeit):** Echo-Kontur (grosses Wort mit Umriss-Kopien darunter),
Text hinter der Person (Segmentierung), Negativ-/Difference-Text, Wort-für-Wort-Stapel mit wechselnder Grösse je Zeile.
