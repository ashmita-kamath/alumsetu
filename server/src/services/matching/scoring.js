// Mentor match scoring (formula from our Stage 1 design, docs/API.md):
//
//   score = 0.6 × skill_overlap + 0.3 × goal_similarity + 0.1 × same_branch
//
// skill_overlap   : Jaccard similarity of the two skill sets (0 to 1)
// goal_similarity : TF-IDF cosine similarity of the student's career goal
//                   and the alumnus's job title + industry (0 to 1)
// same_branch     : 1 if both studied the same branch, else 0

import { tfidfVectors, cosineSimilarity } from "./textSimilarity.js";

export const WEIGHTS = { skills: 0.6, goal: 0.3, branch: 0.1 };

// A goal similarity at or above this is mentioned as a reason.
const GOAL_REASON_THRESHOLD = 0.2;

const round3 = (n) => Math.round(n * 1000) / 1000;

// Jaccard similarity = |A ∩ B| / |A ∪ B|. Works on arrays of skill names.
export function jaccard(skillsA, skillsB) {
  const a = new Set(skillsA.map((s) => s.toLowerCase()));
  const b = new Set(skillsB.map((s) => s.toLowerCase()));
  if (a.size === 0 && b.size === 0) return 0;
  let shared = 0;
  for (const skill of a) if (b.has(skill)) shared++;
  return shared / (a.size + b.size - shared);
}

export function sameBranch(branchA, branchB) {
  if (!branchA || !branchB) return 0;
  return branchA.trim().toLowerCase() === branchB.trim().toLowerCase() ? 1 : 0;
}

// The text that describes what an alumnus does, used for goal similarity.
export function alumniCareerText(alumnus) {
  return [alumnus.job_title, alumnus.industry].filter(Boolean).join(" ");
}

// Builds the human-readable reasons shown on each recommendation card.
export function buildReasons({ sharedSkills, goalSimilarity, branchMatch, branch }) {
  const reasons = [];
  if (sharedSkills.length > 0) {
    const noun = sharedSkills.length === 1 ? "shared skill" : "shared skills";
    reasons.push(`${sharedSkills.length} ${noun}: ${sharedSkills.join(", ")}`);
  }
  if (goalSimilarity >= GOAL_REASON_THRESHOLD) reasons.push("Similar career goal");
  if (branchMatch) reasons.push(`Same branch (${branch})`);
  return reasons;
}

// Scores every candidate for one student and returns them best first.
// student:    { branch, career_goal, skills: [{ name }] }
// candidates: AlumniCard objects (see docs/API.md)
export function rankMentors(student, candidates, limit = 5) {
  const studentSkills = student.skills.map((s) => s.name);

  // Goal similarity: IDF is computed over the student's goal plus every candidate's career text,
  // so words common to many alumni (e.g. "engineer") count less than distinctive ones.
  const vectors = tfidfVectors([student.career_goal || "", ...candidates.map(alumniCareerText)]);
  const studentVector = vectors[0];

  const scored = candidates.map((alumnus, index) => {
    const alumniSkills = alumnus.skills.map((s) => s.name);
    const skillOverlap = jaccard(studentSkills, alumniSkills);
    const goalSimilarity = cosineSimilarity(studentVector, vectors[index + 1]);
    const branchMatch = sameBranch(student.branch, alumnus.branch);

    const studentSkillSet = new Set(studentSkills.map((s) => s.toLowerCase()));
    const sharedSkills = alumniSkills.filter((s) => studentSkillSet.has(s.toLowerCase()));

    const score =
      WEIGHTS.skills * skillOverlap + WEIGHTS.goal * goalSimilarity + WEIGHTS.branch * branchMatch;

    return {
      alumni: alumnus,
      score: round3(score),
      breakdown: {
        skill_overlap: round3(skillOverlap),
        goal_similarity: round3(goalSimilarity),
        same_branch: branchMatch,
      },
      shared_skills: sharedSkills,
      reasons: buildReasons({ sharedSkills, goalSimilarity, branchMatch, branch: alumnus.branch }),
    };
  });

  return scored
    // Keep only matches we can explain: at least one reason to show the student.
    .filter((match) => match.score > 0 && match.reasons.length > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.breakdown.skill_overlap - a.breakdown.skill_overlap ||
        a.alumni.full_name.localeCompare(b.alumni.full_name)
    )
    .slice(0, limit);
}
