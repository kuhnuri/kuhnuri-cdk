import { Environment } from "@aws-cdk/core";

export type GenericWorker = {
  image: string;
  vcpus?: number;
  memory?: number;
  assets?: { src: string; dst: string }[];
};

export type DitaWorker = {
  /** List of plug-ins installed on worker DITA-OT */
  plugins: string[];
} & GenericWorker;

type Worker = DitaWorker | GenericWorker;

export type Transtype = {
  worker: string;
  params?: Record<string, string>;
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
