import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { createUser, as, cleanup } from "./helpers/testData.js";

let student, emptyStudent, alumnus;

before(async () => {
  student = await createUser({ role: "student", skills: ["Python", "SQL"], careerGoal: "data engineer" });
  emptyStudent = await createUser({ role: "student" });
  alumnus = await createUser({ role: "alumni", skills: ["Python", "SQL"] });
});
after(cleanup);

test("matches need a logged-in student", async () => {
  let res = await request(app).get("/api/matches");
  assert.equal(res.status, 401);
  res = await request(app).get("/api/matches").set(as(alumnus));
  assert.equal(res.status, 403);
});

test("a student with skills gets ranked suggestions with reasons", async () => {
  const res = await request(app).get("/api/matches?limit=10").set(as(student));
  assert.equal(res.status, 200);
  assert.ok(res.body.length > 0 && res.body.length <= 10);
  for (let i = 1; i < res.body.length; i++) assert.ok(res.body[i - 1].score >= res.body[i].score);
  const mine = res.body.find((m) => m.alumni.user_id === alumnus.id);
  assert.ok(mine, "the matching test alumnus is suggested");
  assert.deepEqual(mine.shared_skills.sort(), ["Python", "SQL"]);
});

test("a student with no skills and no goal gets an empty list", async () => {
  const res = await request(app).get("/api/matches").set(as(emptyStudent));
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, []);
});
