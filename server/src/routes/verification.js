import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import validate from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/currentUser.js";
import { submitVerificationSchema } from "../validators/verificationSchemas.js";
import * as verification from "../controllers/verificationController.js";

// Mounted at /api/verification. Alumni only.
const router = Router();

router.use(requireAuth, requireRole("alumni"));

router.post("/", validate({ body: submitVerificationSchema }), asyncHandler(verification.submitVerification));
router.get("/me", asyncHandler(verification.getMyVerification));

export default router;
