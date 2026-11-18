import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { query } from "../src/config/db.js";
import { createUser, as, cleanup } from "./helpers/testData.js";

let author, reader, admin, postId, commentId;
const tag = `zq${Date.now()}`; // unique word so searches only find this test's posts

before(async () => {
  author = await createUser({ role: "student", name: "Post Author" });
  reader = await createUser({ role: "alumni" });
  admin = await createUser({ role: "admin" });
});
after(cleanup);

test("the forum needs a logged-in user", async () => {
  const res = await request(app).get("/api/posts");
  assert.equal(res.status, 401);
});

test("creating a post returns it with the author", async () => {
  const res = await request(app).post("/api/posts").set(as(author))
    .send({ title: `Placement tips ${tag}`, body: "How do I prepare?", category: "placements" });
  assert.equal(res.status, 201);
  assert.equal(res.body.post.author.full_name, "Post Author");
  assert.equal(res.body.post.author_id, undefined);
  postId = res.body.post.id;
});

test("post validation: short title and unknown category are rejected", async () => {
  const res = await request(app).post("/api/posts").set(as(author)).send({ title: "Hi", body: "x", category: "memes" });
  assert.equal(res.status, 400);
  const fields = res.body.error.details.map((d) => d.field);
  assert.ok(fields.includes("title") && fields.includes("category"));
});

test("listing supports search, category and pagination", async () => {
  let res = await request(app).get(`/api/posts?search=${tag}`).set(as(reader));
  assert.equal(res.status, 200);
  assert.equal(res.body.total, 1);
  assert.equal(res.body.items[0].comment_count, 0);
  res = await request(app).get(`/api/posts?search=${tag}&category=careers`).set(as(reader));
  assert.equal(res.body.total, 0);
  res = await request(app).get("/api/posts?limit=1&page=1").set(as(reader));
  assert.equal(res.body.limit, 1);
});

test("comments are added and shown with their author", async () => {
  let res = await request(app).post(`/api/posts/${postId}/comments`).set(as(reader)).send({ body: "Practise DSA daily" });
  assert.equal(res.status, 201);
  assert.equal(res.body.comment.author.id, reader.id);
  commentId = res.body.comment.id;
  res = await request(app).get(`/api/posts/${postId}`).set(as(author));
  assert.equal(res.body.comments.length, 1);
  assert.equal(res.body.comments[0].author.role, "alumni");
});

test("only the author can edit a post", async () => {
  let res = await request(app).patch(`/api/posts/${postId}`).set(as(reader)).send({ title: "Hacked title" });
  assert.equal(res.status, 403);
  res = await request(app).patch(`/api/posts/${postId}`).set(as(author)).send({ title: `Updated tips ${tag}` });
  assert.equal(res.status, 200);
  assert.equal(res.body.post.title, `Updated tips ${tag}`);
});

test("flagged content is hidden from users but visible to admins", async () => {
  await query("UPDATE forum_posts SET is_flagged = TRUE WHERE id = $1", [postId]);
  let res = await request(app).get(`/api/posts/${postId}`).set(as(reader));
  assert.equal(res.status, 404);
  res = await request(app).get(`/api/posts?search=${tag}`).set(as(reader));
  assert.equal(res.body.total, 0);
  res = await request(app).get(`/api/posts/${postId}`).set(as(admin));
  assert.equal(res.status, 200);
  await query("UPDATE forum_posts SET is_flagged = FALSE WHERE id = $1", [postId]);
});

test("only the author or an admin can delete comments and posts", async () => {
  let res = await request(app).delete(`/api/comments/${commentId}`).set(as(author));
  assert.equal(res.status, 403);
  res = await request(app).delete(`/api/comments/${commentId}`).set(as(admin));
  assert.equal(res.status, 204);
  res = await request(app).delete(`/api/posts/${postId}`).set(as(reader));
  assert.equal(res.status, 403);
  res = await request(app).delete(`/api/posts/${postId}`).set(as(author));
  assert.equal(res.status, 204);
  res = await request(app).get(`/api/posts/${postId}`).set(as(author));
  assert.equal(res.status, 404);
});
