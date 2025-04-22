// index.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { WebClient } = require('@slack/web-api');
const app = express();

const slackToken = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(slackToken);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/customSendMessage', async (req, res) => {
    const { channel, message } = req.body;
    
    try {
      await web.chat.postMessage({
        channel: channel,
        text: message
      });
      res.status(200).send('Message sent!');
    } catch (error) {
      res.status(500).send('Error sending message');
    }
  });


app.post('/sendMessage', async (req, res) => {
  try {
    await web.chat.postMessage({
        channel: '#tdx-demo',
        text: '🚀 Hello from your backend!',
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "🚀 Hello from your backend!! Do you want to submit feedback?"
            }
          },
          {
            "type": "actions",
            "elements": [
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": "Submit your feedback"
                },
              }
            ]
          },
          {
			"type": "context",
			"elements": [
				{
					"type": "plain_text",
					"text": "Author: Tarun Gupta",
					"emoji": true
				}
			]
		}
        ]
      });
      
    
    res.send('Message sent!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to send message.');
  }
});

// app.post('/slack/events', async (req, res) => {
//     const payload = JSON.parse(req.body.payload);
    
//     if (payload.type === 'block_actions') {
//       const user = payload.user.username;
  
//       await web.chat.postMessage({
//         channel: payload.channel.id,
//         text: `🎉 Thanks for clicking, @${user}!`
//       });
  
//       return res.status(200).send(); // acknowledge
//     }
  
//     res.status(200).send();
//   });

app.post('/slack/events', async (req, res) => {
    const payload = JSON.parse(req.body.payload);
    console.log("Button click payload: ", payload); // For debugging
  
    if (payload.type === 'block_actions') {
      const triggerId = payload.trigger_id;
  
      // Build your modal
      const modalView = {
        type: "modal",
        callback_id: "demo_modal",
        title: {
          type: "plain_text",
          text: "Submit Feedback"
        },
        submit: {
          type: "plain_text",
          text: "Submit"
        },
        close: {
          type: "plain_text",
          text: "Cancel"
        },
        blocks: [
          {
            type: "input",
            block_id: "input_c",
            label: {
              type: "plain_text",
              text: "What do you think of the demo?"
            },
            element: {
              type: "plain_text_input",
              action_id: "response"
            }
          }
        ]
      };
  
      // Open the modal
      await web.views.open({
        trigger_id: triggerId,
        view: modalView
      });
  
      return res.status(200).send(); // Ack
    }
    if (payload.type === 'view_submission') {
        const user = payload.user.name;
        const inputResponse = payload.view.state.values.input_c.response.value;
       
        
        // Optional: Respond to the user
        await web.chat.postMessage({
          channel: payload.user.id,
          
          blocks: [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                 "text": `🙌 Thanks for your response, ${user}`,
              }
            },
            {
              "type": "divider"
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "This is a demo :ghost: *for Using the Slack WebAPI and post a message into slack channel*, read about it here <https://slack.api.com|Slack API>"
              }
            },
            {
              "type": "rich_text",
              "elements": [
                {
                  "type": "rich_text_section",
                  "elements": [
                    {
                      "type": "text",
                      "text": `Feedback Submission : "${inputResponse}"`,
                    }
                  ]
                }
              ]
            },
            {
        "type": "context",
        "elements": [
          {
            "type": "plain_text",
            "text": "Author: Tarun Gupta",
            "emoji": true
          }
        ]
      }
          ]
        });
    
        return res.status(200).send(); // Ack
      }
    
    

  
    res.status(200).send();
  });
  

  

app.get('/team', async (req, res) => {
    try {
      const response = await axios.get('https://slack.com/api/team.info', {
        headers: {
          Authorization: `Bearer ${slackToken}`
        }
      });
  
      res.json(response.data);
    } catch (error) {
      console.error('Slack API error:', error);
      res.status(500).json({ error: 'Failed to fetch Slack team info' });
    }
  });


app.listen(3000, () => console.log('Running on http://localhost:3000'));
