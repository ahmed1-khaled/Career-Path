# StepUp integration with the Career Path FastAPI backend

This document describes the routes currently implemented by the backend and consumed by the frontend.

## API base

`http://localhost:8000/api` by default. The frontend appends `/api` to `VITE_API_URL` unless the value already ends with `/api`.

## Authentication

- `POST /auth/register` — JSON `{ "email": "...", "password": "..." }`; returns `{ user, csrf_token, message }` and sets the `session_token` (HttpOnly) and `csrf_token` cookies.
- `POST /auth/login` — same request/response shape.
- `GET /auth/me` — returns the current user and CSRF token.
- `POST /auth/logout` — revokes the current session and clears auth cookies.

All requests use `credentials: include`. For cookie-authenticated `POST`, `PUT`, `PATCH`, and `DELETE` requests, the frontend sends `X-CSRF-Token` using the CSRF cookie or latest response token. The HttpOnly session token is never stored in localStorage.

The registration schema accepts email and password. The frontend creates the account first, then stores the display name through the profile endpoint.

## Profile and CV

- `GET /profile` — returns the authenticated user's `ProfileRead`.
- `PUT /profile` — accepts the complete `ProfileUpdate` schema. The frontend reads the current profile and merges changes before saving, preserving fields it does not edit.
- `POST /profile/resume` — multipart field `file`; supported extensions are PDF, DOC, DOCX, and RTF, with a 2 MB upload limit.
- `GET /profile/resume/text` — returns extracted resume text.
- `GET /profile/resume/download` — downloads the current user's resume.
- `DELETE /profile/resume` — removes the current resume file and extracted text.
- `POST /profile/resume/suggestions` — returns heuristic suggestions from extracted text. Suggestions are not saved automatically.

The current suggestions endpoint is heuristic, not a full OCR or general-purpose CV parser. Scanned PDFs or files without selectable text may not produce suggestions. Review and edit extracted or manually entered profile details before saving.

## Jobs and matching

- `GET /jobs` — public catalog of stored jobs.
- `GET /jobs/matches` — authenticated profile-fit results, including match score, matched keywords, reasons, and optional semantic-ranking metadata.
- `GET /jobs/saved` — list of the authenticated user's saved jobs.
- `POST /jobs/saved` — JSON `{ "job_id": 123 }`; saves a catalog job for the current user.
- `DELETE /jobs/saved/{job_id}` — removes only the current user's bookmark.
- `POST /jobs/{job_id}/analysis` — authenticated, resume-grounded role-fit analysis. It returns evidenced skills, skills not found in the profile, experience/location assessments, evidence, concerns, and suggested screening questions.

The backend does not expose a standalone `GET /jobs/{id}`; the frontend resolves job details from the current matches or saved jobs, then calls the analysis endpoint.

## Other backend features

The backend also provides application tracking, application queue preparation, source management/discovery, analytics, and Excel export endpoints. Those routes are available for future frontend screens.

## Not currently implemented

- Google or Cognito login.
- Account deletion.
- Asynchronous resume-processing polling.

The backend registration and profile APIs use cookie-based sessions and CSRF protection. Do not replace these with fabricated Bearer tokens or persist session cookies in browser storage.
