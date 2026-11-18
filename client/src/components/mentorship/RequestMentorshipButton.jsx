import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui";
import RequestMentorshipModal from "./RequestMentorshipModal";

/**
 * Button that opens the request dialog. Rendered only when it makes
 * sense: the viewer is a student, and the alumnus is verified and
 * open to mentoring (same rule the backend enforces with 403).
 *
 * After sending, the button turns into a link to "My requests".
 */
export default function RequestMentorshipButton({ alumnus, className = "" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  if (user?.role !== "student" || !alumnus.is_verified || !alumnus.available_for_mentoring) {
    return null;
  }

  if (sent) {
    return (
      <p className={`text-sm font-semibold text-green-800 ${className}`}>
        ✓ Request sent.{" "}
        <Link to="/mentorship/requests" className="text-orange-dark underline">
          View my requests
        </Link>
      </p>
    );
  }

  return (
    <>
      <Button className={className} onClick={() => setOpen(true)}>
        Request mentorship
      </Button>
      <RequestMentorshipModal
        alumnus={alumnus}
        open={open}
        onClose={() => setOpen(false)}
        onSent={() => setSent(true)}
      />
    </>
  );
}
