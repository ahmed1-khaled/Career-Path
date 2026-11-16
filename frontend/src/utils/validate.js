import { CV_MAX_MB } from "../config";

export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v.trim());

// بترجّع الرابط لو http/https، غير كده null (بتمنع javascript: وغيره)
export function safeUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// ===== فحص ملف الـ CV =====
// ده فحص للتجربة الأحسن بس. الـ Backend لازم يعمل نفس الفحص (النوع، الحجم، المحتوى) لأن أي حد يقدر يتخطى الـ Frontend.
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "rtf"];

// أول بايتات الملف: PDF بيبدأ بـ %PDF- والـ DOCX هو ملف ZIP بيبدأ بـ PK
async function readStart(file) {
  const buffer = await file.slice(0, 5).arrayBuffer();
  return Array.from(new Uint8Array(buffer));
}

// بترجّع رسالة الخطأ، أو "" لو الملف سليم
export async function validateCvFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) return "Only PDF, DOC, DOCX or RTF files are supported.";
  if (file.size === 0) return "This file is empty. Please choose another one.";
  if (file.size > CV_MAX_MB * 1024 * 1024) return `File is too large. Max size is ${CV_MAX_MB} MB.`;

  try {
    const bytes = await readStart(file);
    const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b; // PK
    if (ext === "pdf" && !isPdf) return "This file doesn't look like a real PDF.";
    if (ext === "docx" && !isZip) return "This file doesn't look like a real DOCX.";
  } catch {
    return "We couldn't read this file. Please try another one.";
  }
  return "";
}
