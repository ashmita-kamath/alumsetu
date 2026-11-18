import { useAuth } from "../../context/AuthContext";
import DashboardTile from "./DashboardTile";

/**
 * Admin home page shell. The full admin panel (stats, verification
 * queue, reports, users) is built in Phase 5 (feat/ui-admin).
 */
export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">Admin dashboard</h1>
      <p className="mt-1 text-sm">Signed in as {user.full_name}.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardTile to="/alumni" title="Alumni directory" text="Browse all alumni accounts." />
        <DashboardTile to="/events" title="Events" text="See and manage all events." />
        <DashboardTile to="/jobs" title="Jobs" text="See and remove job posts." />
        <DashboardTile to="/forum" title="Forum" text="Read and moderate forum discussions." />
      </div>
    </div>
  );
}
