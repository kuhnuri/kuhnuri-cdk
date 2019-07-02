import { Config } from "./lib/types";

export default {
  region: "eu-west-1",
  baseImage: "jelovirt/kuhnuri_batch_worker:3.2",
  workers: [
    {
      plugins: ["com.elovirta.fo", "com.elovirta.ooxml"]
    }
  ]
} as Config;
