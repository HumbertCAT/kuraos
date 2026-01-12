"""
PrivacyShield: Cloud DLP Wrapper for PII Sanitization
=====================================================
Layer 1 of Next-Gen Shield. Sanitizes PII before LLM inference.

Uses Google Cloud Sensitive Data Protection (Cloud DLP) to detect and
replace personally identifiable information with placeholders.

Usage:
    shield = PrivacyShield(project_id="kura-os-prod")
    result = await shield.sanitize_input("Me llamo Juan García y mi teléfono es 600123456")
    # result.sanitized_text = "Me llamo [PERSON_NAME] y mi teléfono es [PHONE_NUMBER]"
"""

import logging
from dataclasses import dataclass
from typing import List, Optional
import asyncio

logger = logging.getLogger(__name__)

# Singleton client instance
_dlp_client: Optional["DlpServiceClient"] = None


@dataclass
class SanitizedResult:
    """Result of PII sanitization."""

    sanitized_text: str
    findings_count: int
    original_length: int
    sanitized_length: int
    pii_types_found: List[str]


class PrivacyShield:
    """
    Cloud DLP wrapper for PII sanitization.

    Implements Singleton pattern for the DLP client to avoid
    connection overhead on each request.
    """

    # InfoTypes to detect (Spain-focused for clinical context)
    INFO_TYPES = [
        {"name": "PERSON_NAME"},
        {"name": "PHONE_NUMBER"},
        {"name": "EMAIL_ADDRESS"},
        {"name": "SPAIN_NIE_NUMBER"},
        {"name": "SPAIN_NIF_NUMBER"},
        {"name": "CREDIT_CARD_NUMBER"},
        {"name": "LOCATION"},
    ]

    def __init__(self, project_id: str):
        """
        Initialize PrivacyShield.

        Args:
            project_id: GCP project ID (e.g., "kura-os-prod")
        """
        self.project_id = project_id
        self.parent = f"projects/{project_id}"
        self._ensure_client()

    def _ensure_client(self):
        """Initialize DLP client as singleton."""
        global _dlp_client
        if _dlp_client is None:
            try:
                from google.cloud import dlp_v2

                _dlp_client = dlp_v2.DlpServiceClient()
                logger.info("[PrivacyShield] DLP client initialized (singleton)")
            except Exception as e:
                logger.error(f"[PrivacyShield] Failed to initialize DLP client: {e}")
                _dlp_client = None

    @property
    def client(self):
        """Get the singleton DLP client."""
        global _dlp_client
        return _dlp_client

    async def sanitize_input(self, text: str) -> SanitizedResult:
        """
        Sanitize PII in input text.

        Replaces detected PII with [INFO_TYPE] placeholders.

        Args:
            text: Raw text potentially containing PII

        Returns:
            SanitizedResult with sanitized text and detection metadata
        """
        if not text or not text.strip():
            return SanitizedResult(
                sanitized_text=text,
                findings_count=0,
                original_length=len(text) if text else 0,
                sanitized_length=len(text) if text else 0,
                pii_types_found=[],
            )

        # If client is not available, fail open with warning
        if self.client is None:
            logger.warning(
                "[PrivacyShield] DLP client unavailable - FAIL OPEN (text unmodified)"
            )
            return SanitizedResult(
                sanitized_text=text,
                findings_count=0,
                original_length=len(text),
                sanitized_length=len(text),
                pii_types_found=["DLP_UNAVAILABLE"],
            )

        try:
            # Run DLP in thread pool to avoid blocking
            result = await asyncio.get_event_loop().run_in_executor(
                None, self._deidentify_sync, text
            )
            return result
        except Exception as e:
            # Fail open: log critical alert but don't block clinical workflow
            logger.critical(f"[PrivacyShield] DLP FAILED - FAIL OPEN: {e}")
            return SanitizedResult(
                sanitized_text=text,
                findings_count=0,
                original_length=len(text),
                sanitized_length=len(text),
                pii_types_found=["DLP_ERROR"],
            )

    def _deidentify_sync(self, text: str) -> SanitizedResult:
        """
        Synchronous DLP call (runs in executor).

        Uses replace_with_info_type_config to mask PII with [TYPE] tags.
        """
        from google.cloud import dlp_v2

        inspect_config = {
            "info_types": self.INFO_TYPES,
            "min_likelihood": dlp_v2.Likelihood.POSSIBLE,
        }

        deidentify_config = {
            "info_type_transformations": {
                "transformations": [
                    {"primitive_transformation": {"replace_with_info_type_config": {}}}
                ]
            }
        }

        item = {"value": text}

        response = self.client.deidentify_content(
            request={
                "parent": self.parent,
                "deidentify_config": deidentify_config,
                "inspect_config": inspect_config,
                "item": item,
            }
        )

        # Extract PII types found
        pii_types = []
        findings_count = 0
        if response.overview and response.overview.transformation_summaries:
            for summary in response.overview.transformation_summaries:
                if summary.info_type:
                    pii_types.append(summary.info_type.name)
                    findings_count += summary.transformed_count

        sanitized_text = response.item.value

        return SanitizedResult(
            sanitized_text=sanitized_text,
            findings_count=findings_count,
            original_length=len(text),
            sanitized_length=len(sanitized_text),
            pii_types_found=pii_types,
        )
