// server.js
require('dotenv').config(); // Load env variables
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;
const { App } = require("@slack/bolt"); 
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;
const CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Needed for Slack payloads
app.use(express.static('public'));


// 1. Endpoint to trigger Slack message (button click)
app.post('/post-message', async (req, res) => {
  try {
    await axios.post('https://slack.com/api/chat.postMessage', {
      channel: CHANNEL_ID,    // Your channel ID
      text: 'Hello from your Slack app! 🎉',  // Simple text
      attachments: [
        {
          text: 'Click below to interact:',
          fallback: 'Button not supported on this device',
          callback_id: 'button_click',
          actions: [
            {
              name: 'button',
              text: 'Click Me!',
              type: 'button',
              value: 'button_clicked'
            }
          ]
        }
      ]
    }, {
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,  // Ensure your token is set
        'Content-Type': 'application/json',
      }
    });

    res.status(200).send({ message: 'Message with button posted to Slack!' });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send({ message: 'Error posting to Slack' });
  }
});

app.post('/slack/actions', async (req, res) => {
  try {
    // Parse the payload from Slack (it comes as a JSON string)
    const payload = JSON.parse(req.body.payload);

    // Check if the button was clicked and the value matches
    if (payload.actions && payload.actions[0].value === 'button_clicked') {
      // You can perform any action here, for example, posting a message back to the channel
      await axios.post('https://slack.com/api/chat.postMessage', {
        channel: payload.channel.id,  // Channel ID from the payload
        text: 'You clicked the button! 🎉', // Response text
        attachments: [
          {
            text: 'Thanks for interacting with the button!',
            fallback: 'No button support',
          },
        ],
      }, {
        headers: {
          Authorization: `Bearer ${SLACK_TOKEN}`,
          'Content-Type': 'application/json',
        }
      });

      // Send an acknowledgment back to Slack that the interaction was received
      res.status(200).send(); // Responding with 200 OK to Slack
    } else {
      res.status(400).send({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error handling the interaction:', error);
    res.status(500).send({ message: 'Error handling the interaction' });
  }
});



app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
