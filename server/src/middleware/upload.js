import multer from "multer";
import { AppError } from "../utils/AppError.js";
import { MAX_BYTES } from "../services/uploadService.js";

// memoryStorage keeps the file in RAM (max 5 MB) so we can check it before
// anything is saved. Nothing is written to the server's disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 2 },
});

// Reads one file from the "file" field into req.file and turns multer's
// errors (e.g. file too large) into our error format.
export function receiveFile(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    const message = err.code === "LIMIT_FILE_SIZE" ? "File must be 5 MB or smaller" : "Send one file in the field named \"file\"";
    return next(new AppError(400, "VALIDATION_ERROR", message, [{ field: "file", message }]));
  });
}
