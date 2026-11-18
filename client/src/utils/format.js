/**
 * Date helpers shared by the events and jobs pages.
 * All dates from the API are ISO strings; we show them in Indian format.
 */

/** "Sat, 22 Nov 2026, 6:00 pm" */
export function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "22 Nov 2026" */
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Value for <input type="datetime-local"> one hour from now, rounded to the
 * hour, e.g. "2026-11-19T15:00". Used as the earliest allowed start time.
 */
export function nextHourLocal() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

/** Today as "YYYY-MM-DD" in the user's own time zone (for <input type="date" min>). */
export function todayLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
