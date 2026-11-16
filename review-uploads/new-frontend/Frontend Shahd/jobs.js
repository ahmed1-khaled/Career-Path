// Jobs + Profile APIs. غيّري USE_MOCK لـ false لما الـ Backend يجهز.
// endpoints مقترحة: GET /jobs, GET /jobs/:id, GET /profile, POST/DELETE /jobs/:id/save
import { api } from "./client";
import { jobs, profile } from "../mocks/data";

const USE_MOCK = true;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SAVED_KEY = "savedJobIds"; // في وضع الـ Mock بنحفظ في المتصفح بس

export async function getProfile() {
  if (USE_MOCK) {
    await sleep(200);
    return profile;
  }
  return api("/profile");
}

export async function getJobs() {
  if (USE_MOCK) {
    await sleep(300);
    return jobs;
  }
  return api("/jobs");
}

export async function getJob(id) {
  if (USE_MOCK) {
    await sleep(200);
    const job = jobs.find((j) => j.id === Number(id));
    if (!job) throw new Error("Job not found");
    return job;
  }
  return api(`/jobs/${id}`);
}

export function getSavedIds() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
  } catch {
    return [];
  }
}

// بترجّع الحالة الجديدة (true = اتحفظت)
export function toggleSaved(id) {
  const ids = getSavedIds();
  const saved = ids.includes(id);
  const next = saved ? ids.filter((x) => x !== id) : [...ids, id];
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  return !saved;
}
