# API contract (PROPOSED, not implemented by the frontend team)

Everything below is what the frontend calls when `VITE_USE_MOCK=false`. Confirm or change each item with the backend team,
then edit the matching file in `src/api/`. All requests send `Authorization: Bearer <token>` except `public` ones.
Errors: JSON `{ "detail": "message" }` with a proper status code. 401 = session expired.

| Method & path | Body | Returns |
|---|---|---|
| POST /auth/login (public) | `{email, password}` | `{token, user:{name,email,onboarded}}` |
| POST /auth/signup (public) | `{name, email, password}` | same |
| POST /auth/google (public) | `{code, redirect_uri}` (Cognito code; backend exchanges it) | same |
| GET /profile | | `{name,email,onboarded,has_cv,cv_score,skills[],preferences{target_roles[],experience_level,preferred_location,work_types[]},resume{id,filename,size,uploaded_at}\|null}` |
| PATCH /profile | `{name}` | profile |
| PUT /profile/skills | `{skills[]}` | `{skills}` |
| PUT /profile/preferences | preferences (also marks onboarding done) | preferences |
| GET /profile/cv-analysis | | `{personal{full_name,email,phone,location,linkedin_url,portfolio_url},summary,skills[],education[],experience[],certifications[],projects[]}` or 404 |
| PUT /profile/cv-analysis | same shape (`skills` updates profile skills) | same |
| DELETE /account | | 204 (deletes everything) |
| POST /resumes | multipart `file` | `{id,filename,size,status:"processing"}` |
| GET /resumes/:id | | `{id,status:"processing"\|"completed"\|"failed",error?}` |
| DELETE /resumes/:id | | 204 (file + extracted data) |
| GET /jobs | | `[{id,title,company,location,work_type,match_score,matched_skills[],missing_skills[],description,requirements[],reason,apply_url\|null,is_saved}]` |
| GET /jobs/:id | | one job |
| GET /jobs/saved | | jobs with `is_saved: true` (declare before `/jobs/{id}` in FastAPI) |
| POST / DELETE /jobs/:id/save | | 204 |

Backend must validate: file type, size (5 MB), and real content of uploads (the frontend check is only a convenience);
CORS for the frontend origin; token storage (httpOnly cookie is safer than localStorage).
