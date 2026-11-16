import { API_URL } from "../config";

let csrfToken = "";
export const setCsrfToken = (value) => { csrfToken = value || ""; };
export const TOKEN_KEY = "session-cookie"; // compatibility only; no session token is stored in localStorage.

export class ApiError extends Error {
  constructor(message, status = 0, kind = "server") {
    super(message); this.status = status; this.kind = kind;
  }
}

function readCookie(name) {
  const prefix = `${name}=`;
  const part = document.cookie.split(";").map((x) => x.trim()).find((x) => x.startsWith(prefix));
  return part ? decodeURIComponent(part.slice(prefix.length)) : "";
}
function defaultMessage(status) {
  if (status === 400 || status === 422) return "Some of the information isn't valid. Please check it and try again.";
  if (status === 401) return "Your session has expired or your login details are incorrect. Please sign in again.";
  if (status === 403) return "Your request could not be verified. Refresh the page and try again.";
  if (status === 404) return "This feature or item is not available in the connected backend.";
  if (status === 409) return "An account with this email already exists. Try signing in instead.";
  if (status === 413) return "That file is too large. The backend limit is 2 MB.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "Something went wrong on the server. Please try again later.";
  return `Request failed (${status}).`;
}
function readDetail(data) {
  const d = data?.detail ?? data?.message;
  if (typeof d === "string") return d;
  if (d && typeof d.message === "string") return d.message;
  if (Array.isArray(d) && typeof d[0]?.msg === "string") return d[0].msg;
  return "";
}
function parseResponse(status, text, isPublic) {
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = undefined; } }
  if (status === 401 && !isPublic) {
    window.dispatchEvent(new Event("auth:expired"));
    throw new ApiError("Your session has expired. Please sign in again.", 401, "auth");
  }
  if (status < 200 || status >= 300) {
    const detail = status < 500 ? readDetail(data) : "";
    throw new ApiError(detail || defaultMessage(status), status, status === 401 ? "auth" : status >= 500 ? "server" : "client");
  }
  if (data === undefined) throw new ApiError("The server returned an unexpected response. Check the API address.", status, "parse");
  return data;
}

export async function api(path, { timeout = 20000, json, public: isPublic = false, ...options } = {}) {
  const method = (options.method || "GET").toUpperCase();
  const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const headers = { Accept: "application/json", ...(json !== undefined && { "Content-Type": "application/json" }), ...options.headers };
  if (mutating) {
    const token = csrfToken || readCookie("csrf_token");
    if (token) headers["X-CSRF-Token"] = token;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    let response;
    try {
      response = await fetch(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
        ...options, method, credentials: "include",
        body: json !== undefined ? JSON.stringify(json) : options.body,
        headers, signal: controller.signal,
      });
    } catch (error) {
      throw new ApiError(error.name === "AbortError" ? "The server took too long to respond." : "Can't reach the backend. Check the API URL and server status.", 0, error.name === "AbortError" ? "timeout" : "network");
    }
    const text = await response.text().catch(() => "");
    const result = parseResponse(response.status, text, isPublic);
    if (result?.csrf_token) setCsrfToken(result.csrf_token);
    return result;
  } finally { clearTimeout(timer); }
}

export function uploadFile(path, file, onProgress, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}${path.startsWith("/") ? path : `/${path}`}`);
    xhr.withCredentials = true;
    const token = csrfToken || readCookie("csrf_token");
    if (token) xhr.setRequestHeader("X-CSRF-Token", token);
    xhr.timeout = timeout;
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => {
      try {
        const result = parseResponse(xhr.status, xhr.responseText, false);
        if (result?.csrf_token) setCsrfToken(result.csrf_token);
        resolve(result);
      } catch (error) { reject(error); }
    };
    xhr.onerror = () => reject(new ApiError("Can't reach the backend.", 0, "network"));
    xhr.ontimeout = () => reject(new ApiError("The upload took too long.", 0, "timeout"));
    const form = new FormData(); form.append("file", file); xhr.send(form);
  });
}
