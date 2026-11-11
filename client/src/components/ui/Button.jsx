/**
 * Reusable button with three visual variants.
 *
 * variant="primary"   → orange background, dark text (high contrast)
 * variant="secondary" → navy outline, navy text
 * variant="ghost"     → no background, dark-orange text (used for links / low emphasis)
 *
 * All sizes are the same so the UI stays consistent; the parent
 * controls width via className (e.g. "w-full").
 */
export default function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  className = "",
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-orange/50 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-orange text-navy hover:bg-orange/90",
    secondary: "border border-navy text-navy hover:bg-navy hover:text-white",
    ghost: "text-orange-dark hover:underline",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
