import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../hooks/useApi";
import useCanPost from "../../hooks/useCanPost";
import { toQuery } from "../../services/api";
import { Alert, EmptyState, Input, PageLoader, Pagination, Select } from "../../components/ui";
import JobCard, { JOB_TYPES } from "../../components/jobs/JobCard";

/**
 * Jobs board → GET /jobs?search=&type=&location=&include_closed=&page=
 *
 * Closed jobs (deadline passed) are hidden unless "Show closed" is ticked.
 * Filters live in the URL like the other list pages.
 */
const PAGE_SIZE = 12;

export default function JobsList() {
  const { user } = useAuth();
  const { canPost } = useCanPost();
  const [params, setParams] = useSearchParams();

  const search = params.get("search") || "";
  const location = params.get("location") || "";
  const type = params.get("type") || "";
  const includeClosed = params.get("include_closed") === "true";
  const page = Number(params.get("page")) || 1;

  // Text boxes update the URL 400 ms after the user stops typing
  const [searchText, setSearchText] = useState(search);
  const [locationText, setLocationText] = useState(location);

  const { data, loading, error } = useApi(
    `/jobs${toQuery({ search, location, type, include_closed: includeClosed, page, limit: PAGE_SIZE })}`
  );

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  useEffect(() => {
    if (searchText.trim() === search && locationText.trim() === location) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      for (const [key, value] of [["search", searchText.trim()], ["location", locationText.trim()]]) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      next.delete("page");
      setParams(next);
    }, 400);
    return () => clearTimeout(timer);
    // Only re-run when the typed text changes
  }, [searchText, locationText]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Jobs and referrals</h1>
          <p className="mt-1 text-sm">Openings shared by verified alumni.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {user.role === "student" && (
            <Link to="/applications" className="inline-flex items-center rounded-lg border border-navy px-5 py-2.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white">
              My applications
            </Link>
          )}
          {canPost && (
            <Link to="/jobs/new" className="inline-flex items-center rounded-lg bg-orange px-5 py-2.5 text-sm font-semibold text-navy hover:bg-orange/90">
              + Post a job
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-xl border border-gray-100 bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input id="job-search" type="search" label="Search" placeholder="Title or company" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        <Input id="job-location" label="Location" placeholder="e.g. Bengaluru" value={locationText} onChange={(e) => setLocationText(e.target.value)} />
        <Select
          id="job-type"
          label="Type"
          options={[{ value: "", label: "All types" }, ...JOB_TYPES]}
          value={type}
          onChange={(e) => setParam("type", e.target.value)}
        />
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-navy">
          <input
            type="checkbox"
            className="h-4 w-4 accent-orange"
            checked={includeClosed}
            onChange={(e) => setParam("include_closed", e.target.checked ? "true" : "")}
          />
          Show closed jobs
        </label>
      </div>

      <div className="mt-6">
        {error ? (
          <Alert>{error.message}</Alert>
        ) : loading && !data ? (
          <PageLoader />
        ) : data?.items.length === 0 ? (
          <EmptyState title="No jobs found" message="Try another search, or tick “Show closed jobs”." />
        ) : data ? (
          <>
            <p className="mb-3 text-sm" aria-live="polite">
              {data.total} {data.total === 1 ? "opening" : "openings"}
            </p>
            <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
              {data.items.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
            <Pagination
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPageChange={(p) => {
                setParam("page", String(p));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
