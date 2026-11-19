import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { query } from "../src/config/db.js";
import { createUser, as, cleanup } from "./helpers/testData.js";

const DOC = "https://res.cloudinary.com/demo/image/authenticated/v1/alumsetu/verification/degree.pdf";

let student, alumnus, noProfile, verified;

before(async () => {
  // Skills no other test uses, so once verified this alumnus is always the top
  // match, even while other test files add alumni to the same database.
  const skills = ["VLSI", "MATLAB", "Embedded Systems"];
  student = await createUser({ role: "student", skills, careerGoal: "data engineer" });
  alumnus = await createUser({ role: "alumni", name: "Unverified Alum", verified: false, skills });
  noProfile = await createUser({ role: "alumni", profile: false });
  verified = await createUser({ role: "alumni", verified: true });
});
after(cleanup);

const matchIds = async () => {
  const res = await request(app).get("/api/matches?limit=10").set(as(student));
  assert.equal(res.status, 200);
  return res.body.map((m) => m.alumni.user_id);
};

test("an unverified alumnus never appears in mentor matches", async () => {
  assert.ok(!(await matchIds()).includes(alumnus.id));
});

test("before submitting, GET /verification/me is null", async () => {
  const res = await request(app).get("/api/verification/me").set(as(alumnus));
  assert.equal(res.status, 200);
  assert.equal(res.body, null);
});

test("only alumni can use verification", async () => {
  let res = await request(app).post("/api/verification").set(as(student)).send({ document_url: DOC });
  assert.equal(res.status, 403);
  res = await request(app).get("/api/verification/me");
  assert.equal(res.status, 401);
});

test("the document must be a private file uploaded through /uploads", async () => {
  for (const document_url of ["https://evil.example.com/degree.pdf", "https://res.cloudinary.com/demo/image/upload/v1/x.pdf", ""]) {
    const res = await request(app).post("/api/verification").set(as(alumnus)).send({ document_url });
    assert.equal(res.status, 400);
  }
});

test("an alumnus without a profile is asked to complete it first", async () => {
  const res = await request(app).post("/api/verification").set(as(noProfile)).send({ document_url: DOC });
  assert.equal(res.status, 400);
  assert.match(res.body.error.message, /profile/);
});

test("submitting creates a pending request; a second one is a conflict", async () => {
  let res = await request(app).post("/api/verification").set(as(alumnus)).send({ document_url: DOC });
  assert.equal(res.status, 201);
  assert.equal(res.body.request.status, "pending");
  res = await request(app).post("/api/verification").set(as(alumnus)).send({ document_url: DOC });
  assert.equal(res.status, 409);
  res = await request(app).get("/api/verification/me").set(as(alumnus));
  assert.equal(res.body.status, "pending");
});

test("a pending request still keeps the alumnus out of matches", async () => {
  assert.ok(!(await matchIds()).includes(alumnus.id));
});

test("after a rejection the alumnus can submit again", async () => {
  await query("UPDATE verification_requests SET status = 'rejected', remarks = 'Blurry', reviewed_at = now() WHERE user_id = $1", [alumnus.id]);
  let res = await request(app).get("/api/verification/me").set(as(alumnus));
  assert.equal(res.body.status, "rejected");
  assert.equal(res.body.remarks, "Blurry");
  res = await request(app).post("/api/verification").set(as(alumnus)).send({ document_url: DOC });
  assert.equal(res.status, 201);
});

test("once approved (is_verified = true) the alumnus appears in matches and cannot resubmit", async () => {
  await query("UPDATE verification_requests SET status = 'approved', reviewed_at = now() WHERE user_id = $1 AND status = 'pending'", [alumnus.id]);
  await query("UPDATE alumni_profiles SET is_verified = TRUE WHERE user_id = $1", [alumnus.id]);
  assert.ok((await matchIds()).includes(alumnus.id));
  const res = await request(app).post("/api/verification").set(as(verified)).send({ document_url: DOC });
  assert.equal(res.status, 409);
});
