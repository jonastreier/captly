// Lädt alle in CaptionRush verwendeten Google-Schriften (SIL OFL / Apache 2.0) einmalig herunter und legt sie als
// woff2 unter vendor/fonts/ ab, dazu vendor/fonts/fonts.css mit den @font-face-Regeln (lokal gehostet).
// Warum: Beim Laden von fonts.googleapis.com geht die IP jedes Besuchers an Google (LG München I, 3 O 17493/20).
//
//   node scripts/fetch-fonts.js          → lädt/aktualisiert vendor/fonts
//
// Quelle der Liste: CAP_FONT_GROUPS in captly.html + EXTRA unten (Schnitte, die Styles zusätzlich brauchen,
// z. B. kursiv). Der Test (test-captly.js) prüft, dass jede Schrift der Auswahlliste/jedes Styles hier vorhanden ist.
// Neue Schrift? → in CAP_FONT_GROUPS bzw. EXTRA eintragen und dieses Skript erneut ausführen.
const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'vendor', 'fonts');
const SUBSETS = ['latin', 'latin-ext', 'cyrillic']; // Rest (Vietnamesisch, Griechisch …) fällt auf die Systemschrift zurück
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Familie → { w: Gewichte normal, i: Gewichte kursiv }
const EXTRA = {
  'Inter': { w: '400;500;600;700;800;900', i: '700;800' },
  'Inter Tight': { w: '500;600;700;800;900', i: '' },
  'Instrument Serif': { w: '400', i: '400' },
  'Playfair Display': { w: '700;800;900', i: '700;800' },
  'Poppins': { w: '600;700;800;900', i: '600;700' },
  'Raleway': { w: '300;700;800;900', i: '' },
};

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return resolve(get(res.headers.location));
      const bufs = []; res.on('data', d => bufs.push(d));
      res.on('end', () => res.statusCode === 200 ? resolve(Buffer.concat(bufs)) : reject(new Error(res.statusCode + ' ' + url)));
    }).on('error', reject);
  });
}

function families() {
  const html = fs.readFileSync(path.join(root, 'captly.html'), 'utf8');
  const m = html.match(/var CAP_FONT_GROUPS = \[([\s\S]*?)\n\];/);
  if (!m) throw new Error('CAP_FONT_GROUPS nicht gefunden');
  const map = {};
  (m[1].match(/'[^']+\|[^']*'/g) || []).forEach(s => {
    const [name, w] = s.slice(1, -1).split('|');
    map[name] = { w: w || '', i: '' };
  });
  Object.keys(EXTRA).forEach(n => { map[n] = EXTRA[n]; });
  return map;
}

function cssUrl(name, spec) {
  const fam = name.replace(/ /g, '+');
  const ws = spec.w ? spec.w.split(';') : [], is = spec.i ? spec.i.split(';') : [];
  if (!ws.length && !is.length) return `https://fonts.googleapis.com/css2?family=${fam}&display=swap`;
  if (!is.length) return `https://fonts.googleapis.com/css2?family=${fam}:wght@${ws.join(';')}&display=swap`;
  const pairs = ws.map(w => '0,' + w).concat(is.map(w => '1,' + w));
  return `https://fonts.googleapis.com/css2?family=${fam}:ital,wght@${pairs.join(';')}&display=swap`;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const fams = families();
  const files = {}; // Google-URL → lokaler Dateiname (variable Schriften teilen sich eine Datei)
  let css = '/* Lokal gehostete Schriften (SIL OFL 1.1 / Apache 2.0, Quelle: Google Fonts). Erzeugt von scripts/fetch-fonts.js — nicht von Hand bearbeiten. */\n';
  let n = 0;
  for (const name of Object.keys(fams).sort()) {
    let text;
    try { text = (await get(cssUrl(name, fams[name]))).toString('utf8'); }
    catch (e) {
      try { text = (await get(cssUrl(name, { w: '', i: '' }))).toString('utf8'); console.warn('! ' + name + ': Gewichte nicht verfügbar → Standard'); }
      catch (e2) { console.warn('! ' + name + ': übersprungen (' + e2.message + ')'); continue; }
    }
    const blocks = text.split(/(?=\/\* [a-z-]+ \*\/)/).filter(b => /^\/\* [a-z-]+ \*\//.test(b));
    for (const b of blocks) {
      const subset = b.match(/^\/\* ([a-z-]+) \*\//)[1];
      if (SUBSETS.indexOf(subset) < 0) continue;
      const url = b.match(/url\((https:[^)]+\.woff2)\)/)[1];
      if (!files[url]) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const style = /font-style:\s*italic/.test(b) ? 'i' : 'n';
        files[url] = `${slug}-${subset}-${style}-${require('crypto').createHash('sha1').update(url).digest('hex').slice(0, 6)}.woff2`;
        fs.writeFileSync(path.join(outDir, files[url]), await get(url));
        n++;
      }
      css += b.replace(/\/\* [a-z-]+ \*\/\n?/, '').replace(url, files[url]).replace(/src:\s*url\(/, 'src: url(').replace(/\n\s*/g, ' ').trim() + '\n';
    }
    process.stdout.write('.');
  }
  fs.writeFileSync(path.join(outDir, 'fonts.css'), css);
  const total = fs.readdirSync(outDir).filter(f => f.endsWith('.woff2')).reduce((a, f) => a + fs.statSync(path.join(outDir, f)).size, 0);
  console.log(`\n${Object.keys(fams).length} Familien, ${n} neue Dateien, ${(total / 1048576).toFixed(1)} MB in vendor/fonts/`);
})().catch(e => { console.error(e); process.exit(1); });
