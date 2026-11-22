import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import useAdminList from "../../hooks/useAdminList";
import { downloadFile, toQuery } from "../../services/api";
import { Alert, Badge, Button, EmptyState, Input, PageLoader, Pagination, Select } from "../../components/ui";
import { EMPLOYMENT_STATUSES, employmentLabel } from "../../utils/employment";

/**
 * Alumni database (admins) → GET /admin/alumni
 *
 * The problem statement's "centralized system for tracking alumni":
 * every alumnus with contact details, college, batch, employment and
 * skills. Admins filter it and download the same rows as a CSV
 * (GET /admin/alumni/export) for the department's records.
 */
const FILTER_DEFAULTS = { search: "", institution_id: "", branch: "", graduation_year: "", employment_status: "", verified: "" };

// The breakdown chips: every status plus "not filled in"
const BREAKDOWN = [...EMPLOYMENT_STATUSES, { value: "unknown", label: "Not filled in" }];

export default function AlumniDatabase() {
  const { data, loading, error, filters, setFilter, setPage } = useAdminList("/admin/alumni", FILTER_DEFAULTS);
  const { data: institutions } = useApi("/institutions");
  // Text boxes keep their own value while typing; the URL filter follows 400 ms later
  const [text, setText] = useState({ search: filters.search, branch: filters.branch, graduation_year: filters.graduation_year });
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const year = /^\d{4}$/.test(text.graduation_year) ? text.graduation_year : "";
      if (text.search.trim() !== filters.search) setFilter("search", text.search.trim());
      else if (text.branch.trim() !== filters.branch) setFilter("branch", text.branch.trim());
      else if (year !== filters.graduation_year) setFilter("graduation_year", year);
    }, 400);
    return () => clearTimeout(timer);
  }, [text, filters.search, filters.branch, filters.graduation_year]);

  const typeText = (key) => (e) => setText({ ...text, [key]: e.target.value });

  const download = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadFile(`/admin/alumni/export${toQuery(filters)}`, "alumsetu-alumni.csv");
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const collegeOptions = [{ value: "", label: "All colleges" }, ...(institutions || []).map((i) => ({ value: String(i.id), label: i.name }))];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/dashboard" className="text-sm font-semibold text-orange-dark hover:underline">
        ← Admin dashboard
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Alumni database</h1>
          <p className="mt-1 text-sm">Contact details, batch, employment and skills of every registered alumnus.</p>
        </div>
        <Button onClick={download} disabled={downloading || !data?.total}>
          {downloading ? "Preparing…" : "Download CSV"}
        </Button>
      </div>
      <Alert className="mt-4">{downloadError}</Alert>

      {/* Filters */}
      <div className="mt-6 grid gap-3 rounded-xl border border-gray-100 bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input id="alumni-search" type="search" label="Search" placeholder="Name, email or company" value={text.search} onChange={typeText("search")} />
        <Select id="alumni-college" label="College" options={collegeOptions} value={filters.institution_id} onChange={(e) => setFilter("institution_id", e.target.value)} />
        <Input id="alumni-branch" label="Branch" placeholder="e.g. CSE" value={text.branch} onChange={typeText("branch")} />
        <Input
          id="alumni-year"
          type="number"
          inputMode="numeric"
          label="Graduation year"
          placeholder="e.g. 2019"
          value={text.graduation_year}
          onChange={typeText("graduation_year")}
        />
        <Select
          id="alumni-employment"
          label="Employment"
          options={[{ value: "", label: "Any" }, ...BREAKDOWN]}
          value={filters.employment_status}
          onChange={(e) => setFilter("employment_status", e.target.value)}
        />
        <Select
          id="alumni-verified"
          label="Verification"
          options={[
            { value: "", label: "Everyone" },
            { value: "yes", label: "Verified only" },
            { value: "no", label: "Not verified yet" },
          ]}
          value={filters.verified}
          onChange={(e) => setFilter("verified", e.target.value)}
        />
      </div>

      {/* How many alumni are in each employment status (for the current filters) */}
      {data?.by_employment && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Alumni by employment status">
          {BREAKDOWN.filter((s) => data.by_employment[s.value]).map((s) => {
            const active = filters.employment_status === s.value;
            return (
              <li key={s.value}>
                <button
                  type="button"
                  onClick={() => setFilter("employment_status", active ? "" : s.value)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    active ? "border-navy bg-navy text-white" : "border-gray-200 bg-card text-navy hover:border-navy"
                  }`}
                >
                  {s.label}: {data.by_employment[s.value]}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4">
        {error ? (
          <Alert>{error.message}</Alert>
        ) : loading && !data ? (
          <PageLoader />
        ) : data.items.length === 0 ? (
          <EmptyState title="No alumni found" message="Try another search or filter." />
        ) : (
          <>
            <p className="mb-3 text-sm">
              {data.total} {data.total === 1 ? "alumnus" : "alumni"}
            </p>
            {/* Wide table scrolls inside its box on small screens, never the whole page */}
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-card">
              <table className="w-full min-w-[56rem] text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-body/70">
                  <tr>
                    <th scope="col" className="px-4 py-3">Name and contact</th>
                    <th scope="col" className="px-4 py-3">College and batch</th>
                    <th scope="col" className="px-4 py-3">Currently</th>
                    <th scope="col" className="px-4 py-3">Skills</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 align-top">
                  {data.items.map((a) => (
                    <tr key={a.user_id}>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/alumni/${a.user_id}`} className="font-semibold text-navy hover:underline">
                            {a.full_name}
                          </Link>
                          {a.is_verified && <Badge variant="verified">Verified</Badge>}
                          {a.status === "suspended" && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">Suspended</span>
                          )}
                        </div>
                        <a href={`mailto:${a.email}`} className="block break-all text-xs hover:underline">
                          {a.email}
                        </a>
                        {a.phone && (
                          <a href={`tel:${a.phone.replace(/[^+\d]/g, "")}`} className="block text-xs hover:underline">
                            {a.phone}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-navy">{a.institution}</p>
                        <p className="text-xs">
                          {a.branch} · {a.graduation_year}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-navy">{employmentLabel(a.employment_status) || "Not filled in"}</p>
                        {(a.job_title || a.current_company) && (
                          <p className="text-xs">{[a.job_title, a.current_company].filter(Boolean).join(" at ")}</p>
                        )}
                        {a.location && <p className="text-xs">{a.location}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs">{a.skills || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
