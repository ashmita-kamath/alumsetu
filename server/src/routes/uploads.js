// POST /api/uploads   multipart/form-data:  file=<the file>, kind=verification|resume
// Returns 201 { url }

import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../utils/http.js";
import { requireAuth } from "../middleware/currentUser.js";
import { AppError } from "../utils/AppError.js";
import { MAX_BYTES, detectFormat, uploadBuffer } from "../services/uploadService.js";

const router = Router();

// memoryStorage keeps the file in RAM (max 5 MB) so we can check it before
// anything is saved. Nothing is written to the server's disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 2 },
});

// Who may upload which kind of file
const ALLOWED_ROLES = { verification: "alumni", resume: "student" };

// Runs multer and turns its errors (e.g. file too large) into our error format.
function receiveFile(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    const message = err.code === "LIMIT_FILE_SIZE" ? "File must be 5 MB or smaller" : "Send one file in the field named \"file\"";
    return next(new AppError(400, "VALIDATION_ERROR", message, [{ field: "file", message }]));
  });
}

router.post(
  "/",
  requireAuth,
  receiveFile,
  asyncHandler(async (req, res) => {
    const { kind } = req.body;
    if (!ALLOWED_ROLES[kind]) {
      throw new AppError(400, "VALIDATION_ERROR", "kind must be verification or resume", [
        { field: "kind", message: "Must be verification or resume" },
      ]);
    }
    if (req.user.role !== ALLOWED_ROLES[kind]) {
      throw new AppError(403, "FORBIDDEN", kind === "verification" ? "Only alumni upload verification documents" : "Only students upload resumes");
    }
    if (!req.file) {
      throw new AppError(400, "VALIDATION_ERROR", "Choose a file to upload", [{ field: "file", message: "Required" }]);
    }
    if (!detectFormat(req.file.buffer)) {
      throw new AppError(400, "VALIDATION_ERROR", "Only PDF, JPG or PNG files are allowed", [
        { field: "file", message: "Only PDF, JPG or PNG" },
      ]);
    }

    const url = await uploadBuffer(req.file.buffer, kind);
    res.status(201).json({ url });
  })
);

export default router;
