const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// 1. التحقق من الـ Webhook عند الربط مع فيسبوك
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// 2. استقبال رسائل واتساب والرد عليها
app.post('/webhook', async (req, res) => {
  // طباعة البيانات القادمة من واتساب للتأكد من وصولها
  console.log('--- تنبيه: تم استقبال طلب جديد من واتساب ---');
  
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  
  // إذا لم تكن الرسالة نصية، يتجاهلها الكود ويرد بـ 200 لتجنب التكرار
  if (!message || message.type !== 'text') {
    console.log('الطلب مستلم، لكنه لا يحتوي على رسالة نصية مدعومة.');
    return res.sendStatus(200);
  }

  const from = message.from;
  const text = message.text.body;
  console.log(`الرسالة المستلمة من [${from}]: ${text}`);

  try {
    console.log('جاري إرسال الطلب إلى Anthropic (Claude)...');
    
    // إرسال النص إلى Claude (تم تحديث الموديل وتحسين التنسيق)
    const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022', // الموديل المستقر والأحدث
      max_tokens: 1024,
      messages: [{ role: 'user', content: text }]
    }, {
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const reply = claudeRes.data.content[0].text;
    console.log(`رد Claude الناجح: ${reply}`);

    console.log('جاري إرسال الرد إلى واتساب عبر Meta API...');
    
    // إرسال الرد إلى مستخدم واتساب
    await axios.post(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
      messaging_product: 'whatsapp',
      to: from,
      text: { body: reply }
    }, {
      headers: { 
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('تم إرسال الرسالة بنجاح إلى مستخدم واتساب! ✅');

  } catch (e) {
    // طباعة تفصيلية للخطأ في حال فشل أي خطوة
    console.error('❌ حدث خطأ أثناء المعالجة:');
    if (e.response) {
      console.error('تفاصيل الخطأ من السيرفر الخارجي:', JSON.stringify(e.response.data, null, 2));
    } else {
      console.error('رسالة الخطأ المباشرة:', e.message);
    }
  }

  // نرد دائماً بـ 200 لفيسبوك حتى لا يستمر في إعادة إرسال نفس الرسالة
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`السيرفر يعمل بنجاح على المنفذ ${PORT} 🚀`);
});
