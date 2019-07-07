import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { readEnv, error, response } from "./utils";

export async function handler(event: APIGatewayEvent) {
  if (!event.pathParameters || event.pathParameters.id === "") {
    return error(422, "Arguments not available");
  }

  try {
    const jobId = event.pathParameters.id;

    const dynamo = new DynamoDB.DocumentClient();
    const query: DynamoDB.DocumentClient.GetItemInput = {
      TableName: readEnv("TABLE_NAME"),
      Key: {
        id: jobId
      }
    };
    const res = await dynamo.get(query).promise();

    if (res.Item) {
      return response(200, res.Item);
    } else {
      return error(404, `Job not found: ${jobId}`);
    }
  } catch (err) {
    console.error(err);
    return error(500, `Failed to query job state: ${err}`);
  }
}
