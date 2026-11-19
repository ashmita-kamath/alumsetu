import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCanPost from "../../hooks/useCanPost";
import api, { fieldErrors } from "../../services/api";
import { Alert, Button, Card, Input, PageLoader, Select, Textarea } from "../../components/ui";
import { JOB_TYPES } from "../../components/jobs/JobCard";
import { todayLocal } from "../../utils/format";

/**
 * Post a job → POST /jobs (verified alumni only).
 * The deadline is optional; when set, applications close after that day.
 */
export default function PostJob() {
  const navigate = useNavigate();
  const { canPost, loading } = useCanPost();

  const [form, setForm] = useState({ title: "", company: "", type: "job", location: "", deadline: "", description: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const next = {};
    if (form.title.trim().length < 2) next.title = "Title is required";
    if (form.company.trim().length < 2) next.company = "Company is required";
    if (form.deadline && form.deadline < todayLocal()) next.deadline = "Deadline cannot be in the past";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const { job } = await api.post("/jobs", {
        title: form.title.trim(),
        company: form.company.trim(),
        type: form.type,
        location: form.location.trim() || null,
        deadline: form.deadline || null, // already "YYYY-MM-DD" from <input type="date">
        description: form.description.trim() || null,
      });
      navigate(`/jobs/${job.id}`, { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setServerError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/jobs" className="text-sm font-semibold text-orange-dark hover:underline">
        ← Back to jobs
      </Link>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Post a job</h1>

      {!canPost ? (
        <Alert variant="info" className="mt-6">
          Only verified alumni can post jobs. Once an admin approves your alumni proof, you can share openings here.
        </Alert>
      ) : (
        <Card className="mt-6">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <Alert>{serverError}</Alert>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input id="title" name="title" label="Job title" maxLength={150} placeholder="e.g. Data Engineer" value={form.title} onChange={handleChange} error={errors.title} />
              <Input id="company" name="company" label="Company" maxLength={150} value={form.company} onChange={handleChange} error={errors.company} />
              <Select id="type" name="type" label="Type" options={JOB_TYPES} value={form.type} onChange={handleChange} error={errors.type} />
              <Input id="location" name="location" label="Location (optional)" maxLength={100} placeholder="e.g. Bengaluru or Remote" value={form.location} onChange={handleChange} error={errors.location} />
              <Input id="deadline" name="deadline" type="date" label="Apply by (optional)" min={todayLocal()} value={form.deadline} onChange={handleChange} error={errors.deadline} />
            </div>
            <Textarea
              id="description"
              name="description"
              label="Description (optional)"
              rows={6}
              maxLength={5000}
              placeholder="Role, skills needed, how referrals work…"
              value={form.description}
              onChange={handleChange}
              error={errors.description}
            />
            <Button type="submit" disabled={saving} className="w-full sm:w-auto sm:self-end">
              {saving ? "Posting…" : "Post job"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
