const endpoint = require('./project.json');
var AWS = require("aws-sdk");
AWS.config.update({region:'us-east-1'});
var iotdata = new AWS.IotData(endpoint);

var ctrMonitor = {
    turnOff: function (clientId, callback) {

        var mythingstate = {
            "state": {
                "desired": {
                    "monitor": "off" //update your state here.
                },

                "reported": {
                    "monitor": "on" //update your state here.
                }

            }
        }

        var params = {
            payload: JSON.stringify(mythingstate),
            /* required */
            thingName: clientId /* required */
        };
        iotdata.updateThingShadow(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data); // successful response
        });
        // context.succeed(
        //     generateResponse(
        //         buildSpeechletResponse(`Okay i trying to turn off`, true), {}
        //     )
        // )
        callback();
    },
    turnOn: function (clientId, callback) {

        var mythingstate = {
            "state": {
                "desired": {
                    "monitor": "on" //update your state here.
                },

                "reported": {
                    "monitor": "off" //update your state here.
                }

            }
        }

        var params = {
            payload: JSON.stringify(mythingstate),
            /* required */
            thingName: clientId /* required */
        };
        iotdata.updateThingShadow(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data); // successful response
        });
        // context.succeed(
        //     generateResponse(
        //         buildSpeechletResponse(`Okay i trying to turn off`, true), {}
        //     )
        // )
        callback();
    }
}






module.exports = ctrMonitor;

