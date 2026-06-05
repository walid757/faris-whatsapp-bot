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
- اللون: أسود
- المقاسات: 39، 40، 41، 42، 43، 44
- ملاحظة: تم إرسال صورة المنتج تلقائياً للعميل عند بداية المحادثة.

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

### STATE_1 - اختيار المنتج
اشرح: الجودة، الراحة، اللون الأسود، الاستعمال.
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
اللون: أسود
المقاس: [SIZE]
الثمن: 320 درهم
الدفع: عند الاستلام بعد المعاينة.
"هل تؤكد الطلب؟"

## ORDER CONFIRMATION
إذا وافق (نعم، موافق، أكد، أرسله، تم، واخا):
رسالة شكر قصيرة ثم JSON في آخر الرسالة:
{"order_status":"CONFIRMED","source":"GreatShoes_AI","customer_data":{"full_name":"","phone":"","city":"","shipping_address":""},"product_data":{"brand":"GreatShoes","product_name":"BOTTINE CUIR GS081","color":"Noir","size":"","unit_price_mad":"320"},"payment":{"method":"COD"}}

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

  const isNewConversation = !conversationHistory[from];

  if (isNewConversation) {
    conversationHistory[from] = [];
    try {
      await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
        messaging_product: 'whatsapp',
        to: from,
        type: 'image',
        image: {
          link: PRODUCT_IMAGE,
          caption: 'BOTTINE CUIR GS081 👟\n320 درهم | جلد طبيعي | توصيل مجاني | الدفع عند الاستلام'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('تم إرسال صورة المنتج ✅');
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

    const reply = claudeRes.data.content[0].text;
    conversationHistory[from].push({ role: 'assistant', content: reply });
    console.log(`رد Claude: ${reply}`);

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
