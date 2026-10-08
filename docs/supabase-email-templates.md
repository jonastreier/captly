# Supabase: E-Mail-Vorlagen (Authentication → Emails → Templates)

Beide Vorlagen schicken einen **6-stelligen Code** (`{{ .Token }}`), den die Nutzerin im Login-Fenster eingibt — keinen Link.
Betreff und Text je einfügen. Der HTML-Teil ist bewusst schlicht, damit er überall gleich aussieht.

## Magic Link  (bestehendes Konto)
**Betreff:** `Dein CaptionRush-Code: {{ .Token }}`

```html
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#16181d">
  <p style="font-size:15px;margin:0 0 12px">Dein Code für CaptionRush / Your CaptionRush code:</p>
  <p style="font-size:34px;letter-spacing:6px;font-weight:700;margin:8px 0 16px">{{ .Token }}</p>
  <p style="font-size:13px;color:#5d6470;margin:0 0 6px">Gib ihn im Anmelde-Fenster ein. Er ist 1 Stunde gültig. / Enter it in the sign-in window. Valid for 1 hour.</p>
  <p style="font-size:13px;color:#5d6470;margin:0">Nicht angefordert? Dann ignoriere diese Mail. / Didn't ask for it? Just ignore this email.</p>
</div>
```

## Confirm signup  (neues Konto)
**Betreff:** `Dein CaptionRush-Code: {{ .Token }}`

```html
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#16181d">
  <p style="font-size:15px;margin:0 0 12px">Willkommen bei CaptionRush! Dein Code / Welcome to CaptionRush! Your code:</p>
  <p style="font-size:34px;letter-spacing:6px;font-weight:700;margin:8px 0 16px">{{ .Token }}</p>
  <p style="font-size:13px;color:#5d6470;margin:0 0 6px">Gib ihn im Anmelde-Fenster ein. / Enter it in the sign-in window.</p>
  <p style="font-size:13px;color:#5d6470;margin:0">Nicht angefordert? Dann ignoriere diese Mail. / Didn't ask for it? Just ignore this email.</p>
</div>
```

Hinweis: Die Code-Länge (6 Stellen) und die Gültigkeit stellt man unter Authentication → Providers → Email ein.
