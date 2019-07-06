import { Job, Task } from "./types";

export function toStorage(job: Job): any {
  const copy = JSON.parse(JSON.stringify(job));
  copy.transtype.forEach((task: any) => {
    task._status = task.status;
    delete task.status;
  });
  return copy;
}

export function fromStorage(job: any): Job {
  const copy = JSON.parse(JSON.stringify(job));
  copy.transtype.forEach((task: any) => {
    task.status = task._status;
    delete task._status;
  });
  return copy as Job;
}

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
