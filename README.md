# restmqtt
Translates between MQTT and REST.

This script is intended to be run continously on a server. It connects to an MQTT broker and also acts as a webserver and accepts HTTP requests. It then translates between these protocols as explained below.

## Usage

It is started simply with:

    restmqtt configfile.json

The configuration file should look something like this:

```
{
	"server": "gqtt://mqttserver.example.com",
	"username": "<mqttuser>",
	"password": "<mqttpassword>",
	"port": "<mqttport>",

	"listen": "<httpport>",

	"topics": {
		"hello": {
			"url": "http://myserver.example.com/script.php"
		},

		"test": {}
	}
}
```

The program then does 3 things:

### Forward MQTT messages to a REST url
Any MQTT messages received on `hello` topic will be forwarded to the url `http://myserver.example.com/script.php`.

### Forward REST request as MQTT messages
For this example, say that the restmqtt server is residing on `rest.example.com` and listening to port `8080`. Then all requests to:

    http://rest.example.com/publish/mytopic

Will be forwarded to the MQTT topic `mytopic`.

### Forward REST request as MQTT messages, and wait for a reply
Say that the restmqtt server is configured as in the previous example. Then, if the restmqtt server receives a request on this url:

    http://rest.example.com/req/test

The restmqtt server will send the message to the MQTT topic `test` with the string `__req=9453ffe1-2fd5-48c0-91f8-00bc66e15619` appended. The UUID number is generated automatically by restmqtt.

It is then expected that an MQTT device on the network replies, this time with the string `__res=9453ffe1-2fd5-48c0-91f8-00bc66e15619` as part of the message. As restmqtt sees this MQTT message, the contents of the message will be returned as the response for the REST call.
