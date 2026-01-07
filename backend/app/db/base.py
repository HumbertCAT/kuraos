"""SQLAlchemy Async Database Configuration.

Phase 1 Refactor: Lazy Loading Pattern

The engine is NOT created at import time. Instead, it is initialized
during app startup (via lifespan) or on first use. This allows:
1. Tests to inject their own engine (testcontainers)
2. Cleaner async event loop handling
3. Better architectural separation
"""

from typing import Optional
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


# =============================================================================
# Lazy-Loaded Engine Singleton
# =============================================================================

_engine: Optional[AsyncEngine] = None
_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def get_engine() -> AsyncEngine:
    """Get or create the database engine (lazy initialization)."""
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            str(settings.DATABASE_URL),
            echo=False,
            future=True,
            pool_pre_ping=True,
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Get or create the session factory (lazy initialization)."""
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
    return _session_factory


async def init_db():
    """Initialize database connection (called at app startup)."""
    engine = get_engine()
    # Optionally create tables in dev mode
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connection (called at app shutdown)."""
    global _engine, _session_factory
    if _engine:
        await _engine.dispose()
        _engine = None
        _session_factory = None


def set_engine(engine: AsyncEngine):
    """
    Override the global engine (for testing).

    Call this BEFORE any get_db() calls to inject a test engine.
    """
    global _engine, _session_factory
    _engine = engine
    _session_factory = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
    )


def reset_engine():
    """Reset engine to None (for testing cleanup)."""
    global _engine, _session_factory
    _engine = None
    _session_factory = None


# =============================================================================
# FastAPI Dependency
# =============================================================================


async def get_db():
    """Dependency to get a database session."""
    factory = get_session_factory()
    async with factory() as session:
        yield session


# =============================================================================
# Legacy Compatibility (for imports that expect these at module level)
# =============================================================================


# These are now functions, but we keep the old names for compatibility
# Code should migrate to using get_engine() and get_session_factory()
def engine():
    return get_engine()


def AsyncSessionLocal():
    """Legacy wrapper that returns a session instance."""
    return get_session_factory()()
