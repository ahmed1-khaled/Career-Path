# Career Path — AI-powered CV & Job Matching Platform

**Current version: v4.73.0**

Career Path is a CV-based career guidance platform. It combines a React/Vite web interface with a FastAPI backend to help candidates upload a CV, review extracted profile information, and explore job matches based on their skills and preferences.

The current web interface is branded **StepUp** in several frontend screens. The repository name remains **Career-Path**.

## What is included

- **CV upload and extraction:** accepts PDF, DOC, DOCX, and RTF files up to 2 MB. The backend extracts selectable text where supported.
- **Profile review:** review and edit personal details, summary, skills, education, experience, certifications, and projects.
- **Job matching:** retrieve recommended jobs and match explanations from the backend using the candidate profile.
- **Authentication:** email/password registration and login with server-managed sessions, HttpOnly session cookies, and CSRF protection.
- **Job discovery backend:** supports configured job feeds and company boards, with optional provider integrations.
- **Optional AI services:** Ollama/local model support and optional OpenAI-compatible providers for AI-assisted workflows.

## Current implementation limits

The repository contains an integration snapshot, not a claim that every planned feature is complete or production deployed.

- Google or Cognito sign-in is not implemented by the supplied backend.
- Saved-job persistence is not currently exposed as a complete frontend/backend workflow.
- The default backend database is SQLite for local development.
- No Huawei Cloud deployment or cloud-hosted production environment is claimed as completed.
- Job-source coverage depends on provider availability, configuration, indexing, and applicable site terms.
- The development servers should not be exposed directly to the public internet.

## Technology

| Layer | Technologies |
|---|---|
| Frontend | React 18, React Router, Vite |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | SQLite by default; configurable through environment settings |
| CV processing | pypdf, python-docx, multipart uploads |
| AI integrations | Ollama and optional OpenAI-compatible providers |
| Testing | pytest, GitHub Actions, frontend production build |

## Run locally on Windows

### Requirements

- Python 3.12 recommended
- Node.js 20 or newer with npm
- Git

### Setup

Clone the repository and open PowerShell in the project root:

```powershell
git clone https://github.com/ahmed1-khaled/Career-Path.git
cd Career-Path

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup_windows.ps1
```

Start the application:

```powershell
.\scripts\start_windows.ps1
```

Default local endpoints:

| Service | URL |
|---|---|
| Web interface | http://127.0.0.1:5173 |
| API health | http://127.0.0.1:8000/api/health |
| API documentation | http://127.0.0.1:8000/docs |

The setup scripts create local environment files when needed. Review the sample values in `.env.example`, `backend/.env.example`, and `frontend/.env.example`; keep real credentials and local environment files out of Git.

## Development checks

Backend tests:

```powershell
cd backend
$env:PYTHONPATH = "."
python -m pytest -q
```

Frontend build:

```powershell
cd frontend
npm ci --no-audit --no-fund
npm run build
```

Repository release checks:

```powershell
cd ..
python scripts/check_release.py --root .
python scripts/validate_release.py --root .
```

GitHub Actions runs backend tests, frontend build, and repository release validation on pushes and pull requests.

## Repository structure

```text
Career-Path/
├── backend/       # FastAPI application, authentication, CV processing, matching
├── frontend/      # React/Vite web application
├── docs/          # Setup and technical documentation
├── scripts/       # Windows setup, launch, and release checks
├── .github/       # CI workflow
├── VERSION
├── CHANGELOG.md
└── LICENSE
```

## Documentation

- [Windows quick start](docs/windows-quick-start.md)
- [Frontend setup and backend integration notes](frontend/README.md)
- [Frontend API contract](frontend/docs/API_CONTRACT.md)
- [Public release checklist](docs/public-release-checklist.md)
- [Security policy](SECURITY.md)
- [Asset notices and attribution](ASSET_NOTICES.md)
- [Changelog](CHANGELOG.md)

## Attribution and license

The backend and portions of the project structure are based on the [Insideofcub/ai-job-hunter](https://github.com/Insideofcub/ai-job-hunter) MIT-licensed project. Preserve the upstream license and notices when modifying or redistributing applicable code. See [LICENSE](LICENSE) and [ASSET_NOTICES.md](ASSET_NOTICES.md).

The current project is an evolving academic/software project. Verify setup, authentication, CV processing, API integration, and job-matching behavior in a local environment before presenting it as a deployed or production-ready service.
