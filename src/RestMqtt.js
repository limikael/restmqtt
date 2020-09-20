const mqtt=require("mqtt");
const express=require("express");
const bodyParser=require("body-parser");
const fetch=require("node-fetch");
const querystring=require("querystring");
const uuid=require("uuid");

class RestMqtt {
	constructor(settings) {
		this.requests={};
		this.settings=settings;
		if (!this.settings.topics)
			this.settings.topics={};
	}

	logSubscribe=(err, granted)=>{
		if (granted && granted[0].topic)
			console.log("** Subscribed to: "+granted[0].topic);

		else
			console.log("** Subscription error: "+err);
	}

	handleMessage=async (topic, message)=>{
		message=querystring.parse(String(message));

		if (message.__res) {
			if (!this.requests[message.__res]) {
				console.log("** Got response, but no request.");
				return;
			}

			console.log("** Replying to request: "+message.__res);
			let res=this.requests[message.__res];
			delete this.requests[message.__res];
			delete message.__res;

			res.end(querystring.stringify(message));
		}

		else if (this.settings.topics[topic] &&
				this.settings.topics[topic].url &&
				!message.__req &&
				!message.__res) {
			let url=this.settings.topics[topic].url;
			console.log("** From topic '"+topic+"' to url: "+url);
			let response=await fetch(url,{
				"method": "post",
				"body": querystring.stringify(message),
				"headers": {"Content-Type":"application/x-www-form-urlencoded"}
			});
			console.log("** Status: "+response.status);
		}

		else if (message.__req &&
				this.settings.topics[topic] && 
				this.settings.topics[topic].emulatereply) {
			console.log("** Emulating reply...");

			message.__res=message.__req;
			delete message.__req;

			this.mqttClient.publish(topic,querystring.stringify(message));
		}

		else if (!message.__req && !message.__res) {
			console.log(
				"** Got message on unconfigured channel '"+topic+
				"', ignoring: "+querystring.stringify(message)
			);
		}
	}

	handlePublishRequest=(req, res)=>{
		if (!this.mqttClient.connected) {
			console.log("** Can't publish, not connected");
			res.status(500).end("MQTT not connected.");
			return;
		}

		let topic=req.params[0];
		let message=querystring.stringify(req.body);

		console.log("** Publishing on '"+topic+"': "+message);
		this.mqttClient.publish(topic,message);

		res.end('{"ok":1}\n');
	}

	handleReqRequest=(req, res)=>{
		if (!this.mqttClient.connected) {
			console.log("** Can't handle request, not connected");
			res.status(500).end("MQTT not connected.");
			return;
		}

		let topic=req.params[0];
		if (!this.settings.topics[topic]) {
			console.log("** Unknown topic");
			res.status(500).end("Unknown topic.");
			return;
		}

		let message=req.body;
		message.__req=uuid.v4();
		let encoded=querystring.stringify(message);

		console.log("** Publishing request on '"+topic+"': "+encoded);
		this.mqttClient.publish(topic,encoded);
		this.requests[message.__req]=res;
	}

	startMqtt() {
		this.mqttClient=mqtt.connect(this.settings.server,{
			username: this.settings.username,
			password: this.settings.password,
			port: this.settings.port
		});

		for (let topic in this.settings.topics)
			this.mqttClient.subscribe(topic,{},this.logSubscribe);

		this.mqttClient.on("connect",()=>{
			console.log("** Mqtt: Connected.");
		});

		this.mqttClient.on("offline",()=>{
			console.log("** Mqtt: Offline.");
		});

		this.mqttClient.on("error",()=>{
			console.log("** Mqtt: Connection error.");
		});

		this.mqttClient.on("message",this.handleMessage);
	}

	startApp() {
		this.app=express();
		this.app.use(bodyParser.urlencoded({extended: true}));

		this.app.post("/publish/*",this.handlePublishRequest);
		this.app.post("/req/*",this.handleReqRequest);

		this.app.listen(this.settings.listen,()=>{
			console.log("** Listening to: "+this.settings.listen);
		});
	}

	run() {
		console.log("Starting...");
		this.startMqtt();
		this.startApp();
	}
}

module.exports=RestMqtt;