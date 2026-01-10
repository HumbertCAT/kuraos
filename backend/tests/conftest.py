"""
Pytest configuration and fixtures for KURA OS backend tests.

v1.6.9 TD-86: Fixed async event loop isolation + import-time DATABASE_URL issue.

Strategy:
- Lazy imports to avoid DATABASE_URL validation at import time
- Function-scoped async engine for proper event loop isolation
- Testcontainers PostgreSQL for ephemeral test database
"""

import os
from typing import AsyncGenerator
import uuid

import pytest
import pytest_asyncio

# Set dummy DATABASE_URL BEFORE any app imports to pass pydantic validation
# The real URL comes from testcontainers at runtime
os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://test:test@localhost:5432/test"
)
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only")


# =============================================================================
# Session-Scoped Test Database Container
# =============================================================================


@pytest.fixture(scope="session")
def postgres_container():
    """Start postgres container for the entire test session."""
    from testcontainers.postgres import PostgresContainer

    with PostgresContainer("postgres:15-alpine") as postgres:
        yield postgres


@pytest.fixture(scope="session")
def database_url(postgres_container) -> str:
    """Build async database URL from testcontainer."""
    return postgres_container.get_connection_url(driver="asyncpg")


# =============================================================================
# Function-Scoped Engine (new event loop per test)
# =============================================================================


@pytest_asyncio.fixture(scope="function")
async def engine(database_url: str):
    """
    Create engine for each test function.

    TD-86 FIX: Function scope ensures each test gets its own event loop,
    avoiding the "attached to a different loop" errors.
    """
    from sqlalchemy.ext.asyncio import create_async_engine
    from app.db.base import Base, set_engine, reset_engine

    test_engine = create_async_engine(
        database_url,
        echo=False,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
    )

    # Inject into app's lazy loading system
    set_engine(test_engine)

    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield test_engine

    # Cleanup: drop all tables and dispose
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    reset_engine()
    await test_engine.dispose()


# =============================================================================
# Function-Scoped Database Session
# =============================================================================


@pytest_asyncio.fixture(scope="function")
async def test_db(engine) -> AsyncGenerator:
    """Create an isolated database session for each test."""
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import sessionmaker

    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session_factory() as session:
        yield session
        await session.rollback()


# =============================================================================
# FastAPI Test Client (minimal app, no scheduler)
# =============================================================================


@pytest_asyncio.fixture(scope="function")
async def client(test_db) -> AsyncGenerator:
    """Create a test client with database override."""
    from httpx import AsyncClient, ASGITransport
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    from app.api.deps import get_db
    from app.api.v1.core import auth
    from app.api.v1.practice import (
        patients,
        clinical_entries,
        booking,
        services,
        availability,
        schedules,
        pending_actions,
    )

    # Test app with all routers needed for existing tests
    test_app = FastAPI(title="Kura OS Test App")
    test_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Core routes
    test_app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])

    # Practice routes
    test_app.include_router(
        patients.router, prefix="/api/v1/patients", tags=["Patients"]
    )
    test_app.include_router(
        clinical_entries.router, prefix="/api/v1/clinical-entries", tags=["Clinical"]
    )
    test_app.include_router(booking.router, prefix="/api/v1/booking", tags=["Booking"])
    test_app.include_router(
        services.router, prefix="/api/v1/services", tags=["Services"]
    )
    test_app.include_router(
        availability.router, prefix="/api/v1/availability", tags=["Availability"]
    )
    test_app.include_router(
        schedules.router, prefix="/api/v1/schedules", tags=["Schedules"]
    )
    test_app.include_router(
        pending_actions.router, prefix="/api/v1/pending-actions", tags=["Actions"]
    )

    @test_app.get("/health")
    async def health():
        return {"status": "healthy", "version": "test"}

    @test_app.get("/")
    async def root():
        return {"message": "Welcome to Kura OS API", "docs": "/docs"}

    # Override get_db to use test session
    async def override_get_db():
        yield test_db

    test_app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# =============================================================================
# Pre-Built Test Data Fixtures
# =============================================================================


@pytest_asyncio.fixture(scope="function")
async def test_org(test_db):
    """Create a test organization."""
    from app.db.models import Organization

    org = Organization(
        id=uuid.uuid4(),
        name="Test Organization",
        referral_code=f"TEST{uuid.uuid4().hex[:6].upper()}",
    )
    test_db.add(org)
    await test_db.commit()
    await test_db.refresh(org)
    return org


@pytest_asyncio.fixture(scope="function")
async def test_user(test_db, test_org):
    """Create a test user in the test organization."""
    from app.db.models import User

    user = User(
        id=uuid.uuid4(),
        email=f"test_{uuid.uuid4().hex[:8]}@kuraos.test",
        hashed_password="$2b$12$test_hash_placeholder",
        full_name="Test User",
        organization_id=test_org.id,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def auth_headers(test_user):
    """Generate auth headers with a valid JWT token."""
    from app.core.security import create_access_token

    token = create_access_token(subject=str(test_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(scope="function")
async def auth_client(client, auth_headers) -> AsyncGenerator:
    """Authenticated client with headers pre-set."""
    client.headers.update(auth_headers)
    yield client
