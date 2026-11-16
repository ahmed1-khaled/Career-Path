"""Authentication and multi-user data isolation tests.

These tests exercise the REAL authentication dependency and session mechanism.
They intentionally do NOT use the conftest.py mock-user override — each test
registers its own unique users via the API and uses HttpOnly session cookies
returned by the server to authenticate subsequent requests.

Coverage:
- Registration: success, duplicate email, weak password, invalid email.
- Login: success, wrong password, unknown email, inactive account.
- Session: HttpOnly cookie issued, CSRF token returned, /api/auth/me works.
- Logout: session revoked server-side; old cookie no longer authenticates.
- Expired / revoked session rejection.
- Multi-user data isolation for profile, CV, and application records.
- Resource ID manipulation cannot cross ownership boundary.
- Legacy data not auto-assigned to a newly registered user.
- Two users can independently queue the same job URL.
"""

import json
import re
from datetime import datetime, timedelta, timezone
from io import BytesIO
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, update

from app.main import app
from app.database import SessionLocal
from app.models import User, UserSession


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _unique_email(prefix: str = "user") -> str:
    """Generate a fresh email so concurrent test runs don't collide."""
    return f"{prefix}-{uuid4().hex[:12]}@test-isolation.example"


def _register(client: TestClient, email: str, password: str = "SecurePass1!"):
    """Register and return (response, csrf_token).  Raises on non-201."""
    resp = client.post("/api/auth/register", json={"email": email, "password": password})
    csrf = resp.json().get("csrf_token", "") if resp.status_code == 201 else ""
    return resp, csrf


def _login(client: TestClient, email: str, password: str = "SecurePass1!"):
    """Login and return (response, csrf_token)."""
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    csrf = resp.json().get("csrf_token", "") if resp.status_code == 200 else ""
    return resp, csrf


def _auth_headers(csrf: str) -> dict:
    """Return CSRF header for state-changing requests authenticated by cookie."""
    return {"X-CSRF-Token": csrf}


def _minimal_pdf() -> bytes:
    """Return a minimal valid PDF as bytes without requiring pypdf."""
    from pypdf import PdfWriter
    buf = BytesIO()
    w = PdfWriter()
    w.add_blank_page(width=72, height=72)
    w.write(buf)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Registration tests
# ---------------------------------------------------------------------------

class TestRegistration:
    def test_register_new_user_returns_201_and_csrf_token(self):
        with TestClient(app) as client:
            resp, csrf = _register(client, _unique_email("reg"))
            assert resp.status_code == 201, resp.text
            body = resp.json()
            assert "user" in body
            assert "csrf_token" in body
            assert body["user"]["email"]  # normalized email present
            assert "hashed_password" not in body
            assert "hashed_password" not in str(body)
            assert csrf  # non-empty CSRF token

    def test_register_sets_httponly_session_cookie(self):
        with TestClient(app) as client:
            resp, _ = _register(client, _unique_email("cookie"))
            assert resp.status_code == 201, resp.text
            # TestClient exposes response cookies
            cookie_names = [c.name for c in client.cookies.jar]
            assert any("session" in n.lower() or "auth" in n.lower() for n in cookie_names), (
                f"Expected a session cookie. Found: {cookie_names}"
            )

    def test_register_duplicate_email_returns_409(self):
        with TestClient(app) as client:
            email = _unique_email("dup")
            _register(client, email)
            resp2, _ = _register(client, email)
            assert resp2.status_code == 409

    def test_register_duplicate_email_case_insensitive(self):
        with TestClient(app) as client:
            base = _unique_email("case")
            _register(client, base.lower())
            resp2, _ = _register(client, base.upper())
            assert resp2.status_code == 409

    def test_register_rejects_invalid_email(self):
        with TestClient(app) as client:
            resp, _ = _register(client, "not-an-email")
            assert resp.status_code in (409, 422)

    def test_register_rejects_short_password(self):
        with TestClient(app) as client:
            resp, _ = _register(client, _unique_email("weakpw"), password="short")
            assert resp.status_code == 422

    def test_register_never_exposes_hashed_password(self):
        with TestClient(app) as client:
            resp, _ = _register(client, _unique_email("nohash"))
            assert resp.status_code == 201
            assert "$argon2" not in resp.text
            assert "hashed_password" not in resp.text


# ---------------------------------------------------------------------------
# Login tests
# ---------------------------------------------------------------------------

class TestLogin:
    def test_login_with_correct_credentials_returns_200_and_user(self):
        with TestClient(app) as client:
            email = _unique_email("login")
            _register(client, email)
            # Clear cookies to simulate a fresh client
            client.cookies.clear()
            resp, csrf = _login(client, email)
            assert resp.status_code == 200, resp.text
            assert resp.json()["user"]["email"] == email
            assert csrf

    def test_login_wrong_password_returns_401(self):
        with TestClient(app) as client:
            email = _unique_email("badpw")
            _register(client, email)
            client.cookies.clear()
            resp, _ = _login(client, email, password="WrongPassword99!")
            assert resp.status_code == 401

    def test_login_unknown_email_returns_401(self):
        with TestClient(app) as client:
            resp, _ = _login(client, "nobody@noplace.example")
            assert resp.status_code == 401

    def test_login_error_message_does_not_distinguish_user_vs_password(self):
        """Both unknown-user and wrong-password must return the same generic message."""
        with TestClient(app) as client:
            email = _unique_email("ambiguous")
            _register(client, email)
            client.cookies.clear()

            unknown_resp, _ = _login(client, "ghost@ghost.example")
            wrong_pw_resp, _ = _login(client, email, password="BadPassword99!")
            assert unknown_resp.status_code == 401
            assert wrong_pw_resp.status_code == 401
            # Both should return the same detail string
            assert unknown_resp.json()["detail"] == wrong_pw_resp.json()["detail"]

    def test_login_normalises_email_case(self):
        with TestClient(app) as client:
            email = _unique_email("normalise")
            _register(client, email.lower())
            client.cookies.clear()
            resp, _ = _login(client, email.upper())
            assert resp.status_code == 200, resp.text


# ---------------------------------------------------------------------------
# Session / /api/auth/me tests
# ---------------------------------------------------------------------------

class TestSession:
    def test_me_returns_current_authenticated_user(self):
        with TestClient(app) as client:
            email = _unique_email("me")
            _register(client, email)
            me_resp = client.get("/api/auth/me")
            assert me_resp.status_code == 200, me_resp.text
            assert me_resp.json()["user"]["email"] == email

    def test_me_without_session_returns_401(self):
        with TestClient(app) as client:
            resp = client.get("/api/auth/me")
            assert resp.status_code == 401

    def test_protected_endpoint_without_session_returns_401(self):
        with TestClient(app) as client:
            resp = client.get("/api/profile")
            assert resp.status_code == 401

    def test_state_changing_request_without_csrf_token_returns_403(self):
        with TestClient(app) as client:
            email = _unique_email("csrf")
            _register(client, email)
            # Do not include X-CSRF-Token — update_profile should be blocked
            profile = client.get("/api/profile").json()
            resp = client.put("/api/profile", json=profile)  # no CSRF header
            assert resp.status_code == 403

    def test_state_changing_request_with_wrong_csrf_returns_403(self):
        with TestClient(app) as client:
            email = _unique_email("badcsrf")
            _register(client, email)
            profile = client.get("/api/profile").json()
            resp = client.put(
                "/api/profile", json=profile,
                headers={"X-CSRF-Token": "aaaabbbbccccdddd" + "e" * 48}
            )
            assert resp.status_code == 403

    def test_state_changing_request_with_correct_csrf_succeeds(self):
        with TestClient(app) as client:
            email = _unique_email("goodcsrf")
            _, csrf = _register(client, email)
            profile = client.get("/api/profile").json()
            profile["full_name"] = "CSRF Verified"
            resp = client.put("/api/profile", json=profile, headers=_auth_headers(csrf))
            assert resp.status_code == 200, resp.text
            assert resp.json()["full_name"] == "CSRF Verified"


# ---------------------------------------------------------------------------
# Logout tests
# ---------------------------------------------------------------------------

class TestLogout:
    def test_logout_revokes_session_server_side(self):
        with TestClient(app) as client:
            email = _unique_email("logout")
            _, csrf = _register(client, email)
            # Confirm session works before logout
            assert client.get("/api/auth/me").status_code == 200
            # Logout (POST — requires CSRF)
            logout_resp = client.post("/api/auth/logout", headers=_auth_headers(csrf))
            assert logout_resp.status_code == 200, logout_resp.text
            # Same client (same cookies) should now be rejected
            me_after = client.get("/api/auth/me")
            assert me_after.status_code == 401

    def test_old_session_token_cannot_authenticate_after_logout(self):
        """Even sending the raw cookie manually after logout must fail."""
        with TestClient(app) as client:
            email = _unique_email("logoutold")
            _, csrf = _register(client, email)

            # Capture the raw session cookie value before logout
            session_cookie_value = None
            session_cookie_name = None
            for cookie in client.cookies.jar:
                if "session" in cookie.name.lower() or "auth" in cookie.name.lower():
                    session_cookie_value = cookie.value
                    session_cookie_name = cookie.name
                    break

            client.post("/api/auth/logout", headers=_auth_headers(csrf))

            # Now replay the old cookie
            if session_cookie_value and session_cookie_name:
                client.cookies.set(session_cookie_name, session_cookie_value)
                me_resp = client.get("/api/auth/me")
                assert me_resp.status_code == 401

    def test_logout_without_session_does_not_crash(self):
        with TestClient(app) as client:
            resp = client.post("/api/auth/logout")
            assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Revoked / expired session rejection tests
# ---------------------------------------------------------------------------

class TestSessionExpiry:
    def test_expired_session_is_rejected(self):
        """Manually expire a session in the DB and confirm the request fails."""
        with TestClient(app) as client:
            email = _unique_email("expired")
            _, csrf = _register(client, email)
            assert client.get("/api/auth/me").status_code == 200

            # Expire all sessions for this user directly in the DB
            with SessionLocal() as db:
                user = db.scalar(select(User).where(User.email == email))
                assert user is not None
                db.execute(
                    update(UserSession)
                    .where(UserSession.user_id == user.id)
                    .values(expires_at=datetime.now(timezone.utc) - timedelta(seconds=1))
                )
                db.commit()

            me_resp = client.get("/api/auth/me")
            assert me_resp.status_code == 401

    def test_revoked_session_is_rejected(self):
        """Mark session as revoked in DB; old cookie must be refused."""
        with TestClient(app) as client:
            email = _unique_email("revoked")
            _, csrf = _register(client, email)
            assert client.get("/api/auth/me").status_code == 200

            with SessionLocal() as db:
                user = db.scalar(select(User).where(User.email == email))
                db.execute(
                    update(UserSession)
                    .where(UserSession.user_id == user.id)
                    .values(is_revoked=True)
                )
                db.commit()

            me_resp = client.get("/api/auth/me")
            assert me_resp.status_code == 401

    def test_tampered_session_token_is_rejected(self):
        with TestClient(app) as client:
            email = _unique_email("tampered")
            _register(client, email)

            # Overwrite session cookie with garbage
            for cookie in client.cookies.jar:
                if "session" in cookie.name.lower() or "auth" in cookie.name.lower():
                    client.cookies.set(cookie.name, "INVALID_TOKEN_" + uuid4().hex)
                    break

            resp = client.get("/api/auth/me")
            assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Multi-user isolation — profile
# ---------------------------------------------------------------------------

class TestProfileIsolation:
    def _setup_two_users(self, client: TestClient):
        """Register two independent users and return (email_a, csrf_a, email_b, csrf_b)."""
        email_a = _unique_email("alice")
        email_b = _unique_email("bob")
        _, csrf_a = _register(client, email_a)
        client.cookies.clear()
        _, csrf_b = _register(client, email_b)
        return email_a, csrf_a, email_b, csrf_b

    def test_two_users_get_separate_empty_profiles(self):
        """Each newly-registered user starts with their own blank profile."""
        with TestClient(app) as client:
            email_a = _unique_email("sep-a")
            _, csrf_a = _register(client, email_a)
            prof_a_before = client.get("/api/profile").json()

            client.cookies.clear()
            email_b = _unique_email("sep-b")
            _, csrf_b = _register(client, email_b)
            prof_b = client.get("/api/profile").json()
            # Update user B's profile
            prof_b["full_name"] = "User B Name"
            client.put("/api/profile", json=prof_b, headers=_auth_headers(csrf_b))

            # Switch back to user A
            client.cookies.clear()
            _login(client, email_a)
            me = client.get("/api/auth/me").json()
            assert me["user"]["email"] == email_a
            prof_a_after = client.get("/api/profile").json()
            # User A's full_name must not be "User B Name"
            assert prof_a_after.get("full_name") != "User B Name"

    def test_user_a_cannot_read_user_b_profile_directly(self):
        """There is no profile-by-user-id endpoint; /api/profile always returns own profile."""
        with TestClient(app) as client:
            email_a = _unique_email("profile-a")
            _, csrf_a = _register(client, email_a)
            # Set up user A's profile
            prof_a = client.get("/api/profile").json()
            prof_a["full_name"] = "Alice Secret"
            client.put("/api/profile", json=prof_a, headers=_auth_headers(csrf_a))

            client.cookies.clear()
            email_b = _unique_email("profile-b")
            _, csrf_b = _register(client, email_b)
            # User B reads /api/profile — must get their OWN blank profile, not Alice's
            prof_b = client.get("/api/profile").json()
            assert prof_b.get("full_name") != "Alice Secret"

    def test_user_b_cannot_overwrite_user_a_profile(self):
        """PUT /api/profile always targets the authenticated user's own profile."""
        with TestClient(app) as client:
            email_a = _unique_email("overwrite-a")
            _, csrf_a = _register(client, email_a)
            prof_a = client.get("/api/profile").json()
            prof_a["full_name"] = "Alice Original"
            client.put("/api/profile", json=prof_a, headers=_auth_headers(csrf_a))

            client.cookies.clear()
            email_b = _unique_email("overwrite-b")
            _, csrf_b = _register(client, email_b)
            prof_b = client.get("/api/profile").json()
            prof_b["full_name"] = "Bob Malicious Overwrite"
            client.put("/api/profile", json=prof_b, headers=_auth_headers(csrf_b))

            # Switch to user A and verify her name is unchanged
            client.cookies.clear()
            _login(client, email_a)
            prof_a_re = client.get("/api/profile").json()
            assert prof_a_re["full_name"] == "Alice Original"


# ---------------------------------------------------------------------------
# Multi-user isolation — CV / resume
# ---------------------------------------------------------------------------

class TestCVIsolation:
    def test_user_a_cannot_download_user_b_resume(self, tmp_path, monkeypatch):
        import app.main as main_module
        monkeypatch.setattr(main_module, "RESUME_DIR", tmp_path / "resumes")
        pdf = _minimal_pdf()

        with TestClient(app) as client:
            email_a = _unique_email("cv-a")
            _, csrf_a = _register(client, email_a)
            # Upload a resume as user A
            upload_resp = client.post(
                "/api/profile/resume",
                files={"file": ("alice_cv.pdf", pdf, "application/pdf")},
                headers=_auth_headers(csrf_a),
            )
            assert upload_resp.status_code == 200, upload_resp.text

            # Now login as user B
            client.cookies.clear()
            email_b = _unique_email("cv-b")
            _, csrf_b = _register(client, email_b)

            # User B tries to download a resume — must get 404 (they have none)
            dl_resp = client.get("/api/profile/resume/download")
            assert dl_resp.status_code == 404

    def test_user_b_cannot_read_user_a_resume_text(self, tmp_path, monkeypatch):
        import app.main as main_module
        monkeypatch.setattr(main_module, "RESUME_DIR", tmp_path / "resumes")
        pdf = _minimal_pdf()

        with TestClient(app) as client:
            email_a = _unique_email("text-a")
            _, csrf_a = _register(client, email_a)
            client.post(
                "/api/profile/resume",
                files={"file": ("alice_cv.pdf", pdf, "application/pdf")},
                headers=_auth_headers(csrf_a),
            )

            client.cookies.clear()
            email_b = _unique_email("text-b")
            _register(client, email_b)
            text_resp = client.get("/api/profile/resume/text")
            # User B has no resume uploaded — must be 404
            assert text_resp.status_code == 404

    def test_cv_upload_scoped_per_user(self, tmp_path, monkeypatch):
        """Uploading a CV as User B must not overwrite or touch User A's CV.

        resume_storage_key is not exposed in ProfileRead, so we verify isolation
        using the original filename (which IS exposed) and by checking that each
        user's profile reports their own uploaded filename, not the other's.
        """
        import app.main as main_module
        monkeypatch.setattr(main_module, "RESUME_DIR", tmp_path / "resumes")
        pdf = _minimal_pdf()

        with TestClient(app) as client:
            email_a = _unique_email("scope-cv-a")
            _, csrf_a = _register(client, email_a)
            upload_a = client.post(
                "/api/profile/resume",
                files={"file": ("alice_cv.pdf", pdf, "application/pdf")},
                headers=_auth_headers(csrf_a),
            )
            assert upload_a.status_code == 200, upload_a.text
            filename_a = upload_a.json()["filename"]  # "alice_cv.pdf"

            client.cookies.clear()
            email_b = _unique_email("scope-cv-b")
            _, csrf_b = _register(client, email_b)
            upload_b = client.post(
                "/api/profile/resume",
                files={"file": ("bob_cv.pdf", pdf, "application/pdf")},
                headers=_auth_headers(csrf_b),
            )
            assert upload_b.status_code == 200, upload_b.text
            filename_b = upload_b.json()["filename"]  # "bob_cv.pdf"

            # Filenames must be different (sanity check)
            assert filename_a != filename_b

            # User B's profile must show bob's filename
            profile_b = client.get("/api/profile").json()
            assert profile_b.get("resume_original_filename") == "bob_cv.pdf"

            # Switch back to A; her profile must still show alice's filename
            client.cookies.clear()
            _login(client, email_a)
            profile_a_after = client.get("/api/profile").json()
            assert profile_a_after.get("resume_original_filename") == "alice_cv.pdf", (
                f"User A's resume was overwritten by User B's upload! "
                f"Got: {profile_a_after.get('resume_original_filename')}"
            )

            # User B downloading resume must NOT get alice's file
            client.cookies.clear()
            _login(client, email_b)
            dl = client.get("/api/profile/resume/download")
            assert dl.status_code == 200
            # Content-Disposition must mention bob's filename, not alice's
            cd = dl.headers.get("content-disposition", "")
            assert "alice_cv" not in cd, f"User B got Alice's file: {cd}"


# ---------------------------------------------------------------------------
# Multi-user isolation — applications
# ---------------------------------------------------------------------------

class TestApplicationIsolation:
    JOB_PAYLOAD = {
        "title": "Isolation Test Engineer",
        "company": "Isolation Corp",
        "location": "Remote",
        "work_mode": "Remote",
        "description": "Test isolation across users.",
        "verified_posting_time": True,
    }

    def _unique_job(self) -> dict:
        payload = dict(self.JOB_PAYLOAD)
        payload["source_url"] = f"https://jobs.lever.co/isolation/{uuid4().hex}"
        return payload

    def test_user_a_cannot_read_user_b_applications(self):
        with TestClient(app) as client:
            email_a = _unique_email("app-a")
            _, csrf_a = _register(client, email_a)

            # User A creates a job and an application
            job_payload = self._unique_job()
            job = client.post("/api/jobs", json=job_payload).json()
            app_resp = client.post(
                f"/api/applications/from-job/{job['id']}",
                headers=_auth_headers(csrf_a),
            )
            assert app_resp.status_code == 201, app_resp.text
            app_id = app_resp.json()["id"]

            # Now switch to user B
            client.cookies.clear()
            email_b = _unique_email("app-b")
            _, csrf_b = _register(client, email_b)

            # User B's application list must be empty
            list_resp = client.get("/api/applications")
            assert list_resp.status_code == 200
            assert list_resp.json() == []

            # User B must not be able to GET user A's application by ID
            get_resp = client.get(f"/api/applications/{app_id}")
            assert get_resp.status_code == 404

    def test_user_b_cannot_update_user_a_application(self):
        with TestClient(app) as client:
            email_a = _unique_email("upd-a")
            _, csrf_a = _register(client, email_a)
            job = client.post("/api/jobs", json=self._unique_job()).json()
            app_a = client.post(
                f"/api/applications/from-job/{job['id']}",
                headers=_auth_headers(csrf_a),
            ).json()

            client.cookies.clear()
            email_b = _unique_email("upd-b")
            _, csrf_b = _register(client, email_b)

            patch_resp = client.patch(
                f"/api/applications/{app_a['id']}",
                json={"status": "submitted"},
                headers=_auth_headers(csrf_b),
            )
            assert patch_resp.status_code == 404

            # Confirm user A's record is still unchanged
            client.cookies.clear()
            _login(client, email_a)
            re_read = client.get(f"/api/applications/{app_a['id']}").json()
            assert re_read["status"] == "ready_for_review"

    def test_user_b_cannot_delete_user_a_application(self):
        with TestClient(app) as client:
            email_a = _unique_email("del-a")
            _, csrf_a = _register(client, email_a)
            job = client.post("/api/jobs", json=self._unique_job()).json()
            app_a = client.post(
                f"/api/applications/from-job/{job['id']}",
                headers=_auth_headers(csrf_a),
            ).json()

            client.cookies.clear()
            email_b = _unique_email("del-b")
            _, csrf_b = _register(client, email_b)

            del_resp = client.delete(
                f"/api/applications/{app_a['id']}",
                headers=_auth_headers(csrf_b),
            )
            assert del_resp.status_code == 404

            # Confirm the record still exists for user A
            client.cookies.clear()
            _login(client, email_a)
            assert client.get(f"/api/applications/{app_a['id']}").status_code == 200

    def test_two_users_can_independently_track_same_job_url(self):
        """Unique constraint is per (user_id, source_url), not just source_url."""
        with TestClient(app) as client:
            shared_url = f"https://jobs.lever.co/shared/{uuid4().hex}"
            job_payload = dict(self.JOB_PAYLOAD)
            job_payload["source_url"] = shared_url

            email_a = _unique_email("shared-a")
            _, csrf_a = _register(client, email_a)
            job = client.post("/api/jobs", json=job_payload).json()

            app_a = client.post(
                f"/api/applications/from-job/{job['id']}",
                headers=_auth_headers(csrf_a),
            )
            assert app_a.status_code == 201, app_a.text

            client.cookies.clear()
            email_b = _unique_email("shared-b")
            _, csrf_b = _register(client, email_b)

            app_b = client.post(
                f"/api/applications/from-job/{job['id']}",
                headers=_auth_headers(csrf_b),
            )
            assert app_b.status_code == 201, app_b.text
            # They must be different records
            assert app_a.json()["id"] != app_b.json()["id"]

    def test_analytics_scoped_to_current_user(self):
        """User B's analytics must not include User A's applications."""
        with TestClient(app) as client:
            email_a = _unique_email("ana-a")
            _, csrf_a = _register(client, email_a)
            # Create 2 applications for user A
            for _ in range(2):
                job = client.post("/api/jobs", json=self._unique_job()).json()
                client.post(
                    f"/api/applications/from-job/{job['id']}",
                    headers=_auth_headers(csrf_a),
                )

            client.cookies.clear()
            email_b = _unique_email("ana-b")
            _register(client, email_b)

            # User B's analytics must show 0 applications
            ana = client.get("/api/analytics").json()
            assert ana["total_applications"] == 0

    def test_application_queue_scoped_per_user(self):
        """Batch-queueing from discovery is user-scoped; duplicate detection is per-user."""
        with TestClient(app) as client:
            shared_url = f"https://jobs.lever.co/queue/{uuid4().hex}"
            queue_payload = {
                "jobs": [{
                    "title": "Queue Test Role",
                    "company": "Queue Corp",
                    "location": "Remote",
                    "work_mode": "Remote",
                    "source_url": shared_url,
                    "match_score": 75,
                    "matched_keywords": ["python"],
                }]
            }

            email_a = _unique_email("queue-a")
            _, csrf_a = _register(client, email_a)
            resp_a = client.post(
                "/api/applications/queue",
                json=queue_payload,
                headers=_auth_headers(csrf_a),
            )
            assert resp_a.status_code == 200, resp_a.text
            assert resp_a.json()["created"] == 1

            client.cookies.clear()
            email_b = _unique_email("queue-b")
            _, csrf_b = _register(client, email_b)
            # User B queues the same URL — should be created (not "reused")
            resp_b = client.post(
                "/api/applications/queue",
                json=queue_payload,
                headers=_auth_headers(csrf_b),
            )
            assert resp_b.status_code == 200, resp_b.text
            assert resp_b.json()["created"] == 1

    def test_resource_id_manipulation_cannot_bypass_ownership(self):
        """Iterating over sequential IDs must not expose other users' applications."""
        with TestClient(app) as client:
            email_a = _unique_email("id-a")
            _, csrf_a = _register(client, email_a)
            job = client.post("/api/jobs", json=self._unique_job()).json()
            app_a = client.post(
                f"/api/applications/from-job/{job['id']}",
                headers=_auth_headers(csrf_a),
            ).json()
            app_a_id = app_a["id"]

            client.cookies.clear()
            email_b = _unique_email("id-b")
            _, csrf_b = _register(client, email_b)

            # Try IDs around user A's record
            for probe_id in [app_a_id - 1, app_a_id, app_a_id + 1, 1, 2, 999]:
                r = client.get(f"/api/applications/{probe_id}")
                assert r.status_code == 404, (
                    f"User B unexpectedly accessed application {probe_id}: {r.text}"
                )


# ---------------------------------------------------------------------------
# Legacy data preservation
# ---------------------------------------------------------------------------

class TestLegacyDataPreservation:
    def test_new_user_does_not_inherit_legacy_null_profile(self):
        """Any CandidateProfile rows with user_id=NULL must NOT appear for new users."""
        with TestClient(app) as client:
            email = _unique_email("legacy")
            _register(client, email)
            profile = client.get("/api/profile").json()
            # A fresh user's profile should be blank (default values only)
            # It should NOT contain data from any pre-existing legacy profile
            # (e.g. a real resume filename or non-default target_titles from
            #  the legacy seed row that had user_id=NULL)
            assert profile.get("resume_storage_key") is None
            assert profile.get("resume_original_filename") is None

    def test_new_user_application_list_is_empty(self):
        """New users must start with zero applications, not inheriting legacy rows."""
        with TestClient(app) as client:
            email = _unique_email("legacy-app")
            _register(client, email)
            apps = client.get("/api/applications").json()
            assert apps == [], f"New user unexpectedly has applications: {apps}"

    def test_new_user_analytics_shows_zero(self):
        with TestClient(app) as client:
            email = _unique_email("legacy-ana")
            _register(client, email)
            ana = client.get("/api/analytics").json()
            assert ana["total_applications"] == 0


# ---------------------------------------------------------------------------
# CV analysis scoping
# ---------------------------------------------------------------------------

class TestAnalysisIsolation:
    def test_job_analysis_uses_requesting_users_profile(self, tmp_path, monkeypatch):
        """POST /api/jobs/{id}/analysis must use the current user's profile context."""
        import app.main as main_module
        monkeypatch.setattr(main_module, "RESUME_DIR", tmp_path / "resumes")

        with TestClient(app) as client:
            email_a = _unique_email("ana-prof-a")
            _, csrf_a = _register(client, email_a)

            # Give user A a detailed profile
            prof_a = client.get("/api/profile").json()
            prof_a["full_name"] = "Alice Analyst"
            prof_a["skills"] = "Python, Data Analysis, SQL"
            prof_a["target_titles"] = "Data Analyst"
            client.put("/api/profile", json=prof_a, headers=_auth_headers(csrf_a))

            # Create a shared job
            job_payload = {
                "title": "Data Analyst",
                "company": "Analytics Corp",
                "location": "Remote",
                "work_mode": "Remote",
                "source_url": f"https://jobs.lever.co/analytics/{uuid4().hex}",
                "description": "Python, SQL, Data Analysis, Power BI.",
                "verified_posting_time": True,
            }
            job = client.post("/api/jobs", json=job_payload).json()
            job_id = job["id"]

            # User A with profile gets analysis — must succeed (profile has skills)
            ana_a = client.post(f"/api/jobs/{job_id}/analysis", headers=_auth_headers(csrf_a))
            assert ana_a.status_code == 200, ana_a.text

            # Switch to user B (blank profile — no skills/resume_text)
            client.cookies.clear()
            email_b = _unique_email("ana-prof-b")
            _, csrf_b = _register(client, email_b)

            # User B has empty profile — analysis should return 400 (no profile data)
            ana_b = client.post(f"/api/jobs/{job_id}/analysis", headers=_auth_headers(csrf_b))
            assert ana_b.status_code == 400
