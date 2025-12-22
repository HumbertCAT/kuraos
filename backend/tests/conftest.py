"""Pytest configuration and fixtures for TherapistOS backend tests."""

import asyncio
import uuid
from typing import AsyncGenerator, Generator
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base, get_db
from app.db.models import Organization, User
from app.core.security import create_access_token

# Test database URL (use separate test database)
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@db:5432/therapistos_test"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def authenticated_user(test_db: AsyncSession) -> tuple[User, Organization]:
    """Create an authenticated test user and organization."""
    org = Organization(
        id=uuid.uuid4(),
        name="Test Organization",
        referral_code=f"AUTH{uuid.uuid4().hex[:6]}",
    )
    test_db.add(org)

    user = User(
        id=uuid.uuid4(),
        email=f"auth_user_{uuid.uuid4().hex[:8]}@test.com",
        hashed_password="fake_hashed_password",
        full_name="Authenticated User",
        organization_id=org.id,
    )
    test_db.add(user)
    await test_db.commit()

    return user, org


@pytest_asyncio.fixture(scope="function")
async def auth_headers(authenticated_user: tuple[User, Organization]) -> dict:
    """Generate auth headers with a valid JWT token."""
    user, org = authenticated_user
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(scope="function")
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database override."""

    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
