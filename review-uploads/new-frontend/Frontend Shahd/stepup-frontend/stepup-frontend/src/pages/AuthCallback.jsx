import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { finishGoogleLogin } from "../api/auth";
import { USE_MOCK } from "../config";
import usePageTitle from "../hooks/usePageTitle";
import { Alert, Loading } from "../components/Status";

// Cognito بيرجّع المستخدم هنا بعد Google مع ?code=...&state=...
// بنتأكد من الـ state، وبنبعت الـ code للـ Backend (POST /auth/google) ياخد منه التوكن.
export default function AuthCallback() {
  usePageTitle("Signing in");
  const [params] = useSearchParams();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const started = useRef(false); // علشان الـ code يتبعت مرة واحدة بس (الـ code بيتستخدم مرة)

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (USE_MOCK) return setError("Google sign-in isn't used in demo mode.");
    const code = params.get("code");
    const providerError = params.get("error_description") || params.get("error");
    if (providerError) return setError(providerError);
    if (!code) return setError("The sign-in response is missing a code.");
    if (params.get("state") !== sessionStorage.getItem("oauth_state")) {
      return setError("The sign-in request could not be verified. Please try again.");
    }
    sessionStorage.removeItem("oauth_state");

    finishGoogleLogin(code)
      .then((result) => {
        signIn(result);
        navigate(result.user.onboarded ? "/dashboard" : "/onboarding", { replace: true });
      })
      .catch((e) => setError(e.message));
  }, [params, signIn, navigate]);

  if (!error) return <Loading text="Signing you in..." />;
  return (
    <section className="auth-wrap">
      <div className="auth-card card">
        <h1>Sign-in failed</h1>
        <Alert type="error">{error}</Alert>
        <Link className="btn" to="/login">
          Back to log in
        </Link>
      </div>
    </section>
  );
}
