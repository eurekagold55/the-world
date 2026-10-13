// THE WORLD — static, no network calls.
(()=>{
const BEINGS=[
 {id:'jjal',name:'짤랑이',r:'glitch',s:1},{id:'wol',name:'월급쟁이',r:'sag',s:1},
 {id:'baymax',name:'베이맥스',r:'bounce',s:1},{id:'hurryup',name:'허리업',r:'shake',s:1.35},
 {id:'jjeomjjeom',name:'쩜쩜이',r:'dot',s:.95},{id:'klavdiya',name:'클라브디야 할머니',r:'rock',s:.95},
 {id:'dubois',name:'뒤부아 교수',r:'tilt',s:1}];
const field=document.getElementById('field'),god=document.getElementById('god'),flash=document.getElementById('flash');
const rnd=(a,b)=>a+Math.random()*(b-a);
let W,H,base;
function dims(){W=innerWidth;H=innerHeight;base=Math.max(70,Math.min(W<600?W*.24:W*.11,150));}
dims();
function zone(){const gb=god.getBoundingClientRect();const top=Math.min(gb.bottom-20,H*.6);return{x0:0,x1:W,y0:top,y1:H*.93}}
const list=BEINGS.map((b,i)=>{
 const el=document.createElement('div');el.className='being wander';
 el.innerHTML=`<div class="inner"><div class="react"><div class="flip"><img src="avatars/cut/${b.id}.png" alt="${b.name}" draggable="false"></div></div></div><span class="cap">${b.name}</span>`;
 el.style.setProperty('--bob',rnd(2.5,4.5).toFixed(2)+'s');field.appendChild(el);
 const o={...b,el,w:0,h:0,x:0,y:0,vx:0,vy:0,t:0};
 const img=el.querySelector('img');
 const size=()=>{o.w=base*b.s;el.style.setProperty('--w',o.w+'px');o.h=o.w*(img.naturalHeight/img.naturalWidth||1)};
 img.complete?size():img.addEventListener('load',size);o.size=size;size();
 const z=zone();o.x=(i+.5)/BEINGS.length*(W-o.w);o.y=rnd(z.y0,Math.max(z.y0,z.y1-o.h));
 el.addEventListener('click',e=>{e.stopPropagation();react(o)});return o});
function react(o){const el=o.el;if(el.dataset.busy)return;el.dataset.busy=1;el.classList.add('r-'+o.r,'show');
 let bub;if(o.r==='dot'){bub=document.createElement('div');bub.className='bubble';bub.textContent='.';el.appendChild(bub)}
 o.pause=true;setTimeout(()=>{el.classList.remove('r-'+o.r,'show');bub&&bub.remove();delete el.dataset.busy;o.pause=false},2500)}
god.addEventListener('click',()=>{if(god.classList.contains('stare'))return;god.classList.add('stare','show');flash.classList.add('on');
 setTimeout(()=>{god.classList.remove('stare','show');flash.classList.remove('on')},1500)});
let last=performance.now();
function tick(now){const dt=Math.min(.05,(now-last)/1000);last=now;const z=zone();
 for(const o of list){if(!o.pause){o.t-=dt;if(o.t<=0){o.t=rnd(3,8);const sp=rnd(8,28);const a=rnd(0,Math.PI*2);o.vx=Math.cos(a)*sp;o.vy=Math.sin(a)*sp*.5;if(Math.random()<.2){o.vx=o.vy=0}}
  o.x+=o.vx*dt;o.y+=o.vy*dt;}
  const maxY=Math.max(z.y0,z.y1-o.h);
  if(o.x<0){o.x=0;o.vx=Math.abs(o.vx)}if(o.x>W-o.w){o.x=W-o.w;o.vx=-Math.abs(o.vx)}
  if(o.y<z.y0){o.y=z.y0;o.vy=Math.abs(o.vy)}if(o.y>maxY){o.y=maxY;o.vy=-Math.abs(o.vy)}
  if(Math.abs(o.vx)>1)o.el.classList.toggle('left',o.vx<0);
  o.el.style.transform=`translate(${o.x}px,${o.y}px)`;o.el.style.zIndex=2+Math.round(o.y)}
 requestAnimationFrame(tick)}
requestAnimationFrame(tick);
addEventListener('resize',()=>{dims();list.forEach(o=>o.size())});
})();
