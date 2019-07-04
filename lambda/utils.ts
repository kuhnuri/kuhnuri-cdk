import { Job, Task } from "./types";

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
