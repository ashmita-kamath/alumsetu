/**
 * A row of pill buttons for picking one filter, e.g. Upcoming / Past.
 * Scrolls sideways on small phones instead of wrapping.
 *
 * – tabs:     [{ value, label }]
 * – value:    the selected value
 * – onChange: called with the clicked tab's value
 */
export default function FilterTabs({ tabs, value, onChange, label }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4" role="tablist" aria-label={label}>
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={value === t.value}
            onClick={() => onChange(t.value)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              value === t.value ? "bg-navy text-white" : "bg-white text-navy hover:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
