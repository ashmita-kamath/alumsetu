import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

/**
 * Top navigation bar visible on every page.
 *
 * – Desktop: horizontal row of links.
 * – Mobile (< 768 px): hamburger icon that toggles a vertical menu.
 *
 * NavLink from React Router automatically adds an "active" class
 * when the current URL matches, so we bold the active link.
 *
 * Right now the links are Home, Alumni, Login, Register.
 * Later (Phase 1) we'll swap Login/Register for the user's name
 * once AuthContext is built.
 */
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `block py-2 text-sm font-medium transition-colors ${
      isActive ? "text-orange-dark font-bold" : "text-navy hover:text-orange-dark"
    }`;

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={() => setMenuOpen(false)}>
        Home
      </NavLink>
      <NavLink to="/alumni" className={linkClass} onClick={() => setMenuOpen(false)}>
        Alumni
      </NavLink>
      <NavLink to="/login" className={linkClass} onClick={() => setMenuOpen(false)}>
        Login
      </NavLink>
      <NavLink to="/register" className={linkClass} onClick={() => setMenuOpen(false)}>
        Register
      </NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo – just styled text, no image */}
        <Link to="/" className="font-heading text-xl font-bold text-navy">
          AlumSetu
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">{links}</nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden rounded-lg p-2 text-navy hover:bg-gray-100"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            /* X icon */
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            /* Hamburger icon */
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <nav className="border-t border-gray-100 px-4 pb-4 md:hidden">{links}</nav>
      )}
    </header>
  );
}
