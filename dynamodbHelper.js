var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB();

var getItem = function (queryHashKey, callback) {

    var params = {
        ExpressionAttributeNames: {

            "#t": "type"
        },
        ExpressionAttributeValues: {
            ":v1": { S: `${queryHashKey}` },
            ":v2": { S: 'none' }
        },


        KeyConditionExpression: "ask = :v1 and #t = :v2",
        ProjectionExpression: "ask, ans",
        TableName: "FAQ"
    };


    console.log(`Get the answer from database with particular slot`);
    dynamodb.query(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data);           // successful response

        callback(`The answer is: ${data.Items[0].ans.S} `);
        //return `The answer is: ${data.Items[0].ans.S} `;
    })



}

module.exports  = getItem;


