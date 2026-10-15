#!/usr/bin/env bash
# Trägt die geheimen GitHub-Secrets für den Deploy ein — geführt, ein Durchgang.
# Öffnet zu jedem fehlenden Wert die passende Seite im Browser; Eingabe bleibt unsichtbar
# und geht direkt an GitHub (nichts landet in Dateien oder im Verlauf).
# Aufruf: bash scripts/set-secrets.sh
set -u
REPO=jonastreier/captly

if ! gh auth status 2>&1 | grep -q "'workflow'"; then
  echo "→ Zuerst GitHub-Berechtigung «workflow» (einmalig): Code im Browser bestätigen."
  gh auth refresh -h github.com -s workflow || exit 1
fi

have=$(gh secret list -R "$REPO" | cut -f1)

ask() { # NAME  "Beschreibung"  URL
  local name=$1 desc=$2 url=$3 val
  if grep -qx "$name" <<<"$have"; then echo "✓ $name schon gesetzt"; return; fi
  echo; echo "── $name: $desc"
  [ -n "$url" ] && { echo "   Öffne $url"; open "$url" 2>/dev/null; }
  read -r -s -p "   Wert einfügen (unsichtbar), Enter = später: " val; echo
  [ -z "$val" ] && { echo "   übersprungen"; return; }
  printf %s "$val" | gh secret set "$name" -R "$REPO" && echo "   ✓ gespeichert"
}

ask GROQ_API_KEY         "Groq → «Create API Key», Key kopieren (beginnt mit gsk_)" "https://console.groq.com/keys"
ask SUPABASE_SERVICE_KEY "Supabase → «service_role» (secret) → Reveal → kopieren (NICHT anon/publishable)" "https://supabase.com/dashboard/project/tghodbtdraqkfwcmedcv/settings/api-keys"
ask FTP_PASSWORD         "Hostpoint → Hosting → FTP-Benutzer «fuhiduka» → Passwort (ggf. neu setzen)" "https://admin.hostpoint.ch"
ask SMTP_PASS            "Hostpoint → E-Mail → Postfach noreply@gluephs.com (anlegen falls fehlt) → Passwort" "https://admin.hostpoint.ch"

echo; echo "Fertig. Stand:"; gh secret list -R "$REPO" | cut -f1 | tr '\n' ' '; echo
