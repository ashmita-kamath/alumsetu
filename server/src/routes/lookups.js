import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import validate from "../middleware/validate.js";
import { requireUser, allowRoles } from "../middleware/currentUser.js";
import { institutionSchema, skillSchema } from "../validators/lookupSchemas.js";
import { getInstitutions, getSkills, addInstitution, addSkill } from "../controllers/lookupController.js";

const router = Router();

// Public: the register and profile forms need these before the user logs in.
router.get("/institutions", asyncHandler(getInstitutions));
router.get("/skills", asyncHandler(getSkills));

router.post("/institutions", requireUser, allowRoles("admin"), validate({ body: institutionSchema }), asyncHandler(addInstitution));
router.post("/skills", requireUser, validate({ body: skillSchema }), asyncHandler(addSkill));

export default router;
