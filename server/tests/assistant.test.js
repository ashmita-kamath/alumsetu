import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { findTopic, words } from "../src/services/assistantService.js";
import { createUser, as, cleanup } from "./helpers/testData.js";

let student, newStudent, alumnus;

before(async () => {
  alumnus = await createUser({ role: "alumni", skills: ["Python", "SQL"] });
  student = await createUser({ role: "student", skills: ["Python", "SQL"], careerGoal: "data engineer" });
  newStudent = await createUser({ role: "student", profile: false });
});
after(cleanup);

const ask = (message, user) => {
  const req = request(app).post("/api/assistant").send({ message });
  return user ? req.set(as(user)) : req;
};

test("words() drops filler, joins plurals and Hindi synonyms", () => {
  assert.deepEqual(words("Koi naukri hai kya?"), ["job"]);
  assert.deepEqual(words("Upcoming Webinars"), ["upcoming", "webinar"]);
});

test("findTopic understands different ways of asking", () => {
  const cases = {
    "Suggest a mentor": "find-mentor",
    "i want internship": "jobs",
    "how do I get the verified badge": "verification",
    "my polytechnic is missing": "colleges",
    "any webinars this week": "events",
    "how to become a data scientist": "career-guidance",
  };
  for (const [message, topic] of Object.entries(cases)) assert.equal(findTopic(message).topic?.id, topic, message);
  assert.equal(findTopic("who is the prime minister").topic, null);
});

test("anyone can open the assistant; the greeting fits the role", async () => {
  let res = await request(app).get("/api/assistant");
  assert.equal(res.status, 200);
  assert.ok(res.body.suggestions.includes("How do I sign up?"));
  res = await request(app).get("/api/assistant").set(as(student));
  assert.ok(res.body.suggestions.includes("Suggest a mentor"));
});

test("answers depend on who is asking", async () => {
  let res = await ask("how do i get verified");
  assert.equal(res.body.topic, "verification");
  assert.match(res.body.answer, /admin checks it/);

  res = await ask("how do i get verified", alumnus);
  assert.match(res.body.answer, /upload your degree certificate/);
  assert.deepEqual(res.body.links, [{ label: "Dashboard", to: "/dashboard" }]);
});

test("a student asking for a mentor gets their real matches", async () => {
  const res = await ask("suggest a mentor for me", student);
  assert.equal(res.status, 200);
  assert.equal(res.body.topic, "find-mentor");
  assert.ok(res.body.items.length > 0 && res.body.items.length <= 3);
  for (const item of res.body.items) assert.match(item.to, /^\/alumni\/[0-9a-f-]{36}$/);
});

test("a student with an empty profile is told what to fill in", async () => {
  const res = await ask("suggest a mentor", newStudent);
  assert.equal(res.body.items.length, 0);
  assert.match(res.body.answer, /skills and a career goal/);
  assert.deepEqual(res.body.links, [{ label: "Edit profile", to: "/profile/edit" }]);
});

test("guests get no live data, logged-in users get the latest jobs", async () => {
  let res = await ask("latest jobs");
  assert.equal(res.body.topic, "jobs");
  assert.deepEqual(res.body.items, []);
  assert.match(res.body.answer, /Log in/);

  res = await ask("latest jobs", student);
  assert.ok(Array.isArray(res.body.items));
  for (const item of res.body.items) assert.match(item.to, /^\/jobs\/\d+$/);
});

test("off-topic and abusive messages get a polite answer, empty ones a 400", async () => {
  let res = await ask("what is the weather today", student);
  assert.equal(res.body.topic, null);
  assert.ok(res.body.suggestions.length > 0);

  res = await ask("this site is shit", student);
  assert.equal(res.body.topic, null);
  assert.match(res.body.answer, /keep it friendly/);

  res = await ask("   ");
  assert.equal(res.status, 400);
  res = await ask("x".repeat(301));
  assert.equal(res.status, 400);
});

test("a bad token is treated as a visitor, not an error", async () => {
  const res = await request(app).post("/api/assistant").set("Authorization", "Bearer not-a-real-token").send({ message: "hello" });
  assert.equal(res.status, 200);
  assert.equal(res.body.topic, "greeting");
});
