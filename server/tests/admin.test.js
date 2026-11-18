import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { query } from "../src/config/db.js";
import { createUser, as, cleanup } from "./helpers/testData.js";

// signedUrl() only builds a URL locally, so a dummy Cloudinary config is enough.
process.env.CLOUDINARY_URL ||= "cloudinary://key:secret@demo";

const DOC = "https://res.cloudinary.com/demo/image/authenticated/v1/alumsetu/verification/degree.pdf";

let admin, otherAdmin, student, alumnus, alumnus2, requestId, request2Id;

before(async () => {
  admin = await createUser({ role: "admin", name: "Test Admin" });
  otherAdmin = await createUser({ role: "admin" });
  student = await createUser({ role: "student", name: "Stu Dent" });
  alumnus = await createUser({ role: "alumni", name: "Wants Badge", verified: false });
  alumnus2 = await createUser({ role: "alumni", verified: false });

  let res = await request(app).post("/api/verification").set(as(alumnus)).send({ document_url: DOC });
  requestId = res.body.request.id;
  res = await request(app).post("/api/verification").set(as(alumnus2)).send({ document_url: DOC });
  request2Id = res.body.request.id;
});
after(cleanup);

test("every admin endpoint needs an admin", async () => {
  for (const path of ["/api/admin/stats", "/api/admin/verifications", "/api/admin/users"]) {
    let res = await request(app).get(path);
    assert.equal(res.status, 401, path);
    res = await request(app).get(path).set(as(alumnus));
    assert.equal(res.status, 403, path);
  }
  const res = await request(app).patch(`/api/admin/verifications/${requestId}`).set(as(student)).send({ status: "approved" });
  assert.equal(res.status, 403);
});

test("stats returns every count as a number", async () => {
  const res = await request(app).get("/api/admin/stats").set(as(admin));
  assert.equal(res.status, 200);
  for (const key of ["students", "alumni", "verified_alumni", "pending_verifications", "pending_reports", "mentorships", "events", "jobs"]) {
    assert.equal(typeof res.body[key], "number", key);
  }
  assert.ok(res.body.pending_verifications >= 2);
});

test("the queue shows the alumnus, their profile and a signed, expiring document link", async () => {
  const res = await request(app).get("/api/admin/verifications?status=pending&limit=50").set(as(admin));
  assert.equal(res.status, 200);
  const item = res.body.items.find((r) => r.id === requestId);
  assert.ok(item);
  assert.equal(item.alumnus.full_name, "Wants Badge");
  assert.equal(item.profile.branch, "CSE");
  assert.equal(item.document_url, undefined, "the private URL itself is not sent");
  assert.match(item.document_link, /expires_at=/);
});

test("rejecting needs a reason, and keeps the alumnus unverified", async () => {
  let res = await request(app).patch(`/api/admin/verifications/${request2Id}`).set(as(admin)).send({ status: "rejected" });
  assert.equal(res.status, 400);
  res = await request(app)
    .patch(`/api/admin/verifications/${request2Id}`)
    .set(as(admin))
    .send({ status: "rejected", remarks: "Document is blurry" });
  assert.equal(res.status, 200);
  assert.equal(res.body.request.status, "rejected");
  assert.equal(res.body.request.reviewed_by_name, "Test Admin");
  const me = await request(app).get("/api/verification/me").set(as(alumnus2));
  assert.equal(me.body.remarks, "Document is blurry");
});

test("approving verifies the alumnus: badge on, can post jobs, cannot be reviewed again", async () => {
  let res = await request(app).patch(`/api/admin/verifications/${requestId}`).set(as(admin)).send({ status: "approved" });
  assert.equal(res.status, 200);
  assert.ok(res.body.request.reviewed_at);

  const card = await request(app).get(`/api/alumni/${alumnus.id}`).set(as(student));
  assert.equal(card.body.is_verified, true);

  const job = await request(app)
    .post("/api/jobs")
    .set(as(alumnus))
    .send({ title: "Admin test job", company: "TestCo", type: "job" });
  assert.equal(job.status, 201, "verified alumni can post jobs");

  res = await request(app).patch(`/api/admin/verifications/${requestId}`).set(as(admin)).send({ status: "rejected", remarks: "x" });
  assert.equal(res.status, 409);
});

test("users can be listed and filtered by role, status and search", async () => {
  let res = await request(app).get("/api/admin/users?role=student&search=Stu%20Dent").set(as(admin));
  assert.equal(res.status, 200);
  assert.ok(res.body.items.some((u) => u.id === student.id));
  assert.ok(res.body.items.every((u) => u.role === "student"));
  assert.equal(res.body.items[0].password_hash, undefined);
  res = await request(app).get("/api/admin/users?role=wizard").set(as(admin));
  assert.equal(res.status, 400);
});

test("suspending blocks the user straight away; re-activating restores access", async () => {
  let res = await request(app).patch(`/api/admin/users/${student.id}`).set(as(admin)).send({ status: "suspended" });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.status, "suspended");
  res = await request(app).get("/api/profiles/me").set(as(student));
  assert.equal(res.status, 403);

  res = await request(app).patch(`/api/admin/users/${student.id}`).set(as(admin)).send({ status: "active" });
  assert.equal(res.status, 200);
  res = await request(app).get("/api/profiles/me").set(as(student));
  assert.equal(res.status, 200);
});

test("admins cannot suspend themselves or other admins", async () => {
  let res = await request(app).patch(`/api/admin/users/${admin.id}`).set(as(admin)).send({ status: "suspended" });
  assert.equal(res.status, 400);
  res = await request(app).patch(`/api/admin/users/${otherAdmin.id}`).set(as(admin)).send({ status: "suspended" });
  assert.equal(res.status, 403);
  res = await request(app).patch("/api/admin/users/00000000-0000-0000-0000-000000000000").set(as(admin)).send({ status: "suspended" });
  assert.equal(res.status, 404);
  const { rows } = await query("SELECT status FROM users WHERE id = $1", [otherAdmin.id]);
  assert.equal(rows[0].status, "active");
});
