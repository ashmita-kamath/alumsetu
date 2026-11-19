import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCanPost from "../../hooks/useCanPost";
import api, { fieldErrors } from "../../services/api";
import { Alert, Button, Card, Input, PageLoader, Select, Textarea } from "../../components/ui";
import { EVENT_TYPES } from "../../components/events/EventCard";
import { nextHourLocal } from "../../utils/format";

/**
 * Create event → POST /events (verified alumni and admins).
 *
 * The start time comes from <input type="datetime-local">, which gives
 * local time without a zone ("2026-11-25T18:00"). new Date(value) reads
 * it as local time and toISOString() converts it to UTC for the API,
 * so a 6 pm event in India is stored correctly.
 */
export default function CreateEvent() {
  const navigate = useNavigate();
  const { canPost, isUnverifiedAlumnus, loading } = useCanPost({ adminsToo: true });

  const [form, setForm] = useState({
    title: "",
    type: "webinar",
    mode: "online",
    venue_or_link: "",
    start_time: "",
    capacity: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const next = {};
    if (form.title.trim().length < 3) next.title = "Title must be at least 3 characters";
    if (form.venue_or_link.trim().length < 3) next.venue_or_link = form.mode === "online" ? "Add the meeting link" : "Add the venue";
    if (form.mode === "online" && form.venue_or_link && !/^https?:\/\//.test(form.venue_or_link.trim()))
      next.venue_or_link = "Link must start with https://";
    if (!form.start_time) next.start_time = "Choose a date and time";
    else if (new Date(form.start_time) <= new Date()) next.start_time = "Must be in the future";
    if (form.capacity && !(Number(form.capacity) > 0)) next.capacity = "Enter a positive number, or leave empty";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setSaving(true);
    try {
      const { event } = await api.post("/events", {
        title: form.title.trim(),
        type: form.type,
        mode: form.mode,
        venue_or_link: form.venue_or_link.trim(),
        start_time: new Date(form.start_time).toISOString(),
        capacity: form.capacity ? Number(form.capacity) : null,
        description: form.description.trim() || null,
      });
      navigate(`/events/${event.id}`, { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setServerError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/events" className="text-sm font-semibold text-orange-dark hover:underline">
        ← Back to events
      </Link>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Create an event</h1>

      {isUnverifiedAlumnus || !canPost ? (
        <Alert variant="info" className="mt-6">
          Only verified alumni can create events. Once an admin approves your alumni proof, you can host events here.
        </Alert>
      ) : (
        <Card className="mt-6">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <Alert>{serverError}</Alert>
            <Input id="title" name="title" label="Title" maxLength={200} placeholder="e.g. Cracking product-company interviews" value={form.title} onChange={handleChange} error={errors.title} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Select id="type" name="type" label="Type" options={EVENT_TYPES} value={form.type} onChange={handleChange} error={errors.type} />
              <Select
                id="mode"
                name="mode"
                label="Mode"
                options={[
                  { value: "online", label: "Online" },
                  { value: "offline", label: "In person" },
                ]}
                value={form.mode}
                onChange={handleChange}
                error={errors.mode}
              />
            </div>

            <Input
              id="venue_or_link"
              name="venue_or_link"
              label={form.mode === "online" ? "Meeting link" : "Venue"}
              placeholder={form.mode === "online" ? "https://meet.google.com/…" : "e.g. Seminar Hall, MBM Jodhpur"}
              maxLength={500}
              value={form.venue_or_link}
              onChange={handleChange}
              error={errors.venue_or_link}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Input id="start_time" name="start_time" type="datetime-local" label="Starts at" min={nextHourLocal()} value={form.start_time} onChange={handleChange} error={errors.start_time} />
              <Input id="capacity" name="capacity" type="number" inputMode="numeric" min={1} label="Seats (optional)" placeholder="No limit" value={form.capacity} onChange={handleChange} error={errors.capacity} />
            </div>

            <Textarea id="description" name="description" label="Description (optional)" rows={5} maxLength={5000} value={form.description} onChange={handleChange} error={errors.description} />

            <Button type="submit" disabled={saving} className="w-full sm:w-auto sm:self-end">
              {saving ? "Creating…" : "Create event"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
