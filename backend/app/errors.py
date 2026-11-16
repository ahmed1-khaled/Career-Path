"""Centralized authentication, authorization, and system error definitions,
diagnostic utilities, rate limiting, and secure notification handlers.
"""
from __future__ import annotations

import email.message
import logging
import smtplib
import time
from collections import defaultdict
from typing import Any

from .config import settings

logger = logging.getLogger("ai_job_hunter.errors")


# ---------------------------------------------------------------------------
# Machine-readable error codes
# ---------------------------------------------------------------------------
class ErrorCodes:
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    EMAIL_INVALID = "EMAIL_INVALID"
    WEAK_PASSWORD = "WEAK_PASSWORD"
    PASSWORD_MISMATCH = "PASSWORD_MISMATCH"
    USER_EXISTS = "USER_EXISTS"
    ACCOUNT_DISABLED = "ACCOUNT_DISABLED"
    SESSION_EXPIRED = "SESSION_EXPIRED"
    CSRF_VALIDATION_FAILED = "CSRF_VALIDATION_FAILED"
    RATE_LIMITED = "RATE_LIMITED"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    CORS_OR_CONFIGURATION_ERROR = "CORS_OR_CONFIGURATION_ERROR"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    RESET_TOKEN_INVALID = "RESET_TOKEN_INVALID"
    RESET_TOKEN_EXPIRED = "RESET_TOKEN_EXPIRED"
    METHOD_MISMATCH = "METHOD_MISMATCH"
    VALIDATION_ERROR = "VALIDATION_ERROR"

    # Future OAuth / Google login error reservations
    OAUTH_CANCELLED = "OAUTH_CANCELLED"
    OAUTH_PROVIDER_DISABLED = "OAUTH_PROVIDER_DISABLED"
    OAUTH_CONFIG_ERROR = "OAUTH_CONFIG_ERROR"
    OAUTH_STATE_INVALID = "OAUTH_STATE_INVALID"
    OAUTH_CALLBACK_INVALID = "OAUTH_CALLBACK_INVALID"
    OAUTH_ACCOUNT_EXISTS = "OAUTH_ACCOUNT_EXISTS"
    OAUTH_LINKING_CONFLICT = "OAUTH_LINKING_CONFLICT"
    OAUTH_EXCHANGE_FAILED = "OAUTH_EXCHANGE_FAILED"
    OAUTH_PROVIDER_UNAVAILABLE = "OAUTH_PROVIDER_UNAVAILABLE"


# ---------------------------------------------------------------------------
# Redaction and masking utilities for secure diagnostics
# ---------------------------------------------------------------------------
def mask_email(email_str: str | None) -> str:
    """Mask email for diagnostic logging without exposing full identity (e.g. a***e@example.com)."""
    if not email_str or "@" not in email_str:
        return "[redacted-email]"
    name_part, domain_part = email_str.split("@", 1)
    if len(name_part) <= 2:
        masked_name = name_part[0] + "*"
    else:
        masked_name = name_part[0] + "*" * (len(name_part) - 2) + name_part[-1]
    return f"{masked_name}@{domain_part}"


def redact_sensitive_dict(data: dict[str, Any]) -> dict[str, Any]:
    """Return a copy of the dictionary with sensitive authentication keys redacted."""
    sensitive_keys = {
        "password",
        "new_password",
        "hashed_password",
        "token",
        "token_hash",
        "raw_token",
        "csrf_token",
        "authorization",
        "cookie",
        "smtp_password",
        "secret",
        "openai_api_key",
        "brave_search_api_key",
    }
    redacted = {}
    for key, value in data.items():
        lower_key = str(key).lower()
        if any(s in lower_key for s in sensitive_keys):
            redacted[key] = "[REDACTED]"
        elif isinstance(value, dict):
            redacted[key] = redact_sensitive_dict(value)
        elif lower_key == "email" and isinstance(value, str):
            redacted[key] = mask_email(value)
        else:
            redacted[key] = value
    return redacted


# ---------------------------------------------------------------------------
# Sliding-window in-memory rate limiter
# ---------------------------------------------------------------------------
class SlidingWindowRateLimiter:
    """Thread-safe sliding window rate limiter for authentication and recovery attempts."""

    def __init__(self):
        # key -> list of float timestamps
        self._records: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_attempts: int, window_seconds: int) -> tuple[bool, int]:
        """Check if action is allowed. Returns (allowed, retry_after_seconds)."""
        now = time.monotonic()
        cutoff = now - window_seconds
        # Clean older entries
        recent = [t for t in self._records[key] if t > cutoff]
        self._records[key] = recent

        if len(recent) >= max_attempts:
            oldest_relevant = recent[0]
            retry_after = max(1, int(oldest_relevant + window_seconds - now))
            return False, retry_after

        recent.append(now)
        self._records[key] = recent
        return True, 0


# Shared rate limiter instance for auth endpoints
auth_rate_limiter = SlidingWindowRateLimiter()


# ---------------------------------------------------------------------------
# Secure password recovery email dispatcher
# ---------------------------------------------------------------------------
def send_password_reset_email(to_email: str, raw_reset_token: str) -> tuple[bool, str]:
    """Dispatch real password reset email if SMTP is configured.
    Returns (success, status_description).
    """
    masked = mask_email(to_email)
    if not settings.smtp_host or not settings.smtp_from_email:
        logger.info(
            "Password reset token generated for %s, but SMTP is not configured. "
            "Configure SMTP_HOST and SMTP_FROM_EMAIL in backend/.env for external delivery.",
            masked,
        )
        return False, "SMTP_NOT_CONFIGURED"

    reset_url = f"{settings.frontend_base_url.rstrip('/')}/?reset_token={raw_reset_token}"

    msg = email.message.EmailMessage()
    msg["Subject"] = f"{settings.app_name} — Password Reset Request"
    msg["From"] = settings.smtp_from_email
    msg["To"] = to_email

    text_content = (
        f"Hello,\n\n"
        f"A password reset was requested for your account ({to_email}).\n\n"
        f"To reset your password, open the link below in your browser:\n"
        f"{reset_url}\n\n"
        f"This link expires in {settings.password_reset_token_expire_minutes} minutes.\n"
        f"If you did not request this, you can safely ignore this email.\n"
    )
    msg.set_content(text_content)

    try:
        if settings.smtp_use_tls:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)

        if settings.smtp_user and settings.smtp_password:
            server.login(settings.smtp_user, settings.smtp_password)

        server.send_message(msg)
        server.quit()
        logger.info("Password reset email successfully dispatched to %s", masked)
        return True, "DISPATCHED"
    except Exception as exc:
        logger.error("Failed to send password reset email to %s: %s", masked, str(exc))
        return False, f"SMTP_ERROR: {str(exc)}"

