// POST /api/reports                  any logged-in user
// GET  /api/admin/reports?status=    admin, paginated, with the reported text
// PATCH /api/admin/reports/:id       admin, { status: "approved" | "rejected" }

import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import validate from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/currentUser.js";
import { idParam } from "../validators/common.js";
import { createReportSchema, listReportsQuery, reviewReportSchema } from "../validators/reportSchemas.js";
import * as reports from "../services/reportService.js";

const router = Router();

router.post(
  "/reports",
  requireAuth,
  validate({ body: createReportSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ report: await reports.createReport(req.user, req.body) });
  })
);

router.get(
  "/admin/reports",
  requireAuth,
  requireRole("admin"),
  validate({ query: listReportsQuery }),
  asyncHandler(async (req, res) => {
    res.json(await reports.listReports(req.query));
  })
);

router.patch(
  "/admin/reports/:id",
  requireAuth,
  requireRole("admin"),
  validate({ params: idParam, body: reviewReportSchema }),
  asyncHandler(async (req, res) => {
    res.json({ report: await reports.reviewReport(req.params.id, req.body.status) });
  })
);

export default router;
