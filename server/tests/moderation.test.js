// Unit tests for the bad-words filter (no database needed).
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkText, findBlockedWord } from "../src/services/moderationService.js";

const blocked = (text) => checkText(text).allowed === false;

test("normal posts are allowed", () => {
  for (const text of [
    "How did you prepare for campus placements?",
    "My class assessment is next week, any tips for the passage questions?",
    "I live near Scunthorpe and Essex. Analysis of the cocktail party problem.",
    "Shift timings at Infosys: is it a 9 to 5 job?",
    "Hello! I scored 95% in 2024 @ JECRC.",
    "Can't join bc of exams. The MC at the fest was great.",
  ]) {
    assert.equal(blocked(text), false, text);
  }
});

test("blocked words are caught in any letter case", () => {
  assert.ok(blocked("This is SHIT advice"));
  assert.ok(blocked("what a bastard"));
});

test("endings, repeated letters and look-alike symbols are caught", () => {
  assert.equal(findBlockedWord("this is fucking useless"), "fucking");
  assert.ok(blocked("fuuuuck this"));
  assert.ok(blocked("you are a b1tch"));
  assert.ok(blocked("sh!t happens"));
  assert.ok(blocked("$hit"));
});

test("letters split by spaces or dots are caught", () => {
  assert.ok(blocked("f u c k off"));
  assert.ok(blocked("s.h.i.t"));
});

test("common Hindi abuse in Latin script is caught", () => {
  assert.ok(blocked("tu chutiya hai"));
  assert.ok(blocked("BHENCHOD"));
});

test("title and body are checked together", () => {
  assert.equal(checkText("Fine title", "fine body").allowed, true);
  assert.equal(checkText("Fine title", "shit body").allowed, false);
});

test("posts with too many links are blocked as spam", () => {
  const spam = Array.from({ length: 6 }, (_, i) => `https://spam${i}.example.com`).join(" ");
  const result = checkText(spam);
  assert.equal(result.allowed, false);
  assert.match(result.reason, /links/);
  assert.equal(checkText("see https://a.com and https://b.com").allowed, true);
});
