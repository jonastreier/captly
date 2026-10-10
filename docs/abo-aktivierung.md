# Abos aktivieren: was vorher noch passieren muss

Der Code ist fertig und getestet (`test-billing.js`, Postgres-Schema geprüft), der Schalter ist aus. Vor dem Live-Schalten (`PADDLE_ENV=production`, `BILLING_ENABLED=1`):

1. **Datenschutzerklärung ergänzen** (`datenschutz.html`, `privacy.html`; erst jetzt veröffentlichen, sonst stimmt sie nicht mit dem Code überein):
   - Neue Ziffer «Bezahlung (nur bei Abos)»: Zahlungsabwicklung und Verkauf als Händler (Merchant of Record) durch **Paddle** (Paddle.com Market Ltd, UK; in der Datenschutzerklärung von Paddle den aktuellen Namen/Sitz prüfen). Wir erhalten E-Mail, Plan, Status, Laufzeit und Kunden-ID, **keine** Kartendaten. Beim Klick auf «Upgrade» lädt dein Browser das Zahlungsfenster (`paddle.js`) von Paddle; Paddle sieht dann deine IP-Adresse. Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO. Aufbewahrung: Vertrags- und Rechnungsdaten nach gesetzlichen Fristen (OR 958f: 10 Jahre bei Paddle bzw. in unserer Buchhaltung).
   - Ziffer «Konto»: zusätzlich Nutzung (Sekunden Ton pro Tag) in der Datenbank zur Kontingent-Prüfung.
2. **AGB ergänzen** (`terms.html`): Pläne und Minuten pro Monat (Free 30, Creator 300, Pro 1200), Verlängerung und Kündigung (Portal, jederzeit zum Laufzeitende), Preise in Landeswährung inkl. MwSt. laut Checkout, Widerruf/Rückerstattung nach den Bedingungen von Paddle als Verkäufer, Fair-Use bei Missbrauch.
3. **Verarbeitungsverzeichnis** (`docs/verarbeitungsverzeichnis.md`, Zeile 9): Paddle als Empfänger eintragen, DPA/AVV prüfen.
4. **Landing/Pricing**: Preise und Pläne in `captly.html` (Abschnitt Pricing) auf die echten Werte bringen und `node scripts/build-i18n.js` ausführen. «Free during beta» anpassen.
5. **EU-Vertreter** entscheiden (`docs/eu-vertreter.md`), spätestens jetzt.
6. **Paddle-Live**: Konto-Verifizierung abgeschlossen (siehe `docs/ANLEITUNG-JONAS.md`), Preise/Produkte **neu** im Live-Bereich anlegen (IDs unterscheiden sich von der Sandbox), neuen Webhook, neuen Client-Token, neuen API-Key.
7. Wasserzeichen-Regel: Das E-Mail-Gate vor dem Download bleibt als freiwillige, überspringbare Abfrage. Mit aktiven Abos exportieren Free/Gäste die ersten `FREE_CLEAN_VIDEOS_PER_DAY` Videos pro Tag (Standard 2, UTC-Tag) ohne Wasserzeichen, ab dem 3. Video am selben Tag mit kleinem Wasserzeichen; bezahlte Pläne nie. Ein Video = eine Datei (anonymer Hash), mehrfaches Transkribieren zählt einmal. `schema.sql` muss dafür neu ausgeführt werden (Spalte `usage.vkeys`, Funktion `add_video`). Ohne diese Spalte fällt die Marke weg (fail-open).
