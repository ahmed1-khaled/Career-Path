import { useState } from "react";
import { Link } from "react-router-dom";
import useAsync from "../hooks/useAsync";
import usePageTitle from "../hooks/usePageTitle";
import { getJobs } from "../api/jobs";
import { getProfile } from "../api/profile";
import JobCard from "../components/JobCard";
import { Loading, ErrorBox, Empty } from "../components/Status";

export default function Jobs() {
  usePageTitle("Jobs");
  const { data, loading, error, reload } = useAsync(() => Promise.all([getProfile(), getJobs()]));
  const [search, setSearch] = useState("");
  const [workType, setWorkType] = useState("All");
  const [sort, setSort] = useState("match");

  if (loading) return <Loading text="Finding the best jobs for you..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const [profile, jobs] = data;

  // لسه مفيش بيانات نرشّح منها
  if (jobs.length === 0) {
    return profile.skills.length === 0 ? (
      <Empty title="Upload your CV to see matches" text="We match jobs using your skills. Upload your CV, or add your skills by hand.">
        <Link className="btn" to="/upload">
          Upload CV
        </Link>
        <Link className="btn btn-secondary" to="/skills">
          Add skills
        </Link>
      </Empty>
    ) : (
      <Empty title="No matching jobs yet" text="None of the current jobs ask for the skills on your profile. Try adding more skills.">
        <Link className="btn" to="/skills">
          Edit skills
        </Link>
      </Empty>
    );
  }

  const q = search.trim().toLowerCase();
  const list = jobs
    .filter(
      (j) =>
        (workType === "All" || j.work_type === workType) &&
        (j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q))
    )
    .sort((a, b) => (sort === "match" ? b.match_score - a.match_score : a.title.localeCompare(b.title)));

  const clear = () => {
    setSearch("");
    setWorkType("All");
  };

  return (
    <>
      <div className="page-header">
        <h1>Recommended jobs</h1>
        <p className="muted">Ranked by how many of the required skills you have.</p>
      </div>

      <div className="filters">
        <input
          type="search"
          aria-label="Search jobs by title or company"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or company"
        />
        <select aria-label="Work type" value={workType} onChange={(e) => setWorkType(e.target.value)}>
          <option value="All">All work types</option>
          <option>Remote</option>
          <option>Hybrid</option>
          <option>On-site</option>
        </select>
        <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="match">Best match</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>
      <p className="muted" aria-live="polite">
        {list.length} {list.length === 1 ? "job" : "jobs"} found
      </p>

      {list.length === 0 ? (
        <Empty title="No jobs match your search" text="Try a different search or work type.">
          <button type="button" className="btn btn-secondary" onClick={clear}>
            Clear filters
          </button>
        </Empty>
      ) : (
        <div className="grid">
          {list.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </>
  );
}
