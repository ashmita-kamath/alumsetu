// Stops the server from starting in production with missing or unsafe settings,
// so a mistake shows up in the Render logs straight away instead of as random errors.

export function checkProductionEnv(env = process.env) {
  if (env.NODE_ENV !== "production") return [];
  const problems = [];
  if (!env.DATABASE_URL) problems.push("DATABASE_URL is not set");
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || env.JWT_SECRET === "change_me") {
    problems.push("JWT_SECRET must be a long random value (at least 32 characters)");
  }
  if (!env.CLIENT_URL) problems.push("CLIENT_URL is not set (the Vercel website address)");
  if (!env.CLOUDINARY_URL) problems.push("CLOUDINARY_URL is not set (file uploads will fail)");
  return problems;
}
