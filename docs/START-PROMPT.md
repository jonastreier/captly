# Start-Prompt für die nächste Session (zum Kopieren)

```
Projekt: CaptionRush (Repo jonastreier/captly, Domain captionrush.com, Hosting Hostpoint). Lies zuerst CLAUDE.md, README.md, SETUP.md und docs/ANLEITUNG-JONAS.md und halte dich daran: chirurgische Edits in captly.html, nach Landing-/Head-Änderungen `node scripts/build-i18n.js`, vor jedem Commit alle Tests aus CLAUDE.md grün (build-i18n --check, node --check server.js, test-captly, test-polish, test-enhance, test-lead, test-telemetry, test-billing). Browser-Check bei UI-Änderungen mit `node test-e2e.js` (Playwright, siehe README). Antworten auf Deutsch (Schweizer Schreibweise), knapp und kritisch. Modell nur so gross wie nötig, Tokens sparen (gezielt lesen, keine Ganzdatei-Dumps). Nie ohne meine Freigabe mergen; ein PR pro Thema, eigener Branch von frischem main.

## Stand (Oktober 2026)
Alles, was ohne mich möglich war, ist umgesetzt und als PRs offen:
- #15 Go-live (Hostpoint-Deploy, Datenschutz, Styles, Cover-Editor, Leads mit Double-Opt-in) – Basis für alle anderen
- #16 Recht/Texte (Newsletter-Abmeldung unsubscribe.php, neutrale Icons, Disclaimer, Art.-30-Verzeichnis, EU-Vertreter-Doku, ffmpeg-GPL-Dateien)
- #17 Tight: Mindestanzeigedauer 0,25 s · #18 E2E-Browsertest (test-e2e.js) · #19 Landing-Performance · #21 Mobile «Select» (Mehrfachauswahl, zusammenhängender Bereich)
- #20 Telemetrie (log.php, stat.php, «Trending») · #22 Abo-Vorbereitung hinter BILLING_ENABLED=false (Paddle-Webhook, Kontingent, Portal) · #23 docs/ANLEITUNG-JONAS.md + dieser Prompt
Reihenfolge: #15 → #16 → #20 → #22 → #23; #17/#18/#19/#21 unabhängig nach #15.
Nicht testbar ohne mich/echte Dienste: Hostpoint, Supabase, Groq, Paddle, echte Mails.

## Zuerst
1. Status der PRs prüfen (gemergt? Konflikte? Deploy-Action grün?). Fehlt etwas, mich bitten zu mergen; Konflikte (v. a. README.md, .htaccess, build-dist.js, schema.sql, CLAUDE.md) selbst lösen und Tests laufen lassen.
2. Fragen/Fehler von mir aus ANLEITUNG-JONAS.md abarbeiten (Deploy-Logs, End-to-End-Test auf captionrush.com, Mail-Zustellung, Supabase-Region). Bei Mail- oder Deploy-Fehlern: Ursache aus dem Log herleiten, Fix als PR.

## Dann, je nach meiner Freigabe
- Paddle-Sandbox-Test begleiten (docs/paddle-sandbox.md): Webhook-Log 200? Plan erscheint? Toleranz PADDLE_TOLERANCE_SEC ggf. anpassen.
- Go-live der Abos (docs/abo-aktivierung.md): Pricing-Abschnitt der Landing auf echte Pläne/Preise, Datenschutz (Paddle, Nutzungsdaten), AGB (Pläne, Kündigung, Rückerstattung), EU-Vertreter eintragen, Verarbeitungsverzeichnis Zeile 9, DE/EN-Texte, build-i18n.
- Kleine Lücken: «Konto löschen»-Knopf (schema.sql hat delete_my_account(), keine UI; Datenschutz sagt aktuell «per E-Mail»); Polish/Enhance-Aufrufe zählen nicht ins Abo-Kontingent; Style-Zähler ist per IP-Rate-Limit nur grob gegen Missbrauch geschützt.
- Qualität: Firefox/Safari-Export-Pfade prüfen, Lighthouse nach Deploy auf der echten Domain, Fehlerprotokoll (public.error_summary) auswerten und häufige Fehler beheben.

## Arbeitsweise
Alles Dashboard-Abhängige (Hostpoint, Supabase, GitHub-Secrets, Groq, Paddle) kann ich nur selbst: dafür nummerierte Schritt-für-Schritt-Anleitung mit Klickwegen und Prüfschritt. Bei Designentscheiden mit mehreren guten Optionen kurz Screenshots zeigen. Am Schluss: Zusammenfassung in 10 Zeilen, offene Punkte nur noch die, die ich selbst erledigen muss.
```
