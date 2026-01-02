"""Common Pydantic schemas for standardized responses."""

from typing import Generic, TypeVar, List, Dict, Any
from pydantic import BaseModel

T = TypeVar("T")


class ListMetadata(BaseModel):
    """Metadata for list responses supporting pagination and KPIs."""

    total: int  # Absolute total count in DB (for Header KPIs)
    filtered: int  # Count after filters/search (for Pagination logic)
    page: int
    page_size: int
    extra: Dict[str, Any] = {}  # Custom KPIs (e.g., risk_count, avg_ticket)


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic wrapper for standardized list responses."""

    data: List[T]
    meta: ListMetadata
