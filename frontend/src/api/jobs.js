import { api } from "./client";

function mapMatch(row) {
  const job = row.job || row;
  return {
    ...job, id: job.id, work_type: job.work_mode || "Unknown",
    match_score: row.match_score ?? 0,
    matched_skills: row.matched_keywords || [], missing_skills: [],
    reason: (row.reasons || []).join(" "), requirements: [],
    apply_url: job.source_url || "", is_saved: false,
    description: job.description || "",
  };
}
function mapSavedJob(job) {
  return {
    ...job, work_type: job.work_mode || "Unknown",
    match_score: job.match_score ?? 0, matched_skills: [],
    missing_skills: [], reason: "", requirements: [],
    apply_url: job.source_url || "", is_saved: true,
    description: job.description || "",
  };
}
export async function getJobs() {
  const rows = await api("/jobs/matches");
  return Array.isArray(rows) ? rows.map(mapMatch) : [];
}
export async function getJob(id) {
  const rows = await getJobs();
  const found = rows.find((job) => String(job.id) === String(id));
  if (found) return found;
  const saved = await getSavedJobs();
  const savedFound = saved.find((job) => String(job.id) === String(id));
  if (savedFound) return savedFound;
  throw new Error("This job is not in your current matches. Return to the jobs list and refresh.");
}
export async function getSavedJobs() {
  const rows = await api("/jobs/saved");
  return Array.isArray(rows) ? rows.map(mapSavedJob) : [];
}
export async function setJobSaved(jobId, saved) {
  const id = Number(jobId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid job ID.");
  if (saved) return mapSavedJob(await api("/jobs/saved", { method: "POST", json: { job_id: id } }));
  await api(`/jobs/saved/${id}`, { method: "DELETE" });
  return null;
}
