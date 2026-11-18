import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import validate from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/currentUser.js";
import { idParam, userIdParam } from "../validators/common.js";
import { listVerificationsQuery, reviewVerificationSchema, listUsersQuery, userStatusSchema } from "../validators/adminSchemas.js";
import * as admin from "../controllers/adminController.js";

// Mounted at /api/admin. Every route below is for admins only.
// (/api/admin/reports lives in routes/reports.js.)
const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/stats", asyncHandler(admin.getStats));
router.get("/verifications", validate({ query: listVerificationsQuery }), asyncHandler(admin.listVerifications));
router.patch("/verifications/:id", validate({ params: idParam, body: reviewVerificationSchema }), asyncHandler(admin.reviewVerification));
router.get("/users", validate({ query: listUsersQuery }), asyncHandler(admin.listUsers));
router.patch("/users/:userId", validate({ params: userIdParam, body: userStatusSchema }), asyncHandler(admin.setUserStatus));

export default router;
