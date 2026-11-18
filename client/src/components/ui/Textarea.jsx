/**
 * Multi-line text box with a label. Same look as Input.
 *
 * – label: shown above the box
 * – error: if truthy, shown in red below the box
 * – All other props (rows, value, onChange…) go to the native <textarea>.
 */
export default function Textarea({ label, error, id, className = "", rows = 4, ...rest }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-navy">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy placeholder:text-body/50 focus:outline-none focus:ring-2 focus:ring-orange/50 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        {...rest}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
