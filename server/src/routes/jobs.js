import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import validate from "../middleware/validate.js";
import { requireUser, allowRoles, requireVerifiedAlumni } from "../middleware/currentUser.js";
import { idParam } from "../validators/common.js";
import { listJobsQuery, createJobSchema, applySchema, applicationStatusSchema } from "../validators/jobSchemas.js";
import * as jobs from "../controllers/jobController.js";

// Mounted at /api, so these are /api/jobs... and /api/applications...
const router = Router();
const id = validate({ params: idParam });

router.get("/jobs", requireUser, validate({ query: listJobsQuery }), asyncHandler(jobs.listJobs));
router.post("/jobs", requireUser, requireVerifiedAlumni(), validate({ body: createJobSchema }), asyncHandler(jobs.createJob));
router.get("/jobs/:id", requireUser, id, asyncHandler(jobs.getJob));
router.delete("/jobs/:id", requireUser, id, asyncHandler(jobs.deleteJob));
router.post("/jobs/:id/apply", requireUser, allowRoles("student"), validate({ params: idParam, body: applySchema }), asyncHandler(jobs.apply));
router.get("/jobs/:id/applications", requireUser, id, asyncHandler(jobs.listApplicationsForJob));
router.get("/applications/my", requireUser, allowRoles("student"), asyncHandler(jobs.myApplications));
router.patch("/applications/:id", requireUser, allowRoles("alumni"), validate({ params: idParam, body: applicationStatusSchema }), asyncHandler(jobs.updateApplicationStatus));

export default router;
