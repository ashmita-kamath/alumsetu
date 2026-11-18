import { Router } from "express";
import healthRoutes from "./health.js";
import lookupRoutes from "./lookups.js";
import alumniRoutes from "./alumni.js";
import matchRoutes from "./matches.js";
import profileRoutes from "./profiles.js";
import mentorshipRoutes from "./mentorship.js";
import forumRoutes from "./forum.js";
import eventRoutes from "./events.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/", lookupRoutes); // /institutions, /skills
router.use("/alumni", alumniRoutes);
router.use("/matches", matchRoutes);
router.use("/profiles", profileRoutes);
router.use("/mentorship", mentorshipRoutes);
router.use("/", forumRoutes); // /posts, /comments
router.use("/", eventRoutes); // /events, /me/registrations

// More feature routers are mounted here as they are built, for example:
// router.use("/auth", authRoutes);

export default router;
