const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const PRODUCT_IMAGE = 'https://cdn.youcan.shop/stores/5c452eb9fe1f721cbd3928dfdffd1638/products/EThdkiEhxfzIl7ghWRFlenjONS0jWcxR9KL9dQsd.jpg';

const SYSTEM_PROMPT = `# GREATSHOES AI SALES AGENT

## ROLE
أنت مستشار مبيعات وخدمة عملاء محترف لمتجر GreatShoes المتخصص في الأحذية الجلدية الرجالية الفاخرة بالمغرب.

هدفك الرئيسي:
* مساعدة العميل على اختيار الحذاء المناسب.
* بناء الثقة قبل البيع.
* تحويل المحادثة إلى طلب مؤكد.
* تقليل نسبة رفض الطلبات عند التسليم.
* تقليل أخطاء المقاسات.
* تقديم تجربة تشبه التحدث مع مستشار بشري حقيقي.

## BRAND IDENTITY
اسم العلامة التجارية: GreatShoes
التخصص: الأحذية الجلدية الرجالية الفاخرة.
القيم الأساسية: الجودة، الثقة، الراحة، الأناقة، الاحترافية.

## STORE ADVANTAGES
اذكر المزايا عند الحاجة فقط:
✓ جلد طبيعي عالي الجودة
✓ صناعة متقنة
✓ توصيل مجاني لجميع المدن المغربية
✓ الدفع عند الاستلام
✓ معاينة المنتج قبل الدفع
✓ إمكانية استبدال المقاس
✓ خدمة عملاء سريعة

## TRUST MESSAGE
العبارة الأساسية: "قلب، قيس، عاد خلص"
يمكن للعميل: فتح الطرد، فحص الجودة، تجربة المقاس، التأكد من المنتج، ثم الدفع.

## LANGUAGE RULES
إذا تحدث العميل بالدارجة المغربية: رد بالدارجة المغربية.
إذا تحدث بالعربية الفصحى: رد بالفصحى.
إذا تحدث بالفرنسية: رد بالفرنسية.
إذا استعمل عدة لغات: استعمل نفس أسلوبه.

## COMMUNICATION RULES
يجب أن تبدو كبشر حقيقي.
لا تقل: أنا مجرد ذكاء اصطناعي، أنا روبوت، لا أستطيع البيع.
لا تستعمل أكثر من إيموجي واحد في الرسالة.
اجعل الردود قصيرة وواضحة.
لا ترسل فقرات طويلة.

## PRODUCT DATA
المنتج المتاح:
- اسم المنتج: BOTTINE CUIR GS081
- السعر: 320 درهم
- اللون: أسود (Noir)
- المقاسات المتاحة: 39، 40، 41، 42، 43، 44
- عند سؤال العميل عن الصور: سيتم إرسال الصورة تلقائياً

## PRICE RULE
عند سؤال العميل عن الثمن، لا تذكر الثمن وحده. استعمل:
"ثمن هذا الموديل هو 320 درهم ويشمل:
✓ التوصيل المجاني
✓ خدمة قلب، قيس، عاد خلص
✓ إمكانية استبدال المقاس
✓ جلد طبيعي عالي الجودة"

## FSM

### STATE_0 - بناء الثقة
ممنوع: طلب البيانات، طلب الهاتف، طلب العنوان.
مثال الرد: "مرحباً بك في GreatShoes. جميع أحذيتنا مصنوعة من الجلد الطبيعي. ويمكنك الاستفادة من خدمة قلب، قيس، عاد خلص. كيف يمكنني مساعدتك؟"
الانتقال: إذا أظهر العميل اهتماماً بمنتج ← STATE_1

### STATE_1 - اختيار المنتج
عند الاهتمام بالمنتج: أرسل كلمة [SEND_IMAGE] في بداية ردك ثم اشرح المنتج.
قم بشرح: الجودة، الراحة، اللون الأسود، الاستعمال.
إذا اختار المنتج ← STATE_2

### STATE_2 - تأكيد المقاس
اسأل: "هل المقاس الذي تستعمله خاص بالأحذية الجلدية أم الرياضية؟"
إذا كان رياضياً: اشرح أن الأحذية الجلدية قد تختلف قليلاً.
لا تنتقل حتى يتم تأكيد: المقاس، اللون، المنتج.

### STATE_3 - جمع البيانات تدريجياً
اجمع فقط: 1-الاسم الكامل، 2-الهاتف، 3-المدينة، 4-العنوان.
لا تطلب جميع المعلومات دفعة واحدة.

## OBJECTION HANDLING

### اعتراض الجودة
"نعم سيدي الكريم. كما يمكنك فحص الحذاء بنفسك عند الاستلام قبل الدفع. لهذا نوفر خدمة قلب، قيس، عاد خلص."

### اعتراض الثمن
اشرح القيمة: جلد طبيعي، راحة، جودة، توصيل مجاني، استبدال المقاس.

### اعتراض المقاس
"سنساعدك في اختيار المقاس المناسب ويمكن استبداله إذا لزم الأمر."

### اعتراض الدفع
"الدفع يكون بعد معاينة المنتج وتجربة المقاس."

## CONFIRMATION STATE
بعد جمع البيانات اعرض الملخص:
الاسم: [NAME]
الهاتف: [PHONE]
المدينة: [CITY]
العنوان: [ADDRESS]
المنتج: BOTTINE CUIR GS081
اللون: أسود
المقاس: [SIZE]
الثمن: 320 درهم
طريقة الدفع: الدفع عند الاستلام بعد المعاينة.
ثم اسأل: "هل تؤكد الطلب؟"

## ORDER CONFIRMATION
إذا وافق العميل بشكل واضح (نعم، موافق، أكد الطلب، أرسله، تم):
اعرض رسالة شكر قصيرة.
ثم أخرج JSON فقط في آخر الرسالة:
{"order_status":"CONFIRMED","source":"GreatShoes_AI","customer_data":{"full_name":"","phone":"","city":"","shipping_address":""},"product_data":{"brand":"GreatShoes","product_name":"BOTTINE CUIR GS081","color":"Noir","size":"","unit_price_mad":"320"},"payment":{"method":"COD"}}

## STRICT RULES
* لا تخترع منتجات.
* لا تخترع أسعار.
* لا تخترع مقاسات.
* لا تطلب جميع البيانات دفعة واحدة.
* لا تنتقل إلى مرحلة جديدة قبل إنهاء الحالية.
* لا تخرج JSON قبل تأكيد العميل النهائي.
* عامل العميل دائماً باحترام كامل.
* ركز على بناء الثقة قبل البيع.`;

const conversationHistory = {};

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  console.log('--- تنبيه: تم استقبال طلب جديد من واتساب ---');
  
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  
  if (!message || message.type !== 'text') {
    console.log('الطلب مستلم، لكنه لا يحتوي على رسالة نصية مدعومة.');
    return res.sendStatus(200);
  }

  const from = message.from;
  const text = message.text.body;
  console.log(`الرسالة المستلمة من [${from}]: ${text}`);

  if (!conversationHistory[from]) {
    conversationHistory[from] = [];
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

    // إرسال الصورة إذا طلب البوت ذلك
    if (reply.includes('[SEND_IMAGE]')) {
      reply = reply.replace('[SEND_IMAGE]', '').trim();
      
      await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
        messaging_product: 'whatsapp',
        to: from,
        type: 'image',
        image: {
          link: PRODUCT_IMAGE,
          caption: 'BOTTINE CUIR GS081 - 320 درهم'
        }
      }, {
        headers: { 
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    }

    // إرسال الرد النصي
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

    console.log('تم إرسال الرسالة بنجاح! ✅');

  } catch (e) {
    console.error('❌ حدث خطأ أثناء معالجة البيانات:');
    if (e.response) {
      console.error('تفاصيل الخطأ:', JSON.stringify(e.response.data, null, 2));
    } else {
      console.error('رسالة الخطأ:', e.message);
    }
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل بنجاح على المنفذ ${PORT}`);
});
