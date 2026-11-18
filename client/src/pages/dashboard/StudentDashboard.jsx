import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../hooks/useApi";
import { Alert } from "../../components/ui";
import DashboardTile from "./DashboardTile";
import SuggestedMentors from "../../components/alumni/SuggestedMentors";

/**
 * Student home page.
 *
 * – If the student has no profile yet, nudge them to create one,
 *   because mentor suggestions need their skills and career goal.
 * – Quick links to the main student features.
 * – AI mentor suggestions with score and reasons.
 */
export default function StudentDashboard() {
  const { user } = useAuth();
  const { data } = useApi("/profiles/me");
  const hasProfile = Boolean(data?.profile);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">Hi, {user.full_name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm">Here&apos;s what you can do on AlumSetu today.</p>

      {data && !hasProfile && (
        <Alert variant="info" className="mt-6">
          Your profile is empty.{" "}
          <Link to="/profile/edit" className="font-semibold underline">
            Add your skills and career goal
          </Link>{" "}
          to get mentor suggestions.
        </Alert>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardTile to="/alumni" title="Alumni directory" text="Search alumni by college, branch, company or skill." />
        <DashboardTile to="/mentorship/requests" title="My requests" text="Track the mentorship requests you have sent." />
        <DashboardTile to="/forum" title="Forum" text="Ask questions about careers, academics and placements." />
        <DashboardTile to="/profile/edit" title="Edit profile" text="Keep your skills and goals up to date." />
      </div>

      <SuggestedMentors />
    </div>
  );
}
