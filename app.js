// THE WORLD — static retro desktop. No network calls.
(()=>{
const B=[
 {id:'jeonji',name:'전지전능',exe:'jeonji.sys',r:'stare',s:.62,bg:'radial-gradient(circle at 50% 40%,#fff6d0 0,#bfa75a 22%,#2b2208 60%,#000 100%)',god:1},
 {id:'jjal',name:'짤랑이',exe:'jjalang.exe',r:'glitch',s:.6,bg:'linear-gradient(#1a0030,#5a0a5a 60%,#120018)'},
 {id:'wol',name:'월급쟁이',exe:'wolgeup.exe',r:'sag',s:.6,bg:'linear-gradient(#1c2230,#3c4658 70%,#14161c)'},
 {id:'baymax',name:'베이맥스',exe:'baymax.exe',r:'bounce',s:.6,bg:'radial-gradient(circle at 50% 60%,#2a5a7a,#0a1a2a 75%)'},
 {id:'hurryup',name:'허리업',exe:'hurryup.exe',r:'shake',s:.72,bg:'repeating-linear-gradient(90deg,#300 0 6px,#200 6px 12px),#300'},
 {id:'jjeomjjeom',name:'쩜쩜이',exe:'jjeom...exe',r:'dot',s:.55,bg:'radial-gradient(#333 1px,transparent 1.5px) 0 0/10px 10px,#0d0d0d'},
 {id:'klavdiya',name:'클라브디야 할머니',exe:'klavdiya.exe',r:'rock',s:.55,bg:'linear-gradient(#2a1a10,#5a3a20 65%,#1a0f08)'},
 {id:'dubois',name:'뒤부아 교수',exe:'dubois.exe',r:'tilt',s:.58,bg:'linear-gradient(#0e1a14,#24382c 70%,#08100c)'}];
const $=s=>document.querySelector(s),rnd=(a,b)=>a+Math.random()*(b-a),mob=()=>innerWidth<=600;
const desk=$('#desk'),wins=$('#wins'),tasks=$('#tasks');

/* ---------- wallpaper: degraded bliss ---------- */
const cv=$('#wall'),cx=cv.getContext('2d');
function wall(){
 const k=mob()?3:4,w=cv.width=Math.ceil(innerWidth/k),h=cv.height=Math.ceil(innerHeight/k);
 let g=cx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1f5fc8');g.addColorStop(.45,'#6fa8e8');g.addColorStop(.62,'#c8dcf0');cx.fillStyle=g;cx.fillRect(0,0,w,h);
 for(let i=0;i<14;i++){cx.fillStyle=`rgba(255,255,255,${rnd(.15,.45)})`;const x=rnd(0,w),y=rnd(h*.05,h*.4);for(let j=0;j<6;j++){cx.beginPath();cx.ellipse(x+rnd(-w*.06,w*.06),y+rnd(-4,4),rnd(w*.03,w*.08),rnd(3,9),0,0,7);cx.fill()}}
 const hill=(y0,amp,c1,c2,ph)=>{cx.beginPath();cx.moveTo(0,h);for(let x=0;x<=w;x+=2)cx.lineTo(x,y0-Math.sin(x/w*Math.PI*.95+ph)*amp-Math.sin(x/w*7+ph)*amp*.06);cx.lineTo(w,h);const gg=cx.createLinearGradient(0,y0-amp,0,h);gg.addColorStop(0,c1);gg.addColorStop(1,c2);cx.fillStyle=gg;cx.fill()};
 hill(h*.78,h*.12,'#5f9a3a','#2c5a18',.6);hill(h*.72,h*.22,'#6cb83c','#2f6a14',.15);
 // posterize + noise
 const im=cx.getImageData(0,0,w,h),d=im.data;
 for(let i=0;i<d.length;i+=4){const n=rnd(-22,22);for(let c=0;c<3;c++)d[i+c]=Math.round((d[i+c]+n)/24)*24}
 cx.putImageData(im,0,0);
 // slice glitches
 for(let i=0;i<9;i++){const y=rnd(0,h)|0,sh=rnd(1,6)|0;cx.drawImage(cv,0,y,w,sh,rnd(-20,20),y,w,sh)}
 // dead band + blocks
 cx.fillStyle='rgba(0,0,170,.5)';cx.fillRect(0,h*rnd(.5,.9),w,2);
 for(let i=0;i<5;i++){cx.fillStyle=['#f0f','#0ff','#000','#fff'][i%4];cx.globalAlpha=.25;cx.fillRect(rnd(0,w),rnd(0,h),rnd(4,30),rnd(1,4))}
 cx.globalAlpha=1;
}
wall();addEventListener('resize',()=>{wall();fit()});
setInterval(()=>{if(Math.random()<.5)return;const w=cv.width,h=cv.height,y=rnd(0,h)|0,sh=rnd(2,10)|0;cx.drawImage(cv,0,y,w,sh,rnd(-10,10),y,w,sh)},2600);

/* ---------- windows ---------- */
let Z=100,openN=0;const open={};
function focus(win){Z++;win.style.zIndex=Z;document.querySelectorAll('.win').forEach(w=>w.classList.toggle('blur',w!==win));
 document.querySelectorAll('.task').forEach(t=>t.classList.toggle('on',t._w===win))}
function drag(win){const tb=win.querySelector('.tb');let sx,sy,ox,oy,on=false;
 tb.addEventListener('pointerdown',e=>{if(e.target.closest('button')||win.classList.contains('max'))return;on=true;tb.setPointerCapture(e.pointerId);sx=e.clientX;sy=e.clientY;ox=win.offsetLeft;oy=win.offsetTop;focus(win)});
 tb.addEventListener('pointermove',e=>{if(!on)return;const r=desk.getBoundingClientRect();
  win.style.left=Math.min(r.width-40,Math.max(-win.offsetWidth+60,ox+e.clientX-sx))+'px';win.style.top=Math.min(r.height-20,Math.max(0,oy+e.clientY-sy))+'px'});
 tb.addEventListener('pointerup',()=>on=false);tb.addEventListener('pointercancel',()=>on=false);
 win.addEventListener('pointerdown',()=>focus(win))}
function mkwin(cls,title,inner,opt={}){const w=document.createElement('div');w.className='win opening '+cls;
 w.innerHTML=`<div class="tb"><span class="tt">${title}</span>${opt.min!==false?'<button class="mn" aria-label="minimize">_</button>':''}${opt.max?'<button class="mx" aria-label="maximize">□</button>':''}<button class="x" aria-label="close">×</button></div>${inner}`;
 wins.appendChild(w);drag(w);focus(w);setTimeout(()=>w.classList.remove('opening'),500);return w}
function closeWin(w,cb){w.classList.add('closing');setTimeout(()=>{w.remove();cb&&cb()},260)}

function openBeing(b){
 if(open[b.id]){const w=open[b.id];w.classList.remove('min');focus(w);glitch();return}
 const w=mkwin('bw',`${b.name} — ${b.exe}`,
 `<div class="mb"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>H</u>elp</span></div>
 <div class="stage"><div class="bg" style="background:${b.bg}"></div><div class="label">C:\\WORLD\\${b.exe.toUpperCase()}</div>
 <div class="being" style="--w:${b.s*100}%;--bob:${rnd(2.5,4.5).toFixed(2)}s"><div class="inner"><div class="react"><img src="avatars/cut/${b.id}.png" alt="${b.name}" draggable="false"></div></div></div><div class="lines"></div></div>
 <div class="stat"><div>1 being(s)</div><div>${b.god?'∞ KB':(rnd(64,980)|0)+' KB'}</div></div>`,{max:true});
 const r=desk.getBoundingClientRect();
 if(mob()){w.style.left='6px';w.style.top=(70+openN%3*24)+'px'}
 else{w.style.left=Math.min(r.width-360,(r.width*.22+openN%6*34))+'px';w.style.top=Math.min(r.height-400,(30+openN%6*30))+'px'}
 openN++;open[b.id]=w;
 const t=document.createElement('button');t.className='task';t.textContent=b.name;t._w=w;tasks.appendChild(t);
 t.onclick=()=>{if(w.classList.contains('min')){w.classList.remove('min');focus(w)}else if(t.classList.contains('on')){w.classList.add('min');t.classList.remove('on')}else focus(w)};
 focus(w);
 w.querySelector('.x').onclick=()=>{t.remove();delete open[b.id];closeWin(w)};
 w.querySelector('.mn').onclick=()=>{w.classList.add('min');t.classList.remove('on')};
 w.querySelector('.mx').onclick=()=>w.classList.toggle('max');
 const st=w.querySelector('.stage'),be=w.querySelector('.being');
 st.addEventListener('click',()=>react(b,be,st));
}
function react(b,el,st){if(el.dataset.busy)return;el.dataset.busy=1;el.classList.add('r-'+b.r);
 let bub;if(b.r==='dot'){bub=document.createElement('div');bub.className='bubble';bub.textContent='.';el.appendChild(bub)}
 if(b.r==='stare'){st.classList.add('flash');glitch()}
 setTimeout(()=>{el.classList.remove('r-'+b.r);st.classList.remove('flash');bub&&bub.remove();delete el.dataset.busy},b.r==='stare'?1500:2500)}

/* ---------- icons ---------- */
const icons=$('#icons'),sm=$('#smlist');
B.forEach(b=>{const d=document.createElement('div');d.className='ico'+(b.god?' god':'');d.tabIndex=0;
 const c=document.createElement('canvas');c.width=c.height=36;const img=new Image();img.src=`avatars/cut/${b.id}.png`;
 img.onload=()=>{const x=c.getContext('2d');x.imageSmoothingEnabled=false;const s=Math.min(36/img.width,36/img.height);x.drawImage(img,(36-img.width*s)/2,36-img.height*s,img.width*s,img.height*s)};
 const p=document.createElement('div');p.className='pic';p.appendChild(c);d.appendChild(p);
 d.insertAdjacentHTML('beforeend',`<span>${b.name}<small>${b.exe}</small></span>`);
 d.onclick=e=>{e.stopPropagation();document.querySelectorAll('.ico').forEach(i=>i.classList.remove('sel'));d.classList.add('sel');openBeing(b)};
 d.onkeydown=e=>{if(e.key==='Enter')d.click()};icons.appendChild(d);
 const m=document.createElement('div');m.className='mi';m.innerHTML=`<img src="avatars/cut/${b.id}.png" alt="">${b.name}`;m.onclick=()=>{toggleStart(false);openBeing(b)};sm.appendChild(m)});
desk.addEventListener('click',e=>{if(e.target===desk||e.target===icons)document.querySelectorAll('.ico').forEach(i=>i.classList.remove('sel'))});

/* ---------- 전지전능: always-present watcher ---------- */
const god=B[0];
const watch=mkwin('','전지전능 — watching',`<div class="stage"><div class="being" style="--w:78%;bottom:4%"><div class="inner"><div class="react"><img src="avatars/cut/jeonji.png" alt="전지전능" draggable="false"></div></div></div><div class="lines"></div></div><div class="stat"><div>always on top</div></div>`,{min:false});
watch.id='watch';watch.style.zIndex=8000;
watch.querySelector('.x').onclick=()=>{glitch();notice('전지전능','This window cannot be closed.\n전지전능 is everywhere.','!')};
watch.querySelector('.stage').onclick=()=>openBeing(god);


/* ---------- ambient ---------- */
function notice(title,msg,ic='×',x,y){const w=mkwin('dlg',title,`<div class="body"><div class="ic ${ic==='i'?'i':''}">${ic}</div><div>${msg.replace(/\n/g,'<br>')}</div></div><div class="btns"><button class="btn">OK</button></div>`,{min:false});
 const r=desk.getBoundingClientRect();w.style.left=(x??rnd(r.width*.3,r.width-280))+'px';w.style.top=(y??rnd(40,r.height-180))+'px';
 const c=()=>closeWin(w);w.querySelector('.x').onclick=c;w.querySelector('.btn').onclick=c;
 const all=document.querySelectorAll('.dlg');if(all.length>6)all[0].remove();return w}
function cascade(){const r=desk.getBoundingClientRect();const x0=rnd(r.width*.35,Math.max(r.width*.35,r.width-420)),y0=rnd(60,Math.max(60,r.height-320)),n=mob()?2:(rnd(2,5)|0);
 const msgs=['Not found.','Not found.','The being you are looking for\nis no longer here.','Not found.'];
 for(let i=0;i<n;i++)setTimeout(()=>notice(i%2?'Windows 95':'Error',msgs[i%msgs.length],i===2?'i':'×',x0+i*18,y0+i*18),i*170)}
setTimeout(cascade,mob()?6000:2500);
(function loop(){setTimeout(()=>{if(document.querySelectorAll('.dlg').length<4)cascade();loop()},rnd(14000,26000))})();
function glitch(){document.body.classList.add('glitch');$('#flick').classList.add('on');setTimeout(()=>{document.body.classList.remove('glitch');$('#flick').classList.remove('on')},320)}
(function gl(){setTimeout(()=>{glitch();gl()},rnd(5000,13000))})();
// terminal
const tt=$('#termtxt'),lines=['> DECRYPTING world.dat ...','  [##########----] 71%','> beings found: 8','> 1 being found above the others','> checking happiness.dll ...','  with the small things: OK','> ERROR 0x0000003B','> retry ...','> DECRYPTING memory/ ...','> who is watching? ........ yes'];let li=0,buf=[];
setInterval(()=>{buf.push(lines[li++%lines.length]);if(buf.length>8)buf.shift();tt.textContent=buf.join('\n')+'\n_'},900);
// clock
const clk=$('#clock');const tick=()=>{const d=new Date();clk.textContent=d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',second:'2-digit'})};tick();setInterval(tick,1000);
// start
const st=$('#start'),smn=$('#startmenu');function toggleStart(v){v=v??!smn.classList.contains('on');smn.classList.toggle('on',v);st.classList.toggle('on',v)}
st.onclick=e=>{e.stopPropagation();toggleStart()};document.addEventListener('click',e=>{if(!e.target.closest('#startmenu,#start'))toggleStart(false)});
function fit(){document.querySelectorAll('.bw').forEach(w=>{const r=desk.getBoundingClientRect();if(w.offsetLeft>r.width-60)w.style.left=Math.max(0,r.width-w.offsetWidth)+'px'})}
})();
