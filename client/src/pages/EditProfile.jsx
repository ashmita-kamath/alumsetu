import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { fieldErrors } from "../services/api";
import { Alert, Button, Card, Input, PageLoader, Select, Textarea } from "../components/ui";
import SkillPicker from "../components/profile/SkillPicker";

/**
 * Profile edit page for students and alumni.
 *
 * 1. Loads the current profile (GET /profiles/me) and the list of
 *    institutions (GET /institutions) at the same time.
 * 2. Shows the student fields or the alumni fields depending on role.
 * 3. Saves with PUT /profiles/me. The backend creates the profile if
 *    it does not exist yet, so the same form works for "create" and
 *    "edit". `is_verified` is never sent; only an admin can set it.
 */
const BRANCHES = ["CSE", "IT", "ECE", "EE", "ME", "CE", "Chemical", "Mining", "Other"];

const CURRENT_YEAR = new Date().getFullYear();

// Turns the API profile into form values (inputs need strings, not null)
function toForm(user, profile) {
  const p = profile || {};
  const str = (v) => (v === null || v === undefined ? "" : String(v));
  return {
    full_name: user.full_name || "",
    institution_id: str(p.institution_id ?? p.institution?.id),
    branch: str(p.branch),
    // student
    enrollment_year: str(p.enrollment_year),
    expected_grad_year: str(p.expected_grad_year),
    career_goal: str(p.career_goal),
    bio: str(p.bio),
    // alumni
    graduation_year: str(p.graduation_year),
    current_company: str(p.current_company),
    job_title: str(p.job_title),
    industry: str(p.industry),
    location: str(p.location),
    linkedin_url: str(p.linkedin_url),
    available_for_mentoring: p.available_for_mentoring ?? true,
  };
}

// Empty optional text fields are left out instead of sent as ""
const optional = (v) => (v.trim() ? v.trim() : undefined);

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const isStudent = user.role === "student";

  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/profiles/me"), api.get("/institutions")])
      .then(([me, insts]) => {
        setForm(toForm(me.user || user, me.profile));
        setSkills(me.skills || []);
        setInstitutions(insts);
      })
      .catch((err) => setLoadError(err.message));
    // We only want this to run once, when the page opens.
  }, []);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const next = {};
    const year = (v) => Number(v) >= 1950 && Number(v) <= CURRENT_YEAR + 10;
    if (!form.full_name.trim()) next.full_name = "Full name is required";
    if (!form.institution_id) next.institution_id = "Choose your college";
    if (!form.branch.trim()) next.branch = "Branch is required";
    if (isStudent) {
      if (!year(form.enrollment_year)) next.enrollment_year = "Enter a valid year";
      if (!year(form.expected_grad_year)) next.expected_grad_year = "Enter a valid year";
      else if (Number(form.expected_grad_year) < Number(form.enrollment_year))
        next.expected_grad_year = "Must be after enrollment year";
    } else {
      if (!year(form.graduation_year)) next.graduation_year = "Enter a valid year";
      if (form.linkedin_url && !/^https?:\/\//.test(form.linkedin_url.trim()))
        next.linkedin_url = "Must start with https://";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildBody = () => {
    const common = {
      full_name: form.full_name.trim(),
      institution_id: Number(form.institution_id),
      branch: form.branch.trim(),
      skill_ids: skills.map((s) => s.id),
    };
    if (isStudent) {
      return {
        ...common,
        enrollment_year: Number(form.enrollment_year),
        expected_grad_year: Number(form.expected_grad_year),
        career_goal: optional(form.career_goal),
        bio: optional(form.bio),
      };
    }
    return {
      ...common,
      graduation_year: Number(form.graduation_year),
      current_company: optional(form.current_company),
      job_title: optional(form.job_title),
      industry: optional(form.industry),
      location: optional(form.location),
      linkedin_url: optional(form.linkedin_url),
      available_for_mentoring: form.available_for_mentoring,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    if (!validate()) return;

    setSaving(true);
    try {
      const saved = await api.put("/profiles/me", buildBody());
      if (saved?.user) updateUser({ full_name: saved.user.full_name });
      if (saved?.skills) setSkills(saved.skills);
      setMessage({ type: "success", text: "Profile saved." });
    } catch (err) {
      setErrors(fieldErrors(err));
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Alert>{loadError}</Alert>
      </div>
    );
  }
  if (!form) return <PageLoader />;

  const institutionOptions = institutions.map((i) => ({
    value: String(i.id),
    label: i.city ? `${i.name}, ${i.city}` : i.name,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">Your profile</h1>
      <p className="mt-1 text-sm">
        {isStudent
          ? "Your skills and career goal are used to suggest mentors."
          : "Students search alumni by college, company and skills."}
      </p>

      {location.state?.welcome && !message.text && (
        <Alert variant="info" className="mt-6">
          Welcome to AlumSetu! Fill in your profile to get started.
        </Alert>
      )}
      <Alert variant={message.type || "error"} className="mt-6">
        {message.text}
      </Alert>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <Input id="full_name" name="full_name" label="Full name" value={form.full_name} onChange={handleChange} error={errors.full_name} />

          <Select
            id="institution_id"
            name="institution_id"
            label="College"
            placeholder="Choose your college"
            options={institutionOptions}
            value={form.institution_id}
            onChange={handleChange}
            error={errors.institution_id}
          />

          <div>
            <Input
              id="branch"
              name="branch"
              label="Branch"
              list="branch-options"
              placeholder="e.g. CSE"
              value={form.branch}
              onChange={handleChange}
              error={errors.branch}
            />
            <datalist id="branch-options">
              {BRANCHES.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          {isStudent ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input id="enrollment_year" name="enrollment_year" type="number" inputMode="numeric" label="Enrollment year" value={form.enrollment_year} onChange={handleChange} error={errors.enrollment_year} />
                <Input id="expected_grad_year" name="expected_grad_year" type="number" inputMode="numeric" label="Expected graduation year" value={form.expected_grad_year} onChange={handleChange} error={errors.expected_grad_year} />
              </div>
              <Input id="career_goal" name="career_goal" label="Career goal" placeholder="e.g. Data engineer at a product company" maxLength={200} value={form.career_goal} onChange={handleChange} error={errors.career_goal} />
              <Textarea id="bio" name="bio" label="About you" value={form.bio} onChange={handleChange} error={errors.bio} />
            </>
          ) : (
            <>
              <Input id="graduation_year" name="graduation_year" type="number" inputMode="numeric" label="Graduation year" value={form.graduation_year} onChange={handleChange} error={errors.graduation_year} />
              <div className="grid gap-5 sm:grid-cols-2">
                <Input id="current_company" name="current_company" label="Current company" value={form.current_company} onChange={handleChange} error={errors.current_company} />
                <Input id="job_title" name="job_title" label="Job title" value={form.job_title} onChange={handleChange} error={errors.job_title} />
                <Input id="industry" name="industry" label="Industry" placeholder="e.g. IT Services" value={form.industry} onChange={handleChange} error={errors.industry} />
                <Input id="location" name="location" label="Location" placeholder="e.g. Bengaluru" value={form.location} onChange={handleChange} error={errors.location} />
              </div>
              <Input id="linkedin_url" name="linkedin_url" type="url" label="LinkedIn URL" placeholder="https://linkedin.com/in/…" value={form.linkedin_url} onChange={handleChange} error={errors.linkedin_url} />
              <label className="flex items-center gap-2 text-sm font-semibold text-navy">
                <input
                  type="checkbox"
                  name="available_for_mentoring"
                  checked={form.available_for_mentoring}
                  onChange={handleChange}
                  className="h-4 w-4 accent-orange"
                />
                I&apos;m available to mentor students
              </label>
            </>
          )}

          <SkillPicker value={skills} onChange={setSkills} />

          <Button type="submit" disabled={saving} className="w-full sm:w-auto sm:self-end">
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
