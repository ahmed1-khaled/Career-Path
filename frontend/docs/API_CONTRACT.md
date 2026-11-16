# StepUp integration with the supplied FastAPI backend

This document records the routes and payloads implemented by the supplied backend. It replaces the original proposed StepUp API contract.

## API base

`http://localhost:8000/api` by default. The frontend appends `/api` to `VITE_API_URL` unless the value already ends with `/api`.

## Authentication

- `POST /auth/register` — JSON `{ "email": "...", "password": "..." }`; returns `{ user, csrf_token, message }` and sets `session_token` (HttpOnly) plus `csrf_token` cookies.
- `POST /auth/login` — same request/response shape.
- `GET /auth/me` — returns current `{ user, csrf_token, message }`.
- `POST /auth/logout` — revokes the current session and clears auth cookies.

All requests use `credentials: include`. For cookie-authenticated `POST`, `PUT`, `PATCH`, and `DELETE` requests, send `X-CSRF-Token` using the `csrf_token` cookie or response field. Do not store the HttpOnly session token in localStorage or send a fabricated Bearer token.

The backend registration schema does not accept a `name` field. StepUp creates the account with email/password, then stores the display name in the user's profile.

## Profile and resume

- `GET /profile` — returns `ProfileRead`.
- `PUT /profile` — accepts the complete `ProfileUpdate` schema. The frontend first reads the current profile and merges changes before sending the full update to avoid overwriting existing profile fields with schema defaults.
- `POST /profile/resume` — multipart field `file`; supported PDF, DOC, DOCX, RTF, max 2 MB. Processing/extraction result is returned immediately.
- `GET /profile/resume/text` — returns extracted text.
- `GET /profile/resume/download` — downloads the current resume.
- `DELETE /profile/resume` — deletes the current resume and its extracted text.
- `POST /profile/resume/suggestions` — returns heuristic profile suggestions; it does not save them automatically.

There are no `/profile/skills`, `/profile/preferences`, `/profile/cv-analysis`, or `/account` routes. StepUp adapts its skills/preferences/CV-review forms to `PUT /profile` and does not offer account deletion because the backend has no account-deletion route.

## Jobs and applications

- `GET /jobs` — public list of stored jobs (`JobRead`).
- `GET /jobs/matches` — authenticated list of `{ job, match_score, matched_keywords, reasons, ... }` (`JobMatchRead`).
- `POST /jobs/{job_id}/analysis` — authenticated analysis for a stored job.
- Application tracking is available under `/applications` and `/applications/...` routes.

The backend does not currently expose a standalone `GET /jobs/{id}`, saved-job list, or save/unsave endpoints. The frontend resolves details from the current matches list and disables saved-job actions instead of simulating persistence.

## Features not implemented by this backend

- Google/Cognito login (`/auth/google` is not implemented).
- Saved jobs.
- Account deletion.
- StepUp-specific asynchronous resume polling.
