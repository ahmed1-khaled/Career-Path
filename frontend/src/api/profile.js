import { api } from "./client";

const split = (value) => String(value || "").split(",").map((x) => x.trim()).filter(Boolean);
const join = (value) => Array.isArray(value) ? value.join(", ") : String(value || "");
const parseJson = (value, fallback) => { try { return JSON.parse(value || ""); } catch { return fallback; } };

async function rawProfile() { return api("/profile"); }
function mapProfile(p, email = "") {
  const details = parseJson(p.personal_details_json, {});
  const resume = p.resume_original_filename ? {
    id: "current", filename: p.resume_original_filename, size: p.resume_size_bytes || 0,
    uploaded_at: p.resume_uploaded_at, parse_status: p.resume_parse_status,
  } : null;
  const targetRoles = split(p.target_titles);
  const workTypes = split(p.preferred_work_modes);
  return {
    ...p,
    name: p.full_name || details.full_name || (email ? email.split("@")[0] : ""),
    email,
    onboarded: Boolean(details.stepup_onboarded),
    has_cv: Boolean(resume),
    resume,
    cv_score: null,
    skills: split(p.skills),
    preferences: {
      target_roles: targetRoles,
      experience_level: p.years_experience >= 5 ? "senior" : p.years_experience >= 2 ? "mid" : p.years_experience > 0 ? "junior" : "",
      preferred_location: p.preferred_locations || "",
      work_types: workTypes,
    },
  };
}
async function getRawWithEmail() {
  const [profile, session] = await Promise.all([rawProfile(), api("/auth/me")]);
  return { profile, email: session?.user?.email || "" };
}
export async function getProfile() {
  const { profile, email } = await getRawWithEmail();
  return mapProfile(profile, email);
}
function payloadFromProfile(p) {
  const keys = [
    "full_name","years_experience","target_titles","skills","preferred_locations","preferred_work_modes",
    "verified_facts_json","resume_headline","profile_summary","employment_highlights","employment_history_json",
    "education_json","it_skills_json","projects_json","online_profiles_json","work_samples_json",
    "publications_json","presentations_json","patents_json","certifications_json","career_profile_json",
    "personal_details_json","languages_json",
  ];
  return Object.fromEntries(keys.map((key) => [key, p[key] ?? ({
    years_experience: 0, verified_facts_json: "{}", employment_history_json: "[]", education_json: "[]",
    it_skills_json: "[]", projects_json: "[]", online_profiles_json: "[]", work_samples_json: "[]",
    publications_json: "[]", presentations_json: "[]", patents_json: "[]", certifications_json: "[]",
    career_profile_json: "{}", personal_details_json: "{}", languages_json: "[]",
  }[key] ?? "")]));
}
async function updateRaw(changes) {
  const current = await rawProfile();
  const payload = payloadFromProfile({ ...current, ...changes });
  return api("/profile", { method: "PUT", json: payload });
}
export async function updateProfile(data) {
  const changes = {};
  if (data.name !== undefined) changes.full_name = data.name;
  if (data.full_name !== undefined) changes.full_name = data.full_name;
  const updated = await updateRaw(changes);
  const session = await api("/auth/me");
  return mapProfile(updated, session?.user?.email || "");
}
export async function saveSkills(skills) {
  const updated = await updateRaw({ skills: join(skills) });
  return { skills: split(updated.skills) };
}
export async function savePreferences(preferences) {
  const roles = join(preferences.target_roles);
  const location = preferences.preferred_location || "";
  const workModes = join(preferences.work_types);
  const yearsByLevel = { student: 0, graduate: 0, junior: 1, mid: 3.5, senior: 5 };
  const years = yearsByLevel[preferences.experience_level] ?? 0;
  const current = await rawProfile();
  const personalDetails = parseJson(current.personal_details_json, {});
  const updated = await updateRaw({
    target_titles: roles, preferred_locations: location, preferred_work_modes: workModes, years_experience: years,
    personal_details_json: JSON.stringify({ ...personalDetails, stepup_onboarded: true }),
  });
  return mapProfile(updated).preferences;
}
export async function getCvAnalysis() {
  try {
    const suggestions = await api("/profile/resume/suggestions", { method: "POST" });
    const profile = await rawProfile();
    const personal = parseJson(profile.personal_details_json, {});
    return {
      personal: {
        full_name: profile.full_name || personal.full_name || "",
        email: personal.email || "",
        phone: personal.phone || "",
        location: personal.location || profile.preferred_locations || "",
        linkedin_url: personal.linkedin_url || "",
        portfolio_url: personal.portfolio_url || "",
      },
      summary: profile.profile_summary || suggestions.profile_summary || "",
      skills: split(profile.skills || suggestions.skills),
      education: parseJson(profile.education_json, []),
      experience: parseJson(profile.employment_history_json, []),
      certifications: parseJson(profile.certifications_json, []),
      projects: parseJson(profile.projects_json, []),
      headline: profile.resume_headline || suggestions.headline || "",
    };
  } catch (error) {
    if (error.status === 400) return null;
    throw error;
  }
}
export async function saveCvAnalysis(analysis) {
  const current = await rawProfile();
  const personal = analysis.personal || {};
  const existingPersonal = parseJson(current.personal_details_json, {});
  const updated = await updateRaw({
    full_name: personal.full_name || current.full_name,
    resume_headline: analysis.headline || current.resume_headline,
    profile_summary: analysis.summary || "",
    skills: join(analysis.skills),
    personal_details_json: JSON.stringify({ ...existingPersonal, ...personal }),
    education_json: JSON.stringify(analysis.education || []),
    employment_history_json: JSON.stringify(analysis.experience || []),
    certifications_json: JSON.stringify(analysis.certifications || []),
    projects_json: JSON.stringify(analysis.projects || []),
  });
  return { ...analysis, skills: split(updated.skills) };
}
export async function deleteAccount() {
  throw new Error("Account deletion is not available in the connected backend. No account data was changed.");
}
