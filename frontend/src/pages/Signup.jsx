import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signup } from "../api/auth";
import usePageTitle from "../hooks/usePageTitle";
import { isEmail } from "../utils/validate";
import Field from "../components/Field";
import { Alert } from "../components/Status";

export default function Signup() {
  usePageTitle("Create account");
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user && !loading) return <Navigate to={user.onboarded ? "/dashboard" : "/onboarding"} replace />;

  const finish = async (result) => {
    await signIn(result);
    navigate("/onboarding", { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = "Enter your name.";
    if (!isEmail(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setFormError("");
    try {
      await finish(await signup(form.name.trim(), form.email.trim(), form.password));
    } catch (err) {
      setFormError(err.message);
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <section className="auth-wrap">
      <div className="auth-card card">
        <h1>Create your account</h1>
        <p className="muted">It takes a minute. You'll upload your CV right after.</p>

        {formError && <Alert type="error">{formError}</Alert>}



        <form onSubmit={submit} noValidate className="form-stack">
          <Field label="Full name" id="signup-name" error={errors.name}>
            {(p) => <input autoComplete="name" value={form.name} onChange={set("name")} {...p} />}
          </Field>
          <Field label="Email" id="signup-email" error={errors.email}>
            {(p) => <input type="email" autoComplete="email" value={form.email} onChange={set("email")} {...p} />}
          </Field>
          <Field label="Password" id="signup-password" error={errors.password} hint="At least 8 characters.">
            {(p) => (
              <input type="password" autoComplete="new-password" value={form.password} onChange={set("password")} {...p} />
            )}
          </Field>
          <button type="submit" className="btn btn-block" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>


        <p className="hint">
          By continuing you agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
}
