// Profile APIs. الـ endpoints مقترحة (راجعي docs/API_CONTRACT.md).
// التعديلات بتتبعت للـ Backend، مش بتفضل في شاشة المستخدم بس.
import { api } from "./client";
import { USE_MOCK } from "../config";
import * as mock from "../mocks/mockApi";

// GET /profile => { name, email, onboarded, has_cv, cv_score, skills[], preferences{}, resume{}|null }
export function getProfile() {
  return USE_MOCK ? mock.getProfile() : api("/profile");
}

// PATCH /profile { name }
export function updateProfile(data) {
  return USE_MOCK ? mock.updateProfile(data) : api("/profile", { method: "PATCH", json: data });
}

// PUT /profile/skills { skills: [] } => { skills }
export function saveSkills(skills) {
  return USE_MOCK ? mock.saveSkills(skills) : api("/profile/skills", { method: "PUT", json: { skills } });
}

// PUT /profile/preferences { target_roles, experience_level, preferred_location, work_types }
// حفظ التفضيلات بيعتبر الـ onboarding خلص
export function savePreferences(preferences) {
  return USE_MOCK
    ? mock.savePreferences(preferences)
    : api("/profile/preferences", { method: "PUT", json: preferences });
}

// GET /profile/cv-analysis => { personal, summary, skills, education, experience, certifications, projects }
// بترجّع null لو مفيش CV اتحلل (الـ Backend يرجّع 404)
export async function getCvAnalysis() {
  if (USE_MOCK) return mock.getCvAnalysis();
  try {
    return await api("/profile/cv-analysis");
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

// PUT /profile/cv-analysis (نفس الشكل، والـ skills جواه بتحدّث مهارات المستخدم)
export function saveCvAnalysis(analysis) {
  return USE_MOCK
    ? mock.saveCvAnalysis(analysis)
    : api("/profile/cv-analysis", { method: "PUT", json: analysis });
}

// DELETE /account : بيمسح الحساب وكل بياناته (CV والمهارات والوظايف المحفوظة)
export function deleteAccount() {
  return USE_MOCK ? mock.deleteAccount() : api("/account", { method: "DELETE" });
}
