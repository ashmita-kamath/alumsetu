// Which websites (origins) may call the API from a browser.
//
// CLIENT_URL can hold one or more origins, separated by commas, e.g.
//   CLIENT_URL=https://alumsetu.vercel.app,http://localhost:5173
// A "*" inside an entry matches any characters, so Vercel preview links work:
//   CLIENT_URL=https://alumsetu.vercel.app,https://alumsetu-*.vercel.app
// The desktop and mobile apps (Phase 8) send their own origins, which are always allowed.
// If CLIENT_URL is empty, every origin is allowed (fine for local development).

const APP_ORIGINS = ["capacitor://localhost", "ionic://localhost", "tauri://localhost", "http://tauri.localhost", "https://tauri.localhost"];

function toPattern(entry) {
  const escaped = entry.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
  return new RegExp(`^${escaped}$`, "i");
}

export function parseAllowedOrigins(value = "") {
  return value
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export function buildOriginCheck(value = process.env.CLIENT_URL) {
  const entries = parseAllowedOrigins(value);
  if (entries.length === 0 || entries.includes("*")) return () => true;
  const patterns = [...entries, ...APP_ORIGINS].map(toPattern);
  // No Origin header = not a browser (curl, health checks, server-to-server): allow.
  return (origin) => !origin || patterns.some((p) => p.test(origin));
}

export function corsOptions(value = process.env.CLIENT_URL) {
  const allowed = buildOriginCheck(value);
  return {
    origin(origin, callback) {
      callback(null, allowed(origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // Lets the website read the file name of a download (the alumni CSV export)
    exposedHeaders: ["Content-Disposition"],
    maxAge: 600,
  };
}
