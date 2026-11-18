import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { isUniqueViolation } from "../utils/dbErrors.js";

const JOB_COLUMNS = `
  j.id, j.title, j.company, j.type, j.location, j.description, j.deadline, j.created_at,
  (j.deadline IS NULL OR j.deadline >= CURRENT_DATE) AS is_open,
  json_build_object('id', p.id, 'full_name', p.full_name) AS posted_by`;

const FROM_JOBS = "FROM jobs j JOIN users p ON p.id = j.posted_by";

export async function listJobs({ type, search, location, include_closed, page, limit }) {
  const params = [];
  const conditions = [];
  if (!include_closed) conditions.push("(j.deadline IS NULL OR j.deadline >= CURRENT_DATE)");
  if (type) {
    params.push(type);
    conditions.push(`j.type = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(j.title ILIKE $${params.length} OR j.company ILIKE $${params.length})`);
  }
  if (location) {
    params.push(`%${location}%`);
    conditions.push(`j.location ILIKE $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = (await query(`SELECT count(*)::int AS n FROM jobs j ${where}`, params)).rows[0].n;
  const { rows } = await query(
    `SELECT ${JOB_COLUMNS} ${FROM_JOBS} ${where} ORDER BY j.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit]
  );
  return { items: rows, page, limit, total };
}

async function findJob(id) {
  const { rows } = await query(`SELECT ${JOB_COLUMNS}, j.posted_by AS poster_id ${FROM_JOBS} WHERE j.id = $1`, [id]);
  if (!rows[0]) throw new AppError(404, "NOT_FOUND", "Job not found");
  return rows[0];
}

const publicJob = ({ poster_id, ...job }) => job;

export async function getJob(id, viewer) {
  const job = await findJob(id);
  const applied = await query("SELECT 1 FROM job_applications WHERE job_id = $1 AND student_id = $2", [id, viewer.id]);
  return { job: publicJob(job), has_applied: applied.rows.length > 0 };
}

export async function createJob(poster, data) {
  const { rows } = await query(
    `INSERT INTO jobs (posted_by, title, company, type, location, description, deadline)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [poster.id, data.title, data.company, data.type, data.location, data.description, data.deadline]
  );
  return publicJob(await findJob(rows[0].id));
}

export async function deleteJob(user, id) {
  const job = await findJob(id);
  if (job.poster_id !== user.id && user.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "Only the alumnus who posted this job or an admin can delete it");
  }
  await query("DELETE FROM jobs WHERE id = $1", [id]); // applications are deleted by ON DELETE CASCADE
}

export async function apply(student, jobId, { resume_url }) {
  const job = await findJob(jobId);
  if (!job.is_open) throw new AppError(400, "VALIDATION_ERROR", "The deadline for this job has passed");
  try {
    const { rows } = await query(
      `INSERT INTO job_applications (job_id, student_id, resume_url) VALUES ($1, $2, $3)
       RETURNING id, job_id, student_id, resume_url, status, applied_at`,
      [jobId, student.id, resume_url]
    );
    return rows[0];
  } catch (err) {
    // UNIQUE (job_id, student_id) in the schema stops a second application.
    if (isUniqueViolation(err)) throw new AppError(409, "CONFLICT", "You have already applied to this job");
    throw err;
  }
}

export async function listApplicationsForJob(user, jobId) {
  const job = await findJob(jobId);
  if (job.poster_id !== user.id && user.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "Only the alumnus who posted this job can see its applicants");
  }
  const { rows } = await query(
    `SELECT a.id, a.resume_url, a.status, a.applied_at,
            json_build_object('id', s.id, 'full_name', s.full_name, 'email', s.email) AS student
       FROM job_applications a JOIN users s ON s.id = a.student_id
      WHERE a.job_id = $1 ORDER BY a.applied_at`,
    [jobId]
  );
  return rows;
}

export async function myApplications(student) {
  const { rows } = await query(
    `SELECT a.id, a.resume_url, a.status, a.applied_at,
            json_build_object('id', j.id, 'title', j.title, 'company', j.company, 'type', j.type, 'deadline', j.deadline) AS job
       FROM job_applications a JOIN jobs j ON j.id = a.job_id
      WHERE a.student_id = $1 ORDER BY a.applied_at DESC`,
    [student.id]
  );
  return rows;
}

export async function updateApplicationStatus(user, applicationId, status) {
  const { rows } = await query(
    `SELECT a.id, j.posted_by FROM job_applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = $1`,
    [applicationId]
  );
  // Someone who did not post the job is told the application does not exist.
  if (!rows[0] || rows[0].posted_by !== user.id) throw new AppError(404, "NOT_FOUND", "Application not found");
  const updated = await query(
    `UPDATE job_applications SET status = $1 WHERE id = $2
     RETURNING id, job_id, student_id, resume_url, status, applied_at`,
    [status, applicationId]
  );
  return updated.rows[0];
}
