"""Custom validators for API schemas.

Timezone-aware datetime validation following the UTC Sandwich pattern.
"""

from datetime import datetime
from typing import Annotated
from pydantic import BeforeValidator


def validate_iso_datetime_with_tz(value: str | datetime) -> datetime:
    """
    Validate that a datetime string includes timezone information.

    Accepts:
        - "2025-01-15T10:00:00Z" (Zulu/UTC)
        - "2025-01-15T10:00:00+01:00" (explicit offset)
        - "2025-01-15T10:00:00-05:00" (explicit offset)
        - datetime objects with tzinfo

    Rejects:
        - "2025-01-15T10:00:00" (naive - no timezone)
        - datetime objects without tzinfo

    Raises:
        ValueError: If datetime is naive (no timezone info)
    """
    if isinstance(value, datetime):
        if value.tzinfo is None:
            raise ValueError(
                "Datetime must include timezone. Use ISO format with Z or offset "
                "(e.g., 2025-01-15T10:00:00Z or 2025-01-15T10:00:00+01:00)"
            )
        return value

    # Handle string input
    if isinstance(value, str):
        # Replace Z with +00:00 for fromisoformat compatibility
        normalized = value.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(normalized)
        except ValueError as e:
            raise ValueError(f"Invalid datetime format: {e}")

        if dt.tzinfo is None:
            raise ValueError(
                "Datetime must include timezone. Use ISO format with Z or offset "
                "(e.g., 2025-01-15T10:00:00Z or 2025-01-15T10:00:00+01:00)"
            )
        return dt

    raise ValueError(f"Expected str or datetime, got {type(value)}")


# Type alias for use in Pydantic models
ISODateTimeWithTZ = Annotated[datetime, BeforeValidator(validate_iso_datetime_with_tz)]
