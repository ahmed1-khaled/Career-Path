import { useState } from "react";
import { Link } from "react-router-dom";
import useAsync from "../hooks/useAsync";
import usePageTitle from "../hooks/usePageTitle";
import { getSavedJobs } from "../api/jobs";
import JobCard from "../components/JobCard";
import { Loading, ErrorBox, Empty } from "../components/Status";

export default function SavedJobs() {
  usePageTitle("Saved jobs");
  const { data, loading, error, reload } = useAsync(getSavedJobs);
  const [removed, setRemoved] = useState([]); // وظايف اتشال حفظها من الصفحة دي

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const list = data.filter((j) => !removed.includes(j.id));

  // لو حفظت الوظيفة تاني من نفس الصفحة بنشيلها من قايمة "removed"
  const onSaveChange = (job, saved) =>
    setRemoved(saved ? removed.filter((id) => id !== job.id) : [...removed, job.id]);

  return (
    <>
      <div className="page-header">
        <h1>Saved jobs</h1>
      </div>
      {list.length === 0 ? (
        <Empty title="No saved jobs yet" text="Tap Save on any job and it will show up here.">
          <Link className="btn" to="/jobs">
            Browse jobs
          </Link>
        </Empty>
      ) : (
        <div className="grid">
          {list.map((job) => (
            <JobCard key={job.id} job={job} onSaveChange={onSaveChange} />
          ))}
        </div>
      )}
    </>
  );
}
