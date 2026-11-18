/* 단어 구름 · 필기 (v18)
   획(stroke)을 벡터로 저장: 점을 줄이고(RDP) 정수로 바꾼 뒤 차이값을 64진 가변길이 문자열로.
   펜(애플 펜슬)을 한 번 쓰면 손바닥/손가락 터치는 무시 (손바닥 인식). */
(function(G){
"use strict";
const PAGE_W=1000,PAGE_H=1300;
const COLORS=[["#ffffff","흰"],["#ff5a5a","빨"],["#5aa8ff","파"],["#ffe14d","노"],["#5aff9a","초"]];
const WIDTHS=[[3,"가늘게"],[6,"보통"],[12,"굵게"]];
const ERASER_W=34;
const B64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const B64I={};for(let i=0;i<64;i++)B64I[B64[i]]=i;
/* 정수 → 지그재그 → 5비트씩 (6번째 비트 = 이어짐) */
function encInt(n,out){let z=n<0?(-n*2-1):(n*2);do{let c=z&31;z=Math.floor(z/32);if(z>0)c|=32;out.push(B64[c])}while(z>0)}
function decInts(str){const out=[];let z=0,sh=1;for(let i=0;i<str.length;i++){const c=B64I[str[i]];if(c===undefined)throw new Error("bad stroke data");z+=(c&31)*sh;if(c&32){sh*=32}else{out.push(z%2?-(z+1)/2:z/2);z=0;sh=1}}return out}
/* pts=[[x,y,p],...] (p 0..15) → 문자열 */
function encode(pts){const out=[];let px=0,py=0,pp=0;pts.forEach(([x,y,p])=>{x=Math.round(x);y=Math.round(y);p=Math.max(0,Math.min(15,Math.round(p)));encInt(x-px,out);encInt(y-py,out);encInt(p-pp,out);px=x;py=y;pp=p});return out.join("")}
function decode(str){const v=decInts(str||"");const pts=[];let x=0,y=0,p=0;for(let i=0;i+2<v.length;i+=3){x+=v[i];y+=v[i+1];p+=v[i+2];pts.push([x,y,p])}return pts}
/* Ramer–Douglas–Peucker (압력도 한 축으로, 압력 1단계 = 2단위) */
function simplify(pts,eps){eps=eps==null?1.1:eps;if(pts.length<3)return pts.slice();const K=2;
  const keep=new Uint8Array(pts.length);keep[0]=keep[pts.length-1]=1;const st=[[0,pts.length-1]];
  while(st.length){const [a,b]=st.pop();const A=pts[a],B=pts[b];const dx=B[0]-A[0],dy=B[1]-A[1],dp=(B[2]-A[2])*K;const L2=dx*dx+dy*dy+dp*dp;let md=-1,mi=-1;
    for(let i=a+1;i<b;i++){const P=pts[i];let t=L2?((P[0]-A[0])*dx+(P[1]-A[1])*dy+(P[2]-A[2])*K*dp)/L2:0;t=Math.max(0,Math.min(1,t));
      const ex=A[0]+t*dx-P[0],ey=A[1]+t*dy-P[1],ep=(A[2]*K+t*dp)-P[2]*K;const d=ex*ex+ey*ey+ep*ep;if(d>md){md=d;mi=i}}
    if(md>eps*eps){keep[mi]=1;st.push([a,mi],[mi,b])}}
  return pts.filter((_,i)=>keep[i])}
function mkStroke(pts,o){o=o||{};const q=pts.map(([x,y,p])=>[Math.round(x),Math.round(y),Math.round(p)]);
  const dedup=q.filter((p,i)=>i===0||p[0]!==q[i-1][0]||p[1]!==q[i-1][1]||p[2]!==q[i-1][2]);
  const s=simplify(dedup,o.eps);return{c:o.e?"":(o.c||"#ffffff"),s:o.s||6,e:o.e?1:0,d:encode(s.length?s:dedup.slice(0,1))}}
/* 그리기 (ctx 는 page 좌표 → 화면 배율 k) */
function widthAt(s,p,e){return e?ERASER_W:s*(0.45+0.75*(p/15))}
function drawStroke(ctx,st,k,pts){pts=pts||decode(st.d);if(!pts.length)return;ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
  if(st.e){ctx.globalCompositeOperation="destination-out";ctx.strokeStyle="rgba(0,0,0,1)";ctx.fillStyle="rgba(0,0,0,1)"}else{ctx.strokeStyle=st.c||"#fff";ctx.fillStyle=st.c||"#fff"}
  if(pts.length===1){const [x,y,p]=pts[0];ctx.beginPath();ctx.arc(x*k,y*k,Math.max(0.6,widthAt(st.s,p,st.e)*k/2),0,Math.PI*2);ctx.fill();ctx.restore();return}
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];const m0=i>1?[(pts[i-2][0]+a[0])/2,(pts[i-2][1]+a[1])/2]:a;const m1=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    ctx.lineWidth=Math.max(0.6,widthAt(st.s,(a[2]+b[2])/2,st.e)*k);ctx.beginPath();ctx.moveTo(m0[0]*k,m0[1]*k);ctx.quadraticCurveTo(a[0]*k,a[1]*k,(i===pts.length-1?b[0]:m1[0])*k,(i===pts.length-1?b[1]:m1[1])*k);ctx.stroke()}
  ctx.restore()}
function drawAll(ctx,note,k,wpx,hpx){ctx.clearRect(0,0,wpx,hpx);(note.strokes||[]).forEach(st=>{try{drawStroke(ctx,st,k)}catch(e){}})}
function thumbURL(note,w){if(typeof document==="undefined")return"";w=w||120;const h=Math.round(w*PAGE_H/PAGE_W);const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");
  const ink=document.createElement("canvas");ink.width=w;ink.height=h;drawAll(ink.getContext("2d"),note,w/PAGE_W,w,h);x.fillStyle="#000";x.fillRect(0,0,w,h);x.drawImage(ink,0,0);return c.toDataURL("image/png")}

/* ---- v20: 보기 변환 (확대·이동) ----
   화면 좌표 = 종이 좌표 × s + (tx,ty).  s0 = 종이 너비를 화면 너비에 맞춘 배율(100%).
   저장 좌표는 항상 종이(1000×1300) 기준이라 예전 노트·동기화와 그대로 호환. */
const ZMIN=0.5,ZMAX=5;
function fitView(vw,vh){const s=vw/PAGE_W;return{s,s0:s,tx:0,ty:0}}
function clampScale(s,s0){return Math.max(s0*ZMIN,Math.min(s0*ZMAX,s))}
function toPage(v,x,y){return[(x-v.tx)/v.s,(y-v.ty)/v.s]}
function toScreen(v,px,py){return[px*v.s+v.tx,py*v.s+v.ty]}
/* 두 손가락: 시작 (a0,b0) → 지금 (a1,b1). 시작 중점 아래 있던 종이 점이 지금 중점 아래로 오게 (확대 + 이동 동시에) */
function pinchView(v0,a0,b0,a1,b1){const m0=[(a0[0]+b0[0])/2,(a0[1]+b0[1])/2],m1=[(a1[0]+b1[0])/2,(a1[1]+b1[1])/2];
  const d0=Math.hypot(a0[0]-b0[0],a0[1]-b0[1])||1,d1=Math.hypot(a1[0]-b1[0],a1[1]-b1[1])||1;
  const s=clampScale(v0.s*d1/d0,v0.s0);const P=toPage(v0,m0[0],m0[1]);return{s,s0:v0.s0,tx:m1[0]-P[0]*s,ty:m1[1]-P[1]*s}}
function zoomAt(v,f,x,y){const s=clampScale(v.s*f,v.s0);const P=toPage(v,x,y);return{s,s0:v.s0,tx:x-P[0]*s,ty:y-P[1]*s}}
/* 종이가 화면 밖으로 다 나가지 않게: 화면보다 작으면 가운데, 크면 가장자리 48px 여유까지만 */
function clampView(v,vw,vh){const s=clampScale(v.s,v.s0),M=48;const ax=(t,size,view)=>size<=view?(view-size)/2:Math.min(M,Math.max(view-size-M,t));
  return{s,s0:v.s0,tx:ax(v.tx,PAGE_W*s,vw),ty:ax(v.ty,PAGE_H*s,vh)}}
const PTS=typeof WeakMap!=="undefined"?new WeakMap():null;
function ptsOf(st){if(!PTS)return decode(st.d);let c=PTS.get(st);if(!c||c.d!==st.d){c={d:st.d,v:decode(st.d)};PTS.set(st,c)}return c.v}

/* ---- 캔버스 편집기 ---- */
class Pad{
  constructor(canvas,note,opt){this.cv=canvas;this.note=note;this.opt=opt||{};this.tool="pen";this.color=COLORS[0][0];this.width=WIDTHS[1][0];
    this.undo=[];this.redo=[];this.cur=null;this.pid=null;this.curType="";this.penSeen=!!(opt&&opt.penSeen);this.fingerOk=!this.penSeen;
    this.zoomable=!!(opt&&opt.zoom);this.touches=new Map();this.gest=null;this.lock=false;this.view=null;
    this.ctx=canvas.getContext("2d");this._bind();this.resize()}
  resize(){const dpr=Math.min(3,(typeof devicePixelRatio!=="undefined"?devicePixelRatio:1)||1);this.dpr=dpr;let w,h;
    if(this.zoomable){w=this.cv.clientWidth||500;h=this.cv.clientHeight||650}else{const r=this.cv.getBoundingClientRect();w=r.width||PAGE_W/2;h=w*PAGE_H/PAGE_W}
    this.vw=w;this.vh=h;this.cv.width=Math.round(w*dpr);this.cv.height=Math.round(h*dpr);const f=fitView(w,h);
    if(!this.zoomable)this.view=f;
    else if(this.view){/* 회전·창 크기 바뀌어도 배율(%)과 왼쪽 위 종이 점 유지 */const z=this.view.s/this.view.s0,P=toPage(this.view,0,0);const s=f.s0*z;this.view=clampView({s,s0:f.s0,tx:-P[0]*s,ty:-P[1]*s},w,h)}
    else if(this.opt.initView&&this.opt.initView.z){const iv=this.opt.initView,s=f.s0*iv.z;this.view=clampView({s,s0:f.s0,tx:-iv.px*s,ty:-iv.py*s},w,h)}
    else this.view=clampView(f,w,h);
    this.k=this.view.s;this.redraw();this._emit()}
  zoom(){return this.view?this.view.s/this.view.s0:1}
  setView(v){if(!this.zoomable)return;this.view=clampView(v,this.vw,this.vh);this.k=this.view.s;this._sched();this._emit()}
  resetView(){this.setView(fitView(this.vw,this.vh))}
  zoomBy(f){this.setView(zoomAt(this.view,f,this.vw/2,this.vh/2))}
  _emit(){const v=this.view;this.opt.onView&&this.opt.onView({...v,z:v.s/v.s0,px:-v.tx/v.s,py:-v.ty/v.s})}
  _sched(){if(this._raf)return;const f=typeof requestAnimationFrame!=="undefined"?requestAnimationFrame:(c=>setTimeout(c,16));this._raf=f(()=>{this._raf=0;this.redraw()})}
  _T(){const v=this.view,d=this.dpr;this.ctx.setTransform(d*v.s,0,0,d*v.s,d*v.tx,d*v.ty)}
  redraw(){const c=this.ctx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.cv.width,this.cv.height);this._T();
    (this.note.strokes||[]).forEach(st=>{try{drawStroke(c,st,1,ptsOf(st))}catch(e){}});if(this.cur)drawStroke(c,this.cur.st,1,this.cur.pts)}
  _xy(e){const r=this.cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
  pt(e){const [sx,sy]=this._xy(e);const [x,y]=toPage(this.view,sx,sy);
    let pr=0.5;if(e.pointerType==="pen"&&e.pressure>0)pr=e.pressure;return[Math.max(0,Math.min(PAGE_W,x)),Math.max(0,Math.min(PAGE_H,y)),pr*15]}
  accept(e){if(e.pointerType==="pen"){if(!this.penSeen){this.penSeen=true;this.fingerOk=false;this.opt.onPen&&this.opt.onPen()}return true}
    if(e.pointerType==="touch")return this.fingerOk;/* 펜을 쓰고 있으면 손바닥·손가락 무시 */return true}
  cancelStroke(){if(!this.cur)return;const id=this.pid;this.cur=null;this.pid=null;this.curType="";try{this.cv.releasePointerCapture(id)}catch(_){}this.redraw();this.opt.onCancel&&this.opt.onCancel()}
  _startGesture(){const ids=[...this.touches.keys()].slice(0,2);this.gest={a:ids[0],b:ids[1],a0:this.touches.get(ids[0]),b0:this.touches.get(ids[1]),v0:{...this.view}};this.opt.onGesture&&this.opt.onGesture(true)}
  _beginStroke(e){try{this.cv.setPointerCapture(e.pointerId)}catch(_){}this.pid=e.pointerId;this.curType=e.pointerType;const er=this.tool==="eraser";
    this.cur={st:{c:er?"":this.color,s:this.width,e:er?1:0},pts:[this.pt(e)]};this._last=this.cur.pts[0];this._T();drawStroke(this.ctx,this.cur.st,1,this.cur.pts)}
  _bind(){const cv=this.cv;
    this._down=e=>{if(e.button>0)return;
      if(e.pointerType==="touch"){this.touches.set(e.pointerId,this._xy(e));
        if(this.pid!==null&&this.curType==="pen")return;/* 펜으로 쓰는 중엔 손 터치 전부 무시 */
        if(this.touches.size>=2){e.preventDefault();/* 두 번째 손가락 → 긋던 획 취소 (엉뚱한 선 안 남게) */if(this.cur&&this.curType==="touch")this.cancelStroke();
          this.lock=true;if(this.zoomable&&!this.gest)this._startGesture();return}
        if(this.lock||!this.accept(e)||this.pid!==null)return;e.preventDefault();this._beginStroke(e);return}
      if(this.pid!==null){if(this.curType==="touch"&&e.pointerType==="pen")this.cancelStroke();else return}
      if(!this.accept(e))return;e.preventDefault();this._beginStroke(e)};
    this._move=e=>{if(e.pointerType==="touch"&&this.touches.has(e.pointerId)){this.touches.set(e.pointerId,this._xy(e));
        if(this.gest){e.preventDefault();const a1=this.touches.get(this.gest.a),b1=this.touches.get(this.gest.b);if(a1&&b1)this.setView(pinchView(this.gest.v0,this.gest.a0,this.gest.b0,a1,b1));return}}
      if(e.pointerId!==this.pid||!this.cur)return;e.preventDefault();const evs=e.getCoalescedEvents?e.getCoalescedEvents():[];(evs.length?evs:[e]).forEach(ev=>{const p=this.pt(ev);const l=this._last;if(l&&Math.abs(p[0]-l[0])<0.4&&Math.abs(p[1]-l[1])<0.4)return;this.cur.pts.push(p);this._last=p});
      const n=this.cur.pts.length;this._T();drawStroke(this.ctx,this.cur.st,1,this.cur.pts.slice(Math.max(0,n-3)))};
    this._endTouch=e=>{if(e.pointerType!=="touch")return;this.touches.delete(e.pointerId);
      if(this.gest&&(!this.touches.has(this.gest.a)||!this.touches.has(this.gest.b))){this.gest=null;this.opt.onGesture&&this.opt.onGesture(false)}
      if(this.touches.size===0)this.lock=false};
    this._up=e=>{this._endTouch(e);if(e.pointerId!==this.pid)return;e.preventDefault();this.pid=null;this.curType="";const c=this.cur;this.cur=null;if(!c)return;
      const st=mkStroke(c.pts,{c:c.st.c,s:c.st.s,e:c.st.e});this.note.strokes=this.note.strokes||[];this.note.strokes.push(st);this.undo.push({t:"add",st});this.redo.length=0;this.redraw();this.opt.onChange&&this.opt.onChange("add")};
    this._cancel=e=>{this._endTouch(e);if(e.pointerId!==this.pid)return;this.cancelStroke()};
    this._noTouch=e=>{if(e.cancelable)e.preventDefault()};
    this._wheel=e=>{if(!this.zoomable)return;e.preventDefault();const [x,y]=this._xy(e);
      if(e.ctrlKey||e.metaKey)this.setView(zoomAt(this.view,Math.exp(-e.deltaY*0.01),x,y));else this.setView({...this.view,tx:this.view.tx-e.deltaX,ty:this.view.ty-e.deltaY})};
    cv.addEventListener("pointerdown",this._down);cv.addEventListener("pointermove",this._move);cv.addEventListener("pointerup",this._up);cv.addEventListener("pointercancel",this._cancel);
    cv.addEventListener("touchstart",this._noTouch,{passive:false});cv.addEventListener("touchmove",this._noTouch,{passive:false});
    cv.addEventListener("contextmenu",this._noTouch);cv.addEventListener("wheel",this._wheel,{passive:false})}
  destroy(){const cv=this.cv;cv.removeEventListener("pointerdown",this._down);cv.removeEventListener("pointermove",this._move);cv.removeEventListener("pointerup",this._up);cv.removeEventListener("pointercancel",this._cancel);
    cv.removeEventListener("touchstart",this._noTouch);cv.removeEventListener("touchmove",this._noTouch);cv.removeEventListener("contextmenu",this._noTouch);cv.removeEventListener("wheel",this._wheel)}
  doUndo(){const op=this.undo.pop();if(!op)return false;const S=this.note.strokes;
    if(op.t==="add"){const i=S.lastIndexOf(op.st);if(i>=0)S.splice(i,1)}else if(op.t==="clear"){this.note.strokes=op.prev.slice()}
    this.redo.push(op);this.redraw();this.opt.onChange&&this.opt.onChange("undo");return true}
  doRedo(){const op=this.redo.pop();if(!op)return false;if(op.t==="add")this.note.strokes.push(op.st);else if(op.t==="clear")this.note.strokes=[];
    this.undo.push(op);this.redraw();this.opt.onChange&&this.opt.onChange("redo");return true}
  clear(){if(!(this.note.strokes||[]).length)return false;this.undo.push({t:"clear",prev:this.note.strokes.slice()});this.note.strokes=[];this.redo.length=0;this.redraw();this.opt.onChange&&this.opt.onChange("clear");return true}
}
const NOTES={PAGE_W,PAGE_H,COLORS,WIDTHS,ERASER_W,ZMIN,ZMAX,encode,decode,simplify,mkStroke,drawStroke,drawAll,thumbURL,fitView,clampScale,clampView,pinchView,zoomAt,toPage,toScreen,Pad};
G.NOTES=NOTES;if(typeof module!=="undefined")module.exports=NOTES;
})(typeof window!=="undefined"?window:globalThis);
