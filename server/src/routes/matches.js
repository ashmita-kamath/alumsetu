import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { getMatches } from "../controllers/matchController.js";

const router = Router();

// TODO (after feat/auth-jwt is merged): add requireAuth and requireRole("student") here.
router.get("/", asyncHandler(getMatches));

export default router;
