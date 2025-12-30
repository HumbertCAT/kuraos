"""Pydantic schemas for Patient CRUD operations."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
import uuid


class ProfileData(BaseModel):
    """Extended patient profile data - DEMOGRAPHIC ONLY.

    SECURITY: This schema enforces a strict whitelist of demographic fields.
    Clinical data (medical history, therapy notes) MUST go to ClinicalEntry.
    Unknown fields are silently ignored to prevent data leakage.
    """

    # Personal demographics
    gender: Optional[str] = None  # male, female, non_binary, prefer_not_to_say
    pronouns: Optional[str] = None  # él/ella/elle, he/him, she/her, they/them
    nationality: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    occupation: Optional[str] = None

    # Contact preferences
    preferred_contact: Optional[str] = None  # email, phone, whatsapp
    instagram: Optional[str] = None
    linkedin: Optional[str] = None

    # Emergency contact (third-party PII)
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    # Marketing/CRM
    referral_source: Optional[str] = None  # How did you find me?

    # Lead conversion metadata (auto-populated, not clinical)
    converted_from_lead: Optional[str] = None  # UUID string
    converted_at: Optional[str] = None  # ISO timestamp
    source_details: Optional[dict] = None  # UTM params, form attribution
    form_data: Optional[dict] = None  # Preserved from Lead for reference
    initial_notes: Optional[str] = None  # Sales notes from Lead

    class Config:
        extra = (
            "ignore"  # CRITICAL: Silently drop unknown fields to prevent data leakage
        )


class PatientCreate(BaseModel):
    """Schema for creating a new patient."""

    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    language: Optional[str] = "es"
    birth_date: Optional[datetime] = None
    birth_time: Optional[str] = None  # "HH:MM"
    birth_place: Optional[str] = None
    profile_data: Optional[ProfileData] = Field(default_factory=ProfileData)
    profile_image_url: Optional[str] = None


class PatientUpdate(BaseModel):
    """Schema for updating a patient. All fields optional."""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    language: Optional[str] = None
    birth_date: Optional[datetime] = None
    birth_time: Optional[str] = None
    birth_place: Optional[str] = None
    profile_data: Optional[ProfileData] = None
    profile_image_url: Optional[str] = None


class PatientResponse(BaseModel):
    """Schema for patient response."""

    id: uuid.UUID
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = None
    birth_date: Optional[datetime] = None
    birth_time: Optional[str] = None
    birth_place: Optional[str] = None
    organization_id: uuid.UUID
    created_at: datetime
    journey_status: Optional[dict] = None  # v0.9.x automation status
    profile_data: dict = Field(default_factory=dict)
    profile_image_url: Optional[str] = None
    # Risk fields for AletheIA sidebar (extracted from last_insight_json)
    risk_level: Optional[str] = None
    risk_reason: Optional[str] = None

    class Config:
        from_attributes = True

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class PatientListResponse(BaseModel):
    """Schema for paginated patient list."""

    patients: list[PatientResponse]
    total: int
    page: int
    per_page: int
