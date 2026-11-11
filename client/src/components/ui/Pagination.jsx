/**
 * Page-level pagination controls.
 *
 * Props come straight from the API pagination shape:
 *   { page, limit, total }
 *
 * onPageChange(newPage) is called when the user clicks Prev / Next
 * or a page number. The parent re-fetches with the new page.
 *
 * totalPages is derived here so every list page doesn't repeat
 * the same Math.ceil calculation.
 */
export default function Pagination({ page, limit, total, onPageChange }) {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <nav
      className="flex items-center justify-center gap-1 pt-6"
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg px-3 py-2 text-sm font-medium text-navy hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            p === page
              ? "bg-navy text-white"
              : "text-navy hover:bg-gray-100"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg px-3 py-2 text-sm font-medium text-navy hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </nav>
  );
}
