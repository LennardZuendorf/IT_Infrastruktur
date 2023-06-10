import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import querystring from 'querystring';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
    DynamoDBDocumentClient,
    ScanCommand,
    PutCommand,
    GetCommand,
    DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

import {
SecretsManagerClient,
GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tableName = "trackings";
const crypto = await import('node:crypto');
const secret_name = "rapidAPI";
const SecretClient = new SecretsManagerClient({
    region: "eu-west-1",
    
});

export const handler = async (event) => {
    let SecretResponse;
    let body;
    let statusCode = 200;
    const headers = {
        "Content-Type": "application/json",

    };

    try {
      SecretResponse = await SecretClient.send(
        new GetSecretValueCommand({
          SecretId: secret_name,
          VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
        })
      );
    } catch (error) {
      // For a list of exceptions thrown, see
      // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
      throw error;
    }
    
    let secret =  SecretResponse.SecretString;
    secret = JSON.parse(secret)

    const params = {
        title: event.title,
        country: event.country,
        show_type: event.type,
        output_language: 'en'
    };

    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': secret.rapidKey,
            'X-RapidAPI-Host': secret.rapidHost
        }
    };

    const country = event.country;
    
    try {
        const queryString = querystring.stringify(params);
        const response = await fetch(`https://streaming-availability.p.rapidapi.com/v2/search/title?${queryString}`, options);
        const jsonString = await response.text();

        const apiResponse = JSON.parse(jsonString);



        const results = apiResponse.result;
        const extractedItems = results
            .map(result => {
                const { title, type, overview, year, originalLanguage, youtubeTrailerVideoLink } = result;
                const posterURLs = result.posterURLs.original
                const streamingInfo = result.streamingInfo[country]

                if (title && type && overview && year && originalLanguage && youtubeTrailerVideoLink && posterURLs && streamingInfo && typeof streamingInfo === 'object') {
                    const streamingInfoKeys = Object.keys(streamingInfo);
                    return { title, overview, type, year, country, provider: streamingInfoKeys, originalLanguage, youtubeTrailerVideoLink, posterURLs };
                }
                
                return null;

            })
            .filter(item => item !== null);

        let body = [];
        


        const itemsToSave = extractedItems.slice(0, 20);
        const expirationTime = new Date();
        expirationTime.setDate(expirationTime.getDate() + 14); // Add 14 days to the current date
        const expirationTimestamp = Math.floor(expirationTime.getTime() / 1000); // Convert expirationTime to Unix timestamp in seconds
        for (const item of itemsToSave){
            const newId = uuidv4();
            const newItem = {
                id : newId,
                title: item.title,
                description: item.overview,
                type: item.type,
                year: item.year,
                country: item.country,
                provider: item.provider,
                originalLanguage: item.originalLanguage,
                youtubeTrailerVideoLink: item.youtubeTrailerVideoLink,
                posterURL: item.posterURLs,
                ttl: expirationTimestamp
            };
            body.push(newItem);
            const putCommand = new PutCommand({
                TableName: "shows",
                Item: newItem
            });
            await dynamo.send(putCommand);
        }
        
    



        return {
            statusCode: 200,
            body: JSON.stringify(body)
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify(error.message)
        };
    }
};
