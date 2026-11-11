/**
 * A spinning circle shown while data is loading.
 *
 * size="sm"  → 16 px  (inline, next to text)
 * size="md"  → 24 px  (inside a button)
 * size="lg"  → 40 px  (center of a page section)
 *
 * The spinner is navy-coloured so it shows well on both
 * the cream background and white cards.
 */
export default function Spinner({ size = "md", className = "" }) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };

  return (
    <svg
      className={`animate-spin text-navy ${sizes[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
