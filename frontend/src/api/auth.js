import { api } from "./client";

export function login(email, password) {
  return api("/auth/login", { method: "POST", json: { email: email.trim(), password }, public: true });
}
export async function signup(name, email, password) {
  const result = await api("/auth/register", { method: "POST", json: { email: email.trim(), password }, public: true });
  // The backend registration schema intentionally accepts email/password only.
  // Save the display name to the user's private profile without replacing other profile fields.
  const { updateProfile } = await import("./profile");
  await updateProfile({ name: name.trim() });
  return result;
}
export function logout() {
  return api("/auth/logout", { method: "POST" });
}
export const googleConfigured = () => false;
export function getGoogleLoginUrl() {
  throw new Error("Google sign-in is not implemented by the connected backend. Use email and password.");
}
export function googleDemoLogin() {
  throw new Error("Demo sign-in is disabled. Use a real backend account.");
}
export function finishGoogleLogin() {
  throw new Error("Google sign-in is not implemented by the connected backend.");
}
export function getCurrentSession() {
  return api("/auth/me");
}
