import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import { query } from "../src/config/db.js";
import { createUser, as, cleanup } from "./helpers/testData.js";

let organizer, unverified, student, student2, student3, admin, eventId;
const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString();

before(async () => {
  organizer = await createUser({ role: "alumni", name: "Event Host" });
  unverified = await createUser({ role: "alumni", verified: false });
  student = await createUser({ role: "student" });
  student2 = await createUser({ role: "student" });
  student3 = await createUser({ role: "student" });
  admin = await createUser({ role: "admin" });
});
after(cleanup);

const newEvent = (extra = {}) => ({
  title: "Resume Review Webinar", type: "webinar", mode: "online",
  venue_or_link: "https://meet.example.com/abc", start_time: inDays(7), capacity: 2, ...extra,
});

test("only verified alumni and admins can create events", async () => {
  let res = await request(app).post("/api/events").set(as(student)).send(newEvent());
  assert.equal(res.status, 403);
  res = await request(app).post("/api/events").set(as(unverified)).send(newEvent());
  assert.equal(res.status, 403);
  res = await request(app).post("/api/events").set(as(organizer)).send(newEvent());
  assert.equal(res.status, 201);
  assert.equal(res.body.event.organizer.full_name, "Event Host");
  eventId = res.body.event.id;
});

test("events in the past or with bad fields are rejected", async () => {
  const res = await request(app).post("/api/events").set(as(organizer)).send(newEvent({ start_time: inDays(-1), type: "party" }));
  assert.equal(res.status, 400);
  const fields = res.body.error.details.map((d) => d.field);
  assert.ok(fields.includes("start_time") && fields.includes("type"));
});

test("upcoming list includes the event with its registration count", async () => {
  const res = await request(app).get("/api/events?type=webinar&limit=50").set(as(student));
  assert.equal(res.status, 200);
  const found = res.body.items.find((e) => e.id === eventId);
  assert.equal(found.registered_count, 0);
});

test("registration: once only, and capacity is enforced", async () => {
  let res = await request(app).post(`/api/events/${eventId}/register`).set(as(student));
  assert.equal(res.status, 201);
  res = await request(app).post(`/api/events/${eventId}/register`).set(as(student));
  assert.equal(res.status, 409);
  res = await request(app).post(`/api/events/${eventId}/register`).set(as(student2));
  assert.equal(res.status, 201);
  res = await request(app).post(`/api/events/${eventId}/register`).set(as(student3));
  assert.equal(res.status, 409);
  assert.match(res.body.error.message, /full/);
});

test("event details show is_registered for the viewer", async () => {
  let res = await request(app).get(`/api/events/${eventId}`).set(as(student));
  assert.equal(res.body.is_registered, true);
  assert.equal(res.body.registered_count, 2);
  res = await request(app).get(`/api/events/${eventId}`).set(as(student3));
  assert.equal(res.body.is_registered, false);
});

test("my registrations and the organizer's list", async () => {
  let res = await request(app).get("/api/me/registrations").set(as(student));
  assert.ok(res.body.some((e) => e.id === eventId));
  res = await request(app).get(`/api/events/${eventId}/registrations`).set(as(student));
  assert.equal(res.status, 403);
  res = await request(app).get(`/api/events/${eventId}/registrations`).set(as(organizer));
  assert.equal(res.body.length, 2);
});

test("cancelling frees the seat", async () => {
  let res = await request(app).delete(`/api/events/${eventId}/register`).set(as(student2));
  assert.equal(res.status, 204);
  res = await request(app).delete(`/api/events/${eventId}/register`).set(as(student2));
  assert.equal(res.status, 404);
  res = await request(app).post(`/api/events/${eventId}/register`).set(as(student3));
  assert.equal(res.status, 201);
});

test("only the organizer or admin can edit; capacity cannot drop below sign-ups", async () => {
  let res = await request(app).patch(`/api/events/${eventId}`).set(as(student)).send({ title: "Hacked" });
  assert.equal(res.status, 403);
  res = await request(app).patch(`/api/events/${eventId}`).set(as(organizer)).send({ capacity: 1 });
  assert.equal(res.status, 409);
  res = await request(app).patch(`/api/events/${eventId}`).set(as(admin)).send({ title: "Resume Review Live" });
  assert.equal(res.status, 200);
  assert.equal(res.body.event.title, "Resume Review Live");
});

test("past events cannot be registered for and show in the past list", async () => {
  await query("UPDATE events SET start_time = now() - interval '1 day' WHERE id = $1", [eventId]);
  let res = await request(app).post(`/api/events/${eventId}/register`).set(as(student2));
  assert.equal(res.status, 400);
  res = await request(app).get("/api/events?when=past&limit=50").set(as(student));
  assert.ok(res.body.items.some((e) => e.id === eventId));
});

test("deleting an event", async () => {
  let res = await request(app).delete(`/api/events/${eventId}`).set(as(student));
  assert.equal(res.status, 403);
  res = await request(app).delete(`/api/events/${eventId}`).set(as(organizer));
  assert.equal(res.status, 204);
  res = await request(app).get(`/api/events/${eventId}`).set(as(student));
  assert.equal(res.status, 404);
});
