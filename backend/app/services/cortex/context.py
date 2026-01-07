"""
PatientEventContext - The Blackboard Pattern

A pass-by-reference context container for pipeline execution.

HIPAA Compliance:
- Heavy data (audio bytes) never leaves GCS
- Only URIs are passed through the pipeline
- The AI (under BAA) accesses raw data directly
- Application code only sees references and outputs
"""

import uuid
from dataclasses import dataclass, field
from typing import Optional, Dict, Any

from app.db.models import PrivacyTier


@dataclass
class PatientEventContext:
    """
    State container for a single cognitive pipeline execution.

    Implements the "Blackboard" pattern where pipeline stages
    write their outputs to a shared context object.

    Security Model:
    - Resources are stored as GCS URIs, not raw bytes
    - get_secure_payload() filters data based on requester role
    - resolved_tier determines post-processing behavior

    Usage:
        context = PatientEventContext(
            patient_id=patient.id,
            organization_id=org.id
        )
        context.add_evidence("audio:session", "gs://kura-vault/audio/123.wav")

        # Perception layer (AI under BAA) gets full access
        ai_payload = context.get_secure_payload("perception")

        # Application layer gets sanitized outputs only
        app_payload = context.get_secure_payload("application")
    """

    # Identity
    patient_id: uuid.UUID
    organization_id: uuid.UUID

    # Optional clinical entry reference
    clinical_entry_id: Optional[uuid.UUID] = None

    # Resource registry: key → GCS URI
    # Keys follow convention: "{type}:{name}" (e.g., "audio:session", "transcript:raw")
    _resources: Dict[str, str] = field(default_factory=dict)

    # Resolved privacy tier (computed at pipeline start via PrivacyResolver)
    resolved_tier: Optional[PrivacyTier] = None

    # Pipeline outputs (accumulated during execution)
    # Each stage writes its outputs here
    outputs: Dict[str, Any] = field(default_factory=dict)

    # Execution metadata
    pipeline_name: Optional[str] = None
    started_at: Optional[str] = None

    def add_evidence(self, key: str, gcs_uri: str) -> None:
        """
        Register a GCS resource for pipeline access.

        Args:
            key: Resource identifier (e.g., "audio:session", "document:intake")
            gcs_uri: Full GCS path (e.g., "gs://kura-vault/audio/123.wav")

        Raises:
            ValueError: If key already exists (prevents accidental overwrite)
        """
        if key in self._resources:
            raise ValueError(
                f"Resource '{key}' already registered. Use update_evidence() to overwrite."
            )
        self._resources[key] = gcs_uri

    def update_evidence(self, key: str, gcs_uri: str) -> None:
        """Update an existing resource reference."""
        self._resources[key] = gcs_uri

    def get_evidence(self, key: str) -> Optional[str]:
        """Get a resource URI by key."""
        return self._resources.get(key)

    def list_resources(self) -> Dict[str, str]:
        """Get all registered resource URIs."""
        return self._resources.copy()

    def get_secure_payload(self, role: str) -> Dict[str, Any]:
        """
        Get payload appropriate for the requester's role.

        Args:
            role: One of:
                - "perception": Full access to raw URIs (Gemini under BAA)
                - "application": Sanitized outputs only (no raw data)

        Returns:
            Dict with accessible data for the role
        """
        if role == "perception":
            # AI under BAA gets everything
            return {
                "patient_id": str(self.patient_id),
                "organization_id": str(self.organization_id),
                "clinical_entry_id": str(self.clinical_entry_id)
                if self.clinical_entry_id
                else None,
                "resources": self._resources,
                "outputs": self.outputs,
                "privacy_tier": self.resolved_tier.value
                if self.resolved_tier
                else None,
            }

        # Application layer: no raw resource URIs
        return {
            "patient_id": str(self.patient_id),
            "organization_id": str(self.organization_id),
            "clinical_entry_id": str(self.clinical_entry_id)
            if self.clinical_entry_id
            else None,
            "outputs": self.outputs,
            "privacy_tier": self.resolved_tier.value if self.resolved_tier else None,
        }

    def add_output(self, stage: str, key: str, value: Any) -> None:
        """
        Add output from a pipeline stage.

        Args:
            stage: Stage identifier (e.g., "transcribe", "analyze")
            key: Output key (e.g., "transcript", "soap_note")
            value: Output value
        """
        if stage not in self.outputs:
            self.outputs[stage] = {}
        self.outputs[stage][key] = value

    def get_output(self, stage: str, key: str, default: Any = None) -> Any:
        """Get output from a specific stage."""
        return self.outputs.get(stage, {}).get(key, default)
