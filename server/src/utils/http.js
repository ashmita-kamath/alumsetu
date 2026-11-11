// Small helpers shared by controllers.

// Sends an error in the format defined in docs/API.md.
export function sendError(res, status, code, message, details = []) {
  return res.status(status).json({ error: { code, message, details } });
}

// Reads ?page and ?limit, applying the defaults and limits from docs/API.md.
export function getPagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

// Wraps an async route handler so thrown errors reach the error middleware.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
