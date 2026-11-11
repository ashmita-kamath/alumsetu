/**
 * Styled text input with a label.
 *
 * – label: shown above the input
 * – error: if truthy, shown in red below the input
 * – All other props (type, placeholder, value, onChange…) are
 *   forwarded to the native <input>.
 */
export default function Input({
  label,
  error,
  className = "",
  ...rest
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-navy">{label}</label>
      )}
      <input
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy placeholder:text-body/50 focus:outline-none focus:ring-2 focus:ring-orange/50 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        {...rest}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
