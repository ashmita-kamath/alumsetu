import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { fieldErrors } from "../../services/api";
import { Alert, Button, Card, Input, Select, Textarea } from "../../components/ui";
import { CATEGORIES } from "../../components/forum/forumUtils";

/**
 * New forum post → POST /posts { title, body, category }.
 *
 * The backend runs the text through the moderation filter first.
 * If it contains blocked words it returns 422 CONTENT_BLOCKED, and we
 * show that message so the user can edit their post.
 */
export default function NewPost() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", category: "general", body: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const next = {};
    if (form.title.trim().length < 5) next.title = "Title must be at least 5 characters";
    if (form.body.trim().length < 10) next.body = "Write at least 10 characters";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const { post } = await api.post("/posts", {
        title: form.title.trim(),
        category: form.category,
        body: form.body.trim(),
      });
      navigate(`/forum/${post.id}`, { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/forum" className="text-sm font-semibold text-orange-dark hover:underline">
        ← Back to forum
      </Link>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">New post</h1>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <Alert>{serverError}</Alert>
          <Input
            id="title"
            name="title"
            label="Title"
            maxLength={200}
            placeholder="e.g. How did you prepare for campus placements?"
            value={form.title}
            onChange={handleChange}
            error={errors.title}
          />
          <Select
            id="category"
            name="category"
            label="Category"
            options={CATEGORIES}
            value={form.category}
            onChange={handleChange}
            error={errors.category}
          />
          <Textarea
            id="body"
            name="body"
            label="Your post"
            rows={8}
            value={form.body}
            onChange={handleChange}
            error={errors.body}
          />
          <p className="-mt-3 text-xs">Be respectful. Posts with abusive language are blocked automatically.</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => navigate("/forum")}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Posting…" : "Publish post"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
