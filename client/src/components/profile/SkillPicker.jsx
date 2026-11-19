import { useEffect, useId, useState } from "react";
import api from "../../services/api";

/**
 * Lets the user pick skills from the master list, or add a new one.
 *
 * – value:    the chosen skills, [{ id, name }]
 * – onChange: called with the new array
 *
 * HOW IT WORKS
 * 1. As the user types, we wait 300 ms after the last key press
 *    ("debounce") and then call GET /skills?search=<text>, so we
 *    don't send one request per letter.
 * 2. Clicking a suggestion adds it as a chip.
 * 3. If nothing matches exactly, "Add <text>" calls POST /skills,
 *    which creates the skill (or returns the existing one).
 * 4. The × on a chip removes it.
 */
export default function SkillPicker({ value, onChange, label = "Skills" }) {
  const inputId = useId();
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const search = text.trim();

  useEffect(() => {
    if (!search) {
      setSuggestions([]);
      return;
    }
    let ignore = false;
    const timer = setTimeout(() => {
      api
        .get(`/skills?search=${encodeURIComponent(search)}`)
        .then((skills) => {
          if (!ignore) setSuggestions(skills);
        })
        .catch(() => {
          if (!ignore) setSuggestions([]);
        });
    }, 300);

    // Runs when the user types again: cancel the pending search
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [search]);

  const chosenIds = new Set(value.map((s) => s.id));
  const lower = search.toLowerCase();

  // Best match first: an exact match, then names that start with the text,
  // then the rest. Otherwise typing "SQL" + Enter would pick "PostgreSQL",
  // because the API returns skills in alphabetical order.
  const rank = (s) => {
    const name = s.name.toLowerCase();
    if (name === lower) return 0;
    if (name.startsWith(lower)) return 1;
    return 2;
  };
  const visible = suggestions
    .filter((s) => !chosenIds.has(s.id))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, 8);
  const exactMatch = suggestions.some((s) => s.name.toLowerCase() === lower);

  const addSkill = (skill) => {
    if (!chosenIds.has(skill.id)) onChange([...value, skill]);
    setText("");
    setSuggestions([]);
    setError("");
  };

  const createSkill = async () => {
    setAdding(true);
    setError("");
    try {
      const { skill } = await api.post("/skills", { name: search });
      addSkill(skill);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // Enter picks the first suggestion (or creates the skill) instead of submitting the form
  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (visible.length > 0) addSkill(visible[0]);
    else if (search && !exactMatch && !adding) createSkill();
  };

  const removeSkill = (id) => onChange(value.filter((s) => s.id !== id));

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-semibold text-navy">
        {label}
      </label>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((s) => (
            <li
              key={s.id}
              className="inline-flex items-center gap-1 rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white"
            >
              {s.name}
              <button
                type="button"
                onClick={() => removeSkill(s.id)}
                className="ml-1 rounded-full px-1 hover:bg-white/20"
                aria-label={`Remove ${s.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a skill, e.g. Python"
          autoComplete="off"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-navy placeholder:text-body/50 focus:outline-none focus:ring-2 focus:ring-orange/50"
        />

        {search && (visible.length > 0 || !exactMatch) && (
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {visible.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => addSkill(s)}
                  className="block w-full px-3 py-2 text-left text-sm text-navy hover:bg-cream"
                >
                  {s.name}
                </button>
              </li>
            ))}
            {!exactMatch && (
              <li>
                <button
                  type="button"
                  onClick={createSkill}
                  disabled={adding}
                  className="block w-full px-3 py-2 text-left text-sm font-semibold text-orange-dark hover:bg-cream disabled:opacity-50"
                >
                  {adding ? "Adding…" : `+ Add "${search}"`}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
