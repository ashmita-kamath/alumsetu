import { useState } from "react";
import { Link } from "react-router-dom";
import useAdminList from "../../hooks/useAdminList";
import api, { fieldErrors } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Alert, Button, Card, EmptyState, FilterTabs, Modal, PageLoader, Pagination, Textarea } from "../../components/ui";
import { formatDateTime } from "../../utils/format";

/**
 * Alumni verification queue → GET /admin/verifications?status=
 *
 * The admin opens the uploaded proof (a signed link that works for
 * 10 minutes), compares it with the profile shown next to it, then:
 *   Approve → PATCH { status: "approved" }  → the alumnus gets the badge
 *   Reject  → PATCH { status: "rejected", remarks } (a reason is required)
 */
const TABS = [
  { value: "pending", label: "Waiting" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function Verifications() {
  const { showToast } = useToast();
  const { data, loading, error, setData, filters, setFilter, setPage } = useAdminList("/admin/verifications", { status: "pending" });
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [rejecting, setRejecting] = useState(null); // the request being rejected

  // After a decision, the item leaves the "Waiting" list
  const removeFromList = (id) =>
    setData((prev) => ({ ...prev, items: prev.items.filter((r) => r.id !== id), total: prev.total - 1 }));

  const approve = async (item) => {
    setBusyId(item.id);
    setActionError("");
    try {
      await api.patch(`/admin/verifications/${item.id}`, { status: "approved" });
      removeFromList(item.id);
      showToast(`${item.alumnus.full_name} is now a verified alumnus`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/dashboard" className="text-sm font-semibold text-orange-dark hover:underline">
        ← Admin dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Alumni verification</h1>
      <p className="mt-1 text-sm">Check each alumnus&apos;s proof against their profile before approving.</p>

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
          <EmptyState title={filters.status === "pending" ? "Nothing to review" : "No requests here"} message={filters.status === "pending" ? "New verification requests will appear here." : ""} />
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {data.items.map((v) => (
                <li key={v.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link to={`/alumni/${v.alumnus.id}`} className="font-heading text-lg font-bold text-navy hover:text-orange-dark">
                          {v.alumnus.full_name}
                        </Link>
                        <p className="text-sm">{v.alumnus.email}</p>
                      </div>
                      <p className="text-xs">Submitted {formatDateTime(v.submitted_at)}</p>
                    </div>

                    {/* What the alumnus claims, to compare with the document */}
                    <dl className="mt-4 grid gap-x-6 gap-y-2 rounded-lg bg-cream p-4 text-sm sm:grid-cols-2">
                      <Claim label="College" value={v.profile.institution} />
                      <Claim label="Branch, year" value={v.profile.branch && `${v.profile.branch}, ${v.profile.graduation_year}`} />
                      <Claim label="Company" value={v.profile.current_company} />
                      <Claim label="Job title" value={v.profile.job_title} />
                    </dl>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      {v.document_link ? (
                        <a href={v.document_link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-orange-dark hover:underline">
                          Open proof document ↗ <span className="font-normal text-body">(link works for 10 minutes)</span>
                        </a>
                      ) : (
                        <p className="text-sm">Document link unavailable (file uploads are not configured on the server).</p>
                      )}

                      {v.status === "pending" ? (
                        <div className="flex gap-2 sm:ml-auto">
                          <Button variant="secondary" disabled={busyId === v.id} onClick={() => setRejecting(v)}>
                            Reject
                          </Button>
                          <Button disabled={busyId === v.id} onClick={() => approve(v)}>
                            {busyId === v.id ? "Approving…" : "Approve"}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm sm:ml-auto">
                          <span className="font-semibold capitalize text-navy">{v.status}</span>
                          {v.reviewed_by_name && ` by ${v.reviewed_by_name}`}
                          {v.remarks && <> · “{v.remarks}”</>}
                        </p>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
            <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>

      <RejectModal
        item={rejecting}
        onClose={() => setRejecting(null)}
        onRejected={(item) => {
          setRejecting(null);
          removeFromList(item.id);
          showToast(`Request from ${item.alumnus.full_name} rejected`);
        }}
      />
    </div>
  );
}

function Claim({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-body/70">{label}</dt>
      <dd className="text-navy">{value || "Not given"}</dd>
    </div>
  );
}

/** Asks for the reason before rejecting; the alumnus sees it on their dashboard. */
function RejectModal({ item, onClose, onRejected }) {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    setRemarks("");
    setError("");
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      setError("Tell the alumnus what to fix, e.g. “The document is blurry”.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.patch(`/admin/verifications/${item.id}`, { status: "rejected", remarks: remarks.trim() });
      setRemarks("");
      onRejected(item);
    } catch (err) {
      setError(fieldErrors(err).remarks || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={Boolean(item)} onClose={close} title={`Reject ${item?.alumnus.full_name}'s request`}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Textarea
          id="reject-remarks"
          label="Reason (shown to the alumnus)"
          rows={3}
          maxLength={500}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          error={error}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Rejecting…" : "Reject request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
