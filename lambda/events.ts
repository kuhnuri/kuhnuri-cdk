import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { readEnv, toObject } from "./utils";

export async function handler(event: any) {
  try {
    const taskId = event.detail.jobName;
    const [jobId, taskIndex] = taskId.split("_");
    let status;
    switch (event.detail.status) {
      case "SUBMITTED":
      case "PENDING":
        status = "queue";
        break;
      case "RUNNABLE":
      case "STARTING":
      case "RUNNING":
        status = "process";
        break;
      case "SUCCEEDED":
        status = "done";
        break;
      case "FAILED":
        status = "error";
        break;
      default:
        throw new Error(`Unrecognized status: ${event.detail.status}`);
    }
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
      case "failed":
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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(res, undefined, 2)
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ message: `Failed to update job state: ${err}` })
    };
  }
}
