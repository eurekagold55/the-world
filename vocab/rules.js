/* 단어 구름 — 러시아어 발음 표기 + 문법 규칙 설명 엔진 (v11)
   순수 함수만 있어서 브라우저(window.RULES)와 node(module.exports) 둘 다 씀. */
(function(G){
"use strict";
const ACUTE="\u0301",GRAVE="\u0300";
const VOW="аеёиоуыэюя";
const isV=c=>VOW.includes(c);
const nfc=s=>String(s==null?"":s).normalize("NFC");
const strip=s=>nfc(String(s==null?"":s).normalize("NFD").replace(/[\u0301\u0300]/g,""));
const low=s=>strip(s).toLowerCase();

/* ================= 1. 러시아어 발음 표기 ================= */
const PROCL=new Set(["в","во","на","с","со","к","ко","о","об","обо","у","по","за","из","изо","от","ото","до","без","безо","под","подо","над","надо","при","про","для","не","ни","через"]);
const ENCL=new Set(["же","ж","ли","ль","бы","б","то","нибудь","либо","ка","таки"]);
const CH_SH={"что":[0],"чтобы":[0],"ничто":[2],"нечто":[2],"конечно":[4],"скучно":[3],"скучный":[3],"скучная":[3],"скучное":[3],"скучные":[3],"нарочно":[4],"яичница":[3],"скворечник":[6],"прачечная":[5],"пустячный":[5]};
const OGO_NO=new Set(["много","немного","премного","строго","нестрого","дорого","недорого","убого","отлого","полого","разлого","ого","ого-го","того-сего"]);
const VD={б:"п",в:"ф",г:"к",д:"т",ж:"ш",з:"с"},VL={п:"б",ф:"в",к:"г",т:"д",ш:"ж",с:"з"};
const VLESS="пфктшсхцчщ",SON="лмнрй";

/* 한 단어 → 글자 배열 [{c, up, st}] */
function letters(word){const out=[];const d=nfc(word).normalize("NFD");
  for(let i=0;i<d.length;i++){const ch=d[i];
    if(ch===ACUTE||ch===GRAVE){for(let j=out.length-1;j>=0;j--){if(isV(out[j].c)){if(ch===ACUTE)out[j].st=true;break}}continue}
    if(ch==="\u0308"&&out.length&&out[out.length-1].c==="е"){out[out.length-1].c="ё";continue}
    if(ch==="\u0306"&&out.length&&out[out.length-1].c==="и"){out[out.length-1].c="й";continue}
    const lc=ch.toLowerCase();out.push({c:lc,up:lc!==ch,st:false,o:lc})}
  return out}
function vowelCount(arr){return arr.filter(x=>isV(x.c)).length}

/* 단어 하나 분석: stress 정보 있는지 */
function prepWord(tok){const L=letters(tok);const plain=L.map(x=>x.c).join("");
  const nv=vowelCount(L);let has=L.some(x=>x.st);
  if(!has){const yo=L.find(x=>x.c==="ё");if(yo){yo.st=true;has=true}}
  else L.forEach(x=>{if(x.c==="ё")x.st=true});
  if(!has&&nv===1){L.find(x=>isV(x.c)).st=true;has=true}
  return{L,plain,nv,has}}

/* phon(entry) → {text:"[малако́]", html, parts} 또는 null(강세 모름) */
function phon(entry,opt){opt=opt||{};let s=nfc(entry).replace(/\([^)]*\)/g," ").trim();
  if(!/[а-яё]/i.test(strip(s)))return null;
  const alts=s.split(/\s*[,;\/]\s*/).filter(a=>/[а-яё]/i.test(strip(a)));
  if(!alts.length)return null;
  const res=alts.map(a=>phonOne(a));if(res.some(r=>!r))return null;
  return{text:"["+res.map(r=>r.text).join(", ")+"]",html:"["+res.map(r=>r.html).join(", ")+"]"}}

function phonOne(str){
  /* 토큰: 단어(키릴), 공백, 하이픈, 기타 */
  const raw=str.match(/[\p{L}\u0300-\u036f]+|[\s]+|-|[^\p{L}\s-]+/gu)||[];
  const toks=raw.map(t=>/^[\p{L}\u0300-\u036f]+$/u.test(t)?{w:t}:{sep:t});
  const words=toks.filter(t=>t.w);if(!words.length)return null;
  words.forEach((t,i)=>{t.p=prepWord(t.w);const pl=t.p.plain;
    const prevSep=toks[toks.indexOf(t)-1];
    t.clitic=(PROCL.has(pl)&&!/\u0301/.test(t.w.normalize("NFD"))&&words.length>1&&i<words.length-1)?"pro":
      (ENCL.has(pl)&&i>0&&(pl!=="то"||(prevSep&&prevSep.sep==="-"))&&!/\u0301/.test(t.w.normalize("NFD")))?"en":"";
    if(t.clitic){t.p.L.forEach(x=>{if(x.c!=="ё")x.st=false})}});
  if(words.some(t=>!t.clitic&&!t.p.has&&t.p.nv>0))return null;
  if(words.every(t=>t.clitic))words.forEach(t=>t.clitic="");
  /* 음운 그룹 = 접어 + 본 단어. 그룹 사이 공백은 '휴지'(무성화 기준) */
  const groups=[];let cur=[];
  toks.forEach(t=>{cur.push(t);if(t.w&&!t.clitic){const nx=toks.slice(toks.indexOf(t)+1).find(z=>z.w);
      const nxEn=nx&&nx.clitic==="en";if(!nxEn){groups.push(cur);cur=[]}}
    else if(t.w&&t.clitic==="en"){const nx=toks.slice(toks.indexOf(t)+1).find(z=>z.w);if(!(nx&&nx.clitic==="en")){groups.push(cur);cur=[]}}});
  if(cur.length)groups.push(cur);
  let text="",html="";
  groups.forEach(g=>{const r=phonGroup(g);text+=r.text;html+=r.html});
  return{text:text.trim(),html:html.trim()}}

function lexical(t){const L=t.p.L,pl=t.p.plain;
  if(CH_SH[pl])CH_SH[pl].forEach(i=>{if(L[i]&&L[i].c==="ч")L[i].c="ш"});
  /* 대명사·형용사 생격 -ого/-его: г → в */
  if(/(ого|его)$/.test(pl)&&!OGO_NO.has(pl)&&pl.length>=3){const g=L[L.length-2];if(g.c==="г")g.c="в"}
  if(/^сегодня/.test(pl))L[2].c="в";
  if(pl==="бог")L[2].c="х";
  /* 발음 안 되는 자음 */
  const drop=(re,idx)=>{let s=L.map(x=>x.c).join(""),m;const rx=new RegExp(re,"g");const kill=[];while((m=rx.exec(s))){kill.push(m.index+idx)}
    for(let k=kill.length-1;k>=0;k--)L.splice(kill[k],1)};
  drop("стн",1);drop("здн",1);drop("вств",0);drop("лнц",0);drop("рдц",1);drop("стл",1);drop("нтск",1);drop("ндск",1);
  /* сч, зч, жч → щ */
  let s=L.map(x=>x.c).join(""),m;const rx=/[сзж]ч/g;const at=[];while((m=rx.exec(s)))at.push(m.index);
  for(let k=at.length-1;k>=0;k--){L[at[k]+1].c="щ";L.splice(at[k],1)}
  /* -тся / -ться → -цца */
  s=L.map(x=>x.c).join("");const mm=s.match(/ть?ся$/);
  if(mm){const st=s.length-mm[0].length;const ya=L[L.length-1];if(!ya.st)L.splice(st,mm[0].length,{c:"ц",o:"ц"},{c:"ц",o:"ц"},{c:"а",o:"а",fixed:true})}
  /* гк, гч → хк, хч */
  for(let i=0;i<L.length-1;i++)if(L[i].c==="г"&&(L[i+1].c==="к"||L[i+1].c==="ч")&&i>0)L[i].c="х"}

function phonGroup(g){
  /* 평평한 배열: 글자 + 경계 */
  const seq=[];g.forEach(t=>{if(t.w){lexical(t);t.p.L.forEach((x,i)=>seq.push({...x,wi:i,wlen:t.p.L.length,tok:t}))}else seq.push({sep:t.sep})});
  const letterIdx=seq.map((x,i)=>x.sep==null?i:-1).filter(i=>i>=0);
  const prevL=i=>{for(let j=i-1;j>=0;j--)if(seq[j].sep==null)return seq[j];return null};
  const nextL=i=>{for(let j=i+1;j<seq.length;j++)if(seq[j].sep==null)return seq[j];return null};
  const sepBefore=i=>{for(let j=i-1;j>=0;j--){if(seq[j].sep==null)return false;if(/\s/.test(seq[j].sep))return true}return false};
  const out=seq.map(x=>x.sep!=null?{t:x.sep}:{t:x.c,up:x.up,st:x.st});
  /* 모음 */
  letterIdx.forEach(i=>{const x=seq[i];if(!isV(x.c))return;const p=prevL(i);const pc=p?p.c:"";
    const afterVowelish=!p||isV(pc)||pc==="ь"||pc==="ъ";
    const wordFinal=x.wi===x.wlen-1&&x.tok.clitic!=="pro";const tail=x.tok.p.L.slice(x.wi).map(z=>z.c).join("");
    const hush="жшц".includes(pc)&&pc!=="";
    if(x.fixed)return;
    if(x.st){if(x.c==="и"&&hush)out[i].t="ы";return}
    let v=x.c;
    switch(x.c){
      case"о":v="а";break;
      case"а":v=("чщ".includes(pc)&&pc&&!wordFinal)?"и":"а";break;
      case"э":v="и";break;
      case"е":if(wordFinal)v=pc==="ц"?"е":hush?"ы":(afterVowelish?"йе":"е");else v=hush?"ы":(afterVowelish?"йи":"и");break;
      case"я":{const ending=/^(я|ям|ях|ями)$/.test(tail);v=ending?"я":(afterVowelish?"йи":"и");break}
      case"и":v=hush?"ы":"и";break;
    }
    out[i].t=v});
  /* 자음: 뒤에서 앞으로 유성/무성 동화 + 어말 무성화 */
  let state="pause";
  for(let k=letterIdx.length-1;k>=0;k--){const i=letterIdx[k];const x=seq[i];let c=out[i].t;
    if(x.c==="ь"||x.c==="ъ")continue;
    if(isV(x.c)){state=null;continue}
    if(SON.includes(x.c)){state=null;continue}
    if(VD[c]&&(state==="pause"||state==="vl"))c=VD[c];
    else if(VL[c]&&state==="vd")c=VL[c];
    out[i].t=c;
    if(VLESS.includes(c))state="vl";else if(VD[c])state=(x.c==="в"&&c==="в")?null:"vd";else state=null}
  /* 연음 부호 */
  letterIdx.forEach(i=>{const x=seq[i];if(x.c==="ь"){const p=prevL(i);out[i].t=(p&&"жшчщ".includes(out[letterIdx[letterIdx.indexOf(i)-1]].t))?"":"'"}
    if(x.c==="ъ")out[i].t=""});
  let text="",html="";const nV=letterIdx.filter(i=>isV(seq[i].c)).length;
  out.forEach((o,i)=>{let t=o.t;if(o.up&&t)t=t[0].toUpperCase()+t.slice(1);
    if(o.st&&nV>1){text+=t+(t==="ё"||t==="Ё"?"":ACUTE);html+='<u class="sv">'+t+"</u>"}else{text+=t;html+=t.replace(/[&<>]/g,"")}});
  return{text,html}}

/* 강세 위치 (몇 번째 음절, 0부터). 모르면 -1 */
function stressPos(form){const L=letters(form);let n=-1,k=0;for(const x of L){if(isV(x.c)){if(x.st||x.c==="ё"){n=k;break}k++}}
  if(n<0&&vowelCount(L)===1)return 0;return n}
function stressOnEnding(form,stemLen){/* stemLen=줄기 글자 수(강세 뺀) */const L=letters(form);let k=0;for(let i=0;i<L.length;i++){if(L[i].st||L[i].c==="ё")return i>=stemLen;}return null}


/* ================= 2. 문법 규칙 설명 엔진 ================= */
const first=v=>low(String(v||"").split(/\s*[,\/]\s*/)[0]).trim();
const ends=(s,arr)=>arr.find(e=>s.endsWith(e));
const HUSH7="гкхжшщч",HUSH5="жшщчц";
function cpre(a,b){let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;return i}
/* 강세가 어미에 있나: form(강세 포함)에서 강세 모음 위치가 줄기 길이 이상이면 어미 */
function stressIdx(form){const L=letters(String(form||"").split(/\s*,\s*/)[0]);for(let i=0;i<L.length;i++)if(L[i].st||L[i].c==="ё")return i;
  const vs=L.map((x,i)=>isV(x.c)?i:-1).filter(i=>i>=0);return vs.length===1?vs[0]:-1}
function hasStress(form){return stressIdx(form)>=0}

/* ---------- 러시아어 동사 ---------- */
const RU_IRR={
  "быть":"불규칙 — 외워야 함. 현재형은 거의 안 쓰고(есть), 미래는 бу́ду, бу́дешь…, 과거 был/была́/бы́ло/бы́ли.",
  "есть":"불규칙 — 외워야 함 (ем, ешь, ест, еди́м, еди́те, едя́т). 1식도 2식도 아닌 옛 변화.",
  "дать":"불규칙 — 외워야 함 (дам, дашь, даст, дади́м, дади́те, даду́т). 완료상이라 미래 뜻.",
  "хотеть":"혼합 변화 — 단수는 1식처럼 т→ч (хочу́, хо́чешь, хо́чет), 복수는 2식 (хоти́м, хоти́те, хотя́т). 외워야 함.",
  "бежать":"혼합 변화 — бегу́/бегу́т는 1식 꼴, 나머지는 2식 (бежи́шь, бежи́т…). 외워야 함.",
  "идти":"현재는 1식 규칙 (иду́, идёшь)인데 과거가 шёл/шла/шло/шли — 불규칙, 외워야 함.",
  "ехать":"현재 줄기가 ед- (е́ду, е́дешь) — 불규칙, 외워야 함.",
  "жить":"현재 줄기에 в가 들어가 (живу́, живёшь) — 외워야 함.",
  "брать":"현재 줄기 бер- (беру́, берёшь) — 외워야 함.",
  "звать":"현재 줄기 зов- (зову́, зовёшь) — 외워야 함.",
  "мочь":"-чь 동사: 원형엔 안 보이는 줄기 г가 숨어 있어 (мочь ← мог-).",
  "спать":"-ать인데 2식 + я에서 п→пл (сплю, спишь).",
  "петь":"현재 줄기 по- (пою́, поёшь) — 외워야 함."};
const RU_2_EXC=["смотреть","видеть","ненавидеть","зависеть","вертеть","обидеть","терпеть","гнать","держать","дышать","слышать"];
const RU_P_KO={ja:"я",ty:"ты",on:"он/она",my:"мы",vy:"вы",oni:"они"};
const RU_END={1:{ja:"-у/-ю",ty:"-ешь (강세면 -ёшь)",on:"-ет/-ёт",my:"-ем/-ём",vy:"-ете/-ёте",oni:"-ут/-ют"},2:{ja:"-у/-ю",ty:"-ишь",on:"-ит",my:"-им",vy:"-ите",oni:"-ат/-ят"}};
const ALT_KO={"т>ч":"т→ч","д>ж":"д→ж","с>ш":"с→ш","з>ж":"з→ж","ст>щ":"ст→щ","ск>щ":"ск→щ","т>щ":"т→щ","д>жд":"д→жд","к>ч":"к→ч","г>ж":"г→ж","х>ш":"х→ш","б>бл":"б→бл","п>пл":"п→пл","в>вл":"в→вл","м>мл":"м→мл","ф>фл":"ф→фл"};
function altOf(a,b){/* a=원래 줄기, b=바뀐 줄기 */let p=cpre(a,b);if(p===a.length&&p>0)p--;if(p===b.length&&p>0)p--;
  const from=a.slice(p),to=b.slice(p);let k=from+">"+to;if(ALT_KO[k])return ALT_KO[k];
  for(let q=p-1;q>=Math.max(0,p-2);q--){k=a.slice(q)+">"+b.slice(q);if(ALT_KO[k])return ALT_KO[k]}
  return from&&to&&from!==to?from+"→"+to:""}
function ruVerb(w){
  const infRaw=low(w.word||"").replace(/\s.*$/,"");const refl=/(ся|сь)$/.test(infRaw);const inf=refl?infRaw.replace(/(ся|сь)$/,""):infRaw;
  const C=w.conj||{};const F={};["ja","ty","on","my","vy","oni"].forEach(p=>{let v=first(C["pres."+p]);if(refl)v=v.replace(/(ся|сь)$/,"");F[p]=v});
  const P={};["m","f","n","pl"].forEach(p=>{let v=first(C["past."+p]);if(refl)v=v.replace(/(ся|сь)$/,"");P[p]=v});
  const raw=k=>String(C[k]||"").split(/\s*,\s*/)[0];
  const sum=[],cells={};let cls=0,clsWhy="",guess=false;
  const isFut=w.ruTense==="fut"||(w.aspectPf&&low(w.aspectPf)===infRaw&&low(w.aspectImp||"")!==infRaw);
  const base=Object.keys(RU_IRR).find(b=>inf===b||(inf.endsWith(b)&&inf.length-b.length<=3&&!["есть","дать","быть"].includes(b)));
  /* 1·2식 판정 */
  if(F.ty){if(/[её]шь$/.test(F.ty))cls=1;else if(/ишь$/.test(F.ty))cls=2;
    if(cls===1&&/им$/.test(F.my))cls=3;if(cls===2&&/ут$|ют$/.test(F.oni))cls=3}
  else{guess=true;cls=(/ить$/.test(inf)&&!/^(брить|стелить)$/.test(inf))||RU_2_EXC.some(e=>inf===e||inf.endsWith(e))?2:1}
  if(cls===1)clsWhy="1식 (е-변화): ты -ешь, они -ут/-ют."+(/ить$/.test(inf)?" -ить인데 1식인 예외야.":" -ить가 아닌 동사 대부분이 이쪽.");
  else if(cls===2)clsWhy="2식 (и-변화): ты -ишь, они -ат/-ят."+(/ить$/.test(inf)?" -ить 동사 대부분이 2식.":RU_2_EXC.some(e=>inf.endsWith(e))?" -ить가 아닌데 2식인 예외 11개 중 하나 (смотреть, видеть, держать, слышать…).":"");
  else clsWhy="1식·2식이 섞인 혼합 변화 — 불규칙, 외워야 함.";
  sum.push((guess?"(표가 비어서 원형만 보고 추측) ":"")+clsWhy);
  if(base&&RU_IRR[base])sum.push(RU_IRR[base]);
  /* 자음 교체 */
  let altNote="",altCells={};
  const sJa=F.ja.replace(/[ую]$/,""),sTy=F.ty.replace(/[её]шь$|ишь$/,""),sOni=F.oni.replace(/[ую]т$|[ая]т$/,"");
  if(F.ja&&F.ty&&cls===2&&sJa!==sTy){const a=altOf(sTy,sJa);if(a){altNote=`2식은 я에서만 자음이 바뀌어: ${a} (${F.ja}, ${F.ty}). 나머지 인칭은 원래 줄기.`;altCells.ja=`자음 교체 ${a} (2식은 я만 바뀜)`}}
  if(F.ja&&F.ty&&cls===1&&sJa!==sTy&&sJa===sOni){const a=altOf(sJa,sTy);altNote=`я·они는 ${sJa}-, 나머지는 ${sTy}- (${a}). -чь/-ти 동사에서 자주 보여 (могу́, мо́жешь, мо́гут).`;["ja","oni"].forEach(p=>altCells[p]=`я·они만 ${sJa}- 줄기`);["ty","on","my","vy"].forEach(p=>altCells[p]=`${a}: я·они 빼고 ${sTy}- 줄기`)}
  if(!altNote&&F.ty&&cls===1){const pres=sTy;let istem=inf.replace(/(ать|ять|еть|ить|оть|уть|ыть|ти|ть|чь)$/,"");
    if(/(ова|ева)ть$/.test(inf)&&/[уюь]$/.test(pres)||/(ова|ева)ть$/.test(inf))altNote="-овать/-евать → 현재 줄기 -у-/-ю- (рисова́ть → рису́ю, рису́ешь).";
    else if(/авать$/.test(inf)&&pres+"вать"===inf.replace(/ать$/,"")+"ать".slice(3))altNote="";
    if(!altNote&&/авать$/.test(inf)&&inf.slice(0,-5)+"а"===pres)altNote="-авать → 현재엔 -ва-가 빠져 (дава́ть → даю́, даёшь).";
    if(!altNote&&/нуть$/.test(inf))altNote="-нуть → 현재 줄기 -н- (кри́кнуть → кри́кну, кри́кнешь).";
    if(!altNote&&istem&&pres&&pres!==istem&&!pres.startsWith(istem)){const a=altOf(istem,pres);
      if(a&&ALT_KO[a.replace("→",">")]&&cpre(istem,pres)>=istem.length-2)altNote=`1식 일부는 모든 인칭에서 자음이 바뀌어: ${a} (${inf} → ${F.ja}, ${F.ty}).`;
      else if(!base)altNote=`현재 줄기 ${pres}-가 원형에서 바로 안 나와 — 외워야 함.`}}
  if(altNote)sum.push(altNote);
  /* 철자 규칙 */
  if(F.ja&&/[жшчщ]у$/.test(F.ja)&&cls===2)sum.push("ж/ш/ч/щ 뒤엔 ю·я 대신 у·а를 써 (철자 규칙): "+(F.oni&&/ат$/.test(F.oni)?F.oni:F.ja)+".");
  /* 강세 */
  let stressNote="";const rj=raw("pres.ja"),rt=raw("pres.ty");const SE={};
  const PS=["ja","ty","on","my","vy","oni"];
  PS.forEach(p=>{const r=raw("pres."+p).replace(/(ся|сь)$/,"");if(!F[p]||!hasStress(r))return;const st=F[p].replace(/(у|ю|ешь|ёшь|ишь|ет|ёт|ит|ем|ём|им|ете|ёте|ите|ут|ют|ат|ят)$/,"");SE[p]=stressIdx(r)>=st.length});
  const known=PS.filter(p=>p in SE);
  if(known.length===6){const on=known.filter(p=>SE[p]);
    if(on.length===6)stressNote="강세는 계속 어미에 ("+rj+", "+rt+").";
    else if(on.length===0)stressNote="강세는 계속 줄기에 ("+rj+", "+rt+").";
    else if(on.length===1&&SE.ja)stressNote="움직이는 강세: я만 어미에 강세, 나머지는 줄기로 넘어가 ("+rj+" → "+rt+").";
    else stressNote="강세가 인칭마다 달라: 어미 — "+on.map(p=>RU_P_KO[p]).join(", ")+" / 줄기 — "+PS.filter(p=>!SE[p]).map(p=>RU_P_KO[p]).join(", ")+"."}
  if(stressNote)sum.push(stressNote);
  /* 상 */
  if(isFut)sum.push("완료상(сов.): 한 번에 끝내는 행동. 현재형이 없어서 이 표의 첫 칸은 미래 뜻이야 (напишу́ = 다 쓸게)."+(w.aspectImp&&low(w.aspectImp)!==infRaw?" 불완료 짝: "+w.aspectImp:""));
  else if(w.aspectImp||w.aspectPf)sum.push("불완료상(несов.): 진행·반복. 현재형이 있고, 미래는 бу́ду + 원형."+(w.aspectPf&&low(w.aspectPf)!==infRaw?" 완료 짝: "+w.aspectPf:""));
  /* 과거 */
  const pstem=inf.replace(/(ть|ти|чь)$/,"");let pastNote="";
  if(P.m){if(/л$/.test(P.m)&&P.m.slice(0,-1)===pstem)pastNote="과거: 원형에서 -ть 떼고 -л(남)/-ла(여)/-ло(중)/-ли(복). 주어의 성·수에 맞춰 (인칭은 상관없음).";
    else if(/л$/.test(P.m))pastNote="과거는 -л/-ла/-ло/-ли인데 줄기가 원형이랑 달라 ("+P.m+") — 외워야 함.";
    else if(base==="идти"||/(шёл|шел)$/.test(P.m))pastNote="과거 "+P.m+"/"+P.f+" — 불규칙, 외워야 함.";
    else pastNote="남성 과거에 -л이 없어: 줄기가 자음(г/к/с/з/б/р)으로 끝나는 동사 ("+P.m+", "+P.f+"). 여·중·복은 -ла/-ло/-ли.";
    const rm=raw("past.m"),rf=raw("past.f"),rn=raw("past.n"),rpl=raw("past.pl");
    const endS=f=>{if(!hasStress(f)||ruVowels(f)<2)return null;const L=letters(f.replace(/(ся|сь)$/,""));return stressIdx(f)>=L.length-1};
    const mEnd=ruVowels(rm)>1&&hasStress(rm)?stressIdx(rm)>=letters(rm).length-2:false;
    const fE=endS(rf),nE=endS(rn),pE=endS(rpl);
    if(fE&&!mEnd){if(nE===false&&pE===false)pastNote+=" 여성형만 -ла́에 강세가 가 ("+rf+").";else if(nE&&pE)pastNote+=" 남성 빼고 강세가 어미로 가 ("+rf+", "+rn+", "+rpl+")."}}
  else pastNote="과거: 원형에서 -ть 떼고 -л/-ла/-ло/-ли (주어 성·수에 맞춰).";
  sum.push(pastNote);
  if(refl)sum.push("-ся 동사: 자음 뒤엔 -ся, 모음 뒤엔 -сь (учу́сь, у́чишься, учи́лась).");
  /* 칸별 */
  const tense=isFut?"미래(완료상)":"현재";
  ["ja","ty","on","my","vy","oni"].forEach(p=>{const e=cls===1||cls===2?RU_END[cls][p]:"";
    let t=`${tense} ${RU_P_KO[p]}: `+(cls===3?"혼합 변화라 이 칸은 외워야 함":`${cls}식 어미 ${e}`);
    if(cls!==3&&F[p]){const yu=/[юя]т?$/.test(F[p])||/ю$/.test(F[p]);if((p==="ja"||p==="oni")&&/[жшчщ][уа]т?$/.test(F[p]))t+=" · ж/ш/ч/щ 뒤라 у/а (철자 규칙)";else if(p==="ja"||p==="oni")t+=yu?" · 모음/부드러운 자음 뒤라 ю/я":" · 딱딱한 자음 뒤라 у/а"}
    if(altCells[p])t+=" · "+altCells[p];
    if(p in SE&&known.length===6&&!/계속/.test(stressNote))t+=" · 강세는 "+(SE[p]?"어미":"줄기");
    if(refl)t+=" · 끝에 -"+(/[аеёиоуыэюя]$/.test(F[p]||"")?"сь":"ся");
    cells["pres."+p]=t});
  const PG={m:"남성 주어 → -л",f:"여성 주어 → -ла",n:"중성 주어 → -ло",pl:"복수 주어 → -ли"};
  ["m","f","n","pl"].forEach(p=>{let t="과거 "+PG[p];if(P.m&&!/л$/.test(P.m)&&p==="m")t="과거 남성: -л 없이 줄기만 ("+P.m+")";if(base==="идти")t="과거 "+{m:"남성",f:"여성",n:"중성",pl:"복수"}[p]+": 불규칙 шёл/шла/шло/шли — 외워야 함";if(refl)t+=" · +ся/сь";cells["past."+p]=t});
  return{summary:sum,cells}}

/* ---------- 러시아어 명사 ---------- */
const MYA=["время","имя","племя","знамя","пламя","семя","бремя","стремя","вымя","темя"];
const CASE_KO={nom:"주격",gen:"생격",dat:"여격",acc:"대격",ins:"조격",pre:"전치격",loc:"처소격",par:"부분생격"};
const NE={/* [딱딱, 부드러움] */
  1:{"nom.s":[["а"],["я"]],"gen.s":[["ы"],["и"]],"dat.s":[["е"],["е"]],"acc.s":[["у"],["ю"]],"ins.s":[["ой","ою"],["ей","ёй","ею"]],"pre.s":[["е"],["е"]],
     "nom.p":[["ы"],["и"]],"gen.p":[[""],["ь","ей",""]],"dat.p":[["ам"],["ям"]],"ins.p":[["ами"],["ями"]],"pre.p":[["ах"],["ях"]]},
  2:{"nom.s":[[""],["ь","й"]],"gen.s":[["а"],["я"]],"dat.s":[["у"],["ю"]],"ins.s":[["ом"],["ем","ём"]],"pre.s":[["е"],["е"]],
     "nom.p":[["ы","а"],["и","я"]],"gen.p":[["ов"],["ей","ев","ёв"]],"dat.p":[["ам"],["ям"]],"ins.p":[["ами"],["ями"]],"pre.p":[["ах"],["ях"]]},
  "2n":{"nom.s":[["о"],["е","ё"]],"gen.s":[["а"],["я"]],"dat.s":[["у"],["ю"]],"acc.s":[["о"],["е","ё"]],"ins.s":[["ом"],["ем","ём"]],"pre.s":[["е"],["е"]],
     "nom.p":[["а"],["я"]],"gen.p":[[""],["ей",""]],"dat.p":[["ам"],["ям"]],"ins.p":[["ами"],["ями"]],"pre.p":[["ах"],["ях"]]},
  3:{"nom.s":[["ь"],["ь"]],"gen.s":[["и"],["и"]],"dat.s":[["и"],["и"]],"acc.s":[["ь"],["ь"]],"ins.s":[["ью"],["ью"]],"pre.s":[["и"],["и"]],
     "nom.p":[["и"],["и"]],"gen.p":[["ей"],["ей"]],"dat.p":[["ям","ам"],["ям","ам"]],"ins.p":[["ями","ами"],["ями","ами"]],"pre.p":[["ях","ах"],["ях","ах"]]}};
const CLS_KO={1:"1식(-а/-я)",2:"2식 남성",["2n"]:"2식 중성(-о/-е)",3:"3식(여성 -ь)"};
function spellVariants(list,sf){/* 철자 규칙 적용한 변형도 허용, 어떤 규칙인지 기록 */const out=[];
  list.forEach(e=>{out.push({e,r:""});
    if(HUSH7.includes(sf)&&/^ы/.test(e))out.push({e:"и"+e.slice(1),r:"7"});
    if(HUSH5.includes(sf)&&e==="ой")out.push({e:"ей",r:"5"});
    if(HUSH5.includes(sf)&&e==="ом")out.push({e:"ем",r:"5"});
    if(HUSH5.includes(sf)&&e==="ов")out.push({e:"ев",r:"5"});
    if("жшщчц".includes(sf)&&/^я/.test(e))out.push({e:"а"+e.slice(1),r:"ya"});
    if("жшщчц".includes(sf)&&/^ю/.test(e))out.push({e:"у"+e.slice(1),r:"ya"})});
  return out}
const SPELL_KO={"7":"г/к/х/ж/ш/щ/ч 뒤엔 ы 대신 и (7글자 규칙)","5":"ж/ш/щ/ч/ц 뒤 강세 없는 о는 е로 (5글자 규칙)","ya":"ж/ш/щ/ч/ц 뒤엔 я/ю 대신 а/у (철자 규칙)"};
function fleeting(a,b){/* a에서 о/е/ё 하나 빼면(또는 ь/й→е) b가 되나 */if(a.length!==b.length+1)return"";
  for(let i=0;i<a.length;i++)if("оеё".includes(a[i])&&a.slice(0,i)+a.slice(i+1)===b)return a[i];return""}
function fleetIns(stem,gp){/* 복수 생격에서 끼어든 모음 */if(gp.length===stem.length+1){for(let i=0;i<gp.length;i++)if("оеё".includes(gp[i])&&gp.slice(0,i)+gp.slice(i+1)===stem)return gp[i]}
  if(gp.length===stem.length){for(let i=0;i<stem.length;i++)if("ьй".includes(stem[i])&&"её".includes(gp[i])&&stem.slice(0,i)+stem.slice(i+1)===gp.slice(0,i)+gp.slice(i+1))return gp[i]}return""}
function ruNoun(w){const D=w.decl||{},I=w.declInfo||{};const sum=[],cells={};
  const nom=first(D["nom.s"]||w.word)||first(w.word);const word=first(w.word);
  if(I.indecl){sum.push("불변 명사: 격·수가 바뀌어도 모양 그대로 (외래어 -о/-и/-у 끝 등: метро́, ко́фе).");Object.keys(D).forEach(k=>cells[k]="불변이라 기본형 그대로");return{summary:sum,cells}}
  if(I.plOnly){sum.push("복수형만 있는 명사 (но́жницы, часы́ 같은): 복수 칸만 외우면 돼.")}
  let g=I.g||"";if(!g){if(/[ая]$/.test(nom))g="f";else if(/[оеё]$/.test(nom)||MYA.includes(nom))g="n";else if(/[^ь]$/.test(nom))g="m"}
  let cls=0,irr="";
  if(MYA.includes(nom)){irr="mya";sum.push("-мя 중성 (이질 변화 разносклоня́емые, 10개뿐) — 불규칙, 외워야 함: 주·대격 빼고 줄기에 -ен- (вре́мя → вре́мени, вре́менем, времена́).")}
  else if(nom==="мать"||nom==="дочь"){irr="mat";sum.push("불규칙 — 외워야 함: 주격·대격 단수 빼고 줄기에 -ер-이 붙어 ("+nom+" → "+(nom==="мать"?"ма́тери, ма́терью, ма́тери":"до́чери, до́черью, до́чери")+"). 그 밖엔 3식처럼.");cls=3}
  else if(nom==="путь"){irr="put";sum.push("불규칙 — 외워야 함: 남성인데 거의 3식처럼 (пути́, путём).")}
  else if(/[ая]$/.test(nom))cls=1;
  else if(/ь$/.test(nom))cls=g==="f"?3:g==="m"?2:0;
  else if(/[оеё]$/.test(nom))cls="2n";
  else cls=2;
  const stem=nom.replace(/[аяоеёьй]$/,"");const sf=stem.slice(-1);
  const soft=/[яьйё]$/.test(nom)||(cls==="2n"&&/е$/.test(nom)&&!HUSH5.includes(sf));
  const iya=/и[яйе]$/.test(nom);
  if(!irr&&cls){const gk={m:"남성",f:"여성",n:"중성"}[g]||"";
    let t=`${CLS_KO[cls]} 변화${gk&&cls===1?" · "+gk:""}`;
    if(cls===1)t+=": -а/-я로 끝나는 명사 (여성 대부분 + па́па 같은 남성).";
    else if(cls===2)t+=": 자음/-й/-ь로 끝나는 남성.";
    else if(cls==="2n")t+=": -о/-е로 끝나는 중성.";
    else t+=": -ь로 끝나는 여성. 단수 생·여·전은 다 -и, 조격 -ью.";
    sum.push(t);
    sum.push(soft?"부드러운 줄기 (끝 -я/-ь/-й/-е): 어미가 я·ю·е·и 쪽 (딱딱한 а·у·о·ы 짝).":"딱딱한 줄기: 어미가 а·у·о·ы 쪽.");
    if(iya)sum.push("-ия/-ие/-ий 명사: 전치격 단수 -ии"+(cls===1?"·여격 단수 -ии":"")+", 복수 생격 -ий (ста́нция → ста́нций).");
    if(HUSH7.includes(sf))sum.push(`줄기가 ${sf}로 끝나: ы 대신 и (7글자 규칙: г к х ж ш щ ч 뒤엔 ы 금지)`+(HUSH5.includes(sf)?" + 강세 없는 о는 е (5글자 규칙)":" · г/к/х는 5글자 규칙 대상이 아니라 -ой/-ом 그대로")+".");
    else if(sf==="ц")sum.push("ц 뒤: 강세 없는 о는 е (5글자 규칙: у́лица → у́лицей).")}
  if(cls===2&&/ь$/.test(nom)&&!g)sum.push("-ь 명사는 성별을 외워야 해 (남성이면 2식, 여성이면 3식).");
  /* 출몰 모음 */
  const gs=first(D["gen.s"]);
  if(gs&&(cls===2||cls===3)){const gstem=gs.replace(/[аяиы]$/,"");const fv=fleeting(nom.replace(/[ьй]$/,""),gstem);
    if(fv)sum.push(`출몰 모음: 주격에만 있는 ${fv}가 다른 격에선 빠져 (${nom} → ${gs}).`)}
  const gp=first(D["gen.p"]);
  if(gp&&(cls===1||cls==="2n")&&!iya){const fv=fleetIns(stem,gp.replace(/ь$/,""));if(fv)sum.push(`복수 생격은 어미가 없어서 자음이 몰리면 ${fv}가 끼어들어 (${nom} → ${gp}).`)}
  /* 복수 생격 */
  if(gp){let t="";if(/[оеё]в$/.test(gp))t=/ев$|ёв$/.test(gp)?"복수 생격 -ев/-ёв: -й 또는 ц(강세 없음) 뒤의 -ов 짝.":"복수 생격 -ов: 딱딱한 자음으로 끝나는 남성 (дом → домо́в).";
    else if(/ей$/.test(gp)&&!/ей$/.test(nom))t="복수 생격 -ей: -ь나 ж/ш/щ/ч로 끝나는 명사 (день → дней, нож → ноже́й, ночь → ноче́й).";
    else if(iya&&/ий$/.test(gp))t="복수 생격 -ий: -ия/-ие 명사.";
    else t="복수 생격 어미 없음(zero): -а/-я 여성·-о 중성은 줄기만 남아 ("+gp+").";
    const expect=cls===1?["zero","ей"]:cls==="2n"?["zero","ей"]:cls===3?["ей"]:cls===2?["ов","ей"]:[];
    const kind=/[оеё]в$/.test(gp)?"ов":/ей$/.test(gp)?"ей":"zero";if(expect.length&&!expect.includes(kind)&&!iya&&!irr)t+=" 이 단어는 일반 규칙이랑 달라 — 외워야 함.";
    sum.push(t)}
  /* 활동체 */
  if(I.anim==="anim"||I.anim==="both")sum.push("활동체(사람·동물): 대격 복수"+(cls===2?"와 대격 단수(남성)":"")+"가 생격이랑 같아져.");
  /* 복수 주격 */
  const np=first(D["nom.p"]);
  if(np&&cls===2&&/[ая]$/.test(np)&&!/[ая]$/.test(nom))sum.push("남성인데 복수 주격이 -а́/-я́ (дом → дома́, го́род → города́): 이런 그룹은 외워야 함.");
  if(np&&!irr&&stem&&cpre(np,stem)<Math.max(2,stem.length-1)&&!fleeting(stem,np.slice(0,stem.length-1)))sum.push("복수 줄기가 단수랑 달라져 ("+nom+" → "+np+") — 불규칙, 외워야 함.");
  /* 강세 이동 */
  const rgs=String(D["gen.s"]||"").split(",")[0],rnp=String(D["nom.p"]||"").split(",")[0];
  if(hasStress(rgs)&&hasStress(rnp)&&ruVowels(rgs)>1){const sE=stressIdx(rgs)>=stem.length-(fleeting(nom.replace(/[ьй]$/,""),gs.replace(/[аяиы]$/,""))?1:0),pE=stressIdx(rnp)>=stem.length-1;
    if(sE!==pE)sum.push(`강세 이동: 단수는 ${sE?"어미":"줄기"}, 복수는 ${pE?"어미":"줄기"}에 강세 (${rgs} → ${rnp}).`)}
  /* 칸별 */
  const T=cls?NE[cls]:null;
  Object.keys(D).forEach(k=>{const v=first(D[k]);if(!v)return;const [cs,n]=k.split(".");const lab=(CASE_KO[cs]||cs)+" "+(n==="s"?"단수":"복수")+": ";
    if(irr==="mya"){cells[k]=lab+(k==="nom.s"||k==="acc.s"?"기본형 그대로":"-мя 명사 특수 변화 (-ен- 붙음) — 외워야 함");return}
    if(irr==="put"){cells[k]=lab+"불규칙 명사 — 외워야 함";return}
    if(cs==="loc"){cells[k]="처소격: в/на 뒤에서만 쓰는 특수형 -у́ (в саду́) — 외워야 함";return}
    if(cs==="par"){cells[k]="부분생격 -у/-ю: '조금'의 뜻 (ча́ю) — 선택";return}
    if(cs==="acc"&&!(T&&T[k])){const an=(I.anim==="anim")&&(n==="p"||cls===2);const same=an?"생격":"주격";
      cells[k]=lab+`${an?"활동체라":"불활동체라"} ${same}이랑 같아 (${first(D[(an?"gen.":"nom.")+n])||"…"})`;return}
    if(k==="acc.s"&&v===nom){cells[k]=lab+"주격이랑 같아 ("+(cls===3?"3식 여성":"불활동 중성/남성")+")";return}
    if(!T||!T[k]){cells[k]=lab+"일반 규칙";return}
    let opts=spellVariants(T[k][soft?1:0].concat(iya&&(k==="pre.s"||(cls===1&&k==="dat.s"))?["и"]:[]),sf);
    if(iya&&k==="gen.p")opts=[{e:"й",r:""}];
    const vv=v.replace(/ь$/,"")===stem&&k==="gen.p"?{e:"",r:""}:null;
    const hit=vv||opts.filter(o=>o.e?v.endsWith(o.e):(v===stem||v===stem+"ь"||fleetIns(stem,v)!=="")).sort((a,b)=>b.e.length-a.e.length)[0];
    const nomEnd=(nom.match(/[аяоеёьй]$/)||[""])[0];
    if(!hit){cells[k]=lab+`${CLS_KO[cls]} 일반 어미랑 달라 — 이 칸은 외워야 함`;return}
    let t=lab+CLS_KO[cls]+" "+(k==="nom.s"?"기본형":(nomEnd?"-"+nomEnd:"(어미 없음)")+" → "+(hit.e?"-"+hit.e:(k==="gen.p"?"어미 없음":"-ь")));
    if(hit.r)t+=". "+SPELL_KO[hit.r];
    else if(HUSH7.includes(sf)&&"гкх".includes(sf)&&(hit.e==="ой"||hit.e==="ом"))t+=". г/к/х 뒤라 강세 없어도 -"+hit.e+" 그대로 (5글자 규칙 대상 아님)";
    if(k==="gen.p"&&!hit.e){const fv=fleetIns(stem,v.replace(/ь$/,""));if(fv)t+=`. 자음이 몰려서 ${fv}가 끼어듦`}
    if((k==="gen.s"||k==="ins.s"||k==="dat.s"||k==="pre.s")&&cls===2){const fv=fleeting(nom.replace(/[ьй]$/,""),v.replace(new RegExp((hit.e||"")+"$"),""));if(fv)t+=`. 출몰 모음 ${fv} 빠짐`}
    if(irr==="mat"&&k!=="nom.s"&&k!=="acc.s")t+=". 줄기에 -ер- 붙음 (불규칙)";
    cells[k]=t});
  return{summary:sum,cells}}

/* ---------- 러시아어 형용사 ---------- */
const AE={/* [딱딱, 부드러움] */"nom.m":[["ый","ой"],["ий"]],"gen.m":[["ого"],["его"]],"dat.m":[["ому"],["ему"]],"ins.m":[["ым"],["им"]],"pre.m":[["ом"],["ем"]],
  "nom.n":[["ое"],["ее"]],"gen.n":[["ого"],["его"]],"dat.n":[["ому"],["ему"]],"acc.n":[["ое"],["ее"]],"ins.n":[["ым"],["им"]],"pre.n":[["ом"],["ем"]],
  "nom.f":[["ая"],["яя"]],"gen.f":[["ой"],["ей"]],"dat.f":[["ой"],["ей"]],"acc.f":[["ую"],["юю"]],"ins.f":[["ой","ою"],["ей","ею"]],"pre.f":[["ой"],["ей"]],
  "nom.p":[["ые"],["ие"]],"gen.p":[["ых"],["их"]],"dat.p":[["ым"],["им"]],"ins.p":[["ыми"],["ими"]],"pre.p":[["ых"],["их"]]};
const GEN_KO={m:"남성",n:"중성",f:"여성",p:"복수"};
function ruAdj(w){const D=w.decl||{},I=w.declInfo||{};const sum=[],cells={};const nom=first(D["nom.m"]||w.word)||first(w.word);
  if(I.indecl){sum.push("불변 형용사: 모양이 안 바뀌어 (беж, ха́ки).");return{summary:sum,cells}}
  const end=(nom.match(/(ый|ий|ой)$/)||[""])[0];const stem=nom.slice(0,nom.length-end.length);const sf=stem.slice(-1);
  const stressedEnd=end==="ой";const soft=end==="ий"&&!HUSH7.includes(sf);
  sum.push("형용사는 꾸미는 명사의 성·수·격에 맞춰 어미가 바뀌어 (краси́вый дом, краси́вая кни́га, краси́вое окно́, краси́вые дома́).");
  if(stressedEnd)sum.push("-ой: 어미에 강세가 있는 딱딱한 형용사 (большо́й, молодо́й). 남성 주격만 -ой, 나머지는 -ый 형이랑 같은 어미 (어미 강세라 о 그대로: большо́го).");
  else if(soft)sum.push("부드러운 형용사 (-ний 계열: си́ний, ле́тний): 어미가 전부 я·ю·е·и 쪽 (си́няя, си́нее, си́нюю).");
  else if(HUSH7.includes(sf)&&"гкх".includes(sf))sum.push(`줄기 끝 ${sf}: 7글자 규칙 때문에 ы 대신 и (ру́сский, ру́сские). 나머지는 딱딱한 형용사 그대로.`);
  else if(HUSH7.includes(sf))sum.push(`줄기 끝 ${sf} (혼합형): ы 대신 и (7글자 규칙) + 강세 없는 о는 е (5글자 규칙)라서 хоро́ший → хоро́шего, хоро́шее, хоро́шей.`);
  else sum.push("딱딱한 형용사 (-ый): 기본 어미 그대로.");
  sum.push("남성 생격 -ого/-его의 г는 [в]로 읽어 (краси́вого [-ава]).");
  sum.push("대격: 남성·복수는 꾸미는 명사가 활동체면 생격 꼴, 아니면 주격 꼴. 여성만 -ую/-юю.");
  const sm=first(D["short.m"]);if(sm&&stem&&cpre(sm,stem)<Math.max(2,stem.length-2))sum.push("짧은 꼴은 다른 단어에서 와 ("+nom+" → "+sm+", "+first(D["short.f"])+") — 불규칙, 외워야 함.");
  else if(sm){const fv=fleetIns(stem,sm);sum.push("짧은 꼴(술어용): 남성 -∅, 여성 -а, 중성 -о, 복수 -ы/-и"+(fv?` · 남성 짧은 꼴에 ${fv}가 끼어들어 (${sm})`:"")+".")}
  Object.keys(D).forEach(k=>{const v=first(D[k]);if(!v)return;const p=k.split(".");const cs=p[0],g=p[1],an=p[2];
    const lab=(cs==="short"?"짧은 꼴":CASE_KO[cs])+" "+GEN_KO[g]+(an?(an==="an"?" 활동체":" 불활동"):"")+": ";
    if(cs==="short"){if(stem&&cpre(v,stem)<Math.max(2,stem.length-2)){cells[k]=lab+"다른 단어에서 온 짧은 꼴 ("+nom+" → "+first(D["short.m"])+") — 불규칙, 외워야 함";return}
      cells[k]=lab+({m:"줄기만 (-∅)",f:"-а",n:"-о",p:"-ы/-и"}[g])+(g==="m"&&fleetIns(stem,v)?" · о/е가 끼어듦 (출몰 모음)":"")+" · 술어로만 써";return}
    if(cs==="acc"&&an){cells[k]=lab+(an==="an"?"생격이랑 같아 (활동체 명사 꾸밀 때)":"주격이랑 같아 (불활동 명사 꾸밀 때)");return}
    const T=AE[k];if(!T){cells[k]=lab+"일반 규칙";return}
    let base=T[soft?1:0];if(stressedEnd&&k==="nom.m")base=["ой"];
    const opts=spellVariants(base,sf);
    if(HUSH5.includes(sf)&&!stressedEnd)opts.push(...base.filter(e=>/^о/.test(e)).map(e=>({e:"е"+e.slice(1),r:"5"})));
    const hit=opts.filter(o=>v.endsWith(o.e)).sort((a,b)=>b.e.length-a.e.length)[0];
    if(!hit){cells[k]=lab+"일반 어미랑 달라 — 외워야 함";return}
    let t=lab+(soft?"부드러운형":stressedEnd?"어미 강세형":HUSH7.includes(sf)?(HUSH5.includes(sf)?"혼합형":"г/к/х형"):"딱딱한형")+" -"+hit.e;if(hit.r)t+=". "+SPELL_KO[hit.r];
    if(/^(ого|его)$/.test(hit.e))t+=" (г는 [в]로 읽음)";if(stressedEnd&&/^о/.test(hit.e)&&HUSH5.includes(sf))t+=". 강세가 어미라 о 그대로 (5글자 규칙은 강세 없을 때만)";
    cells[k]=t});
  return{summary:sum,cells}}

/* ---------- 프랑스어 동사 ---------- */
const FR_P=["je","tu","il","nous","vous","ils"];
const FR_P_KO={je:"je",tu:"tu",il:"il/elle",nous:"nous",vous:"vous",ils:"ils/elles"};
const ETRE_V=["aller","venir","arriver","partir","entrer","sortir","monter","descendre","naître","mourir","rester","tomber","retourner","devenir","revenir","rentrer","passer","parvenir","intervenir","survenir","redescendre","remonter","repartir","ressortir","décéder","apparaître","advenir","redevenir"];
const FR_IRR={"être":"완전 불규칙 — 외워야 함 (suis, es, est, sommes, êtes, sont · 미래 ser-).","avoir":"완전 불규칙 — 외워야 함 (ai, as, a, avons, avez, ont · 미래 aur-).",
  "aller":"-er인데 유일하게 불규칙 — 외워야 함 (vais, vas, va, allons, allez, vont · 미래 ir-).","faire":"불규칙 — 외워야 함 (fais, fait, faisons, faites, font · 미래 fer-).",
  "dire":"불규칙 — vous dites, 과거분사 dit.","pouvoir":"불규칙 — 외워야 함 (peux, peut, pouvons, peuvent · 미래 pourr-).","vouloir":"불규칙 — 외워야 함 (veux, veut, voulons, veulent · 미래 voudr-).",
  "savoir":"불규칙 — 외워야 함 (sais, sait, savons, savent · 미래 saur-).","venir":"불규칙 — 외워야 함 (viens, vient, venons, viennent · 미래 viendr-).","tenir":"venir랑 같은 꼴 (tiens, tenons, tiennent · 미래 tiendr-).",
  "prendre":"불규칙 — 단수는 -d 유지(prends, prend), 복수는 d가 빠지고 ils에서 n이 겹쳐 (prenons, prennent). 과거분사 pris.","mettre":"불규칙 — 단수 t 하나(mets, met), 복수 tt (mettons). 과거분사 mis.",
  "voir":"불규칙 — vois, voyons, voient · 미래 verr- · 과거분사 vu.","devoir":"불규칙 — dois, devons, doivent · 미래 devr- · 과거분사 dû.","boire":"불규칙 — bois, buvons, boivent · 과거분사 bu.",
  "croire":"불규칙 — crois, croyons, croient · 과거분사 cru.","connaître":"불규칙 — connais, connaît, connaissons · 과거분사 connu.","naître":"불규칙 — nais, naît, naissons · 과거분사 né (être).",
  "mourir":"불규칙 — meurs, mourons, meurent · 미래 mourr- · 과거분사 mort (être).","ouvrir":"-ir인데 현재는 -er처럼 (ouvre, ouvres, ouvre) · 과거분사 ouvert.","offrir":"-ir인데 현재는 -er처럼 (offre) · 과거분사 offert.",
  "courir":"3군 — cours, court, courons · 미래 courr- · 과거분사 couru.","lire":"불규칙 — lis, lisons · 과거분사 lu.","écrire":"불규칙 — écris, écrivons · 과거분사 écrit.","vivre":"불규칙 — vis, vit, vivons · 과거분사 vécu.",
  "recevoir":"불규칙 — reçois, recevons, reçoivent · 미래 recevr- · 과거분사 reçu.","envoyer":"-yer 규칙(envoie)인데 미래만 불규칙 enverr- — 외워야 함.","falloir":"il만 써 (il faut · 미래 il faudra).",
  "partir":"3군 -ir: 단수에서 줄기 끝 자음이 빠져 (pars, part / partons).","sortir":"3군 -ir: 단수에서 t가 빠져 (sors, sort / sortons).","dormir":"3군 -ir: 단수에서 m이 빠져 (dors, dort / dormons).","sentir":"3군 -ir: 단수에서 t가 빠져 (sens, sent / sentons).","servir":"3군 -ir: 단수에서 v가 빠져 (sers, sert / servons).",
  "conduire":"-uire 동사 — conduis, conduisons · 과거분사 conduit."};
const FR_PREF_BASE=["prendre","venir","tenir","mettre","faire","partir","sortir","dormir","sentir","servir","ouvrir","offrir","courir","écrire","duire","naître","connaître","recevoir","voir"];
const FR_FUT_IRR={"être":"ser","avoir":"aur","aller":"ir","faire":"fer","pouvoir":"pourr","voir":"verr","venir":"viendr","tenir":"tiendr","vouloir":"voudr","savoir":"saur","devoir":"devr","envoyer":"enverr","falloir":"faudr","courir":"courr","mourir":"mourr","recevoir":"recevr","valoir":"vaudr","pleuvoir":"pleuvr","acquérir":"acquerr","cueillir":"cueiller","asseoir":"assiér"};
const FR_DOUBLE=["appeler","rappeler","épeler","renouveler","jeter","rejeter","projeter","feuilleter","interpeller"];
const FR_PP_KO={er:"-er → -é",ir:"2군 -ir → -i",re:"-re → -u"};
function frForm(s){/* "je parle" → parle, "j'ai parlé" → [aux, pp] */s=nfc(s||"").toLowerCase().trim().replace(/[’]/g,"'").replace(/^(que |qu'(?=(il|elle|on|ils|elles)\b))/,"");
  return s.replace(/^(je |j'|tu |il |elle |il\/elle |nous |vous |ils |elles |ils\/elles )/,"").replace(/^(me |m'|te |t'|se |s'|nous |vous )/,"")}
function frVerb(w){const sum=[],cells={};let inf=nfc(w.word||"").toLowerCase().trim().replace(/[’]/g,"'");const refl=/^(se |s')/.test(inf);inf=inf.replace(/^(se |s')/,"");
  const C=w.conj||{};const pres={},fut={},pc={};FR_P.forEach(p=>{pres[p]=frForm(C["pres."+p]);fut[p]=frForm(C["fut."+p]);pc[p]=frForm(C["pc."+p])});
  let base=FR_IRR[inf]?inf:FR_PREF_BASE.find(b=>inf.endsWith(b)&&inf.length>b.length);if(base==="duire")base="conduire";
  let grp="";if(inf.endsWith("er")&&inf!=="aller")grp="er";else if(inf.endsWith("ir")&&!base){grp=(pres.nous?/issons$/.test(pres.nous):!["fuir","cueillir","acquérir","bouillir","vêtir","courir","mourir"].includes(inf))?"ir":"3"}else grp="3";
  if(base&&FR_IRR[base]){sum.push((base!==inf?base+" 계열: ":"")+FR_IRR[base]);if(grp==="er"&&base!=="envoyer")grp="er"}
  if(grp==="er")sum.push("1군 규칙 동사 (-er): 줄기 + -e, -es, -e, -ons, -ez, -ent. je·tu·il·ils 어미는 소리가 안 나.");
  else if(grp==="ir")sum.push("2군 (-ir, nous -issons): 줄기 + -is, -is, -it, -issons, -issez, -issent."+(pres.nous?"":" (표가 비어서 원형만 보고 추측)"));
  else if(!base){if(/(endre|ondre|erdre|ordre|andre)$/.test(inf))sum.push("3군 -re 규칙형 (-dre): 줄기 + -s, -s, -(d 그대로), -ons, -ez, -ent. 과거분사 -u.");
    else sum.push("3군 (불규칙 그룹): -ir(2군 아님)/-re/-oir 동사는 대부분 따로 외워야 해. 불규칙 — 외워야 함.")}
  const stem=inf.slice(0,-2);const notes={};const add=(ps,t)=>ps.forEach(p=>{notes[p]=(notes[p]?notes[p]+" · ":"")+t});
  let futStemChange="";
  if(grp==="er"){
    if(/cer$/.test(inf)){sum.push("-cer: a/o 앞에서 c → ç (소리 [s] 유지): nous "+(pres.nous||stem.slice(0,-1)+"çons")+".");add(["nous"],"c → ç (o 앞에서 [s] 소리 유지)")}
    if(/ger$/.test(inf)){sum.push("-ger: a/o 앞에 e를 넣어 (소리 [ʒ] 유지): nous "+(pres.nous||stem+"eons")+".");add(["nous"],"g 뒤에 e 추가 ([ʒ] 소리 유지)")}
    if(/ayer$/.test(inf)){const st=stem.slice(0,-1);sum.push(`-ayer: 소리 안 나는 e 앞에서 y를 그대로 둬도 되고(je ${st}ye) i로 바꿔도 돼(je ${st}ie). 둘 다 맞아. 미래도 ${st}yerai / ${st}ierai 둘 다 OK.`);add(["je","tu","il","ils"],"-ayer: y 그대로 또는 y → i 둘 다 OK");futStemChange="ay"}
    else if(/[ou]yer$/.test(inf)){const st=stem.slice(0,-1);sum.push(`-oyer/-uyer: 소리 안 나는 e 앞에서 y → i 필수 (${pres.je||"je "+st+"ie"}).`+(inf==="envoyer"?"":` 미래에도 i (${(/^[aeiouéh]/.test(st)?"j'":"je ")+st}ierai).`));add(["je","tu","il","ils"],"y → i (소리 안 나는 e 앞)");futStemChange="yi"}
    const m=stem.match(/(e)([^aeiouyéèêëàâîïôûù])$/)||stem.match(/(é)(ch|gn|[bcdfgklmnpqrstvz][lr]?)$/);
    if(m&&!/[oua]y$/.test(stem)){const C2=m[2];
      if(m[1]==="e"){const dbl=pres.je?(pres.je.includes(C2+C2)):FR_DOUBLE.includes(inf);
        if(dbl){sum.push(`-e${C2}er (자음 겹침형): 소리 안 나는 어미 앞에서 ${C2} → ${C2+C2} (${pres.je||""}). nous·vous는 그대로. 미래 전체도 ${C2+C2}.`);add(["je","tu","il","ils"],`${C2} → ${C2+C2} (뒤 음절이 소리 없는 e라서)`);futStemChange="dbl"}
        else{sum.push(`e + 자음 + er (acheter형): 소리 안 나는 어미 앞에서 e → è (${pres.je||""}). nous·vous는 e 그대로. 미래 전체도 è.`);add(["je","tu","il","ils"],"e → è (뒤 음절이 소리 없는 e라서)");futStemChange="grave"}}
      else{sum.push(`é + 자음 + er (préférer형): je·tu·il·ils에서 é → è. nous·vous는 é. 미래는 전통 철자 é (${inf}ai)도, 새 철자 è (${inf.replace(/é([^é]*)$/,"è$1")}ai)도 다 맞아.`);add(["je","tu","il","ils"],"é → è (뒤 음절이 소리 없는 e라서)");futStemChange="eacute"}}}
  /* 미래 */
  let expFut=grp==="er"||grp==="ir"||/ir$/.test(inf)?inf:/re$/.test(inf)?inf.slice(0,-1):inf.replace(/oir$/,"r");
  const fj=fut.je?fut.je.replace(/ai$/,""):"";let futNote="";
  if(FR_FUT_IRR[base||inf]||FR_FUT_IRR[inf]){const fs=FR_FUT_IRR[inf]||FR_FUT_IRR[base];futNote=`미래 줄기 불규칙: ${inf.endsWith(base||"\u0000")&&base!==inf&&base?inf.slice(0,-base.length)+fs:fs}- — 외워야 함. 어미는 -ai, -as, -a, -ons, -ez, -ont.`}
  else if(fj&&fj!==expFut&&!futStemChange&&!(grp==="er"&&fj===inf.replace(/é([^é]*)$/,"è$1")))futNote=`미래 줄기 ${fj}- (원형에서 바로 안 나옴) — 외워야 함.`;
  else futNote="미래 = "+(/re$/.test(inf)?"원형에서 e 떼고 ":"원형 그대로 ")+"+ -ai, -as, -a, -ons, -ez, -ont"+(futStemChange==="grave"?" (줄기 모음 è)":futStemChange==="dbl"?" (자음 겹침 유지)":futStemChange==="yi"?" (y → i)":futStemChange==="eacute"?" (é/è 둘 다 OK)":futStemChange==="ay"?" (y/i 둘 다 OK)":"")+".";
  sum.push(futNote);
  /* 복합과거 */
  const aux=w.aux||(refl||ETRE_V.includes(inf)?"être":"avoir");const ppRaw=(pc.je||"").split(" ").pop().replace(/\(.*$/,"");
  let ppNote="";if(ppRaw){if(/er$/.test(inf)&&ppRaw===stem+"é")ppNote="과거분사 "+ppRaw+" ("+FR_PP_KO.er+")";else if(/ir$/.test(inf)&&ppRaw===inf.slice(0,-1))ppNote="과거분사 "+ppRaw+" (-ir → -i)";
    else if(/re$/.test(inf)&&ppRaw===inf.slice(0,-2)+"u")ppNote="과거분사 "+ppRaw+" ("+FR_PP_KO.re+")";else ppNote="과거분사 "+ppRaw+" — 불규칙, 외워야 함"}
  if(/être/.test(aux)){sum.push("passé composé = être 현재형 + 과거분사."+(refl?" 재귀동사(se ~)는 전부 être.":" 이동·상태 변화 동사(DR MRS VANDERTRAMP: aller, venir, partir, arriver, naître, mourir…)라서 être.")+" 과거분사가 주어 성·수에 일치: elle est "+(ppRaw||"allé")+"e, ils sont "+(ppRaw||"allé")+"s."+(aux==="avoir/être"&&["monter","descendre","sortir","rentrer","passer","retourner","remonter","redescendre","ressortir"].includes(inf)?" 단, 직접목적어가 있으면 avoir (il a "+(ppRaw||"monté")+" la valise).":""))}
  else sum.push("passé composé = avoir 현재형 + 과거분사 (동사 대부분). avoir일 땐 과거분사가 주어랑 일치 안 해 (직접목적어가 앞에 올 때만 일치).");
  if(ppNote)sum.push(ppNote+".");
  /* 칸별 */
  const PE={er:{je:"-e",tu:"-es",il:"-e",nous:"-ons",vous:"-ez",ils:"-ent"},ir:{je:"-is",tu:"-is",il:"-it",nous:"-issons",vous:"-issez",ils:"-issent"},re:{je:"-s",tu:"-s",il:"(어미 없음)",nous:"-ons",vous:"-ez",ils:"-ent"}};
  const FE={je:"-ai",tu:"-as",il:"-a",nous:"-ons",vous:"-ez",ils:"-ont"};
  const isRe=grp==="3"&&!base&&/(endre|ondre|erdre|ordre|andre)$/.test(inf);
  FR_P.forEach(p=>{let t="présent "+FR_P_KO[p]+": ";
    if(["partir","sortir","dormir","sentir","servir"].includes(base))t+=({je:"-s",tu:"-s",il:"-t",nous:"-ons",vous:"-ez",ils:"-ent"}[p])+(["je","tu","il"].includes(p)?" · 단수라 줄기 끝 자음("+base.slice(-3,-2)+") 빠짐":" · 복수는 자음("+base.slice(-3,-2)+") 그대로");
    else if(base&&!(grp==="er"&&base==="envoyer"))t+="불규칙 — 외워야 함";else if(PE[grp]||isRe)t+=(grp==="er"?"1군":grp==="ir"?"2군":"-re형")+" 어미 "+(PE[grp]||PE.re)[p];else t+="3군 — 외워야 함";
    if(notes[p])t+=" · "+notes[p];if(p==="je"&&/^j'/.test(String(C["pres.je"]||"").toLowerCase().replace(/[’]/g,"'")))t+=" · 모음 앞이라 je → j'";
    cells["pres."+p]=t;
    let f="futur "+FR_P_KO[p]+": 줄기 + "+FE[p];if(FR_FUT_IRR[inf]||FR_FUT_IRR[base])f+=" · 줄기 불규칙";else if(futStemChange)f+=" · "+({grave:"e → è",dbl:"자음 겹침",yi:"y → i",eacute:"é/è 둘 다 OK",ay:"y/i 둘 다 OK"}[futStemChange]);
    cells["fut."+p]=f;
    let c="passé composé "+FR_P_KO[p]+": "+(/être/.test(aux)?"être":"avoir")+" + "+(ppRaw||"과거분사");
    if(/être/.test(aux))c+=" · 주어 성·수 일치 "+({je:"(e)",tu:"(e)",il:"(elle → e)",nous:"(e)s",vous:"(e)(s)",ils:"s (elles → es)"}[p]);
    cells["pc."+p]=c});
  frMoreTenses(inf,grp,base,aux,ppRaw,C,sum,cells,refl);
  return{summary:sum,cells}}
/* v15: 반과거·조건법·접속법·명령법·단순과거·복합시제 */
const FR_IMPF_E={je:"-ais",tu:"-ais",il:"-ait",nous:"-ions",vous:"-iez",ils:"-aient"};
const FR_SUBJ_E={je:"-e",tu:"-es",il:"-e",nous:"-ions",vous:"-iez",ils:"-ent"};
const FR_SUBJ_IRR={"être":"sois, sois, soit, soyons, soyez, soient","avoir":"aie, aies, ait, ayons, ayez, aient","aller":"aille… / allions, alliez","faire":"fasse- (que je fasse)","pouvoir":"puisse- (que je puisse)","savoir":"sache- (que je sache)","vouloir":"veuille… / voulions, vouliez","valoir":"vaille…","falloir":"qu'il faille","pleuvoir":"qu'il pleuve"};
const FR_COMP={pqp:["plus-que-parfait","반과거"],fa:["futur antérieur","미래"],condp:["conditionnel passé","조건법 현재"],subjp:["subjonctif passé","접속법 현재"]};
function frMoreTenses(inf,grp,base,aux,ppRaw,C,sum,cells,refl){
  const has=t=>FR_P.some(p=>C[t+"."+p]);const g=(t,p)=>frForm(C[t+"."+p]);
  const nousP=g("pres","nous"),ilsP=g("pres","ils");const AGR={je:"(e)",tu:"(e)",il:"(elle → e)",nous:"(e)s",vous:"(e)(s)",ils:"s (elles → es)"};
  /* 반과거 */
  if(has("impf")){const nst=nousP.replace(/ons$/,"");const irr=inf==="être";const ok=nst&&FR_P.every(p=>!g("impf",p)||g("impf",p).replace(/(ais|ait|ions|iez|aient)$/,"")===nst||(/[çg]e?$/.test(nst)&&["nous","vous"].includes(p)));
    sum.push("imparfait (반과거) = "+(irr?"être만 예외 줄기 ét- (j'étais)":"nous 현재형 줄기"+(nousP?` (nous ${nousP} → ${nst}-)`:"")+(ok?"":" — 이 동사는 줄기가 달라, 확인해 줘"))+" + -ais, -ais, -ait, -ions, -iez, -aient. 계속되던 일·습관·배경 묘사.");
    FR_P.forEach(p=>{let t="imparfait "+FR_P_KO[p]+": "+(irr?"ét-":(nst||"nous 줄기")+"-")+" + "+FR_IMPF_E[p];
      if(/cer$/.test(inf))t+=["nous","vous"].includes(p)?" · i 앞이라 ç 없이 c":" · a 앞이라 c → ç";
      if(/ger$/.test(inf))t+=["nous","vous"].includes(p)?" · i 앞이라 e 없이":" · a 앞이라 g 뒤에 e";
      cells["impf."+p]=t})}
  /* 조건법 현재 */
  if(has("cond")){const fst=g("fut","je").replace(/ai$/,"");sum.push("conditionnel présent (조건법) = 미래 줄기"+(fst?` (${fst}-)`:"")+" + 반과거 어미 -ais, -ais, -ait, -ions, -iez, -aient. ~할 텐데, 공손한 부탁(je voudrais).");
    FR_P.forEach(p=>{cells["cond."+p]="conditionnel "+FR_P_KO[p]+": 미래 줄기 "+(fst?fst+"- ":"")+"+ "+FR_IMPF_E[p]+((FR_FUT_IRR[inf]||FR_FUT_IRR[base])?" · 줄기 불규칙 (미래랑 같음)":"")})}
  /* 접속법 현재 */
  if(has("subj")){const ist=ilsP.replace(/ent$/,"");const irr=FR_SUBJ_IRR[inf]||FR_SUBJ_IRR[base];
    const reg=!irr&&ist&&["je","tu","il","ils"].every(p=>!g("subj",p)||g("subj",p).replace(/(es|e|ent)$/,"")===ist);
    const nv=g("subj","nous")&&g("subj","nous")===g("impf","nous");
    sum.push("subjonctif présent (접속법) = que + "+(irr?"불규칙 줄기 — 외워야 함 ("+irr+")":"ils 현재형 줄기"+(ilsP?` (ils ${ilsP} → ${ist}-)`:"")+" + -e, -es, -e, -ions, -iez, -ent"+(reg||!ist?"":" — 이 동사는 줄기가 달라, 외워야 함"))+"."+(nv?" nous·vous는 반과거랑 똑같은 꼴.":"")+" il faut que, vouloir que, bien que 뒤에 써.");
    FR_P.forEach(p=>{let t="subjonctif "+FR_P_KO[p]+": que + "+(irr?"불규칙 — 외워야 함":((["nous","vous"].includes(p)&&nv)?"반과거 nous/vous 꼴 그대로":(ist||"ils 줄기")+"- + "+FR_SUBJ_E[p]));
      if(p==="il"||p==="ils")t+=" · qu' (il/ils 앞 모음 축약)";cells["subj."+p]=t})}
  /* 명령법 */
  if(["tu","nous","vous"].some(p=>C["impr."+p])){const irr=["être","avoir","savoir","vouloir"].includes(inf);const er=grp==="er"||inf==="aller"||/(ouvrir|offrir|couvrir|souffrir|cueillir)$/.test(inf);
    sum.push("impératif (명령법) = 주어 없이 현재형 tu·nous·vous만."+(irr?" 이 동사는 접속법에서 온 불규칙 꼴 — 외워야 함.":"")+(er&&!irr?" -er 동사"+(inf==="aller"?"(aller 포함)":"")+"는 tu에서 -s가 빠져 ("+(frForm(C["impr.tu"]).replace(/-.*$/,"")||"parle")+").":"")+(refl?" 재귀동사는 대명사를 뒤에 하이픈으로: -toi, -nous, -vous.":""));
    ["tu","nous","vous"].forEach(p=>{let t="impératif "+p+": "+(irr?"불규칙 — 외워야 함":"현재형 "+p+" 꼴"+(p==="tu"&&er?"에서 -s 빼기":""));if(refl)t+=" · 대명사 뒤로 (-"+({tu:"toi",nous:"nous",vous:"vous"}[p])+")";cells["impr."+p]=t})}
  /* 단순과거 */
  if(has("ps")){const j=g("ps","je");const typ=/ai$/.test(j)?"a":/is$/.test(j)?"i":/us$/.test(j)?"u":/ins$/.test(j)?"in":"";
    const E={a:"-ai, -as, -a, -âmes, -âtes, -èrent",i:"-is, -is, -it, -îmes, -îtes, -irent",u:"-us, -us, -ut, -ûmes, -ûtes, -urent",in:"-ins, -ins, -int, -înmes, -întes, -inrent"}[typ];
    sum.push("passé simple (단순과거) = 소설·역사책에서만 쓰는 문어 시제. 말할 땐 passé composé."+(E?" 이 동사는 "+E+" 형.":" 불규칙 — 외워야 함.")+(typ==="a"&&grp!=="er"?"":typ==="a"?" (-er 동사 전부 이 형)":""));
    FR_P.forEach(p=>{cells["ps."+p]="passé simple "+FR_P_KO[p]+(E?": "+E.split(", ")[FR_P.indexOf(p)]+" 계열":": 외워야 함")})}
  /* 복합 시제 */
  const ae=/être/.test(aux)?"être":"avoir";const ppS=ppRaw||"과거분사";
  Object.entries(FR_COMP).forEach(([t,[nm,auxT]])=>{if(!has(t))return;
    sum.push(nm+" = "+(t==="subjp"?"que + ":"")+ae+" "+auxT+" + "+ppS+(ae==="être"?" (주어 성·수 일치)":"")+".");
    FR_P.forEach(p=>{let c=nm+" "+FR_P_KO[p]+": "+(t==="subjp"?"que + ":"")+ae+" "+auxT+" + "+ppS;if(ae==="être")c+=" · 일치 "+AGR[p];cells[t+"."+p]=c})})}

/* ---------- 프랑스어 형용사 ---------- */
const FA_IRR={beau:["belle","beaux","belles","bel"],nouveau:["nouvelle","nouveaux","nouvelles","nouvel"],vieux:["vieille","vieux","vieilles","vieil"],fou:["folle","fous","folles","fol"],mou:["molle","mous","molles","mol"],
  jumeau:["jumelle","jumeaux","jumelles"],blanc:["blanche"],franc:["franche"],sec:["sèche"],frais:["fraîche","frais","fraîches"],long:["longue"],grec:["grecque"],public:["publique"],turc:["turque"],favori:["favorite"],
  doux:["douce","doux"],faux:["fausse","faux"],roux:["rousse","roux"],jaloux:["jalouse","jaloux"],gentil:["gentille"],gros:["grosse","gros"],gras:["grasse","gras"],bas:["basse","bas"],épais:["épaisse","épais"],las:["lasse","las"],
  nul:["nulle"],malin:["maligne"],bénin:["bénigne"],aigu:["aiguë"],ambigu:["ambiguë"],frais:["fraîche","frais"],tiers:["tierce","tiers"],sot:["sotte"],vieillot:["vieillotte"],pâlot:["pâlotte"]};
const ETE=["complet","incomplet","concret","discret","indiscret","inquiet","secret","replet"];
const EUR_E=["meilleur","supérieur","inférieur","extérieur","intérieur","antérieur","postérieur","majeur","mineur","ultérieur"];
const AL_S=["banal","fatal","final","natal","naval","bancal","glacial","idéal"];
function frAdj(word){let m=nfc(word||"").toLowerCase().trim().split(/\s*[\/,(]\s*/)[0].trim();if(!m)return null;
  const sum=[],cells={};let fs="",mp="",fp="",mv="",rf="",rp="",irr=false,unsure=false;
  const I=FA_IRR[m];
  if(I){fs=I[0];if(I[1]&&I[1]!==m+"s"&&I[1]!==m)mp=I[1];fp=I[2]||"";mv=I[3]||"";irr=true;rf="불규칙 — 외워야 함 ("+m+" → "+fs+")"}
  else if(/[^é]e$/.test(m)){fs=m;rf="-e로 끝나면 여성형도 그대로"}
  else if(/eux$/.test(m)){fs=m.slice(0,-1)+"se";rf="-eux → -euse"}
  else if(/eur$/.test(m)){if(EUR_E.includes(m)){fs=m+"e";rf="비교 뜻 -eur는 그냥 +e"}else if(/teur$/.test(m)){fs=m.slice(0,-4)+"trice / "+m.slice(0,-1)+"se";rf="-teur는 -trice(créateur → créatrice) 또는 -teuse(menteur → menteuse) — 둘 중 뭔지 사전으로 확인";unsure=true}else{fs=m.slice(0,-1)+"se";rf="-eur → -euse"}}
  else if(/f$/.test(m)){fs=m.slice(0,-1)+"ve";rf="-f → -ve"}
  else if(/er$/.test(m)){fs=m.slice(0,-2)+"ère";rf="-er → -ère (e에 악상 그라브)"}
  else if(/(el|eil)$/.test(m)){fs=m+"le";rf="-el/-eil → l 겹치고 +e"}
  else if(/(en|on)$/.test(m)){fs=m+m.slice(-1)+"e";rf="-en/-on → n 겹치고 +e"}
  else if(/et$/.test(m)){if(ETE.includes(m)){fs=m.slice(0,-2)+"ète";rf="-et인데 -ète가 되는 그룹 (complet, secret, inquiet…)"}else{fs=m+"te";rf="-et → t 겹치고 +e"}}
  else if(/c$/.test(m)){fs=m+"que";rf="-c는 -que 또는 -che — 외워야 함";unsure=true}
  else if(/x$/.test(m)){fs=m.slice(0,-1)+"se";rf="-x 형용사는 -se/-ce/-sse 등 제각각 — 외워야 함";unsure=true}
  else if(/[ée]$/.test(m)||/u$/.test(m)||true){fs=m+"e";rf="기본: 남성형 + -e"+(/é$/.test(m)?" (-é → -ée)":"")}
  if(!mp){if(/[sx]$/.test(m)){mp=m;rp="-s/-x로 끝나서 남성 복수도 그대로"}else if(/eau$/.test(m)){mp=m+"x";rp="-eau → -eaux"}else if(/al$/.test(m)){if(AL_S.includes(m)){mp=m+"s";rp="-al인데 -als가 되는 예외 (banal, final, fatal…)"}else{mp=m.slice(0,-2)+"aux";rp="-al → -aux"}}else{mp=m+"s";rp="기본: +s"}}
  else rp="불규칙 복수 "+mp+" — 외워야 함";
  if(!fp)fp=fs.split(" / ").map(x=>x+"s").join(" / ");
  sum.push("형용사는 꾸미는 명사의 성·수에 맞춰: un petit chat / une petite chatte / des petits chats / des petites chattes.");
  sum.push("여성형: "+rf+".");sum.push("남성 복수: "+(rp||"+s")+". 여성 복수는 언제나 여성 단수 + -s.");
  if(mv)sum.push(`모음·무음 h로 시작하는 남성 단수 명사 앞에선 ${mv} (un ${mv} homme, un ${mv} ami).`);
  if(unsure)sum.push("이 단어는 규칙이 여러 개라 사전으로 한 번 확인해 줘.");
  cells.ms="남성 단수: 기본형 (사전형)";cells.fs="여성 단수: "+rf;cells.mp="남성 복수: "+(rp||"+s");cells.fp="여성 복수: 여성 단수 "+fs+" + -s";if(mv)cells.mv="남성 모음 앞: "+mv+" (발음을 이어 주려고)";
  return{forms:{ms:m,fs,mp,fp,mv},summary:sum,cells,irregular:irr,unsure}}

/* ---------- 답 비교 (어디가 틀렸는지) ---------- */
const APOS=/[\u0027\u2018\u2019\u201B\u2032\u02BB\u02BC\u02C8\u02CA\u00B4\u0060\u02CB\u02B9]/;
function dUnits(str,opt){const d=nfc(str).normalize("NFD");const out=[];
  for(const ch of d){if(/\p{M}/u.test(ch)&&out.length){out[out.length-1].raw+=ch;continue}out.push({raw:ch})}
  const strict=!!(opt&&opt.strict),tr=opt&&opt.lang==="tr";
  out.forEach(u=>{u.raw=nfc(u.raw);let k=strict?u.raw:u.raw.normalize("NFD").replace(/[\u0301\u0300]/g,"");k=tr?nfc(k).toLocaleLowerCase("tr"):nfc(k).toLowerCase();
    if(opt&&opt.yo)k=k.replace(/ё/g,"е");if(APOS.test(k))k="";if(/\s/.test(k))k=" ";u.key=k;u.marks=!strict&&/[\u0301\u0300]/.test(u.raw.normalize("NFD"))});
  /* 앞뒤·연속 공백은 무시 */
  let prevSp=true;out.forEach(u=>{if(u.key===" "){if(prevSp)u.key="";prevSp=true}else if(u.key)prevSp=false});
  for(let i=out.length-1;i>=0;i--){if(out[i].key===" ")out[i].key="";else if(out[i].key)break}
  return out}
const PRON_RX=/^(que\s+|qu'(?=(il|elle|on|ils|elles)\b))?((je|tu|il|elle|on|nous|vous|ils|elles|ben|sen|o|biz|siz|onlar|я|ты|он|она|мы|вы|они)\s+|j'(?=[aeiouyhéèêàâîôû]))?/i;
function pronLen(units){/* 앞의 대명사(que + je …)가 몇 글자인지 */const s=units.map(u=>APOS.test(u.raw)?"'":u.raw.toLowerCase()).join("");const m=s.match(PRON_RX);if(!m||!m[0])return 0;
  let n=0,acc="";for(const u of units){if(acc.length>=m[0].length)break;acc+=APOS.test(u.raw)?"'":u.raw.toLowerCase();n++}return n}
const EPS=0.001;
function align(A,B){/* A=입력, B=정답 · 무시할 글자(key "") 빼고 편집거리 */const a=A.filter(u=>u.key),b=B.filter(u=>u.key);const n=a.length,m=b.length;
  const D=Array.from({length:n+1},(_,i)=>{const r=new Array(m+1).fill(0);r[0]=i;return r});for(let j=0;j<=m;j++)D[0][j]=j;
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)D[i][j]=Math.min(D[i-1][j]+1,D[i][j-1]+1,D[i-1][j-1]+(a[i-1].key===b[j-1].key?(a[i-1].marks===b[j-1].marks?0:EPS):1));
  const ops=[];let i=n,j=m;
  while(i>0||j>0){if(i>0&&j>0&&a[i-1].key===b[j-1].key&&Math.abs(D[i][j]-D[i-1][j-1]-(a[i-1].marks===b[j-1].marks?0:EPS))<1e-9){ops.push({t:"=",a:a[i-1],b:b[j-1]});i--;j--}
    else if(i>0&&j>0&&Math.abs(D[i][j]-D[i-1][j-1]-1)<1e-9){ops.push({t:"~",a:a[i-1],b:b[j-1]});i--;j--}
    else if(j>0&&Math.abs(D[i][j]-D[i][j-1]-1)<1e-9){ops.push({t:"-",b:b[j-1]});j--}
    else{ops.push({t:"+",a:a[i-1]});i--}}
  return{dist:Math.round(D[n][m]),raw:D[n][m],ops:ops.reverse()}}
function ansDiff(input,answer,opt){opt=opt||{};const A=dUnits(input,opt),B=dUnits(answer,opt);
  let best={...align(A,B),pa:0,pb:0};
  const pa=pronLen(A),pb=pronLen(B);
  if(pb||pa){const r=align(A.slice(pa),B.slice(pb));if(r.raw<best.raw)best={...r,pa,pb}}
  const ops=best.ops;const cnt={sub:0,miss:0,extra:0};const soft=[];
  ops.forEach(o=>{if(o.t==="~")cnt.sub++;else if(o.t==="-")cnt.miss++;else if(o.t==="+")cnt.extra++;else if(o.a.marks!==o.b.marks)soft.push({got:o.a.raw,want:o.b.raw,stress:o.b.marks&&!o.a.marks})});
  return{dist:best.dist,ops,cnt,soft,preA:A.slice(0,best.pa).map(u=>u.raw).join(""),preB:B.slice(0,best.pb).map(u=>u.raw).join(""),A,B,pa:best.pa,pb:best.pb}}
function ansDiffBest(input,answers,opt){let best=null;(answers||[]).filter(Boolean).forEach(ans=>{const r=ansDiff(input,ans,opt);r.answer=ans;if(!best||r.dist<best.dist||(r.dist===best.dist&&r.ops.length<best.ops.length))best=r});return best}
/* 틀린 유형 짚어 주기 (짧은 힌트) */
const AUX_E=/^(suis|es|est|sommes|êtes|sont|étais|était|étions|étiez|étaient|serai|seras|sera|serons|serez|seront|serais|serait|serions|seriez|seraient|sois|soit|soyons|soyez|soient)$/;
const AUX_A=/^(ai|as|a|avons|avez|ont|avais|avait|avions|aviez|avaient|aurai|auras|aura|aurons|aurez|auront|aurais|aurait|aurions|auriez|auraient|aie|aies|ait|ayons|ayez|aient)$/;
const deacc=s=>nfc(s).normalize("NFD").replace(/\p{M}/gu,"").replace(/ı/g,"i").replace(/œ/g,"oe").toLowerCase();
function auxOf(form){const t=nfc(form||"").toLowerCase().replace(/[’']/g," ").replace(/^(que|qu)\s+/,"").split(/\s+/).filter(Boolean);
  for(const w of t.slice(0,4)){if(AUX_E.test(w))return"être";if(AUX_A.test(w))return"avoir"}return""}
function variants(b){b=String(b==null?"":b);const alts=b.split(/\s*[,\/]\s*/).filter(Boolean);const out=[];
  (alts.length?alts:[b]).forEach(a=>{const parts=a.split(/(\([^)]*\))/);let o=[""];parts.forEach(pt=>{if(/^\(.*\)$/.test(pt)){const inner=pt.slice(1,-1);o=o.flatMap(x=>[x,x+inner])}else o=o.map(x=>x+pt)});out.push(...o)});
  return out.slice(0,24)}
function trLbl(c,lang){if(lang!=="tr")return c;return c==="i"?"점 있는 i":c==="ı"?"점 없는 ı":c==="I"?"점 없는 I":c==="İ"?"점 있는 İ":c}
  function optFor(lang){return{yo:lang==="ru",strict:lang==="fr"||lang==="tr",lang}}
function ansHints(input,answer,ctx){ctx=ctx||{};const out=[];const O=optFor(ctx.lang);const r=ansDiffBest(input,variants(answer),O)||ansDiff(input,answer,O);
  const fold=s=>dUnits(s,O).map(u=>u.key).join("");
  /* 다른 칸 꼴을 적었나 */
  if(ctx.others){for(const [k,o] of Object.entries(ctx.others)){if(k===ctx.key||!o||!o.val)continue;
    const alts=String(o.val).split(/\s*[,\/]\s*/).flatMap(v=>v.includes("(")?[v.replace(/\([^)]*\)/g,""),v.replace(/[()]/g,"")]:[v]);
    if(alts.some(v=>{const x=ansDiff(input,v,O);return x.dist===0})){out.push({t:"other",msg:`그건 「${o.label}」 꼴이야. 여기는 「${ctx.label||"이 칸"}」.`});break}}}
  /* 프랑스어 조동사 avoir/être */
  if(ctx.lang==="fr"){const ai=auxOf(input),aa=auxOf(answer);if(ai&&aa&&ai!==aa)out.push({t:"aux",msg:`조동사가 틀렸어: 이 동사는 ${aa}${aa==="être"?" (이동·상태 변화/재귀 동사)":""}로 만들어.`});
    /* 성·수 일치 */
    if(!out.some(h=>h.t==="aux")&&auxOf(answer)==="être"&&r.dist>0&&["e","s","es"].some(x=>variants(answer).some(v=>ansDiff(input.trim()+x,v,O).dist===0)))
      out.push({t:"agr",msg:"과거분사 성·수 일치: être 복합시제라 주어(여성 -e, 복수 -s)에 맞춰 붙여."})}
  /* -ger: a/o 앞 e 빠짐 */
  if(ctx.lang==="fr"){const i=r.ops.findIndex((o,k)=>o.t==="-"&&o.b.key==="e"&&k>0&&r.ops[k-1].b&&r.ops[k-1].b.key==="g"&&r.ops[k+1]&&r.ops[k+1].b&&/[ao]/.test(r.ops[k+1].b.key));
    if(i>0)out.push({t:"spell",msg:"g 뒤에 e가 빠졌어: a/o 앞에서 [ʒ] 소리를 지키려고 ge로 써 (mangeais, mangeons)."})}
  /* 악상·세디유 (채점에서 봐 주지 않는 것) */
  const acc=r.ops.filter(o=>o.t==="~"&&deacc(o.a.raw)===deacc(o.b.raw));
  /* 악상이 아예 빠진 글자(e ↔ é)도 */
  if(acc.length)out.push({t:"accent",msg:(ctx.lang==="tr"?"특수 문자: ":"악상: ")+[...new Set(acc.map(o=>`${trLbl(o.a.raw,ctx.lang)} 아니고 ${trLbl(o.b.raw,ctx.lang)}`))].join(", ")+(acc.some(o=>/ç/.test(o.b.raw))?" (ç = a/o/u 앞에서 [s] 소리)":"")+(acc.some(o=>/[êâîôû]/.test(o.b.raw))?" (^ 는 빠지면 다른 철자로 쳐)":"")});
  /* 어미만 틀림 */
  if(!out.length&&r.dist>0){const body=r.ops;let first=body.findIndex(o=>o.t!=="=");let lastEq=-1;body.forEach((o,i)=>{if(o.t==="=")lastEq=i});
    const tailB=body.slice(first).filter(o=>o.b).map(o=>o.b.raw).join(""),tailA=body.slice(first).filter(o=>o.a).map(o=>o.a.raw).join("");
    const headOk=body.slice(0,first).filter(o=>o.b&&o.b.key&&o.b.key!==" ").length;
    const restEq=body.slice(first).every(o=>o.t!=="=")||first>=body.length-4;
    if(first>0&&headOk>=2&&tailB.length<=5&&restEq&&!/\s/.test(tailB))out.push({t:"ending",msg:`줄기는 맞아. 어미만 달라: -${tailA||"(없음)"} → -${tailB}`})}
  /* 강세/악상 (정답 처리되는 것) */
  if(r.soft.length&&ctx.lang==="ru")out.push({t:"soft",msg:"강세 위치: "+String(answer)});
  return out}
/* 프랑스어 명사 성 힌트 (어미 경향) */
const FR_G_END=[["tion","f"],["sion","f"],["té","f"],["ure","f"],["ette","f"],["ence","f"],["ance","f"],["ie","f"],["ise","f"],["ade","f"],["ment","m"],["age","m"],["isme","m"],["eau","m"],["oir","m"],["et","m"],["ier","m"],["ail","m"],["eil","m"],["in","m"],["on","m"]];
const FR_G_EXC={page:"f",plage:"f",image:"f",cage:"f",rage:"f",nage:"f",page2:"",eau:"f",peau:"f",maison:"f",raison:"f",chanson:"f",leçon:"f",façon:"f",boisson:"f",fin:"f",main:"f",faim:"f",silence:"m",lycée:"m",musée:"m",incendie:"m",génie:"m",parapluie:"m"};
function frGenderHint(word,gender){const w=deacc(String(word||"").replace(/^(le|la|les|un|une)\s+|^l['’]/i,"").trim().split(/\s+/)[0]);if(!w)return"";
  const raw=nfc(String(word||"").replace(/^(le|la|les|un|une)\s+|^l['’]/i,"").trim().split(/\s+/)[0]).toLowerCase();
  if(FR_G_EXC[raw]){return `${raw}는 어미 규칙의 예외야 — ${FR_G_EXC[raw]==="f"?"여성(la)":"남성(le)"}로 외워.`}
  const e=FR_G_END.find(([x])=>w.endsWith(deacc(x)));if(!e)return"";
  return e[1]===gender?`-${e[0]}로 끝나는 명사는 대부분 ${e[1]==="f"?"여성(la)":"남성(le)"}이야.`:`-${e[0]}는 보통 ${e[1]==="f"?"여성":"남성"}인데, 이 단어는 예외라 ${gender==="f"?"여성(la)":"남성(le)"}.`}
const ANSDIFF={optFor,units:dUnits,diff:ansDiff,best:ansDiffBest,variants,pronLen,hints:ansHints,auxOf,frGenderHint};

/* 진입점 */
function explain(w,lang){if(!w)return null;if(lang==="ru"){if(w.pos==="v")return ruVerb(w);if(w.pos==="n")return ruNoun(w);if(w.pos==="adj")return ruAdj(w)}
  if(lang==="fr"){if(w.pos==="v")return frVerb(w);if(w.pos==="adj")return frAdj(w.word)}return null}
function ruVowels(s){return(strip(s).toLowerCase().match(/[аеёиоуыэюя]/g)||[]).length}

G.RU_PHON={phon,stressPos,letters,strip,low};G.RULES={explain,ruVerb,ruNoun,ruAdj,frVerb,frAdj};G.ANSDIFF=ANSDIFF;
if(typeof module!=="undefined")module.exports=Object.assign(module.exports||{},{phon,stressPos,strip,low,explain,ruVerb,ruNoun,ruAdj,frVerb,frAdj,ANSDIFF});
})(typeof window!=="undefined"?window:globalThis);
