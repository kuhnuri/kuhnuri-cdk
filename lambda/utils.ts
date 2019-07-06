import { Job, Task } from "./types";

export function readEnv(name: string): string {
  const value = process.env[name];
  if (value) {
    return value;
  } else {
    throw new Error(`Unable to find environment variable ${name}`);
  }
}

export function toObject(map: Map<string, string>) {
  const res = {} as any;
  map.forEach((v, k) => {
    res[k] = v;
  });
  return res;
}

export function toItem(job: Job) {
  return {
    id: {
      S: job.id
    },
    input: {
      S: job.input
    },
    output: {
      S: job.output
    },
    transtype: {
      L: job.transtype.map(task => ({
        M: taskToItem(task)
      }))
    },
    priority: {
      N: job.priority.toString()
    },
    created: {
      S: job.created.toISOString()
    },
    status: {
      S: job.status
    }
  };
}

function taskToItem(task: Task) {
  return {
    id: {
      S: task.id
    },
    job: {
      S: task.job
    },
    input: {
      S: task.input
    },
    output: {
      S: task.output
    },
    transtype: {
      S: task.transtype
    },
    params: {
      M: {}
    },
    status: {
      S: task.status
    }
  };
}
