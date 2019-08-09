import { APIGatewayEvent } from "aws-lambda";
import { S3, DynamoDB } from "aws-sdk";
import { readEnv, error } from "./utils";
import { URI, Job } from "./types";
import { parse } from "url";

export async function handler(event: APIGatewayEvent) {
  try {
    if (!event.pathParameters || event.pathParameters.id === "") {
      return error(422, "Arguments not available");
    }
    const jobId = event.pathParameters.id;

    const dynamo = new DynamoDB.DocumentClient();
    const query: DynamoDB.DocumentClient.GetItemInput = {
      TableName: readEnv("TABLE_NAME"),
      Key: {
        id: jobId
      }
    };
    const res = await dynamo.get(query).promise();

    if (!res.Item) {
      return error(404, `Job not found: ${jobId}`);
    }
    const job = res.Item as Job;

    const params = parseOutput(job.output);
    params.Expires = 60;

    const client = new S3({ signatureVersion: "v4" });
    const signedUrl = client.getSignedUrl("getObject", params);

    return {
      statusCode: 301,
      headers: { Location: signedUrl }
    };
  } catch (err) {
    console.error(err);
    return error(500, `Failed to get download: ${err}`);
  }
}

type Params = { Bucket: string; Key: string; Expires?: number };

function parseOutput(output: URI): Params {
  const url = parse(output);
  switch (url.protocol) {
    case "jar:":
      return parseOutput(output.substring(4, output.indexOf("!/")));
    case "s3:":
      return {
        Bucket: url.host!,
        Key: url.path!.substring(1)
      };
    default:
      throw new Error(`Unsupported URI scheme: ${url.protocol}`);
  }
}
