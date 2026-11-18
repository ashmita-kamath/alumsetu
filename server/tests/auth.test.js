import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { query } from "../src/config/db.js";
import { createUser, track, cleanup } from "./helpers/testData.js";

// Tests must not depend on the developer's real secret.
process.env.JWT_SECRET ||= "test-only-secret-at-least-16-chars";

const email = `student-${Date.now()}@test.alumsetu.dev`;
const password = "correct-horse-battery";
let token, userId, alumnus;

before(async () => {
  alumnus = await createUser({ role: "alumni" });
});
after(cleanup);

const bearer = (t) => ({ Authorization: `Bearer ${t}` });

test("register creates an active account and returns a token, never the password hash", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email: email.toUpperCase(), password, full_name: "Asha Rao", role: "student" });
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, email, "email is stored in lowercase");
  assert.equal(res.body.user.role, "student");
  assert.equal(res.body.user.status, "active");
  assert.equal(res.body.user.password_hash, undefined);
  token = res.body.token;
  userId = res.body.user.id;
  track(userId);

  const { rows } = await query("SELECT password_hash FROM users WHERE id = $1", [userId]);
  assert.notEqual(rows[0].password_hash, password, "password is hashed");
  assert.match(rows[0].password_hash, /^\$2[aby]\$10\$/);
});

test("duplicate email is a 409 conflict, whatever the letter case", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email: email.replace("student", "STUDENT"), password, full_name: "Someone", role: "alumni" });
  assert.equal(res.status, 409);
  assert.equal(res.body.error.code, "CONFLICT");
});

test("register validates the body and refuses admin sign-ups", async () => {
  const cases = [
    { email: "not-an-email", password, full_name: "A B", role: "student" },
    { email: "x@test.alumsetu.dev", password: "short", full_name: "A B", role: "student" },
    { email: "y@test.alumsetu.dev", password, full_name: "Admin", role: "admin" },
  ];
  for (const body of cases) {
    const res = await request(app).post("/api/auth/register").send(body);
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
    assert.ok(res.body.error.details.length > 0);
  }
});

test("login with the right password returns a token", async () => {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.id, userId);
  assert.equal(res.body.user.password_hash, undefined);
});

test("wrong password and unknown email give the same 401", async () => {
  const wrong = await request(app).post("/api/auth/login").send({ email, password: "wrong-password" });
  const unknown = await request(app).post("/api/auth/login").send({ email: "nobody@test.alumsetu.dev", password });
  for (const res of [wrong, unknown]) {
    assert.equal(res.status, 401);
    assert.equal(res.body.error.message, "Wrong email or password");
  }
});

test("GET /auth/me returns the logged-in user", async () => {
  const res = await request(app).get("/api/auth/me").set(bearer(token));
  assert.equal(res.status, 200);
  assert.equal(res.body.user.id, userId);
  assert.equal(res.body.user.password_hash, undefined);
});

test("missing, malformed, tampered and expired tokens are all 401", async () => {
  const expired = jwt.sign({ id: userId, role: "student" }, process.env.JWT_SECRET, { expiresIn: -10 });
  const forged = jwt.sign({ id: userId, role: "admin" }, "some-other-secret-value");
  const tampered = token.slice(0, -2) + (token.endsWith("aa") ? "bb" : "aa");

  let res = await request(app).get("/api/auth/me");
  assert.equal(res.status, 401);
  res = await request(app).get("/api/auth/me").set("Authorization", token); // no "Bearer"
  assert.equal(res.status, 401);
  for (const bad of [expired, forged, tampered]) {
    res = await request(app).get("/api/auth/me").set(bearer(bad));
    assert.equal(res.status, 401, "rejected token");
  }
  res = await request(app).get("/api/auth/me").set(bearer(expired));
  assert.match(res.body.error.message, /expired/);
});

test("a valid token with the wrong role gets 403", async () => {
  // /matches is for students only
  const alumniToken = jwt.sign({ id: alumnus.id, role: "alumni" }, process.env.JWT_SECRET);
  let res = await request(app).get("/api/matches").set(bearer(alumniToken));
  assert.equal(res.status, 403);
  // The role in the token is not trusted: it comes from the database.
  const lyingToken = jwt.sign({ id: alumnus.id, role: "student" }, process.env.JWT_SECRET);
  res = await request(app).get("/api/matches").set(bearer(lyingToken));
  assert.equal(res.status, 403);
});

test("a suspended user cannot log in, and their old token stops working", async () => {
  await query("UPDATE users SET status = 'suspended' WHERE id = $1", [userId]);
  let res = await request(app).post("/api/auth/login").send({ email, password });
  assert.equal(res.status, 403);
  res = await request(app).get("/api/auth/me").set(bearer(token));
  assert.equal(res.status, 403);
});

test("the alumni directory now needs a login", async () => {
  const res = await request(app).get("/api/alumni");
  assert.equal(res.status, 401);
});
