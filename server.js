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

// 2. Slack Interactivity Handler (for button clicks)
// app.post('/slack/actions', (req, res) => {
//   const payload = JSON.parse(req.body.payload);
//   const user = payload.user.username || payload.user.name;
//   const action = payload.actions[0].value;

//   console.log(`🔘 Button clicked by ${user}: ${action}`);

//   res.json({
//     text: `Thanks <@${payload.user.id}>! You clicked the button 👏`
//   });
// });

app.post('/slack/actions', express.json(), async (req, res) => {
  const { type, actions, trigger_id } = req.body;

  // Check for button click
  if (type === 'block_actions') {
    // This is where you open the modal (popup)
    try {
      await axios.post('https://slack.com/api/views.open', {
        trigger_id: trigger_id,
        view: {
          type: 'modal',
          callback_id: 'modal-1',
          title: {
            type: 'plain_text',
            text: 'My Popup'
          },
          blocks: [
            {
              type: 'section',
              block_id: 'section-1',
              text: {
                type: 'mrkdwn',
                text: 'Hello, this is your popup message!'
              },
            },
            {
              type: 'section',
              block_id: 'section-2',
              text: {
                type: 'mrkdwn',
                text: 'You can add buttons or inputs here.'
              },
              accessory: {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Close'
                },
                action_id: 'close_button'
              }
            }
          ]
        }
      }, {
        headers: {
          Authorization: `Bearer ${SLACK_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      res.status(200).send();  // Respond to Slack with success
    } catch (error) {
      console.error('Error opening modal:', error);
      res.status(500).send('Failed to open modal');
    }
  } else {
    res.status(400).send('Invalid action');
  }
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
