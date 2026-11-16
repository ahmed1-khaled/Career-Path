import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAsync from "../hooks/useAsync";
import usePageTitle from "../hooks/usePageTitle";
import { getProfile, saveSkills } from "../api/profile";
import SkillEditor from "../components/SkillEditor";
import { Alert, ErrorBox, Loading } from "../components/Status";

// صفحة المهارات: تعديل (إضافة/حذف) وبعدين Save بيبعت للـ Backend، ومنها بتتحدّث الترشيحات.
export default function Skills() {
  usePageTitle("My skills");
  const { data, loading, error, reload } = useAsync(getProfile);
  const [skills, setSkills] = useState([]);
  const [saved, setSaved] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setSkills(data.skills);
      setSaved(data.skills);
    }
  }, [data]);

  const dirty = JSON.stringify(skills) !== JSON.stringify(saved);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const save = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await saveSkills(skills);
      setSaved(skills);
      setJustSaved(true);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="narrow-page">
      <div className="page-header">
        <h1>Your skills</h1>
        <p className="muted">
          Remove anything that's wrong and add what's missing, then save. Your job matches update from this list.
        </p>
      </div>

      <div className="card">
        <SkillEditor
          skills={skills}
          onChange={(next) => {
            setSkills(next);
            setJustSaved(false);
          }}
        />
      </div>

      {saveError && <Alert type="error">{saveError}</Alert>}
      {justSaved && !dirty && <Alert type="success">Skills saved.</Alert>}

      <div className="actions">
        <button type="button" className="btn" onClick={save} disabled={!dirty || saving}>
          {saving ? "Saving..." : "Save skills"}
        </button>
        <Link className="btn btn-secondary" to="/jobs">
          See matching jobs
        </Link>
      </div>
    </div>
  );
}
