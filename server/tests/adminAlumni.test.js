import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { query } from "../src/config/db.js";
import { csvCell } from "../src/services/adminService.js";
import { createUser, as, cleanup } from "./helpers/testData.js";

// A graduation year no sample alumnus has, so the filters only see our test users.
const YEAR = 1961;

let admin, student, employed, studying;

before(async () => {
  admin = await createUser({ role: "admin" });
  student = await createUser({ role: "student" });
  employed = await createUser({ role: "alumni", name: "Aaa Employed Alumnus" });
  studying = await createUser({ role: "alumni", name: "Bbb Studying Alumnus", verified: false });
  await query(
    "UPDATE alumni_profiles SET graduation_year = $1, employment_status = 'employed', phone = '+91 98290 00001', current_company = '=HYPERLINK(\"x\")' WHERE user_id = $2",
    [YEAR, employed.id]
  );
  await query("UPDATE alumni_profiles SET graduation_year = $1, employment_status = 'higher_studies' WHERE user_id = $2", [YEAR, studying.id]);
});
after(cleanup);

test("the alumni database is for admins only", async () => {
  for (const path of ["/api/admin/alumni", "/api/admin/alumni/export"]) {
    assert.equal((await request(app).get(path)).status, 401);
    assert.equal((await request(app).get(path).set(as(student))).status, 403);
    assert.equal((await request(app).get(path).set(as(employed))).status, 403);
  }
});

test("admins see every alumnus with contact details, and can filter", async () => {
  let res = await request(app).get(`/api/admin/alumni?graduation_year=${YEAR}`).set(as(admin));
  assert.equal(res.status, 200);
  assert.equal(res.body.total, 2);
  const first = res.body.items[0];
  assert.equal(first.full_name, "Aaa Employed Alumnus");
  assert.equal(first.email, employed.email);
  assert.equal(first.phone, "+91 98290 00001");
  assert.deepEqual(res.body.by_employment, { employed: 1, higher_studies: 1 });

  res = await request(app).get(`/api/admin/alumni?graduation_year=${YEAR}&employment_status=higher_studies`).set(as(admin));
  assert.deepEqual(res.body.items.map((a) => a.full_name), ["Bbb Studying Alumnus"]);
  // The breakdown ignores the employment filter, so the page can show all counts
  assert.deepEqual(res.body.by_employment, { employed: 1, higher_studies: 1 });

  res = await request(app).get(`/api/admin/alumni?graduation_year=${YEAR}&verified=no`).set(as(admin));
  assert.deepEqual(res.body.items.map((a) => a.full_name), ["Bbb Studying Alumnus"]);

  res = await request(app).get("/api/admin/alumni?employment_status=retired").set(as(admin));
  assert.equal(res.status, 400);
});

test("CSV export downloads the filtered alumni safely", async () => {
  const res = await request(app).get(`/api/admin/alumni/export?graduation_year=${YEAR}`).set(as(admin));
  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"], /text\/csv/);
  assert.match(res.headers["content-disposition"], /attachment; filename="alumsetu-alumni-\d{4}-\d{2}-\d{2}\.csv"/);
  assert.equal(res.headers["cache-control"], "no-store");

  const lines = res.text.replace(/^﻿/, "").trim().split("\r\n");
  assert.equal(lines.length, 3); // header + 2 alumni
  assert.match(lines[0], /^"Name","Email","Phone","College"/);
  assert.ok(lines[1].includes(`"${employed.email}"`));
  // A value that looks like a formula is neutralised
  assert.ok(lines[1].includes(`"'=HYPERLINK(""x"")"`));
});

test("csvCell quotes text, escapes quotes and blocks formulas", () => {
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("=1+1"), "\"'=1+1\"");
  assert.equal(csvCell("-2"), "\"'-2\"");
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell(true), '"Yes"');
  assert.equal(csvCell(new Date("2026-11-20T10:00:00Z")), '"2026-11-20"');
});
