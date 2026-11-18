import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Alert, Button, Card, Input } from "../components/ui";

/**
 * Login page: email + password → POST /auth/login.
 *
 * After a successful login we go back to the page the user was trying
 * to open (ProtectedRoute saves it in location.state.from), or to
 * their dashboard.
 */
export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  // Quick checks in the browser so the user gets instant feedback.
  // The backend validates again; never trust the client alone.
  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = "Email is required";
    if (!form.password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      showToast(`Logged in successfully. Welcome back, ${user.full_name.split(" ")[0]}!`);
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      // 401 = wrong email or password, 403 = suspended account
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-center text-2xl font-bold sm:text-3xl">Welcome back</h1>
      <p className="mt-2 text-center text-sm">Log in to your AlumSetu account.</p>

      <Card className="mt-8">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Alert>{serverError}</Alert>

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
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-orange-dark hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
