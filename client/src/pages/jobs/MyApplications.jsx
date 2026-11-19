import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import { Alert, Card, EmptyState, PageLoader } from "../../components/ui";
import { StatusPill, jobTypeLabel } from "../../components/jobs/JobCard";
import { formatDate } from "../../utils/format";

/**
 * Student: jobs I applied to and where each application stands
 * → GET /applications/my
 */
export default function MyApplications() {
  const { data, loading, error } = useApi("/applications/my");

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/jobs" className="text-sm font-semibold text-orange-dark hover:underline">
        ← All jobs
      </Link>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">My applications</h1>

      {error ? (
        <Alert className="mt-6">{error.message}</Alert>
      ) : data.length === 0 ? (
        <EmptyState title="No applications yet" message="Apply to a job and you can track it here." />
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {data.map((a) => (
            <li key={a.id}>
              <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link to={`/jobs/${a.job.id}`} className="font-heading text-lg font-bold text-navy hover:text-orange-dark">
                    {a.job.title}
                  </Link>
                  <p className="text-sm">
                    {a.job.company} · {jobTypeLabel(a.job.type)} · Applied {formatDate(a.applied_at)}
                  </p>
                </div>
                <StatusPill status={a.status} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
