"""
Unit tests for Cortex Strangler Switch and Adapter.

Tests the traffic routing logic for gradual Cortex migration.
"""

import pytest
import uuid

from app.services.cortex.switch import (
    CortexSwitch,
    SwitchState,
    SwitchConfig,
    should_use_cortex,
)
from app.services.cortex.adapter import AnalysisResult


class TestCortexSwitch:
    """Tests for CortexSwitch routing logic."""

    def setup_method(self):
        """Reset switch state before each test."""
        CortexSwitch._config = SwitchConfig()
        CortexSwitch._task_configs = {}

    @pytest.mark.asyncio
    async def test_off_returns_false(self):
        """OFF state always returns False."""
        CortexSwitch.set_state(SwitchState.OFF)

        result = await should_use_cortex(str(uuid.uuid4()), "audio_synthesis")

        assert result is False

    @pytest.mark.asyncio
    async def test_full_returns_true(self):
        """FULL state always returns True."""
        CortexSwitch.set_state(SwitchState.FULL)

        result = await should_use_cortex(str(uuid.uuid4()), "audio_synthesis")

        assert result is True

    @pytest.mark.asyncio
    async def test_shadow_returns_false_but_logs(self):
        """SHADOW state returns False (legacy) but logs the intent."""
        CortexSwitch.set_state(SwitchState.SHADOW)

        result = await should_use_cortex(str(uuid.uuid4()), "clinical_analysis")

        assert result is False

    @pytest.mark.asyncio
    async def test_canary_percentage_zero_returns_false(self):
        """CANARY with 0% always returns False."""
        CortexSwitch.set_state(SwitchState.CANARY, percentage=0)

        result = await should_use_cortex(str(uuid.uuid4()), "audio_synthesis")

        assert result is False

    @pytest.mark.asyncio
    async def test_canary_percentage_hundred_returns_true(self):
        """CANARY with 100% always returns True."""
        CortexSwitch.set_state(SwitchState.CANARY, percentage=100)

        result = await should_use_cortex(str(uuid.uuid4()), "audio_synthesis")

        assert result is True

    @pytest.mark.asyncio
    async def test_allowlist_overrides_off_state(self):
        """Allowlisted orgs use Cortex even when global state is OFF."""
        CortexSwitch.set_state(SwitchState.OFF)

        org_id = str(uuid.uuid4())
        CortexSwitch.add_to_allowlist(org_id)

        result = await should_use_cortex(org_id, "audio_synthesis")

        assert result is True

    @pytest.mark.asyncio
    async def test_blocklist_overrides_full_state(self):
        """Blocklisted orgs use legacy even when global state is FULL."""
        CortexSwitch.set_state(SwitchState.FULL)

        org_id = str(uuid.uuid4())
        CortexSwitch._config.org_blocklist.append(org_id)

        result = await should_use_cortex(org_id, "audio_synthesis")

        assert result is False

    @pytest.mark.asyncio
    async def test_task_specific_override(self):
        """Task-specific config overrides global config."""
        CortexSwitch.set_state(SwitchState.OFF)  # Global OFF
        CortexSwitch.set_task_state("document_analysis", SwitchState.FULL)

        # Audio should use legacy (global OFF)
        audio_result = await should_use_cortex(str(uuid.uuid4()), "audio_synthesis")

        # Document should use Cortex (task override)
        doc_result = await should_use_cortex(str(uuid.uuid4()), "document_analysis")

        assert audio_result is False
        assert doc_result is True

    def test_get_status_returns_config(self):
        """get_status returns current configuration."""
        CortexSwitch.set_state(SwitchState.CANARY, percentage=25)
        CortexSwitch.set_task_state("ocr", SwitchState.FULL)

        status = CortexSwitch.get_status()

        assert status["global"]["state"] == "canary"
        assert status["global"]["percentage"] == 25
        assert "ocr" in status["task_overrides"]
        assert status["task_overrides"]["ocr"]["state"] == "full"


class TestAnalysisResult:
    """Tests for AnalysisResult dataclass."""

    def test_creates_with_defaults(self):
        """AnalysisResult initializes with defaults."""
        result = AnalysisResult(
            text="Analysis text",
            model_id="gemini:2.5-flash",
            provider_id="vertex",
            tokens_input=100,
            tokens_output=50,
            pipeline="legacy",
        )

        assert result.text == "Analysis text"
        assert result.pipeline == "legacy"
        assert result.metadata == {}

    def test_includes_metadata(self):
        """AnalysisResult can include metadata."""
        result = AnalysisResult(
            text="Analysis text",
            model_id="cortex:session_analysis",
            provider_id="cortex",
            tokens_input=0,
            tokens_output=0,
            pipeline="cortex",
            metadata={"pipeline_name": "session_analysis"},
        )

        assert result.metadata["pipeline_name"] == "session_analysis"
