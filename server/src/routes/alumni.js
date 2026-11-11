import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { listAlumni, getAlumnus } from "../controllers/alumniController.js";

const router = Router();

// TODO (after feat/auth-jwt is merged): add requireAuth to both routes,
// because docs/API.md says the directory is for logged-in users only.
router.get("/", asyncHandler(listAlumni));
router.get("/:userId", asyncHandler(getAlumnus));

export default router;
