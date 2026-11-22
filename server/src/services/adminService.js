// Admin-only data: dashboard numbers, the alumni verification queue and user management.
// Every function here is reached only through routes guarded by requireRole("admin").

import { query, withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { signedUrl } from "./uploadService.js";

// ---------- Stats ----------

// One query with sub-selects, so the dashboard needs a single round trip.
export async function getStats() {
  const { rows } = await query(`
    SELECT
      (SELECT count(*)::int FROM users WHERE role = 'student')                    AS students,
      (SELECT count(*)::int FROM users WHERE role = 'alumni')                     AS alumni,
      (SELECT count(*)::int FROM alumni_profiles WHERE is_verified)               AS verified_alumni,
      (SELECT count(*)::int FROM verification_requests WHERE status = 'pending')  AS pending_verifications,
      (SELECT count(*)::int FROM content_reports WHERE status = 'pending')        AS pending_reports,
      (SELECT count(*)::int FROM mentorship_requests)                             AS mentorships,
      (SELECT count(*)::int FROM events)                                          AS events,
      (SELECT count(*)::int FROM jobs)                                            AS jobs`);
  return rows[0];
}

// ---------- Verification queue ----------

// Verification documents are private on Cloudinary. The admin gets a link that
// works for 10 minutes. If uploads aren't configured, the link is null.
function documentLink(storedUrl) {
  try {
    return signedUrl(storedUrl);
  } catch {
    return null;
  }
}

const VERIFICATION_SELECT = `
  SELECT v.id, v.status, v.remarks, v.submitted_at, v.reviewed_at, v.document_url,
         json_build_object('id', u.id, 'full_name', u.full_name, 'email', u.email) AS alumnus,
         json_build_object(
           'institution', i.name, 'branch', ap.branch, 'graduation_year', ap.graduation_year,
           'current_company', ap.current_company, 'job_title', ap.job_title
         ) AS profile,
         rv.full_name AS reviewed_by_name
    FROM verification_requests v
    JOIN users u ON u.id = v.user_id
    LEFT JOIN alumni_profiles ap ON ap.user_id = u.id
    LEFT JOIN institutions i ON i.id = ap.institution_id
    LEFT JOIN users rv ON rv.id = v.reviewed_by`;

// Swap the stored (private) URL for a short-lived signed link before sending it out.
const withLink = ({ document_url, ...row }) => ({ ...row, document_link: documentLink(document_url) });

export async function listVerifications({ status, page, limit }) {
  const params = [];
  let where = "";
  if (status) {
    params.push(status);
    where = "WHERE v.status = $1";
  }
  const total = (await query(`SELECT count(*)::int AS n FROM verification_requests v ${where}`, params)).rows[0].n;
  // Oldest first, so requests are reviewed in the order they arrived.
  const { rows } = await query(
    `${VERIFICATION_SELECT} ${where} ORDER BY v.submitted_at ASC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit]
  );
  return { items: rows.map(withLink), page, limit, total };
}

// approved → the alumnus becomes verified (badge, mentor matches, can post jobs/events).
// rejected → nothing changes; the alumnus may submit a new document.
export async function reviewVerification(admin, id, { status, remarks }) {
  await withTransaction(async (client) => {
    // FOR UPDATE locks the row so two admins can't review it at the same time.
    const { rows } = await client.query("SELECT user_id, status FROM verification_requests WHERE id = $1 FOR UPDATE", [id]);
    const request = rows[0];
    if (!request) throw new AppError(404, "NOT_FOUND", "Verification request not found");
    if (request.status !== "pending") throw new AppError(409, "CONFLICT", `This request was already ${request.status}`);

    await client.query(
      "UPDATE verification_requests SET status = $1, remarks = $2, reviewed_by = $3, reviewed_at = now() WHERE id = $4",
      [status, remarks, admin.id, id]
    );
    if (status === "approved") {
      await client.query("UPDATE alumni_profiles SET is_verified = TRUE WHERE user_id = $1", [request.user_id]);
    }
  });
  const { rows } = await query(`${VERIFICATION_SELECT} WHERE v.id = $1`, [id]);
  return withLink(rows[0]);
}

// ---------- Users ----------

export async function listUsers({ role, status, search, page, limit }) {
  const params = [];
  const conditions = [];
  const add = (sql, value) => {
    params.push(value);
    conditions.push(sql.replaceAll("?", `$${params.length}`));
  };
  if (role) add("u.role = ?", role);
  if (status) add("u.status = ?", status);
  if (search) add("(u.full_name ILIKE ? OR u.email ILIKE ?)", `%${search}%`);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = (await query(`SELECT count(*)::int AS n FROM users u ${where}`, params)).rows[0].n;
  const { rows } = await query(
    `SELECT u.id, u.email, u.full_name, u.role, u.status, u.created_at, ap.is_verified
       FROM users u LEFT JOIN alumni_profiles ap ON ap.user_id = u.id
       ${where}
      ORDER BY u.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit]
  );
  return { items: rows, page, limit, total };
}

// Suspend or re-activate an account. A suspended user can't log in, and any
// token they already have stops working (requireAuth checks status every request).
export async function setUserStatus(admin, userId, status) {
  if (userId === admin.id) throw new AppError(400, "VALIDATION_ERROR", "You cannot change your own account status");
  const { rows } = await query("SELECT role FROM users WHERE id = $1", [userId]);
  if (!rows[0]) throw new AppError(404, "NOT_FOUND", "User not found");
  // Stops one admin locking another out; admins are managed with create-admin.
  if (rows[0].role === "admin") throw new AppError(403, "FORBIDDEN", "Admin accounts cannot be suspended here");

  const updated = await query(
    "UPDATE users SET status = $1 WHERE id = $2 RETURNING id, email, full_name, role, status, created_at",
    [status, userId]
  );
  return updated.rows[0];
}

// ---------- Alumni database ----------
// The problem statement's "centralized system for tracking alumni": every
// alumnus with contact details, education, employment and expertise, for the
// department to search and download. Admin-only, so email and phone are included.

const ALUMNI_COLUMNS = `
  u.id AS user_id, u.full_name, u.email, ap.phone, u.status, u.created_at,
  i.name AS institution, i.city, i.district,
  ap.branch, ap.graduation_year, ap.employment_status, ap.current_company, ap.job_title,
  ap.industry, ap.location, ap.linkedin_url, ap.achievements, ap.is_verified, ap.available_for_mentoring,
  COALESCE((SELECT string_agg(s.name, ', ' ORDER BY s.name)
              FROM user_skills us JOIN skills s ON s.id = us.skill_id
             WHERE us.user_id = u.id), '') AS skills`;

const ALUMNI_FROM = `
  FROM users u
  JOIN alumni_profiles ap ON ap.user_id = u.id
  JOIN institutions i ON i.id = ap.institution_id`;

function alumniFilters({ search, institution_id, branch, graduation_year, employment_status, verified }) {
  const params = [];
  const conditions = ["u.role = 'alumni'"];
  const add = (sql, value) => {
    params.push(value);
    conditions.push(sql.replaceAll("?", `$${params.length}`));
  };
  if (search) add("(u.full_name ILIKE ? OR u.email ILIKE ? OR ap.current_company ILIKE ?)", `%${search}%`);
  if (institution_id) add("ap.institution_id = ?", institution_id);
  if (branch) add("ap.branch ILIKE ?", branch);
  if (graduation_year) add("ap.graduation_year = ?", graduation_year);
  if (employment_status === "unknown") conditions.push("ap.employment_status IS NULL");
  else if (employment_status) add("ap.employment_status = ?", employment_status);
  if (verified === "yes") conditions.push("ap.is_verified");
  if (verified === "no") conditions.push("NOT ap.is_verified");
  return { where: `WHERE ${conditions.join(" AND ")}`, params };
}

// Paginated list, plus a count per employment status for the same filters
// (ignoring the employment filter itself) so the page can show a breakdown.
export async function listAlumni(filters) {
  const { page, limit } = filters;
  const { where, params } = alumniFilters(filters);
  const total = (await query(`SELECT count(*)::int AS n ${ALUMNI_FROM} ${where}`, params)).rows[0].n;
  const { rows } = await query(
    `SELECT ${ALUMNI_COLUMNS} ${ALUMNI_FROM} ${where}
      ORDER BY u.full_name
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit]
  );

  const breakdown = alumniFilters({ ...filters, employment_status: undefined });
  const counts = await query(
    `SELECT COALESCE(ap.employment_status::text, 'unknown') AS status, count(*)::int AS n
       ${ALUMNI_FROM} ${breakdown.where}
      GROUP BY 1`,
    breakdown.params
  );
  const by_employment = Object.fromEntries(counts.rows.map((r) => [r.status, r.n]));

  return { items: rows, page, limit, total, by_employment };
}

export const EXPORT_LIMIT = 10000;

const CSV_COLUMNS = [
  ["full_name", "Name"], ["email", "Email"], ["phone", "Phone"], ["institution", "College"],
  ["city", "City"], ["district", "District"], ["branch", "Branch"], ["graduation_year", "Graduation year"],
  ["employment_status", "Employment status"], ["current_company", "Company"], ["job_title", "Job title"],
  ["industry", "Industry"], ["location", "Location"], ["skills", "Skills"], ["achievements", "Achievements"],
  ["linkedin_url", "LinkedIn"], ["is_verified", "Verified"], ["available_for_mentoring", "Mentoring"],
  ["status", "Account status"], ["created_at", "Joined"],
];

// Quotes every cell, and stops spreadsheet formulas: a cell starting with
// = + - @ would otherwise run as a formula when the file is opened in Excel.
export function csvCell(value) {
  if (value === null || value === undefined) return '""';
  let text;
  if (value instanceof Date) text = value.toISOString().slice(0, 10);
  else if (typeof value === "boolean") text = value ? "Yes" : "No";
  else text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

// Every alumnus matching the filters (up to EXPORT_LIMIT) as CSV text.
export async function exportAlumniCsv(filters) {
  const { where, params } = alumniFilters(filters);
  const { rows } = await query(
    `SELECT ${ALUMNI_COLUMNS} ${ALUMNI_FROM} ${where} ORDER BY u.full_name LIMIT ${EXPORT_LIMIT}`,
    params
  );
  const lines = [CSV_COLUMNS.map(([, label]) => csvCell(label)).join(",")];
  for (const row of rows) lines.push(CSV_COLUMNS.map(([key]) => csvCell(row[key])).join(","));
  // The BOM makes Excel open the file as UTF-8
  return "﻿" + lines.join("\r\n") + "\r\n";
}
