import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAsync from "../hooks/useAsync";
import usePageTitle from "../hooks/usePageTitle";
import { getProfile, updateProfile, savePreferences } from "../api/profile";
import { deleteResume } from "../api/resume";
import { useAuth } from "../context/AuthContext";
import { formatSize } from "../utils/validate";
import Field from "../components/Field";
import PreferencesForm, { emptyPreferences } from "../components/PreferencesForm";
import { Alert, ErrorBox, Loading } from "../components/Status";

// كل قسم بيحفظ لوحده في الـ Backend وبيعرض نتيجته (نجح/فشل) جنب الزرار بتاعه.
export default function Settings() {
  usePageTitle("Settings");
  const { data, loading, error, reload } = useAsync(getProfile);
  const { updateUser, signOut } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [prefs, setPrefs] = useState(emptyPreferences);
  const [resume, setResume] = useState(null);
  const [msg, setMsg] = useState({}); // { account, prefs, cv, danger } => { type, text }
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState(""); // CV deletion confirmation

  useEffect(() => {
    if (data) {
      setName(data.name);
      setPrefs({ ...emptyPreferences, ...data.preferences });
      setResume(data.resume);
    }
  }, [data]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  // دالة مشتركة: بتشغّل العملية، وتعرض النجاح أو الفشل في القسم بتاعها
  const run = async (section, action, successText) => {
    setBusy(section);
    setMsg((m) => ({ ...m, [section]: null }));
    try {
      await action();
      if (successText) setMsg((m) => ({ ...m, [section]: { type: "success", text: successText } }));
      return true;
    } catch (e) {
      setMsg((m) => ({ ...m, [section]: { type: "error", text: e.message } }));
      return false;
    } finally {
      setBusy("");
      setConfirm("");
    }
  };

  const saveName = () => {
    if (name.trim().length < 2) return setMsg((m) => ({ ...m, account: { type: "error", text: "Enter your name." } }));
    run("account", async () => {
      await updateProfile({ name: name.trim() });
      updateUser({ name: name.trim() });
    }, "Name saved.");
  };

  const savePrefs = () => run("prefs", () => savePreferences(prefs), "Preferences saved.");

  const removeCv = async () => {
    const ok = await run("cv", () => deleteResume(resume.id), "Your CV file and extracted text were deleted. Saved profile fields were retained.");
    if (ok) setResume(null);
  };

  const logOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const Message = ({ section }) =>
    msg[section] ? <Alert type={msg[section].type}>{msg[section].text}</Alert> : null;

  return (
    <div className="narrow-page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <section className="card" aria-labelledby="acc-title">
        <h2 id="acc-title">Account</h2>
        <div className="form-stack">
          <Field label="Name" id="set-name">
            {(p) => <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" {...p} />}
          </Field>
          <Field label="Email" id="set-email" hint="Your email can't be changed here.">
            {(p) => <input value={data.email} readOnly {...p} />}
          </Field>
        </div>
        <Message section="account" />
        <div className="actions">
          <button type="button" className="btn" onClick={saveName} disabled={busy === "account" || name.trim() === data.name}>
            {busy === "account" ? "Saving..." : "Save name"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={logOut}>
            Log out
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="pref-title">
        <h2 id="pref-title">Job preferences</h2>
        <PreferencesForm value={prefs} onChange={setPrefs} />
        <Message section="prefs" />
        <div className="actions">
          <button type="button" className="btn" onClick={savePrefs} disabled={busy === "prefs"}>
            {busy === "prefs" ? "Saving..." : "Save preferences"}
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="cv-title">
        <h2 id="cv-title">Your CV</h2>
        {resume ? (
          <p>
            <strong>{resume.filename}</strong>{" "}
            <span className="muted">
              · {formatSize(resume.size)}
              {resume.uploaded_at && ` · uploaded ${new Date(resume.uploaded_at).toLocaleDateString()}`}
            </span>
          </p>
        ) : (
          <p className="muted">You haven't uploaded a CV.</p>
        )}
        <Message section="cv" />
        <div className="actions">
          <Link className="btn btn-secondary" to="/upload">
            {resume ? "Upload a new version" : "Upload CV"}
          </Link>
          {resume && confirm !== "cv" && (
            <button type="button" className="btn btn-ghost" onClick={() => setConfirm("cv")}>
              Delete my CV and extracted text
            </button>
          )}
        </div>
        {confirm === "cv" && (
          <Alert type="warning">
            This deletes the stored CV file and extracted resume text. Your saved profile fields and skills are retained.
            <div className="actions">
              <button type="button" className="btn btn-danger" onClick={removeCv} disabled={busy === "cv"}>
                {busy === "cv" ? "Deleting..." : "Yes, delete"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirm("")}>
                Cancel
              </button>
            </div>
          </Alert>
        )}
      </section>


    </div>
  );
}
