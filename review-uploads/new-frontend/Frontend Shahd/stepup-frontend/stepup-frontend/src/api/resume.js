// Resume APIs. الـ endpoints مقترحة: اتفقي عليها مع مسؤول الـ Backend (Resume Upload).
import { api, uploadFile } from "./client";
import { USE_MOCK } from "../config";
import * as mock from "../mocks/mockApi";

// POST /resumes  (multipart/form-data, field: file)
// => { id, filename, size, status: "processing" }
export function uploadResume(file, onProgress) {
  return USE_MOCK ? mock.uploadResume(file, onProgress) : uploadFile("/resumes", file, onProgress);
}

// GET /resumes/:id
// => { id, status: "processing" | "completed" | "failed", error? }
export function getResumeStatus(id) {
  return USE_MOCK ? mock.getResumeStatus(id) : api(`/resumes/${id}`);
}

// DELETE /resumes/:id  (بيمسح الملف والبيانات اللي اتطلّعت منه)
export function deleteResume(id) {
  return USE_MOCK ? mock.deleteResume(id) : api(`/resumes/${id}`, { method: "DELETE" });
}
