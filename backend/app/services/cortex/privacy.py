"""
Privacy Engine - Waterfall Resolution & Pipeline Finalization

Kura Cortex v1.5

Implements the privacy tier inheritance waterfall:
1. Patient Override (if set)
2. Organization Default (if set)
3. Country-based Default (GDPR regions → STANDARD, US → LEGACY)

Also provides the PipelineFinalizer that enforces data retention
policies after pipeline execution.
"""

import logging
from typing import TYPE_CHECKING

from app.db.models import PrivacyTier

if TYPE_CHECKING:
    from app.db.models import Patient, Organization
    from app.services.cortex.context import PatientEventContext
    from app.services.storage import GCSService

logger = logging.getLogger(__name__)


class PrivacyResolver:
    """
    Waterfall resolver for privacy tier inheritance.

    Resolution Order:
    1. Patient.privacy_tier_override (highest priority)
    2. Organization.default_privacy_tier
    3. Country-based default (derived from Organization.country_code)

    Country Defaults (based on data protection regimes):
    - EU/EEA countries: STANDARD (GDPR - right to erasure)
    - US: LEGACY (BAA permits retention for AI training)
    - Unknown: STANDARD (conservative default)
    """

    # Country code → Default privacy tier
    # GDPR countries default to STANDARD (deletion)
    # US defaults to LEGACY (archival under BAA)
    COUNTRY_DEFAULTS = {
        # EU/EEA - GDPR
        "ES": PrivacyTier.STANDARD,  # Spain
        "DE": PrivacyTier.STANDARD,  # Germany
        "FR": PrivacyTier.STANDARD,  # France
        "IT": PrivacyTier.STANDARD,  # Italy
        "PT": PrivacyTier.STANDARD,  # Portugal
        "NL": PrivacyTier.STANDARD,  # Netherlands
        "BE": PrivacyTier.STANDARD,  # Belgium
        "AT": PrivacyTier.STANDARD,  # Austria
        "CH": PrivacyTier.STANDARD,  # Switzerland (adequate)
        "GB": PrivacyTier.STANDARD,  # UK (post-Brexit adequate)
        "IE": PrivacyTier.STANDARD,  # Ireland
        "SE": PrivacyTier.STANDARD,  # Sweden
        "NO": PrivacyTier.STANDARD,  # Norway (EEA)
        "DK": PrivacyTier.STANDARD,  # Denmark
        "FI": PrivacyTier.STANDARD,  # Finland
        "PL": PrivacyTier.STANDARD,  # Poland
        "GR": PrivacyTier.STANDARD,  # Greece
        # Americas
        "US": PrivacyTier.LEGACY,  # USA - BAA permits
        "CA": PrivacyTier.STANDARD,  # Canada - PIPEDA
        "MX": PrivacyTier.STANDARD,  # Mexico
        "AR": PrivacyTier.STANDARD,  # Argentina
        "CL": PrivacyTier.STANDARD,  # Chile
        "CO": PrivacyTier.STANDARD,  # Colombia
        "BR": PrivacyTier.STANDARD,  # Brazil - LGPD
        # LATAM (Spanish-speaking markets)
        "PE": PrivacyTier.STANDARD,  # Peru
        "EC": PrivacyTier.STANDARD,  # Ecuador
        "UY": PrivacyTier.STANDARD,  # Uruguay
        "CR": PrivacyTier.STANDARD,  # Costa Rica
    }

    # Fallback for unknown countries
    DEFAULT_TIER = PrivacyTier.STANDARD

    @classmethod
    def resolve(cls, patient: "Patient", organization: "Organization") -> PrivacyTier:
        """
        Resolve the effective privacy tier for a patient.

        Args:
            patient: Patient record (may have privacy_tier_override)
            organization: Organization record (has country_code and default_privacy_tier)

        Returns:
            PrivacyTier: The resolved tier to apply
        """
        # Level 1: Patient override (highest priority)
        if patient.privacy_tier_override is not None:
            logger.debug(
                f"Privacy tier for patient {patient.id}: "
                f"{patient.privacy_tier_override.value} (patient override)"
            )
            return patient.privacy_tier_override

        # Level 2: Organization default
        if organization.default_privacy_tier is not None:
            logger.debug(
                f"Privacy tier for patient {patient.id}: "
                f"{organization.default_privacy_tier.value} (org default)"
            )
            return organization.default_privacy_tier

        # Level 3: Country-based default
        country = getattr(organization, "country_code", None) or "ES"
        tier = cls.COUNTRY_DEFAULTS.get(country.upper(), cls.DEFAULT_TIER)
        logger.debug(
            f"Privacy tier for patient {patient.id}: {tier.value} (country: {country})"
        )
        return tier

    @classmethod
    def explain(cls, patient: "Patient", organization: "Organization") -> dict:
        """
        Get a detailed explanation of how the tier was resolved.
        Useful for audit logs and UI display.
        """
        result = {
            "resolved_tier": None,
            "source": None,
            "patient_override": patient.privacy_tier_override.value
            if patient.privacy_tier_override
            else None,
            "org_default": organization.default_privacy_tier.value
            if organization.default_privacy_tier
            else None,
            "country_code": getattr(organization, "country_code", None),
            "country_default": None,
        }

        # Determine country default
        country = result["country_code"] or "ES"
        result["country_default"] = cls.COUNTRY_DEFAULTS.get(
            country.upper(), cls.DEFAULT_TIER
        ).value

        # Resolve
        if patient.privacy_tier_override:
            result["resolved_tier"] = patient.privacy_tier_override.value
            result["source"] = "patient_override"
        elif organization.default_privacy_tier:
            result["resolved_tier"] = organization.default_privacy_tier.value
            result["source"] = "org_default"
        else:
            result["resolved_tier"] = result["country_default"]
            result["source"] = "country_default"

        return result


class PipelineFinalizer:
    """
    Post-processing hook that enforces privacy tier data retention.

    Runs after pipeline stages complete to clean up resources:
    - GHOST: Delete raw audio AND transcript (keep summary only)
    - STANDARD: Delete raw audio, keep transcript
    - LEGACY: Archive raw audio to cold storage

    Cold Storage:
    - Uses separate bucket: gs://kura-vault-archive
    - Restricted IAM: write-only for app, read requires admin role
    """

    # Resource keys that contain raw audio
    AUDIO_KEYS = ["audio:session", "audio:raw", "audio:upload"]

    # Resource keys that contain transcripts
    TRANSCRIPT_KEYS = ["transcript:raw", "transcript:full"]

    async def finalize(
        self, context: "PatientEventContext", gcs_service: "GCSService"
    ) -> dict:
        """
        Apply privacy tier retention rules to pipeline resources.

        Args:
            context: Pipeline execution context with resources
            gcs_service: GCS service for file operations

        Returns:
            dict: Summary of actions taken
        """
        tier = context.resolved_tier
        if tier is None:
            logger.warning(
                f"No privacy tier resolved for context, skipping finalization"
            )
            return {"skipped": True, "reason": "no_tier_resolved"}

        actions = {
            "tier": tier.value,
            "deleted": [],
            "archived": [],
            "errors": [],
        }

        resources = context.list_resources()

        if tier == PrivacyTier.GHOST:
            # Maximum privacy: delete everything except summary
            for key, uri in resources.items():
                try:
                    await gcs_service.delete(uri)
                    actions["deleted"].append(key)
                    logger.info(f"GHOST: Deleted {key} ({uri})")
                except Exception as e:
                    actions["errors"].append({"key": key, "error": str(e)})
                    logger.error(f"GHOST: Failed to delete {key}: {e}")

            # Also remove transcript from outputs
            if "transcribe" in context.outputs:
                context.outputs["transcribe"] = {"redacted": True}

        elif tier == PrivacyTier.STANDARD:
            # GDPR default: delete raw audio, keep transcript
            for key, uri in resources.items():
                if any(k in key for k in self.AUDIO_KEYS):
                    try:
                        await gcs_service.delete(uri)
                        actions["deleted"].append(key)
                        logger.info(f"STANDARD: Deleted audio {key} ({uri})")
                    except Exception as e:
                        actions["errors"].append({"key": key, "error": str(e)})
                        logger.error(f"STANDARD: Failed to delete {key}: {e}")

        elif tier == PrivacyTier.LEGACY:
            # Archive raw audio to cold storage (BAA-covered)
            for key, uri in resources.items():
                if any(k in key for k in self.AUDIO_KEYS):
                    try:
                        await gcs_service.move_to_coldline(uri)
                        actions["archived"].append(key)
                        logger.info(f"LEGACY: Archived {key} to cold storage")
                    except Exception as e:
                        actions["errors"].append({"key": key, "error": str(e)})
                        logger.error(f"LEGACY: Failed to archive {key}: {e}")

        return actions
