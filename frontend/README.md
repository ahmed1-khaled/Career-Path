# StepUp frontend (React + Vite)

## Run locally

1. Install Node.js LTS (includes npm).
2. Open a terminal in the `frontend` folder.
3. Copy `.env.example` to `.env` only if you need to change the backend address.
4. Run:

```bash
npm ci
npm run dev
```

Vite normally opens `http://localhost:5173`. The supplied backend allows the default development origins on ports 5173 and 5174.

## Backend connection

- Default API base: `http://localhost:8000/api`.
- Override with `VITE_API_URL` (set the backend root, e.g. `http://localhost:8000`; `/api` is appended automatically).
- Use the same hostname on both sides; do not mix `localhost` and `127.0.0.1`.
- Authentication uses the backend's HttpOnly `session_token` cookie and readable `csrf_token` cookie. Requests include credentials and state-changing requests include `X-CSRF-Token`.
- No session token is stored in localStorage.
- Google/Cognito login is not implemented by the supplied backend.
- Resume uploads support PDF, DOC, DOCX, and RTF up to 2 MB. Text extraction happens during upload; there is no asynchronous polling endpoint.

## Integrated workflows

- Registration, login, logout, and session restoration use the real cookie-based backend.
- CV uploads are stored per authenticated user. Extracted-text suggestions are heuristic and must be reviewed before saving.
- Profile, preferences, and skills are saved through `PUT /api/profile`.
- Job recommendations use `GET /api/jobs/matches`.
- Saved jobs use the authenticated `GET/POST /api/jobs/saved` routes and `DELETE /api/jobs/saved/{job_id}`.
- Opening a job loads the matching/saved record and requests `POST /api/jobs/{job_id}/analysis` for skill gaps, experience/location fit, supporting evidence, concerns, and suggested screening questions.
- Account deletion and Google/Cognito sign-in are not available in this backend.

The backend does not expose a standalone `GET /api/jobs/{id}`; job details are resolved from the matches or saved-jobs lists.

## CV data and AI privacy

Resume files and extracted text are stored by the backend. The default local setup stores files under `backend/data/resumes/` and profile data in SQLite. The CV is used for profile creation and job-fit analysis.

When Ollama is configured as a local provider, AI processing can remain on the configured machine. If an external OpenAI-compatible provider is configured, professional profile and resume context may be sent to that provider for analysis. Review the provider's privacy and retention terms before enabling it. Never commit local resume files, database files, or real environment credentials.

## Build

```bash
npm run build
```

The GitHub Actions workflow installs dependencies, runs the frontend production build, compiles the backend, runs the backend suite, and checks release metadata and private-data exclusions.
