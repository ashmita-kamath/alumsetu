import { test } from "node:test";
import assert from "node:assert/strict";
import { tokenize, tfidfVectors, cosineSimilarity } from "../src/services/matching/textSimilarity.js";

test("tokenize lowercases, removes stop words and trims plurals", () => {
  assert.deepEqual(tokenize("I want to become a Data Engineer at product companies"), ["data", "engineer", "product"]);
});

test("tokenize keeps c++ and returns [] for empty text", () => {
  assert.deepEqual(tokenize("C++ developer"), ["c++", "developer"]);
  assert.deepEqual(tokenize(""), []);
  assert.deepEqual(tokenize(null), []);
});

test("identical texts have similarity 1", () => {
  const [a, b] = tfidfVectors(["data engineer", "data engineer"]);
  assert.ok(Math.abs(cosineSimilarity(a, b) - 1) < 1e-9);
});

test("texts with no shared words have similarity 0", () => {
  const [a, b] = tfidfVectors(["data engineer", "civil construction"]);
  assert.equal(cosineSimilarity(a, b), 0);
});

test("an empty text has similarity 0 with anything", () => {
  const [a, b] = tfidfVectors(["", "data engineer"]);
  assert.equal(cosineSimilarity(a, b), 0);
});

test("a closer text scores higher than a loosely related one", () => {
  const [goal, close, loose] = tfidfVectors([
    "machine learning engineer",
    "machine learning engineer e-commerce",
    "hardware design engineer semiconductors",
  ]);
  assert.ok(cosineSimilarity(goal, close) > cosineSimilarity(goal, loose));
});
