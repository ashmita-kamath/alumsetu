import { useState } from "react";
import api, { uploadFile } from "../../services/api";
import { Alert, Button, Modal } from "../ui";

/**
 * "Apply" dialog for students.
 *
 * Two steps, because the API keeps files and data separate:
 * 1. If a resume is chosen, upload it → POST /uploads (kind "resume") → url
 * 2. Apply → POST /jobs/:id/apply { resume_url }
 *
 * The resume is optional (docs/API.md). We check type and size here so the
 * user gets instant feedback; the server checks again from the file's content.
 */
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

export default function ApplyModal({ job, open, onClose, onApplied }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(""); // "", "uploading", "applying"

  const close = () => {
    if (step) return; // don't close in the middle of sending
    setFile(null);
    setError("");
    onClose();
  };

  const chooseFile = (e) => {
    const chosen = e.target.files[0] || null;
    setError("");
    if (chosen && chosen.size > MAX_BYTES) {
      setError("Resume must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }
    setFile(chosen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      let resumeUrl = null;
      if (file) {
        setStep("uploading");
        resumeUrl = await uploadFile(file, "resume");
      }
      setStep("applying");
      const { application } = await api.post(`/jobs/${job.id}/apply`, { resume_url: resumeUrl });
      setStep("");
      setFile(null);
      onApplied(application);
    } catch (err) {
      setStep("");
      setError(err.message); // e.g. 409 already applied, 400 deadline passed
    }
  };

  return (
    <Modal open={open} onClose={close} title={`Apply: ${job.title}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Alert>{error}</Alert>
        <p className="text-sm">
          {job.company} will see your name and email. Attach a resume to stand out (optional).
        </p>
        <div className="flex flex-col gap-1">
          <label htmlFor="resume" className="text-sm font-semibold text-navy">
            Resume (PDF, JPG or PNG, up to 5 MB)
          </label>
          <input
            id="resume"
            type="file"
            accept={ACCEPT}
            onChange={chooseFile}
            className="text-sm text-navy file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-navy/90"
          />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={close} disabled={Boolean(step)}>
            Cancel
          </Button>
          <Button type="submit" disabled={Boolean(step)}>
            {step === "uploading" ? "Uploading resume…" : step === "applying" ? "Applying…" : "Submit application"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
