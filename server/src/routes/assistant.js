import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import validate from "../middleware/validate.js";
import { optionalUser } from "../middleware/currentUser.js";
import { askSchema } from "../validators/assistantSchemas.js";
import * as assistant from "../controllers/assistantController.js";

// Mounted at /api/assistant. Open to everyone; logged-in users get answers
// for their role and live data (mentor matches, events, jobs).
const router = Router();

router.use(optionalUser);

router.get("/", asyncHandler(assistant.getWelcome));
router.post("/", validate({ body: askSchema }), asyncHandler(assistant.ask));

export default router;
