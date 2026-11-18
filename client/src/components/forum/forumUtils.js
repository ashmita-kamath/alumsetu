/**
 * Shared forum constants and helpers.
 * The category values must match the backend (see docs/API.md, Forum).
 */
export const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "careers", label: "Careers" },
  { value: "academics", label: "Academics" },
  { value: "placements", label: "Placements" },
];

export const categoryLabel = (value) =>
  CATEGORIES.find((c) => c.value === value)?.label || value;

/** "5 min ago", "3 days ago", or a date for anything older than a week. */
export function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
