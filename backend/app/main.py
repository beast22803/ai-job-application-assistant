from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import profile, analyzer, dashboard, application
from app.core.database import Base, engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    # Run inline migration to add session_id column if it doesn't exist
    from sqlalchemy import text
    migration_columns = [
        ("job_applications", "session_id", "VARCHAR(50)"),
        ("session_store", "optimized_resume", "TEXT"),
        ("session_store", "cover_letter", "TEXT"),
        ("session_store", "email_subject", "VARCHAR(500)"),
        ("session_store", "email_body", "TEXT"),
        ("session_store", "review_result_json", "TEXT"),
        ("session_store", "current_step", "INTEGER DEFAULT 2"),
        ("session_store", "status", "VARCHAR(20) DEFAULT 'active'"),
    ]
    for table, column, col_type in migration_columns:
        try:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
        except Exception:
            pass
    print("\n🚀 AI Job Application Assistant ready — open http://localhost:8000\n")
    yield

app = FastAPI(title="AI Job Application Assistant API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyzer.router, prefix="/api", tags=["Analyzer"])
app.include_router(profile.router, prefix="/api/profile", tags=["Master Profile"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(application.router, prefix="/api", tags=["Application"])

# Healthcheck
@app.get("/api/health")
def healthcheck():
    return {"status": "ok"}
