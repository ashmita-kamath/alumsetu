/**
 * Shown when a list fetch returns zero items.
 *
 * – title:   bold heading  (e.g. "No alumni found")
 * – message: helper text   (e.g. "Try changing your filters.")
 *
 * Keeps the UI from looking broken when there's nothing to show.
 */
export default function EmptyState({ title, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        className="mb-4 h-16 w-16 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <h3 className="text-lg font-semibold text-navy">{title}</h3>
      {message && <p className="mt-1 text-sm text-body">{message}</p>}
    </div>
  );
}
