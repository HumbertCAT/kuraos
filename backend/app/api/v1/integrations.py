"""Google Calendar Integration Endpoints.

OAuth flow and calendar synchronization for Google Calendar.
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.core.config import settings
from app.db.base import get_db
from app.db.models import (
    User,
    CalendarIntegration,
    ScheduleCalendarSync,
    AvailabilitySchedule,
)
from app.api.deps import get_current_user

router = APIRouter()

# Google OAuth endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"

# Scopes needed for calendar integration
SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
]


# ============ SCHEMAS ============


class IntegrationStatus(BaseModel):
    """Response schema for integration status."""

    connected: bool
    provider: str = "google"
    calendar_id: Optional[str] = None
    sync_bookings: bool = True
    check_busy: bool = True


class IntegrationSettings(BaseModel):
    """Settings for updating integration preferences."""

    calendar_id: Optional[str] = None
    sync_bookings_to_gcal: Optional[bool] = None
    check_gcal_busy: Optional[bool] = None


class ScheduleSyncConfig(BaseModel):
    """Per-schedule sync configuration."""

    schedule_id: uuid.UUID
    schedule_name: str
    blocking_calendar_ids: List[str] = []
    booking_calendar_id: str = "primary"
    sync_enabled: bool = True


class ScheduleSyncUpdate(BaseModel):
    """Update schema for schedule sync config."""

    blocking_calendar_ids: Optional[List[str]] = None
    booking_calendar_id: Optional[str] = None
    sync_enabled: Optional[bool] = None


class GoogleCalendar(BaseModel):
    """Google Calendar info."""

    id: str
    name: str
    primary: bool = False


class FullIntegrationStatus(BaseModel):
    """Full integration status with schedules and calendars."""

    connected: bool
    provider: str = "google"
    google_calendars: List[GoogleCalendar] = []
    schedule_syncs: List[ScheduleSyncConfig] = []


# ============ ENDPOINTS ============


@router.get("/google/status", response_model=IntegrationStatus)
async def get_integration_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check if user has connected Google Calendar."""
    result = await db.execute(
        select(CalendarIntegration).where(
            CalendarIntegration.user_id == current_user.id,
            CalendarIntegration.provider == "google",
        )
    )
    integration = result.scalar_one_or_none()

    if not integration:
        return IntegrationStatus(connected=False)

    return IntegrationStatus(
        connected=True,
        provider="google",
        calendar_id=integration.calendar_id,
        sync_bookings=integration.sync_bookings_to_gcal,
        check_busy=integration.check_gcal_busy,
    )


@router.get("/google/full-status", response_model=FullIntegrationStatus)
async def get_full_integration_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full integration status including schedules and calendars."""
    # Check if connected
    result = await db.execute(
        select(CalendarIntegration).where(
            CalendarIntegration.user_id == current_user.id,
            CalendarIntegration.provider == "google",
        )
    )
    integration = result.scalar_one_or_none()

    if not integration:
        return FullIntegrationStatus(connected=False)

    # Fetch Google calendars
    google_calendars = []
    try:
        valid_integration = await _get_valid_integration(db, current_user.id)
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GOOGLE_CALENDAR_API}/users/me/calendarList",
                headers={"Authorization": f"Bearer {valid_integration.access_token}"},
            )
        if response.status_code == 200:
            data = response.json()
            google_calendars = [
                GoogleCalendar(
                    id=cal.get("id"),
                    name=cal.get("summary"),
                    primary=cal.get("primary", False),
                )
                for cal in data.get("items", [])
            ]
        else:
            print(
                f"[DEBUG] Google Calendar API returned {response.status_code}: {response.text[:200]}"
            )
    except Exception as e:
        print(f"[DEBUG] Error fetching Google calendars: {e}")

    # Fetch user's schedules and their sync configs
    schedules_result = await db.execute(
        select(AvailabilitySchedule).where(
            AvailabilitySchedule.user_id == current_user.id
        )
    )
    schedules = list(schedules_result.scalars().all())

    schedule_syncs = []
    for schedule in schedules:
        # Find sync config for this schedule
        sync_result = await db.execute(
            select(ScheduleCalendarSync).where(
                ScheduleCalendarSync.schedule_id == schedule.id
            )
        )
        sync_config = sync_result.scalar_one_or_none()

        schedule_syncs.append(
            ScheduleSyncConfig(
                schedule_id=schedule.id,
                schedule_name=schedule.name,
                blocking_calendar_ids=sync_config.blocking_calendar_ids or []
                if sync_config
                else [],
                booking_calendar_id=sync_config.booking_calendar_id
                if sync_config
                else "primary",
                sync_enabled=sync_config.sync_enabled if sync_config else True,
            )
        )

    return FullIntegrationStatus(
        connected=True,
        provider="google",
        google_calendars=google_calendars,
        schedule_syncs=schedule_syncs,
    )


@router.put("/google/schedule/{schedule_id}/sync", response_model=ScheduleSyncConfig)
async def update_schedule_sync(
    schedule_id: uuid.UUID,
    data: ScheduleSyncUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update sync configuration for a specific schedule."""
    # Verify schedule belongs to user
    schedule_result = await db.execute(
        select(AvailabilitySchedule).where(
            AvailabilitySchedule.id == schedule_id,
            AvailabilitySchedule.user_id == current_user.id,
        )
    )
    schedule = schedule_result.scalar_one_or_none()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found",
        )

    # Find or create sync config
    sync_result = await db.execute(
        select(ScheduleCalendarSync).where(
            ScheduleCalendarSync.schedule_id == schedule_id
        )
    )
    sync_config = sync_result.scalar_one_or_none()

    if not sync_config:
        sync_config = ScheduleCalendarSync(
            schedule_id=schedule_id,
            blocking_calendar_ids=[],
            booking_calendar_id="primary",
            sync_enabled=True,
        )
        db.add(sync_config)

    # Update fields
    if data.blocking_calendar_ids is not None:
        sync_config.blocking_calendar_ids = data.blocking_calendar_ids
    if data.booking_calendar_id is not None:
        sync_config.booking_calendar_id = data.booking_calendar_id
    if data.sync_enabled is not None:
        sync_config.sync_enabled = data.sync_enabled

    await db.commit()
    await db.refresh(sync_config)

    return ScheduleSyncConfig(
        schedule_id=schedule.id,
        schedule_name=schedule.name,
        blocking_calendar_ids=sync_config.blocking_calendar_ids or [],
        booking_calendar_id=sync_config.booking_calendar_id,
        sync_enabled=sync_config.sync_enabled,
    )


@router.get("/google/authorize")
async def authorize_google(
    current_user: User = Depends(get_current_user),
):
    """
    Start Google OAuth flow.
    Returns a URL to redirect the user to Google's consent screen.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured",
        )

    # Build authorization URL
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",  # Request refresh token
        "prompt": "consent",  # Force consent to get refresh token
        "state": str(current_user.id),  # Pass user_id to callback
    }

    auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return {"authorization_url": auth_url}


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Google OAuth callback.
    Exchange authorization code for tokens and store them.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured",
        )

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to exchange code: {response.text}",
        )

    token_data = response.json()
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 3600)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No access token received",
        )

    # Calculate token expiry
    token_expiry = datetime.utcnow() + timedelta(seconds=expires_in)

    # Get user_id from state
    try:
        user_id = uuid.UUID(state)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter",
        )

    # Check if integration already exists
    result = await db.execute(
        select(CalendarIntegration).where(
            CalendarIntegration.user_id == user_id,
            CalendarIntegration.provider == "google",
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Update existing integration
        existing.access_token = access_token
        if refresh_token:
            existing.refresh_token = refresh_token
        existing.token_expiry = token_expiry
    else:
        # Create new integration
        integration = CalendarIntegration(
            user_id=user_id,
            provider="google",
            access_token=access_token,
            refresh_token=refresh_token,
            token_expiry=token_expiry,
            calendar_id="primary",
            sync_bookings_to_gcal=True,
            check_gcal_busy=True,
        )
        db.add(integration)

    await db.commit()

    # Redirect to frontend settings page (use configured FRONTEND_URL)
    frontend_url = f"{settings.FRONTEND_URL}/es/settings?integration=success"
    return RedirectResponse(url=frontend_url)


@router.put("/google/settings", response_model=IntegrationStatus)
async def update_integration_settings(
    settings_data: IntegrationSettings,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update Google Calendar integration settings."""
    result = await db.execute(
        select(CalendarIntegration).where(
            CalendarIntegration.user_id == current_user.id,
            CalendarIntegration.provider == "google",
        )
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Google Calendar integration found",
        )

    if settings_data.calendar_id is not None:
        integration.calendar_id = settings_data.calendar_id
    if settings_data.sync_bookings_to_gcal is not None:
        integration.sync_bookings_to_gcal = settings_data.sync_bookings_to_gcal
    if settings_data.check_gcal_busy is not None:
        integration.check_gcal_busy = settings_data.check_gcal_busy

    await db.commit()
    await db.refresh(integration)

    return IntegrationStatus(
        connected=True,
        provider="google",
        calendar_id=integration.calendar_id,
        sync_bookings=integration.sync_bookings_to_gcal,
        check_busy=integration.check_gcal_busy,
    )


@router.delete("/google")
async def disconnect_google(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Disconnect Google Calendar integration."""
    result = await db.execute(
        select(CalendarIntegration).where(
            CalendarIntegration.user_id == current_user.id,
            CalendarIntegration.provider == "google",
        )
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Google Calendar integration found",
        )

    await db.delete(integration)
    await db.commit()

    return {"message": "Google Calendar disconnected successfully"}


@router.get("/google/calendars")
async def list_calendars(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List user's Google Calendars."""
    integration = await _get_valid_integration(db, current_user.id)

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GOOGLE_CALENDAR_API}/users/me/calendarList",
            headers={"Authorization": f"Bearer {integration.access_token}"},
        )

    if response.status_code == 401:
        # Token expired, try to refresh
        integration = await _refresh_token(db, integration)
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GOOGLE_CALENDAR_API}/users/me/calendarList",
                headers={"Authorization": f"Bearer {integration.access_token}"},
            )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch calendars from Google",
        )

    data = response.json()
    calendars = [
        {
            "id": cal.get("id"),
            "name": cal.get("summary"),
            "primary": cal.get("primary", False),
        }
        for cal in data.get("items", [])
    ]

    return {"calendars": calendars}


# ============ HELPER FUNCTIONS ============


async def _get_valid_integration(
    db: AsyncSession, user_id: uuid.UUID
) -> CalendarIntegration:
    """Get integration and refresh token if expired."""
    from datetime import timezone as tz

    result = await db.execute(
        select(CalendarIntegration).where(
            CalendarIntegration.user_id == user_id,
            CalendarIntegration.provider == "google",
        )
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Google Calendar not connected",
        )

    # Check if token is about to expire (within 5 minutes)
    # Use timezone-aware datetime for comparison
    now_utc = datetime.now(tz.utc)
    if integration.token_expiry and integration.token_expiry < now_utc + timedelta(
        minutes=5
    ):
        integration = await _refresh_token(db, integration)

    return integration


async def _refresh_token(
    db: AsyncSession, integration: CalendarIntegration
) -> CalendarIntegration:
    """Refresh the access token using the refresh token."""
    if not integration.refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token available. Please reconnect Google Calendar.",
        )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": integration.refresh_token,
                "grant_type": "refresh_token",
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh token. Please reconnect Google Calendar.",
        )

    token_data = response.json()
    integration.access_token = token_data.get("access_token")
    integration.token_expiry = datetime.utcnow() + timedelta(
        seconds=token_data.get("expires_in", 3600)
    )

    await db.commit()
    await db.refresh(integration)

    return integration
