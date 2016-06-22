# The Ticketmaster API Slack Bot


## Setup and Installation

Before you're able to use the bot, you'll need to set up an envinronment variable with your Slack API Token:

```bashp
export SLACK_API_TOKEN=api-token
```

Also, make sure you store this variable in `/etc/environments`

If you're using Heroku, set your variable there as well:

```bashp
heroku config:set SLACK_API_TOKEN="api-token"
```

Download the codebase and install all dependencies

```bashp
npm install
```

Start the bot!

```bashp
npm start
```

