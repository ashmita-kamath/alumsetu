import { Router } from "express";
import healthRoutes from "./health.js";
import authRoutes from "./auth.js";
import lookupRoutes from "./lookups.js";
import alumniRoutes from "./alumni.js";
import matchRoutes from "./matches.js";
import profileRoutes from "./profiles.js";
import mentorshipRoutes from "./mentorship.js";
import forumRoutes from "./forum.js";
import eventRoutes from "./events.js";
import jobRoutes from "./jobs.js";
import uploadRoutes from "./uploads.js";
import verificationRoutes from "./verification.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/", lookupRoutes); // /institutions, /skills
router.use("/alumni", alumniRoutes);
router.use("/matches", matchRoutes);
router.use("/profiles", profileRoutes);
router.use("/mentorship", mentorshipRoutes);
router.use("/", forumRoutes); // /posts, /comments
router.use("/", eventRoutes); // /events, /me/registrations
router.use("/", jobRoutes); // /jobs, /applications
router.use("/uploads", uploadRoutes);
router.use("/verification", verificationRoutes);

export default router;
