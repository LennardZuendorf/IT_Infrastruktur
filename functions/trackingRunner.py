import json
import boto3

db_client = boto3.client('dynamodb')
lambda_client = boto3.client('lambda')
dynamodb = boto3.resource('dynamodb')
trackings_table = dynamodb.Table('trackings')


def handler(event, context):
    global responsePayload
    mailItems = []
    delTrackings = []
    showItems = None
    trackingItems = None
    statusCode = 200

    try:
        trackingItems = db_client.scan(TableName='trackings')['Items']

        for trackingItem in trackingItems:
            lambda_payload = {
                "pathParameters": {
                    "title": trackingItem['title']['S']

                },
                "queryStringParameters": {
                    "provider": trackingItem['provider']['S'],
                    "country": trackingItem['country']['S'],
                    "type": trackingItem['type']['S']
                }
            }
            lambda_payload = json.dumps(lambda_payload).encode("utf-8")
            print("das ist payload", lambda_payload)
            invoke_response = lambda_client.invoke(FunctionName='availabilityService',
                                                   InvocationType='RequestResponse', Payload=lambda_payload)
            print(invoke_response)
            if invoke_response['StatusCode'] == 200:
                print("succesfully invoked availabilityService")

                responsePayload = invoke_response["Payload"].read().decode("utf-8")

                showItems = json.loads(responsePayload)["body"]

                showItems = json.loads(showItems)


            else:
                print("failed to invoke function")
                statusCode = invoke_response["StatusCode"]
                body = json.dumps(responsePayload)

                return {
                    "statusCode": statusCode,
                    "body": body
                }



            # Hier vielleicht nochmal Umschreiben
            for showItem in showItems:
                if (showItem["title"].lower() == trackingItem["title"]['S'].lower()):
                    mailItems.append({
                        "title": trackingItem["title"]['S'],
                        "email": trackingItem["email"]['S'],
                        "provider": trackingItem['provider']['S'],
                    })
                    delTrackings.append({"id": trackingItem["id"]['S']})
                    break

        if len(mailItems) > 0:

            # Invoking mailtrigger lambda
            lambda_payload = {
                "mailings": mailItems

            }

            lambda_payload = json.dumps(lambda_payload).encode("utf-8")
            invoke_response = lambda_client.invoke(FunctionName='emailTrigger', InvocationType='RequestResponse',
                                                   Payload=lambda_payload)

            if invoke_response['StatusCode'] == 200:
                print("emailTrigger succesfully invoked")

            else:
                print("emailTrigger Invocation error")
                statusCode = invoke_response['StatusCode']

        for tracking in delTrackings:
            print("deleting trackingItems")
            print(statusCode)

            trackings_table.delete_item(Key={
                'id': tracking["id"]
            })


    except:
        statusCode = 400

    if bool(trackingItems) == False:
        print("no trackings in the db!")
    elif bool(mailItems) == False:
        print("no fitting trackings, no mails sent!")

    return {
        'statusCode': statusCode,
        'foundTrackings': trackingItems,
        'mailItems': mailItems,
        'delTrackings': delTrackings
    }