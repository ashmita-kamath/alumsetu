// Works out WHO is making the request and checks what they are allowed to do.
//
// In production, Dhanishtha's requireAuth (feat/auth-jwt) reads the JWT and sets req.user.
// Until that is merged, and ONLY outside production, a developer can act as a user by
// sending the header  X-Dev-User-Id: <user uuid>  (used by our automated tests too).
// When requireAuth is merged, put it before requireUser in each router; requireUser then
// just checks the user that requireAuth found.

import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadUser(id) {
  const { rows } = await query(
    "SELECT id, email, full_name, role, status, created_at FROM users WHERE id = $1",
    [id]
  );
  return rows[0] || null;
}

// Makes sure there is a logged-in, non-suspended user on req.user.
export async function requireUser(req, res, next) {
  try {
    if (!req.user) {
      const devUserId = process.env.NODE_ENV !== "production" ? req.get("X-Dev-User-Id") : undefined;
      if (devUserId && UUID_PATTERN.test(devUserId)) {
        req.user = await loadUser(devUserId);
      }
    }
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Please log in first");
    if (req.user.status === "suspended") throw new AppError(403, "FORBIDDEN", "Your account is suspended");
    return next();
  } catch (err) {
    return next(err);
  }
}

// Allows only the listed roles, e.g. allowRoles("student").
export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError(403, "FORBIDDEN", `Only ${roles.join(" or ")} accounts can do this`));
    }
    return next();
  };
}

// True if this user is an alumnus whose proof has been approved by an admin.
export async function isVerifiedAlumnus(userId) {
  const { rows } = await query("SELECT is_verified FROM alumni_profiles WHERE user_id = $1", [userId]);
  return rows[0]?.is_verified === true;
}

// Allows verified alumni (and admins, if adminsToo is true). Unverified alumni get a clear message.
export function requireVerifiedAlumni({ adminsToo = false } = {}) {
  return async (req, res, next) => {
    try {
      if (adminsToo && req.user.role === "admin") return next();
      if (req.user.role !== "alumni") {
        throw new AppError(403, "FORBIDDEN", adminsToo ? "Only verified alumni or admins can do this" : "Only verified alumni can do this");
      }
      if (!(await isVerifiedAlumnus(req.user.id))) {
        throw new AppError(403, "FORBIDDEN", "Your alumni account must be verified by an admin first");
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
