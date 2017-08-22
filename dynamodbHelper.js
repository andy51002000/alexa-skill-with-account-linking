var AWS = require("aws-sdk");
AWS.config.loadFromPath('./config.json');
var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });



function dbHelper(tableName, queryItem) {
    this.tableName = tableName;
    this.queryItem = queryItem;
}

dbHelper.prototype.find = function (callback, queryItem) {

    var params = {
        TableName: this.tableName,
        Key: { id: queryItem || this.queryItem } 
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
        Item: item || this.queryItem
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



