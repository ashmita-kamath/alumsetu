import { test } from "node:test";
import assert from "node:assert/strict";
import { jaccard, sameBranch, buildReasons, rankMentors, WEIGHTS } from "../src/services/matching/scoring.js";

const skills = (...names) => names.map((name, i) => ({ id: i + 1, name }));
const alumnus = (full_name, branch, job_title, industry, ...skillNames) => ({
  user_id: full_name, full_name, branch, job_title, industry, skills: skills(...skillNames),
});

test("weights add up to 1", () => {
  assert.ok(Math.abs(WEIGHTS.skills + WEIGHTS.goal + WEIGHTS.branch - 1) < 1e-9);
});

test("jaccard: the worked example from our slides (2 shared of 5 total = 0.4)", () => {
  assert.equal(jaccard(["React", "SQL", "Python"], ["Python", "SQL", "AWS", "Docker"]), 0.4);
});

test("jaccard ignores case and handles empty sets", () => {
  assert.equal(jaccard(["python"], ["Python"]), 1);
  assert.equal(jaccard([], ["Python"]), 0);
  assert.equal(jaccard([], []), 0);
});

test("sameBranch ignores case and spaces, and is 0 when missing", () => {
  assert.equal(sameBranch("CSE", " cse "), 1);
  assert.equal(sameBranch("CSE", "ECE"), 0);
  assert.equal(sameBranch(null, "CSE"), 0);
});

test("buildReasons lists shared skills, goal and branch", () => {
  assert.deepEqual(
    buildReasons({ sharedSkills: ["SQL", "Python"], goalSimilarity: 0.8, branchMatch: 1, branch: "CSE" }),
    ["2 shared skills: SQL, Python", "Similar career goal", "Same branch (CSE)"]
  );
  assert.deepEqual(buildReasons({ sharedSkills: ["SQL"], goalSimilarity: 0, branchMatch: 0, branch: "ECE" }), ["1 shared skill: SQL"]);
});

test("rankMentors puts the best overall match first and respects the limit", () => {
  const student = { branch: "CSE", career_goal: "data engineer", skills: skills("Python", "SQL") };
  const candidates = [
    alumnus("Civil Person", "Civil", "Project Engineer", "Infrastructure", "AutoCAD"),
    alumnus("Data Person", "CSE", "Data Engineer", "IT Services", "Python", "SQL", "PostgreSQL"),
    alumnus("Web Person", "CSE", "Frontend Developer", "Food Tech", "React", "SQL"),
  ];
  const result = rankMentors(student, candidates, 2);
  assert.equal(result.length, 2);
  assert.equal(result[0].alumni.full_name, "Data Person");
  assert.deepEqual(result[0].shared_skills, ["Python", "SQL"]);
  assert.ok(result[0].score > result[1].score);
});

test("every score and breakdown value stays between 0 and 1", () => {
  const student = { branch: "CSE", career_goal: "data engineer", skills: skills("Python") };
  const result = rankMentors(student, [alumnus("A", "CSE", "Data Engineer", "IT", "Python")], 5);
  const { score, breakdown } = result[0];
  for (const value of [score, breakdown.skill_overlap, breakdown.goal_similarity, breakdown.same_branch]) {
    assert.ok(value >= 0 && value <= 1);
  }
});

test("score follows the formula 0.6 skills + 0.3 goal + 0.1 branch", () => {
  const student = { branch: "CSE", career_goal: "", skills: skills("Python", "SQL") };
  const [match] = rankMentors(student, [alumnus("A", "CSE", "Tester", "IT", "Python", "SQL")], 5);
  assert.equal(match.breakdown.skill_overlap, 1);
  assert.equal(match.breakdown.goal_similarity, 0);
  assert.equal(match.score, 0.7);
});

test("alumni with nothing in common are left out", () => {
  const student = { branch: "CSE", career_goal: "data engineer", skills: skills("Python") };
  const result = rankMentors(student, [alumnus("Z", "Civil", "Site Supervisor", "Construction", "AutoCAD")], 5);
  assert.deepEqual(result, []);
});

test("a student with no skills still gets matches from the career goal", () => {
  const student = { branch: "ECE", career_goal: "machine learning engineer", skills: [] };
  const result = rankMentors(student, [alumnus("ML", "CSE", "Machine Learning Engineer", "E-commerce", "Python")], 5);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].reasons, ["Similar career goal"]);
});
