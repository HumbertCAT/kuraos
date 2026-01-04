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
    GoogleOAuthRequest,
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
    referring_org = None
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
        karma_score=50 if referred_by_id else 0,  # Welcome bonus for referred users
    )
    db.add(org)
    await db.flush()  # Get org.id before creating user

    # Reward the referrer with Karma Points
    if referring_org:
        referring_org.karma_score += 100
        db.add(referring_org)

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
            tier=org.tier.value,
            referral_code=org.referral_code,
            karma_score=org.karma_score,
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
            tier=org.tier.value,
            referral_code=org.referral_code,
            karma_score=org.karma_score,
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


@router.post("/forgot-password", summary="Request password reset")
async def forgot_password(
    email: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Send password reset email.

    - Generates secure reset token
    - Token expires in 1 hour
    - Sends email via Brevo
    """
    from datetime import datetime, timedelta
    from app.services.email import email_service

    # Find user by email
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # Always return success to prevent email enumeration
    if not user:
        return {"message": "Si el email existe, recibirás un enlace de recuperación"}

    # Generate secure token
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)

    # Save token to user
    user.password_reset_token = reset_token
    user.password_reset_expires = expires_at
    await db.commit()

    # Build reset URL
    reset_url = f"{settings.FRONTEND_URL}/es/reset-password?token={reset_token}"

    # Send email via Brevo
    try:
        await email_service.send_automation_email(
            to_email=user.email,
            to_name=user.full_name or "Usuario",
            subject="Recuperar contraseña - KURA OS",
            template_type="password_reset",
            context={
                "reset_url": reset_url,
                "user_name": user.full_name or "Usuario",
                "expires_hours": 1,
            },
        )
    except Exception as e:
        # Log error but don't expose to user
        import logging

        logging.error(f"Failed to send password reset email: {e}")

    return {"message": "Si el email existe, recibirás un enlace de recuperación"}


@router.post("/reset-password", summary="Reset password with token")
async def reset_password(
    token: str,
    new_password: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Reset password using a valid reset token.

    - Validates token exists and not expired
    - Updates password hash
    - Clears reset token
    """
    from datetime import datetime

    # Find user by token
    result = await db.execute(select(User).where(User.password_reset_token == token))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido o expirado"
        )

    # Check expiration (use timezone-aware datetime)
    from datetime import timezone

    now = datetime.now(timezone.utc)
    if user.password_reset_expires and user.password_reset_expires < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expirado. Solicita un nuevo enlace.",
        )

    # Update password
    user.hashed_password = get_password_hash(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    await db.commit()

    return {"message": "Contraseña actualizada correctamente"}


@router.post("/oauth/google", response_model=AuthResponse, summary="Google OAuth login")
async def google_oauth(
    request: GoogleOAuthRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate via Google OAuth.

    - Verifies Google ID token
    - Creates user if not exists (auto-register)
    - Creates organization if new user
    - Sets httpOnly JWT cookie
    """
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests

    # Verify Google ID token
    try:
        idinfo = id_token.verify_oauth2_token(
            request.id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}",
        )

    # Extract user info from token
    email = idinfo.get("email")
    full_name = idinfo.get("name", "")
    picture = idinfo.get("picture")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not found in Google token",
        )

    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-register: Create new organization and user
        org = Organization(
            name=full_name.split()[0] if full_name else email.split("@")[0],
            type=OrgType.SOLO,
            referral_code=generate_referral_code(),
        )
        db.add(org)
        await db.flush()

        # Create user with random password (OAuth users don't need password)
        user = User(
            email=email,
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            full_name=full_name,
            role=UserRole.OWNER,
            organization_id=org.id,
            profile_image_url=picture,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        await db.refresh(org)
    else:
        # Update profile image if changed
        if picture and user.profile_image_url != picture:
            user.profile_image_url = picture
            await db.commit()
            await db.refresh(user)

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

    # Set httpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=not _is_localhost,
        path="/",
        domain=None if _is_localhost else ".kuraos.ai",
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
            tier=org.tier.value,
            referral_code=org.referral_code,
            karma_score=org.karma_score,
            theme_config=org.theme_config,
        ),
        message="Login successful",
    )


@router.get("/me", summary="Get current user")
async def get_me(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """
    Get the currently authenticated user's data and organization.

    Requires valid JWT cookie.
    """
    from app.db.models import SystemSetting

    # Fetch organization with theme_config
    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one()

    # Fetch GLOBAL_THEME as fallback
    global_result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "GLOBAL_THEME")
    )
    global_setting = global_result.scalar_one_or_none()
    global_theme = global_setting.value if global_setting else None

    return {
        "user": UserResponse.model_validate(current_user).model_dump(),
        "organization": OrganizationResponse(
            id=org.id,
            name=org.name,
            type=org.type.value,
            tier=org.tier.value,
            referral_code=org.referral_code,
            karma_score=org.karma_score,
            theme_config=org.theme_config,
        ).model_dump(),
        "global_theme": global_theme,
        "message": "Authenticated",
    }


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


@router.get("/me/ai-spend", summary="Get current organization AI spend")
async def get_my_ai_spend(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Get the AI spending for the current user's organization (30-day window).

    Returns USD spent vs tier limit.
    """
    from app.db.models import Organization, AiUsageLog
    from app.services.settings import get_setting_float
    from datetime import datetime, timedelta

    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Get 30-day spend from AiUsageLog
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    spend_result = await db.execute(
        select(func.sum(AiUsageLog.cost_provider_usd))
        .where(AiUsageLog.organization_id == current_user.organization_id)
        .where(AiUsageLog.created_at >= thirty_days_ago)
    )
    spend_usd = float(spend_result.scalar() or 0)

    # Get tier limit from system_settings
    tier_limit_key = f"TIER_AI_SPEND_LIMIT_{org.tier.value}"
    limit_usd = await get_setting_float(db, tier_limit_key, 50.0)

    # Calculate percentage
    usage_percent = round((spend_usd / limit_usd) * 100, 1) if limit_usd > 0 else 0

    return {
        "tier": org.tier.value,
        "spend_usd": round(spend_usd, 2),
        "limit_usd": round(limit_usd, 2),
        "usage_percent": usage_percent,
        "period_days": 30,
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
    tier_limit_key = f"TIER_USERS_LIMIT_{org.tier.value}"
    limit = await get_setting_int(db, tier_limit_key, 999)

    # Calculate percentage
    usage_percent = round((active_patients / limit) * 100, 1) if limit > 0 else 0

    return {
        "active_patients": active_patients,
        "limit": limit,
        "usage_percent": usage_percent,
        "tier": org.tier.value,
    }
