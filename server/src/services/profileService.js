import { query, withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { isForeignKeyViolation } from "../utils/dbErrors.js";
import { checkText } from "./moderationService.js";

const SKILLS_SQL = `
  SELECT COALESCE(json_agg(json_build_object('id', s.id, 'name', s.name) ORDER BY s.name), '[]'::json) AS skills
    FROM user_skills us JOIN skills s ON s.id = us.skill_id
   WHERE us.user_id = $1`;

// Returns { user, profile, skills }. profile is null until the user fills it in.
// Contact details (email, and an alumnus's phone) are only included when
// showEmail is true (your own profile, or an admin looking).
export async function getProfile(userId, { showEmail = false } = {}) {
  const userResult = await query(
    "SELECT id, email, full_name, role, status, created_at FROM users WHERE id = $1 AND status <> 'suspended'",
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  if (!showEmail) delete user.email;

  let profile = null;
  if (user.role === "student" || user.role === "alumni") {
    const table = user.role === "student" ? "student_profiles" : "alumni_profiles";
    const { rows } = await query(
      `SELECT p.*, json_build_object('id', i.id, 'name', i.name) AS institution
         FROM ${table} p JOIN institutions i ON i.id = p.institution_id
        WHERE p.user_id = $1`,
      [userId]
    );
    profile = rows[0] || null;
    if (profile && !showEmail) delete profile.phone;
  }

  const skills = (await query(SKILLS_SQL, [userId])).rows[0].skills;
  return { user, profile, skills };
}

async function replaceSkills(client, userId, skillIds) {
  const uniqueIds = [...new Set(skillIds)];
  if (uniqueIds.length > 0) {
    const found = await client.query("SELECT count(*)::int AS n FROM skills WHERE id = ANY($1::int[])", [uniqueIds]);
    if (found.rows[0].n !== uniqueIds.length) {
      throw new AppError(400, "VALIDATION_ERROR", "One or more skills do not exist", [
        { field: "skill_ids", message: "Unknown skill id" },
      ]);
    }
  }
  await client.query("DELETE FROM user_skills WHERE user_id = $1", [userId]);
  if (uniqueIds.length > 0) {
    await client.query(
      "INSERT INTO user_skills (user_id, skill_id) SELECT $1, unnest($2::int[])",
      [userId, uniqueIds]
    );
  }
}

// The problem statement asks to filter harmful content in user profiles too,
// so every free-text field goes through the same filter as forum posts.
const TEXT_FIELDS = ["full_name", "branch", "career_goal", "bio", "current_company", "job_title", "industry", "location", "achievements"];

function assertProfileAllowed(data) {
  const result = checkText(...TEXT_FIELDS.map((f) => data[f]));
  if (!result.allowed) {
    throw new AppError(422, "CONTENT_BLOCKED", "Your profile contains language that isn't allowed on AlumSetu. Please edit it and try again.");
  }
}

// Creates or updates the logged-in user's profile (an "upsert"), all in one transaction.
export async function saveMyProfile(user, data) {
  assertProfileAllowed(data);
  try {
    await withTransaction(async (client) => {
      if (data.full_name) {
        await client.query("UPDATE users SET full_name = $1 WHERE id = $2", [data.full_name, user.id]);
      }

      if (user.role === "student") {
        await client.query(
          `INSERT INTO student_profiles
             (user_id, institution_id, branch, enrollment_year, expected_grad_year, career_goal, bio)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (user_id) DO UPDATE SET
             institution_id = EXCLUDED.institution_id, branch = EXCLUDED.branch,
             enrollment_year = EXCLUDED.enrollment_year, expected_grad_year = EXCLUDED.expected_grad_year,
             career_goal = EXCLUDED.career_goal, bio = EXCLUDED.bio`,
          [user.id, data.institution_id, data.branch, data.enrollment_year, data.expected_grad_year,
            data.career_goal, data.bio]
        );
      } else {
        // is_verified is never set here: only an admin can verify an alumnus.
        await client.query(
          `INSERT INTO alumni_profiles
             (user_id, institution_id, branch, graduation_year, current_company, job_title,
              industry, location, linkedin_url, available_for_mentoring,
              employment_status, bio, achievements, phone)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (user_id) DO UPDATE SET
             institution_id = EXCLUDED.institution_id, branch = EXCLUDED.branch,
             graduation_year = EXCLUDED.graduation_year, current_company = EXCLUDED.current_company,
             job_title = EXCLUDED.job_title, industry = EXCLUDED.industry, location = EXCLUDED.location,
             linkedin_url = EXCLUDED.linkedin_url, available_for_mentoring = EXCLUDED.available_for_mentoring,
             employment_status = EXCLUDED.employment_status, bio = EXCLUDED.bio,
             achievements = EXCLUDED.achievements, phone = EXCLUDED.phone`,
          [user.id, data.institution_id, data.branch, data.graduation_year, data.current_company,
            data.job_title, data.industry, data.location, data.linkedin_url, data.available_for_mentoring,
            data.employment_status, data.bio, data.achievements, data.phone]
        );
      }

      if (data.skill_ids) await replaceSkills(client, user.id, data.skill_ids);
    });
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      throw new AppError(400, "VALIDATION_ERROR", "That college does not exist", [
        { field: "institution_id", message: "Unknown college" },
      ]);
    }
    throw err;
  }
  return getProfile(user.id, { showEmail: true });
}
