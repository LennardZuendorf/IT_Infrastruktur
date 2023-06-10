import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient,ScanCommand,} from "@aws-sdk/lib-dynamodb";
import {InvokeCommand, LambdaClient} from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({});
const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tableName = "shows";
const validProviders = ["prime", "apple", "netflix", "disney"]

export const handler = async (event, context) => {
    let body;
    let statusCode = 200;
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers" : "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT"
    };

    try {
        body = await dynamo.send(
            new ScanCommand({
                TableName: tableName,
                FilterExpression: "contains(#title, :title)",
                ExpressionAttributeNames: {
                    "#title": "title",
                },
                ExpressionAttributeValues: {
                    ":title": event.pathParameters.title,
                },
            })
        );
        console.log("requested data from db")
        
        let itemList = body.Items;
        
        if(itemList.length > 0){
            console.log("suitable entries found, checking results")
            statusCode: 200;

        } else {
            console.log("no suitable entries found, calling API")
            
            // If no entries are found, invoke the second Lambda function and wait for the response
            const payloadBytes = new TextEncoder().encode(JSON.stringify({
                "title": event.pathParameters.title,
                "country": event.queryStringParameters.country,
                "type": event.queryStringParameters.type,
            }));
            const invokeParams = {
                FunctionName: 'getavailability',
                InvocationType: 'RequestResponse',
                Payload: payloadBytes
            };
            const invokeCommand = new InvokeCommand(invokeParams);
            const invokeResponse = await lambdaClient.send(invokeCommand);

            if (invokeResponse.StatusCode === 200) {
                
                // If the invocation was successful, handle the response from the second Lambda function
                const responsePayload = JSON.parse(new TextDecoder().decode(invokeResponse.Payload));
                
                // Process the responsePayload
                itemList = responsePayload.Items;
                console.log("successful API service call,checking results")
            } else {
                // If the invocation failed, return an error response
                return {
                    statusCode: invokeResponse.StatusCode,
                    body: JSON.stringify({ message: 'Invocation error' })
                };
            }
        }
        
        body = []
        let titleOutputs=[]
        
        
        console.log("checking data")
        for(let i=0; i<itemList.length; i++){
            
            let item = itemList[i]
            let providerList = item.provider;
            
            if(titleOutputs.includes(item.title.toLowerCase())){
                continue;
            }
            
            for (let idx in providerList){
                if(validProviders.includes(providerList[idx].toLowerCase())){
                     body.push(item);
                     titleOutputs.push(item.title.toLowerCase());
                     break; 
                }
            }

        
            if(body.length==10){
                console.log("found 10 results")
                break;
            }
        }
        
    } catch (err) {
        statusCode = 400;
        body = err.message;
    }
    
    body=JSON.stringify(body);

    return {
        statusCode,
        body ,
        headers,
    };
};
