"""Pydantic schemas for Patient CRUD operations."""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
import uuid


class ProfileData(BaseModel):
    """Extended patient profile data (flexible fields)."""

    # Personal data
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
    other_social: Optional[str] = None

    # Emergency contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    # Clinical/Intake info
    referral_source: Optional[str] = None  # How did you find me?
    previous_therapy: Optional[bool] = None
    current_medications: Optional[str] = None
    medical_conditions: Optional[str] = None
    goals: Optional[str] = None
    notes: Optional[str] = None  # Therapist's private notes

    class Config:
        extra = "allow"  # Allow additional dynamic fields


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
    profile_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
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
    profile_data: Optional[Dict[str, Any]] = None
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
    profile_data: Dict[str, Any] = Field(default_factory=dict)
    profile_image_url: Optional[str] = None

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
