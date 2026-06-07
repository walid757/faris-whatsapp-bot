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
const ADMIN_PHONE      = '212641902149';

const OZON_BASE        = "https://api.ozonexpress.ma/customers";
const OZON_CUSTOMER_ID = "80238";
const OZON_API_KEY     = "75c42e-b5f35e-22f865-80ac38-a8a2fd";
const SHEET_API_URL    = "https://script.google.com/macros/s/AKfycbyaMpplLlF9e8M_45BJBnqqaTxHcRjS51sDxvcPBbcvp4dpPO-J2BNwXYlhyLrbTNCA/exec";

const PRODUCT_IMAGES = {
  noir:   'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/noir.jpg',
  marron: 'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/marron.jpg',
  gris:   'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/gris.jpg'
};

// ═══════════════════════════════════════════
// ✅ STATE
// ═══════════════════════════════════════════
const STATE_FILE = path.join(__dirname, 'bot_state.json');
const loadState = () => {
  try { if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch (e) { console.error('⚠️ خطأ في تحميل الحالة:', e.message); }
  return { sentImages:[], orderConfirmed:[], notInterested:[], followUpCount:{}, conversationHistory:{}, pasDeReponse:{}, refuseActive:{} };
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
const _state              = loadState();
const sentImages          = new Set(_state.sentImages     || []);
const orderConfirmed      = new Set(_state.orderConfirmed || []);
const notInterested       = new Set(_state.notInterested  || []);
const followUpCount       = _state.followUpCount          || {};
const conversationHistory = _state.conversationHistory    || {};
const pasDeReponseActive  = _state.pasDeReponse           || {};
const refuseActive        = _state.refuseActive           || {};

// timers للمتابعة
const pdrTimers     = {};
const refuseTimers  = {};

const persistState = () => saveState({
  sentImages:[...sentImages],
  orderConfirmed:[...orderConfirmed],
  notInterested:[...notInterested],
  followUpCount,
  conversationHistory,
  pasDeReponse: pasDeReponseActive,
  refuseActive,
});

const userQueues = {}, userLocks = {};
const enqueue = (from, fn) => { if (!userQueues[from]) userQueues[from]=[]; userQueues[from].push(fn); if(!userLocks[from]) processQueue(from); };
const processQueue = async (from) => { if(userLocks[from]) return; userLocks[from]=true; while(userQueues[from]?.length>0){const fn=userQueues[from].shift();try{await fn();}catch(e){console.error('❌ Queue:',e.message);}} userLocks[from]=false; };

const MAX_HISTORY = 10;
const trimHistory = (from) => { if(conversationHistory[from]?.length>MAX_HISTORY) conversationHistory[from]=conversationHistory[from].slice(-MAX_HISTORY); };

const rateLimitMap = {};
const isRateLimited = (from) => { const now=Date.now(); const e=rateLimitMap[from]||{count:0,resetAt:now+60000}; if(now>e.resetAt){e.count=0;e.resetAt=now+60000;} e.count++; rateLimitMap[from]=e; return e.count>10; };

// ═══════════════════════════════════════════
// ✅ SYSTEM PROMPT
// ═══════════════════════════════════════════
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

## 84 SKILLS — استخدم مهارة واحدة فقط في كل رسالة

### مجموعة 1: مبادئ سيالديني
1.RECIPROCITY أعطِ قبل أن تطلب | 2.COMMITMENT ابنِ موافقات صغيرة | 3.SOCIAL_PROOF "الأكثر طلباً هذا الشهر" | 4.AUTHORITY "5 سنين تخصص" | 5.LIKING امدح بصدق | 6.SCARCITY "بقى غير 2" | 7.UNITY "عائلة GreatShoes"

### مجموعة 2: نظريات القرار
8.PROSPECT_THEORY | 9.LOSS_AVERSION | 10.ANCHORING | 11.DECOY | 12.MENTAL_ACCOUNTING | 13.CERTAINTY | 14.TEMPORAL_DISCOUNTING

### مجموعة 3: علم النفس المعرفي
15.ZEIGARNIK | 16.COGNITIVE_LOAD | 17.PARADOX_OF_CHOICE | 18.PRIMING | 19.FLUENCY | 20.INFORMATION_GAP | 21.REACTANCE

### مجموعة 4: بناء الثقة
22.TRUST_VELOCITY | 23.PRATFALL | 24.AUTONOMY | 25.RECIPROCITY_PLUS | 26.PEAK_END | 27.WEBER'S_LAW

### مجموعة 5: الإقناع العاطفي
28.STORYTELLING | 29.FUTURE_PACING | 30.NARRATIVE_TRANSPORTATION | 31.EMOTIONAL_ANCHORING | 32.NOSTALGIA | 33.IDENTIFIABLE_VICTIM | 34.OPTIMISM_BIAS

### مجموعة 6: الهوية الاجتماعية
35.SOCIAL_COMPARISON | 36.SOCIAL_IDENTITY | 37.SOCIAL_NORMS | 38.HERDING | 39.SYMBOLIC_SELF | 40.SELF_PERCEPTION | 41.PYGMALION

### مجموعة 7: تقنيات الإغلاق
42.FOOT_IN_DOOR | 43.DOOR_IN_FACE | 44.MICRO_COMMITMENT | 45.PROGRESSIVE_COMMITMENT | 46.COMMITMENT_LADDER | 47.GOAL_GRADIENT | 48.SUNK_COST

### مجموعة 8: إدارة الاعتراضات
49.BOOMERANG | 50.COGNITIVE_DISSONANCE | 51.PAIN_POINTS | 52.MIRROR | 53.ELM | 54.EMOTIONAL_INTELLIGENCE | 55.MORAL_LICENSING

### مجموعة 9: التوقيت والبيئة
56.FOMO | 57.SCARCITY_TIME | 58.FRESH_START | 59.MERE_EXPOSURE | 60.PAIN_OF_PAYING | 61.STATUS_QUO

### مجموعة 10: التصميم والاختيار
62.CHOICE_ARCHITECTURE | 63.CONTRAST_EFFECT | 64.VON_RESTORFF | 65.IKEA_EFFECT | 66.BEN_FRANKLIN | 67.HYPER_PERSONALIZATION

### مجموعة 11: الكفاءة والتحفيز
68.SELF_EFFICACY | 69.POSITIVE_REINFORCEMENT | 70.BABY_STEPS | 71.ENDOWMENT | 72.AUTONOMY_BIAS | 73.OPTIMISM | 74.AUTHORITY_BIAS | 75.RECIPROCAL_CONCESSION

### مجموعة 12: مهارات متقدمة
76.ANTHROPOMORPHIC | 77.MASSIFICATION_PREV | 78.SIZING_ANXIETY | 79.RESERVATION_24H | 80.EMOTIONAL_ABSORPTION | 81.DORMANT_REACTIVATION | 82.TACTILE_LANGUAGE | 83.BRAND_VOICE | 84.ABANDONED_CART

## FSM
STATE_0: "أهلاً بيك 😊 [PAUSE] عندنا قاعدة: قلب، قيس، عاد خلص — بدون مخاطرة. [PAUSE] كيف نعاونك؟"
STATE_1: Anchoring+Contrast+SocialProof — اشرح الألوان الثلاثة
STATE_2: نصيحة مجانية عن المقاسات + اسأل المقاس
STATE_3: اجمع الاسم ثم المدينة ثم العنوان — واحد في كل مرة

## PHONE
بعد الاسم+المدينة+العنوان: "[الاسم]، بقى غير رقم الهاتف 😊 [PAUSE] واش نخلي هذا الرقم، ولا عندك رقم آخر؟"
موافقة → PHONE_FROM_WHATSAPP | رقم جديد → استخدمه

## PRICE
"320 درهم [PAUSE] مقارنة بالسوق 600-1000 — استثنائي ويشمل التوصيل+قلب قيس عاد خلص+استبدال المقاس"

## CONFIRMATION
خلينا نتأكدو:
👟 BOTTINE CUIR GS081 | 🎨 [اللون] | 📏 [المقاس] | 💰 320 درهم | 🚚 مجاني-دفع عند الاستلام | 👤 [الاسم] | 📍 [المدينة]-[العنوان]
واش تأكد الطلب؟

## ORDER CONFIRMATION
عند أي موافقة (نعم/آه/أكيد/واخا/oui/ok/👍):
CONFIRMED_ORDER:{"order_status":"CONFIRMED","source":"GreatShoes_AI","customer_data":{"full_name":"[الاسم]","phone":"[PHONE_FROM_WHATSAPP أو الرقم]","city":"[المدينة بالفرنسية]","shipping_address":"[العنوان بالفرنسية]"},"product_data":{"brand":"GreatShoes","product_name":"BOTTINE CUIR GS081","color_ar":"[اللون بالعربية]","color_fr":"[noir/marron/gris]","size":"[المقاس]","unit_price_mad":"320"},"payment":{"method":"COD"}}

ORDER_CONFIRM_MSG_START
✨ شكراً لثقتك في GreatShoes
تم استلام طلبك، بدأنا تجهيز حذائك.
📦 BOTTINE CUIR GS081 | 🎨 [اللون] | 📏 [المقاس] | 💰 320 درهم | 🚚 مجاني
👤 [الاسم] | 📞 [الهاتف] | 📍 [المدينة]-[العنوان]
⏳ سنتواصل معك قريباً لتأكيد الطلب.
فريق GreatShoes 🤎
ORDER_CONFIRM_MSG_END

## FOLLOW-UP
نوع1: مزحة دارجة | نوع2: سؤال يفتح المحادثة | نوع3: معلومة مفاجئة | نوع4: قصة زبون | نوع5: وداع+عرض أخير
[PAUSE] بين الجمل. إيموجي واحد.

## RULES
مهارة واحدة فقط. لا تخترع منتجات أو أسعار. لا تطلب البيانات دفعة واحدة. لا تخرج JSON قبل تأكيد الزبون. لا ترسل CONFIRMED_ORDER للزبون.`;

// ═══════════════════════════════════════════
// ✅ PROMPT pas de réponse
// ═══════════════════════════════════════════
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

// ═══════════════════════════════════════════
// ✅ PROMPT refusé
// ═══════════════════════════════════════════
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const SILENCE_TIMEOUT  = 30 * 60 * 1000;
const PDR_FOLLOWUP_1   =  2 * 60 * 60 * 1000; // ساعتين
const PDR_FOLLOWUP_2   = 24 * 60 * 60 * 1000; // 24 ساعة
const MAX_FOLLOWUPS    = 2;
const followUpTimers   = {};
const lastMessageTime  = {};

const formatPhone = (p) => { p=String(p).trim().replace(/\s/g,'').replace(/\+/g,''); if(p.startsWith('212')) return p; if(p.startsWith('0')) return '212'+p.slice(1); if(p.length===9) return '212'+p; return '212'+p; };

const markAsRead = async (messageId) => { try { await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,{messaging_product:'whatsapp',status:'read',message_id:messageId},{headers:{'Authorization':`Bearer ${WHATSAPP_TOKEN}`,'Content-Type':'application/json'}}); } catch(e){} };

const sendText = async (to, text) => { await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,{messaging_product:'whatsapp',to,text:{body:text}},{headers:{'Authorization':`Bearer ${WHATSAPP_TOKEN}`,'Content-Type':'application/json'}}); };

const sendHumanLike = async (to, fullReply) => { const parts=fullReply.split('[PAUSE]').map(p=>p.trim()).filter(p=>p.length>0); for(let i=0;i<parts.length;i++){const t=Math.min(Math.max(parts[i].length*40,1000),3000);await sleep(t);await sendText(to,parts[i]);if(i<parts.length-1)await sleep(600);} };

const sendWhatsAppImage = async (to, color) => { const n={noir:'أسود',marron:'بني',gris:'رمادي'}; await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,{messaging_product:'whatsapp',to,type:'image',image:{link:PRODUCT_IMAGES[color],caption:`BOTTINE CUIR GS081 - ${n[color]} - 320 درهم`}},{headers:{'Authorization':`Bearer ${WHATSAPP_TOKEN}`,'Content-Type':'application/json'}}); };

const sendAllImages = async (to) => { await sendWhatsAppImage(to,'noir');await sleep(800);await sendWhatsAppImage(to,'marron');await sleep(800);await sendWhatsAppImage(to,'gris'); };

const detectColor = (text) => { const t=text.toLowerCase(); if(t.includes('noir')||t.includes('أسود')||t.includes('اسود')||t.includes('كحل')) return 'noir'; if(t.includes('marron')||t.includes('بني')||t.includes('قهوي')) return 'marron'; if(t.includes('gris')||t.includes('رمادي')||t.includes('rmadi')) return 'gris'; return null; };

const isInsistingOnImages = (text) => { const t=text.toLowerCase(); return (t.includes('صورة')||t.includes('صور')||t.includes('image'))&&(t.includes('مرة ثانية')||t.includes('مشافتش')||t.includes('وصلتش')||t.includes('encore')||t.includes('كلهم')); };

const isEmotionalState = (text) => { const t=text.toLowerCase(); return t.includes("حزين")||t.includes("تعبان")||t.includes("مشكلة")||t.includes("خصام")||t.includes("زوجة")||t.includes("مريض")||t.includes("توفي")||t.includes("ضغط")||t.includes("بكيت")||t.includes("صعيب"); };

const isNotInterested = (text) => { const t=text.toLowerCase(); return t.includes('مش غادي نشري')||t.includes('ما بغيتش')||t.includes('لا شكراً')||t.includes('لا شكرا')||t.includes('pas intéressé')||t.includes('no thanks')||t.includes('مش محتاج')||t.includes('وقفو')||t.includes('بغيت نوقف'); };

// ═══════════════════════════════════════════
// ✅ جيب رقم الليفرور من أوزون
// ═══════════════════════════════════════════
const getLivreurFromOzon = async (trackingNum) => {
  try {
    const url = `${OZON_BASE}/${OZON_CUSTOMER_ID}/${OZON_API_KEY}/tracking`;
    const formData = new URLSearchParams();
    formData.append('tracking-number', trackingNum);
    const res = await axios.post(url, formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 8000
    });
    const history = res.data?.TRACKING?.HISTORY;
    if (!history) return { name: '', phone: '' };
    for (const key of Object.keys(history)) {
      const entry   = history[key];
      const statut  = String(entry.STATUT || '').toLowerCase();
      const comment = String(entry.COMMENT || '');
      if (statut.includes('mise en distribution') && comment.includes('Livreur:')) {
        const nameMatch  = comment.match(/Livreur:\s*([^|<]+)/);
        const phoneMatch = comment.match(/Téléphone:\s*([\d]+)/);
        return {
          name : nameMatch  ? nameMatch[1].trim() : '',
          phone: phoneMatch ? phoneMatch[1].trim() : '',
        };
      }
    }
    return { name: '', phone: '' };
  } catch(e) {
    console.error('❌ getLivreurFromOzon:', e.message);
    return { name: '', phone: '' };
  }
};

// ═══════════════════════════════════════════
// ✅ إرسال طلبية جديدة للشيت
// ═══════════════════════════════════════════
const sendNewOrderToSheet = async (info, newSize, newProduct, newColor) => {
  try {
    const colorFr  = newColor || detectColor(info.product) || 'noir';
    const size     = newSize  || info.size || '';
    const variant  = size && colorFr ? `${size}/${colorFr}` : '';
    const payload  = {
      secret   : SHEET_SECRET,
      full_name: info.name,
      phone    : info.phone || '',
      city     : info.city  || '',
      address  : info.address || '',
      price    : '320',
      product  : newProduct || info.product || 'BOTTINE CUIR GS081',
      color    : variant,
      size     : '',
    };
    const response = await axios.post(SHEET_API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    console.log('📤 طلبية جديدة للشيت:', response.status);
    return true;
  } catch(e) {
    console.error('❌ خطأ إرسال الشيت:', e.message);
    return false;
  }
};

// ═══════════════════════════════════════════
// ✅ متابعة pas de réponse — ساعتين
// ═══════════════════════════════════════════
const schedulePdrFollowup = (from) => {
  if (pdrTimers[from]) { clearTimeout(pdrTimers[from]); }

  // متابعة 1 — بعد ساعتين
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

    // متابعة 2 — بعد 24 ساعة
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

      // إلغاء تلقائي
      delete pasDeReponseActive[from];
      delete pdrTimers[from];
      persistState();
      console.log(`🗑️ تم إلغاء PDR للزبون ${from}`);
    }, PDR_FOLLOWUP_2);

  }, PDR_FOLLOWUP_1);
};

// ═══════════════════════════════════════════
// ✅ متابعة refusé — ساعتين
// ═══════════════════════════════════════════
const scheduleRefuseFollowup = (from) => {
  if (refuseTimers[from]) { clearTimeout(refuseTimers[from]); }

  // متابعة 1 — بعد ساعتين
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

    // متابعة 2 — بعد 24 ساعة
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

      // إلغاء تلقائي
      delete refuseActive[from];
      delete refuseTimers[from];
      persistState();
      console.log(`🗑️ تم إلغاء Refuse للزبون ${from}`);
    }, PDR_FOLLOWUP_2);

  }, PDR_FOLLOWUP_1);
};

// ═══════════════════════════════════════════
// ✅ معالجة pas de réponse
// ═══════════════════════════════════════════
const handlePasDeReponse = async (from, text) => {
  const info          = pasDeReponseActive[from];
  const trackingNum   = info.trackingNum;
  const customerName  = info.name;
  const customerPhone = formatPhone(from);
  const address       = info.address || '';
  const size          = info.size    || '';

  // إلغاء timer المتابعة لأن الزبون رد
  if (pdrTimers[from]) { clearTimeout(pdrTimers[from]); delete pdrTimers[from]; }

  const prompt = PDR_PROMPT
    .replace('{NAME}',     customerName)
    .replace('{PRODUCT}',  info.product)
    .replace('{TRACKING}', trackingNum)
    .replace('{ADDRESS}',  address)
    .replace('{REPLY}',    text);

  const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-sonnet-4-6', max_tokens: 700,
    messages: [{ role: 'user', content: prompt }]
  }, { headers: { 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' } });

  const claudeReply  = claudeRes.data.content[0].text;
  const caseMatch    = claudeReply.match(/DETECTED_CASE:\s*(\d+)/);
  const detectedCase = caseMatch ? parseInt(caseMatch[1]) : 15;
  const customerMsg  = claudeReply.replace(/DETECTED_CASE:\s*\d+\n?/, '').trim();

  // جيب رقم الليفرور
  const livreur = await getLivreurFromOzon(trackingNum);

  // أرسل للزبون
  await sendHumanLike(from, customerMsg);

  // إذا عندنا رقم الليفرور — أضفه للرسالة
  if (livreur.phone && [1,4,7].includes(detectedCase)) {
    await sleep(1000);
    await sendText(from, "📞 رقم الليفرور: " + livreur.phone + "\nتقدر تتصل بيه مباشرة 🙏");
  }

  switch(detectedCase) {

    case 1: // حدد وقت → أشعر الليفرور
    case 7: // هاتف مطفأ → أشعر الليفرور
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone),
          "📦 GreatShoes — معلومة مهمة\n\n" +
          "👤 " + customerName + " | 📞 " + customerPhone + "\n" +
          "📦 " + trackingNum + "\n" +
          "🕐 رد الزبون: " + text + "\n\n" +
          (detectedCase === 1 ? "✅ الزبون حدد وقت مناسب — يرجى التواصل معه 🙏" : "📱 الهاتف كان مطفأ — يرجى إعادة الاتصال 🙏")
        );
      }
      delete pasDeReponseActive[from];
      persistState();
      break;

    case 2: // مسافر → حجز + جدول متابعة
      schedulePdrFollowup(from);
      break;

    case 3: // غير العنوان → أشعر الليفرور بالعنوان الجديد
      // الليفرور سيُشعر بعد ما يعطي الزبون العنوان الجديد في الرسالة التالية
      break;

    case 4: // الليفرور ما اتصلش → أشعر الليفرور
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone),
          "⚠️ GreatShoes — إعادة اتصال مطلوبة\n\n" +
          "👤 " + customerName + " | 📞 " + customerPhone + "\n" +
          "📦 " + trackingNum + "\n" +
          "💬 الزبون يقول أنك ما اتصلت به — يرجى الاتصال فوراً 🙏"
        );
      }
      delete pasDeReponseActive[from];
      persistState();
      break;

    case 5: // يريد إلغاء → يقنعه مرة واحدة ثم يلغي
      schedulePdrFollowup(from);
      break;

    case 8: // عنوان ناقص → أشعر الأدمين
      await sendText(ADMIN_PHONE,
        "📍 عنوان ناقص\n\n" +
        "👤 " + customerName + " | 📞 " + customerPhone + "\n" +
        "📦 " + trackingNum + "\n" +
        "💬 رد الزبون: " + text
      );
      break;

    case 9: // تأجيل → أشعر الليفرور
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone),
          "⏳ GreatShoes — تأجيل التسليم\n\n" +
          "👤 " + customerName + " | 📞 " + customerPhone + "\n" +
          "📦 " + trackingNum + "\n" +
          "🕐 رد الزبون: " + text
        );
      }
      break;

    case 10: // اشترى من مكان آخر → إلغاء مباشر
      delete pasDeReponseActive[from];
      persistState();
      break;

    case 11: // لا يحتاجه → متابعة واحدة ثم إلغاء
      schedulePdrFollowup(from);
      break;

    case 12: // مشكل مع الليفرور → أشعر الليفرور
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone),
          "⚠️ GreatShoes — شكوى زبون\n\n" +
          "👤 " + customerName + " | 📞 " + customerPhone + "\n" +
          "📦 " + trackingNum + "\n" +
          "💬 الزبون: " + text + "\n\n" +
          "يرجى التواصل معه بأدب 🙏"
        );
      }
      break;

    case 13: // مقاس غلط → طلبية جديدة
      // البوت ينتظر المقاس الجديد في الرسالة التالية
      // نحتفظ بالـ pasDeReponseActive مع flag
      pasDeReponseActive[from].waitingForSize = true;
      persistState();
      break;

    case 14: // تبديل المنتج → طلبية جديدة
      pasDeReponseActive[from].waitingForProduct = true;
      persistState();
      break;

    case 15: // غير واضح → إلغاء مباشر بعد المتابعة
      schedulePdrFollowup(from);
      break;

    default:
      schedulePdrFollowup(from);
      break;
  }
};

// ═══════════════════════════════════════════
// ✅ معالجة refusé
// ═══════════════════════════════════════════
const handleRefuse = async (from, text) => {
  const info          = refuseActive[from];
  const trackingNum   = info.trackingNum;
  const customerName  = info.name;
  const customerPhone = formatPhone(from);

  // إلغاء timer المتابعة لأن الزبون رد
  if (refuseTimers[from]) { clearTimeout(refuseTimers[from]); delete refuseTimers[from]; }

  const prompt = REFUSE_PROMPT
    .replace('{NAME}',     customerName)
    .replace('{PRODUCT}',  info.product)
    .replace('{TRACKING}', trackingNum)
    .replace('{ADDRESS}',  info.address || '')
    .replace('{SIZE}',     info.size    || '')
    .replace('{REPLY}',    text);

  const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-sonnet-4-6', max_tokens: 700,
    messages: [{ role: 'user', content: prompt }]
  }, { headers: { 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' } });

  const claudeReply  = claudeRes.data.content[0].text;
  const caseMatch    = claudeReply.match(/DETECTED_CASE:\s*(\d+)/);
  const detectedCase = caseMatch ? parseInt(caseMatch[1]) : 16;
  const customerMsg  = claudeReply.replace(/DETECTED_CASE:\s*\d+\n?/, '').trim();

  const livreur = await getLivreurFromOzon(trackingNum);

  // أرسل للزبون
  await sendHumanLike(from, customerMsg);

  switch(detectedCase) {

    case 1: // ما عجبوش → يقنعه + ينتظر
      scheduleRefuseFollowup(from);
      break;

    case 2: // مشكل جودة → طلبية استبدال جديدة
      await sendNewOrderToSheet(info, info.size, info.product, null);
      await sleep(1000);
      await sendText(from, "✅ تم تجهيز طلبية الاستبدال — سيتصل بك الليفرور قريباً 🙏");
      delete refuseActive[from];
      persistState();
      break;

    case 3: // مقاس غلط → ينتظر المقاس الجديد
      refuseActive[from].waitingForSize = true;
      persistState();
      break;

    case 4: // مشكل ليفرور → أشعر الليفرور + اعرض ليفرور آخر
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone),
          "⚠️ GreatShoes — شكوى زبون رفض\n\n" +
          "👤 " + customerName + " | 📞 " + customerPhone + "\n" +
          "📦 " + trackingNum + "\n" +
          "💬 الزبون: " + text
        );
      }
      scheduleRefuseFollowup(from);
      break;

    case 5: // سعر غالي → يقنعه
      scheduleRefuseFollowup(from);
      break;

    case 6: // ظرف شخصي → حجز + متابعة
      scheduleRefuseFollowup(from);
      break;

    case 7: // هاتف مطفأ → أشعر الليفرور
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone),
          "📱 GreatShoes — إعادة توصيل\n\n" +
          "👤 " + customerName + " | 📞 " + customerPhone + "\n" +
          "📦 " + trackingNum + "\n" +
          "✅ الزبون متاح الآن 🙏"
        );
      }
      delete refuseActive[from];
      persistState();
      break;

    case 8: // عنوان ناقص → أشعر الأدمين
      await sendText(ADMIN_PHONE,
        "📍 عنوان ناقص — رفض\n\n" +
        "👤 " + customerName + " | 📞 " + customerPhone + "\n" +
        "📦 " + trackingNum + "\n" +
        "💬 " + text
      );
      break;

    case 9: // تأجيل → أشعر الليفرور
      if (livreur.phone) {
        await sendText(formatPhone(livreur.phone),
          "⏳ GreatShoes — تأجيل\n\n" +
          "👤 " + customerName + " | 📞 " + customerPhone + "\n" +
          "📦 " + trackingNum + "\n" +
          "🕐 " + text
        );
      }
      delete refuseActive[from];
      persistState();
      break;

    case 10: // اشترى من مكان آخر → إلغاء مباشر
      delete refuseActive[from];
      persistState();
      break;

    case 11: // لا يحتاجه → متابعة واحدة ثم إلغاء
      scheduleRefuseFollowup(from);
      break;

    case 12: // تأخر التوصيل → يقنعه
      scheduleRefuseFollowup(from);
      break;

    case 13: // مقاس غلط → ينتظر المقاس الجديد
      refuseActive[from].waitingForSize = true;
      persistState();
      break;

    case 14: // تبديل المنتج → ينتظر تفاصيل المنتج الجديد
      refuseActive[from].waitingForProduct = true;
      persistState();
      break;

    case 15: // يريد إلغاء → متابعة أخيرة ثم إلغاء
      scheduleRefuseFollowup(from);
      break;

    case 16: // غير واضح → إلغاء مباشر
      delete refuseActive[from];
      persistState();
      break;

    default:
      scheduleRefuseFollowup(from);
      break;
  }
};

const extractOrderJSON = (reply) => { const marker='CONFIRMED_ORDER:'; const idx=reply.indexOf(marker); if(idx===-1) return null; const after=reply.substring(idx+marker.length).trimStart(); let depth=0,start=-1; for(let i=0;i<after.length;i++){if(after[i]==='{'){if(depth===0)start=i;depth++;}else if(after[i]==='}'){depth--;if(depth===0&&start!==-1)return after.substring(start,i+1);}} return null; };

const saveOrderToSheet = async (reply, fromPhone) => {
  try {
    const jsonStr = extractOrderJSON(reply);
    if (!jsonStr) return {success:false,colorFr:null};
    const orderData = JSON.parse(jsonStr);
    const customer  = orderData.customer_data || {};
    const product   = orderData.product_data  || {};
    const rawPhone  = customer.phone || '';
    const phone = (rawPhone==='PHONE_FROM_WHATSAPP'||rawPhone===''||rawPhone==='غير محدد') ? formatPhone(fromPhone) : formatPhone(rawPhone);
    const colorFr = product.color_fr || detectColor(product.color_ar||'') || 'noir';
    const size    = product.size || '';
    const variant = size&&colorFr ? `${size}/${colorFr}` : '';
    const payload = {secret:SHEET_SECRET,full_name:customer.full_name||'',phone,city:customer.city||'',address:customer.shipping_address||'',price:product.unit_price_mad||'320',product:product.product_name||'BOTTINE CUIR GS081',color:variant,size:''};
    const response = await axios.post(SHEET_API_URL, payload, {headers:{'Content-Type':'application/json'},timeout:10000});
    return {success:true,colorFr,phone,name:customer.full_name};
  } catch(err) { return {success:false,colorFr:null,phone:formatPhone(fromPhone)}; }
};

const extractConfirmMsg = (reply) => { const start=reply.indexOf('ORDER_CONFIRM_MSG_START'); const end=reply.indexOf('ORDER_CONFIRM_MSG_END'); if(start!==-1&&end!==-1) return reply.substring(start+'ORDER_CONFIRM_MSG_START'.length,end).trim(); return null; };

const sendFollowUp = async (from) => {
  if (orderConfirmed.has(from)||notInterested.has(from)) return;
  if (!conversationHistory[from]||conversationHistory[from].length===0) return;
  const count=followUpCount[from]||0;
  if (count>=MAX_FOLLOWUPS){delete followUpTimers[from];return;}
  followUpCount[from]=count+1; persistState();
  try {
    const followUpPrompt = count<MAX_FOLLOWUPS-1
      ? `العميل صمت 30 دقيقة. متابعة إبداعية رقم ${count+1} من ${MAX_FOLLOWUPS}. أسلوب مختلف. [PAUSE] بين الجمل.`
      : `آخر رسالة. وداع لطيف مع عرض أخير. [PAUSE] بين الجمل.`;
    const claudeRes = await axios.post('https://api.anthropic.com/v1/messages',{model:'claude-sonnet-4-6',max_tokens:400,system:[{type:"text",text:SYSTEM_PROMPT,cache_control:{type:"ephemeral"}}],messages:[...conversationHistory[from],{role:'user',content:followUpPrompt}]},{headers:{'x-api-key':CLAUDE_API_KEY,'anthropic-version':'2023-06-01','anthropic-beta':'prompt-caching-2024-07-31','content-type':'application/json'}});
    await sendHumanLike(from, claudeRes.data.content[0].text);
    if (count+1<MAX_FOLLOWUPS) followUpTimers[from]=setTimeout(()=>sendFollowUp(from),SILENCE_TIMEOUT);
  } catch(e){console.error('❌ خطأ المتابعة:',e.message);}
};

const resetFollowUpTimer = (from) => { if(followUpTimers[from]){clearTimeout(followUpTimers[from]);delete followUpTimers[from];} if(!orderConfirmed.has(from)&&!notInterested.has(from)) followUpTimers[from]=setTimeout(()=>sendFollowUp(from),SILENCE_TIMEOUT); };

const verifySignature = (req) => { if(!APP_SECRET) return true; const sig=req.headers['x-hub-signature-256']; if(!sig) return false; const expected='sha256='+crypto.createHmac('sha256',APP_SECRET).update(JSON.stringify(req.body)).digest('hex'); return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)); };

app.get('/webhook', (req,res) => { if(req.query['hub.verify_token']===VERIFY_TOKEN) res.send(req.query['hub.challenge']); else res.sendStatus(403); });

app.post('/webhook', async (req,res) => {
  if (!verifySignature(req)) return res.sendStatus(401);
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return res.sendStatus(200);
  if (message.type!=='text'){
    const from=message.from;
    try{await sleep(800);await sendText(from,'أرسل رسالة نصية باش نقدر نساعدك 😊');}catch(e){}
    return res.sendStatus(200);
  }
  const from = message.from;
  const text = message.text.body;
  console.log(`--- رسالة من [${from}]: ${text}`);
  res.sendStatus(200);
  await markAsRead(message.id);

  if (isEmotionalState(text)){
    try{await sleep(1200);await sendText(from,'الله يصبرك 😊 اللحظات الصعبة كتمر — أنا هنا إذا بغيتي تحكي أو نكملو وقت آخر.');}catch(e){}
    return;
  }
  if (isRateLimited(from)) return;

  lastMessageTime[from]=Date.now();
  resetFollowUpTimer(from);
  if (isNotInterested(text)){notInterested.add(from);if(followUpTimers[from]){clearTimeout(followUpTimers[from]);delete followUpTimers[from];}persistState();}
  if (!conversationHistory[from]){conversationHistory[from]=[];followUpCount[from]=0;}

  // ✅ معالجة pas de réponse
  if (pasDeReponseActive[from]) {
    try {
      // هل البوت ينتظر مقاس جديد؟
      if (pasDeReponseActive[from].waitingForSize) {
        const sizeMatch = text.match(/\b(39|40|41|42|43|44)\b/);
        if (sizeMatch) {
          const newSize = sizeMatch[1];
          await sendNewOrderToSheet(pasDeReponseActive[from], newSize, null, null);
          await sendText(from,
            "✅ ممتاز " + pasDeReponseActive[from].name + " 😊\n\n" +
            "تم تسجيل طلبية جديدة بمقاس " + newSize + "\n" +
            "سيتصل بك الليفرور قريباً 🚚\n" +
            "شكراً لثقتك في GreatShoes 🤎"
          );
          delete pasDeReponseActive[from];
          persistState();
          return;
        } else {
          await sendText(from, "عفاك أخي — أعطيني المقاس الصح (مثلاً: 42) 😊");
          return;
        }
      }

      // هل البوت ينتظر منتج جديد؟
      if (pasDeReponseActive[from].waitingForProduct) {
        await sendNewOrderToSheet(pasDeReponseActive[from], null, text, null);
        await sendText(from,
          "✅ ممتاز " + pasDeReponseActive[from].name + " 😊\n\n" +
          "تم تسجيل طلبيتك الجديدة\n" +
          "سيتصل بك الليفرور قريباً 🚚\n" +
          "شكراً لثقتك في GreatShoes 🤎"
        );
        delete pasDeReponseActive[from];
        persistState();
        return;
      }

      await handlePasDeReponse(from, text);
    } catch(e) {
      console.error('❌ خطأ PDR handler:', e.message);
      await sendText(from, "شكراً " + pasDeReponseActive[from]?.name + " 😊\nتم تسجيل ردك — سيتواصل معك الليفرور قريباً 🙏");
    }
    return;
  }

  // ✅ معالجة refusé
  if (refuseActive[from]) {
    try {
      // هل البوت ينتظر مقاس جديد؟
      if (refuseActive[from].waitingForSize) {
        const sizeMatch = text.match(/\b(39|40|41|42|43|44)\b/);
        if (sizeMatch) {
          const newSize = sizeMatch[1];
          await sendNewOrderToSheet(refuseActive[from], newSize, null, null);
          await sendText(from,
            "✅ ممتاز " + refuseActive[from].name + " 😊\n\n" +
            "تم تجهيز طلبية جديدة بمقاس " + newSize + "\n" +
            "سيتصل بك الليفرور قريباً 🚚\n" +
            "شكراً لثقتك في GreatShoes 🤎"
          );
          delete refuseActive[from];
          persistState();
          return;
        } else {
          await sendText(from, "عفاك أخي — أعطيني المقاس الصح (مثلاً: 42) 😊");
          return;
        }
      }

      // هل البوت ينتظر منتج جديد؟
      if (refuseActive[from].waitingForProduct) {
        await sendNewOrderToSheet(refuseActive[from], null, text, null);
        await sendText(from,
          "✅ ممتاز " + refuseActive[from].name + " 😊\n\n" +
          "تم تسجيل طلبيتك الجديدة\n" +
          "سيتصل بك الليفرور قريباً 🚚\n" +
          "شكراً لثقتك في GreatShoes 🤎"
        );
        delete refuseActive[from];
        persistState();
        return;
      }

      await handleRefuse(from, text);
    } catch(e) {
      console.error('❌ خطأ Refuse handler:', e.message);
      await sendText(from, "سمح لنا " + refuseActive[from]?.name + " 😊\nواش تقدر تخبرنا علاش رفضتي؟ 🙏");
    }
    return;
  }

  enqueue(from, async () => {
    if (!sentImages.has(from)){sentImages.add(from);persistState();try{await sleep(500);await sendAllImages(from);}catch(e){}}
    conversationHistory[from].push({role:'user',content:text});
    trimHistory(from);
    try {
      await sleep(1500);
      const claudeRes = await axios.post('https://api.anthropic.com/v1/messages',{model:'claude-sonnet-4-6',max_tokens:600,system:[{type:"text",text:SYSTEM_PROMPT,cache_control:{type:"ephemeral"}}],messages:conversationHistory[from]},{headers:{'x-api-key':CLAUDE_API_KEY,'anthropic-version':'2023-06-01','anthropic-beta':'prompt-caching-2024-07-31','content-type':'application/json'}});
      let reply = claudeRes.data.content[0].text;
      conversationHistory[from].push({role:'assistant',content:reply});
      trimHistory(from); persistState();

      if (reply.includes('CONFIRMED_ORDER:')){
        orderConfirmed.add(from);if(followUpTimers[from]){clearTimeout(followUpTimers[from]);delete followUpTimers[from];}persistState();
        const result=await saveOrderToSheet(reply,from);
        const colorFr=(result&&result.colorFr)?result.colorFr:'noir';
        if(PRODUCT_IMAGES[colorFr]){try{await sleep(500);await sendWhatsAppImage(from,colorFr);await sleep(1000);}catch(e){}}
        const confirmMsg=extractConfirmMsg(reply);
        if(confirmMsg){const phoneDisplay=(result&&result.phone)?result.phone:formatPhone(from);await sendText(from,confirmMsg.replace('{{phone}}',phoneDisplay));}
        return;
      }

      const colorMatch=reply.match(/\[SEND_IMAGE:(noir|marron|gris)\]/);
      if(colorMatch){reply=reply.replace(colorMatch[0],'').trim();try{await sendWhatsAppImage(from,colorMatch[1]);await sleep(500);}catch(e){}}
      else if(reply.includes('[RESEND_IMAGES]')||isInsistingOnImages(text)){reply=reply.replace('[RESEND_IMAGES]','').trim();try{await sendAllImages(from);await sleep(500);}catch(e){}}
      else{const color=detectColor(text);const wantsImage=text.toLowerCase().includes('صورة')||text.toLowerCase().includes('شوف')||text.toLowerCase().includes('image');if(color&&wantsImage){try{await sendWhatsAppImage(from,color);await sleep(500);}catch(e){}}}

      await sendHumanLike(from,reply);
    } catch(e){console.error('❌ خطأ:',e.response?JSON.stringify(e.response.data):e.message);}
  });
});

// ✅ Endpoint — يسجل pas de réponse
app.post('/set-pas-de-reponse', async (req, res) => {
  try {
    const { secret, phone, trackingNum, name, product, address, size } = req.body;
    if (secret !== SHEET_SECRET) return res.status(401).json({ error: 'unauthorized' });
    const waPhone = formatPhone(phone);
    pasDeReponseActive[waPhone] = { trackingNum, name, product, address: address||'', size: size||'', phone: waPhone };
    persistState();
    schedulePdrFollowup(waPhone);
    console.log(`📝 PDR مسجل للزبون ${waPhone}`);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ✅ Endpoint — يسجل refusé
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

app.get('/', (req,res) => res.json({status:'ok',version:'v20-smart'}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 v20 — السيرفر على المنفذ ${PORT}`));
