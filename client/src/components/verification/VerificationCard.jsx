import { useRef, useState } from "react";
import useApi from "../../hooks/useApi";
import api, { uploadFile } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Alert, Button, Card, Spinner } from "../ui";
import { formatDate } from "../../utils/format";

/**
 * Alumni dashboard card for getting verified.
 *
 * Shows the latest request (GET /verification/me) and what to do next:
 *   none     → upload proof
 *   pending  → "under review"
 *   rejected → the admin's reason + upload again
 * Verified alumni don't see this card (the dashboard shows the badge).
 *
 * Upload is two steps, like the resume:
 *   1. POST /uploads (kind "verification") → private file URL
 *   2. POST /verification { document_url }
 */
const MAX_BYTES = 5 * 1024 * 1024;

export default function VerificationCard() {
  const { showToast } = useToast();
  const { data: latest, loading, setData } = useApi("/verification/me");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(""); // "", "uploading", "submitting"
  const inputRef = useRef(null);

  const chooseFile = (e) => {
    const chosen = e.target.files[0] || null;
    setError("");
    if (chosen && chosen.size > MAX_BYTES) {
      setError("File must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }
    setFile(chosen);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Choose your degree certificate, alumni ID or final-year marksheet.");
      return;
    }
    setError("");
    try {
      setStep("uploading");
      const url = await uploadFile(file, "verification");
      setStep("submitting");
      const { request } = await api.post("/verification", { document_url: url });
      setData(request);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      showToast("Proof submitted. An admin will review it soon.");
    } catch (err) {
      setError(err.message); // e.g. "Complete your profile before asking for verification"
    } finally {
      setStep("");
    }
  };

  if (loading) {
    return (
      <Card className="mt-6 flex justify-center">
        <Spinner />
      </Card>
    );
  }

  if (latest?.status === "pending") {
    return (
      <Alert variant="info" className="mt-6">
        Your proof was submitted on {formatDate(latest.submitted_at)} and is waiting for an admin to review it.
      </Alert>
    );
  }

  return (
    <Card className="mt-6">
      <h2 className="text-lg font-bold">Get your Verified Alumni badge</h2>
      {latest?.status === "rejected" ? (
        <Alert className="mt-3">
          Your last request was not approved{latest.remarks ? `: “${latest.remarks}”` : "."} Please upload a clearer document.
        </Alert>
      ) : (
        <p className="mt-1 text-sm">
          Verified alumni appear in mentor suggestions and can post jobs and events. Upload a degree certificate, alumni ID or
          final-year marksheet. Only admins can see it.
        </p>
      )}

      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor="proof" className="sr-only">
          Proof document
        </label>
        <input
          ref={inputRef}
          id="proof"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={chooseFile}
          className="min-w-0 flex-1 text-sm text-navy file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-navy/90"
        />
        <Button type="submit" disabled={Boolean(step)}>
          {step === "uploading" ? "Uploading…" : step === "submitting" ? "Submitting…" : "Submit proof"}
        </Button>
      </form>
      <p className="mt-2 text-xs">PDF, JPG or PNG, up to 5 MB.</p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
