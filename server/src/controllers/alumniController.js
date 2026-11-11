import * as alumniService from "../services/alumniService.js";
import { getPagination, sendError } from "../utils/http.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toPositiveInt = (value) => {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};
const toText = (value) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

// GET /api/alumni
export async function listAlumni(req, res) {
  const q = req.query;
  const filters = {
    search: toText(q.search),
    institutionId: toPositiveInt(q.institution_id),
    branch: toText(q.branch),
    graduationYear: toPositiveInt(q.graduation_year),
    company: toText(q.company),
    skillId: toPositiveInt(q.skill_id),
    verified: q.verified === "true",
    mentoring: q.mentoring === "true",
    sort: q.sort,
  };
  const pagination = getPagination(q);

  const { items, total } = await alumniService.searchAlumni(filters, pagination);
  res.json({ items, page: pagination.page, limit: pagination.limit, total });
}

// GET /api/alumni/:userId
export async function getAlumnus(req, res) {
  const { userId } = req.params;
  if (!UUID_PATTERN.test(userId)) {
    return sendError(res, 400, "VALIDATION_ERROR", "userId must be a valid UUID");
  }
  const alumnus = await alumniService.getAlumniById(userId);
  if (!alumnus) {
    return sendError(res, 404, "NOT_FOUND", "Alumnus not found");
  }
  res.json(alumnus);
}
