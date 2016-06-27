# The Ticketmaster API Slack Bot


## Setup and Installation

Before you're able to use the Ticketmaster API Slack Bot, you'll to [set up a bot](https://api.slack.com/bot-users) in your Slack. This will give you a Slack API Token, which you'll need in a bit.

To install the the bot, run the following:

```bashp
npm install ticketmaster-slack-bot
cd node_modules/ticketmaster-slack-bot
```

Now you're in the root directory. You can copy the contents of this directory anywhere else you like. Before you can start using the bot, you'll need to define the following *environment variables*:

SLACK_API_TOKEN={your Slack API token}
TICKETMASTER_API_KEY={you Ticketmaster API Key}

If you're running the bot locally, create a .env in the root directroy and the bot will automatically pick up the variables:

```bashp
vi .env
SLACK_API_TOKEN={your Slack API token}
TICKETMASTER_API_KEY={you Ticketmaster API Key}
```

Now you can run the bot!

```bashp
node index.js
```

## Usage

You can communicate with the bot directly in Slack, or invite it into a channel. Here are a few things you can do with Slack:

### Getting help

```
\
```

OR

```
\ help
```

### Getting total amounts

Total number of events in the entire Ticketmaster Marketplace!

```
\ count
```

Total number of events sourced by FrontGate Tickets. Here's all [available sources](http://developer.ticketmaster.com/products-and-docs/apis/discovery/v2/#supported-sources).

```
\ count frontgate
```

Total number of events sourced by Ticketmaster for Canada and Mexico. Here's all [available sources](http://developer.ticketmaster.com/products-and-docs/apis/discovery/v2/#supported-sources) and [countries](http://developer.ticketmaster.com/products-and-docs/apis/discovery/v2/#supported-country-codes).

```
\ count ticketmaster CA,MX
```

### Getting event details

Get event details for event ID vvG10Zf5X_03A9.

```
\ get event vvG10Zf5X_03A9
```

Get event details for event **source ID** 090050BF99912157.

```
\ get:source event 090050BF99912157
```

### Sarching by keyword

Search for Adele events

```
\ search event Adele
```


## License

MIT License; see LICENSE for further details.