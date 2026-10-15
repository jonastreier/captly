// Mock-Server für den Creator-Test: liefert ein Repo-Verzeichnis statisch aus und beantwortet /api/transcribe
// mit den echten Wort-Timings des gerade gewählten Testvideos. Vor jedem Upload: GET /mock/use?v=<name>.
// Aufruf: node scripts/creator-test/creator-mock.js <repo-root> <port> <ordner-mit-testvideos (von gen.py)>
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || '.'), port = +process.argv[3] || 8800, media = path.resolve(process.argv[4] || '/tmp/gluephs-creator');
let cur = 'v1-reel-de';
// Batch/Queue: mehrere Videos nacheinander → pro Anfrage das Video über den Header X-Video-Key erkennen
// (derselbe Hash wie videoKeyHash() im Editor: Name|Grösse|Dauer×10). Unbekannter Schlüssel → zuletzt per /mock/use gewähltes Video.
function videoKeyHash(s) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return ('00000000' + (h2 >>> 0).toString(16)).slice(-8) + ('00000000' + (h1 >>> 0).toString(16)).slice(-8);
}
const KEYS = {};
try {
  for (const f of fs.readdirSync(media)) {
    if (!f.endsWith('.json')) continue;
    const v = f.slice(0, -5), mp4 = path.join(media, v + '.mp4');
    if (!fs.existsSync(mp4)) continue;
    const dur = JSON.parse(fs.readFileSync(path.join(media, f), 'utf8')).duration, size = fs.statSync(mp4).size;
    for (let d = -1; d <= 1; d++) KEYS[videoKeyHash(v + '.mp4|' + size + '|' + (Math.round(dur * 10) + d))] = v;
  }
} catch (e) {}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.mp4': 'video/mp4', '.txt': 'text/plain' };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x'), u = decodeURIComponent(url.pathname);
  if (u === '/mock/use') { const v = url.searchParams.get('v'); if (fs.existsSync(path.join(media, v + '.json'))) cur = v; res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('using ' + cur); }
  if (u.startsWith('/api/transcribe') || u === '/transcribe.php') {
    if (req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"ok":true,"configured":true}'); }
    const keyed = KEYS[req.headers['x-video-key']];
    req.on('data', () => {}); req.on('end', () => setTimeout(() => {
      const j = JSON.parse(fs.readFileSync(path.join(media, (keyed || cur) + '.json'), 'utf8'));
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ words: j.words, language: j.language, text: j.text }));
    }, 900)); return;
  }
  if (u.startsWith('/api/') || u.endsWith('.php')) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{}'); }
  const f = u === '/' ? '/captly.html' : (u === '/de' || u === '/de/') ? '/captly.de.html' : u;
  const p = f.startsWith('/test/') ? path.join(media, f.slice(6)) : path.join(root, f);
  if (!p.startsWith(root) && !p.startsWith(media)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d);
  });
}).listen(port, () => console.log('creator-mock on', port, root));
