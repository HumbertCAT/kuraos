"""Settings service for dynamic configuration from database."""

from typing import Any, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import SystemSetting


async def get_setting(db: AsyncSession, key: str, default: Any = None) -> Any:
    """Get a setting value by key.

    Args:
        db: Database session
        key: Setting key
        default: Default value if setting not found

    Returns:
        The setting value (from JSONB), or default if not found
    """
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    setting = result.scalar_one_or_none()

    if setting is None:
        return default

    return setting.value


async def get_setting_int(db: AsyncSession, key: str, default: int = 0) -> int:
    """Get a setting as integer."""
    value = await get_setting(db, key, default)
    if isinstance(value, int):
        return value
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


async def get_setting_str(db: AsyncSession, key: str, default: str = "") -> str:
    """Get a setting as string."""
    value = await get_setting(db, key, default)
    if isinstance(value, str):
        return value
    return str(value) if value is not None else default


async def set_setting(
    db: AsyncSession, key: str, value: Any, description: Optional[str] = None
) -> SystemSetting:
    """Create or update a setting.

    Args:
        db: Database session
        key: Setting key
        value: Setting value (will be stored as JSONB)
        description: Optional description

    Returns:
        The created/updated SystemSetting
    """
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    setting = result.scalar_one_or_none()

    if setting is None:
        setting = SystemSetting(key=key, value=value, description=description)
        db.add(setting)
    else:
        setting.value = value
        if description is not None:
            setting.description = description

    await db.commit()
    await db.refresh(setting)
    return setting


async def get_all_settings(db: AsyncSession) -> dict[str, Any]:
    """Get all settings as a dictionary."""
    result = await db.execute(select(SystemSetting))
    settings = result.scalars().all()
    return {s.key: s.value for s in settings}
