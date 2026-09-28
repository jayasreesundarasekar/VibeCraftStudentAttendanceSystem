'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const START='2026-08-29',END='2026-11-29',DN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const pd=s=>new Date(s+'T12:00:00'),iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const add=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return iso(d)};
const f1=x=>(+x).toFixed(1),sgn=x=>Math.max(0,x);
const St={sec:'III ECE-A',today:iso(new Date()),att:{},leaves:new Set(),hol:new Set(['2026-10-02']),dt:75,tg:90,wn:92,prof:{},store:{},odp:true,custom:{}};
const ST={safe:['Safe','#12a578'],warn:['Watch','#f08c00'],danger:['Below target','#f0603a'],det:['Detention zone','#e03150'],irr:['Irreversible','#a4103f']};
const SAMPLE=[88,93,79,96,84,91,76,90,86,82,94];
const tt=()=>TIMETABLES[St.sec];
const toks=()=>Object.keys(tt().subs).filter(k=>Object.values(tt().days).some(r=>r.split(' ').includes(k)));
function dayCounts(ds){const c={};if(St.hol.has(ds))return c;const r=tt().days[DN[pd(ds).getDay()]];if(r)r.split(' ').forEach(t=>{if(t!=='-')c[t]=(c[t]||0)+1});return c}
function dates(a,b){const o=[];for(let d=a;d<=b;d=add(d,1)){const c=dayCounts(d);if(Object.keys(c).length)o.push({d,c})}return o}
const cnt=(L,k)=>L.reduce((a,x)=>a+(x.c[k]||0),0),tot=x=>Object.values(x.c).reduce((a,b)=>a+b,0);
function initAtt(sample){const past=dates(START,add(St.today,-1));St.att={};toks().forEach((k,i)=>{const c=cnt(past,k);St.att[k]={c,a:Math.round(c*(sample?SAMPLE[i%SAMPLE.length]:100)/100),od:0}})}
function analyze(){
  const from=St.today<START?START:St.today,fut=dates(from,END),tg=St.tg,dt=St.dt,wn=St.wn;
  const rows=toks().map(k=>{const T=St.att[k].c,A=St.att[k].a+(St.odp?(St.att[k].od||0):0),R=cnt(fut,k),F=T+R,cur=T?A/T*100:100;
    const nDT=sgn(Math.ceil(dt/100*F-A-1e-9)),nTG=sgn(Math.ceil(tg/100*F-A-1e-9));
    const skipDT=nDT>R?-1:R-nDT,skipTG=nTG>R?-1:R-nTG;
    const rec=cur<tg&&tg<100?Math.ceil((tg/100*T-A)/(1-tg/100)-1e-9):0;
    let reach=null;if(rec>0){let a=A,t=T;for(const x of fut){const n=x.c[k]||0;if(!n)continue;a+=n;t+=n;if(a/t*100>=tg){reach=x.d;break}}}
    const st=nDT>R?'irr':cur<dt?'det':cur<tg?'danger':cur<wn?'warn':'safe';
    const score=Math.round(Math.max(0,Math.min(1,(cur-dt)/(100-dt)))*100);
    return{k,name:tt().subs[k],T,A,R,cur,nDT,nTG,skipDT,skipTG,rec,reach,st,score}});
  const TA=rows.reduce((a,r)=>a+r.A,0),TT=rows.reduce((a,r)=>a+r.T,0),ov=TT?TA/TT*100:100;
  const has=s=>rows.some(r=>r.st===s),risk=has('irr')?'Irreversible':has('det')?'High':has('danger')?'Medium':has('warn')?'Low':'Minimal';
  return{rows,fut,ov,TA,TT,risk,left:rows.reduce((a,r)=>a+r.R,0),skips:rows.reduce((a,r)=>a+sgn(r.skipTG),0)}}
function daysOff(rows,fut,key){const b={};rows.forEach(r=>b[r.k]=r[key]);const pick=[];
  [...fut].sort((x,y)=>tot(x)-tot(y)||(x.d<y.d?-1:1)).forEach(x=>{if(Object.keys(x.c).every(k=>b[k]>=x.c[k])){Object.keys(x.c).forEach(k=>b[k]-=x.c[k]);pick.push(x.d)}});
  return pick.sort()}
/* ---------- charts ---------- */
function bars(rows){return rows.map(r=>`<div class="brow"><div class="bn">${esc(r.name)}<span class="sc" title="Safety score">${r.score}</span></div><div class="track"><i style="width:${Math.min(100,r.cur)}%;background:${ST[r.st][1]}"></i><u style="left:${St.dt}%"></u><u class="t" style="left:${St.tg}%"></u></div><b>${f1(r.cur)}%</b></div>`).join('')+`<div class="legend"><span>▮ black line = detention ${St.dt}%</span><span style="color:var(--ok)">▮ green line = target ${St.tg}%</span><span>Score = safety (0 at detention line, 100 = perfect)</span></div>`}
function donut(rows){const n=rows.length,keys=Object.keys(ST);let off=0;const C=2*Math.PI*48;
  const arcs=keys.map(k=>{const c=rows.filter(r=>r.st===k).length;if(!c)return'';const l=c/n*C,s=`<circle cx="60" cy="60" r="48" fill="none" stroke="${ST[k][1]}" stroke-width="20" stroke-dasharray="${l} ${C-l}" stroke-dashoffset="${-off}"/>`;off+=l;return s}).join('');
  return`<div class="row"><svg class="fix" width="140" height="140" viewBox="0 0 120 120" style="transform:rotate(-90deg)">${arcs}</svg><div class="fix" style="min-width:150px">${keys.map(k=>`<div><span class="pill" style="background:${ST[k][1]}">${rows.filter(r=>r.st===k).length}</span> ${ST[k][0]}</div>`).join('')}</div></div>`}
function line(a){const W=640,H=250,p=36,L=[['Attend every class','#12a578',1],['Follow leave plan','#5b5bd6',2],['Skip every class from today','#e03150',3]];
  const pts=L.map(()=>[[0,a.TT?a.TA/a.TT*100:100]]);let A=[a.TA,a.TA,a.TA],T=a.TT,i=0;
  a.fut.forEach((x,ix)=>{const n=tot(x);T+=n;A[0]+=n;A[1]+=St.leaves.has(x.d)?0:n;pts.forEach((s,j)=>s.push([ix+1,A[j]/T*100]))});
  const all=pts.flat().map(q=>q[1]),lo=Math.floor(Math.min(...all,St.dt)/5)*5-5,hi=100,N=Math.max(1,a.fut.length);
  const X=v=>p+v/N*(W-2*p),Y=v=>H-p-(v-lo)/(hi-lo)*(H-2*p);
  const ln=(v,c)=>`<line x1="${p}" x2="${W-p}" y1="${Y(v)}" y2="${Y(v)}" stroke="${c}" stroke-dasharray="5 4"/><text x="${W-p+3}" y="${Y(v)+4}" font-size="10" fill="${c}">${v}%</text>`;
  const grid=[0,1,2,3,4].map(g=>{const v=lo+(hi-lo)*g/4;return`<text x="4" y="${Y(v)+4}" font-size="10" fill="#66708f">${Math.round(v)}</text>`}).join('');
  return`<svg viewBox="0 0 ${W} ${H}" width="100%">${grid}${ln(St.dt,'#e03150')}${ln(St.tg,'#12a578')}${pts.map((s,j)=>`<polyline fill="none" stroke="${L[j][1]}" stroke-width="3" stroke-linejoin="round" points="${s.map(q=>X(q[0])+','+Y(q[1])).join(' ')}"/>`).join('')}<text x="${p}" y="${H-8}" font-size="10" fill="#66708f">${a.fut[0]?a.fut[0].d:''}</text><text x="${W-p-52}" y="${H-8}" font-size="10" fill="#66708f">${END}</text></svg><div class="legend">${L.map(l=>`<span style="color:${l[1]}">● ${l[0]}</span>`).join('')}</div>`}
/* ---------- tabs ---------- */
function renderDash(){const a=analyze(),{rows}=a,irr=rows.filter(r=>r.st==='irr'),bad=rows.filter(r=>r.st==='det'||r.st==='danger');
  const d90=daysOff(rows,a.fut,'skipTG').length,d75=daysOff(rows,a.fut,'skipDT').length;let h=toolbar();
  if(irr.length)h+=`<div class="alert irr"><span>🚨</span><div><b>IRREVERSIBLE DETENTION — ${irr.map(r=>esc(r.name)).join(', ')}</b><br>Even attending every remaining class, you cannot reach ${St.dt}% by 29 Nov 2026.</div></div>`;
  if(bad.length)h+=`<div class="alert am"><span>⚠️</span><div>Below your ${St.tg}% target: ${bad.map(r=>esc(r.name)).join(', ')}. See the recovery analysis below.</div></div>`;
  else if(!irr.length)h+=`<div class="alert gn"><span>✅</span><div>All subjects are at or above target. Use the leave planner to spend your safe buffer wisely.</div></div>`;
  h+=`<div class="kpis"><div class="kpi k1"><small>Overall attendance</small><div class="kv">${f1(a.ov)}%</div><small>${a.TA}/${a.TT} classes</small></div>
  <div class="kpi ${a.risk==='Minimal'||a.risk==='Low'?'k2':'k3'}"><small>Detention risk</small><div class="kv">${a.risk}</div><small>${bad.length+irr.length} of ${rows.length} subjects at risk</small></div>
  <div class="kpi k2"><small>Safe skips left</small><div class="kv">${a.skips}</div><small>while finishing ≥ ${St.tg}%</small></div>
  <div class="kpi k4"><small>Classes left</small><div class="kv">${a.left}</div><small>till 29 Nov 2026</small></div>
  <div class="kpi k5"><small>Full days off possible</small><div class="kv">${d90}</div><small>${d75} if you only need ${St.dt}%</small></div></div>`;
  h+=`<div class="two"><div class="card"><h3>Subject-wise attendance &amp; safety score</h3>${bars(rows)}</div><div class="card"><h3>Status mix</h3>${donut(rows)}<h3 style="margin-top:14px">Attendance forecast (overall)</h3>${line(a)}</div></div>`;
  h+=`<div class="card"><h3>Detailed analysis</h3><div class="scroll"><table><tr><th>Subject</th><th>Now</th><th>Left</th><th>Must attend ≥${St.dt}%</th><th>Must attend ≥${St.tg}%</th><th>Can skip (${St.tg}%)</th><th>Can skip (${St.dt}%)</th><th>Status</th></tr>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td><b>${f1(r.cur)}%</b></td><td>${r.R}</td><td>${r.nDT>r.R?'Impossible':r.nDT}</td><td>${r.nTG>r.R?'Not reachable':r.nTG}</td><td>${sgn(r.skipTG)}</td><td>${sgn(r.skipDT)}</td><td><span class="pill" style="background:${ST[r.st][1]}">${ST[r.st][0]}</span></td></tr>`).join('')}</table></div></div>`;
  const an=rows.filter(r=>r.rec>0);
  h+=`<div class="card"><h3>Recovery analysis (subjects below ${St.tg}%)</h3>${an.length?`<ul class="an">${an.map(r=>`<li><b>${esc(r.name)}</b> — ${f1(r.cur)}%. Attend the next <b>${r.rec}</b> classes in a row to return to ${St.tg}%${r.reach?` (about <b>${r.reach}</b> if you attend all)`:' — not possible before semester end'}. Of the ${r.R} classes left, attend at least <b>${r.nTG>r.R?'all, but it is still not enough':r.nTG}</b> to finish above target.${r.st==='det'||r.st==='irr'?' <b>Skipping more will put you in detention.</b>':''}</li>`).join('')}</ul>`:'<p class="note">Nothing to recover. Every subject is at or above target.</p>'}</div>`;
  h+=outlookHTML(a)+priorityHTML(a);$('dash').innerHTML=h;bindToolbar()}
const pctOf=o=>o.c?(o.a+(St.odp?o.od||0:0))/o.c*100:100;
function renderAtt(){const h=`<div class="two"><div class="card"><h3>Upload your attendance report</h3><div class="drop" id="drop"><p><b>Drop your attendance PDF (or CSV) here</b></p><input type="file" id="file" accept=".pdf,.csv,.txt"><p class="note">Each subject line should contain its name plus conducted and attended counts. Anything that can't be read is left for you to edit below. Your file is processed in your browser and never uploaded.</p></div><div class="log" id="log"></div>
  <div class="row" style="margin-top:12px"><button class="g" id="samp">Load sample attendance</button><button class="g" id="est">Assume 100% attendance so far</button></div></div>
  <div class="card"><h3>Percentage calculator</h3><div class="row"><label>Attended<input type="number" id="ca" value="38" min="0"></label><label>Conducted<input type="number" id="cc" value="43" min="1"></label></div><div id="cr" style="margin-top:12px"></div></div></div>
  <div class="card"><h3>Your subjects (edit any value)</h3><div class="scroll"><table><tr><th>Subject</th><th>Conducted</th><th>Attended</th><th title="On-duty classes, counted as present when enabled in Settings">OD</th><th>%</th></tr>${toks().map(k=>`<tr><td>${esc(tt().subs[k])}</td><td><input type="number" min="0" data-k="${k}" data-f="c" value="${St.att[k].c}"></td><td><input type="number" min="0" data-k="${k}" data-f="a" value="${St.att[k].a}"></td><td><input type="number" min="0" data-k="${k}" data-f="od" value="${St.att[k].od||0}"></td><td id="p_${k}"><b>${f1(pctOf(St.att[k]))}%</b></td></tr>`).join('')}</table></div></div>`;
  $('att').innerHTML=h;
  $('att').querySelectorAll('td input').forEach(i=>i.oninput=()=>{const o=St.att[i.dataset.k];o[i.dataset.f]=Math.max(0,+i.value||0);$('p_'+i.dataset.k).innerHTML=`<b>${f1(pctOf(o))}%</b>`;refresh(['dash','plan','cal'])});
  $('samp').onclick=()=>{initAtt(true);renderAll()};$('est').onclick=()=>{initAtt(false);renderAll()};
  const calc=()=>{const A=+$('ca').value,C=+$('cc').value,t=St.tg/100;if(!C||A>C){$('cr').innerHTML='<p class="note">Enter attended ≤ conducted.</p>';return}
    const p=A/C*100,can=Math.floor(A/t-C+1e-9),need=Math.ceil((t*C-A)/(1-t)-1e-9);
    $('cr').innerHTML=`<div class="kv" style="font-size:34px">${f1(p)}%</div>`+(p>=St.tg?`<p>You can miss <b>${sgn(can)}</b> more class(es) and stay ≥ ${St.tg}%. Missing ${sgn(can)+1} would drop you below.</p>`:`<p>Attend the next <b>${need}</b> class(es) in a row to reach ${St.tg}%.</p>`)};
  $('ca').oninput=$('cc').oninput=calc;calc();
  const dr=$('drop');dr.ondragover=e=>{e.preventDefault();dr.classList.add('on')};dr.ondragleave=()=>dr.classList.remove('on');dr.ondrop=e=>{e.preventDefault();dr.classList.remove('on');handleFile(e.dataTransfer.files[0])};$('file').onchange=e=>handleFile(e.target.files[0])}
function renderPlan(){const a=analyze(),{rows}=a,miss={};
  St.leaves.forEach(d=>{if(d>=(St.today<START?START:St.today)){const c=dayCounts(d);for(const k in c)miss[k]=(miss[k]||0)+c[k]}});
  const res=rows.map(r=>{const m=miss[r.k]||0,fin=(r.A+r.R-m)/(r.T+r.R)*100,now=r.T?r.A/r.T*100:100;return{...r,m,fin,st2:fin<St.dt?'det':fin<St.tg?'danger':fin<St.wn?'warn':'safe'}});
  const hurt=res.filter(r=>r.m&&r.fin<St.tg),d90=daysOff(rows,a.fut,'skipTG'),d75=daysOff(rows,a.fut,'skipDT');
  let h=`<div class="two"><div class="card"><h3>Plan your leave</h3><div class="row"><label>From<input type="date" id="lf" value="${St.today}"></label><label>To<input type="date" id="lt" value="${St.today}"></label></div><div class="row" style="margin-top:10px"><button class="b fix" id="ladd">Add leave days</button><button class="g fix" id="lclr">Clear</button></div>
  <div class="chips">${[...St.leaves].sort().map(d=>`<span class="chip" data-d="${d}" title="Remove">${d} ✕</span>`).join('')||'<span class="note">No leave planned yet.</span>'}</div>
  ${hurt.length?`<div class="alert am"><span>⚠️</span><div>This plan pushes ${hurt.map(r=>esc(r.name)).join(', ')} below ${St.tg}%${res.some(r=>r.st2==='det'&&r.m)?' — <b>and into the detention zone</b>':''}.</div></div>`:St.leaves.size?'<div class="alert gn"><span>✅</span><div>Your plan keeps every subject at or above target (assuming you attend all other classes).</div></div>':''}</div>
  <div class="card"><h3>Days off you can afford</h3><div class="kv" style="font-size:38px">${d90.length}</div><p>full class days you can skip and still finish every subject ≥ ${St.tg}%.</p><p><b>${d75.length}</b> days if you only need to avoid detention (${St.dt}%).</p><p class="note">Lightest days first: ${d90.slice(0,8).join(', ')||'none'}</p>${d90.length?'<button class="g" id="lsug">Add these to my plan</button>':''}</div></div>
  <div class="card"><h3>Impact on each subject</h3><div class="scroll"><table><tr><th>Subject</th><th>Now</th><th>Classes missed</th><th>Final if plan followed</th><th>Result</th></tr>${res.map(r=>`<tr><td>${esc(r.name)}</td><td>${f1(r.cur)}%</td><td>${r.m}</td><td><b>${f1(r.fin)}%</b></td><td><span class="pill" style="background:${ST[r.st2][1]}">${ST[r.st2][0]}</span></td></tr>`).join('')}</table></div></div>
  <div class="card"><h3>What if I miss N classes of one subject?</h3><div class="row"><label>Subject<select id="ws">${rows.map(r=>`<option value="${r.k}">${esc(r.name)}</option>`).join('')}</select></label><label>Classes<input type="number" id="wn2" value="3" min="0"></label></div><div id="wr" style="margin-top:10px"></div></div>`;
  $('plan').innerHTML=h;
  $('ladd').onclick=()=>{let f=$('lf').value,t=$('lt').value||f;if(!f)return;for(let d=f;d<=t&&d<=END;d=add(d,1))St.leaves.add(d);renderPlan()};
  $('lclr').onclick=()=>{St.leaves.clear();renderPlan()};$('plan').querySelectorAll('.chip').forEach(c=>c.onclick=()=>{St.leaves.delete(c.dataset.d);renderPlan()});
  if($('lsug'))$('lsug').onclick=()=>{d90.forEach(d=>St.leaves.add(d));renderPlan()};
  const wi=()=>{const r=rows.find(x=>x.k===$('ws').value)||rows[0],n=+$('wn2').value||0,now=r.cur,fin=(r.A+r.R-Math.min(n,r.R))/(r.T+r.R)*100,aft=r.T?r.A/(r.T+n)*100:100;
    $('wr').innerHTML=`<p>Missing <b>${n}</b> more ${esc(r.name)} class(es): attendance goes from <b>${f1(now)}%</b> to <b>${f1(aft)}%</b> right away, and you would finish the semester at <b>${f1(fin)}%</b> (if you attend the rest). ${fin<St.dt?'<b style="color:var(--det)">That is detention territory.</b>':fin<St.tg?'<b style="color:var(--dn)">Below your target.</b>':'<b style="color:var(--ok)">Still safe.</b>'}</p>`};
  $('ws').onchange=$('wn2').oninput=wi;wi()}
const R={dash:()=>renderDash(),att:()=>renderAtt(),plan:()=>renderPlan(),cal:()=>renderCal(),ltr:()=>renderLet(),cfg:()=>renderSet()};
function refresh(l){l.forEach(t=>R[t]());save()}
function renderAll(){refresh(['dash','cal','att','plan']);if(window.renderAI)renderAI()}
/* ---------- attendance file import ---------- */
const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,' ');
async function handleFile(f){if(!f)return;const log=$('log');log.textContent='Reading '+f.name+' …';let text='';
  try{if(/\.pdf$/i.test(f.name)){if(!window.pdfjsLib)throw new Error('PDF reader could not load (check internet). Try CSV or edit the table by hand.');
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;
      for(let p=1;p<=pdf.numPages;p++){const c=await(await pdf.getPage(p)).getTextContent(),rows={};c.items.forEach(i=>{const y=Math.round(i.transform[5]/3);(rows[y]=rows[y]||[]).push([i.transform[4],i.str])});
        Object.keys(rows).sort((a,b)=>b-a).forEach(y=>{text+=rows[y].sort((a,b)=>a[0]-b[0]).map(x=>x[1]).join(' ')+'\n'})}}
    else text=await f.text();
    const r=parseAttendance(text);log.textContent=`Matched ${r.matched} subject(s) from ${f.name}.`+(r.miss.length?'\nCould not match: '+r.miss.join(' | '):'')+(r.matched?'':'\nNo subject rows found — enter values in the table below.');
    renderAll()}catch(e){log.textContent='Could not read file: '+e.message}}
function parseAttendance(text){let matched=0;const miss=[],seen=new Set();
  text.split(/\r?\n/).forEach(line=>{const nm=norm(line),nums=(line.match(/\d+(?:\.\d+)?/g)||[]).map(Number);if(nums.length<2)return;
    let best=null,bs=0;toks().forEach(k=>{const w=norm(tt().subs[k]).split(' ').filter(x=>x.length>3);if(!w.length)return;const s=w.filter(x=>nm.includes(x)).length/w.length;if(s>bs){bs=s;best=k}});
    if(!best||bs<0.6){if(miss.length<4&&/[a-z]{4}/i.test(line))miss.push(line.trim().slice(0,50));return}
    const ints=nums.filter(Number.isInteger);let c=null,a=null;
    for(let i=0;i+2<ints.length&&c===null;i++)if(ints[i]===ints[i+1]+ints[i+2]&&ints[i]>0){c=ints[i];a=ints[i+1]}
    for(let i=0;i+1<ints.length&&c===null;i++)if(ints[i]>=ints[i+1]&&ints[i]<=400){const p=nums.find(n=>n<=100&&!Number.isInteger(n));if(p===undefined||Math.abs(ints[i+1]/ints[i]*100-p)<1.5){c=ints[i];a=ints[i+1]}}
    if(c!==null&&!seen.has(best)){St.att[best]={c,a,od:(St.att[best]||{}).od||0};seen.add(best);matched++}});
  return{matched,miss}}
/* ---------- boot ---------- */
function fillSecs(){$('sec').innerHTML=Object.keys(TIMETABLES).map(x=>`<option>${esc(x)}</option>`).join('');$('sec').value=St.sec}
function bind(){fillSecs();$('today').value=St.today;$('dt').value=St.dt;$('tg').value=St.tg;$('wn').value=St.wn;$('hol').value=[...St.hol].join(', ');
  $('sec').onchange=()=>{St.store[St.sec]=St.att;St.sec=$('sec').value;St.leaves.clear();St.att=St.store[St.sec]||{};if(!toks().every(k=>St.att[k]))initAtt(true);renderAll();renderLet()};
  $('today').onchange=()=>{St.today=$('today').value||iso(new Date());renderAll()};
  ['dt','tg','wn'].forEach(id=>$(id).onchange=()=>{St[id]=Math.min(100,Math.max(1,+$(id).value||St[id]));renderAll()});
  $('hol').onchange=()=>{St.hol=new Set($('hol').value.split(',').map(x=>x.trim()).filter(Boolean));renderAll()};
  document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x===b));document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.id===b.dataset.t));window.scrollTo(0,0)})}
