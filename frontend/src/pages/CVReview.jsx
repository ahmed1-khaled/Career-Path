import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAsync from "../hooks/useAsync";
import usePageTitle from "../hooks/usePageTitle";
import { getCvAnalysis, saveCvAnalysis } from "../api/profile";
import { USE_MOCK } from "../config";
import { isEmail, safeUrl } from "../utils/validate";
import Field from "../components/Field";
import SkillEditor from "../components/SkillEditor";
import RepeatableSection from "../components/RepeatableSection";
import { Alert, Empty, ErrorBox, Loading } from "../components/Status";

const sections = [
  {
    key: "education",
    title: "Education",
    itemName: "Education",
    emptyText: "No education found. Add it if you'd like it on your profile.",
    newItem: () => ({ school: "", degree: "", field: "", start: "", end: "" }),
    fields: [
      { key: "school", label: "School / University", wide: true },
      { key: "degree", label: "Degree" },
      { key: "field", label: "Field of study" },
      { key: "start", label: "Start year" },
      { key: "end", label: "End year" },
    ],
  },
  {
    key: "experience",
    title: "Experience",
    itemName: "Experience",
    emptyText: "No experience found. Internships and volunteering count too.",
    newItem: () => ({ company: "", title: "", start: "", end: "", description: "" }),
    fields: [
      { key: "title", label: "Job title" },
      { key: "company", label: "Company" },
      { key: "start", label: "Start" },
      { key: "end", label: "End" },
      { key: "description", label: "What you did", type: "textarea", wide: true },
    ],
  },
  {
    key: "certifications",
    title: "Certifications",
    itemName: "Certification",
    emptyText: "No certifications found.",
    newItem: () => ({ name: "", issuer: "", year: "" }),
    fields: [
      { key: "name", label: "Certification name", wide: true },
      { key: "issuer", label: "Issued by" },
      { key: "year", label: "Year" },
    ],
  },
  {
    key: "projects",
    title: "Projects",
    itemName: "Project",
    emptyText: "No projects found.",
    newItem: () => ({ name: "", description: "", link: "" }),
    fields: [
      { key: "name", label: "Project name", wide: true },
      { key: "description", label: "Description", type: "textarea", wide: true },
      { key: "link", label: "Link (optional)", wide: true },
    ],
  },
];

// بترجّع الأخطاء كـ object: { personal_email: "...", ..., general: [..] }
function validate(form) {
  const errors = {};
  const p = form.personal;
  if (!p.full_name.trim()) errors.full_name = "Your name is required.";
  if (p.email && !isEmail(p.email)) errors.email = "Enter a valid email address.";
  if (p.linkedin_url && !safeUrl(p.linkedin_url)) errors.linkedin_url = "Enter a full link starting with https://";
  if (p.portfolio_url && !safeUrl(p.portfolio_url)) errors.portfolio_url = "Enter a full link starting with https://";
  const badProject = form.projects.findIndex((x) => x.link && !safeUrl(x.link));
  if (badProject !== -1) errors.projects = `Project ${badProject + 1}: the link must start with https://`;
  return errors;
}

// صفحة مراجعة اللي اتطلّع من الـ CV: كل حاجة قابلة للتعديل، وبتتحفظ في الـ Backend.
export default function CVReview() {
  usePageTitle("CV Review");
  const { data, loading, error, reload } = useAsync(getCvAnalysis);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null); // آخر نسخة اتحفظت (لمعرفة لو في تعديلات)
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (data) {
      setForm(data);
      setSaved(data);
    }
  }, [data]);

  const dirty = form && JSON.stringify(form) !== JSON.stringify(saved);

  // تحذير لو حاولت تقفلي التاب وفي تعديلات متحفظتش
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (loading) return <Loading text="Loading your profile..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) {
    return (
      <Empty title="No CV analyzed yet" text="Upload your CV and we'll build your profile here, ready for you to review.">
        <Link className="btn" to="/upload">
          Upload CV
        </Link>
      </Empty>
    );
  }
  if (!form) return null;

  const setPersonal = (key) => (e) => {
    setForm({ ...form, personal: { ...form.personal, [key]: e.target.value } });
    setSavedMsg(false);
  };
  const setList = (key) => (items) => {
    setForm({ ...form, [key]: items });
    setSavedMsg(false);
  };

  const save = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setSaveError("");
    try {
      const result = await saveCvAnalysis(form);
      setSaved(result || form);
      setSavedMsg(true);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const p = form.personal;
  return (
    <>
      <div className="page-header">
        <h1>Review your profile</h1>
        <p className="muted">
          This is what we found in your CV. Fix anything that's wrong; your job matches use your skills.
        </p>
        {USE_MOCK && (
          <Alert type="info">Demo mode: the details below are sample data, not read from the file you uploaded.</Alert>
        )}
      </div>

      <section className="card">
        <h2>Personal information</h2>
        <div className="form-grid">
          <Field label="Full name" id="r-name" error={errors.full_name}>
            {(a) => <input value={p.full_name} onChange={setPersonal("full_name")} autoComplete="name" {...a} />}
          </Field>
          <Field label="Email" id="r-email" error={errors.email}>
            {(a) => <input type="email" value={p.email} onChange={setPersonal("email")} autoComplete="email" {...a} />}
          </Field>
          <Field label="Phone" id="r-phone">
            {(a) => <input type="tel" value={p.phone} onChange={setPersonal("phone")} autoComplete="tel" {...a} />}
          </Field>
          <Field label="Location" id="r-location">
            {(a) => <input value={p.location} onChange={setPersonal("location")} {...a} />}
          </Field>
          <Field label="LinkedIn" id="r-linkedin" error={errors.linkedin_url}>
            {(a) => <input value={p.linkedin_url} onChange={setPersonal("linkedin_url")} placeholder="https://" {...a} />}
          </Field>
          <Field label="Portfolio / GitHub" id="r-portfolio" error={errors.portfolio_url}>
            {(a) => <input value={p.portfolio_url} onChange={setPersonal("portfolio_url")} placeholder="https://" {...a} />}
          </Field>
        </div>
      </section>

      <section className="card">
        <h2>Summary</h2>
        <Field label="Short professional summary" id="r-summary">
          {(a) => (
            <textarea
              rows={4}
              value={form.summary}
              onChange={(e) => {
                setForm({ ...form, summary: e.target.value });
                setSavedMsg(false);
              }}
              {...a}
            />
          )}
        </Field>
      </section>

      <section className="card">
        <h2>Skills</h2>
        <p className="muted">Your job matches are based on these skills.</p>
        <SkillEditor
          skills={form.skills}
          onChange={(skills) => {
            setForm({ ...form, skills });
            setSavedMsg(false);
          }}
        />
      </section>

      {sections.map((s) => (
        <RepeatableSection
          key={s.key}
          title={s.title}
          itemName={s.itemName}
          items={form[s.key]}
          onChange={setList(s.key)}
          fields={s.fields}
          emptyText={s.emptyText}
          newItem={s.newItem}
        />
      ))}
      {errors.projects && <Alert type="error">{errors.projects}</Alert>}

      <div className="save-bar">
        <div aria-live="polite">
          {saveError && <span className="error-text">{saveError}</span>}
          {!saveError && savedMsg && !dirty && <span className="success-text">✓ All changes saved</span>}
          {!saveError && dirty && <span className="muted">You have unsaved changes</span>}
        </div>
        <button type="button" className="btn" onClick={save} disabled={saving || !dirty}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </>
  );
}
