import { useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import api from "../../services/api";
import { Alert, Button, Card, EmptyState, PageLoader } from "../ui";
import StatusBadge from "./StatusBadge";

/**
 * The list behind both "My requests" (student) and "Incoming
 * requests" (alumni) → GET /mentorship?status=...
 *
 * The backend decides which requests to return from the token:
 * a student gets the ones they sent, an alumnus the ones they received.
 * Each request has `other_user` = the person on the other side.
 *
 * `actionsFor(request)` returns the buttons allowed for that request,
 * e.g. [{ label: "Accept", status: "accepted" }]. Clicking one sends
 * PATCH /mentorship/:id { status }. The backend checks the same rules,
 * so a hidden button is never the only protection.
 */
const TABS = ["all", "pending", "accepted", "declined", "completed"];

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function RequestList({ actionsFor, emptyTitle, emptyMessage, personLabel }) {
  const [tab, setTab] = useState("all");
  const { data, loading, error, setData } = useApi(
    `/mentorship${tab === "all" ? "" : `?status=${tab}`}`
  );
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const requests = Array.isArray(data) ? data : data?.items || [];

  const updateStatus = async (request, status) => {
    setBusyId(request.id);
    setActionError("");
    try {
      const { request: updated } = await api.patch(`/mentorship/${request.id}`, { status });
      setData((prev) => {
        const list = Array.isArray(prev) ? prev : prev?.items || [];
        const next = list
          .map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
          // On a filtered tab, a request that changed status no longer belongs here
          .filter((r) => tab === "all" || r.status === tab);
        return Array.isArray(prev) ? next : { ...prev, items: next };
      });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {/* Status filter tabs (scroll sideways on small phones) */}
      <div className="-mx-4 overflow-x-auto px-4" role="tablist" aria-label="Filter by status">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                tab === t ? "bg-navy text-white" : "bg-white text-navy hover:bg-gray-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Alert className="mt-4">{actionError}</Alert>

      <div className="mt-4">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <Alert>{error.message}</Alert>
        ) : requests.length === 0 ? (
          <EmptyState title={emptyTitle} message={tab === "all" ? emptyMessage : `No ${tab} requests.`} />
        ) : (
          <ul className="flex flex-col gap-4">
            {requests.map((r) => {
              const actions = actionsFor(r);
              return (
                <li key={r.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-body/70">
                          {personLabel}
                        </p>
                        {/* Alumni have a public profile page; students don't */}
                        {personLabel === "Mentor" ? (
                          <Link
                            to={`/alumni/${r.other_user?.id}`}
                            className="font-heading text-lg font-bold text-navy hover:text-orange-dark"
                          >
                            {r.other_user?.full_name}
                          </Link>
                        ) : (
                          <p className="font-heading text-lg font-bold text-navy">{r.other_user?.full_name}</p>
                        )}
                      </div>
                      <StatusBadge status={r.status} />
                    </div>

                    {r.message && (
                      <p className="mt-3 whitespace-pre-line rounded-lg bg-cream p-3 text-sm">{r.message}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs">
                        Sent {formatDate(r.created_at)}
                        {r.match_score != null && ` · ${Math.round(r.match_score * 100)}% match`}
                      </p>
                      {actions.length > 0 && (
                        <div className="flex gap-2">
                          {actions.map((a) => (
                            <Button
                              key={a.status}
                              variant={a.variant || "primary"}
                              disabled={busyId === r.id}
                              onClick={() => updateStatus(r, a.status)}
                              className="px-4 py-2"
                            >
                              {a.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
