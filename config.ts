import { Config } from "./lib/types";

export default {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
  transtypes: {
    html5: ["html5"],
    pdf2: ["fo", "fo2pdf"],
    html2pdf: ["html5", "html2pdf"],
    fo: ["fo"],
    graphics: ["graphics"]
  },
  workers: [
    {
      transtypes: ["html5"],
      image: "jelovirt/kuhnuri_batch_worker:3.2"
    },
    {
      transtypes: ["fo"],
      image: "jelovirt/kuhnuri_batch_worker:3.2",
      plugins: ["com.elovirta.fo"]
    },
    {
      transtypes: ["fo2pdf"],
      image: "jelovirt/kuhnuri_batch_fop_worker:3.2"
    },
    {
      transtypes: ["graphics"],
      image: "jelovirt/kuhnuri_batch_graphics_worker:3.2"
    },
    {
      transtypes: ["html2pdf"],
      image: "jelovirt/kuhnuri_batch_weasyprint_worker:3.2"
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
