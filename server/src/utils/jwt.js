// Creating and checking login tokens (JWT = JSON Web Token).
//
// A token is a small signed message: { id, role } plus an expiry date.
// The server signs it with JWT_SECRET; anyone changing even one character
// breaks the signature, so we can trust what is inside without a database lookup.
// We still look the user up on every request (see middleware/currentUser.js)
// so a suspended account is blocked immediately, not after 7 days.

import jwt from "jsonwebtoken";
import { AppError } from "./AppError.js";

const EXPIRES_IN = "7d"; // from docs/API.md

function secret() {
  const value = process.env.JWT_SECRET;
  // A short or default secret could be guessed, letting anyone forge tokens.
  if (!value || value === "change_me" || value.length < 16) {
    throw new AppError(500, "INTERNAL_ERROR", "JWT_SECRET is missing or too weak. Set a long random value in server/.env");
  }
  return value;
}

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, secret(), { expiresIn: EXPIRES_IN });
}

// Returns the payload { id, role, iat, exp }, or throws a 401 AppError.
export function verifyToken(token) {
  try {
    // Only accept HS256, so a token cannot switch to "none" or another algorithm.
    return jwt.verify(token, secret(), { algorithms: ["HS256"] });
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err.name === "TokenExpiredError") {
      throw new AppError(401, "UNAUTHORIZED", "Your session has expired. Please log in again");
    }
    throw new AppError(401, "UNAUTHORIZED", "Invalid login token. Please log in again");
  }
}
