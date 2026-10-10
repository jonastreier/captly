# Abos mit Paddle: Sandbox-Test (ohne echtes Geld)

Stand: Code fertig, **Schalter aus** (`BILLING_ENABLED` = false). Solange er aus ist, merkt kein Nutzer etwas (kein Limit, kein Abzeichen, E-Mail-Gate wie in der Beta). Diese Anleitung schaltet zuerst nur die **Sandbox** ein.
Preise und Währungen legst du bei Paddle fest: ein Preis (z. B. 7.99 USD) kann in Paddle mit Preisen pro Land/Währung (EUR, CHF …) ergänzt werden; das Checkout-Fenster zeigt automatisch die lokale Währung. Im Code stehen keine Preise.

## 1. Paddle-Sandbox-Konto
1. <https://sandbox-vendors.paddle.com> öffnen und ein Sandbox-Konto anlegen (getrennt vom echten Konto, keine Firmenprüfung nötig).
2. **Catalog → Products → New product**: «CaptionRush Creator» (Typ Standard), danach **Prices → New price**: Wiederkehrend, monatlich, 7.99 USD. Unter «Unit price overrides» (Preise pro Land) bei Bedarf EUR und CHF ergänzen.
3. Dasselbe für «CaptionRush Pro» mit 14.99. Die zwei **Preis-IDs** (`pri_…`) notieren.
4. **Developer tools → Authentication**: «Client-side token» erzeugen (beginnt mit `test_`) und **API key** erzeugen (geheim, nur Leserechte auf Customers/Subscriptions und «Customer portal sessions» schreiben genügt).
5. **Checkout → Checkout settings → Default payment link**: `https://captionrush.com` eintragen. Unter **Developer tools → Notifications → New destination**: URL `https://captionrush.com/api/paddle-webhook`, Typ Webhook, Events: `subscription.created`, `subscription.activated`, `subscription.updated`, `subscription.resumed`, `subscription.trialing`, `subscription.past_due`, `subscription.paused`, `subscription.canceled`. Nach dem Speichern den **Secret key** (`pdl_ntfset_…`) kopieren.
6. Domain-Freigabe: Paddle verlangt für den Checkout eine freigegebene Domain (**Checkout → Website approval**); in der Sandbox genügt das Eintragen von `captionrush.com`.

## 2. GitHub-Secrets setzen (Repo → Settings → Secrets and variables → Actions)
`BILLING_ENABLED` = `1`, `PADDLE_ENV` = `sandbox`, `PADDLE_CLIENT_TOKEN`, `PADDLE_PRICE_CREATOR`, `PADDLE_PRICE_PRO`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`. (Optional `ANON_SEC_PER_DAY`, Standard 600; `FREE_CLEAN_VIDEOS_PER_DAY`, Standard 2 = Videos pro Tag ohne Wasserzeichen für Free/Gäste.) `SUPABASE_SERVICE_KEY` ist schon da. Danach Actions → Deploy → «Run workflow».
Wichtig: `schema.sql` muss vorher im Supabase-SQL-Editor erneut ausgeführt worden sein (legt `profiles`, `usage`, `paddle_events` an).

## 3. Prüfen
- `https://captionrush.com/api/plan` → `{"enabled":true,"loggedIn":false,"plan":"anon",…}`; `https://captionrush.com/api/paddle-webhook` → `{"configured":true}`.
- Einloggen, im Menü erscheint «⏱ 30 min left». Video transkribieren: Zahl sinkt.
- **Upgrade**: Konto-Fenster → «Creator». Das Paddle-Fenster öffnet sich (Sandbox-Banner). Testkarte laut Paddle-Doku (Sandbox → «Test payment methods»), z. B. Visa `4000 0566 5566 5556`, beliebiges Ablaufdatum in der Zukunft, beliebiger CVC. Danach meldet die Seite «Your Creator plan is active», das Wasserzeichen verschwindet, das Kontingent steigt auf 300 Min.
- Paddle → Developer tools → Notifications → Logs: das Event `subscription.created` muss **200** zeigen. Bei 401: Secret falsch oder Uhr der Server weicht mehr als 5 Min. ab (`PADDLE_TOLERANCE_SEC`).
- **Kündigen/Zahlung ändern**: Konto-Fenster → «Manage subscription & invoices» öffnet das Kundenportal.
- Kündigen im Portal: Der Plan bleibt bis Laufzeitende, danach «free» (Event `subscription.canceled`).

## 4. Zurück auf «aus»
GitHub-Secret `BILLING_ENABLED` löschen oder auf `0` setzen → neu deployen. Daten in `profiles`/`usage` bleiben liegen.

## 5. Vor dem echten Start (Live)
Siehe `docs/ANLEITUNG-JONAS.md` (Paddle-Konto-Verifizierung) und `docs/abo-aktivierung.md` (Texte für Datenschutz und AGB, die erst dann veröffentlicht werden).
