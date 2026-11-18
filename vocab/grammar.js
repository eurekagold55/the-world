/* 단어 구름 · 문법 개념 페이지 (v15, v18: 분류 + 항목 추가)
   설명은 한국어, 예시는 사전에 나오는 표준형만. 각 항목의 mine()은 저장된 단어 중 이 규칙에 해당하는 것. */
(function(G){"use strict";
const T=(head,rows,cls)=>`<div class="gscroll"><table class="gtbl ${cls||""}"><thead><tr>${head.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>i?`<td>${c}</td>`:`<th>${c}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const EX=(...xs)=>`<ul class="gex">${xs.map(x=>`<li>${x}</li>`).join("")}</ul>`;
const P=s=>`<p>${s}</p>`;
const nfc=s=>String(s==null?"":s).normalize("NFC");
const low=s=>nfc(s).normalize("NFD").replace(/[\u0301\u0300]/g,"").normalize("NFC").toLowerCase().trim();
const inf=w=>nfc(w.word).toLowerCase().trim().replace(/^(se |s'|s’)/,"");
const verbs=ws=>ws.filter(w=>w.pos==="v");
const jeForm=(w,t)=>{const v=(w.conj||{})[t+".je"]||(w.conj||{})[t+".tu"];return v?String(v):""};
const withTense=t=>ws=>verbs(ws).filter(w=>jeForm(w,t)).map(w=>({w,note:jeForm(w,t)}));
const FR_PRON=["je","tu","il/elle","nous","vous","ils/elles"];

const FR=[
 {id:"fr-groups",title:"동사 3그룹",tags:"1군 2군 3군 -er -ir -re",body:
  P("프랑스어 동사는 원형 어미로 세 그룹. 그룹을 알면 현재형 어미가 거의 정해져.")+
  T(["","1군 -er","2군 -ir (nous -issons)","3군 (나머지)"],[["예","parler","finir","prendre, partir, voir"],["je","parle","finis","prends"],["tu","parles","finis","prends"],["il/elle","parle","finit","prend"],["nous","parlons","finissons","prenons"],["vous","parlez","finissez","prenez"],["ils/elles","parlent","finissent","prennent"]])+
  P("1군이 동사의 90% 정도라 제일 중요. aller만 -er인데 불규칙. 2군은 nous에서 -iss-가 끼는 -ir 동사(finir, choisir, réussir). partir·dormir 같은 -ir은 -iss-가 없어서 3군."),
  mine:ws=>verbs(ws).map(w=>{const i=inf(w);const g=i==="aller"?"불규칙":i.endsWith("er")?"1군":/issons$/.test(low((w.conj||{})["pres.nous"]||""))?"2군":"3군";return{w,note:g}})},
 {id:"fr-pres",title:"présent 현재",tags:"현재형",body:
  P("지금 하는 일, 습관, 일반적인 사실, 가까운 미래까지. 영어의 현재·현재진행 둘 다.")+
  T(["","-er","-ir(2군)","-dre (vendre)"],[["je","-e","-is","-s (vends)"],["tu","-es","-is","-s (vends)"],["il","-e","-it","— (vend)"],["nous","-ons","-issons","-ons"],["vous","-ez","-issez","-ez"],["ils","-ent","-issent","-ent"]])+
  P("-er의 je·tu·il·ils 어미(-e, -es, -e, -ent)는 소리가 안 나서 네 개 다 똑같이 들려. 모음 앞 je → j' (j'aime)."),
  mine:withTense("pres")},
 {id:"fr-pc",title:"passé composé 복합과거",tags:"과거분사",body:
  P("끝난 사건(했다). 만드는 법: <b>avoir/être 현재형 + 과거분사</b>.")+
  T(["원형","과거분사 규칙","예"],[["-er","-é","parler → parlé"],["-ir (2군)","-i","finir → fini"],["-re (-dre)","-u","vendre → vendu"]])+
  P("자주 쓰는 불규칙 과거분사: faire → fait, prendre → pris, mettre → mis, dire → dit, écrire → écrit, voir → vu, avoir → eu, être → été, pouvoir → pu, vouloir → voulu, savoir → su, boire → bu, lire → lu, venir → venu, naître → né, mourir → mort, ouvrir → ouvert.")+
  EX("j'ai parlé (avoir)","je suis allé(e) (être → 주어에 일치)")+P("어떤 조동사를 쓰는지는 ‘avoir / être’ 항목."),
  mine:withTense("pc")},
 {id:"fr-impf",title:"imparfait 반과거",tags:"반과거",body:
  P("과거의 <b>배경·상태·습관·진행 중이던 일</b>(~하곤 했다, ~하고 있었다). 끝난 한 번의 사건은 passé composé.")+
  P("만드는 법: <b>현재형 nous에서 -ons 떼고</b> + -ais, -ais, -ait, -ions, -iez, -aient. 예외는 être(ét-) 하나뿐.")+
  T(["원형","nous 현재","반과거 je"],[["parler","parlons","parlais"],["finir","finissons","finissais"],["faire","faisons","faisais"],["prendre","prenons","prenais"],["être","(예외)","étais"]])+
  P("철자 주의: commencer → je commençais 그런데 nous commencions (i 앞이라 ç 없음). manger → je mangeais, nous mangions.")+
  EX("Quand j'étais petit, je jouais au foot. (어렸을 때 축구를 하곤 했어)","Il pleuvait quand je suis sorti. (배경 반과거 + 사건 복합과거)"),
  mine:withTense("impf")},
 {id:"fr-pqp",title:"plus-que-parfait 대과거",tags:"대과거",body:
  P("과거보다 <b>더 먼저</b> 끝난 일(~했었다). <b>avoir/être 반과거 + 과거분사</b>.")+
  EX("j'avais parlé","j'étais allé(e)","Quand il est arrivé, le film avait déjà commencé.")+P("si + 대과거 → 조건법 과거 (Si j'avais su, je serais venu.)"),
  mine:withTense("pqp")},
 {id:"fr-fut",title:"futur simple 단순미래",tags:"미래",body:
  P("미래(~할 것이다). <b>원형 + -ai, -as, -a, -ons, -ez, -ont</b> (avoir 현재형이랑 닮았지). -re 동사는 e를 떼고: prendre → je prendrai.")+
  T(["원형","미래 줄기","je"],[["parler","parler-","parlerai"],["finir","finir-","finirai"],["prendre","prendr-","prendrai"],["acheter","achèter-","achèterai"],["appeler","appeller-","appellerai"]])+
  P("줄기가 불규칙한 것들 (외워야 함): être → ser-, avoir → aur-, aller → ir-, faire → fer-, pouvoir → pourr-, voir → verr-, venir → viendr-, vouloir → voudr-, savoir → saur-, devoir → devr-, envoyer → enverr-, falloir → faudr-, courir → courr-, mourir → mourr-, recevoir → recevr-.")+
  P("가까운 미래는 aller + 원형도 많이 써 (je vais partir)."),
  mine:withTense("fut")},
 {id:"fr-fa",title:"futur antérieur 전미래",tags:"전미래",body:
  P("미래의 어느 시점까지 <b>이미 끝나 있을 일</b>. <b>avoir/être 미래 + 과거분사</b>.")+EX("j'aurai fini","je serai parti(e)","Quand tu auras fini, on partira. (네가 다 끝내면 출발하자)"),mine:withTense("fa")},
 {id:"fr-cond",title:"conditionnel présent 조건법 현재",tags:"조건법",body:
  P("~할 텐데(가정), 공손한 부탁, 과거에서 본 미래. <b>미래 줄기 + 반과거 어미</b> (-ais, -ais, -ait, -ions, -iez, -aient).")+
  T(["원형","미래","조건법"],[["parler","parlerai","parlerais"],["être","serai","serais"],["avoir","aurai","aurais"],["vouloir","voudrai","voudrais"],["pouvoir","pourrai","pourrais"]])+
  EX("Je voudrais un café. (커피 한 잔 주세요 — 공손)","Si j'avais le temps, je voyagerais. (si + 반과거 → 조건법)"),mine:withTense("cond")},
 {id:"fr-condp",title:"conditionnel passé 조건법 과거",tags:"조건법 과거",body:
  P("과거에 대한 가정·후회(~했을 텐데). <b>avoir/être 조건법 + 과거분사</b>.")+EX("j'aurais aimé","je serais venu(e)","Si j'avais su, je serais venu. (알았더라면 왔을 텐데)"),mine:withTense("condp")},
 {id:"fr-subj",title:"subjonctif présent 접속법 현재",tags:"접속법",body:
  P("주관·감정·필요·의지를 나타내는 que절에서. il faut que, vouloir que, avant que, pour que, bien que, être content que…")+
  P("만드는 법: <b>ils 현재형에서 -ent 떼고</b> + -e, -es, -e, -ions, -iez, -ent. nous·vous는 보통 반과거랑 같은 꼴.")+
  T(["원형","ils 현재","que je","que nous"],[["parler","parlent","parle","parlions"],["finir","finissent","finisse","finissions"],["prendre","prennent","prenne","prenions"],["venir","viennent","vienne","venions"]])+
  P("외워야 하는 불규칙: être (que je sois, que nous soyons), avoir (que j'aie, que nous ayons), aller (que j'aille), faire (que je fasse), pouvoir (que je puisse), savoir (que je sache), vouloir (que je veuille)."),
  mine:withTense("subj")},
 {id:"fr-subjp",title:"subjonctif passé 접속법 과거",tags:"접속법 과거",body:
  P("que절에서 이미 끝난 일. <b>que + avoir/être 접속법 + 과거분사</b>.")+EX("que j'aie fini","que je sois parti(e)","Je suis content que tu sois venu."),mine:withTense("subjp")},
 {id:"fr-impr",title:"impératif 명령법",tags:"명령",body:
  P("주어 없이 tu·nous·vous 현재형만 써. -er 동사(와 aller)는 tu에서 -s를 빼: Parle ! Va !(단, 뒤에 y/en이 오면 다시 붙여: Vas-y !)")+
  T(["","parler","finir","être","avoir"],[["(tu)","parle","finis","sois","aie"],["(nous)","parlons","finissons","soyons","ayons"],["(vous)","parlez","finissez","soyez","ayez"]])+
  P("savoir → sache, sachons, sachez / vouloir → veuillez(공손). 재귀동사는 대명사를 하이픈으로 뒤에: Lève-toi ! Levons-nous ! 부정이면 앞으로: Ne te lève pas !"),
  mine:ws=>verbs(ws).filter(w=>(w.conj||{})["impr.tu"]).map(w=>({w,note:w.conj["impr.tu"]}))},
 {id:"fr-ps",title:"passé simple 단순과거 (문어)",tags:"단순과거",body:
  P("소설·역사책·동화에서만 보는 과거. 말할 땐 passé composé. 읽을 때 알아보기만 하면 돼.")+
  T(["형","je","il","ils","예"],[["-a형 (-er 전부)","-ai","-a","-èrent","parler: il parla, ils parlèrent"],["-i형","-is","-it","-irent","finir: il finit / prendre: il prit"],["-u형","-us","-ut","-urent","avoir: il eut / vouloir: il voulut / être: il fut"],["-in형","-ins","-int","-inrent","venir: il vint"]]),
  mine:withTense("ps")},
 {id:"fr-aux",title:"avoir / être · 과거분사 일치",tags:"조동사 être 일치 DR MRS VANDERTRAMP",body:
  P("복합 시제(복합과거·대과거·전미래·조건법 과거·접속법 과거)는 전부 <b>조동사 + 과거분사</b>. 대부분 avoir.")+
  P("<b>être를 쓰는 것</b>: ① 이동·상태 변화 동사 (DR MRS VANDERTRAMP: devenir, revenir, monter, rester, sortir, venir, aller, naître, descendre, entrer, retourner, tomber, rentrer, arriver, mourir, partir + passer) ② 재귀동사 전부 (se lever → je me suis levé(e)).")+
  T(["조동사","일치","예"],[["être","주어의 성·수","elle est partie, ils sont partis, elles sont parties"],["avoir","보통 일치 안 함","elle a mangé"],["avoir + 앞에 온 직접목적어","그 목적어에 일치","la lettre que j'ai écrite"]])+
  P("monter·descendre·sortir·rentrer·passer·retourner는 직접목적어가 있으면 avoir: Il a monté la valise. / Il est monté."),
  mine:ws=>verbs(ws).filter(w=>/être/.test(w.aux||"")).map(w=>({w,note:w.aux}))},
 {id:"fr-spell",title:"철자가 바뀌는 -er 동사",tags:"-cer -ger è 자음 겹침 -yer",body:
  T(["유형","규칙","예"],[["-cer","a/o 앞에서 c → ç ([s] 소리 유지)","commencer → nous commençons, je commençais"],["-ger","a/o 앞에 e 넣기 ([ʒ] 소리 유지)","manger → nous mangeons, je mangeais"],["e + 자음 + er","소리 안 나는 어미 앞에서 e → è","acheter → j'achète / lever → je lève (미래 achèterai)"],["é + 자음 + er","je·tu·il·ils에서 é → è","préférer → je préfère, nous préférons"],["자음 겹침","소리 안 나는 어미 앞에서 l/t 두 번","appeler → j'appelle / jeter → je jette (미래 appellerai)"],["-oyer / -uyer","소리 안 나는 e 앞에서 y → i (필수)","nettoyer → je nettoie / essuyer → j'essuie"],["-ayer","y 그대로도, i로도 OK","payer → je paie / je paye"]])+
  P("공통점: nous·vous(-ons, -ez)처럼 어미에 소리가 있으면 원래대로."),
  mine:ws=>verbs(ws).map(w=>{const i=inf(w);const t=/cer$/.test(i)?"-cer":/ger$/.test(i)?"-ger":/[ou]yer$/.test(i)?"-oyer/-uyer":/ayer$/.test(i)?"-ayer":/é[^aeiouyéèêëàâîïôûù]{1,2}er$/.test(i)?"é→è":/e(l|t)er$/.test(i)?"e→è / 겹침":/e[^aeiouyéèêëàâîïôûù]er$/.test(i)?"e→è":"";return t?{w,note:t}:null}).filter(Boolean)},
 {id:"fr-gender",title:"명사의 성 (le / la)",tags:"성 남성 여성",body:
  P("뜻으로는 못 맞추지만 <b>어미</b>로 꽤 맞출 수 있어.")+
  T(["대부분 여성 (la)","대부분 남성 (le)"],[["-tion, -sion (la nation)","-ment (le moment)"],["-té (la liberté)","-age (le voyage) — 예외 la page, la plage, l'image, la cage"],["-ure (la voiture)","-isme (le tourisme)"],["-ette (la baguette)","-eau (le bateau) — 예외 l'eau, la peau"],["-ence, -ance (la France, la chance) — 예외 le silence","-oir (le soir), -ier (le cahier)"],["-ie (la vie) — 예외 le génie, l'incendie","-ail, -eil (le travail, le soleil)"]]),
  mine:ws=>ws.filter(w=>w.pos==="n"&&(w.gender==="m"||w.gender==="f")).map(w=>({w,note:w.gender==="m"?"le":"la"}))},
 {id:"fr-adj",title:"형용사 성·수 일치",tags:"형용사 여성형 복수형",body:
  P("형용사는 꾸미는 명사의 성·수에 맞춰. 기본: 여성 +e, 복수 +s.")+
  T(["남성","여성","규칙"],[["grand","grande","+e"],["rouge","rouge","이미 -e면 그대로"],["cher","chère","-er → -ère"],["actif / neuf","active / neuve","-f → -ve"],["heureux","heureuse","-eux → -euse"],["naturel / ancien / bon","naturelle / ancienne / bonne","-el, -en, -on → 자음 겹침 + e"],["muet","muette","-et → -ette (단, complet → complète, inquiet → inquiète, secret → secrète)"],["menteur / créateur","menteuse / créatrice","-eur → -euse / -teur → -trice (meilleur → meilleure)"],["blanc, frais, sec, long, doux, faux, gentil, public","blanche, fraîche, sèche, longue, douce, fausse, gentille, publique","불규칙 — 외워야 함"]])+
  T(["복수","규칙","예"],[["보통","+s","grands, grandes"],["-s / -x","그대로","gris, heureux"],["-eau","+x","beau → beaux"],["-al","-aux","normal → normaux (단 banal, fatal, final, natal, naval → -als)"]]),
  mine:ws=>ws.filter(w=>w.pos==="adj").map(w=>({w,note:""}))},
 {id:"fr-bel",title:"bel · nouvel · vieil · cet",tags:"모음 앞 남성형",body:
  P("모음이나 묵음 h로 시작하는 <b>남성 단수 명사 바로 앞</b>에서는 발음을 이어 주려고 특별한 꼴을 써.")+
  T(["보통","모음 앞","예"],[["beau","bel","un bel homme"],["nouveau","nouvel","un nouvel ami"],["vieux","vieil","un vieil arbre"],["fou / mou","fol / mol","(드묾)"],["ce","cet","cet hôtel"]])+P("복수는 그대로 beaux, nouveaux, vieux: de beaux arbres.")},
 {id:"fr-plural",title:"명사 복수형",tags:"복수",body:
  T(["단수","복수","규칙"],[["livre","livres","보통 +s (소리는 안 남)"],["bras, voix, nez","그대로","-s, -x, -z로 끝나면 그대로"],["bateau, jeu","bateaux, jeux","-eau, -eu → +x (단 pneus, bleus)"],["journal, cheval","journaux, chevaux","-al → -aux (단 bals, festivals, carnavals)"],["travail","travaux","-ail은 보통 +s인데 travail·vitrail 등은 -aux"],["bijou, genou","bijoux, genoux","-ou은 +s인데 bijou, caillou, chou, genou, hibou, joujou, pou는 +x"],["œil, ciel, monsieur","yeux, cieux, messieurs","완전 불규칙"]]),
  mine:ws=>ws.filter(w=>w.pos==="n").slice(0,40).map(w=>({w,note:""}))}
];

const RU=[
 {id:"ru-cases",title:"6격 한눈에",tags:"격 전치사",body:
  P("러시아어 명사·형용사·대명사는 문장 속 역할(격)에 따라 어미가 바뀌어. 전치사마다 받는 격이 정해져 있어.")+
  T(["격","질문","주로 언제","전치사"],[["주격 Им.","кто? что?","주어, 사전형","—"],["생격 Род.","кого? чего?","~의, 없다(нет), 수량 (много, 5 이상), 2·3·4 뒤 단수","из, от, до, у, без, для, около, после, с(~에서)"],["여격 Дат.","кому? чему?","~에게, 나이 (мне 20 лет), нравится, нужно·надо","к, по"],["대격 Вин.","кого? что?","직접목적어, 방향 (어디로)","в, на (방향), через, про"],["조격 Твор.","кем? чем?","도구(~로), 직업·신분 (работать врачом), стать/быть","с(~와 함께), над, под, перед, за, между"],["전치격 Пред.","о ком? о чём?","항상 전치사와: ~에 대해, ~에서(장소)","о/об, в, на (장소), при"]])+
  EX("Это книга. (주격)","У меня нет книги. (생격)","Я дал книгу брату. (대격·여격)","Я пишу ручкой. (조격)","Я думаю о книге. (전치격)"),
  mine:ws=>ws.filter(w=>(w.pos==="n"||w.pos==="adj")&&w.decl&&Object.keys(w.decl).length).map(w=>({w,note:"표 있음"}))},
 {id:"ru-n1",title:"명사 1식 (-а / -я)",tags:"1식 여성",body:
  P("-а/-я로 끝나는 명사 (대부분 여성, папа·дядя 같은 남성도 같은 변화).")+
  T(["격","книга 단수","복수","неделя 단수","복수"],[["주격","книга","книги","неделя","недели"],["생격","книги","книг","недели","недель"],["여격","книге","книгам","неделе","неделям"],["대격","книгу","книги","неделю","недели"],["조격","книгой","книгами","неделей","неделями"],["전치격","книге","книгах","неделе","неделях"]])+
  P("-ия로 끝나면 생격·여격·전치격이 -ии: армия → армии. 생격 복수는 어미가 없어지고(книг), 자음이 몰리면 모음이 끼어 (девушка → девушек, сестра → сестёр)."),
  mine:ws=>ws.filter(w=>w.pos==="n"&&/[ая]$/.test(low(w.word))).map(w=>({w,note:""}))},
 {id:"ru-n2",title:"명사 2식 (남성 자음 / 중성 -о -е)",tags:"2식 남성 중성",body:
  T(["격","стол 단수","복수","окно 단수","복수"],[["주격","стол","столы","окно","окна"],["생격","стола","столов","окна","окон"],["여격","столу","столам","окну","окнам"],["대격","стол","столы","окно","окна"],["조격","столом","столами","окном","окнами"],["전치격","столе","столах","окне","окнах"]])+
  P("부드러운 남성(-ь, -й): словарь → словаря, словарю, словарём, словаре / музей → музея, музеем. 생격 복수 -ов / -ев / -ей (словарей). -ий, -ие는 전치격 -ии: в здании. 사람·동물(활동체)이면 대격 = 생격: я вижу брата."),
  mine:ws=>ws.filter(w=>w.pos==="n"&&/([бвгдзклмнпрстфхцжшщчй]|[оеё]|ь)$/.test(low(w.word))&&!(w.declInfo&&w.declInfo.g==="f")).map(w=>({w,note:""}))},
 {id:"ru-n3",title:"명사 3식 (여성 -ь)",tags:"3식",body:
  T(["격","дверь 단수","복수"],[["주격","дверь","двери"],["생격","двери","дверей"],["여격","двери","дверям"],["대격","дверь","двери"],["조격","дверью","дверями"],["전치격","двери","дверях"]])+
  P("단수에선 주격=대격, 생격=여격=전치격(-и), 조격만 -ью. мать·дочь는 -ер-가 끼어 (матери, дочери). -мя 중성(время, имя)도 비슷: времени, временем."),
  mine:ws=>ws.filter(w=>w.pos==="n"&&/ь$/.test(low(w.word))&&w.declInfo&&w.declInfo.g==="f").map(w=>({w,note:""}))},
 {id:"ru-spell",title:"철자 규칙 (7글자 · 5글자)",tags:"철자 규칙",body:
  T(["규칙","뒤에서","예"],[["7글자 규칙","г к х ж ш щ ч 뒤엔 ы 대신 и","книги (книга), мальчики, хорошие"],["5글자 규칙","ж ш щ ч ц 뒤 <b>강세 없는</b> о는 е","хорошего, с Сашей, месяцем (강세 있으면 о: большого, отцом)"],["а/у 규칙","г к х ж ш щ ч 뒤엔 я·ю 대신 а·у","слышу, лежат, кричат"]])+P("어미 표에서 ‘이상한’ 철자는 거의 이 세 규칙 때문.")},
 {id:"ru-fleet",title:"출몰모음 (о / е가 들어갔다 나갔다)",tags:"출몰모음",body:
  P("변화할 때 줄기의 о/е/ё가 <b>빠지거나</b>, 생격 복수에서 <b>새로 끼는</b> 경우.")+
  T(["빠짐","","끼어듦 (생격 복수)",""],[["отец","отца","окно","окон"],["день","дня","сестра","сестёр"],["потолок","потолка","девушка","девушек"],["рынок","рынка","ручка","ручек"]])},
 {id:"ru-anim",title:"활동체 · 대격",tags:"활동체 대격",body:
  P("사람·동물(활동체)이면 <b>남성 단수와 모든 복수</b>의 대격이 생격이랑 같아. 사물이면 주격이랑 같아.")+
  T(["","사물","사람·동물"],[["남성 단수","Я вижу стол.","Я вижу брата."],["복수","Я вижу книги.","Я вижу сестёр."],["여성 단수 -а","Я вижу книгу.","Я вижу сестру. (-у, 항상)"]])},
 {id:"ru-adj",title:"형용사 변화",tags:"형용사",body:
  T(["격","남성","중성","여성","복수"],[["주격","новый","новое","новая","новые"],["생격","нового","нового","новой","новых"],["여격","новому","новому","новой","новым"],["대격","= 주격/생격","новое","новую","= 주격/생격"],["조격","новым","новым","новой","новыми"],["전치격","новом","новом","новой","новых"]])+
  P("부드러운 형(синий): синего, синему, синим, синем / синяя, синей / синие, синих. 강세 어미 -ой (молодой)는 남성 주격만 다르고 나머지는 новый랑 같아. -ого, -его의 г는 [в]로 읽어: нового [нова-ва]. 7·5글자 규칙: русский → русские, хороший → хорошего."),
  mine:ws=>ws.filter(w=>w.pos==="adj").map(w=>({w,note:""}))},
 {id:"ru-short",title:"형용사 짧은 꼴",tags:"짧은 꼴",body:
  P("술어로만 써 (그는 ~하다). 성·수만 바뀌고 격 변화는 없어.")+
  T(["긴 꼴","남성","여성","중성","복수"],[["красивый","красив","красива","красиво","красивы"],["хороший","хорош","хороша","хорошо","хороши"],["интересный","интересен","интересна","интересно","интересны"],["большой","велик","велика","велико","велики"],["маленький","мал","мала","мало","малы"]])+
  P("남성에서 자음이 몰리면 е/о가 끼어 (интересен). большой·маленький는 다른 단어에서 온 꼴."),
  mine:ws=>ws.filter(w=>w.pos==="adj"&&w.decl&&w.decl["short.m"]).map(w=>({w,note:w.decl["short.m"]}))},
 {id:"ru-conj",title:"동사 1식 / 2식",tags:"현재 변화 1식 2식",body:
  T(["","1식 читать","1식 강세 жить","2식 говорить"],[["я","читаю","живу","говорю"],["ты","читаешь","живёшь","говоришь"],["он/она","читает","живёт","говорит"],["мы","читаем","живём","говорим"],["вы","читаете","живёте","говорите"],["они","читают","живут","говорят"]])+
  P("구분 팁: <b>-ить 동사는 거의 2식</b> (예외 брить, стелить). -еть/-ать 중 2식인 것: смотреть, видеть, ненавидеть, зависеть, вертеть, обидеть, терпеть, гнать, держать, дышать, слышать. 나머지 대부분은 1식. 2식 они는 -ат/-ят, 1식은 -ут/-ют."),
  mine:ws=>verbs(ws).map(w=>{const t=low((w.conj||{})["pres.ty"]||"");return t?{w,note:/ишь(ся)?$/.test(t)?"2식":/[её]шь(ся)?$/.test(t)?"1식":""}:null}).filter(Boolean)},
 {id:"ru-alt",title:"자음 교체",tags:"자음 교체",body:
  P("2식은 <b>я 형에서만</b>, 1식은 <b>모든 인칭에서</b> 자음이 바뀌는 동사가 있어.")+
  T(["교체","2식 (я만)","1식 (전부)"],[["т → ч","ответить → отвечу, ответишь","плакать → плачу, плачешь"],["д → ж","видеть → вижу, видишь",""],["с → ш","просить → прошу, просишь","писать → пишу, пишешь"],["з → ж","возить → вожу, возишь","сказать → скажу, скажешь"],["ст → щ","простить → прощу",""],["б/п/в/м + л","любить → люблю / купить → куплю / готовить → готовлю / кормить → кормлю",""],["г/к → ж/ч","","мочь → могу, можешь, может, … могут / печь → пеку, печёшь"]])},
 {id:"ru-aspect",title:"상 (불완료 / 완료)",tags:"상 aspect",body:
  P("거의 모든 동사가 짝: <b>불완료</b> = 과정·반복·습관, <b>완료</b> = 한 번 끝낸 결과.")+
  T(["불완료","완료","뜻"],[["делать","сделать","하다"],["писать","написать","쓰다"],["читать","прочитать","읽다"],["говорить","сказать","말하다"],["брать","взять","잡다"],["покупать","купить","사다"],["давать","дать","주다"]])+
  P("<b>완료상의 현재형 = 미래</b> (я напишу = 다 쓸게). 불완료 미래는 буду + 원형 (я буду писать = 쓰고 있을 거야). 완료상엔 현재가 없어."),
  mine:ws=>verbs(ws).filter(w=>w.aspectImp||w.aspectPf).map(w=>({w,note:[w.aspectImp,w.aspectPf].filter(Boolean).join(" / ")}))},
 {id:"ru-past",title:"과거형",tags:"과거",body:
  P("인칭이 아니라 <b>주어의 성·수</b>로 바뀌어: 원형에서 -ть 떼고 + -л / -ла / -ло / -ли.")+
  T(["원형","남성","여성","중성","복수"],[["читать","читал","читала","читало","читали"],["жить","жил","жила́","жи́ло","жи́ли"],["быть","был","была́","бы́ло","бы́ли"],["идти","шёл","шла","шло","шли"],["мочь","мог","могла","могло","могли"]])+P("жить·быть처럼 여성에서만 강세가 어미로 가는 동사가 꽤 있어."),
  mine:ws=>verbs(ws).filter(w=>(w.conj||{})["past.m"]).map(w=>({w,note:w.conj["past.m"]}))},
 {id:"ru-sja",title:"재귀동사 -ся / -сь",tags:"재귀 ся",body:
  P("자음 뒤엔 -ся, 모음 뒤엔 -сь. 변화는 원래 동사대로 하고 끝에 붙여.")+
  T(["","учиться"],[["я","учусь"],["ты","учишься"],["он/она","учится"],["мы","учимся"],["вы","учитесь"],["они","учатся"],["과거","учился, училась, училось, учились"]])+P("-тся / -ться는 둘 다 [цца]로 읽어."),
  mine:ws=>verbs(ws).filter(w=>/(ся|сь)$/.test(low(w.word))).map(w=>({w,note:""}))},
 {id:"ru-phon",title:"발음: 아카니예 · 이카니예 · 무성음화",tags:"발음",body:
  T(["현상","규칙","예"],[["아카니예","강세 없는 о → [а]","молоко́ [малако́], вода́ [вада́]"],["이카니예","강세 없는 е, я → [и]","река́ [рика́], пятно́ [питно́]"],["어말 무성음화","끝의 б в г д ж з → п ф к т ш с","хлеб [хлеп], го́род [го́рат], друг [друк]"],["동화","뒤 자음 따라 유성/무성","вокза́л [вагза́л], всё [фсё]"],["예외 철자","","-ого [ава], что [што], коне́чно [кане́шна]"]])+
  P("그래서 강세 위치를 아는 게 중요해. 목록·카드의 [ ] 표기가 이 규칙으로 만든 거야."),
  mine:ws=>{const R=G.RU_PHON;return ws.filter(w=>/[\u0301ё]/.test(nfc(w.word).normalize("NFD"))).slice(0,30).map(w=>{let n="";try{n=R?"["+R.phon(w.word).text+"]":""}catch(_){}return{w,note:n}})}}
];

const TR=[
 {id:"tr-harmony",title:"모음조화",tags:"모음조화",body:
  P("터키어 어미는 단어 <b>마지막 모음</b>에 맞춰 모음이 바뀌어.")+
  T(["마지막 모음","2형 (a/e)","4형 (ı/i/u/ü)","예"],[["a, ı","a","ı","kitap → kitaplar, kitabı"],["o, u","a","u","okul → okullar, okulu"],["e, i","e","i","ev → evler, evi"],["ö, ü","e","ü","göz → gözler, gözü"]])+
  P("2형: 복수 -ler/-lar, 여격 -e/-a, 처소격 -de/-da. 4형: 대격 -i, 소유격 -in, 의문 mi, 인칭 -im."),
  mine:ws=>ws.slice(0,40).map(w=>{const m=nfc(w.word).toLocaleLowerCase("tr").match(/[aeıioöuü]/g);const v=m?m[m.length-1]:"";return v?{w,note:v+" → "+("aıou".includes(v)?"a":"e")+" / "+({a:"ı",ı:"ı",o:"u",u:"u",e:"i",i:"i",ö:"ü",ü:"ü"}[v])}:null}).filter(Boolean)},
 {id:"tr-soft",title:"자음 연화 · 자음 동화",tags:"연화 p ç t k",body:
  P("<b>연화</b>: 여러 음절 단어 끝 p, ç, t, k가 모음 어미 앞에서 b, c, d, ğ로 (nk → ng).")+
  T(["","모음 어미 앞"],[["kitap","kitabı"],["ağaç","ağacı"],["çocuk","çocuğu"],["renk","rengi"],["gitmek","gidiyorum"]])+
  P("한 음절 단어는 보통 안 바뀌어 (top → topu, saç → saçı). <b>동화</b>: 무성 자음(f s t k ç ş h p — ‘fıstıkçı şahap’) 뒤에선 어미 d가 t로: kitapta, kitaptan, yaptı."),
  mine:ws=>ws.filter(w=>/[pçtk]$/.test(nfc(w.word).toLocaleLowerCase("tr"))).map(w=>({w,note:""}))},
 {id:"tr-buffer",title:"매개 자음 y · n · s",tags:"매개자음",body:
  T(["자음","언제","예"],[["y","모음 끝 + 모음 어미","araba → arabaya, arabayı"],["s","모음 끝 + 3인칭 소유 -ı","araba → arabası"],["n","3인칭 소유 뒤 격 어미 / 모음 끝 소유격","evinde, arabanın"]])},
 {id:"tr-cases",title:"격 어미",tags:"격",body:
  T(["격","어미","ev","kitap","araba"],[["주격","—","ev","kitap","araba"],["대격 (특정 목적어)","-ı/-i/-u/-ü","evi","kitabı","arabayı"],["여격 (~에게, ~로)","-a/-e","eve","kitaba","arabaya"],["처소격 (~에서)","-da/-de/-ta/-te","evde","kitapta","arabada"],["탈격 (~부터)","-dan/-den/-tan/-ten","evden","kitaptan","arabadan"],["소유격 (~의)","-ın/-in/-un/-ün","evin","kitabın","arabanın"],["도구격 (~와, ~로)","-la/-le (ile)","evle","kitapla","arabayla"]])},
 {id:"tr-verbs",title:"동사 시제 · 인칭 어미",tags:"동사 시제",body:
  P("동사는 <b>어간 + 시제 + 인칭</b>. 어간은 원형에서 -mek/-mak 떼기.")+
  T(["","şimdiki (-iyor)","geniş (-r)","geçmiş (-dı)"],[["ben","geliyorum","gelirim","geldim"],["sen","geliyorsun","gelirsin","geldin"],["o","geliyor","gelir","geldi"],["biz","geliyoruz","geliriz","geldik"],["siz","geliyorsunuz","gelirsiniz","geldiniz"],["onlar","geliyorlar","gelirler","geldiler"]])+
  P("şimdiki: 모음으로 끝난 어간은 그 모음이 빠져 (başlamak → başlıyor, söylemek → söylüyor). geniş: 모음 어간 -r (okur), 한 음절 어간 -ar/-er (yapar, gider), 여러 음절 -ır/-ir (çalışır). 한 음절인데 -ır/-ir인 예외 13개: alır, bilir, bulur, durur, gelir, görür, kalır, olur, ölür, sanır, verir, varır, vurur. geçmiş: 무성 자음 뒤엔 -tı (yaptım)."),
  mine:ws=>verbs(ws).map(w=>({w,note:(w.conj||{})["simdi.ben"]||""}))}
];

/* ---------- v18: 개념 더하기 + 분류 ---------- */
const CATS=[["noun","명사·관사"],["adj","형용사·부사"],["pron","대명사"],["verb","동사·시제"],["case","격"],["phon","음운·발음"],["syn","문장 구조"]];
const nouns=ws=>ws.filter(w=>w.pos==="n");
const adjs=ws=>ws.filter(w=>w.pos==="adj");
const advs=ws=>ws.filter(w=>w.pos==="adv");
FR.push(
 {id:"fr-articles",cat:"noun",title:"관사 (정관사 · 부정관사 · 부분관사)",tags:"le la les un une des du de la article partitif au aux",body:
  P("프랑스어 명사는 거의 늘 관사랑 같이 나와. 관사가 성(남/여)과 수(단/복)를 보여 줘.")+
  T(["","남성 단수","여성 단수","복수"],[["정관사 (그 ~)","le (l')","la (l')","les"],["부정관사 (어떤 ~)","un","une","des"],["부분관사 (약간의 ~)","du (de l')","de la (de l')","des"]])+
  P("모음·무음 h 앞에선 le/la → <b>l'</b> (l'ami, l'école, l'homme). 셀 수 없는 것(물, 빵, 용기)은 부분관사: du pain, de la confiance, de l'eau.")+
  P("<b>축약</b>: à + le → au, à + les → aux, de + le → du, de + les → des. (à la, à l', de la, de l'는 그대로)")+
  EX("Je vais au cinéma. (à + le)","Je parle aux enfants. (à + les)","le livre du professeur (de + le)")+
  P("<b>부정문</b>에선 부정·부분관사 un/une/des/du/de la → <b>de (d')</b>: Je n'ai pas de voiture. Il ne boit pas d'eau. 단 être 뒤는 그대로: Ce n'est pas un chat. 정관사는 안 바뀜: Je n'aime pas le café."),
  mine:ws=>nouns(ws).filter(w=>/^(le|la|les|l['’]|un|une)\s?/i.test(w.word)).map(w=>({w,note:(w.word.match(/^(le|la|les|l['’]|un|une)/i)||[""])[0]}))},
 {id:"fr-adj-pos",cat:"adj",title:"형용사 위치 (앞 / 뒤)",tags:"BAGS beau grand petit position",body:
  P("형용사는 보통 <b>명사 뒤</b>: un livre intéressant, une voiture rouge.")+
  P("짧고 자주 쓰는 몇 개는 <b>앞</b>. 외우기: 아름다움·나이·좋고나쁨·크기 (영어로 BAGS): beau, joli, jeune, vieux, nouveau, bon, mauvais, grand, petit, gros, long, haut.")+
  EX("une jolie maison","un petit chat","une nouvelle voiture","un bon restaurant")+
  P("위치에 따라 뜻이 바뀌는 것:")+
  T(["형용사","앞","뒤"],[["grand","un grand homme (위대한)","un homme grand (키 큰)"],["ancien","mon ancien appartement (예전의)","un meuble ancien (오래된, 골동)"],["cher","mon cher ami (소중한)","un repas cher (비싼)"],["propre","ma propre chambre (내 자신의)","une chambre propre (깨끗한)"],["seul","un seul enfant (단 하나의)","un enfant seul (혼자인)"]])+
  P("복수 형용사가 명사 앞에 오면 des → <b>de</b>: de belles fleurs (글말에서 지켜)."),
  mine:ws=>adjs(ws).filter(w=>/^(beau|belle|joli|jolie|jeune|vieux|vieille|nouveau|nouvelle|bon|bonne|mauvais|mauvaise|grand|grande|petit|petite|gros|grosse|long|longue|haut|haute)$/i.test(w.word.trim())).map(w=>({w,note:"명사 앞"}))},
 {id:"fr-compar",cat:"adj",title:"비교급 · 최상급",tags:"plus moins aussi que meilleur mieux pire",body:
  T(["","형용사","부사"],[["더 ~","plus grand que","plus vite que"],["덜 ~","moins grand que","moins vite que"],["만큼 ~","aussi grand que","aussi vite que"],["가장 ~","le/la/les plus grand(e)(s)","le plus vite"]])+
  P("최상급은 관사가 형용사 성·수를 따라가: la plus belle ville, les plus grands pays. 뒤에 붙는 형용사면 관사 두 번: la ville <b>la plus</b> intéressante.")+
  T(["원급","비교급","최상급"],[["bon (좋은)","meilleur","le meilleur"],["bien (잘)","mieux","le mieux"],["mauvais (나쁜)","plus mauvais / pire","le plus mauvais / le pire"]])+
  EX("Ce gâteau est meilleur que l'autre.","Elle chante mieux que moi.")+P("plus bon, plus bien은 안 써.")},
 {id:"fr-adv",cat:"adj",title:"부사 만들기 (-ment)",tags:"부사 adverbe ment",body:
  P("대부분 <b>형용사 여성형 + -ment</b>.")+
  T(["형용사","부사","규칙"],[["lent → lente","lentement","여성형 + ment"],["heureux → heureuse","heureusement","여성형 + ment"],["vrai","vraiment","모음으로 끝나면 남성형 + ment"],["poli","poliment","모음으로 끝나면 남성형 + ment"],["constant","constamment","-ant → -amment"],["prudent","prudemment","-ent → -emment (소리는 [amɑ̃])"]])+
  P("외워 둘 것: gentil → gentiment, bref → brièvement, précis → précisément, énorme → énormément, profond → profondément. bon → bien, mauvais → mal은 따로 생긴 부사."),
  mine:ws=>advs(ws).filter(w=>/ment$/i.test(w.word.trim())).map(w=>({w,note:"-ment"}))},
 {id:"fr-pron-subj",cat:"pron",title:"주어 대명사 · 강세형",tags:"je tu il moi toi lui eux pronom tonique",body:
  T(["주어","강세형","예"],[["je","moi","Moi, je reste."],["tu","toi","C'est toi ?"],["il","lui","avec lui"],["elle","elle","pour elle"],["on","soi","chacun pour soi"],["nous","nous","chez nous"],["vous","vous","après vous"],["ils","eux","sans eux"],["elles","elles","comme elles"]])+
  P("강세형은 <b>전치사 뒤</b> (avec moi, chez lui), <b>c'est 뒤</b> (c'est moi), <b>강조</b> (Moi, j'aime le thé), <b>비교 que 뒤</b> (plus grand que toi), 혼자 쓸 때 (Qui ? — Moi.).")+
  P("on은 3인칭 단수 동사를 쓰지만 말에선 ‘우리’ 뜻으로 아주 많이 써: On y va ? vous는 여러 명 또는 한 명 존댓말.")},
 {id:"fr-pron-obj",cat:"pron",title:"목적 대명사 (le, lui, y, en) · 순서",tags:"COD COI le la les lui leur y en ordre",body:
  T(["","직접목적 (~을)","간접목적 (à ~에게)"],[["나","me (m')","me (m')"],["너","te (t')","te (t')"],["그/그녀/그것","le / la (l')","lui"],["우리","nous","nous"],["너희/당신","vous","vous"],["그들","les","leur"]])+
  P("위치: 활용된 동사 <b>바로 앞</b>. 복합과거면 조동사 앞: Je l'ai vu. 동사+원형이면 원형 앞: Je vais le faire.")+
  P("둘 이상이면 순서: <b>me/te/se/nous/vous → le/la/les → lui/leur → y → en</b>.")+
  EX("Il me le donne.","Je le lui donne.","Il y en a.")+
  P("<b>y</b> = à + 사물/장소 (J'y vais. Tu penses à l'examen ? — Oui, j'y pense.) · <b>en</b> = de + 명사, 수량 (Tu as du pain ? — Oui, j'en ai. J'en ai deux.)")+
  P("긍정 명령문만 동사 뒤 + 하이픈, me/te → moi/toi: Donne-le-moi ! 부정 명령은 원래 순서: Ne me le donne pas.")+
  P("직접목적 대명사가 복합과거 앞에 오면 과거분사가 그 대명사에 일치: Ces fleurs, je les ai achetées.")},
 {id:"fr-poss",cat:"pron",title:"소유형용사 · 지시형용사",tags:"mon ma mes son sa ce cet cette ces",body:
  T(["","남성 단수","여성 단수","복수"],[["나의","mon","ma","mes"],["너의","ton","ta","tes"],["그/그녀의","son","sa","ses"],["우리의","notre","notre","nos"],["너희/당신의","votre","votre","vos"],["그들의","leur","leur","leurs"]])+
  P("성은 <b>가진 사람이 아니라 가진 물건</b>을 따라가: sa voiture는 ‘그의 차’도 ‘그녀의 차’도 돼.")+
  P("모음·무음 h로 시작하는 여성 명사 앞에선 ma/ta/sa → <b>mon/ton/son</b>: mon amie, son école, ton histoire.")+
  T(["지시형용사","예"],[["ce (남성)","ce livre"],["cet (남성, 모음·무음 h 앞)","cet homme, cet ami"],["cette (여성)","cette maison"],["ces (복수)","ces livres"]])+
  P("이것/저것 구분은 -ci / -là: ce livre-ci, ce livre-là. 대명사는 celui, celle, ceux, celles (celui de Paul).")},
 {id:"fr-relative",cat:"pron",title:"관계대명사 qui · que · où · dont",tags:"qui que où dont ce qui ce que relatif",body:
  T(["관계대명사","역할","예"],[["qui","관계절의 주어","l'homme qui parle"],["que (qu')","관계절의 직접목적","le livre que je lis"],["où","장소·시간","la ville où j'habite, le jour où il est venu"],["dont","de + 명사 대신","le livre dont je parle (parler de)"]])+
  P("구별 요령: 뒤에 바로 동사가 오면 대개 qui, 주어+동사가 오면 que. que는 모음 앞에서 qu'가 되지만 qui는 절대 안 줄어.")+
  P("앞에 명사가 없으면 ce qui / ce que / ce dont: Je sais ce qui est important. Fais ce que tu veux.")},
 {id:"fr-pronominal",cat:"verb",title:"대명동사 (se laver, s'appeler)",tags:"se pronominal réfléchi",body:
  P("주어와 같은 사람을 가리키는 재귀대명사가 붙는 동사. 재귀대명사는 주어를 따라 바뀌어.")+
  T(["","se laver (씻다)"],[["je","me lave"],["tu","te laves"],["il/elle","se lave"],["nous","nous lavons"],["vous","vous lavez"],["ils/elles","se lavent"]])+
  P("모음 앞 me/te/se → m'/t'/s': je m'appelle, il s'habille. 복합시제는 늘 <b>être</b>: je me suis levé(e).")+
  P("과거분사 일치: 재귀대명사가 직접목적이면 일치 (elle s'est lavée), 뒤에 직접목적이 따로 있으면 일치 안 함 (elle s'est lavé les mains).")+
  P("명령문: Lève-toi ! / Ne te lève pas !"),
  mine:ws=>verbs(ws).filter(w=>/^(se |s'|s’)/i.test(nfc(w.word))).map(w=>({w,note:"être"}))},
 {id:"fr-periph",cat:"verb",title:"가까운 미래 · 가까운 과거 · 진행",tags:"futur proche passé récent aller venir de en train de",body:
  T(["형태","뜻","예"],[["aller + 원형","곧 ~할 거야 (futur proche)","Je vais manger."],["venir de + 원형","방금 ~했어 (passé récent)","Je viens de manger."],["être en train de + 원형","~하는 중이야","Je suis en train de manger."]])+
  P("aller, venir, être만 활용하고 뒤 동사는 원형 그대로. 말에선 futur simple보다 aller + 원형을 더 많이 써.")},
 {id:"fr-si",cat:"syn",title:"si 조건문 (만약 ~라면)",tags:"si hypothèse condition conditionnel",body:
  T(["si 절","주절","뜻"],[["présent","futur / présent / 명령","실제로 있을 수 있는 조건"],["imparfait","conditionnel présent","지금 사실과 반대 · 가정"],["plus-que-parfait","conditionnel passé","과거 사실과 반대"]])+
  EX("S'il pleut, je resterai à la maison.","Si j'avais de l'argent, j'achèterais une maison.","Si j'avais su, je serais venu.")+
  P("‘만약’ 뜻의 si 바로 뒤에는 futur나 conditionnel을 쓰지 않아. si + il/ils → s'il/s'ils (si elle은 그대로).")},
 {id:"fr-neg",cat:"syn",title:"부정문 (ne ... pas 외)",tags:"ne pas jamais plus rien personne que négation",body:
  P("활용된 동사를 <b>ne ... pas</b>로 감싸. 모음 앞 ne → n'.")+
  T(["형태","뜻","예"],[["ne ... pas","~ 안 해","Je ne mange pas."],["ne ... jamais","절대/한 번도 ~ 안 해","Il ne ment jamais."],["ne ... plus","더 이상 ~ 안 해","Elle n'habite plus ici."],["ne ... rien","아무것도 ~ 안 해","Je ne vois rien."],["ne ... personne","아무도 ~ 안 해","Je ne connais personne."],["ne ... que","~만 해 (부정 아님)","Je n'ai que dix euros."]])+
  P("복합과거: ne + 조동사 + pas + 과거분사 → Je n'ai pas mangé. 단 personne는 과거분사 뒤: Je n'ai vu personne.")+
  P("원형을 부정할 땐 둘 다 앞에: Il préfère ne pas venir. 말에서는 ne를 자주 빼먹어 (J'sais pas), 글에선 꼭 써.")},
 {id:"fr-question",cat:"syn",title:"의문문 만드는 세 가지",tags:"est-ce que inversion question",body:
  T(["방법","예","느낌"],[["억양만 올리기","Tu viens ?","편한 말"],["Est-ce que + 평서문","Est-ce que tu viens ?","무난"],["주어-동사 도치","Viens-tu ?","격식, 글"]])+
  P("도치할 때 동사가 모음으로 끝나고 주어가 il/elle/on이면 <b>-t-</b>를 넣어: Parle-t-il français ? A-t-elle fini ?")+
  P("의문사: qui (누구), que / qu'est-ce que (무엇), où (어디), quand (언제), comment (어떻게), pourquoi (왜), combien (얼마나), quel/quelle/quels/quelles (어떤, 명사에 일치).")+
  EX("Où est-ce que tu habites ?","Quelle heure est-il ?")},
 {id:"fr-elision",cat:"phon",title:"모음 생략 (élision) · 연음 (liaison)",tags:"élision liaison h muet h aspiré",body:
  P("<b>élision</b>: le, la, je, me, te, se, ne, de, que가 모음·무음 h 앞에서 모음을 떨궈: l'ami, j'aime, il n'a pas, qu'il. si는 il/ils 앞에서만 s'il.")+
  P("<b>liaison</b>: 평소 안 읽는 끝 자음을 다음 단어 모음과 이어 읽어.")+
  T(["","예"],[["꼭 하는 곳","관사·한정사 + 명사 (les‿amis, un‿enfant), 대명사 + 동사 (nous‿avons, ils‿ont), 짧은 전치사·부사 뒤 (en‿avance, très‿utile)"],["하면 안 되는 곳","et 뒤 (et | un), 유음 h 앞 (les | héros, les | haricots), 단수 명사 뒤 (un enfant | intelligent)"]])+
  P("이어 읽을 때 소리: s, x → [z] (les‿amis [lezami]), d → [t] (quand‿il), f → [v] (neuf‿heures).")+
  P("h는 늘 묵음. ‘무음 h’는 모음처럼 취급 (l'homme), ‘유음 h’는 자음처럼 취급 (le héros, la hache) — 사전에 *h, ’h로 표시돼.")},
 {id:"fr-accents",cat:"phon",title:"악상 기호와 발음",tags:"accent aigu grave circonflexe cédille tréma é è ê ç ë",body:
  T(["기호","예","역할"],[["é (aigu)","été, café","닫힌 [e]"],["è (grave)","père, très","열린 [ɛ]"],["à ù (grave)","à, où","소리는 그대로, 다른 단어와 구별 (a / à, ou / où, la / là)"],["ê â î ô û (circonflexe)","fête, forêt, hôpital","옛날 s가 빠진 자리인 경우가 많아 (forest → forêt), ê는 [ɛ]"],["ç (cédille)","français, garçon, reçu","a, o, u 앞에서 c를 [s]로"],["ë ï ü (tréma)","Noël, naïf","앞 모음과 따로 읽어"]])+
  P("이 앱에선 악상도 철자라서 빠지면 틀린 걸로 쳐. 대문자에도 악상을 붙이는 게 표준 (État, À bientôt).")},
 {id:"fr-nasal",cat:"phon",title:"비모음 (an, in, on, un)",tags:"nasale voyelle nasale",body:
  T(["철자","소리","예"],[["an, am, en, em","[ɑ̃]","enfant, temps, chambre"],["in, im, ain, ein, yn","[ɛ̃]","vin, important, pain, plein"],["un, um","[œ̃] (요즘은 대개 [ɛ̃])","un, parfum"],["on, om","[ɔ̃]","bon, nom"]])+
  P("뒤에 <b>모음</b>이 오거나 <b>n/m이 겹치면</b> 비모음이 아니야: bon [bɔ̃] ↔ bonne [bɔn], plein ↔ pleine, an ↔ année. m, b, p 앞에선 n 대신 m을 써 (temps, important).")}
);
RU.push(
 {id:"ru-gender",cat:"noun",title:"명사의 성 (어미로 알아보기)",tags:"남성 여성 중성 род",body:
  T(["어미","성","예"],[["자음, -й","남성","стол, музей"],["-а, -я","여성","мама, неделя"],["-о, -е, -ё","중성","окно, море"],["-мя","중성 (10개 정도)","время, имя"],["-ь","남성 또는 여성 — 외워야 해","день (남), ночь (여)"]])+
  P("-ь 힌트: -ость, -есть, -чь, -шь, -щь, -жь는 여성 (радость, ночь, мышь), -тель은 남성 (учитель).")+
  P("-а/-я로 끝나도 <b>남자</b>면 남성: папа, дядя, мужчина, дедушка. 형용사·과거형은 남성으로 맞춰 (мой папа пришёл)."),
  mine:ws=>nouns(ws).map(w=>({w,note:w.gender||(w.declInfo&&w.declInfo.g)||""})).filter(x=>x.note)},
 {id:"ru-plural",cat:"noun",title:"주격 복수",tags:"복수 множественное",body:
  T(["단수","복수 어미","예"],[["남성 자음, 여성 -а","-ы","стол → столы, мама → мамы"],["-й, -ь, -я, 또는 г к х ж ш ч щ 뒤","-и","музей → музеи, книга → книги, нож → ножи"],["중성 -о","-а","окно → окна"],["중성 -е","-я","море → моря"]])+
  P("철자 규칙 때문에 г к х ж ш ч щ 뒤에선 ы 대신 и.")+
  P("자주 쓰는 불규칙: 강세 -а 복수 дом → дома, город → города, глаз → глаза, учитель → учителя · -ья 복수 брат → братья, стул → стулья, друг → друзья, сын → сыновья · 완전 불규칙 человек → люди, ребёнок → дети · мать → матери, дочь → дочери · имя → имена, время → времена.")},
 {id:"ru-genpl",cat:"case",title:"생격 복수 (제일 헷갈리는 칸)",tags:"생격 복수 родительный множественное",body:
  T(["단수","생격 복수","예"],[["남성 단단한 자음","-ов","стол → столов"],["남성 -й, 강세 없는 -ц","-ев","музей → музеев, месяц → месяцев"],["남성 ж ш ч щ, 그리고 남·여 -ь","-ей","врач → врачей, день → дней, ночь → ночей"],["여성 -а, 중성 -о","어미 없음 (∅)","книга → книг, место → мест"],["여성 -я (자음 뒤)","-ь","неделя → недель"],["-ия, -ие","-ий","линия → линий, здание → зданий"],["중성 -е (-ие 말고)","-ей","море → морей, поле → полей"]])+
  P("어미가 없어지면 자음이 겹치는 자리에 <b>출몰모음</b>이 들어오는 경우가 많아: окно → окон, ручка → ручек, сестра → сестёр, девушка → девушек.")+
  P("불규칙: человек → людей (5 человек도 써), ребёнок → детей, год → лет (5 лет), раз → раз, глаз → глаз, солдат → солдат.")},
 {id:"ru-numbers",cat:"case",title:"숫자 뒤 명사 (1 · 2-4 · 5+)",tags:"숫자 수사 один два пять",body:
  T(["수","명사 꼴","예"],[["1, 21, 31 …","주격 단수","один стол, двадцать один стол"],["2-4, 22-24 …","생격 단수","два стола, три книги"],["5-20, 25-30 …, 0","생격 복수","пять столов, одиннадцать книг"]])+
  P("끝자리만 봐. 단 11-14는 무조건 생격 복수 (одиннадцать, двенадцать столов).")+
  P("один은 성을 따라가 (один стол, одна книга, одно окно), два도 여성 앞에선 две (две книги). много, мало, сколько, несколько 뒤도 생격 (много книг, мало времени).")},
 {id:"ru-prep",cat:"case",title:"전치사별 격",tags:"전치사 предлоги в на у из с к",body:
  T(["격","전치사","예"],[["생격","у, из, от, до, без, для, после, около, с (~에서 내려/부터)","у брата, из Москвы, без сахара"],["여격","к, по","к врачу, по улице"],["대격","в / на (방향, 어디로), через, про, за / под (방향)","в школу, на работу, через год"],["조격","с (~와 함께), за / под (위치), над, перед, между","с другом, под столом"],["전치격","в / на (위치, 어디에서), о / об (~에 대해), при","в школе, на работе, о книге"]])+
  P("в / на: куда? (어디로) → 대격, где? (어디에서) → 전치격. 같은 전치사도 격에 따라 뜻이 달라: за дом (집 뒤로) / за домом (집 뒤에).")+
  P("на을 쓰는 장소는 외워: на работе, на почте, на улице, на концерте, на востоке.")},
 {id:"ru-pron",cat:"pron",title:"인칭대명사 변화",tags:"я ты он она мы вы они местоимения",body:
  T(["주격","생격","여격","대격","조격","전치격"],[["я","меня","мне","меня","мной","(обо) мне"],["ты","тебя","тебе","тебя","тобой","тебе"],["он / оно","его","ему","его","им","нём"],["она","её","ей","её","ей (ею)","ней"],["мы","нас","нам","нас","нами","нас"],["вы","вас","вам","вас","вами","вас"],["они","их","им","их","ими","них"]])+
  P("3인칭 (он, она, оно, они)은 <b>전치사 뒤에서 н-</b>이 붙어: у него, к ней, с ним, о них. его / её / их가 ‘그의 / 그녀의 / 그들의’(소유)일 땐 н- 안 붙어: у его брата.")+
  P("Вы를 대문자로 쓰면 한 사람에게 존댓말 (편지 등).")},
 {id:"ru-poss",cat:"pron",title:"소유대명사 · свой · 지시대명사",tags:"мой твой наш ваш свой этот тот",body:
  T(["","남성","여성","중성","복수"],[["나의","мой","моя","моё","мои"],["너의","твой","твоя","твоё","твои"],["우리의","наш","наша","наше","наши"],["너희/당신의","ваш","ваша","ваше","ваши"],["이","этот","эта","это","эти"],["그/저","тот","та","то","те"]])+
  P("его (그의), её (그녀의), их (그들의)는 <b>안 변해</b>: его книга, его книги, о его книге.")+
  P("<b>свой</b>: 소유자가 그 문장의 주어일 때. Он любит свою жену. (자기 아내) ↔ Он любит его жену. (다른 남자의 아내)")+
  P("Это книга. (이건 책이야)의 это는 안 변하는 ‘이것’. Эта книга … (이 책은 …)의 эта는 형용사처럼 변해.")},
 {id:"ru-comp",cat:"adj",title:"비교급 · 최상급",tags:"сравнительная степень лучше больше самый",body:
  P("단순 비교급: 어간 + <b>-ее</b> (말로는 -ей도): новый → новее, интересный → интереснее, тёплый → теплее. 성·수로 안 변해.")+
  T(["원급","비교급"],[["хороший / хорошо","лучше"],["плохой / плохо","хуже"],["большой / много","больше"],["маленький / мало","меньше"],["дорогой","дороже"],["дешёвый","дешевле"],["высокий","выше"],["молодой","моложе (나이는 младше)"],["старый","старше (나이) / старее (물건)"],["простой","проще"],["громкий","громче"]])+
  P("비교 대상: <b>чем</b> + 주격 또는 그냥 <b>생격</b>: Он старше, чем я. = Он старше меня.")+
  P("복합형: более / менее + 형용사 (более интересная книга). 최상급: самый + 형용사 (самый интересный фильм).")},
 {id:"ru-future",cat:"verb",title:"미래형 (буду + 원형 / 완료상)",tags:"будущее буду",body:
  T(["","быть 미래","불완료상 미래","완료상 미래"],[["я","буду","буду читать","прочитаю"],["ты","будешь","будешь читать","прочитаешь"],["он/она","будет","будет читать","прочитает"],["мы","будем","будем читать","прочитаем"],["вы","будете","будете читать","прочитаете"],["они","будут","будут читать","прочитают"]])+
  P("<b>불완료상</b>: буду + 원형 (과정·반복: 읽고 있을 거야). <b>완료상</b>: 현재형처럼 활용하면 그게 미래 (다 읽을 거야). 완료상엔 현재형이 없어.")+
  P("완료상 동사에 буду를 붙이면 틀려 (× буду прочитать).")},
 {id:"ru-imper",cat:"verb",title:"명령형",tags:"повелительное наклонение императив",body:
  P("3인칭 복수(они) 현재형에서 어미 -ют/-ут/-ят/-ат를 떼고:")+
  T(["어간 끝","붙이는 것","예"],[["모음","-й","читают → читай, играют → играй"],["자음 + 1인칭 단수 강세가 어미에","-и","пишу́ → пиши, говорю́ → говори"],["자음 + 어간에 강세","-ь","отве́тят → ответь, гото́вят → готовь"],["자음 두 개","-и","по́мнят → помни"]])+
  P("여럿 또는 존댓말이면 <b>-те</b>: читайте, пишите, ответьте. 재귀동사는 -ся/-сь: мойся, мойтесь.")+
  P("외울 것: дать → дай, пить → пей, есть → ешь, быть → будь, лечь → ляг, ехать → поезжай.")},
 {id:"ru-motion",cat:"verb",title:"이동 동사 (идти / ходить)",tags:"глаголы движения идти ходить ехать ездить",body:
  T(["한 방향 · 지금 가는 중","여러 방향 · 왕복 · 습관","뜻"],[["идти","ходить","걸어가다"],["ехать","ездить","타고 가다"],["бежать","бегать","뛰다"],["лететь","летать","날다"],["плыть","плавать","헤엄치다, 항해하다"],["нести","носить","들고 가다"],["вести","водить","데리고 가다"],["везти","возить","싣고 가다"]])+
  EX("Я иду в школу. (지금 가는 중)","Я хожу в школу. (다녀, 습관)","Вчера я ходил в кино. (갔다 왔어)")+
  P("접두사 по-를 붙이면 ‘출발하다’ 완료상: пойти, поехать. 그 밖에 при- (도착), у- (떠남), в- (들어감), вы- (나감)이 붙으면 상의 짝이 바뀌어: прийти / приходить.")},
 {id:"ru-cond",cat:"syn",title:"가정법 (бы)",tags:"сослагательное наклонение бы если",body:
  P("<b>бы + 과거형</b>. 시제 구분 없이 지금·과거의 가정 둘 다.")+
  EX("Я бы купил машину. (차를 살 텐데)","Если бы у меня были деньги, я бы купил машину.","Я хотел бы … (~하고 싶은데요, 공손)")+
  P("실제로 가능한 조건은 бы 없이 если + 미래: Если будет время, я приду.")},
 {id:"ru-neg",cat:"syn",title:"부정 · 이중 부정 · нет + 생격",tags:"не нет никто ничего никогда",body:
  P("не는 부정하는 말 바로 앞: Я не знаю. Не я это сделал.")+
  P("<b>이중 부정이 정상</b>: никто, ничего, никогда, нигде, никуда를 쓰면 동사 앞에 не도 같이: Я никого не видел. Он никогда не опаздывает.")+
  P("‘없다’는 <b>нет + 생격</b>: У меня нет брата. Здесь нет воды. 과거 не было, 미래 не будет (주어 성과 상관없이 중성): Вчера не было урока.")},
 {id:"ru-order",cat:"syn",title:"어순 · 의문문",tags:"порядок слов вопрос ли",body:
  P("격 어미가 역할을 보여 줘서 어순이 꽤 자유로워. 기본은 주어-동사-목적어, <b>새로운 정보·강조는 문장 끝</b>.")+
  EX("Мама читает книгу. (엄마가 뭘 해? → 책 읽어)","Книгу читает мама. (책은 누가 읽어? → 엄마가)")+
  P("예/아니오 의문문은 어순 그대로 <b>억양</b>만 바꿔 (묻는 말에 높은 억양): Ты была в Москве? 글말에선 ли: Знаешь ли ты …? 간접의문 ‘~인지’도 ли: Я не знаю, придёт ли он.")},
 {id:"ru-hardsoft",cat:"phon",title:"단단한 / 부드러운 자음",tags:"твёрдый мягкий ь ъ",body:
  T(["단단한 모음 글자","а","у","ы","э","о"],[["부드러운 모음 글자","я","ю","и","е","ё"]])+
  P("자음 뒤 모음 글자가 앞 자음의 단단함/부드러움을 정해: мат (단단한 м) ↔ мять (부드러운 м). <b>ь</b>는 앞 자음을 부드럽게, 소리는 없어: брат ↔ брать.")+
  P("<b>ъ</b>는 접두사 뒤에서 자음과 я/е/ё/ю를 끊어 읽게 해: подъезд, объяснить.")+
  P("ж, ш, ц는 늘 단단하고 ч, щ, й는 늘 부드러워. 그래서 жи, ши는 [жы], [шы]처럼 읽어.")}
);
TR.push(
 {id:"tr-plural",cat:"noun",title:"복수 -lar / -ler",tags:"çoğul lar ler",body:
  P("마지막 모음이 a ı o u면 <b>-lar</b>, e i ö ü면 <b>-ler</b>: kitaplar, evler, okullar, gözler.")+
  P("<b>숫자 뒤엔 복수 안 써</b>: iki kitap, beş elma. birkaç, çok 뒤도 보통 단수: çok kitap.")+
  P("동사 3인칭 복수 -lar는 사람 주어일 때만 붙고, 주어가 따로 있으면 자주 빠져: Çocuklar oynuyor."),
  mine:ws=>nouns(ws).map(w=>{const v=(w.word.match(/[aeıioöuü](?=[^aeıioöuü]*$)/i)||[""])[0].toLowerCase();return v?{w,note:"-"+("aıou".includes(v)?"lar":"ler")}:null}).filter(Boolean)},
 {id:"tr-possess",cat:"noun",title:"소유 어미 (evim, arabası)",tags:"iyelik eki possessive",body:
  T(["","자음 끝 (ev)","모음 끝 (araba)"],[["benim (나의)","evim","arabam"],["senin (너의)","evin","araban"],["onun (그의)","evi","arabası"],["bizim (우리의)","evimiz","arabamız"],["sizin (너희의)","eviniz","arabanız"],["onların (그들의)","evleri","arabaları"]])+
  P("모음은 4가지 모음조화 (ı i u ü). 3인칭 단수는 모음 뒤에서 -sı/-si/-su/-sü.")+
  P("소유 어미 뒤에 격 어미가 오면 3인칭 뒤에 <b>n</b>이 끼어: evinde (그의 집에서), arabasını (그의 차를).")+
  P("‘A의 B’는 <b>A-(n)ın + B-(s)ı</b>: Ali'nin kitabı, okulun bahçesi. 소유 없이 이름처럼 붙는 경우: Türk kahvesi, okul müdürü.")},
 {id:"tr-adj",cat:"adj",title:"형용사 · 비교 · 부사",tags:"sıfat daha en karşılaştırma zarf",body:
  P("형용사는 명사 <b>앞</b>에 오고 안 변해: güzel ev, güzel evler, güzel evde.")+
  T(["","형태","예"],[["비교급","(탈격 +) daha + 형용사","Ali Ayşe'den daha uzun."],["최상급","en + 형용사","en güzel şehir"],["~만큼","kadar","Ali kadar uzun"]])+
  P("비교 대상에 탈격 -dan/-den이 붙으면 daha는 빼도 돼: Ali Ayşe'den uzun.")+
  P("많은 형용사는 그대로 부사로도 써: İyi konuşuyor. 부사 어미 -ca/-ce/-ça/-çe: yavaşça, güzelce.")+
  P("강조 반복 (첫 음절 + m/p/s/r): bembeyaz, simsiyah, kıpkırmızı, masmavi, yemyeşil, tertemiz.")},
 {id:"tr-pron",cat:"pron",title:"인칭대명사 변화",tags:"zamir ben sen o biz siz onlar",body:
  T(["주격","대격 (~을)","여격 (~에게)","위치격 (~에)","탈격 (~에서)","속격 (~의)"],[["ben","beni","bana","bende","benden","benim"],["sen","seni","sana","sende","senden","senin"],["o","onu","ona","onda","ondan","onun"],["biz","bizi","bize","bizde","bizden","bizim"],["siz","sizi","size","sizde","sizden","sizin"],["onlar","onları","onlara","onlarda","onlardan","onların"]])+
  P("bana, sana는 불규칙 (× bene, × sene). o는 격 어미 앞에서 n이 끼어 (onu, ona, onun).")+
  P("동사에 인칭 어미가 있어서 주어 대명사는 강조할 때 말곤 자주 빼: Geliyorum. (= Ben geliyorum.) siz는 존댓말 한 명에도 써.")},
 {id:"tr-demo",cat:"pron",title:"지시어 bu · şu · o · burada",tags:"işaret bu şu o burası",body:
  T(["","이 (가까이)","그 / 저 (가리키며)","저 (멀리, 안 보임)"],[["지시","bu","şu","o"],["장소","burası, burada","şurası, şurada","orası, orada"],["~로","buraya","şuraya","oraya"],["~에서부터","buradan","şuradan","oradan"]])+
  P("대명사로 격이 붙을 땐 n이 끼어: bunu, şuna, ondan. 형용사처럼 명사 앞에선 안 변해: bu kitap, bu kitabı.")},
 {id:"tr-copula",cat:"verb",title:"명사문 (~이다) 인칭 어미",tags:"ek fiil -im -sin -dir",body:
  T(["","öğretmen (교사)","hasta (아픈)","과거 (-dı)"],[["ben","öğretmenim","hastayım","öğretmendim"],["sen","öğretmensin","hastasın","öğretmendin"],["o","öğretmen(dir)","hasta(dır)","öğretmendi"],["biz","öğretmeniz","hastayız","öğretmendik"],["siz","öğretmensiniz","hastasınız","öğretmendiniz"],["onlar","öğretmen(ler)(dir)","hasta(lar)(dır)","öğretmendiler"]])+
  P("모음 뒤 -ım, -ız에는 매개 자음 <b>y</b>: hastayım. 과거 -dı는 모음 뒤에서 -ydı: hastaydım. 3인칭 -dır는 말에선 보통 빼고, 일반적 사실·추측에 써.")+
  P("부정은 <b>değil</b> + 인칭: öğretmen değilim, hasta değilsin.")},
 {id:"tr-neg",cat:"verb",title:"부정 -ma / -me",tags:"olumsuz ma me değil",body:
  P("어간 바로 뒤에 <b>-ma/-me</b>: gelmek → gel-me-, yapmak → yap-ma-.")+
  T(["","긍정","부정"],[["현재 진행","geliyorum","gelmiyorum"],["과거","geldim","gelmedim"],["미래","geleceğim","gelmeyeceğim"],["geniş","gelirim","gelmem"]])+
  P("-iyor 앞에선 -me의 e가 i/ı/u/ü로 (gelmiyorum, yapmıyorum, okumuyorum).")+
  T(["geniş 부정",""],[["ben","gelmem"],["sen","gelmezsin"],["o","gelmez"],["biz","gelmeyiz"],["siz","gelmezsiniz"],["onlar","gelmezler"]])+
  P("명사문 부정은 değil, ‘없다’는 <b>yok</b> (‘있다’ var): Param yok. Evde kimse yok.")},
 {id:"tr-future",cat:"verb",title:"미래 -acak / -ecek",tags:"gelecek zaman acak ecek",body:
  T(["","gelmek","yapmak"],[["ben","geleceğim","yapacağım"],["sen","geleceksin","yapacaksın"],["o","gelecek","yapacak"],["biz","geleceğiz","yapacağız"],["siz","geleceksiniz","yapacaksınız"],["onlar","gelecekler","yapacaklar"]])+
  P("모음으로 시작하는 인칭 어미 앞에서 k → <b>ğ</b> (geleceğim, yapacağız). 모음 어간은 y가 끼어: okumak → okuyacak.")+
  P("gitmek, etmek은 t → d: gideceğim, edeceğim.")},
 {id:"tr-mis",cat:"verb",title:"전해 들은 과거 -mış",tags:"duyulan geçmiş miş öğrenilen",body:
  P("<b>-mış / -miş / -muş / -müş</b>: 직접 보지 않고 들었거나 나중에 알게 된 과거, 놀람.")+
  EX("Ali gelmiş. (알리가 왔대 / 와 있네)","Ali geldi. (알리가 왔어 — 직접 봄)","Çok güzelmiş! (진짜 예쁘네!)")+
  T(["","gelmek"],[["ben","gelmişim"],["sen","gelmişsin"],["o","gelmiş"],["biz","gelmişiz"],["siz","gelmişsiniz"],["onlar","gelmişler"]])},
 {id:"tr-question",cat:"syn",title:"의문 조사 mı / mi / mu / mü",tags:"soru eki mi mı",body:
  P("<b>띄어 쓰는</b> 별도 낱말. 바로 앞 단어 모음으로 4가지 조화: Ev mi? Okul mu? Güzel mi? Kitap mı?")+
  P("인칭 어미는 mı 쪽에 붙어: Geliyor musun? Öğrenci misiniz? 과거 -dı는 동사에 붙고 mı는 뒤에: Geldin mi?")+
  P("강조하고 싶은 말 바로 뒤에 놓아: Ali mi geldi? (알리가 온 거야?) / Ali geldi mi? (알리 왔어?)")+
  P("의문사가 있으면 mı 안 써: Ne yapıyorsun? Nerede?")},
 {id:"tr-order",cat:"syn",title:"어순 SOV · 후치사",tags:"söz dizimi edat için ile gibi",body:
  P("기본 <b>주어 - 목적어 - 동사</b>, 꾸미는 말은 늘 앞 (한국어랑 비슷). 강조하는 말은 동사 바로 앞.")+
  EX("Ben her gün kahve içerim.","Ahmet bu kitabı dün okudu.")+
  T(["후치사","뜻","예"],[["için","~를 위해","senin için"],["ile (-la/-le)","~와, ~로","arkadaşımla, otobüsle"],["gibi","~처럼","kuş gibi"],["kadar","~만큼, ~까지","akşama kadar"],["sonra (탈격 +)","~ 후에","dersten sonra"],["önce (탈격 +)","~ 전에","yemekten önce"]])+
  P("대명사 뒤 için, gibi, ile는 속격: benim için, onun gibi, (bu → bunun için).")},
 {id:"tr-ki",cat:"syn",title:"-ki (~에 있는, ~의 것)",tags:"ki aitlik",body:
  P("위치격·시간 뒤에 -ki를 붙이면 형용사처럼 ‘~에 있는’: evdeki kitap (집에 있는 책), masadaki bardak, yarınki toplantı, bugünkü gazete.")+
  P("모음조화 거의 안 따라 (늘 -ki). 예외: bugünkü, dünkü, öbürkü.")+
  P("속격 뒤에선 ‘~의 것’: benimki (내 거), Ali'ninki (알리 거).")+
  P("띄어 쓰는 접속사 ki (‘~라는 것을’)와는 다른 거야: Biliyorum ki …")}
);
/* 기존 항목 분류 */
const CAT_OF={"fr-groups":"verb","fr-pres":"verb","fr-pc":"verb","fr-impf":"verb","fr-pqp":"verb","fr-fut":"verb","fr-fa":"verb","fr-cond":"verb","fr-condp":"verb","fr-subj":"verb","fr-subjp":"verb","fr-impr":"verb","fr-ps":"verb","fr-aux":"verb","fr-spell":"verb","fr-gender":"noun","fr-adj":"adj","fr-bel":"adj","fr-plural":"noun",
 "ru-cases":"case","ru-n1":"case","ru-n2":"case","ru-n3":"case","ru-spell":"phon","ru-fleet":"phon","ru-anim":"case","ru-adj":"adj","ru-short":"adj","ru-conj":"verb","ru-alt":"verb","ru-aspect":"verb","ru-past":"verb","ru-sja":"verb","ru-phon":"phon",
 "tr-harmony":"phon","tr-soft":"phon","tr-buffer":"phon","tr-cases":"case","tr-verbs":"verb"};
[FR,RU,TR].forEach(L=>L.forEach(s=>{if(!s.cat)s.cat=CAT_OF[s.id]||"syn"}));
/* 분류 순서대로 정렬 (같은 분류 안에선 원래 순서) */
[FR,RU,TR].forEach(L=>{const ord=CATS.map(c=>c[0]);const idx=new Map(L.map((s,i)=>[s,i]));L.sort((a,b)=>ord.indexOf(a.cat)-ord.indexOf(b.cat)||idx.get(a)-idx.get(b))});

const LANGS={fr:{name:"프랑스어",list:FR},ru:{name:"러시아어",list:RU},tr:{name:"터키어",list:TR}};
function find(id){for(const k in LANGS){const s=LANGS[k].list.find(x=>x.id===id);if(s)return{lang:k,sec:s}}return null}
/* 칸/오답 → 개념 항목 */
function conceptFor(lang,kind,key,w){key=String(key||"");const t=key.split(".")[0];
  if(lang==="fr"&&kind==="conj"){const m={pres:"fr-pres",pc:"fr-pc",impf:"fr-impf",pqp:"fr-pqp",fut:"fr-fut",fa:"fr-fa",cond:"fr-cond",condp:"fr-condp",subj:"fr-subj",subjp:"fr-subjp",impr:"fr-impr",ps:"fr-ps"};
    if(w&&/être/.test(w.aux||"")&&["pc","pqp","fa","condp","subjp"].includes(t))return"fr-aux";
    if(w&&t==="pres"){const i=inf(w);if(/(cer|ger|[ou]yer|ayer|e[^aeiouyéèêëàâîïôûù]er|é[^aeiouyéèêëàâîïôûù]{1,2}er)$/.test(i))return"fr-spell"}
    return m[t]||"fr-groups"}
  if(lang==="fr"&&kind==="adj")return"fr-adj";
  if(lang==="ru"&&kind==="conj")return t==="past"?"ru-past":"ru-conj";
  if(lang==="ru"&&kind==="decl"){if(w&&w.pos==="adj")return t==="short"?"ru-short":"ru-adj";
    if(t==="acc"&&w&&w.declInfo&&/an/.test(w.declInfo.anim||""))return"ru-anim";
    const s=low(w&&w.word||"");if(/[ая]$/.test(s))return"ru-n1";if(/ь$/.test(s)&&w.declInfo&&w.declInfo.g==="f")return"ru-n3";return"ru-n2"}
  if(lang==="tr"&&kind==="conj")return"tr-verbs";
  return""}
G.GRAMMAR={LANGS,CATS,find,conceptFor};
if(typeof module!=="undefined")module.exports={LANGS,CATS,find,conceptFor};
})(typeof window!=="undefined"?window:globalThis);
