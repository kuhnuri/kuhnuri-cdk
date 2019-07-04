import { splitToTasks } from "../lambda/hello";
import { Create, Job } from "../lambda/types";
const assert = require("assert");

describe("splitToTasks", () => {
  it("should return single task", () => {
    const create: Create = {
      input: "foo",
      output: "bar",
      transtype: ["html5"],
      params: {}
    };
    const job: Job = splitToTasks(create, "guid");
    assert.equal(job.transtype.length, 1);
    assert.equal(job.transtype[0].transtype, "html5");
    assert.equal(job.transtype[0].input, "foo");
    assert.equal(job.transtype[0].output, "bar");
  });
  it("should return two tasks", () => {
    const create: Create = {
      input: "foo",
      output: "bar",
      transtype: ["html5", "upload"],
      params: {}
    };
    const job: Job = splitToTasks(create, "guid");
    assert.equal(job.transtype.length, 2);
    assert.equal(job.transtype[0].transtype, "html5");
    assert.equal(job.transtype[0].input, "foo");
    assert.equal(job.transtype[0].output, "s3:/foo/temp/guid_0");
    assert.equal(job.transtype[1].transtype, "upload");
    assert.equal(job.transtype[1].input, "s3:/foo/temp/guid_0");
    assert.equal(job.transtype[1].output, "bar");
  });
  it("should return three tasks", () => {
    const create: Create = {
      input: "foo",
      output: "bar",
      transtype: ["graphics", "html5", "upload"],
      params: {}
    };
    const job: Job = splitToTasks(create, "guid");
    assert.equal(job.transtype.length, 3);
    assert.equal(job.transtype[0].transtype, "graphics");
    assert.equal(job.transtype[0].input, "foo");
    assert.equal(job.transtype[0].output, "s3:/foo/temp/guid_0");
    assert.equal(job.transtype[1].transtype, "html5");
    assert.equal(job.transtype[1].input, "s3:/foo/temp/guid_0");
    assert.equal(job.transtype[1].output, "s3:/foo/temp/guid_1");
    assert.equal(job.transtype[2].transtype, "upload");
    assert.equal(job.transtype[2].input, "s3:/foo/temp/guid_1");
    assert.equal(job.transtype[2].output, "bar");
  });
});
