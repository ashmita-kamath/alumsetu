import { listMentorCandidates } from "./alumniService.js";
import { getStudentForMatching } from "./studentService.js";
import { rankMentors } from "./matching/scoring.js";

// Returns the top mentor suggestions for one student (see GET /api/matches in docs/API.md).
// An empty list means there is nothing to match on yet (no profile, no skills and no goal).
export async function getMentorMatches(studentId, limit) {
  const student = await getStudentForMatching(studentId);
  if (!student) return [];

  const hasSomethingToMatch = student.skills.length > 0 || (student.career_goal || "").trim() !== "";
  if (!hasSomethingToMatch) return [];

  const candidates = await listMentorCandidates();
  return rankMentors(student, candidates, limit);
}
