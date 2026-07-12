# Captly

Web-Tool für Instagram/TikTok-Untertitel (Auto-Captions im Stil von captions.ai).
Upload → Auto-Transkript → Karaoke-Preview in 20 Styles → Export als **MP4** (mit
eingebrannten Captions), SRT oder VTT. Rendering läuft komplett im Browser.

- **⚡ Fast** — Whisper lokal im Browser (transformers.js), gratis & unbegrenzt, kein Account.
- **💎 Perfect** — OpenAI `whisper-1` über den eigenen Server (beste Qualität, wird limitiert/monetarisiert).

Zwei Dateien, kein Build:
- [`captly.html`](captly.html) — kompletter Editor + Landing (Single-File).
- [`server.js`](server.js) — Backend (Node 22+, `node:sqlite`, **keine** npm-Dependencies):
  Magic-Code-Login, Projekte, Usage-/Quota-Gating, Stripe, Admin.

## Schnellstart (lokal)

```bash
OPENAI_API_KEY=sk-... node server.js
# → http://localhost:8787   (Login-Codes erscheinen im Terminal-Log)
```

Ohne `OPENAI_API_KEY` startet der Server nicht. Ohne `RESEND_API_KEY` kommen Login-Codes
nur ins Log (gut zum Testen, nicht für echte Nutzer). Ohne Stripe-Keys ist der Kern voll
nutzbar, nur der Kauf-Endpoint antwortet mit 501.

## Konfiguration

Alle Variablen sind in [`.env.example`](.env.example) dokumentiert. Kopieren und ausfüllen:

```bash
cp .env.example .env       # Werte eintragen
set -a; . ./.env; set +a   # laden
node server.js
```

Wichtigste Variablen:

| Variable | Zweck | Ohne sie |
|---|---|---|
| `OPENAI_API_KEY` | Perfect-Transkription | **Server startet nicht** |
| `RESEND_API_KEY` + `MAIL_FROM` | echte Login-Mails | Codes nur im Log |
| `STRIPE_SECRET` + 3 `STRIPE_PRICE_*` | Abos & Minuten-Packs | Kein Kauf (501) |
| `APP_URL` | öffentliche URL, Stripe-Redirects, CORS-Standard | localhost |
| `CORS_ORIGINS` | erlaubte Fremd-Origins (Standard: `APP_URL`) | nur eigene Domain |
| `DB_PATH` | **persistenter** SQLite-Pfad | `./captly.db` im Arbeitsverzeichnis |
| `ADMIN_PASS` | Basic-Auth für `/admin` | `/admin` gesperrt |

## Daten & Backup (SQLite)

Der Server nutzt eine einzelne SQLite-Datei (`DB_PATH`). Für den Launch reicht das für
tausende Nutzer — eine separate Datenbank ist **nicht** nötig.

- **Persistenz:** `DB_PATH` MUSS auf dauerhaftem Speicher liegen (z. B. `/var/lib/captly/captly.db`),
  **nicht** auf ephemeren Container-Dateisystemen (Heroku/manche PaaS) — sonst sind Konten
  und Abos nach jedem Deploy weg.
- **Backup (Cron, konsistent trotz laufendem Server):**
  ```bash
  # /etc/cron.d/captly-backup — täglich 3:15 Uhr
  15 3 * * * root sqlite3 /var/lib/captly/captly.db ".backup '/var/backups/captly-$(date +\%F).db'"
  ```
- Erst auf Postgres wechseln, wenn du **mehrere** Server-Instanzen brauchst (SQLite skaliert
  nicht über Prozessgrenzen).

## Deployment (eigener Host)

Node lauscht auf `PORT`; **HTTPS** übernimmt ein Reverse-Proxy davor.

**1) Prozess dauerhaft laufen lassen** — systemd (`/etc/systemd/system/captly.service`):

```ini
[Unit]
Description=Captly
After=network.target

[Service]
WorkingDirectory=/opt/captly
EnvironmentFile=/opt/captly/.env
ExecStart=/usr/bin/node server.js
Restart=always
User=captly

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now captly
```

**2) HTTPS-Reverse-Proxy** — Caddy (automatisches Let's-Encrypt-Zertifikat), `Caddyfile`:

```
captly.deinedomain.ch {
    reverse_proxy localhost:8787
}
```

**3) Stripe-Webhook** in Stripe eintragen: `https://captly.deinedomain.ch/billing/webhook`
(Events: `checkout.session.completed`, `customer.subscription.deleted`).

**Deploy-Checkliste:** `.env` gesetzt · `DB_PATH` persistent + Backup-Cron · HTTPS aktiv ·
`CORS_ORIGINS` = deine Domain · Stripe-Produkte + Webhook · `ADMIN_PASS` gesetzt · einmal
end-to-end testen (Upload → Fast → Perfect → Export → Login-Mail kommt an → Testkauf).

## Tests

```bash
python3 -c "import re;open('/tmp/c.js','w').write(re.search(r'<script>(.*)</script>',open('captly.html').read(),re.S).group(1))" && node test-captly.js
```

Führt das komplette `captly.html`-Script mit DOM-Stub in Node aus (Zeitformate, Karaoke-Logik,
Halluzinations-Filter, Export, Landing-Widgets, WAV-Encoder u. a.). Nicht automatisiert testbar
(braucht echten Browser + Video): Whisper-Inferenz, MediaRecorder/ffmpeg-Export, Canvas-Rendering
→ manuell in Chrome **und** Firefox prüfen (MP4-Export cross-browser).
