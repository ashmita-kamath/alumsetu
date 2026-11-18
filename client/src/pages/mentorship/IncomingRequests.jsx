import RequestList from "../../components/mentorship/RequestList";

/**
 * Alumni: mentorship requests students have sent me.
 *
 * Allowed actions (same as the backend rules in API.md):
 * – pending  → Accept or Decline (only the receiving alumnus can)
 * – accepted → Mark completed
 */
const actionsFor = (request) => {
  if (request.status === "pending") {
    return [
      { label: "Decline", status: "declined", variant: "secondary" },
      { label: "Accept", status: "accepted" },
    ];
  }
  if (request.status === "accepted") {
    return [{ label: "Mark completed", status: "completed", variant: "secondary" }];
  }
  return [];
};

export default function IncomingRequests() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">Mentorship requests</h1>
      <p className="mt-1 mb-6 text-sm">Students who would like your guidance.</p>
      <RequestList
        personLabel="Student"
        actionsFor={actionsFor}
        emptyTitle="No requests yet"
        emptyMessage="Once you're verified and open to mentoring, students can send you requests."
      />
    </div>
  );
}
