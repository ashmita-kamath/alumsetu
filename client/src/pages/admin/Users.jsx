import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAdminList from "../../hooks/useAdminList";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Alert, Badge, Button, Card, EmptyState, Input, PageLoader, Pagination, Select } from "../../components/ui";
import { formatDate } from "../../utils/format";

/**
 * User management → GET /admin/users?role=&status=&search=
 *
 * Suspend / Re-activate → PATCH /admin/users/:id { status }.
 * A suspended user can't log in and is logged out on their next request.
 * Admin accounts can't be suspended here (the backend refuses it too).
 */
export default function Users() {
  const { user: me } = useAuth();
  const { showToast } = useToast();
  const { data, loading, error, setData, filters, setFilter, setPage } = useAdminList("/admin/users", { role: "", status: "", search: "" });
  const [searchText, setSearchText] = useState(filters.search);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  // Search 400 ms after the admin stops typing
  useEffect(() => {
    if (searchText.trim() === filters.search) return;
    const timer = setTimeout(() => setFilter("search", searchText.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const setStatus = async (u, status) => {
    if (status === "suspended" && !window.confirm(`Suspend ${u.full_name}? They will be logged out and can't log in.`)) return;
    setBusyId(u.id);
    setActionError("");
    try {
      const { user: updated } = await api.patch(`/admin/users/${u.id}`, { status });
      setData((prev) => ({ ...prev, items: prev.items.map((x) => (x.id === updated.id ? { ...x, status: updated.status } : x)) }));
      showToast(status === "suspended" ? `${u.full_name} is suspended` : `${u.full_name} is active again`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/dashboard" className="text-sm font-semibold text-orange-dark hover:underline">
        ← Admin dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Users</h1>

      <div className="mt-6 grid gap-3 rounded-xl border border-gray-100 bg-card p-4 sm:grid-cols-3">
        <Input id="user-search" type="search" label="Search" placeholder="Name or email" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        <Select
          id="user-role"
          label="Role"
          options={[
            { value: "", label: "All roles" },
            { value: "student", label: "Students" },
            { value: "alumni", label: "Alumni" },
            { value: "admin", label: "Admins" },
          ]}
          value={filters.role}
          onChange={(e) => setFilter("role", e.target.value)}
        />
        <Select
          id="user-status"
          label="Status"
          options={[
            { value: "", label: "Any status" },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
          ]}
          value={filters.status}
          onChange={(e) => setFilter("status", e.target.value)}
        />
      </div>

      <Alert className="mt-4">{actionError}</Alert>

      <div className="mt-4">
        {error ? (
          <Alert>{error.message}</Alert>
        ) : loading && !data ? (
          <PageLoader />
        ) : data.items.length === 0 ? (
          <EmptyState title="No users found" message="Try another search or filter." />
        ) : (
          <>
            <p className="mb-3 text-sm">{data.total} {data.total === 1 ? "account" : "accounts"}</p>
            <ul className="flex flex-col gap-3">
              {data.items.map((u) => {
                const canChange = u.role !== "admin" && u.id !== me.id;
                return (
                  <li key={u.id}>
                    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-navy">{u.full_name}</p>
                          <Badge className="capitalize">{u.role}</Badge>
                          {u.is_verified && <Badge variant="verified">Verified</Badge>}
                          {u.status === "suspended" && (
                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Suspended</span>
                          )}
                        </div>
                        <p className="truncate text-sm">
                          {u.email} · Joined {formatDate(u.created_at)}
                        </p>
                      </div>
                      {canChange &&
                        (u.status === "suspended" ? (
                          <Button variant="secondary" disabled={busyId === u.id} onClick={() => setStatus(u, "active")}>
                            Re-activate
                          </Button>
                        ) : (
                          <Button variant="ghost" className="text-red-700" disabled={busyId === u.id} onClick={() => setStatus(u, "suspended")}>
                            Suspend
                          </Button>
                        ))}
                    </Card>
                  </li>
                );
              })}
            </ul>
            <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
