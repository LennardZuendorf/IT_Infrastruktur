import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
const ses = new SESClient({ region: "eu-west-1" });

export const handler = async(event) => {

  let body;
  let statusCode = 200;

  const mailings = event.mailings;
  let responseList =[];

  try{
    for(let i=0; i<mailings.length; i++){
      let item = mailings[i];
      console.log(mailings[i])
      let text = "The tracking your requested has the following response:\nThe movie/show you requested, "+String(item.title)+", is available at "+String(item.provider)+".";
      let subject = "Your tracking for "+String(item.title);
      let adress = item.email

      const command = new SendEmailCommand({
        Destination: {
          ToAddresses: [adress],
        },
        Message: {
          Body: {
            Text: { Data: text },
          },

          Subject: { Data: subject },
        },
        Source: "hello@ignitr.tech",
      });

      try {
        let response = await ses.send(command);
        // process data.
        responseList.push(response);
      }
      catch (error) {
        responseList.push(error.message);
      }
    }
  }

  catch (err) {
    statusCode = 400;
    body = err.message;
  }

  body = responseList;

  return {
      statusCode,
      body
  };
};