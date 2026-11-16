import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from email_validator import EmailNotValidError, validate_email
from fastapi import Cookie, Depends, Header, HTTPException, Request, Response
from fastapi import status as http_status
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User, UserSession, utc_now

password_hash = PasswordHash((Argon2Hasher(),))


def normalize_email(email: str) -> str:
    """Normalize email address consistently and reject invalid formats."""
    if not email or not isinstance(email, str):
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Valid email address is required",
        )
    try:
        validated = validate_email(email.strip(), check_deliverability=False)
        return validated.normalized.lower().strip()
    except EmailNotValidError as exc:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid email address: {str(exc)}",
        ) from exc


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return password_hash.verify(plain_password, hashed_password)
    except Exception:
        return False


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def create_user_session(
    db: Session,
    user_id: int,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[str, UserSession]:
    raw_token = generate_session_token()
    token_hash = hash_session_token(raw_token)
    csrf_token = generate_csrf_token()
    expires_at = utc_now() + timedelta(seconds=settings.session_max_age_seconds)

    session = UserSession(
        user_id=user_id,
        token_hash=token_hash,
        csrf_token=csrf_token,
        expires_at=expires_at,
        is_revoked=False,
        user_agent=user_agent[:500] if user_agent else None,
        ip_address=ip_address[:100] if ip_address else None,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return raw_token, session


def set_auth_cookies(response: Response, raw_token: str, csrf_token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=raw_token,
        max_age=settings.session_max_age_seconds,
        httponly=True,
        samesite=settings.session_cookie_samesite,
        path=settings.session_cookie_path,
        secure=settings.is_cookie_secure,
    )
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        max_age=settings.session_max_age_seconds,
        httponly=False,
        samesite=settings.session_cookie_samesite,
        path=settings.session_cookie_path,
        secure=settings.is_cookie_secure,
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        path=settings.session_cookie_path,
    )
    response.delete_cookie(
        key="csrf_token",
        path=settings.session_cookie_path,
    )


def get_session_token_from_request(
    request: Request,
    authorization: str | None = None,
) -> tuple[str | None, str]:
    """Retrieve raw session token from Cookie or Authorization: Bearer header.
    Returns (raw_token, auth_source) where auth_source is 'cookie' or 'bearer'.
    """
    cookie_token = request.cookies.get(settings.session_cookie_name)
    if cookie_token:
        return cookie_token, "cookie"

    auth_header = authorization or request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer ") :].strip()
        if token:
            return token, "bearer"

    return None, "none"


def get_current_session_and_user(
    request: Request,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> tuple[UserSession, User]:
    raw_token, auth_source = get_session_token_from_request(request, authorization)
    if not raw_token:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_hash = hash_session_token(raw_token)
    session = db.scalar(
        select(UserSession).where(
            UserSession.token_hash == token_hash,
            UserSession.is_revoked.is_(False),
            UserSession.expires_at > utc_now(),
        )
    )

    if session is None:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or revoked session",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # CSRF check for state-changing requests using cookie authentication
    if auth_source == "cookie" and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        client_csrf = request.headers.get("X-CSRF-Token")
        if not client_csrf or client_csrf != session.csrf_token:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Invalid or missing CSRF token",
            )

    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )

    session.last_seen_at = utc_now()
    db.commit()

    return session, user


def get_current_user(
    session_and_user: tuple[UserSession, User] = Depends(get_current_session_and_user),
) -> User:
    return session_and_user[1]

