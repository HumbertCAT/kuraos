"""
Connect Service - CRM & Leads Intelligence
Trinity Architecture: ATRAER (Connect)

This service manages the lifecycle of Leads and their intelligent profiling
using the Cortex sales_profiling pipeline.
"""

import json
import logging
from typing import Optional, Dict, Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import Lead, LeadStatus, Organization
from app.services.ai.render import get_system_prompt
from app.services.ai.factory import ProviderFactory

logger = logging.getLogger(__name__)


class ConnectService:
    """
    Facade for the CONNECT domain.
    Handles lead qualification, Sherlock Scores, and Shadow Profiles.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def profile_lead(self, lead_id: UUID) -> Dict[str, Any]:
        """
        Execute the sales_profiling pipeline for a lead.
        Calculates the Sherlock Score (R.N.A.V.) and generates a Shadow Profile.

        The total_score is calculated in Python to ensure precision as requested
        by the Architect (v1.6).
        """
        # 1. Get Lead data
        query = select(Lead).where(Lead.id == lead_id)
        result = await self.db.execute(query)
        lead = result.scalar_one_or_none()

        if not lead:
            logger.error(f"Lead {lead_id} not found for profiling")
            return {"success": False, "error": "Lead not found"}

        # 2. Prepare Context for Cortex
        context = {
            "lead_name": f"{lead.first_name} {lead.last_name}",
            "message": lead.notes or "No initial message provided.",
            "form_data": lead.form_data or {},
            "context": f"Source: {lead.source}",
        }

        # 3. Get System Prompt & AI Provider
        # Using Gemini 2.5 Flash as the default sales concierge
        system_instruction = get_system_prompt("sales_profiling", context)
        provider = ProviderFactory.get_provider(
            "gemini:2.5-flash", system_instruction=system_instruction
        )

        try:
            # 4. Run AI Analysis
            # We pass an empty prompt because the instructions are in the system prompt
            response = await provider.analyze_multimodal(
                prompt="Analiza este lead según tus instrucciones de sistema.",
                content=None,
            )

            # 5. Parse JSON Result
            raw_text = response.get("text", "{}")
            # Clean possible markdown artifacts
            if "```json" in raw_text:
                raw_text = raw_text.split("```json")[1].split("```")[0]

            analysis = json.loads(raw_text.strip())

            # 6. CALCULATE TOTAL SCORE (Python Side - Architect's Protocol)
            metrics = analysis.get("sherlock_metrics", {})
            r = metrics.get("r", 50)
            n = metrics.get("n", 50)
            a = metrics.get("a", 50)
            v = metrics.get("v", 50)

            total_score = round((r + n + a + v) / 4)
            metrics["total_score"] = total_score

            # 7. Update Lead Record
            lead.sherlock_metrics = metrics
            lead.shadow_profile = analysis.get("shadow_profile", {})

            await self.db.commit()
            await self.db.refresh(lead)

            logger.info(
                f"✅ Lead {lead_id} profiled successfully. Score: {total_score}"
            )
            return {"success": True, "total_score": total_score}

        except Exception as e:
            logger.error(f"❌ Error profiling lead {lead_id}: {e}")
            import traceback

            traceback.print_exc()
            return {"success": False, "error": str(e)}
