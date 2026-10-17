# Gluephs: Wachstumsstrategie (Stand 16.10.2026)

Entstanden aus drei Recherchen (Konkurrenz-Wachstum, SEO, Launch-Kanäle) und einer Planung mit Opus. Zahlen mit *Annahme* sind nicht belegt. Eine Erfolgsgarantie gibt es nicht; dafür gibt es messbare Zwischenziele und Entscheidungsregeln.

## 0. Entscheide von Jonas (16.10.2026), sie gehen den Abschnitten unten vor

- **Ziel ist möglichst schneller Umsatz mit dem Tool**, kein Portfolio-Stück. «Wiederkehrende Nutzer» unten ist nur Zwischenmass; das Endmass ist zahlende Kunden.
- **Die E-Mail-Pflicht vor dem Download bleibt.** Die Adressen sind der Kundenstamm für Newsletter und den Start der Bezahlpläne. Der Abschnitt «E-Mail-Gate abschwächen» unten ist damit verworfen.
- Folgen für die Planung:
  1. **Kurzer Weg zum Geld:** Bezahlpläne früh scharf schalten (Code und Paddle-Anbindung sind vorbereitet, aber aus). Trennlinie: Einzelclips im Rahmen des Gratis-Limits bleiben gratis; Batch, Brand-Kit, lange Videos und höheres Tageslimit werden Pro. Am Tageslimit erscheint statt «morgen wieder» ein «Pro vormerken/Upgrade»-Knopf. Jeder Klick ist ein Zahlungssignal und eine Liste für den Start.
  2. **Zahlungsbereite Zielgruppe zuerst:** Social-Media-Freelancer, Agenturen, KMU und Vereine zahlen eher als Hobby-Creator. Entsprechend ausrichten (Brand-Kit, Batch, Safe-Zone, Datenschutz, DE/CH).
  3. **Newsletter-Recht (keine Rechtsberatung):** Die Adresse ist Pflicht, die Newsletter-Einwilligung ist es nicht. Werbung per E-Mail braucht in der Schweiz (UWG) und der EU in der Regel vorherige Einwilligung. Laut Datenschutzerklärung nutzen wir Adressen ohne Häkchen nur für wichtige Hinweise zum Dienst. Darum: Häkchen am Gate nutzenorientiert formulieren («Neue Stile, Startrabatt Pro»), nie vorangekreuzt, Double-Opt-in beibehalten, und vor dem ersten Werbemail an Nicht-Opt-ins klären, was erlaubt ist. Ein Hinweis «Beta endet, Preise starten» ist ein Dienstmail, ein Rabatt-Angebot ist Werbung.
  4. **Schneller Umsatz auch ohne SaaS-Skalierung:** Das Tool als Dienstleistung für lokale KMU anbieten («Reels-Untertitel-Paket», Preis pro Monat). Ein Kunde bringt mehr als hundert Gratisnutzer und liefert Gesprächsmaterial.
  5. **Das Zahlungssignal ist wichtiger als der Nutzer:** Tracking nach Funnel plus «Pro vormerken»-Klicks, Wiederkehrer nur Beiwerk.
  6. **Paddle:** Für den Live-Betrieb braucht es ein verifiziertes Paddle-Konto (macht nur Jonas, Dauer und Anforderungen vorab prüfen). Bis dahin: Preise testen mit «Pro vormerken».

## Entscheide und Empfehlungen vom 16.10.2026 (Nachtrag)

- **Preisplan:** Aktuell bleibt alles gratis. In ca. 2 Monaten (Dezember 2026) kommen Batch (bis 10 Clips), Brand-Kit/Logo und ein höheres Tageslimit hinter die Bezahlpläne. Wer sich jetzt auf die Warteliste setzt, bekommt **30 % Frühbucher-Rabatt auf die ersten drei Monate** (Entscheid 17.10.2026; Code gültig ab Start der Bezahlpläne, einlösbar bis 30 Tage nach dem Start-Mail). Paddle-Konto fehlt, Anleitung: [PADDLE-ANLEITUNG.md](PADDLE-ANLEITUNG.md).
- **Schweizer Akzent:** Ein 9-Minuten-Clip (Landwirtschaft, Schweizer Hochdeutsch) wurde sehr gut erkannt, einzelne Fachwörter falsch; es war keine Mundart. Darum gibt es die Seite «Untertitel für Videos mit Schweizer Akzent» und keine Behauptung zu Mundart. Fachwörter: Feld «Namen & Begriffe» nutzen.
- **Newsletter-Tool (Fakten aus Websuchen, vor Entscheid auf den Preisseiten prüfen):**

| Tool | Gratis-Grenze | Hinweis |
|---|---|---|
| Brevo | 300 E-Mails pro Tag (ca. 9000/Monat), Brevo-Logo in den Mails | Zu den Kontakten widersprechen sich die Quellen (unbegrenzt bis 100 000). Die «300» ist laut Quellen das **Tageslimit der Mails**, nicht die Kontaktzahl: im eigenen Konto unter «Pläne» prüfen. EU-Anbieter. |
| MailerLite | bis 500 Abonnenten, 12 000 Mails/Monat | Gratisgrenze wurde im Sept. 2025 von 1000 auf 500 gesenkt (laut einem Ratgeber). |
| Resend | 3 000 Mails/Monat, 100/Tag | Eher für Systemmails; Marketing-Kontakte begrenzt. |
| Amazon SES | kein Abo, ca. 0.10 $ pro 1000 Mails | Günstigste Lösung, braucht aber eigene Versand-Software und Einrichtung. |

  **Empfehlung:** Für die ersten paar hundert bestätigte Adressen reicht Brevo gratis. Ein eigenes Konto/eigene Liste für Gluephs, getrennt von Wald und Tier. Die Anmeldung samt Double-Opt-in läuft bereits über unser System, an Brevo geht nur der Export der **bestätigten** Adressen (CSV aus Supabase, `confirmed_at` gesetzt und nicht abgemeldet). Wichtig vor dem ersten Versand: Absender-Domain gluephs.com bei Brevo bestätigen (DKIM-Eintrag im Hostpoint-DNS; der bestehende SPF-Eintrag nutzt `redirect=` und muss dafür angepasst werden). Wird die Liste grösser als ein paar tausend Adressen, lohnt sich Amazon SES mit eigenem Versandskript oder der günstigste Brevo-Tarif (ab ca. 9 $/Monat laut Quellen).

## Umsetzungsstand (16.10.2026)

Live und getestet:
- **Trichter-Zähler** (api/track, cookielos, ohne ID/IP, nicht bei DNT/GPC): Besuch → Upload → Transkription → Export-Klick → E-Mail → Export fertig, dazu `seo_view`, `pro_interest`, `limit_user`, `limit_site`. Auswertung: `ssh hostpoint 'for f in ~/gluephs-data/track-*.json; do cat $f; echo; done' | node scripts/track-report.js 14`
- **Zahlungssignale:** Preisabschnitt mit «Sag mir Bescheid beim Start» (Double-Opt-in, Push auf dein Handy), Upgrade-Frage nach dem ersten fertigen Export, nutzenorientierter Newsletter-Text am E-Mail-Gate.
- **Limits:** 60 Min. Ton pro Nutzer und Tag, ca. 15 h pro Tag insgesamt (zwei Groq-Modelle), Push bei Erreichen, Warnung ab 2 GB, Ablehnung ab 8 GB.
- **SEO-Seiten** (EN + DE, per `node scripts/build-pages.js` erzeugt, in der Sitemap, in der Search Console angemeldet): Reels, TikTok, Shorts, SRT↔VTT-Konverter (lokal im Browser), Kapwing-Alternative (nur belegte Fakten, Quelle kapwing.com/pricing, geprüft 16.10.2026). Jede Seite führt mit `utm_source=seo-<seite>` in den Editor, so sieht man im Report, welche Seite Exporte bringt.

- **Überlast-Schutz** (`api/status`, Banner auf der Seite): «ausgelastet, ca. N s» bei Groq-Drosselung, bei vollem Tageskontingent das Angebot «Mein Gerät nutzen» (lokal, langsamer) und automatisches lokales Weitermachen, statt einer Fehlermeldung. Das war die Voraussetzung für einen grösseren Launch (Show HN, Product Hunt).
- Schweizer-Akzent-Seite, Paddle-Anleitung (`docs/PADDLE-ANLEITUNG.md`), Newsletter-Vergleich (oben).

Bewusst offen: Vergleichsseiten zu VEED/CapCut (Gratis-Limits dort aus den Quellen nicht eindeutig belegbar), Bezahl-Schaltung (braucht Paddle-Konto), Preis-/Funktionsabgrenzung der Pläne.

## 1. Diagnose

1. Der Hebel sind nicht Reichweite oder Launch-Spitzen, sondern wenige wiederkehrende Nutzer aus Nischen, in denen die Grossen schwach sind: deutschsprachige/Schweizer Creator, Datenschutz-sensible Nutzer (Agenturen, KMU, Gemeinden, Schulen), Longtail-Suchen.
2. «Gratis, ohne Login, ohne Wasserzeichen» sagt jedes Indie-Tool. Das ist keine Differenzierung.
3. Glaubwürdig unterscheiden: Das Video bleibt auf dem Gerät (nur die Tonspur geht zur Transkription, das präzise so sagen) und DACH-Fokus mit Reels-Safe-Zone.
4. Merksatz-Vorschlag: «Reels-Untertitel in 2 Minuten. Dein Video verlässt deinen Computer nie.» (Fussnote: nur die Tonspur wird transkribiert.)
5. Engpass ist die Gründerzeit (ca. 5 h/Woche = ca. 65 h in 13 Wochen), nicht Groq. Massnahmen müssen einmal gebaut dauerhaft laufen (SEO, Verzeichnisse) oder direkt Lernen bringen (Gespräche).
6. Die Pflicht-E-Mail vor dem Download ist vermutlich die grösste selbstgebaute Wachstumsbremse und verhindert Show HN. (Entscheid offen, siehe Abschnitt 7.)

## 2. Drei Phasen

**Phase 1 (Woche 1-4): Messen, Reibung senken, leise Tests.** Ziel: Trichter messbar, 10 echte Fremdnutzer, 5 Gespräche.
- KI: Trichter-Events (Besuch → Upload → Transkription → Export-Klick → E-Mail-Gate → Export) mit Quelle (Referrer/UTM), cookielos über eigenes Logging.
- KI: E-Mail-Gate prüfen (erster Export frei, ab dem zweiten Export fragen; A/B messen).
- Gründer: 5 Creator oder Social-Media-Leute aus dem Umfeld das Tool vor deinen Augen nutzen lassen (5 h). Groq-Bezahlstufe mit hartem Ausgabenlimit als Reserve prüfen (0,5 h).
- KI: Search Console/Bing, hreflang, Landing vom Editor entkoppeln (Core Web Vitals).
- Regel: Kommen weniger als 40 % vom Upload bis zum fertigen Export, wird zuerst das Produkt repariert, nicht Content gebaut.

**Phase 2 (Woche 5-8): Nischen-SEO und erste Communities.** Ziel: 10-12 gute indexierte Seiten, 100-300 organische Besucher pro Woche gegen Ende (*Annahme*).
- KI baut Nischenseiten, Gründer prüft Fakten und liefert Demo-Clips (4 h). 3 Videos «1 Clip, 5 Looks»/Vorher-Nachher (6 h). 1 Verzeichnis pro Woche (2 h). Reddit: 4 Wochen helfen ohne Link, danach höchstens 1 Beitrag in r/SideProject (3 h).
- Regel: Seite mit unter 50 Impressionen nach 6 Wochen überarbeiten oder zusammenlegen. Kanal mit unter 5 Exporten in 4 Wochen einstellen.

**Phase 3 (Woche 9-13): Kontrollierter Launch.** Ziel: eine geplante Spitze von 500-3000 Besuchern an einem Tag ohne Ausfall, danach 15-40 wiederkehrende Nutzer pro Woche.
- KI: Überlast-Schutz (Warteschlange mit Positionsanzeige, Status-Banner, lokaler Fallback).
- Gründer: Show HN (ohne E-Mail-Pflicht, ehrlicher Technik-Post), DACH-Presse («Mediamatiker aus dem Aargau», Wirkung unbelegt), Product Hunt erst nach Überlast-Schutz, Mail an alle Opt-in-Adressen mit einer Frage.
- Regel: Unter 10 Wiederkehrern pro Woche nach Woche 13 → kein weiterer Launch, zurück zu Gesprächen/Positionierung/Nische.

## 3. Arbeitsteilung

**KI-Assistent zuerst:** (1) Trichter-Tracking mit Quelle, (2) E-Mail-Gate-Variante, (3) Landing entkoppeln + Schema/hreflang, (4) Seite «Untertitel für Schweizerdeutsch-Videos» (vorher mit 5 echten Clips testen, ehrlich beschreiben), (5) je eine Seite «VEED-/Kapwing-/CapCut-Alternative» (Fakten vorher selbst prüfen, mit Datum), (6) Mini-Tools SRT↔VTT und Zeitversatz lokal im Browser, (7) Stil-Galerie mit 6-8 Stilseiten mit echtem Demo-Clip, (8) Warteschlange/Überlast-Banner.

**Gründer (ca. 40 h in 13 Wochen):** 10 Nutzergespräche à 30 Min. (5-6 h, wichtigster Punkt), 4 Demo-Videos (8 h), Schweizerdeutsch-Test (1 h), Konkurrenz-Fakten prüfen (2 h), Verzeichniseinträge (3 h), Reddit-Präsenz (3 h), Launch-Texte und Durchführung (8 h), wöchentlicher Metrik-Check (3,5 h).

## 4. Kapazität und Kosten

- Heute ca. 15 h Ton/Tag gratis (Groq Free: je Modell 28 800 s/Tag, mit Ausweichen aufs zweite Modell), 60 Min. pro Nutzer. Reicht für ca. 180-450 aktive Nutzer/Tag (*Annahme*: 2-5 Min. Ton pro Nutzer, mit Tracking prüfen).
- Sofort möglich (tröpfchenweiser Traffic): SEO, Verzeichnisse, Reddit-Kommentare, Gespräche, eigene Videos. Erst nach Warteschlange/Reserve: Show HN, Product Hunt, grosse Newsletter, alles Virale.
- Groq bezahlt (Listenpreis, vor Entscheid auf der Preisseite prüfen): turbo ca. 0,04 $/h, large-v3 ca. 0,111 $/h, min. 10 s pro Anfrage. 100 Stunden ≈ 4-11 $ pro Monat. Kapazität ist damit eine Frage von wenigen Franken, nicht von Hunderten. Empfehlung: Bezahlstufe mit hartem Limit vor dem ersten Launch, Gratis-Kontingent bleibt zuerst im Einsatz. Ob Groq ein hartes Ausgabenlimit bietet, vorher in der Konsole prüfen.
- Ein Bezahlplan (7.99/Monat) deckt die Transkription von Hunderten Gratisnutzern (Paddle-Gebühren vor Entscheid prüfen). Einführen, wenn mindestens 30 Nutzer pro Woche wiederkommen oder in Gesprächen nach Pro-Funktionen gefragt wird (Batch, Brand-Kit, längere Videos).

## 5. Metriken (wöchentlich)

| Kennzahl | 30 Tage | 60 Tage | 90 Tage |
|---|---|---|---|
| Eindeutige Besucher/Woche | 50-300 | 150-700 | 300-1500 (ohne Launch-Spitze) |
| Upload-Rate (Upload ÷ Besucher) | 15-35 % | ≥ 25 % | ≥ 30 % |
| Export-Rate (Export ÷ Upload) | Ausgangswert messen | +10 Punkte | ≥ 55 % |
| Abbruch am E-Mail-Gate | messen | < 25 % | < 20 % |
| Wiederkehrer (Export in ≥ 2 Wochen) | 2-8 | 8-25 | 20-60 |
| Groq-Auslastung Spitzentag | < 10 % | < 30 % | < 70 % |

Alle Werte sind Annahmen für eine neue Domain ohne Budget. Nach 4 Wochen durch eigene Werte ersetzen. Pro Export die Quelle erfassen.

## 6. Risiken und Gegenmittel

1. **Pflicht-E-Mail würgt den Trichter** → erster Export frei oder E-Mail mit Nutzen, Abbruchrate messen.
2. **Langsames Ranking neuer Domain** (Ahrefs: nur 5,7 % neuer Seiten in Top 10 nach 1 Jahr) → nur Longtails und DE/Schweiz, Erfolg an Impressionen messen.
3. **Bann auf Reddit/HN** → 4 Wochen ohne Werbung mitmachen, Regeln lesen, nie um Votes bitten, auf HN ohne E-Mail-Hürde.
4. **Überlast am Launch-Tag** → Bezahlstufe mit Limit, Warteschlange, lokaler Fallback.
5. **Datenschutz/Recht (DSG/DSGVO)** → Datenschutzerklärung nennt Groq, USA, Speicherdauer. Aussage «Video bleibt auf deinem Gerät, nur die Tonspur wird transkribiert». Double-Opt-in beibehalten. Einmal kurze Fachprüfung der Erklärung einplanen (keine Rechtsberatung).

## 7. Kritik und Ziel

«Möglichst viele Nutzer» passt nicht zur Infrastruktur (Gratis-Kontingent, 5 h Zeit) und bringt ohne Gespräche kein Lernen. Einmalnutzer sind fast wertlos. Besseres Ziel für Woche 13: **50 wiederkehrende Exporteure, 10 protokollierte Gespräche, 1 belegtes Zahlungssignal** (z. B. 5 Personen klicken «Pro vormerken» oder nennen einen Preis).

**Offene Entscheide für Jonas:** (a) E-Mail-Pflicht lockern (erster Export frei)? (b) Ist das Ziel Umsatz oder ein Portfolio-Stück für die Selbstständigkeit? Bei Letzterem zählen Fallstudie und DACH-Creator-Kontakte mehr als die Nutzerzahl.

## Belege und Lücken

Quellen der Recherchen: Submagic-Fallstudie (superframeworks.com), Kapwing- und VEED-Interviews (Indie Hackers), Ahrefs-Studie zur Ranking-Dauer, Show-HN-Regeln (news.ycombinator.com/showhn.html), Groq-Limits (console.groq.com/docs/rate-limits). Viele Wachstumszahlen sind Selbstangaben. Nicht verifiziert: Reddit-Regeln der einzelnen Subs, Preise der Verzeichnisse, Wirkung der Kanäle, Paddle-Gebühren.
