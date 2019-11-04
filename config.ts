import { Config } from "./lib/types";

const config: Config = {
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
      { worker: "custom", params: { transtype: "fo", "pdf.formatter": "ah" } },
      { worker: "ahf" }
    ],
    html2pdf: [
      { worker: "custom", params: { transtype: "html2pdf" } },
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
      image: "jelovirt/kuhnuri_batch_worker:3.2"
    },
    custom: {
      image: "jelovirt/kuhnuri_batch_worker:3.2",
      plugins: [
        "com.elovirta.fo",
        "com.elovirta.ooxml",
        "https://github.com/jelovirt/com.elovirta.html2pdf/releases/download/0.1.0/com.elovirta.html2pdf-0.1.0.zip",
        "https://github.com/jelovirt/com.elovirta.html2pdf/archive/master.zip"
      ]
    },
    fop: {
      image: "jelovirt/kuhnuri_batch_fop_worker:3.2"
    },
    graphics: {
      image: "jelovirt/kuhnuri_batch_graphics_worker:3.2"
    },
    weasyprint: {
      image: "jelovirt/kuhnuri_batch_weasyprint_worker:3.2"
    },
    ahf: {
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
};

export default config;
