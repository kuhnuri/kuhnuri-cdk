import { Config } from "./lib/types";

export default {
  region: "eu-west-1",
  baseImage: "jelovirt/kuhnuri_batch_worker:3.2",
  transtypes: {
    html5: ["html5"],
    // pdf2: ["fo", "fo2pdf"],
    fo: ["fo"]
  },
  workers: [
    {
      transtypes: ["html5", "fo"],
      plugins: ["com.elovirta.fo"]
    }
    // {
    //   transtypes: ["fo2pdf"],
    //   plugins: ["com.elovirta.fo2pdf"]
    // }
  ],
  environments: [
    {
      type: "SPOT"
    }
    // {
    //   type: "EC2"
    // }
  ]
} as Config;
