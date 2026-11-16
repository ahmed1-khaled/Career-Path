import { Link } from "react-router-dom";
import SkillChips from "./SkillChips";
import SaveButton from "./SaveButton";

export default function JobCard({ job, onSaveChange }) {
  const scoreAvailable = Number.isFinite(job.match_score);
  return (
    <article className="card job-card">
      <div className="job-head">
        <div>
          <h3>{job.title}</h3>
          <p className="muted">
            {job.company} · {job.location} · {job.work_type}
          </p>
        </div>
        <div className="score" aria-label={scoreAvailable ? String(job.match_score) + "% match" : "Match score unavailable"}>
          {scoreAvailable ? String(job.match_score) + "%" : "—"}
        </div>
      </div>

      <p className="label">Matched skills</p>
      <SkillChips skills={job.matched_skills} type="matched" emptyText="No matching skills identified yet" />

      {job.skill_gap_analyzed ? (
        <>
          <p className="label">Missing skills</p>
          <SkillChips
            skills={job.missing_skills}
            type="missing"
            emptyText="No specific skill gaps identified by the analysis"
          />
        </>
      ) : (
        <p className="muted small">Open job details to run a full role-fit and skill-gap analysis.</p>
      )}

      <div className="actions">
        <Link className="btn" to={"/jobs/" + job.id}>
          View details
        </Link>
        <SaveButton job={job} onChange={onSaveChange} />
      </div>
    </article>
  );
}
