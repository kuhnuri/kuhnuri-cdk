import { Config } from "./lib/types";

export default {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
  transtypes: {
    html5: ["html5"],
    pdf2: ["fo", "fop"],
    html2pdf: ["html2pdf", "weasyprint"],
    // graphics: ["graphics"],
    docx: ["graphics", "docx"]
  },
  workers: {
    basic: {
      transtypes: ["html5"],
      image: "jelovirt/kuhnuri_batch_worker:3.2"
      // TODO add cpu
      // TODO add memory
    },
    custom: {
      transtypes: ["fo", "html2pdf", "docx"],
      image: "jelovirt/kuhnuri_batch_worker:3.2",
      plugins: [
        "com.elovirta.fo",
        "com.elovirta.ooxml",
        "https://github.com/jelovirt/com.elovirta.html2pdf/archive/master.zip"
      ]
    },
    for: {
      transtypes: ["fop"],
      image: "jelovirt/kuhnuri_batch_fop_worker:3.2"
    },
    graphics: {
      transtypes: ["graphics"],
      image: "jelovirt/kuhnuri_batch_graphics_worker:3.2"
    },
    weasyprint: {
      transtypes: ["weasyprint"],
      image: "jelovirt/kuhnuri_batch_weasyprint_worker:3.2"
    }
  },
  environments: [
    {
      type: "SPOT"
    }
    // {
    //   type: "EC2"
    // }
  ]
} as Config;
