import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tableName = "trackings";
const crypto = await import('node:crypto');

export const handler = async (event, context) => {
    let body;
    let statusCode = 200;
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers" : "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT"
    };
    try{
        body = await dynamo.send(
        new ScanCommand({
            TableName: tableName,
            FilterExpression: "contains(#userId, :userId)",
            ExpressionAttributeNames: {
                "#userId": "userId", 
            },
            ExpressionAttributeValues: {
                ":userId": event.pathParameters.userId,
            },
        })
    );
    body = body.Items;
        
    } catch (err) {
        statusCode = 400;
        body = err.message;
        
    } finally {
        body = JSON.stringify(body);
    }
    
    return {
        statusCode,
        body,
        headers,
    };
};
