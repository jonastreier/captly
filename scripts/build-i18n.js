#!/usr/bin/env node
// Erzeugt die übersetzten Landing-Seiten (z. B. captly.de.html → live unter /de) aus captly.html.
// Keine Dependencies, kein Build-Schritt beim Deploy: Ausgabe wird eingecheckt.
//
//   node scripts/build-i18n.js           → Dateien neu schreiben
//   node scripts/build-i18n.js --check   → nur prüfen (Exit 1, wenn veraltet, ein EN-Text fehlt
//                                          oder auf der Landing noch englischer Text übrig ist)
//
// Übersetzt wird nur <head> und die Landing (#landing). Der Editor bleibt englisch.
//
// JSON-LD im <head> von captly.html: Block 1 = @graph (Organization, WebSite, SoftwareApplication),
// Block 2 = FAQPage. Die FAQ-Strukturdaten werden IMMER aus den sichtbaren FAQ-Einträgen der Landing
// gebaut — auf EN schreibt dieses Skript sie auch in captly.html zurück (--check meldet Abweichungen),
// auf DE aus den übersetzten Einträgen. Den App-Knoten im @graph ersetzt i18n/<lang>.js → app.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'captly.html');
const LANGS = ['de'];
const LAND_START = '<div id="landing">';
const LAND_END = '<!-- EDITOR -->';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function unesc(s) {
  return String(s).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
}
function replaceAll(text, pairs, where, errors) {
  for (const [from, to] of pairs) {
    if (!text.includes(from)) { errors.push(where + ': EN-Text nicht gefunden → ' + JSON.stringify(from.slice(0, 90))); continue; }
    text = text.split(from).join(to);
  }
  return text;
}
const LD_RE = /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/g;
// FAQPage-JSON-LD aus den FAQ-Einträgen (.faq-q / .faq-a) eines Landing-Abschnitts
function faqLd(landing, lang) {
  const faq = [...landing.matchAll(/<button class="faq-q"[^>]*>([\s\S]*?)<span class="faq-plus">[\s\S]*?<div class="faq-a">([\s\S]*?)<\/div>/g)]
    .map(m => ({ '@type': 'Question', name: unesc(m[1]), acceptedAnswer: { '@type': 'Answer', text: unesc(m[2]) } }));
  return { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang, mainEntity: faq };
}
// captly.html mit FAQ-JSON-LD passend zur sichtbaren EN-FAQ (unverändert, wenn schon aktuell)
function syncSource(src) {
  const ld = [...src.slice(0, src.indexOf('<style>')).matchAll(LD_RE)];
  if (ld.length !== 2) throw new Error('captly.html: erwartet 2 JSON-LD-Blöcke im <head>, gefunden ' + ld.length);
  const want = JSON.stringify(faqLd(src.slice(src.indexOf(LAND_START), src.indexOf(LAND_END)), 'en'));
  return ld[1][1] === want ? src : src.replace(ld[1][1], () => want);
}
// Sichtbare Texte + Attribut-Texte eines HTML-Abschnitts (für die „noch englisch?“-Prüfung)
function texts(html) {
  const out = new Set();
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const m of body.matchAll(/>([^<>]+)</g)) { const t = m[1].trim(); if (t) out.add(t); }
  for (const m of body.matchAll(/\s(?:alt|aria-label|title|placeholder)="([^"]+)"/g)) out.add(m[1].trim());
  return out;
}

function build(lang) {
  const cfg = require(path.join(ROOT, 'i18n', lang + '.js'));
  const src = syncSource(fs.readFileSync(SRC, 'utf8'));
  const errors = [];
  const hEnd = src.indexOf('<style>');
  const lStart = src.indexOf(LAND_START), lEnd = src.indexOf(LAND_END);
  if (hEnd < 0 || lStart < 0 || lEnd < lStart) throw new Error('captly.html: <style>, ' + LAND_START + ' oder ' + LAND_END + ' nicht gefunden');

  let head = replaceAll(src.slice(0, hEnd), cfg.head, 'head', errors);
  let landing = replaceAll(src.slice(lStart, lEnd), cfg.landing, 'landing', errors);

  // JSON-LD: App-Beschreibung aus der Konfiguration, FAQ aus den übersetzten FAQ-Einträgen der Seite
  const ld = [...head.matchAll(LD_RE)];
  if (ld.length !== 2) errors.push('head: erwartet 2 JSON-LD-Blöcke, gefunden ' + ld.length);
  else {
    const faq = faqLd(landing, cfg.lang);
    if (!faq.mainEntity.length) errors.push('landing: keine FAQ-Einträge gefunden');
    // Block 1: im @graph nur den SoftwareApplication-Knoten durch cfg.app ersetzen (Organization/WebSite bleiben)
    let app = JSON.parse(ld[0][1]);
    if (Array.isArray(app['@graph'])) {
      const i = app['@graph'].findIndex(n => n['@type'] === 'SoftwareApplication');
      if (i < 0) errors.push('head: kein SoftwareApplication-Knoten im JSON-LD-@graph');
      else { const node = Object.assign({}, cfg.app); delete node['@context']; app['@graph'][i] = node; }
    } else app = cfg.app;
    head = head.replace(ld[0][1], () => JSON.stringify(app)).replace(ld[1][1], () => JSON.stringify(faq));
  }

  // Noch englisch? Jeder Landing-Text, der unverändert aus dem Original stammt und nicht in keep steht
  const keep = new Set(cfg.keep || []);
  const before = texts(src.slice(lStart, lEnd)), after = texts(landing);
  for (const t of after) {
    if (before.has(t) && !keep.has(t) && /[a-z]{2}/i.test(t) && !/^[\s\d$.,:%·\/+-]+$/.test(t)) errors.push('landing: noch nicht übersetzt → ' + JSON.stringify(t));
  }

  const banner = '<!-- GENERIERT von scripts/build-i18n.js aus captly.html + i18n/' + lang + '.js — nicht direkt bearbeiten. -->\n';
  const html = head.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + banner) + src.slice(hEnd, lStart) + landing + src.slice(lEnd);
  return { file: path.join(ROOT, cfg.out), html, errors, src };
}

function run(check) {
  let ok = true;
  const cur = fs.readFileSync(SRC, 'utf8'), synced = syncSource(cur);
  if (synced !== cur) {
    if (check) { ok = false; console.error('✗ [en] captly.html: FAQ-JSON-LD passt nicht zur sichtbaren FAQ → node scripts/build-i18n.js'); }
    else { fs.writeFileSync(SRC, synced); console.log('✓ [en] captly.html: FAQ-JSON-LD aus der sichtbaren FAQ aktualisiert'); }
  } else console.log('✓ [en] captly.html: FAQ-JSON-LD passt zur sichtbaren FAQ');
  for (const lang of LANGS) {
    const r = build(lang);
    r.errors.forEach(e => { console.error('✗ [' + lang + '] ' + e); });
    if (r.errors.length) { ok = false; continue; }
    const cur = fs.existsSync(r.file) ? fs.readFileSync(r.file, 'utf8') : null;
    if (check) {
      if (cur !== r.html) { ok = false; console.error('✗ [' + lang + '] ' + path.basename(r.file) + ' ist veraltet → node scripts/build-i18n.js'); }
      else console.log('✓ [' + lang + '] ' + path.basename(r.file) + ' aktuell');
    } else {
      fs.writeFileSync(r.file, r.html);
      console.log('✓ [' + lang + '] ' + path.basename(r.file) + ' geschrieben');
    }
  }
  return ok;
}

if (require.main === module) process.exit(run(process.argv.includes('--check')) ? 0 : 1);
module.exports = { run, build, faqLd, syncSource };
