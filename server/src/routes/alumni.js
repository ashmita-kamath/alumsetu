import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { requireAuth } from "../middleware/currentUser.js";
import { listAlumni, getAlumnus } from "../controllers/alumniController.js";

const router = Router();

// docs/API.md: the directory is for logged-in users only.
router.get("/", requireAuth, asyncHandler(listAlumni));
router.get("/:userId", requireAuth, asyncHandler(getAlumnus));

export default router;
