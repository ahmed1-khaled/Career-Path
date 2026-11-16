import { courseLinks } from "../utils/courses";

// بياخد المهارات الناقصة ويعرض لكل مهارة روابط بحث للتعلّم (YouTube / Coursera / Udemy).
export default function CourseSuggestions({ skills }) {
  if (!skills?.length) return <p className="muted">You match all the required skills. 🎉</p>;

  return (
    <div>
      <p className="muted small">These are search links to learning platforms, not reviewed courses. Compare a few before you pick one.</p>
      {skills.map((skill) => (
        <div key={skill} className="course-group">
          <h4>Learn {skill}</h4>
          <div className="course-list">
            {courseLinks(skill).map((c) => (
              <a key={c.provider} className="course" href={c.url} target="_blank" rel="noopener noreferrer">
                <strong>{c.provider}</strong>
                <span>{c.title}</span>
                <small>{c.kind}</small>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
