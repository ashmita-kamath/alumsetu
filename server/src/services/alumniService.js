import { query } from "../config/db.js";

// Columns that make up an AlumniCard (see docs/API.md, "Shared objects").
const CARD_COLUMNS = `
  u.id AS user_id,
  u.full_name,
  json_build_object('id', i.id, 'name', i.name) AS institution,
  ap.branch,
  ap.graduation_year,
  ap.current_company,
  ap.job_title,
  ap.industry,
  ap.location,
  ap.is_verified,
  ap.available_for_mentoring,
  COALESCE(
    (SELECT json_agg(json_build_object('id', s.id, 'name', s.name) ORDER BY s.name)
       FROM user_skills us JOIN skills s ON s.id = us.skill_id
      WHERE us.user_id = u.id),
    '[]'::json
  ) AS skills`;

const FROM_ALUMNI = `
  FROM users u
  JOIN alumni_profiles ap ON ap.user_id = u.id
  JOIN institutions i ON i.id = ap.institution_id
  WHERE u.role = 'alumni' AND u.status = 'active'`;

const SORTS = {
  name: "u.full_name ASC",
  graduation_year: "ap.graduation_year DESC, u.full_name ASC",
};

// Builds the WHERE conditions for the directory filters.
// Every value is passed as a $n parameter, never pasted into the SQL text.
function buildFilters(filters) {
  const conditions = [];
  const params = [];
  // Adds a value to params and replaces every "?" in the condition with its $n placeholder.
  const add = (sql, value) => {
    params.push(value);
    conditions.push(sql.replaceAll("?", `$${params.length}`));
  };

  if (filters.search) add("(u.full_name ILIKE ? OR ap.current_company ILIKE ? OR ap.job_title ILIKE ?)", `%${filters.search}%`);
  if (filters.institutionId) add("ap.institution_id = ?", filters.institutionId);
  if (filters.branch) add("ap.branch ILIKE ?", filters.branch);
  if (filters.graduationYear) add("ap.graduation_year = ?", filters.graduationYear);
  if (filters.company) add("ap.current_company ILIKE ?", `%${filters.company}%`);
  if (filters.skillId) add("EXISTS (SELECT 1 FROM user_skills us WHERE us.user_id = u.id AND us.skill_id = ?)", filters.skillId);
  if (filters.verified) conditions.push("ap.is_verified = TRUE");
  if (filters.mentoring) conditions.push("ap.available_for_mentoring = TRUE");

  return { where: conditions.length ? ` AND ${conditions.join(" AND ")}` : "", params };
}

export async function searchAlumni(filters, { limit, offset }) {
  const { where, params } = buildFilters(filters);
  const orderBy = SORTS[filters.sort] || SORTS.name;

  const countResult = await query(`SELECT count(*)::int AS total ${FROM_ALUMNI}${where}`, params);

  const pageParams = [...params, limit, offset];
  const { rows } = await query(
    `SELECT ${CARD_COLUMNS} ${FROM_ALUMNI}${where}
     ORDER BY ${orderBy}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    pageParams
  );

  return { items: rows, total: countResult.rows[0].total };
}

export async function getAlumniById(userId) {
  const { rows } = await query(
    `SELECT ${CARD_COLUMNS}, ap.linkedin_url ${FROM_ALUMNI} AND u.id = $1`,
    [userId]
  );
  return rows[0] || null;
}
