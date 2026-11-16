import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAsync from "../hooks/useAsync";
import usePageTitle from "../hooks/usePageTitle";
import { getProfile, savePreferences } from "../api/profile";
import { useAuth } from "../context/AuthContext";
import PreferencesForm, { emptyPreferences } from "../components/PreferencesForm";
import { Alert, ErrorBox, Loading } from "../components/Status";

// خطوتين: (1) الوظايف ومستوى الخبرة (2) المكان ونوع الشغل. كل الحقول اختيارية ويمكن تخطيها.
export default function Onboarding() {
  usePageTitle("Set up your profile");
  const { data, loading, error, reload } = useAsync(getProfile);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState(emptyPreferences);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (data) setPrefs({ ...emptyPreferences, ...data.preferences });
  }, [data]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const nextPage = data.has_cv ? "/dashboard" : "/upload";

  const finish = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await savePreferences(prefs);
      updateUser({ onboarded: true });
      navigate(nextPage);
    } catch (e) {
      setSaveError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="narrow-page">
      <p className="muted small" aria-live="polite">
        Step {step} of 2
      </p>
      <progress className="step-progress" value={step} max="2" aria-label="Onboarding progress" />

      <h1>{step === 1 ? "What kind of work are you looking for?" : "Where and how do you want to work?"}</h1>
      <p className="muted">Everything here is optional. You can change it later in Settings.</p>

      <div className="card">
        <PreferencesForm value={prefs} onChange={setPrefs} part={step === 1 ? "roles" : "location"} />
      </div>

      {saveError && <Alert type="error">{saveError}</Alert>}

      <div className="actions space-between">
        <Link className="btn btn-ghost" to={nextPage}>
          Skip for now
        </Link>
        <div className="actions">
          {step === 2 && (
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} disabled={saving}>
              Back
            </button>
          )}
          {step === 1 ? (
            <button type="button" className="btn" onClick={() => setStep(2)}>
              Next
            </button>
          ) : (
            <button type="button" className="btn" onClick={finish} disabled={saving}>
              {saving ? "Saving..." : "Finish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
