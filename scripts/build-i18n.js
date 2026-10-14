#!/usr/bin/env node
// Erzeugt die übersetzten Landing-Seiten (z. B. captly.de.html → live unter /de) aus captly.html.
// Keine Dependencies, kein Build-Schritt beim Deploy: Ausgabe wird eingecheckt.
//
//   node scripts/build-i18n.js           → Dateien neu schreiben
//   node scripts/build-i18n.js --check   → nur prüfen (Exit 1, wenn veraltet, ein EN-Text fehlt
//                                          oder auf der Landing noch englischer Text übrig ist)
//
// Übersetzt wird <head>, die Landing (#landing) UND der Editor (statisches HTML + per JS erzeugte Texte):
//  - Landing/Head: Paare cfg.head / cfg.landing (Text-Ersetzung wie bisher).
//  - Editor-HTML (von <!-- EDITOR --> bis zum <script>): Textknoten und Attribute (title, aria-label, placeholder, alt)
//    werden per genauem Treffer im Wörterbuch cfg.ui {EN: DE} übersetzt; für Mischinhalt mit Tags gibt es zusätzlich
//    Paare cfg.editor (vor dem Wörterbuch angewandt). Fehlt ein EN-Text im Wörterbuch → Fehler, ausser er steht in cfg.keepUi.
//  - JS-Texte: im Script steht _t('English text', arg0, arg1 …) (Platzhalter {0}, {1}). Auf EN gibt _t den Text unverändert
//    zurück; für DE ersetzt der Generator `var UI_DICT = null;` durch das Wörterbuch (nur Schlüssel, die im Script als
//    _t('…')-Literal vorkommen). Unübersetzte _t-Schlüssel → Fehler. Direkt in Ausgabestellen (capToast, .textContent …)
//    geschriebene, nicht mit _t umhüllte englische Literale meldet jsScan() ebenfalls (cfg.keepJs = bewusste Ausnahmen).
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
const SCRIPT_START = '<script>\n';
const DICT_MARK = 'var UI_DICT = null;';

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
// FAQPage-JSON-LD aus den FAQ-Einträgen (.faq-q / .faq-a) eines Landing-Abschnitts.
// Absätze mit class="bill-only" (Aussagen, die nur bei aktivem Billing gelten) bleiben draussen: statische Daten = Beta-Aussage.
function faqLd(landing, lang) {
  const faq = [...landing.matchAll(/<button class="faq-q"[^>]*>([\s\S]*?)<span class="faq-plus">[\s\S]*?<div class="faq-a">([\s\S]*?)<\/div>/g)]
    .map(m => ({ '@type': 'Question', name: unesc(m[1]), acceptedAnswer: { '@type': 'Answer', text: unesc(m[2].replace(/<p class="bill-only"[^>]*>[\s\S]*?<\/p>/g, '')) } }));
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

// ── Editor: statische Texte ─────────────────────────────────────────────────────────────────────────
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&times;': '×', '&rarr;': '→', '&hellip;': '…', '&middot;': '·', '&nbsp;': ' ', '&mdash;': '—', '&ndash;': '–' };
function decode(s) { return String(s).replace(/&(?:amp|lt|gt|quot|#39|times|rarr|hellip|middot|nbsp|mdash|ndash);/g, m => ENT[m]); }
function encode(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
const ED_ATTR_RE = /(\s(?:alt|aria-label|title|placeholder)=")([^"]+)(")/g;
const ED_TEXT_RE = />([^<>]+)</g;
function hasWords(t) { return /[a-z]{2}/i.test(t) && !/^[\s\d$.,:%·\/+×–—→-]+$/.test(t); }
// Sucht die Übersetzung zu einem Rohtext aus dem HTML (mit Entities) im Wörterbuch; {to, found}
function lookupUi(raw, ui) {
  if (Object.prototype.hasOwnProperty.call(ui, raw)) return { to: ui[raw].replace(/&(?!(?:amp|lt|gt|quot|#\d+|[a-z]+);)/g, '&amp;'), found: true };
  const d = decode(raw);
  if (Object.prototype.hasOwnProperty.call(ui, d)) return { to: encode(ui[d]), found: true };
  return { found: false };
}
// Alle Textknoten + Attributtexte eines HTML-Abschnitts (getrimmt, nur mit Buchstaben), ohne <script>/<style>/Kommentare
function editorTexts(html) {
  const out = new Set();
  html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->)/).forEach((p, i) => {
    if (i % 2) return;
    for (const m of p.matchAll(ED_ATTR_RE)) { const t = m[2].trim(); if (hasWords(t)) out.add(t); }
    for (const m of p.matchAll(ED_TEXT_RE)) { const t = m[1].trim(); if (hasWords(t)) out.add(t); }
  });
  return out;
}
// Übersetzt den Editor-Abschnitt. Zählt eindeutige Texte: gesamt / übersetzt (Wörterbuch oder Paar) / bewusst gleich (keepUi) / fehlend
function translateEditor(html, cfg, errors) {
  const ui = cfg.ui || {}, keep = new Set(cfg.keepUi || []);
  const orig = editorTexts(html);
  html = replaceAll(html, cfg.editor || [], 'editor', errors);
  const afterPairs = editorTexts(html);
  const tr = (raw) => { const t = raw.trim(); if (!t || !hasWords(t)) return null; const r = lookupUi(t, ui); return r.found ? r.to : null; };
  const parts = html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->)/);
  html = parts.map((p, i) => {
    if (i % 2) return p;
    p = p.replace(ED_ATTR_RE, (m, a, v, c) => { const to = tr(v); return to == null ? m : a + to.replace(/"/g, '&quot;') + c; });
    return p.replace(ED_TEXT_RE, (m, t) => { const to = tr(t); return to == null ? m : '>' + t.match(/^\s*/)[0] + to + t.match(/\s*$/)[0] + '<'; });
  }).join('');
  const stat = { total: orig.size, translated: 0, kept: 0, missing: [] };
  for (const t of orig) {
    if (lookupUi(t, ui).found) stat.translated++;
    else if (keep.has(t) || keep.has(decode(t))) stat.kept++;
    else if (!afterPairs.has(t)) stat.translated++; // durch ein Paar (cfg.editor) ersetzt
    else stat.missing.push(t);
  }
  stat.missing.forEach(t => errors.push('editor: noch nicht übersetzt → ' + JSON.stringify(t.slice(0, 90))));
  return { html, stat };
}

// ── Editor: Texte, die per JS erzeugt werden ────────────────────────────────────────────────────────
const LIT = "'(?:[^'\\\\\\n]|\\\\.)*'|\"(?:[^\"\\\\\\n]|\\\\.)*\"";
function unlit(l) { return new Function('return ' + l)(); }
// _t('…')-Schlüssel + nicht umhüllte englische Literale an Ausgabestellen
function jsScan(script) {
  const keys = new Set(), unwrapped = [];
  const tre = new RegExp('\\b_t\\(\\s*(' + LIT + ')', 'g');
  for (const m of script.matchAll(tre)) { try { keys.add(unlit(m[1])); } catch (e) {} }
  // _tn(n, 'eins', 'mehrere', …): beide Texte sind Schlüssel
  const tnre = new RegExp('\\b_tn\\([^,\\n]+,\\s*(' + LIT + ')\\s*,\\s*(' + LIT + ')', 'g');
  for (const m of script.matchAll(tnre)) { try { keys.add(unlit(m[1])); keys.add(unlit(m[2])); } catch (e) {} }
  const sinks = [
    new RegExp('\\b(?:capToast|capToastAction|alert|confirm)\\(\\s*(' + LIT + ')', 'g'),
    new RegExp('\\bcapToastAction\\([^\\n]*?,\\s*(' + LIT + ')\\s*,\\s*function', 'g'),
    new RegExp('\\.(?:textContent|innerText|title|placeholder)\\s*=\\s*(?:[^;\\n=]*\\?\\s*)?(' + LIT + ')', 'g'),
    new RegExp('\\.innerHTML\\s*=\\s*(' + LIT + ')', 'g'),
    new RegExp('setAttribute\\(\\s*\'(?:aria-label|title|placeholder)\'\\s*,\\s*(' + LIT + ')', 'g'),
  ];
  const lines = script.split('\n');
  lines.forEach((ln, i) => {
    const code = ln.replace(/(^|\s)\/\/.*$/, '$1');
    for (const re of sinks) {
      re.lastIndex = 0;
      for (const m of code.matchAll(re)) {
        let v; try { v = unlit(m[1]); } catch (e) { continue; }
        const vis = v.replace(/<[^>]*>/g, '').replace(/<[^>]*$/, '');
        if (!/[A-Za-z]{3}/.test(vis) || /^[a-z-]+$/.test(vis) && !/\s/.test(vis)) continue; // reine CSS-/ID-Wörter
        unwrapped.push({ line: i + 1, text: v });
      }
    }
  });
  return { keys, unwrapped };
}

function build(lang) {
  const cfg = require(path.join(ROOT, 'i18n', lang + '.js'));
  const src = syncSource(fs.readFileSync(SRC, 'utf8'));
  const errors = [];
  const hEnd = src.indexOf('<style>');
  const lStart = src.indexOf(LAND_START), lEnd = src.indexOf(LAND_END);
  if (hEnd < 0 || lStart < 0 || lEnd < lStart) throw new Error('captly.html: <style>, ' + LAND_START + ' oder ' + LAND_END + ' nicht gefunden');

  const sStart = src.indexOf(SCRIPT_START, lEnd);
  if (sStart < 0 || src.indexOf(DICT_MARK) < 0) throw new Error('captly.html: <script> oder "' + DICT_MARK + '" nicht gefunden');
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

  // Editor: statisches HTML (lEnd … <script>) und JS-Texte
  const ed = translateEditor(src.slice(lEnd, sStart), cfg, errors);
  const script = src.slice(sStart);
  const js = jsScan(script);
  const ui = cfg.ui || {}, keepJs = new Set(cfg.keepJs || []);
  const jsStat = { total: js.keys.size, translated: 0, missing: [] };
  const dict = {};
  for (const k of cfg.uiDynamic || []) { // Schlüssel, die das Script zur Laufzeit zusammensetzt (z. B. Sprachnamen)
    if (Object.prototype.hasOwnProperty.call(ui, k)) dict[k] = ui[k]; else errors.push('js: uiDynamic-Schlüssel ohne Übersetzung → ' + JSON.stringify(k));
  }
  for (const k of js.keys) {
    if (Object.prototype.hasOwnProperty.call(ui, k)) { jsStat.translated++; dict[k] = ui[k]; }
    else if (keepJs.has(k)) jsStat.translated++;
    else jsStat.missing.push(k);
  }
  jsStat.missing.forEach(k => errors.push('js: _t-Text ohne Übersetzung → ' + JSON.stringify(k.slice(0, 90))));
  const unwrapped = js.unwrapped.filter(u => !keepJs.has(u.text));
  unwrapped.forEach(u => errors.push('js: englischer Text ohne _t() (Zeile ' + (src.slice(0, sStart).split('\n').length + u.line - 1) + ') → ' + JSON.stringify(u.text.slice(0, 80))));
  const edScript = script.replace(DICT_MARK, () => 'var UI_DICT = ' + JSON.stringify(dict) + ';');

  const banner = '<!-- GENERIERT von scripts/build-i18n.js aus captly.html + i18n/' + lang + '.js — nicht direkt bearbeiten. -->\n';
  const html = head.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + banner) + src.slice(hEnd, lStart) + landing + ed.html + edScript;
  return { file: path.join(ROOT, cfg.out), html, errors, src, editorStat: ed.stat, jsStat, unwrapped };
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
module.exports = { run, build, faqLd, syncSource, jsScan, translateEditor, hasWords };
