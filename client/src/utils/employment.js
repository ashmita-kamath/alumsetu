// Alumni employment status (matches the employment_status enum in the database)
export const EMPLOYMENT_STATUSES = [
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-employed / Entrepreneur" },
  { value: "higher_studies", label: "Higher studies" },
  { value: "seeking", label: "Looking for a job" },
  { value: "other", label: "Other" },
];

export const employmentLabel = (value) => EMPLOYMENT_STATUSES.find((s) => s.value === value)?.label || "";
