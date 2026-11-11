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
