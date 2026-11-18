import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { createUser, as, cleanup } from "./helpers/testData.js";

let student, mentor, unverified, busy, otherAlumnus, outsider;

before(async () => {
  student = await createUser({ role: "student", skills: ["Python", "SQL"], careerGoal: "data engineer" });
  mentor = await createUser({ role: "alumni", name: "Mentor Alum", skills: ["Python", "SQL"] });
  unverified = await createUser({ role: "alumni", verified: false });
  busy = await createUser({ role: "alumni", mentoring: false });
  otherAlumnus = await createUser({ role: "alumni" });
  outsider = await createUser({ role: "student" });
});
after(cleanup);

let requestId;

test("a student can request a verified mentor, and gets a match score", async () => {
  const res = await request(app).post("/api/mentorship").set(as(student)).send({ alumni_id: mentor.id, message: "Hi!" });
  assert.equal(res.status, 201);
  assert.equal(res.body.request.status, "pending");
  assert.equal(res.body.request.other_user.full_name, "Mentor Alum");
  assert.ok(res.body.request.match_score > 0);
  requestId = res.body.request.id;
});

test("a second open request to the same alumnus is a conflict", async () => {
  const res = await request(app).post("/api/mentorship").set(as(student)).send({ alumni_id: mentor.id });
  assert.equal(res.status, 409);
});

test("unverified or unavailable alumni cannot be requested", async () => {
  for (const alumnus of [unverified, busy]) {
    const res = await request(app).post("/api/mentorship").set(as(student)).send({ alumni_id: alumnus.id });
    assert.equal(res.status, 403);
  }
});

test("alumni cannot send requests, and bad ids are rejected", async () => {
  let res = await request(app).post("/api/mentorship").set(as(mentor)).send({ alumni_id: otherAlumnus.id });
  assert.equal(res.status, 403);
  res = await request(app).post("/api/mentorship").set(as(student)).send({ alumni_id: "nope" });
  assert.equal(res.status, 400);
  res = await request(app).post("/api/mentorship").set(as(student)).send({ alumni_id: "00000000-0000-0000-0000-000000000000" });
  assert.equal(res.status, 404);
});

test("each side lists the request with the other person's name", async () => {
  let res = await request(app).get("/api/mentorship").set(as(student));
  assert.equal(res.status, 200);
  assert.equal(res.body[0].other_user.id, mentor.id);
  res = await request(app).get("/api/mentorship?status=pending").set(as(mentor));
  assert.equal(res.body[0].other_user.id, student.id);
  res = await request(app).get("/api/mentorship?status=declined").set(as(mentor));
  assert.deepEqual(res.body, []);
  res = await request(app).get("/api/mentorship?status=wrong").set(as(mentor));
  assert.equal(res.status, 400);
});

test("only the receiving alumnus can accept; outsiders see 404", async () => {
  let res = await request(app).patch(`/api/mentorship/${requestId}`).set(as(student)).send({ status: "accepted" });
  assert.equal(res.status, 403);
  res = await request(app).patch(`/api/mentorship/${requestId}`).set(as(outsider)).send({ status: "accepted" });
  assert.equal(res.status, 404);
  res = await request(app).patch(`/api/mentorship/${requestId}`).set(as(mentor)).send({ status: "accepted" });
  assert.equal(res.status, 200);
  assert.equal(res.body.request.status, "accepted");
  assert.ok(res.body.request.responded_at);
});

test("an accepted request cannot be declined, but can be completed", async () => {
  let res = await request(app).patch(`/api/mentorship/${requestId}`).set(as(mentor)).send({ status: "declined" });
  assert.equal(res.status, 409);
  res = await request(app).patch(`/api/mentorship/${requestId}`).set(as(student)).send({ status: "completed" });
  assert.equal(res.status, 200);
  assert.equal(res.body.request.status, "completed");
});

test("after completing, the student can request the same mentor again", async () => {
  const res = await request(app).post("/api/mentorship").set(as(student)).send({ alumni_id: mentor.id });
  assert.equal(res.status, 201);
});
