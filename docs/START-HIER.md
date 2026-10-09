# START HIER: von null bis live (nur das, was nur du tun kannst)

Alles andere ist vorbereitet. Reihenfolge einhalten, jeder Schritt hat eine **Probe** (✅). Wo Hostpoint, Supabase oder Groq ihre Oberfläche geändert haben, steht «Bezeichnung kann abweichen»: dem Sinn nach suchen. Ausführlicher mit allen Hintergründen: [`ANLEITUNG-JONAS.md`](ANLEITUNG-JONAS.md).

**Goldene Regel:** Passwörter und Schlüssel gehören nur in GitHub → Settings → Secrets, nie in Chat, Mail oder Code.

---

## 1. Domain bei Hostpoint (ca. 15 min)
1. Hostpoint-Kundencenter → **Domains** → `captionrush.com` registrieren (CHF 10 im ersten Jahr, Verlängerung laut Vergleichsseiten ca. CHF 20; im Warenkorb prüfen). «Domain Shield» ist nicht nötig.
2. Domain dem **Webhosting** zuordnen. **Zielordner notieren** (z. B. `www/captionrush.com/`).
3. **SSL (Let's Encrypt)** für die Domain einschalten.
4. **PHP ≥ 8.1** einstellen (getestet mit 8.3), `curl` und `mbstring` aktiv.
✅ `https://captionrush.com` zeigt eine Seite ohne Zertifikatswarnung.

## 2. Zwei Postfächer (ca. 10 min)
Hostpoint → E-Mail → Postfach anlegen:
- `contact@captionrush.com` (steht im Impressum; Weiterleitung auf deine Adresse ist ok)
- `noreply@captionrush.com` (sendet Login-Codes, Bestätigungen, Kontaktformular). **Passwort in den Passwortmanager.**
- SMTP-Daten aus der Hostpoint-Hilfe notieren: Server (meist `asmtp.mail.hostpoint.ch`, bitte dort bestätigen), Port **465** (SSL), Benutzer = volle Adresse.
✅ Mit Thunderbird/Apple Mail eine Testmail von `noreply@` an dich schicken.

## 3. Mail-Echtheit: SPF, DKIM, DMARC (ca. 15 min)
Hostpoint → Domain → **DNS-Zone bearbeiten**:
- **SPF:** Knopf «Hostpoint-SPF-Eintrag hinzufügen» (genau **ein** SPF-Eintrag pro Domain).
- **DKIM:** Hostpoint-Support «Activate DKIM» befolgen; findest du den Schalter nicht, den Support fragen: *«Kann ich DKIM für ausgehende Mails von captionrush.com aktivieren?»*
- **DMARC:** neuer **TXT**-Eintrag, Name `_dmarc`, Wert zum Kopieren:
  `v=DMARC1; p=none; rua=mailto:contact@captionrush.com`
✅ Testmail von `noreply@` an Gmail → «Original anzeigen»: **SPF: PASS** (DKIM: PASS, wenn aktiv).

## 4. FTP für den Upload (ca. 15 min)
1. Hostpoint → FTP: Server notieren; **eigenes FTP-Konto** nur für diesen Ordner anlegen (Benutzer + Passwort), **FTPS (Explicit TLS), Port 21**.
2. Mit FileZilla verbinden, den Ordner der Domain öffnen, Pfad notieren, z. B. `./www/captionrush.com/` (**mit `/` am Ende**) → das ist `FTP_DIR`.
3. Probe: Datei `probe.txt` hochladen, `https://captionrush.com/probe.txt` im Browser öffnen, Datei danach löschen.
✅ `probe.txt` wird angezeigt.

## 5. Supabase (ca. 20 min)
supabase.com → dein Projekt:
1. **SQL Editor** → Inhalt von [`schema.sql`](../schema.sql) einfügen → **Run** (jederzeit wiederholbar). ✅ Table Editor zeigt u. a. `projects`, `leads`, `client_errors`, `style_stats`, `profiles`, `usage`.
2. **Project Settings → API:** den **service_role**-Schlüssel kopieren (nur als GitHub-Secret, nie in Code).
3. **Authentication → URL Configuration:** Site URL `https://captionrush.com`, Redirect URLs `https://captionrush.com/**`.
4. **Authentication → Emails → SMTP Settings:** Custom SMTP an: Host/Port/Benutzer/Passwort von `noreply@` (Schritt 2), Absender `noreply@captionrush.com`, Name `CaptionRush`.
5. **Authentication → Rate Limits:** «Emails per hour» auf ca. 100.
6. **Authentication → Emails → Templates:** «Magic Link» und «Confirm signup» durch den Text aus [`supabase-email-templates.md`](supabase-email-templates.md) ersetzen (enthält `{{ .Token }}`).
7. **Project Settings → General → Region ablesen** und mir schicken. Die Datenschutzerklärung nennt **Frankfurt**; steht dort etwas anderes, passe ich den Text an.

## 6. Groq und Alarm (ca. 10 min)
- **console.groq.com → API Keys:** neuen Schlüssel erzeugen (beginnt mit `gsk_`). Gratis-Tarif genügt für den Start.
- Optional **ntfy** (Push aufs Handy): App «ntfy» installieren, ein geheimes Thema wählen (z. B. `captionrush-k7x2m9q4z8`), abonnieren. Adresse: `https://ntfy.sh/<dein-thema>`.

## 7. GitHub-Secrets (ca. 10 min)
Repo `jonastreier/captly` → **Settings → Secrets and variables → Actions → New repository secret**. Einen Namen nach dem anderen, genau so geschrieben:

| Secret | Wert |
|---|---|
| `FTP_SERVER` | Server aus Schritt 4 |
| `FTP_USERNAME` | FTP-Benutzer aus Schritt 4 |
| `FTP_PASSWORD` | FTP-Passwort aus Schritt 4 |
| `FTP_DIR` | Pfad aus Schritt 4, **mit `/` am Ende** |
| `GROQ_API_KEY` | Schlüssel aus Schritt 6 |
| `SUPABASE_SERVICE_KEY` | service_role-Schlüssel aus Schritt 5 |
| `SMTP_HOST` | SMTP-Server aus Schritt 2 |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `noreply@captionrush.com` |
| `SMTP_PASS` | Passwort des Postfachs `noreply@` |
| `MAIL_FROM` | `noreply@captionrush.com` |
| `LEAD_SECRET` | langer Zufallstext: im Terminal `openssl rand -hex 32` und Ausgabe einfügen. **Nie ändern**, sonst werden alte Abmelde-Links ungültig. |
| `ALERT_URL` | (optional) ntfy-Adresse aus Schritt 6 |

## 8. Deploy und Prüfung (ca. 10 min)
1. Repo → **Actions → Deploy → Run workflow.** Der erste Schritt «Secrets prüfen» nennt **alle** fehlenden Secrets auf einmal; eintragen und nochmals starten.
2. Wenn «Deploy» grün ist, läuft automatisch **«Live-Check»**. Er prüft Zertifikat, alle Seiten, Transkription, E-Mail-Erfassung, Kontaktformular, gesperrte Dateien sowie MX/SPF/DMARC und sagt bei jedem ✗, was zu tun ist. Von Hand: Actions → Live-Check → Run workflow.
✅ Beide Läufe grün. Bleibt ein ✗: Text hierher kopieren oder Screenshot schicken.

## 9. Echter Test (ca. 20 min, Handy und Computer)
Genaue Schritte: [`ANLEITUNG-JONAS.md` → C3](ANLEITUNG-JONAS.md). Kurz: Video hochladen → Untertitel → Export mit E-Mail und Newsletter-Häkchen → Bestätigungsmail kommt an (nicht im Spam) → Abmelde-Link → Login-Code per Mail → Projekt speichern und laden → Cover → Kontaktformular `/kontakt`.

## 10. Danach
- Google Search Console (Domain-Eigentum per DNS-TXT, Sitemap `https://captionrush.com/sitemap.xml`): [`ANLEITUNG-JONAS.md` → C4](ANLEITUNG-JONAS.md).
- Alte Vercel-Adresse **zwei Wochen parallel** laufen lassen, dann abschalten.
- Später: Paddle (Abos) und Firma/Marke (Teile D und E der Anleitung). Der Abo-Schalter bleibt bis dahin aus.

## Wenn etwas hakt
| Meldung | Ursache | Lösung |
|---|---|---|
| «Secrets prüfen» ✗ | Secret fehlt oder falsch geschrieben | Name genau wie in der Tabelle, neu starten |
| FTP-Schritt scheitert | falscher Server/Port/Ordner, FTPS nicht erlaubt | Schritt 4 wiederholen; Explicit FTPS, Port 21 |
| Live-Check «nicht erreichbar» | DNS/SSL noch nicht aktiv | einige Stunden warten, Schritt 1 prüfen |
| «Groq-Key fehlt» | `GROQ_API_KEY` leer | Secret eintragen, neu deployen |
| «Supabase nicht konfiguriert» | `SUPABASE_SERVICE_KEY` fehlt | Secret eintragen, `schema.sql` ausführen |
| Mails kommen nicht an / Spam | SPF/DKIM/DMARC fehlen | Schritt 3; Live-Check zeigt, was fehlt |
| «… ist ÖFFENTLICH abrufbar» | `.htaccess` wirkt nicht | Hostpoint-Support: «.htaccess mit AllowOverride aktivieren» |
