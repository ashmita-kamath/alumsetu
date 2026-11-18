import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Top navigation bar visible on every page.
 *
 * – Desktop: horizontal row of links.
 * – Phones and tablets (< 1024 px): hamburger icon that toggles a vertical menu.
 *
 * The links depend on who is logged in (from AuthContext):
 * – Visitor: Home, Login, Register
 * – Student: Dashboard, Alumni, Forum, Events, Jobs, My requests
 * – Alumni:  Dashboard, Alumni, Forum, Events, Jobs, Requests
 * – Admin:   Dashboard, Verifications, Reports, Users, Colleges, Forum
 *            (alumni, events and jobs are linked from the admin dashboard)
 * Logged-in users also see their name (links to profile) and Log out.
 */
const LINKS_BY_ROLE = {
  student: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/alumni", label: "Alumni" },
    { to: "/forum", label: "Forum" },
    { to: "/events", label: "Events" },
    { to: "/jobs", label: "Jobs" },
    { to: "/mentorship/requests", label: "My requests" },
  ],
  alumni: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/alumni", label: "Alumni" },
    { to: "/forum", label: "Forum" },
    { to: "/events", label: "Events" },
    { to: "/jobs", label: "Jobs" },
    { to: "/mentorship/incoming", label: "Requests" },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/admin/verifications", label: "Verifications" },
    { to: "/admin/reports", label: "Reports" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/institutions", label: "Colleges" },
    { to: "/forum", label: "Forum" },
  ],
};

const GUEST_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/login", label: "Login" },
  { to: "/register", label: "Register" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `block py-2 text-sm font-medium transition-colors ${
      isActive ? "text-orange-dark font-bold" : "text-navy hover:text-orange-dark"
    }`;

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    // A full page load (not navigate) to the home page. It also throws
    // away any data the previous user had loaded into memory. With
    // navigate(), the protected page's guard would see "no user" first
    // and send us to /login instead.
    window.location.assign("/");
  };

  const items = user ? LINKS_BY_ROLE[user.role] || [] : GUEST_LINKS;

  const links = (
    <>
      {items.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={closeMenu}>
          {l.label}
        </NavLink>
      ))}

      {user && (
        <>
          {/* Admins have no profile to edit */}
          {user.role !== "admin" ? (
            <NavLink to="/profile/edit" className={linkClass} onClick={closeMenu}>
              {user.full_name}
            </NavLink>
          ) : (
            <span className="block py-2 text-sm font-medium text-navy">{user.full_name}</span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="block py-2 text-left text-sm font-medium text-orange-dark hover:underline"
          >
            Log out
          </button>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo – just styled text, no image */}
        <Link
          to={user ? "/dashboard" : "/"}
          className="font-heading text-xl font-bold text-navy"
          onClick={closeMenu}
        >
          AlumSetu
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex">{links}</nav>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden rounded-lg p-2 text-navy hover:bg-gray-100"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
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
        <nav className="border-t border-gray-100 px-4 pb-4 lg:hidden">{links}</nav>
      )}
    </header>
  );
}
