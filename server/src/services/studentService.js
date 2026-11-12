import { query } from "../config/db.js";

// Returns the fields of a student needed for mentor matching, or null if the
// user is not an active student or has not created a student profile yet.
export async function getStudentForMatching(userId) {
  const { rows } = await query(
    `SELECT u.id AS user_id,
            sp.branch,
            sp.career_goal,
            COALESCE(
              (SELECT json_agg(json_build_object('id', s.id, 'name', s.name) ORDER BY s.name)
                 FROM user_skills us JOIN skills s ON s.id = us.skill_id
                WHERE us.user_id = u.id),
              '[]'::json
            ) AS skills
       FROM users u
       JOIN student_profiles sp ON sp.user_id = u.id
      WHERE u.id = $1 AND u.role = 'student' AND u.status = 'active'`,
    [userId]
  );
  return rows[0] || null;
}
