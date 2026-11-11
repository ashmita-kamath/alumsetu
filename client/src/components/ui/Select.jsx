/**
 * Styled <select> dropdown with a label.
 *
 * – options: array of { value, label } objects
 * – placeholder: first disabled option (e.g. "Choose one…")
 * – error: validation message shown below
 */
export default function Select({
  label,
  options = [],
  placeholder,
  error,
  className = "",
  ...rest
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-navy">{label}</label>
      )}
      <select
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/50 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
