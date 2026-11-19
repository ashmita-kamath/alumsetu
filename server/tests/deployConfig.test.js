import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOriginCheck, parseAllowedOrigins } from "../src/config/cors.js";
import { checkProductionEnv } from "../src/config/checkEnv.js";

test("CLIENT_URL can list several origins, with trailing slashes ignored", () => {
  assert.deepEqual(parseAllowedOrigins(" https://a.vercel.app/ , http://localhost:5173 "), [
    "https://a.vercel.app",
    "http://localhost:5173",
  ]);
});

test("only listed origins are allowed, and * matches Vercel preview links", () => {
  const ok = buildOriginCheck("https://alumsetu.vercel.app,https://alumsetu-*.vercel.app");
  assert.equal(ok("https://alumsetu.vercel.app"), true);
  assert.equal(ok("https://alumsetu-git-feat-x-sidd.vercel.app"), true);
  assert.equal(ok("https://evil.example.com"), false);
  assert.equal(ok("https://alumsetu.vercel.app.evil.com"), false);
});

test("requests without an Origin and the mobile/desktop apps are allowed", () => {
  const ok = buildOriginCheck("https://alumsetu.vercel.app");
  assert.equal(ok(undefined), true);
  assert.equal(ok("capacitor://localhost"), true);
  assert.equal(ok("tauri://localhost"), true);
});

test("an empty CLIENT_URL allows every origin (local development)", () => {
  assert.equal(buildOriginCheck("")("https://anything.example"), true);
});

test("production refuses to start without a database or a strong JWT secret", () => {
  assert.deepEqual(checkProductionEnv({ NODE_ENV: "development" }), []);
  const problems = checkProductionEnv({ NODE_ENV: "production", JWT_SECRET: "change_me" });
  assert.ok(problems.some((p) => p.startsWith("DATABASE_URL")));
  assert.ok(problems.some((p) => p.startsWith("JWT_SECRET")));
  const good = checkProductionEnv({
    NODE_ENV: "production", DATABASE_URL: "postgres://x", JWT_SECRET: "x".repeat(48),
    CLIENT_URL: "https://a.vercel.app", CLOUDINARY_URL: "cloudinary://k:s@c",
  });
  assert.deepEqual(good, []);
});
