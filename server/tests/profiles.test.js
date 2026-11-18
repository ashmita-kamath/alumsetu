import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { createUser, as, cleanup, institutionId, skillIds } from "./helpers/testData.js";

let student, alumnus, admin, other, inst;

before(async () => {
  inst = await institutionId();
  student = await createUser({ role: "student", profile: false });
  alumnus = await createUser({ role: "alumni", profile: false });
  admin = await createUser({ role: "admin" });
  other = await createUser({ role: "student" });
});
after(cleanup);

test("GET /profiles/me without a user returns 401", async () => {
  const res = await request(app).get("/api/profiles/me");
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, "UNAUTHORIZED");
});

test("a new student has no profile yet", async () => {
  const res = await request(app).get("/api/profiles/me").set(as(student));
  assert.equal(res.status, 200);
  assert.equal(res.body.profile, null);
  assert.equal(res.body.user.email, student.email);
  assert.equal(res.body.user.password_hash, undefined);
});

test("a student can create and then update their profile with skills", async () => {
  const [python, sql] = await skillIds("Python", "SQL");
  const body = {
    full_name: "Updated Student", institution_id: inst, branch: "CSE",
    enrollment_year: 2024, expected_grad_year: 2028, career_goal: "data engineer", skill_ids: [python, sql],
  };
  let res = await request(app).put("/api/profiles/me").set(as(student)).send(body);
  assert.equal(res.status, 200);
  assert.equal(res.body.user.full_name, "Updated Student");
  assert.equal(res.body.profile.career_goal, "data engineer");
  assert.deepEqual(res.body.skills.map((s) => s.name), ["Python", "SQL"]);

  res = await request(app).put("/api/profiles/me").set(as(student)).send({ ...body, skill_ids: [python], career_goal: "" });
  assert.equal(res.status, 200);
  assert.equal(res.body.profile.career_goal, null);
  assert.deepEqual(res.body.skills.map((s) => s.name), ["Python"]);
});

test("student profile validation errors list the fields", async () => {
  const res = await request(app).put("/api/profiles/me").set(as(student))
    .send({ institution_id: inst, branch: "", enrollment_year: 2026, expected_grad_year: 2024 });
  assert.equal(res.status, 400);
  const fields = res.body.error.details.map((d) => d.field);
  assert.ok(fields.includes("branch"));
});

test("unknown college or skill is rejected with 400", async () => {
  const base = { institution_id: 999999, branch: "CSE", enrollment_year: 2024, expected_grad_year: 2028 };
  let res = await request(app).put("/api/profiles/me").set(as(student)).send(base);
  assert.equal(res.status, 400);
  res = await request(app).put("/api/profiles/me").set(as(student)).send({ ...base, institution_id: inst, skill_ids: [999999] });
  assert.equal(res.status, 400);
});

test("an alumnus can save a profile but can never verify themselves", async () => {
  const res = await request(app).put("/api/profiles/me").set(as(alumnus)).send({
    institution_id: inst, branch: "ECE", graduation_year: 2019, job_title: "Engineer",
    linkedin_url: "https://linkedin.com/in/test", is_verified: true,
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.profile.is_verified, false);
  assert.equal(res.body.profile.available_for_mentoring, true);
});

test("a bad LinkedIn URL is rejected", async () => {
  const res = await request(app).put("/api/profiles/me").set(as(alumnus))
    .send({ institution_id: inst, branch: "ECE", graduation_year: 2019, linkedin_url: "linkedin.com/x" });
  assert.equal(res.status, 400);
});

test("admins cannot create a profile", async () => {
  const res = await request(app).put("/api/profiles/me").set(as(admin)).send({});
  assert.equal(res.status, 403);
});

test("other users' emails are hidden, but admins can see them", async () => {
  let res = await request(app).get(`/api/profiles/${student.id}`).set(as(other));
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, undefined);
  res = await request(app).get(`/api/profiles/${student.id}`).set(as(admin));
  assert.equal(res.body.user.email, student.email);
});

test("unknown or invalid user ids give 404 and 400", async () => {
  let res = await request(app).get("/api/profiles/00000000-0000-0000-0000-000000000000").set(as(other));
  assert.equal(res.status, 404);
  res = await request(app).get("/api/profiles/abc").set(as(other));
  assert.equal(res.status, 400);
});

test("POST /skills returns the existing skill or creates a new one", async () => {
  let res = await request(app).post("/api/skills").set(as(other)).send({ name: "python" });
  assert.equal(res.status, 200);
  assert.equal(res.body.skill.name, "Python");
  const name = `Test Skill ${Date.now()}`;
  res = await request(app).post("/api/skills").set(as(other)).send({ name });
  assert.equal(res.status, 201);
  assert.equal(res.body.skill.name, name);
  const { query } = await import("../src/config/db.js");
  await query("DELETE FROM skills WHERE id = $1", [res.body.skill.id]);
});

test("only admins can add a college", async () => {
  const body = { name: `Test College ${Date.now()}`, city: "Jaipur" };
  let res = await request(app).post("/api/institutions").set(as(other)).send(body);
  assert.equal(res.status, 403);
  res = await request(app).post("/api/institutions").set(as(admin)).send(body);
  assert.equal(res.status, 201);
  const again = await request(app).post("/api/institutions").set(as(admin)).send(body);
  assert.equal(again.status, 409);
  const { query } = await import("../src/config/db.js");
  await query("DELETE FROM institutions WHERE id = $1", [res.body.institution.id]);
});
