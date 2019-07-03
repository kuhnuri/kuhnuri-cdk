import { Create, Job, Status, Task, URI } from "./types";
import { APIGatewayEvent } from "aws-lambda";
import { objectToCloudFormation } from "@aws-cdk/core";

export async function handler(event: APIGatewayEvent) {
  if (!event.body) {
    return {
      statusCode: 422,
      headers: { "Content-Type": "text/plain" },
      body: `Arguments not available\n`
    };
  }
  const body = JSON.parse(event.body);
  const job = splitToTasks(body);
  console.log("request:", JSON.stringify(event, undefined, 2));
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(job, undefined, 2)
  };
}

const jobDefinitions: Record<string, string[]> = {
  html5: ["html5"]
};

export function splitToTasks(body: Create): Job {
  const transtypes = body.transtype.reduce(
    (acc, cur) => acc.concat(jobDefinitions[cur] || [cur]),
    [] as string[]
  );
  const jobId = body.id || "guid";
  const tasks = transtypes.map((transtype, i) => {
    const isFirst = i === 0;
    const isLast = i === transtypes.length - 1;
    const taskId = generateTaskId(i);
    return {
      id: taskId,
      job: jobId,
      transtype,
      params: body.params,
      status: "queue",
      input: isFirst ? body.input : generateTempUri(generateTaskId(i - 1)),
      output: isLast ? body.output : generateTempUri(generateTaskId(i))
      // processing?: Date;
      // worker?: string;
      // finished?: Date;
    } as Task;
  });
  return {
    id: jobId,
    input: body.input,
    output: body.output,
    transtype: tasks,
    priority: body.priority || 0,
    created: new Date(),
    // finished?: Date
    status: "queue"
  };

  function generateTaskId(i: number): string {
    return `${jobId}_${i}`;
  }

  function generateTempUri(taskId: string): URI {
    return `s3:/foo/temp/${taskId}`;
  }
}

// GET         /api/v1/jobs               controllers.v1.ListController.list(state: Option[string])
// POST        /api/v1/job                controllers.v1.ListController.add
// GET         /api/v1/job/:id            controllers.v1.ListController.details(id)
