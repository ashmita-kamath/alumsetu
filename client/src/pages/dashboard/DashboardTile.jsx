import { Link } from "react-router-dom";
import { Card } from "../../components/ui";

/** A clickable card on a dashboard that links to another page. */
export default function DashboardTile({ to, title, text }) {
  return (
    <Link to={to} className="group block focus:outline-none">
      <Card className="h-full transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-orange/50">
        <h3 className="font-bold group-hover:text-orange-dark">{title}</h3>
        <p className="mt-1 text-sm">{text}</p>
      </Card>
    </Link>
  );
}
