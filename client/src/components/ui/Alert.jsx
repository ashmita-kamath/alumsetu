/**
 * A coloured message box for form results.
 *
 * variant="error"   → red   (e.g. "Wrong email or password")
 * variant="success" → green (e.g. "Profile saved")
 * variant="info"    → navy  (e.g. "Your account is awaiting verification")
 *
 * role="alert" makes screen readers announce errors immediately.
 */
export default function Alert({ children, variant = "error", className = "" }) {
  if (!children) return null;

  const variants = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-green-200 bg-green-50 text-green-800",
    info: "border-navy/20 bg-navy/5 text-navy",
  };

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
