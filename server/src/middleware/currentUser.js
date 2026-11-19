// Works out WHO is making the request and checks what they are allowed to do.
//
// HOW A USER IS FOUND (in this order)
// 1. "Authorization: Bearer <token>" — the normal way. The JWT from /auth/login or
//    /auth/register is checked (signature + expiry), then the user is loaded from
//    the database so their current role and status are used, not a 7-day-old copy.
// 2. "X-Dev-User-Id: <uuid>" — ONLY when NODE_ENV is not "production". Lets the
//    automated tests act as a user without logging in. Ignored in production.
//
// requireAuth and requireRole are the names used in docs/ROADMAP.md; they are the
// same functions as requireUser and allowRoles, which the existing routers use.

import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadUser(id) {
  const { rows } = await query(
    "SELECT id, email, full_name, role, status, created_at FROM users WHERE id = $1",
    [id]
  );
  return rows[0] || null;
}

async function findUser(req) {
  const header = req.get("Authorization") || "";
  if (header) {
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new AppError(401, "UNAUTHORIZED", "Authorization header must be: Bearer <token>");
    }
    const payload = verifyToken(token); // throws 401 if invalid or expired
    const user = await loadUser(payload.id);
    // The account was deleted after the token was issued
    if (!user) throw new AppError(401, "UNAUTHORIZED", "This account no longer exists");
    return user;
  }

  const devUserId = process.env.NODE_ENV !== "production" ? req.get("X-Dev-User-Id") : undefined;
  if (devUserId && UUID_PATTERN.test(devUserId)) {
    return loadUser(devUserId);
  }
  return null;
}

// Makes sure there is a logged-in, non-suspended user on req.user.
export async function requireUser(req, res, next) {
  try {
    if (!req.user) req.user = await findUser(req);
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

export const requireAuth = requireUser;
export const requireRole = allowRoles;

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
