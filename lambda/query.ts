import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { readEnv, error, response } from "./utils";
import { Job } from "./types";

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
      const job = resolveStatus(res.Item as Job);
      return response(200, job);
    } else {
      return error(404, `Job not found: ${jobId}`);
    }
  } catch (err) {
    console.error(err);
    return error(500, `Failed to query job state: ${err}`);
  }
}

function resolveStatus(job: Job): Job {
  const error = job.transtype.find(task => task.status === "error");
  if (error) {
    job.status = "error";
    job.finished = error.finished;
  } else if (job.transtype.every(task => task.status === "done")) {
    job.status = "done";
    job.finished = job.transtype[job.transtype.length - 1].finished;
  } else if (job.transtype.find(task => task.status === "process")) {
    job.status = "process";
  }

  return job;
}
