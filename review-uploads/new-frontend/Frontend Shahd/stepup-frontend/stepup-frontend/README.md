# StepUp frontend (React + Vite)

## Run on Windows
1. Install Node.js LTS from https://nodejs.org (includes npm), then restart your terminal.
2. Unzip the project, open the folder `stepup-frontend`, click the address bar, type `cmd`, press Enter.
3. Run:
```
npm install
npm run dev
```
4. Open http://localhost:5173 in your browser (stop the server with Ctrl+C).

## Commands
```
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```
Copy `.env.example` to `.env` if you want to change settings. Default is **Demo mode**.

## What is real and what is mock
| Area | Status |
|---|---|
| Pages, routes, ProtectedRoute, forms, validation, loading/error/empty states | Real |
| API client (timeout, network errors, non-JSON, 401 -> login) | Real, tested only against failing/unreachable servers |
| Login, Google, CV analysis, jobs, matching, saved jobs, profile saving | **Mock in Demo mode** (saved in this browser's localStorage). Real calls exist in `src/api/*` but are untested until the backend matches `docs/API_CONTRACT.md` |
| Google login | Needs Cognito values in `.env` and a backend `POST /auth/google` |
| Job data / apply links | Fake sample jobs (`example.com` links). Jobs 11 and 12 have no link on purpose |
| Course suggestions | Search links to YouTube/Coursera/Udemy, not curated courses |
| Privacy / Terms | Draft templates, must be replaced |

Demo tips: any email/password works; a CV file whose name contains `fail` simulates a failed analysis; a new email = new empty account.

## Connecting the backend
1. Agree on `docs/API_CONTRACT.md` with the backend team.
2. Set `VITE_USE_MOCK=false` and `VITE_API_URL=...` in `.env`.
3. Fix any field-name differences in `src/api/*.js`. `src/mocks/` can then be deleted.

## Structure
`src/api` API calls · `src/mocks` demo backend · `src/pages` screens · `src/components` shared UI · `src/context` auth · `src/utils` helpers · `src/styles.css` design system.
