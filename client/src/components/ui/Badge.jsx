/**
 * Small pill label used for tags (skills, status, verified, etc.).
 *
 * variant="default" → gray background
 * variant="verified" → green background + checkmark icon
 *
 * The "verified" variant is the Verified Alumni badge required
 * by the design rules: icon + the word, not colour alone.
 */
export default function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-gray-100 text-navy",
    verified: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {variant === "verified" && (
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      {children}
    </span>
  );
}
