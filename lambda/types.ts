export type URI = string;

export type Status = "queue" | "process" | "done" | "error";

export type Create = {
  id?: string;
  input: URI;
  output: URI;
  transtype: string[];
  priority?: number;
  params: Record<string, string>;
};

export type Task = {
  id: string;
  job: string;
  input?: URI;
  output?: URI;
  transtype: string;
  params: Record<string, string>;
  status: Status;
  processing?: Date;
  worker?: string;
  finished?: Date;
};

export type Job = {
  id: string;
  input: URI;
  output: URI;
  transtype: Task[];
  priority: number;
  created: Date;
  finished?: Date;
  status: Status;
};
