import logging
import os
import time
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import DATABASE_URL

logger = logging.getLogger("app.database")


def _prepare_database_url(raw_url: str) -> tuple[str, dict]:
    """Normalise a provider-style DATABASE_URL and derive driver arguments.

    Hosted MySQL providers (e.g. Aiven) hand out URLs like
    ``mysql://user:pass@host:port/db?ssl-mode=REQUIRED``. SQLAlchemy would try the
    ``mysqlclient`` driver for that scheme (not installed) and PyMySQL does not
    understand the ``ssl-mode`` query parameter, so either one stops the app from
    booting. Rewrite the scheme to PyMySQL and translate ``ssl-mode`` into the
    ``ssl`` connect argument PyMySQL expects.
    """
    url = (raw_url or "").strip()
    connect_args: dict = {}

    for prefix in ("mysql://", "mariadb://"):
        if url.startswith(prefix):
            url = "mysql+pymysql://" + url[len(prefix):]
            break

    if url.startswith("mysql+pymysql://"):
        connect_args["connect_timeout"] = int(os.getenv("DB_CONNECT_TIMEOUT", "10"))

        parts = urlsplit(url)
        params = parse_qsl(parts.query, keep_blank_values=True)
        kept, ssl_mode = [], None
        for key, value in params:
            if key.lower().replace("_", "-") == "ssl-mode":
                ssl_mode = value.upper()
            else:
                kept.append((key, value))
        if ssl_mode is not None:
            url = urlunsplit(parts._replace(query=urlencode(kept)))

        ssl_ca = os.getenv("DATABASE_SSL_CA")  # optional path to the provider's CA PEM
        if ssl_mode == "DISABLED":
            connect_args["ssl_disabled"] = True
        elif ssl_mode in ("REQUIRED", "VERIFY_CA", "VERIFY_IDENTITY") or ssl_ca:
            if ssl_ca:
                connect_args["ssl"] = {
                    "ca": ssl_ca,
                    "check_hostname": ssl_mode == "VERIFY_IDENTITY",
                    "verify_mode": True,
                }
            else:
                # Encrypted connection without certificate verification.
                connect_args["ssl"] = {"fake_flag_to_enable_tls": True}

    return url, connect_args


_url, _connect_args = _prepare_database_url(DATABASE_URL)
_is_mysql = _url.startswith("mysql")

_engine_kwargs: dict = {"pool_pre_ping": True}
if _connect_args:
    _engine_kwargs["connect_args"] = _connect_args
if _is_mysql:
    # Managed MySQL services drop idle connections; recycle before they do.
    _engine_kwargs["pool_recycle"] = int(os.getenv("DB_POOL_RECYCLE", "280"))

engine = create_engine(_url, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Columns added after the first release. create_all() never alters existing tables,
# so databases created by older versions get these added on startup.
MIGRATION_COLUMNS = [
    ("job_applications", "session_id", "VARCHAR(50)"),
    ("session_store", "user_id", "VARCHAR(50)"),
    ("session_store", "optimized_resume", "TEXT"),
    ("session_store", "cover_letter", "TEXT"),
    ("session_store", "email_subject", "VARCHAR(500)"),
    ("session_store", "email_body", "TEXT"),
    ("session_store", "review_result_json", "TEXT"),
    ("session_store", "chat_history_json", "TEXT DEFAULT '[]'"),
    ("session_store", "current_step", "INTEGER DEFAULT 2"),
    ("session_store", "status", "VARCHAR(20) DEFAULT 'active'"),
    ("users", "is_admin", "INTEGER DEFAULT 0"),
    ("users", "user_memory", "TEXT DEFAULT ''"),
]

_db_ready = False
_last_init_attempt = 0.0
_INIT_RETRY_SECONDS = 15


def _apply_column_migrations() -> None:
    inspector = inspect(engine)
    existing: dict[str, set[str]] = {}
    for table, column, col_type in MIGRATION_COLUMNS:
        if table not in existing:
            existing[table] = (
                {c["name"] for c in inspector.get_columns(table)}
                if inspector.has_table(table)
                else set()
            )
        if not existing[table] or column in existing[table]:
            continue

        ddl_type, backfill = col_type, None
        # MySQL rejects literal DEFAULTs on TEXT columns (error 1101); add the column
        # without one and backfill existing rows instead.
        if _is_mysql and col_type.upper().startswith("TEXT") and " DEFAULT " in col_type.upper():
            ddl_type, backfill = col_type.split(" DEFAULT ", 1)

        try:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))
                if backfill is not None:
                    conn.execute(
                        text(f"UPDATE {table} SET {column} = {backfill} WHERE {column} IS NULL")
                    )
            logger.info("Added missing column %s.%s", table, column)
        except Exception as exc:  # noqa: BLE001 - never block startup on a migration
            logger.warning("Could not add column %s.%s: %s", table, column, exc)


def init_db() -> bool:
    """Create tables and apply column migrations. Never raises.

    Returns True when the database is reachable and the schema is in place. A failure
    is logged and reported through the return value so the API can still start and
    answer requests (with a clear error) instead of exiting during startup.
    """
    global _db_ready, _last_init_attempt
    _last_init_attempt = time.monotonic()
    try:
        # Import models so every table is registered on Base before create_all().
        import app.models.user  # noqa: F401
        import app.models.application  # noqa: F401
        import app.models.master_profile  # noqa: F401

        Base.metadata.create_all(bind=engine)
        _apply_column_migrations()
        _db_ready = True
        return True
    except Exception as exc:  # noqa: BLE001
        _db_ready = False
        logger.error("Database initialisation failed (%s): %s", type(exc).__name__, exc)
        return False


def check_database() -> bool:
    """Cheap connectivity probe; also finishes schema setup once the DB is back."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001
        logger.warning("Database connectivity check failed (%s): %s", type(exc).__name__, exc)
        return False
    if not _db_ready:
        return init_db()
    return True


def get_db():
    # If the DB was down at startup, retry schema setup (at most every few seconds)
    # so the service recovers by itself once the database is reachable again.
    if not _db_ready and time.monotonic() - _last_init_attempt > _INIT_RETRY_SECONDS:
        init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
