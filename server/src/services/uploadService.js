// Stores uploaded files on Cloudinary.
//
// The Cloudinary SDK reads CLOUDINARY_URL (cloudinary://API_KEY:API_SECRET@CLOUD_NAME)
// from the environment by itself, so no keys appear in the code.
//
// PRIVACY
// – Verification documents (degree, ID card) are personal. They are uploaded as
//   "authenticated" assets: the plain URL does not open the file. Only an admin
//   gets a time-limited signed link (signedUrl below).
// – Resumes are uploaded as normal assets, because the job poster opens them.

import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../utils/AppError.js";

export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB, from docs/API.md

// We check the first bytes of the file ("magic numbers") instead of trusting the
// file name or the Content-Type the browser sends, which a user can fake.
const SIGNATURES = [
  { format: "pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { format: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { format: "jpg", bytes: [0xff, 0xd8, 0xff] },
];

export function detectFormat(buffer) {
  const match = SIGNATURES.find((s) => s.bytes.every((b, i) => buffer[i] === b));
  return match ? match.format : null;
}

const KINDS = {
  verification: { folder: "alumsetu/verification", type: "authenticated" },
  resume: { folder: "alumsetu/resumes", type: "upload" },
};

function ensureConfigured() {
  if (!process.env.CLOUDINARY_URL) {
    throw new AppError(500, "INTERNAL_ERROR", "File uploads are not configured on the server");
  }
  // The SDK reads CLOUDINARY_URL only once, when it is first imported.
  // config(true) re-reads it, so the current value is always used.
  cloudinary.config(true);
}

// Uploads a file held in memory and returns its https URL.
export function uploadBuffer(buffer, kind) {
  ensureConfigured();
  const { folder, type } = KINDS[kind];
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      // resource_type "image" also handles PDFs on Cloudinary
      { folder, type, resource_type: "image", use_filename: false, unique_filename: true },
      (err, result) => {
        if (err) return reject(new AppError(502, "UPLOAD_FAILED", "Could not store the file. Please try again"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// A link to a private (authenticated) file that stops working after `seconds`.
// Used by the admin verification queue (Phase 5).
export function signedUrl(storedUrl, seconds = 10 * 60) {
  ensureConfigured();
  // Stored URLs look like .../image/authenticated/v123/alumsetu/verification/abc.pdf
  const match = storedUrl.match(/\/image\/authenticated\/(?:v\d+\/)?(.+)\.(\w+)$/);
  if (!match) return storedUrl;
  const [, publicId, format] = match;
  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: "image",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + seconds,
  });
}
