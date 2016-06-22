console.log(process.env.SLACK_API_TOKEN);

// Slack SDK
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

// NPM REST Client
var Client = require('node-rest-client').Client;
 
var client = new Client();

var token = process.env.SLACK_API_TOKEN || '';

var rtm = new RtmClient(token);
rtm.start();

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
	// Making sure it's the right command
	if (message.type == "message" && message.text.substring(0, 13) == '<@U1K1RGWUQ>:') {
		rtm.sendMessage('...', message.channel);
		console.log('Message:', message);
		// Analyze the command
		var arr = message.text.split(' ');
		if (arr[1]) {
			switch(arr[1]) {
			case 'count':
				var url = "https://app.ticketmaster.com/discovery/v2/events.json?apikey=7elxdku9GGG5k8j0Xm8KWdANDgecHMV0&size=1";
				if (arr[2]) {
					url += "&source=" + arr[2];
				}
				if (arr[3]) {
					url += "&countryCode=" + arr[3];
				}
				var source = arr[2] || 'The entire marketplace';
				client.get(url, function (data) {
					if (data.page) {
						var msg = source + ' has a total of ' + data.page.totalElements + ' events';
						if (arr[3]) {
							msg += " in " + arr[3];
						}
						rtm.sendMessage(msg, message.channel);
					} else {
						console.log(url, data);
						rtm.sendMessage("Hmm, something went wrong. I'll ping Carol!", message.channel);
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
							var url = "https://app.ticketmaster.com/discovery/v2/events/" + arr[3] + ".json?apikey=7elxdku9GGG5k8j0Xm8KWdANDgecHMV0";
							client.get(url, function (data) {
								if (data.name) {
									rtm.sendMessage("The event title is " + data.name, message.channel);
								} else {
									console.log(url, data);
									rtm.sendMessage("Hmm, something went wrong. I'll ping Carol!", message.channel);
								}
							});
						} else {
							rtm.sendMessage("I need the event ID", message.channel);
						}
						break;
					case 'attr':
						break;
					case 'venue':
						break;
					default:
						rtm.sendMessage('Not sure I know what that is :)', message.channel);
						break;
					}
				} else {
					rtm.sendMessage('What do you want me to get?', message.channel);
				}
				break;
			}
		} else {
		    rtm.sendMessage('Um, you actually need to tell me what to do ;)', message.channel);
		}
	}
});


/* 

message.channel == "C1K2A5Z7S"
rtm.sendMessage('Total number of events is 32044', message.channel, function messageSent() {
	      // optionally, you can supply a callback to execute once the message has been sent
});

*/