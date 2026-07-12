#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# fetch-ffmpeg.sh — Source of truth für die self-gehosteten ffmpeg.wasm-Assets.
#
# Captly transkodiert WebM→MP4 im Browser (Firefox / ältere Safari) via ffmpeg.wasm.
# Damit das nicht von unpkg/esm.sh abhängt, holt dieses Skript die exakten,
# version-gepinnten ESM-Builds von @ffmpeg/ffmpeg und @ffmpeg/core via `npm pack`
# und legt sie unter vendor/ffmpeg/{ffmpeg,core}/ ab. server.js liefert sie dann
# same-origin unter /vendor/ffmpeg/... aus (siehe captly.html: getFFmpeg()).
#
# Refresh-Pfad: Versionen unten ändern → dieses Skript erneut laufen lassen →
# den Diff unter vendor/ffmpeg/ committen.
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

cd "$(dirname "$0")/.."

FFMPEG_VERSION="0.12.10"
CORE_VERSION="0.12.6"

VENDOR_DIR="$(pwd)/vendor/ffmpeg"
FFMPEG_OUT="$VENDOR_DIR/ffmpeg"
CORE_OUT="$VENDOR_DIR/core"

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

echo "→ Lade @ffmpeg/ffmpeg@${FFMPEG_VERSION} und @ffmpeg/core@${CORE_VERSION} via npm pack..."
(
  cd "$TMPDIR"
  npm pack "@ffmpeg/ffmpeg@${FFMPEG_VERSION}" --silent
  npm pack "@ffmpeg/core@${CORE_VERSION}" --silent
)

echo "→ Entpacke Tarballs..."
mkdir -p "$TMPDIR/ffmpeg-extract" "$TMPDIR/core-extract"
tar xzf "$TMPDIR"/ffmpeg-ffmpeg-*.tgz -C "$TMPDIR/ffmpeg-extract"
tar xzf "$TMPDIR"/ffmpeg-core-*.tgz -C "$TMPDIR/core-extract"

echo "→ Räume Zielverzeichnisse..."
rm -rf "$FFMPEG_OUT" "$CORE_OUT"
mkdir -p "$FFMPEG_OUT" "$CORE_OUT"

echo "→ Kopiere dist/esm der @ffmpeg/ffmpeg nach $FFMPEG_OUT ..."
cp -R "$TMPDIR/ffmpeg-extract/package/dist/esm/." "$FFMPEG_OUT/"

echo "→ Kopiere dist/esm der @ffmpeg/core nach $CORE_OUT ..."
cp -R "$TMPDIR/core-extract/package/dist/esm/." "$CORE_OUT/"

echo ""
echo "✅ Fertig. Kopierte Dateien:"
echo "── $FFMPEG_OUT"
ls -la "$FFMPEG_OUT"
echo "── $CORE_OUT"
ls -la "$CORE_OUT"
