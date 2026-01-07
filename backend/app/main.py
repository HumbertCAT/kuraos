"""Kura OS FastAPI Application Entry Point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.core.config import settings
from app.core.logging import configure_logging
from app.api.v1 import (
    auth,
    patients,
    booking,
    events,
    forms,
    public_forms,
    analysis,
    growth,
    dashboard,
    clinical_entries,
    uploads,
    admin,
    services,
    availability,
    payments,
    public_booking,
    public_booking_manage,
    schedules,
    integrations,
    insights,
    automations,
    billing,
    connect,
    twilio_webhook,
    monitoring,
    help,
    leads,
    pending_actions,
    ai_governance,
)

# Configure structured logging
configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan with APScheduler for temporal automation."""
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from app.workers.stale_journey_monitor import (
        check_stale_journeys,
        check_stale_leads,
    )
    from app.workers.conversation_analyzer import analyze_daily_conversations
    from app.db.base import get_session_factory, init_db, close_db

    # Initialize database connection (lazy loading pattern)
    await init_db()

    scheduler = AsyncIOScheduler()

    async def run_stale_check():
        """Wrapper to run stale check with its own DB session."""
        factory = get_session_factory()
        async with factory() as db:
            try:
                await check_stale_journeys(db)
            except Exception as e:
                logger.error(f"Stale journey check failed: {e}")

    async def run_stale_leads_check():
        """Wrapper to run stale leads check with its own DB session."""
        factory = get_session_factory()
        async with factory() as db:
            try:
                await check_stale_leads(db)
            except Exception as e:
                logger.error(f"Stale leads check failed: {e}")

    async def run_conversation_analysis():
        """Wrapper to run daily chat analysis with its own DB session."""
        factory = get_session_factory()
        async with factory() as db:
            try:
                await analyze_daily_conversations(db)
            except Exception as e:
                logger.error(f"Conversation analysis failed: {e}")

    # Run every hour
    scheduler.add_job(
        run_stale_check,
        "interval",
        hours=1,
        id="stale_journey_monitor",
        name="Stale Journey Monitor",
    )

    # Run every hour at minute 15 (offset from other checks)
    scheduler.add_job(
        run_stale_leads_check,
        "interval",
        hours=1,
        id="stale_leads_monitor",
        name="Stale Leads Monitor",
    )

    # Run every hour at minute 30 (offset from stale check at minute 0)
    scheduler.add_job(
        run_conversation_analysis,
        "interval",
        hours=1,
        id="conversation_analyzer",
        name="Hourly Conversation Analyzer",
    )

    scheduler.start()
    logger.info(
        "✅ APScheduler started: stale_journey_monitor, stale_leads_monitor, conversation_analyzer (hourly)"
    )

    yield  # Application runs here

    scheduler.shutdown()
    await close_db()  # Clean shutdown of database connection
    logger.info("APScheduler shutdown complete")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Specialized SaaS for Therapists - System of Record + AI Observatory",
    version="1.4.1",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# v1.4.1: ADR-019 Observability (X-Ray Vision)
from app.core.telemetry import init_telemetry

init_telemetry(app)


# CORS Middleware - Always enabled for development
# In production, set BACKEND_CORS_ORIGINS env var
def parse_cors_origins(raw: str) -> list:
    """Parse CORS origins from comma-separated or JSON string."""
    if not raw:
        return ["http://localhost:3001", "http://localhost:3000"]
    raw = raw.strip()
    if raw.startswith("["):
        import json

        try:
            return json.loads(raw)
        except:
            return raw.replace("[", "").replace("]", "").replace('"', "").split(",")
    return [o.strip() for o in raw.split(",")]


origins = parse_cors_origins(settings.BACKEND_CORS_ORIGINS)

# Trust Cloud Run / Cloudflare proxies to handle HTTPS correctly
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(
    auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"]
)
app.include_router(
    patients.router, prefix=f"{settings.API_V1_STR}/patients", tags=["Patients"]
)
app.include_router(leads.router, prefix=settings.API_V1_STR, tags=["CRM"])
app.include_router(
    booking.router, prefix=f"{settings.API_V1_STR}/booking", tags=["Booking"]
)
app.include_router(
    pending_actions.router,
    prefix=f"{settings.API_V1_STR}/pending-actions",
    tags=["Pending Actions"],
)
app.include_router(
    events.router, prefix=f"{settings.API_V1_STR}/events", tags=["Events"]
)
app.include_router(forms.router, prefix=f"{settings.API_V1_STR}/forms", tags=["Forms"])
app.include_router(
    public_forms.router,
    prefix=f"{settings.API_V1_STR}/public/forms",
    tags=["Public Forms"],
)
app.include_router(
    analysis.router, prefix=f"{settings.API_V1_STR}/analysis", tags=["Observatory"]
)
app.include_router(
    growth.router, prefix=f"{settings.API_V1_STR}/growth", tags=["Growth"]
)
app.include_router(
    dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"]
)
app.include_router(
    clinical_entries.router,
    prefix=f"{settings.API_V1_STR}/clinical-entries",
    tags=["Clinical Journal"],
)
app.include_router(
    uploads.router, prefix=f"{settings.API_V1_STR}/uploads", tags=["Uploads"]
)
app.include_router(
    services.router, prefix=f"{settings.API_V1_STR}/services", tags=["Services"]
)
app.include_router(
    availability.router,
    prefix=f"{settings.API_V1_STR}/availability",
    tags=["Availability"],
)
app.include_router(
    payments.router, prefix=f"{settings.API_V1_STR}/payments", tags=["Payments"]
)
app.include_router(
    public_booking.router,
    prefix=f"{settings.API_V1_STR}/public/booking",
    tags=["Public Booking"],
)
app.include_router(
    public_booking_manage.router,
    prefix=f"{settings.API_V1_STR}/public/booking/manage",
    tags=["Self-Service Booking"],
)
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin"])
app.include_router(
    ai_governance.router,
    prefix=settings.API_V1_STR,
    tags=["Admin-AI-Governance"],
)
app.include_router(
    schedules.router,
    prefix=f"{settings.API_V1_STR}/schedules",
    tags=["Schedules"],
)
app.include_router(
    integrations.router,
    prefix=f"{settings.API_V1_STR}/integrations",
    tags=["Integrations"],
)
app.include_router(
    insights.router,
    prefix=settings.API_V1_STR,
    tags=["Insights"],
)
app.include_router(
    twilio_webhook.router,
    prefix=settings.API_V1_STR,
    tags=["Webhooks"],
)
app.include_router(
    automations.router,
    prefix=settings.API_V1_STR,
    tags=["Automations"],
)
app.include_router(
    billing.router,
    prefix=f"{settings.API_V1_STR}/billing",
    tags=["Billing"],
)
app.include_router(
    connect.router,
    prefix=f"{settings.API_V1_STR}/connect",
    tags=["Connect"],
)
app.include_router(
    monitoring.router,
    prefix=settings.API_V1_STR,
    tags=["Monitoring"],
)
app.include_router(
    monitoring.org_router,
    prefix=settings.API_V1_STR,
    tags=["Monitoring"],
)
app.include_router(
    help.router,
    prefix=settings.API_V1_STR,
    tags=["Help"],
)

# Admin Backups (Super Admin only)
from app.api.v1 import admin_backups

app.include_router(
    admin_backups.router,
    prefix=settings.API_V1_STR,
    tags=["Admin Backups"],
)

# AI Governance (Super Admin only)
from app.api.v1 import admin_ai

app.include_router(
    admin_ai.router,
    prefix=settings.API_V1_STR,
    tags=["AI Governance"],
)


# Mount static files for serving uploads
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for container orchestration."""
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/", tags=["System"])
async def root():
    """Root endpoint."""
    return {"message": "Welcome to Kura OS API", "docs": "/docs"}
