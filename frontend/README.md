# StepUp frontend (React + Vite)

## Run on Windows / macOS / Linux

1. Install Node.js LTS (includes npm).
2. Open a terminal in this `stepup-frontend` folder.
3. Copy `.env.example` to `.env` if you need to change the backend address.
4. Run:

```bash
npm install
npm run dev
```

Vite normally opens `http://localhost:5173`. The supplied backend allows the default development origins on ports 5173 and 5174.

## Backend connection

This frontend is adapted for the FastAPI backend supplied with the project.

- Default API base: `http://localhost:8000/api`
- Override with `VITE_API_URL` (set the backend root, e.g. `http://localhost:8000`; `/api` is appended automatically).
- Use the same hostname on both sides: do not mix `localhost` and `127.0.0.1`.
- Authentication uses the backend's HttpOnly `session_token` cookie and readable `csrf_token` cookie. The frontend sends requests with `credentials: include` and adds `X-CSRF-Token` on state-changing requests.
- No session token is stored in localStorage.
- Google/Cognito login is not implemented by this backend and is not shown.
- The backend accepts resume uploads up to 2 MB. It processes the file during upload; there is no asynchronous resume polling endpoint.

## Backend features not currently exposed

The supplied backend does not currently provide saved-job endpoints, a delete-account endpoint, StepUp's preferences endpoint, or a standalone job detail endpoint. The frontend does not fake these operations: saved-job controls are disabled and unsupported account deletion is not offered. Job details are resolved from the authenticated job-matches response.

The backend's profile API uses `PUT /api/profile` with its `ProfileUpdate` schema. StepUp adapts its form fields to the backend's existing profile fields without changing the backend.

## Build

```bash
npm run build
```

## Notes

- The frontend is designed to work with real backend data; mock API calls are not used by the API modules.
- CV suggestions come from `POST /api/profile/resume/suggestions`; they are heuristic suggestions and should be reviewed before saving.
- Job match results come from `GET /api/jobs/matches`.
- This README does not claim the application has been tested against a running backend; configure and start the backend before performing end-to-end tests.
