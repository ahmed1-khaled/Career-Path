// Configuration for the existing FastAPI backend.
// VITE_API_URL may be "http://localhost:8000" or "http://localhost:8000/api".
const configuredApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, "");
export const API_URL = normalizedApiUrl.endsWith("/api") ? normalizedApiUrl : `${normalizedApiUrl}/api`;

// This backend does not expose the StepUp Cognito/Google OAuth flow.
export const USE_MOCK = false;
export const COGNITO = { domain: "", clientId: "", redirectUri: `${window.location.origin}/auth/callback` };

// The backend enforces a 2 MB resume upload limit.
export const CV_MAX_MB = 2;
