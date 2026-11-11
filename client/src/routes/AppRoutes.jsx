import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import AlumniDirectory from "../pages/AlumniDirectory";
import AlumniProfile from "../pages/AlumniProfile";
import Login from "../pages/Login";
import Register from "../pages/Register";
import NotFound from "../pages/NotFound";

/**
 * Top-level route configuration for AlumSetu.
 *
 * All pages are nested inside MainLayout so that the sticky Navbar
 * and responsive Footer are consistently rendered.
 *
 * Routes:
 * - /               → Landing page (Home)
 * - /alumni         → Alumni directory listing
 * - /alumni/:userId → Individual alumni profile view
 * - /login          → User login
 * - /register       → Account registration
 * - *               → 404 fallback page
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="alumni" element={<AlumniDirectory />} />
        <Route path="alumni/:userId" element={<AlumniProfile />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
