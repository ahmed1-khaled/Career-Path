import { useState } from "react";

const MAX_SKILLS = 60;
const MAX_LENGTH = 40;

// محرّر مهارات: إضافة وحذف بس. الصفحة اللي بتستخدمه هي اللي بتحفظ في الـ Backend.
export default function SkillEditor({ skills, onChange }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const add = (e) => {
    e.preventDefault();
    const skill = text.trim().replace(/\s+/g, " ");
    if (!skill) return setError("Type a skill first.");
    if (skill.length > MAX_LENGTH) return setError(`Skills can be up to ${MAX_LENGTH} characters.`);
    if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) return setError(`"${skill}" is already in your list.`);
    if (skills.length >= MAX_SKILLS) return setError(`You can add up to ${MAX_SKILLS} skills.`);
    onChange([...skills, skill]);
    setText("");
    setError("");
  };

  return (
    <div>
      {skills.length === 0 ? (
        <p className="muted">No skills yet. Add your first one below.</p>
      ) : (
        <ul className="chips">
          {skills.map((s) => (
            <li key={s} className="chip">
              {s}
              <button
                type="button"
                className="chip-x"
                aria-label={`Remove ${s}`}
                onClick={() => onChange(skills.filter((x) => x !== s))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="add-skill" onSubmit={add}>
        <label htmlFor="new-skill" className="sr-only">
          Add a skill
        </label>
        <input
          id="new-skill"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError("");
          }}
          placeholder="Add a skill, e.g. Docker"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "new-skill-error" : undefined}
        />
        <button className="btn btn-secondary" type="submit">
          Add
        </button>
      </form>
      {error && (
        <p className="field-error" id="new-skill-error">
          {error}
        </p>
      )}
    </div>
  );
}
