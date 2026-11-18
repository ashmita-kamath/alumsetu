import { Router } from "express";
import healthRoutes from "./health.js";
import lookupRoutes from "./lookups.js";
import alumniRoutes from "./alumni.js";
import matchRoutes from "./matches.js";
import profileRoutes from "./profiles.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/", lookupRoutes); // /institutions, /skills
router.use("/alumni", alumniRoutes);
router.use("/matches", matchRoutes);
router.use("/profiles", profileRoutes);

// More feature routers are mounted here as they are built, for example:
// router.use("/auth", authRoutes);

export default router;
