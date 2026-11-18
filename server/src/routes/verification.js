import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/http.js";
import validate from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/currentUser.js";
import * as verification from "../services/verificationService.js";

const router = Router();

// Only accept files that came from our own POST /uploads (stored on Cloudinary),
// so nobody can point the admin at an arbitrary website.
const submitSchema = z.object({
  document_url: z
    .string()
    .trim()
    .max(500)
    .regex(/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/authenticated\//, "Upload the document with POST /uploads first"),
});

router.use(requireAuth, requireRole("alumni"));

// POST /api/verification  { document_url }  → 201 { request }
router.post(
  "/",
  validate({ body: submitSchema }),
  asyncHandler(async (req, res) => {
    const request = await verification.submit(req.user, req.body.document_url);
    res.status(201).json({ request });
  })
);

// GET /api/verification/me  → latest request or null
router.get(
  "/me",
  asyncHandler(async (req, res) => {
    res.json(await verification.getLatest(req.user.id));
  })
);

export default router;
