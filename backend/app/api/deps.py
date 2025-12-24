"""API Dependencies for authentication and database access."""

from typing import Annotated
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import APIKeyCookie
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.db.models import User
from app.core.config import settings
from app.core.security import ALGORITHM


# Cookie-based auth
cookie_scheme = APIKeyCookie(name="access_token", auto_error=False)


async def get_current_user(
    request: Request,
    token: Annotated[str | None, Depends(cookie_scheme)] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency to get the current authenticated user from JWT cookie.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user"
        )

    return user


# Type alias for cleaner dependency injection
CurrentUser = Annotated[User, Depends(get_current_user)]


# ============ ROLE-BASED ACCESS CONTROL ============


async def require_owner(current_user: CurrentUser) -> User:
    """
    Dependency that requires OWNER role.
    Use for: billing, org settings, team management.
    """
    from app.db.models import UserRole

    if current_user.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner role required for this action",
        )
    return current_user


async def require_clinical_access(current_user: CurrentUser) -> User:
    """
    Dependency that requires clinical access (OWNER or THERAPIST).
    Blocks ASSISTANT from clinical data.
    Use for: clinical entries, patient notes, assessments.
    """
    from app.db.models import UserRole

    if current_user.role == UserRole.ASSISTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clinical access denied for assistant role",
        )
    return current_user


# Role-based type aliases
CurrentOwner = Annotated[User, Depends(require_owner)]
CurrentClinicalUser = Annotated[User, Depends(require_clinical_access)]


async def require_super_admin(current_user: CurrentUser) -> User:
    """
    Dependency that requires super_admin flag.
    Use for: system-wide admin operations like backup/restore.
    """
    if not getattr(current_user, "is_superuser", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required",
        )
    return current_user


CurrentSuperAdmin = Annotated[User, Depends(require_super_admin)]
