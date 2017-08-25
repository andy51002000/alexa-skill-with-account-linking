var AWS = require("aws-sdk");
AWS.config.loadFromPath('./config.json');
var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });



function dbHelper(tableName) {
    this.tableName = tableName;
 
}

dbHelper.prototype.find = function (queryHashkey, callback ) {

    var params = {
        TableName: this.tableName,
        Key: { id: queryHashkey } 
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

/*
{
    'id': id,
    'devs': 'testclient2'

}
*/
dbHelper.prototype.putItem = function (item) {

    var params = {
        TableName: this.tableName,
        Item: item 
    };

    docClient.put(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data);

        }
    });


}



module.exports = dbHelper



