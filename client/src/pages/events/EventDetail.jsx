import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../hooks/useApi";
import api from "../../services/api";
import { Alert, Badge, Button, Card, PageLoader } from "../../components/ui";
import { eventTypeLabel, seatsText } from "../../components/events/EventCard";
import { formatDateTime } from "../../utils/format";

/**
 * One event → GET /events/:id → { event, registered_count, is_registered }
 *
 * – Students and alumni can Register (POST /events/:id/register) or
 *   Cancel (DELETE /events/:id/register) while the event is upcoming.
 * – The organizer or an admin sees who registered
 *   (GET /events/:id/registrations) and can delete the event.
 *
 * The backend enforces "full", "already registered" and "already
 * started" too; the buttons just avoid sending requests that would fail.
 */
export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(`/events/${id}`);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showAttendees, setShowAttendees] = useState(false);

  if (loading && !data) return <PageLoader />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Alert>{error.status === 404 ? "This event does not exist or was removed." : error.message}</Alert>
        <Link to="/events" className="mt-4 inline-block text-sm font-semibold text-orange-dark hover:underline">
          ← Back to events
        </Link>
      </div>
    );
  }

  const { event, registered_count, is_registered } = data;
  const isPast = new Date(event.start_time) <= new Date();
  const isFull = event.capacity != null && registered_count >= event.capacity;
  const canManage = event.organizer?.id === user.id || user.role === "admin";
  const canRegister = user.role === "student" || user.role === "alumni";
  const isLink = /^https?:\/\//i.test(event.venue_or_link);

  // Register or cancel, then reload so the seat count is fresh
  const toggleRegistration = async () => {
    setBusy(true);
    setActionError("");
    try {
      if (is_registered) await api.delete(`/events/${event.id}/register`);
      else await api.post(`/events/${event.id}/register`);
      reload();
    } catch (err) {
      setActionError(err.message); // e.g. 409 "This event is full"
    } finally {
      setBusy(false);
    }
  };

  const deleteEvent = async () => {
    if (!window.confirm("Delete this event? Everyone's registration will be removed.")) return;
    try {
      await api.delete(`/events/${event.id}`);
      navigate("/events", { replace: true });
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/events" className="text-sm font-semibold text-orange-dark hover:underline">
        ← Back to events
      </Link>

      <Alert className="mt-4">{actionError}</Alert>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-orange/15 px-2.5 py-0.5 text-xs font-semibold text-orange-dark">
            {eventTypeLabel(event.type)}
          </span>
          <Badge>{event.mode === "online" ? "Online" : "In person"}</Badge>
          {isPast && <Badge>Ended</Badge>}
        </div>

        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{event.title}</h1>
        <p className="mt-1 text-sm">Hosted by {event.organizer?.full_name}</p>

        <dl className="mt-6 grid gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-body/70">When</dt>
            <dd className="text-sm text-navy">{formatDateTime(event.start_time)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-body/70">
              {event.mode === "online" ? "Link" : "Venue"}
            </dt>
            <dd className="break-words text-sm text-navy">
              {isLink ? (
                <a href={event.venue_or_link} target="_blank" rel="noopener noreferrer" className="font-semibold text-orange-dark hover:underline">
                  Join meeting ↗
                </a>
              ) : (
                event.venue_or_link
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-body/70">Seats</dt>
            <dd className="text-sm text-navy">{seatsText(registered_count, event.capacity)}</dd>
          </div>
        </dl>

        {event.description && (
          <p className="mt-6 whitespace-pre-line border-t border-gray-100 pt-6 text-navy/90">{event.description}</p>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center">
          {canRegister && !isPast && (
            is_registered ? (
              <>
                <p className="text-sm font-semibold text-green-800">✓ You&apos;re registered</p>
                <Button variant="secondary" disabled={busy} onClick={toggleRegistration} className="sm:ml-auto">
                  {busy ? "Cancelling…" : "Cancel registration"}
                </Button>
              </>
            ) : (
              <Button disabled={busy || isFull} onClick={toggleRegistration}>
                {isFull ? "Event is full" : busy ? "Registering…" : "Register"}
              </Button>
            )
          )}
          {canManage && (
            <div className="flex gap-3 sm:ml-auto">
              <Button variant="secondary" onClick={() => setShowAttendees((s) => !s)} aria-expanded={showAttendees}>
                {showAttendees ? "Hide attendees" : `Attendees (${registered_count})`}
              </Button>
              <Button variant="ghost" onClick={deleteEvent} className="text-red-700">
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>

      {showAttendees && <Attendees eventId={event.id} />}
    </div>
  );
}

/** Organizer/admin view → GET /events/:id/registrations */
function Attendees({ eventId }) {
  const { data, loading, error } = useApi(`/events/${eventId}/registrations`);

  if (loading) return <PageLoader />;
  if (error) return <Alert className="mt-4">{error.message}</Alert>;

  return (
    <Card className="mt-4">
      <h2 className="text-lg font-bold">Attendees</h2>
      {data.length === 0 ? (
        <p className="mt-2 text-sm">No one has registered yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {data.map((r) => (
            <li key={r.user.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <p className="font-semibold text-navy">
                  {r.user.full_name} <span className="font-normal capitalize">· {r.user.role}</span>
                </p>
                <a href={`mailto:${r.user.email}`} className="text-orange-dark hover:underline">
                  {r.user.email}
                </a>
              </div>
              <span className="text-xs">Registered {formatDateTime(r.registered_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
