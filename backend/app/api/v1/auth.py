"""Authentication endpoints with JWT httpOnly cookies."""

import secrets
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.base import get_db
from app.db.models import Organization, User, OrgType, UserRole
from app.core.config import settings
from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
)
from app.api.v1.schemas import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    AuthResponse,
    UserResponse,
    OrganizationResponse,
)
from app.api.deps import CurrentUser

router = APIRouter()

# Environment detection for cookie configuration
_is_localhost = "localhost" in settings.FRONTEND_URL


def generate_referral_code() -> str:
    """Generate a unique referral code."""
    return secrets.token_urlsafe(8)


@router.post(
    "/register", response_model=RegisterResponse, summary="Register new organization"
)
async def register(
    request: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)
):
    """
    Register a new organization with an owner user.

    - Creates a new Organization with SOLO type
    - Creates the first User with OWNER role
    - Sets httpOnly JWT cookie
    - Returns user and organization data
    """
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Check referral code if provided
    referred_by_id = None
    if request.referral_code:
        result = await db.execute(
            select(Organization).where(
                Organization.referral_code == request.referral_code
            )
        )
        referring_org = result.scalar_one_or_none()
        if referring_org:
            referred_by_id = referring_org.id

    # Create organization
    org = Organization(
        name=request.org_name,
        type=OrgType.SOLO,
        referral_code=generate_referral_code(),
        referred_by_id=referred_by_id,
    )
    db.add(org)
    await db.flush()  # Get org.id before creating user

    # Create owner user
    user = User(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name,
        role=UserRole.OWNER,
        organization_id=org.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    await db.refresh(org)

    # Create JWT token
    access_token = create_access_token(
        subject=str(user.id),
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    # Set httpOnly cookie (environment-aware: localhost vs production)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=not _is_localhost,  # False for localhost (HTTP), True for production (HTTPS)
        path="/",
        domain=None if _is_localhost else ".kuraos.ai",  # None = current domain only
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return RegisterResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            is_active=user.is_active,
            organization_id=user.organization_id,
        ),
        organization=OrganizationResponse(
            id=org.id,
            name=org.name,
            type=org.type.value,
            referral_code=org.referral_code,
            theme_config=org.theme_config,
        ),
        message="Registration successful",
    )


@router.post("/login", response_model=AuthResponse, summary="User login")
async def login(
    request: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and set JWT httpOnly cookie.

    - Validates email and password
    - Sets httpOnly JWT cookie
    - Returns user and organization data
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled"
        )

    # Get organization
    result = await db.execute(
        select(Organization).where(Organization.id == user.organization_id)
    )
    org = result.scalar_one()

    # Create JWT token
    access_token = create_access_token(
        subject=str(user.id),
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    # Set httpOnly cookie (environment-aware: localhost vs production)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=not _is_localhost,  # False for localhost (HTTP), True for production (HTTPS)
        path="/",
        domain=None if _is_localhost else ".kuraos.ai",  # None = current domain only
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return AuthResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            is_active=user.is_active,
            organization_id=user.organization_id,
        ),
        organization=OrganizationResponse(
            id=org.id,
            name=org.name,
            type=org.type.value,
            referral_code=org.referral_code,
            theme_config=org.theme_config,
        ),
        message="Login successful",
    )


@router.post("/logout", summary="User logout")
async def logout(response: Response):
    """
    Logout user by clearing the JWT cookie.

    IMPORTANT: delete_cookie must use same domain and path as set_cookie
    to properly delete the cookie across subdomains.
    """
    response.delete_cookie(
        key="access_token",
        path="/",
        domain=None if _is_localhost else ".kuraos.ai",  # Must match set_cookie domain
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=AuthResponse, summary="Get current user")
async def get_me(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """
    Get the currently authenticated user's data and organization.

    Requires valid JWT cookie.
    """
    # Fetch organization with theme_config
    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one()

    return AuthResponse(
        user=UserResponse.model_validate(current_user),
        organization=OrganizationResponse(
            id=org.id,
            name=org.name,
            type=org.type.value,
            referral_code=org.referral_code,
            theme_config=org.theme_config,
        ),
        message="Authenticated",
    )


@router.patch(
    "/me", response_model=UserResponse, summary="Update current user preferences"
)
async def update_me(
    data: dict,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Update the current user's preferences (locale, ai_output_preference).
    """
    from app.db.models import OutputLanguage

    # Update only allowed fields
    allowed_fields = [
        "locale",
        "ai_output_preference",
        "full_name",
        "phone",
        "website",
        "country",
        "city",
        "social_media",
    ]

    for field in allowed_fields:
        if field in data:
            if field == "ai_output_preference":
                try:
                    setattr(current_user, field, OutputLanguage(data[field]))
                except ValueError:
                    pass  # Ignore invalid values
            else:
                value = data[field]
                # Defensive handling for city if it comes as a dict (e.g. from some autocomplete weirdness)
                if field == "city" and isinstance(value, dict):
                    value = value.get("name", "")

                setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.get("/me/credits", summary="Get current user's organization credits")
async def get_my_credits(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Get the credit balance for the current user's organization.
    """
    from app.db.models import Organization

    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    available = (
        org.ai_credits_monthly_quota
        - org.ai_credits_used_this_month
        + org.ai_credits_purchased
    )

    return {
        "tier": org.tier.value,
        "monthly_quota": org.ai_credits_monthly_quota,
        "used_this_month": org.ai_credits_used_this_month,
        "purchased": org.ai_credits_purchased,
        "available": available,
    }


@router.get("/me/usage", summary="Get current organization usage")
async def get_my_usage(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Get patient usage stats for the current organization.
    Used by frontend PlanUsageWidget.
    """
    from app.db.models import Organization, Patient
    from app.services.settings import get_setting_int

    # Get organization
    org_result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = org_result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Count active patients
    patient_count_result = await db.execute(
        select(func.count()).where(
            Patient.organization_id == current_user.organization_id
        )
    )
    active_patients = patient_count_result.scalar() or 0

    # Get tier limit
    tier_limit_key = f"TIER_LIMIT_{org.tier.value}"
    limit = await get_setting_int(db, tier_limit_key, 999)

    # Calculate percentage
    usage_percent = round((active_patients / limit) * 100, 1) if limit > 0 else 0

    return {
        "active_patients": active_patients,
        "limit": limit,
        "usage_percent": usage_percent,
        "tier": org.tier.value,
    }
