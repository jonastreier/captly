# GitHub-Secrets für gluephs.com: Schritt für Schritt

Ziel: Der automatische Deploy lädt bei jedem Merge auf `main` **alles** vollständig auf gluephs.com hoch. Dazu gehören `.htaccess`, Schriften und `config.php`. Danach funktionieren `/de`, `/datenschutz`, `/api/…`, Schriften, Transkription, Login und Mails.

Dauer: ca. 45 Minuten. Reihenfolge einhalten, jeder Schritt hat eine **Probe** (✅). Wo Hostpoint, Supabase oder Groq ihre Oberfläche geändert haben: dem Sinn nach suchen.

## Schnellstart (ca. 10 min): Seite sauber online, Untertitel funktionieren

Pflicht sind nur **5 Secrets**. Alles andere kann später folgen, der Deploy läuft trotzdem und nennt das Fehlende als Hinweis.

| Secret | Wert |
|---|---|
| `FTP_SERVER` | z. B. `sl52.web.hostpoint.ch` (Schritt 1) |
| `FTP_USERNAME` | FTP-Benutzer (Schritt 1) |
| `FTP_PASSWORD` | FTP-Passwort (Schritt 1) |
| `FTP_DIR` | Ordner von gluephs.com, z. B. `./www/gluephs.com/` (Schritt 1; streng genommen optional, aber ohne landet alles in `./`) |
| `GROQ_API_KEY` | `gsk_…` (Schritt 3) |

Dann Schritt 6 (eintragen) und 7 (Deploy starten). Login, E-Mail-Liste, Mails und Spam-Schutz des Kontaktformulars kommen dazu, sobald Schritt 2, 4 und 5 erledigt sind.

**Goldene Regel:** Passwörter und Schlüssel gehören nur in GitHub → Secrets, nie in Chat, Mail oder Code. Eine Ausnahme sind die zwei öffentlichen Supabase-Werte aus Schritt 4, die sind ungefährlich.

Stand bereits erledigt: gluephs.com läuft bei Hostpoint (Server `sl52.web.hostpoint.ch`), SSL ist aktiv, MX, SPF und DMARC sind gesetzt.

---

## 1. FTP-Zugang (ca. 10 min)

1. Hostpoint-Kundencenter → **Webhosting** → **FTP-Benutzer** → neuen Benutzer anlegen, z. B. `deploy-gluephs`.
   - Zugriff möglichst nur auf den Ordner der Domain beschränken.
   - Passwort lang wählen und im Passwortmanager speichern.
2. Den Servernamen notieren, er steht auf derselben Seite (vermutlich `sl52.web.hostpoint.ch`).
3. Mit FileZilla verbinden: Protokoll **FTP – explizites FTP über TLS**, Port **21**.
4. Den Ordner suchen, in dem heute die `index.html` von gluephs.com liegt, z. B. `www/gluephs.com/`. Diesen Pfad notieren, **mit `./` davor und `/` am Ende**, also z. B. `./www/gluephs.com/` → das ist `FTP_DIR`.
   - Hat der FTP-Benutzer nur Zugriff auf genau diesen Ordner, ist `FTP_DIR` einfach `./`.

✅ In FileZilla siehst du `index.html`, `captly.de.html`, `transcribe.php` usw. im notierten Ordner.

## 2. Zwei Postfächer + SMTP (ca. 10 min)

Hostpoint → **E-Mail** → Postfach anlegen:
- `hello@gluephs.com` steht im Impressum. Eine Weiterleitung auf deine Adresse ist ok.
- `noreply@gluephs.com` verschickt Login-Codes, Bestätigungen und das Kontaktformular. Das Passwort kommt in den Passwortmanager.

SMTP-Daten (in der Hostpoint-Hilfe kurz bestätigen):
- Server `asmtp.mail.hostpoint.ch`
- Port **465** (SSL)
- Benutzer = volle Adresse `noreply@gluephs.com`

**DKIM** (bessere Zustellung): Hostpoint → Domain gluephs.com → E-Mail-Einstellungen → DKIM aktivieren. Findest du den Schalter nicht, frag den Support: *«Bitte DKIM für ausgehende Mails von gluephs.com aktivieren.»*

✅ Mit Apple Mail eine Testmail von `noreply@gluephs.com` an deine Gmail schicken. In Gmail auf «Original anzeigen» gehen, dort steht **SPF: PASS**.

## 3. Groq-Schlüssel (ca. 3 min)

console.groq.com → **API Keys** → **Create API Key**, Name `gluephs`. Der Schlüssel beginnt mit `gsk_`. Er wird nur einmal angezeigt, deshalb direkt in GitHub eintragen (Schritt 6).

## 4. Supabase: neues Projekt (ca. 15 min)

Das bisherige Projekt `tghodbtdraqkfwcmedcv` existiert nicht mehr, deshalb funktioniert das Login nicht.

1. supabase.com → **New project**
   - Name `gluephs`
   - Region **Central EU (Frankfurt)**, so steht es in der Datenschutzerklärung
   - Datenbank-Passwort in den Passwortmanager
2. **SQL Editor** → Inhalt von [`schema.sql`](../schema.sql) einfügen → **Run**.
   ✅ Der Table Editor zeigt u. a. `projects`, `leads`, `client_errors`, `style_stats`, `profiles`, `usage`.
3. **Project Settings → API** (bzw. «API Keys»):
   - **Project URL** (`https://xxxx.supabase.co`) → wird Secret `SUPABASE_URL`
   - **Publishable key** (`sb_publishable_…`) bzw. **anon** → wird Secret `SUPABASE_ANON_KEY`. Dieser Schlüssel ist öffentlich.
   - Den geheimen **service_role**-Schlüssel nehmen, falls es den Reiter **«Legacy API Keys»** gibt (beginnt mit `eyJ…`). Sonst den **Secret key** (`sb_secret_…`). Er wird Secret `SUPABASE_SERVICE_KEY` und darf **nie** öffentlich werden.
4. **Authentication → URL Configuration:**
   - Site URL `https://gluephs.com`
   - Redirect URLs `https://gluephs.com/**`
5. **Authentication → Emails → SMTP Settings** → Custom SMTP einschalten:
   - Host `asmtp.mail.hostpoint.ch`, Port `465`
   - Benutzer `noreply@gluephs.com`, Passwort des Postfachs
   - Absender `noreply@gluephs.com`, Name `Gluephs`
6. **Authentication → Rate Limits:** «Emails per hour» auf ca. 100.
7. **Authentication → Emails → Templates:** «Magic Link» und «Confirm signup» durch den Text aus [`supabase-email-templates.md`](supabase-email-templates.md) ersetzen (enthält `{{ .Token }}`).

## 5. Signier-Schlüssel erzeugen (1 min)

Im Terminal:
```bash
openssl rand -hex 32
```
Die Ausgabe ist `LEAD_SECRET`. **Später nie ändern**, sonst werden alte Abmelde-Links ungültig.

Optional **Push-Alarm aufs Handy** (Groq-Limit, Fehler):
1. App «ntfy» installieren.
2. Ein geheimes Thema wählen, z. B. `gluephs-` + 10 Zufallszeichen, und abonnieren.
3. Die Adresse `https://ntfy.sh/<thema>` ist `ALERT_URL`.

## 6. Secrets in GitHub eintragen (ca. 10 min)

github.com/jonastreier/captly → **Settings → Secrets and variables → Actions → New repository secret**. Einen Namen nach dem anderen anlegen, **genau so geschrieben**, ohne Leerzeichen davor oder danach:

| Secret | Wert | aus Schritt |
|---|---|---|
| `FTP_SERVER` | z. B. `sl52.web.hostpoint.ch` | 1 |
| `FTP_USERNAME` | FTP-Benutzer | 1 |
| `FTP_PASSWORD` | FTP-Passwort | 1 |
| `FTP_DIR` | z. B. `./www/gluephs.com/` (mit `/` am Ende) | 1 |
| `SMTP_HOST` | `asmtp.mail.hostpoint.ch` | 2 |
| `SMTP_PORT` | `465` | 2 |
| `SMTP_USER` | `noreply@gluephs.com` | 2 |
| `SMTP_PASS` | Passwort von `noreply@` | 2 |
| `MAIL_FROM` | `noreply@gluephs.com` | 2 |
| `GROQ_API_KEY` | `gsk_…` | 3 |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | 4 |
| `SUPABASE_ANON_KEY` | `sb_publishable_…` (öffentlich) | 4 |
| `SUPABASE_SERVICE_KEY` | `eyJ…` (service_role) bzw. `sb_secret_…` | 4 |
| `LEAD_SECRET` | Ausgabe von `openssl rand -hex 32` | 5 |
| `ALERT_URL` | optional: `https://ntfy.sh/<thema>` | 5 |

Nicht nötig (bleiben leer, Abos sind aus): alle `PADDLE_*`, `BILLING_ENABLED`, `RATE_LIMIT_PER_HOUR`, `MAX_AUDIO_SEC_PER_HOUR`.

## 7. Deploy starten und prüfen (ca. 5 min)

1. Repo → **Actions → Deploy → Run workflow** (Branch `main`).
   - Der erste Schritt «Secrets prüfen» nennt **alle** fehlenden oder falschen Secrets auf einmal. Korrigieren und nochmals starten.
2. Ist «Deploy» grün, läuft automatisch **«Live-Check»** gegen https://gluephs.com. Er prüft Zertifikat, Seiten, Transkription, E-Mail-Erfassung, Kontaktformular, gesperrte Dateien und MX/SPF/DMARC, und sagt bei jedem ✗, was zu tun ist.

✅ Beide Läufe grün. Dann von Hand prüfen:
- https://gluephs.com/de zeigt die deutsche Seite
- https://gluephs.com/datenschutz öffnet
- Im Editor ändert ein Schriftwechsel die Untertitel
- «Sign in» schickt einen Code per Mail (nicht im Spam)

## Wenn etwas hakt

| Meldung | Ursache | Lösung |
|---|---|---|
| «Secrets prüfen» ✗ | Secret fehlt oder ist falsch geschrieben | Name genau wie in der Tabelle, neu starten |
| FTP-Schritt scheitert | falscher Server, Ordner oder Benutzer, oder kein FTPS | Schritt 1 wiederholen, «explizites FTP über TLS», Port 21 |
| Seite zeigt nach Deploy alten Stand | falscher `FTP_DIR` (Upload in anderen Ordner) | in FileZilla nachsehen, wo `captly.html` gelandet ist, `FTP_DIR` korrigieren |
| `/de` weiterhin 404 | `.htaccess` wird ignoriert | Hostpoint-Support: «Bitte .htaccess / mod_rewrite für gluephs.com aktivieren» |
| «Sign-in is temporarily unavailable» | `SUPABASE_URL`/`SUPABASE_ANON_KEY` fehlen oder falsch | Schritt 4.3 prüfen, neu deployen |
| Live-Check: E-Mail-Erfassung ✗ | `SUPABASE_SERVICE_KEY` falsch oder `schema.sql` nicht ausgeführt | Schritt 4.2/4.3; mit `sb_secret_…` klappt es nicht → Legacy-`service_role`-Schlüssel nehmen |
| Mails im Spam / kommen nicht | DKIM fehlt, SMTP-Passwort falsch | Schritt 2; Live-Check zeigt, was fehlt |
