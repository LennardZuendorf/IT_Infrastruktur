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
  };
  
  console.log(event.pathParameters)
  console.log(event.queryStringParameters)
  const newId = crypto.randomUUID()
  
  try {
    await dynamo.send(
      new PutCommand({
        TableName: tableName,
        Item: {
            "id": newId,
            "title":event.queryStringParameters.title,
            "userId":event.pathParameters.userId,
            "email":event.queryStringParameters.email,
            "provider":event.queryStringParameters.provider,
            "type":event.queryStringParameters.type,
            "country":event.queryStringParameters.country
        },
    })
    );
    
    console.log("saved item in db")
    
    let item= {
            "id": newId,
            "title":event.queryStringParameters.title,
            "userId":event.pathParameters.userId,
            "email":event.queryStringParameters.email,
            "provider":event.queryStringParameters.provider,
            "type":event.queryStringParameters.type,
            "country":event.queryStringParameters.country
    }
        
        
    body=item
  }
  
  catch (err) {
        
    statusCode = 400;
    body = err.message;
  } 
  
  finally {
    body = JSON.stringify(body);
        
    }

    return {
        statusCode,
        body,
        headers,
    };
};
