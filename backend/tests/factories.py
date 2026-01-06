"""
Test Data Factories using factory-boy and Faker.

Phase 1: Innate Immunity - The Immune System QA Architecture

Generates realistic test data for:
- Organization
- User
- Patient
"""

import uuid
from datetime import datetime, timedelta
from decimal import Decimal

import factory
from faker import Faker

from app.db.models import Organization, User, Patient, TierType

fake = Faker()


# =============================================================================
# Organization Factory
# =============================================================================


class OrganizationFactory(factory.Factory):
    """Factory for generating test Organizations."""

    class Meta:
        model = Organization

    id = factory.LazyFunction(uuid.uuid4)
    name = factory.LazyAttribute(lambda _: f"{fake.company()} Therapy")
    tier = TierType.BUILDER
    referral_code = factory.LazyAttribute(
        lambda _: f"KURA{fake.lexify(text='??????').upper()}"
    )
    karma_score = 0
    bonus_patient_slots = 0
    credits_earned = Decimal("0.00")
    ai_usage_cost_eur = Decimal("0.00")
    created_at = factory.LazyFunction(datetime.utcnow)
    is_active = True


# =============================================================================
# User Factory
# =============================================================================


class UserFactory(factory.Factory):
    """Factory for generating test Users (therapists)."""

    class Meta:
        model = User

    id = factory.LazyFunction(uuid.uuid4)
    email = factory.LazyAttribute(lambda _: fake.email())
    # This is NOT a valid bcrypt hash - tests should use proper hashing if needed
    hashed_password = "$2b$12$test_placeholder_hash_not_valid"
    full_name = factory.LazyAttribute(lambda _: fake.name())
    phone = factory.LazyAttribute(lambda _: fake.phone_number()[:20])
    website = factory.LazyAttribute(lambda _: fake.url())
    country = factory.LazyAttribute(lambda _: fake.country_code())
    city = factory.LazyAttribute(lambda _: fake.city())
    locale = "es"
    is_active = True
    is_superuser = False
    organization_id = None  # Must be set explicitly
    created_at = factory.LazyFunction(datetime.utcnow)

    @classmethod
    def build_with_org(cls, organization: Organization, **kwargs):
        """Create a user linked to an organization."""
        return cls.build(organization_id=organization.id, **kwargs)


# =============================================================================
# Patient Factory
# =============================================================================


class PatientFactory(factory.Factory):
    """Factory for generating test Patients with realistic PII."""

    class Meta:
        model = Patient

    id = factory.LazyFunction(uuid.uuid4)
    first_name = factory.LazyAttribute(lambda _: fake.first_name())
    last_name = factory.LazyAttribute(lambda _: fake.last_name())
    email = factory.LazyAttribute(lambda _: fake.email())
    phone = factory.LazyAttribute(lambda _: fake.phone_number()[:20])

    # Clinical fields
    notes = factory.LazyAttribute(
        lambda _: f"Initial consultation notes. {fake.paragraph()}"
    )
    tags = factory.LazyFunction(lambda: [])

    # Status
    is_active = True
    organization_id = None  # Must be set explicitly
    created_at = factory.LazyFunction(datetime.utcnow)

    @classmethod
    def build_with_org(cls, organization: Organization, **kwargs):
        """Create a patient linked to an organization."""
        return cls.build(organization_id=organization.id, **kwargs)

    @classmethod
    def build_batch_with_org(cls, size: int, organization: Organization, **kwargs):
        """Create multiple patients linked to an organization."""
        return [
            cls.build(organization_id=organization.id, **kwargs) for _ in range(size)
        ]


# =============================================================================
# Helper Functions
# =============================================================================


def create_test_org_with_users(
    num_users: int = 1,
    tier: TierType = TierType.BUILDER,
) -> tuple[Organization, list[User]]:
    """
    Create an organization with multiple users (for batch insert).
    Returns tuple of (org, [users]).
    """
    org = OrganizationFactory.build(tier=tier)
    users = [UserFactory.build_with_org(org) for _ in range(num_users)]
    return org, users


def create_test_org_with_patients(
    num_patients: int = 5,
    tier: TierType = TierType.BUILDER,
) -> tuple[Organization, User, list[Patient]]:
    """
    Create an organization with one user and multiple patients.
    Returns tuple of (org, user, [patients]).
    """
    org = OrganizationFactory.build(tier=tier)
    user = UserFactory.build_with_org(org)
    patients = PatientFactory.build_batch_with_org(num_patients, org)
    return org, user, patients
