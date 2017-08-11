var request = require('request');



var getUserProfile =  function (session,callback) {
    
    var amznProfileURL = 'https://api.amazon.com/user/profile?access_token=';

    amznProfileURL += session.user.accessToken;

    request(amznProfileURL, function (error, response, body) {

        callback(response,body);
        /*
        if (response.statusCode == 200) {

            var profile = JSON.parse(body);
            console.log(profile);
            console.log("Hello, " + profile.name.split(" ")[0]);

        } else {

            console.log("Hello, I can't connect to Amazon Profile Service right now, try again later");

        }*/

    });
}

module.exports = getUserProfile;



