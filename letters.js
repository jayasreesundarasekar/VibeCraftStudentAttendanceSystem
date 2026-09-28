'use strict';
const RC={hod:'The Head of the Department',adv:'The Class Advisor',dean:'The Dean, Faculty of Engineering and Technology',dir:'The Director',fc:'The Faculty Coordinator'};
const LT={
 leave_med:['Leave','Medical / sick leave','Request for medical leave','I am suffering from {r|fever and body pain} and the doctor has advised me to take rest. Hence, I will not be able to attend classes {w}.','medical certificate'],
 leave_per:['Leave','Personal work','Request for leave','I have an urgent personal matter ({r|personal work}) that needs my presence, due to which I will not be able to attend classes {w}.','letter from my parent/guardian'],
 leave_fam:['Leave','Family function','Request for leave to attend a family function','I need to attend {r|a family function} at my hometown, due to which I will not be able to attend classes {w}.','letter from my parent/guardian'],
 leave_emg:['Leave','Family emergency','Request for leave due to a family emergency','Owing to a family emergency ({r|urgent family matter}), I have to travel home immediately and will not be able to attend classes {w}.','letter from my parent/guardian'],
 leave_ber:['Leave','Bereavement','Request for leave due to bereavement','Owing to the demise of {r|a close family member} in my family, I will not be able to attend classes {w}.','letter from my parent/guardian'],
 od_hack:['On Duty (OD)','Hackathon / technical event','','I would like to inform you that I have registered to participate in {e|a hackathon / technical event}{o}{v}, scheduled {w}.','participation certificate'],
 od_pap:['On Duty (OD)','Paper / project presentation','','I have been selected to present my work at {e|a conference / symposium}{o}{v}, scheduled {w}.','participation certificate'],
 od_spo:['On Duty (OD)','Sports event','','I have been selected to represent the college in {e|an inter-college sports event}{o}{v}, scheduled {w}.','participation certificate'],
 od_cul:['On Duty (OD)','Cultural event','','I have been selected to represent the college in {e|an inter-college cultural event}{o}{v}, scheduled {w}.','participation certificate'],
 od_soc:['On Duty (OD)','NSS / NCC / social service','','I have been assigned to take part in {e|an NSS / NCC / social outreach programme}{o}{v}, scheduled {w}.','attendance certificate'],
 od_pla:['On Duty (OD)','Placement / interview','','I have been shortlisted to attend {e|a placement / interview process}{o}{v}, scheduled {w}.','call letter and attendance proof'],
 od_prj:['On Duty (OD)','Project review / research work','','I need to attend {e|a project review / research activity}{o}{v}, scheduled {w}.','faculty guide\'s confirmation']};
const dOf=()=>/BME|Biotech/i.test(St.sec)?'Biomedical Engineering':'Electronics and Communication Engineering';
const yOf=()=>{const y=St.sec.split(' ')[0];return({I:'I',II:'II',III:'III',IV:'IV'}[y]||y)+' Year'};
function build(){const g=id=>($(id)?$(id).value.trim():''),t=LT[g('lt')]||LT.leave_med,od=t[0].startsWith('On'),f=g('lf')||St.today,to=g('ltt')||f,days=Math.round((pd(to)-pd(f))/864e5)+1;
  const when=days>1?`from ${fd(f)} to ${fd(to)} (${days} days)`:`on ${fd(f)}`;
  const para=t[3].replace(/\{r\|([^}]*)\}/,(m,d)=>g('lr')||d).replace(/\{e\|([^}]*)\}/,(m,d)=>g('le')||d).replace('{o}',g('lo')?`, organised by ${g('lo')}`:'').replace('{v}',g('lv')?` at ${g('lv')}`:'').replace('{w}',when);
  const subj=od?`Request for On Duty (OD) permission – ${g('le')||t[1]} (${when.replace(/ \(\d+ days\)/,'')})`:`${t[2]} (${when.replace(/ \(\d+ days\)/,'')})`;
  const doc=g('ld')||t[4];let imp='';
  if(g('li')==='1'){const a=analyze(),m={};dates(f<St.today?St.today:f,to).forEach(x=>{for(const k in x.c)m[k]=(m[k]||0)+x.c[k]});const mt=Object.values(m).reduce((p,q)=>p+q,0);
    if(mt)imp=`\nAs per the timetable, I will miss ${mt} class period(s) during this time (${Object.entries(m).map(([k,n])=>`${tt().subs[k]}: ${n}`).join('; ')}). My current overall attendance is ${f1(a.ov)}%, and I will attend all other classes to keep it above the required limit.\n`}
  const close=od?`As this opportunity supports my academic and professional growth, I kindly request you to grant me On Duty (OD) permission for the above period. I will submit the ${doc} on my return and complete any missed coursework.`:`I kindly request you to grant me leave for the above period. I will complete the missed lessons and assignments, and I will submit the ${doc} on my return.`;
  const P=St.prof,dept=g('lpd')||dOf(),rc=RC[g('lrc')];
  const body=`From,\n${g('lpn')||'[Your name]'}\nRegister No.: ${g('lpr')||'[Register number]'}\n${g('lpy')||yOf()+' / '+St.sec}, Department of ${dept}\nSRM Institute of Science and Technology, Tiruchirappalli\n${g('lpe')?'Email: '+g('lpe')+'\n':''}\nDate: ${fd(St.today)}\n\nTo,\n${rc}${g('lrn')?' ('+g('lrn')+')':''}\nDepartment of ${dept}\nSRM Institute of Science and Technology, Tiruchirappalli\n\nSubject: ${subj}\n\nRespected Sir/Madam,\n\n${para}${imp}\n${close}\n\nThanking you,\n\nYours obediently,\n${g('lpn')||'[Your name]'}\n(${g('lpr')||'Register number'})`;
  return{subj,body}}
function renderLet(){const P=St.prof,v=k=>esc(P[k]||'');
  const opts=['Leave','On Duty (OD)'].map(gp=>`<optgroup label="${gp} letters">${Object.entries(LT).filter(([k,t])=>t[0]===gp).map(([k,t])=>`<option value="${k}">${t[1]}</option>`).join('')}</optgroup>`).join('');
  const first=[...St.leaves].sort()[0]||add(St.today,1),last=[...St.leaves].sort().pop()||first;
  $('ltr').innerHTML=`<div class="two"><div class="card"><h3>Letter details</h3><div class="row"><label>Letter type<select id="lt">${opts}</select></label><label>Addressed to<select id="lrc">${Object.entries(RC).map(([k,x])=>`<option value="${k}">${x.replace('The ','')}</option>`).join('')}</select></label></div>
  <div class="row" style="margin-top:10px"><label>From date<input type="date" id="lf" value="${first}"></label><label>To date<input type="date" id="ltt" value="${last}"></label></div>
  <div class="row" style="margin-top:10px"><label>Event / occasion<input id="le" placeholder="e.g. Smart India Hackathon"></label><label>Organiser / institution<input id="lo" placeholder="e.g. IIT Madras"></label></div>
  <div class="row" style="margin-top:10px"><label>Venue / city<input id="lv"></label><label>Reason / details (leave)<input id="lr" placeholder="e.g. viral fever"></label></div>
  <label style="margin-top:10px">Supporting document you will submit<input id="ld" placeholder="medical certificate / participation certificate"></label>
  <label class="tgl" style="margin-top:10px"><input type="checkbox" id="li" value="1"> Add my attendance impact paragraph</label></div>
  <div class="card"><h3>About you</h3><div class="row"><label>Full name<input id="lpn" data-p="name" value="${v('name')}"></label><label>Register no.<input id="lpr" data-p="reg" value="${v('reg')}"></label></div>
  <div class="row" style="margin-top:10px"><label>Year / section<input id="lpy" data-p="yr" value="${v('yr')}" placeholder="${yOf()} / ${esc(St.sec)}"></label><label>Department<input id="lpd" data-p="dept" value="${v('dept')}" placeholder="${dOf()}"></label></div>
  <div class="row" style="margin-top:10px"><label>Your email<input id="lpe" data-p="email" value="${v('email')}"></label><label>Recipient name (optional)<input id="lrn" data-p="rname" value="${v('rname')}"></label></div>
  <div class="row" style="margin-top:10px"><label>Recipient email (To)<input id="lto" data-p="rmail" value="${v('rmail')}"></label><label>CC<input id="lcc" data-p="cc" value="${v('cc')}"></label></div></div></div>
  <div class="card"><h3>Your letter (editable)</h3><label>Subject<input id="lsu"></label><label style="margin-top:10px">Body<textarea id="lbd" class="letter"></textarea></label>
  <div class="row" style="margin-top:12px"><button class="b fix" id="lgm">✉ Open in Gmail</button><button class="g fix" id="lml">Open mail app</button><button class="g fix" id="lcp">Copy</button><button class="g fix" id="ltx">Download .txt</button><button class="g fix" id="ldc">Download .doc</button><button class="g fix" id="lpr2">Print / Save as PDF</button></div>
  <p class="note">Gmail opens a ready-to-send draft in a new tab (you must be signed in). Attach your certificate or invitation there before sending. Editing the fields above rewrites the letter; edit the text last.</p></div>`;
  const gen=()=>{const r=build();$('lsu').value=r.subj;$('lbd').value=r.body};
  $('ltr').querySelectorAll('input,select').forEach(e=>{if(e.id==='lsu')return;e.oninput=e.onchange=()=>{if(e.dataset.p){St.prof[e.dataset.p]=e.value;save()}
    if(e.id==='li')e.value=e.checked?'1':'0';gen()}});
  $('li').value='';$('li').onchange=()=>{$('li').value=$('li').checked?'1':'';gen()};gen();
  const mail=()=>gmail($('lto').value,$('lsu').value,$('lbd').value,$('lcc').value);
  $('lgm').onclick=()=>{if($('lbd').value.length>6000)alert('This letter is long; if Gmail cuts it off, use Copy instead.');mail()};
  $('lml').onclick=()=>{location.href=`mailto:${encodeURIComponent($('lto').value)}?cc=${encodeURIComponent($('lcc').value)}&subject=${encodeURIComponent($('lsu').value)}&body=${encodeURIComponent($('lbd').value)}`};
  $('lcp').onclick=async()=>{try{await navigator.clipboard.writeText($('lsu').value+'\n\n'+$('lbd').value);$('lcp').textContent='Copied ✓'}catch(e){$('lbd').select();document.execCommand('copy')}setTimeout(()=>$('lcp').textContent='Copy',1500)};
  $('ltx').onclick=()=>dl('letter.txt',$('lsu').value+'\n\n'+$('lbd').value);
  $('ldc').onclick=()=>dl('letter.doc',`<html><body style="font-family:'Times New Roman';font-size:12pt"><p><b>Subject: ${esc($('lsu').value)}</b></p><pre style="font:inherit;white-space:pre-wrap">${esc($('lbd').value)}</pre></body></html>`,'application/msword');
  $('lpr2').onclick=()=>{const w=window.open('','_blank');if(!w){alert('Allow pop-ups to print');return}w.document.write(`<pre style="font:13pt/1.6 Georgia,serif;white-space:pre-wrap;max-width:700px;margin:40px auto">${esc($('lbd').value)}</pre>`);w.document.close();w.print()}}
