import { APIGatewayEvent } from "aws-lambda";
import { S3 } from "aws-sdk";
import { readEnv, error, response } from "./utils";

export async function handler(event: APIGatewayEvent) {
  try {
    const bucket = readEnv("S3_TEMP_BUCKET");
    const key = event.requestContext.requestId;
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 60
    };

    const client = new S3({ signatureVersion: "v4" });
    const signedUrl = client.getSignedUrl("putObject", params);

    return response(200, {
      upload: signedUrl,
      url: `s3://${bucket}/${key}`
    });
  } catch (err) {
    console.error(err);
    return error(500, `Failed to create upload: ${err}`);
  }
}