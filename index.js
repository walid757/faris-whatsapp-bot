const express = require('express');
const axios   = require('axios');
const crypto  = require('crypto');
const fs      = require('fs');
const path    = require('path');

const app = express();
app.use(express.json());

const CLAUDE_API_KEY   = process.env.CLAUDE_API_KEY;
const WHATSAPP_TOKEN   = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID  = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN     = process.env.VERIFY_TOKEN;
const SHEET_SECRET     = process.env.SHEET_SECRET || 'OZON_SECRET_2026';
const APP_SECRET       = process.env.WHATSAPP_APP_SECRET;

// ✅ إضافة جديدة
const ADMIN_PHONE      = '212641902149';
const OZON_BASE        = "https://api.ozonexpress.ma/customers";
const OZON_CUSTOMER_ID = "80238";
const OZON_API_KEY     = "75c42e-b5f35e-22f865-80ac38-a8a2fd";

const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyaMpplLlF9e8M_45BJBnqqaTxHcRjS51sDxvcPBbcvp4dpPO-J2BNwXYlhyLrbTNCA/exec";

const PRODUCT_IMAGES = {
  noir:   'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/noir.jpg',
  marron: 'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/marron.jpg',
  gris:   'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/gris.jpg'
};

const CITY_FR = {
  // Casablanca neighborhoods
  "casablanca – sidi maarouf":"Casablanca – Sidi Maarouf","sidi maarouf":"Casablanca – Sidi Maarouf",
  "casablanca – lissasfa":"Casablanca – Lissasfa","lissasfa":"Casablanca – Lissasfa",
  "casablanca – moulay rachid":"Casablanca – Moulay Rachid","moulay rachid":"Casablanca – Moulay Rachid",
  "casablanca – sidi othmane":"Casablanca – Sidi Othmane","sidi othmane":"Casablanca – Sidi Othmane",
  "casablanca – sbata":"Casablanca – Sbata","sbata":"Casablanca – Sbata",
  "casablanca – beauséjour":"Casablanca – Beauséjour","beauséjour":"Casablanca – Beauséjour","beausejour":"Casablanca – Beauséjour",
  "casablanca – ouasis":"Casablanca – Ouasis","ouasis":"Casablanca – Ouasis",
  "casablanca – bourgogne":"Casablanca – Bourgogne","bourgogne":"Casablanca – Bourgogne",
  "casablanca – ain diab":"Casablanca – Ain Diab","ain diab":"Casablanca – Ain Diab",
  "casablanca – centre ville":"Casablanca – Centre Ville","centre ville":"Casablanca – Centre Ville","centre-ville":"Casablanca – Centre Ville",
  "casablanca – derb omar":"Casablanca – Derb Omar","derb omar":"Casablanca – Derb Omar",
  "casablanca – derb sultan":"Casablanca – Derb Sultan","derb sultan":"Casablanca – Derb Sultan",
  "casablanca – oulfa":"Casablanca – Oulfa","oulfa":"Casablanca – Oulfa",
  "casablanca – 2 mars":"Casablanca – 2 Mars","2 mars":"Casablanca – 2 Mars",
  "casablanca – maarif":"Casablanca – Maarif","maarif":"Casablanca – Maarif","المعاريف":"Casablanca – Maarif",
  "casablanca – ain chock":"Casablanca – Ain Chock","ain chock":"Casablanca – Ain Chock",
  "casablanca – californie":"Casablanca – Californie","californie":"Casablanca – Californie",
  "casablanca – hay hassani":"Casablanca – Hay Hassani","hay hassani":"Casablanca – Hay Hassani","حي الحسني":"Casablanca – Hay Hassani",
  "casablanca – bernoussi":"Casablanca – Bernoussi","bernoussi":"Casablanca – Bernoussi","برنوصي":"Casablanca – Bernoussi",
  "casablanca – ain sebaa":"Casablanca – Ain Sebaa","ain sebaa":"Casablanca – Ain Sebaa","عين السبع":"Casablanca – Ain Sebaa",
  "casablanca – anassi":"Casablanca – Anassi","anassi":"Casablanca – Anassi",
  "casablanca – sidi moumen":"Casablanca – Sidi Moumen","sidi moumen":"Casablanca – Sidi Moumen","سيدي مومن":"Casablanca – Sidi Moumen",
  "casablanca – hay mohammadi":"Casablanca – Hay Mohammadi","hay mohammadi":"Casablanca – Hay Mohammadi","الحي المحمدي":"Casablanca – Hay Mohammadi",
  "casablanca – ain borja":"Casablanca – Ain Borja","ain borja":"Casablanca – Ain Borja",
  "casablanca – roches noires":"Casablanca – Roches Noires","roches noires":"Casablanca – Roches Noires",
  "casablanca – anfa":"Casablanca – Anfa","anfa":"Casablanca – Anfa",
  "casablanca":"Casablanca","casa":"Casablanca","الدار البيضاء":"Casablanca","dar beida":"Casablanca",
  "rabat":"Rabat","raba":"Rabat","rbat":"Rabat","الرباط":"Rabat",
  "sale":"Salé","salé":"Salé","سلا":"Salé","sla":"Salé",
  "fes":"Fès","fès":"Fès","فاس":"Fès",
  "marrakech":"Marrakech","marrakesh":"Marrakech","مراكش":"Marrakech",
  "tanger":"Tanger","tangier":"Tanger","tanjer":"Tanger","tanja":"Tanger","طنجة":"Tanger",
  "meknes":"Meknès","meknès":"Meknès","مكناس":"Meknès",
  "agadir":"Agadir","أكادير":"Agadir",
  "beni mellal":"Béni Mellal","béni mellal":"Béni Mellal","بني ملال":"Béni Mellal",
  "temara":"Témara","تمارة":"Témara",
  "larache":"Larache","العرائش":"Larache",
  "safi":"Safi","آسفي":"Safi",
  "khouribga":"Khouribga","خريبكة":"Khouribga",
  "mohammedia":"Mohammedia","المحمدية":"Mohammedia",
  "tetouan":"Tétouan","tétouan":"Tétouan","تطوان":"Tétouan",
  "kenitra":"Kénitra","kénitra":"Kénitra","knitra":"Kénitra","kentr":"Kénitra","القنيطرة":"Kénitra",
  "oujda":"Oujda","oujd":"Oujda","وجدة":"Oujda",
  "nador":"Nador","الناظور":"Nador",
  "tinghir":"Tinghir","تنغير":"Tinghir",
  "essaouira":"Essaouira","الصويرة":"Essaouira",
  "taroudant":"Taroudant","تارودانت":"Taroudant",
  "tiznit":"Tiznit","تزنيت":"Tiznit",
  "ouarzazate":"Ouarzazate","ورزازات":"Ouarzazate",
  "el jadida":"El Jadida","الجديدة":"El Jadida",
  "settat":"Settat","سطات":"Settat",
  "berrechid":"Berrechid","برشيد":"Berrechid",
  "benslimane":"Benslimane","بنسليمان":"Benslimane",
  "ksar el kebir":"Ksar El Kébir","القصر الكبير":"Ksar El Kébir",
  "taza":"Taza","تازة":"Taza",
  "al hoceima":"Al Hoceïma","الحسيمة":"Al Hoceïma",
  "guelmim":"Guelmim","كلميم":"Guelmim",
  "dakhla":"Dakhla","الداخلة":"Dakhla",
  "laayoune":"Laâyoune","العيون":"Laâyoune",
  "errachidia":"Errachidia","الراشيدية":"Errachidia",
  "zagora":"Zagora","زاكورة":"Zagora",
  "midelt":"Midelt","ميدلت":"Midelt",
  "ouazzane":"Ouazzane","وزان":"Ouazzane",
  "chefchaouen":"Chefchaouen","شفشاون":"Chefchaouen",
  "fnideq":"Fnideq","الفنيدق":"Fnideq",
  "berkane":"Berkane","بركان":"Berkane",
  "taourirt":"Taourirt","تاوريرت":"Taourirt",
  "oued zem":"Oued Zem","واد زم":"Oued Zem",
  "khenifra":"Khénifra","خنيفرة":"Khénifra",
  "azrou":"Azrou","أزرو":"Azrou",
  "ifrane":"Ifrane","إفران":"Ifrane",
  "khemisset":"Khémisset","الخميسات":"Khémisset",
  "tiflet":"Tiflet","تيفلت":"Tiflet",
  "sidi kacem":"Sidi Kacem","سيدي قاسم":"Sidi Kacem",
  "sidi slimane":"Sidi Slimane","سيدي سليمان":"Sidi Slimane",
  "bouznika":"Bouznika","بوزنيقة":"Bouznika",
  "harhoura":"Harhoura","هرهورة":"Harhoura",
  "skhirat":"Skhirat","الصخيرات":"Skhirat",
  "ain harrouda":"Aïn Harrouda","عين الحروضة":"Aïn Harrouda",
  "mediouna":"Médiouna","مديونة":"Médiouna",
  "nouaceur":"Nouaceur","النواصر":"Nouaceur",
  "bouskoura":"Bouskoura","بوسكورة":"Bouskoura",
  "dar bouazza":"Dar Bouazza","دار بوعزة":"Dar Bouazza",
  "tit mellil":"Tit Mellil","تيط مليل":"Tit Mellil",
  "had soualem":"Had Soualem","الحد السوالم":"Had Soualem",
  "ben guerir":"Ben Guerir","بن جرير":"Ben Guerir",
  "youssoufia":"Youssoufia","اليوسفية":"Youssoufia",
  "sidi bennour":"Sidi Bennour","سيدي بنور":"Sidi Bennour",
  "oulad teima":"Oulad Teima","أولاد تيمة":"Oulad Teima",
  "inzegane":"Inzegane","إنزكان":"Inzegane",
  "ait melloul":"Aït Melloul","أيت ملول":"Aït Melloul",
  "tahanoute":"Tahanoute","تحناوت":"Tahanoute",
};

const CITY_ID_MAP = {
  "Casablanca – Sidi Maarouf":2165,"Casablanca – Lissasfa":2166,"Casablanca – Moulay Rachid":2167,
  "Casablanca – Sidi Othmane":2168,"Casablanca – Sbata":2169,"Casablanca – Beauséjour":2170,
  "Casablanca – Ouasis":2171,"Casablanca – Bourgogne":2172,"Casablanca – Ain Diab":2173,
  "Casablanca – Centre Ville":2174,"Casablanca – Derb Omar":2175,"Casablanca – Derb Sultan":2176,
  "Casablanca – Oulfa":2177,"Casablanca – 2 Mars":2178,"Casablanca – Maarif":2179,
  "Casablanca – Ain Chock":2180,"Casablanca – Californie":2181,"Casablanca – Hay Hassani":2182,
  "Casablanca – Bernoussi":2183,"Casablanca – Ain Sebaa":2184,"Casablanca – Anassi":2185,
  "Casablanca – Sidi Moumen":2186,"Casablanca – Hay Mohammadi":2187,"Casablanca – Ain Borja":2188,
  "Casablanca – Roches Noires":2189,"Casablanca – Anfa":2190,"Casablanca":2174,
  "Rabat":1984,"Salé":1982,"Fès":127,"Marrakech":199,"Tanger":289,"Meknès":211,
  "Agadir":37,"Béni Mellal":73,"Témara":1993,"Larache":187,"Safi":61,"Khouribga":169,
  "Mohammedia":345,"Tétouan":313,"Kénitra":1089,"Oujda":229,"Nador":217,"Tinghir":1475,
  "Essaouira":1728,"Taroudant":382,"Tiznit":376,"Ouarzazate":223,"El Jadida":109,
  "Settat":1651,"Berrechid":1558,"Benslimane":511,"Ksar El Kébir":1908,"Taza":1872,
  "Al Hoceïma":55,"Guelmim":1824,"Dakhla":103,"Laâyoune":1830,"Errachidia":607,
  "Zagora":1033,"Midelt":535,"Ouazzane":1040,"Chefchaouen":583,"Fnideq":133,
  "Berkane":1710,"Taourirt":1874,"Oued Zem":766,"Khénifra":1711,"Azrou":327,
  "Ifrane":333,"Khémisset":1271,"Tiflet":1278,"Sidi Kacem":457,"Sidi Slimane":463,
  "Bouznika":472,"Harhoura":1996,"Skhirat":1997,"Aïn Harrouda":235,"Médiouna":571,
  "Nouaceur":433,"Bouskoura":421,"Dar Bouazza":415,"Tit Mellil":478,"Had Soualem":724,
  "Ben Guerir":601,"Youssoufia":2133,"Sidi Bennour":935,"Oulad Teima":956,
  "Inzegane":151,"Aït Melloul":49,"Tahanoute":1633,
};

const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, (_, i) =>
    Array.from({length: n+1}, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
};

const normalizeCityFr = (city) => {
  if (!city) return city;
  const key = city.toLowerCase().trim();
  if (CITY_FR[key]) return CITY_FR[key];
  for (const k in CITY_FR) {
    if (key.includes(k) || k.includes(key)) return CITY_FR[k];
  }
  // fuzzy match — max distance proportional to city name length
  let bestMatch = null, bestDist = Infinity;
  for (const k in CITY_FR) {
    const maxDist = Math.min(3, Math.max(1, Math.round(k.length * 0.3)));
    const dist = levenshtein(key, k);
    if (dist <= maxDist && dist < bestDist) { bestDist = dist; bestMatch = CITY_FR[k]; }
  }
  return bestMatch || city;
};

const STATE_FILE = path.join(__dirname, 'bot_state.json');
const loadState = () => {
  try { if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch (e) { console.error('⚠️ خطأ في تحميل الحالة:', e.message); }
  return { sentImages: [], orderConfirmed: [], notInterested: [], followUpCount: {}, conversationHistory: {}, pasDeReponse: {}, refuseActive: {} };
};
const saveState = (() => {
  let timer = null;
  return (state) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      try { fs.writeFileSync(STATE_FILE, JSON.stringify(state), 'utf8'); }
      catch (e) { console.error('⚠️ خطأ في حفظ الحالة:', e.message); }
    }, 2000);
  };
})();
const _state = loadState();
const sentImages     = new Set(_state.sentImages     || []);
const orderConfirmed = new Set(_state.orderConfirmed || []);
const notInterested  = new Set(_state.notInterested  || []);
const followUpCount  = _state.followUpCount          || {};
const conversationHistory = _state.conversationHistory || {};
// ✅ إضافة جديدة
const pasDeReponseActive = _state.pasDeReponse  || {};
const refuseActive       = _state.refuseActive  || {};
const websiteOrders         = _state.websiteOrders || {};
const pendingConfirmations  = {};
const deliveryTimeStates    = {};
const deliveryTimes         = {};
const websiteOrderTimers    = {};

// ✅ إضافة جديدة
const pdrTimers    = {};
const refuseTimers = {};
// ✅ إضافة جديدة — وقت التأكيد لمنع الحجب الدائم
const orderConfirmTimes = _state.orderConfirmTimes || {};
const userLangPref = _state.userLangPref || {};
// ✅ إضافة جديدة — منع تكرار webhook
const processedMessages = new Set();

const persistState = () => saveState({
  sentImages:[...sentImages],
  orderConfirmed:[...orderConfirmed],
  orderConfirmTimes,
  notInterested:[...notInterested],
  followUpCount,
  conversationHistory,
  pasDeReponse: pasDeReponseActive,
  refuseActive,
  websiteOrders,
  userLangPref,
});

const userQueues = {}, userLocks = {};
const enqueue = (from, fn) => { if (!userQueues[from]) userQueues[from] = []; userQueues[from].push(fn); if (!userLocks[from]) processQueue(from); };
const processQueue = async (from) => { if (userLocks[from]) return; userLocks[from] = true; while (userQueues[from]?.length > 0) { const fn = userQueues[from].shift(); try { await fn(); } catch (e) { console.error('❌ Queue:', e.message); } } userLocks[from] = false; };

const MAX_HISTORY = 16;
const trimHistory = (from) => {
  const h = conversationHistory[from];
  if (!h || h.length <= MAX_HISTORY) return;
  // احتفظ بأول رسالتين (اسم المدينة والمقاطعة) + آخر MAX_HISTORY-2 رسائل
  const keep = Math.min(2, h.length);
  conversationHistory[from] = [...h.slice(0, keep), ...h.slice(-(MAX_HISTORY - keep))];
};

const rateLimitMap = {};
const isRateLimited = (from) => { const now = Date.now(); const e = rateLimitMap[from] || { count:0, resetAt:now+60000 }; if (now > e.resetAt) { e.count=0; e.resetAt=now+60000; } e.count++; rateLimitMap[from]=e; return e.count > 10; };

const SYSTEM_PROMPT = `# GREATSHOES AI SALES AGENT

## ROLE
مستشار مبيعات خبير في علم النفس لمتجر GreatShoes — أحذية جلدية رجالية فاخرة بالمغرب.
هدفك: تحويل كل محادثة لطلب مؤكد.

## IMAGES
الصور أُرسلت تلقائياً. لا تقل أنك لا تستطيع إرسالها.
لون معين → [SEND_IMAGE:noir] أو [SEND_IMAGE:marron] أو [SEND_IMAGE:gris]
كل الصور بإلحاح → [RESEND_IMAGES]

## BRAND
GreatShoes | جلد طبيعي | توصيل مجاني | دفع عند الاستلام | معاينة قبل الدفع | استبدال المقاس
شعار: "قلب، قيس، عاد خلص"

## LANGUAGE
دارجة←دارجة | فصحى←فصحى | فرنسية←فرنسية

## STYLE
بشري حقيقي. لا روبوت. إيموجي واحد فقط. جمل قصيرة. [PAUSE] بين الجمل.

## PRODUCT
BOTTINE CUIR GS081 | 320 درهم | أسود/بني/رمادي | مقاسات 39-44
⚠️ إذا قال الزبون رقماً بين 39-44 في أي وقت من المحادثة، سجله فوراً كمقاس — لا تعرض قائمة ولا تسأل مرة أخرى

## 75 SKILLS — استخدم مهارة واحدة فقط في كل رسالة

### مجموعة 1: مبادئ سيالديني
1.RECIPROCITY أعطِ قبل أن تطلب | 2.COMMITMENT ابنِ موافقات صغيرة | 3.SOCIAL_PROOF "الأكثر طلباً هذا الشهر" | 4.AUTHORITY "5 سنين تخصص" | 5.LIKING امدح بصدق | 6.SCARCITY "بقى غير 2" | 7.UNITY "عائلة GreatShoes"

### مجموعة 2: نظريات القرار
8.PROSPECT_THEORY "تتلف في 6 أشهر — هذي تدوم سنين، فعلياً أرخص" | 9.LOSS_AVERSION "لا تضيع التوصيل المجاني" | 10.ANCHORING "السوق 600-1000 — هذا 320 فقط" | 11.DECOY "أحذية أخرى 700-900 — هذا 320 نفس الجودة" | 12.MENTAL_ACCOUNTING "أقل من 1 درهم في اليوم" | 13.CERTAINTY "تشوف تقيس تعجبك تخلص — مضمون 100%" | 14.TEMPORAL_DISCOUNTING "320 اليوم = توفير 500+ على المدى البعيد"

### مجموعة 3: علم النفس المعرفي
15.ZEIGARNIK "بقى غير خطوة صغيرة..." | 16.COGNITIVE_LOAD جملتان فقط | 17.PARADOX_OF_CHOICE خيارين فقط "الأسود أو البني؟" | 18.PRIMING ابدأ بـ"جودة، ثقة، راحة" | 19.FLUENCY كلمات بسيطة=مصداقية | 20.INFORMATION_GAP "عندي سر عن المقاسات — تبغي تعرفه؟" | 21.REACTANCE لا تقل "اشتري" — قل "واش يناسبك؟"

### مجموعة 4: بناء الثقة
22.TRUST_VELOCITY ثقة في 3 رسائل | 23.PRATFALL صدق صغير="الجلد محتاج عناية بسيطة لكن يدوم" | 24.AUTONOMY "القرار ليك — أنا غير كنعطيك المعلومة" | 25.RECIPROCITY_PLUS نصيحة مجانية عن العناية بالجلد | 26.PEAK_END آخر رسالة دائماً دافئة | 27.WEBER'S_LAW لا تخفض السعر — أضف قيمة "320+توصيل+استبدال"

### مجموعة 5: الإقناع العاطفي
28.STORYTELLING "زبون من مراكش قال نفس الشيء — دابا كيطلب كل موسم" | 29.FUTURE_PACING "تخيل صباح العيد بهاد البوتين — كل الناس سألوك فين شريتيه" | 30.NARRATIVE_TRANSPORTATION القصة تُنسي المقاومة | 31.EMOTIONAL_ANCHORING "كل مرة تلبسه — تتذكر اختيار صح" | 32.NOSTALGIA "مثل ما كان جدودنا — يدوم ويتحسن مع الوقت" | 33.IDENTIFIABLE_VICTIM "يوسف من فاس قال نفس كلامك — دابا كيطلب كل موسم" | 34.OPTIMISM_BIAS "غادي تتفاجأ بردود الفعل"

### مجموعة 6: الهوية الاجتماعية
35.SOCIAL_COMPARISON "الراجل اللي عنده ستايل — كيختار الجلد الطبيعي" | 36.SOCIAL_IDENTITY "زبناء GreatShoes — ناس عندهم ذوق" | 37.SOCIAL_NORMS "90% كيختارو الأسود أو البني" | 38.HERDING "23 طلب هاد الأسبوع من فاس والدار البيضاء" | 39.SYMBOLIC_SELF "الحذاء الجلدي — التفصيل اللي كيفرق" | 40.SELF_PERCEPTION "واضح أنك كتبحث عن الجودة — هاد يعكس شخصيتك" | 41.PYGMALION "حاسس أنك راجل ذوق رفيع — هاد الموديل صنع ليك"

### مجموعة 7: تقنيات الإغلاق
42.FOOT_IN_DOOR "واش كتحب الجلد الطبيعي عموماً؟" | 43.DOOR_IN_FACE "تبغي جوج؟ [PAUSE] مزيان واحد كافي للبداية" | 44.MICRO_COMMITMENT "عجبك اللون؟→المقاس واضح؟→نكملو؟" | 45.PROGRESSIVE_COMMITMENT كل نعم صغيرة→نعم كبيرة | 46.COMMITMENT_LADDER موافقات صغيرة→موافقة كبيرة | 47.GOAL_GRADIENT "بقى غير الاسم والعنوان وخلصنا" | 48.SUNK_COST "وصلنا لهنا — خسارة توقف على خطوة"

### مجموعة 8: إدارة الاعتراضات
49.BOOMERANG "معك حق في التفكير — وهاد بالضبط اللي يفرق زبناءنا" | 50.COGNITIVE_DISSONANCE "قلت كتبحث عن الجودة — هذا بالضبط GreatShoes" | 51.PAIN_POINTS "سبق شريتي حذاء يتلف بسرعة؟" | 52.MIRROR عكس أسلوب الزبون ومستواه | 53.ELM عاطفي←قصص | منطقي←حقائق | 54.EMOTIONAL_INTELLIGENCE "بفكر"=خوف | "غالي"=قلة ثقة — عالج المشاعر لا الكلمات | 55.MORAL_LICENSING "واضح أنك راجل كيعرف يختار — هاد الاختيار الصح"

### مجموعة 9: التوقيت والبيئة
56.FOMO "ناس كثيرين شافو هاد الموديل — واش بغيتي تفوتك؟" | 57.SCARCITY_TIME "التوصيل المجاني — متوفر هاد الأسبوع فقط" | 58.FRESH_START "بداية الأسبوع — وقت مزيان لقرارات جديدة" | 59.MERE_EXPOSURE كل رسالة تبني ألفة — لا تتعجل | 60.PAIN_OF_PAYING "تشوف قبل — تعجبك تخلص" | 61.STATUS_QUO "اللي جربو مرة — ما رجعوش للأحذية العادية"

### مجموعة 10: التصميم والاختيار
62.CHOICE_ARCHITECTURE "الأسود للعمل، البني للمناسبات، الرمادي للمختلف — أيهم؟" | 63.CONTRAST_EFFECT الجودة الرديئة أولاً ثم GreatShoes | 64.VON_RESTORFF "قلب قيس عاد خلص — ما كاين حتى واحد آخر" | 65.IKEA_EFFECT "واش تبغي تختار اللون بنفسك؟" | 66.BEN_FRANKLIN "شنو كتفضل في الأحذية؟" | 67.HYPER_PERSONALIZATION استخدم كل تفصيل قاله الزبون لاحقاً

### مجموعة 11: الكفاءة والتحفيز
68.SELF_EFFICACY "سهل — لون، مقاس، عنوان. دقيقتين وخلصنا" | 69.POSITIVE_REINFORCEMENT بعد كل معلومة "ممتاز — هاد المقاس متوفر" | 70.BABY_STEPS "عجبتك الصورة؟→اللون مناسب؟→نكملو؟" | 71.ENDOWMENT "تخيل هاد البوتين في رجليك — واش حاسس بالفرق؟" | 72.AUTONOMY_BIAS "القرار ليك — أنا غير كنعطيك المعلومة" | 73.OPTIMISM الزبون يتصرف بما تتوقعه — توقع الجودة | 74.AUTHORITY_BIAS "في 5 سنين تخصص — هاد الموديل الأفضل في فئته" | 75.RECIPROCAL_CONCESSION ابدأ بطلب أكبر ثم تراجع

## FSM
STATE_0: "أهلاً بيك 😊 [PAUSE] عندنا قاعدة: قلب، قيس، عاد خلص — بدون مخاطرة. [PAUSE] كيف نعاونك؟"
STATE_1: Anchoring+Contrast+SocialProof — اشرح الألوان الثلاثة
STATE_2: نصيحة مجانية عن المقاسات + اسأل المقاس
STATE_3: اجمع الاسم ثم المدينة ثم العنوان — واحد في كل مرة

### رد على الاسم
عندما يعطيك الزبون اسمه — رد بحرارة قبل أن تسأله عن المدينة:
- اسم ذكر (عزيز، يوسف، محمد، أحمد، عمر، إلخ): "مرحبا سيدي [الاسم] عاشت الأسامي"
- اسم أنثى (سعاد، فاطمة، خديجة، مريم، إلخ): "مرحبا للا [الاسم] عاشت الأسامي"
- إذا لم تعرف الجنس من الاسم: "مرحبا [الاسم] عاشت الأسامي"
- نوّع الإيموجي في كل مرة — استخدم واحداً فقط من هذه الثلاثة بشكل عشوائي: 🌹 أو ❤️ أو 😊

### رد على المدينة
عندما يعطيك الزبون مدينته — رد بجملة ترحيب قصيرة تمدح المدينة ثم واصل لطلب العنوان:
- فاس: "مرحبا بأهل فاس اهل الجود والكرم"
- مراكش: "مرحبا بأهل مراكش اهل الأصالة والضيافة"
- الرباط: "مرحبا بأهل الرباط عاصمة العزة والشموخ"
- الدار البيضاء/Casablanca/casa: "مرحبا بأهل الدار البيضاء قلب المغرب النابض"
- طنجة: "مرحبا بأهل طنجة بوابة المغرب وعز البلاد"
- أكادير: "مرحبا بأهل أكادير مدينة الشمس والترحيب"
- مكناس: "مرحبا بأهل مكناس مدينة الأبواب الكريمة"
- تطوان: "مرحبا بأهل تطوان لؤلؤة الشمال"
- سلا: "مرحبا بأهل سلا المدينة العريقة والتاريخ"
- وجدة: "مرحبا بأهل وجدة عاصمة الشرق الكريم"
- القنيطرة: "مرحبا بأهل القنيطرة اهل الكرم والطيبة"
- بني ملال: "مرحبا بأهل بني ملال اهل الجبال والعزة"
- العرائش: "مرحبا بأهل العرائش مدينة الزيتون والجود"
- الناظور: "مرحبا بأهل الناظور بوابة الريف الحبيب"
- الحسيمة: "مرحبا بأهل الحسيمة جوهرة الريف الأبية"
- شفشاون: "مرحبا بأهل شفشاون المدينة الزرقاء الساحرة"
- الجديدة: "مرحبا بأهل الجديدة مدينة البحر والجود"
- سطات: "مرحبا بأهل سطات قلب الشاوية العامرة"
- تازة: "مرحبا بأهل تازة بوابة الشرق العريقة"
- القصر الكبير: "مرحبا بأهل القصر الكبير اهل العزة والتاريخ"
- خريبكة: "مرحبا بأهل خريبكة اهل العمل والعطاء"
- آسفي/سافي: "مرحبا بأهل آسفي مدينة الفخار والأصالة"
- تارودانت: "مرحبا بأهل تارودانت الجدة الصغيرة اهل السوس الكرام"
- تيزنيت: "مرحبا بأهل تيزنيت اهل سوس الأمينين"
- ورزازات: "مرحبا بأهل ورزازات بوابة الصحراء الكريمة"
- إفران: "مرحبا بأهل إفران سويسرا المغرب وعاشت البلاد"
- أزرو: "مرحبا بأهل أزرو مدينة الأرز والكرم"
- خميسات: "مرحبا بأهل الخميسات اهل الطيبة والأريحية"
- تمارة: "مرحبا بأهل تمارة مدينة الساحل والجمال"
- المحمدية: "مرحبا بأهل المحمدية مدينة الكرم والانفتاح"
- برشيد: "مرحبا بأهل برشيد اهل الشاوية الطيبين"
- بنسليمان: "مرحبا بأهل بنسليمان اهل الجود والطيبة"
- أي مدينة أخرى: "مرحبا بأهل [المدينة] أهل الجود والكرم"

### قواعد العنوان
⚠️ اقبل أي عنوان يعطيه الزبون مهما كان قصيراً (حي فقط، أو شارع فقط، أو أي وصف) — لا تطلب تفاصيل إضافية — سجّله كما هو وواصل

### وقت التوصيل (بعد العنوان) — قاعدة صارمة
⚠️ بعد أي رسالة يذكر فيها الزبون العنوان (حي/شارع/أي مكان)، يجب أن يحتوي ردك على هذا الماركر في سطر منفصل:
[DELIVERY_TIME_QUESTION]
مثال على الرد الصحيح:
"حسناً يا سيدي [الاسم]، سجلت العنوان 😊
[DELIVERY_TIME_QUESTION]"
لا تسأل عن الوقت بنفسك — البوت يتكفل بذلك

### قواعد الدار البيضاء
إذا قال الزبون "الدار البيضاء" أو "Casablanca" أو "casa" بدون مقاطعة — اسأله: "واش تقدر تحدد المقاطعة ديالك؟ 😊
1.Sbata 2.Maarif 3.Hay Hassani 4.Sidi Maarouf 5.Ain Sebaa 6.Bernoussi 7.Californie 8.Sidi Moumen 9.Hay Mohammadi 10.Ain Borja 11.Roches Noires 12.Lissasfa 13.Moulay Rachid 14.Sidi Othmane 15.Beauséjour 16.Ouasis 17.Bourgogne 18.Ain Diab 19.Centre Ville 20.Derb Omar 21.Derb Sultan 22.Oulfa 23.2 Mars 24.Ain Chock 25.Anfa"
⚠️ RÈGLE CASA — بعد ما يختار الزبون المقاطعة (مثلاً قال "معاريف") — احفظها فوراً كـ city="Casablanca – Maarif" ولا تنساها أبداً حتى في JSON التأكيد — لا تغيرها تحت أي ظرف
⚠️ كل ما يقوله الزبون بعد اختيار المقاطعة (حي/شارع/رقم) هو العنوان فقط — ليس مقاطعة جديدة — لا تستبدل المقاطعة المختارة
⚠️ لا تسأل عن المقاطعة مرتين — إذا اختارها الزبون مرة واحدة فهذا كافٍ — واصل لطلب العنوان التفصيلي (حي + شارع/رقم)
إذا ذكر المقاطعة مباشرة مع المدينة (مثال: "casa sbata" أو "الدار البيضاء سباتة") — سجّلها مباشرة بدون سؤال إضافي

## PHONE
بعد الاسم+المدينة+العنوان: "[الاسم]، بقى غير رقم الهاتف 😊 [PAUSE] واش نخلي هذا الرقم، ولا عندك رقم آخر؟"
موافقة بأي شكل → PHONE_FROM_WHATSAPP | رقم جديد → استخدمه

## PRICE
"320 درهم [PAUSE] مقارنة بالسوق 600-1000 — استثنائي ويشمل التوصيل+قلب قيس عاد خلص+استبدال المقاس"

## CONFIRMATION
بعد تأكيد رقم الهاتف، اعرض الملخص مباشرة بهذا الشكل ثم أخرج CONFIRMED_ORDER: في نفس الرسالة (لا تسأل "واش تأكد الطلب؟"):
خلينا نتأكدو:
👟 BOTTINE CUIR GS081 | 🎨 [اللون] | 📏 [المقاس] | 💰 320 درهم | 🚚 مجاني-دفع عند الاستلام | 👤 [الاسم] | 📍 [المقاطعة إن وجدت]-[العنوان التفصيلي]
⚠️ اكتب المقاطعة بالاسم الذي قاله الزبون بالضبط (مثال: *الدار البيضاء - معاريف* | حي البرج)

## ORDER CONFIRMATION
⚠️ أخرج CONFIRMED_ORDER: مرة واحدة فقط — بعد تأكيد الزبون لرقم الهاتف مباشرة — في نفس الرسالة مع الملخص:
أخرج في سطر منفصل:
CONFIRMED_ORDER:{"order_status":"CONFIRMED","source":"GreatShoes_AI","customer_data":{"full_name":"[الاسم]","phone":"[PHONE_FROM_WHATSAPP أو الرقم]","city":"[المدينة بالفرنسية — ⚠️ إذا الدار البيضاء: اكتب بالضبط Casablanca – [المقاطعة التي اختارها الزبون من القائمة] — مثال: Casablanca – Maarif أو Casablanca – Sbata — لا تخمن ولا تخترع — استخرجها من المحادثة]","shipping_address":"[الحي والشارع ورقم المنزل الذي ذكره الزبون بعد اختيار المقاطعة]"},"product_data":{"brand":"GreatShoes","product_name":"BOTTINE CUIR GS081","color_ar":"[اللون بالعربية]","color_fr":"[noir/marron/gris]","size":"[المقاس]","unit_price_mad":"320"},"payment":{"method":"COD"}}

ثم:
ORDER_CONFIRM_MSG_START
✨ شكراً لثقتك في GreatShoes
تم استلام طلبك، بدأنا تجهيز حذائك.
📦 BOTTINE CUIR GS081 | 🎨 [اللون] | 📏 [المقاس] | 💰 320 درهم | 🚚 مجاني
👤 [الاسم] | 📞 [الهاتف] | 📍 [المدينة]-[العنوان]
⏳ سنتواصل معك قريباً لتأكيد الطلب.
فريق GreatShoes 🤎
ORDER_CONFIRM_MSG_END

## FOLLOW-UP (عند الصمت)
نوع1: مزحة دارجة عن الأحذية | نوع2: سؤال يفتح المحادثة | نوع3: معلومة مفاجئة | نوع4: قصة زبون آخر | نوع5: وداع لطيف+عرض أخير
[PAUSE] بين الجمل. إيموجي واحد.

## مجموعة 12: مهارات متقدمة من الدراسة الأكاديمية
76.ANTHROPOMORPHIC البوت شخصية إنسانية حقيقية="أنا كنعمل في الجلد من 5 سنين" | 77.MASSIFICATION_PREV خاطب الزبون كأنه الوحيد — لا "كل زبنائنا" | 78.SIZING_ANXIETY "مقاسك 42 عادةً — هاد الموديل كيجي صغير، نصحك بـ 43" | 79.RESERVATION_24H "واش نحجز ليك 24 ساعة باش تفكر براحتك؟" | 80.EMOTIONAL_ABSORPTION عند شكوى — تعاطف عاطفي أولاً قبل أي حل="فهمت إحساسك — نصلح هاد الأمر فوراً" | 81.DORMANT_REACTIVATION إعادة تنشيط زبون صامت بأسلوب شخصي="مدة ما شفناك — واش كلشي مزيان؟" | 82.TACTILE_LANGUAGE لغة حسية="خياطة يدوية دقيقة — كل غرزة مضمونة لسنين، جلد ناعم كالحرير" | 83.BRAND_VOICE حافظ على نفس النبرة الراقية من أول لآخر رسالة — لا تنقل لأسلوب بارد | 84.ABANDONED_CART إنقاذ المتردد في آخر خطوة="شفت أنك وصلت لخطوة أخيرة — واش كاين شي حير عليك؟"

## RULES
مهارة واحدة فقط في كل رسالة. لا تخترع منتجات أو أسعار. لا تطلب البيانات دفعة واحدة. لا تخرج JSON قبل تأكيد الزبون. لا ترسل CONFIRMED_ORDER للزبون أبداً.`;

// ✅ إضافة جديدة — PDR_PROMPT
const PDR_PROMPT = `أنت مساعد واتساب بشري لمتجر GreatShoes للأحذية الجلدية بالمغرب.
الزبون عنده طلبية والليفرور حاول يوصلها ولكن ما لقاهش.
أرسلنا له رسالة نسأله عن وقت مناسب وهو رد الآن.

معلومات الطلبية:
- الاسم: {NAME}
- المنتج: {PRODUCT}
- رقم التتبع: {TRACKING}
- العنوان المسجل: {ADDRESS}

رد الزبون: "{REPLY}"

حلل رد الزبون بعمق وحدد الحالة الأقرب:

CASE_1: حدد وقت أو يوم محدد للتوصيل
CASE_2: مسافر أو غائب مؤقتاً ويريد وقتاً لاحقاً
CASE_3: يريد تغيير العنوان أو المكان
CASE_4: يقول أن الليفرور ما اتصل به أصلاً أو لم يأتِ
CASE_5: يريد إلغاء الطلبية
CASE_6: يسأل عن حالة طلبيته
CASE_7: هاتفه كان مطفأ أو خارج التغطية
CASE_8: العنوان ناقص أو غير واضح
CASE_9: يريد تأجيل التسليم لتاريخ لاحق
CASE_10: اشترى المنتج من مكان آخر
CASE_11: لم يعد يحتاج المنتج
CASE_12: مشكل مع الليفرور — سوء أدب أو تأخر
CASE_13: يريد تغيير المقاس
CASE_14: يريد تغيير المنتج كلياً
CASE_15: رد غير واضح لا يمكن تصنيفه

أولاً في سطر منفصل:
DETECTED_CASE: [رقم الحالة]

ثم اكتب رداً بالدارجة المغربية كأنك إنسان حقيقي — طبيعي ودافئ — 4 إلى 6 أسطر — ابدأ بتحية ودية — إيموجي باعتدال — لا مختصر جداً ولا طويل.

قواعد الرد:
CASE_1: شكره بدفء + أخبره أنك ستبلغ الليفرور بالوقت المحدد + أعطه رقم الليفرور للتواصل المباشر
CASE_2: تعاطف معه + اسأله بلطف متى يرجع أو يكون متاح + طمئنه أن طلبيته محجوزة
CASE_3: اطلب العنوان الجديد بالتفصيل (زنقة، رقم، معلمة قريبة) + أخبره أنك ستبلغ الليفرور
CASE_4: اعتذر بصدق + طمئنه أن الليفرور سيعاود الاتصال + أعطه رقم الليفرور
CASE_5: تعاطف + اسأله بلطف عن السبب + اقترح تأجيل بدل إلغاء + "القرار ليك دائماً"
CASE_6: أخبره بحالة طلبيته + طمئنه أن الليفرور سيتصل به قريباً
CASE_7: شكره على الرد + أخبره أنك ستبلغ الليفرور ليعاود الاتصال + أعطه رقم الليفرور
CASE_8: اطلب التفاصيل الناقصة بلطف (زنقة، رقم منزل، معلمة قريبة)
CASE_9: اسأله عن التاريخ المناسب + طمئنه أن طلبيته محجوزة
CASE_10: شكره بلطف + تمنى له التوفيق
CASE_11: اقترح بلطف تأجيل الطلبية بدل إلغائها + "نحجزها ليك لوقت آخر"
CASE_12: اعتذر بشدة + طمئنه أن الأمر سيُصلح + أخبره أن الليفرور سيعاود بأدب
CASE_13: اطلب المقاس الجديد + أخبره أنك ستجهز طلبية جديدة بنفس كل المعلومات
CASE_14: اطلب تفاصيل المنتج الجديد + أخبره أنك ستجهز طلبية جديدة
CASE_15: اسأله بلطف ودفء عن الوقت المناسب للتوصيل

ملاحظة: لا تذكر رقم الليفرور في الرد — سيُضاف تلقائياً من الكود.`;

// ✅ إضافة جديدة — REFUSE_PROMPT
const REFUSE_PROMPT = `أنت مستشار مبيعات خبير في علم النفس لمتجر GreatShoes للأحذية الجلدية بالمغرب.
الزبون رفض استلام طلبيته عند التوصيل.
مهمتك: تفهم السبب الحقيقي، تتعاطف معه بعمق، وتحاول إنقاذ الطلبية.

معلومات الطلبية:
- الاسم: {NAME}
- المنتج: {PRODUCT}
- رقم التتبع: {TRACKING}
- العنوان: {ADDRESS}
- المقاس: {SIZE}

رد الزبون: "{REPLY}"

حلل رد الزبون بعمق وحدد السبب الحقيقي:

CASE_1: ما عجبوش الشكل أو الصورة مخالفة للواقع
CASE_2: مشكل في الجودة أو الحذاء معيب
CASE_3: المقاس غلط أو ما جاش قده
CASE_4: مشكل مع الليفرور — سوء أدب أو تأخر أو ما جاش في الوقت المحدد
CASE_5: السعر — قال غالي أو ما عندوش فلوس دابا
CASE_6: ظرف شخصي طارئ — مسافر أو مشغول
CASE_7: هاتف كان مطفأ أو خارج التغطية
CASE_8: العنوان ناقص أو غير معروف
CASE_9: طلب تأجيل التسليم لوقت آخر
CASE_10: اشترى من مكان آخر
CASE_11: لم يعد يحتاج المنتج
CASE_12: تأخر التوصيل كثيراً
CASE_13: يريد تغيير المقاس
CASE_14: يريد تبديل المنتج كلياً
CASE_15: يريد إلغاء الطلبية صراحةً
CASE_16: رد غير واضح

أولاً في سطر منفصل:
DETECTED_CASE: [رقم الحالة]

ثم اكتب رداً بالدارجة المغربية كأنك إنسان حقيقي — ابدأ بتعاطف حقيقي وعميق — استخدم مهارات الإقناع المناسبة — 5 إلى 7 أسطر — إيموجي باعتدال — لا مختصر جداً ولا ممل.

قواعد الرد:
CASE_1: "والله فاهمك..." + ضمان قلب قيس عاد خلص + "الجلد الطبيعي كيبان أحلى في الواقع" + اقترح صور إضافية
CASE_2: "سمح لنا والله..." + اعتذر بصدق وعمق + عرض استبدال فوري مجاناً + "أنت زبوننا — مش غادي نخليك تتضرر"
CASE_3: "آه هاد المشكل كيصرا..." + اعرض تغيير المقاس مجاناً + "قل ليا المقاس الصح ونبعثوه ليك فوراً"
CASE_4: "والله معك حق وسمح لنا..." + اعتذر بشدة + "المشكل مع الليفرور مش معنا" + اعرض توصيل مرة ثانية مع ليفرور آخر
CASE_5: "فاهمك — الفلوس كتحسب..." + Anchoring "320 درهم مقابل جلد يدوم سنين — أقل من 1 درهم في اليوم" + "تشوف قبل — تعجبك تخلص"
CASE_6: "لا باس — الظروف كتعرض..." + تعاطف بصدق + اعرض إعادة الإرسال في وقت مناسب
CASE_7: "لا باس..." + اعرض إعادة التوصيل + أعطه رقم الليفرور
CASE_8: اطلب تفاصيل العنوان بلطف (زنقة، رقم منزل، معلمة قريبة)
CASE_9: "مفهوم..." + اسأله عن الوقت المناسب + طمئنه أن طلبيته محجوزة
CASE_10: شكره بلطف + تمنى له التوفيق
CASE_11: اقترح بلطف تأجيل بدل إلغاء + "نحجزها ليك لوقت آخر"
CASE_12: "معك حق وسمح لنا..." + اعتذر + اشرح + اعرض إنقاذ الطلب
CASE_13: "لا باس — المقاسات كتختلف..." + اطلب المقاس الجديد + "نبعثوه ليك بنفس كل المعلومات"
CASE_14: اطلب تفاصيل المنتج الجديد + "نجهزو ليك طلبية جديدة فوراً"
CASE_15: تعاطف + حاول مرة أخيرة + "واش فيه شي نقدرو نصلحو؟"
CASE_16: "عفاك حبيبي..." + اسأل بلطف عن السبب الحقيقي + EMOTIONAL_INTELLIGENCE`;

// ✅ إضافة جديدة — Static system prompts للكاشينج (توفير التكلفة)
const PDR_SYSTEM_STATIC = `أنت مساعد واتساب بشري لمتجر GreatShoes للأحذية الجلدية بالمغرب.
الزبون عنده طلبية والليفرور حاول يوصلها ولكن ما لقاهش.
أرسلنا له رسالة نسأله عن وقت مناسب وهو رد الآن.

حلل رد الزبون بعمق وحدد الحالة الأقرب:
CASE_1: حدد وقت أو يوم محدد للتوصيل
CASE_2: مسافر أو غائب مؤقتاً ويريد وقتاً لاحقاً
CASE_3: يريد تغيير العنوان أو المكان
CASE_4: يقول أن الليفرور ما اتصل به أصلاً أو لم يأتِ
CASE_5: يريد إلغاء الطلبية
CASE_6: يسأل عن حالة طلبيته
CASE_7: هاتفه كان مطفأ أو خارج التغطية
CASE_8: العنوان ناقص أو غير واضح
CASE_9: يريد تأجيل التسليم لتاريخ لاحق
CASE_10: اشترى المنتج من مكان آخر
CASE_11: لم يعد يحتاج المنتج
CASE_12: مشكل مع الليفرور — سوء أدب أو تأخر
CASE_13: يريد تغيير المقاس
CASE_14: يريد تغيير المنتج كلياً
CASE_15: رد غير واضح لا يمكن تصنيفه

أولاً في سطر منفصل:
DETECTED_CASE: [رقم الحالة]

ثم اكتب رداً بالدارجة المغربية كأنك إنسان حقيقي — طبيعي ودافئ — 4 إلى 6 أسطر — ابدأ بتحية ودية — إيموجي باعتدال — لا مختصر جداً ولا طويل.

قواعد الرد:
CASE_1: شكره بدفء + أخبره أنك ستبلغ الليفرور بالوقت المحدد + أعطه رقم الليفرور للتواصل المباشر
CASE_2: تعاطف معه + اسأله بلطف متى يرجع أو يكون متاح + طمئنه أن طلبيته محجوزة
CASE_3: اطلب العنوان الجديد بالتفصيل (زنقة، رقم، معلمة قريبة) + أخبره أنك ستبلغ الليفرور
CASE_4: اعتذر بصدق + طمئنه أن الليفرور سيعاود الاتصال + أعطه رقم الليفرور
CASE_5: تعاطف + اسأله بلطف عن السبب + اقترح تأجيل بدل إلغاء + "القرار ليك دائماً"
CASE_6: أخبره بحالة طلبيته + طمئنه أن الليفرور سيتصل به قريباً
CASE_7: شكره على الرد + أخبره أنك ستبلغ الليفرور ليعاود الاتصال + أعطه رقم الليفرور
CASE_8: اطلب التفاصيل الناقصة بلطف (زنقة، رقم منزل، معلمة قريبة)
CASE_9: اسأله عن التاريخ المناسب + طمئنه أن طلبيته محجوزة
CASE_10: شكره بلطف + تمنى له التوفيق
CASE_11: اقترح بلطف تأجيل الطلبية بدل إلغائها + "نحجزها ليك لوقت آخر"
CASE_12: اعتذر بشدة + طمئنه أن الأمر سيُصلح + أخبره أن الليفرور سيعاود بأدب
CASE_13: اطلب المقاس الجديد + أخبره أنك ستجهز طلبية جديدة بنفس كل المعلومات
CASE_14: اطلب تفاصيل المنتج الجديد + أخبره أنك ستجهز طلبية جديدة
CASE_15: اسأله بلطف ودفء عن الوقت المناسب للتوصيل

ملاحظة: لا تذكر رقم الليفرور في الرد — سيُضاف تلقائياً من الكود.`;

const REFUSE_SYSTEM_STATIC = `أنت مستشار مبيعات خبير في علم النفس لمتجر GreatShoes للأحذية الجلدية بالمغرب.
الزبون رفض استلام طلبيته عند التوصيل.
مهمتك: تفهم السبب الحقيقي، تتعاطف معه بعمق، وتحاول إنقاذ الطلبية.

حلل رد الزبون بعمق وحدد السبب الحقيقي:
CASE_1: ما عجبوش الشكل أو الصورة مخالفة للواقع
CASE_2: مشكل في الجودة أو الحذاء معيب
CASE_3: المقاس غلط أو ما جاش قده
CASE_4: مشكل مع الليفرور — سوء أدب أو تأخر أو ما جاش في الوقت المحدد
CASE_5: السعر — قال غالي أو ما عندوش فلوس دابا
CASE_6: ظرف شخصي طارئ — مسافر أو مشغول
CASE_7: هاتف كان مطفأ أو خارج التغطية
CASE_8: العنوان ناقص أو غير معروف
CASE_9: طلب تأجيل التسليم لوقت آخر
CASE_10: اشترى من مكان آخر
CASE_11: لم يعد يحتاج المنتج
CASE_12: تأخر التوصيل كثيراً
CASE_13: يريد تغيير المقاس
CASE_14: يريد تبديل المنتج كلياً
CASE_15: يريد إلغاء الطلبية صراحةً
CASE_16: رد غير واضح

أولاً في سطر منفصل:
DETECTED_CASE: [رقم الحالة]

ثم اكتب رداً بالدارجة المغربية كأنك إنسان حقيقي — ابدأ بتعاطف حقيقي وعميق — استخدم مهارات الإقناع المناسبة — 5 إلى 7 أسطر — إيموجي باعتدال — لا مختصر جداً ولا ممل.

قواعد الرد:
CASE_1: "والله فاهمك..." + ضمان قلب قيس عاد خلص + "الجلد الطبيعي كيبان أحلى في الواقع" + اقترح صور إضافية
CASE_2: "سمح لنا والله..." + اعتذر بصدق وعمق + عرض استبدال فوري مجاناً + "أنت زبوننا — مش غادي نخليك تتضرر"
CASE_3: "آه هاد المشكل كيصرا..." + اعرض تغيير المقاس مجاناً + "قل ليا المقاس الصح ونبعثوه ليك فوراً"
CASE_4: "والله معك حق وسمح لنا..." + اعتذر بشدة + "المشكل مع الليفرور مش معنا" + اعرض توصيل مرة ثانية مع ليفرور آخر
CASE_5: "فاهمك — الفلوس كتحسب..." + Anchoring "320 درهم مقابل جلد يدوم سنين — أقل من 1 درهم في اليوم" + "تشوف قبل — تعجبك تخلص"
CASE_6: "لا باس — الظروف كتعرض..." + تعاطف بصدق + اعرض إعادة الإرسال في وقت مناسب
CASE_7: "لا باس..." + اعرض إعادة التوصيل + أعطه رقم الليفرور
CASE_8: اطلب تفاصيل العنوان بلطف (زنقة، رقم منزل، معلمة قريبة)
CASE_9: "مفهوم..." + اسأله عن الوقت المناسب + طمئنه أن طلبيته محجوزة
CASE_10: شكره بلطف + تمنى له التوفيق
CASE_11: اقترح بلطف تأجيل بدل إلغاء + "نحجزها ليك لوقت آخر"
CASE_12: "معك حق وسمح لنا..." + اعتذر + اشرح + اعرض إنقاذ الطلب
CASE_13: "لا باس — المقاسات كتختلف..." + اطلب المقاس الجديد + "نبعثوه ليك بنفس كل المعلومات"
CASE_14: اطلب تفاصيل المنتج الجديد + "نجهزو ليك طلبية جديدة فوراً"
CASE_15: تعاطف + حاول مرة أخيرة + "واش فيه شي نقدرو نصلحو؟"
CASE_16: "عفاك حبيبي..." + اسأل بلطف عن السبب الحقيقي + EMOTIONAL_INTELLIGENCE`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const SILENCE_TIMEOUT = 30 * 60 * 1000;
const MAX_FOLLOWUPS   = 1;
const followUpTimers  = {};
const lastMessageTime = {};

// ✅ إضافة جديدة
const PDR_FOLLOWUP_1 =  2 * 60 * 60 * 1000;
const PDR_FOLLOWUP_2 = 24 * 60 * 60 * 1000;

const formatPhone = (p) => { p = String(p).trim().replace(/\s/g,'').replace(/\+/g,''); if (p.startsWith('212')) return p; if (p.startsWith('0')) return '212'+p.slice(1); if (p.length===9) return '212'+p; return '212'+p; };

const markAsRead = async (messageId) => { try { await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, { messaging_product:'whatsapp', status:'read', message_id:messageId }, { headers:{'Authorization':`Bearer ${WHATSAPP_TOKEN}`,'Content-Type':'application/json'} }); } catch(e) { console.error('markAsRead:',e.message); } };

const sendText = async (to, text) => { await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, { messaging_product:'whatsapp', to, text:{body:text} }, { headers:{'Authorization':`Bearer ${WHATSAPP_TOKEN}`,'Content-Type':'application/json'} }); };

const sendHumanLike = async (to, fullReply) => { const parts = fullReply.split('[PAUSE]').map(p=>p.trim()).filter(p=>p.length>0); for (let i=0;i<parts.length;i++) { const t=Math.min(Math.max(parts[i].length*40,1000),3000); await sleep(t); await sendText(to,parts[i]); if(i<parts.length-1) await sleep(600); } };

const sendWhatsAppImage = async (to, color) => { const n={noir:'أسود',marron:'بني',gris:'رمادي'}; await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, { messaging_product:'whatsapp', to, type:'image', image:{link:PRODUCT_IMAGES[color],caption:`BOTTINE CUIR GS081 - ${n[color]} - 320 درهم`} }, { headers:{'Authorization':`Bearer ${WHATSAPP_TOKEN}`,'Content-Type':'application/json'} }); };

const sendAllImages = async (to) => { await sendWhatsAppImage(to,'noir'); await sleep(800); await sendWhatsAppImage(to,'marron'); await sleep(800); await sendWhatsAppImage(to,'gris'); };

const detectColor = (text) => { const t=text.toLowerCase(); if(t.includes('noir')||t.includes('أسود')||t.includes('اسود')||t.includes('كحل')) return 'noir'; if(t.includes('marron')||t.includes('بني')||t.includes('قهوي')) return 'marron'; if(t.includes('gris')||t.includes('رمادي')||t.includes('rmadi')) return 'gris'; return null; };

const isInsistingOnImages = (text) => { const t=text.toLowerCase(); return (t.includes('صورة')||t.includes('صور')||t.includes('image'))&&(t.includes('مرة ثانية')||t.includes('مشافتش')||t.includes('وصلتش')||t.includes('encore')||t.includes('كلهم')); };

const isEmotionalState = (text) => { const t=text.toLowerCase(); return t.includes("حزين")||t.includes("تعبان")||t.includes("مشكلة")||t.includes("خصام")||t.includes("زوجة")||t.includes("مريض")||t.includes("توفي")||t.includes("ضغط")||t.includes("بكيت")||t.includes("صعيب")||t.includes("تخاصمت")||t.includes("مابغيتش نحكي"); };

const isNotInterested = (text) => { const t=text.toLowerCase(); return t.includes('مش غادي نشري')||t.includes('ما بغيتش')||t.includes('لا شكراً')||t.includes('لا شكرا')||t.includes('pas intéressé')||t.includes('no thanks')||t.includes('مش محتاج')||t.includes('وقفو')||t.includes('بغيت نوقف'); };

// ✅ إضافة جديدة — كشف لغة الزبون تلقائياً
const detectLanguage = (text) => {
  const t = text.toLowerCase();
  if (/[؀-ۿ]/.test(t)) {
    const darijaWords = ['واش','كيف','بغيت','غادي','ماشي','دابا','مزيان','آش','شنو','فين','علاش','بزاف','كاين','هاد','ديال','نتا','نتي','كنشري','كنبغي','عفاك','إمتا','واخا'];
    if (darijaWords.some(w => t.includes(w))) return 'darija';
    return 'fusha';
  }
  if (/[a-z][3789][a-z]|[a-z][3789]\s/i.test(t)) return 'darija';
  const darijaLatin = ['salam','slm','labas','la bas','bikhir','bkhir','kayn','machi','walo','khoya','khouya','bghit','bezzaf','dyal','mazal','daba','wach','chhal','wakha','waxa','banda','taman','kifach','kifash','rani','fach','aji','sir','ndir','afak','imta','tawsal','yamken','nkayas','hamdulah','nta','nti','bslama','mahal','fin ','kidayr','mokin','nichan'];
  if (darijaLatin.some(w => t.includes(w))) return 'darija';
  const frenchGrammar = ["je suis","je veux","comment puis","s'il vous","est-ce que","qu'est-ce","pouvez-vous","je cherche","je voudrais"];
  if (frenchGrammar.some(w => t.includes(w))) return 'french';
  return 'darija';
};

// ✅ كشف طلب تغيير اللغة صراحةً
const detectFrenchRequest = (text) => {
  const t = text.toLowerCase().trim();
  return /\b(bghit|bghit\s+ndir|bghit\s+n|3awz|عاوز|عايز)\s+(fran[cç]ais|french|fr)\b/.test(t)
    || /\b(parle[rz]?\s+(en\s+)?fran[cç]ais|speak\s+french|en\s+fran[cç]ais|fran[cç]ais\s+stp|fran[cç]ais\s+svp)\b/.test(t)
    || /^(fran[cç]ais|french|je\s+veux\s+fran[cç]ais)$/i.test(t);
};
const detectDarijaRequest = (text) => {
  const t = text.toLowerCase().trim();
  return /\b(bghit|3awz)\s+(darija|3arbi|3rbiya|عربي|دارجة)\b/.test(t)
    || /\b(parle[rz]?\s+(en\s+)?arabe|speak\s+arabic)\b/.test(t);
};

// ✅ كشف الفرنسية المحسّن (كلمات قصيرة شائعة)
const isFrenchText = (text) => {
  const t = text.toLowerCase();
  // كلمات فرنسية شائعة في المحادثة
  const frWords = ['bonjour','bonsoir','merci','oui','non','prix','taille','couleur','livraison','combien','quel','quelle','comment','pourquoi','je ','tu ','il ','elle ','nous ','vous ','ils ','elles ','est-ce','c\'est','ça ','ce ','cette ','mon ','ma ','mes ','les ','des ','une ','pour ','avec ','sans ','dans ','sur ','par ','mais ','donc ','aussi ','très ','bien ','tout ','plus ','moins ','pas ','peux','veux','peux essayer','je cherche','je voudrais','s\'il vous','s\'il te','pouvez','voulez','avez'];
  return frWords.some(w => t.includes(w));
};

// ✅ إضافة جديدة — getLivreurFromOzon
const getLivreurFromOzon = async (trackingNum) => {
  try {
    const url = `${OZON_BASE}/${OZON_CUSTOMER_ID}/${OZON_API_KEY}/tracking`;
    const formData = new URLSearchParams();
    formData.append('tracking-number', trackingNum);
    const res = await axios.post(url, formData.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 8000 });
    const history = res.data?.TRACKING?.HISTORY;
    if (!history) return { name: '', phone: '' };
    for (const key of Object.keys(history)) {
      const entry = history[key];
      const statut = String(entry.STATUT || '').toLowerCase();
      const comment = String(entry.COMMENT || '');
      if (statut.includes('mise en distribution') && comment.includes('Livreur:')) {
        const nameMatch  = comment.match(/Livreur:\s*([^|<]+)/);
        const phoneMatch = comment.match(/Téléphone:\s*([\d]+)/);
        return { name: nameMatch ? nameMatch[1].trim() : '', phone: phoneMatch ? phoneMatch[1].trim() : '' };
      }
    }
    return { name: '', phone: '' };
  } catch(e) { console.error('❌ getLivreurFromOzon:', e.message); return { name: '', phone: '' }; }
};

// ✅ إضافة جديدة — sendNewOrderToSheet
const sendNewOrderToSheet = async (info, newSize, newProduct, newColor) => {
  try {
    const colorFr = newColor || detectColor(info.product) || 'noir';
    const size    = newSize  || info.size || '';
    const variant = size && colorFr ? `${size}/${colorFr}` : '';
    const payload = { secret: SHEET_SECRET, full_name: info.name, phone: info.phone || '', city: info.city || '', address: info.address || '', price: '320', product: newProduct || info.product || 'BOTTINE CUIR GS081', color: variant, size: '' };
    const response = await axios.post(SHEET_API_URL, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
    console.log('📤 طلبية جديدة للشيت:', response.status);
    return true;
  } catch(e) { console.error('❌ خطأ إرسال الشيت:', e.message); return false; }
};

// ✅ إضافة جديدة — schedulePdrFollowup
const schedulePdrFollowup = (from) => {
  if (pdrTimers[from]) clearTimeout(pdrTimers[from]);
  pdrTimers[from] = setTimeout(async () => {
    if (!pasDeReponseActive[from]) return;
    const info = pasDeReponseActive[from];
    console.log(`📨 متابعة PDR 1 لـ ${from}`);
    try {
      await sendHumanLike(from,
        "سلام " + info.name + " 😊 [PAUSE]" +
        "غير كنتساءل — واش كلشي مزيان معاك؟ [PAUSE]" +
        "طلبيتك مزالت في انتظارك... [PAUSE]" +
        "واش تقدر تعطيني شي وقت مناسب باش يجي ليك الليفرور؟ 🙏"
      );
    } catch(e) { console.error('❌ خطأ متابعة PDR 1:', e.message); }
    pdrTimers[from] = setTimeout(async () => {
      if (!pasDeReponseActive[from]) return;
      const info2 = pasDeReponseActive[from];
      console.log(`📨 متابعة PDR 2 (أخيرة) لـ ${from}`);
      try {
        await sendHumanLike(from,
          "سلام " + info2.name + " 👋 [PAUSE]" +
          "هاذي آخر مرة كنتواصل معاك بخصوص طلبيتك [PAUSE]" +
          "كنا نتمنى نوصلوها ليك... [PAUSE]" +
          "إذا بغيت في أي وقت — رجع لينا وغادي نكونو هنا 🤎 [PAUSE]" +
          "GreatShoes — قلب قيس عاد خلص دائماً ❤️"
        );
      } catch(e) { console.error('❌ خطأ متابعة PDR 2:', e.message); }
      delete pasDeReponseActive[from];
      delete pdrTimers[from];
      persistState();
      console.log(`🗑️ تم إلغاء PDR للزبون ${from}`);
    }, PDR_FOLLOWUP_2);
  }, PDR_FOLLOWUP_1);
};

// ✅ إضافة جديدة — scheduleRefuseFollowup
const scheduleRefuseFollowup = (from) => {
  if (refuseTimers[from]) clearTimeout(refuseTimers[from]);
  refuseTimers[from] = setTimeout(async () => {
    if (!refuseActive[from]) return;
    const info = refuseActive[from];
    console.log(`📨 متابعة Refuse 1 لـ ${from}`);
    try {
      await sendHumanLike(from,
        "سلام " + info.name + " 😊 [PAUSE]" +
        "غير كنفكر فيك — واش راك بخير؟ [PAUSE]" +
        "طلبيتك مزالت هنا تنتظرك [PAUSE]" +
        "واش فيه شي نقدرو نصلحو ليك؟ 🙏"
      );
    } catch(e) { console.error('❌ خطأ متابعة Refuse 1:', e.message); }
    refuseTimers[from] = setTimeout(async () => {
      if (!refuseActive[from]) return;
      const info2 = refuseActive[from];
      console.log(`📨 متابعة Refuse 2 (أخيرة) لـ ${from}`);
      try {
        await sendHumanLike(from,
          "سلام " + info2.name + " 👋 [PAUSE]" +
          "هاذي آخر رسالة من عندنا [PAUSE]" +
          "كنا نتمنى نحلو الأمر معاك... [PAUSE]" +
          "إذا غيرت رأيك في أي وقت — GreatShoes دائماً هنا ليك 🤎 [PAUSE]" +
          "قلب قيس عاد خلص — وعد ❤️"
        );
      } catch(e) { console.error('❌ خطأ متابعة Refuse 2:', e.message); }
      delete refuseActive[from];
      delete refuseTimers[from];
      persistState();
      console.log(`🗑️ تم إلغاء Refuse للزبون ${from}`);
    }, PDR_FOLLOWUP_2);
  }, PDR_FOLLOWUP_1);
};

// ✅ إضافة جديدة — handlePasDeReponse
const handlePasDeReponse = async (from, text) => {
  const info          = pasDeReponseActive[from];
  const trackingNum   = info.trackingNum;
  const customerName  = info.name;
  const customerPhone = formatPhone(from);
  const address       = info.address || '';
  if (pdrTimers[from]) { clearTimeout(pdrTimers[from]); delete pdrTimers[from]; }
  const prompt = PDR_PROMPT
    .replace('{NAME}',     customerName)
    .replace('{PRODUCT}',  info.product)
    .replace('{TRACKING}', trackingNum)
    .replace('{ADDRESS}',  address)
    .replace('{REPLY}',    text);
  // ✅ إضافة جديدة — Haiku + Caching لتوفير التكلفة
  const pdrUserMsg = `معلومات الطلبية:\n- الاسم: ${customerName}\n- المنتج: ${info.product}\n- رقم التتبع: ${trackingNum}\n- العنوان المسجل: ${address}\n\nرد الزبون: "${text}"`;
  const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-haiku-4-5-20251001', max_tokens: 700,
    system: [{ type: 'text', text: PDR_SYSTEM_STATIC, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: pdrUserMsg }]
  }, { headers: { 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'prompt-caching-2024-07-31', 'content-type': 'application/json' } });
  const claudeReply  = claudeRes.data.content[0].text;
  const caseMatch    = claudeReply.match(/DETECTED_CASE:\s*(\d+)/);
  const detectedCase = caseMatch ? parseInt(caseMatch[1]) : 15;
  const customerMsg  = claudeReply.replace(/DETECTED_CASE:\s*\d+\n?/, '').trim();
  const livreur = await getLivreurFromOzon(trackingNum);
  await sendHumanLike(from, customerMsg);
  if (livreur.phone && [1,4,7].includes(detectedCase)) {
    await sleep(1000);
    await sendText(from, "📞 رقم الليفرور: " + livreur.phone + "\nتقدر تتصل بيه مباشرة 🙏");
  }
  switch(detectedCase) {
    case 1:
    case 7:
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone),
          "📦 GreatShoes — معلومة مهمة\n\n👤 " + customerName + " | 📞 " + customerPhone + "\n📦 " + trackingNum + "\n🕐 رد الزبون: " + text + "\n\n" +
          (detectedCase === 1 ? "✅ الزبون حدد وقت مناسب — يرجى التواصل معه 🙏" : "📱 الهاتف كان مطفأ — يرجى إعادة الاتصال 🙏")
        );
      }
      delete pasDeReponseActive[from]; persistState(); break;
    case 2: schedulePdrFollowup(from); break;
    case 3: break;
    case 4:
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone),
          "⚠️ GreatShoes — إعادة اتصال مطلوبة\n\n👤 " + customerName + " | 📞 " + customerPhone + "\n📦 " + trackingNum + "\n💬 الزبون يقول أنك ما اتصلت به — يرجى الاتصال فوراً 🙏"
        );
      }
      delete pasDeReponseActive[from]; persistState(); break;
    case 5: schedulePdrFollowup(from); break;
    case 8:
      await sendText(ADMIN_PHONE, "📍 عنوان ناقص\n\n👤 " + customerName + " | 📞 " + customerPhone + "\n📦 " + trackingNum + "\n💬 " + text);
      break;
    case 9:
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone), "⏳ GreatShoes — تأجيل التسليم\n\n👤 " + customerName + " | 📞 " + customerPhone + "\n📦 " + trackingNum + "\n🕐 رد الزبون: " + text);
      }
      break;
    case 10: delete pasDeReponseActive[from]; persistState(); break;
    case 11: schedulePdrFollowup(from); break;
    case 12:
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone), "⚠️ GreatShoes — شكوى زبون\n\n👤 " + customerName + " | 📞 " + customerPhone + "\n📦 " + trackingNum + "\n💬 الزبون: " + text + "\n\nيرجى التواصل معه بأدب 🙏");
      }
      break;
    case 13: pasDeReponseActive[from].waitingForSize = true; persistState(); break;
    case 14: pasDeReponseActive[from].waitingForProduct = true; persistState(); break;
    case 15: schedulePdrFollowup(from); break;
    default: schedulePdrFollowup(from); break;
  }
};

// ✅ إضافة جديدة — handleRefuse
const handleRefuse = async (from, text) => {
  const info          = refuseActive[from];
  const trackingNum   = info.trackingNum;
  const customerName  = info.name;
  const customerPhone = formatPhone(from);
  if (refuseTimers[from]) { clearTimeout(refuseTimers[from]); delete refuseTimers[from]; }
  const prompt = REFUSE_PROMPT
    .replace('{NAME}',     customerName)
    .replace('{PRODUCT}',  info.product)
    .replace('{TRACKING}', trackingNum)
    .replace('{ADDRESS}',  info.address || '')
    .replace('{SIZE}',     info.size    || '')
    .replace('{REPLY}',    text);
  // ✅ إضافة جديدة — Haiku + Caching لتوفير التكلفة
  const refuseUserMsg = `معلومات الطلبية:\n- الاسم: ${customerName}\n- المنتج: ${info.product}\n- رقم التتبع: ${trackingNum}\n- العنوان: ${info.address || ''}\n- المقاس: ${info.size || ''}\n\nرد الزبون: "${text}"`;
  const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-haiku-4-5-20251001', max_tokens: 700,
    system: [{ type: 'text', text: REFUSE_SYSTEM_STATIC, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: refuseUserMsg }]
  }, { headers: { 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'prompt-caching-2024-07-31', 'content-type': 'application/json' } });
  const claudeReply  = claudeRes.data.content[0].text;
  const caseMatch    = claudeReply.match(/DETECTED_CASE:\s*(\d+)/);
  const detectedCase = caseMatch ? parseInt(caseMatch[1]) : 16;
  const customerMsg  = claudeReply.replace(/DETECTED_CASE:\s*\d+\n?/, '').trim();
  const livreur = await getLivreurFromOzon(trackingNum);
  await sendHumanLike(from, customerMsg);
  switch(detectedCase) {
    case 1: scheduleRefuseFollowup(from); break;
    case 2:
      await sendNewOrderToSheet(info, info.size, info.product, null);
      await sleep(1000);
      await sendText(from, "✅ تم تجهيز طلبية الاستبدال — سيتصل بك الليفرور قريباً 🙏");
      delete refuseActive[from]; persistState(); break;
    case 3: refuseActive[from].waitingForSize = true; persistState(); break;
    case 4:
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone), "⚠️ GreatShoes — شكوى زبون رفض\n\n👤 " + customerName + " | 📞 " + customerPhone + "\n📦 " + trackingNum + "\n💬 الزبون: " + text);
      }
      scheduleRefuseFollowup(from); break;
    case 5: scheduleRefuseFollowup(from); break;
    case 6: scheduleRefuseFollowup(from); break;
    case 7:
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone), "📱 GreatShoes — إعادة توصيل\n\n👤 " + customerName + " | 📞 " + customerPhone + "\n📦 " + trackingNum + "\n✅ الزبون متاح الآن 🙏");
      }
      delete refuseActive[from]; persistState(); break;
    case 8:
      await sendText(ADMIN_PHONE, "📍 عنوان ناقص — رفض\n\n👤 " + customerName + " | 📞 " + customerPhone + "\n📦 " + trackingNum + "\n💬 " + text);
      break;
    case 9:
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone), "⏳ GreatShoes — تأجيل\n\n👤 " + customerName + " | 📞 " + customerPhone + "\n📦 " + trackingNum + "\n🕐 " + text);
      }
      delete refuseActive[from]; persistState(); break;
    case 10: delete refuseActive[from]; persistState(); break;
    case 11: scheduleRefuseFollowup(from); break;
    case 12: scheduleRefuseFollowup(from); break;
    case 13: refuseActive[from].waitingForSize = true; persistState(); break;
    case 14: refuseActive[from].waitingForProduct = true; persistState(); break;
    case 15: scheduleRefuseFollowup(from); break;
    case 16: delete refuseActive[from]; persistState(); break;
    default: scheduleRefuseFollowup(from); break;
  }
};

const extractOrderJSON = (reply) => { const marker='CONFIRMED_ORDER:'; const idx=reply.indexOf(marker); if(idx===-1) return null; const after=reply.substring(idx+marker.length).trimStart(); let depth=0,start=-1; for(let i=0;i<after.length;i++) { if(after[i]==='{'){if(depth===0)start=i;depth++;} else if(after[i]==='}'){depth--;if(depth===0&&start!==-1)return after.substring(start,i+1);} } return null; };

const saveOrderToSheet = async (reply, fromPhone) => {
  try {
    const jsonStr = extractOrderJSON(reply);
    if (!jsonStr) { console.error('❌ ما لقاش JSON'); return { success:false, colorFr:null }; }
    const orderData = JSON.parse(jsonStr);
    const customer  = orderData.customer_data || {};
    const product   = orderData.product_data  || {};
    const rawPhone  = customer.phone || '';
    const phone = (rawPhone==='PHONE_FROM_WHATSAPP'||rawPhone===''||rawPhone==='غير محدد') ? formatPhone(fromPhone) : formatPhone(rawPhone);
    const colorFr = product.color_fr || detectColor(product.color_ar||'') || 'noir';
    const size    = product.size || '';
    const variant = size&&colorFr ? `${size}/${colorFr}` : '';
    const rawCity = customer.city || '';
    const city    = normalizeCityFr(rawCity);
    const payload = { secret:SHEET_SECRET, full_name:customer.full_name||'', phone, city, address:customer.shipping_address||'', price:product.unit_price_mad||'320', product:product.product_name||'BOTTINE CUIR GS081', color:variant, size:'' };
    console.log('📤 إرسال للشيت:', JSON.stringify(payload));
    const response = await axios.post(SHEET_API_URL, payload, { headers:{'Content-Type':'application/json'}, timeout:10000 });
    console.log('📥 رد الشيت:', response.status, JSON.stringify(response.data));
    return { success:true, colorFr, phone, name:customer.full_name, city, rawCity };
  } catch(err) { console.error('❌ خطأ الشيت:', err.message); return { success:false, colorFr:null, phone:formatPhone(fromPhone) }; }
};

const extractConfirmMsg = (reply) => { const start=reply.indexOf('ORDER_CONFIRM_MSG_START'); const end=reply.indexOf('ORDER_CONFIRM_MSG_END'); if(start!==-1&&end!==-1) return reply.substring(start+'ORDER_CONFIRM_MSG_START'.length,end).trim(); return null; };

const sendFollowUp = async (from) => {
  if (orderConfirmed.has(from)||notInterested.has(from)) return;
  if (!conversationHistory[from]||conversationHistory[from].length===0) return;
  const count = followUpCount[from]||0;
  if (count>=MAX_FOLLOWUPS) { delete followUpTimers[from]; return; }
  followUpCount[from]=count+1; persistState();
  console.log(`📨 متابعة رقم ${count+1} لـ ${from}`);
  try {
    const followUpPrompt = count<MAX_FOLLOWUPS-1
      ? `العميل صمت 15 دقيقة. متابعة إبداعية رقم ${count+1} من ${MAX_FOLLOWUPS}. أسلوب مختلف. [PAUSE] بين الجمل.`
      : `آخر رسالة. وداع لطيف مع عرض أخير. [PAUSE] بين الجمل.`;
    const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', { model:'claude-haiku-4-5-20251001', max_tokens:400, system:[{type:"text",text:SYSTEM_PROMPT,cache_control:{type:"ephemeral"}}], messages:[...conversationHistory[from],{role:'user',content:followUpPrompt}] }, { headers:{'x-api-key':CLAUDE_API_KEY,'anthropic-version':'2023-06-01','anthropic-beta':'prompt-caching-2024-07-31','content-type':'application/json'} });
    await sendHumanLike(from, claudeRes.data.content[0].text);
    if (count+1<MAX_FOLLOWUPS) followUpTimers[from]=setTimeout(()=>sendFollowUp(from),SILENCE_TIMEOUT);
  } catch(e) { console.error('❌ خطأ المتابعة:', e.message); }
};

const resetFollowUpTimer = (from) => { if(followUpTimers[from]){clearTimeout(followUpTimers[from]);delete followUpTimers[from];} if(!orderConfirmed.has(from)&&!notInterested.has(from)) followUpTimers[from]=setTimeout(()=>sendFollowUp(from),SILENCE_TIMEOUT); };

const verifySignature = (req) => { if(!APP_SECRET) return true; const sig=req.headers['x-hub-signature-256']; if(!sig) return false; const expected='sha256='+crypto.createHmac('sha256',APP_SECRET).update(JSON.stringify(req.body)).digest('hex'); return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)); };

// ===== WEBSITE ORDER CONFIRMATION =====

const toMoroccanPhone = (phone) => {
  phone = String(phone).trim().replace(/\s/g,'');
  if (phone.startsWith('+212')) return '0'+phone.slice(4);
  if (phone.startsWith('212')) return '0'+phone.slice(3);
  if (!phone.startsWith('0')) return '0'+phone;
  return phone;
};

const getCityId = (cityFr) => {
  if (!cityFr) return 2174;
  const k = cityFr.trim();
  if (CITY_ID_MAP[k]) return CITY_ID_MAP[k];
  for (const key in CITY_ID_MAP) {
    if (k.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(k.toLowerCase())) return CITY_ID_MAP[key];
  }
  return 2174;
};

const sendInteractiveButtons = async (to, bodyText, buttons) => {
  await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp', to, type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map((title, i) => ({ type: 'reply', reply: { id: `btn_${i}`, title } }))
      }
    }
  }, { headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } });
};

const sendOrderTemplate = async (to, name, product, price) => {
  await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp', to, type: 'template',
    template: {
      name: 'order_confirmation',
      language: { code: 'ar' },
      components: [{ type: 'body', parameters: [
        { type: 'text', text: String(name) },
        { type: 'text', text: String(product) },
        { type: 'text', text: String(price) }
      ]}]
    }
  }, { headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } });
};

const addParcelDirect = async (order, finalAddress) => {
  const cityId = getCityId(normalizeCityFr(order.city || ''));
  const note = [order.product, order.size, order.color].filter(Boolean).join(' - ');
  const moPhone = toMoroccanPhone(order.phone || order.waPhone);
  const body = new URLSearchParams({
    'parcel-receiver': order.name,
    'parcel-phone': moPhone,
    'parcel-city': String(cityId),
    'parcel-address': finalAddress,
    'parcel-price': String(order.price || 320),
    'parcel-stock': '0',
    'parcel-note': note
  });
  console.log('🚚 Ozon payload:', { name: order.name, phone: moPhone, city: cityId, address: finalAddress, price: order.price });
  const res = await axios.post(`${OZON_BASE}/${OZON_CUSTOMER_ID}/${OZON_API_KEY}/add-parcel`, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000
  });
  console.log('🚚 Ozon response:', JSON.stringify(res.data));
  const parcel = res.data?.['ADD-PARCEL'];
  const tracking = parcel?.['NEW-PARCEL']?.['TRACKING-NUMBER'];
  return tracking ? { success: true, tracking } : { success: false, ozonResponse: JSON.stringify(res.data) };
};

const FEMALE_NAMES = new Set(['فاطمة','خديجة','مريم','نور','سارة','هناء','رجاء','إيمان','ايمان','سلمى','سلما','نادية','ليلى','ليلا','أسماء','اسماء','حنان','وفاء','زينب','ريم','شيماء','دنيا','بسمة','بسمه','كوثر','ملاك','روان','لينا','منى','رنا','سكينة','حورية','صفية','عائشة','عايشة','رقية','أمينة','امينة','حفصة','نعيمة','فوزية','زهرة','مليكة','لطيفة','فريدة','نجمة','ثريا','مبروكة','يمنى','رحمة','حليمة','رابحة','إلهام','الهام','شروق','غزلان','هيام','نجوى','سميرة','زكية','رشيدة','جميلة','نجاة','خيرة','مينة','ياسمين','ياسمينة','رانيا','دينا','هدى','هدا','لمياء','وئام','مها','نهى','نها','ألاء','الاء','عبير','غادة','غادا','آية','آيه','اية']);

const getTitle = (name) => {
  if (!name) return '';
  const first = name.trim().split(/\s+/)[0];
  if (first.endsWith('ة') || first.endsWith('ه') || FEMALE_NAMES.has(first)) return `للا ${name}`;
  return `مولاي ${name}`;
};

const confirmAndSendToOzon = async (from, order, finalAddress) => {
  if (websiteOrderTimers[from]) { clearTimeout(websiteOrderTimers[from]); delete websiteOrderTimers[from]; }
  try {
    const result = await addParcelDirect(order, finalAddress);
    if (result.success) {
      const _trackIsFr = (userLangPref[from] === 'french');
      await sendHumanLike(from, _trackIsFr
        ? `✅ Commande confirmée ${order.name}! [PAUSE]📦 Numéro de suivi: *${result.tracking}* [PAUSE]🚚 Livraison sous 24 à 48h [PAUSE]Merci pour ta confiance ❤️`
        : `✅ تم تأكيد طلبك ${getTitle(order.name)}! [PAUSE]📦 رقم التتبع: *${result.tracking}* [PAUSE]🚚 التوصيل ما بين 24 و48 ساعة [PAUSE]شكراً لثقتك ❤️`
      );
      try {
        const msPayload = { secret: SHEET_SECRET, action: 'mark_sent', orderId: order.orderId || '', phone: order.phone, tracking: result.tracking };
        console.log('📋 mark_sent payload:', JSON.stringify(msPayload));
        const msRes = await axios.post(SHEET_API_URL, JSON.stringify(msPayload), { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
        console.log('📋 mark_sent response:', JSON.stringify(msRes.data));
      } catch(se) { console.error('❌ mark_sent sheet:', se.message); }
    } else {
      console.error('❌ Ozon فشل:', result.ozonResponse);
      try { await sendText(ADMIN_PHONE, `⚠️ Ozon فشل\n👤 ${order.name} | 📞 ${order.phone}\n📍 ${order.city} | ${finalAddress}\n💰 ${order.price}\n\n${result.ozonResponse}`); } catch(ae) {}
      await sendHumanLike(from,
        `✅ تم تسجيل طلبك بنجاح! [PAUSE]` +
        `🚚 سيتواصل معك فريقنا قريباً لتأكيد التوصيل [PAUSE]` +
        `شكراً لثقتك ❤️`
      );
    }
  } catch(e) {
    console.error('❌ addParcelDirect:', e.message);
    try { await sendText(ADMIN_PHONE, `⚠️ خطأ Ozon: ${e.message}\n👤 ${order.name} | ${order.phone}`); } catch(ae) {}
    await sendHumanLike(from, `✅ تم تسجيل طلبك — سيتواصل معك فريقنا قريباً 🚚`);
  }
  delete websiteOrders[from];
  delete pendingConfirmations[from];
  orderConfirmed.add(from);
  orderConfirmTimes[from] = Date.now();
  persistState();
};

const markWebsiteOrderStatus = async (waPhone, orderId, status) => {
  try {
    await axios.post(SHEET_API_URL, {
      secret: SHEET_SECRET, action: 'update_order_status',
      phone: waPhone, orderId: orderId || '', status
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
    console.log(`📋 Sheet status → ${status} for ${waPhone}`);
  } catch(e) { console.error('❌ markWebsiteOrderStatus:', e.message); }
};

const handleWebsiteOrder = async (from, text) => {
  const order = websiteOrders[from];
  if (!order) return false;

  if (order.step === 'awaiting_reply') {
    if (text === 'تأكيد الطلب') {
      order.step = 'awaiting_website_time'; persistState();
      await sendInteractiveButtons(from, 'هل تريد تحديد وقت للتوصيل؟ 🕐', ['تحديد وقت', 'أي وقت مناسب']);
    } else if (text === 'تحديد وقت التوصيل') {
      order.step = 'awaiting_delivery_time'; persistState();
      await sendHumanLike(from,
        `🕐 حدد الوقت المناسب للاتصال بك [PAUSE]` +
        `التوصيل ما بين 24 و48 ساعة [PAUSE]` +
        `التوصيل يبدأ من 14h — مثلاً: المساء بعد 16h، بعد 18h، قبل 20h مساءاً`
      );
    } else if (text === 'إلغاء' || text === 'Annuler') {
      if (websiteOrderTimers[from]) { clearTimeout(websiteOrderTimers[from]); delete websiteOrderTimers[from]; }
      await markWebsiteOrderStatus(from, order.orderId, 'pas de réponse');
      await sendText(from, 'تم إلغاء طلبك 😊 يمكنك إعادة الطلب في أي وقت.');
      delete websiteOrders[from]; persistState();
    }
    return true;
  }

  if (order.step === 'awaiting_delivery_time') {
    const noPreference = /أي وقت|اي وقت|الآن|الان|now/.test(text.toLowerCase());
    const finalAddress = noPreference
      ? order.address
      : `${order.address} — وقت: ${text.trim()}`;
    await confirmAndSendToOzon(from, order, finalAddress);
    return true;
  }

  if (order.step === 'awaiting_website_time') {
    if (text === 'تحديد وقت') {
      order.step = 'awaiting_website_time_input'; persistState();
      await sendText(from, '🕐 حدد الوقت المناسب للاتصال بك\nالتوصيل يبدأ من 14h — مثلاً: المساء بعد 16h، بعد 18h، قبل 20h مساءاً');
    } else {
      await confirmAndSendToOzon(from, order, order.address || order.city || 'عنوان التوصيل');
    }
    return true;
  }

  if (order.step === 'awaiting_website_time_input') {
    const _wt = text.trim();
    const finalAddress = `${order.address} — وقت: ${_wt}`;
    await confirmAndSendToOzon(from, order, finalAddress);
    return true;
  }

  return false;
};

app.get('/webhook', (req,res) => { if(req.query['hub.verify_token']===VERIFY_TOKEN) res.send(req.query['hub.challenge']); else res.sendStatus(403); });

app.post('/webhook', async (req,res) => {
  if (!verifySignature(req)) { console.warn('⚠️ Signature غير صحيح'); return res.sendStatus(401); }
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return res.sendStatus(200);
  const from = message.from;
  let text;
  if (message.type === 'text') {
    text = message.text.body;
  } else if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
    text = message.interactive.button_reply.title;
  } else if (message.type === 'button') {
    // template Quick Reply buttons come as type 'button'
    text = message.button?.text;
  } else {
    if (!websiteOrders[from]) { try { await sleep(800); await sendText(from,'أرسل رسالة نصية باش نقدر نساعدك 😊'); } catch(e){} }
    return res.sendStatus(200);
  }
  console.log(`--- رسالة من [${from}]: ${text}`);
  // ✅ إضافة جديدة — منع معالجة نفس الرسالة مرتين (webhook retry)
  if (processedMessages.has(message.id)) { console.warn('⚠️ رسالة مكررة تجاهلها:', message.id); return res.sendStatus(200); }
  processedMessages.add(message.id);
  setTimeout(() => processedMessages.delete(message.id), 5 * 60 * 1000);
  res.sendStatus(200);
  await markAsRead(message.id);

  // ===== WEBSITE ORDER FLOW =====
  if (websiteOrders[from]) {
    try { await handleWebsiteOrder(from, text); } catch(e) { console.error('❌ handleWebsiteOrder:', e.message); }
    return;
  }

  // ===== DELIVERY TIME BUTTONS FLOW =====
  if (deliveryTimeStates[from]) {
    const dts = deliveryTimeStates[from];
    try {
      if (dts.step === 'awaiting_button') {
        const _dtsLang = dts.lang || 'darija';
        const _dtsFr = (_dtsLang === 'french');
        if (text === 'تحديد وقت' || text === 'Fixer horaire') {
          dts.step = 'awaiting_time';
          conversationHistory[from].push({ role: 'user', content: _dtsFr ? 'Oui, je veux fixer un horaire' : 'نعم، أريد تحديد وقت' });
          conversationHistory[from].push({ role: 'assistant', content: _dtsFr ? "Écris l'horaire idéal 🕐" : 'اكتب الوقت المناسب للتوصيل أو الاتصال 🕐' });
          await sendText(from, _dtsFr ? "🕐 Indique l'horaire idéal pour te joindre\nLivraison dès 14h — Ex: après 16h, après 18h, avant 20h le soir" : '🕐 حدد الوقت المناسب للاتصال بك\nالتوصيل يبدأ من 14h — مثلاً: المساء بعد 16h، بعد 18h، قبل 20h مساءاً');
        } else {
          conversationHistory[from].push({ role: 'user', content: _dtsFr ? "N'importe quand" : 'أي وقت مناسب' });
          conversationHistory[from].push({ role: 'assistant', content: _dtsFr ? 'Parfait! Il reste juste le numéro de téléphone 😊 On garde ce numéro?' : 'مزيان! بقى غير رقم الهاتف 😊 واش نخلي هذا الرقم، ولا عندك رقم آخر؟' });
          delete deliveryTimeStates[from];
          await sendText(from, _dtsFr ? `Parfait! 😊\nOn garde ce numéro de téléphone, ou tu en as un autre?` : `مزيان! بقى غير رقم الهاتف 😊\nواش نخلي هذا الرقم، ولا عندك رقم آخر؟`);
        }
      } else if (dts.step === 'awaiting_time') {
        const time = text.trim();
        const _dtsLang2 = dts.lang || 'darija';
        const _dtsFr2 = (_dtsLang2 === 'french');
        deliveryTimes[from] = time;
        conversationHistory[from].push({ role: 'user', content: time });
        conversationHistory[from].push({ role: 'assistant', content: _dtsFr2 ? `Horaire enregistré: ${time} ✅ Il reste juste le numéro. On garde ce numéro?` : `تم تسجيل الوقت: ${time} ✅ بقى غير رقم الهاتف 😊 واش نخلي هذا الرقم، ولا عندك رقم آخر؟` });
        delete deliveryTimeStates[from];
        await sendText(from, _dtsFr2 ? `✅ Horaire enregistré: *${time}*\nIl reste juste le numéro de téléphone 😊\nOn garde ce numéro, ou tu en as un autre?` : `تم تسجيل الوقت: *${time}* ✅\nبقى غير رقم الهاتف 😊\nواش نخلي هذا الرقم، ولا عندك رقم آخر؟`);
      }
    } catch(e) { console.error('❌ deliveryTimeStates:', e.message); }
    return;
  }

  // ===== PENDING CONFIRMATION FLOW (regular chat) =====
  if (pendingConfirmations[from]) {
    const pending = pendingConfirmations[from];
    try {
      if (pending.step === 'awaiting_button') {
        if (text === 'تأكيد الطلب' || text === 'Confirmer') {
          const dt = deliveryTimes[from];
          const replyToSave = dt
            ? pending.reply.replace(/"shipping_address"\s*:\s*"([^"]*)"/, (m, addr) => `"shipping_address": "${addr} — وقت: ${dt}"`)
            : pending.reply;
          delete deliveryTimes[from];
          const result = await saveOrderToSheet(replyToSave, from);
          const phoneDisplay = result?.phone || formatPhone(from);
          const cityFr = result?.city || ''; const cityRaw = result?.rawCity || '';
          let confirmMsg = extractConfirmMsg(pending.reply);
          if (confirmMsg) {
            let msg = confirmMsg.replace('[الهاتف]', phoneDisplay);
            if (cityRaw && cityFr && cityRaw !== cityFr) msg = msg.split(cityRaw).join(cityFr);
            await sendText(from, msg);
          } else {
            const jsonStr = extractOrderJSON(pending.reply);
            let fullMsg = '';
            if (jsonStr) {
              try {
                const od = JSON.parse(jsonStr);
                const cd = od.customer_data || {};
                const pd = od.product_data || {};
                const dtLine = dt ? ` — وقت: ${dt}` : '';
                fullMsg = `✨ شكراً لثقتك في GreatShoes\nتم استلام طلبك ${getTitle(cd.full_name)}، بدأنا تجهيز حذائك.\n📦 ${pd.product_name||'BOTTINE CUIR GS081'} | 🎨 ${pd.color_ar||''} | 📏 ${pd.size||''} | 💰 ${pd.unit_price_mad||'320'} درهم | 🚚 مجاني\n👤 ${cd.full_name||''} | 📞 ${phoneDisplay} | 📍 ${cityFr||cd.city||''} — ${cd.shipping_address||''}${dtLine}\n⏳ سنتواصل معك قريباً لتأكيد التوصيل.\nفريق GreatShoes 🤎`;
              } catch(e) {}
            }
            await sendText(from, fullMsg || `✅ تم تأكيد طلبك!\n📞 ${phoneDisplay}\n🚚 سيتواصل معك فريقنا قريباً\nشكراً لثقتك ❤️`);
          }
          delete pendingConfirmations[from];
        } else if (text === 'تحديد وقت التوصيل' || text === 'Fixer horaire') {
          pending.step = 'awaiting_delivery_time';
          const _dtIsFr = (pending.lang === 'french');
          await sendText(from, _dtIsFr ? "🕐 Indique l'horaire idéal pour te joindre\nLivraison dès 14h — Ex: après 16h, après 18h, avant 20h le soir" : '🕐 حدد الوقت المناسب للاتصال بك\nالتوصيل يبدأ من 14h — مثلاً: المساء بعد 16h، بعد 18h، قبل 20h مساءاً');
        }
      } else if (pending.step === 'awaiting_delivery_time') {
        pending.deliveryTime = text.trim();
        pending.step = 'awaiting_final_confirm';
        await sendInteractiveButtons(from,
          `سيتم إضافة الوقت "${text.trim()}" مع عنوان التوصيل 🕐\nهل تؤكد الطلب؟`,
          ['تأكيد الطلب', 'إلغاء']
        );
      } else if (pending.step === 'awaiting_final_confirm') {
        if (text === 'تأكيد الطلب') {
          const time = pending.deliveryTime || '';
          const modifiedReply = pending.reply.replace(
            /"shipping_address"\s*:\s*"([^"]*)"/,
            (m, addr) => `"shipping_address": "${addr} — وقت: ${time}"`
          );
          const result = await saveOrderToSheet(modifiedReply, from);
          const phoneDisplay = result?.phone || formatPhone(from);
          const cityFr = result?.city || ''; const cityRaw = result?.rawCity || '';
          const confirmMsg = extractConfirmMsg(pending.reply);
          if (confirmMsg) {
            let msg = confirmMsg.replace('[الهاتف]', phoneDisplay);
            if (cityRaw && cityFr && cityRaw !== cityFr) msg = msg.split(cityRaw).join(cityFr);
            await sendText(from, msg);
          } else {
            await sendText(from, `✅ تم تأكيد طلبك!\n🕐 الوقت المحدد: ${time}\n🚚 سيتواصل معك فريقنا قريباً\nشكراً لثقتك ❤️`);
          }
          delete pendingConfirmations[from];
        } else if (text === 'إلغاء' || text === 'Annuler') {
          const _cancelIsFr = (pending.lang === 'french');
          await sendText(from, _cancelIsFr ? 'Commande annulée 😊 Tu peux recommencer quand tu veux.' : 'تم إلغاء الطلب 😊 يمكنك البدء من جديد في أي وقت.');
          try { await saveOrderToSheet(pending.reply, from); await markWebsiteOrderStatus(from, '', 'pas de réponse'); } catch(ce) { console.error('❌ cancel sheet:', ce.message); }
          delete pendingConfirmations[from];
          orderConfirmed.delete(from);
        }
      }
    } catch(e) { console.error('❌ pendingConfirmations handler:', e.message); }
    return;
  }

  // ✅ FIX EMOTIONAL — تعاطف قبل البيع
  if (isEmotionalState(text)) {
    try {
      await sleep(1200);
      await sendText(from, "الله يصبرك 😊 اللحظات الصعبة كتمر — أنا هنا إذا بغيتي تحكي أو نكملو وقت آخر.");
    } catch(e) {}
    return;
  }

  if (isRateLimited(from)) { console.warn(`⚠️ Rate limit لـ ${from}`); return; }
  lastMessageTime[from]=Date.now();
  resetFollowUpTimer(from);
  if (isNotInterested(text)) { notInterested.add(from); if(followUpTimers[from]){clearTimeout(followUpTimers[from]);delete followUpTimers[from];} persistState(); }
  if (!conversationHistory[from]) { conversationHistory[from]=[]; followUpCount[from]=0; }

  // ✅ إضافة جديدة — معالجة pas de réponse
  if (pasDeReponseActive[from]) {
    try {
      if (pasDeReponseActive[from].waitingForSize) {
        const sizeMatch = text.match(/\b(39|40|41|42|43|44)\b/);
        if (sizeMatch) {
          const newSize = sizeMatch[1];
          await sendNewOrderToSheet(pasDeReponseActive[from], newSize, null, null);
          await sendText(from, "✅ ممتاز " + pasDeReponseActive[from].name + " 😊\n\nتم تسجيل طلبية جديدة بمقاس " + newSize + "\nسيتصل بك الليفرور قريباً 🚚\nشكراً لثقتك في GreatShoes 🤎");
          delete pasDeReponseActive[from]; persistState(); return;
        } else {
          await sendText(from, "عفاك أخي — أعطيني المقاس الصح (مثلاً: 42) 😊"); return;
        }
      }
      if (pasDeReponseActive[from].waitingForProduct) {
        await sendNewOrderToSheet(pasDeReponseActive[from], null, text, null);
        await sendText(from, "✅ ممتاز " + pasDeReponseActive[from].name + " 😊\n\nتم تسجيل طلبيتك الجديدة\nسيتصل بك الليفرور قريباً 🚚\nشكراً لثقتك في GreatShoes 🤎");
        delete pasDeReponseActive[from]; persistState(); return;
      }
      await handlePasDeReponse(from, text);
    } catch(e) {
      console.error('❌ خطأ PDR handler:', e.message);
      await sendText(from, "شكراً " + pasDeReponseActive[from]?.name + " 😊\nتم تسجيل ردك — سيتواصل معك الليفرور قريباً 🙏");
    }
    return;
  }

  // ✅ إضافة جديدة — معالجة refusé
  if (refuseActive[from]) {
    try {
      if (refuseActive[from].waitingForSize) {
        const sizeMatch = text.match(/\b(39|40|41|42|43|44)\b/);
        if (sizeMatch) {
          const newSize = sizeMatch[1];
          await sendNewOrderToSheet(refuseActive[from], newSize, null, null);
          await sendText(from, "✅ ممتاز " + refuseActive[from].name + " 😊\n\nتم تجهيز طلبية جديدة بمقاس " + newSize + "\nسيتصل بك الليفرور قريباً 🚚\nشكراً لثقتك في GreatShoes 🤎");
          delete refuseActive[from]; persistState(); return;
        } else {
          await sendText(from, "عفاك أخي — أعطيني المقاس الصح (مثلاً: 42) 😊"); return;
        }
      }
      if (refuseActive[from].waitingForProduct) {
        await sendNewOrderToSheet(refuseActive[from], null, text, null);
        await sendText(from, "✅ ممتاز " + refuseActive[from].name + " 😊\n\nتم تسجيل طلبيتك الجديدة\nسيتصل بك الليفرور قريباً 🚚\nشكراً لثقتك في GreatShoes 🤎");
        delete refuseActive[from]; persistState(); return;
      }
      await handleRefuse(from, text);
    } catch(e) {
      console.error('❌ خطأ Refuse handler:', e.message);
      await sendText(from, "سمح لنا " + refuseActive[from]?.name + " 😊\nواش تقدر تخبرنا علاش رفضتي؟ 🙏");
    }
    return;
  }

  enqueue(from, async () => {
    // ✅ إضافة جديدة — منع إعادة معالجة طلب مؤكد مسبقاً (يمنع التأكيد المزدوج)
    if (orderConfirmed.has(from)) {
      const timeSinceConfirm = Date.now() - (orderConfirmTimes[from] || 0);
      if (timeSinceConfirm > 60 * 60 * 1000) {
        orderConfirmed.delete(from); conversationHistory[from] = []; followUpCount[from] = 0; sentImages.delete(from); delete userLangPref[from]; persistState();
        console.log(`🔄 طلبية جديدة من ${from} — إعادة تعيين`);
      }
      // ✅ بعد التأكيد: نستمر في الحوار بدل الحجب — نضيف ملاحظة لكلود
    }
    if (!sentImages.has(from)) { sentImages.add(from); persistState(); try { await sleep(500); await sendAllImages(from); } catch(e){ console.error('❌ خطأ الصور:', e.response?JSON.stringify(e.response.data):e.message); } }
    conversationHistory[from].push({role:'user',content:text});
    trimHistory(from);
    try {
      await sleep(1500);
      // ✅ كشف طلب تغيير اللغة وحفظه في الجلسة
      if (detectFrenchRequest(text)) { userLangPref[from] = 'french'; persistState(); }
      else if (detectDarijaRequest(text)) { delete userLangPref[from]; persistState(); }
      // ✅ تحديد اللغة: تفضيل الجلسة أولاً، ثم الكشف التلقائي المحسّن
      const _detectedLang = detectLanguage(text);
      const _isFr = isFrenchText(text);
      const lang = userLangPref[from] || (_detectedLang !== 'darija' ? _detectedLang : (_isFr ? 'french' : 'darija'));
      const isGreeting = /^(slm|salam|sala|labas|la bas|bikhir|bkhir|hi|hey|bonjour|bnjr|مرحبا|سلام|لاباس|هلا|صباح الخير|مساء الخير)[\s!،.]*$/i.test(text.trim());
      const greetingHint = isGreeting ? '\n[تحية فقط — رد بتحية قصيرة طبيعية مثل "لاباس وأنت 😊" أو "bikhir wnta" حسب اللغة — جملة واحدة فقط]' : '';
      const _postConfirmNote = orderConfirmed.has(from) ? (lang === 'french' ? '\n[Commande déjà confirmée — réponds normalement — si le client veut ajouter un produit ou modifier sa commande, collecte toutes les infos (nom, ville, adresse, couleur, pointure, prix) et crée une NOUVELLE commande complète indépendante comme si c\'était la première]' : '\n[الطلبية مؤكدة مسبقاً — تحدث معه بشكل طبيعي — إذا طلب منتج إضافي أو تعديل على الطلبية، اجمع كل البيانات (اسم، مدينة، عنوان، لون، مقاس، سعر) وسجّلها كطلبية جديدة كاملة مستقلة]') : '';
      const langNote = lang === 'french'
        ? '\n\n[الزبون يتكلم بالفرنسية — رد بالفرنسية فقط من الآن حتى نهاية المحادثة — جملتان فقط — [PAUSE] واحد فقط]' + greetingHint + _postConfirmNote
        : lang === 'fusha'
        ? '\n\n[الزبون يتكلم بالعربية الفصحى — رد بالفصحى بالحروف العربية — جملتان فقط — [PAUSE] واحد فقط]' + greetingHint + _postConfirmNote
        : '\n\n[رد بالدارجة المغربية بالحروف العربية دائماً — حتى لو كتب الزبون بالحروف اللاتينية — لا فرنسية خالصة — جملتان فقط — [PAUSE] واحد فقط]' + greetingHint + _postConfirmNote;
      const msgsWithLang = conversationHistory[from].slice(0,-1).concat([{role:'user',content:text+langNote}]);
      const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', { model:'claude-haiku-4-5-20251001', max_tokens:500, system:[{type:"text",text:SYSTEM_PROMPT,cache_control:{type:"ephemeral"}}], messages:msgsWithLang }, { headers:{'x-api-key':CLAUDE_API_KEY,'anthropic-version':'2023-06-01','anthropic-beta':'prompt-caching-2024-07-31','content-type':'application/json'} });
      let reply = claudeRes.data.content[0].text;
      // ✅ إضافة جديدة — حذف CONFIRMED_ORDER من التاريخ لتوفير الـ tokens
      const replyForHistory = reply.replace(/CONFIRMED_ORDER:\s*\{[\s\S]*?\}/, '').replace(/ORDER_CONFIRM_MSG_START[\s\S]*?ORDER_CONFIRM_MSG_END/, '').trim();
      conversationHistory[from].push({role:'assistant',content:replyForHistory});
      trimHistory(from); persistState();

      if (reply.includes('[DELIVERY_TIME_QUESTION]')) {
        const cleanReply = reply.replace('[DELIVERY_TIME_QUESTION]', '').trim();
        if (cleanReply) await sendHumanLike(from, cleanReply);
        const _dtsIsFr = (userLangPref[from] === 'french');
        deliveryTimeStates[from] = { step: 'awaiting_button', lang: _dtsIsFr ? 'french' : 'darija' };
        await sleep(600);
        await sendInteractiveButtons(from,
          _dtsIsFr ? 'Tu as un horaire préféré pour la livraison? 🕐' : 'واش عندك وقت مفضل للتوصيل أو الاتصال؟ 🕐',
          _dtsIsFr ? ['Fixer horaire', "N'importe quand"] : ['تحديد وقت', 'أي وقت مناسب']
        );
        return;
      }

      if (reply.includes('CONFIRMED_ORDER:')) {
        orderConfirmed.add(from); orderConfirmTimes[from] = Date.now(); if(followUpTimers[from]){clearTimeout(followUpTimers[from]);delete followUpTimers[from];} persistState();
        console.log(`🎉 طلب مؤكد من ${from}`);
        // Send the summary text first (everything before CONFIRMED_ORDER:)
        const summaryText = reply.split('CONFIRMED_ORDER:')[0]
          .replace(/ORDER_CONFIRM_MSG_START[\s\S]*?ORDER_CONFIRM_MSG_END/g, '')
          .trim();
        if (summaryText) { await sendHumanLike(from, summaryText); await sleep(600); }
        // Extract color for image preview
        const previewJson = extractOrderJSON(reply);
        let colorFrPreview = 'noir';
        try { if (previewJson) { const pd = JSON.parse(previewJson); colorFrPreview = pd.product_data?.color_fr || detectColor(pd.product_data?.color_ar||'') || 'noir'; } } catch(e){}
        if (PRODUCT_IMAGES[colorFrPreview]) { try { await sendWhatsAppImage(from, colorFrPreview); await sleep(800); } catch(e){ console.error('❌ صورة التأكيد:', e.message); } }
        // Store pending and send interactive buttons
        const _btnIsFr = (userLangPref[from] === 'french');
        pendingConfirmations[from] = { reply, step: 'awaiting_button', lang: _btnIsFr ? 'french' : 'darija' };
        await sleep(500);
        await sendInteractiveButtons(from,
          _btnIsFr ? 'Confirmer la commande? 😊' : 'هل تريد تأكيد الطلب؟ 😊',
          _btnIsFr ? ['Confirmer', 'Fixer horaire', 'Annuler'] : ['تأكيد الطلب', 'تحديد وقت التوصيل', 'إلغاء']
        );
        return;
      }

      const colorMatch = reply.match(/\[SEND_IMAGE:(noir|marron|gris)\]/);
      if (colorMatch) { reply=reply.replace(colorMatch[0],'').trim(); try{await sendWhatsAppImage(from,colorMatch[1]);await sleep(500);}catch(e){} }
      else if (reply.includes('[RESEND_IMAGES]')||isInsistingOnImages(text)) { reply=reply.replace('[RESEND_IMAGES]','').trim(); try{await sendAllImages(from);await sleep(500);}catch(e){} }
      else { const color=detectColor(text); const wantsImage=text.toLowerCase().includes('صورة')||text.toLowerCase().includes('شوف')||text.toLowerCase().includes('image'); if(color&&wantsImage){try{await sendWhatsAppImage(from,color);await sleep(500);}catch(e){}} }

      await sendHumanLike(from, reply);
      console.log('✅ تم الإرسال');
    } catch(e) { console.error('❌ خطأ:', e.response?JSON.stringify(e.response.data):e.message); }
  });
});

// ✅ إضافة جديدة — Endpoint pas de réponse
app.post('/set-pas-de-reponse', async (req, res) => {
  try {
    const { secret, phone, trackingNum, name, product, address, size } = req.body;
    if (secret !== SHEET_SECRET) return res.status(401).json({ error: 'unauthorized' });
    const waPhone = formatPhone(phone);
    pasDeReponseActive[waPhone] = { trackingNum, name, product, address: address||'', size: size||'', phone: waPhone };
    persistState();
    schedulePdrFollowup(waPhone);
    console.log(`📝 PDR مسجل للزبون ${waPhone} — تتبع: ${trackingNum}`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ✅ إضافة جديدة — Endpoint refusé
app.post('/set-refuse', async (req, res) => {
  try {
    const { secret, phone, trackingNum, name, product, address, size } = req.body;
    if (secret !== SHEET_SECRET) return res.status(401).json({ error: 'unauthorized' });
    const waPhone = formatPhone(phone);
    refuseActive[waPhone] = { trackingNum, name, product, address: address||'', size: size||'', phone: waPhone };
    persistState();
    scheduleRefuseFollowup(waPhone);
    console.log(`📝 Refuse مسجل للزبون ${waPhone}`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ✅ endpoint لكشف لغة الزبون من Apps Script
app.post('/get-lang', (req, res) => {
  const { phone, secret } = req.body || {};
  if (secret !== BOT_SECRET) return res.json({ error: 'unauthorized' });
  const normalized = String(phone || '').replace(/\s/g, '');
  const waPhone = normalized.startsWith('212') ? normalized : '212' + normalized.replace(/^0/, '');
  res.json({ lang: userLangPref[waPhone] || 'darija' });
});

app.post('/new-website-order', async (req, res) => {
  try {
    const { secret, orderId, name, phone, city, address, product, price, color, size } = req.body;
    if (secret !== SHEET_SECRET) return res.status(401).json({ error: 'unauthorized' });
    const waPhone = formatPhone(phone);
    websiteOrders[waPhone] = {
      orderId: orderId || '', name: name || '', phone: phone || '', waPhone,
      city: city || '', address: address || '',
      product: product || '', price: price || '320',
      color: color || '', size: size || '',
      step: 'awaiting_reply', createdAt: Date.now()
    };
    // منع Claude من تشغيل pendingConfirmations أثناء معالجة الطلب
    delete pendingConfirmations[waPhone];
    orderConfirmed.add(waPhone);
    orderConfirmTimes[waPhone] = Date.now();
    persistState();
    const productDisplay = [product, size, color].filter(Boolean).join(' - ');
    try {
      await sendOrderTemplate(waPhone, name, productDisplay, price || '320');
      console.log(`📤 Template طلب موقع → ${waPhone} (${name})`);
      if (websiteOrderTimers[waPhone]) clearTimeout(websiteOrderTimers[waPhone]);
      websiteOrderTimers[waPhone] = setTimeout(async () => {
        if (websiteOrders[waPhone]) {
          console.log(`⏰ 45 دقيقة بدون رد من ${waPhone}`);
          await markWebsiteOrderStatus(waPhone, orderId, 'pas de réponse');
          try { await sendText(waPhone, `مرحباً سيدي ${name}\nلاحظنا أنك لم تكمل طلبك بعد.\nهل تحتاج مساعدة أو عندك سؤال؟ 😊\nنحن هنا إذا أردت إتمام الطلب أو تغييره`); } catch(se) {}
          delete websiteOrders[waPhone]; persistState();
        }
      }, 45 * 60 * 1000);
    } catch(te) {
      const errStr = JSON.stringify(te.response?.data || '');
      if (te.response?.status === 400 && (errStr.includes('131026') || errStr.includes('not a WhatsApp') || errStr.includes('not registered'))) {
        console.warn(`⚠️ رقم غير موجود على واتساب: ${waPhone}`);
        await markWebsiteOrderStatus(waPhone, orderId, 'تعذر الاتصال به');
        try { await sendText(ADMIN_PHONE, `⚠️ رقم غير على واتساب\n👤 ${name} | 📞 ${phone}`); } catch(ae) {}
      } else { throw te; }
    }
    res.json({ success: true });
  } catch(e) {
    console.error('❌ /new-website-order:', e.message, JSON.stringify(e.response?.data));
    res.status(500).json({ error: e.message, details: e.response?.data });
  }
});

app.get('/', (req,res) => res.json({status:'ok',version:'v18-final'}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 v18 — السيرفر على المنفذ ${PORT}`));
