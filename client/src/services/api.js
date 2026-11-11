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

async function request(endpoint, { method = "GET", body, headers = {} } = {}) {
  const token = localStorage.getItem("alumsetu_token");

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  // Attach the JWT if the user is logged in
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  // Only add a body for methods that support one
  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // 204 No Content has no body to parse
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  // If the backend says something went wrong, throw so the
  // calling code can catch it and show the message in the UI.
  if (!response.ok) {
    const err = new Error(data.error?.message || "Something went wrong");
    err.code = data.error?.code || "UNKNOWN";
    err.details = data.error?.details || [];
    throw err;
  }

  return data;
}

// Convenience methods so callers don't repeat { method: "POST" }
const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: "POST", body }),
  put: (endpoint, body) => request(endpoint, { method: "PUT", body }),
  patch: (endpoint, body) => request(endpoint, { method: "PATCH", body }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

export default api;
