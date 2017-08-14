var AWS = require("aws-sdk");
AWS.config.update({region:'us-east-1'});
var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

var getItem =
    function (queryHashKey, callback) {

        var params = {
            TableName: 'Users',
            Key: { id: queryHashKey }
        };

        console.log(`Get the answer from database with particular slot`);
        docClient.get(params, function (err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data.Item);
            }
            callback(data);
        });



    }


module.exports = getItem;


