console.log(process.env.SLACK_API_TOKEN);

// Required modules
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var WebClient = require('@slack/client').WebClient;
var Client = require('node-rest-client').Client;

// Global variables
var client = new Client();
var token = process.env.SLACK_API_TOKEN || '';
var apikey = process.env.TICKETMASTER_API_KEY || '';
var rtm = new RtmClient(token);
var web = new WebClient(token);
// Data object for the web.chat.postMessage call
var msgdata = {
	username: "apibot",
	icon_emoji: ":bee:"
};

// Start the bot!
rtm.start();
rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) { // listening in on the messages in the channels that added me!
	if (message.type == "message" && message.text && message.text.substring(0, 13) == '<@U1K1RGWUQ>:') { // Making sure they're asking me to do something!
		//console.log('Message:', message);
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
				
				break;
			case 'get':
				if (arr[2]) {
					switch(arr[2]) {
					case 'event':
						if (arr[3]) {
							var url = "https://app.ticketmaster.com/discovery/v2/events/" + arr[3] + ".json?apikey="+ apikey;
							client.get(url, function (data) {
								if (data.name) {
									web.chat.postMessage(message.channel, "The event title is " + data.name, msgdata);
								} else {
									web.chat.postMessage(message.channel, "Hmm, something went wrong. #BlameSylvain. Here's the API call I made: " + url, msgdata);
								}
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
			case 'legacy':
				if (arr[2]) {
					switch(arr[2]) {
					case 'event':
						if (arr[3]) {
							var url = "https://app.ticketmaster.com/discovery/v2/events/legacy/" + arr[3] + ".json?apikey="+ apikey;
							client.get(url, function (data) {
								if (data.name) {
									var attr, ven, seg, loc = "N/A";
									if (data.classifications.length) {
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
			}
		} else {
			msgdata.attachments = [{
	            "color": "#768692",
	            "title": "Count all events in the API",
				"text": "`@apibot: count`",
				"mrkdwn_in": ["text"]
        	}, {
	            "color": "#B7C9D3",
	            "title": "Count all events sourced by Ticketmaster",
				"text": "`@apibot: count ticketmaster`",
				"mrkdwn_in": ["text"]
        	}, {
	            "color": "#768692",
	            "title": "Count all events sourced by Universe in Canada",
				"text": "`@apibot: count universe CA`",
				"mrkdwn_in": ["text"]
        	}, {
	            "color": "#B7C9D3",
	            "title": "Get event details by ID",
				"text": "`@apibot: get event Z7r9jZ1AvOYAP`",
				"mrkdwn_in": ["text"]
        	}, {
	            "color": "#B7C9D3",
	            "title": "Get event details by source ID",
				"text": "`@apibot: legacy event 19004F8BA9A52268`",
				"mrkdwn_in": ["text"]
        	}];
		    web.chat.postMessage(message.channel, "Hello! I'm your <http://developer.ticketmaster.com|Ticketmaster API> assistant. Here's a few examples of what I can do:", msgdata);
		}
	}
});


/* 

message.channel == "C1K2A5Z7S"
rtm.sendMessage('Total number of events is 32044', message.channel, function messageSent() {
	      // optionally, you can supply a callback to execute once the message has been sent
});

*/