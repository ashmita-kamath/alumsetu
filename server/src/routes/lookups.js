import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { getInstitutions, getSkills } from "../controllers/lookupController.js";

const router = Router();

// Public: the register and profile forms need these before the user logs in.
router.get("/institutions", asyncHandler(getInstitutions));
router.get("/skills", asyncHandler(getSkills));

// TODO (after feat/auth-jwt is merged):
// router.post("/institutions", requireAuth, requireRole("admin"), asyncHandler(createInstitution));
// router.post("/skills", requireAuth, asyncHandler(createSkill));

export default router;
