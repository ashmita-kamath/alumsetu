import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/ui/PageLoader";

/**
 * Wraps routes that need a logged-in user.
 *
 *   <Route element={<ProtectedRoute />}>                  any logged-in user
 *   <Route element={<ProtectedRoute roles={["student"]} />}>  students only
 *
 * – Still checking the saved token? Show a spinner (otherwise we would
 *   wrongly bounce a logged-in user to /login on refresh).
 * – Not logged in? Go to /login, remembering where they wanted to go
 *   so the login page can send them back afterwards.
 * – Wrong role? Go to their own dashboard.
 *
 * This only controls what the UI shows. The backend enforces the same
 * rules with requireAuth / requireRole on every API call.
 */
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

/**
 * The opposite: pages like /login and /register that a logged-in
 * user should not see. They are sent to their dashboard instead.
 */
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
