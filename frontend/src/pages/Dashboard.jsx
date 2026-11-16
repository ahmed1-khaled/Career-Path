import { Link } from "react-router-dom";
import useAsync from "../hooks/useAsync";
import usePageTitle from "../hooks/usePageTitle";
import { getProfile } from "../api/profile";
import { getJobs } from "../api/jobs";
import JobCard from "../components/JobCard";
import SkillChips from "../components/SkillChips";
import { Loading, ErrorBox } from "../components/Status";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

// المهارات الناقصة الأكتر تكرارًا في الوظايف (عشان نعرف نتعلم إيه الأول)
function topMissing(jobs) {
  const counts = {};
  jobs.filter((j) => j.skill_gap_analyzed).forEach((j) => j.missing_skills.forEach((s) => (counts[s] = (counts[s] || 0) + 1)));
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

export default function Dashboard() {
  usePageTitle("Dashboard");
  const { data, loading, error, reload } = useAsync(() => Promise.all([getProfile(), getJobs()]));

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const [profile, jobs] = data;
  const gaps = topMissing(jobs);
  const allMissing = new Set(jobs.filter((j) => j.skill_gap_analyzed).flatMap((j) => j.missing_skills)); // unique skill gaps from completed analyses
  const steps = [
    { done: profile.onboarded, label: "Set your job preferences", to: "/onboarding", cta: "Set preferences" },
    { done: profile.has_cv, label: "Upload your CV", to: "/upload", cta: "Upload CV" },
    { done: jobs.length > 0, label: "See your job matches", to: "/jobs", cta: "View jobs" },
  ];
  const setupDone = steps.every((s) => s.done);

  return (
    <>
      <div className="page-header">
        <h1>
          {greeting()}, {profile.name}
        </h1>
        <p className="muted">Here's where your profile stands today.</p>
      </div>

      {!setupDone && (
        <section className="card" aria-labelledby="setup-title">
          <h2 id="setup-title">Get started</h2>
          <ul className="checklist">
            {steps.map((s) => (
              <li key={s.label} className={s.done ? "done" : ""}>
                <span aria-hidden="true">{s.done ? "✓" : "○"}</span>
                <span>
                  {s.label}
                  {s.done && <span className="sr-only"> (done)</span>}
                </span>
                {!s.done && (
                  <Link className="btn btn-secondary btn-sm" to={s.to}>
                    {s.cta}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="stats" aria-label="Summary">
        <div className="card stat">
          <span className="stat-number">{profile.cv_score != null ? `${profile.cv_score}/100` : "-"}</span>
          <span className="muted">CV score</span>
        </div>
        <div className="card stat">
          <span className="stat-number">{profile.skills.length}</span>
          <span className="muted">Skills on your profile</span>
        </div>
        <div className="card stat">
          <span className="stat-number">{jobs.length}</span>
          <span className="muted">Matching jobs</span>
        </div>
        <div className="card stat">
          <span className="stat-number">{allMissing.size}</span>
          <span className="muted">Identified skill gaps</span>
        </div>
      </section>

      <div className="two-col">
        <section className="card" aria-labelledby="skills-title">
          <div className="section-head">
            <h2 id="skills-title">Your skills</h2>
            <Link to="/skills">Edit skills</Link>
          </div>
          <SkillChips skills={profile.skills} emptyText="No skills yet. Upload your CV or add skills manually." />
        </section>

        <section className="card" aria-labelledby="gaps-title">
          <h2 id="gaps-title">Skills to develop</h2>
          {gaps.length === 0 ? (
            <p className="muted">Open a recommended job and run its role-fit analysis to see evidence-based skill gaps here.</p>
          ) : (
            <>
              <ul className="gap-list">
                {gaps.map(([skill, count]) => (
                  <li key={skill}>
                    <strong>{skill}</strong>
                    <span className="muted">
                      asked for in {count} {count === 1 ? "job" : "jobs"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="muted small">Open a job to find videos and courses for each missing skill.</p>
            </>
          )}
        </section>
      </div>

      <section aria-labelledby="top-title">
        <div className="section-head">
          <h2 id="top-title">Top matching jobs</h2>
          {jobs.length > 0 && <Link to="/jobs">View all {jobs.length} →</Link>}
        </div>
        {jobs.length === 0 ? (
          <div className="card">
            <p className="muted">
              {profile.skills.length === 0
                ? "We need your skills to find matches. Upload your CV or add skills to begin."
                : "No jobs match your current skills yet. Try adding more skills."}
            </p>
            <div className="actions">
              <Link className="btn" to="/upload">
                Upload CV
              </Link>
              <Link className="btn btn-secondary" to="/skills">
                Add skills
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid">
            {jobs.slice(0, 3).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="quick-title">
        <h2 id="quick-title">Quick actions</h2>
        <div className="actions">
          <Link className="btn btn-secondary" to="/upload">
            {profile.has_cv ? "Upload a new CV" : "Upload your CV"}
          </Link>
          <Link className="btn btn-secondary" to="/review">
            Review my profile
          </Link>
          <Link className="btn btn-secondary" to="/jobs">
            Browse jobs
          </Link>
          <Link className="btn btn-secondary" to="/saved">
            Saved jobs
          </Link>
        </div>
      </section>
    </>
  );
}
