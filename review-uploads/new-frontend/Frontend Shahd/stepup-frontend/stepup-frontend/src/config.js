// إعدادات المشروع كلها هنا، وبتتقرأ من متغيرات البيئة (ملف .env).
// مهم: أي متغير بيبدأ بـ VITE_ بيظهر في الكود اللي بيوصل للمتصفح. متحطيش هنا Secrets أو AWS keys.

// true = Demo mode (بيانات تجريبية محفوظة في المتصفح بس). اتغيّر لـ false بـ VITE_USE_MOCK=false لما الـ Backend يجهز.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Google login عن طريق Cognito Hosted UI. القيم دي بتيجي من مسؤول الـ Backend / AWS.
export const COGNITO = {
  domain: import.meta.env.VITE_COGNITO_DOMAIN || "", // مثال: your-app.auth.eu-central-1.amazoncognito.com
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || "",
  redirectUri:
    import.meta.env.VITE_COGNITO_REDIRECT_URI || `${window.location.origin}/auth/callback`,
};

// حدود رفع الـ CV (الـ Backend لازم يتأكد منها هو كمان)
export const CV_MAX_MB = 5;
