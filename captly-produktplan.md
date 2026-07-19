# Captly — Produkt-, Freemium- & Architektur-Setup

> Annahmen sind mit **[A]** markiert. Stand: 11.07.2026. Phase 0 ist bereits implementiert (captly.html + server.js).
>
> **Update 19.07.2026:** Die Transkriptions-Engine hat seither gewechselt — Perfect läuft nicht mehr direkt über OpenAI/`server.js`, sondern über einen **Groq-Proxy (`transcribe.php`, kostenloser Free-Tier)**, siehe [captly-handoff-v2.md](captly-handoff-v2.md) Abschnitt 2. Das Preis-/Freemium-Modell hier bleibt als **Zukunfts-Roadmap für Phase 1** (Login/Stripe via `server.js`) gültig, ist aber aktuell **noch nicht aktiv** — Stand jetzt ist Captly eine reine Demo ohne Kontenpflicht.

## 1. Empfohlene Produktlogik

**Die entscheidende Kosten-Asymmetrie:** Bei captions.ai läuft alles serverseitig (Transkription + Rendering = hohe Kosten pro Nutzer). Bei Captly läuft das **Video-Rendering komplett im Browser** (Canvas + MediaRecorder) und kostet uns 0. Die **einzige variable Kostenquelle ist die Perfect-Transkription** (OpenAI whisper-1, $0.006/Min). Daraus folgt die gesamte Produktlogik:

- **⚡ Fast** (Whisper-tiny, lokal im Browser) → kostet uns exakt 0 → **immer und für alle unbegrenzt gratis**. Das ist der Free-Kern, die Demo und der Fallback. Kein Account nötig.
- **💎 Perfect** (whisper-1 über unseren Server) → wird gemessen, limitiert und monetarisiert.
- **Nie automatische Kosten:** Ist das Kontingent aufgebraucht, antwortet der Server mit 402 + klarer Meldung; Fast funktioniert weiter. Kein Feature bricht, keine Karte wird belastet, kein Auto-Overage.
- **Wow vor Paywall:** Upload → Auto-Transkript → Karaoke-Preview in 20 Styles → SRT-Export — alles passiert VOR jeder Bezahlschranke.

## 2. Freemium- und Trial-Modell

| Stufe | Was der Nutzer bekommt | Was es uns kostet |
|---|---|---|
| Ohne Account (Phase 0) | Fast unbegrenzt + **3 Perfect-Videos/Tag** (IP-basiert) | max. ~3×15 Min × $0.006 ≈ 27 ¢/IP/Tag, gedeckelt |
| Mit Account (Phase 1) | Fast unbegrenzt + **einmalig 10 Perfect-Trial-Minuten** | max. 6 ¢ pro Neuregistrierung |
| Free dauerhaft | Fast unbegrenzt, SRT/VTT gratis, Video-Export **mit dezentem Wasserzeichen** | 0 |

**Conversion-Prinzip: durch Nutzen, nicht Frust.**
- UI zeigt immer transparent: „Perfect: noch 2 von 3 gratis heute" (Badge neben dem Perfect-Button).
- Upgrade-Momente (Events, kein Dauer-Nag): `first_perfect_done` → nach dem **ersten erfolgreichen Export** ein einmaliges, schließbares Modal („Gefallen? Creator = 300 Min/Monat, ohne Wasserzeichen"). `quota_80` → Banner. `quota_100` → 402-Meldung mit Upgrade-Link. Sonst nichts.
- SRT/VTT bleiben im Free-Plan wasserzeichenfrei (kostet nichts, bindet Profis ans Tool).

## 3. Planstruktur

| | **Free** 0 € | **Creator** 9 €/M **[A]** | **Pro** 24 €/M **[A]** |
|---|---|---|---|
| ⚡ Fast (lokal) | unbegrenzt | unbegrenzt | unbegrenzt |
| 💎 Perfect-Minuten/Monat | 10 Trial einmalig | **300** | **1500** |
| Video-Export (MP4/WebM) | ✓ mit Wasserzeichen | ✓ ohne | ✓ ohne |
| SRT/VTT-Export | ✓ | ✓ | ✓ |
| Styles (20 Katalog) | alle | alle | alle |
| Eigener Style | – | 1 | Brand-Kit (mehrere Presets, eigene Fonts, teilbar) |
| Übersetzung (EN) | – | ✓ | ✓ |
| Projekte speichern | 1 (nur lokal) | 20 (Cloud) | unbegrenzt |
| Batch-Verarbeitung | – | – | ✓ |
| Priority-Verarbeitung + Support | – | – | ✓ |
| **Minuten-Pack** (nie automatisch!) | – | 100 Min / 3 € manuell zubuchbar | dito |

**Limits & Fairness:** Soft-Limit bei 80 % (Banner), Hard-Limit bei 100 % (Perfect aus, Fast an — Kern bleibt nutzbar). Fair-Use: max. 15 Min/Datei, 25 MB Audio. Ungenutzte Minuten verfallen monatlich (kein Rollover **[A]**, einfach zu kommunizieren).

**Margenrechnung [A]:** Creator: 300 Min × $0.006 = ~1.80 $ API-Kosten vs. 9 € Umsatz → >75 % Rohmarge, selbst bei Vollnutzung. Pro: 1500 × 0.006 = 9 $ vs. 24 € → ok. Realistisch nutzen die meisten <30 % ihres Kontingents.

## 4. Technische Architektur

**Phase 0 — heute live-fähig (BEREITS GEBAUT):**
`captly.html` (kompletter Editor, Rendering lokal) + `server.js` (Key serverseitig, Rate-Limit 10/10 Min/IP, Gratis-Quota `FREE_PER_DAY=3`/IP/Tag → 402, Tagesbudget-Notbremse `MAX_DAY_USD=5` → 503, WAV-Dauer wird **serverseitig** aus den Bytes berechnet — dem Client wird nie geglaubt).

**Phase 1 — SaaS-MVP (~2–3 Wochen [A]):**
- **Frontend:** Der bestehende Single-File-Editor bleibt unverändert der Kern. Drumherum nur eine dünne Shell: Landing, Login, Account-Seite. Kein Rewrite.
- **Backend:** **Supabase [A]** als Abkürzung (Auth Magic-Link + Postgres + Row Level Security) ODER eigenes Node/Fastify auf deinem Host. Endpoints: `POST /transcribe` (auth + quota), `GET /me` (Plan, Restminuten), `POST /billing/checkout`, `POST /billing/webhook`, `GET/PUT /projects`.
- **Keine Job-Queue im MVP [A]:** whisper-1 antwortet in Sekunden → synchron mit 120s-Timeout reicht. Queue (BullMQ + Redis) erst nötig für Batch (Pro) oder falls je Server-Rendering kommt.
- **Admin:** `plans`-Tabelle in der DB (Limits/Preise ohne Deploy änderbar) + simple Admin-Seite hinter Basic-Auth + env-Overrides.

**Datenmodell (Postgres):**
```sql
users          (id uuid PK, email, created_at, trial_seconds_used int default 0)
subscriptions  (user_id FK, stripe_customer_id, stripe_sub_id, plan text, status text, current_period_end timestamptz)
usage_events   (id, user_id FK, kind text, seconds int, cost_usd numeric, created_at)   -- append-only
minute_packs   (id, user_id FK, seconds_remaining int, purchased_at)
projects       (id, user_id FK, title, payload_json jsonb, updated_at)                  -- blocks+style+settings
plans          (id text PK, price_cents int, monthly_seconds int, features_json jsonb)  -- Admin-konfigurierbar
-- Monatsverbrauch: SELECT sum(seconds) FROM usage_events WHERE user_id=$1 AND created_at >= date_trunc('month', now())
```

**Gating-Reihenfolge in `POST /transcribe` (ausschließlich serverseitig — das Frontend zeigt nur an):**
1. Auth-Token prüfen → User + Plan laden
2. WAV-Dauer aus Bytes berechnen (`(len−44)/32000` Sekunden)
3. Kontingent prüfen: Plan-Restminuten → Minuten-Packs → Trial-Guthaben (in dieser Reihenfolge)
4. Reicht es nicht → `402 {remaining, plan, upgrade_url}` — **bevor** OpenAI aufgerufen wird
5. OpenAI-Call → `usage_events` schreiben → Antwort

## 5. Billing- und Usage-Control

- **Stripe Checkout (hosted) + Customer Portal** → fast kein eigenes Billing-UI nötig. Produkte: `creator_monthly`, `pro_monthly`, `pack_100min` (one-time). Kündigung/Zahlungsmethode regelt das Portal.
- **Webhooks:** `checkout.session.completed` → Subscription anlegen · `invoice.paid` → Periode verlängern · `customer.subscription.deleted` → auf Free zurück (Fast bleibt ja voll nutzbar → kein harter Rauswurf).
- **Kein metered Billing, kein Auto-Overage** (deine Kernregel): feste Kontingente, Zusatzminuten nur als bewusst gekauftes Pack.
- **Kostenexplosions-Schutz** (mehrschichtig): Rate-Limit pro IP **und** User · max 15 Min/Datei, 25 MB · Trial an verifizierte E-Mail gebunden (Phase 1), nicht an IP · Wegwerf-Mail-Blockliste · Tagesbudget-Bremse im Server (bereits gebaut) · Alarm-Mail bei > X $/Tag · Kill-Switch per env.
- **Trial-State & Conversion-Events** in `usage_events`/Analytics: `signup`, `first_fast_done`, `first_perfect_done`, `first_export`, `quota_80`, `quota_100`, `checkout_started`, `subscribed`. Nord-Metrik: Trial→Paid-Conversion; Gesundheits-Metrik: API-Kosten/Umsatz < 25 %.

## 6. Konkrete Umsetzungsschritte

| # | Schritt | Status |
|---|---|---|
| 0 | Phase 0: Anonym-Quota, Budget-Bremse, Key-Proxy | ✅ gebaut & getestet |
| 1 | Auth: Magic-Code per Mail (Resend-API; ohne Key → Code im Server-Log für Tests), Sessions, SQLite statt Supabase (`node:sqlite`, 0 Dependencies) | ✅ gebaut & getestet |
| 2 | Usage-Tracking (`usage_events`), Enforcement vor OpenAI-Call, `GET /me`, UI-Badge „noch X Min" | ✅ gebaut & getestet |
| 3 | Stripe: Checkout-Session + Webhook (Signaturprüfung, subscription/pack/cancel), `plans`-Tabelle. **Offen: deine Stripe-Keys + 3 Price-IDs in env** — ohne Keys antwortet der Endpoint sauber mit 501 | ✅ Code fertig, Keys fehlen |
| 4 | Wasserzeichen „⚡ captly" im Free-Video/PNG-Export (entfällt ab Creator) + einmaliges Upsell-Modal nach erstem Export | ✅ gebaut |
| 5 | Cloud-Projekte: speichern/laden/Limit (Free 1 · Creator 20 · Pro ∞), Payload = Blöcke+Style+Settings | ✅ gebaut & getestet |
| 6 | Admin `/admin` (Basic-Auth): Nutzer/Spend-Übersicht, Plan-Limits per POST änderbar; Spend-Alarm-Mail + Tages- & Monats-Budget-Bremse | ✅ gebaut & getestet |
| 7 | Brand-Kit (Pro), Batch (Pro), mehr Zielsprachen, Affiliate | ⏳ danach |

**Deployment-Checkliste (das Einzige, was du noch tun musst):**
1. `captly.html` + `server.js` auf den Host, `OPENAI_API_KEY` setzen → läuft (Login-Codes erscheinen im Server-Log)
2. Resend-Konto (gratis-Tier reicht) → `RESEND_API_KEY` + `MAIL_FROM` → echte Login-Mails
3. Stripe-Konto → 3 Produkte anlegen (creator 9 €/M, pro 24 €/M, pack 3 € einmalig) → `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, 3 Price-IDs, `APP_URL` setzen; Webhook-URL in Stripe: `APP_URL/billing/webhook`
4. `ADMIN_PASS` setzen → `/admin` aufrufen

**Warum das funktioniert:** Free-Nutzer erleben den kompletten Kern (Fast + alle Styles + SRT) ohne dass uns Kosten entstehen — wir verschenken viel Wert, aber fast keine Marge. Der Upgrade-Grund ist glasklar und ehrlich: bessere Erkennung (Perfect-Minuten), kein Wasserzeichen, Cloud-Projekte. Bezahlt wird ausschließlich nach bewusster Planwahl.
