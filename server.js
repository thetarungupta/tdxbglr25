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
//tdx 

// 1. Endpoint to trigger Slack message (button click)
app.post('/post-message', async (req, res) => {
  try {
    await axios.post('https://slack.com/api/chat.postMessage', {
      channel: CHANNEL_ID,
      text: 'Hello from your Slack app! 🎉',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Click the button below to interact:'
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
              value: 'button_clicked'
            }
          ]
        }
      ]
    }, {
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    res.status(200).send({ message: 'Message with button posted to Slack!' });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send({ message: 'Error posting to Slack' });
  }
});

app.post('/slack/hello', (req, res) => {
  const userId = req.body.user_id; // 👈 Get user_id from the request body

  res.json({
    response_type: 'in_channel', // or 'ephemeral'
    text: `👋 Hello everyone from Heroku! *Welcome our new member*, <@${userId}>! 🎉`
  });
});


app.post('/slack/tdxinfo', (req, res) => {
  const responsePayload = {
    response_type: 'ephemeral', // or 'ephemeral' for private messages . in_channel
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Welcome to TDX Info!* :tada:\nHere’s everything you need to know.'
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: '*Location:*\nBengaluru & Salesforce+'
          },
          {
            type: 'mrkdwn',
            text: '*Date:*\nMay 2-3, 2025'
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Check out the full agenda and register below:'
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'TDX Website'
            },
            url: 'https://www.salesforce.com/tdx',
            action_id: 'tdx_website'
          }
        ]
      }
      ,
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'TDX Salesforce+'
            },
            url: 'https://www.salesforce.com/tdx',
            action_id: 'tdx_website'
          }
        ]
      }
    ]
  };

  res.json(responsePayload);
});



app.post('/slack/events', async (req, res) => {
  const { type, event } = req.body;

  if (type === 'url_verification') {
    return res.send({ challenge: req.body.challenge });
  }

  if (event && event.type === 'app_home_opened') {
    // Now use axios to call views.publish manually
    await axios.post('https://slack.com/api/views.publish', {
      user_id: event.user,
      view: {
        type: 'home',
        callback_id: 'home_view',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `👋 *Welcome to your Slack App on Heroku*, <@${event.user}>!`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: "This app is deployed on Heroku and built to enhance your Slack workspace experience with interactive features and info-packed commands. 🚀"
            },
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Heroku Dev Center'
                },
                url: 'https://devcenter.heroku.com/',
                action_id: 'heroko_path'
              }
            ]
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Slack Dev Center'
                },
                url: 'https://slack.dev/',
                action_id: 'slack_path'
              }
            ]
          },
          {
            type: 'divider'
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: "_Proudly built & deployed by <@TarunGupta> using Slack & Deployed on Heroku. ✌️_"
              }
            ]
          }
        ]
      },
    }, {
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    return res.status(200).send();
  }

  res.sendStatus(200);
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
