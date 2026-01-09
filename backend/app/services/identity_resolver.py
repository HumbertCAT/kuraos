"""Identity Resolver Service - The Matchmaker (GEM v1).

Universal contact deduplication across Lead/Patient/Follower domains.
Implements GEM's constitution: robust E.164 normalization, Patient > Lead hierarchy.

v1.6.4: Phase 1 - Robust normalization with phonenumbers library
v2.0: Phase 2 - Fuzzy matching and merge support
"""

import logging
import uuid
from typing import Optional

import phonenumbers
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.db.models import Identity

logger = logging.getLogger(__name__)


class IdentityResolver:
    """The Identity Brain - Universal contact deduplication.

    GEM's Constitution:
    1. Aggressive normalization (NEVER compare raw strings)
    2. Patient data > Lead data (clinical wins over marketing)
    3. E.164 phone format (phonenumbers library)
    4. Atomic operations (rely on DB IntegrityError)

    Waterfall Logic:
    1. Normalize email/phone
    2. Search by email (exact match)
    3. Search by phone (E.164 match)
    4. Enrich if found (add missing data)
    5. Create new if not found

    Usage:
        resolver = IdentityResolver(db, organization_id)
        identity = await resolver.resolve_identity(
            email="john@example.com",
            phone="600123456",
            name="John Doe",
            source="public_booking"
        )
    """

    def __init__(self, db: AsyncSession, organization_id: uuid.UUID):
        """Initialize resolver with database session and organization context."""
        self.db = db
        self.organization_id = organization_id

    @staticmethod
    def normalize_email(email: Optional[str]) -> Optional[str]:
        """Normalize email: trim + lowercase.

        GEM Rule: NEVER compare raw email strings.

        Args:
            email: Raw email string

        Returns:
            Normalized email or None

        Examples:
            >>> IdentityResolver.normalize_email("  John@Example.COM  ")
            'john@example.com'
        """
        if not email:
            return None
        return email.strip().lower()

    @staticmethod
    def normalize_phone(
        phone: Optional[str], default_region: str = "ES"
    ) -> Optional[str]:
        """Normalize phone to E.164 format using phonenumbers library.

        GEM Rule: STRICT E.164 format. Invalid numbers = None (log warning).

        Rules:
        - Parse with default region (Spain by default)
        - Validate number
        - Return E.164 format (+34600123456)
        - Invalid → None + warning logged

        Args:
            phone: Raw phone string
            default_region: ISO 3166-1 alpha-2 country code (default: "ES")

        Returns:
            E.164 formatted phone or None

        Examples:
            >>> IdentityResolver.normalize_phone("600 123 456", "ES")
            '+34600123456'
            >>> IdentityResolver.normalize_phone("+1 (555) 123-4567", "US")
            '+15551234567'
            >>> IdentityResolver.normalize_phone("invalid")
            None
        """
        if not phone:
            return None

        try:
            # Parse with default region
            parsed = phonenumbers.parse(phone, default_region)

            # Validate
            if not phonenumbers.is_valid_number(parsed):
                logger.warning(f"Invalid phone number: {phone}")
                return None

            # Format as E.164 for global matching
            return phonenumbers.format_number(
                parsed, phonenumbers.PhoneNumberFormat.E164
            )

        except phonenumbers.NumberParseException as e:
            logger.warning(f"Phone parse error for '{phone}': {e}")
            return None

    async def resolve_identity(
        self,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        name: Optional[str] = None,
        source: str = "unknown",
        metadata: Optional[dict] = None,
    ) -> Identity:
        """The Waterfall: Find or create identity (GEM Algorithm).

        Search priority:
        1. Email match (normalized)
        2. Phone match (E.164)
        3. Create new

        If found, enriches missing fields following hierarchy:
        - Patient data > Lead data (clinical wins)

        Args:
            email: Contact email
            phone: Contact phone
            name: Contact name (for logging/debugging)
            source: Source of contact ("public_booking", "lead_form", "manual")
            metadata: Optional metadata to attach

        Returns:
            Identity object (existing or newly created)

        Raises:
            ValueError: If both email and phone are None
        """
        norm_email = self.normalize_email(email)
        norm_phone = self.normalize_phone(phone)

        if not norm_email and not norm_phone:
            raise ValueError(
                f"Cannot resolve identity for '{name}': both email and phone are None/invalid"
            )

        # Step 1: Search for existing identity
        query = select(Identity).where(
            Identity.organization_id == self.organization_id,
            Identity.is_merged == False,  # Skip merged/archived identities
        )

        # Build OR conditions for matching
        conditions = []
        if norm_email:
            conditions.append(Identity.primary_email == norm_email)
        if norm_phone:
            conditions.append(Identity.primary_phone == norm_phone)

        if conditions:
            query = query.where(or_(*conditions))
            result = await self.db.execute(query)
            existing = result.scalar_one_or_none()

            if existing:
                logger.info(
                    f"Identity match found: {existing.id} for {name} "
                    f"(source: {source}, email: {norm_email}, phone: {norm_phone})"
                )

                # Enrich missing fields (GEM: Patient data always wins)
                # For now, simple enrichment (Phase 1)
                # Phase 2 will implement hierarchy checking
                updated = False
                if norm_email and not existing.primary_email:
                    existing.primary_email = norm_email
                    updated = True
                if norm_phone and not existing.primary_phone:
                    existing.primary_phone = norm_phone
                    updated = True

                if updated:
                    logger.info(
                        f"Enriched identity {existing.id} with missing contact data"
                    )
                    await self.db.flush()

                return existing

        # Step 2: Create new identity
        logger.info(
            f"Creating new identity for {name} "
            f"(source: {source}, email: {norm_email}, phone: {norm_phone})"
        )

        try:
            new_identity = Identity(
                organization_id=self.organization_id,
                primary_email=norm_email,
                primary_phone=norm_phone,
            )
            self.db.add(new_identity)
            await self.db.flush()

            logger.info(f"New identity created: {new_identity.id}")
            return new_identity

        except IntegrityError as e:
            # Race condition: Someone created it between our check and insert
            # Rollback and retry
            logger.warning(f"IntegrityError creating identity, retrying: {e}")
            await self.db.rollback()

            # Retry search
            result = await self.db.execute(query)
            existing = result.scalar_one_or_none()

            if existing:
                return existing

            # Still not found? Re-raise
            raise

    async def find_by_phone_global(self, phone: str) -> Optional[Identity]:
        """Find identity by phone across ALL organizations (webhook use case).

        v1.6.6: Used by Meta webhook to find patient context for incoming messages.
        This bypasses the organization_id filter for global lookup.

        Args:
            phone: Phone number (raw or E.164 format)

        Returns:
            Identity if found, None otherwise

        Note:
            Returns the first match found. In multi-tenant scenarios where
            the same phone exists in multiple orgs, this returns the oldest.
        """
        norm_phone = self.normalize_phone(phone)

        if not norm_phone:
            logger.warning(f"Invalid phone for global lookup: {phone}")
            return None

        result = await self.db.execute(
            select(Identity)
            .where(
                Identity.primary_phone == norm_phone,
                Identity.is_merged == False,
            )
            .order_by(Identity.created_at)  # Return oldest (first created)
            .limit(1)
        )
        identity = result.scalar_one_or_none()

        if identity:
            logger.info(
                f"Global phone lookup: found Identity[{identity.id}] "
                f"in Org[{identity.organization_id}] for {norm_phone}"
            )
        else:
            logger.info(f"Global phone lookup: no identity found for {norm_phone}")

        return identity

    async def get_unified_timeline(self, identity_id: uuid.UUID) -> dict:
        """Get 360° contact view: all interactions across domains.

        Returns all Leads and Patients linked to this identity,
        sorted by creation date for unified timeline.

        Args:
            identity_id: UUID of the identity

        Returns:
            Dict with leads, patients lists, and counts

        Example:
            {
                "identity_id": "uuid-...",
                "leads": [...],
                "patients": [...],
                "total_interactions": 5,
                "first_contact": "2026-01-01T00:00:00Z",
                "last_activity": "2026-01-08T12:00:00Z"
            }
        """
        from app.db.models import Lead, Patient

        # Get all leads
        leads_result = await self.db.execute(
            select(Lead)
            .where(Lead.identity_id == identity_id)
            .order_by(Lead.created_at)
        )
        leads = list(leads_result.scalars().all())

        # Get all patients
        patients_result = await self.db.execute(
            select(Patient)
            .where(Patient.identity_id == identity_id)
            .order_by(Patient.created_at)
        )
        patients = list(patients_result.scalars().all())

        # Calculate timeline metadata
        all_dates = [lead.created_at for lead in leads] + [
            patient.created_at for patient in patients
        ]

        return {
            "identity_id": str(identity_id),
            "leads": leads,
            "patients": patients,
            "total_interactions": len(leads) + len(patients),
            "first_contact": min(all_dates).isoformat() if all_dates else None,
            "last_activity": max(all_dates).isoformat() if all_dates else None,
        }
