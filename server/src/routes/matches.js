import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { requireUser, allowRoles } from "../middleware/currentUser.js";
import { getMatches } from "../controllers/matchController.js";

const router = Router();

router.get("/", requireUser, allowRoles("student"), asyncHandler(getMatches));

export default router;
