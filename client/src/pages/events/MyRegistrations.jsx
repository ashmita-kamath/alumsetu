import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import { Alert, EmptyState, PageLoader } from "../../components/ui";
import EventCard from "../../components/events/EventCard";

/**
 * Events I registered for → GET /me/registrations.
 * Split into upcoming and past so the next event is easy to find.
 */
export default function MyRegistrations() {
  const { data, loading, error } = useApi("/me/registrations");

  if (loading) return <PageLoader />;

  const now = new Date();
  const upcoming = (data || []).filter((e) => new Date(e.start_time) > now);
  const past = (data || []).filter((e) => new Date(e.start_time) <= now).reverse();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/events" className="text-sm font-semibold text-orange-dark hover:underline">
        ← All events
      </Link>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">My registrations</h1>

      {error ? (
        <Alert className="mt-6">{error.message}</Alert>
      ) : data.length === 0 ? (
        <EmptyState title="No registrations yet" message="Register for an event and it will show up here." />
      ) : (
        <>
          <Section title="Upcoming" events={upcoming} empty="No upcoming events." />
          {past.length > 0 && <Section title="Past" events={past} />}
        </>
      )}
    </div>
  );
}

function Section({ title, events, empty }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      {events.length === 0 ? (
        <p className="mt-2 text-sm">{empty}</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </section>
  );
}
