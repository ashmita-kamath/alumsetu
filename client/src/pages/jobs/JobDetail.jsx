import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../hooks/useApi";
import api from "../../services/api";
import { Alert, Badge, Button, Card, PageLoader } from "../../components/ui";
import ApplyModal from "../../components/jobs/ApplyModal";
import { StatusPill, jobTypeLabel } from "../../components/jobs/JobCard";
import { formatDate } from "../../utils/format";

/**
 * One job → GET /jobs/:id → { job, has_applied }
 *
 * – Students: Apply (with optional resume upload), or see "Applied".
 * – The alumnus who posted it: applicant list with Shortlist / Select /
 *   Reject (GET /jobs/:id/applications, PATCH /applications/:id).
 * – Poster or admin: Delete.
 */
export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, setData } = useApi(`/jobs/${id}`);
  const [applyOpen, setApplyOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  if (loading) return <PageLoader />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Alert>{error.status === 404 ? "This job does not exist or was removed." : error.message}</Alert>
        <Link to="/jobs" className="mt-4 inline-block text-sm font-semibold text-orange-dark hover:underline">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  const { job, has_applied } = data;
  const isPoster = job.posted_by?.id === user.id;
  const canDelete = isPoster || user.role === "admin";

  const deleteJob = async () => {
    if (!window.confirm("Delete this job? All applications to it will be removed.")) return;
    try {
      await api.delete(`/jobs/${job.id}`);
      navigate("/jobs", { replace: true });
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/jobs" className="text-sm font-semibold text-orange-dark hover:underline">
        ← Back to jobs
      </Link>

      <Alert className="mt-4">{actionError}</Alert>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-orange/15 px-2.5 py-0.5 text-xs font-semibold text-orange-dark">
            {jobTypeLabel(job.type)}
          </span>
          {!job.is_open && <Badge>Closed</Badge>}
        </div>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{job.title}</h1>
        <p className="mt-1 font-semibold text-navy">
          {job.company}
          {job.location && <span className="font-normal"> · {job.location}</span>}
        </p>
        <p className="mt-1 text-sm">
          Posted by {job.posted_by?.full_name} on {formatDate(job.created_at)}
          {job.deadline && <> · Apply by {formatDate(job.deadline)}</>}
        </p>

        {job.description && (
          <p className="mt-6 whitespace-pre-line border-t border-gray-100 pt-6 text-navy/90">{job.description}</p>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center">
          {user.role === "student" &&
            (has_applied ? (
              <p className="text-sm font-semibold text-green-800">
                ✓ You applied.{" "}
                <Link to="/applications" className="text-orange-dark underline">
                  Track it in My applications
                </Link>
              </p>
            ) : job.is_open ? (
              <Button onClick={() => setApplyOpen(true)}>Apply</Button>
            ) : (
              <p className="text-sm">Applications for this job have closed.</p>
            ))}
          {canDelete && (
            <Button variant="ghost" onClick={deleteJob} className="text-red-700 sm:ml-auto">
              Delete job
            </Button>
          )}
        </div>
      </Card>

      {/* Only the poster can see and update applicants (backend returns 403 to others) */}
      {isPoster && <Applicants jobId={job.id} />}

      {user.role === "student" && (
        <ApplyModal
          job={job}
          open={applyOpen}
          onClose={() => setApplyOpen(false)}
          onApplied={() => {
            setApplyOpen(false);
            setData({ ...data, has_applied: true });
          }}
        />
      )}
    </div>
  );
}

const STATUS_ACTIONS = [
  { status: "shortlisted", label: "Shortlist" },
  { status: "selected", label: "Select" },
  { status: "rejected", label: "Reject" },
];

/** Poster's view of applicants → GET /jobs/:id/applications */
function Applicants({ jobId }) {
  const { data, loading, error, setData } = useApi(`/jobs/${jobId}/applications`);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const setStatus = async (application, status) => {
    setBusyId(application.id);
    setActionError("");
    try {
      const { application: updated } = await api.patch(`/applications/${application.id}`, { status });
      setData((prev) => prev.map((a) => (a.id === updated.id ? { ...a, status: updated.status } : a)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="mt-6">
      <h2 className="text-lg font-bold">Applicants{data && ` (${data.length})`}</h2>
      <Alert className="mt-3">{actionError}</Alert>
      {loading ? (
        <PageLoader />
      ) : error ? (
        <Alert className="mt-3">{error.message}</Alert>
      ) : data.length === 0 ? (
        <p className="mt-2 text-sm">No applications yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {data.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-navy">{a.student.full_name}</p>
                  <StatusPill status={a.status} />
                </div>
                <p className="mt-1 text-sm">
                  <a href={`mailto:${a.student.email}`} className="text-orange-dark hover:underline">
                    {a.student.email}
                  </a>
                  {" · "}Applied {formatDate(a.applied_at)}
                </p>
                {/^https?:\/\//i.test(a.resume_url || "") && (
                  <a href={a.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-orange-dark hover:underline">
                    View resume ↗
                  </a>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_ACTIONS.filter((s) => s.status !== a.status).map((s) => (
                  <Button
                    key={s.status}
                    variant={s.status === "rejected" ? "secondary" : "primary"}
                    disabled={busyId === a.id}
                    onClick={() => setStatus(a, s.status)}
                    className="px-3 py-1.5"
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
