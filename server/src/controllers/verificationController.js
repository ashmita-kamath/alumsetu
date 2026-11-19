import * as verificationService from "../services/verificationService.js";

// POST /api/verification  { document_url }  → 201 { request }
export async function submitVerification(req, res) {
  const request = await verificationService.submit(req.user, req.body.document_url);
  res.status(201).json({ request });
}

// GET /api/verification/me  → latest request or null
export async function getMyVerification(req, res) {
  res.json(await verificationService.getLatest(req.user.id));
}
