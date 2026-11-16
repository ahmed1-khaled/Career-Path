import { api, uploadFile } from "./client";
export async function uploadResume(file, onProgress) {
  const result = await uploadFile("/profile/resume", file, onProgress);
  return {
    ...result,
    id: "current",
    size: result.size_bytes,
    status: "completed",
  };
}
export function getResumeStatus() {
  throw new Error("The backend processes the resume during upload and does not expose a polling endpoint.");
}
export function deleteResume() {
  return api("/profile/resume", { method: "DELETE" });
}
