"""Pydantic schemas for authentication."""

from typing import Optional
from pydantic import BaseModel, EmailStr
import uuid


# ============ Request Schemas ============


class RegisterRequest(BaseModel):
    """Request schema for user registration."""

    email: EmailStr
    password: str
    full_name: str
    org_name: str
    referral_code: Optional[str] = None


class LoginRequest(BaseModel):
    """Request schema for user login."""

    email: EmailStr
    password: str


# ============ Response Schemas ============


class UserResponse(BaseModel):
    """User data response."""

    id: uuid.UUID
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    organization_id: uuid.UUID
    is_superuser: bool = False

    # Profile fields
    phone: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    profile_image_url: Optional[str] = None
    social_media: Optional[dict] = None

    class Config:
        from_attributes = True


class OrganizationResponse(BaseModel):
    """Organization data response."""

    id: uuid.UUID
    name: str
    type: str
    referral_code: str
    terminology_preference: str = "CLIENT"
    theme_config: Optional[dict] = None  # CSS variables for theme

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Response after successful authentication."""

    user: UserResponse
    organization: OrganizationResponse
    message: str = "Login successful"


class RegisterResponse(BaseModel):
    """Response after successful registration."""

    user: UserResponse
    organization: OrganizationResponse
    message: str = "Registration successful"
