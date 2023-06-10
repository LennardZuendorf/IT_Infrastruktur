import json
import boto3
from botocore.exceptions import ClientError

secret_name = "mainGatewayKey"
region_name = "eu-west-1"

# Create a Secrets Manager client
session = boto3.session.Session()
client = session.client(
    service_name='secretsmanager',
    region_name=region_name
)

def lambda_handler(event, context):
    keyInput = event["headers"]["api-key"]
    isAuthorized = False

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        raise e

    # Decrypts secret using the associated KMS key.
    secret = json.loads(get_secret_value_response['SecretString'])['gateway_key']
    
    if(secret==keyInput):
        isAuthorized = True
        
    return {
        "isAuthorized": isAuthorized,
        "context": {
            "string-api-key": keyInput
        }
    }
