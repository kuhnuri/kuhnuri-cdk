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

export function response(code: number, body: any) {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body, undefined, 2)
  };
}

export function error(code: number, message: string) {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ message })
  };
}
