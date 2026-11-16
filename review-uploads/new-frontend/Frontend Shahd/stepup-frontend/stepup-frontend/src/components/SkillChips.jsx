// type: "matched" (أخضر = عندك) | "missing" (شكل متقطع = ناقص) | "" (عادي)
export default function SkillChips({ skills, type = "", emptyText }) {
  if (!skills?.length) return emptyText ? <p className="muted small">{emptyText}</p> : null;
  return (
    <ul className="chips" aria-label={type ? `${type} skills` : "skills"}>
      {skills.map((s) => (
        <li key={s} className={`chip ${type}`}>
          {s}
        </li>
      ))}
    </ul>
  );
}
