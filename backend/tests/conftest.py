"""
Pytest configuration and fixtures for KURA OS backend tests.

Phase 1: Innate Immunity - The Immune System QA Architecture

Strategy:
- Session-scoped testcontainers PostgreSQL (ephemeral per test run)
- Function-scoped engine to ensure same event loop for all DB ops
- Minimal test FastAPI app to avoid scheduler interference
"""

from typing import AsyncGenerator
import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, AsyncEngine
from sqlalchemy.orm import sessionmaker

from testcontainers.postgres import PostgresContainer
from testcontainers.core.generic import DockerContainer
import requests

from app.db.base import Base, get_db, set_engine, reset_engine
from app.db.models import Organization, User
from app.core.security import create_access_token


# =============================================================================
# Session-Scoped Test Database Container
# =============================================================================


@pytest.fixture(scope="session")
def postgres_container():
    """Start postgres container for the session."""
    with PostgresContainer("postgres:15-alpine") as postgres:
        yield postgres


@pytest.fixture(scope="session")
def database_url(postgres_container) -> str:
    """Build async database URL from testcontainer."""
    return postgres_container.get_connection_url(driver="asyncpg")


# =============================================================================
# SESSION-Scoped Engine (created once for all tests)
# =============================================================================


@pytest_asyncio.fixture(scope="session")
async def engine(database_url: str) -> AsyncGenerator[AsyncEngine, None]:
    """
    Create engine once for entire test session.
    Tables are created once, then truncated between tests for isolation.
    """
    engine = create_async_engine(database_url, echo=False, pool_size=5, max_overflow=10)

    # Inject into app's lazy loading system
    set_engine(engine)

    # Create all tables ONCE
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Cleanup
    reset_engine()
    await engine.dispose()


# =============================================================================
# Function-Scoped Database Session
# =============================================================================


@pytest_asyncio.fixture(scope="function")
async def test_db(engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    """Create an isolated database session for each test."""
    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session_factory() as session:
        yield session
        await session.rollback()

    # Truncate all tables after test
    async with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())


# =============================================================================
# FastAPI Test Client (minimal app, no scheduler)
# =============================================================================


@pytest_asyncio.fixture(scope="function")
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database override."""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
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

    # Test app with routers needed for tests
    test_app = FastAPI(title="Test App")
    test_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Core
    test_app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])

    # Practice
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

    # Override get_db
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
async def test_org(test_db: AsyncSession) -> Organization:
    """Create a test organization."""
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
async def test_user(test_db: AsyncSession, test_org: Organization) -> User:
    """Create a test user in the test organization."""
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
async def authenticated_user(test_db: AsyncSession) -> tuple[User, Organization]:
    """Create an authenticated test user and organization."""
    org = Organization(
        id=uuid.uuid4(),
        name="Auth Test Org",
        referral_code=f"AUTH{uuid.uuid4().hex[:6].upper()}",
    )
    test_db.add(org)

    user = User(
        id=uuid.uuid4(),
        email=f"auth_{uuid.uuid4().hex[:8]}@kuraos.test",
        hashed_password="$2b$12$test_hash_placeholder",
        full_name="Authenticated User",
        organization_id=org.id,
    )
    test_db.add(user)
    await test_db.commit()

    return user, org


@pytest_asyncio.fixture(scope="function")
async def auth_headers(authenticated_user: tuple[User, Organization]) -> dict:
    """Generate auth headers with a valid JWT token."""
    user, _ = authenticated_user
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(scope="function")
async def auth_client(
    client: AsyncClient, auth_headers: dict
) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated client with headers pre-set."""
    client.headers.update(auth_headers)
    yield client


# =============================================================================
# Phase 5: Communication Immunity - Mailpit Email Testing
# =============================================================================


@pytest.fixture(scope="session")
def mailpit_container():
    """
    Start Mailpit container for email testing.

    Mailpit captures SMTP emails and provides REST API for inspection.
    Ports are dynamically mapped by testcontainers - use get_mapped_port().
    """
    mailpit = DockerContainer("axllent/mailpit:latest")
    mailpit.with_exposed_ports(1025, 8025)  # SMTP and API

    with mailpit:
        yield mailpit


@pytest.fixture(scope="session")
def mailpit_smtp_port(mailpit_container) -> int:
    """Get dynamically mapped SMTP port for mailpit."""
    return mailpit_container.get_exposed_port(1025)


@pytest.fixture(scope="session")
def mailpit_api_url(mailpit_container) -> str:
    """
    Get Mailpit API URL with dynamically mapped port.

    CRITICAL: Do NOT hardcode port 8025.
    Testcontainers assigns random ports (e.g. 32768) to avoid conflicts.
    """
    api_port = mailpit_container.get_exposed_port(8025)
    return f"http://localhost:{api_port}"


@pytest.fixture(scope="function")
def mailpit_client(mailpit_api_url: str):
    """
    REST API client for querying captured emails.

    Usage:
        emails = mailpit_client.get_messages()
        assert len(emails) == 1
        assert emails[0]['Subject'] == 'Password Reset'
    """

    class MailpitClient:
        def __init__(self, base_url: str):
            self.base_url = base_url

        def get_messages(self) -> list:
            """Get all captured messages."""
            response = requests.get(f"{self.base_url}/api/v1/messages")
            response.raise_for_status()
            data = response.json()
            return data.get("messages", [])

        def get_message(self, message_id: str) -> dict:
            """Get a specific message by ID with full body."""
            response = requests.get(f"{self.base_url}/api/v1/message/{message_id}")
            response.raise_for_status()
            return response.json()

        def delete_all(self):
            """Clear all messages (cleanup)."""
            requests.delete(f"{self.base_url}/api/v1/messages")

    client = MailpitClient(mailpit_api_url)
    client.delete_all()  # Start clean
    yield client
    client.delete_all()  # Cleanup after test
