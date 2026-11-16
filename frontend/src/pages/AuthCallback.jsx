import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle";
import { Alert } from "../components/Status";

export default function AuthCallback() {
  usePageTitle("Sign-in unavailable");
  return (
    <section className="auth-wrap">
      <div className="auth-card card">
        <h1>Google sign-in unavailable</h1>
        <Alert type="info">The connected backend supports email and password authentication only. Google/Cognito sign-in is not implemented.</Alert>
        <Link className="btn" to="/login">Back to log in</Link>
      </div>
    </section>
  );
}
