import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { readEnv, toObject, error, response } from "./utils";
import { Status } from "./types";

export async function handler(event: any) {
  try {
    const taskId = event.detail.jobName;
    const [jobId, taskIndex] = taskId.split("_");
    const status = mapStatus(event.detail.status);

    const update = [];
    const values = new Map();
    update.push(`transtype[${taskIndex}].#s = :s`);
    values.set(":s", status);
    switch (status) {
      case "process":
        update.push(`transtype[${taskIndex}].processing = :p`);
        values.set(":p", new Date(event.detail.startedAt).toISOString());
        break;
      case "done":
      case "error":
        update.push(`transtype[${taskIndex}].finished = :f`);
        values.set(":f", new Date(event.detail.stoppedAt).toString());
        break;
    }

    const dynamo = new DynamoDB.DocumentClient();
    const query: DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: readEnv("TABLE_NAME"),
      Key: {
        id: jobId
      },
      UpdateExpression: `SET ${update.join(", ")}`,
      ExpressionAttributeValues: toObject(values),
      ExpressionAttributeNames: {
        "#s": "status"
      },
      ReturnValues: "UPDATED_NEW"
    };
    const res = await dynamo.update(query).promise();

    return response(200, res);
  } catch (err) {
    console.error(err);
    return error(500, `Failed to update job state: ${err}`);
  }
}

function mapStatus(status: string): Status {
  switch (status) {
    case "SUBMITTED":
    case "PENDING":
      return "queue";
      break;
    case "RUNNABLE":
    case "STARTING":
    case "RUNNING":
      return "process";
      break;
    case "SUCCEEDED":
      return "done";
      break;
    case "FAILED":
      return "error";
      break;
    default:
      throw new Error(`Unrecognized status: ${status}`);
  }
}
