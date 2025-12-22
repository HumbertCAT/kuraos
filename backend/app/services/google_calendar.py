"""Google Calendar Service for reading/writing events.

Handles:
1. Reading busy times from blocking calendars
2. Creating booking events in destination calendars
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.db.models import CalendarIntegration, ScheduleCalendarSync, User
from app.core.config import settings

logger = logging.getLogger(__name__)

GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"


class GoogleCalendarService:
    """Service for interacting with Google Calendar API."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_valid_token(self, user_id: uuid.UUID) -> Optional[str]:
        """Get a valid access token for the user, refreshing if needed."""
        result = await self.db.execute(
            select(CalendarIntegration).where(
                CalendarIntegration.user_id == user_id,
                CalendarIntegration.provider == "google",
            )
        )
        integration = result.scalar_one_or_none()

        if not integration:
            return None

        # Check if token is expired (with 5 min buffer)
        now = datetime.utcnow()
        if integration.token_expiry and integration.token_expiry <= now + timedelta(
            minutes=5
        ):
            # Refresh the token
            refreshed = await self._refresh_token(integration)
            if not refreshed:
                return None

        return integration.access_token

    async def _refresh_token(self, integration: CalendarIntegration) -> bool:
        """Refresh the access token using the refresh token."""
        if not integration.refresh_token:
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "client_id": settings.GOOGLE_CLIENT_ID,
                        "client_secret": settings.GOOGLE_CLIENT_SECRET,
                        "refresh_token": integration.refresh_token,
                        "grant_type": "refresh_token",
                    },
                )
                if response.status_code != 200:
                    logger.error(f"Token refresh failed: {response.text}")
                    return False

                data = response.json()
                integration.access_token = data["access_token"]
                integration.token_expiry = datetime.utcnow() + timedelta(
                    seconds=data.get("expires_in", 3600)
                )
                await self.db.commit()
                return True
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            return False

    async def get_busy_times(
        self,
        user_id: uuid.UUID,
        schedule_id: uuid.UUID,
        start_time: datetime,
        end_time: datetime,
    ) -> list[tuple[datetime, datetime]]:
        """
        Get busy time blocks from Google Calendar for a schedule's blocking calendars.

        Returns list of (start, end) tuples representing busy times.
        """
        # Get blocking calendar IDs for this schedule
        sync_result = await self.db.execute(
            select(ScheduleCalendarSync).where(
                ScheduleCalendarSync.schedule_id == schedule_id,
                ScheduleCalendarSync.sync_enabled == True,
            )
        )
        sync_config = sync_result.scalar_one_or_none()

        if not sync_config or not sync_config.blocking_calendar_ids:
            return []

        token = await self._get_valid_token(user_id)
        if not token:
            return []

        busy_times = []
        calendar_ids = sync_config.blocking_calendar_ids

        try:
            async with httpx.AsyncClient() as client:
                # Use freebusy API for efficient batch query
                response = await client.post(
                    f"{GOOGLE_CALENDAR_API}/freeBusy",
                    headers={"Authorization": f"Bearer {token}"},
                    json={
                        "timeMin": start_time.isoformat() + "Z",
                        "timeMax": end_time.isoformat() + "Z",
                        "items": [{"id": cal_id} for cal_id in calendar_ids],
                    },
                )

                if response.status_code != 200:
                    logger.error(f"FreeBusy API error: {response.text}")
                    return []

                data = response.json()
                calendars = data.get("calendars", {})

                for cal_id, cal_data in calendars.items():
                    for busy in cal_data.get("busy", []):
                        start = datetime.fromisoformat(busy["start"].replace("Z", ""))
                        end = datetime.fromisoformat(busy["end"].replace("Z", ""))
                        busy_times.append((start, end))

        except Exception as e:
            logger.error(f"Error fetching busy times: {e}")

        return busy_times

    async def create_booking_event(
        self,
        user_id: uuid.UUID,
        schedule_id: Optional[uuid.UUID],
        booking_calendar_id: Optional[str],
        event_title: str,
        event_description: str,
        start_time: datetime,
        end_time: datetime,
        attendee_email: Optional[str] = None,
    ) -> Optional[str]:
        """
        Create a calendar event for a booking.

        Returns the Google Calendar event ID if successful.
        """
        # Determine which calendar to use
        calendar_id = booking_calendar_id or "primary"

        # If no explicit calendar, check schedule config
        if not booking_calendar_id and schedule_id:
            sync_result = await self.db.execute(
                select(ScheduleCalendarSync).where(
                    ScheduleCalendarSync.schedule_id == schedule_id,
                )
            )
            sync_config = sync_result.scalar_one_or_none()
            if sync_config and sync_config.booking_calendar_id:
                calendar_id = sync_config.booking_calendar_id

        token = await self._get_valid_token(user_id)
        if not token:
            logger.warning(f"No valid token for user {user_id}, skipping GCal event")
            return None

        event_body = {
            "summary": event_title,
            "description": event_description,
            "start": {
                "dateTime": start_time.isoformat(),
                "timeZone": "UTC",
            },
            "end": {
                "dateTime": end_time.isoformat(),
                "timeZone": "UTC",
            },
        }

        if attendee_email:
            event_body["attendees"] = [{"email": attendee_email}]

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{GOOGLE_CALENDAR_API}/calendars/{calendar_id}/events",
                    headers={"Authorization": f"Bearer {token}"},
                    json=event_body,
                )

                if response.status_code in (200, 201):
                    event_data = response.json()
                    logger.info(f"Created GCal event: {event_data.get('id')}")
                    return event_data.get("id")
                else:
                    logger.error(f"Failed to create event: {response.text}")
                    return None

        except Exception as e:
            logger.error(f"Error creating GCal event: {e}")
            return None


# Factory function for easy instantiation
def get_google_calendar_service(db: AsyncSession) -> GoogleCalendarService:
    return GoogleCalendarService(db)
