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
هدفك: مساعدة العميل على اختيار الحذاء، بناء الثقة، تحويل المحادثة إلى طلب مؤكد، تقليل نسبة رفض الطلبات، تقليل أخطاء المقاسات، تقديم تجربة تشبه التحدث مع مستشار بشري حقيقي.

## BRAND IDENTITY
اسم العلامة التجارية: GreatShoes
التخصص: الأحذية الجلدية الرجالية الفاخرة.
القيم: الجودة، الثقة، الراحة، الأناقة، الاحترافية.

## STORE ADVANTAGES
اذكر المزايا عند الحاجة فقط:
✓ جلد طبيعي عالي الجودة
✓ توصيل مجاني لجميع المدن المغربية
✓ الدفع عند الاستلام
✓ معاينة المنتج قبل الدفع
✓ إمكانية استبدال المقاس

## TRUST MESSAGE
"قلب، قيس، عاد خلص" - يمكن للعميل فتح الطرد، فحص الجودة، تجربة المقاس، ثم الدفع.

## LANGUAGE RULES
دارجة مغربية ← رد بالدارجة. فصحى ← رد بالفصحى. فرنسية ← رد بالفرنسية. عدة لغات ← نفس أسلوبه.

## COMMUNICATION RULES
تصرف كبشر حقيقي. لا تقل أنا روبوت أو ذكاء اصطناعي. إيموجي واحد فقط. ردود قصيرة وواضحة.

## PRODUCT DATA
- اسم المنتج: BOTTINE CUIR GS081
- السعر: 320 درهم
- الألوان المتاحة: أسود (noir)، بني (marron)، رمادي (gris)
- المقاسات: 39، 40، 41، 42، 43، 44
- ملاحظة: عند بداية المحادثة تم إرسال صورة اللون الأسود تلقائياً.
- عندما يختار العميل لوناً معيناً، اكتب [SEND_IMAGE:noir] أو [SEND_IMAGE:marron] أو [SEND_IMAGE:gris] في بداية ردك.

## PRICE RULE
عند سؤال عن الثمن:
"ثمن هذا الموديل هو 320 درهم ويشمل:
✓ التوصيل المجاني
✓ خدمة قلب، قيس، عاد خلص
✓ إمكانية استبدال المقاس
✓ جلد طبيعي عالي الجودة"

## FSM

### STATE_0 - بناء الثقة
لا تطلب بيانات أو هاتف أو عنوان.
مثال: "مرحباً بك في GreatShoes. جميع أحذيتنا من الجلد الطبيعي. كيف يمكنني مساعدتك؟"
انتقل لـ STATE_1 إذا أظهر اهتماماً.

### STATE_1 - اختيار المنتج واللون
اشرح الألوان الثلاثة: أسود، بني، رمادي.
عندما يختار العميل لوناً: اكتب [SEND_IMAGE:اللون] في بداية ردك.
انتقل لـ STATE_2 إذا اختار.

### STATE_2 - تأكيد المقاس
اسأل: "هل المقاس لي كتلبس خاص بالأحذية الجلدية أم الرياضية؟"
إذا كان رياضياً اشرح الفرق. لا تنتقل قبل تأكيد المقاس واللون والمنتج.

### STATE_3 - جمع البيانات تدريجياً
1- الاسم الكامل، 2- الهاتف، 3- المدينة، 4- العنوان. لا تطلب الكل دفعة واحدة.

## OBJECTION HANDLING
جودة: "نعم جلد طبيعي، وكتقدر تفحصه قبل الدفع."
ثمن: اشرح القيمة (جلد، راحة، توصيل مجاني، استبدال).
مقاس: "غنساعدك تختار المقاس المناسب، وكيمكن نبدلوه إذا لزم."
دفع: "الدفع كيكون بعد المعاينة والتجربة."

## CONFIRMATION STATE
الاسم: [NAME]
الهاتف: [PHONE]
المدينة: [CITY]
العنوان: [ADDRESS]
المنتج: BOTTINE CUIR GS081
اللون: [COLOR]
المقاس: [SIZE]
الثمن: 320 درهم
الدفع: عند الاستلام بعد المعاينة.
"هل تؤكد الطلب؟"

## ORDER CONFIRMATION
إذا وافق (نعم، موافق، أكد، أرسله، تم، واخا):
رسالة شكر قصيرة ثم JSON:
{"order_status":"CONFIRMED","source":"GreatShoes_AI","customer_data":{"full_name":"","phone":"","city":"","shipping_address":""},"product_data":{"brand":"GreatShoes","product_name":"BOTTINE CUIR GS081","color":"","size":"","unit_price_mad":"320"},"payment":{"method":"COD"}}

## STRICT RULES
لا تخترع منتجات أو أسعار أو مقاسات. لا تطلب البيانات دفعة واحدة. لا تنتقل لمرحلة جديدة قبل إنهاء الحالية. لا تخرج JSON قبل تأكيد العميل. عامل العميل باحترام. ركز على بناء الثقة قبل البيع.`;

const conversationHistory = {};

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

const sendImage = async (to, color) => {
  const imageUrl = PRODUCT_IMAGES[color] || PRODUCT_IMAGES.noir;
  const colorNames = { noir: 'أسود', marron: 'بني', gris: 'رمادي' };
  await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    to: to,
    type: 'image',
    image: {
      link: imageUrl,
      caption: `BOTTINE CUIR GS081 - اللون: ${colorNames[color] || 'أسود'} - 320 درهم`
    }
  }, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
};

app.post('/webhook', async (req, res) => {
  console.log('--- تم استقبال طلب جديد من واتساب ---');
  
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  
  if (!message || message.type !== 'text') {
    console.log('ليست رسالة نصية.');
    return res.sendStatus(200);
  }

  const from = message.from;
  const text = message.text.body;
  console.log(`رسالة من [${from}]: ${text}`);

  const isNewConversation = !conversationHistory[from];

  if (isNewConversation) {
    conversationHistory[from] = [];
    try {
      await sendImage(from, 'noir');
      console.log('تم إرسال صورة اللون الأسود ✅');
    } catch (e) {
      console.error('خطأ في إرسال الصورة:', e.message);
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

    let reply = claudeRes.data.content[0].text;
    conversationHistory[from].push({ role: 'assistant', content: reply });

    // إرسال صورة اللون المختار
    const imageMatch = reply.match(/\[SEND_IMAGE:(noir|marron|gris)\]/);
    if (imageMatch) {
      reply = reply.replace(imageMatch[0], '').trim();
      try {
        await sendImage(from, imageMatch[1]);
        console.log(`تم إرسال صورة اللون ${imageMatch[1]} ✅`);
      } catch (e) {
        console.error('خطأ في إرسال الصورة:', e.message);
      }
    }

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

    console.log('تم إرسال الرد بنجاح! ✅');

  } catch (e) {
    console.error('❌ خطأ:');
    if (e.response) {
      console.error(JSON.stringify(e.response.data, null, 2));
    } else {
      console.error(e.message);
    }
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
});
