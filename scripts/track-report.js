// Wertet die Trichter-Zähler aus: ssh hostpoint 'for f in ~/gluephs-data/track-*.json; do cat $f; echo; done' | node scripts/track-report.js [Tage=14]
// Zeigt je Tag den Trichter, je Quelle die Exporte und die wichtigsten Quoten. Nur Zähler, keine Personendaten.
const days = Math.max(1, parseInt(process.argv[2], 10) || 14);
let raw = ''; process.stdin.on('data', d => raw += d).on('end', () => {
  const all = {};
  for (const line of raw.split('\n')) { if (!line.trim()) continue; try { Object.assign(all, JSON.parse(line)); } catch (e) { /* kaputte Zeile überspringen */ } }
  const EV = ['visit', 'upload', 'transcribed', 'export_click', 'gate_pass', 'export_done', 'pro_interest', 'limit_user', 'limit_site'];
  const byDay = {}, bySrc = {};
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  for (const [k, n] of Object.entries(all)) {
    const [day, ev, src, lang] = k.split('|'); if (day < since) continue;
    (byDay[day] = byDay[day] || {})[ev] = (byDay[day][ev] || 0) + n;
    const s = bySrc[src] = bySrc[src] || {}; s[ev] = (s[ev] || 0) + n;
  }
  const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '–';
  const row = (label, o) => label.padEnd(18) + EV.map(e => String(o[e] || 0).padStart(e.length + 2)).join('') + '   Upload/Besuch ' + pct(o.upload, o.visit) + ' · Export/Upload ' + pct(o.export_done, o.upload) + ' · E-Mail/Klick ' + pct(o.gate_pass, o.export_click);
  console.log('Tag'.padEnd(18) + EV.map(e => e.padStart(e.length + 2)).join(''));
  for (const d of Object.keys(byDay).sort()) console.log(row(d, byDay[d]));
  console.log('\nNach Quelle (Letzte ' + days + ' Tage):');
  for (const s of Object.keys(bySrc).sort((a, b) => (bySrc[b].export_done || 0) - (bySrc[a].export_done || 0) || (bySrc[b].visit || 0) - (bySrc[a].visit || 0))) console.log(row(s.slice(0, 17), bySrc[s]));
  if (!Object.keys(byDay).length) console.log('(noch keine Daten)');
});
