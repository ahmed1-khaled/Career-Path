// ⚠️ MOCK BACKEND (Demo mode فقط). ده مش Backend حقيقي.
// بيحاكي الـ endpoints المقترحة في docs/API_CONTRACT.md وبيحفظ كل حاجة في localStorage بتاع المتصفح ده بس.
// - أي إيميل وباسورد يدخّلوا. Google login بيعمل حساب تجريبي.
// - "تحليل الـ CV" وهمي: بياخد مهارات تجريبية ثابتة ومش بيقرأ الملف فعلًا.
// - لو اسم ملف الـ CV فيه كلمة "fail" التحليل بيفشل (علشان تجرّبي حالة الفشل).
// - تطابق الوظايف بيتحسب هنا بمقارنة بسيطة بين مهاراتك ومهارات الوظيفة (مش الـ AI matcher الحقيقي).
// لما الـ Backend يجهز ومع VITE_USE_MOCK=false الملف ده مش بيتستخدم خالص.
import { ApiError } from "../api/client";
import { load, save } from "../utils/storage";
import { jobSeed, sampleSkills, makeSampleAnalysis } from "./data";

const DB_KEY = "stepup_mock_db";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const emptyPreferences = () => ({
  target_roles: [],
  experience_level: "",
  preferred_location: "",
  work_types: [],
});

const newProfile = (name, email) => ({
  name,
  email,
  onboarded: false,
  cv_score: null,
  skills: [],
  preferences: emptyPreferences(),
  resume: null,
  analysis: null,
});

const readDb = () => load(DB_KEY, null) || { session: false, profile: null, savedIds: [], resumes: {} };
const writeDb = (db) => save(DB_KEY, db);

// بترجّع الـ db بعد التأكد إن فيه جلسة شغالة
function requireSession() {
  const db = readDb();
  if (!db.session || !db.profile) {
    throw new ApiError("Your session has expired. Please log in again.", 401, "auth");
  }
  return db;
}

const publicUser = (p) => ({ name: p.name, email: p.email, onboarded: p.onboarded });

// الشكل اللي GET /profile بيرجّعه
const profileView = (p) => ({ ...p, analysis: undefined, has_cv: Boolean(p.resume) });

// ===== Auth =====
function startSession(name, email) {
  const db = readDb();
  // نفس الإيميل = نفس الحساب، إيميل مختلف = حساب جديد فاضي (علشان تجرّبي "new user")
  if (!db.profile || db.profile.email.toLowerCase() !== email.toLowerCase()) {
    db.profile = newProfile(name, email);
    db.savedIds = [];
    db.resumes = {};
  }
  db.session = true;
  writeDb(db);
  return { token: "demo-token", user: publicUser(db.profile) };
}

const nameFromEmail = (email) => {
  const first = email.split("@")[0].split(/[._-]/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
};

export async function login(email) {
  await sleep(500);
  return startSession(nameFromEmail(email), email);
}

export async function signup(name, email) {
  await sleep(500);
  const db = readDb();
  // signup دايمًا بيعمل حساب جديد
  db.profile = newProfile(name, email);
  db.savedIds = [];
  db.resumes = {};
  db.session = true;
  writeDb(db);
  return { token: "demo-token", user: publicUser(db.profile) };
}

export async function googleLogin() {
  await sleep(600);
  return startSession("Demo User", "demo.user@example.com");
}

export async function logout() {
  const db = readDb();
  db.session = false;
  writeDb(db);
}

export async function deleteAccount() {
  await sleep(300);
  requireSession();
  writeDb({ session: false, profile: null, savedIds: [], resumes: {} });
}

// ===== Profile =====
export async function getProfile() {
  await sleep(200);
  return profileView(requireSession().profile);
}

export async function updateProfile({ name }) {
  await sleep(250);
  const db = requireSession();
  db.profile.name = name;
  writeDb(db);
  return profileView(db.profile);
}

export async function saveSkills(skills) {
  await sleep(250);
  const db = requireSession();
  db.profile.skills = skills;
  writeDb(db);
  return { skills };
}

export async function savePreferences(preferences) {
  await sleep(250);
  const db = requireSession();
  db.profile.preferences = { ...emptyPreferences(), ...preferences };
  db.profile.onboarded = true; // الـ Backend لازم يعمل نفس الحاجة: حفظ التفضيلات = خلص الـ onboarding
  writeDb(db);
  return db.profile.preferences;
}

// بترجّع null لو مفيش CV اتحلل (الـ Backend الحقيقي يرجّع 404)
export async function getCvAnalysis() {
  await sleep(250);
  const { profile } = requireSession();
  if (!profile.analysis) return null;
  return { ...profile.analysis, skills: profile.skills };
}

export async function saveCvAnalysis({ skills, ...analysis }) {
  await sleep(350);
  const db = requireSession();
  db.profile.analysis = analysis;
  db.profile.skills = skills;
  writeDb(db);
  return { ...analysis, skills };
}

// ===== Resume =====
export async function uploadResume(file, onProgress) {
  const db = requireSession();
  for (let p = 0; p <= 100; p += 25) {
    onProgress?.(p);
    await sleep(200);
  }
  const id = `mock-${Date.now()}`;
  db.resumes[id] = { filename: file.name, size: file.size, polls: 0, fail: /fail/i.test(file.name) };
  writeDb(db);
  return { id, filename: file.name, size: file.size, status: "processing" };
}

export async function getResumeStatus(id) {
  await sleep(500);
  const db = requireSession();
  const job = db.resumes[id];
  if (!job) throw new ApiError("We couldn't find this upload. Please upload your CV again.", 404, "client");

  job.polls += 1; // عدّاد لكل رفعة لوحدها (مش global)
  if (job.polls < 3) {
    writeDb(db);
    return { id, status: "processing" };
  }
  if (job.fail) {
    writeDb(db);
    return {
      id,
      status: "failed",
      error: "We couldn't read any text from this CV. Try exporting it again as a text-based PDF.",
    };
  }

  const p = db.profile;
  p.resume = { id, filename: job.filename, size: job.size, uploaded_at: new Date().toISOString() };
  p.skills = [...sampleSkills];
  p.cv_score = 78;
  p.analysis = makeSampleAnalysis(p.name, p.email);
  writeDb(db);
  return { id, status: "completed" };
}

export async function deleteResume(id) {
  await sleep(300);
  const db = requireSession();
  delete db.resumes[id];
  // مسح الـ CV بيمسح كل اللي اتطلّع منه
  db.profile.resume = null;
  db.profile.analysis = null;
  db.profile.cv_score = null;
  db.profile.skills = [];
  writeDb(db);
  return null;
}

// ===== Jobs =====
// تطابق بسيط: كام مهارة مطلوبة عندك من إجمالي المهارات المطلوبة
function matchJobs(skills, savedIds) {
  const mine = skills.map((s) => s.toLowerCase());
  return jobSeed
    .map(({ required_skills, ...job }) => {
      const matched = required_skills.filter((s) => mine.includes(s.toLowerCase()));
      const missing = required_skills.filter((s) => !mine.includes(s.toLowerCase()));
      const score = Math.round((matched.length / required_skills.length) * 100);
      const reason = matched.length
        ? `You match ${matched.length} of ${required_skills.length} required skills (${matched.join(", ")}).` +
          (missing.length ? ` To close the gap, learn ${missing.join(", ")}.` : "")
        : "";
      return {
        ...job,
        match_score: score,
        matched_skills: matched,
        missing_skills: missing,
        reason,
        is_saved: savedIds.includes(job.id),
      };
    })
    .filter((job) => job.matched_skills.length > 0) // مفيش أي مهارة مشتركة = مش بنرشحها
    .sort((a, b) => b.match_score - a.match_score);
}

export async function getJobs() {
  await sleep(300);
  const db = requireSession();
  return matchJobs(db.profile.skills, db.savedIds);
}

export async function getJob(id) {
  await sleep(200);
  const db = requireSession();
  const job = matchJobs(db.profile.skills, db.savedIds).find((j) => String(j.id) === String(id));
  if (!job) throw new ApiError("We couldn't find this job. It may have been removed.", 404, "client");
  return job;
}

export async function getSavedJobs() {
  await sleep(250);
  const db = requireSession();
  return matchJobs(db.profile.skills, db.savedIds).filter((j) => j.is_saved);
}

export async function saveJob(id) {
  await sleep(200);
  const db = requireSession();
  if (!db.savedIds.includes(id)) db.savedIds.push(id);
  writeDb(db);
  return null;
}

export async function unsaveJob(id) {
  await sleep(200);
  const db = requireSession();
  db.savedIds = db.savedIds.filter((x) => x !== id);
  writeDb(db);
  return null;
}
