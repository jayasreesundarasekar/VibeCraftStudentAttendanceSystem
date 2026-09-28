'use strict';
const LG={en:['English','en-IN','English'],hi:['हिन्दी','hi-IN','Hindi'],ta:['தமிழ்','ta-IN','Tamil'],te:['తెలుగు (needs AI key)','te-IN','Telugu'],kn:['ಕನ್ನಡ (needs AI key)','kn-IN','Kannada'],ml:['മലയാളം (needs AI key)','ml-IN','Malayalam'],bn:['বাংলা (needs AI key)','bn-IN','Bengali'],fr:['Français (needs AI key)','fr-FR','French'],es:['Español (needs AI key)','es-ES','Spanish']};
const TP={
 en:{o:(p,n,m,r)=>`Your overall attendance is ${p}%. ${n} of ${m} subjects need attention. Detention risk: ${r}.`,b:(x,t,l)=>`You can skip up to ${x} more classes in total and still finish the semester above ${t}%. ${l}`,r:l=>`To recover, attend these classes in a row: ${l}.`,k:(r,i)=>`Detention risk: ${r}. ${i}`,none:'Nothing to recover — you are on track.',irr:l=>`Irreversible detention in: ${l}.`,help:'Ask me about your overall attendance, how many classes you can skip, what you must attend, or your detention risk.'},
 hi:{o:(p,n,m,r)=>`आपकी कुल उपस्थिति ${p}% है। ${m} में से ${n} विषयों पर ध्यान देना ज़रूरी है। जोखिम: ${r}।`,b:(x,t,l)=>`सेमेस्टर ${t}% से ऊपर खत्म करने के लिए आप कुल ${x} कक्षाएँ तक छोड़ सकते हैं। ${l}`,r:l=>`सुधार के लिए लगातार ये कक्षाएँ अटेंड करें: ${l}।`,k:(r,i)=>`डिटेंशन जोखिम: ${r}। ${i}`,none:'सुधार की ज़रूरत नहीं है — आप सही रास्ते पर हैं।',irr:l=>`अपरिवर्तनीय डिटेंशन: ${l}।`,help:'मुझसे कुल उपस्थिति, कितनी कक्षाएँ छोड़ सकते हैं, या डिटेंशन जोखिम के बारे में पूछें।'},
 ta:{o:(p,n,m,r)=>`உங்கள் மொத்த வருகை ${p}%. ${m} பாடங்களில் ${n} பாடங்களில் கவனம் தேவை. ஆபத்து: ${r}.`,b:(x,t,l)=>`செமஸ்டரை ${t}%க்கு மேல் முடிக்க மொத்தம் ${x} வகுப்புகள் வரை தவிர்க்கலாம். ${l}`,r:l=>`மீட்க, தொடர்ந்து இந்த வகுப்புகளில் கலந்து கொள்ளுங்கள்: ${l}.`,k:(r,i)=>`தடுப்புக் காவல் (detention) ஆபத்து: ${r}. ${i}`,none:'மீட்க எதுவும் தேவையில்லை — நீங்கள் சரியான பாதையில் உள்ளீர்கள்.',irr:l=>`மீள முடியாத detention: ${l}.`,help:'மொத்த வருகை, எத்தனை வகுப்புகளைத் தவிர்க்கலாம், detention ஆபத்து பற்றி கேளுங்கள்.'}};
TP.en.lt='Opening the Letters tab — pick Leave or OD, fill the details and open it in Gmail.';TP.hi.lt='Letters टैब खुल रहा है — Leave या OD चुनें और Gmail में खोलें।';TP.ta.lt='Letters தாவல் திறக்கிறது — Leave அல்லது OD தேர்ந்தெடுத்து Gmail-இல் திறக்கவும்.';
let lang='en',recog=null;
function local(q){const a=analyze(),t=TP[lang]||TP.en,rows=a.rows,bad=rows.filter(r=>r.rec>0),irr=rows.filter(r=>r.st==='irr');
  const sk=rows.filter(r=>r.skipTG>0).map(r=>`${r.name}: ${r.skipTG}`).join('; ')||'—';
  if(/letter|\bOD\b|on duty|gmail|email|கடிதம்|पत्र/i.test(q)){document.querySelector('[data-t=ltr]').click();return t.lt}
  if(/tomorrow|today|next class|कल|आज|நாளை/i.test(q)){const dsn=/today|आज/i.test(q)?St.today:add(St.today,1),v=verdict(a,dsn);return v?`${dsn}: ${Object.entries(dayCounts(dsn)).map(([k,n])=>tt().subs[k]+(n>1?' x'+n:'')).join(', ')}. ${VER[v][0]}.`:`${dsn}: no classes.`}
  if(/bunk|skip|miss|leave|holiday|छुट्ट|छोड़|விடுப்|தவிர்/i.test(q))return t.b(a.skips,St.tg,sk);
  if(/recover|attend|need|must|सुधार|ज़रूरी|வேண்டும்|மீட்/i.test(q))return bad.length?t.r(bad.map(r=>`${r.name} ${r.rec}`).join('; ')):t.none;
  if(/risk|detent|danger|जोखिम|डिटेंशन|ஆபத்|தடுப்/i.test(q))return t.k(a.risk,irr.length?t.irr(irr.map(r=>r.name).join(', ')):'');
  if(/help|what can/i.test(q))return t.help;
  const sub=rows.find(r=>norm(r.name).split(' ').filter(w=>w.length>3).some(w=>norm(q).includes(w)));
  if(sub)return`${sub.name}: ${f1(sub.cur)}% (${sub.A}/${sub.T}). `+(sub.skipTG>0?`${t.b(sub.skipTG,St.tg,'')}`:sub.rec?t.r(`${sub.name} ${sub.rec}`):'');
  return t.o(f1(a.ov),rows.filter(r=>r.st!=='safe'&&r.st!=='warn').length,rows.length,a.risk)}
async function llm(q,key){const a=analyze(),ctx={section:St.sec,today:St.today,semesterEnd:END,detentionBelow:St.dt,target:St.tg,overall:f1(a.ov),risk:a.risk,subjects:a.rows.map(r=>({name:r.name,attended:r.A,conducted:r.T,pct:f1(r.cur),left:r.R,mustAttendForDetention:r.nDT,mustAttendForTarget:r.nTG,canSkipAtTarget:r.skipTG,recoverStreak:r.rec,status:r.st}))};
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-5',max_tokens:500,system:`You are AttendGuard, a friendly attendance advisor for a college student. Use only this data and answer in ${LG[lang][2]}, in under 90 words, plain text, no markdown. Data: ${JSON.stringify(ctx)}`,messages:[{role:'user',content:q}]})});
  const j=await r.json();if(!r.ok)throw new Error(j.error&&j.error.message||r.status);return j.content.map(c=>c.text||'').join('')}
function msg(w,t){const d=document.createElement('div');d.className='m '+w;d.textContent=t;$('chat').appendChild(d);$('chat').scrollTop=1e9}
async function ask(q){q=q.trim();if(!q)return;msg('me',q);const key=$('akey').value.trim();let out;
  if(key){try{out=await llm(q,key)}catch(e){out=local(q)+'\n(AI call failed: '+e.message+' — showing built-in answer.)'}}else out=local(q);
  msg('bot',out);if($('spk').checked)speak(out)}
function pickVoice(l,g){const vs=speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().replace('_','-').startsWith(l.slice(0,2).toLowerCase()));
  const F=/\bfemale\b|zira|samantha|heera|priya|veena|kalpana|lekha|susan|hazel|karen|tessa|neerja|swara|pallavi|aria|jenny/i,M=/(?<!fe)male|david|mark|ravi|rishi|hemant|prabhat|madhur|daniel|james|guy|valluvar/i;
  const hit=vs.find(v=>(g==='female'?F:M).test(v.name));return{v:hit||vs[0]||null,exact:!!hit}}
function speak(t){if(!window.speechSynthesis)return;speechSynthesis.cancel();const g=$('gen').value,u=new SpeechSynthesisUtterance(t.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu,''));u.lang=LG[lang][1];
  const p=pickVoice(LG[lang][1],g);if(p.v)u.voice=p.v;if(!p.exact)u.pitch=g==='female'?1.3:0.75;u.rate=+$('rate').value;speechSynthesis.speak(u)}
function mic(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){msg('bot','Speech-to-text is not supported in this browser. Use Chrome or Edge.');return}
  if(recog){recog.stop();return}recog=new SR();recog.lang=LG[lang][1];recog.interimResults=false;
  recog.onresult=e=>ask(e.results[0][0].transcript);recog.onend=()=>{recog=null;$('mic').classList.remove('rec')};recog.onerror=e=>msg('bot','Microphone error: '+e.error);
  $('mic').classList.add('rec');recog.start()}
function renderAI(){if($('chat')){return}
  $('ai').innerHTML=`<div class="card"><h3>AI attendance assistant</h3>
  <div class="row"><label>Language<select id="lang">${Object.entries(LG).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('')}</select></label>
  <label>Voice<select id="gen"><option value="female">Female</option><option value="male">Male</option></select></label>
  <label>Speed<input type="range" id="rate" min="0.7" max="1.3" step="0.1" value="1"></label>
  <label class="fix"><input type="checkbox" id="spk" style="display:inline;width:auto" checked> Speak replies</label></div>
  <div class="chips" id="qs"></div><div class="chat" id="chat"></div>
  <div class="row" style="margin-top:10px"><input id="q" placeholder="Ask: How many classes can I skip?" style="margin:0"><button class="g fix mic" id="mic" title="Speak">🎤 Speak</button><button class="b fix" id="send">Send</button></div>
  <label style="margin-top:12px">Optional: your Anthropic API key (kept in this tab only) — unlocks free-form answers in any language<input type="password" id="akey" placeholder="sk-ant-..." autocomplete="off"></label>
  <p class="note">Without a key the assistant answers built-in questions in English, Hindi and Tamil from your data. Voices depend on your device; Female/Male picks a matching installed voice when one exists.</p></div>`;
  const qs={en:['How is my attendance?','How many classes can I skip?','What must I attend to recover?','What is my detention risk?'],hi:['मेरी उपस्थिति कैसी है?','मैं कितनी कक्षाएँ छोड़ सकता हूँ?','डिटेंशन जोखिम क्या है?'],ta:['என் வருகை எப்படி?','எத்தனை வகுப்புகளைத் தவிர்க்கலாம்?','detention ஆபத்து என்ன?']};
  const chips=()=>{$('qs').innerHTML=(qs[lang]||qs.en).map(x=>`<span class="chip">${x}</span>`).join('');$('qs').querySelectorAll('.chip').forEach(c=>c.onclick=()=>ask(c.textContent))};
  $('lang').onchange=()=>{lang=$('lang').value;chips();if(recog)recog.stop()};$('send').onclick=()=>{ask($('q').value);$('q').value=''};$('q').onkeydown=e=>{if(e.key==='Enter')$('send').click()};$('mic').onclick=mic;chips();
  msg('bot','Hi! I can read your attendance data and tell you how many classes you can skip, what you must attend, and your detention risk. Type or tap 🎤 to speak.');
  if(window.speechSynthesis)speechSynthesis.onvoiceschanged=()=>{}}
renderAI();
