import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import validate from "../middleware/validate.js";
import { requireAuth } from "../middleware/currentUser.js";
import { registerSchema, loginSchema } from "../validators/authSchemas.js";
import { register, login, me } from "../controllers/authController.js";

const router = Router();

router.post("/register", validate({ body: registerSchema }), asyncHandler(register));
router.post("/login", validate({ body: loginSchema }), asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));

export default router;
