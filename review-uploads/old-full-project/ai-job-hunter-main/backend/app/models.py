from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    profile: Mapped["CandidateProfile | None"] = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions: Mapped[list["UserSession"]] = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    applications: Mapped[list["Application"]] = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    reset_tokens: Mapped[list["PasswordResetToken"]] = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(100), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="reset_tokens")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    csrf_token: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(100), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="sessions")


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(250), index=True)
    company: Mapped[str] = mapped_column(String(250), index=True)
    location: Mapped[str] = mapped_column(String(250), default="Not specified")
    work_mode: Mapped[str] = mapped_column(String(50), default="Unknown")
    source_url: Mapped[str] = mapped_column(String(1500), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_posting_time: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class JobSource(Base):
    """A user-configured public ATS job board. Tokens are identifiers, not credentials."""
    __tablename__ = "job_sources"
    __table_args__ = (UniqueConstraint("provider", "board_id", name="uq_job_source_provider_board"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider: Mapped[str] = mapped_column(String(30), index=True)
    company_name: Mapped[str] = mapped_column(String(250))
    board_id: Mapped[str] = mapped_column(String(100))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AppSetting(Base):
    """Small local application settings table used for one-time migrations/bootstrap."""
    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String(120), primary_key=True)
    value: Mapped[str] = mapped_column(Text, default="")


class CandidateProfile(Base):
    __tablename__ = "candidate_profile"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(200), default="")
    years_experience: Mapped[float] = mapped_column(Float, default=0)
    target_titles: Mapped[str] = mapped_column(Text, default="Talent Acquisition Specialist, IT Recruiter, HR Recruiter")
    skills: Mapped[str] = mapped_column(Text, default="")
    preferred_locations: Mapped[str] = mapped_column(Text, default="India, Remote")
    preferred_work_modes: Mapped[str] = mapped_column(Text, default="Remote, Hybrid, On-site")
    verified_facts_json: Mapped[str] = mapped_column(Text, default="{}")
    resume_headline: Mapped[str] = mapped_column(String(300), default="")
    profile_summary: Mapped[str] = mapped_column(Text, default="")
    employment_highlights: Mapped[str] = mapped_column(Text, default="")
    employment_history_json: Mapped[str] = mapped_column(Text, default="[]")
    education_json: Mapped[str] = mapped_column(Text, default="[]")
    it_skills_json: Mapped[str] = mapped_column(Text, default="[]")
    projects_json: Mapped[str] = mapped_column(Text, default="[]")
    online_profiles_json: Mapped[str] = mapped_column(Text, default="[]")
    work_samples_json: Mapped[str] = mapped_column(Text, default="[]")
    publications_json: Mapped[str] = mapped_column(Text, default="[]")
    presentations_json: Mapped[str] = mapped_column(Text, default="[]")
    patents_json: Mapped[str] = mapped_column(Text, default="[]")
    certifications_json: Mapped[str] = mapped_column(Text, default="[]")
    career_profile_json: Mapped[str] = mapped_column(Text, default="{}")
    personal_details_json: Mapped[str] = mapped_column(Text, default="{}")
    languages_json: Mapped[str] = mapped_column(Text, default="[]")
    resume_storage_key: Mapped[str | None] = mapped_column(String(100), nullable=True)
    resume_original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    resume_uploaded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resume_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    resume_parse_status: Mapped[str] = mapped_column(String(80), default="not_uploaded")
    resume_text: Mapped[str] = mapped_column(Text, default="")
    photo_storage_key: Mapped[str | None] = mapped_column(String(100), nullable=True)
    photo_original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    photo_content_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    photo_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    photo_uploaded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user: Mapped["User | None"] = relationship("User", back_populates="profile")


class Application(Base):
    """Local application history and prepared submission records."""
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("user_id", "source_url", name="uq_user_application_source_url"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    job_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(250), index=True)
    company: Mapped[str] = mapped_column(String(250), index=True)
    location: Mapped[str] = mapped_column(String(250), default="Not specified")
    work_mode: Mapped[str] = mapped_column(String(50), default="Unknown")
    source_url: Mapped[str] = mapped_column(String(1500), index=True)
    platform: Mapped[str] = mapped_column(String(80), default="unknown")
    status: Mapped[str] = mapped_column(String(40), default="ready_for_review", index=True)
    match_score: Mapped[int] = mapped_column(Integer, default=0)
    matched_keywords_json: Mapped[str] = mapped_column(Text, default="[]")
    answers_json: Mapped[str] = mapped_column(Text, default="[]")
    notes: Mapped[str] = mapped_column(Text, default="")
    resume_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    last_attempt_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submission_message: Mapped[str] = mapped_column(Text, default="")
    confirmation_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user: Mapped["User | None"] = relationship("User", back_populates="applications")
