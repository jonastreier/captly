#!/usr/bin/env node
// Wöchentliche Style-Rotation (STYLE-DROPS.md): welche Looks aus styles.json werden genutzt, welche dürfen in den Ruhestand?
//   node scripts/style-report.js                  → Tabelle (Live-Zahlen von https://gluephs.com/api/stat, letzte 30 Tage)
//   node scripts/style-report.js --apply          → Kandidaten in styles.json auf "retired": true setzen (nie löschen: IDs bleiben)
//   node scripts/style-report.js --stats file.json --now 2026-11-20   (Offline/Test: Zahlen aus Datei, festes Datum)
// Regel (bewusst vorsichtig): nur Drops, die ≥ MIN_AGE Tage live sind, nur mit genug Daten (≥ MIN_TOTAL Exporte gesamt),
// und nur, wenn ihr Anteil unter MAX_SHARE liegt. Ohne genug Daten → nichts in den Ruhestand, nur Hinweis.
'use strict';
const fs = require('fs'), path = require('path');
const MIN_AGE = 42, MIN_TOTAL = 200, MAX_SHARE = 0.015, DROP_MAX = 16;
const argv = process.argv.slice(2), opt = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const FILE = path.join(__dirname, '..', 'styles.json');

function plan(drops, stats, now) {
  const total = (stats && stats.total) || 0, counts = {};
  ((stats && (stats.all || stats.top)) || []).forEach(r => { counts[r.style] = r.n; });
  const enough = total >= MIN_TOTAL;
  const rows = drops.map(o => {
    const age = Math.floor((now - Date.parse(o.added)) / 864e5), n = counts[o.id] || 0, share = total ? n / total : 0;
    let rec = o.retired ? 'retired' : 'keep';
    if (!o.retired && enough && age >= MIN_AGE && share < MAX_SHARE) rec = 'retire';
    return { id: o.id, name: o.name, added: o.added, age, n, share, rec };
  });
  const live = rows.filter(r => r.rec !== 'retired' && r.rec !== 'retire').length;
  return { total, enough, rows, live, over: Math.max(0, live - DROP_MAX) };
}

async function main() {
  const now = opt('--now') ? Date.parse(opt('--now')) : Date.now();
  const drops = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  let stats = null;
  if (opt('--stats')) stats = JSON.parse(fs.readFileSync(opt('--stats'), 'utf8'));
  else {
    const url = opt('--url') || 'https://gluephs.com/api/stat';
    try { const r = await fetch(url); stats = r.ok ? await r.json() : null; } catch (e) { stats = null; }
    if (!stats) console.log('Hinweis: keine Zahlen von ' + url + ' — nur Alter wird gezeigt, nichts geht in den Ruhestand.');
  }
  const p = plan(drops, stats, now);
  console.log('Exporte (30 Tage): ' + p.total + (p.enough ? '' : '  — zu wenig Daten für Ruhestand (< ' + MIN_TOTAL + ')'));
  console.log(['id'.padEnd(14), 'added'.padEnd(11), 'Tage'.padStart(4), 'Exp.'.padStart(6), 'Anteil'.padStart(7), '  Empfehlung'].join(' '));
  p.rows.forEach(r => console.log([r.id.padEnd(14), r.added.padEnd(11), String(r.age).padStart(4), String(r.n).padStart(6),
    (r.share * 100).toFixed(1).padStart(6) + '%', '  ' + r.rec].join(' ')));
  console.log('Sichtbar nach Rotation: ' + p.live + ' von max. ' + DROP_MAX + (p.over ? ' — ' + p.over + ' zu viel: die ältesten fallen automatisch aus der Auswahl' : ''));
  const cand = p.rows.filter(r => r.rec === 'retire');
  if (argv.includes('--apply') && cand.length) {
    drops.forEach(o => { if (cand.some(c => c.id === o.id)) o.retired = true; });
    fs.writeFileSync(FILE, JSON.stringify(drops, null, 1) + '\n');
    console.log('In den Ruhestand: ' + cand.map(c => c.id).join(', '));
  } else if (cand.length) console.log('Kandidaten (mit --apply setzen): ' + cand.map(c => c.id).join(', '));
}
if (require.main === module) main();
module.exports = { plan, MIN_AGE, MIN_TOTAL, MAX_SHARE };
