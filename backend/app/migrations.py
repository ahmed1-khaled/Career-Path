import logging
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def run_multi_user_migrations(engine: Engine) -> None:
    """Run idempotent migrations to add multi-user support while preserving legacy data.
    - Creates `users` and `user_sessions` tables if not present.
    - Adds `user_id` to `candidate_profile` if not present.
    - Adds `user_id` to `applications` and updates unique constraint to (user_id, source_url) if not present.
    - Preserves all legacy data with user_id = NULL (unassigned).
    """
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    with engine.begin() as conn:
        # 1. Create users table if missing
        if "users" not in table_names:
            logger.info("Creating users table...")
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email VARCHAR(255) NOT NULL,
                        hashed_password VARCHAR(255) NOT NULL,
                        is_active BOOLEAN NOT NULL DEFAULT 1,
                        created_at DATETIME NOT NULL,
                        updated_at DATETIME NOT NULL
                    )
                    """
                )
            )
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users(email)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_id ON users(id)"))

        # 2. Create user_sessions table if missing
        if "user_sessions" not in table_names:
            logger.info("Creating user_sessions table...")
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS user_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        token_hash VARCHAR(64) NOT NULL,
                        csrf_token VARCHAR(64) NOT NULL,
                        expires_at DATETIME NOT NULL,
                        is_revoked BOOLEAN NOT NULL DEFAULT 0,
                        created_at DATETIME NOT NULL,
                        last_seen_at DATETIME NOT NULL,
                        user_agent VARCHAR(500),
                        ip_address VARCHAR(100)
                    )
                    """
                )
            )
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_user_sessions_token_hash ON user_sessions(token_hash)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_sessions_user_id ON user_sessions(user_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_sessions_expires_at ON user_sessions(expires_at)"))

        # 3. Add user_id to candidate_profile if not present
        if "candidate_profile" in table_names:
            cp_columns = [col["name"] for col in inspector.get_columns("candidate_profile")]
            if "user_id" not in cp_columns:
                logger.info("Adding user_id column to candidate_profile...")
                conn.execute(
                    text("ALTER TABLE candidate_profile ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE")
                )
                conn.execute(
                    text("CREATE UNIQUE INDEX IF NOT EXISTS uq_candidate_profile_user_id ON candidate_profile(user_id) WHERE user_id IS NOT NULL")
                )

        # 4. Migrate applications table if user_id is missing
        if "applications" in table_names:
            app_columns = [col["name"] for col in inspector.get_columns("applications")]
            if "user_id" not in app_columns:
                logger.info("Migrating applications table to support user_id and per-user unique URLs...")
                conn.execute(
                    text(
                        """
                        CREATE TABLE applications_new (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                            job_id INTEGER,
                            title VARCHAR(250) NOT NULL,
                            company VARCHAR(250) NOT NULL,
                            location VARCHAR(250) NOT NULL DEFAULT 'Not specified',
                            work_mode VARCHAR(50) NOT NULL DEFAULT 'Unknown',
                            source_url VARCHAR(1500) NOT NULL,
                            platform VARCHAR(80) NOT NULL DEFAULT 'unknown',
                            status VARCHAR(40) NOT NULL DEFAULT 'ready_for_review',
                            match_score INTEGER NOT NULL DEFAULT 0,
                            matched_keywords_json TEXT NOT NULL DEFAULT '[]',
                            answers_json TEXT NOT NULL DEFAULT '[]',
                            notes TEXT NOT NULL DEFAULT '',
                            resume_filename VARCHAR(255),
                            applied_at DATETIME,
                            last_attempt_at DATETIME,
                            submission_message TEXT NOT NULL DEFAULT '',
                            confirmation_id VARCHAR(255),
                            created_at DATETIME NOT NULL,
                            updated_at DATETIME NOT NULL,
                            CONSTRAINT uq_user_application_source_url UNIQUE (user_id, source_url)
                        )
                        """
                    )
                )
                # Copy existing data with user_id = NULL (legacy unassigned data)
                conn.execute(
                    text(
                        """
                        INSERT INTO applications_new (
                            id, user_id, job_id, title, company, location, work_mode,
                            source_url, platform, status, match_score, matched_keywords_json,
                            answers_json, notes, resume_filename, applied_at, last_attempt_at,
                            submission_message, confirmation_id, created_at, updated_at
                        )
                        SELECT
                            id, NULL, job_id, title, company, location, work_mode,
                            source_url, platform, status, match_score, matched_keywords_json,
                            answers_json, notes, resume_filename, applied_at, last_attempt_at,
                            submission_message, confirmation_id, created_at, updated_at
                        FROM applications
                        """
                    )
                )
                conn.execute(text("DROP TABLE applications"))
                conn.execute(text("ALTER TABLE applications_new RENAME TO applications"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_applications_id ON applications(id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_applications_user_id ON applications(user_id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_applications_job_id ON applications(job_id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_applications_title ON applications(title)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_applications_company ON applications(company)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_applications_source_url ON applications(source_url)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_applications_status ON applications(status)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_applications_applied_at ON applications(applied_at)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_applications_created_at ON applications(created_at)"))

