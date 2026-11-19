import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../hooks/useApi";
import useCanPost from "../../hooks/useCanPost";
import { toQuery } from "../../services/api";
import { Alert, EmptyState, FilterTabs, PageLoader, Pagination, Select } from "../../components/ui";
import EventCard, { EVENT_TYPES } from "../../components/events/EventCard";

/**
 * Events list → GET /events?when=upcoming|past&type=&page=
 *
 * Filters live in the URL (like the directory and forum), so Back,
 * refresh and shared links keep them.
 */
const PAGE_SIZE = 12;

export default function EventsList() {
  const { user } = useAuth();
  const { canPost } = useCanPost({ adminsToo: true });
  const [params, setParams] = useSearchParams();
  const when = params.get("when") || "upcoming";
  const type = params.get("type") || "";
  const page = Number(params.get("page")) || 1;

  const { data, loading, error } = useApi(`/events${toQuery({ when, type, page, limit: PAGE_SIZE })}`);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && !(key === "when" && value === "upcoming")) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Events</h1>
          <p className="mt-1 text-sm">Meetups, webinars and career sessions hosted by alumni.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {user.role !== "admin" && (
            <Link to="/events/my" className="inline-flex items-center rounded-lg border border-navy px-5 py-2.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white">
              My registrations
            </Link>
          )}
          {canPost && (
            <Link to="/events/new" className="inline-flex items-center rounded-lg bg-orange px-5 py-2.5 text-sm font-semibold text-navy hover:bg-orange/90">
              + Create event
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <FilterTabs
          label="When"
          tabs={[
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "Past" },
          ]}
          value={when}
          onChange={(v) => setParam("when", v)}
        />
        <Select
          id="event-type"
          label="Type"
          options={[{ value: "", label: "All types" }, ...EVENT_TYPES]}
          value={type}
          onChange={(e) => setParam("type", e.target.value)}
          className="sm:w-56"
        />
      </div>

      <div className="mt-6">
        {error ? (
          <Alert>{error.message}</Alert>
        ) : loading && !data ? (
          <PageLoader />
        ) : data?.items.length === 0 ? (
          <EmptyState
            title={when === "past" ? "No past events" : "No upcoming events"}
            message={canPost ? "Create one to bring students and alumni together." : "Check back soon."}
          />
        ) : data ? (
          <>
            <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
              {data.items.map((e) => (
                <EventCard key={e.id} event={e} />
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
