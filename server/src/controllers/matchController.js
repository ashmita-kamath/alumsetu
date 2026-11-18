import { getMentorMatches } from "../services/matchingService.js";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

// GET /api/matches?limit=5 (students only; the route checks the role)
export async function getMatches(req, res) {
  const requested = Number.parseInt(req.query.limit, 10);
  const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, MAX_LIMIT) : DEFAULT_LIMIT;
  res.json(await getMentorMatches(req.user.id, limit));
}
