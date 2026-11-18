// Users report harmful posts or comments; an admin reviews each report.
//
//   approved → the report is valid, so the post/comment gets is_flagged = TRUE
//              and the forum hides it from everyone except admins.
//   rejected → nothing is hidden.
//
// Rules:
// – Report exactly one thing: a post_id OR a comment_id.
// – You cannot report your own content (400), or content that is hidden or gone (404).
// – One open (pending) report per person per item (409).

import { query, withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

async function findTarget({ post_id, comment_id }) {
  const sql = post_id
    ? "SELECT author_id FROM forum_posts WHERE id = $1 AND is_flagged = FALSE"
    : "SELECT author_id FROM forum_comments WHERE id = $1 AND is_flagged = FALSE";
  const { rows } = await query(sql, [post_id || comment_id]);
  return rows[0] || null;
}

export async function createReport(reporter, { post_id, comment_id, reason }) {
  const target = await findTarget({ post_id, comment_id });
  if (!target) throw new AppError(404, "NOT_FOUND", post_id ? "Post not found" : "Comment not found");
  if (target.author_id === reporter.id) throw new AppError(400, "VALIDATION_ERROR", "You cannot report your own content");

  const column = post_id ? "post_id" : "comment_id";
  const existing = await query(
    `SELECT 1 FROM content_reports WHERE reporter_id = $1 AND ${column} = $2 AND status = 'pending'`,
    [reporter.id, post_id || comment_id]
  );
  if (existing.rows.length) throw new AppError(409, "CONFLICT", "You have already reported this. An admin will review it");

  const { rows } = await query(
    `INSERT INTO content_reports (reporter_id, post_id, comment_id, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING id, post_id, comment_id, reason, status, created_at`,
    [reporter.id, post_id || null, comment_id || null, reason]
  );
  return rows[0];
}

// Each report with who reported it and the reported text, for the admin queue.
const REPORT_SELECT = `
  SELECT r.id, r.reason, r.status, r.created_at,
         json_build_object('id', rep.id, 'full_name', rep.full_name) AS reporter,
         CASE WHEN r.post_id IS NOT NULL THEN
           json_build_object('type', 'post', 'id', p.id, 'post_id', p.id, 'title', p.title, 'body', p.body,
                             'is_flagged', p.is_flagged,
                             'author', json_build_object('id', pa.id, 'full_name', pa.full_name))
         ELSE
           json_build_object('type', 'comment', 'id', c.id, 'post_id', c.post_id, 'title', NULL, 'body', c.body,
                             'is_flagged', c.is_flagged,
                             'author', json_build_object('id', ca.id, 'full_name', ca.full_name))
         END AS target
    FROM content_reports r
    JOIN users rep ON rep.id = r.reporter_id
    LEFT JOIN forum_posts p ON p.id = r.post_id
    LEFT JOIN users pa ON pa.id = p.author_id
    LEFT JOIN forum_comments c ON c.id = r.comment_id
    LEFT JOIN users ca ON ca.id = c.author_id`;

export async function listReports({ status, page, limit }) {
  const params = [];
  let where = "";
  if (status) {
    params.push(status);
    where = "WHERE r.status = $1";
  }
  const total = (await query(`SELECT count(*)::int AS n FROM content_reports r ${where}`, params)).rows[0].n;
  const { rows } = await query(
    `${REPORT_SELECT} ${where} ORDER BY r.created_at ASC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit]
  );
  return { items: rows, page, limit, total };
}

export async function reviewReport(id, status) {
  await withTransaction(async (client) => {
    // FOR UPDATE locks the row so two admins can't review the same report at once.
    const { rows } = await client.query("SELECT post_id, comment_id, status FROM content_reports WHERE id = $1 FOR UPDATE", [id]);
    const report = rows[0];
    if (!report) throw new AppError(404, "NOT_FOUND", "Report not found");
    if (report.status !== "pending") throw new AppError(409, "CONFLICT", `This report was already ${report.status}`);

    await client.query("UPDATE content_reports SET status = $1 WHERE id = $2", [status, id]);

    if (status === "approved") {
      if (report.post_id) await client.query("UPDATE forum_posts SET is_flagged = TRUE WHERE id = $1", [report.post_id]);
      else await client.query("UPDATE forum_comments SET is_flagged = TRUE WHERE id = $1", [report.comment_id]);
    }
  });
  const { rows } = await query(`${REPORT_SELECT} WHERE r.id = $1`, [id]);
  return rows[0];
}
