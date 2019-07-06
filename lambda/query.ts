import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { readEnv } from "./utils";

export async function handler(event: APIGatewayEvent) {
  if (!event.pathParameters || event.pathParameters.id === "") {
    return {
      statusCode: 422,
      headers: { "Content-Type": "text/plain" },
      body: `Arguments not available`
    };
  }

  try {
    const dynamo = new DynamoDB.DocumentClient();
    const query: DynamoDB.GetItemInput = {
      TableName: readEnv("TABLE_NAME"),
      Key: {
        id: event.pathParameters.id
      } as any
    };
    const res = await dynamo.get(query).promise();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(res.Item, undefined, 2)
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: `Failed to query job state: ${err}`
    };
  }
}
