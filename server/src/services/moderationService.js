// Content moderation for forum posts and comments.
//
// OWNER: Dhanishtha (feat/moderation). This is only a placeholder so the forum can call it today.
// Replace the body of checkText with the real filter (e.g. the bad-words list) without changing
// its name or return shape, and the forum will start blocking content automatically.
//
// Returns { allowed: true } or { allowed: false, reason: "why it was blocked" }.
// eslint-disable-next-line no-unused-vars
export function checkText(...texts) {
  return { allowed: true };
}
