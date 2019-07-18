import { Config } from "./lib/types";

export default {
  region: "eu-west-1",
  // baseImage: "jelovirt/kuhnuri_batch_worker:3.2",
  transtypes: {
    html5: ["html5"],
    pdf2: ["fo", "fo2pdf"],
    fo: ["fo"]
  },
  workers: [
    {
      transtypes: ["html5", "fo"],
      image: "jelovirt/kuhnuri_batch_worker:3.2",
      plugins: ["com.elovirta.fo"]
    },
    {
      transtypes: ["fo2pdf"],
      image: "jelovirt/kuhnuri_batch_fop_worker:3.2"
    }
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
