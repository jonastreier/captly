#!/usr/bin/env bash
# Baut vendor/supabase/supabase.js (supabase-js als ein ES-Modul, minifiziert) aus dem npm-Paket — damit der Browser
# beim Seitenaufruf nichts von einem fremden CDN (esm.sh) laden muss. Version fest gepinnt; zum Update VERSION ändern.
set -euo pipefail
VERSION=2.117.3
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
cd "$TMP"
npm init -y >/dev/null
npm i "@supabase/supabase-js@$VERSION" esbuild --silent
echo "export { createClient } from '@supabase/supabase-js';" > entry.js
npx esbuild entry.js --bundle --format=esm --platform=browser --minify --target=es2020 --outfile=supabase.js
mkdir -p "$ROOT/vendor/supabase"
cp supabase.js "$ROOT/vendor/supabase/supabase.js"
cp node_modules/@supabase/supabase-js/LICENSE "$ROOT/vendor/supabase/LICENSE"
echo "supabase-js $VERSION → vendor/supabase/supabase.js"
