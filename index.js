require('newrelic');
if (!process.env.SLACK_API_TOKEN) require('dotenv').config();
var express = require('express');
var app     = express();

app.set('port', (process.env.PORT || 5000));

//For avoidong Heroku $PORT error
app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});

console.log(process.env.SLACK_API_TOKEN);

// Required modules
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var WebClient = require('@slack/client').WebClient;
var Client = require('node-rest-client').Client;

// Global variables
var client = new Client({port: process.env.PORT});
var token = process.env.SLACK_API_TOKEN || '';
var apikey = process.env.TICKETMASTER_API_KEY || '';
var rtm = new RtmClient(token);
var web = new WebClient(token);

// Data object for the web.chat.postMessage call
var msgdata = {
	username: "apibot",
	icon_emoji: ":bee:"
};

function sendHelpMenu(message) {
	msgdata.attachments = [{
        "color": "#B7C9D3",
        "title": "Get this help menu",
		"text": "`\\` or `\\ help`",
		"mrkdwn_in": ["text"]
	}, {
        "color": "#768692",
        "title": "Count all events in the API",
		"text": "`\\ count`",
		"mrkdwn_in": ["text"]
	}, {
        "color": "#B7C9D3",
        "title": "Count all events sourced by Ticketmaster",
		"text": "`\\ count ticketmaster`",
		"mrkdwn_in": ["text"]
	}, {
        "color": "#768692",
        "title": "Count all events sourced by Universe in Great Britain",
		"text": "`\\ count universe GB`",
		"mrkdwn_in": ["text"]
	}, {
        "color": "#B7C9D3",
        "title": "Search events by keyword",
		"text": "`\\ search event Adele`",
		"mrkdwn_in": ["text"]
	}, {
        "color": "#768692",
        "title": "Get event details by ID",
		"text": "`\\ get event Z7r9jZ1AvOYAP`",
		"mrkdwn_in": ["text"]
	}, {
        "color": "#B7C9D3",
        "title": "Get event details by source ID",
		"text": "`\\ get:source event 1500508BE50D4ED5`",
		"mrkdwn_in": ["text"]
	}];
    web.chat.postMessage(message.channel, "Hello! I'm your <http://developer.ticketmaster.com|Ticketmaster API> assistant. Here's a few examples of what I can do:", msgdata);
}

function sendEventCard(message, url, data) {
	if (data.name) {
		var attr, ven, seg, loc = "N/A";
		if (data.classifications && data.classifications.length) {
			seg = data.classifications[0].segment.name;
		}
		if (data._embedded && data._embedded.attractions && data._embedded.attractions.length) {
			attr = "<" + data._embedded.attractions[0].url + "|" + data._embedded.attractions[0].name + ">";
		}
		if (data._embedded && data._embedded.venues && data._embedded.venues.length) {
			ven = "<" + data._embedded.venues[0].url + "|" + data._embedded.venues[0].name + ">";
			loc = data._embedded.venues[0].city.name + ", " + data._embedded.venues[0].state.stateCode + " " + data._embedded.venues[0].postalCode + "\n" + data._embedded.venues[0].country.name;
			
		}
		msgdata.attachments = [{
            "color": "#768692",
			"title": "<" + data.url + "|" + data.name + "> ",
			"image_url": data.images[0].url,
			"mrkdwn_in": ["text"]
    	}, {
			"color": "#768692",
			"fields": [{
				"title": "Event ID",
				"value": data.id,
				"short": true
			}, {
				"title": "Source ID",
				"value": data.source.id,
				"short": true
			}, {
				"title": "Source",
				"value": data.source.name,
				"short": true
			}, {
				"title": "Attraction",
				"value": attr,
				"short": true
			}, {
				"title": "Venues",
				"value": ven,
				"short": true
			}, {
				"title": "Segment",
				"value": seg,
				"short": true
			}, {
				"title": "Location",
				"value": loc,
				"short": true
			}, {
				"title": "Status",
				"value": (data.active) ? 'Active' : 'Inactive',
				"short": true
			}]
    	}];
		web.chat.postMessage(message.channel, "Here's the event I found: (<"+ url + "|api call>)", msgdata);
	} else {
		web.chat.postMessage(message.channel, "Hmm, something went wrong. #BlameSylvain. Here's the API call I made: " + url, msgdata);
	}
}

function handleRtmMessage(message) { // listening in on the messages in the channels that added me!
	if (message.type == "message" && message.text && (message.text.substring(0, 1) == "\\" || message.text.substring(0, 13) == '<@U1K1RGWUQ>:')) { // Making sure they're asking me to do something!
		console.log('Message:', message);
		msgdata.attachments = [];
		rtm.sendMessage('...', message.channel);
		// Analyze the command
		var arr = message.text.split(' ');
		if (arr[1]) {
			switch(arr[1]) {
			case 'count':
				var url = "https://app.ticketmaster.com/discovery/v2/events.json?apikey="+ apikey +"&size=1";
				if (arr[2]) {
					url += "&source=" + arr[2];
				}
				if (arr[3]) {
					url += "&countryCode=" + arr[3];
				}
				var source = arr[2] || 'The entire marketplace';
				client.get(url, function (data) {
					if (data.page) {
						var msg = source + ' has a total of *' + data.page.totalElements + '* events';
						if (arr[3]) {
							msg += " in " + arr[3];
						}
						web.chat.postMessage(message.channel, msg, msgdata);
					} else {
						web.chat.postMessage(message.channel, "Hmm, something went wrong. #BlameSylvain. Here's the <" + url + "|API call> I made", msgdata);
					}
				});
				break;
			case 'search':
				if (arr[2]) {
					switch(arr[2]) {
					case 'event':
						if (arr[3]) {
							var url = "https://app.ticketmaster.com/discovery/v2/events.json?keyword=" + arr[3] + "&view=internal&size=1&apikey="+ apikey;
							client.get(url, function (data) {
								sendEventCard(message, url, data._embedded.events[0]);
							});
						} else {
							web.chat.postMessage(message.channel, "I need the event ID", msgdata);
						}
						break;
					case 'attr':
						break;
					case 'venue':
						break;
					default:
						web.chat.postMessage(message.channel, 'Not sure I know what that is :)', msgdata);
						break;
					}
				} else {
					web.chat.postMessage(message.channel, 'What do you want me to get?', msgdata);
				}
				break;
			case 'get':
				if (arr[2]) {
					switch(arr[2]) {
					case 'event':
						if (arr[3]) {
							var url = "https://app.ticketmaster.com/discovery/v2/events/" + arr[3] + ".json?view=internal&apikey="+ apikey;
							client.get(url, function (data) {
								sendEventCard(message, url, data);
							});
						} else {
							web.chat.postMessage(message.channel, "I need the event ID", msgdata);
						}
						break;
					case 'attr':
						break;
					case 'venue':
						break;
					default:
						web.chat.postMessage(message.channel, 'Not sure I know what that is :)', msgdata);
						break;
					}
				} else {
					web.chat.postMessage(message.channel, 'What do you want me to get?', msgdata);
				}
				break;
			case 'get:source':
			case 'legacy':
				if (arr[2]) {
					switch(arr[2]) {
					case 'event':
						if (arr[3]) {
							var url = "https://app.ticketmaster.com/discovery/v2/events/legacy/" + arr[3] + ".json?apikey="+ apikey;
							client.get(url, function (data) {
								sendEventCard(message, url, data);
							});
						} else {
							web.chat.postMessage(message.channel, "I need the event source ID", msgdata);
						}
						break;
					case 'attr':
						break;
					case 'venue':
						break;
					default:
						web.chat.postMessage(message.channel, 'Not sure I know what that is :)', msgdata);
						break;
					}
				} else {
					web.chat.postMessage(message.channel, 'What do you want me to get?', msgdata);
				}
				break;
			case 'help':
				sendHelpMenu(message);
				break;
			case 'list:sources':
				web.chat.postMessage(message.channel, "Our marketplace sports content and data from *Ticketmaster*, *Universe*, *FrontGate*, and *TMR*. You can use the command `\\ count [source]` to get total events from that source.", msgdata);
			}
		} else {
			sendHelpMenu(message);
		}
	}
}

// Start the bot!
rtm.start();
rtm.on(RTM_EVENTS.MESSAGE, handleRtmMessage);
