import { Link } from "react-router-dom";
import RequestList from "../../components/mentorship/RequestList";

/**
 * Student: mentorship requests I have sent.
 *
 * Allowed actions (same as the backend rules in API.md):
 * – accepted → "Mark completed" (either side may complete a mentorship)
 * A student cannot accept or decline their own request.
 */
const actionsFor = (request) =>
  request.status === "accepted"
    ? [{ label: "Mark completed", status: "completed", variant: "secondary" }]
    : [];

export default function MyRequests() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">My mentorship requests</h1>
      <p className="mt-1 mb-6 text-sm">
        Find mentors in the{" "}
        <Link to="/alumni?verified=true&mentoring=true" className="font-semibold text-orange-dark hover:underline">
          alumni directory
        </Link>{" "}
        or in your suggestions on the{" "}
        <Link to="/dashboard" className="font-semibold text-orange-dark hover:underline">
          dashboard
        </Link>
        .
      </p>
      <RequestList
        personLabel="Mentor"
        actionsFor={actionsFor}
        emptyTitle="No requests yet"
        emptyMessage="When you ask an alumnus for mentorship, it shows up here."
      />
    </div>
  );
}
