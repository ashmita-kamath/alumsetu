import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.js";

after(async () => {
  await pool.end();
});

test("GET /api/health returns 200", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
});

test("unknown route returns 404 in the error format", async () => {
  const res = await request(app).get("/api/this-route-does-not-exist");
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, "NOT_FOUND");
  assert.equal(typeof res.body.error.message, "string");
});
