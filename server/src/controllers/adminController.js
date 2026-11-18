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
