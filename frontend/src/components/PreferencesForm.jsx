import { useState } from "react";
import Field from "./Field";

export const ROLE_OPTIONS = [
  "AI / ML Engineer",
  "Data Scientist",
  "Data Analyst",
  "Backend Developer",
  "Frontend Developer",
  "Full-Stack Developer",
  "Cloud / DevOps Engineer",
  "UI/UX Designer",
  "Game Developer",
  "QA Engineer",
];

const LEVELS = [
  { value: "student", label: "Student" },
  { value: "graduate", label: "Fresh graduate" },
  { value: "junior", label: "Junior (0-2 years)" },
  { value: "mid", label: "Mid-level (2-5 years)" },
  { value: "senior", label: "Senior (5+ years)" },
];

const WORK_TYPES = ["Remote", "Hybrid", "On-site"];

export const emptyPreferences = {
  target_roles: [],
  experience_level: "",
  preferred_location: "",
  work_types: [],
};

const toggle = (list, item) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

// part: "roles" (الوظائف والخبرة) | "location" (المكان ونوع الشغل) | "all"
// كل الحقول اختيارية.
export default function PreferencesForm({ value, onChange, part = "all" }) {
  const [custom, setCustom] = useState("");
  const set = (changes) => onChange({ ...value, ...changes });

  const addCustom = (e) => {
    e.preventDefault();
    const role = custom.trim();
    if (role && !value.target_roles.some((r) => r.toLowerCase() === role.toLowerCase())) {
      set({ target_roles: [...value.target_roles, role] });
    }
    setCustom("");
  };

  // أدوار اختارها المستخدم من برّه القايمة الجاهزة
  const customRoles = value.target_roles.filter((r) => !ROLE_OPTIONS.includes(r));

  return (
    <div className="form-stack">
      {(part === "all" || part === "roles") && (
        <>
          <fieldset className="field">
            <legend>Which roles are you interested in?</legend>
            <p className="hint">Pick as many as you like.</p>
            <div className="toggle-row">
              {[...ROLE_OPTIONS, ...customRoles].map((role) => {
                const on = value.target_roles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    className={`toggle${on ? " on" : ""}`}
                    aria-pressed={on}
                    onClick={() => set({ target_roles: toggle(value.target_roles, role) })}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
            <form className="add-skill" onSubmit={addCustom}>
              <label htmlFor="custom-role" className="sr-only">
                Add another role
              </label>
              <input
                id="custom-role"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Another role, e.g. Data Engineer"
                maxLength={60}
              />
              <button type="submit" className="btn btn-secondary">
                Add role
              </button>
            </form>
          </fieldset>

          <Field label="Experience level" id="pref-level">
            {(p) => (
              <select value={value.experience_level} onChange={(e) => set({ experience_level: e.target.value })} {...p}>
                <option value="">Prefer not to say</option>
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </>
      )}

      {(part === "all" || part === "location") && (
        <>
          <Field label="Preferred location" id="pref-location" hint="City or country, e.g. Cairo, Egypt">
            {(p) => (
              <input
                value={value.preferred_location}
                onChange={(e) => set({ preferred_location: e.target.value })}
                maxLength={80}
                {...p}
              />
            )}
          </Field>

          <fieldset className="field">
            <legend>How would you like to work?</legend>
            <div className="toggle-row">
              {WORK_TYPES.map((type) => (
                <label key={type} className="check">
                  <input
                    type="checkbox"
                    checked={value.work_types.includes(type)}
                    onChange={() => set({ work_types: toggle(value.work_types, type) })}
                  />
                  {type}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}
    </div>
  );
}
