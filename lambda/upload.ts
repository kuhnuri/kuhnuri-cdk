import { APIGatewayEvent } from "aws-lambda";
import { S3 } from "aws-sdk";
import { readEnv, error, response } from "./utils";
import { URI } from "./types";

export async function handler(event: APIGatewayEvent) {
  try {
    const bucket = readEnv("S3_TEMP_BUCKET");
    const key = `upload/${event.requestContext.requestId}`;
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 60
    };

    const client = new S3({ signatureVersion: "v4" });
    const signedUrl = client.getSignedUrl("putObject", params);

    return response(200, {
      upload: signedUrl,
      url: generateTempUri(bucket, key)
    });
  } catch (err) {
    console.error(err);
    return error(500, `Failed to create upload: ${err}`);
  }
}

function generateTempUri(bucket: string, key: string): URI {
  return `s3://${bucket}/${key}`;
}
