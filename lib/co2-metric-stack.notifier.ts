import * as AWS from 'aws-sdk';
import axios from 'axios';
import { Context, SNSEvent, SNSHandler } from 'aws-lambda';

const ssm = new AWS.SSM({ apiVersion: '2017-10-17' });

export const handler: SNSHandler = async (
  event: SNSEvent,
  _: Context
): Promise<void> => {
  console.log(event);
  const response = await ssm.getParameter({
    Name: process.env.ParamName!,
    WithDecryption: true,
  }).promise();
  const discordWebhookURL = response.Parameter!.Value!;

  const statusChangeMessage = JSON.parse(event.Records[0].Sns.Message);
  const content = `${statusChangeMessage['NewStateValue']} - ${statusChangeMessage['NewStateReason']}`;

  const res = await axios.post(discordWebhookURL, {
    username: 'CO2 Alarm',
    content,
  }, {
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json',
    }
  });
};
