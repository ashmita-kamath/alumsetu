import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import validate from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/currentUser.js";
import { idParam } from "../validators/common.js";
import { createReportSchema, listReportsQuery, reviewReportSchema } from "../validators/reportSchemas.js";
import * as reports from "../controllers/reportController.js";

// Mounted at /api.
//   POST  /reports             any logged-in user
//   GET   /admin/reports       admin
//   PATCH /admin/reports/:id   admin
const router = Router();

router.post("/reports", requireAuth, validate({ body: createReportSchema }), asyncHandler(reports.createReport));
router.get("/admin/reports", requireAuth, requireRole("admin"), validate({ query: listReportsQuery }), asyncHandler(reports.listReports));
router.patch(
  "/admin/reports/:id",
  requireAuth,
  requireRole("admin"),
  validate({ params: idParam, body: reviewReportSchema }),
  asyncHandler(reports.reviewReport)
);

export default router;
