import { Link } from "react-router-dom";
import SkillChips from "./SkillChips";
import SaveButton from "./SaveButton";

export default function JobCard({ job, onSaveChange }) {
  return (
    <article className="card job-card">
      <div className="job-head">
        <div>
          <h3>{job.title}</h3>
          <p className="muted">
            {job.company} · {job.location} · {job.work_type}
          </p>
        </div>
        <div className="score" aria-label={`${job.match_score}% match`}>
          {job.match_score}%
        </div>
      </div>

      <p className="label">Matched skills</p>
      <SkillChips skills={job.matched_skills} type="matched" emptyText="None yet" />
      <p className="label">Missing skills</p>
      <SkillChips skills={job.missing_skills} type="missing" emptyText="You have everything required" />

      <div className="actions">
        <Link className="btn" to={`/jobs/${job.id}`}>
          View details
        </Link>
        <SaveButton job={job} onChange={onSaveChange} />
      </div>
    </article>
  );
}
