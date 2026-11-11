import { Router } from "express";
import healthRoutes from "./health.js";
import lookupRoutes from "./lookups.js";
import alumniRoutes from "./alumni.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/", lookupRoutes); // /institutions, /skills
router.use("/alumni", alumniRoutes);

// More feature routers are mounted here as they are built, for example:
// router.use("/auth", authRoutes);
// router.use("/profiles", profileRoutes);

export default router;
