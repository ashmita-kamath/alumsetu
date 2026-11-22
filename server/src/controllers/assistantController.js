import * as assistantService from "../services/assistantService.js";

// GET /api/assistant  → { answer, suggestions } (the greeting)
export function getWelcome(req, res) {
  res.json(assistantService.welcome(req.user));
}

// POST /api/assistant  { message }  → { topic, answer, links, items, suggestions }
export async function ask(req, res) {
  res.json(await assistantService.answer(req.body.message, req.user));
}
