import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { createUser, as, cleanup } from "./helpers/testData.js";

let author, reader, admin, postId, commentId;

before(async () => {
  author = await createUser({ role: "student", name: "Post Author" });
  reader = await createUser({ role: "alumni" });
  admin = await createUser({ role: "admin", name: "Admin" });

  const post = await request(app)
    .post("/api/posts")
    .set(as(author))
    .send({ title: "Placement tips", body: "Start early with DSA.", category: "placements" });
  postId = post.body.post.id;
  const comment = await request(app).post(`/api/posts/${postId}/comments`).set(as(author)).send({ body: "Also do projects." });
  commentId = comment.body.comment.id;
});
after(cleanup);

test("blocked words in a post or comment give 422 CONTENT_BLOCKED and nothing is saved", async () => {
  let res = await request(app).post("/api/posts").set(as(author)).send({ title: "Help", body: "this is sh1t", category: "general" });
  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, "CONTENT_BLOCKED");
  res = await request(app).post(`/api/posts/${postId}/comments`).set(as(reader)).send({ body: "f u c k this" });
  assert.equal(res.status, 422);
  res = await request(app).get(`/api/posts/${postId}`).set(as(reader));
  assert.equal(res.body.comments.length, 1);
});

test("editing a post into blocked text is also refused", async () => {
  const res = await request(app).patch(`/api/posts/${postId}`).set(as(author)).send({ body: "bullshit" });
  assert.equal(res.status, 422);
});

test("reporting needs a login and exactly one target", async () => {
  let res = await request(app).post("/api/reports").send({ post_id: postId, reason: "Spam" });
  assert.equal(res.status, 401);
  res = await request(app).post("/api/reports").set(as(reader)).send({ post_id: postId, comment_id: commentId, reason: "Spam" });
  assert.equal(res.status, 400);
  res = await request(app).post("/api/reports").set(as(reader)).send({ reason: "Spam" });
  assert.equal(res.status, 400);
  res = await request(app).post("/api/reports").set(as(reader)).send({ post_id: 99999999, reason: "Spam" });
  assert.equal(res.status, 404);
});

test("users cannot report their own content", async () => {
  const res = await request(app).post("/api/reports").set(as(author)).send({ post_id: postId, reason: "Spam" });
  assert.equal(res.status, 400);
});

let postReportId, commentReportId;

test("a user reports a post and a comment; reporting twice is a conflict", async () => {
  let res = await request(app).post("/api/reports").set(as(reader)).send({ post_id: postId, reason: "Spam or advertising" });
  assert.equal(res.status, 201);
  assert.equal(res.body.report.status, "pending");
  postReportId = res.body.report.id;
  res = await request(app).post("/api/reports").set(as(reader)).send({ post_id: postId, reason: "Again" });
  assert.equal(res.status, 409);
  res = await request(app).post("/api/reports").set(as(reader)).send({ comment_id: commentId, reason: "Harassment" });
  assert.equal(res.status, 201);
  commentReportId = res.body.report.id;
});

test("only admins can see and review reports", async () => {
  let res = await request(app).get("/api/admin/reports").set(as(reader));
  assert.equal(res.status, 403);
  res = await request(app).patch(`/api/admin/reports/${postReportId}`).set(as(author)).send({ status: "approved" });
  assert.equal(res.status, 403);
});

test("the admin queue shows the reported text and who reported it", async () => {
  const res = await request(app).get("/api/admin/reports?status=pending&limit=50").set(as(admin));
  assert.equal(res.status, 200);
  const mine = res.body.items.find((r) => r.id === postReportId);
  assert.ok(mine);
  assert.equal(mine.target.type, "post");
  assert.equal(mine.target.title, "Placement tips");
  assert.equal(mine.target.author.full_name, "Post Author");
  assert.equal(mine.reporter.id, reader.id);
  assert.ok(res.body.total >= 2);
});

test("rejecting a report leaves the comment visible", async () => {
  const res = await request(app).patch(`/api/admin/reports/${commentReportId}`).set(as(admin)).send({ status: "rejected" });
  assert.equal(res.status, 200);
  assert.equal(res.body.report.status, "rejected");
  const post = await request(app).get(`/api/posts/${postId}`).set(as(reader));
  assert.equal(post.body.comments.length, 1);
});

test("approving a report hides the post from everyone except admins", async () => {
  const res = await request(app).patch(`/api/admin/reports/${postReportId}`).set(as(admin)).send({ status: "approved" });
  assert.equal(res.status, 200);
  assert.equal(res.body.report.target.is_flagged, true);

  let view = await request(app).get(`/api/posts/${postId}`).set(as(reader));
  assert.equal(view.status, 404);
  view = await request(app).get(`/api/posts/${postId}`).set(as(author));
  assert.equal(view.status, 404, "even the author no longer sees it");
  view = await request(app).get(`/api/posts/${postId}`).set(as(admin));
  assert.equal(view.status, 200);

  const list = await request(app).get("/api/posts?limit=50").set(as(reader));
  assert.ok(!list.body.items.some((p) => p.id === postId));
});

test("a report can only be reviewed once, and hidden posts cannot be reported again", async () => {
  let res = await request(app).patch(`/api/admin/reports/${postReportId}`).set(as(admin)).send({ status: "rejected" });
  assert.equal(res.status, 409);
  res = await request(app).post("/api/reports").set(as(admin)).send({ post_id: postId, reason: "Spam" });
  assert.equal(res.status, 404);
});
