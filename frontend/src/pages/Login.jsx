import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login } from "../api/auth";
import usePageTitle from "../hooks/usePageTitle";
import { isEmail } from "../utils/validate";
import Field from "../components/Field";
import { Alert } from "../components/Status";

export default function Login() {
  usePageTitle("Log in");
  const { user, signIn, notice, clearNotice } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from; // الصفحة اللي كان رايحلها قبل ما يتحوّل للـ Login

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user && !loading) return <Navigate to={user.onboarded ? (from || "/dashboard") : "/onboarding"} replace />;

  const afterLogin = async (result) => {
    const currentUser = await signIn(result);
    navigate(!currentUser.onboarded ? "/onboarding" : from || "/dashboard", { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!isEmail(form.email)) next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setFormError("");
    clearNotice();
    try {
      await afterLogin(await login(form.email.trim(), form.password));
    } catch (err) {
      setFormError(err.kind === "auth" || err.status === 401 ? "Incorrect email or password." : err.message);
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <section className="auth-wrap">
      <div className="auth-card card">
        <h1>Welcome back</h1>
        <p className="muted">Log in to see your matches and keep building your profile.</p>

        {notice && <Alert type="warning">{notice}</Alert>}
        {formError && <Alert type="error">{formError}</Alert>}



        <form onSubmit={submit} noValidate className="form-stack">
          <Field label="Email" id="login-email" error={errors.email}>
            {(p) => <input type="email" autoComplete="email" value={form.email} onChange={set("email")} {...p} />}
          </Field>
          <Field label="Password" id="login-password" error={errors.password}>
            {(p) => (
              <input type="password" autoComplete="current-password" value={form.password} onChange={set("password")} {...p} />
            )}
          </Field>
          <button type="submit" className="btn btn-block" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>


        <p className="auth-switch">
          New to StepUp? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </section>
  );
}
