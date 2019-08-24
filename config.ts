import { Config } from "./lib/types";

export default {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
  transtypes: {
    html5: [
      {
        worker: "basic",
        params: { transtype: "html5" }
      }
    ],
    pdf2: [
      { worker: "custom", params: { transtype: "fo" } },
      { worker: "fop" }
    ],
    fo2pdf: [
      { worker: "custom", params: { transtype: "fo" } },
      { worker: "ahf" }
    ],
    html2pdf: [
      { worker: "custom", params: { transtype: "html5" } },
      { worker: "weasyprint" }
    ],
    // graphics: [{worker:"graphics"}],
    docx: [
      { worker: "graphics" },
      { worker: "custom", params: { transtype: "docx" } }
    ]
  },
  workers: {
    basic: {
      transtypes: ["html5"],
      image: "jelovirt/kuhnuri_batch_worker:3.2"
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
    fop: {
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
    },
    ahf: {
      transtypes: ["ahf"],
      image: "jelovirt/kuhnuri_batch_ahf_worker:3.2",
      vcpus: 1,
      memory: 2048,
      assets: [
        {
          src: "assets/AHFormatter.lic",
          dst: "/AHFormatter/etc/AHFormatter.lic"
        }
      ]
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
