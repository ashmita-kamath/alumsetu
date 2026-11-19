import { AppError } from "../utils/AppError.js";
import { detectFormat, uploadBuffer } from "../services/uploadService.js";

// Who may upload which kind of file
const ALLOWED_ROLES = { verification: "alumni", resume: "student" };

// POST /api/uploads   multipart/form-data:  file=<the file>, kind=verification|resume
// → 201 { url }
export async function uploadFile(req, res) {
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
}
