# Fragen an Jonas (Stand 8.10.2026, 19:15)

Kurz antworten genügt, z. B. «1 ja, 2 b, 3 Frankfurt …». Bei jeder Frage steht meine Empfehlung.
**Keine Passwörter oder Keys in den Chat**, die gehören nur in die GitHub-Secrets.

## Sofort (blockiert die Merges)

1. **PR für «Konto löschen»**: Fertig auf Branch `claude/brave-hopper-u6e756`, Tests grün. Darf ich dafür einen PR aufmachen? Er hängt hinten am Stapel (Basis #23) und kommt als Letztes dran.
   *Empfehlung: ja.*
2. **Konflikte bei #18 und #21**: Sie kommen erst, wenn die anderen PRs gemergt sind. Merge #18 und #21 bitte **als Letzte**, dann löse ich die Konflikte und du musst nichts anfassen. Ist das ok?

## Fakten, die ich nicht prüfen kann

3. **Domain**: Ist `captionrush.com` schon registriert, und zwar bei Hostpoint? Wenn nicht: Hast du `.ch` oder `.de` auch im Auge?
4. **Supabase-Region**: Was steht unter Project Settings → General → Region? In der Datenschutzerklärung steht **Frankfurt**. Trifft das nicht zu, muss ich den Text ändern.
5. **Groq**: Gibt es schon einen Key, und nutzt du den Gratis- oder den Developer-Tarif? (Das bestimmt, ab wann der 429-Alarm kommt.)
6. **Impressum**: Stimmen «Jonas Treier, Einzelunternehmen web&meh, Hauptstrasse 84A, 5070 Frick» und die **Telefonnummer 076 …**? Eine Telefonnummer ist im Impressum nicht Pflicht, eine E-Mail genügt. Soll sie drinbleiben?
7. **contact@captionrush.com**: Leitest du die Mails auf deine Adresse weiter, oder richtest du ein eigenes Postfach ein?

## Entscheide

8. **Name «CaptionRush» vs. `captionsrush.com`** (Anleitung E3): Hast du dir angeschaut, was dort läuft? Bei einem ähnlichen Angebot ist es billiger, **jetzt** umzubenennen, als nach dem Launch und nach Werbeausgaben.
   *Empfehlung: kurz nachschauen. Bei gleichem Angebot vor dem Go-live die Erstberatung bei einer Markenanwältin oder einem Markenanwalt machen.*
9. **Vercel nach dem Umzug**: (a) sofort abschalten, (b) zwei Wochen parallel laufen lassen und dann abschalten.
   *Empfehlung: b. Kosten fallen keine an, und du hast eine Rückfalloption, falls Hostpoint hakt.*
10. **Newsletter-Versand**: Die bestätigten Adressen landen in Supabase (`leads`). Willst du sie später über **Brevo** versenden (das nutzt du schon für Wald und Tier)? Dann baue ich einen CSV-Export im Brevo-Format oder einen automatischen Sync. Einen Termin dafür gibt es noch nicht.
11. **Preise**: Im Konto-Fenster steht heute «Creator $7.99 / Pro $14.99 — coming soon». Bleibt es bei USD, oder soll ich vorerst CHF/EUR anzeigen? Die echten Preise legst du erst bei Paddle fest. *Empfehlung: so lassen bis Teil D.*

## Persönlich (nur zur Erinnerung, keine Antwort an mich nötig)

12. Nebenbeschäftigung mit dem Arbeitgeber klären (Anleitung E1.4), bevor Einnahmen fliessen.
13. SVA Aargau: Ist web&meh dort schon als selbständige Tätigkeit gemeldet?

---
Um **21:50 Uhr** schaue ich von selbst wieder rein: PR-Status, Konflikte, Deploy-Action.
