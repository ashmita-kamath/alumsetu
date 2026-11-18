import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { checkText } from "./moderationService.js";

const AUTHOR = "json_build_object('id', a.id, 'full_name', a.full_name, 'role', a.role) AS author";

// Hidden (flagged) content is only shown to admins.
const visible = (alias, viewer) => (viewer.role === "admin" ? "TRUE" : `${alias}.is_flagged = FALSE`);

function assertAllowed(...texts) {
  const result = checkText(...texts);
  if (!result.allowed) {
    throw new AppError(422, "CONTENT_BLOCKED", result.reason || "This content is not allowed on AlumSetu");
  }
}

export async function listPosts(viewer, { category, search, page, limit }) {
  const params = [];
  const conditions = [visible("p", viewer)];
  if (category) {
    params.push(category);
    conditions.push(`p.category = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.title ILIKE $${params.length} OR p.body ILIKE $${params.length})`);
  }
  const where = conditions.join(" AND ");

  const total = (await query(`SELECT count(*)::int AS n FROM forum_posts p WHERE ${where}`, params)).rows[0].n;
  const { rows } = await query(
    `SELECT p.id, p.title, p.body, p.category, p.is_flagged, p.created_at, ${AUTHOR},
            (SELECT count(*)::int FROM forum_comments c WHERE c.post_id = p.id AND ${visible("c", viewer)}) AS comment_count
       FROM forum_posts p JOIN users a ON a.id = p.author_id
      WHERE ${where}
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit]
  );
  return { items: rows, page, limit, total };
}

async function findPost(id, viewer) {
  const { rows } = await query(
    `SELECT p.id, p.title, p.body, p.category, p.is_flagged, p.created_at, p.author_id, ${AUTHOR}
       FROM forum_posts p JOIN users a ON a.id = p.author_id
      WHERE p.id = $1 AND ${visible("p", viewer)}`,
    [id]
  );
  if (!rows[0]) throw new AppError(404, "NOT_FOUND", "Post not found");
  return rows[0];
}

const withoutAuthorId = ({ author_id, ...post }) => post;

export async function getPost(id, viewer) {
  const post = await findPost(id, viewer);
  const { rows: comments } = await query(
    `SELECT c.id, c.post_id, c.body, c.is_flagged, c.created_at, ${AUTHOR}
       FROM forum_comments c JOIN users a ON a.id = c.author_id
      WHERE c.post_id = $1 AND ${visible("c", viewer)}
      ORDER BY c.created_at ASC`,
    [id]
  );
  return { post: withoutAuthorId(post), comments };
}

export async function createPost(author, { title, body, category }) {
  assertAllowed(title, body);
  const { rows } = await query(
    "INSERT INTO forum_posts (author_id, title, body, category) VALUES ($1, $2, $3, $4) RETURNING id",
    [author.id, title, body, category]
  );
  return withoutAuthorId(await findPost(rows[0].id, author));
}

export async function updatePost(user, id, changes) {
  const post = await findPost(id, user);
  if (post.author_id !== user.id) throw new AppError(403, "FORBIDDEN", "Only the author can edit this post");
  const next = { title: post.title, body: post.body, category: post.category, ...changes };
  assertAllowed(next.title, next.body);
  await query("UPDATE forum_posts SET title = $1, body = $2, category = $3 WHERE id = $4", [
    next.title, next.body, next.category, id,
  ]);
  return withoutAuthorId(await findPost(id, user));
}

export async function deletePost(user, id) {
  const post = await findPost(id, user);
  if (post.author_id !== user.id && user.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "Only the author or an admin can delete this post");
  }
  await query("DELETE FROM forum_posts WHERE id = $1", [id]); // comments are deleted by ON DELETE CASCADE
}

export async function addComment(author, postId, { body }) {
  await findPost(postId, author); // 404 if the post is missing or hidden
  assertAllowed(body);
  const { rows } = await query(
    "INSERT INTO forum_comments (post_id, author_id, body) VALUES ($1, $2, $3) RETURNING id",
    [postId, author.id, body]
  );
  const created = await query(
    `SELECT c.id, c.post_id, c.body, c.is_flagged, c.created_at, ${AUTHOR}
       FROM forum_comments c JOIN users a ON a.id = c.author_id WHERE c.id = $1`,
    [rows[0].id]
  );
  return created.rows[0];
}

export async function deleteComment(user, id) {
  const { rows } = await query(
    `SELECT author_id FROM forum_comments c WHERE c.id = $1 AND ${visible("c", user)}`,
    [id]
  );
  if (!rows[0]) throw new AppError(404, "NOT_FOUND", "Comment not found");
  if (rows[0].author_id !== user.id && user.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "Only the author or an admin can delete this comment");
  }
  await query("DELETE FROM forum_comments WHERE id = $1", [id]);
}
