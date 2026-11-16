// API client موحد: كل الصفحات بتستخدمه بدل ما تكتب روابط الـ API بنفسها.
// بيتعامل مع: السيرفر واقع، الـ timeout، رد مش JSON، أخطاء السيرفر، وانتهاء الجلسة (401).
// ملاحظة: متحطيش أي API Keys هنا. التوكن بس هو اللي بيتبعت.
import { API_URL } from "../config";
import { load, remove } from "../utils/storage";

export const TOKEN_KEY = "token";

// kind: "network" | "timeout" | "auth" | "client" | "server" | "parse"
export class ApiError extends Error {
  constructor(message, status = 0, kind = "server") {
    super(message);
    this.status = status;
    this.kind = kind;
  }
}

function defaultMessage(status) {
  if (status === 400 || status === 422) return "Some of the information isn't valid. Please check it and try again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 409) return "This conflicts with existing data. Please refresh and try again.";
  if (status === 413) return "That file is too large.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "Something went wrong on our side. Please try again in a moment.";
  return `Request failed (${status}).`;
}

// FastAPI بيرجّع detail كنص، أو list في أخطاء الـ validation (422)
function readDetail(data) {
  const d = data?.detail ?? data?.message;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && typeof d[0]?.msg === "string") return d[0].msg;
  return "";
}

// بتحوّل رد السيرفر لبيانات، أو بترمي ApiError مفهوم. بتتستخدم في fetch وفي رفع الملفات.
function parseResponse(status, text, isPublic) {
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined; // الرد مش JSON (مثلًا صفحة HTML)
    }
  }

  if (status === 401 && !isPublic) {
    remove(TOKEN_KEY);
    window.dispatchEvent(new Event("auth:expired")); // AuthContext بيسمعه ويرجّع المستخدم للـ Login
    throw new ApiError("Your session has expired. Please log in again.", 401, "auth");
  }

  if (status < 200 || status >= 300) {
    // في أخطاء 5xx منخبّي تفاصيل السيرفر، وفي 4xx بنعرض الرسالة لو موجودة
    const detail = status < 500 ? readDetail(data) : "";
    throw new ApiError(detail || defaultMessage(status), status, status >= 500 ? "server" : status === 401 ? "auth" : "client");
  }

  if (data === undefined) {
    throw new ApiError("The server sent an unexpected response. Is the API address correct?", status, "parse");
  }
  return data;
}

// options: method, json (object)، body (FormData)، timeout (ms)، public (true = من غير توكن، زي Login)
export async function api(path, { timeout = 15000, json, public: isPublic = false, ...options } = {}) {
  const token = isPublic ? null : load(TOKEN_KEY);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    let res;
    try {
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        body: json !== undefined ? JSON.stringify(json) : options.body,
        signal: controller.signal,
        headers: {
          ...(json !== undefined && { "Content-Type": "application/json" }),
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });
    } catch (e) {
      throw e.name === "AbortError"
        ? new ApiError("The server took too long to respond. Please try again.", 0, "timeout")
        : new ApiError("Can't reach the server. Check your internet connection and try again.", 0, "network");
    }
    const text = await res.text().catch(() => "");
    return parseResponse(res.status, text, isPublic);
  } finally {
    clearTimeout(timer);
  }
}

// رفع ملف مع نسبة التقدّم (fetch مش بيدّي progress للرفع، فبنستخدم XMLHttpRequest)
export function uploadFile(path, file, onProgress, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = load(TOKEN_KEY);
    xhr.open("POST", `${API_URL}${path}`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.timeout = timeout;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        resolve(parseResponse(xhr.status, xhr.responseText, false));
      } catch (e) {
        reject(e);
      }
    };
    xhr.onerror = () =>
      reject(new ApiError("Can't reach the server. Check your internet connection and try again.", 0, "network"));
    xhr.ontimeout = () => reject(new ApiError("The upload took too long. Please try again.", 0, "timeout"));

    const form = new FormData();
    form.append("file", file); // المتصفح بيحط الـ Content-Type لوحده
    xhr.send(form);
  });
}
