'use strict';
//require aws sdk
var AWS = require("aws-sdk");
AWS.config.loadFromPath('./config.json');
var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

var dbHelper = require('dynamodb-helper');
var Users = new dbHelper(docClient, 'Users');

//create iotdata object
const endpoint = require('./iotConfig.json');
var iotdata = new AWS.IotData(endpoint);

//require alexa-iot-helper 
// and create alexaIotHelper object
var alexaIotHelper = require('alexa-iot-helper');
var player = new alexaIotHelper.ctrMediaPlayer(iotdata);
var monitor = new alexaIotHelper.ctrMonitor(iotdata);
var mysystem = new alexaIotHelper.ctrSystem(iotdata);
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

// --------------- Some uesful function -----------------------------------------
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function makeQueryHashKey(initValue, slots) {
    let queryHashKey = initValue;
    if (!isEmpty(slots)) {
        console.log('check slots');
        // Need slots
        if (slots instanceof Array) {
            slots.forEach(function (element, index, arr) {
                let slotsValue = element[Object.keys(element)].value.replace(/ /g, "");
                queryHashKey = queryHashKey + `_${slotsValue}`;
            })
        }
        else {
            let slotsValue = slots[Object.keys(slots)].value;
            if (slotsValue !== 'undefined') {
                queryHashKey = queryHashKey + `_${slotsValue.replace(/ /g, "")}`;
            }
        }

        console.log(queryHashKey)
    }
    return queryHashKey
}

// --------------- Helpers that build all of the responses -----------------------

function buildDialogDelegateResponse() {
    return {
        outputSpeech: null,
        card: null,
        reprompt: null,
        directives: [{

            type: "Dialog.Delegate"

        }],
        shouldEndSession: false,
    };
}

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Hi there! I am Nancy. ' +
        'How can I help you';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'how can I help you ';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for trying the Alexa Skills Kit. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}



function handleIntentRequest(intentRequest, session, callback) {

    let speechOutput = 'no match intent';
    let reprompt = 'no match intent';
    console.log(reprompt);
    callback({},
        buildSpeechletResponse(cardTitle, speechOutput, reprompt, true));

}

function findDevice(devs, name) {
    console.log(`dev:${devs} ,request:${name}`);
    let sn;
    devs.forEach(function (element, index, arr) {
        console.log(element);
        if (element.name.toLowerCase() === name.toLowerCase()
            || element.name.toLowerCase().indexOf(name.toLowerCase()) > -1) {
            console.log(`find ${name}`);
            sn = element.sn;
            //return false;//break the loop
        }
    });
    console.log(`exit findDevice: ${sn}`);
    return sn;

}

function handleIntentRequestDevControl(intentRequest, session, callback) {

    console.log('state:' + intentRequest.dialogState)
    console.log('intentRequest: ' + JSON.stringify(intentRequest))
    if (intentRequest.dialogState !== "COMPLETED") {

        callback({}, buildDialogDelegateResponse());
        return;
    }//END Dialog

    const devName = intentRequest.intent.slots.device.value;
    var handler = require('./amazonAccountHelper');
    handler(session, function (response, body) {

        if (response.statusCode !== 200) {

            console.log("Hello, I can't connect to Amazon Profile Service right now, try again later");
            callback({},
                buildSpeechletResponse('cardTitle', 'account error', 'account error', true));
            return;
        }//END Dialog



        //get user id
        var profile = JSON.parse(body);
        console.log(profile);
        const queryHashKey = profile.user_id;
        const intentName = intentRequest.intent.name;
        const cardTitle = intentName;

        //query dynamoDb by id to get device
        Users.find(queryHashKey, function (err, data) {
            console.log('receive:' + JSON.stringify(data));

            // check data
            if (isEmpty(data) || err) {
                console.log('empty response');
                callback({},
                    buildSpeechletResponse(cardTitle, 'I can not find your device', '', true));
                return;
            }

            //const dev = res.Item.devs instanceof Array ? res.Item.devs[0] : res.Item.devs;
            var dev = findDevice(data.Item.devs, devName);
            if (dev === undefined) {
                callback({},
                    buildSpeechletResponse(cardTitle, 'I can not find your device', '', true));
                return;
            }//END

            let speechOutput = dev;
            let reprompt = dev;
            console.log(reprompt);
            devControl(intentName, dev, callback);
        });

    });

}

function devControl(intentName, dev, callback) {

    let speechOutput = "okay, just a moment";
    let reprompt = "okay";
    console.log(reprompt);

    switch (intentName) {

        case "TurnOnDisplay":
            console.log('try turn on')
            monitor.turnOn(dev, function () {
                callback({},
                    buildSpeechletResponse(intentName, speechOutput, reprompt, true));
            });
            break;
        case "TurnOffDisplay":
            console.log('try turn off')

            monitor.turnOff(dev, function () {
                callback({},
                    buildSpeechletResponse(intentName, speechOutput, reprompt, true));
            });
            break;
        case "MusicPlay":
            console.log('try music play')

            player.play(dev, function () {
                callback({},
                    buildSpeechletResponse(intentName, speechOutput, reprompt, true));
            });
            break;
        case "MusicNext":
            console.log('try music next')

            player.next(dev, function () {
                callback({},
                    buildSpeechletResponse(intentName, speechOutput, reprompt, true));
            });
            break;
        case "MusicPause":
            console.log('try music pause')

            player.pause(dev, function () {
                callback({},
                    buildSpeechletResponse(intentName, speechOutput, reprompt, true));
            });
            break;
        case "MusicPreviouse":
            console.log('try music previours')

            player.pre(dev, function () {
                callback({},
                    buildSpeechletResponse(intentName, speechOutput, reprompt, true));
            });
            break;
        case "MusicOpen":
            console.log('try open media player')

            player.open(dev, function () {
                callback({},
                    buildSpeechletResponse(intentName, speechOutput, reprompt, true));
            });
            break;
        case "SystemOff":
            console.log('try remotely shutdown system');
            mysystem.shutdown(dev, function(){
                callback({},
                    buildSpeechletResponse(intentName, speechOutput, reprompt, true));
            });
            
        default:
            break;
    }

}



// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else if (intentName === 'TurnOnDisplay') {
        handleIntentRequestDevControl(intentRequest, session, callback);
    } else if (intentName === 'TurnOffDisplay') {
        handleIntentRequestDevControl(intentRequest, session, callback);
    } else if (intentName === 'MusicPlay') {
        handleIntentRequestDevControl(intentRequest, session, callback);
    } else if (intentName === 'MusicNext') {
        handleIntentRequestDevControl(intentRequest, session, callback);
    } else if (intentName === 'MusicPause') {
        handleIntentRequestDevControl(intentRequest, session, callback);
    } else if (intentName === 'MusicPreviouse') {
        handleIntentRequestDevControl(intentRequest, session, callback);
    } else if (intentName === 'MusicOpen') {
        handleIntentRequestDevControl(intentRequest, session, callback);
    }
    else
        handleIntentRequest(intentRequest, session, callback);

}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {

        console.log(`alexa request=${JSON.stringify(event)}`);
        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                }
            );
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
