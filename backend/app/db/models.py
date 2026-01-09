"""SQLAlchemy Models for Kura OS."""

import enum
import secrets
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    String,
    ForeignKey,
    DateTime,
    Integer,
    Enum,
    Boolean,
    Text,
    Float,
    Numeric,
    Index,
    Table,
    Column,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


# ============ ENUMS ============


class OrgType(str, enum.Enum):
    SOLO = "SOLO"
    CLINIC = "CLINIC"


class UserRole(str, enum.Enum):
    OWNER = "OWNER"
    THERAPIST = "THERAPIST"
    ASSISTANT = "ASSISTANT"


class AttendeeStatus(str, enum.Enum):
    REGISTERED = "REGISTERED"
    CANCELED = "CANCELED"
    ATTENDED = "ATTENDED"
    WAITLIST = "WAITLIST"


class EntryType(str, enum.Enum):
    """Types of clinical entries in the patient timeline."""

    SESSION_NOTE = "SESSION_NOTE"
    AUDIO = "AUDIO"
    DOCUMENT = "DOCUMENT"
    AI_ANALYSIS = "AI_ANALYSIS"
    ASSESSMENT = "ASSESSMENT"
    FORM_SUBMISSION = "FORM_SUBMISSION"


class ProcessingStatus(str, enum.Enum):
    """Status of async AI analysis processing."""

    IDLE = "IDLE"  # No processing requested
    PENDING = "PENDING"  # Queued for processing
    PROCESSING = "PROCESSING"  # Currently being analyzed
    COMPLETED = "COMPLETED"  # Successfully completed
    FAILED = "FAILED"  # Error occurred


class EventStatus(str, enum.Enum):
    """Status of system event processing (automation engine)."""

    PENDING = "PENDING"  # Event logged, not yet evaluated
    PROCESSED = "PROCESSED"  # Rules executed successfully
    IGNORED = "IGNORED"  # No matching rules found
    FAILED = "FAILED"  # Error during rule execution


class OrgTier(str, enum.Enum):
    """Organization subscription tier.

    BUILDER: Free tier, 3 active patients
    PRO: Mid tier, 50 active patients
    CENTER: Clinic tier, 150 active patients
    """

    BUILDER = "BUILDER"  # Free, 3 patients
    PRO = "PRO"  # 50 patients
    CENTER = "CENTER"  # 150 patients


class OutputLanguage(str, enum.Enum):
    """AI output language preference."""

    AUTO = "AUTO"  # Match patient language
    SPANISH = "ES"
    ENGLISH = "EN"


class ThemePreference(str, enum.Enum):
    """User theme preference for UI appearance.

    Works with next-themes data-theme attribute:
    - DEFAULT: Standard Kura OS theme (teal brand)
    - OCEAN: Blue-based palette
    - SUNSET: Warm orange-based palette
    """

    DEFAULT = "DEFAULT"
    OCEAN = "OCEAN"
    SUNSET = "SUNSET"


class TerminologyPreference(str, enum.Enum):
    """Organization terminology preference for patient/client labels.

    Allows practitioners to align UI with their therapeutic lineage:
    - PATIENT: Clinical/Medical model
    - CLIENT: Coaching/Business model (default)
    - CONSULTANT: Holistic/Humanist model
    """

    PATIENT = "PATIENT"
    CLIENT = "CLIENT"
    CONSULTANT = "CONSULTANT"


class RiskLevel(str, enum.Enum):
    """Risk level for intake forms and therapies."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TherapyType(str, enum.Enum):
    """Type of therapy/modality for forms."""

    GENERAL = "GENERAL"
    ASTROLOGY = "ASTROLOGY"
    SOMATIC = "SOMATIC"
    PSYCHEDELIC = "PSYCHEDELIC"
    INTEGRATION = "INTEGRATION"


class FormType(str, enum.Enum):
    """Type of form in the clinical flow."""

    INTAKE = "INTAKE"
    PRE_SESSION = "PRE_SESSION"
    POST_SESSION = "POST_SESSION"
    FEEDBACK = "FEEDBACK"


class FormAssignmentStatus(str, enum.Enum):
    """Status of a form assignment."""

    SENT = "SENT"
    OPENED = "OPENED"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"


class ServiceMode(str, enum.Enum):
    """Mode of service delivery."""

    ONE_ON_ONE = "ONE_ON_ONE"  # Individual session
    GROUP = "GROUP"  # Group session/retreat


class SchedulingType(str, enum.Enum):
    """How the session is scheduled."""

    CALENDAR = "CALENDAR"  # Based on therapist availability
    FIXED_DATE = "FIXED_DATE"  # Specific event date


class BookingStatus(str, enum.Enum):
    """Status of a booking transaction."""

    PENDING = "PENDING"  # Created, awaiting payment
    CONFIRMED = "CONFIRMED"  # Paid and scheduled
    CANCELLED = "CANCELLED"  # Cancelled by patient or therapist
    COMPLETED = "COMPLETED"  # Session took place
    NO_SHOW = "NO_SHOW"  # Patient didn't attend


class LeadStatus(str, enum.Enum):
    """Status of a lead in the CRM pipeline.

    Represents the sales/qualification funnel before clinical conversion:
    - NEW: Fresh lead, no contact yet
    - CONTACTED: Initial outreach made
    - QUALIFIED: Passed screening, ready to convert
    - CONVERTED: Successfully promoted to Patient
    - LOST: Did not convert (archived)
    """

    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    APPOINTMENT_SCHEDULED = "APPOINTMENT_SCHEDULED"
    CONVERTED = "CONVERTED"
    LOST = "LOST"
    ARCHIVED = "ARCHIVED"


class DatasetType(str, enum.Enum):
    """Type of anonymized clinical dataset.

    Used in The Vault (anonymous_datasets) to categorize sanitized content
    without any patient/organization references.
    """

    CLINICAL_NOTE = "CLINICAL_NOTE"
    TRANSCRIPT = "TRANSCRIPT"
    CHAT_ANALYSIS = "CHAT_ANALYSIS"


class RewardType(str, enum.Enum):
    """Type of referral reward granted (v1.3.7)."""

    CREDITS = "CREDITS"
    SLOT = "SLOT"
    BOTH = "BOTH"


class ConversionStatus(str, enum.Enum):
    """Status of referral conversion payment (v1.3.7)."""

    PENDING = "PENDING"
    PAID = "PAID"


class RedemptionType(str, enum.Enum):
    """Type of karma redemption reward (v1.3.7)."""

    AI_TOKENS = "AI_TOKENS"  # Kura Credits
    EXTRA_PATIENT = "EXTRA_PATIENT"  # Bonus patient slot
    FEATURE = "FEATURE"  # Feature unlock


class PrivacyTier(str, enum.Enum):
    """Data retention policy tier (Kura Cortex v1.5).

    Controls how clinical data is handled after AI processing:
    - GHOST: Process in RAM, save summary only, delete raw + transcript immediately
    - STANDARD: Save transcript (sanitized), delete raw audio (GDPR default)
    - LEGACY: Save transcript, archive raw audio to Cold Storage (BAA-covered, AI-ready)

    Inheritance waterfall: Patient Override → Organization Default → Country Default
    """

    GHOST = "GHOST"  # Maximum privacy: RAM-only processing
    STANDARD = "STANDARD"  # GDPR-compliant: no raw retention
    LEGACY = "LEGACY"  # Full archive for AI training (under BAA)


# ============ ASSOCIATION TABLES ============

# Many-to-many: Which therapists can offer which services
service_therapist_link = Table(
    "service_therapist_link",
    Base.metadata,
    Column(
        "service_type_id",
        ForeignKey("service_types.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


# ============ MODELS ============


class Organization(Base):
    """Tenant/Billing entity. The top-level organizational unit."""

    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), index=True)
    type: Mapped[OrgType] = mapped_column(Enum(OrgType), default=OrgType.SOLO)

    # Growth/Referral System
    referral_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    referred_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("organizations.id"), nullable=True
    )
    karma_score: Mapped[int] = mapped_column(Integer, default=0)
    bonus_patient_slots: Mapped[int] = mapped_column(Integer, default=0)  # v1.3.7

    # Subscription tier
    tier: Mapped[OrgTier] = mapped_column(Enum(OrgTier), default=OrgTier.BUILDER)

    # UI Terminology preference (Patient/Client/Consultant)
    terminology_preference: Mapped[TerminologyPreference] = mapped_column(
        Enum(TerminologyPreference), default=TerminologyPreference.CLIENT
    )

    # AI Spend tracking is now done via AiUsageLog.cost_provider_usd
    # Limits are controlled via TIER_AI_SPEND_LIMIT_* in system_settings

    # Org-specific settings (custom prompts, etc.)
    settings: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Theme Engine: Custom CSS variables for org branding
    # Example: {"--brand": "#2dd4bf", "--sidebar": "#09090b"}
    theme_config: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Stripe SaaS Billing
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )

    # Stripe Connect (therapist payouts)
    stripe_connect_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    stripe_connect_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Kura Cortex v1.5: Privacy & Compliance
    # ISO 3166-1 alpha-2 country code (e.g., "ES", "US", "DE")
    # Used for default privacy tier resolution (GDPR vs BAA regions)
    country_code: Mapped[str] = mapped_column(String(2), default="ES")
    # Org-level privacy policy override (if set, applies to all patients)
    default_privacy_tier: Mapped[Optional[PrivacyTier]] = mapped_column(
        Enum(PrivacyTier), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )

    # Relationships
    users: Mapped[List["User"]] = relationship(back_populates="organization")
    patients: Mapped[List["Patient"]] = relationship(back_populates="organization")
    leads: Mapped[List["Lead"]] = relationship(back_populates="organization")
    events: Mapped[List["Event"]] = relationship(back_populates="organization")
    ai_usage_logs: Mapped[List["AiUsageLog"]] = relationship(
        back_populates="organization"
    )


class User(Base):
    """Application users linked to an Organization."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.OWNER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Superuser flag (for admin access)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    # Preferences
    locale: Mapped[str] = mapped_column(String(10), default="es")
    ai_output_preference: Mapped[OutputLanguage] = mapped_column(
        Enum(OutputLanguage), default=OutputLanguage.AUTO
    )
    theme_preference: Mapped["ThemePreference"] = mapped_column(
        Enum(ThemePreference), default=ThemePreference.DEFAULT
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))

    # Profile fields
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    profile_image_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    social_media: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Password reset
    password_reset_token: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True, index=True
    )
    password_reset_expires: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )

    organization: Mapped["Organization"] = relationship(back_populates="users")
    ai_usage_logs: Mapped[List["AiUsageLog"]] = relationship(back_populates="user")


class Patient(Base):
    """Patient/Client records - the 'Soul Record'."""

    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Patient's preferred language for AI output
    language: Mapped[str] = mapped_column(String(10), default="es")

    # Birth data for astrology/human design therapies
    birth_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    birth_time: Mapped[Optional[str]] = mapped_column(
        String(10), nullable=True
    )  # "HH:MM"
    birth_place: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))

    # Journey state tracking (Hybrid State Machine for v0.9.0 Automator)
    # Example: {"retreat_ibiza_2025": "AWAITING_PAYMENT", "intake_flow": "COMPLETED"}
    journey_status: Mapped[dict] = mapped_column(JSONB, default={})

    # Extended profile data (flexible JSONB for universal fields)
    # Includes: gender, pronouns, nationality, city, country, occupation,
    # preferred_contact, instagram, linkedin, emergency_contact, referral_source,
    # previous_therapy, medications, conditions, goals, notes, etc.
    profile_data: Mapped[dict] = mapped_column(JSONB, default={})

    # Profile photo URL
    profile_image_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # AletheIA Insights cache
    last_insight_json: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    last_insight_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # The Identity Vault: Universal contact ID across domains
    identity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("identities.id"), nullable=True, index=True
    )

    # Kura Cortex v1.5: Patient-level privacy override
    # If set, takes precedence over organization default
    privacy_tier_override: Mapped[Optional[PrivacyTier]] = mapped_column(
        Enum(PrivacyTier), nullable=True
    )

    organization: Mapped["Organization"] = relationship(back_populates="patients")
    attendances: Mapped[List["Attendee"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    clinical_entries: Mapped[List["ClinicalEntry"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    form_assignments: Mapped[List["FormAssignment"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    bookings: Mapped[List["Booking"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )


class Lead(Base):
    """CRM Lead - Prospective client before clinical conversion.

    This model handles sales/qualification pipeline BEFORE the person
    becomes a clinical patient. GDPR compliant: no clinical data stored here.

    Flow: Lead (sales) → convert → Patient (clinical)
    """

    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))

    # Basic contact info
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # CRM Pipeline
    status: Mapped[LeadStatus] = mapped_column(Enum(LeadStatus), default=LeadStatus.NEW)

    # Attribution tracking
    source: Mapped[str] = mapped_column(String(50), default="Manual")
    # source_details: {"form_title": "Retreat 2025", "utm_source": "instagram", etc.}
    source_details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Notes (preserved during conversion → becomes initial clinical context)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Structured form data (JSONB) - clinical answers from intake forms
    # Separates PII (name, email in columns) from clinical data (here)
    form_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # v1.6 Liquid CRM: Shadow Profile & Sherlock Metrics
    # shadow_profile: {"intent": "...", "communication_style": "...", "best_time": "..."}
    shadow_profile: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    # sherlock_metrics: {"r": 80, "n": 90, "a": 50, "v": 70, "total_score": 72}
    sherlock_metrics: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # The Identity Vault: Universal contact ID across domains
    identity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("identities.id"), nullable=True, index=True
    )

    # Conversion tracking
    converted_patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("patients.id"), nullable=True
    )
    converted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="leads")
    converted_patient: Mapped[Optional["Patient"]] = relationship()

    __table_args__ = (Index("ix_leads_org_status", "organization_id", "status"),)


class Identity(Base):
    """Universal Contact Identity - The Identity Vault.

    Deduplicates contacts across Lead/Patient/Follower domains using
    email and phone normalization. Enables 360° contact view and
    cross-domain timeline tracking while maintaining HIPAA separation.

    Architecture: GEM's hybrid approach (pragmatic + scalable)
    - Primary identifiers: email + phone (normalized)
    - Waterfall matching: email → phone → create new
    - Future: Merge support for discovered duplicates

    v1.6.4: Phase 1 - Basic deduplication
    v2.0: Phase 2 - Full contact_identifiers table for multiple emails/phones
    """

    __tablename__ = "identities"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))

    # Normalized identifiers (IdentityResolver handles normalization)
    primary_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    primary_phone: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # E.164 format

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )

    # Merge/Deduplication support (future)
    merged_with: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("identities.id"), nullable=True
    )
    is_merged: Mapped[bool] = mapped_column(Boolean, default=False)

    # v1.6.6 Meta Cloud API session tracking (Chronos Logic)
    # Used for 24h messaging window enforcement
    last_meta_interaction_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    meta_provider: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # "whatsapp" | "instagram"

    # Relationships
    organization: Mapped["Organization"] = relationship()

    __table_args__ = (
        # Unique constraints (one email/phone per org)
        Index("uq_identity_org_email", "organization_id", "primary_email", unique=True),
        Index("uq_identity_org_phone", "organization_id", "primary_phone", unique=True),
        # Performance indexes
        Index("idx_identities_email", "organization_id", "primary_email"),
        Index("idx_identities_phone", "organization_id", "primary_phone"),
        Index("idx_identities_merged", "is_merged"),
    )


class Event(Base):
    """Group events: webinars, retreats, workshops."""

    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    capacity: Mapped[int] = mapped_column(Integer)
    price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)

    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    organization: Mapped["Organization"] = relationship(back_populates="events")
    attendees: Mapped[List["Attendee"]] = relationship(back_populates="event")


class Attendee(Base):
    """Links Patients to Events."""

    __tablename__ = "attendees"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    status: Mapped[AttendeeStatus] = mapped_column(
        Enum(AttendeeStatus), default=AttendeeStatus.REGISTERED
    )

    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"))
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    event: Mapped["Event"] = relationship(back_populates="attendees")
    patient: Mapped["Patient"] = relationship(back_populates="attendances")


class ClinicalEntry(Base):
    """Clinical entries for the patient timeline (Soul Record).

    Stores session notes, uploaded files (audio/documents),
    AI analyses, and assessments with flexible JSONB metadata.
    """

    __tablename__ = "clinical_entries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    # Relationships
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    author_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    # Entry type and content
    entry_type: Mapped[EntryType] = mapped_column(
        Enum(EntryType), default=EntryType.SESSION_NOTE
    )
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Flexible metadata (file URLs, assessment scores, etc.)
    entry_metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Privacy and timing
    is_private: Mapped[bool] = mapped_column(Boolean, default=True)
    happened_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )

    # Async processing status
    processing_status: Mapped[ProcessingStatus] = mapped_column(
        Enum(ProcessingStatus), default=ProcessingStatus.IDLE
    )
    processing_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Cortex v1.5.4: Ghost Protocol
    is_ghost: Mapped[bool] = mapped_column(Boolean, default=False)
    pipeline_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship(back_populates="clinical_entries")
    author: Mapped["User"] = relationship()


class SystemSetting(Base):
    """Global system configuration stored in database.

    Stores prompts, limits, and other configurable settings
    that can be changed without code deployment.
    """

    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[dict] = mapped_column(JSONB)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )


class SafetyMode(str, enum.Enum):
    """AI Safety Mode for content filtering.

    Controls how aggressively the model filters harmful content:
    - CLINICAL: Permissive (allows discussion of suicide/self-harm in therapy context)
    - STANDARD: Balanced filtering
    - STRICT: Maximum filtering (for public-facing bots)
    """

    CLINICAL = "CLINICAL"
    STANDARD = "STANDARD"
    STRICT = "STRICT"


class AiTaskConfig(Base):
    """Configuration for AI tasks (temperature, model, safety).

    v1.4.5: Enables runtime configuration of AI parameters per task
    without code deployment. Cached with LRU for performance.
    """

    __tablename__ = "ai_task_configs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    task_type: Mapped[str] = mapped_column(String(50), unique=True, index=True)

    # Model selection
    model_id: Mapped[str] = mapped_column(String(100), default="gemini-2.5-flash")

    # Generation parameters
    temperature: Mapped[float] = mapped_column(Numeric(3, 2), default=0.70)
    max_output_tokens: Mapped[int] = mapped_column(Integer, default=2048)

    # Safety filtering
    safety_mode: Mapped[SafetyMode] = mapped_column(
        Enum(SafetyMode), default=SafetyMode.CLINICAL
    )

    # Prompt template (Jinja2 syntax for variable substitution)
    system_prompt_template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Audit
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )
    updated_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    # Relationships
    updated_by: Mapped[Optional["User"]] = relationship()


class AiTaskConfigHistory(Base):
    """Audit log for AI task configuration changes.

    Tracks who changed what and when for compliance and debugging.
    """

    __tablename__ = "ai_task_config_history"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    task_type: Mapped[str] = mapped_column(String(50), index=True)
    field_changed: Mapped[str] = mapped_column(String(50))
    old_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    changed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    # Relationships
    changed_by: Mapped[Optional["User"]] = relationship()


class AIPipelineConfig(Base):
    """Cognitive Pipeline Configuration (Kura Cortex v1.5).

    Defines DAG-based AI processing pipelines that replace hardcoded task logic.
    Each pipeline specifies:
    - Input modality (AUDIO, TEXT, VISION)
    - Processing stages (JSON array)
    - Privacy tier constraints

    Replaces the flat AI_TASK_ROUTING system with structured pipeline definitions.
    """

    __tablename__ = "ai_pipeline_configs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)

    # Input type
    input_modality: Mapped[str] = mapped_column(String(20))  # AUDIO, TEXT, VISION

    # Pipeline stages (JSON array of step configurations)
    # Example: [
    #   {"step": "transcribe", "model": "gemini:2.5-flash"},
    #   {"step": "analyze", "model": "gemini:2.5-pro", "prompt_key": "SOAP"}
    # ]
    stages: Mapped[dict] = mapped_column(JSONB, default=list)

    # Privacy constraints
    # If set, this pipeline requires at least this privacy tier
    privacy_tier_required: Mapped[Optional[PrivacyTier]] = mapped_column(
        Enum(PrivacyTier), nullable=True
    )

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Audit
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )


class AiUsageLog(Base):
    """AI Usage Ledger - FinOps tracking with real token accounting.

    Tracks every AI call with:
    - Provider and model identification
    - Input/output token counts
    - Provider cost (what Google charges us)
    - User credits (with configurable margin)

    v1.1.1: Upgraded from simple credits to real token accounting.
    """

    __tablename__ = "ai_usage_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Context
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id"), index=True
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("patients.id"), nullable=True
    )
    clinical_entry_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("clinical_entries.id", ondelete="SET NULL"), nullable=True
    )

    # Provider details (v1.1.1 fields)
    provider: Mapped[str] = mapped_column(
        String(50), default="vertex-google"
    )  # 'vertex-google', 'vertex-anthropic', 'vertex-meta'
    model_id: Mapped[str] = mapped_column(
        String(100), default="gemini-2.5-flash"
    )  # Full model name
    task_type: Mapped[str] = mapped_column(
        String(50), default="clinical_analysis"
    )  # 'transcription', 'clinical_analysis', 'chat', 'insights'

    # Token metrics (v1.1.1 - real accounting)
    tokens_input: Mapped[int] = mapped_column(Integer, default=0)
    tokens_output: Mapped[int] = mapped_column(Integer, default=0)

    # Cost tracking (v1.1.1 - FinOps)
    cost_provider_usd: Mapped[float] = mapped_column(
        Numeric(10, 6), default=0.0
    )  # Raw cost from Google (6 decimals for micropayments)
    cost_user_credits: Mapped[float] = mapped_column(
        Numeric(10, 4), default=0.0
    )  # User-facing cost (with margin)

    # Legacy field (kept for backwards compatibility, will be deprecated)
    credits_cost: Mapped[int] = mapped_column(Integer, default=0)
    activity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="ai_usage_logs")
    user: Mapped[Optional["User"]] = relationship(back_populates="ai_usage_logs")

    __table_args__ = (
        Index("ix_ai_usage_org_date", "organization_id", "created_at"),
        Index("ix_ai_usage_model", "model_id"),
    )


class FormTemplate(Base):
    """Form templates for intake, pre/post session, and feedback forms.

    If organization_id is NULL, it is a System Template (global).
    Organization templates are clones of system templates customized for the org.
    """

    __tablename__ = "form_templates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    # NULL = System Template (global), otherwise Org Template
    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("organizations.id"), nullable=True, index=True
    )

    # Metadata
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # The form definition (fields, validation rules, etc.)
    schema: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Classification
    risk_level: Mapped[RiskLevel] = mapped_column(
        Enum(RiskLevel), default=RiskLevel.LOW
    )
    therapy_type: Mapped[TherapyType] = mapped_column(
        Enum(TherapyType), default=TherapyType.GENERAL
    )
    form_type: Mapped[FormType] = mapped_column(Enum(FormType), default=FormType.INTAKE)

    # NOTE: service_mode and scheduling_type removed - now only in ServiceType

    # Public access token - "Instagram Link" for lead gen
    # If set, form accessible at /f/public/{public_token} without assignment
    public_token: Mapped[Optional[str]] = mapped_column(
        String(64), unique=True, index=True, nullable=True
    )

    # Target entity for public form submissions
    # PATIENT (default): Creates patient record
    # LEAD: Creates lead record in CRM
    target_entity: Mapped[str] = mapped_column(String(20), default="PATIENT")

    # Extensible configuration for journey rules, prerequisites, notifications
    # Structure: { "prerequisites": { "screening_required": bool, ... }, "notifications": {...} }
    config: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    views_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )

    # Relationships
    assignments: Mapped[List["FormAssignment"]] = relationship(
        back_populates="template"
    )

    @property
    def is_system(self) -> bool:
        """True if this is a system-level template (no org)."""
        return self.organization_id is None


class FormAssignment(Base):
    """Links a form template to a patient with a unique access token.

    The token is used for public access without authentication.
    """

    __tablename__ = "form_assignments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    template_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("form_templates.id"), index=True
    )

    # Status tracking
    status: Mapped[FormAssignmentStatus] = mapped_column(
        Enum(FormAssignmentStatus), default=FormAssignmentStatus.SENT
    )

    # Public access token (URL-safe, unique)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)

    # Expiration
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    # Timestamps
    opened_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    # Relationships
    patient: Mapped["Patient"] = relationship(back_populates="form_assignments")
    template: Mapped["FormTemplate"] = relationship(back_populates="assignments")


# ============ BOOKING ENGINE MODELS (v0.8.0) ============


class ServiceType(Base):
    """Product catalog: What the therapist sells (Sessions, Retreats).

    The "Commercial Boss" - defines pricing, duration, and links to clinical forms.
    """

    __tablename__ = "service_types"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id"), index=True
    )

    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 1:1 vs Group
    kind: Mapped[ServiceMode] = mapped_column(
        Enum(ServiceMode), default=ServiceMode.ONE_ON_ONE
    )

    # Duration in minutes (e.g., 60 for 1h session)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)

    # Pricing
    price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")

    # Capacity for group events (ignored for 1:1)
    capacity: Mapped[int] = mapped_column(Integer, default=1)

    # How the session is scheduled: CALENDAR (uses availability) or FIXED_DATE (specific event)
    scheduling_type: Mapped[SchedulingType] = mapped_column(
        Enum(SchedulingType), default=SchedulingType.CALENDAR
    )

    # Link to intake form - triggers the clinical journey
    intake_form_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("form_templates.id"), nullable=True
    )

    # Link to availability schedule (NULL = use therapist's default schedule)
    # Only used for CALENDAR scheduling_type services
    schedule_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("availability_schedules.id"), nullable=True, index=True
    )

    # Whether booking requires manual approval
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)

    # Cancellation/Reschedule Policy (JSONB for flexibility)
    # Structure: {
    #   "allow_cancel": true,
    #   "allow_reschedule": true,
    #   "min_hours_before": 336,  # e.g., 14 days = 336 hours
    #   "refund_policy": "full" | "partial" | "none"
    # }
    cancellation_policy: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )

    # Relationships
    organization: Mapped["Organization"] = relationship()
    intake_form: Mapped[Optional["FormTemplate"]] = relationship()
    schedule: Mapped[Optional["AvailabilitySchedule"]] = relationship()
    bookings: Mapped[List["Booking"]] = relationship(back_populates="service_type")

    # Many-to-many: Which therapists can offer this service
    therapists: Mapped[List["User"]] = relationship(
        secondary=service_therapist_link, backref="offered_services"
    )


class AvailabilitySchedule(Base):
    """A named availability schedule (e.g., 'Morning Clinic', 'Online Afternoons').

    Therapists can have multiple schedules and link services to specific ones.
    One schedule per therapist is marked as default.
    """

    __tablename__ = "availability_schedules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)

    name: Mapped[str] = mapped_column(String(100))  # "Consulta Mañanas"
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship()
    blocks: Mapped[List["AvailabilityBlock"]] = relationship(back_populates="schedule")
    time_offs: Mapped[List["TimeOff"]] = relationship(back_populates="schedule")
    specific_availability: Mapped[List["SpecificAvailability"]] = relationship(
        back_populates="schedule"
    )


class AvailabilityBlock(Base):
    """Recurring availability: When the therapist works.

    Defines weekly patterns (e.g., "Mondays 9-17").
    """

    __tablename__ = "availability_blocks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)

    # Link to availability schedule
    schedule_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("availability_schedules.id"), index=True
    )

    # 0=Monday, 6=Sunday (ISO weekday)
    day_of_week: Mapped[int] = mapped_column(Integer)

    # Time range in "HH:MM" format (24h)
    start_time: Mapped[str] = mapped_column(String(5))  # "09:00"
    end_time: Mapped[str] = mapped_column(String(5))  # "17:00"

    # Date range validity (for seasonal schedules)
    effective_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    effective_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship()
    schedule: Mapped["AvailabilitySchedule"] = relationship(back_populates="blocks")


class TimeOff(Base):
    """Availability exceptions: When the therapist is NOT working.

    Used for vacations, personal days, dentist appointments, etc.
    """

    __tablename__ = "time_off"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)

    # Link to schedule (NULL = applies to ALL schedules - global block)
    schedule_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("availability_schedules.id"), nullable=True, index=True
    )

    # The blocked time range
    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    # Optional reason for the therapist's reference
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship()
    schedule: Mapped[Optional["AvailabilitySchedule"]] = relationship(
        back_populates="time_offs"
    )


class SpecificAvailability(Base):
    """Specific dates when the therapist IS working (Exceptions to Weekly Schedule).

    Used for retreats, workshops on weekends, or extra hours on specific days.
    """

    __tablename__ = "specific_availability"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)

    # Link to schedule (NULL = applies to ALL schedules - global availability)
    schedule_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("availability_schedules.id"), nullable=True, index=True
    )

    # The available time range
    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship()
    schedule: Mapped[Optional["AvailabilitySchedule"]] = relationship(
        back_populates="specific_availability"
    )


class Booking(Base):
    """A purchase of a ServiceType, resulting in a scheduled session.

    The transaction that connects Patient -> Service -> Calendar Slot.
    """

    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id"), index=True
    )

    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    service_type_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("service_types.id"), index=True
    )

    # The therapist/user handling this booking
    therapist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)

    # The actual calendar event created (links to existing Event model)
    event_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("events.id"), nullable=True
    )

    # Timing snapshot (denormalized for quick queries)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus), default=BookingStatus.PENDING
    )

    # Stripe Payment Info
    stripe_payment_intent_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )
    stripe_payment_status: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # "succeeded", "pending", "failed"
    amount_paid: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")

    # Notes from patient at booking time
    patient_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Google Calendar Integration
    google_calendar_event_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )

    # Wall Clock Pattern: Preserve original timezone for DST protection
    # IANA timezone string (e.g., "Europe/Madrid", "America/Mexico_City")
    target_timezone: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )

    # Public access token for self-service management (email links)
    public_token: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, default=lambda: secrets.token_urlsafe(32)
    )

    # Cancellation/Reschedule tracking
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancelled_by: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # "patient" | "therapist"
    rescheduled_from_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("bookings.id"), nullable=True
    )

    # Relationships
    organization: Mapped["Organization"] = relationship()
    patient: Mapped["Patient"] = relationship(back_populates="bookings")
    service_type: Mapped["ServiceType"] = relationship(back_populates="bookings")
    therapist: Mapped["User"] = relationship()
    event: Mapped[Optional["Event"]] = relationship()


class CalendarIntegration(Base):
    """OAuth integration for external calendars (Google Calendar, etc)."""

    __tablename__ = "calendar_integrations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)

    # Provider info
    provider: Mapped[str] = mapped_column(String(50), default="google")

    # OAuth tokens
    access_token: Mapped[str] = mapped_column(Text)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    token_expiry: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Configuration (deprecated - now per-schedule)
    calendar_id: Mapped[str] = mapped_column(
        String(255), default="primary"
    )  # Which calendar to sync with
    sync_bookings_to_gcal: Mapped[bool] = mapped_column(
        Boolean, default=True
    )  # Push TherapistOS bookings to GCal
    check_gcal_busy: Mapped[bool] = mapped_column(
        Boolean, default=True
    )  # Check GCal for busy times

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship()


class ScheduleCalendarSync(Base):
    """Per-schedule Google Calendar sync configuration."""

    __tablename__ = "schedule_calendar_syncs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    schedule_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("availability_schedules.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )

    # Which Google calendars block availability for this schedule (JSON array of calendar IDs)
    blocking_calendar_ids: Mapped[Optional[List]] = mapped_column(
        JSONB, nullable=True, default=list
    )

    # Where new bookings for this schedule are sent
    booking_calendar_id: Mapped[str] = mapped_column(String(255), default="primary")

    # Enable/disable sync for this schedule
    sync_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )

    # Relationships
    schedule: Mapped["AvailabilitySchedule"] = relationship()


# ============ AUTOMATION ENGINE (v0.9.0) ============


class SystemEventLog(Base):
    """Immutable audit log of all system events for debugging and clinical compliance.

    This is the "black box" of the automation engine. Every significant event
    is logged here with its payload for debugging and compliance.
    """

    __tablename__ = "system_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id"), index=True
    )

    # Event type (e.g., FORM_SUBMISSION_COMPLETED, BOOKING_CREATED)
    event_type: Mapped[str] = mapped_column(String(100), index=True)

    # Full payload at time of event (for debugging and rule replay)
    payload: Mapped[dict] = mapped_column(JSONB, default={})

    # Processing status
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus), default=EventStatus.PENDING
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Optional link to triggering entity
    entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class JourneyTemplate(Base):
    """Blueprint for clinical journeys (Retreats, Intakes, Programs).

    Formalizes journey configurations that were previously magic strings.
    Used to validate stage transitions and configure automation rules.
    """

    __tablename__ = "journey_templates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id"), index=True
    )

    # Human-readable name (e.g., "Retiro Ibiza 2025")
    name: Mapped[str] = mapped_column(String(255))

    # Machine key used in patient.journey_status (e.g., "retreat_ibiza_2025")
    key: Mapped[str] = mapped_column(String(100), index=True)

    # Allowed stages for this journey (validates transitions)
    # Example: ["AWAITING_SCREENING", "AWAITING_PAYMENT", "CONFIRMED", "BLOCKED"]
    allowed_stages: Mapped[list] = mapped_column(JSONB, default=list)

    # Default starting stage when patient is enrolled
    initial_stage: Mapped[str] = mapped_column(String(50), default="PENDING")

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Unique constraint: one key per organization
    __table_args__ = (
        Index("ix_journey_templates_org_key", "organization_id", "key", unique=True),
    )


class JourneyLog(Base):
    """Immutable audit trail of journey state changes.

    Records every transition in patient.journey_status for:
    - Clinical compliance auditing
    - Analytics (avg time to payment, conversion rates)
    - Stale journey detection (time since last change)
    """

    __tablename__ = "journey_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)

    # The journey key (e.g., "retreat_ibiza_2025")
    journey_key: Mapped[str] = mapped_column(String(100), index=True)

    # State transition
    from_stage: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # NULL if first enrollment
    to_stage: Mapped[str] = mapped_column(String(50))

    # When the transition happened (UTC)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Link to the event that triggered this change (for debugging)
    trigger_event_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("system_events.id"), nullable=True
    )

    # Composite index for stale journey queries
    __table_args__ = (
        Index(
            "ix_journey_logs_patient_key_time",
            "patient_id",
            "journey_key",
            "changed_at",
        ),
    )


class AutomationRule(Base):
    """Configurable automation rules for the Playbook Marketplace.

    Two types of rules:
    - System templates (organization_id=NULL, is_system_template=True):
      Pre-configured "Playbooks" that users can install/clone
    - Organization rules (organization_id=<uuid>, is_system_template=False):
      Active rules cloned from templates, editable by user

    The automation engine loads active org rules and executes matching ones.
    """

    __tablename__ = "automation_rules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    # NULL for system templates, set for org-specific rules
    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("organizations.id"), nullable=True, index=True
    )

    # Human-readable name and description
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")

    # Lucide React icon name (e.g., "ShieldAlert", "Banknote", "HeartHandshake")
    icon: Mapped[str] = mapped_column(String(50), default="Zap")

    # Trigger event type (from TriggerEvent enum value)
    trigger_event: Mapped[str] = mapped_column(String(100), index=True)

    # Conditions for rule matching (JSONB)
    # Format: {"logic": "AND", "rules": [{"field": "risk_level", "operator": "equals", "value": "HIGH"}]}
    conditions: Mapped[dict] = mapped_column(JSONB, default={})

    # Actions to execute when rule matches (JSONB array)
    # Format: [{"type": "update_journey_status", "params": {"key": "intake", "status": "BLOCKED"}}]
    actions: Mapped[list] = mapped_column(JSONB, default=[])

    # Rule state
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    is_system_template: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Execution priority (lower = higher priority)
    priority: Mapped[int] = mapped_column(Integer, default=100)

    # Link to source template (for cloned rules)
    cloned_from_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("automation_rules.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )

    # Agent personality and behavior (v0.9.9.10)
    # Schema: {tone: CLINICAL|EMPATHETIC|DIRECT, mode: AUTO_SEND|DRAFT_ONLY, signature: str}
    agent_config: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)


class PendingActionStatus(str, Enum):
    """Status of a pending agent action awaiting human approval."""

    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class PendingAction(Base):
    """Draft actions created by agents in DRAFT_ONLY mode.

    Human-in-the-loop: Agent prepares the action, user reviews and approves.
    """

    __tablename__ = "pending_actions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )

    # Link to the rule that created this action
    rule_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("automation_rules.id", ondelete="CASCADE"), index=True
    )

    # Action details
    action_type: Mapped[str] = mapped_column(String(50))  # send_email, send_whatsapp
    recipient_id: Mapped[uuid.UUID] = mapped_column(index=True)  # patient or lead id
    recipient_type: Mapped[str] = mapped_column(String(20))  # patient, lead
    recipient_name: Mapped[str] = mapped_column(String(255))
    recipient_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Draft content (original template with variables replaced)
    draft_content: Mapped[dict] = mapped_column(JSONB, default=dict)
    # AI-enhanced version (LLM rewritten with tone)
    ai_generated_content: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Status workflow
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)

    # Audit trail
    created_by_event_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("system_events.id", ondelete="SET NULL"), nullable=True
    )
    approved_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    organization: Mapped["Organization"] = relationship()
    rule: Mapped["AutomationRule"] = relationship()


class AutomationExecutionLog(Base):
    """Logs each execution of an automation rule.

    Tracks success/failure, timing, and details for analytics and debugging.
    """

    __tablename__ = "automation_execution_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    # References
    automation_rule_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("automation_rules.id", ondelete="CASCADE"), index=True
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("patients.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Trigger details
    trigger_event: Mapped[str] = mapped_column(String(100))
    trigger_payload: Mapped[dict] = mapped_column(JSONB, default={})

    # Execution result
    status: Mapped[str] = mapped_column(
        String(20), index=True
    )  # SUCCESS, FAILED, SKIPPED
    actions_executed: Mapped[list] = mapped_column(
        JSONB, default=[]
    )  # Which actions ran
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timing
    execution_time_ms: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


# ============ WHATSAPP MESSAGING ============


class MessageDirection(str, enum.Enum):
    """Direction of WhatsApp message."""

    INBOUND = "INBOUND"  # From patient
    OUTBOUND = "OUTBOUND"  # To patient


class MessageLog(Base):
    """Stores WhatsApp messages for analysis.

    Raw message data from Twilio webhook, linked to patients.
    Indexed for efficient daily batch processing by AletheIA.
    """

    __tablename__ = "message_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )

    # Message content
    direction: Mapped[MessageDirection] = mapped_column(
        Enum(MessageDirection), default=MessageDirection.INBOUND
    )
    content: Mapped[str] = mapped_column(Text)

    # Twilio metadata
    provider_id: Mapped[Optional[str]] = mapped_column(
        String(100), unique=True, nullable=True
    )  # Twilio MessageSid
    status: Mapped[str] = mapped_column(String(20), default="RECEIVED")

    # Timestamps
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    # v1.6.7 Deep Listening: Media storage for audio/images
    media_id: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )  # Meta media_id for deduplication
    media_url: Mapped[Optional[str]] = mapped_column(
        String(512), nullable=True
    )  # GCS URI (gs://bucket/path)
    mime_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # audio/ogg, image/jpeg, etc.

    # Composite index for daily batch queries
    __table_args__ = (
        Index("ix_message_logs_patient_timestamp", "patient_id", "timestamp"),
    )


class DailyConversationAnalysis(Base):
    """AI-generated daily analysis of patient conversations.

    Processed by AletheIA from MessageLog data to detect:
    - Sentiment trends (-1.0 to 1.0)
    - Risk flags (keywords, crisis indicators)
    - Clinical insights for therapist review
    """

    __tablename__ = "daily_conversation_analyses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )

    # Analysis date (UTC, one per patient per day)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    # AletheIA output
    summary: Mapped[str] = mapped_column(Text)  # Clinical summary
    sentiment_score: Mapped[float] = mapped_column(Float)  # -1.0 to 1.0
    emotional_state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    risk_flags: Mapped[list] = mapped_column(
        JSONB, default=[]
    )  # ["Ideación Suicida", ...]
    suggestion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Metadata
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Unique constraint: one analysis per patient per day
    __table_args__ = (
        Index("ix_daily_analysis_patient_date", "patient_id", "date", unique=True),
    )


# ============ HELP CHATBOT ANALYTICS (v0.9.10) ============


class HelpQueryLog(Base):
    """Logs help chatbot queries for product analytics.

    Only the query is stored, NOT the response (privacy + storage optimization).
    Used to identify UX pain points and improve documentation.
    """

    __tablename__ = "help_query_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    org_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("organizations.id"), nullable=True, index=True
    )
    query_text: Mapped[str] = mapped_column(String(500))
    detected_topic: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    current_route: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ============ THE VAULT - Anonymous Clinical Data ============


class AnonymousDataset(Base):
    """The Vault - Anonymized clinical content decoupled from patient identity.

    CRITICAL: This table has NO foreign keys and NO patient/organization references.
    It is designed to survive patient deletion (GDPR Right to Erasure) while
    preserving valuable clinical patterns and AI training data.

    The content is sanitized via data_sanitizer.py before storage:
    - Names replaced with [NAME_REDACTED]
    - Phones replaced with [PHONE_REDACTED]
    - Emails replaced with [EMAIL_REDACTED]

    This is the "Clean IP" that can be used for research, ML training,
    and clinical intelligence without personal data liability.
    """

    __tablename__ = "anonymous_datasets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    # Type of sanitized content
    source_type: Mapped[DatasetType] = mapped_column(Enum(DatasetType))

    # Sanitized clinical content (PII removed)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Extracted metadata (sentiment, themes, keywords, risk_level) - NO PII
    meta_analysis: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Content language for NLP purposes
    language: Mapped[str] = mapped_column(String(10), default="es")

    # Timestamp (deliberately NOT linked to any patient event)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ReferralConversion(Base):
    """Tracks successful referral conversions and reward payouts (v1.3.7).

    The Mycelium Engine: When a referred organization activates,
    this record is created and both parties receive rewards.
    """

    __tablename__ = "referral_conversions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    # The organization that sent the referral
    referrer_org_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )

    # The new organization that signed up with the referral code
    referee_org_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), unique=True
    )

    # What type of reward was granted
    reward_type: Mapped[RewardType] = mapped_column(
        Enum(RewardType), default=RewardType.BOTH
    )

    # How many Kura Credits were awarded
    credits_awarded: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    # Status of the reward
    status: Mapped[ConversionStatus] = mapped_column(
        Enum(ConversionStatus), default=ConversionStatus.PENDING
    )

    # When the referee completed registration
    converted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # When the rewards were actually paid out
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class KarmaRedemption(Base):
    """Tracks karma→reward redemptions (v1.3.7).

    When a user redeems karma points for rewards (Kura Credits, patient slots, features),
    this table records the transaction for auditing and reporting.
    """

    __tablename__ = "karma_redemptions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    # The organization redeeming karma
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )

    # The user who initiated the redemption
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Reward catalog ID (e.g. "ai-tokens", "extra-patient")
    reward_id: Mapped[str] = mapped_column(String(50), index=True)

    # Type of reward
    redemption_type: Mapped[RedemptionType] = mapped_column(Enum(RedemptionType))

    # Karma cost deducted
    karma_cost: Mapped[int] = mapped_column(Integer, default=0)

    # Value granted (KC for credits, 1 for slot, etc.)
    value_granted: Mapped[float] = mapped_column(Numeric(12, 2), default=0)

    # When the redemption occurred
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
