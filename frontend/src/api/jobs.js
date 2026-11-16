import { api } from "./client";

function mapMatch(row) {
  const job = row.job || row;
  return {
    ...job,
    id: job.id,
    work_type: job.work_mode || "Unknown",
    match_score: Number.isFinite(row.match_score) ? row.match_score : null,
    matched_skills: Array.isArray(row.matched_keywords) ? row.matched_keywords : [],
    missing_skills: [],
    skill_gap_analyzed: false,
    reason: Array.isArray(row.reasons) ? row.reasons.join(" ") : "",
    requirements: [],
    apply_url: job.source_url || "",
    is_saved: false,
    description: job.description || "",
  };
}

function mapSavedJob(job, matchingRow = null) {
  if (matchingRow) return { ...mapMatch(matchingRow), is_saved: true };
  return {
    ...job,
    work_type: job.work_mode || "Unknown",
    match_score: null,
    matched_skills: [],
    missing_skills: [],
    skill_gap_analyzed: false,
    reason: "",
    requirements: [],
    apply_url: job.source_url || "",
    is_saved: true,
    description: job.description || "",
  };
}

function indexMatches(rows) {
  return new Map((Array.isArray(rows) ? rows : []).map((row) => {
    const job = row.job || row;
    return [String(job.id), row];
  }));
}

export async function getJobs() {
  const [matches, savedRows] = await Promise.all([
    api("/jobs/matches"),
    api("/jobs/saved"),
  ]);
  const savedIds = new Set((Array.isArray(savedRows) ? savedRows : []).map((job) => String(job.id)));
  return (Array.isArray(matches) ? matches : []).map((row) => {
    const job = mapMatch(row);
    return { ...job, is_saved: savedIds.has(String(job.id)) };
  });
}

export async function getSavedJobs() {
  const [savedRows, matchRows] = await Promise.all([
    api("/jobs/saved"),
    api("/jobs/matches"),
  ]);
  const matches = indexMatches(matchRows);
  return (Array.isArray(savedRows) ? savedRows : []).map((job) =>
    mapSavedJob(job, matches.get(String(job.id)))
  );
}

export async function getJobAnalysis(jobId) {
  const id = Number(jobId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid job ID.");
  return api("/jobs/" + id + "/analysis", { method: "POST" });
}

export async function getJob(id) {
  const jobs = await getJobs();
  let job = jobs.find((item) => String(item.id) === String(id));

  if (!job) {
    const saved = await getSavedJobs();
    job = saved.find((item) => String(item.id) === String(id));
  }
  if (!job) {
    throw new Error("This job is not available in your current matches or saved jobs. Refresh the jobs list and try again.");
  }

  try {
    const analysis = await getJobAnalysis(job.id);
    return {
      ...job,
      match_score: Number.isFinite(analysis.match_score) ? analysis.match_score : job.match_score,
      reason: analysis.fit_summary || job.reason,
      matched_skills: Array.isArray(analysis.skills_evidenced_by_profile)
        ? analysis.skills_evidenced_by_profile
        : job.matched_skills,
      missing_skills: Array.isArray(analysis.skills_not_found_in_profile)
        ? analysis.skills_not_found_in_profile
        : [],
      requirements: Array.isArray(analysis.required_skills) ? analysis.required_skills : [],
      skill_gap_analyzed: true,
      analysis,
      analysis_message: "",
    };
  } catch (error) {
    // Keep the job readable even when the candidate has not completed a profile.
    if (error.status === 400 || error.status >= 500 || error.status === 0) {
      return {
        ...job,
        analysis: null,
        analysis_message: error.message || "Detailed role analysis is temporarily unavailable.",
      };
    }
    throw error;
  }
}

export async function setJobSaved(jobId, saved) {
  const id = Number(jobId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid job ID.");
  if (saved) {
    await api("/jobs/saved", { method: "POST", json: { job_id: id } });
    return true;
  }
  await api("/jobs/saved/" + id, { method: "DELETE" });
  return false;
}
