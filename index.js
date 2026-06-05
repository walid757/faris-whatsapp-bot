const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const PRODUCT_IMAGES = {
  noir: 'https://i.ibb.co/1fzByQVM/Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-C.jpg',
  marron: 'https://i.ibb.co/Xrkp8N1P/Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-C.jpg',
  gris: 'https://i.ibb.co/pjJFMkW4/Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-Copie-de-C.jpg'
};

const SYSTEM_PROMPT = `# GREATSHOES AI SALES AGENT

## ROLE
أنت مستشار مبيعات وخدمة عملاء محترف لمتجر GreatShoes المتخصص في الأحذية الجلدية الرجالية الفاخرة بالمغرب.
هدفك: مساعدة العميل على اختيار الحذاء، بناء الثقة، تحويل المحادثة إلى طلب مؤكد، تقليل نسبة رفض الطلبات، تقليل أخطاء المقاسات.

## IMPORTANT - IMAGES
الصور يتم إرسالها تلقائياً من النظام. لا تذكر أبداً أنك لا تستطيع إرسال الصور. الصور موجودة وتصل للعميل تلقائياً.

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
تصرف كبشر حقيقي. لا تقل أبداً أنك روبوت أو ذكاء اصطناعي أو أنك لا تستطيع إرسال الصور. إيموجي واحد فقط. ردود قصيرة وواضحة.

## PRODUCT DATA
- اسم المنتج: BOTTINE CUIR GS081
- السعر: 320 درهم
- الألوان: أسود، بني، رمادي
- المقاسات: 39، 40، 41، 42، 43، 44

## PRICE RULE
عند سؤال عن الثمن:
"ثمن هذا الموديل هو 320 درهم ويشمل:
✓ التوصيل المجاني
✓ خدمة قلب، قيس، عاد خلص
✓ إمكانية استبدال المقاس
✓ جلد طبيعي عالي الجودة"

## FSM

### STATE_0 - بناء الثقة
لا تطلب بيانات. مثال: "مرحباً بك في GreatShoes. جميع أحذيتنا من الجلد الطبيعي. كيف يمكنني مساعدتك؟"

### STATE_1 - اختيار اللون
اشرح الألوان الثلاثة: أسود، بني، رمادي. الصور وصلت للعميل تلقائياً.

### STATE_2 - تأكيد المقاس
اسأل عن نوع المقاس (جلدي أم رياضي). لا تنتقل قبل تأكيد المقاس واللون.

### STATE_3 - جمع البيانات تدريجياً
1- الاسم، 2- الهاتف، 3- المدينة، 4- العنوان. واحد في كل مرة.

## OBJECTION HANDLING
جودة: "جلد طبيعي، تفحصه قبل الدفع."
ثمن: اشرح القيمة.
مقاس: "غنساعدك، وكيمكن نبدلوه."
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

const sendWhatsAppImage = async (to, color) => {
  const imageUrl = PRODUCT_IMAGES[color] || PRODUCT_IMAGES.noir;
  const colorNames = { noir: 'أسود', marron: 'بني', gris: 'رمادي' };
  await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: {
      link: imageUrl,
      caption: `BOTTINE CUIR GS081 - ${colorNames[color] || 'أسود'} - 320 درهم`
    }
  }, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
};

const detectColor = (text) => {
  const t = text.toLowerCase();
  if (t.includes('noir') || t.includes('أسود') || t.includes('اسود') || t.includes('كحل')) return 'noir';
  if (t.includes('marron') || t.includes('بني') || t.includes('قهوي') || t.includes('kahwi')) return 'marron';
  if (t.includes('gris') || t.includes('رمادي') || t.includes('rmadi')) return 'gris';
  return null;
};

const wantsImage = (text) => {
  const t = text.toLowerCase();
  return t.includes('صورة') || t.includes('صور') || t.includes('شوف') || t.includes('image') || t.includes('photo');
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

  if (!conversationHistory[from]) {
    conversationHistory[from] = [];
  }

  // إرسال الصور الثلاث عند أول رسالة
  if (!sentImages.has(from)) {
    sentImages.add(from);
    try {
      await sendWhatsAppImage(from, 'noir');
      await new Promise(r => setTimeout(r, 500));
      await sendWhatsAppImage(from, 'marron');
      await new Promise(r => setTimeout(r, 500));
      await sendWhatsAppImage(from, 'gris');
      console.log('تم إرسال الصور الثلاث ✅');
    } catch (e) {
      console.error('خطأ في إرسال الصور:', e.message);
    }
  } else {
    // إرسال صورة اللون المطلوب إذا طلب العميل
    const color = detectColor(text);
    if (color && wantsImage(text)) {
      try {
        await sendWhatsAppImage(from, color);
        console.log(`تم إرسال صورة ${color} ✅`);
      } catch (e) {
        console.error('خطأ:', e.message);
      }
    }
  }

  conversationHistory[from].push({ role: 'user', content: text });

  try {
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

    const reply = claudeRes.data.content[0].text;
    conversationHistory[from].push({ role: 'assistant', content: reply });

    await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
      messaging_product: 'whatsapp',
      to: from,
      text: { body: reply }
    }, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('تم الإرسال ✅');
  } catch (e) {
    console.error('❌ خطأ:', e.response ? JSON.stringify(e.response.data) : e.message);
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 السيرفر على المنفذ ${PORT}`));
