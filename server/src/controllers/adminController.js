import * as adminService from "../services/adminService.js";

// GET /api/admin/stats
export async function getStats(req, res) {
  res.json(await adminService.getStats());
}

// GET /api/admin/verifications?status=pending
export async function listVerifications(req, res) {
  res.json(await adminService.listVerifications(req.query));
}

// PATCH /api/admin/verifications/:id  { status, remarks? }
export async function reviewVerification(req, res) {
  res.json({ request: await adminService.reviewVerification(req.user, req.params.id, req.body) });
}

// GET /api/admin/users?role=&status=&search=
export async function listUsers(req, res) {
  res.json(await adminService.listUsers(req.query));
}

// PATCH /api/admin/users/:id  { status }
export async function setUserStatus(req, res) {
  res.json({ user: await adminService.setUserStatus(req.user, req.params.userId, req.body.status) });
}

// GET /api/admin/alumni?search=&institution_id=&branch=&graduation_year=&employment_status=&verified=
export async function listAlumni(req, res) {
  res.json(await adminService.listAlumni(req.query));
}

// GET /api/admin/alumni/export (same filters) → CSV file download
export async function exportAlumni(req, res) {
  const csv = await adminService.exportAlumniCsv(req.query);
  const date = new Date().toISOString().slice(0, 10);
  res.set("Content-Type", "text/csv; charset=utf-8");
  res.set("Content-Disposition", `attachment; filename="alumsetu-alumni-${date}.csv"`);
  res.set("Cache-Control", "no-store"); // contact details: don't keep copies in caches
  res.send(csv);
}
