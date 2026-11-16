// Resume APIs. غيّري USE_MOCK لـ false لما الـ Backend يجهز.
// شكل الـ endpoints هنا مقترح: اتفقي عليه مع مسؤول الـ Backend (Resume Upload)
import { api } from "./client";

const USE_MOCK = true;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// POST /resumes  (multipart/form-data, field: file)
// => { id, filename, size, status: "processing" }
export async function uploadResume(file, onProgress) {
  if (USE_MOCK) {
    for (let p = 0; p <= 100; p += 20) {
      onProgress?.(p);
      await sleep(250);
    }
    return { id: "mock-1", filename: file.name, size: file.size, status: "processing" };
  }
  const form = new FormData();
  form.append("file", file);
  return api("/resumes", { method: "POST", body: form });
}

// GET /resumes/:id
// => { id, status: "processing" | "completed" | "failed", error? }
let polls = 0;
export async function getResumeStatus(id) {
  if (USE_MOCK) {
    await sleep(600);
    polls += 1;
    return { id, status: polls >= 3 ? "completed" : "processing" };
  }
  return api(`/resumes/${id}`);
}

// DELETE /resumes/:id
export async function deleteResume(id) {
  if (USE_MOCK) {
    await sleep(300);
    return null;
  }
  return api(`/resumes/${id}`, { method: "DELETE" });
}
