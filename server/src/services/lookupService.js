import { query } from "../config/db.js";

export async function listInstitutions() {
  const { rows } = await query("SELECT id, name, city, district FROM institutions ORDER BY name");
  return rows;
}

export async function listSkills(search) {
  if (search) {
    const { rows } = await query(
      "SELECT id, name FROM skills WHERE name ILIKE $1 ORDER BY name LIMIT 20",
      [`%${search}%`]
    );
    return rows;
  }
  const { rows } = await query("SELECT id, name FROM skills ORDER BY name");
  return rows;
}

export async function createInstitution({ name, city, district }) {
  const { rows } = await query(
    "INSERT INTO institutions (name, city, district) VALUES ($1, $2, $3) RETURNING id, name, city, district",
    [name, city, district]
  );
  return rows[0];
}

// Returns the skill with this name, creating it first if it does not exist yet.
// Names are matched without caring about upper/lower case, so "python" finds "Python".
export async function findOrCreateSkill(name) {
  const existing = await query("SELECT id, name FROM skills WHERE lower(name) = lower($1)", [name]);
  if (existing.rows[0]) return { skill: existing.rows[0], created: false };
  const { rows } = await query(
    "INSERT INTO skills (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name",
    [name]
  );
  return { skill: rows[0], created: true };
}
