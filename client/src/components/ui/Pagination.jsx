/**
 * Page-level pagination controls.
 *
 * Props come straight from the API pagination shape:
 *   { page, limit, total }
 *
 * onPageChange(newPage) is called when the user clicks Prev / Next
 * or a page number. The parent re-fetches with the new page.
 *
 * With many pages we don't show every number (it would overflow on a
 * phone). We show the first, the last, and the pages next to the
 * current one, with "…" for the gaps:  1 … 4 [5] 6 … 12
 */
function pageList(page, totalPages) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }
  return pages;
}

export default function Pagination({ page, limit, total, onPageChange }) {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1 pt-6"
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg px-3 py-2 text-sm font-medium text-navy hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      {pageList(page, totalPages).map((p, index) =>
        p === "…" ? (
          <span key={`gap-${index}`} className="px-2 text-sm text-body">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              p === page ? "bg-navy text-white" : "text-navy hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        )
      )}

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
