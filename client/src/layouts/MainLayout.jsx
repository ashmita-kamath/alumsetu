import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

/**
 * MainLayout wraps every public page with the Navbar on top
 * and Footer on the bottom.
 *
 * <Outlet /> is a React Router placeholder — it renders whatever
 * child route matched (Home, Alumni page, Login, etc.).
 *
 * The flex + min-h-screen trick pushes the footer to the bottom
 * even when page content is short.
 */
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* flex-1 makes this area grow to fill remaining space */}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
