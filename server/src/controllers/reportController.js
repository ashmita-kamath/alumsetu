import * as reportService from "../services/reportService.js";

// POST /api/reports  { post_id or comment_id, reason }  → 201 { report }
export async function createReport(req, res) {
  res.status(201).json({ report: await reportService.createReport(req.user, req.body) });
}

// GET /api/admin/reports?status=  → paginated, with the reported text
export async function listReports(req, res) {
  res.json(await reportService.listReports(req.query));
}

// PATCH /api/admin/reports/:id  { status: "approved" | "rejected" }
export async function reviewReport(req, res) {
  res.json({ report: await reportService.reviewReport(req.params.id, req.body.status) });
}
