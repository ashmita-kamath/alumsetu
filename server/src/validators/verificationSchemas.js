import { z } from "zod";

// Only accept files that came from our own POST /uploads (stored on Cloudinary),
// so nobody can point the admin at an arbitrary website.
export const submitVerificationSchema = z.object({
  document_url: z
    .string()
    .trim()
    .max(500)
    .regex(/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/authenticated\//, "Upload the document with POST /uploads first"),
});
