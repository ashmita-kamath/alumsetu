// Alumni verification: an alumnus uploads proof (degree, alumni ID), an admin
// approves it, and only then does the alumnus appear in mentor matches and get
// the verified badge. This stops fake alumni profiles.
//
// Rules:
// – Only one pending request at a time (409 otherwise).
// – An already verified alumnus cannot submit again (409).
// – After a rejection, the alumnus may submit a new document.
// – The document must be a file we stored on Cloudinary, not any link.

import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

const COLUMNS = "id, user_id, document_url, status, remarks, submitted_at, reviewed_at";

export async function getLatest(userId) {
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM verification_requests WHERE user_id = $1 ORDER BY submitted_at DESC, id DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function submit(user, documentUrl) {
  const profile = await query("SELECT is_verified FROM alumni_profiles WHERE user_id = $1", [user.id]);
  if (!profile.rows[0]) {
    // The admin needs the college, branch and year to check the document against.
    throw new AppError(400, "VALIDATION_ERROR", "Complete your profile before asking for verification");
  }
  if (profile.rows[0].is_verified) throw new AppError(409, "CONFLICT", "Your account is already verified");

  const latest = await getLatest(user.id);
  if (latest?.status === "pending") {
    throw new AppError(409, "CONFLICT", "You already have a verification request waiting for review");
  }

  const { rows } = await query(
    `INSERT INTO verification_requests (user_id, document_url) VALUES ($1, $2) RETURNING ${COLUMNS}`,
    [user.id, documentUrl]
  );
  return rows[0];
}
