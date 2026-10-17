# Wasserzeichen: Umstellung zum Bezahlstart

Modell: **Free** = die ersten 2 Videos pro Tag ohne Wasserzeichen, danach ein kleines Gluephs-Zeichen (Logo unten rechts). **Creator/Pro** = nie ein Wasserzeichen. Server-Logik gibt es schon (`plan.php`, `cr_clean_videos`, `billing.watermark`).

## Schon vorbereitet (schaltet sich mit `billingOn()` von selbst um)
- Export-Wasserzeichen zeichnet das neue Logo (`drawWatermark`, `wmBox`, `WM_SVG` in `captly.html`).
- Landing: Hero-Badge, «Free. No watermark.»-Überschrift, Feature-Karte, Preis-Liste (Free/Creator/Pro), FAQ-Satz. Klassen `.beta-only` (nur Beta) und `.bill-only` (nur mit Billing); DE-Paare in `i18n/de.js`.
- Batch-Untertitel und Export-Buttons lassen «no watermark» weg, wenn `needsWatermark()` gilt.

## Von Hand beim Start (statisch, nicht umschaltbar)
Erst anpassen, wenn Billing live geht; vorher bleibt «No watermark» wahr.
- `captly.html` `<head>`: `<title>`, `description`, `keywords`, `og:title`, `twitter:title` («No Watermark»). Jeweils DE-Gegenstück in `i18n/de.js` (Zeilen 11–25).
- `captly.html` JSON-LD: Feature-Liste («Export to MP4 (no watermark)»), Preis-Beschreibung («Free during the beta: no watermark»), FAQ-Antwort («During the beta there is never a watermark»). Muss mit der sichtbaren FAQ übereinstimmen (Test).
- FAQ «Why is it free?»: «During the beta every feature is free and videos never get a watermark.» (`captly.html`, `i18n/de.js`).
- SEO-Seiten `p/*.html` (je ca. 9 Treffer, Vergleichsseiten ca. 7), `p/untertitel-schweizer-hochdeutsch.html`: Titel/Description «no watermark» (kommt aus `scripts/build-pages.js`, dort ändern, nicht in `p/`).
- `llms.txt` (3 Treffer), `terms.html` (2), `README.md`.
- Editor: statisches «MP4 · 1080p · no watermark» im Download-Button (`btnVideoSub`, wird per JS überschrieben; prüfen).

## SEO-Hinweis
«No watermark» ist Suchbegriff (Keywords, Titel). Mit «2 Videos pro Tag ohne Wasserzeichen» bleibt eine wahre Aussage möglich, z. B. «Free: 2 clean videos a day».

## Tests
`node scripts/build-i18n.js`, danach die Standard-Tests aus `CLAUDE.md`. Beim Start zusätzlich Export mit aktivem Wasserzeichen im Editor prüfen (`test-e2e.js`).
