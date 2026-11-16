import { Link, useParams } from "react-router-dom";
import useAsync from "../hooks/useAsync";
import usePageTitle from "../hooks/usePageTitle";
import { getJob } from "../api/jobs";
import { safeUrl } from "../utils/validate";
import SkillChips from "../components/SkillChips";
import SaveButton from "../components/SaveButton";
import CourseSuggestions from "../components/CourseSuggestions";
import { Alert, Loading, ErrorBox } from "../components/Status";

function TextList({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return <ul>{items.map((item, index) => <li key={String(index) + "-" + item}>{item}</li>)}</ul>;
}

export default function JobDetails() {
  const { id } = useParams();
  const { data: job, loading, error, reload } = useAsync(() => getJob(id), [id]);
  usePageTitle(job ? job.title : "Job");

  if (loading) return <Loading text="Loading job and profile analysis..." />;
  if (error) {
    return (
      <>
        <Link to="/jobs">← Back to jobs</Link>
        <ErrorBox message={error} onRetry={reload} />
      </>
    );
  }

  const applyUrl = safeUrl(job.apply_url);
  const analysis = job.analysis;

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
        <div
          className="score big"
          aria-label={Number.isFinite(job.match_score) ? String(job.match_score) + "% match" : "Match score unavailable"}
        >
          {Number.isFinite(job.match_score) ? String(job.match_score) + "%" : "—"}
        </div>
      </div>

      <section className="card">
        <h2>About the role</h2>
        <p>{job.description || "The original job source has not provided a full description."}</p>
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
        {!applyUrl && <p className="muted small">The employer has not shared a usable application link for this job.</p>}
      </section>

      <section className="card" aria-labelledby="analysis-title">
        <h2 id="analysis-title">Your role-fit analysis</h2>
        {analysis ? (
          <>
            <p>{analysis.fit_summary}</p>
            <p className="muted small">
              Method: {analysis.match_method || "rule-based"}
              {analysis.analysis_provider ? " · Provider: " + analysis.analysis_provider : ""}
              {analysis.ai_assisted ? " · AI-assisted" : " · Deterministic analysis"}
            </p>

            {analysis.matching_evidence?.length > 0 && (
              <>
                <h3>Why this role matches</h3>
                <TextList items={analysis.matching_evidence} />
              </>
            )}

            <h3>Skills found in your profile</h3>
            <SkillChips skills={job.matched_skills} type="matched" emptyText="No matching skills were identified yet." />

            <h3>Skills not found in your profile</h3>
            <SkillChips
              skills={job.missing_skills}
              type="missing"
              emptyText="The analysis did not identify a specific missing skill. Review the original requirements before applying."
            />

            {analysis.experience_assessment && (
              <>
                <h3>Experience</h3>
                <p>{analysis.experience_assessment}</p>
              </>
            )}
            {analysis.location_assessment && (
              <>
                <h3>Location and eligibility</h3>
                <p>{analysis.location_assessment}</p>
              </>
            )}
            {analysis.resume_points_to_emphasize?.length > 0 && (
              <>
                <h3>Experience to highlight in your CV</h3>
                <TextList items={analysis.resume_points_to_emphasize} />
              </>
            )}
            {analysis.concerns?.length > 0 && (
              <>
                <h3>Points to verify</h3>
                <TextList items={analysis.concerns} />
              </>
            )}
            {analysis.suggested_screening_questions?.length > 0 && (
              <>
                <h3>Possible screening questions</h3>
                <TextList items={analysis.suggested_screening_questions} />
              </>
            )}
            {analysis.verification_note && <p className="muted small">{analysis.verification_note}</p>}
          </>
        ) : (
          <Alert type="info">
            {job.analysis_message || "Add your CV or skills to your profile to generate a role-fit analysis. You can still review the job and open the employer's original listing."}
            <div className="actions">
              <Link className="btn btn-secondary" to="/upload">Upload CV</Link>
              <Link className="btn btn-secondary" to="/skills">Add skills</Link>
            </div>
          </Alert>
        )}
      </section>

      <section className="card">
        <h2>Close your skill gap</h2>
        {job.skill_gap_analyzed && job.missing_skills.length > 0 ? (
          <CourseSuggestions skills={job.missing_skills} />
        ) : (
          <p className="muted">
            {job.skill_gap_analyzed
              ? "No specific skill gaps were identified by this analysis. Check the employer's full requirements before applying."
              : "A course plan becomes useful after your profile has enough information for a role-fit analysis."}
          </p>
        )}
      </section>
    </>
  );
}
