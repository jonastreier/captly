#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# fetch-webcodecs-libs.sh — Source of truth für die self-gehosteten Libs des
# WebCodecs-Schnellexports (captly.html: exportFastWebCodecs / getWebCodecsLibs).
#
#   mp4box     2.4.1  (BSD-3-Clause, gpac/mp4box.js)   → vendor/mp4box/
#              Demuxt MP4/MOV (Samples + avcC/hvcC/esds) für VideoDecoder.
#   mp4-muxer  5.2.2  (MIT, Vanilagy/mp4-muxer)         → vendor/mp4-muxer/
#              Schreibt die kodierten H.264-Chunks + kopierten AAC-Pakete als MP4.
#              (Upstream ist zugunsten von "Mediabunny" deprecated — 5.2.2 ist aber
#              stabil, dependency-frei und deutlich kleiner; für unseren Zweck reicht es.)
#
# Beide als browserfertige ESM-Builds direkt aus dem npm-Tarball (kein Bundling nötig).
# Lizenzdateien werden mitkopiert (Pflicht laut BSD/MIT).
#
# Refresh-Pfad: Versionen unten ändern → dieses Skript erneut laufen lassen →
# Diff unter vendor/mp4box/ + vendor/mp4-muxer/ committen. Bei mp4box ändern sich
# die gehashten Chunk-Dateinamen (styp-*.mjs) mit jeder Version — das Skript kopiert
# daher alle *.mjs ohne Sourcemaps; der Einstieg bleibt mp4box.all.mjs.
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

cd "$(dirname "$0")/.."

MP4BOX_VERSION="2.4.1"
MUXER_VERSION="5.2.2"

MP4BOX_OUT="$(pwd)/vendor/mp4box"
MUXER_OUT="$(pwd)/vendor/mp4-muxer"

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

echo "→ Lade mp4box@${MP4BOX_VERSION} und mp4-muxer@${MUXER_VERSION} via npm pack..."
(
  cd "$TMPDIR"
  npm pack "mp4box@${MP4BOX_VERSION}" --silent
  npm pack "mp4-muxer@${MUXER_VERSION}" --silent
)

echo "→ Entpacke Tarballs..."
mkdir -p "$TMPDIR/mp4box-extract" "$TMPDIR/muxer-extract"
tar xzf "$TMPDIR/mp4box-${MP4BOX_VERSION}.tgz" -C "$TMPDIR/mp4box-extract"
tar xzf "$TMPDIR/mp4-muxer-${MUXER_VERSION}.tgz" -C "$TMPDIR/muxer-extract"

echo "→ Räume Zielverzeichnisse..."
rm -rf "$MP4BOX_OUT" "$MUXER_OUT"
mkdir -p "$MP4BOX_OUT" "$MUXER_OUT"

echo "→ Kopiere mp4box ESM (dist/*.mjs, ohne Maps/Typen) nach $MP4BOX_OUT ..."
cp "$TMPDIR"/mp4box-extract/package/dist/*.mjs "$MP4BOX_OUT/"
cp "$TMPDIR/mp4box-extract/package/LICENSE" "$MP4BOX_OUT/LICENSE"

echo "→ Kopiere mp4-muxer ESM (build/mp4-muxer.mjs) nach $MUXER_OUT ..."
cp "$TMPDIR/muxer-extract/package/build/mp4-muxer.mjs" "$MUXER_OUT/"
cp "$TMPDIR/muxer-extract/package/LICENSE" "$MUXER_OUT/LICENSE"

echo ""
echo "✅ Fertig. Kopierte Dateien:"
echo "── $MP4BOX_OUT"
ls -la "$MP4BOX_OUT"
echo "── $MUXER_OUT"
ls -la "$MUXER_OUT"
