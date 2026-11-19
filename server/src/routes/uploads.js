import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import { requireAuth } from "../middleware/currentUser.js";
import { receiveFile } from "../middleware/upload.js";
import * as uploads from "../controllers/uploadController.js";

// Mounted at /api/uploads
const router = Router();

router.post("/", requireAuth, receiveFile, asyncHandler(uploads.uploadFile));

export default router;
