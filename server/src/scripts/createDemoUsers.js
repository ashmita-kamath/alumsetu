// Creates (or resets) the three demo accounts used in the project demo:
// a student, a verified alumnus who mentors, and an admin. All share one password.
//
// Usage (from server/), pointing DATABASE_URL at the production database:
//   DEMO_PASSWORD='a-long-password' npm run create-demo-users
//
// Optional: DEMO_STUDENT_EMAIL, DEMO_ALUMNI_EMAIL, DEMO_ADMIN_EMAIL.
// Safe to run more than once: it updates the same accounts instead of adding new ones.

import "dotenv/config";
import bcrypt from "bcryptjs";
import pool, { withTransaction } from "../config/db.js";

const password = process.env.DEMO_PASSWORD;
const accounts = {
  student: (process.env.DEMO_STUDENT_EMAIL || "demo.student@alumsetu.in").trim().toLowerCase(),
  alumni: (process.env.DEMO_ALUMNI_EMAIL || "demo.alumni@alumsetu.in").trim().toLowerCase(),
  admin: (process.env.DEMO_ADMIN_EMAIL || "demo.admin@alumsetu.in").trim().toLowerCase(),
};

if (!password || password.length < 12) {
  console.error("Set DEMO_PASSWORD (at least 12 characters).");
  process.exit(1);
}

async function upsertUser(client, email, fullName, role, hash) {
  const { rows } = await client.query(
    `INSERT INTO users (email, password_hash, full_name, role, status)
     VALUES ($1, $2, $3, $4, 'active')
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, status = 'active'
       WHERE users.role = EXCLUDED.role
     RETURNING id`,
    [email, hash, fullName, role]
  );
  if (!rows[0]) throw new Error(`${email} already exists with a different role. Pick another email.`);
  return rows[0].id;
}

async function setSkills(client, userId, names) {
  await client.query("DELETE FROM user_skills WHERE user_id = $1", [userId]);
  await client.query(
    `INSERT INTO user_skills (user_id, skill_id) SELECT $1, id FROM skills WHERE name = ANY($2::text[])`,
    [userId, names]
  );
}

try {
  const hash = await bcrypt.hash(password, 10);
  await withTransaction(async (client) => {
    const inst = (await client.query("SELECT id FROM institutions ORDER BY id LIMIT 1")).rows[0];
    if (!inst) throw new Error("No colleges found. Run database/seed.sql first.");

    const studentId = await upsertUser(client, accounts.student, "Demo Student", "student", hash);
    await client.query(
      `INSERT INTO student_profiles (user_id, institution_id, branch, enrollment_year, expected_grad_year, career_goal, bio)
       VALUES ($1, $2, 'CSE', 2024, 2028, 'data engineer working with Python and SQL', 'Demo student account for AlumSetu.')
       ON CONFLICT (user_id) DO UPDATE SET institution_id = EXCLUDED.institution_id, branch = EXCLUDED.branch,
         enrollment_year = EXCLUDED.enrollment_year, expected_grad_year = EXCLUDED.expected_grad_year,
         career_goal = EXCLUDED.career_goal, bio = EXCLUDED.bio`,
      [studentId, inst.id]
    );
    await setSkills(client, studentId, ["Python", "SQL", "Data Analysis", "Git"]);

    const alumniId = await upsertUser(client, accounts.alumni, "Demo Alumnus", "alumni", hash);
    await client.query(
      `INSERT INTO alumni_profiles (user_id, institution_id, branch, graduation_year, current_company, job_title,
         industry, location, is_verified, available_for_mentoring)
       VALUES ($1, $2, 'CSE', 2020, 'Infosys', 'Data Engineer', 'IT Services', 'Jaipur', TRUE, TRUE)
       ON CONFLICT (user_id) DO UPDATE SET institution_id = EXCLUDED.institution_id, branch = EXCLUDED.branch,
         graduation_year = EXCLUDED.graduation_year, current_company = EXCLUDED.current_company,
         job_title = EXCLUDED.job_title, industry = EXCLUDED.industry, location = EXCLUDED.location,
         is_verified = TRUE, available_for_mentoring = TRUE`,
      [alumniId, inst.id]
    );
    await setSkills(client, alumniId, ["Python", "SQL", "PostgreSQL", "Data Analysis", "Cloud Computing"]);

    await upsertUser(client, accounts.admin, "Demo Admin", "admin", hash);
  });
  console.log("Demo accounts ready (all use DEMO_PASSWORD):");
  console.log(`  student: ${accounts.student}`);
  console.log(`  alumni (verified mentor): ${accounts.alumni}`);
  console.log(`  admin: ${accounts.admin}`);
} catch (err) {
  console.error(`Could not create demo accounts: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
