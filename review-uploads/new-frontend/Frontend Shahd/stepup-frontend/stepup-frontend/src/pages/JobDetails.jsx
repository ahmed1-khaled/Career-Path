import { Link, useParams } from "react-router-dom";
import useAsync from "../hooks/useAsync";
import usePageTitle from "../hooks/usePageTitle";
import { getJob } from "../api/jobs";
import { safeUrl } from "../utils/validate";
import SkillChips from "../components/SkillChips";
import SaveButton from "../components/SaveButton";
import CourseSuggestions from "../components/CourseSuggestions";
import { Loading, ErrorBox } from "../components/Status";

export default function JobDetails() {
  const { id } = useParams();
  const { data: job, loading, error, reload } = useAsync(() => getJob(id), [id]);
  usePageTitle(job ? job.title : "Job");

  if (loading) return <Loading />;
  if (error) {
    return (
      <>
        <Link to="/jobs">← Back to jobs</Link>
        <ErrorBox message={error} onRetry={reload} />
      </>
    );
  }

  const applyUrl = safeUrl(job.apply_url); // بنفتح بس روابط http/https حقيقية
  const requirements = job.requirements || [];

  return (
    <>
      <Link to="/jobs">← Back to jobs</Link>

      <div className="job-head page-header">
        <div>
          <h1>{job.title}</h1>
          <p className="muted">
            {job.company} · {job.location} · {job.work_type}
          </p>
        </div>
        <div className="score big" aria-label={`${job.match_score}% match`}>
          {job.match_score}%
        </div>
      </div>

      <section className="card">
        {job.reason && (
          <>
            <h2>Why this job?</h2>
            <p>{job.reason}</p>
          </>
        )}
        <h2>About the role</h2>
        <p>{job.description}</p>
        {requirements.length > 0 && (
          <>
            <h2>Requirements</h2>
            <ul>
              {requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        )}
        <p className="label">Matched skills</p>
        <SkillChips skills={job.matched_skills} type="matched" emptyText="None yet" />
        <p className="label">Missing skills</p>
        <SkillChips skills={job.missing_skills} type="missing" emptyText="You have everything required" />

        <div className="actions">
          {applyUrl ? (
            <a className="btn" href={applyUrl} target="_blank" rel="noopener noreferrer">
              Apply on company site<span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <button type="button" className="btn" disabled>
              Application link not available
            </button>
          )}
          <SaveButton job={job} />
        </div>
        {!applyUrl && <p className="muted small">The employer hasn't shared an application link for this job.</p>}
      </section>

      <section className="card">
        <h2>Close your skill gap</h2>
        <CourseSuggestions skills={job.missing_skills} />
      </section>
    </>
  );
}
