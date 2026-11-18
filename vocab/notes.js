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

/* ---- 캔버스 편집기 ---- */
class Pad{
  constructor(canvas,note,opt){this.cv=canvas;this.note=note;this.opt=opt||{};this.tool="pen";this.color=COLORS[0][0];this.width=WIDTHS[1][0];
    this.undo=[];this.redo=[];this.cur=null;this.pid=null;this.penSeen=!!(opt&&opt.penSeen);this.fingerOk=!this.penSeen;
    this.ctx=canvas.getContext("2d");this._bind();this.resize()}
  resize(){const r=this.cv.getBoundingClientRect();const dpr=Math.min(3,(typeof devicePixelRatio!=="undefined"?devicePixelRatio:1)||1);
    this.cssW=r.width||PAGE_W/2;this.k=this.cssW/PAGE_W;this.cv.width=Math.round(this.cssW*dpr);this.cv.height=Math.round(this.cssW*PAGE_H/PAGE_W*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);this.redraw()}
  redraw(){drawAll(this.ctx,this.note,this.k,this.cv.width,this.cv.height);if(this.cur)drawStroke(this.ctx,this.cur.st,this.k,this.cur.pts)}
  pt(e){const r=this.cv.getBoundingClientRect();const x=(e.clientX-r.left)/this.k,y=(e.clientY-r.top)/this.k;
    let pr=0.5;if(e.pointerType==="pen"&&e.pressure>0)pr=e.pressure;return[Math.max(0,Math.min(PAGE_W,x)),Math.max(0,Math.min(PAGE_H,y)),pr*15]}
  accept(e){if(e.pointerType==="pen"){if(!this.penSeen){this.penSeen=true;this.fingerOk=false;this.opt.onPen&&this.opt.onPen()}return true}
    if(e.pointerType==="touch")return this.fingerOk;/* 펜을 쓰고 있으면 손바닥·손가락 무시 */return true}
  _bind(){const cv=this.cv;
    this._down=e=>{if(this.pid!==null){return}if(!this.accept(e))return;if(e.button>0)return;e.preventDefault();
      try{cv.setPointerCapture(e.pointerId)}catch(_){}this.pid=e.pointerId;const er=this.tool==="eraser";
      this.cur={st:{c:er?"":this.color,s:this.width,e:er?1:0},pts:[this.pt(e)]};this._last=this.cur.pts[0];this.redraw()};
    this._move=e=>{if(e.pointerId!==this.pid||!this.cur)return;e.preventDefault();const evs=e.getCoalescedEvents?e.getCoalescedEvents():[];(evs.length?evs:[e]).forEach(ev=>{const p=this.pt(ev);const l=this._last;if(l&&Math.abs(p[0]-l[0])<0.4&&Math.abs(p[1]-l[1])<0.4)return;this.cur.pts.push(p);this._last=p});
      const n=this.cur.pts.length;drawStroke(this.ctx,this.cur.st,this.k,this.cur.pts.slice(Math.max(0,n-3)))};
    this._up=e=>{if(e.pointerId!==this.pid)return;e.preventDefault();this.pid=null;const c=this.cur;this.cur=null;if(!c)return;
      const st=mkStroke(c.pts,{c:c.st.c,s:c.st.s,e:c.st.e});this.note.strokes=this.note.strokes||[];this.note.strokes.push(st);this.undo.push({t:"add",st});this.redo.length=0;this.redraw();this.opt.onChange&&this.opt.onChange("add")};
    this._cancel=e=>{if(e.pointerId!==this.pid)return;this.pid=null;this.cur=null;this.redraw()};
    this._noTouch=e=>{if(e.cancelable)e.preventDefault()};
    cv.addEventListener("pointerdown",this._down);cv.addEventListener("pointermove",this._move);cv.addEventListener("pointerup",this._up);cv.addEventListener("pointercancel",this._cancel);
    cv.addEventListener("touchstart",this._noTouch,{passive:false});cv.addEventListener("touchmove",this._noTouch,{passive:false});
    cv.addEventListener("contextmenu",this._noTouch)}
  destroy(){const cv=this.cv;cv.removeEventListener("pointerdown",this._down);cv.removeEventListener("pointermove",this._move);cv.removeEventListener("pointerup",this._up);cv.removeEventListener("pointercancel",this._cancel);
    cv.removeEventListener("touchstart",this._noTouch);cv.removeEventListener("touchmove",this._noTouch);cv.removeEventListener("contextmenu",this._noTouch)}
  doUndo(){const op=this.undo.pop();if(!op)return false;const S=this.note.strokes;
    if(op.t==="add"){const i=S.lastIndexOf(op.st);if(i>=0)S.splice(i,1)}else if(op.t==="clear"){this.note.strokes=op.prev.slice()}
    this.redo.push(op);this.redraw();this.opt.onChange&&this.opt.onChange("undo");return true}
  doRedo(){const op=this.redo.pop();if(!op)return false;if(op.t==="add")this.note.strokes.push(op.st);else if(op.t==="clear")this.note.strokes=[];
    this.undo.push(op);this.redraw();this.opt.onChange&&this.opt.onChange("redo");return true}
  clear(){if(!(this.note.strokes||[]).length)return false;this.undo.push({t:"clear",prev:this.note.strokes.slice()});this.note.strokes=[];this.redo.length=0;this.redraw();this.opt.onChange&&this.opt.onChange("clear");return true}
}
const NOTES={PAGE_W,PAGE_H,COLORS,WIDTHS,ERASER_W,encode,decode,simplify,mkStroke,drawStroke,drawAll,thumbURL,Pad};
G.NOTES=NOTES;if(typeof module!=="undefined")module.exports=NOTES;
})(typeof window!=="undefined"?window:globalThis);
