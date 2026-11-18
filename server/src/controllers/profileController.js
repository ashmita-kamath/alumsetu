import * as profileService from "../services/profileService.js";
import { studentProfileSchema, alumniProfileSchema } from "../validators/profileSchemas.js";
import { AppError } from "../utils/AppError.js";

// GET /api/profiles/me
export async function getMyProfile(req, res) {
  res.json(await profileService.getProfile(req.user.id, { showEmail: true }));
}

// PUT /api/profiles/me (students and alumni each send their own fields, see docs/API.md)
export async function updateMyProfile(req, res) {
  if (req.user.role === "admin") throw new AppError(403, "FORBIDDEN", "Admin accounts have no profile");
  const schema = req.user.role === "student" ? studentProfileSchema : alumniProfileSchema;
  const data = schema.parse(req.body); // a ZodError becomes a 400 in the error handler
  res.json(await profileService.saveMyProfile(req.user, data));
}

// GET /api/profiles/:userId
export async function getUserProfile(req, res) {
  const { userId } = req.params;
  const showEmail = userId === req.user.id || req.user.role === "admin";
  res.json(await profileService.getProfile(userId, { showEmail }));
}
