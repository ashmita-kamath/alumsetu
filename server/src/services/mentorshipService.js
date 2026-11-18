import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { getStudentForMatching } from "./studentService.js";
import { getAlumniById } from "./alumniService.js";
import { rankMentors } from "./matching/scoring.js";

// Columns returned for every request. other_user is the person on the other side (see docs/API.md).
const requestColumns = (otherSide) => `
  mr.id, mr.student_id, mr.alumni_id, mr.message, mr.match_score::float AS match_score,
  mr.status, mr.created_at, mr.responded_at,
  json_build_object('id', o.id, 'full_name', o.full_name) AS other_user
  FROM mentorship_requests mr JOIN users o ON o.id = mr.${otherSide}`;

async function getRequest(id, viewer) {
  const otherSide = viewer.role === "student" ? "alumni_id" : "student_id";
  const { rows } = await query(`SELECT ${requestColumns(otherSide)} WHERE mr.id = $1`, [id]);
  return rows[0];
}

// The match score this student would have with this alumnus, using the same AI scoring as /matches.
async function scoreFor(studentId, alumnus) {
  const student = await getStudentForMatching(studentId);
  if (!student) return null;
  const [match] = rankMentors(student, [alumnus], 1);
  return match ? match.score : 0;
}

export async function createRequest(student, { alumni_id, message }) {
  const alumnus = await getAlumniById(alumni_id);
  if (!alumnus) throw new AppError(404, "NOT_FOUND", "Alumnus not found");
  if (!alumnus.is_verified || !alumnus.available_for_mentoring) {
    throw new AppError(403, "FORBIDDEN", "This alumnus is not available for mentoring right now");
  }

  const open = await query(
    `SELECT 1 FROM mentorship_requests
      WHERE student_id = $1 AND alumni_id = $2 AND status IN ('pending', 'accepted')`,
    [student.id, alumni_id]
  );
  if (open.rows.length) throw new AppError(409, "CONFLICT", "You already have an open request with this alumnus");

  const score = await scoreFor(student.id, alumnus);
  const { rows } = await query(
    `INSERT INTO mentorship_requests (student_id, alumni_id, message, match_score)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [student.id, alumni_id, message, score]
  );
  return getRequest(rows[0].id, student);
}

// Students see the requests they sent; alumni see the requests they received.
export async function listRequests(user, status) {
  const mySide = user.role === "student" ? "student_id" : "alumni_id";
  const otherSide = user.role === "student" ? "alumni_id" : "student_id";
  const params = [user.id];
  let filter = "";
  if (status) {
    params.push(status);
    filter = " AND mr.status = $2";
  }
  const { rows } = await query(
    `SELECT ${requestColumns(otherSide)} WHERE mr.${mySide} = $1${filter} ORDER BY mr.created_at DESC`,
    params
  );
  return rows;
}

// Allowed status changes:
//   pending  -> accepted / declined  (only the alumnus who received it)
//   accepted -> completed            (either the student or the alumnus)
export async function updateStatus(user, id, newStatus) {
  const { rows } = await query("SELECT student_id, alumni_id, status FROM mentorship_requests WHERE id = $1", [id]);
  const current = rows[0];
  const isStudent = current?.student_id === user.id;
  const isAlumnus = current?.alumni_id === user.id;
  // Someone who is not part of the request is told it does not exist.
  if (!current || (!isStudent && !isAlumnus)) throw new AppError(404, "NOT_FOUND", "Mentorship request not found");

  if (newStatus === "accepted" || newStatus === "declined") {
    if (!isAlumnus) throw new AppError(403, "FORBIDDEN", "Only the alumnus can accept or decline a request");
    if (current.status !== "pending") throw new AppError(409, "CONFLICT", `This request is already ${current.status}`);
    await query("UPDATE mentorship_requests SET status = $1, responded_at = now() WHERE id = $2", [newStatus, id]);
  } else {
    if (current.status !== "accepted") throw new AppError(409, "CONFLICT", "Only an accepted mentorship can be marked completed");
    await query("UPDATE mentorship_requests SET status = 'completed' WHERE id = $1", [id]);
  }
  return getRequest(id, user);
}
