import { splitToTasks } from "../lambda/create";
import { Create, Job } from "../lambda/types";
const assert = require("assert");

describe("splitToTasks", () => {
  process.env.TRANSTYPE_TO_TASK = JSON.stringify({
    html5: [{ worker: "basic-worker", params: { transtype: "html5" } }],
    upload: [{ worker: "upload-worker" }],
    graphics: [{ worker: "graphics-worker" }]
  });
  process.env.S3_TEMP_BUCKET = "tmp";
  process.env.S3_OUTPUT_BUCKET = "out";
  describe("with fixed output", () => {
    it("should return single task", () => {
      const create: Create = {
        input: "foo",
        output: "bar",
        transtype: ["html5"]
      };
      const job: Job = splitToTasks(create, "guid");
      assert.equal(job.input, "foo");
      assert.equal(job.output, "bar");
      assert.equal(job.transtype.length, 1);
      assert.equal(job.transtype[0].params.transtype, "html5");
      assert.equal(job.transtype[0].worker, "basic-worker");
      assert.equal(job.transtype[0].input, "foo");
      assert.equal(job.transtype[0].output, "bar");
    });
    it("should return two tasks", () => {
      const create: Create = {
        input: "foo",
        output: "bar",
        transtype: ["html5", "upload"]
      };
      const job: Job = splitToTasks(create, "guid");
      assert.equal(job.input, "foo");
      assert.equal(job.output, "bar");
      assert.equal(job.transtype.length, 2);
      assert.equal(job.transtype[0].params.transtype, "html5");
      assert.equal(job.transtype[0].worker, "basic-worker");
      assert.equal(job.transtype[0].input, "foo");
      assert.equal(job.transtype[0].output, "jar:s3://tmp/guid_0.zip!/");
      assert.equal(job.transtype[1].params.transtype, undefined);
      assert.equal(job.transtype[1].worker, "upload-worker");
      assert.equal(job.transtype[1].input, "jar:s3://tmp/guid_0.zip!/");
      assert.equal(job.transtype[1].output, "bar");
    });
    it("should return three tasks", () => {
      const create: Create = {
        input: "foo",
        output: "bar",
        transtype: ["graphics", "html5", "upload"]
      };
      const job: Job = splitToTasks(create, "guid");
      assert.equal(job.input, "foo");
      assert.equal(job.output, "bar");
      assert.equal(job.transtype.length, 3);
      assert.equal(job.transtype[0].params.transtype, undefined);
      assert.equal(job.transtype[0].worker, "graphics-worker");
      assert.equal(job.transtype[0].input, "foo");
      assert.equal(job.transtype[0].output, "jar:s3://tmp/guid_0.zip!/");
      assert.equal(job.transtype[1].params.transtype, "html5");
      assert.equal(job.transtype[1].worker, "basic-worker");
      assert.equal(job.transtype[1].input, "jar:s3://tmp/guid_0.zip!/");
      assert.equal(job.transtype[1].output, "jar:s3://tmp/guid_1.zip!/");
      assert.equal(job.transtype[2].params.transtype, undefined);
      assert.equal(job.transtype[2].worker, "upload-worker");
      assert.equal(job.transtype[2].input, "jar:s3://tmp/guid_1.zip!/");
      assert.equal(job.transtype[2].output, "bar");
    });
  });
  describe("with generated output", () => {
    it("should return single task", () => {
      const create: Create = {
        input: "foo",
        transtype: ["html5"]
      };
      const job: Job = splitToTasks(create, "guid");
      assert.equal(job.input, "foo");
      assert.equal(job.output, "jar:s3://out/guid.zip!/");
      assert.equal(job.transtype.length, 1);
      assert.equal(job.transtype[0].params.transtype, "html5");
      assert.equal(job.transtype[0].worker, "basic-worker");
      assert.equal(job.transtype[0].input, "foo");
      assert.equal(job.transtype[0].output, "jar:s3://out/guid.zip!/");
    });
    it("should return two tasks", () => {
      const create: Create = {
        input: "foo",
        transtype: ["html5", "upload"]
      };
      const job: Job = splitToTasks(create, "guid");
      assert.equal(job.input, "foo");
      assert.equal(job.output, "jar:s3://out/guid.zip!/");
      assert.equal(job.transtype.length, 2);
      assert.equal(job.transtype[0].params.transtype, "html5");
      assert.equal(job.transtype[0].worker, "basic-worker");
      assert.equal(job.transtype[0].input, "foo");
      assert.equal(job.transtype[0].output, "jar:s3://tmp/guid_0.zip!/");
      assert.equal(job.transtype[1].params.transtype, undefined);
      assert.equal(job.transtype[1].worker, "upload-worker");
      assert.equal(job.transtype[1].input, "jar:s3://tmp/guid_0.zip!/");
      assert.equal(job.transtype[1].output, "jar:s3://out/guid.zip!/");
    });
    it("should return three tasks", () => {
      const create: Create = {
        input: "foo",
        transtype: ["graphics", "html5", "upload"]
      };
      const job: Job = splitToTasks(create, "guid");
      assert.equal(job.input, "foo");
      assert.equal(job.output, "jar:s3://out/guid.zip!/");
      assert.equal(job.transtype.length, 3);
      assert.equal(job.transtype[0].params.transtype, undefined);
      assert.equal(job.transtype[0].worker, "graphics-worker");
      assert.equal(job.transtype[0].input, "foo");
      assert.equal(job.transtype[0].output, "jar:s3://tmp/guid_0.zip!/");
      assert.equal(job.transtype[1].params.transtype, "html5");
      assert.equal(job.transtype[1].worker, "basic-worker");
      assert.equal(job.transtype[1].input, "jar:s3://tmp/guid_0.zip!/");
      assert.equal(job.transtype[1].output, "jar:s3://tmp/guid_1.zip!/");
      assert.equal(job.transtype[2].params.transtype, undefined);
      assert.equal(job.transtype[2].worker, "upload-worker");
      assert.equal(job.transtype[2].input, "jar:s3://tmp/guid_1.zip!/");
      assert.equal(job.transtype[2].output, "jar:s3://out/guid.zip!/");
    });
  });
});
