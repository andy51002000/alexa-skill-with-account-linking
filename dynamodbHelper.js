var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB();

var getItem =
    function (queryHashKey, callback) {

        var params = {

            ExpressionAttributeValues: {
                ":v1": { S: `${queryHashKey}` }

            },


            KeyConditionExpression: "id = :v1 ",
            ProjectionExpression: "id, devs",
            TableName: "Users"
        };


        console.log(`Get the answer from database with particular slot`);
        dynamodb.query(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(JSON.stringify(data));           // successful response

            callback(data.Items[0].devs.L);

        })



    }


module.exports = getItem;


