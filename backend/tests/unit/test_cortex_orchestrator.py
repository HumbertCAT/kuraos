"""
Unit tests for Cortex Orchestrator and Pipeline Steps.

Tests Phase 3 & 4 components:
- Step registry
- CortexOrchestrator
- Pipeline execution flow
"""

import uuid
import pytest
from unittest.mock import MagicMock, AsyncMock, patch

from app.db.models import PrivacyTier, AIPipelineConfig
from app.services.cortex.context import PatientEventContext
from app.services.cortex.orchestrator import CortexOrchestrator, PipelineExecutionError
from app.services.cortex.stages import get_step, list_steps, StepExecutionError
from app.services.cortex.steps.base import PipelineStep


# ============ Fixtures ============


@pytest.fixture
def mock_patient():
    """Create a mock Patient."""
    patient = MagicMock()
    patient.id = uuid.uuid4()
    patient.privacy_tier_override = None
    return patient


@pytest.fixture
def mock_organization():
    """Create a mock Organization."""
    org = MagicMock()
    org.id = uuid.uuid4()
    org.country_code = "ES"
    org.default_privacy_tier = None
    return org


@pytest.fixture
def mock_pipeline_config():
    """Create a mock AIPipelineConfig."""
    config = MagicMock(spec=AIPipelineConfig)
    config.name = "test_pipeline"
    config.input_modality = "TEXT"
    config.is_active = True
    config.privacy_tier_required = None
    config.stages = [{"step": "intake"}, {"step": "triage"}]
    return config


@pytest.fixture
def mock_db_session(mock_pipeline_config):
    """Create a mock database session."""
    session = AsyncMock()

    # Mock execute to return pipeline config
    result = MagicMock()
    result.scalar_one_or_none.return_value = mock_pipeline_config
    session.execute = AsyncMock(return_value=result)

    return session


# ============ Step Registry Tests ============


class TestStepRegistry:
    """Tests for step registration and factory."""

    def test_core_steps_are_registered(self):
        """Core steps should be auto-registered on import."""
        steps = list_steps()

        assert "transcribe" in steps
        assert "analyze" in steps
        assert "ocr" in steps
        assert "triage" in steps
        assert "intake" in steps

    def test_get_step_returns_instance(self):
        """get_step should return a PipelineStep instance."""
        step = get_step("triage")

        assert isinstance(step, PipelineStep)
        assert step.step_type == "triage"

    def test_get_unknown_step_raises(self):
        """get_step should raise for unknown types."""
        with pytest.raises(ValueError, match="Unknown step type"):
            get_step("nonexistent_step")


# ============ Step Execution Tests ============


class TestIntakeStep:
    """Tests for IntakeStep."""

    @pytest.mark.asyncio
    async def test_intake_processes_form_data(self):
        """IntakeStep should convert form data to text."""
        step = get_step("intake")
        context = PatientEventContext(
            patient_id=uuid.uuid4(), organization_id=uuid.uuid4()
        )

        # Add form data
        context.add_output(
            "input",
            "form_data",
            {
                "nombre": "Juan García",
                "motivo": "Ansiedad general",
                "medicación": "Ninguna",
            },
        )

        await step.execute(context)

        form_text = context.get_output("intake", "form_text")
        assert form_text is not None
        assert "Juan García" in form_text
        assert "Ansiedad" in form_text

    @pytest.mark.asyncio
    async def test_intake_without_data_raises(self):
        """IntakeStep should raise if no form data."""
        step = get_step("intake")
        context = PatientEventContext(
            patient_id=uuid.uuid4(), organization_id=uuid.uuid4()
        )

        with pytest.raises(StepExecutionError, match="No form data"):
            await step.execute(context)


class TestTriageStep:
    """Tests for TriageStep."""

    @pytest.mark.asyncio
    async def test_triage_without_content_returns_none(self):
        """TriageStep should return NONE if no content to assess."""
        step = get_step("triage")
        context = PatientEventContext(
            patient_id=uuid.uuid4(), organization_id=uuid.uuid4()
        )

        await step.execute(context)

        risk_level = context.get_output("triage", "risk_level")
        assert risk_level == "NONE"


# ============ Orchestrator Tests ============


class TestCortexOrchestrator:
    """Tests for CortexOrchestrator."""

    @pytest.mark.asyncio
    async def test_run_pipeline_basic_flow(
        self, mock_db_session, mock_patient, mock_organization, mock_pipeline_config
    ):
        """Orchestrator should execute pipeline stages."""
        orchestrator = CortexOrchestrator(mock_db_session)

        # Provide form data for intake step
        result = await orchestrator.run_pipeline(
            pipeline_name="test_pipeline",
            patient=mock_patient,
            organization=mock_organization,
            input_data={"test_field": "test_value"},
        )

        assert result["pipeline_name"] == "test_pipeline"
        assert result["privacy_tier"] == "LEGACY"  # v1.5.9-hf1: All countries default to LEGACY
        assert result["stages_executed"] == 2
        assert "outputs" in result
        assert "intake" in result["outputs"]
        assert "triage" in result["outputs"]

    @pytest.mark.asyncio
    async def test_resolves_privacy_tier(
        self, mock_db_session, mock_patient, mock_organization
    ):
        """Orchestrator should resolve privacy tier correctly."""
        # Set patient override
        mock_patient.privacy_tier_override = PrivacyTier.GHOST

        orchestrator = CortexOrchestrator(mock_db_session)

        result = await orchestrator.run_pipeline(
            pipeline_name="test_pipeline",
            patient=mock_patient,
            organization=mock_organization,
            input_data={"field": "value"},
        )

        assert result["privacy_tier"] == "GHOST"

    @pytest.mark.asyncio
    async def test_pipeline_not_found_raises(self, mock_patient, mock_organization):
        """Should raise if pipeline doesn't exist."""
        session = AsyncMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=result)

        orchestrator = CortexOrchestrator(session)

        with pytest.raises(PipelineExecutionError, match="not found"):
            await orchestrator.run_pipeline(
                pipeline_name="nonexistent",
                patient=mock_patient,
                organization=mock_organization,
            )

    @pytest.mark.asyncio
    async def test_disabled_pipeline_raises(
        self, mock_db_session, mock_patient, mock_organization, mock_pipeline_config
    ):
        """Should raise if pipeline is disabled."""
        mock_pipeline_config.is_active = False

        orchestrator = CortexOrchestrator(mock_db_session)

        with pytest.raises(PipelineExecutionError, match="disabled"):
            await orchestrator.run_pipeline(
                pipeline_name="test_pipeline",
                patient=mock_patient,
                organization=mock_organization,
            )

    @pytest.mark.asyncio
    async def test_privacy_tier_requirement_enforced(
        self, mock_db_session, mock_patient, mock_organization, mock_pipeline_config
    ):
        """Should enforce pipeline privacy tier requirements."""
        # Pipeline requires GHOST but patient has LEGACY
        mock_pipeline_config.privacy_tier_required = PrivacyTier.GHOST
        mock_patient.privacy_tier_override = PrivacyTier.LEGACY

        orchestrator = CortexOrchestrator(mock_db_session)

        with pytest.raises(PipelineExecutionError, match="requires GHOST tier"):
            await orchestrator.run_pipeline(
                pipeline_name="test_pipeline",
                patient=mock_patient,
                organization=mock_organization,
                input_data={"field": "value"},
            )
