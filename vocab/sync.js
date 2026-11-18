/* 단어 구름 · 기기 동기화 (v17)
   서버 없이 GitHub 비공개 Gist 하나에 데이터를 두고, 기기마다 받아서 "합치기"만 함 (덮어쓰기 X).
   - 단어: id 기준. 내용은 updatedAt, 복습(SRS)은 srsAt, 변화표 연습은 칸마다 t 로 더 최근 것.
   - 지운 단어/언어는 묘비(tombstone)로 남겨서 다른 기기에서 되살아나지 않게.
   - 토큰은 이 파일 밖(기기 localStorage)에만 있고, 여기선 요청 헤더에만 씀. 로그 X. */
(function(G){
"use strict";
const GIST_DESC="vocab-cloud-sync",GIST_FILE="vocab-cloud.json",API="https://api.github.com";
const SRS_KEYS=["ease","interval","reps","lapses","due","last","lastGrade"];/* v18: lastGrade(앎/애매/모름)도 복습 기록이랑 같이 srsAt 로 합침 */
const META_KEYS=new Set(["updatedAt","srsAt","conjSRS","declSRS",...SRS_KEYS]);
const TOMB_TTL=400*864e5;

/* 키 순서와 상관없는 문자열 (비교·해시용) */
function stable(v){if(v===undefined)return"null";if(v===null||typeof v!=="object")return JSON.stringify(v);
  if(Array.isArray(v))return"["+v.map(stable).join(",")+"]";
  return"{"+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+":"+stable(v[k])).join(",")+"}"}
function hash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(36)+":"+s.length}
function contentOf(w){const o={};for(const k in w)if(!META_KEYS.has(k))o[k]=w[k];return o}
function srsOf(w){const o={};SRS_KEYS.forEach(k=>{o[k]=w[k]===undefined?null:w[k]});return o}
function keyEntry(e){if(!e||typeof e!=="object")return e;const o={...e};delete o.t;return o}
function wordTs(w){let m=Math.max(w.updatedAt||0,w.srsAt||0);["conjSRS","declSRS"].forEach(f=>{const o=w[f];if(o)for(const k in o)if(o[k]&&o[k].t>m)m=o[k].t});return m}
function dateMs(s){const t=s?Date.parse(s):NaN;return isNaN(t)?0:t}

function ensureStamps(st){st.stamps=st.stamps||{};const S=st.stamps;S.l=S.l||{};S.tomb=S.tomb||{};S.tomb.w=S.tomb.w||{};S.tomb.l=S.tomb.l||{};S.tomb.n=S.tomb.n||{};S.tomb.q=S.tomb.q||{};S.prefs=S.prefs||0;return S}

/* 지금 상태의 지문 (단어마다 내용/복습/연습칸 해시) */
function wEntry(w,lid){const k={};["conjSRS","declSRS"].forEach(f=>{const o=w[f];if(o)for(const key in o)k[f+"|"+key]=JSON.stringify(keyEntry(o[key]))});
  return{c:hash(JSON.stringify(contentOf(w))),s:JSON.stringify(srsOf(w)),k,lang:lid}}
function noteSig(n){const o={};for(const k in n)if(k!=="updatedAt")o[k]=n[k];return hash(JSON.stringify(o))}
function snapshot(st){const snap={w:{},l:{},n:{},q:{},prefs:hash(stable(st.prefs||{}))};
  (st.notes||[]).forEach(n=>{if(n&&n.id)snap.n[n.id]=noteSig(n)});
  (st.qs||[]).forEach(q=>{if(q&&q.id)snap.q[q.id]=noteSig(q)});
  Object.keys(st.words||{}).forEach(lid=>(st.words[lid]||[]).forEach(w=>{if(!w||!w.id)return;snap.w[w.id]=wEntry(w,lid)}));
  (st.langs||[]).forEach(l=>{snap.l[l.id]=hash(stable(l))});
  return snap}

/* 예전 데이터에 시간표 붙이기 (처음 한 번). 새 시각을 만들지 않고 created/last 로 추정 */
function migrateStamps(st){ensureStamps(st);Object.values(st.words||{}).forEach(arr=>(arr||[]).forEach(w=>{if(!w)return;
  if(typeof w.updatedAt!=="number")w.updatedAt=dateMs(w.created);
  if(typeof w.srsAt!=="number")w.srsAt=w.last?Math.max(dateMs(w.last),w.updatedAt):w.updatedAt;
  ["conjSRS","declSRS"].forEach(f=>{const o=w[f];if(o)for(const k in o)if(o[k]&&typeof o[k]==="object"&&typeof o[k].t!=="number")o[k].t=dateMs(o[k].last)})}));
  (st.notes||[]).forEach(n=>{if(n&&typeof n.updatedAt!=="number")n.updatedAt=dateMs(n.created)});
  (st.qs||[]).forEach(q=>{if(q&&typeof q.updatedAt!=="number")q.updatedAt=typeof q.created==="number"?q.created:dateMs(q.created)});
  return st}

/* 저장할 때마다: 이전 지문과 비교해서 바뀐 곳에만 시각 찍기, 사라진 단어/언어는 묘비 */
function stamp(st,prev,now){now=now||Date.now();const S=ensureStamps(st);let changed=false;const cur=snapshot(st);
  if(!prev)return{snap:cur,changed:false};const touched=[];
  Object.keys(st.words||{}).forEach(lid=>(st.words[lid]||[]).forEach(w=>{if(!w||!w.id)return;const a=prev.w[w.id],b=cur.w[w.id];const was=changed;changed=false;
    if(!a){if(typeof w.updatedAt!=="number"||!w.updatedAt)w.updatedAt=now;if(typeof w.srsAt!=="number")w.srsAt=w.updatedAt;if(S.tomb.w[w.id]&&S.tomb.w[w.id]>=wordTs(w))w.updatedAt=Math.max(now,S.tomb.w[w.id]+1);changed=true;
      ["conjSRS","declSRS"].forEach(f=>{const o=w[f];if(o)for(const k in o)if(o[k]&&typeof o[k]==="object"&&typeof o[k].t!=="number")o[k].t=now})}
    else{if(a.c!==b.c){w.updatedAt=Math.max(now,(w.updatedAt||0)+1);changed=true}
      if(a.s!==b.s){w.srsAt=Math.max(now,(w.srsAt||0)+1);changed=true}
      for(const k in b.k)if(a.k[k]!==b.k[k]){const [f,key]=[k.slice(0,7),k.slice(8)];const e=w[f]&&w[f][key];if(e&&typeof e==="object"){e.t=Math.max(now,(e.t||0)+1);changed=true}}}
    if(changed)touched.push([w,lid]);changed=changed||was}));
  for(const id in prev.w)if(!cur.w[id]){S.tomb.w[id]=now;changed=true}
  for(const id in cur.l)if(prev.l[id]!==cur.l[id]){S.l[id]=Math.max(now,(S.l[id]||0)+1);changed=true}
  for(const id in prev.l)if(!cur.l[id]){S.tomb.l[id]=now;changed=true}
  /* v18: 필기 노트 — 노트마다 updatedAt, 지우면 묘비 */
  (st.notes||[]).forEach(n=>{if(!n||!n.id)return;const a=prev.n&&prev.n[n.id];
    if(a===undefined){if(typeof n.updatedAt!=="number"||!n.updatedAt)n.updatedAt=now;if(S.tomb.n[n.id]&&S.tomb.n[n.id]>=n.updatedAt)n.updatedAt=Math.max(now,S.tomb.n[n.id]+1);changed=true}
    else if(a!==cur.n[n.id]){n.updatedAt=Math.max(now,(n.updatedAt||0)+1);changed=true}});
  for(const id in (prev.n||{}))if(!cur.n[id]){S.tomb.n[id]=now;changed=true}
  /* v22: 궁금증 — 항목마다 updatedAt, 지우면 묘비 (노트랑 같은 방식) */
  if(prev.q)(st.qs||[]).forEach(q=>{if(!q||!q.id)return;const a=prev.q[q.id];
    if(a===undefined){if(typeof q.updatedAt!=="number"||!q.updatedAt)q.updatedAt=now;if(S.tomb.q[q.id]&&S.tomb.q[q.id]>=q.updatedAt)q.updatedAt=Math.max(now,S.tomb.q[q.id]+1);changed=true}
    else if(a!==cur.q[q.id]){q.updatedAt=Math.max(now,(q.updatedAt||0)+1);changed=true}});
  for(const id in (prev.q||{}))if(!cur.q[id]){S.tomb.q[id]=now;changed=true}
  if(prev.prefs!==cur.prefs){S.prefs=Math.max(now,(S.prefs||0)+1);changed=true}
  touched.forEach(([w,lid])=>{cur.w[w.id]=wEntry(w,lid)});/* 시각만 바뀐 단어 지문 다시 (srs 시각은 지문에 안 들어가지만 연습칸 t 는 빼고 계산하니 그대로) */
  return{snap:cur,changed}}

/* 동기화할 부분만 (기기 전용: cur, lastPos 같은 건 뺌) */
function payload(st){return{v:1,app:"vocab-cloud",langs:st.langs||[],words:st.words||{},customSub:st.customSub||{},seeded:st.seeded||{},prefs:st.prefs||{},notes:st.notes||[],qs:st.qs||[],stamps:ensureStamps(st)}}
function canon(p){/* 순서 차이는 무시하고 비교 */if(!p)return"";const w={};Object.keys(p.words||{}).forEach(l=>{const a=(p.words[l]||[]).slice().sort((x,y)=>x.id<y.id?-1:x.id>y.id?1:0);if(a.length)w[l]=a});
  const cs={};Object.keys(p.customSub||{}).forEach(k=>{const a=(p.customSub[k]||[]).slice().sort();if(a.length)cs[k]=a});
  const notes=(p.notes||[]).slice().sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const qs=(p.qs||[]).slice().sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);const o={langs:(p.langs||[]).slice().sort((a,b)=>a.id<b.id?-1:1),words:w,customSub:cs,seeded:p.seeded||{},prefs:p.prefs||{},notes,stamps:p.stamps||{}};
  if(qs.length)o.qs=qs;/* 궁금증 없으면 예전 모양 그대로 (빈 묘비 q 도 무시) */
  if(o.stamps.tomb&&o.stamps.tomb.q&&!Object.keys(o.stamps.tomb.q).length){o.stamps={...o.stamps,tomb:{...o.stamps.tomb}};delete o.stamps.tomb.q}
  return stable(o)}

function pickBy(a,b,ta,tb){if(ta>tb)return a;if(tb>ta)return b;return stable(a)>=stable(b)?a:b}
function mergeKeyed(a,b){/* 변화표 연습 칸별 */if(!a&&!b)return undefined;const o={};const ks=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);
  ks.forEach(k=>{const x=a&&a[k],y=b&&b[k];if(!x){o[k]=y;return}if(!y){o[k]=x;return}
    const tx=x.t||0,ty=y.t||0;o[k]=tx!==ty?(tx>ty?x:y):((x.reps||0)!==(y.reps||0)?((x.reps||0)>(y.reps||0)?x:y):pickBy(x,y,0,0))});return o}
function mergeWord(a,b){const c=pickBy(a,b,a.updatedAt||0,b.updatedAt||0);const s=pickBy(a,b,a.srsAt||0,b.srsAt||0);
  const o={...contentOf(c),updatedAt:c.updatedAt||0};SRS_KEYS.forEach(k=>{if(s[k]!==undefined)o[k]=s[k]});o.srsAt=s.srsAt||0;
  ["conjSRS","declSRS"].forEach(f=>{const m=mergeKeyed(a[f],b[f]);if(m!==undefined)o[f]=m});return o}
function deepUnion(a,b){if(Array.isArray(a)||Array.isArray(b)){const out=[...(Array.isArray(a)?a:[])];(Array.isArray(b)?b:[]).forEach(x=>{if(!out.some(y=>stable(y)===stable(x)))out.push(x)});return out}
  if(a&&typeof a==="object"&&b&&typeof b==="object"){const o={...a};for(const k in b)o[k]=k in a?deepUnion(a[k],b[k]):b[k];return o}
  if(a===undefined||a===null)return b;if(b===undefined||b===null)return a;return a||b}
const nf=s=>String(s==null?"":s).normalize("NFD").replace(/[\u0301\u0300]/g,"").normalize("NFC").toLowerCase().replace(/[’']/g,"'").replace(/\s+/g," ").trim();
const dupKey=(lid,w)=>lid+"\u0001"+nf(w.word)+"\u0001"+(w.pos||"")+"\u0001"+nf(w.meaning);

/* 합치기: 로컬 L + 원격 R → 새 payload. now 는 중복 정리 묘비용 */
function merge(L,R,now){now=now||Date.now();L=L||payload({});R=R||payload({});
  const SL=L.stamps||{},SR=R.stamps||{};const tl=(SL.tomb||{}),tr=(SR.tomb||{});
  const tomb={w:{},l:{},n:{},q:{}};["w","l","n","q"].forEach(k=>{[tl[k]||{},tr[k]||{}].forEach(o=>{for(const id in o)tomb[k][id]=Math.max(tomb[k][id]||0,o[id])})});
  for(const k of["w","l","n","q"])for(const id in tomb[k])if(now-tomb[k][id]>TOMB_TTL)delete tomb[k][id];
  /* 언어 */
  const ls={},la={...(SR.l||{})};for(const id in SL.l||{})la[id]=Math.max(la[id]||0,SL.l[id]);
  const lmap=new Map();const order=[];
  const addL=(l,side)=>{if(!l||!l.id)return;if(!lmap.has(l.id)){lmap.set(l.id,{});order.push(l.id)}lmap.get(l.id)[side]=l};
  (L.langs||[]).forEach(l=>addL(l,"L"));(R.langs||[]).forEach(l=>addL(l,"R"));
  const langs=[];order.forEach(id=>{const e=lmap.get(id);const tL=(SL.l||{})[id]||0,tR=(SR.l||{})[id]||0;
    const rec=e.L&&e.R?(tR>tL?e.R:e.L):(e.L||e.R);const t=Math.max(tL,tR);ls[id]=t;
    if(tomb.l[id]&&tomb.l[id]>=t)return;if(tomb.l[id])delete tomb.l[id];langs.push(rec)});
  const live=new Set(langs.map(l=>l.id));
  /* 단어 */
  const idx=(P)=>{const m=new Map();Object.keys(P.words||{}).forEach(lid=>(P.words[lid]||[]).forEach(w=>{if(w&&w.id)m.set(w.id,{w,lid})}));return m};
  const A=idx(L),B=idx(R);const out=new Map();const side=new Map();
  new Set([...A.keys(),...B.keys()]).forEach(id=>{const a=A.get(id),b=B.get(id);let rec,lid;
    if(a&&b){rec=mergeWord(a.w,b.w);lid=(pickBy(a.w,b.w,a.w.updatedAt||0,b.w.updatedAt||0)===a.w?a:b).lid;side.set(id,"both")}
    else{const e=a||b;rec=e.w;lid=e.lid;side.set(id,a?"L":"R")}
    const t=tomb.w[id];if(t&&t>=wordTs(rec))return;if(t)delete tomb.w[id];
    out.set(id,{w:rec,lid})});
  /* 두 기기가 따로 만든 같은 단어(예: 기본 단어 팩) → 하나로 */
  const groups=new Map();out.forEach((e,id)=>{const k=dupKey(e.lid,e.w);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(id)});
  groups.forEach(ids=>{if(ids.length<2)return;const hasL=ids.some(i=>side.get(i)==="L"),hasR=ids.some(i=>side.get(i)==="R");if(!hasL||!hasR)return;
    const cand=ids.slice();
    cand.sort((x,y)=>{const a=out.get(x).w,b=out.get(y).w;const pr=w=>(w.reps||0)+(w.last?1:0)+Object.keys(w.conjSRS||{}).length+Object.keys(w.declSRS||{}).length;
      return pr(b)-pr(a)||dateMs(b.last)-dateMs(a.last)||(b.updatedAt||0)-(a.updatedAt||0)||(x<y?-1:1)});
    const keep=cand[0];cand.slice(1).forEach(i=>{if(side.get(i)==="both")return;const w=out.get(i).w;tomb.w[i]=Math.max(now,wordTs(w)+1);out.delete(i)});void keep});
  const words={};const placed=new Set();
  const put=(id)=>{if(placed.has(id)||!out.has(id))return;const e=out.get(id);if(!live.has(e.lid))return;(words[e.lid]=words[e.lid]||[]).push(e.w);placed.add(id)};
  Object.keys(L.words||{}).forEach(lid=>(L.words[lid]||[]).forEach(w=>w&&put(w.id)));
  Object.keys(R.words||{}).forEach(lid=>(R.words[lid]||[]).forEach(w=>w&&put(w.id)));
  langs.forEach(l=>{words[l.id]=words[l.id]||[]});
  /* 분류·기본단어 표시: 합집합, 설정: 최근 것 */
  const customSub=deepUnion(L.customSub||{},R.customSub||{});
  const seeded=deepUnion(L.seeded||{},R.seeded||{});
  const pL=SL.prefs||0,pR=SR.prefs||0;const prefs=pR>pL?(R.prefs||{}):(L.prefs||{});
  /* 필기 노트: 노트 단위로 더 최근 것, 묘비가 더 새로우면 삭제 */
  const nm=new Map();const nord=[];[[L.notes,"L"],[R.notes,"R"]].forEach(([arr])=>(arr||[]).forEach(n=>{if(!n||!n.id)return;if(!nm.has(n.id)){nm.set(n.id,n);nord.push(n.id)}else{const o=nm.get(n.id);nm.set(n.id,pickBy(o,n,o.updatedAt||0,n.updatedAt||0))}}));
  const notes=[];nord.forEach(id=>{const n=nm.get(id);const t=tomb.n[id];if(t&&t>=(n.updatedAt||0))return;if(t)delete tomb.n[id];notes.push(n)});
  /* v22: 궁금증 — 항목마다 더 최근 것, 묘비가 더 새로우면 삭제 */
  const qm=new Map();const qord=[];[L.qs,R.qs].forEach(arr=>(arr||[]).forEach(q=>{if(!q||!q.id)return;if(!qm.has(q.id)){qm.set(q.id,q);qord.push(q.id)}else{const o=qm.get(q.id);qm.set(q.id,pickBy(o,q,o.updatedAt||0,q.updatedAt||0))}}));
  const qs=[];qord.forEach(id=>{const q=qm.get(id);const t=tomb.q[id];if(t&&t>=(q.updatedAt||0))return;if(t)delete tomb.q[id];qs.push(q)});
  return{v:1,app:"vocab-cloud",langs,words,customSub,seeded,prefs,notes,qs,stamps:{l:ls,prefs:Math.max(pL,pR),tomb}}}

/* ---------- GitHub Gist API ---------- */
class SyncError extends Error{constructor(kind,msg,extra){super(msg);this.kind=kind;Object.assign(this,extra||{})}}
function gist(opts){const f=opts.fetch||(typeof fetch!=="undefined"?fetch.bind(globalThis):null);const token=opts.token;
  async function req(method,path,body){let res;
    try{res=await f((/^https?:/.test(path)?path:API+path),{method,cache:"no-store",headers:Object.assign({"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"},/^https:\/\/api\.github\.com\//.test(/^https?:/.test(path)?path:API+path)?{"Authorization":"Bearer "+token}:{},body?{"Content-Type":"application/json"}:{}),body:body?JSON.stringify(body):undefined})}
    catch(e){throw new SyncError("offline","network")}
    if(res.status===401)throw new SyncError("auth","bad token",{status:401});
    const rem=res.headers&&res.headers.get&&res.headers.get("x-ratelimit-remaining");const reset=res.headers&&res.headers.get&&res.headers.get("x-ratelimit-reset");
    if(res.status===429||(res.status===403&&(rem==="0"||/rate limit/i.test(await res.clone().text().catch(()=>"")))))
      throw new SyncError("rate","rate limited",{status:res.status,reset:reset?Number(reset)*1000:Date.now()+60e3,retryAfter:Number(res.headers.get&&res.headers.get("retry-after"))||0});
    if(res.status===403)throw new SyncError("auth","forbidden (gist 권한?)",{status:403});
    if(res.status===404)throw new SyncError("notfound","not found",{status:404});
    if(!res.ok)throw new SyncError("http","HTTP "+res.status,{status:res.status});
    return res.status===204?null:res.json()}
  async function readFile(g){const fl=g&&g.files&&g.files[GIST_FILE];if(!fl)return null;let txt=fl.content;
    if(fl.truncated&&fl.raw_url){let r;try{r=await f(fl.raw_url,{cache:"no-store"})}catch(e){throw new SyncError("offline","network")}if(!r.ok)throw new SyncError("http","raw "+r.status,{status:r.status});txt=await r.text()}
    if(!txt)return null;try{const p=JSON.parse(txt);return p&&p.app==="vocab-cloud"?p:null}catch(e){throw new SyncError("corrupt","gist 파일이 망가졌어")}}
  return{
    async find(){for(let page=1;page<=10;page++){const list=await req("GET",`/gists?per_page=100&page=${page}`);if(!Array.isArray(list)||!list.length)return null;
        const g=list.find(x=>x&&x.description===GIST_DESC&&x.files&&x.files[GIST_FILE]);if(g)return g.id;if(list.length<100)return null}return null},
    async create(p){const g=await req("POST","/gists",{description:GIST_DESC,public:false,files:{[GIST_FILE]:{content:JSON.stringify(p)}}});return g.id},
    async get(id){const g=await req("GET","/gists/"+encodeURIComponent(id));return{data:await readFile(g),updated:g&&g.updated_at}},
    async put(id,p){await req("PATCH","/gists/"+encodeURIComponent(id),{files:{[GIST_FILE]:{content:JSON.stringify(p)}}})},
    async user(){return req("GET","/user")}}}

/* 한 번 동기화: (없으면 gist 찾기/만들기) → 받기 → 합치기 → 바뀌었으면 올리기 */
async function syncOnce(o){/* o={fetch,token,gistId,local(payload),now} → {gistId,merged,pushed,created,changedLocal} */
  const api=gist(o);let id=o.gistId,created=false,remote=null;
  if(id){try{remote=(await api.get(id)).data}catch(e){if(e.kind!=="notfound")throw e;id=null}}
  if(!id){id=await api.find();if(id)remote=(await api.get(id)).data}
  const merged=merge(o.local,remote,o.now);
  if(!id){id=await api.create(merged);created=true;return{gistId:id,merged,pushed:true,created,changedLocal:canon(merged)!==canon(o.local)}}
  const pushed=canon(merged)!==canon(remote);if(pushed)await api.put(id,merged);
  return{gistId:id,merged,pushed,created,changedLocal:canon(merged)!==canon(o.local)}}

const SYNC={GIST_DESC,GIST_FILE,API,stable,snapshot,stamp,migrateStamps,payload,canon,merge,mergeWord,gist,syncOnce,SyncError,wordTs};
G.SYNC=SYNC;if(typeof module!=="undefined")module.exports=SYNC;
})(typeof window!=="undefined"?window:globalThis);
