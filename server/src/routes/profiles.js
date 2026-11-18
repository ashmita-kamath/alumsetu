import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { requireUser } from "../middleware/currentUser.js";
import validate from "../middleware/validate.js";
import { userIdParam } from "../validators/common.js";
import { getMyProfile, updateMyProfile, getUserProfile } from "../controllers/profileController.js";

const router = Router();

router.use(requireUser);
router.get("/me", asyncHandler(getMyProfile));
router.put("/me", asyncHandler(updateMyProfile));
router.get("/:userId", validate({ params: userIdParam }), asyncHandler(getUserProfile));

export default router;
