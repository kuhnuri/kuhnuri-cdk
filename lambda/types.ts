export type URI = string;

export type Status = "queue" | "process" | "done" | "error";

type DateTime = string;

export type Create = {
  id?: string;
  input: URI;
  output?: URI;
  transtype: string[];
  priority?: number;
  params?: Record<string, string>;
};

export type Task = {
  id: string;
  job: string;
  input?: URI;
  output?: URI;
  params: Record<string, string>;
  status: Status;
  processing?: DateTime;
  worker: string;
  finished?: DateTime;
};

export type Job = {
  id: string;
  input: URI;
  output: URI;
  transtype: Task[];
  priority: number;
  created: DateTime;
  finished?: DateTime;
  status: Status;
};

export type Upload = {
  upload: string;
  url: string;
};

export type Download = {
  url: string;
};
