import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { readEnv } from "./utils";

export async function handler(event: APIGatewayEvent) {
  if (!event.pathParameters || event.pathParameters.id === "") {
    return {
      statusCode: 422,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ message: "Arguments not available" })
    };
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
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(res.Item, undefined, 2)
      };
    } else {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ message: `Job not found: ${jobId}` })
      };
    }
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ message: `Failed to query job state: ${err}` })
    };
  }
}
