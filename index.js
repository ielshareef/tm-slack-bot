// Include monitoring and alerting. This is also used to keep the Heroku dyno from idling.
require('newrelic');

// If environment variables aren't defined, load the .env file
if (!process.env.SLACK_API_TOKEN) require('dotenv').config();

// For avoidong Heroku $PORT error, and for being reached by New Relic's monitor
var express = require('express');
var app     = express();
app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
    var result = 'App is running';
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});

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
	username: (process.env.DEV) ? "apibot-dev" : "apibot",
	icon_emoji: (process.env.DEV) ? ":bug:" : ":bee:"
};

// Display variables
console.log("Slack Token: " + process.env.SLACK_API_TOKEN + " | Ticketmaster Key: " + process.env.TICKETMASTER_API_KEY + " | Port: " + process.env.PORT);

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
		"text": "`\\ search:events keyword=Adele`",
		"mrkdwn_in": ["text"]
	}, {
        "color": "#768692",
        "title": "Search events by keyword and country",
		"text": "`\\ search:events keyword=Amy Schumer:countryCode=US`",
		"mrkdwn_in": ["text"]
	}, {
        "color": "#B7C9D3",
        "title": "Get event details by ID",
		"text": "`\\ get event Z7r9jZ1AvOYAP`",
		"mrkdwn_in": ["text"]
	}, {
        "color": "#768692",
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
			seg = data.classifications[0].segment.name || "N/A";
		}
		if (data._embedded && data._embedded.attractions && data._embedded.attractions.length) {
			attr = "<";
			attr += data._embedded.attractions[0].url || "http://";
			attr += "|";
			attr += data._embedded.attractions[0].name || "N/A";
			attr += ">";
		}
		if (data._embedded && data._embedded.venues && data._embedded.venues.length) {
			ven = "<";
			ven += data._embedded.venues[0].url || "http://";
			ven += "|";
			ven += data._embedded.venues[0].name || "N/A";
			ven += ">";
			
			loc = data._embedded.venues[0].city.name || "N/A";
			loc += ", ";
			loc += (data._embedded.venues[0].state) ? data._embedded.venues[0].state.stateCode+" " : "";
			loc += data._embedded.venues[0].postalCode || "N/A";
			loc += "\n" + data._embedded.venues[0].country.countryCode;
			
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
		web.chat.postMessage(message.channel, "Here's the event I found: (<"+ url.replace(process.env.TICKETMASTER_API_KEY, "") + "|api call>)", msgdata);
	} else {
		web.chat.postMessage(message.channel, "Hmm, something went wrong. #BlameSylvain. Here's the API call I made: " + url.replace(process.env.TICKETMASTER_API_KEY, ""), msgdata);
	}
}

function handleRtmMessage(message) { // listening in on the messages in the channels that added me!
	if (message.type == "message" && message.text && message.text.substring(0, 1) == "\\") { // Making sure they're asking me to do something!
		console.log('Message:', message);
		msgdata.attachments = [];
		// rtm.sendMessage('...', message.channel);
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
						web.chat.postMessage(message.channel, "Hmm, something went wrong. #BlameSylvain. Here's the <" + url.replace(process.env.TICKETMASTER_API_KEY, "") + "|API call> I made", msgdata);
					}
				});
				break;
			case 'search:events':
				if (arr[2]) {
					var query = arr.slice(2).join(" ");
					var url = "https://app.ticketmaster.com/discovery/v2/events.json?" + query.replace(/:/g, "&") + "&view=internal&size=1&apikey="+ apikey;
					console.log(url);
					client.get(url, function (data) {
						if (data._embedded && data._embedded.events) {
							sendEventCard(message, url, data._embedded.events[0]);
						} else {
							console.log(data);
							web.chat.postMessage(message.channel, 'No event was found.', msgdata);
						}
					});
				} else {
					web.chat.postMessage(message.channel, 'You need to give me a query to search on ;-)', msgdata);
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
				msgdata.attachments = [{
					"color": "#768692",
					"fields": [{
						"title": "Ticketmaster",
						"value": "All Host markets",
						"short": true
					}, {
						"title": "Universe",
						"value": "All markets",
						"short": true
					}, {
						"title": "Ticketmaster Resale (TMR)",
						"value": "All markets",
						"short": true
					}, {
						"title": "FrontGate",
						"value": "All markets",
						"short": true
					}]
		    	}];
				web.chat.postMessage(message.channel, "", msgdata);
				break;
			default:
				web.chat.postMessage(message.channel, "Sorry, I don't recognize this commamd: " + arr[1], msgdata);
			}
		} else {
			sendHelpMenu(message);
		}
	}
}

// Start the bot!
rtm.start();
rtm.on(RTM_EVENTS.MESSAGE, handleRtmMessage);
