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
# FastAPI Test Client (full app, no lifespan)
# =============================================================================


@pytest_asyncio.fixture(scope="function")
async def client(test_db) -> AsyncGenerator:
    """Create a test client using the full app with database override.

    Uses the production app but overrides get_db dependency to use test session.
    This ensures all routes are available for testing.
    """
    from httpx import AsyncClient, ASGITransport
    from app.api.deps import get_db

    # Import the full app (this includes all routers)
    from app.main import app as production_app

    # Override get_db to use test session
    async def override_get_db():
        yield test_db

    production_app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=production_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    # Cleanup: remove the override
    production_app.dependency_overrides.pop(get_db, None)


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


@pytest_asyncio.fixture(scope="function")
async def authenticated_user(test_db) -> tuple:
    """Create an authenticated test user and organization.

    Returns:
        tuple: (user, organization)
    """
    from app.db.models import Organization, User

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
