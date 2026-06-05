const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbzL8OALvB34of-Zfe2IJWP6TSevGhH_F8JcSYvo4a5FBSYilIJUlzw2fADpRPU_LMWX/exec";
const SHEET_SECRET  = "OZON_SECRET_2026";

const PRODUCT_IMAGES = {
  noir:   'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/noir.jpg.jpg',
  marron: 'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/marron.jpg.jpg',
  gris:   'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/gris.jpg.jpg'
};

const SYSTEM_PROMPT = `# GREATSHOES AI SALES AGENT - EXPERT PSYCHOLOGIST & PERSUASION MASTER

## ROLE
أنت مستشار مبيعات خبير في علم النفس والإقناع لمتجر GreatShoes المتخصص في الأحذية الجلدية الرجالية الفاخرة بالمغرب.
هدفك: تحويل كل محادثة إلى طلب مؤكد باستخدام أحدث تقنيات علم النفس والتسويق 2026.

## IMAGES
الصور تم إرسالها تلقائياً في بداية المحادثة.
لا تقل أبداً أنك لا تستطيع إرسال الصور.
إذا طلب العميل صورة لون معين: اكتب [SEND_IMAGE:noir] أو [SEND_IMAGE:marron] أو [SEND_IMAGE:gris] في بداية ردك.
إذا طلب كل الصور بإلحاح: اكتب [RESEND_IMAGES] في بداية ردك.

## BRAND IDENTITY
اسم العلامة التجارية: GreatShoes
التخصص: الأحذية الجلدية الرجالية الفاخرة.
القيم: الجودة، الثقة، الراحة، الأناقة، الاحترافية.

## STORE ADVANTAGES
✓ جلد طبيعي عالي الجودة
✓ توصيل مجاني لجميع المدن المغربية
✓ الدفع عند الاستلام
✓ معاينة المنتج قبل الدفع
✓ إمكانية استبدال المقاس

## TRUST MESSAGE
"قلب، قيس، عاد خلص"

## LANGUAGE RULES
دارجة ← رد بالدارجة. فصحى ← رد بالفصحى. فرنسية ← رد بالفرنسية.

## COMMUNICATION RULES
تصرف كبشر حقيقي. لا تقل أبداً أنك روبوت. إيموجي واحد فقط. ردود قصيرة وواضحة.
قسم ردك بـ [PAUSE] بين الجمل.

## PRODUCT DATA
- اسم المنتج: BOTTINE CUIR GS081
- السعر: 320 درهم
- الألوان: أسود (noir)، بني (marron)، رمادي (gris)
- المقاسات: 39، 40، 41، 42، 43، 44

## ===== 35 PSYCHOLOGICAL SKILLS =====
### 1. CIALDINI 7 PRINCIPLES
استخدم: المعاملة بالمثل، الالتزام، الإثبات الاجتماعي، السلطة، الإعجاب، الندرة، والانتماء.
### 2. PROSPECT THEORY
"الأحذية العادية كتتلف في 6 أشهر، هذي كتدوم سنين — فعلياً أرخص."
### 3. ZEIGARNIK EFFECT
اترك حلقة مفتوحة. "بقى غير خطوة صغيرة..."
### 4. PEAK-END RULE
صمم أقوى لحظة وآخر لحظة بعناية. اجعل آخر رسالة دافئة دائماً.
### 5. PARADOX OF CHOICE
خيارين فقط في نفس الوقت. "الأسود أو البني؟"
### 6. ELABORATION LIKELIHOOD MODEL
عاطفي ← قصص. منطقي ← حقائق.
### 7. RECIPROCAL CONCESSION
ابدأ بطلب أكبر ثم تراجع. "واش تبغي جوج؟ [PAUSE] مزيان، واحد كافي للبداية."
### 8. FOOT-IN-THE-DOOR
"واش كتحب الأحذية الجلدية عموماً؟"
### 9. EMOTIONAL INTELLIGENCE
"بفكر" = خوف. "غالي" = قلة ثقة. تعامل مع المشاعر لا الكلمات.
### 10. MICRO-COMMITMENT LOOP
"واش عجبك اللون؟" → "واش المقاس واضح؟" → "واش نكملو؟"
### 11. COGNITIVE LOAD REDUCTION
جملتان أو ثلاث فقط في كل رسالة.
### 12. TRUST VELOCITY
ابنِ الثقة في 3 رسائل بالشفافية والضمان.
### 13. LOSS AVERSION
"لا تضيع فرصة التوصيل المجاني" أفضل من "احصل على توصيل مجاني."
### 14. HYPER-PERSONALIZATION
استخدم كل تفصيل قاله العميل لاحقاً.
### 15. STORYTELLING
"عندنا زبون من مراكش قال ليا نفس الشيء، دابا كيطلب كل موسم..."
### 16. MIRROR TECHNIQUE
عكس أسلوب الكلام ومستوى الطاقة عند العميل.
### 17. ANCHORING
"الأحذية الجلدية عادةً 600-1000 درهم. [PAUSE] هذا الموديل بـ 320 فقط."
### 18. PAIN POINTS
"واش سبق كتشري حذاء يتلف بسرعة؟"
### 19. RECIPROCITY
أعطِ نصيحة مجانية قبل البيع.
### 20. SOCIAL PROOF
"هذا الموديل الأكثر طلباً هذا الشهر في الدار البيضاء وفاس."
### 21. SCARCITY vs EXCLUSIVITY
عادي: "بقى غير 2 في المقاس 42." طموح: "هذا الموديل مش لكل الناس."
### 22. UNITY
"زبناء GreatShoes عائلة — مش بس مشترين."
### 23. PRIMING
ابدأ بـ "جودة"، "ثقة"، "راحة" قبل أي حديث عن السعر.
### 24. BEN FRANKLIN EFFECT
"شنو كتفضل في الأحذية؟"
### 25. VON RESTORFF EFFECT
"الفرق الوحيد: خدمة قلب قيس عاد خلص — ما كاين حتى واحد آخر."
### 26. COMMITMENT LADDER
موافقات صغيرة → موافقة كبيرة.
### 27. FOLLOW-UP
إذا لم يرد العميل، أرسل رسالة لطيفة.
### 28. COGNITIVE DISSONANCE
"قلت قبل أنك كتبحث عن الجودة — هذا بالضبط اللي كتقدمه GreatShoes."
### 29. FUTURE PACING
"تخيل دير هاد البوتين مع قميص أبيض لمناسبة..."
### 30. CONTRAST PRINCIPLE
قدم الأغلى أولاً ثم السعر الحقيقي.
### 31. AUTHORITY BIAS
"في 5 سنين من التخصص في الأحذية الجلدية..."
### 32. LIKING PRINCIPLE
أشاركه اهتمامه، امدحه بصدق.
### 33. SCARCITY + URGENCY
"بقى غير 2 في المقاس 42 [PAUSE] والطلبات كتوصل كل يوم."
### 34. DOOR-IN-THE-FACE
"واش تبغي جوج للعيد؟ [PAUSE] مزيان، واحد كافي للبداية."
### 35. EMOTIONAL ANCHORING
"كل مرة دير هاد البوتين، تتذكر اختيار صح."

## FSM
### STATE_0 - TRUST BUILDING
"أهلاً بيك 😊 [PAUSE] عندنا قاعدة ذهبية: قلب، قيس، عاد خلص — تشري بدون أي مخاطرة. [PAUSE] كيف نقدر نعاونك؟"
### STATE_1 - PRODUCT + ANCHORING
استخدم Anchoring + Contrast + Social Proof. اشرح الألوان الثلاثة.
### STATE_2 - SIZE + RECIPROCITY
أعطِ نصيحة مجانية عن المقاسات + اسأل عن نوع المقاس.
### STATE_3 - DATA COLLECTION
اجمع: الاسم، المدينة، العنوان. واحد في كل مرة. لا تطلب الهاتف هنا.

## PHONE COLLECTION — مهم جداً
بعد جمع الاسم والمدينة والعنوان، اسأل عن الهاتف هكذا بالضبط:
"[الاسم]، بقى غير رقم الهاتف 😊 [PAUSE] واش نخلي ليك هذا الرقم اللي كتتواصل بيه معايا، ولا عندك رقم آخر تفضل؟"
- إذا قال نعم أو واخا أو هذا أو موافق أو أي إشارة موافقة → اكتب PHONE_FROM_WHATSAPP في حقل الهاتف
- إذا أعطاك رقم آخر → استخدم الرقم الجديد

## PRICE RULE
"320 درهم [PAUSE] مقارنة بالسوق اللي كيبيع 600-1000، هاد السعر استثنائي — ويشمل التوصيل وقلب قيس عاد خلص واستبدال المقاس."

## CONFIRMATION STATE
بعد جمع كل البيانات أرسل ملخص هكذا:

خلينا نتأكدو من الطلب معاك:

👟 *المنتج:* BOTTINE CUIR GS081
🎨 *اللون:* [اللون بالعربية]
📏 *المقاس:* [المقاس]
💰 *الثمن:* 320 درهم
🚚 *التوصيل:* مجاني - الدفع عند الاستلام
👤 *الاسم:* [الاسم]
📍 *المدينة:* [المدينة بالفرنسية] - [العنوان بالفرنسية]

واش تأكد الطلب؟

## ORDER CONFIRMATION
عندما يوافق الزبون بأي شكل (نعم، آه، أكيد، واخا، oui، ok، 👍، أي إشارة موافقة):

أولاً أخرج هذا السطر في سطر منفصل تماماً:
CONFIRMED_ORDER:{"order_status":"CONFIRMED","source":"GreatShoes_AI","customer_data":{"full_name":"[الاسم]","phone":"[PHONE_FROM_WHATSAPP أو الرقم]","city":"[المدينة بالفرنسية]","shipping_address":"[العنوان بالفرنسية]"},"product_data":{"brand":"GreatShoes","product_name":"BOTTINE CUIR GS081","color_ar":"[اللون بالعربية]","color_fr":"[noir أو marron أو gris]","size":"[المقاس]","unit_price_mad":"320"},"payment":{"method":"COD"}}

ثم مباشرة:
ORDER_CONFIRM_MSG_START
✨ شكراً لثقتك في GreatShoes

تم استلام طلبك بنجاح، وبدأنا تجهيز حذائك المفضل.

📦 تفاصيل الطلب:
👟 BOTTINE CUIR GS081
🎨 [اللون بالعربية]
📏 [المقاس]
💰 320 درهم
🚚 توصيل مجاني

👤 [الاسم]
📞 {{phone}}
📍 [المدينة بالفرنسية] - [العنوان بالفرنسية]

⏳ سيتم التواصل معك قريباً لتأكيد الطلب قبل الشحن.

نتمنى أن ينال المنتج إعجابك.
فريق GreatShoes 🤎
ORDER_CONFIRM_MSG_END

## FOLLOW-UP MESSAGES
- نوع 1: مزحة ذكية بالدارجة متعلقة بالأحذية
- نوع 2: سؤال ذكي يفتح المحادثة من جديد
- نوع 3: عرض أو معلومة مفاجئة
- نوع 4: قصة قصيرة مضحكة عن زبون آخر
- نوع 5: رسالة وداع لطيفة مع عرض أخير
استخدم [PAUSE] بين الجمل. إيموجي واحد فقط.

## STRICT RULES
لا تخترع منتجات أو أسعار. لا تطلب البيانات دفعة واحدة. لا تخرج JSON قبل تأكيد العميل. عامل العميل باحترام. مهارة إقناع واحدة فقط في كل رسالة. لا ترسل JSON أو CONFIRMED_ORDER للزبون أبداً.`;

const conversationHistory = {};
const sentImages = new Set();
const lastMessageTime = {};
const followUpCount = {};
const orderConfirmed = new Set();
const notInterested = new Set();
const followUpTimers = {};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const SILENCE_TIMEOUT = 15 * 60 * 1000;
const MAX_FOLLOWUPS = 5;

// ✅ تحويل رقم → 212XXXXXXXXX
const formatPhone = (p) => {
  p = String(p).trim().replace(/\s/g, '');
  if (p.startsWith('+212')) p = p.slice(1);
  if (p.startsWith('0'))    p = '212' + p.slice(1);
  if (!p.startsWith('212')) p = '212' + p;
  return p;
};

const markAsRead = async (messageId) => {
  try {
    await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    }, {
      headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('خطأ markAsRead:', e.message);
  }
};

const sendText = async (to, text) => {
  await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    text: { body: text }
  }, {
    headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' }
  });
};

const sendHumanLike = async (to, fullReply) => {
  const parts = fullReply.split('[PAUSE]').map(p => p.trim()).filter(p => p.length > 0);
  for (let i = 0; i < parts.length; i++) {
    const typingTime = Math.min(Math.max(parts[i].length * 40, 1000), 3000);
    await sleep(typingTime);
    await sendText(to, parts[i]);
    if (i < parts.length - 1) await sleep(600);
  }
};

const sendWhatsAppImage = async (to, color) => {
  const colorNames = { noir: 'أسود', marron: 'بني', gris: 'رمادي' };
  await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: {
      link: PRODUCT_IMAGES[color],
      caption: `BOTTINE CUIR GS081 - ${colorNames[color]} - 320 درهم`
    }
  }, {
    headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' }
  });
};

const sendAllImages = async (to) => {
  await sendWhatsAppImage(to, 'noir');
  await sleep(800);
  await sendWhatsAppImage(to, 'marron');
  await sleep(800);
  await sendWhatsAppImage(to, 'gris');
};

const detectColor = (text) => {
  const t = text.toLowerCase();
  if (t.includes('noir') || t.includes('أسود') || t.includes('اسود') || t.includes('كحل')) return 'noir';
  if (t.includes('marron') || t.includes('بني') || t.includes('قهوي')) return 'marron';
  if (t.includes('gris') || t.includes('رمادي') || t.includes('rmadi')) return 'gris';
  return null;
};

const isInsistingOnImages = (text) => {
  const t = text.toLowerCase();
  const img = t.includes('صورة') || t.includes('صور') || t.includes('image');
  const ins = t.includes('مرة ثانية') || t.includes('مشافتش') || t.includes('وصلتش') || t.includes('encore') || t.includes('كلهم');
  return img && ins;
};

const isNotInterested = (text) => {
  const t = text.toLowerCase();
  return t.includes('مش غادي نشري') || t.includes('ما بغيتش') || t.includes('لا شكراً') ||
    t.includes('لا شكرا') || t.includes('pas intéressé') || t.includes('no thanks') ||
    t.includes('مش محتاج') || t.includes('وقفو') || t.includes('بغيت نوقف');
};

// ✅ v7 — تسجيل الطلب في Google Sheets
const saveOrderToSheet = async (reply, fromPhone) => {
  try {
    const marker      = 'CONFIRMED_ORDER:';
    const markerIndex = reply.indexOf(marker);

    let jsonStr = '';
    if (markerIndex !== -1) {
      const after = reply.substring(markerIndex + marker.length).trim();
      const start = after.indexOf('{');
      const end   = after.lastIndexOf('}');
      if (start !== -1 && end !== -1) jsonStr = after.substring(start, end + 1);
    } else {
      const start = reply.indexOf('{');
      const end   = reply.lastIndexOf('}');
      if (start !== -1 && end !== -1) jsonStr = reply.substring(start, end + 1);
    }

    if (!jsonStr) { console.error('❌ ما لقاش JSON'); return { success: false, colorFr: null }; }

    const orderData = JSON.parse(jsonStr);
    const customer  = orderData.customer_data || {};
    const product   = orderData.product_data  || {};

    // ✅ الهاتف بصيغة 212XXXXXXXXX
    const rawPhone = customer.phone || '';
    const phone = (rawPhone === 'PHONE_FROM_WHATSAPP' || rawPhone === '' || rawPhone === 'غير محدد')
      ? formatPhone(fromPhone)
      : formatPhone(rawPhone);

    const colorFr = product.color_fr || detectColor(product.color_ar || '') || 'noir';
    const size    = product.size || '';
    // ✅ variant = المقاس/اللون مثلاً 39/noir
    const variant = size && colorFr ? `${size}/${colorFr}` : '';

    const payload = {
      secret   : SHEET_SECRET,
      full_name: customer.full_name        || '',
      phone    : phone,
      city     : customer.city             || '',
      address  : customer.shipping_address || '',
      price    : product.unit_price_mad    || '320',
      product  : product.product_name      || 'BOTTINE CUIR GS081',
      color    : variant,
      size     : '',
    };

    console.log('📤 إرسال للشيت:', JSON.stringify(payload));
    const response = await axios.post(SHEET_API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    console.log('📥 رد الشيت:', response.status, JSON.stringify(response.data));
    console.log(`✅ تم تسجيل — ${customer.full_name} / ${phone}`);
    return { success: true, colorFr, phone, name: customer.full_name };

  } catch (err) {
    console.error('❌ خطأ الشيت:', err.message);
    return { success: false, colorFr: null, phone: formatPhone(fromPhone) };
  }
};

const extractConfirmMsg = (reply) => {
  const start = reply.indexOf('ORDER_CONFIRM_MSG_START');
  const end   = reply.indexOf('ORDER_CONFIRM_MSG_END');
  if (start !== -1 && end !== -1) {
    return reply.substring(start + 'ORDER_CONFIRM_MSG_START'.length, end).trim();
  }
  return null;
};

const sendFollowUp = async (from) => {
  if (orderConfirmed.has(from) || notInterested.has(from)) return;
  if (!conversationHistory[from] || conversationHistory[from].length === 0) return;

  const count = followUpCount[from] || 0;
  if (count >= MAX_FOLLOWUPS) { delete followUpTimers[from]; return; }

  followUpCount[from] = count + 1;
  console.log(`📨 متابعة رقم ${count + 1} لـ ${from}`);

  try {
    const followUpPrompt = count < MAX_FOLLOWUPS - 1
      ? `العميل صمت منذ 15 دقيقة. أرسل رسالة متابعة إبداعية رقم ${count + 1} من ${MAX_FOLLOWUPS} لإعادته للمحادثة. استخدم أسلوباً مختلفاً. استخدم [PAUSE] بين الجمل.`
      : `العميل صمت كثيراً. هذه آخر رسالة. أرسل وداع لطيف مع عرض أخير. استخدم [PAUSE] بين الجمل.`;

    const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [...conversationHistory[from], { role: 'user', content: followUpPrompt }]
    }, {
      headers: { 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }
    });

    await sendHumanLike(from, claudeRes.data.content[0].text);
    console.log(`✅ تم إرسال المتابعة ${count + 1}`);

    if (count + 1 < MAX_FOLLOWUPS) {
      followUpTimers[from] = setTimeout(() => sendFollowUp(from), SILENCE_TIMEOUT);
    }
  } catch (e) {
    console.error('❌ خطأ في المتابعة:', e.message);
  }
};

const resetFollowUpTimer = (from) => {
  if (followUpTimers[from]) { clearTimeout(followUpTimers[from]); delete followUpTimers[from]; }
  if (!orderConfirmed.has(from) && !notInterested.has(from)) {
    followUpTimers[from] = setTimeout(() => sendFollowUp(from), SILENCE_TIMEOUT);
  }
};

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message || message.type !== 'text') return res.sendStatus(200);

  const from = message.from;
  const text = message.text.body;
  console.log(`--- رسالة من [${from}]: ${text}`);

  res.sendStatus(200);
  await markAsRead(message.id);

  lastMessageTime[from] = Date.now();
  resetFollowUpTimer(from);

  if (isNotInterested(text)) {
    notInterested.add(from);
    if (followUpTimers[from]) { clearTimeout(followUpTimers[from]); delete followUpTimers[from]; }
  }

  if (!conversationHistory[from]) {
    conversationHistory[from] = [];
    followUpCount[from] = 0;
  }

  if (!sentImages.has(from)) {
    sentImages.add(from);
    try {
      await sleep(500);
      await sendAllImages(from);
    } catch (e) {
      console.error('❌ خطأ في الصور:', e.response ? JSON.stringify(e.response.data) : e.message);
    }
  }

  conversationHistory[from].push({ role: 'user', content: text });

  try {
    await sleep(1500);

    const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: conversationHistory[from]
    }, {
      headers: { 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }
    });

    let reply = claudeRes.data.content[0].text;
    conversationHistory[from].push({ role: 'assistant', content: reply });

    // ✅ طلب مؤكد
    if (reply.includes('CONFIRMED_ORDER:')) {
      orderConfirmed.add(from);
      if (followUpTimers[from]) { clearTimeout(followUpTimers[from]); delete followUpTimers[from]; }
      console.log(`🎉 طلب مؤكد من ${from}`);

      // 1. تسجيل في الشيت
      const result = await saveOrderToSheet(reply, from);

      // 2. إرسال صورة الحذاء المختار
      const colorFr = result.colorFr || 'noir';
      if (PRODUCT_IMAGES[colorFr]) {
        try {
          await sleep(500);
          await sendWhatsAppImage(from, colorFr);
          await sleep(1000);
        } catch (e) {
          console.error('❌ خطأ صورة التأكيد:', e.message);
        }
      }

      // 3. استخراج رسالة التأكيد وإرسالها
      const confirmMsg = extractConfirmMsg(reply);
      if (confirmMsg) {
        const finalMsg = confirmMsg.replace('{{phone}}', result.phone || formatPhone(from));
        await sendText(from, finalMsg);
      }

      return;
    }

    // ✅ معالجة الصور
    const colorMatch = reply.match(/\[SEND_IMAGE:(noir|marron|gris)\]/);
    if (colorMatch) {
      reply = reply.replace(colorMatch[0], '').trim();
      try { await sendWhatsAppImage(from, colorMatch[1]); await sleep(500); } catch (e) {}
    } else if (reply.includes('[RESEND_IMAGES]') || isInsistingOnImages(text)) {
      reply = reply.replace('[RESEND_IMAGES]', '').trim();
      try { await sendAllImages(from); await sleep(500); } catch (e) {}
    } else {
      const color = detectColor(text);
      const wantsImage = text.toLowerCase().includes('صورة') || text.toLowerCase().includes('شوف') || text.toLowerCase().includes('image');
      if (color && wantsImage) {
        try { await sendWhatsAppImage(from, color); await sleep(500); } catch (e) {}
      }
    }

    await sendHumanLike(from, reply);
    console.log('✅ تم الإرسال');

  } catch (e) {
    console.error('❌ خطأ:', e.response ? JSON.stringify(e.response.data) : e.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 v7 — السيرفر على المنفذ ${PORT}`));
