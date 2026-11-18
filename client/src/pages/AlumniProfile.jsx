import { Link, useParams } from "react-router-dom";
import useApi from "../hooks/useApi";
import { Alert, Badge, Card, PageLoader } from "../components/ui";

/**
 * One alumnus's public profile → GET /alumni/:userId
 * (an AlumniCard plus linkedin_url).
 *
 * `userId` comes from the URL (/alumni/:userId) via useParams().
 */
export default function AlumniProfile() {
  const { userId } = useParams();
  const { data: alumnus, loading, error } = useApi(`/alumni/${userId}`);

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Alert>{error.status === 404 ? "This alumni profile does not exist." : error.message}</Alert>
        <Link to="/alumni" className="mt-4 inline-block text-sm font-semibold text-orange-dark hover:underline">
          ← Back to directory
        </Link>
      </div>
    );
  }

  const details = [
    { label: "College", value: alumnus.institution?.name },
    { label: "Branch", value: alumnus.branch },
    { label: "Graduated", value: alumnus.graduation_year },
    { label: "Company", value: alumnus.current_company },
    { label: "Job title", value: alumnus.job_title },
    { label: "Industry", value: alumnus.industry },
    { label: "Location", value: alumnus.location },
  ].filter((d) => d.value);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/alumni" className="text-sm font-semibold text-orange-dark hover:underline">
        ← Back to directory
      </Link>

      <Card className="mt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">{alumnus.full_name}</h1>
              {alumnus.is_verified && <Badge variant="verified">Verified Alumni</Badge>}
            </div>
            {(alumnus.job_title || alumnus.current_company) && (
              <p className="mt-1 font-semibold text-navy/80">
                {[alumnus.job_title, alumnus.current_company].filter(Boolean).join(" at ")}
              </p>
            )}
            <p className="mt-2 text-sm">
              {alumnus.available_for_mentoring
                ? "Open to mentoring students"
                : "Not taking mentees right now"}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-gray-100 pt-6 sm:grid-cols-2">
          {details.map((d) => (
            <div key={d.label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-body/70">{d.label}</dt>
              <dd className="text-sm text-navy">{d.value}</dd>
            </div>
          ))}
        </dl>

        {alumnus.skills?.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-body/70">Skills</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {alumnus.skills.map((s) => (
                <li key={s.id}>
                  <Badge>{s.name}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Only allow http(s) links: a "javascript:" URL here would run code on click */}
        {/^https?:\/\//i.test(alumnus.linkedin_url || "") && (
          <a
            href={alumnus.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block text-sm font-semibold text-orange-dark hover:underline"
          >
            View LinkedIn profile ↗
          </a>
        )}
      </Card>
    </div>
  );
}
