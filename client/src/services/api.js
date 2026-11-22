/**
 * Thin fetch wrapper for talking to the AlumSetu backend.
 *
 * WHY THIS EXISTS
 * Every page that fetches data would otherwise repeat the same
 * boilerplate: build the URL, attach the Authorization header,
 * parse JSON, and pull the error out of the response body.
 * This file does it once so every page just calls api.get(...).
 *
 * HOW IT WORKS
 * 1. BASE_URL comes from the VITE_API_URL environment variable.
 *    Vite replaces import.meta.env.VITE_API_URL at build time.
 * 2. If the user is logged in, their JWT lives in localStorage
 *    under the key "alumsetu_token".  Every request attaches it
 *    as a Bearer token automatically.
 * 3. If the backend returns an error, the JSON body always looks
 *    like  { error: { code, message, details } }  (see API.md).
 *    We throw a plain Error whose .message is the backend message
 *    and add .code and .details so the UI can branch on them
 *    (e.g. show field-level errors for VALIDATION_ERROR).
 *
 * USAGE
 *   import api from "../services/api";
 *   const data = await api.get("/alumni?page=1&limit=20");
 *   const user = await api.post("/auth/login", { email, password });
 */

const BASE_URL = import.meta.env.VITE_API_URL;

// One place for the localStorage key so AuthContext and this file agree.
export const TOKEN_KEY = "alumsetu_token";

async function request(endpoint, { method = "GET", body, headers = {} } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  // A file upload sends FormData. The browser must set its own Content-Type
  // (multipart/form-data with a boundary), so we only set JSON for other bodies.
  const isForm = body instanceof FormData;

  const config = {
    method,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
  };

  // Attach the JWT if the user is logged in
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  // Only add a body for methods that support one
  if (body) {
    config.body = isForm ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch {
    // fetch only throws when the request never got a response
    // (server down, no internet, CORS blocked).
    const err = new Error("Cannot reach the server. Check your connection and try again.");
    err.code = "NETWORK_ERROR";
    err.status = 0;
    err.details = [];
    throw err;
  }

  // 201 with no body, or 204 No Content, has nothing to parse
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null; // e.g. an HTML error page from a proxy
    }
  }

  // If the backend says something went wrong, throw so the
  // calling code can catch it and show the message in the UI.
  if (!response.ok) {
    const err = new Error(data?.error?.message || "Something went wrong");
    err.code = data?.error?.code || "UNKNOWN";
    err.status = response.status;
    err.details = data?.error?.details || [];
    throw err;
  }

  return data;
}

/**
 * Turns VALIDATION_ERROR details  [{ field, message }]  into an
 * object  { email: "Invalid email", ... }  so a form can show each
 * message under the matching input.
 */
export function fieldErrors(err) {
  const result = {};
  for (const d of err?.details || []) {
    if (d.field && !result[d.field]) result[d.field] = d.message;
  }
  return result;
}

/**
 * Builds a query string from an object, skipping empty values.
 *   toQuery({ page: 2, search: "", verified: true }) → "?page=2&verified=true"
 */
export function toQuery(params) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "" && value !== false) {
      qs.set(key, value);
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

// Convenience methods so callers don't repeat { method: "POST" }
const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: "POST", body }),
  put: (endpoint, body) => request(endpoint, { method: "PUT", body }),
  patch: (endpoint, body) => request(endpoint, { method: "PATCH", body }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

/**
 * Uploads one file → POST /uploads → returns the stored file's URL.
 *   kind: "resume" (students) or "verification" (alumni)
 */
export async function uploadFile(file, kind) {
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", file);
  const { url } = await request("/uploads", { method: "POST", body: form });
  return url;
}

/**
 * Downloads a file the API sends back (e.g. the CSV export).
 * A plain link can't send the login token, so we fetch it with the token,
 * then hand the result to the browser as a download.
 */
export async function downloadFile(endpoint, fallbackName = "download") {
  const token = localStorage.getItem(TOKEN_KEY);
  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error?.message || "Download failed");
  }
  const name = /filename="([^"]+)"/.exec(response.headers.get("Content-Disposition") || "")?.[1] || fallbackName;
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default api;
