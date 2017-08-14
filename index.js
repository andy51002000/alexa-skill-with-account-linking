'use strict';
var dbhelper = require('./dynamodbHelper');
var iotHelper = require('./awsIoTHelper');

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
    const speechOutput = 'Welcome to the Alexa Skills Kit. ' +
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

    console.log('state:' + intentRequest.dialogState)
    console.log('intentRequest: ' + JSON.stringify(intentRequest))
    if (intentRequest.dialogState !== "COMPLETED") {

        callback({}, buildDialogDelegateResponse());

    } else {

        const slots = intentRequest.intent.slots;
        let queryHashKey = intentRequest.intent.name;

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


        const cardTitle = intentRequest.intent.name;
        dbhelper(queryHashKey, function (res) {

            let speechOutput = res;
            let reprompt = res;
            console.log(reprompt);
            //self.emit(':tell',speechOutput, reprompt);
            callback({},
                buildSpeechletResponse(cardTitle, speechOutput, reprompt, true));
        })
    }
}

function handleIntentRequestDevControl(state, intentRequest, session, callback) {

    var handler = require('./amazonAccountHelper');
    handler(session, function (response, body) {

        if (response.statusCode == 200) {

            var profile = JSON.parse(body);
            console.log(profile);
            const queryHashKey = profile.user_id;
            const cardTitle = intentRequest.intent.name;

            var dbhelper = require('./dynamodbHelper');
            dbhelper(queryHashKey, function (res) {
                console.log('revice:' + JSON.stringify(res));
                const dev = res.Item.devs instanceof Array ? res.Item.devs[0] : res.Item.devs;

                let speechOutput = dev;
                let reprompt = dev;
                console.log(reprompt);
                if (state === 'on') {
                    iotHelper.turnOn(dev, function () {
                        callback({},
                            buildSpeechletResponse(cardTitle, speechOutput, reprompt, true));
                    });
                } else {
                    iotHelper.turnOff(dev, function () {
                        callback({},
                            buildSpeechletResponse(cardTitle, speechOutput, reprompt, true));
                    });
                }



            });



        } else {

            console.log("Hello, I can't connect to Amazon Profile Service right now, try again later");
            callback({},
                buildSpeechletResponse('cardTitle', 'account error', 'account error', true));

        }
    });
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
        handleIntentRequestDevControl('on', intentRequest, session, callback);
    } else if (intentName === 'TurnOffDisplay') {
        handleIntentRequestDevControl('off', intentRequest, session, callback);
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
                });
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
