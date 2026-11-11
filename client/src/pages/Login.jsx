import { Link } from "react-router-dom";

/**
 * Placeholder Login page.
 * Will be implemented with full auth form handling in Phase 1 (feat/ui-auth).
 */
export default function Login() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="mt-2 text-body">Sign in to your AlumSetu account. Coming soon.</p>
      <p className="mt-4 text-sm text-body">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-orange-dark hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
