# Anleitung für Jonas: alles, was nur du erledigen kannst

Stand: Oktober 2026. Reihenfolge einhalten: **A** (Basis) → **B** (Dienste) → **C** (Deploy und Test) → **D** (später: Abos) → **E** (Firma und Marke).
Wo ich die Oberfläche von Hostpoint, Groq oder Paddle nicht live prüfen konnte, steht «Bezeichnung kann abweichen»: dann dem Sinn nach suchen oder den Support fragen. Die Schritte zu Supabase und GitHub kenne ich aus dem Repo und sind genau.
Kurzfassung der Technik: [`SETUP.md`](../SETUP.md). Ein Haken (✅) am Ende eines Schritts sagt dir, woran du merkst, dass er geklappt hat.

---

## A. Domain, Postfächer, Hosting (Hostpoint)

**A1. Domain registrieren und mit dem Hosting verbinden**
1. Im Hostpoint-Control-Panel `captionrush.com` registrieren (oder, falls schon da, unter «Domains» prüfen). **Bei Hostpoint kaufen, nicht bei Vercel**: Hosting, DNS und Postfächer liegen dann im selben Panel, SPF/DKIM sind ein Klick (A4). Preis laut hostpoint.ch CHF 10 im ersten Jahr; die Verlängerung nennen Vergleichsseiten mit CHF 20/Jahr (im Warenkorb prüfen). Das Zusatzprodukt «Domain Shield» brauchst du nicht (deine Adresse steht ohnehin im Impressum).
2. Domain dem Webhosting zuordnen. Der **Zielordner (Document Root)** wird angezeigt oder kann gewählt werden, z. B. `www/captionrush.com/` (Bezeichnung kann abweichen).
3. SSL (Let's Encrypt) für die Domain einschalten. ✅ `https://captionrush.com` zeigt eine Seite ohne Zertifikatswarnung (auch eine leere Hostpoint-Seite genügt jetzt).

**A2. PHP-Version prüfen**
1. Control Panel → Webhosting → PHP-Einstellungen der Domain (Bezeichnung kann abweichen). Stelle **PHP 8.1 oder neuer** ein (getestet mit 8.3).
2. Die Erweiterungen **curl** und **mbstring** müssen aktiv sein (bei Hostpoint standardmässig). ✅ Nach dem ersten Deploy zeigt `https://captionrush.com/api/transcribe` → `{"ok":true,…,"configured":true}`. Wenn `curl` fehlt, steht dort ein Fehler: dann Support fragen.

**A3. Postfächer anlegen** (Control Panel → E-Mail)
1. `contact@captionrush.com`: steht im Impressum und der Datenschutzerklärung, muss gelesen werden (Weiterleitung auf deine Adresse ist ok).
2. `noreply@captionrush.com`: Absender für Login-Codes und Bestätigungsmails. Passwort sicher notieren.
3. SMTP-Daten aus der Hostpoint-Hilfe holen (Servername, Port 465 SSL, Benutzer = volle Adresse). ✅ Mit einem Mailprogramm (z. B. Thunderbird) einmal eine Testmail von `noreply@` an dich senden.

**A4. SPF, DKIM, DMARC** (damit die Mails nicht im Spam landen)
1. **SPF**: Control Panel → Domains → deine Domain → «DNS-Zone bearbeiten» → Knopf «Hostpoint-SPF-Eintrag hinzufügen» (laut Hostpoint-Support), speichern. Dauert 5 bis 10 Minuten. Falls schon ein SPF-Eintrag existiert, den Hostpoint-Teil in diesen **einen** Eintrag einfügen, nicht einen zweiten anlegen.
2. **DKIM**: Hostpoint-Support-Artikel «Activate DKIM» (support.hostpoint.ch → E-Mail → E-Mail-Sicherheit) befolgen. Wenn du Hostpoint-Nameserver nutzt, ist es meist ein Klick im Control Panel. Ich konnte nicht prüfen, ob Hostpoint DKIM für ausgehende Mails unterstützt: Finde den Schalter nicht → Support fragen: «Kann ich DKIM für ausgehende Mails von captionrush.com aktivieren?».
3. **DMARC**: in der DNS-Zone einen **TXT-Eintrag** anlegen: Name `_dmarc`, Wert `v=DMARC1; p=none; rua=mailto:contact@captionrush.com`. Nach ein bis zwei Wochen ohne Probleme auf `p=quarantine` erhöhen.
4. ✅ Prüfen: Testmail von `noreply@` an eine Gmail-Adresse, in Gmail «Original anzeigen»: **SPF: PASS** (DKIM: PASS, wenn aktiviert). Zusätzlich <https://mxtoolbox.com/SuperTool.aspx> (SPF- und DMARC-Lookup für `captionrush.com`).

**A5. FTP-Zugang und `FTP_DIR` ermitteln**
1. Control Panel → Services → Advanced → FTP → Settings (Bezeichnung kann abweichen): **FTP-Server** (Host) notieren. Benutzername des Hauptkontos steht im Vertrag; Passwort setzt du unter «Advanced → Password change». Besser: unter FTP ein **eigenes FTP-Konto** nur für den Deploy anlegen, mit Zugriff nur auf den Ordner der Domain.
2. Verschlüsselung: **Explicit FTP over TLS** (FTPS), Port 21. Die Action nutzt FTPS.
3. **FTP_DIR** herausfinden: mit FileZilla (oder Cyberduck) verbinden, den Ordner der Domain öffnen (A1) und den Pfad notieren, z. B. `./www/captionrush.com/` (mit `/` am Ende). Probe: eine Datei `probe.txt` hineinladen, `https://captionrush.com/probe.txt` im Browser öffnen. ✅ Sie wird angezeigt → der Pfad stimmt. Datei danach löschen.

---

## B. Dienste einrichten

**B1. Supabase** (supabase.com → dein Projekt; Schritte wie in `SETUP.md`, hier mit Prüfung)
1. **SQL Editor** → Inhalt von `schema.sql` einfügen → **Run**. Das Skript ist wiederholbar; **führe es nach jedem Update des Repos erneut aus** (diesmal neu: Fehlerprotokoll, Style-Zähler, Abo-Tabellen). ✅ Table Editor zeigt u. a. `projects`, `leads`, `client_errors`, `style_stats`, `profiles`, `usage`, `paddle_events`.
2. **Project Settings → API**: **service_role-Key** kopieren (geheim, nur als GitHub-Secret `SUPABASE_SERVICE_KEY`, nie in Code oder Chat).
3. **Authentication → URL Configuration**: Site URL `https://captionrush.com`; Redirect URLs `https://captionrush.com/**`.
4. **Authentication → Emails → SMTP Settings**: Custom SMTP einschalten, Host/Port/Benutzer/Passwort von `noreply@captionrush.com`, Absender `noreply@captionrush.com`, Name «CaptionRush».
5. **Authentication → Rate Limits**: «Emails per hour» auf ca. 100 erhöhen (sonst blockiert Supabase nach wenigen Login-Codes).
6. **Authentication → Emails → Templates**: «Magic Link» und «Confirm signup» mit dem Text aus [`docs/supabase-email-templates.md`](supabase-email-templates.md) ersetzen (enthält `{{ .Token }}`).
7. **Authentication → Providers → Email**: «Confirm email» an lassen.
8. **Region prüfen**: Project Settings → General → Region. Datenschutz sagt **Frankfurt (eu-central-1)**. Steht dort etwas anderes (z. B. USA), `datenschutz.html` und `privacy.html` anpassen (sag mir Bescheid, dann mache ich das) oder das Projekt in Frankfurt neu anlegen.
9. **DPA**: auf supabase.com → Legal → «Data Processing Addendum» herunterladen und ablegen (Auftragsverarbeitung, ohne Unterschrift im Self-Service verfügbar).
10. Free-Plan-Hinweis: Das Projekt pausiert nach 7 Tagen ohne Aktivität (der tägliche Keep-alive-Workflow verhindert das). Leads regelmässig als CSV exportieren (kein Backup im Free-Plan).

**B2. Groq** (console.groq.com)
1. **API Keys** → neuen Key erzeugen (`gsk_…`), als GitHub-Secret `GROQ_API_KEY` ablegen. Den alten Key vom Vercel-Setup nach dem Umzug widerrufen.
2. **Data Controls** (console.groq.com/settings/data-controls): Optionen ansehen. Laut Groq-Doku speichert Groq Inferenz-Anfragen standardmässig nicht; schalte alles aus, was du nicht brauchst (z. B. Batch). Notiere dir, was dort steht, und passe die Datenschutzerklärung an, falls Groq etwas speichert. (Ob es einen Null-Aufbewahrungs-Schalter für dein Konto gibt, konnte ich nicht bestätigen.)
3. **Limits und Warnungen**: In der Console unter den Einstellungen für Limits/Billing (Bezeichnung kann abweichen) ein **Ausgabenlimit** und, falls angeboten, eine **E-Mail-Warnung** setzen. Im Gratis-Tarif gibt es feste Tageslimits für Audio; die App meldet 429 dann per ntfy (B3).
4. **Bezahlter Tarif**: Sobald Nutzer regelmässig kommen oder Abos starten, auf den Developer-Tarif wechseln (höhere Limits, Rechnungsstellung). Rechne mit den Audio-Minuten deiner Pläne (Creator 300 Min., Pro 1200 Min. pro Monat und Nutzer) und prüfe den aktuellen Whisper-Preis pro Stunde auf groq.com/pricing.
5. **DPA**: auf groq.com/legal das «Data Processing Addendum» (mit EU-Standardvertragsklauseln) herunterladen und ablegen. Die Datenschutzerklärung verweist darauf.

**B3. ntfy-Alarm (optional, empfohlen)**
1. App «ntfy» (iOS/Android) installieren. Thema erfinden, das niemand errät, z. B. `captionrush-k7x2m9q4z8` (Thema = Passwort, nicht teilen).
2. In der App das Thema abonnieren. ✅ Test: im Browser/Terminal `curl -d "Test" https://ntfy.sh/DEIN-THEMA` → Push auf dem Handy.
3. GitHub-Secret `ALERT_URL` = `https://ntfy.sh/DEIN-THEMA`.

**B4. GitHub-Secrets** (Repo → Settings → Secrets and variables → Actions → New repository secret)
| Secret | Wert |
|---|---|
| `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` | aus A5 |
| `FTP_DIR` | aus A5, mit `/` am Ende |
| `GROQ_API_KEY` | aus B2 |
| `SUPABASE_SERVICE_KEY` | aus B1.2 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Zugang von `noreply@captionrush.com` (A3) |
| `MAIL_FROM` | `noreply@captionrush.com` |
| `LEAD_SECRET` | langer Zufallstext, z. B. im Passwortmanager erzeugen (salzt die gehashte IP und signiert die Abmelde-Links; **nie ändern**, sonst werden alte Abmelde-Links ungültig) |
| `ALERT_URL` | aus B3 (optional) |

---

## C. Erster Deploy und Test auf der echten Domain

**C1. Deploy auslösen**: PR mergen (siehe Reihenfolge unten) → Action «Deploy» läuft automatisch. Oder: Repo → Actions → Deploy → «Run workflow». Fehlt ein Secret, nennt die Action es. ✅ Grünes Häkchen.

**C2. Endpunkte prüfen** (Browser, jeweils `{"…configured":true}` bzw. JSON):
`https://captionrush.com/api/transcribe`, `/api/lead`, `/api/stat`, `/api/log`, `/api/plan` (jetzt `{"enabled":false}`, richtig!). `https://captionrush.com/de` zeigt die deutsche Seite, `/privacy`, `/datenschutz`, `/terms`, `/impressum` laden.

**C3. End-to-End-Test** (Handy **und** Computer, privates Fenster):
1. Video hochladen → Untertitel erscheinen. Style wechseln. Text korrigieren.
2. Export → E-Mail eintragen, **Newsletter-Häkchen setzen** → Download startet.
3. Mailbox: **Bestätigungsmail** kommt (nicht im Spam), Link anklicken → «Danke, bestätigt». Supabase → Table Editor → `leads`: Zeile mit `confirmed_at`.
4. In derselben Mail unten den **Abmelde-Link** anklicken → Seite «Newsletter abmelden?» → Knopf → «Abgemeldet»; in `leads` steht `unsubscribed_at`.
5. Menü (drei Punkte) → Sign in → Code per Mail → eingeloggt → «Save to account» → Seite neu laden → «Load project» → Projekt ist da.
6. Cover erstellen (Export-Fenster → «Create cover»), PNG öffnen.
7. Supabase `style_stats` hat nach dem Export eine Zeile (nur, wenn dein Browser nicht «Do Not Track» sendet).
8. Spam-Test: auf mail-tester.com die angezeigte Adresse als Newsletter-Anmeldung verwenden (Export mit Häkchen) und den Wert ansehen: Ziel ≥ 8/10.
✅ Wenn etwas hakt: Screenshot/Fehlertext an mich.

**C4. Google Search Console** (search.google.com/search-console)
1. «Property hinzufügen» → **Domain** → `captionrush.com`.
2. Bestätigung per **DNS-TXT-Eintrag**: im Hostpoint-Control-Panel die DNS-Zone bearbeiten, TXT-Eintrag mit dem von Google angezeigten Wert anlegen, in Google «Bestätigen» (kann bis zu einigen Stunden dauern).
3. Sitemaps → `https://captionrush.com/sitemap.xml` einreichen. ✅ Status «Erfolgreich».

**C5. Aufräumen**: Alte Vercel-Adresse: **zwei Wochen parallel** laufen lassen (Rückfalloption, kostet nichts), danach Projekt in Vercel löschen oder pausieren (der Vercel-Keep-alive-Cron wird dann nicht mehr gebraucht; der GitHub-Workflow übernimmt).

**Reihenfolge der offenen Pull Requests** (die Themen-PRs bauen aufeinander auf; GitHub zeigt die Basis oben an):
1. [#15](https://github.com/jonastreier/captly/pull/15) (Go-live) mergen und den Branch danach löschen (Knopf «Delete branch»). GitHub stellt PRs, die auf diesem Branch aufbauen, dann automatisch auf `main` um; sonst beim PR-Titel «Edit» → Basis auf `main`.
2. Danach in dieser Reihenfolge: [#16](https://github.com/jonastreier/captly/pull/16) (Recht/Texte) → [#20](https://github.com/jonastreier/captly/pull/20) (Telemetrie) → [#22](https://github.com/jonastreier/captly/pull/22) (Abo-Vorbereitung, Schalter aus) → dieser PR (Anleitung). Die Reihenfolge ist wichtig, weil sie aufeinander aufbauen.
3. Unabhängig davon, jederzeit nach #15: [#17](https://github.com/jonastreier/captly/pull/17) (Tight), [#18](https://github.com/jonastreier/captly/pull/18) (E2E-Test), [#19](https://github.com/jonastreier/captly/pull/19) (Performance), [#21](https://github.com/jonastreier/captly/pull/21) (Mobile-Mehrfachauswahl).
Zeigt ein PR ein Konflikt-Banner (selten, z. B. weil zwei PRs dieselbe Zeile in `README.md` ändern): sag mir Bescheid, ich löse ihn.

**C6. Newsletter-Versand (erst, wenn du den ersten verschickst)**
Entscheid: **Brevo**, nicht selbst über Supabase/Hostpoint. Supabase verschickt nur Login-Mails; ein eigener Massenversand über das Hostpoint-Postfach landet schnell im Spam und hat kein Bounce- und Abmelde-Handling. Brevo (Frankreich, EU) hat das alles, im Gratis-Tarif 300 Mails pro Tag, und du kennst es von Wald und Tier.
1. **Eigenes Brevo-Konto für CaptionRush** (nicht die Wald-und-Tier-Liste mischen), Absenderdomain `captionrush.com` dort authentifizieren (Brevo zeigt die DNS-Einträge, in der Hostpoint-DNS-Zone eintragen).
2. Supabase → Table Editor → `leads` → filtern: `newsletter = true`, `confirmed_at` gesetzt, `unsubscribed_at` leer → **Export CSV** → in Brevo als Liste importieren (Einwilligung liegt per Double-Opt-in vor).
3. Abmeldungen laufen danach über Brevo. Vor dem Versand bitte Bescheid geben: Ich ergänze Brevo in der Datenschutzerklärung und baue, wenn die Liste wächst, einen automatischen Abgleich.

---

## D. Abos mit Paddle (erst, wenn du soweit bist; Schalter ist aus)

1. **Sandbox zuerst**: [`docs/paddle-sandbox.md`](paddle-sandbox.md) Schritt für Schritt (Sandbox-Konto, 2 Produkte, Webhook, Test-Zahlung). Kostet nichts.
2. **Paddle-Konto (Live)**: auf paddle.com registrieren. Paddle verifiziert Verkäufer; für ein Einzelunternehmen halte bereit (die genaue Liste zeigt Paddle im Verifizierungsformular, Bezeichnungen kann abweichen):
   - Ausweis (Pass oder ID) und Wohnadresse (Bankauszug oder Rechnung, nicht älter als ca. 3 Monate),
   - Angaben zum Unternehmen: Name (web&meh, Jonas Treier), Adresse, ggf. UID-Nummer (CHE-…) und Nachweis der Selbständigkeit (z. B. Bestätigung der SVA, Gewerbe-Anmeldung),
   - Bankverbindung (IBAN) für die Auszahlung (prüfe, in welchen Währungen Paddle an Schweizer Konten auszahlt),
   - öffentliche Website mit **Produktbeschreibung, Preisen, AGB, Datenschutz und Rückerstattungsregeln** (die Texte dafür: [`docs/abo-aktivierung.md`](abo-aktivierung.md)), Impressum mit Kontakt.
   Paddle prüft auch, dass die Seite zu deinem Produkt passt: Pricing-Abschnitt auf der Landing erst auf echte Preise bringen (sag mir Bescheid, dann mache ich das).
3. **Im Live-Bereich** Produkte/Preise **neu anlegen** (IDs unterscheiden sich), neuen Webhook (`https://captionrush.com/api/paddle-webhook`), neuen Client-Token und API-Key; GitHub-Secrets umstellen: `PADDLE_ENV=production`, `PADDLE_CLIENT_TOKEN`, `PADDLE_PRICE_CREATOR`, `PADDLE_PRICE_PRO`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `BILLING_ENABLED=1`. Deploy erneut starten.
4. **Preise pro Währung** (EUR, CHF, USD): in Paddle am Preis «Preise für einzelne Länder/Währungen» ergänzen; das Zahlungsfenster zeigt automatisch die lokale Währung. Steuern (MwSt.) rechnet Paddle als Verkäufer ab.
5. **Testkauf live** mit einer echten Karte (Creator), danach im Paddle-Dashboard erstatten. Prüfen, dass der Plan in der App erscheint.
6. **Steuern**: Frag einmal einen Treuhänder oder die ESTV, wie die Auszahlungen von Paddle bei dir zu verbuchen sind (Paddle ist Verkäufer, du lieferst die Software-Lizenz an Paddle); MWST-Pflicht beginnt in der Schweiz bei CHF 100 000 Jahresumsatz.

---

## E. Firma, EU-Vertreter, Marke

**E1. Selbständigkeit und Sozialversicherung (SVA Aargau)**
1. Prüfe, ob **web&meh** bereits als selbständige Tätigkeit bei der SVA Aargau (Ausgleichskasse) gemeldet ist: sva-ag.ch → Selbständigerwerbende. Wenn ja, gehört CaptionRush als zusätzliche Tätigkeit in dieselbe Erwerbstätigkeit (Einnahmen in der AHV-Abrechnung und Steuererklärung angeben). Wenn nein: dort **«Anmeldung als Selbständigerwerbende/r»** ausfüllen, bevor die ersten Einnahmen fliessen.
2. **Handelsregister**: Einzelunternehmen müssen sich eintragen lassen, sobald der Jahresumsatz CHF 100 000 erreicht; vorher freiwillig. Eintrag schützt zudem den Firmennamen im Kanton (Handelsregisteramt Aargau).
3. Steuern: Einkünfte aus CaptionRush kommen in die Steuererklärung (Selbständigkeit). Rückstellungen für Steuern und AHV bilden (grob 25 bis 30 % des Gewinns); Details mit Treuhänder klären.
4. Hauptjob: Prüfe deinen Arbeitsvertrag auf Nebenbeschäftigung und Konkurrenzverbot (Software-Firma): Nebenprojekt kurz mit dem Arbeitgeber klären, wenn der Vertrag eine Meldung verlangt.

**E2. EU-Vertreter** (DSGVO Art. 27): Entscheid und Kosten in [`docs/eu-vertreter.md`](eu-vertreter.md). Empfehlung: vor dem Abo-Start einen Vertreter bestellen (ca. 400 bis 900 EUR pro Jahr); danach in Datenschutzerklärung eintragen lassen (sag mir den Namen).

**E3. Marke und Namenskonflikt**
1. **Recherche, bevor du Geld ausgibst**: <https://www.swissreg.ch> (Schweiz), <https://www.tmdn.org/tmview> (EU und weitere, u. a. EUIPO), <https://branddb.wipo.int> (international) nach «CaptionRush», «Captions Rush», «Caption Rush» und ähnlich klingenden Namen in den **Klassen 9 und 42** (Software und Software-as-a-Service) suchen.
2. **Namenskonflikt `captionsrush.com`**: Die Domain unterscheidet sich von deiner nur durch ein «s». Schau dir an, was dort betrieben wird (gleiches Angebot? gleiche Zielgruppe?). Bei gleichem Angebot besteht **Verwechslungsgefahr** (auch ohne eingetragene Marke kann der frühere Nutzer ältere Rechte haben). Das kann ich nicht rechtlich beurteilen. Mein Rat: eine **Erstberatung bei einer Markenanwältin/einem Markenanwalt** (oft pauschal 200 bis 500 CHF) *bevor* du die Marke anmeldest oder viel Geld in Werbung steckst; im Zweifel einen klar unterscheidbaren Namen wählen.
3. **Anmeldung in der Schweiz (IGE)**: <https://www.ige.ch> → e-trademark. Wortmarke «CaptionRush», Klassen 9 und 42. Gebühr laut IGE: CHF 450 für bis zu 3 Klassen, mit Online-Anmeldung CHF 100 Rabatt (also rund CHF 350); vor der Anmeldung die aktuelle Gebührenseite prüfen. Schutz 10 Jahre, Verlängerung CHF 550.
4. **EU-Marke (EUIPO)**: <https://euipo.europa.eu> → Online-Anmeldung. Gebühr ca. 850 EUR für die erste Klasse, jede weitere Klasse zusätzlich (aktuelle Gebühren dort prüfen). Sinnvoll erst, wenn das Geschäft in der EU läuft. Die Priorität der Schweizer Anmeldung gilt 6 Monate für die EU-Anmeldung.
5. Bis dahin: nicht «®» verwenden (nur für eingetragene Marken); «™» ist erlaubt.

---

## Checkliste (zum Abhaken)
- [ ] A1 Domain und SSL · [ ] A2 PHP ≥ 8.1 · [ ] A3 Postfächer · [ ] A4 SPF/DKIM/DMARC · [ ] A5 FTP und `FTP_DIR`
- [ ] B1 Supabase (inkl. `schema.sql` erneut ausführen, Region, DPA) · [ ] B2 Groq (Key, Data Controls, Limits, DPA) · [ ] B3 ntfy · [ ] B4 GitHub-Secrets
- [ ] C1 Deploy · [ ] C2 Endpunkte · [ ] C3 End-to-End-Test · [ ] C4 Search Console · [ ] C6 Newsletter (Brevo, später)
- [ ] D Paddle (Sandbox, dann Live) · [ ] E1 SVA/Firma · [ ] E2 EU-Vertreter · [ ] E3 Marke
