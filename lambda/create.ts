import { Create, Job, Task, URI } from "./types";
import { Transtype } from "../lib/types";
import { APIGatewayEvent } from "aws-lambda";
import { Batch, DynamoDB } from "aws-sdk";
import { readEnv, error, response, jarUri } from "./utils";

export async function handler(event: APIGatewayEvent) {
  try {
    if (!event.body) {
      return error(422, "Arguments not available");
    }
    const body: Create = JSON.parse(event.body);
    const job = splitToTasks(body, event.requestContext.requestId);
    const result = await submitJob(job);
    await store(result);
    return response(200, result);
  } catch (err) {
    console.error(err);
    return error(500, `Failed to create job: ${err}`);
  }
}

async function store(result: Job) {
  const dynamo = new DynamoDB.DocumentClient();
  const query: DynamoDB.DocumentClient.PutItemInput = {
    TableName: readEnv("TABLE_NAME"),
    Item: result
  };
  const res = await dynamo.put(query).promise();
  // console.log(res);
}

async function submitJob(job: Job): Promise<Job> {
  const client = new Batch();

  let dependsOn: Batch.JobDependency[] = [];
  const tasks = [];

  for (let task of job.transtype) {
    const properties: string[] = task.params
      ? Object.entries(task.params).map(([name, value]) => `-D${name}=${value}`)
      : [];
    let params: Batch.SubmitJobRequest = {
      jobName: task.id,
      jobDefinition: readEnv(`JOB_DEFINITION_${task.worker}`),
      jobQueue: readEnv("JOB_QUEUE"),
      dependsOn,
      containerOverrides: {
        command: properties,
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
    // console.log(result.jobId);

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

export function splitToTasks(body: Create, id: string): Job {
  const transtypeToWorkers: Record<string, Transtype[]> = JSON.parse(
    readEnv("TRANSTYPE_TO_TASK")
  );
  const workers: Transtype[] = body.transtype.reduce(
    (acc, cur) => acc.concat(transtypeToWorkers[cur]),
    [] as Transtype[]
  );
  const jobId = body.id || id;
  const output = body.output || generateOutputUri(jobId);
  const tasks = workers.map(
    (worker: Transtype, i): Task => {
      const isFirst = i === 0;
      const isLast = i === workers.length - 1;
      const taskId = generateTaskId(i);
      const prevTaskId = generateTaskId(i - 1);
      return {
        id: taskId,
        job: jobId,
        params: { ...worker.params, ...body.params },
        status: "queue",
        input: isFirst ? body.input : generateTempUri(prevTaskId),
        output: isLast ? output : generateTempUri(taskId),
        // processing?: Date;
        worker: worker.worker
        // finished?: Date;
      };
    }
  );
  return {
    id: jobId,
    input: body.input,
    output: output,
    transtype: tasks,
    priority: body.priority || 0,
    created: new Date().toISOString(),
    // finished?: Date
    status: "queue"
  };

  function generateTaskId(i: number): string {
    return `${jobId}_${i}`;
  }
}

function generateTempUri(taskId: string): URI {
  const url = `s3://${readEnv("S3_TEMP_BUCKET")}/${taskId}.zip`;
  return jarUri(url);
}

function generateOutputUri(taskId: string): URI {
  const url = `s3://${readEnv("S3_OUTPUT_BUCKET")}/${taskId}.zip`;
  return jarUri(url);
}
