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

// Initialize Slack app using Slack Bolt
const slackApp = new App({
  token: SLACK_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

slackApp.command('/hello', async ({ command, ack, respond }) => {
  await ack();
  await respond(`Hello, ${command.text}`);
});



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
slackApp.action('get_slack_fact', async ({ ack, body, client }) => {
  console.log('👉 Button clicked');
await ack();

const facts = [
  "Slack was originally developed as an internal tool for a game called Glitch.",
  "Slack stands for 'Searchable Log of All Communication and Knowledge'.",
  "Slack was launched publicly in August 2013.",
  "Slack's first emoji was :partyparrot:.",
  "Slackbot was created to be your personal assistant in Slack – and it never sleeps.",
  "Before Slack, the team was building a game called Glitch, which failed—but Slack succeeded.",
  "You can set reminders in Slack by typing `/remind`.",
  "Slack was acquired by Salesforce in 2021 for $27.7 billion.",
  "Slack channels can be public (`#`) or private (`🔒`).",
  "Slack has a limit of 10,000 searchable messages for free workspaces.",
  "Slack integrates with more than 2,400 apps through its App Directory.",
  "You can use Slack Huddles for quick, audio-first convos—like spontaneous hallway chats.",
  "Slack’s mascot is named 'Syd the Slackbot'.",
  "Slack introduced Workflow Builder to automate common tasks—no code needed!",
  "Slack has keyboard shortcuts like `Ctrl + K` (or `Cmd + K`) to quickly jump to any conversation."
];
const fact = facts[Math.floor(Math.random() * facts.length)];

await client.chat.postMessage({
  channel: body.user.id,
  text: `🤯 Useless Fact: *${fact}*`
});
});


slackApp.message(async ({ message, say }) => {
  const text = message.text.toLowerCase();

  if (/goodbye|bye|see you/i.test(text)) {
    await say(`See ya later, <@${message.user}> :wave:`);
  } else if (/hello|hi|hey/i.test(text)) {
    await say(`Hey there Tarun! 👋 <@${message.user}>`);
  } else if (text.includes("share the rules")) {
    await say(`*Welcome to the Jaipur Tableau User Group*\n
The purpose of this community is to create a central resource for those in the *Data* space.\n
*Please be...*\n
:palms_up_together: *Supportive* – we love to see people being each other’s hype-person!\n
:pray: *Respectful* – treat others how you’d want to be treated yourself!\n
:gift: *Generous* – aim to always give as much as you take!\n
:hugging_face: *Involved* – join in and try to keep up with the fun!\n
:index_pointing_at_the_viewer: *Authentic* – share your most authentic self with us!\n
\n*Please avoid...*\n
:no_good: *Hate* – zero tolerance for trolling, discrimination, and toxicity.\n
:no_good: *Spam* – seeing the same message over and over is exhausting.\n
:no_good: *Promo* – this space isn’t the place to be marketing.\n
:no_good: *Lead Gen* – unless you run it by the ROA team and get their approval.\n
:no_good: *Overstepping* – don’t slide into DMs with hate, spam, promo, or lead gen.\n
:no_good: *Product hunts*\n
:no_good: *Cold calling*\n
\n:bangbang: *Oh, and heads up...*\n
We’ll take action when we see someone violating our shared guidelines – sometimes that just means giving someone a warning; other times it means revoking access to the community. We request all members to report violations to <@TarunGupta>.
`);
  } else if (text.includes("get slack fact")) {

      console.log('👉 Message ssssssss: get slack fact');

       // Array of random fun facts
       const facts = [
          "Slack was originally developed as an internal tool for a game called Glitch.",
          "Slack stands for 'Searchable Log of All Communication and Knowledge'.",
          "Slack was launched publicly in August 2013.",
          "Slack's first emoji was :partyparrot:.",
          "Slackbot was created to be your personal assistant in Slack – and it never sleeps.",
          "Before Slack, the team was building a game called Glitch, which failed—but Slack succeeded.",
          "You can set reminders in Slack by typing `/remind`.",
          "Slack was acquired by Salesforce in 2021 for $27.7 billion.",
          "Slack channels can be public (`#`) or private (`🔒`).",
          "Slack has a limit of 10,000 searchable messages for free workspaces.",
          "Slack integrates with more than 2,400 apps through its App Directory.",
          "You can use Slack Huddles for quick, audio-first convos—like spontaneous hallway chats.",
          "Slack’s mascot is named 'Syd the Slackbot'.",
          "Slack introduced Workflow Builder to automate common tasks—no code needed!",
          "Slack has keyboard shortcuts like `Ctrl + K` (or `Cmd + K`) to quickly jump to any conversation."
        ];
     // Randomly select a fact from the array
  const fact = facts[Math.floor(Math.random() * facts.length)];
  await say({
      channel: message.channel,
      text: `🤯 Slack Fact: *${fact}*`
    });

  }
      else {
    await say(`I'm not sure what you mean, <@${message.user}> 🤔`);
  }
});

slackApp.event('app_home_opened', async ({ event, client }) => {
  try {
    await client.views.publish({
      user_id: event.user,
      view: {
        type: 'home',
        callback_id: 'home_view',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `👋 Welcome to *Slack Fact App*, <@${event.user}>!\n\nClick the button below to get a random useless fact.`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Get Slack Fact'
                },
                action_id: 'get_slack_fact'
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: "*Welcome to the Slack Fact App & Jaipur Tableau User Group!* 🎉\nHere's what you can try:"
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: "*🗣️ Type these commands in a channel or DM with the bot:*\n• `hello` – Greet the bot\n• `goodbye` – Say farewell\n• `share the rules` – View our community guidelines\n• `get slack fact` – Receive a random fun fact"
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: "_App brought to you by <@TarunGupta> – stay curious!_"
              }
            ]
          },
          {
            type: 'divider'
          },
        ]
      }
    });
  } catch (error) {
    console.error('Error publishing home view:', error);
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
