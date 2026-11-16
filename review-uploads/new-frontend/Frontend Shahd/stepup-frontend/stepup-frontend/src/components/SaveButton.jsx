import { useState } from "react";
import { setJobSaved } from "../api/jobs";

// زرار حفظ الوظيفة: بيحفظ في الـ Backend، ولو فشل بيرجّع الحالة القديمة ويعرض رسالة.
export default function SaveButton({ job, onChange }) {
  const [saved, setSaved] = useState(Boolean(job.is_saved));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = async () => {
    if (busy) return;
    const next = !saved;
    setSaved(next); // نغيّر الشكل فورًا، ونرجّعه لو فشل
    setBusy(true);
    setError("");
    try {
      await setJobSaved(job.id, next);
      onChange?.(job, next);
    } catch (e) {
      setSaved(!next);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="save-wrap">
      <button type="button" className="btn btn-secondary" onClick={toggle} aria-pressed={saved} disabled={busy}>
        <span aria-hidden="true">{saved ? "★" : "☆"}</span> {saved ? "Saved" : "Save"}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
