import { useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import api, { fieldErrors } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Alert, Button, Card, Input, PageLoader } from "../../components/ui";

/**
 * College management.
 *   List → GET /institutions (public, also used by the profile form)
 *   Add  → POST /institutions { name, city, district } (admin only)
 *
 * New colleges appear in every college dropdown straight away. This is
 * how AlumSetu grows from Bengaluru to more cities.
 */
export default function Institutions() {
  const { showToast } = useToast();
  const { data, loading, error, setData } = useApi("/institutions");
  const [form, setForm] = useState({ name: "", city: "", district: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const next = {};
    if (form.name.trim().length < 3) next.name = "College name is required";
    if (form.city.trim().length < 2) next.city = "City is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const { institution } = await api.post("/institutions", {
        name: form.name.trim(),
        city: form.city.trim(),
        district: form.district.trim() || null,
      });
      // Insert in alphabetical order, like the API returns them
      setData((prev) => [...prev, institution].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: "", city: "", district: "" });
      showToast(`${institution.name} added`);
    } catch (err) {
      setErrors(fieldErrors(err));
      setServerError(err.message); // 409 if the name already exists
    } finally {
      setSaving(false);
    }
  };

  const shown = (data || []).filter((i) => `${i.name} ${i.city}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/dashboard" className="text-sm font-semibold text-orange-dark hover:underline">
        ← Admin dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Colleges</h1>
      <p className="mt-1 text-sm">Students and alumni pick their college from this list.</p>

      <Card className="mt-6">
        <h2 className="text-lg font-bold">Add a college</h2>
        <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
          <Alert>{serverError}</Alert>
          <Input id="name" name="name" label="College name" maxLength={200} placeholder="e.g. Sir M. Visvesvaraya Institute of Technology" value={form.name} onChange={handleChange} error={errors.name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="city" name="city" label="City" maxLength={100} placeholder="e.g. Bengaluru" value={form.city} onChange={handleChange} error={errors.city} />
            <Input id="district" name="district" label="District (optional)" maxLength={100} placeholder="e.g. Bengaluru Urban" value={form.district} onChange={handleChange} error={errors.district} />
          </div>
          <Button type="submit" disabled={saving} className="sm:self-end">
            {saving ? "Adding…" : "Add college"}
          </Button>
        </form>
      </Card>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-bold">All colleges{data && ` (${data.length})`}</h2>
        <Input id="college-filter" type="search" label="Filter" placeholder="Name or city" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full sm:w-64" />
      </div>

      {error ? (
        <Alert className="mt-4">{error.message}</Alert>
      ) : loading ? (
        <PageLoader />
      ) : (
        <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-card">
          {shown.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span className="font-semibold text-navy">{i.name}</span>
              <span>
                {i.city}
                {i.district && `, ${i.district}`}
              </span>
            </li>
          ))}
          {shown.length === 0 && <li className="px-4 py-3 text-sm">No colleges match “{filter}”.</li>}
        </ul>
      )}
    </div>
  );
}
