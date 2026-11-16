import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { uploadResume, deleteResume } from "../api/resume";
import { getProfile } from "../api/profile";
import usePageTitle from "../hooks/usePageTitle";
import { validateCvFile, formatSize } from "../utils/validate";
import { CV_MAX_MB } from "../config";
import { Alert } from "../components/Status";

// status: idle | checking | uploading | processing | completed | failed
export default function CVUpload() {
  usePageTitle("Upload CV");
  const inputRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [resumeId, setResumeId] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [current, setCurrent] = useState(null); // الـ CV اللي مرفوع قبل كده (لو موجود)
  const [parseStatus, setParseStatus] = useState("");

  const busy = ["checking", "uploading", "processing"].includes(status);

  // نعرف لو المستخدم عنده CV أصلًا
  useEffect(() => {
    getProfile()
      .then((p) => setCurrent(p.resume || null))
      .catch(() => {}); // مش مهم هنا، الصفحة شغالة من غيره
  }, []);

  const startUpload = async (f) => {
    if (busy) return; // منع رفع مرتين في نفس الوقت
    setFile(f);
    setError("");
    setProgress(0);
    setStatus("checking");

    const problem = await validateCvFile(f);
    if (problem) {
      setError(problem);
      setStatus("failed");
      return;
    }

    setStatus("uploading");
    try {
      const res = await uploadResume(f, setProgress);
      setResumeId(res.id || "current");
      setParseStatus(res.parse_status || "");
      setStatus("completed");
      getProfile().then((latest) => setCurrent(latest.resume || null)).catch(() => {});
    } catch (e) {
      setError(e.message || "Upload failed. Please try again.");
      setStatus("failed");
    }
  };

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // علشان لو اختارت نفس الملف تاني الـ onChange يشتغل
    if (f) startUpload(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 1) {
      setFile(files[0]);
      setError("Please drop one file at a time.");
      setStatus("failed");
      return;
    }
    if (files[0]) startUpload(files[0]);
  };

  const reset = () => {
    setStatus("idle");
    setFile(null);
    setResumeId(null);
    setParseStatus("");
    setError("");
    setProgress(0);
  };

  const [deleting, setDeleting] = useState(false);
  const remove = async () => {
    const id = resumeId || current?.id;
    if (!id) return reset();
    setDeleting(true);
    try {
      await deleteResume(id);
      setCurrent(null);
      setParseStatus("");
      reset();
    } catch (e) {
      setError(`Couldn't delete the file: ${e.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="narrow-page">
      <div className="page-header">
        <h1>Upload your CV</h1>
        <p className="muted">
          The backend stores your CV and extracts selectable text where supported. You can review profile suggestions afterwards.
        </p>
      </div>

      {status === "idle" && current && (
        <Alert type="info">
          You already uploaded <strong>{current.filename}</strong>. Uploading a new file replaces the stored CV. Existing profile fields are retained until you review and update them.
        </Alert>
      )}

      {status === "idle" && (
        <div
          className={`dropzone${dragging ? " dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Choose a CV file to upload"
        >
          <p>
            <strong>Drag and drop your CV here</strong>, or click to browse
          </p>
          <small className="muted">PDF, DOC, DOCX or RTF, up to {CV_MAX_MB} MB</small>
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.rtf" hidden onChange={pick} />
        </div>
      )}

      {file && status !== "idle" && (
        <section className="card" aria-live="polite">
          <p>
            <strong>{file.name}</strong> <span className="muted">· {formatSize(file.size)}</span>
          </p>

          {status === "checking" && <p className="muted">Checking the file...</p>}
          {status === "uploading" && (
            <div className="progress-row">
              <progress value={progress} max="100" aria-label="Upload progress" />
              <span>Uploading... {progress}%</span>
            </div>
          )}
          {status === "processing" && (
            <p className="progress-row">
              <span className="spinner small" aria-hidden="true" /> The backend has accepted the upload and extracted available text.
            </p>
          )}
          {status === "completed" && parseStatus === "text_extracted" && (
            <Alert type="success">CV uploaded and selectable text was extracted. Review the profile suggestions and correct any mistakes before saving.</Alert>
          )}
          {status === "completed" && parseStatus === "uploaded_no_selectable_text" && (
            <Alert type="warning">The CV file was saved, but no selectable text was found. This often happens with scanned PDFs. Upload a text-based PDF or DOCX for automatic suggestions, or complete your profile manually.</Alert>
          )}
          {status === "completed" && parseStatus === "uploaded_extraction_not_supported_for_legacy_doc" && (
            <Alert type="warning">The legacy .doc file was saved, but this format cannot be parsed by the current backend. Save it as .docx or a text-based PDF and upload it again for CV suggestions.</Alert>
          )}
          {status === "completed" && !parseStatus && (
            <Alert type="success">CV uploaded. Review your profile and complete any missing details.</Alert>
          )}
          {(status === "failed" || (status === "completed" && error)) && <Alert type="error">{error}</Alert>}

          <div className="actions">
            {status === "completed" && (
              <>
                <Link className="btn" to="/review">
                  Review my profile
                </Link>
                <Link className="btn btn-secondary" to="/jobs">
                  See matching jobs
                </Link>
              </>
            )}
            {status === "failed" && (
              <button type="button" className="btn" onClick={reset}>
                Try another file
              </button>
            )}
            {status === "completed" && (
              <button type="button" className="btn btn-ghost" onClick={remove} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete this CV"}
              </button>
            )}
          </div>
        </section>
      )}

      {status === "idle" && current && (
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={remove} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete my current CV and extracted text"}
          </button>
        </div>
      )}
      {status === "idle" && error && <Alert type="error">{error}</Alert>}

      <p className="muted small">
        Your CV builds your profile and is used for job-fit analysis. External AI providers may receive professional CV context when configured; review the privacy note before enabling one. You can delete the file and extracted text here or
        in <Link to="/settings">Settings</Link>.
      </p>
    </div>
  );
}
