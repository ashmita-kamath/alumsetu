import { Link } from "react-router-dom";

/**
 * 404 Not Found page.
 *
 * Rendered when a URL doesn't match any declared routes.
 * Provides a clean fallback and a clear way to navigate back to Home.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-heading text-6xl font-bold text-orange-dark">404</p>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Page Not Found</h1>
      <p className="mt-2 text-sm text-body">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-orange px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-orange/90"
      >
        Back to Home
      </Link>
    </div>
  );
}
