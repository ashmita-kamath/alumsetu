import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Simple footer with copyright and a few links.
 * Sticks to the bottom because MainLayout uses min-h-screen + flex.
 * Login/Register links are only shown to visitors who are logged out.
 */
export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 text-sm text-body sm:flex-row sm:justify-between">
        <p>&copy; {new Date().getFullYear()} AlumSetu. All rights reserved.</p>

        <nav className="flex gap-4">
          {user ? (
            <>
              <Link to="/alumni" className="hover:text-orange-dark">
                Alumni Directory
              </Link>
              <Link to="/forum" className="hover:text-orange-dark">
                Forum
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-orange-dark">
                Login
              </Link>
              <Link to="/register" className="hover:text-orange-dark">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </footer>
  );
}
