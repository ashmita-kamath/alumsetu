import { Link } from "react-router-dom";
import { Badge, Card } from "../ui";
import { formatDateTime } from "../../utils/format";

/**
 * Shared constants for events. The values must match the backend
 * (see docs/API.md, Events).
 */
export const EVENT_TYPES = [
  { value: "meetup", label: "Meetup" },
  { value: "webinar", label: "Webinar" },
  { value: "panel", label: "Panel discussion" },
  { value: "career_session", label: "Career session" },
];

export const eventTypeLabel = (value) => EVENT_TYPES.find((t) => t.value === value)?.label || value;

/** "12 / 50 registered", or "12 registered" when there is no limit. */
export function seatsText(count, capacity) {
  return capacity ? `${count} / ${capacity} registered` : `${count} registered`;
}

/** One event in a list. */
export default function EventCard({ event, extra }) {
  const full = event.capacity != null && event.registered_count >= event.capacity;

  return (
    <Card className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-orange/15 px-2.5 py-0.5 text-xs font-semibold text-orange-dark">
          {eventTypeLabel(event.type)}
        </span>
        <Badge>{event.mode === "online" ? "Online" : "In person"}</Badge>
        {full && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Full</span>}
      </div>

      <Link to={`/events/${event.id}`} className="font-heading text-lg font-bold text-navy hover:text-orange-dark">
        {event.title}
      </Link>

      <p className="text-sm font-semibold text-navy">{formatDateTime(event.start_time)}</p>
      <p className="text-sm">
        By {event.organizer?.full_name}
        {event.registered_count != null && <> · {seatsText(event.registered_count, event.capacity)}</>}
      </p>

      {extra && <div className="mt-auto pt-2">{extra}</div>}
    </Card>
  );
}
