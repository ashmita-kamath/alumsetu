// Register and log in. Passwords are never stored or returned, only a bcrypt hash.

import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { isUniqueViolation } from "../utils/dbErrors.js";
import { signToken } from "../utils/jwt.js";

// Cost 10 = 2^10 hashing rounds: about 50–100 ms per hash. Slow on purpose,
// so guessing millions of passwords from a stolen database is impractical.
const SALT_ROUNDS = 10;

// Columns that are safe to send to the client (never password_hash).
const PUBLIC_COLUMNS = "id, email, full_name, role, status, created_at";

// A real hash of a random string. Used when the email does not exist, so a
// wrong email takes as long as a wrong password and attackers cannot tell
// which emails have accounts by timing the response.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password-" + Math.random(), SALT_ROUNDS);

export async function register({ email, password, full_name, role }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    // New accounts are active straight away (docs/API.md). Alumni still start
    // unverified: is_verified lives on alumni_profiles and defaults to false.
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, full_name, role, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING ${PUBLIC_COLUMNS}`,
      [email, passwordHash, full_name, role]
    );
    const user = rows[0];
    return { token: signToken(user), user };
  } catch (err) {
    if (isUniqueViolation(err)) throw new AppError(409, "CONFLICT", "An account with this email already exists");
    throw err;
  }
}

export async function login({ email, password }) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE lower(email) = $1`,
    [email]
  );
  const found = rows[0];

  const passwordOk = await bcrypt.compare(password, found?.password_hash || DUMMY_HASH);
  // Same message for "no such email" and "wrong password", so the login form
  // cannot be used to find out who has an account.
  if (!found || !passwordOk) throw new AppError(401, "UNAUTHORIZED", "Wrong email or password");
  if (found.status === "suspended") throw new AppError(403, "FORBIDDEN", "Your account is suspended");

  const { password_hash, ...user } = found;
  return { token: signToken(user), user };
}
