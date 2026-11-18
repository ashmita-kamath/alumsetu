import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { v2 as cloudinary } from "cloudinary";
import app from "../src/app.js";
import { detectFormat, MAX_BYTES } from "../src/services/uploadService.js";
import { createUser, as, cleanup } from "./helpers/testData.js";

// Never call the real Cloudinary from tests: replace upload_stream with a fake
// that records the options and "succeeds" straight away.
process.env.CLOUDINARY_URL ||= "cloudinary://key:secret@demo";
const calls = [];
mock.method(cloudinary.uploader, "upload_stream", (options, callback) => ({
  end: () => {
    calls.push(options);
    callback(null, { secure_url: `https://res.cloudinary.com/demo/image/${options.type}/v1/${options.folder}/abc.pdf` });
  },
}));

const PDF = Buffer.from("%PDF-1.4\n%fake test pdf\n");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const EXE = Buffer.from("MZ this is not a document");

let student, alumnus;
before(async () => {
  student = await createUser({ role: "student" });
  alumnus = await createUser({ role: "alumni", verified: false });
});
after(cleanup);

test("detectFormat reads the file's first bytes, not its name", () => {
  assert.equal(detectFormat(PDF), "pdf");
  assert.equal(detectFormat(PNG), "png");
  assert.equal(detectFormat(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), "jpg");
  assert.equal(detectFormat(EXE), null);
});

test("uploading needs a login", async () => {
  const res = await request(app).post("/api/uploads").field("kind", "resume").attach("file", PDF, "cv.pdf");
  assert.equal(res.status, 401);
});

test("an alumnus uploads a verification document as a private file", async () => {
  const res = await request(app)
    .post("/api/uploads")
    .set(as(alumnus))
    .field("kind", "verification")
    .attach("file", PDF, "degree.pdf");
  assert.equal(res.status, 201);
  assert.match(res.body.url, /^https:\/\/res\.cloudinary\.com\//);
  assert.equal(calls.at(-1).type, "authenticated");
  assert.equal(calls.at(-1).folder, "alumsetu/verification");
});

test("a student uploads a resume", async () => {
  const res = await request(app).post("/api/uploads").set(as(student)).field("kind", "resume").attach("file", PNG, "cv.png");
  assert.equal(res.status, 201);
  assert.equal(calls.at(-1).type, "upload");
});

test("each role may only upload its own kind of file", async () => {
  let res = await request(app).post("/api/uploads").set(as(student)).field("kind", "verification").attach("file", PDF, "x.pdf");
  assert.equal(res.status, 403);
  res = await request(app).post("/api/uploads").set(as(alumnus)).field("kind", "resume").attach("file", PDF, "x.pdf");
  assert.equal(res.status, 403);
});

test("wrong kind, missing file, fake extension and oversized files are rejected", async () => {
  const before = calls.length;
  let res = await request(app).post("/api/uploads").set(as(student)).field("kind", "photo").attach("file", PDF, "x.pdf");
  assert.equal(res.status, 400);
  res = await request(app).post("/api/uploads").set(as(student)).field("kind", "resume");
  assert.equal(res.status, 400);
  // An .exe renamed to .pdf is still not a PDF
  res = await request(app).post("/api/uploads").set(as(student)).field("kind", "resume").attach("file", EXE, "cv.pdf");
  assert.equal(res.status, 400);
  assert.match(res.body.error.message, /PDF, JPG or PNG/);
  const big = Buffer.concat([PDF, Buffer.alloc(MAX_BYTES)]);
  res = await request(app).post("/api/uploads").set(as(student)).field("kind", "resume").attach("file", big, "big.pdf");
  assert.equal(res.status, 400);
  assert.match(res.body.error.message, /5 MB/);
  assert.equal(calls.length, before, "nothing invalid reached Cloudinary");
});
