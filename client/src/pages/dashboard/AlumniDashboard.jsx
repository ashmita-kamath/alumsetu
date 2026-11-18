import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../hooks/useApi";
import { Alert, Badge } from "../../components/ui";
import DashboardTile from "./DashboardTile";

/**
 * Alumni home page.
 *
 * Shows whether the alumnus is verified. Only verified alumni appear
 * in mentor suggestions and can accept mentees, so an unverified
 * alumnus is told why they are not visible to students yet.
 */
export default function AlumniDashboard() {
  const { user } = useAuth();
  const { data } = useApi("/profiles/me");
  const profile = data?.profile;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Hi, {user.full_name.split(" ")[0]}</h1>
        {profile?.is_verified && <Badge variant="verified">Verified Alumni</Badge>}
      </div>
      <p className="mt-1 text-sm">Thank you for giving back to your college community.</p>

      {data && !profile && (
        <Alert variant="info" className="mt-6">
          Your profile is empty.{" "}
          <Link to="/profile/edit" className="font-semibold underline">
            Add your college, company and skills
          </Link>{" "}
          so students can find you.
        </Alert>
      )}

      {profile && !profile.is_verified && (
        <Alert variant="info" className="mt-6">
          Your account is not verified yet. Students will see you in mentor suggestions once an
          admin approves your alumni proof.
        </Alert>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardTile to="/mentorship/incoming" title="Mentorship requests" text="Accept or decline students who asked for your help." />
        <DashboardTile to="/alumni" title="Alumni directory" text="Reconnect with fellow alumni." />
        <DashboardTile to="/events" title="Events" text="Host or join meetups and webinars." />
        <DashboardTile to="/forum" title="Forum" text="Answer student questions and share advice." />
        <DashboardTile to="/profile/edit" title="Edit profile" text="Update your company, role and mentoring status." />
      </div>
    </div>
  );
}
