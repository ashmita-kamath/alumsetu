import { useAuth } from "../context/AuthContext";
import useApi from "./useApi";

/**
 * Can the logged-in user create events / post jobs?
 *
 * The backend allows only VERIFIED alumni (and admins, for events).
 * Verification lives on the alumni profile, so for alumni we load
 * GET /profiles/me to read is_verified. Other roles need no request.
 *
 * Returns { canPost, isUnverifiedAlumnus, loading }.
 * This only decides what the UI shows; the backend checks again.
 */
export default function useCanPost({ adminsToo = false } = {}) {
  const { user } = useAuth();
  const isAlumnus = user?.role === "alumni";
  const { data, loading } = useApi(isAlumnus ? "/profiles/me" : null);

  const verified = Boolean(data?.profile?.is_verified);
  return {
    canPost: (isAlumnus && verified) || (adminsToo && user?.role === "admin"),
    isUnverifiedAlumnus: isAlumnus && !loading && !verified,
    loading,
  };
}
