
let COURSE=null, CUR=1, PASS=0.7, FINAL=0;

document.addEventListener('DOMContentLoaded', init);

async function init(){
  COURSE = await (await fetch('course.json')).json();
  buildTOC();
  CUR = Math.max(1, Math.min(+localStorage.getItem('cur')||1, 16));
  render(CUR); progressUI(); matrix(); footer();
}

function buildTOC(){
  const t=document.getElementById('toc'); t.innerHTML='';
  COURSE.weeks.forEach(w=>{
    const h=document.createElement('h3'); h.textContent=w.title; t.appendChild(h);
    w.lessons.forEach(l=>{
      const b=document.createElement('button'); b.textContent=`${l.id}. ${l.title}`;
      b.onclick=()=>render(l.id); t.appendChild(b);
    });
  });
}

function get(id){ for(const w of COURSE.weeks){ for(const l of w.lessons){ if(l.id===id) return l; } } }

function render(id){
  const l=get(id); if(!l) return; CUR=id; localStorage.setItem('cur',id);
  document.querySelectorAll('.toc button').forEach(b=>b.classList.toggle('active', b.textContent.startsWith(id+'. ')));
  const el=document.getElementById('lesson'); el.innerHTML='';
  el.innerHTML+=`<h2>${l.title}</h2><div class="badges"><span>⏱️ ${l.duration_min} мин</span><span>🧩 ${l.quiz.length} вопросов</span><span>❤ Лайков: <b id="likesForLesson">0</b></span></div>`;
  el.innerHTML+=`<div class="card"><h3>Лекция</h3><ol class="steps"><li>Изучи теорию</li><li>Повтори код</li><li>Сделай практику</li><li>Пройди тест ≥70%</li></ol></div>`;
  el.innerHTML+=`<div class="card"><h3>Теория</h3>${l.theory.map(p=>`<p>${esc(p)}</p>`).join('')}</div>`;
  if(l.code){ el.innerHTML+=`<div class="card"><h3>Примеры кода</h3>${Object.entries(l.code).map(([k,v])=>`<h4>${k.toUpperCase()}</h4><pre><code>${esc(v)}</code></pre>`).join('')}</div>`; }
  el.innerHTML+=`<div class="card"><h3>Практика</h3><p>${esc(l.task)}</p></div>`;
  el.innerHTML+=`<div class="card quiz"><h3>Тест</h3>${l.quiz.map((q,i)=>qHTML(l.id,i,q)).join('')}<button class="btn" id="check">Проверить</button><div class="result" id="res"></div></div>`;
  document.getElementById('check').onclick=()=>check(l);
  likeInit(); navInit(); progressUI(); window.scrollTo({top:0,behavior:'smooth'});
}

function qHTML(id,i,q){ const n=`q_${id}_${i}`; return `<div class="q"><div><b>${i+1}.</b> ${esc(q.q)}</div>${q.options.map((o,j)=>`<label><input type="radio" name="${n}" value="${j}"> ${esc(o)}</label>`).join('')}</div>`; }

function check(l){
  const t=l.quiz.length; let ok=0;
  l.quiz.forEach((q,i)=>{ const s=document.querySelector(`input[name="q_${l.id}_${i}"]:checked`); if(s && +s.value===q.answer) ok++; });
  const sc=ok/t; const pass=sc>=(COURSE.meta?.pass_threshold||PASS);
  document.getElementById('res').textContent=`Результат: ${ok}/${t} • ${Math.round(sc*100)}% • ${pass?'Пройдено ✅':'Недостаточно ❌'}`;
  if(pass){ mark(l.id); progressUI(); if(l.id===16){ FINAL=sc; document.getElementById('showCertBtn').classList.remove('hidden'); setTimeout(showCert,700);} else setTimeout(next,900); }
}

function mark(id){ const p=JSON.parse(localStorage.getItem('passed')||'[]'); if(!p.includes(id)){p.push(id); localStorage.setItem('passed',JSON.stringify(p));} }

function next(){ const n=Math.min(16,CUR+1); const p=JSON.parse(localStorage.getItem('passed')||'[]'); if(!p.includes(CUR)){alert('Сначала пройди тест (≥70%).'); return;} render(n); }
function prev(){ if(CUR>1) render(CUR-1); }

function likeInit(){
  const likes=JSON.parse(localStorage.getItem('likes')||'{}'); const c=likes[CUR]||0;
  document.getElementById('likeCount').textContent=c;
  const lfl=document.getElementById('likesForLesson'); if(lfl) lfl.textContent=c;
  document.getElementById('likeBtn').onclick=()=>{ const likes=JSON.parse(localStorage.getItem('likes')||'{}'); likes[CUR]=(likes[CUR]||0)+1; localStorage.setItem('likes',JSON.stringify(likes)); document.getElementById('likeCount').textContent=likes[CUR]; if(lfl) lfl.textContent=likes[CUR];};
}

function navInit(){ document.getElementById('prevBtn').onclick=prev; document.getElementById('nextBtn').onclick=next; }

function progressUI(){ const p=JSON.parse(localStorage.getItem('passed')||'[]').length; const pct=Math.round((p/16)*100); document.getElementById('progressBar').style.width=pct+'%'; document.getElementById('progressText').textContent='Прогресс: '+pct+'%'; }

function esc(s){ return String(s).replace(/[&<>"]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

function matrix(){ const c=document.getElementById('matrix'),x=c.getContext('2d'); const r=()=>{c.width=innerWidth;c.height=innerHeight}; r(); addEventListener('resize',r); const a='アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const f=14; let cols=Math.floor(c.width/f); let d=Array(cols).fill(1); (function draw(){ x.fillStyle='rgba(10,15,31,0.08)'; x.fillRect(0,0,c.width,c.height); x.fillStyle='#6ae0ff'; x.font=f+'px monospace'; for(let i=0;i<d.length;i++){ const t=a[Math.floor(Math.random()*a.length)]; x.fillText(t,i*f,d[i]*f); if(d[i]*f>c.height && Math.random()>0.975) d[i]=0; d[i]++; } requestAnimationFrame(draw); })(); }

// Certificate
function showCert(){ const v=document.getElementById('certificateView'); v.classList.remove('hidden'); document.getElementById('certDate').textContent=new Date().toLocaleDateString('ru-RU'); document.getElementById('certScore').textContent=Math.round(FINAL*100)+'%'; const id='KOSMOS-'+Math.random().toString(36).slice(2,8).toUpperCase(); localStorage.setItem('certId',id); document.getElementById('certId').textContent=id; }
function hideCert(){ document.getElementById('certificateView').classList.add('hidden'); }

function footer(){
  document.getElementById('arcadeBtn').onclick=()=>document.getElementById('arcadeModal').classList.remove('hidden');
  document.getElementById('arcadeClose').onclick=()=>document.getElementById('arcadeModal').classList.add('hidden');
  document.getElementById('showCertBtn').onclick=showCert;
  document.getElementById('backToCourse').onclick=hideCert;
  document.getElementById('savePDF').onclick=()=>window.print();
  // games
  document.getElementById('startSpeed').onclick=startSpeed;
  document.getElementById('startTF').onclick=startTF;
}

function startSpeed(){
  const bank=[
    {q:'HTML отвечает за структуру.',a:true},{q:'CSS — язык программирования.',a:false},
    {q:'Flexbox выравнивает элементы.',a:true},{q:'HTTP 200 — успешный ответ.',a:true},
    {q:'querySelectorAll возвращает один элемент.',a:false},{q:'Git commit сохраняет изменения.',a:true}
  ];
  let t=60, s=0, i=0; const box=document.getElementById('speedGame');
  box.innerHTML=`<div class="q"><b>Осталось: <span id="t">60</span>с</b> • Счёт: <span id="s">0</span></div><div id="q"></div><div><button class="btn" id="y">Верно</button> <button class="btn ghost" id="n">Неверно</button></div>`;
  const tEl=document.getElementById('t'), sEl=document.getElementById('s'), qEl=document.getElementById('q');
  function next(){ const it=bank[(i++)%bank.length]; qEl.textContent=it.q; document.getElementById('y').onclick=()=>{ if(it.a) s++; sEl.textContent=s; next(); }; document.getElementById('n').onclick=()=>{ if(!it.a) s++; sEl.textContent=s; next(); }; }
  next(); const timer=setInterval(()=>{ t--; tEl.textContent=t; if(t<=0){ clearInterval(timer); box.innerHTML=`<div class="q"><b>Финиш!</b> Счёт: ${s}</div>`; } },1000);
}
function startTF(){
  const deck=[
    {q:'Тег <img> требует alt.',a:true},{q:'justify-content — поперечная ось.',a:false},
    {q:'for...of удобен для массивов.',a:true},{q:'preventDefault отменяет действие.',a:true},{q:'GitHub Pages — это БД.',a:false}
  ];
  let i=0, s=0; const box=document.getElementById('tfGame');
  function show(){ if(i>=deck.length){ box.innerHTML=`<div class="q"><b>Итог:</b> ${s}/${deck.length}</div>`; return; } const it=deck[i++]; box.innerHTML=`<div class="q">${it.q}</div><div><button class="btn" id="tt">Верно</button> <button class="btn ghost" id="ff">Неверно</button></div>`; document.getElementById('tt').onclick=()=>{ if(it.a) s++; show(); }; document.getElementById('ff').onclick=()=>{ if(!it.a) s++; show(); }; }
  show();
}
