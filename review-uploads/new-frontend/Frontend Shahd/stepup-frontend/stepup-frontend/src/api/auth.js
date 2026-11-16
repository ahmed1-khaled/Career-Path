// Auth APIs. الـ endpoints هنا مقترحة (راجعي docs/API_CONTRACT.md) ولازم الـ Backend يأكدها.
// في Demo mode كله بيشتغل على mockApi (من غير سيرفر).
import { api } from "./client";
import { USE_MOCK, COGNITO } from "../config";
import * as mock from "../mocks/mockApi";

// كل الدوال بترجّع { token, user }
export function login(email, password) {
  if (USE_MOCK) return mock.login(email, password);
  return api("/auth/login", { method: "POST", json: { email, password }, public: true });
}

export function signup(name, email, password) {
  if (USE_MOCK) return mock.signup(name, email, password);
  return api("/auth/signup", { method: "POST", json: { name, email, password }, public: true });
}

export function logout() {
  if (USE_MOCK) return mock.logout();
  return Promise.resolve(); // التوكن بيتمسح من المتصفح. لو الـ Backend عنده /auth/logout ضيفيه هنا.
}

// ===== Google عن طريق Cognito Hosted UI =====
export const googleConfigured = () => Boolean(COGNITO.domain && COGNITO.clientId);

// بتجهّز رابط Cognito. state بيحمي من هجمات CSRF وبنتأكد منه في /auth/callback
export function getGoogleLoginUrl() {
  const state = crypto.randomUUID();
  sessionStorage.setItem("oauth_state", state);
  const params = new URLSearchParams({
    identity_provider: "Google",
    response_type: "code",
    client_id: COGNITO.clientId,
    redirect_uri: COGNITO.redirectUri,
    scope: "openid email profile",
    state,
  });
  return `https://${COGNITO.domain}/oauth2/authorize?${params}`;
}

// Demo mode: بيعمل حساب تجريبي من غير ما يروح Google
export function googleDemoLogin() {
  return mock.googleLogin();
}

// بتبدّل الـ code اللي رجع من Cognito بتوكن. الـ Backend هو اللي بيكلّم Cognito (الـ client secret مش بيبقى في الـ Frontend).
export function finishGoogleLogin(code) {
  return api("/auth/google", {
    method: "POST",
    json: { code, redirect_uri: COGNITO.redirectUri },
    public: true,
  });
}
