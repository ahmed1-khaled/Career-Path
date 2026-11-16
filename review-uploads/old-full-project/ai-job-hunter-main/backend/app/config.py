from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "ai_job_hunter.db"
ENV_PATH = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    app_name: str = "AI Job Hunter API"
    app_env: str = "development"
    database_url: str = f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
    auto_submit_enabled: bool = False
    application_browser_profile_dir: str = "data/browser-profile"
    ai_provider: str = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:3b-instruct"
    semantic_matching_enabled: bool = True
    ollama_embedding_model: str = "nomic-embed-text"
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    adzuna_app_id: str = ""
    adzuna_app_key: str = ""
    brave_search_api_key: str = ""
    # JobSpy is an opt-in scraping connector; disabled until explicitly enabled by the user.
    jobspy_enabled: bool = False
    jobspy_sites: str = "linkedin,indeed,naukri,glassdoor,zip_recruiter,bayt,bdjobs,hellowork"
    jobspy_max_searches: int = 6
    jobspy_results_wanted: int = 12
    session_cookie_name: str = "session_token"
    session_max_age_seconds: int = 60 * 60 * 24 * 14
    session_cookie_secure: bool | None = None
    session_cookie_samesite: str = "lax"
    session_cookie_path: str = "/"

    # Password Recovery and Notification (SMTP) Settings
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_use_tls: bool = True
    frontend_base_url: str = "http://127.0.0.1:5174"
    password_reset_token_expire_minutes: int = 60
    email_verification_enabled: bool = False

    # Security & Rate Limiting
    auth_rate_limit_max_attempts: int = 5
    auth_rate_limit_window_seconds: int = 60

    model_config = SettingsConfigDict(
        env_file=(str(ENV_PATH), ".env"),
        extra="ignore",
    )

    @property
    def is_cookie_secure(self) -> bool:
        if self.session_cookie_secure is not None:
            return self.session_cookie_secure
        return self.app_env.lower() == "production"

    @property
    def resolved_database_url(self) -> str:
        url = self.database_url.strip()
        if url.startswith("sqlite:///./") or (url.startswith("sqlite:///") and not url.startswith("sqlite:////") and ":/" not in url[10:] and ":\\" not in url[10:]):
            clean_rel = url.replace("sqlite:///./", "").replace("sqlite:///", "")
            target_file = (BACKEND_DIR / clean_rel).resolve()
            return f"sqlite:///{target_file.as_posix()}"
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        configured = [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]
        # Always guarantee the primary development ports are covered
        guaranteed_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
        ]
        for dev_orig in guaranteed_origins:
            if dev_orig not in configured:
                configured.append(dev_orig)
        return configured


settings = Settings()
