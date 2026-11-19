// Creates an admin account, or resets the password of an existing admin.
// Admins cannot sign up through the website (docs/API.md), so this is the only way.
//
// Usage (from server/):
//   ADMIN_EMAIL=admin@alumsetu.in ADMIN_PASSWORD='a-long-password' ADMIN_NAME='AlumSetu Admin' npm run create-admin
//
// The password is read from an environment variable, not a command-line
// argument, so it is not saved in your shell history.

import "dotenv/config";
import bcrypt from "bcryptjs";
import pool, { query } from "../config/db.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || "AlumSetu Admin";

if (!email || !password || password.length < 12) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters).");
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, full_name, role, status)
     VALUES ($1, $2, $3, 'admin', 'active')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name
     WHERE users.role = 'admin'
     RETURNING id`,
    [email, hash, name]
  );
  if (rows.length === 0) {
    console.error(`${email} already belongs to a student or alumni account. Use another email.`);
    process.exitCode = 1;
  } else {
    console.log(`Admin account ready: ${email}`);
  }
} finally {
  await pool.end();
}
