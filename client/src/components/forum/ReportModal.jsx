import { useState } from "react";
import api from "../../services/api";
import { Alert, Button, Modal } from "../ui";

/**
 * "Report" dialog → POST /reports { post_id | comment_id, reason }.
 *
 * `target` is { post_id } or { comment_id }. An admin reviews the
 * report later; if they approve it, the content is hidden.
 */
const REASONS = ["Spam or advertising", "Abusive or hateful", "Harassment", "False information", "Other"];

export default function ReportModal({ target, open, onClose }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const close = () => {
    setError("");
    setDone(false);
    setDetails("");
    setReason(REASONS[0]);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // The database column holds up to 200 characters
    const fullReason = (reason === "Other" || details.trim() ? `${reason}: ${details.trim()}` : reason).slice(0, 200);
    if (reason === "Other" && !details.trim()) {
      setError("Please describe the problem.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await api.post("/reports", { ...target, reason: fullReason });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title={target?.comment_id ? "Report comment" : "Report post"}>
      {done ? (
        <div className="flex flex-col gap-4">
          <Alert variant="success">Thanks. An admin will review this report.</Alert>
          <Button onClick={close} className="self-end">
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Alert>{error}</Alert>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-navy">What&apos;s wrong with it?</legend>
            {REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm text-navy">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="h-4 w-4 accent-orange"
                />
                {r}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-1">
            <label htmlFor="report-details" className="text-sm font-semibold text-navy">
              More details {reason !== "Other" && <span className="font-normal">(optional)</span>}
            </label>
            <input
              id="report-details"
              type="text"
              maxLength={150}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/50"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send report"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
