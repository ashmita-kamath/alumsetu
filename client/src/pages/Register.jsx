import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fieldErrors } from "../services/api";
import { Alert, Button, Card, Input } from "../components/ui";

/**
 * Register page → POST /auth/register.
 *
 * The user first picks "Student" or "Alumni" (admins cannot sign up;
 * they are created by the seed script). Then name, email, password.
 *
 * After registering, the user is logged in straight away and sent to
 * the profile page, because matching and the directory need a profile.
 */
const ROLES = [
  {
    value: "student",
    title: "I'm a student",
    text: "Find mentors, ask questions and apply for jobs.",
  },
  {
    value: "alumni",
    title: "I'm an alumnus",
    text: "Mentor students, share jobs and host events.",
  },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    role: "student",
    full_name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const next = {};
    if (!form.full_name.trim()) next.full_name = "Full name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email";
    if (form.password.length < 8) next.password = "Password must be at least 8 characters";
    if (form.confirm !== form.password) next.confirm = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      navigate("/profile/edit", { replace: true, state: { welcome: true } });
    } catch (err) {
      // 409 = email already taken, 400 = validation (field messages in details)
      setErrors(fieldErrors(err));
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <h1 className="text-center text-2xl font-bold sm:text-3xl">Create your account</h1>
      <p className="mt-2 text-center text-sm">Join the alumni network of Rajasthan&apos;s technical colleges.</p>

      <Card className="mt-8">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Alert>{serverError}</Alert>

          {/* Role choice: two big radio cards */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-navy">I am joining as</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange/50 ${
                    form.role === r.value
                      ? "border-orange bg-orange/10"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={form.role === r.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="block font-semibold text-navy">{r.title}</span>
                  <span className="mt-1 block text-xs">{r.text}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Input
            id="full_name"
            name="full_name"
            label="Full name"
            autoComplete="name"
            value={form.full_name}
            onChange={handleChange}
            error={errors.full_name}
          />
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <Input
            id="confirm"
            name="confirm"
            type="password"
            label="Confirm password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={handleChange}
            error={errors.confirm}
          />

          {form.role === "alumni" && (
            <Alert variant="info">
              Alumni accounts are verified by an admin before you can mentor students or post jobs.
            </Alert>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-orange-dark hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
