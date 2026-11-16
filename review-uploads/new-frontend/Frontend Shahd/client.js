// API client موحد: كل الصفحات بتستخدمه بدل ما تكتب روابط الـ API بنفسها.
// ملاحظة: متحطيش أي API Keys هنا. التوكن بس هو اللي بيتبعت.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const isForm = options.body instanceof FormData;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      // في حالة FormData المتصفح بيحط الـ Content-Type لوحده
      ...(!isForm && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new ApiError("Session expired", 401);
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {}
    throw new ApiError(detail, res.status);
  }
  return res.status === 204 ? null : res.json();
}
