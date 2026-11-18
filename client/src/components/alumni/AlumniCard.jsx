import { Link } from "react-router-dom";
import { Badge, Card } from "../ui";

/**
 * One alumnus in the directory grid or in mentor suggestions.
 * `alumnus` is the AlumniCard object from docs/API.md.
 *
 * The verified badge uses an icon + the word "Verified", so it does
 * not rely on colour alone.
 */
export default function AlumniCard({ alumnus, children }) {
  const role = [alumnus.job_title, alumnus.current_company].filter(Boolean).join(" at ");

  return (
    <Card className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            to={`/alumni/${alumnus.user_id}`}
            className="font-heading text-lg font-bold text-navy hover:text-orange-dark"
          >
            {alumnus.full_name}
          </Link>
          {role && <p className="truncate text-sm font-semibold text-navy/80">{role}</p>}
        </div>
        {alumnus.is_verified && <Badge variant="verified">Verified</Badge>}
      </div>

      <p className="text-sm">
        {alumnus.institution?.name}
        <br />
        {alumnus.branch} · Class of {alumnus.graduation_year}
        {alumnus.location && <> · {alumnus.location}</>}
      </p>

      {alumnus.skills?.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Skills">
          {alumnus.skills.slice(0, 6).map((s) => (
            <li key={s.id}>
              <Badge>{s.name}</Badge>
            </li>
          ))}
          {alumnus.skills.length > 6 && (
            <li>
              <Badge>+{alumnus.skills.length - 6}</Badge>
            </li>
          )}
        </ul>
      )}

      {/* Optional extra content, e.g. match reasons on the dashboard */}
      {children && <div className="mt-auto">{children}</div>}
    </Card>
  );
}
