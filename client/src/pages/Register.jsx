import { Link } from "react-router-dom";

/**
 * Placeholder Register page.
 * Will allow role selection (student / alumni) and account creation in Phase 1 (feat/ui-auth).
 */
export default function Register() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Register</h1>
      <p className="mt-2 text-body">Create your student or alumni account. Coming soon.</p>
      <p className="mt-4 text-sm text-body">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-orange-dark hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
