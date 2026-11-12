import { getMentorMatches } from "../services/matchingService.js";
import { sendError } from "../utils/http.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

// GET /api/matches?limit=5
export async function getMatches(req, res) {
  // req.user is set by requireAuth once feat/auth-jwt is merged.
  // Until then, ?student_id= is accepted for local development only, never in production.
  const devStudentId = process.env.NODE_ENV !== "production" ? req.query.student_id : undefined;
  const studentId = req.user?.id || devStudentId;

  if (!studentId) {
    return sendError(res, 401, "UNAUTHORIZED", "Log in as a student to see mentor suggestions");
  }
  if (!UUID_PATTERN.test(studentId)) {
    return sendError(res, 400, "VALIDATION_ERROR", "student_id must be a valid UUID");
  }

  const requested = Number.parseInt(req.query.limit, 10);
  const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, MAX_LIMIT) : DEFAULT_LIMIT;

  res.json(await getMentorMatches(studentId, limit));
}
