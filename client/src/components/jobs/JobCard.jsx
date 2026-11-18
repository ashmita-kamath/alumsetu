import { Link } from "react-router-dom";
import { Badge, Card } from "../ui";
import { formatDate } from "../../utils/format";

/**
 * Shared constants for jobs. Values must match the backend (docs/API.md, Jobs).
 */
export const JOB_TYPES = [
  { value: "job", label: "Full-time job" },
  { value: "internship", label: "Internship" },
  { value: "referral", label: "Referral" },
];

export const jobTypeLabel = (value) => JOB_TYPES.find((t) => t.value === value)?.label || value;

/** Colours for an application's status (always shown with the word too). */
export const STATUS_STYLES = {
  applied: "bg-navy/10 text-navy",
  shortlisted: "bg-yellow-100 text-yellow-900",
  selected: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export function StatusPill({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status] || ""}`}>
      {status}
    </span>
  );
}

/** One job in the list. */
export default function JobCard({ job }) {
  return (
    <Card className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-orange/15 px-2.5 py-0.5 text-xs font-semibold text-orange-dark">
          {jobTypeLabel(job.type)}
        </span>
        {!job.is_open && <Badge>Closed</Badge>}
      </div>

      <Link to={`/jobs/${job.id}`} className="font-heading text-lg font-bold text-navy hover:text-orange-dark">
        {job.title}
      </Link>
      <p className="text-sm font-semibold text-navy">
        {job.company}
        {job.location && <span className="font-normal"> · {job.location}</span>}
      </p>
      <p className="mt-auto pt-2 text-xs">
        Posted by {job.posted_by?.full_name}
        {job.deadline && <> · Apply by {formatDate(job.deadline)}</>}
      </p>
    </Card>
  );
}
