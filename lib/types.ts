import { Environment } from "@aws-cdk/core";

export type DitaWorker = {
  /** List of transtypes the worker can process */
  transtypes: string[];
  /** List of plug-ins installed on worker DITA-OT */
  plugins: string[];
  image: string;
};

export type GenericWorker = {
  /** List of transtypes the worker can process */
  transtypes: string[];
  image: string;
};

type Worker = DitaWorker | GenericWorker;

type Transtype = {
  worker: string;
  // params?: Record<string, string>;
};

export type Config = {
  // baseImage: string;
  /** Transtypes and how they are split into tasks */
  transtypes: Record<string, Transtype[]>;
  workers: Record<string, Worker>;
  environments: {
    type: "SPOT" | "EC2";
  }[];
} & Environment;
