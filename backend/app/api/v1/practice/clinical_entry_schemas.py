"""Pydantic schemas for Clinical Entry CRUD operations."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel
import uuid


class ClinicalEntryCreate(BaseModel):
    """Schema for creating a clinical entry."""

    patient_id: uuid.UUID
    entry_type: str = "SESSION_NOTE"
    content: Optional[str] = None
    entry_metadata: Optional[dict] = None
    is_private: bool = True
    happened_at: Optional[datetime] = None


class ClinicalEntryUpdate(BaseModel):
    """Schema for updating a clinical entry."""

    content: Optional[str] = None
    entry_metadata: Optional[dict] = None
    is_private: Optional[bool] = None
    happened_at: Optional[datetime] = None


class ClinicalEntryResponse(BaseModel):
    """Schema for clinical entry response."""

    id: uuid.UUID
    patient_id: uuid.UUID
    author_id: Optional[uuid.UUID] = None
    entry_type: str
    content: Optional[str] = None
    entry_metadata: Optional[dict] = None
    is_private: bool
    happened_at: datetime
    created_at: datetime
    updated_at: datetime
    processing_status: str = "IDLE"
    processing_error: Optional[str] = None

    class Config:
        from_attributes = True


class ClinicalEntryListResponse(BaseModel):
    """Schema for list of clinical entries."""

    entries: list[ClinicalEntryResponse]
    total: int
