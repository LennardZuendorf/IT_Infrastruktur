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
const tableName = "tracking";
const crypto = await import('node:crypto');

export const handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    switch (event.routeKey) {
      case "DELETE /{id}":
        await dynamo.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              id: event.pathParameters.id,
            },
          })
        );
        body = `Deleted item ${event.pathParameters.id}`;
        break;
      case "GET /{id}":
        body = await dynamo.send(
            new ScanCommand({
                TableName: tableName,
                FilterExpression: "contains(#userId, :userId)",
                ExpressionAttributeNames: {
                    "#userId": "userId", 
                },
                ExpressionAttributeValues: {
                    ":userId": event.pathParameters.id,
                },
            })
        );
        body = body.Items;
        break;
      case "PUT /":
        let requestJSON = JSON.parse(event.body);
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              id: requestJSON.id,
              title: requestJSON.title,
              type: requestJSON.type,
              year: requestJSON.year,
              userId: requestJSON.userId,
              email: requestJSON.email,
              country: requestJSON.country,
              service: requestJSON.service
            },
          })
        );
        body = `Put tracker with id ${requestJSON.id} for ${requestJSON.email}`;
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
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
