import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Small pop-up messages ("toasts") that confirm an action worked,
 * e.g. "Account created successfully". They show in the top-right
 * corner and disappear after a few seconds.
 *
 * Any component can show one:
 *   const { showToast } = useToast();
 *   showToast("Account created successfully");
 *   showToast("Could not save", "error");
 *
 * It lives in a context (like AuthContext) because the page that shows
 * the toast often navigates away right after: the toast must survive
 * the page change, so it is drawn once at the top of the app.
 */
const ToastContext = createContext(null);

const DURATION_MS = 4000;

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // { id, message, type }
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(timerRef.current);
    setToast({ id: Date.now(), message, type });
    timerRef.current = setTimeout(() => setToast(null), DURATION_MS);
  }, []);

  // Stop the timer if the whole app unmounts
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* aria-live makes screen readers read the message out */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 top-20 z-[70] flex justify-center sm:inset-x-auto sm:right-4 sm:justify-end">
        {toast && (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg ${
              toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-green-200 bg-green-50 text-green-800"
            }`}
          >
            <span aria-hidden="true">{toast.type === "error" ? "!" : "✓"}</span>
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded px-1 opacity-70 hover:opacity-100"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
