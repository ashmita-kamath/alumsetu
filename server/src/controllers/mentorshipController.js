import * as mentorshipService from "../services/mentorshipService.js";

// POST /api/mentorship (students)
export async function createRequest(req, res) {
  const request = await mentorshipService.createRequest(req.user, req.body);
  res.status(201).json({ request });
}

// GET /api/mentorship?status=pending (students and alumni)
export async function listRequests(req, res) {
  res.json(await mentorshipService.listRequests(req.user, req.query.status));
}

// PATCH /api/mentorship/:id
export async function updateStatus(req, res) {
  const request = await mentorshipService.updateStatus(req.user, req.params.id, req.body.status);
  res.json({ request });
}
