import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import { Alert, Spinner } from "../ui";
import AlumniCard from "./AlumniCard";

/**
 * "Suggested mentors" on the student dashboard → GET /matches?limit=5.
 *
 * The backend ranks verified alumni who are open to mentoring:
 *   score = 0.6 × skill overlap + 0.3 × career-goal similarity + 0.1 × same branch
 * and sends back human-readable `reasons`, which we show so the
 * student understands WHY each person was suggested.
 *
 * An empty list means the student has no skills and no career goal
 * yet, so we ask them to complete their profile.
 *
 * `renderAction(match)` lets the parent add a button to each card
 * (the dashboard uses it for "Request mentorship").
 */
export default function SuggestedMentors({ renderAction }) {
  const { data: matches, loading, error } = useApi("/matches?limit=5");

  return (
    <section className="mt-10" aria-labelledby="suggested-mentors">
      <h2 id="suggested-mentors" className="text-xl font-bold">
        Suggested mentors
      </h2>
      <p className="mt-1 text-sm">Picked for you based on your skills, career goal and branch.</p>

      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Alert>{error.message}</Alert>
        ) : matches.length === 0 ? (
          <Alert variant="info">
            No suggestions yet.{" "}
            <Link to="/profile/edit" className="font-semibold underline">
              Complete your profile
            </Link>{" "}
            with your skills and career goal to get mentor suggestions.
          </Alert>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <AlumniCard key={m.alumni.user_id} alumnus={m.alumni}>
                <MatchDetails match={m} />
                {renderAction && <div className="mt-4">{renderAction(m)}</div>}
              </AlumniCard>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Score bar + the list of reasons for one match. */
function MatchDetails({ match }) {
  const percent = Math.round(match.score * 100);

  return (
    <div className="border-t border-gray-100 pt-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-navy">Match score</span>
        <span className="font-bold text-orange-dark">{percent}%</span>
      </div>
      <div
        className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Match score"
      >
        <div className="h-full rounded-full bg-orange" style={{ width: `${percent}%` }} />
      </div>
      <ul className="mt-3 flex flex-col gap-1 text-sm">
        {match.reasons.map((r) => (
          <li key={r} className="flex gap-2">
            <span className="text-green-700" aria-hidden="true">
              ✓
            </span>
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
