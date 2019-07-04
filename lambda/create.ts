import { Create, Job, Task, URI } from "./types";
import { APIGatewayEvent } from "aws-lambda";
import { Batch, DynamoDB } from "aws-sdk";
import { toItem } from "./utils";

export async function handler(event: APIGatewayEvent) {
  console.log("request:", JSON.stringify(event, undefined, 2));
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405
      // headers: { "Content-Type": "text/plain" },
      // body: `Arguments not available\n`
    };
  }
  if (!event.body) {
    return {
      statusCode: 422,
      headers: { "Content-Type": "text/plain" },
      body: `Arguments not available\n`
    };
  }
  const body = JSON.parse(event.body);
  console.log("Create", body);
  const job = splitToTasks(body, event.requestContext.requestId);
  // console.log("Submit", job);
  const result = await submitJob(job);
  console.log("Result", result);

  const dynamo = new DynamoDB();
  const res = await dynamo
    .putItem({
      TableName: readEnv("TABLE_NAME"),
      Item: toItem(result)
    })
    .promise();
  console.log("Dynamo", res);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(result, undefined, 2)
  };
}

async function submitJob(job: Job): Promise<Job> {
  const client = new Batch();

  let dependsOn: Batch.JobDependency[] = [];
  const tasks = [];

  for (let task of job.transtype) {
    console.log("Process task", task);
    let params: Batch.SubmitJobRequest = {
      jobName: task.id,
      jobDefinition: readEnv(`JOB_DEFINITION_${task.transtype}`),
      jobQueue: readEnv("JOB_QUEUE"),
      dependsOn,
      containerOverrides: {
        command: [`-Dtranstype=${task.transtype}`],
        environment: [
          {
            name: "input",
            value: task.input
          },
          {
            name: "output",
            value: task.output
          }
        ]
      }
      // parameters: {
      //   bucketName: IMAGES_BUCKET,
      //   imageName: event.imageName,
      //   dynamoTable: IMAGES_BUCKET
      // }
    };

    const result = await client.submitJob(params).promise();
    console.log(`Started AWS Batch job ${result.jobId}`);

    dependsOn = [
      {
        jobId: result.jobId
      }
    ];

    tasks.push({
      ...task,
      id: result.jobId
    });
  }

  return {
    ...job,
    transtype: tasks
  };
}

const jobDefinitions: Record<string, string[]> = {
  html5: ["html5"]
};

export function splitToTasks(body: Create, id: string): Job {
  const transtypes = body.transtype.reduce(
    (acc, cur) => acc.concat(jobDefinitions[cur] || [cur]),
    [] as string[]
  );
  const jobId = body.id || id;
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

function readEnv(name: string): string {
  const value = process.env[name];
  if (value) {
    return value;
  } else {
    throw new Error(`Unable to find environment variable ${name}`);
  }
}

// GET         /api/v1/jobs               controllers.v1.ListController.list(state: Option[string])
// POST        /api/v1/job                controllers.v1.ListController.add
// GET         /api/v1/job/:id            controllers.v1.ListController.details(id)
