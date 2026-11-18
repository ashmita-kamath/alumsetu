import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { TOKEN_KEY } from "../services/api";

/**
 * AuthContext keeps track of who is logged in, for the whole app.
 *
 * WHAT IT STORES
 * – user:    { id, email, full_name, role, status } or null
 * – loading: true while we check a saved token on first load
 *
 * HOW LOGIN WORKS
 * 1. login() / register() call the backend, which returns { token, user }.
 * 2. The token (a JWT) is saved in localStorage, so a page refresh
 *    keeps you logged in. services/api.js reads it from there and
 *    sends it as "Authorization: Bearer <token>" on every request.
 * 3. On page load, if a token exists we call GET /auth/me to get the
 *    user again. If the token is expired or invalid the backend
 *    returns 401, so we delete it and treat the visitor as logged out.
 *
 * SECURITY NOTE
 * Hiding a button in the UI is only for convenience. The backend
 * checks the token and the role on every request, so a user cannot
 * do anything just by editing this state in their browser.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Only "loading" if there is a token we still need to check.
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  // On first load: turn a saved token back into a user.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;

    api
      .get("/auth/me")
      .then((data) => setUser(data.user))
      .catch((err) => {
        // Only throw the token away if the server rejected it.
        // A network error should not log the user out.
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const login = useCallback(async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    return saveSession(data);
  }, []);

  // fields = { full_name, email, password, role }
  const register = useCallback(async (fields) => {
    const data = await api.post("/auth/register", fields);
    return saveSession(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // Used after the profile page saves a new name, so the navbar updates.
  const updateUser = useCallback((changes) => {
    setUser((prev) => (prev ? { ...prev, ...changes } : prev));
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser }),
    [user, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook used by any component: const { user, logout } = useAuth(); */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
