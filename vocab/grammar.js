/* 단어 구름 · 문법 개념 페이지 (v15)
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
G.GRAMMAR={LANGS,find,conceptFor};
if(typeof module!=="undefined")module.exports={LANGS,find,conceptFor};
})(typeof window!=="undefined"?window:globalThis);
