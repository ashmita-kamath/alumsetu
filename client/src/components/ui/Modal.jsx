import { useEffect, useRef } from "react";

/**
 * A centred dialog box shown on top of the page.
 *
 * – open:    whether the modal is visible
 * – onClose: called when the user presses Escape, clicks the dark
 *            backdrop, or clicks the × button
 * – title:   heading shown at the top
 * – children: the body (usually a small form)
 *
 * ACCESSIBILITY
 * role="dialog" + aria-modal tell screen readers this is a dialog.
 * When it opens we move keyboard focus into the dialog so Tab and
 * Escape work straight away.
 */
export default function Modal({ open, onClose, title, children }) {
  const dialogRef = useRef(null);

  // Keep the latest onClose in a ref. The parent creates a new onClose
  // function on every render; if the effect below depended on it, the
  // effect would re-run while the user types and steal their focus.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    // Close on Escape
    const onKeyDown = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);

    // Stop the page behind the modal from scrolling
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    dialogRef.current?.focus();

    // Cleanup runs when the modal closes or unmounts
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-navy/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl focus:outline-none"
        // Clicks inside the box must not reach the backdrop's onClick
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-navy hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
