import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { query } from "../src/config/db.js";
import { createUser, as, cleanup } from "./helpers/testData.js";

let poster, otherAlumnus, unverified, student, student2, admin, jobId, applicationId;
const tag = `zj${Date.now()}`;
const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

before(async () => {
  poster = await createUser({ role: "alumni", name: "Job Poster" });
  otherAlumnus = await createUser({ role: "alumni" });
  unverified = await createUser({ role: "alumni", verified: false });
  student = await createUser({ role: "student", name: "Applicant One" });
  student2 = await createUser({ role: "student" });
  admin = await createUser({ role: "admin" });
});
after(async () => {
  await query("DELETE FROM jobs WHERE title LIKE $1", [`%${tag}%`]);
  await cleanup();
});

const newJob = (extra = {}) => ({
  title: `Data Intern ${tag}`, company: "Infosys", type: "internship", location: "Jaipur", deadline: inDays(10), ...extra,
});

test("only verified alumni can post jobs", async () => {
  let res = await request(app).post("/api/jobs").set(as(student)).send(newJob());
  assert.equal(res.status, 403);
  res = await request(app).post("/api/jobs").set(as(unverified)).send(newJob());
  assert.equal(res.status, 403);
  res = await request(app).post("/api/jobs").set(as(poster)).send(newJob());
  assert.equal(res.status, 201);
  assert.equal(res.body.job.posted_by.full_name, "Job Poster");
  assert.equal(res.body.job.is_open, true);
  jobId = res.body.job.id;
});

test("past deadlines and bad types are rejected", async () => {
  const res = await request(app).post("/api/jobs").set(as(poster)).send(newJob({ deadline: inDays(-2), type: "gig" }));
  assert.equal(res.status, 400);
  const fields = res.body.error.details.map((d) => d.field);
  assert.ok(fields.includes("deadline") && fields.includes("type"));
});

test("listing supports search, type and location", async () => {
  let res = await request(app).get(`/api/jobs?search=${tag}&type=internship&location=jai`).set(as(student));
  assert.equal(res.status, 200);
  assert.equal(res.body.total, 1);
  res = await request(app).get(`/api/jobs?search=${tag}&type=job`).set(as(student));
  assert.equal(res.body.total, 0);
});

test("a student applies once; a second try is a conflict", async () => {
  let res = await request(app).post(`/api/jobs/${jobId}/apply`).set(as(student)).send({ resume_url: "https://drive.example.com/cv.pdf" });
  assert.equal(res.status, 201);
  assert.equal(res.body.application.status, "applied");
  applicationId = res.body.application.id;
  res = await request(app).post(`/api/jobs/${jobId}/apply`).set(as(student)).send({});
  assert.equal(res.status, 409);
  res = await request(app).get(`/api/jobs/${jobId}`).set(as(student));
  assert.equal(res.body.has_applied, true);
});

test("alumni cannot apply, and resume links must be URLs", async () => {
  let res = await request(app).post(`/api/jobs/${jobId}/apply`).set(as(otherAlumnus)).send({});
  assert.equal(res.status, 403);
  res = await request(app).post(`/api/jobs/${jobId}/apply`).set(as(student2)).send({ resume_url: "my-cv.pdf" });
  assert.equal(res.status, 400);
});

test("only the poster sees applicants and can change their status", async () => {
  let res = await request(app).get(`/api/jobs/${jobId}/applications`).set(as(otherAlumnus));
  assert.equal(res.status, 403);
  res = await request(app).get(`/api/jobs/${jobId}/applications`).set(as(poster));
  assert.equal(res.body[0].student.full_name, "Applicant One");
  res = await request(app).patch(`/api/applications/${applicationId}`).set(as(otherAlumnus)).send({ status: "selected" });
  assert.equal(res.status, 404);
  res = await request(app).patch(`/api/applications/${applicationId}`).set(as(poster)).send({ status: "shortlisted" });
  assert.equal(res.status, 200);
  assert.equal(res.body.application.status, "shortlisted");
});

test("students see their applications with the job title", async () => {
  const res = await request(app).get("/api/applications/my").set(as(student));
  const mine = res.body.find((a) => a.id === applicationId);
  assert.equal(mine.status, "shortlisted");
  assert.equal(mine.job.title, `Data Intern ${tag}`);
});

test("closed jobs are hidden by default and cannot be applied to", async () => {
  await query("UPDATE jobs SET deadline = CURRENT_DATE - 1 WHERE id = $1", [jobId]);
  let res = await request(app).post(`/api/jobs/${jobId}/apply`).set(as(student2)).send({});
  assert.equal(res.status, 400);
  res = await request(app).get(`/api/jobs?search=${tag}`).set(as(student));
  assert.equal(res.body.total, 0);
  res = await request(app).get(`/api/jobs?search=${tag}&include_closed=true`).set(as(student));
  assert.equal(res.body.total, 1);
});

test("only the poster or an admin can delete a job", async () => {
  let res = await request(app).delete(`/api/jobs/${jobId}`).set(as(otherAlumnus));
  assert.equal(res.status, 403);
  res = await request(app).delete(`/api/jobs/${jobId}`).set(as(admin));
  assert.equal(res.status, 204);
});
