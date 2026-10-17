# Paddle: Konto und Start der Bezahlpläne (Stand 16.10.2026)

Ziel: In ca. 2 Monaten (Dezember 2026) Bezahlpläne scharf schalten. Der Code (Checkout, Webhook, Kontingente) ist vorbereitet und ausgeschaltet (`BILLING_ENABLED=false`). Es fehlt nur ein verifiziertes Paddle-Konto und die Rechtstexte. Paddle ist der «Merchant of Record»: Paddle verkauft, rechnet ab und kümmert sich um die Mehrwertsteuer, du bekommst die Auszahlung.

## Was Paddle verlangt (laut Paddle-Hilfe, vor dem Start auf paddle.com prüfen)
- Eine **live erreichbare Website** (gluephs.com ✓) mit Preisen (✓ Preisabschnitt), **AGB**, **Rückerstattungsbedingungen** und **Datenschutzerklärung**, die Paddle als Merchant of Record nennen. Heute fehlen in den AGB die Rückerstattung und die Nennung von Paddle (Entwurf unten).
- **Digitale Ware oder Dienstleistung** (✓ Software als Abo). Physische Waren führen oft später zu Problemen.
- Ein **unterstütztes Land**. Die Schweiz steht nicht auf der Sperrliste; ob sie ausdrücklich unterstützt wird, bestätigt die Länderliste unter developer.paddle.com/concepts/sell/supported-countries-locales (nicht verifiziert).
- Verifikation in drei Phasen: **Domainprüfung**, Unternehmensprüfung (für Einzelunternehmen/Personen nicht nötig), **Identitätsprüfung** (Ausweis).

## Schritte für dich (ca. 1 Stunde plus Wartezeit der Prüfung)
1. **Konto eröffnen:** paddle.com → «Get started». Als Verkäufer registrieren, Angaben zu web&meh (Einzelunternehmen), Ausweis bereithalten.
2. **Domain einreichen:** `gluephs.com`, Produkt «Gluephs, Software-Abo für automatische Untertitel». Paddle prüft die Seite; vorher die AGB-Ergänzung (unten) veröffentlichen lassen.
3. **Auszahlungskonto** hinterlegen (Paddle zeigt die möglichen Währungen und Konten).
4. **Sandbox testen:** In Paddle zuerst die Sandbox nutzen. Dort Produkte «Creator» und «Pro» mit Monatspreis anlegen (heute geplant: 7.99 $ und 14.99 $), Preis-IDs (`pri_…`) notieren, einen Webhook mit der Adresse `https://gluephs.com/api/paddle-webhook` anlegen und den Webhook-Schlüssel (`pdl_ntfset_…`) sowie einen Client-Token und einen API-Key erzeugen.
5. **Schlüssel an Claude/den Server:** Die Werte (nur du, nie in den Chat): `PADDLE_ENV`, `PADDLE_CLIENT_TOKEN`, `PADDLE_PRICE_CREATOR`, `PADDLE_PRICE_PRO`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET` als GitHub-Secrets (`gh secret set NAME -R jonastreier/captly`) eintragen, dazu die Variable `BILLING_ENABLED=true`. Danach den Deploy neu starten, Claude testet den Ablauf mit der Sandbox-Testkarte.
6. **Live schalten:** Wenn die Verifikation durch ist, dieselben Schritte mit den Live-Werten (`PADDLE_ENV=production`).

## Entwurf Ergänzung AGB (DE), kein Rechtsrat, vor Veröffentlichung prüfen lassen
**Zahlung und Abonnement.** Kostenpflichtige Pläne werden über unseren Zahlungsdienstleister Paddle (Paddle.com Market Limited, Angaben auf paddle.com/legal prüfen) als Merchant of Record abgewickelt. Paddle ist Vertragspartnerin beim Kauf, stellt die Rechnung aus und erhebt die Mehrwertsteuer. Es gelten zusätzlich die Bedingungen von Paddle. Abonnements verlängern sich monatlich bis zur Kündigung; du kannst jederzeit zum Ende der laufenden Periode kündigen.

**Rückerstattung.** *(Vorschlag, deine Entscheidung: 14 Tage.)* Du kannst innerhalb von 14 Tagen nach dem ersten Kauf ohne Angabe von Gründen die Rückerstattung verlangen: E-Mail an hello@gluephs.com oder über die Abrechnungsseite von Paddle. Danach sind bezahlte Perioden nicht rückerstattbar, ausser das Gesetz verlangt es.

**Einmaliger Frühbucher-Rabatt:** Wer sich auf die Warteliste setzt, bekommt beim Start **30 % Rabatt auf die ersten drei Monate** (Entscheid Jonas 17.10.2026). In Paddle als «Discount» (Prozent) anlegen, der für die ersten drei Abrechnungsperioden gilt (Paddle: Discount mit begrenzter Zahl an Wiederholungen bei Abos), und per E-Mail an die bestätigten Adressen verschicken. Noch offen: bis wann der Code einlösbar ist (Vorschlag: 30 Tage nach dem Start-Mail). Die Wartelisten-Texte versprechen genau «30 % auf die ersten drei Monate».

Datenschutzerklärung: Abschnitt «Zahlung» ergänzen (Paddle verarbeitet Zahlungs- und Rechnungsdaten als eigene Verantwortliche; wir sehen keine Kartendaten).

## Technische Notizen
- Webhook und Kontingentlogik: `paddle-webhook.php`, `billing.php`, `plan.php`; Tests in `test-billing.js` (Mock-Paddle).
- Frühbucher-Rabatt: Die Adressen stehen in der Tabelle `leads` (Quelle `waitlist-creator`, `waitlist-pro`, `waitlist-export`, `newsletter=true`, `confirmed_at` gesetzt). Nur bestätigte Adressen anschreiben.
