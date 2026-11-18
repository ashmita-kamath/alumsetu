import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute, { GuestRoute } from "./ProtectedRoute";
import Home from "../pages/Home";
import AlumniDirectory from "../pages/AlumniDirectory";
import AlumniProfile from "../pages/AlumniProfile";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/dashboard/Dashboard";
import NotFound from "../pages/NotFound";

/**
 * Top-level route configuration for AlumSetu.
 *
 * All pages are nested inside MainLayout so that the sticky Navbar
 * and responsive Footer are consistently rendered.
 *
 * Route groups:
 * - Public:     / (landing)
 * - Guest only: /login, /register (logged-in users go to /dashboard)
 * - Any logged-in user: /dashboard, /alumni, /alumni/:userId
 * - *  → 404 fallback page
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="alumni" element={<AlumniDirectory />} />
          <Route path="alumni/:userId" element={<AlumniProfile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
