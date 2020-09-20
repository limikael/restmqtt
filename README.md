# restmqtt
Translates between MQTT and REST.

This script is intended to be run continously on a server. It connects to an MQTT broker. It also acts as a webserver and accepts HTTP requests.
It is started simply with:

    restmqtt configfile.json

The configuration file should look like:

`
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
`
