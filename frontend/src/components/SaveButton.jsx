import { useEffect, useState } from "react";
import { setJobSaved } from "../api/jobs";

export default function SaveButton({ job, onChange }) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(Boolean(job?.is_saved));

  useEffect(() => {
    setSaved(Boolean(job?.is_saved));
  }, [job?.id, job?.is_saved]);

  async function toggleSaved() {
    if (!job?.id || busy) return;
    setBusy(true);
    try {
      const next = await setJobSaved(job.id, !saved);
      setSaved(next);
      onChange?.(job.id, next);
    } catch (error) {
      window.alert(error.message || "Could not update saved job.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn btn-secondary" onClick={toggleSaved} disabled={busy}>
      {busy ? "Please wait..." : saved ? "Saved ✓" : "Save job"}
    </button>
  );
}
