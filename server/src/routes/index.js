import { Router } from "express";
import healthRoutes from "./health.js";

const router = Router();

router.use("/health", healthRoutes);

// Feature routers are mounted here as they are built, for example:
// router.use("/auth", authRoutes);
// router.use("/profiles", profileRoutes);
// router.use("/alumni", alumniRoutes);

export default router;
