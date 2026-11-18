import { useState } from "react";
import api from "../../services/api";
import { Alert, Button, Modal, Textarea } from "../ui";

/**
 * "Request mentorship" dialog → POST /mentorship { alumni_id, message }.
 *
 * The match score is NOT sent; the server calculates it, so a student
 * cannot fake a high score.
 *
 * Errors the backend can return (shown to the user as-is):
 * – 403: the alumnus is not verified or not available for mentoring
 * – 409: you already have a pending or accepted request with them
 */
const MAX_LENGTH = 1000;

export default function RequestMentorshipModal({ alumnus, open, onClose, onSent }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const close = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Write a short message so they know how they can help.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const { request } = await api.post("/mentorship", {
        alumni_id: alumnus.user_id,
        message: message.trim(),
      });
      setMessage("");
      onSent?.(request);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title={`Request mentorship from ${alumnus?.full_name}`}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Alert>{error}</Alert>
        <Textarea
          id="mentorship-message"
          label="Your message"
          placeholder="Introduce yourself and say what you'd like help with, e.g. preparing for data engineering interviews."
          rows={5}
          maxLength={MAX_LENGTH}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="-mt-2 text-right text-xs">
          {message.length}/{MAX_LENGTH}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={sending}>
            {sending ? "Sending…" : "Send request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
