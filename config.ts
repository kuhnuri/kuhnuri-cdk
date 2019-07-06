import { Config } from "./lib/types";

export default {
  region: "eu-west-1",
  baseImage: "jelovirt/kuhnuri_batch_worker:3.2",
  transtypes: {
    html5: ["html5"],
    fo: ["fo"]
  },
  workers: [
    {
      transtypes: ["html5", "fo"],
      plugins: ["com.elovirta.fo"]
    }
  ]
} as Config;
