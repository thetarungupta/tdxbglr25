// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;
const CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/post-message', async (req, res) => {
  try {
    await axios.post('https://slack.com/api/chat.postMessage', {
      channel: CHANNEL_ID,
      text: 'Hello from Heroku-powered Slack app! 🎉'
    }, {
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    res.status(200).send({ message: 'Message posted to Slack!' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error posting to Slack' });
  }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
