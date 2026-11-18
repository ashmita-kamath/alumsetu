// Creates throwaway users for integration tests and removes them afterwards.
// All test accounts use @test.alumsetu.dev emails, because we share one database.
import { randomUUID } from "node:crypto";
import pool, { query } from "../../src/config/db.js";

const created = [];

export async function institutionId() {
  const { rows } = await query("SELECT id FROM institutions ORDER BY id LIMIT 1");
  return rows[0].id;
}

export async function skillIds(...names) {
  const { rows } = await query("SELECT id, name FROM skills WHERE name = ANY($1::text[])", [names]);
  return names.map((n) => rows.find((r) => r.name === n).id);
}

// role: "student" | "alumni" | "admin". For alumni, a profile is created unless profile: false.
export async function createUser({ role = "student", name, status = "active", verified = true, mentoring = true, profile = true, skills = [], careerGoal = null, branch = "CSE" } = {}) {
  const email = `${role}-${randomUUID().slice(0, 8)}@test.alumsetu.dev`;
  const { rows } = await query(
    "INSERT INTO users (email, password_hash, full_name, role, status) VALUES ($1, '!test', $2, $3, $4) RETURNING id, email, full_name, role",
    [email, name || `Test ${role}`, role, status]
  );
  const user = rows[0];
  created.push(user.id);
  const inst = await institutionId();

  if (profile && role === "alumni") {
    await query(
      `INSERT INTO alumni_profiles (user_id, institution_id, branch, graduation_year, job_title, industry, is_verified, available_for_mentoring)
       VALUES ($1, $2, $3, 2020, 'Data Engineer', 'IT Services', $4, $5)`,
      [user.id, inst, branch, verified, mentoring]
    );
  }
  if (profile && role === "student") {
    await query(
      `INSERT INTO student_profiles (user_id, institution_id, branch, enrollment_year, expected_grad_year, career_goal)
       VALUES ($1, $2, $3, 2024, 2028, $4)`,
      [user.id, inst, branch, careerGoal]
    );
  }
  if (skills.length) {
    const ids = await skillIds(...skills);
    await query("INSERT INTO user_skills (user_id, skill_id) SELECT $1, unnest($2::int[])", [user.id, ids]);
  }
  return user;
}

// Header that makes a request act as this user (development and tests only).
export const as = (user) => ({ "X-Dev-User-Id": user.id });

// Deletes everything the test users created, then the users themselves.
export async function cleanup() {
  if (created.length) {
    await query("DELETE FROM events WHERE organizer_id = ANY($1::uuid[])", [created]);
    await query("DELETE FROM users WHERE id = ANY($1::uuid[])", [created]);
  }
  await pool.end();
}
