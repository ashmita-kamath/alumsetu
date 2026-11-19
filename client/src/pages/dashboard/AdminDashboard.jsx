import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../hooks/useApi";
import { Alert, Card, Spinner } from "../../components/ui";
import DashboardTile from "./DashboardTile";

/**
 * Admin home → GET /admin/stats.
 *
 * Shows platform numbers as cards. The two that need action
 * (pending verifications, pending reports) link straight to their queue
 * and are highlighted when something is waiting.
 */
const STAT_CARDS = [
  { key: "students", label: "Students" },
  { key: "alumni", label: "Alumni" },
  { key: "verified_alumni", label: "Verified alumni" },
  { key: "mentorships", label: "Mentorship requests" },
  { key: "events", label: "Events" },
  { key: "jobs", label: "Jobs posted" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: stats, loading, error } = useApi("/admin/stats");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">Admin dashboard</h1>
      <p className="mt-1 text-sm">Signed in as {user.full_name}.</p>

      {error && <Alert className="mt-6">{error.message}</Alert>}

      {/* Needs attention */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <ActionCard to="/admin/verifications" label="Verifications waiting" value={stats?.pending_verifications} loading={loading} />
        <ActionCard to="/admin/reports" label="Reports waiting" value={stats?.pending_reports} loading={loading} />
      </div>

      {/* Platform numbers */}
      <h2 className="mt-10 text-lg font-bold">Platform at a glance</h2>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STAT_CARDS.map((s) => (
          <Card key={s.key} className="p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-body/70">{s.label}</dt>
            <dd className="mt-1 font-heading text-2xl font-bold text-navy">
              {loading ? <Spinner size="sm" /> : stats?.[s.key] ?? "–"}
            </dd>
          </Card>
        ))}
      </dl>

      <h2 className="mt-10 text-lg font-bold">Manage</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardTile to="/admin/users" title="Users" text="Search accounts and suspend or re-activate them." />
        <DashboardTile to="/admin/institutions" title="Colleges" text="See the college list and add new colleges." />
        <DashboardTile to="/forum" title="Forum" text="Read discussions; hidden posts are visible to you." />
        <DashboardTile to="/alumni" title="Alumni directory" text="Browse all alumni accounts." />
        <DashboardTile to="/events" title="Events" text="See and manage all events." />
        <DashboardTile to="/jobs" title="Jobs" text="See and remove job posts." />
      </div>
    </div>
  );
}

/** A big number that links to a queue. Orange border when something is waiting. */
function ActionCard({ to, label, value, loading }) {
  const waiting = value > 0;
  return (
    <Link to={to} className="group block focus:outline-none">
      <div
        className={`rounded-xl border-2 bg-card p-6 shadow-sm transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-orange/50 ${
          waiting ? "border-orange" : "border-gray-100"
        }`}
      >
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="mt-1 font-heading text-4xl font-bold text-navy">{loading ? <Spinner /> : value ?? "–"}</p>
        <p className="mt-2 text-sm font-semibold text-orange-dark group-hover:underline">
          {waiting ? "Review now →" : "Open queue →"}
        </p>
      </div>
    </Link>
  );
}
