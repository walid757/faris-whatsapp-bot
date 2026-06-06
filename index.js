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

const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyaMpplLlF9e8M_45BJBnqqaTxHcRjS51sDxvcPBbcvp4dpPO-J2BNwXYlhyLrbTNCA/exec";

const PRODUCT_IMAGES = {
  noir:   'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/noir.jpg',
  marron: 'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/marron.jpg',
  gris:   'https://raw.githubusercontent.com/walid757/faris-whatsapp-bot/main/gris.jpg'
};

const STATE_FILE = path.join(__dirname, 'bot_state.json');
const loadState = () => {
  try { if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch (e) { console.error('⚠️ خطأ في تحميل الحالة:', e.message); }
  return { sentImages: [], orderConfirmed: [], notInterested: [], followUpCount: {}, conversationHistory: {} };
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
const persistState = () => saveState({ sentImages:[...sentImages], orderConfirmed:[...orderConfirmed], notInterested:[...notInterested], followUpCount, conversationHistory });

const userQueues = {}, userLocks = {};
const enqueue = (from, fn) => { if (!userQueues[from]) userQueues[from] = []; userQueues[from].push(fn); if (!userLocks[from]) processQueue(from); };
const processQueue = async (from) => { if (userLocks[from]) return; userLocks[from] = true; while (userQueues[from]?.length > 0) { const fn = userQueues[from].shift(); try { await fn(); } catch (e) { console.error('❌ Queue:', e.message); } } userLocks[from] = false; };

const MAX_HISTORY = 10;
const trimHistory = (from) => { if (conversationHistory[from]?.length > MAX_HISTORY) conversationHistory[from] = conversationHistory[from].slice(-MAX_HISTORY); };

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

## PHONE
بعد الاسم+المدينة+العنوان: "[الاسم]، بقى غير رقم الهاتف 😊 [PAUSE] واش نخلي هذا الرقم، ولا عندك رقم آخر؟"
موافقة بأي شكل → PHONE_FROM_WHATSAPP | رقم جديد → استخدمه

## PRICE
"320 درهم [PAUSE] مقارنة بالسوق 600-1000 — استثنائي ويشمل التوصيل+قلب قيس عاد خلص+استبدال المقاس"

## CONFIRMATION
خلينا نتأكدو:
👟 BOTTINE CUIR GS081 | 🎨 [اللون] | 📏 [المقاس] | 💰 320 درهم | 🚚 مجاني-دفع عند الاستلام | 👤 [الاسم] | 📍 [المدينة]-[العنوان]
واش تأكد الطلب؟

## ORDER CONFIRMATION
عند أي موافقة (نعم/آه/أكيد/واخا/oui/ok/👍):
أخرج في سطر منفصل:
CONFIRMED_ORDER:{"order_status":"CONFIRMED","source":"GreatShoes_AI","customer_data":{"full_name":"[الاسم]","phone":"[PHONE_FROM_WHATSAPP أو الرقم]","city":"[المدينة بالفرنسية]","shipping_address":"[العنوان بالفرنسية]"},"product_data":{"brand":"GreatShoes","product_name":"BOTTINE CUIR GS081","color_ar":"[اللون بالعربية]","color_fr":"[noir/marron/gris]","size":"[المقاس]","unit_price_mad":"320"},"payment":{"method":"COD"}}

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

## RULES
مهارة واحدة فقط في كل رسالة. لا تخترع منتجات أو أسعار. لا تطلب البيانات دفعة واحدة. لا تخرج JSON قبل تأكيد الزبون. لا ترسل CONFIRMED_ORDER للزبون أبداً.`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const SILENCE_TIMEOUT = 15 * 60 * 1000;
const MAX_FOLLOWUPS   = 3;
const followUpTimers  = {};
const lastMessageTime = {};

const formatPhone = (p) => { p = String(p).trim().replace(/\s/g,'').replace(/\+/g,''); if (p.startsWith('212')) return p; if (p.startsWith('0')) return '212'+p.slice(1); if (p.length===9) return '212'+p; return '212'+p; };

const markAsRead = async (messageId) => { try { await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, { messaging_product:'whatsapp', status:'read', message_id:messageId }, { headers:{'Authorization':`Bearer ${WHATSAPP_TOKEN}`,'Content-Type':'application/json'} }); } catch(e) { console.error('markAsRead:',e.message); } };

const sendText = async (to, text) => { await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, { messaging_product:'whatsapp', to, text:{body:text} }, { headers:{'Authorization':`Bearer ${WHATSAPP_TOKEN}`,'Content-Type':'application/json'} }); };

const sendHumanLike = async (to, fullReply) => { const parts = fullReply.split('[PAUSE]').map(p=>p.trim()).filter(p=>p.length>0); for (let i=0;i<parts.length;i++) { const t=Math.min(Math.max(parts[i].length*40,1000),3000); await sleep(t); await sendText(to,parts[i]); if(i<parts.length-1) await sleep(600); } };

const sendWhatsAppImage = async (to, color) => { const n={noir:'أسود',marron:'بني',gris:'رمادي'}; await axios.post(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, { messaging_product:'whatsapp', to, type:'image', image:{link:PRODUCT_IMAGES[color],caption:`BOTTINE CUIR GS081 - ${n[color]} - 320 درهم`} }, { headers:{'Authorization':`Bearer ${WHATSAPP_TOKEN}`,'Content-Type':'application/json'} }); };

const sendAllImages = async (to) => { await sendWhatsAppImage(to,'noir'); await sleep(800); await sendWhatsAppImage(to,'marron'); await sleep(800); await sendWhatsAppImage(to,'gris'); };

const detectColor = (text) => { const t=text.toLowerCase(); if(t.includes('noir')||t.includes('أسود')||t.includes('اسود')||t.includes('كحل')) return 'noir'; if(t.includes('marron')||t.includes('بني')||t.includes('قهوي')) return 'marron'; if(t.includes('gris')||t.includes('رمادي')||t.includes('rmadi')) return 'gris'; return null; };

const isInsistingOnImages = (text) => { const t=text.toLowerCase(); return (t.includes('صورة')||t.includes('صور')||t.includes('image'))&&(t.includes('مرة ثانية')||t.includes('مشافتش')||t.includes('وصلتش')||t.includes('encore')||t.includes('كلهم')); };

const isNotInterested = (text) => { const t=text.toLowerCase(); return t.includes('مش غادي نشري')||t.includes('ما بغيتش')||t.includes('لا شكراً')||t.includes('لا شكرا')||t.includes('pas intéressé')||t.includes('no thanks')||t.includes('مش محتاج')||t.includes('وقفو')||t.includes('بغيت نوقف'); };

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
    const payload = { secret:SHEET_SECRET, full_name:customer.full_name||'', phone, city:customer.city||'', address:customer.shipping_address||'', price:product.unit_price_mad||'320', product:product.product_name||'BOTTINE CUIR GS081', color:variant, size:'' };
    console.log('📤 إرسال للشيت:', JSON.stringify(payload));
    const response = await axios.post(SHEET_API_URL, payload, { headers:{'Content-Type':'application/json'}, timeout:10000 });
    console.log('📥 رد الشيت:', response.status, JSON.stringify(response.data));
    return { success:true, colorFr, phone, name:customer.full_name };
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
    const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', { model:'claude-sonnet-4-6', max_tokens:400, system:SYSTEM_PROMPT, messages:[...conversationHistory[from],{role:'user',content:followUpPrompt}] }, { headers:{'x-api-key':CLAUDE_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'} });
    await sendHumanLike(from, claudeRes.data.content[0].text);
    if (count+1<MAX_FOLLOWUPS) followUpTimers[from]=setTimeout(()=>sendFollowUp(from),SILENCE_TIMEOUT);
  } catch(e) { console.error('❌ خطأ المتابعة:', e.message); }
};

const resetFollowUpTimer = (from) => { if(followUpTimers[from]){clearTimeout(followUpTimers[from]);delete followUpTimers[from];} if(!orderConfirmed.has(from)&&!notInterested.has(from)) followUpTimers[from]=setTimeout(()=>sendFollowUp(from),SILENCE_TIMEOUT); };

const verifySignature = (req) => { if(!APP_SECRET) return true; const sig=req.headers['x-hub-signature-256']; if(!sig) return false; const expected='sha256='+crypto.createHmac('sha256',APP_SECRET).update(JSON.stringify(req.body)).digest('hex'); return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)); };

app.get('/webhook', (req,res) => { if(req.query['hub.verify_token']===VERIFY_TOKEN) res.send(req.query['hub.challenge']); else res.sendStatus(403); });

app.post('/webhook', async (req,res) => {
  if (!verifySignature(req)) { console.warn('⚠️ Signature غير صحيح'); return res.sendStatus(401); }
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return res.sendStatus(200);
  if (message.type!=='text') { const from=message.from; try { await sleep(800); await sendText(from,'أرسل رسالة نصية باش نقدر نساعدك 😊'); } catch(e){} return res.sendStatus(200); }
  const from = message.from;
  const text = message.text.body;
  console.log(`--- رسالة من [${from}]: ${text}`);
  res.sendStatus(200);
  await markAsRead(message.id);
  if (isRateLimited(from)) { console.warn(`⚠️ Rate limit لـ ${from}`); return; }
  lastMessageTime[from]=Date.now();
  resetFollowUpTimer(from);
  if (isNotInterested(text)) { notInterested.add(from); if(followUpTimers[from]){clearTimeout(followUpTimers[from]);delete followUpTimers[from];} persistState(); }
  if (!conversationHistory[from]) { conversationHistory[from]=[]; followUpCount[from]=0; }

  enqueue(from, async () => {
    if (!sentImages.has(from)) { sentImages.add(from); persistState(); try { await sleep(500); await sendAllImages(from); } catch(e){ console.error('❌ خطأ الصور:', e.response?JSON.stringify(e.response.data):e.message); } }
    conversationHistory[from].push({role:'user',content:text});
    trimHistory(from);
    try {
      await sleep(1500);
      const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', { model:'claude-sonnet-4-6', max_tokens:600, system:SYSTEM_PROMPT, messages:conversationHistory[from] }, { headers:{'x-api-key':CLAUDE_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'} });
      let reply = claudeRes.data.content[0].text;
      conversationHistory[from].push({role:'assistant',content:reply});
      trimHistory(from); persistState();

      if (reply.includes('CONFIRMED_ORDER:')) {
        orderConfirmed.add(from); if(followUpTimers[from]){clearTimeout(followUpTimers[from]);delete followUpTimers[from];} persistState();
        console.log(`🎉 طلب مؤكد من ${from}`);
        const result = await saveOrderToSheet(reply, from);
        const colorFr = (result&&result.colorFr)?result.colorFr:'noir';
        if (PRODUCT_IMAGES[colorFr]) { try { await sleep(500); await sendWhatsAppImage(from,colorFr); await sleep(1000); } catch(e){ console.error('❌ صورة التأكيد:', e.message); } }
        const confirmMsg = extractConfirmMsg(reply);
        if (confirmMsg) { const phoneDisplay=(result&&result.phone)?result.phone:formatPhone(from); await sendText(from,confirmMsg.replace('{{phone}}',phoneDisplay)); }
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

app.get('/', (req,res) => res.json({status:'ok',version:'v16-optimized'}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 v16 — السيرفر على المنفذ ${PORT}`));
