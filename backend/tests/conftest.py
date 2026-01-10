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
# Stripe test secrets (needed to pass validation checks in webhook endpoints)
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_dummy_key_for_testing")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_test_dummy_webhook_secret")


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
# Mailpit Email Testing Fixtures
# =============================================================================


class MailpitClient:
    """Simple client for Mailpit REST API."""

    def __init__(self, base_url: str):
        self.base_url = base_url

    def get_messages(self) -> list:
        """Get all messages from Mailpit."""
        import httpx

        response = httpx.get(f"{self.base_url}/api/v1/messages")
        if response.status_code == 200:
            return response.json().get("messages", [])
        return []

    def get_message(self, message_id: str) -> dict:
        """Get a specific message by ID."""
        import httpx

        response = httpx.get(f"{self.base_url}/api/v1/message/{message_id}")
        if response.status_code == 200:
            return response.json()
        return {}

    def clear(self):
        """Clear all messages."""
        import httpx

        httpx.delete(f"{self.base_url}/api/v1/messages")


@pytest.fixture(scope="session")
def mailpit_container():
    """Start Mailpit container for email testing.

    Mailpit exposes:
    - Port 1025: SMTP server
    - Port 8025: Web UI and API
    """
    from testcontainers.core.container import DockerContainer

    with DockerContainer("axllent/mailpit:latest") as container:
        container.with_exposed_ports(1025, 8025)
        container.start()
        yield container


@pytest.fixture(scope="function")
def mailpit_smtp_port(mailpit_container) -> int:
    """Get the mapped SMTP port."""
    return int(mailpit_container.get_exposed_port(1025))


@pytest.fixture(scope="function")
def mailpit_client(mailpit_container) -> MailpitClient:
    """Get a Mailpit API client that clears messages before each test."""
    host = mailpit_container.get_container_host_ip()
    api_port = mailpit_container.get_exposed_port(8025)
    base_url = f"http://{host}:{api_port}"

    client = MailpitClient(base_url)
    client.clear()  # Clean before each test
    return client


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
    """Generate auth headers with a valid JWT token.

    NOTE: This is for legacy tests. New tests should use auth_client with cookies.
    """
    from app.core.security import create_access_token

    token = create_access_token(subject=str(test_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(scope="function")
async def auth_client(client, test_user) -> AsyncGenerator:
    """Authenticated client with access_token cookie set.

    The app uses cookie-based auth (APIKeyCookie), not Authorization headers.
    This fixture sets the access_token cookie for all requests.
    """
    from app.core.security import create_access_token

    token = create_access_token(subject=str(test_user.id))
    client.cookies.set("access_token", token)
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
