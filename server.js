// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;
const CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Needed for Slack payloads
app.use(express.static('public'));

// 1. Endpoint to trigger Slack message (button click)
app.post('/post-message', async (req, res) => {
  try {
    await axios.post('https://slack.com/api/chat.postMessage', {
      channel: CHANNEL_ID,
      text: 'Hello from Heroku-powered Slack app! 🎉',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Click the button below:*'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Click Me!'
              },
              action_id: 'button_click',
              value: 'clicked_from_heroku'
            }
          ]
        }
      ]
    }, {
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).send({ message: 'Message with button posted to Slack!' });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send({ message: 'Error posting to Slack' });
  }
});

// 2. Slack Interactivity Handler (for button clicks)
app.post('/slack/actions', (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const user = payload.user.username || payload.user.name;
  const action = payload.actions[0].value;

  console.log(`🔘 Button clicked by ${user}: ${action}`);

  res.json({
    text: `Thanks <@${payload.user.id}>! You clicked the button 👏`
  });
});

// 3. Slack Events Handler (optional)
app.post('/slack/events', (req, res) => {
  const { type, challenge, event } = req.body;

  if (type === 'url_verification') {
    return res.send({ challenge });
  }

  if (type === 'event_callback') {
    console.log('⚡ Event received:', event);
    res.sendStatus(200);
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
