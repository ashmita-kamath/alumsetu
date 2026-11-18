import * as authService from "../services/authService.js";

// POST /api/auth/register
export async function register(req, res) {
  res.status(201).json(await authService.register(req.body));
}

// POST /api/auth/login
export async function login(req, res) {
  res.json(await authService.login(req.body));
}

// GET /api/auth/me (req.user is set by requireAuth)
export async function me(req, res) {
  res.json({ user: req.user });
}
