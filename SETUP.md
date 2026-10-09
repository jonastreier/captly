# CaptionRush live schalten (Hostpoint) — Checkliste

> **Neu: [`docs/START-HIER.md`](docs/START-HIER.md)** — die Kurzfassung zum Abhaken (Domain, Postfächer, DNS, FTP, Supabase, Groq, Secrets, Deploy, automatischer Live-Check).

Alles Technische ist im Repo vorbereitet. Hier steht, was **nur du** in Dashboards erledigen kannst (je ca. 5–10 Min.).
Reihenfolge einhalten.

## 1. Domain kaufen und beim Hosting eintragen
- `captionrush.com` bei Hostpoint registrieren (Domain, DNS, SSL und Mail liegen dann an einem Ort).
- Hostpoint → Domain mit dem Webhosting verbinden. Merke dir den **Ordner (Document Root)** der Domain, z. B. `www/captionrush.com/`.
- SSL aktivieren (Let's Encrypt, in Hostpoint ein Klick). Die `.htaccess` leitet auf https und ohne `www` um.

## 2. Postfächer anlegen (Hostpoint → E-Mail)
- `contact@captionrush.com` — steht im Impressum und in der Datenschutzerklärung, muss **erreichbar** sein.
- `noreply@captionrush.com` — Absender der Login-Codes und der Bestätigungsmails. Nur dafür; Passwort notieren.
- SMTP-Daten aus der Hostpoint-Hilfe: Server (z. B. `asmtp.mail.hostpoint.ch`, Port 465 SSL — im Kundencenter prüfen), Benutzer = die volle Adresse.
- In Hostpoint die **SPF/DKIM-Einträge** für die Domain aktivieren (Mail → Domain → «E-Mail-Sicherheit»), damit Codes nicht im Spam landen.

## 3. Supabase (supabase.com → dein Projekt)
1. **SQL Editor** → Inhalt von `schema.sql` einfügen → Run. Das Skript ist wiederholbar und löscht nichts.
2. **Project Settings → API**: den **service_role**-Key kopieren (geheim! nur als GitHub-Secret `SUPABASE_SERVICE_KEY`, nie in den Code).
3. **Authentication → URL Configuration**: Site URL `https://captionrush.com`; Redirect URLs `https://captionrush.com/**`.
4. **Authentication → Emails → SMTP Settings** → Custom SMTP einschalten: Host/Port/Benutzer/Passwort von `noreply@captionrush.com`, Absender `noreply@captionrush.com`, Name «CaptionRush».
5. **Authentication → Rate Limits**: «Emails per hour» auf ca. 100 erhöhen.
6. **Authentication → Emails → Templates**: «Magic Link» und «Confirm signup» mit dem Text aus `docs/supabase-email-templates.md` ersetzen (enthält `{{ .Token }}`).
7. **Authentication → Providers → Email**: «Confirm email» an lassen; Passwörter werden nicht verwendet (Code-Login).
8. Region prüfen (**Project Settings → General**). Die Datenschutzerklärung nennt Frankfurt — falls anders, `datenschutz.html` und `privacy.html` anpassen.

## 4. GitHub (Repo → Settings → Secrets and variables → Actions → New repository secret)
| Secret | Wert |
|---|---|
| `FTP_SERVER` | FTP-Server aus dem Hostpoint-Kundencenter (FTPS/FTPES) |
| `FTP_USERNAME`, `FTP_PASSWORD` | FTP-Zugang |
| `FTP_DIR` | Document Root der Domain, z. B. `./www/captionrush.com/` (mit `/` am Ende) |
| `GROQ_API_KEY` | dein Groq-Schlüssel |
| `SUPABASE_SERVICE_KEY` | service_role-Key aus Schritt 3.2 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Zugang von `noreply@captionrush.com` |
| `MAIL_FROM` | `noreply@captionrush.com` |
| `LEAD_SECRET` | beliebiger langer Zufallstext (salzt die gehashte IP) |
| `ALERT_URL` | optional: `https://ntfy.sh/captionrush-<zufall>` — dasselbe Thema in der ntfy-App abonnieren → Push, wenn Groq sein Limit meldet |

## 5. Erstes Deployment
- PR mergen → die Action **Deploy** läuft automatisch (Tests → Paket → Upload). Fehlt ein Secret, sagt sie welches.
- Oder von Hand: Actions → Deploy → «Run workflow». Notfalls `node scripts/build-dist.js --zip` und den Inhalt von `dist/` per Dateimanager hochladen (dann `config.php` selbst aus `config.example.php` erstellen).
- Prüfen: `https://captionrush.com/api/transcribe` → `{"configured":true}`, `/api/lead` → `{"configured":true}`.

## 6. Nach dem Start
- Google Search Console: Domain per DNS bestätigen, `https://captionrush.com/sitemap.xml` einreichen.
- End-to-End-Test: Video hochladen → Untertitel → Export → E-Mail eingeben → (Newsletter-Häkchen) Bestätigungsmail → Login mit Code → Projekt speichern/laden.
- Supabase Free pausiert nach 7 Tagen ohne Aktivität — der Workflow **Supabase keep-alive** pingt täglich. Schlägt er fehl, schickt GitHub eine Mail.
- Leads regelmässig sichern: Supabase → Table Editor → `leads` → Export CSV (Free-Plan hat keine Backups).
- Alte Vercel-Adresse: Projekt in Vercel löschen oder pausieren, sobald die neue Domain läuft.
