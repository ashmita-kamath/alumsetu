import { useState } from "react";
import { Link } from "react-router-dom";
import useAdminList from "../../hooks/useAdminList";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Alert, Button, Card, EmptyState, FilterTabs, PageLoader, Pagination } from "../../components/ui";
import { formatDateTime } from "../../utils/format";

/**
 * Content reports queue → GET /admin/reports?status=
 *
 * For each report the admin sees what was reported, who wrote it,
 * who reported it and why, then decides:
 *   Hide it  → PATCH { status: "approved" } → post/comment is flagged and hidden
 *   Keep it  → PATCH { status: "rejected" } → nothing changes
 */
const TABS = [
  { value: "pending", label: "Waiting" },
  { value: "approved", label: "Hidden" },
  { value: "rejected", label: "Kept" },
];

export default function Reports() {
  const { showToast } = useToast();
  const { data, loading, error, setData, filters, setFilter, setPage } = useAdminList("/admin/reports", { status: "pending" });
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const review = async (report, status) => {
    setBusyId(report.id);
    setActionError("");
    try {
      await api.patch(`/admin/reports/${report.id}`, { status });
      setData((prev) => ({ ...prev, items: prev.items.filter((r) => r.id !== report.id), total: prev.total - 1 }));
      showToast(status === "approved" ? `The ${report.target.type} is now hidden` : "Report dismissed; content stays visible");
    } catch (err) {
      setActionError(err.message); // e.g. 409 if another admin already reviewed it
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/dashboard" className="text-sm font-semibold text-orange-dark hover:underline">
        ← Admin dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Reported content</h1>
      <p className="mt-1 text-sm">Hiding a post or comment removes it for everyone except admins.</p>

      <div className="mt-6">
        <FilterTabs label="Status" tabs={TABS} value={filters.status} onChange={(v) => setFilter("status", v)} />
      </div>
      <Alert className="mt-4">{actionError}</Alert>

      <div className="mt-4">
        {error ? (
          <Alert>{error.message}</Alert>
        ) : loading && !data ? (
          <PageLoader />
        ) : data.items.length === 0 ? (
          <EmptyState title={filters.status === "pending" ? "No reports to review" : "Nothing here"} message="" />
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {data.items.map((r) => (
                <li key={r.id}>
                  <Card>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 font-semibold capitalize text-red-800">
                        Reported {r.target.type}
                      </span>
                      <span>
                        by {r.reporter.full_name} · {formatDateTime(r.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-navy">Reason: {r.reason}</p>

                    {/* The reported content itself */}
                    <blockquote className="mt-3 rounded-lg border-l-4 border-gray-300 bg-cream p-4">
                      {r.target.title && <p className="font-semibold text-navy">{r.target.title}</p>}
                      <p className="mt-1 line-clamp-6 whitespace-pre-line text-sm text-navy/90">{r.target.body}</p>
                      <p className="mt-2 text-xs">
                        Written by {r.target.author?.full_name} ·{" "}
                        <Link to={`/forum/${r.target.post_id}`} className="font-semibold text-orange-dark hover:underline">
                          Open {r.target.type === "post" ? "post" : "the post it's on"}
                        </Link>
                      </p>
                    </blockquote>

                    {r.status === "pending" && (
                      <div className="mt-4 flex justify-end gap-2">
                        <Button variant="secondary" disabled={busyId === r.id} onClick={() => review(r, "rejected")}>
                          Keep it
                        </Button>
                        <Button disabled={busyId === r.id} onClick={() => review(r, "approved")}>
                          Hide {r.target.type}
                        </Button>
                      </div>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
            <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
