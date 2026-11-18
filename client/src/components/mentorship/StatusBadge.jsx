/**
 * Coloured pill for a mentorship request status.
 * The status is written out in words, so it is not shown by colour alone.
 */
const STYLES = {
  pending: "bg-yellow-100 text-yellow-900",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  completed: "bg-navy/10 text-navy",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        STYLES[status] || "bg-gray-100 text-navy"
      }`}
    >
      {status}
    </span>
  );
}
