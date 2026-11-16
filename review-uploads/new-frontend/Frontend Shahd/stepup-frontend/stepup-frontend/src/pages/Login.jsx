import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login, googleDemoLogin, getGoogleLoginUrl, googleConfigured } from "../api/auth";
import { USE_MOCK } from "../config";
import usePageTitle from "../hooks/usePageTitle";
import { isEmail } from "../utils/validate";
import Field from "../components/Field";
import GoogleButton from "../components/GoogleButton";
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
  const [googleLoading, setGoogleLoading] = useState(false);

  if (user && !loading && !googleLoading) return <Navigate to={from || "/dashboard"} replace />;

  const afterLogin = (result) => {
    signIn(result);
    navigate(!result.user.onboarded ? "/onboarding" : from || "/dashboard", { replace: true });
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
      afterLogin(await login(form.email.trim(), form.password));
    } catch (err) {
      setFormError(err.kind === "auth" || err.status === 401 ? "Incorrect email or password." : err.message);
      setLoading(false);
    }
  };

  const google = async () => {
    setFormError("");
    clearNotice();
    if (!USE_MOCK && !googleConfigured()) {
      setFormError("Google sign-in isn't configured yet. Set VITE_COGNITO_DOMAIN and VITE_COGNITO_CLIENT_ID.");
      return;
    }
    setGoogleLoading(true);
    try {
      if (USE_MOCK) afterLogin(await googleDemoLogin());
      else window.location.assign(getGoogleLoginUrl()); // هنروح لـ Cognito ونرجع على /auth/callback
    } catch (err) {
      setFormError(err.message);
      setGoogleLoading(false);
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

        <GoogleButton onClick={google} loading={googleLoading} disabled={loading} />
        <div className="divider">
          <span>or log in with email</span>
        </div>

        <form onSubmit={submit} noValidate className="form-stack">
          <Field label="Email" id="login-email" error={errors.email}>
            {(p) => <input type="email" autoComplete="email" value={form.email} onChange={set("email")} {...p} />}
          </Field>
          <Field label="Password" id="login-password" error={errors.password}>
            {(p) => (
              <input type="password" autoComplete="current-password" value={form.password} onChange={set("password")} {...p} />
            )}
          </Field>
          <button type="submit" className="btn btn-block" disabled={loading || googleLoading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {USE_MOCK && (
          <p className="hint">Demo mode: any valid email and password works. Nothing is checked on a server.</p>
        )}
        <p className="auth-switch">
          New to StepUp? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </section>
  );
}
