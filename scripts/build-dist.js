// Baut das Upload-Paket für Hostpoint nach ./dist (nur, was der Server wirklich braucht — keine Tests,
// Doku, Vercel-Dateien oder Entwicklungsskripte). Wird von der GitHub-Action und manuell genutzt:
//   node scripts/build-dist.js            → ./dist
//   node scripts/build-dist.js --zip      → zusätzlich captionrush-dist.zip (für manuellen Upload)
// config.php wird NICHT hier erzeugt, sondern in der Action aus den GitHub-Secrets (scripts/write-config.js).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'dist');

const FILES = ['.htaccess', '404.html', 'captly.html', 'captly.de.html', 'impressum.html', 'datenschutz.html', 'privacy.html', 'terms.html', 'licenses.html',
  'llms.txt', 'robots.txt', 'sitemap.xml', 'styles.json', 'transcribe.php', 'polish.php', 'enhance.php', 'lead.php', 'confirm.php', 'unsubscribe.php', 'mail.php'];
const DIRS = ['assets', 'vendor'];

function copy(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    fs.readdirSync(src).forEach(f => copy(path.join(src, f), path.join(dst, f)));
  } else if (/\.(ts|mts|map)$/.test(src)) {
    // Typdeklarationen/Source-Maps braucht der Browser nicht
  } else { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); }
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const missing = [];
FILES.forEach(f => { const s = path.join(root, f); if (fs.existsSync(s)) copy(s, path.join(out, f)); else missing.push(f); });
DIRS.forEach(d => copy(path.join(root, d), path.join(out, d)));
// Showcase-Videos/-Bilder sind Teil von assets/; Quelldateien für Bildgenerierung o. Ä. gehören nicht dazu
console.log('dist/ gebaut' + (missing.length ? ' — fehlt (noch nicht vorhanden): ' + missing.join(', ') : ''));

if (process.argv.includes('--zip')) {
  const { execFileSync } = require('child_process');
  const zip = path.join(root, 'captionrush-dist.zip');
  fs.rmSync(zip, { force: true });
  execFileSync('zip', ['-qr', zip, '.'], { cwd: out });
  console.log('→ ' + zip);
}
