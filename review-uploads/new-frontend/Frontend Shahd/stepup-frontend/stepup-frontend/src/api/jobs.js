// Jobs APIs. الـ endpoints مقترحة (راجعي docs/API_CONTRACT.md).
// كل وظيفة بترجع is_saved من الـ Backend، فالحفظ مش في localStorage.
import { api } from "./client";
import { USE_MOCK } from "../config";
import * as mock from "../mocks/mockApi";

// GET /jobs => [{ id, title, company, location, work_type, match_score, matched_skills, missing_skills,
//               description, requirements, reason, apply_url, is_saved }]
export function getJobs() {
  return USE_MOCK ? mock.getJobs() : api("/jobs");
}

// GET /jobs/:id
export function getJob(id) {
  return USE_MOCK ? mock.getJob(id) : api(`/jobs/${encodeURIComponent(id)}`);
}

// GET /jobs/saved  (لازم يتعرّف في الـ Backend قبل /jobs/{id})
export function getSavedJobs() {
  return USE_MOCK ? mock.getSavedJobs() : api("/jobs/saved");
}

// POST /jobs/:id/save  و  DELETE /jobs/:id/save
export function setJobSaved(id, saved) {
  if (USE_MOCK) return saved ? mock.saveJob(id) : mock.unsaveJob(id);
  return api(`/jobs/${encodeURIComponent(id)}/save`, { method: saved ? "POST" : "DELETE" });
}
