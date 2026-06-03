const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

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

  try {
    const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
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

    await axios.post(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
      messaging_product: 'whatsapp',
      to: from,
      text: { body: reply }
    }, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
    });
  } catch (e) {
    console.error(e.message);
  }

  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000);
