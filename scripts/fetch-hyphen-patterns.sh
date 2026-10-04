#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# fetch-hyphen-patterns.sh — Source of truth für die self-gehosteten Silbentrennmuster
# (captly.html: capHyphenate / capHyphEnsure, Liang/TeX-Algorithmus).
#
#   hyph-utf8 (tex-hyphen, Commit unten gepinnt) → vendor/hyphen/hyph-<code>.js
#     de ← hyph-de-1996   (reformierte Rechtschreibung; Schweizer „ss“ passt)   MIT
#     en ← hyph-en-us     (+ Ausnahmen aus hyph-en-us.hyp.txt)                   permissiv (Kuiken)
#     fr ← hyph-fr                                                                MIT
#     it ← hyph-it                                                                MIT/LPPL
#     es ← hyph-es                                                                MIT
#
# Jede Datei registriert sich beim Laden als window.CAPIVO_HYPH[code] = { p: "<Muster>", x: "<Ausnahmen>" }
# und ruft window.capHyphLoaded(code) — captly.html lädt nur die Sprache des Transkripts (lazy).
# Lizenz-/Copyright-Köpfe der Originaldateien landen in vendor/hyphen/LICENSE (Pflicht laut Lizenzen).
#
# Refresh-Pfad: COMMIT ändern → Skript laufen lassen → Diff unter vendor/hyphen/ committen und
# HYPH_VERSION in captly.html hochzählen (Cache: /vendor/* ist „immutable“).
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

cd "$(dirname "$0")/.."

COMMIT="5684c0f51c0b81133db2efbe60a408b4155a3ff5"
BASE="https://raw.githubusercontent.com/hyphenation/tex-hyphen/${COMMIT}/hyph-utf8/tex/generic/hyph-utf8/patterns"
OUT="$(pwd)/vendor/hyphen"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUT"
LIC="$OUT/LICENSE"
{
  echo "Hyphenation patterns from the hyph-utf8 project (https://github.com/hyphenation/tex-hyphen,"
  echo "commit ${COMMIT}), converted to JS by scripts/fetch-hyphen-patterns.sh."
  echo "The original copyright and licence notices of each file follow."
} > "$LIC"

for pair in de:de-1996 en:en-us fr:fr it:it es:es; do
  code="${pair%%:*}"; src="${pair#*:}"
  curl -fsSL "$BASE/txt/hyph-${src}.pat.txt" -o "$TMP/${src}.pat"
  curl -fsSL "$BASE/txt/hyph-${src}.hyp.txt" -o "$TMP/${src}.hyp" 2>/dev/null || : > "$TMP/${src}.hyp"
  curl -fsSL "$BASE/tex/hyph-${src}.tex" -o "$TMP/${src}.tex"
  { echo; echo "──── ${code}: hyph-${src} ────"; sed -n '1,/^% hyphenmins/p' "$TMP/${src}.tex" | sed '$d'; } >> "$LIC"
  node -e '
    const fs = require("fs");
    const [pat, hyp, code, src, commit, out] = process.argv.slice(1);
    const words = f => fs.readFileSync(f, "utf8").split(/\s+/).filter(Boolean).join(" ");
    const body = "/* CaptionRush — Silbentrennmuster \"" + code + "\" (hyph-utf8 hyph-" + src + ", tex-hyphen@" + commit.slice(0, 7)
      + "). Lizenz: vendor/hyphen/LICENSE. Generiert von scripts/fetch-hyphen-patterns.sh — nicht von Hand ändern. */\n"
      + "(function(w){(w.CAPIVO_HYPH=w.CAPIVO_HYPH||{})[" + JSON.stringify(code) + "]={p:" + JSON.stringify(words(pat))
      + ",x:" + JSON.stringify(words(hyp)) + "};if(typeof w.capHyphLoaded===\"function\")w.capHyphLoaded(" + JSON.stringify(code) + ");})"
      + "(typeof window!==\"undefined\"?window:globalThis);\n";
    fs.writeFileSync(out, body);
  ' "$TMP/${src}.pat" "$TMP/${src}.hyp" "$code" "$src" "$COMMIT" "$OUT/hyph-${code}.js"
  echo "hyph-${code}.js  $(wc -c < "$OUT/hyph-${code}.js") bytes  (gzip $(gzip -c "$OUT/hyph-${code}.js" | wc -c))"
done
