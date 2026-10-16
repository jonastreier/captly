// Erzeugt die statischen SEO-Seiten (p/*.html) und sitemap.xml aus den Daten unten. Kein Build-Server nötig, Ergebnis wird committet.
//   node scripts/build-pages.js          → schreibt p/*.html + sitemap.xml
//   node scripts/build-pages.js --check  → Exit 1, wenn die committeten Dateien nicht zu den Daten passen (läuft in test-ops.js)
// Regeln: nur Aussagen, die wir belegen können (Gluephs-Funktionen aus dem Code; Konkurrenz nur mit Quelle + Prüfdatum). Keine dünnen Klonseiten.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://gluephs.com';
const CHECKED = '16.10.2026';

const LANGS_EN = 'English, Spanish, German, French, Portuguese, Italian, Dutch, Polish, Turkish, Russian, Ukrainian, Japanese, Korean, Chinese, Arabic and Hindi';
const LANGS_DE = 'Englisch, Spanisch, Deutsch, Französisch, Portugiesisch, Italienisch, Niederländisch, Polnisch, Türkisch, Russisch, Ukrainisch, Japanisch, Koreanisch, Chinesisch, Arabisch und Hindi';

// ── Gemeinsame Bausteine je Plattform ────────────────────────────────────────────────────────────
const PLAT = {
  reels:  { en: 'Instagram Reels', de: 'Instagram Reels', preset: 'Reels' },
  tiktok: { en: 'TikTok',          de: 'TikTok',          preset: 'TikTok' },
  shorts: { en: 'YouTube Shorts',  de: 'YouTube Shorts',  preset: 'Shorts' },
};

function platformEN(key, slug, other, uniq) {
  const P = PLAT[key].en;
  return {
    slug, lang: 'en', other, kind: 'article', crumb: P + ' captions',
    title: `${P} captions: free, no watermark | Gluephs`,
    desc: `Add animated word-by-word captions to ${P} in seconds. Free, no watermark, 16 languages, 30+ styles, safe zone guide. Your video stays in your browser.`,
    h1: `Add captions to ${P}, free and without a watermark`,
    lead: `Upload your clip, get word-by-word captions in seconds, check them against the ${P} safe zone and download an MP4 that is ready to post.`,
    blocks: [
      { h2: `How to caption a video for ${P}`, ol: [
        'Open <a href="@HOME@">Gluephs</a> and drop in your video (MP4, MOV or WebM). The video stays in your browser; only the audio track is sent for transcription.',
        'Leave the language on auto-detect or pick it yourself. Gluephs writes ' + `the captions in seconds in ${LANGS_EN}.`,
        'Fix a word if needed and pick one of 30+ caption styles. Each word is highlighted as it is spoken.',
        `In the Style tab open Brand kit → Safe zone and choose the ${PLAT[key].preset} preset. The guide shows where the app interface can cover your text, and Gluephs warns you when a caption leaves the safe area.`,
        'Export an MP4 (1080p, no watermark) or download the captions as SRT or VTT. Before your first download Gluephs asks for your email; there is no account or password.',
      ] },
      { h2: 'What makes short-video captions work', ul: [
        'Keep lines short: two lines at most, a few words at a time. One-word and two-word styles keep viewers reading in rhythm.',
        'Use strong contrast between text and background. Outlines or a soft box keep captions readable on bright and busy footage.',
        'Highlight the keyword of each phrase instead of colouring everything.',
        'Stay consistent: use the same style across a series so your clips are recognisable.',
        'Check the first seconds on a phone before you post. Captions are what many people read first.',
      ] },
      { h2: `Why the safe zone matters on ${P}`, p: [
        uniq.safe,
        `Gluephs has separate safe zone presets for Reels, TikTok and Shorts, and it is switched on by default for vertical 9:16 videos. Treat it as a rule of thumb: apps change their interface from time to time, so a quick look on your own phone is still worth it.`,
      ] },
      { h2: 'More than one clip?', p: [
        'Gluephs can process up to 10 clips in one go and export them together, with the same style and logo on every clip. Free right now, within the daily limit.',
      ] },
    ],
    faq: [
      { q: `Is it really free? Is there a watermark on ${P} videos?`, a: 'Gluephs is free during the beta and never adds a watermark to your video. Before the first download we ask for your email address (no account, no password). There is a fair-use limit of 60 minutes of audio per person per day.' },
      { q: 'Is my video uploaded?', a: 'No. The video is processed in your browser. Only the audio track is sent to our transcription service to create the text; we do not store the audio or the transcript on our servers.' },
      { q: 'Which languages are supported?', a: LANGS_EN + '.' },
      { q: 'Can I edit the captions?', a: 'Yes. Edit the text word by word, change timing, merge or split lines, and switch styles without losing your edits.' },
      { q: 'Can I download SRT or VTT files too?', a: 'Yes. Besides the MP4 with burned-in captions you can export SRT and VTT subtitle files.' },
    ],
    disclaimer: `Instagram, TikTok and YouTube are trademarks of their respective owners. Gluephs is not affiliated with them.`,
  };
}
function platformDE(key, slug, other, uniq) {
  const P = PLAT[key].de;
  return {
    slug, lang: 'de', other, kind: 'article', crumb: `Untertitel für ${P}`,
    title: `Untertitel für ${P}: kostenlos, ohne Wasserzeichen | Gluephs`,
    desc: `Animierte Wort-für-Wort-Untertitel für ${P} in Sekunden. Kostenlos, ohne Wasserzeichen, 16 Sprachen, 30+ Stile, Safe-Zone-Hilfe. Dein Video bleibt im Browser.`,
    h1: `Untertitel für ${P}: kostenlos und ohne Wasserzeichen`,
    lead: `Video hochladen, in Sekunden Wort-für-Wort-Untertitel erhalten, gegen die ${P}-Safe-Zone prüfen und als fertiges MP4 herunterladen.`,
    blocks: [
      { h2: `So untertitelst du ein Video für ${P}`, ol: [
        'Öffne <a href="@HOME@">Gluephs</a> und ziehe dein Video hinein (MP4, MOV oder WebM). Das Video bleibt in deinem Browser, nur die Tonspur geht zur Transkription.',
        `Sprache auf «automatisch erkennen» lassen oder selbst wählen. Gluephs erstellt die Untertitel in Sekunden, in ${LANGS_DE}.`,
        'Falls nötig ein Wort korrigieren und einen von über 30 Stilen wählen. Jedes Wort wird beim Sprechen hervorgehoben.',
        `Im Tab «Style» unter Brand kit → Safe zone das Preset «${PLAT[key].preset}» wählen. Die Hilfslinien zeigen, wo die App-Oberfläche deinen Text verdecken kann, und Gluephs warnt, wenn ein Untertitel den sicheren Bereich verlässt.`,
        'MP4 exportieren (1080p, ohne Wasserzeichen) oder die Untertitel als SRT oder VTT laden. Vor dem ersten Download fragt Gluephs nach deiner E-Mail-Adresse; Konto oder Passwort brauchst du nicht.',
      ] },
      { h2: 'Was bei Untertiteln für Kurzvideos wirkt', ul: [
        'Zeilen kurz halten: höchstens zwei Zeilen, nur wenige Wörter auf einmal. Ein-Wort- und Zwei-Wort-Stile halten den Lesefluss im Takt.',
        'Starker Kontrast zwischen Text und Hintergrund. Eine Kontur oder eine weiche Box hält Untertitel auf hellem und unruhigem Bild lesbar.',
        'Das Schlüsselwort jeder Phrase hervorheben, nicht alles einfärben.',
        'Konsistent bleiben: derselbe Stil in einer Serie macht deine Clips wiedererkennbar.',
        'Die ersten Sekunden vor dem Posten auf dem Handy prüfen. Viele lesen zuerst die Untertitel.',
      ] },
      { h2: `Warum die Safe-Zone bei ${P} wichtig ist`, p: [
        uniq.safe,
        `Gluephs hat eigene Safe-Zone-Presets für Reels, TikTok und Shorts und schaltet die Hilfslinien bei vertikalen 9:16-Videos standardmässig ein. Sieh es als Faustregel: Apps ändern ihre Oberfläche ab und zu, ein kurzer Blick auf dem eigenen Handy lohnt sich trotzdem.`,
      ] },
      { h2: 'Mehr als ein Clip?', p: [
        'Gluephs verarbeitet bis zu 10 Clips auf einmal und exportiert sie zusammen, mit demselben Stil und Logo auf jedem Clip. Aktuell kostenlos, im Rahmen des Tageslimits.',
      ] },
    ],
    faq: [
      { q: `Ist das wirklich gratis? Gibt es ein Wasserzeichen bei ${P}-Videos?`, a: 'Gluephs ist in der Beta kostenlos und setzt nie ein Wasserzeichen ins Video. Vor dem ersten Download fragen wir nach deiner E-Mail-Adresse (kein Konto, kein Passwort). Es gilt ein Fair-Use-Limit von 60 Minuten Ton pro Person und Tag.' },
      { q: 'Wird mein Video hochgeladen?', a: 'Nein. Das Video wird in deinem Browser verarbeitet. Nur die Tonspur geht an unseren Transkriptionsdienst, damit der Text entsteht; Ton und Transkript speichern wir nicht auf unseren Servern.' },
      { q: 'Welche Sprachen gibt es?', a: LANGS_DE + '.' },
      { q: 'Kann ich die Untertitel bearbeiten?', a: 'Ja. Du kannst den Text Wort für Wort ändern, das Timing anpassen, Zeilen teilen oder verbinden und den Stil wechseln, ohne deine Änderungen zu verlieren.' },
      { q: 'Kann ich auch SRT- oder VTT-Dateien laden?', a: 'Ja. Neben dem MP4 mit eingebrannten Untertiteln exportierst du SRT- und VTT-Untertiteldateien.' },
    ],
    disclaimer: 'Instagram, TikTok und YouTube sind Marken ihrer jeweiligen Inhaber. Gluephs steht in keiner Verbindung zu ihnen.',
  };
}

const SAFE = {
  reels: { en: 'On Reels the account name, caption and action buttons sit over the lower part and the right edge of the video, and the top bar covers the upper part. Text placed there can be hidden by the interface even though it looks fine in your editor.',
           de: 'Bei Reels liegen Kontoname, Beschreibung und Aktionsknöpfe über dem unteren Teil und dem rechten Rand des Videos, die Kopfleiste über dem oberen Teil. Text, der dort steht, kann von der Oberfläche verdeckt werden, obwohl er im Editor gut aussieht.' },
  tiktok: { en: 'On TikTok the creator name, description and music line sit over the lower part of the video and the buttons along the right edge, with the top bar above. Captions that run into those areas get covered.',
            de: 'Bei TikTok liegen Kontoname, Beschreibung und Musikzeile über dem unteren Teil des Videos und die Knöpfe am rechten Rand, oben die Kopfleiste. Untertitel, die in diese Bereiche laufen, werden verdeckt.' },
  shorts: { en: 'On YouTube Shorts the channel name and title sit over the lower left of the video and the action buttons along the right edge. Captions placed low or far right can end up behind them.',
            de: 'Bei YouTube Shorts liegen Kanalname und Titel über dem unteren linken Bereich des Videos und die Aktionsknöpfe am rechten Rand. Untertitel, die tief unten oder weit rechts stehen, geraten dahinter.' },
};

// ── Seitenliste ──────────────────────────────────────────────────────────────────────────────────
const PAGES = [
  platformEN('reels', 'reels-captions', 'reels-untertitel', { safe: SAFE.reels.en }),
  platformDE('reels', 'reels-untertitel', 'reels-captions', { safe: SAFE.reels.de }),
  platformEN('tiktok', 'tiktok-captions', 'tiktok-untertitel', { safe: SAFE.tiktok.en }),
  platformDE('tiktok', 'tiktok-untertitel', 'tiktok-captions', { safe: SAFE.tiktok.de }),
  platformEN('shorts', 'shorts-captions', 'shorts-untertitel', { safe: SAFE.shorts.en }),
  platformDE('shorts', 'shorts-untertitel', 'shorts-captions', { safe: SAFE.shorts.de }),
  {
    slug: 'srt-to-vtt', lang: 'en', other: 'srt-zu-vtt', kind: 'tool', crumb: 'SRT to VTT converter',
    title: 'SRT to VTT converter (and back): free, in your browser | Gluephs',
    desc: 'Convert SRT subtitles to WebVTT and VTT to SRT, or shift all timings. Free, runs in your browser, nothing is uploaded.',
    h1: 'SRT to VTT converter, free and private',
    lead: 'Paste or load a subtitle file and convert it between SRT and WebVTT, or move all timings. Everything happens in your browser; the file never leaves your device.',
    tool: { ui: { srt: 'SRT → VTT', vtt: 'VTT → SRT', shift: 'Shift timings', input: 'Paste subtitles here or load a file', load: 'Load file', convert: 'Convert', copy: 'Copy', download: 'Download', offset: 'Shift by (seconds, negative = earlier)', done: 'Done', empty: 'No subtitles found. Check the format.', copied: 'Copied' } },
    blocks: [
      { h2: 'What is the difference between SRT and VTT?', p: [
        'SRT is the simplest and most widely supported subtitle format: a counter, a time range with a comma before the milliseconds, and the text. WebVTT (VTT) is the format used by HTML5 video players. It starts with a WEBVTT header, uses a dot before the milliseconds and can carry styling and positioning.',
        'Most social platforms accept SRT, many web players expect VTT. This tool converts the timing format and the file structure; it does not translate or re-time your text.',
      ] },
      { h2: 'Need the subtitles first?', p: [
        'Gluephs creates word-by-word captions from your video in 16 languages and exports SRT and VTT files, plus an MP4 with the captions burned in. <a href="@HOME@">Try it free</a>.',
      ] },
    ],
    faq: [
      { q: 'Is my file uploaded?', a: 'No. The conversion runs in your browser with JavaScript. Nothing is sent to a server.' },
      { q: 'Does it keep line breaks and multi-line cues?', a: 'Yes. Line breaks inside a cue are kept. Cue settings in a VTT file are dropped when converting to SRT because SRT has no equivalent.' },
      { q: 'What does shifting timings do?', a: 'It adds or subtracts the number of seconds you enter on every cue, for example to fix subtitles that run half a second early. Times never go below zero.' },
    ],
  },
  {
    slug: 'srt-zu-vtt', lang: 'de', other: 'srt-to-vtt', kind: 'tool', crumb: 'SRT-zu-VTT-Konverter',
    title: 'SRT zu VTT umwandeln (und zurück): kostenlos, im Browser | Gluephs',
    desc: 'SRT-Untertitel in WebVTT umwandeln und VTT in SRT, oder alle Zeiten verschieben. Kostenlos, läuft im Browser, nichts wird hochgeladen.',
    h1: 'SRT zu VTT umwandeln, kostenlos und privat',
    lead: 'Untertiteldatei einfügen oder laden und zwischen SRT und WebVTT umwandeln oder alle Zeiten verschieben. Alles passiert in deinem Browser, die Datei verlässt dein Gerät nie.',
    tool: { ui: { srt: 'SRT → VTT', vtt: 'VTT → SRT', shift: 'Zeiten verschieben', input: 'Untertitel hier einfügen oder Datei laden', load: 'Datei laden', convert: 'Umwandeln', copy: 'Kopieren', download: 'Herunterladen', offset: 'Verschieben um (Sekunden, negativ = früher)', done: 'Fertig', empty: 'Keine Untertitel gefunden. Format prüfen.', copied: 'Kopiert' } },
    blocks: [
      { h2: 'Was ist der Unterschied zwischen SRT und VTT?', p: [
        'SRT ist das einfachste und am weitesten verbreitete Untertitelformat: eine Nummer, ein Zeitbereich mit Komma vor den Millisekunden und der Text. WebVTT (VTT) ist das Format der HTML5-Videoplayer. Es beginnt mit der Kopfzeile WEBVTT, nutzt einen Punkt vor den Millisekunden und kann Gestaltung und Position mitgeben.',
        'Die meisten Social-Plattformen akzeptieren SRT, viele Web-Player erwarten VTT. Dieses Werkzeug wandelt Zeitformat und Dateiaufbau um; es übersetzt oder verändert dein Timing nicht.',
      ] },
      { h2: 'Noch keine Untertitel?', p: [
        'Gluephs erstellt Wort-für-Wort-Untertitel aus deinem Video in 16 Sprachen und exportiert SRT- und VTT-Dateien sowie ein MP4 mit eingebrannten Untertiteln. <a href="@HOME@">Kostenlos testen</a>.',
      ] },
    ],
    faq: [
      { q: 'Wird meine Datei hochgeladen?', a: 'Nein. Die Umwandlung läuft in deinem Browser mit JavaScript. Es wird nichts an einen Server gesendet.' },
      { q: 'Bleiben Zeilenumbrüche und mehrzeilige Untertitel erhalten?', a: 'Ja. Zeilenumbrüche innerhalb eines Untertitels bleiben erhalten. Positionsangaben aus VTT entfallen bei der Umwandlung in SRT, weil SRT dafür nichts kennt.' },
      { q: 'Was macht «Zeiten verschieben»?', a: 'Es addiert oder subtrahiert die eingegebenen Sekunden bei jedem Untertitel, zum Beispiel wenn Untertitel eine halbe Sekunde zu früh laufen. Zeiten gehen nie unter null.' },
    ],
  },
  {
    slug: 'untertitel-schweizer-hochdeutsch', lang: 'de', other: null, kind: 'article', crumb: 'Schweizer Akzent',
    title: 'Untertitel für Videos mit Schweizer Akzent: kostenlos | Gluephs',
    desc: 'Automatische Untertitel für Deutsch mit Schweizer Akzent: Test mit einem 9-Minuten-Video, Tipps für Fachwörter und eine ehrliche Antwort zu Mundart.',
    h1: 'Untertitel für Videos mit Schweizer Akzent',
    lead: 'Gluephs erkennt Deutsch auch mit Schweizer Akzent. Wir haben es an einem 9-minütigen Video aus der Landwirtschaft geprüft: Die Sätze kamen sehr gut an, einzelne Fachwörter brauchten eine Korrektur.',
    blocks: [
      { h2: 'Was wir getestet haben', p: [
        'Ein Interview-Video von gut neun Minuten, mehrere Sprecher, Aufnahmen im Freien mit Wind, gesprochen in Schweizer Hochdeutsch (so reden die meisten im Beruf und vor der Kamera). Die automatische Erkennung auf Deutsch lieferte zusammenhängende, gut lesbare Sätze mit Satzzeichen. Fachwörter wie «Keyline Design» oder «Waldrandaufwertung» wurden richtig geschrieben.',
        'Nicht alles war richtig: Einzelne Fachbegriffe aus der Landwirtschaft wurden als ähnlich klingende Alltagswörter geschrieben. Das ist bei jedem Fachgebiet so und lässt sich gut in den Griff bekommen (siehe unten). Das war ein Test an einem einzigen Video, kein Qualitätsversprechen für jede Aufnahme.',
      ] },
      { h2: 'So holst du das Beste heraus', ol: [
        'Stelle die gesprochene Sprache auf «Deutsch», statt automatisch erkennen zu lassen, wenn dein Video durchgehend Deutsch ist.',
        'Trage im Feld «Namen &amp; Begriffe» deine Fachwörter, Orte und Namen ein (zum Beispiel Betriebsnamen oder Fachausdrücke). Die Erkennung bekommt sie als Hinweis und schreibt sie danach häufiger richtig.',
        'Gehe die Untertitel einmal durch und korrigiere einzelne Wörter direkt im Tab «Captions». Das Timing bleibt erhalten.',
        'Achte beim Dreh auf guten Ton: Mikrofon nah am Sprecher, bei Wind ein Windschutz. Das bringt mehr als jede Einstellung danach.',
      ] },
      { h2: 'Und echte Mundart?', p: [
        'Reine Mundart (zum Beispiel Berndeutsch oder Züritüütsch) ist eine andere Sache. Die Spracherkennung kennt Schweizerdeutsch nicht als eigene Sprache und behandelt es wie Hochdeutsch. Das Ergebnis kann deshalb stark abweichen. Wir haben echte Mundart noch nicht systematisch geprüft und versprechen dafür keine Qualität.',
        'Du siehst es aber sofort: <a href="@HOME@">Probiere einen kurzen Clip aus</a>, der Test dauert eine Minute und kostet nichts.',
      ] },
    ],
    faq: [
      { q: 'Funktioniert Gluephs mit Schweizerdeutsch?', a: 'Mit Schweizer Hochdeutsch und Akzent ja, das haben wir an einem 9-Minuten-Video geprüft. Reine Mundart behandelt die Erkennung wie Hochdeutsch, deshalb ist dort die Qualität nicht garantiert.' },
      { q: 'Kann ich Fachwörter und Namen vorgeben?', a: 'Ja, im Feld «Namen & Begriffe». Die Erkennung nutzt sie als Hinweis, und du kannst Wörter zusätzlich von Hand korrigieren.' },
      { q: 'Wird mein Video hochgeladen?', a: 'Nein. Das Video wird in deinem Browser verarbeitet. Nur die Tonspur geht zur Texterstellung; Ton und Transkript speichern wir nicht auf unseren Servern.' },
      { q: 'Kostet das etwas?', a: 'In der Beta ist Gluephs kostenlos und setzt kein Wasserzeichen. Vor dem ersten Download fragen wir nach deiner E-Mail-Adresse (kein Konto, kein Passwort). Es gilt ein Fair-Use-Limit von 60 Minuten Ton pro Person und Tag.' },
    ],
  },
  {
    slug: 'kapwing-alternative', lang: 'en', other: 'alternative-zu-kapwing', kind: 'compare', crumb: 'Kapwing alternative',
    title: 'Kapwing alternative for captions: free, no watermark | Gluephs',
    desc: 'Looking for a Kapwing alternative just for captions? Compare the free plans honestly: watermark, export length, resolution and subtitle limits.',
    h1: 'A Kapwing alternative for captions only',
    lead: 'Kapwing is a full online video editor. If all you need is accurate, animated captions for Reels, TikTok or Shorts, a focused tool can be quicker. Here is an honest comparison of the free plans.',
    blocks: [
      { h2: 'Free plans side by side', table: {
        head: ['', 'Kapwing Free', 'Gluephs (beta)'],
        rows: [
          ['Watermark on exports', 'Yes', 'No'],
          ['Export length', 'Up to 4 minutes', 'Not limited per video; fair-use limit of 60 minutes of audio per person per day'],
          ['Export resolution', 'Up to 720p', 'MP4 up to 1080p'],
          ['Auto-subtitling', 'Up to 10 minutes', 'Within the daily limit above'],
          ['Account', 'Required to save projects', 'Not needed; email before the first download'],
          ['Full video editor (timeline, templates, collaboration)', 'Yes', 'No, captions only'],
        ],
        note: `Kapwing figures from kapwing.com/pricing, checked on ${CHECKED}. Plans change, so please check the current terms. Gluephs is in beta and its free terms can change too.` } },
      { h2: 'When Kapwing is the better choice', p: [
        'If you need a complete editor with a timeline, stock assets, templates and team collaboration, Kapwing does far more than Gluephs. Gluephs only creates and styles captions.',
      ] },
      { h2: 'When Gluephs fits better', ul: [
        'You only need captions, and you want them clean: no watermark on the exported video, even on the free plan.',
        'You want word-by-word animated styles tuned for vertical video, with a safe zone guide for Reels, TikTok and Shorts.',
        'You prefer that your video stays in the browser. Only the audio track is sent to create the text.',
        'You work in German or one of 15 other languages.',
      ] },
      { h2: 'Try it with your own clip', p: [
        'It takes about a minute: <a href="@HOME@">upload a video</a>, pick a style and export. If it is not for you, you have lost nothing.',
      ] },
    ],
    faq: [
      { q: 'Does Gluephs replace Kapwing?', a: 'Only for captions. Gluephs does not cut, arrange or design full videos. Many people caption in Gluephs and edit elsewhere.' },
      { q: 'Will the free terms stay the same?', a: 'Gluephs is in beta and free for now. Paid plans with more transcription minutes are planned; we will announce them before anything changes.' },
    ],
    disclaimer: 'Kapwing is a trademark of its owner. Gluephs is not affiliated with Kapwing. The comparison reflects publicly listed terms on the date shown.',
  },
  {
    slug: 'alternative-zu-kapwing', lang: 'de', other: 'kapwing-alternative', kind: 'compare', crumb: 'Alternative zu Kapwing',
    title: 'Alternative zu Kapwing für Untertitel: gratis, ohne Wasserzeichen | Gluephs',
    desc: 'Eine Kapwing-Alternative nur für Untertitel? Die Gratis-Pläne im ehrlichen Vergleich: Wasserzeichen, Exportlänge, Auflösung und Untertitel-Limits.',
    h1: 'Eine Alternative zu Kapwing, nur für Untertitel',
    lead: 'Kapwing ist ein vollständiger Online-Videoeditor. Wenn du nur treffende, animierte Untertitel für Reels, TikTok oder Shorts brauchst, geht es mit einem spezialisierten Werkzeug oft schneller. Hier der ehrliche Vergleich der Gratis-Pläne.',
    blocks: [
      { h2: 'Die Gratis-Pläne nebeneinander', table: {
        head: ['', 'Kapwing Free', 'Gluephs (Beta)'],
        rows: [
          ['Wasserzeichen im Export', 'Ja', 'Nein'],
          ['Exportlänge', 'Bis 4 Minuten', 'Pro Video nicht begrenzt; Fair-Use-Limit von 60 Minuten Ton pro Person und Tag'],
          ['Exportauflösung', 'Bis 720p', 'MP4 bis 1080p'],
          ['Automatische Untertitel', 'Bis 10 Minuten', 'Im Rahmen des obigen Tageslimits'],
          ['Konto', 'Zum Speichern von Projekten nötig', 'Nicht nötig; E-Mail vor dem ersten Download'],
          ['Vollständiger Videoeditor (Timeline, Vorlagen, Zusammenarbeit)', 'Ja', 'Nein, nur Untertitel'],
        ],
        note: `Kapwing-Angaben von kapwing.com/pricing, geprüft am ${CHECKED}. Pläne ändern sich, bitte aktuelle Bedingungen prüfen. Gluephs ist in der Beta, auch die Gratis-Bedingungen können sich ändern.` } },
      { h2: 'Wann Kapwing die bessere Wahl ist', p: [
        'Brauchst du einen kompletten Editor mit Timeline, Stockmaterial, Vorlagen und Teamarbeit, kann Kapwing weit mehr als Gluephs. Gluephs erstellt und gestaltet nur Untertitel.',
      ] },
      { h2: 'Wann Gluephs besser passt', ul: [
        'Du brauchst nur Untertitel und willst sie sauber: kein Wasserzeichen im exportierten Video, auch im Gratis-Plan.',
        'Du willst animierte Wort-für-Wort-Stile für Hochformat-Videos, mit Safe-Zone-Hilfe für Reels, TikTok und Shorts.',
        'Dein Video soll im Browser bleiben. Nur die Tonspur geht zur Texterstellung.',
        'Du arbeitest auf Deutsch oder in einer der 15 weiteren Sprachen.',
      ] },
      { h2: 'Mit dem eigenen Clip ausprobieren', p: [
        'Das dauert etwa eine Minute: <a href="@HOME@">Video hochladen</a>, Stil wählen, exportieren. Passt es nicht, hast du nichts verloren.',
      ] },
    ],
    faq: [
      { q: 'Ersetzt Gluephs Kapwing?', a: 'Nur bei Untertiteln. Gluephs schneidet, arrangiert oder gestaltet keine ganzen Videos. Viele untertiteln in Gluephs und schneiden woanders.' },
      { q: 'Bleiben die Gratis-Bedingungen so?', a: 'Gluephs ist in der Beta und vorerst kostenlos. Bezahlpläne mit mehr Transkriptionsminuten sind geplant; wir kündigen sie an, bevor sich etwas ändert.' },
    ],
    disclaimer: 'Kapwing ist eine Marke ihres Inhabers. Gluephs steht in keiner Verbindung zu Kapwing. Der Vergleich gibt die öffentlich aufgeführten Bedingungen am genannten Datum wieder.',
  },
];

// ── Vorlage ──────────────────────────────────────────────────────────────────────────────────────
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = s => String(s).replace(/<[^>]+>/g, '');
const T = {
  en: { home: '/', cta: 'Open the editor', crumbHome: 'Gluephs', related: 'Related', footer: ['Privacy', 'Terms', 'Imprint', 'Contact'], links: { Privacy: '/privacy', Terms: '/terms', Imprint: '/impressum', Contact: '/contact' }, faq: 'Frequently asked questions', lang: 'Deutsch', ctaBand: 'Free during the beta. No watermark. No account.', ctaBtn: 'Add captions now', locale: 'en_US', ogimg: 'og-image.jpg' },
  de: { home: '/de', cta: 'Zum Editor', crumbHome: 'Gluephs', related: 'Weitere Seiten', footer: ['Datenschutz', 'AGB', 'Impressum', 'Kontakt'], links: { Datenschutz: '/datenschutz', AGB: '/terms', Impressum: '/impressum', Kontakt: '/kontakt' }, faq: 'Häufige Fragen', lang: 'English', ctaBand: 'In der Beta kostenlos. Ohne Wasserzeichen. Ohne Konto.', ctaBtn: 'Jetzt Untertitel erstellen', locale: 'de_CH', ogimg: 'og-image-de.jpg' },
};
const CSS = `:root{--ink:#16181d;--muted:#5b6068;--line:#e4e6ec;--bg:#f6f7fb;--brand:#6d28d9;--brand2:#7c3aed}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}[hidden]{display:none!important}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
a{color:var(--brand)}
.top{max-width:860px;margin:0 auto;padding:16px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.logo{display:inline-flex;align-items:center;font:800 22px/1 'Inter',sans-serif;letter-spacing:-.02em;color:var(--ink);text-decoration:none}
.logo b{background:var(--brand2);color:#fff;border-radius:7px;padding:3px 7px 4px;margin-left:2px}
.top nav{display:flex;align-items:center;gap:14px;font-size:14px}
.top nav a.lang{color:var(--muted);text-decoration:none}
.btn{display:inline-block;background:var(--brand2);color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:10px 18px;border:0;cursor:pointer;font-size:14.5px}
.btn:hover{background:var(--brand)}
.btn.ghost{background:#fff;color:var(--ink);border:1px solid var(--line)}
main{max-width:860px;margin:0 auto;padding:8px 16px 56px}
.crumbs{font-size:13px;color:var(--muted);margin:4px 0 14px}.crumbs a{color:var(--muted)}
article{background:#fff;border:1px solid var(--line);border-radius:18px;padding:30px 28px}
h1{font-size:clamp(26px,5vw,36px);line-height:1.15;letter-spacing:-.02em;margin:0 0 14px}
.lead{font-size:18px;color:#343840;margin:0 0 8px}
h2{font-size:21px;line-height:1.25;margin:34px 0 10px;letter-spacing:-.01em}
p{margin:0 0 12px}ul,ol{margin:0 0 12px;padding-left:22px}li{margin:0 0 7px}
.tablewrap{overflow-x:auto;margin:6px 0 10px}
table{border-collapse:collapse;width:100%;min-width:520px;font-size:15px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{background:#faf9ff;font-weight:700}
td:first-child{font-weight:600}
.note{font-size:13px;color:var(--muted)}
details{border-top:1px solid var(--line);padding:12px 0}details:last-of-type{border-bottom:1px solid var(--line)}
summary{cursor:pointer;font-weight:650;list-style:none;display:flex;justify-content:space-between;gap:12px}
summary::-webkit-details-marker{display:none}summary::after{content:'+';color:var(--brand);font-weight:700}
details[open] summary::after{content:'–'}details p{margin:8px 0 0;color:#343840}
.band{margin:34px 0 0;background:linear-gradient(135deg,#f4efff,#eef3ff);border:1px solid #e3dcf7;border-radius:16px;padding:22px;text-align:center}
.band p{font-weight:650;margin:0 0 12px}
.rel{margin-top:26px}.rel ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.rel a{display:inline-block;background:#f4f5fa;border:1px solid var(--line);border-radius:999px;padding:6px 13px;text-decoration:none;font-size:14px;color:var(--ink)}
.rel a:hover{border-color:var(--brand2)}
.disc{font-size:12.5px;color:var(--muted);margin-top:20px}
footer{max-width:860px;margin:0 auto;padding:6px 16px 40px;font-size:14px;color:var(--muted);display:flex;flex-wrap:wrap;gap:6px 18px}
footer a{color:var(--muted)}
.tool textarea{width:100%;min-height:200px;font:14px/1.5 ui-monospace,Menlo,Consolas,monospace;border:1px solid var(--line);border-radius:12px;padding:12px;resize:vertical;background:#fff;color:var(--ink)}
.tool .row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;align-items:center}
.tool .seg{display:inline-flex;border:1px solid var(--line);border-radius:999px;overflow:hidden}
.tool .seg button{border:0;background:#fff;padding:9px 14px;font:600 14px 'Inter',sans-serif;cursor:pointer;color:var(--ink)}
.tool .seg button[aria-pressed=true]{background:var(--brand2);color:#fff}
.tool label{font-size:14px;color:var(--muted)}.tool input[type=number]{width:96px;padding:8px;border:1px solid var(--line);border-radius:8px;font:14px 'Inter',sans-serif}
.tool .msg{font-size:14px;color:var(--muted);min-height:20px}
@media (max-width:560px){article{padding:22px 16px}.lead{font-size:16.5px}table{min-width:0;font-size:13.5px}th,td{padding:8px 6px}}`;

function renderBlock(b, ctx) {
  const fix = s => String(s).replace(/@HOME@/g, ctx.homeHref);
  let h = '';
  if (b.h2) h += `<h2>${esc(b.h2)}</h2>\n`;
  (b.p || []).forEach(p => { h += `<p>${fix(p)}</p>\n`; });
  if (b.ol) h += '<ol>\n' + b.ol.map(x => `<li>${fix(x)}</li>`).join('\n') + '\n</ol>\n';
  if (b.ul) h += '<ul>\n' + b.ul.map(x => `<li>${fix(x)}</li>`).join('\n') + '\n</ul>\n';
  if (b.table) {
    h += '<div class="tablewrap"><table>\n<thead><tr>' + b.table.head.map(c => `<th>${esc(c)}</th>`).join('') + '</tr></thead>\n<tbody>\n';
    h += b.table.rows.map(r => '<tr>' + r.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>').join('\n') + '\n</tbody></table></div>\n';
    if (b.table.note) h += `<p class="note">${esc(b.table.note)}</p>\n`;
  }
  return h;
}
function toolHtml(ui) {
  return `<div class="tool" id="tool">
<div class="row"><div class="seg" role="group" aria-label="Mode"><button type="button" data-m="srt" aria-pressed="true">${esc(ui.srt)}</button><button type="button" data-m="vtt" aria-pressed="false">${esc(ui.vtt)}</button><button type="button" data-m="shift" aria-pressed="false">${esc(ui.shift)}</button></div>
<span class="row" id="shiftRow" hidden><label for="off">${esc(ui.offset)}</label><input type="number" id="off" step="0.1" value="0"></span></div>
<textarea id="inp" spellcheck="false" placeholder="${esc(ui.input)}" aria-label="${esc(ui.input)}"></textarea>
<div class="row"><label class="btn ghost" for="file" style="margin:0">${esc(ui.load)}</label><input type="file" id="file" accept=".srt,.vtt,.txt,text/plain,text/vtt" hidden><button type="button" class="btn" id="go">${esc(ui.convert)}</button></div>
<textarea id="out" spellcheck="false" readonly aria-label="Output"></textarea>
<div class="row"><button type="button" class="btn ghost" id="copy">${esc(ui.copy)}</button><button type="button" class="btn ghost" id="dl">${esc(ui.download)}</button><span class="msg" id="msg" role="status"></span></div>
</div>
<script src="/assets/srt-convert.js"></script>
<script>
(function(){var m='srt',$=function(i){return document.getElementById(i)},ui=${JSON.stringify(ui)};
document.querySelectorAll('#tool [data-m]').forEach(function(b){b.addEventListener('click',function(){m=b.dataset.m;document.querySelectorAll('#tool [data-m]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});$('shiftRow').hidden=m!=='shift';});});
$('file').addEventListener('change',function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(){$('inp').value=String(r.result||'');};r.readAsText(f);});
function ext(){return m==='srt'?'vtt':(m==='vtt'?'srt':(/^\\s*WEBVTT/.test($('inp').value)?'vtt':'srt'));}
$('go').addEventListener('click',function(){var t=$('inp').value,o='';
 if(m==='srt')o=SrtConvert.srtToVtt(t);else if(m==='vtt')o=SrtConvert.vttToSrt(t);else o=SrtConvert.shift(t,Math.round(parseFloat($('off').value||'0')*1000),ext());
 $('out').value=o;$('msg').textContent=SrtConvert.parseCues(t).length?ui.done:ui.empty;});
$('copy').addEventListener('click',function(){var v=$('out').value;if(!v)return;(navigator.clipboard?navigator.clipboard.writeText(v):Promise.reject()).then(function(){$('msg').textContent=ui.copied;}).catch(function(){$('out').select();document.execCommand('copy');$('msg').textContent=ui.copied;});});
$('dl').addEventListener('click',function(){var v=$('out').value;if(!v)return;var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([v],{type:'text/plain;charset=utf-8'}));a.download='subtitles.'+ext();a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);});
})();
</script>`;
}

function render(pg) {
  const t = T[pg.lang], other = pg.other ? PAGES.find(p => p.slug === pg.other) : null;
  const url = `${SITE}/${pg.slug}`, homeAbs = pg.lang === 'de' ? `${SITE}/de` : `${SITE}/`;
  const homeHref = `${t.home}?utm_source=seo-${pg.slug}`;
  const ctx = { homeHref };
  const body = pg.blocks.map(b => renderBlock(b, ctx)).join('');
  const toolBlock = pg.tool ? toolHtml(pg.tool.ui) : '';
  const faqHtml = pg.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n');
  const related = PAGES.filter(p => p.lang === pg.lang && p.slug !== pg.slug).map(p => `<li><a href="/${p.slug}">${esc(p.crumb)}</a></li>`).join('');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.crumbHome, item: homeAbs }, { '@type': 'ListItem', position: 2, name: pg.crumb, item: url } ] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: pg.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];
  const trackJs = `(function(){try{if(location.protocol!=='https:'||navigator.doNotTrack==='1'||navigator.globalPrivacyControl||/bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent))return;setTimeout(function(){fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({e:'seo_view',s:'${pg.slug}',l:'${pg.lang}'}),keepalive:true}).catch(function(){});},600);}catch(e){}})();`;
  return `<!doctype html>
<html lang="${pg.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pg.title)}</title>
<meta name="description" content="${esc(pg.desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${url}">
${other ? `<link rel="alternate" hreflang="${pg.lang}" href="${url}">
<link rel="alternate" hreflang="${other.lang}" href="${SITE}/${other.slug}">` : ''}
<meta property="og:type" content="article">
<meta property="og:site_name" content="Gluephs">
<meta property="og:locale" content="${t.locale}">
<meta property="og:title" content="${esc(pg.title.replace(/ \| Gluephs$/, ''))}">
<meta property="og:description" content="${esc(pg.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/${t.ogimg}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/vendor/fonts/fonts.css">
<style>${CSS}</style>
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
</head>
<body>
<header class="top">
  <a class="logo" href="${t.home}" aria-label="Gluephs">glue<b>phs</b></a>
  <nav>${other ? `<a class="lang" href="/${pg.other}" hreflang="${other.lang}" lang="${other.lang}">${t.lang}</a>` : ''}<a class="btn" href="${homeHref}">${esc(t.cta)}</a></nav>
</header>
<main>
<p class="crumbs"><a href="${t.home}">${t.crumbHome}</a> › ${esc(pg.crumb)}</p>
<article>
<h1>${esc(pg.h1)}</h1>
<p class="lead">${esc(pg.lead)}</p>
${toolBlock}
${body}
<h2>${esc(t.faq)}</h2>
${faqHtml}
<div class="band"><p>${esc(t.ctaBand)}</p><a class="btn" href="${homeHref}">${esc(t.ctaBtn)}</a></div>
<nav class="rel" aria-label="${esc(t.related)}"><h2>${esc(t.related)}</h2><ul>${related}</ul></nav>
${pg.disclaimer ? `<p class="disc">${esc(pg.disclaimer)}</p>` : ''}
</article>
</main>
<footer>${t.footer.map(n => `<a href="${t.links[n]}">${n}</a>`).join('')}<span>© 2026 Gluephs</span></footer>
<script>${trackJs}</script>
</body>
</html>
`;
}

function sitemap() {
  const e = (loc, alts) => `  <url>\n    <loc>${loc}</loc>\n${alts.map(a => `    <xhtml:link rel="alternate" hreflang="${a[0]}" href="${a[1]}"/>\n`).join('')}  </url>`;
  const home = [['en', SITE + '/'], ['de', SITE + '/de'], ['x-default', SITE + '/']];
  const urls = [e(SITE + '/', home), e(SITE + '/de', home)];
  PAGES.forEach(p => {
    if (!p.other) { urls.push(e(`${SITE}/${p.slug}`, [])); return; }
    const o = PAGES.find(x => x.slug === p.other);
    const en = p.lang === 'en' ? p : o, de = p.lang === 'de' ? p : o;
    urls.push(e(`${SITE}/${p.slug}`, [['en', `${SITE}/${en.slug}`], ['de', `${SITE}/${de.slug}`], ['x-default', `${SITE}/${en.slug}`]]));
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Erzeugt von scripts/build-pages.js. Bei Domainwechsel SITE dort ändern und Basis-URL zusammen mit canonical/hreflang/og:url in captly.html + i18n/de.js anpassen -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

const outputs = {};
PAGES.forEach(p => { outputs['p/' + p.slug + '.html'] = render(p); });
outputs['sitemap.xml'] = sitemap();

if (process.argv.includes('--check')) {
  const bad = Object.keys(outputs).filter(f => !fs.existsSync(path.join(ROOT, f)) || fs.readFileSync(path.join(ROOT, f), 'utf8') !== outputs[f]);
  if (bad.length) { console.error('Nicht aktuell (node scripts/build-pages.js ausführen): ' + bad.join(', ')); process.exit(1); }
  console.log('build-pages: ' + Object.keys(outputs).length + ' Dateien aktuell');
} else {
  fs.mkdirSync(path.join(ROOT, 'p'), { recursive: true });
  Object.keys(outputs).forEach(f => fs.writeFileSync(path.join(ROOT, f), outputs[f]));
  console.log('build-pages: ' + Object.keys(outputs).length + ' Dateien geschrieben (' + PAGES.length + ' Seiten + Sitemap)');
}
module.exports = { PAGES };
