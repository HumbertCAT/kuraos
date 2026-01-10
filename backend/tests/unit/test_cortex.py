"""
Unit tests for Kura Cortex v1.5 Privacy Engine and Context.

Tests:
- PrivacyResolver waterfall inheritance
- PatientEventContext Blackboard pattern
"""

import uuid
import pytest
from unittest.mock import MagicMock, AsyncMock

from app.db.models import PrivacyTier
from app.services.cortex.context import PatientEventContext
from app.services.cortex.privacy import PrivacyResolver, PipelineFinalizer


# ============ Fixtures ============


@pytest.fixture
def mock_patient():
    """Create a mock Patient with privacy_tier_override."""
    patient = MagicMock()
    patient.id = uuid.uuid4()
    patient.privacy_tier_override = None
    return patient


@pytest.fixture
def mock_organization():
    """Create a mock Organization with country_code and default_privacy_tier."""
    org = MagicMock()
    org.id = uuid.uuid4()
    org.country_code = "ES"
    org.default_privacy_tier = None
    return org


@pytest.fixture
def context(mock_patient, mock_organization):
    """Create a PatientEventContext for testing."""
    return PatientEventContext(
        patient_id=mock_patient.id,
        organization_id=mock_organization.id,
    )


# ============ PrivacyResolver Tests ============


class TestPrivacyResolver:
    """Tests for the privacy tier waterfall resolution."""

    def test_patient_override_takes_precedence(self, mock_patient, mock_organization):
        """Patient override should be highest priority."""
        mock_patient.privacy_tier_override = PrivacyTier.GHOST
        mock_organization.default_privacy_tier = PrivacyTier.LEGACY
        mock_organization.country_code = "US"

        result = PrivacyResolver.resolve(mock_patient, mock_organization)

        assert result == PrivacyTier.GHOST

    def test_org_default_when_no_patient_override(
        self, mock_patient, mock_organization
    ):
        """Org default should apply when patient has no override."""
        mock_patient.privacy_tier_override = None
        mock_organization.default_privacy_tier = PrivacyTier.LEGACY
        mock_organization.country_code = "ES"

        result = PrivacyResolver.resolve(mock_patient, mock_organization)

        assert result == PrivacyTier.LEGACY

    def test_country_default_spain(self, mock_patient, mock_organization):
        """Spain defaults to LEGACY per v1.5.9-hf1 (all countries use LEGACY)."""
        mock_patient.privacy_tier_override = None
        mock_organization.default_privacy_tier = None
        mock_organization.country_code = "ES"

        result = PrivacyResolver.resolve(mock_patient, mock_organization)

        # v1.5.9-hf1: Changed from STANDARD to LEGACY for all countries
        assert result == PrivacyTier.LEGACY

    def test_country_default_usa(self, mock_patient, mock_organization):
        """USA should default to LEGACY (BAA permits)."""
        mock_patient.privacy_tier_override = None
        mock_organization.default_privacy_tier = None
        mock_organization.country_code = "US"

        result = PrivacyResolver.resolve(mock_patient, mock_organization)

        assert result == PrivacyTier.LEGACY

    def test_country_default_germany(self, mock_patient, mock_organization):
        """Germany defaults to LEGACY per v1.5.9-hf1 (all countries use LEGACY)."""
        mock_patient.privacy_tier_override = None
        mock_organization.default_privacy_tier = None
        mock_organization.country_code = "DE"

        result = PrivacyResolver.resolve(mock_patient, mock_organization)

        # v1.5.9-hf1: Changed from STANDARD to LEGACY for all countries
        assert result == PrivacyTier.LEGACY

    def test_unknown_country_defaults_to_legacy(self, mock_patient, mock_organization):
        """Unknown countries default to LEGACY per v1.5.9-hf1."""
        mock_patient.privacy_tier_override = None
        mock_organization.default_privacy_tier = None
        mock_organization.country_code = "ZZ"  # Unknown

        result = PrivacyResolver.resolve(mock_patient, mock_organization)

        # v1.5.9-hf1: Changed from STANDARD to LEGACY for all countries
        assert result == PrivacyTier.LEGACY

    def test_explain_returns_detailed_info(self, mock_patient, mock_organization):
        """Explain should return complete resolution context."""
        mock_patient.privacy_tier_override = PrivacyTier.GHOST
        mock_organization.default_privacy_tier = PrivacyTier.STANDARD
        mock_organization.country_code = "US"

        result = PrivacyResolver.explain(mock_patient, mock_organization)

        assert result["resolved_tier"] == "GHOST"
        assert result["source"] == "patient_override"
        assert result["patient_override"] == "GHOST"
        assert result["org_default"] == "STANDARD"
        assert result["country_code"] == "US"
        assert result["country_default"] == "LEGACY"


# ============ PatientEventContext Tests ============


class TestPatientEventContext:
    """Tests for the Blackboard pattern context."""

    def test_add_and_get_evidence(self, context):
        """Should register and retrieve GCS URIs."""
        context.add_evidence("audio:session", "gs://kura-vault/audio/123.wav")

        assert context.get_evidence("audio:session") == "gs://kura-vault/audio/123.wav"
        assert context.get_evidence("nonexistent") is None

    def test_duplicate_evidence_raises(self, context):
        """Should prevent accidental overwrite of resources."""
        context.add_evidence("audio:session", "gs://kura-vault/audio/123.wav")

        with pytest.raises(ValueError, match="already registered"):
            context.add_evidence("audio:session", "gs://kura-vault/audio/456.wav")

    def test_update_evidence_allows_overwrite(self, context):
        """Update should allow explicit overwrite."""
        context.add_evidence("audio:session", "gs://kura-vault/audio/123.wav")
        context.update_evidence("audio:session", "gs://kura-vault/audio/456.wav")

        assert context.get_evidence("audio:session") == "gs://kura-vault/audio/456.wav"

    def test_list_resources_returns_copy(self, context):
        """List resources should return a copy (immutable)."""
        context.add_evidence("audio:session", "gs://kura-vault/audio/123.wav")

        resources = context.list_resources()
        resources["hacked"] = "bad_value"

        assert "hacked" not in context._resources

    def test_get_secure_payload_perception(self, context):
        """Perception role should get full access including URIs."""
        context.add_evidence("audio:session", "gs://kura-vault/audio/123.wav")
        context.resolved_tier = PrivacyTier.STANDARD

        payload = context.get_secure_payload("perception")

        assert "resources" in payload
        assert payload["resources"]["audio:session"] == "gs://kura-vault/audio/123.wav"
        assert payload["privacy_tier"] == "STANDARD"

    def test_get_secure_payload_application(self, context):
        """Application role should NOT see raw resource URIs."""
        context.add_evidence("audio:session", "gs://kura-vault/audio/123.wav")
        context.resolved_tier = PrivacyTier.STANDARD

        payload = context.get_secure_payload("application")

        assert "resources" not in payload
        assert "outputs" in payload
        assert payload["privacy_tier"] == "STANDARD"

    def test_add_and_get_output(self, context):
        """Should store and retrieve stage outputs."""
        context.add_output("transcribe", "transcript", "Hello world")
        context.add_output("transcribe", "duration_seconds", 300)
        context.add_output("analyze", "soap_note", {"subjective": "..."})

        assert context.get_output("transcribe", "transcript") == "Hello world"
        assert context.get_output("transcribe", "duration_seconds") == 300
        assert context.get_output("analyze", "soap_note") == {"subjective": "..."}
        assert context.get_output("unknown", "key", "default") == "default"


# ============ PipelineFinalizer Tests ============


class TestPipelineFinalizer:
    """Tests for privacy tier enforcement."""

    @pytest.mark.asyncio
    async def test_ghost_tier_deletes_all(self, context):
        """GHOST tier should delete all resources."""
        context.add_evidence("audio:session", "gs://kura-vault/audio/123.wav")
        context.add_evidence("transcript:raw", "gs://kura-vault/transcripts/123.txt")
        context.resolved_tier = PrivacyTier.GHOST
        context.outputs["transcribe"] = {"transcript": "Hello"}

        mock_gcs = AsyncMock()
        mock_gcs.delete = AsyncMock()

        finalizer = PipelineFinalizer()
        result = await finalizer.finalize(context, mock_gcs)

        assert len(result["deleted"]) == 2
        assert mock_gcs.delete.call_count == 2
        assert context.outputs["transcribe"] == {"redacted": True}

    @pytest.mark.asyncio
    async def test_standard_tier_deletes_audio_only(self, context):
        """STANDARD tier should delete audio but keep transcript."""
        context.add_evidence("audio:session", "gs://kura-vault/audio/123.wav")
        context.add_evidence("transcript:raw", "gs://kura-vault/transcripts/123.txt")
        context.resolved_tier = PrivacyTier.STANDARD

        mock_gcs = AsyncMock()
        mock_gcs.delete = AsyncMock()

        finalizer = PipelineFinalizer()
        result = await finalizer.finalize(context, mock_gcs)

        assert "audio:session" in result["deleted"]
        assert "transcript:raw" not in result["deleted"]
        assert mock_gcs.delete.call_count == 1

    @pytest.mark.asyncio
    async def test_legacy_tier_archives_audio(self, context):
        """LEGACY tier should archive audio to cold storage."""
        context.add_evidence("audio:session", "gs://kura-vault/audio/123.wav")
        context.resolved_tier = PrivacyTier.LEGACY

        mock_gcs = AsyncMock()
        mock_gcs.move_to_coldline = AsyncMock()

        finalizer = PipelineFinalizer()
        result = await finalizer.finalize(context, mock_gcs)

        assert "audio:session" in result["archived"]
        mock_gcs.move_to_coldline.assert_called_once()

    @pytest.mark.asyncio
    async def test_no_tier_skips_finalization(self, context):
        """Should skip if no tier is resolved."""
        context.resolved_tier = None

        mock_gcs = AsyncMock()

        finalizer = PipelineFinalizer()
        result = await finalizer.finalize(context, mock_gcs)

        assert result["skipped"] is True
