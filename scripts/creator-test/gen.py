# Erzeugt die drei Creator-Testvideos (macOS `say` + ffmpeg) samt Wahrheits-JSON (Text + Wort-Timings).
# Aufruf: python3 scripts/creator-test/gen.py <ausgabeordner ausserhalb des Repos>
# Satz-Pausen bleiben unter VAD_SKIP_GAP (captly.html), sonst verschieben sich die Mock-Timings.
import json, subprocess, os, sys
D=os.path.abspath(sys.argv[1] if len(sys.argv)>1 else '/tmp/gluephs-creator'); os.makedirs(D, exist_ok=True)
VIDS={
 'v1-reel-de':{'voice':'Anna','size':'1080x1920','c':'0x7b2cbf:0xff6f91:0xffc75f','sent':[
  'Drei Tricks, damit deine Reels mehr Views bekommen.',
  'Erstens: Die ersten zwei Sekunden entscheiden alles.',
  'Zweitens: Untertitel, weil fast alle ohne Ton schauen.',
  'Drittens: Poste regelmässig, am besten jeden Dienstag um achtzehn Uhr.',
  'Speicher dir das Video, sonst vergisst du es!']},
 'v2-podcast-de-16x9':{'voice':'Eddy (Deutsch (Deutschland))','size':'1920x1080','c':'0x0f3057:0x00587a:0x008891','sent':[
  'Willkommen zurück bei Klartext Business.',
  'Heute spreche ich mit Sandra Meier aus Winterthur über Preise für Selbständige.',
  'Ihr wichtigster Tipp: Verkauf keine Stunden, verkauf Ergebnisse.',
  'Ein Kunde zahlt nicht für deine Zeit, sondern für das Problem, das du löst.',
  'Und wenn ein Angebot dreimal hintereinander sofort angenommen wird, ist dein Preis zu tief.']},
 'v3-hook-en':{'voice':'Daniel','size':'1080x1920','c':'0x111111:0x3a0ca3:0xf72585','sent':[
  'Stop scrolling.',
  'This one setting doubled my watch time.',
  'Most creators put captions too low, right where the app buttons cover them.',
  'Move them to the upper third, keep two to four words per line, and highlight the key word.',
  'Try it on your next video and tell me if it worked.']},
}
LEAD, GAP = 0.25, 0.35
def dur(p): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',p]).decode().strip())
for name,v in VIDS.items():
  parts=[]; words=[]; t=LEAD
  for i,s in enumerate(v['sent']):
    a=f'{D}/{name}-s{i}.aiff'; subprocess.check_call(['say','-v',v['voice'],'-o',a,s]); d=dur(a)
    ws=s.split(); tot=sum(len(w) for w in ws); inner=d*0.92; c=t+d*0.03
    for w in ws:
      wd=inner*len(w)/tot; words.append({'word':w,'start':round(c,3),'end':round(c+wd*0.9,3)}); c+=wd
    parts.append((a,d)); t+=d+GAP
  total=t-GAP+0.6
  # Audio: Vorlauf + Sätze mit Pausen
  lst=f'{D}/{name}-list.txt'
  sil=f'{D}/sil.wav'; subprocess.check_call(['ffmpeg','-loglevel','error','-y','-f','lavfi','-i','anullsrc=r=44100:cl=mono','-t',str(GAP),sil])
  lead=f'{D}/lead.wav'; subprocess.check_call(['ffmpeg','-loglevel','error','-y','-f','lavfi','-i','anullsrc=r=44100:cl=mono','-t',str(LEAD),lead])
  with open(lst,'w') as f:
    f.write(f"file '{lead}'\n")
    for i,(a,d) in enumerate(parts):
      w=f'{D}/{name}-s{i}.wav'; subprocess.check_call(['ffmpeg','-loglevel','error','-y','-i',a,'-ar','44100','-ac','1',w]); f.write(f"file '{w}'\n")
      if i<len(parts)-1: f.write(f"file '{sil}'\n")
  aud=f'{D}/{name}.wav'; subprocess.check_call(['ffmpeg','-loglevel','error','-y','-f','concat','-safe','0','-i',lst,'-af','apad=pad_dur=0.6',aud])
  W,H=v['size'].split('x'); c0,c1,c2=v['c'].split(':')
  out=f'{D}/{name}.mp4'
  subprocess.check_call(['ffmpeg','-loglevel','error','-y','-f','lavfi','-i',f'gradients=s={W}x{H}:c0={c0}:c1={c1}:c2={c2}:speed=0.015:r=30','-i',aud,
    '-vf','noise=alls=6:allf=t','-c:v','libx264','-pix_fmt','yuv420p','-preset','veryfast','-crf','23','-c:a','aac','-b:a','128k','-shortest',out])
  json.dump({'text':' '.join(v['sent']),'language':'german' if v['voice']!='Daniel' else 'english','words':words,'duration':round(dur(out),2)},open(f'{D}/{name}.json','w'),ensure_ascii=False,indent=0)
  print(name, round(dur(out),1),'s', len(words),'Wörter')

for f in os.listdir(D):
  if f.endswith('.aiff') or '-s' in f and f.endswith('.wav') or f.endswith('-list.txt') or f in ('sil.wav','lead.wav'): os.remove(os.path.join(D,f))
