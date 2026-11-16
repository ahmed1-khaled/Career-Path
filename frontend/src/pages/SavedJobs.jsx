import { Link } from "react-router-dom";
import useAsync from "../hooks/useAsync";
import usePageTitle from "../hooks/usePageTitle";
import { getSavedJobs } from "../api/jobs";
import JobCard from "../components/JobCard";
import { Loading, ErrorBox, Empty } from "../components/Status";

export default function SavedJobs() {
  usePageTitle("Saved jobs");
  const { data: jobs, loading, error, reload } = useAsync(getSavedJobs);
  if (loading) return <Loading text="Loading your saved jobs..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return <>
    <div className="page-header">
      <h1>Saved jobs</h1>
      <p className="muted">Jobs you bookmarked are kept in your account.</p>
    </div>
    {!jobs?.length ? (
      <Empty title="No saved jobs yet" text="Save a job from your recommendations and it will appear here.">
        <Link className="btn" to="/jobs">Browse jobs</Link>
      </Empty>
    ) : <div className="grid">
      {jobs.map((job) => <JobCard key={job.id} job={job} onSaveChange={reload} />)}
    </div>}
  </>;
}
