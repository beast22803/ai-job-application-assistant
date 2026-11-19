import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import InterfaceError, OperationalError

from app.api.v1.endpoints import profile, analyzer, dashboard, application, auth, admin
from app.core.database import check_database, init_db

logger = logging.getLogger("app.main")


# Lifespan context manager for FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables / add missing columns. If the database is unreachable the API still
    # starts (init_db never raises) and /api/health reports it; the schema is completed
    # automatically once the database becomes reachable.
    if init_db():
        print("\n🚀 AI Job Application Assistant ready (database connected)\n")
    else:
        print("\n⚠️  AI Job Application Assistant started, but the database is NOT reachable\n")
    yield

app = FastAPI(title="AI Job Application Assistant API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(OperationalError)
@app.exception_handler(InterfaceError)
async def database_error_handler(request: Request, exc: Exception):
    # Returned through the normal response path so CORS headers are kept and the browser
    # can show the real message instead of an opaque "Failed to fetch".
    logger.error("Database error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "The database is currently unavailable. Please try again shortly."},
    )


app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(analyzer.router, prefix="/api", tags=["Analyzer"])
app.include_router(profile.router, prefix="/api/profile", tags=["Master Profile"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(application.router, prefix="/api", tags=["Application"])

# Healthcheck — always 200 so the hosting platform keeps the instance alive; the body
# shows whether the database is reachable.
@app.get("/api/health")
def healthcheck():
    db_ok = check_database()
    return {"status": "ok" if db_ok else "degraded", "database": "up" if db_ok else "down"}
