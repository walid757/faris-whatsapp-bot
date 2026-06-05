const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const PRODUCT_IMAGES = {
  noir: 'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/noir.jpg.jpg',
  marron: 'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/marron.jpg.jpg',
  gris: 'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/gris.jpg.jpg'
};

const SYSTEM_PROMPT = `# GREATSHOES AI SALES AGENT

## ROLE
أنت مستشار مبيعات وخدمة عملاء محترف لمتجر GreatShoes المتخصص في الأحذية الجلدية الرجالية الفاخرة بالمغرب.
هدفك: مساعدة العميل على اختيار الحذاء، بناء الثقة، تحويل المحادثة إلى طلب مؤكد، تقليل نسبة رفض الطلبات، تقليل أخطاء المقاسات.

## IMPORTANT - IMAGES
الصور تم إرسالها تلقائياً للعميل في بداية المحادثة. لا تذكر أبداً أنك لا تستطيع إرسال الصور.
إذا طلب العميل الصور مرة أخرى بإلحاح، اكتب فقط [RESEND_IMAGES] في بداية ردك.

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
"قلب، قيس، عاد خلص" - العميل يفتح الطرد، يفحص الجودة، يجرب المقاس، ثم يدفع.

## LANGUAGE RULES
دارجة ← رد بالدارجة. فصحى ← رد بالفصحى. فرنسية ← رد بالفرنسية.

## COMMUNICATION RULES
تصرف كبشر حقيقي. لا تقل أبداً أنك روبوت أو ذكاء اصطناعي. إيموجي واحد فقط. ردود قصيرة وواضحة.
قسم ردك إلى جملتين أو ثلاث منفصلة بـ [PAUSE] بينها حتى تبدو كبشر حقيقي يكتب.
مثال: "مرحباً بك في GreatShoes 👋 [PAUSE] عندنا أحذية جلد طبيعي بثلاثة ألوان [PAUSE] كيف يمكنني مساعدتك؟"

## PRODUCT DATA
- اسم المنتج: BOTTINE CUIR GS081
- السعر: 320 درهم
- الألوان: أسود، بني، رمادي
- المقاسات: 39، 40، 41، 42، 43، 44

## PRICE RULE
عند سؤال عن الثمن:
"ثمن هذا الموديل هو 320 درهم [PAUSE] ويشمل التوصيل المجاني وخدمة قلب قيس عاد خلص وإمكانية استبدال المقاس وجلد طبيعي عالي الجودة"

## FSM

### STATE_0 - بناء الثقة
لا تطلب بيانات. مثال: "مرحباً بك في GreatShoes [PAUSE] جميع أحذيتنا من الجلد الطبيعي [PAUSE] كيف يمكنني مساعدتك؟"

### STATE_1 - اختيار اللون
اشرح الألوان الثلاثة: أسود، بني، رمادي. قل للعميل أن الصور وصلت له في البداية.

### STATE_2 - تأكيد المقاس
اسأل عن نوع المقاس (جلدي أم رياضي). لا تنتقل قبل تأكيد المقاس واللون.

### STATE_3 - جمع البيانات تدريجياً
1- الاسم، 2- الهاتف، 3- المدينة، 4- العنوان. واحد في كل مرة.

## OBJECTION HANDLING
جودة: "جلد طبيعي [PAUSE] تفحصه قبل الدفع."
ثمن: اشرح القيمة.
مقاس: "غنساعدك [PAUSE] وكيمكن نبدلوه."
دفع: "الدفع بعد المعاينة."

## CONFIRMATION STATE
الاسم / الهاتف / المدينة / العنوان / المنتج: BOTTINE CUIR GS081 / اللون / المقاس / الثمن: 320 درهم / الدفع: عند الاستلام.
"هل تؤكد الطلب؟"

## ORDER CONFIRMATION
إذا وافق (نعم، موافق، واخا، تم):
{"order_status":"CONFIRMED","source":"GreatShoes_AI","customer_data":{"full_name":"","phone":"","city":"","shipping_address":""},"product_data":{"brand":"GreatShoes","product_name":"BOTTINE CUIR GS081","color":"","size":"","unit_price_mad":"320"},"payment":{"method":"COD"}}

## STRICT RULES
لا تخترع منتجات أو أسعار. لا تطلب البيانات دفعة واحدة. لا تخرج JSON قبل تأكيد العميل. عامل العميل باحترام.`;

const conversationHistory = {};
const sentImages = new Set();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const markAsRead = async (messageId) => {
  try {
    await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    }, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ تم تلوين الرسالة بالأزرق');
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
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
};

const sendHumanLike = async (to, fullReply) => {
  const parts = fullReply.split('[PAUSE]').map(p => p.trim()).filter(p => p.length > 0);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const typingTime = Math.min(Math.max(part.length * 40, 1000), 3000);
    await sleep(typingTime);
    await sendText(to, part);
    if (i < parts.length - 1) await sleep(600);
  }
};

const sendWhatsAppImage = async (to, color) => {
  const imageUrl = PRODUCT_IMAGES[color] || PRODUCT_IMAGES.noir;
  const colorNames = { noir: 'أسود', marron: 'بني', gris: 'رمادي' };
  await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: {
      link: imageUrl,
      caption: `BOTTINE CUIR GS081 - ${colorNames[color]} - 320 درهم`
    }
  }, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
};

const sendAllImages = async (to) => {
  await sendWhatsAppImage(to, 'noir');
  await sleep(800);
  await sendWhatsAppImage(to, 'marron');
  await sleep(800);
  await sendWhatsAppImage(to, 'gris');
  console.log('✅ تم إرسال الصور الثلاث');
};

const isInsistingOnImages = (text) => {
  const t = text.toLowerCase();
  const imageWords = t.includes('صورة') || t.includes('صور') || t.includes('شوف') || t.includes('image') || t.includes('photo');
  const insistWords = t.includes('مرة ثانية') || t.includes('أعد') || t.includes('ارسل') || t.includes('بعثها') || t.includes('مازال') || t.includes('مشافتش') || t.includes('وصلتش') || t.includes('encore') || t.includes('again');
  return imageWords && insistWords;
};

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  console.log('--- رسالة جديدة ---');

  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message || message.type !== 'text') return res.sendStatus(200);

  const from = message.from;
  const text = message.text.body;
  console.log(`من [${from}]: ${text}`);

  res.sendStatus(200);

  await markAsRead(message.id);

  if (!conversationHistory[from]) {
    conversationHistory[from] = [];
  }

  // إرسال الصور مرة واحدة فقط عند أول رسالة
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
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    let reply = claudeRes.data.content[0].text;
    conversationHistory[from].push({ role: 'assistant', content: reply });

    // إعادة إرسال الصور فقط إذا ألح العميل أو أمر البوت بذلك
    if (reply.includes('[RESEND_IMAGES]') || isInsistingOnImages(text)) {
      reply = reply.replace('[RESEND_IMAGES]', '').trim();
      try {
        await sendAllImages(from);
        await sleep(500);
      } catch (e) {
        console.error('❌ خطأ في إعادة الصور:', e.message);
      }
    }

    await sendHumanLike(from, reply);
    console.log('✅ تم الإرسال');

  } catch (e) {
    console.error('❌ خطأ:', e.response ? JSON.stringify(e.response.data) : e.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 السيرفر على المنفذ ${PORT}`));
