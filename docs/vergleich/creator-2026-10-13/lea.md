# Lea (24, Lifestyle/Beauty, TikTok + Reels) testet Gluephs auf dem Handy (375x812)

**Testgrenzen (ehrlich):** Das Browser-Pane war ab Minute ~3 verdeckt, Screenshots gingen nicht. Ich habe daher per DOM/Computed-Styles geprüft, nicht visuell. Taps sind per JS-Events simuliert. Die Timeline ist ein Canvas und hat auf meine simulierten Touches nicht reagiert. Das Fazit zur Timeline-Bedienung ist deshalb **nicht verifiziert**. Der localStorage wird mit den anderen Testern geteilt, daher tauchten fremde Templates und Sessions auf. Sign-in war nicht verfügbar, nicht weiter versucht.

## Persona
Lea postet 1-2 Videos pro Tag, schneidet nur am Handy und ist ungeduldig. Sie nutzt CapCut (Free nervt) und fand Captions zu teuer. Sie will Wort-für-Wort-Pop, Karaoke, Emojis, Keyword-Farben und ein eigenes Template, das sie täglich wiederverwendet.

## Top 5 Probleme
1. **Hoch – Preis nicht in 10 s sichtbar.** Die Landing zeigt im ersten Screen nur „Kostenlos während der Beta“. Der Pricing-Block (Free $0 / Creator $7,99 / Pro $14,99) liegt bei ca. 2970 px, also etwa 3,7 Bildschirme tiefer. Die Nav-Links (Preise, FAQ, EN) sind auf dem Handy unsichtbar, es gibt kein Hamburger-Menü. Preise stehen in $ auf der deutschen Seite. Erwartet: Preis-Hinweis oder Anker-Link im Hero. Passiert: Sie muss scrollen und weiß vorher nicht, ob „kostenlos“ ein Köder ist.
2. **Hoch – Emojis und Keyword-Farbe liefern ohne KI nichts Sichtbares.** Style-Tab → Animation → „Emojis“ ist aktiv, im Video erscheint aber kein einziges Emoji. Toast: „AI picks unavailable … (no emojis)“. Das war lokal wohl der fehlende KI-Dienst, aber der Schalter wirkt trotzdem „an“. Erwartet: ein Hinweis direkt am Schalter. Zusätzlich ist die Keyword-Farbe (#ffd60a) im Preset identisch mit der Aktiv-Wort-Farbe, der Effekt ist dadurch kaum unterscheidbar.
3. **Mittel – Deutsche Komposita werden hart getrennt.** Bei Größe 34 steht im Video „FUNKTIO-/NIERT.“. Ursache: „Max. Zeichen pro Zeile“ steht auf Auto = 8 (Advanced), plus Silbentrennung (hyph-de). Das sieht in Reels amateurhaft aus. Erwartet: ein Schalter „Trennung aus“ oder ein Umbruch erst bei größerer Breite. Die Vorschau ist 176x310 px groß, das Problem fällt daher schnell auf.
4. **Mittel – Editor-UI ist auf der deutschen Seite komplett englisch.** Betroffen sind Tabs, Export-Sheet („Skip — download now“, „Caption another video“) und die Toasts. Auf der Landing steht außerdem „+14 more in the editor“ und „Beispielvideo“ gemischt. Das wirkt unfertig. Die Style-Namen („Tight“, „Bold Pop“) sind für Lea egal, die UI-Texte nicht.
5. **Mittel – Handy-Layout ist eng.** Die Vorschau misst nur 176x310 px (Viewport 375 breit), das Bedienpanel nur 372 px Höhe und ist 1260 px lang scrollbar. „Als Template speichern“ liegt ganz unten (ca. 1475 px Scroll) und ist kaum auffindbar. Tap-Ziele sind 32 px (−/+ ±0,1 s, Löschen, Emoji pro Caption), unter dem 44-px-Standard. Timing nur in 0,1-s-Schritten zu verschieben ist zu langsam. Die Timeline-Canvas ist 349x102 px groß.

Weitere Beobachtungen: Style-Änderungen (z. B. Größe) sind nicht per Undo rückgängig zu machen, Undo gilt nur für Text und Struktur (`undoBtn` bleibt disabled). Split und Merge gibt es nur per Enter bzw. Backspace am Zeilenanfang im Captions-Tab. Ein Hinweis darauf fehlt, auf Android-Tastaturen ist das unsicher. In der mobilen Timeline-Leiste ist ein eigener Split-Button vorhanden (Split/Edit/Select/Delete/Snap/Close gaps).

## Top 5 was begeistert
1. **Tempo:** Landing → Upload → Editor mit fertigen Captions in ca. 0,5 s (Transkription ist gemockt). Während des Wartens kann man schon einen Style wählen („Choose a style while we transcribe“).
2. **Template-Workflow:** „Lea Glow“ gespeichert, per ⋯ → „★ Use for every new video“ als Standard gesetzt. Beim nächsten Upload (neue Datei, ohne Style-Wahl) wurden automatisch übernommen: Outfit 800, pinkes Highlight, 5-px-Outline plus Shadow, Pop-Animation, Punchy-Zoom, Position, Emojis an. Genau ihr Wunsch („einmal einstellen, täglich nutzen“), in 2 Taps plus Namenseingabe.
3. **Tiefe der Anpassung:** 55+ Fonts plus eigener Font-Upload (.ttf/.otf/.woff2), Gewichte Semi bis Black, Größe 10-54, Case (Style/AA/aa), 3 Farben (Text/Highlight/Keywords), Outline, Shadow, Glow, Box oder Pill, Letter-Spacing, Line-Height, eigene Keyword-Schrift.
4. **Karaoke-Wort-Highlight und Auto-Zoom:** Das aktive Wort wechselt sauber pro Wort (geprüft per Sampling). Word-Pop (Pop/Punch/Lift/Fade/Glow), Highlight vs. Pill vs. Reveal vs. Fill und Auto-Zoom Off/Subtle/Punchy sind im Panel zu finden. Pro Caption lässt sich ein Wort per Tap hervorheben.
5. **Export:** MP4 ohne Wasserzeichen, E-Mail optional (mit „Skip — download now“, dazu „Skip this next time“). Zusätzlich SRT/VTT/TXT, Copy text, Cover erstellen, Post-Text mit Hashtags und „Cut silences & filler words“ (um/äh) im Export. Freies Ziehen der Caption funktioniert (Maus-Drag getestet, Guides vorhanden). Safe-Zone-Overlay ist da.

## Vergleich aus Leas Sicht
- **Schneller/billiger als CapCut Free:** Ja, bei Untertiteln. Kein Account, kein Wasserzeichen, kein Paywall-Gefühl. Der Template-Default spart die täglichen 8-10 Taps, die sie in CapCut für denselben Look braucht.
- **Cooler als Captions (die App):** Beim Look weitgehend gleichauf (24 Styles, Karaoke, Zoom). Es fehlen die KI-Extras von Captions (Emojis, Auto-B-Roll, Eye-Contact, Sticker). Dafür ist Gluephs deutlich günstiger.
- **Schwächer als CapCut:** Das Handy-Layout ist enger, es gibt keinen Schnitt, keine Musik, keine Effekte. Rendern „on device, Tab offen lassen“ dauerte hier etwa 8,6 s für 8 s Video (ca. 1x Echtzeit). Bei 30-60 s Reels und Tab-Wechsel zum Posten ist das riskant.
- **Fazit:** Als Zusatz-Tool vor CapCut oder TikTok-Upload ja, als Ersatz noch nicht.

## Zahlungsbereitschaft
Ca. 5-8 € pro Monat. Die $7,99 Creator-Stufe wäre OK, wenn Emojis/KI-Keywords zuverlässig laufen und das Template-System erhalten bleibt (Ziel: 1-2 Videos täglich, 300 Minuten reichen reichlich). Pro für $14,99 würde sie nicht zahlen. Vor einem Abo will sie zuerst die Preise in € sehen und ein „Template cloud-gespeichert“-Versprechen, denn die Templates liegen aktuell nur im Browser („saved in this browser“).

## Wunsch-Features
1. **Template mit Cloud-Sync und Teilen (Geräte-Wechsel und Handy-Browserdaten löschen):** Ohne Konto sind die Looks nur im Browser. Export/Import existiert, ist aber ein Umweg. Wäre ein Abo-Grund.
2. **Mehrere Videos nacheinander (Batch/Queue) mit Standard-Template und Render im Hintergrund / Share-Sheet:** Lea postet täglich, ein Direkt-„In Fotos speichern“ und ein Render, der Tab-Wechsel überlebt, sparen echte Zeit. „Save to Photos / Share“ existiert im DOM, war lokal aber versteckt.
3. **Trend-Pack mit Emoji-Sets und Sticker-Wörtern (kuratiert):** Die Emoji-Auswahl pro Caption ist vorhanden. Gewünscht sind getrennte Keyword-Farben zum Aktiv-Wort und neue Styles monatlich.

## Bugs / Auffälligkeiten (mit Repro)
- **B1 (mittel):** Silbentrennung zerreißt kurze Wörter. Repro: `test-long.mp4` hochladen → Style „Bold Pop“ → Größe auf 34 → letzte Caption „FUNKTIO-/NIERT.“ (Advanced: Max. Zeichen/Zeile = 8 bei Auto).
- **B2 (niedrig-mittel):** „Restored your last session“ greift nach Größe|Dauer, nicht nach Dateiname. Repro: Datei mit anderem Namen, aber gleicher Größe und Länge hochladen → fremder Titel/Style/Captions erscheinen und überschreiben den Autosave-Eintrag. In der Praxis selten, aber gewählter Landing-Style (Bold Pop) wurde dabei ignoriert.
- **B3 (niedrig):** Schalter „Emojis“ steht auf „an“, obwohl KI nicht verfügbar ist, ohne Hinweis am Schalter. Der Toast erscheint nur kurz.
- **B4 (niedrig):** „Use for every new video“ zeigt keine eigene Bestätigung direkt beim Tap. Der Toast „★ … will be used for every new video“ erschien bei mir erst viel später.
- **B5 (niedrig):** Nach „Zurück“ zur Landing ist kein Hinweis zu sehen, dass der Default „Lea Glow“ beim nächsten Upload greift. Die Chips auf der Landing zeigen keine „My templates“ und keinen aktiven Chip.
- **B6 (niedrig):** Case-Auswahl bietet „As typed“ nur im versteckten Select, im sichtbaren Segment nur Style/AA/aa.
- **B7 (zu prüfen):** Timeline-Canvas (`#tlCanvas`) reagierte nicht auf simulierte Touch-Events (Tap/Select). Wahrscheinlich Testartefakt wegen des verdeckten Panes, bitte auf einem echten Phone prüfen.
