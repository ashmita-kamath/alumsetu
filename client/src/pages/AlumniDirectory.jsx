import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useApi from "../hooks/useApi";
import { toQuery } from "../services/api";
import { Alert, Button, EmptyState, Input, PageLoader, Pagination, Select } from "../components/ui";
import AlumniCard from "../components/alumni/AlumniCard";

/**
 * Alumni directory → GET /alumni with filters and pagination.
 *
 * WHERE THE FILTERS LIVE
 * All filters are stored in the URL query string
 * (e.g. /alumni?branch=CSE&verified=true&page=2) instead of React
 * state. That means:
 *   – the browser Back button undoes a filter change,
 *   – a filtered list can be shared as a link,
 *   – a refresh keeps the filters.
 * We read them with useSearchParams and send the same values to
 * the API, so the URL and the request always match.
 */
const PAGE_SIZE = 12;

const BRANCHES = ["CSE", "IT", "ECE", "EE", "ME", "CE", "Chemical", "Mining"];
const SORT_OPTIONS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "graduation_year", label: "Newest batch first" },
];

export default function AlumniDirectory() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Read the current filters from the URL
  const filters = {
    search: params.get("search") || "",
    institution_id: params.get("institution_id") || "",
    branch: params.get("branch") || "",
    graduation_year: params.get("graduation_year") || "",
    skill_id: params.get("skill_id") || "",
    verified: params.get("verified") === "true",
    mentoring: params.get("mentoring") === "true",
    sort: params.get("sort") || "name",
  };
  const page = Number(params.get("page")) || 1;

  // The search box has its own state so typing feels instant;
  // the URL (and the API call) updates 400 ms after the last key.
  const [searchText, setSearchText] = useState(filters.search);

  // Dropdown options
  const { data: institutions } = useApi("/institutions");
  const { data: skills } = useApi("/skills");

  const { data, loading, error } = useApi(
    `/alumni${toQuery({ ...filters, page, limit: PAGE_SIZE })}`
  );

  // Changing any filter goes back to page 1
  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === "" || value === false) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    setParams(next);
  };

  useEffect(() => {
    if (searchText.trim() === filters.search) return;
    const timer = setTimeout(() => setFilter("search", searchText.trim()), 400);
    return () => clearTimeout(timer);
    // Only re-run when the typed text changes
    // (setFilter is a new function every render).
  }, [searchText]);

  const goToPage = (p) => {
    const next = new URLSearchParams(params);
    next.set("page", p);
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSearchText("");
    setParams({});
  };

  const activeCount = ["institution_id", "branch", "graduation_year", "skill_id", "verified", "mentoring"].filter(
    (k) => filters[k]
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">Alumni directory</h1>
      <p className="mt-1 text-sm">Find alumni by name, company, college, branch or skill.</p>

      {/* Search + sort row */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          id="search"
          type="search"
          label="Search"
          placeholder="Name, company or job title"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="flex-1"
        />
        <Select
          id="sort"
          label="Sort by"
          options={SORT_OPTIONS}
          value={filters.sort}
          onChange={(e) => setFilter("sort", e.target.value === "name" ? "" : e.target.value)}
          className="sm:w-48"
        />
        {/* Filters are always visible on desktop; a toggle shows them on mobile */}
        <Button
          variant="secondary"
          className="md:hidden"
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
        >
          Filters{activeCount > 0 && ` (${activeCount})`}
        </Button>
      </div>

      {/* Filter panel */}
      <div
        className={`mt-4 grid gap-3 rounded-xl border border-gray-100 bg-card p-4 sm:grid-cols-2 lg:grid-cols-4 ${
          showFilters ? "grid" : "hidden md:grid"
        }`}
      >
        <Select
          id="institution_id"
          label="College"
          options={[
            { value: "", label: "All colleges" },
            ...(institutions || []).map((i) => ({ value: String(i.id), label: i.name })),
          ]}
          value={filters.institution_id}
          onChange={(e) => setFilter("institution_id", e.target.value)}
        />
        <Select
          id="branch"
          label="Branch"
          options={[{ value: "", label: "All branches" }, ...BRANCHES.map((b) => ({ value: b, label: b }))]}
          value={filters.branch}
          onChange={(e) => setFilter("branch", e.target.value)}
        />
        <Input
          id="graduation_year"
          type="number"
          inputMode="numeric"
          label="Graduation year"
          placeholder="Any"
          value={filters.graduation_year}
          onChange={(e) => setFilter("graduation_year", e.target.value)}
        />
        <Select
          id="skill_id"
          label="Skill"
          options={[
            { value: "", label: "Any skill" },
            ...(skills || []).map((s) => ({ value: String(s.id), label: s.name })),
          ]}
          value={filters.skill_id}
          onChange={(e) => setFilter("skill_id", e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:col-span-2 lg:col-span-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-navy">
            <input
              type="checkbox"
              className="h-4 w-4 accent-orange"
              checked={filters.verified}
              onChange={(e) => setFilter("verified", e.target.checked ? "true" : "")}
            />
            Verified only
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-navy">
            <input
              type="checkbox"
              className="h-4 w-4 accent-orange"
              checked={filters.mentoring}
              onChange={(e) => setFilter("mentoring", e.target.checked ? "true" : "")}
            />
            Open to mentoring
          </label>
          {(activeCount > 0 || filters.search) && (
            <Button variant="ghost" className="px-0 sm:ml-auto" onClick={clearFilters}>
              Clear all filters
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {error ? (
          <Alert>{error.message}</Alert>
        ) : loading && !data ? (
          <PageLoader />
        ) : data?.items.length === 0 ? (
          <EmptyState title="No alumni found" message="Try removing a filter or searching for something else." />
        ) : data ? (
          <>
            <p className="mb-3 text-sm" aria-live="polite">
              {data.total} {data.total === 1 ? "alumnus" : "alumni"} found
            </p>
            <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
              {data.items.map((a) => (
                <AlumniCard key={a.user_id} alumnus={a} />
              ))}
            </div>
            <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={goToPage} />
          </>
        ) : null}
      </div>
    </div>
  );
}
