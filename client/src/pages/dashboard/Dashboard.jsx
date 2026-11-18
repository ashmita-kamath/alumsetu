import { useAuth } from "../../context/AuthContext";
import StudentDashboard from "./StudentDashboard";
import AlumniDashboard from "./AlumniDashboard";
import AdminDashboard from "./AdminDashboard";

/**
 * /dashboard shows a different page for each role, so every user
 * has a single "home" URL after logging in.
 */
export default function Dashboard() {
  const { user } = useAuth();

  if (user.role === "student") return <StudentDashboard />;
  if (user.role === "alumni") return <AlumniDashboard />;
  return <AdminDashboard />;
}
