"""
Pricing API Endpoints (v1.4.14)

Admin endpoints for AI model pricing:
- GET /admin/ai-governance/pricing - Current pricing
- POST /admin/ai-governance/pricing/refresh - Force refresh from GCP
"""

from typing import Dict
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import CurrentSuperAdmin
from app.services.pricing_auditor import (
    get_cached_pricing,
    refresh_pricing_from_gcp,
    get_pricing_status,
    is_cache_stale,
)


router = APIRouter(prefix="/admin/ai-governance", tags=["admin-ai-governance"])


# =============================================================================
# DTOs
# =============================================================================


class ModelPrice(BaseModel):
    """Price for a single model."""

    model_id: str
    cost_input: float  # Per 1M tokens
    cost_output: float  # Per 1M tokens


class PricingResponse(BaseModel):
    """Response with all model prices."""

    prices: list[ModelPrice]
    cache_timestamp: str | None
    is_stale: bool


class RefreshResponse(BaseModel):
    """Response after refresh attempt."""

    success: bool
    updated_models: int
    message: str


# =============================================================================
# Endpoints
# =============================================================================


@router.get("/pricing", response_model=PricingResponse)
async def get_pricing(current_user: CurrentSuperAdmin):
    """
    Get current AI model pricing.

    Returns cached pricing (from GCP Billing or defaults).
    """
    pricing = get_cached_pricing()
    status = get_pricing_status()

    prices = [
        ModelPrice(
            model_id=model_id,
            cost_input=float(prices.get("input", 0)),
            cost_output=float(prices.get("output", 0)),
        )
        for model_id, prices in pricing.items()
    ]

    return PricingResponse(
        prices=prices,
        cache_timestamp=status["cache_timestamp"],
        is_stale=status["is_stale"],
    )


@router.post("/pricing/refresh", response_model=RefreshResponse)
async def refresh_pricing(current_user: CurrentSuperAdmin):
    """
    Force refresh pricing from Google Cloud Billing API.

    Requires: roles/billing.viewer on the service account.
    """
    try:
        updated_pricing = await refresh_pricing_from_gcp()

        return RefreshResponse(
            success=True,
            updated_models=len(updated_pricing),
            message="Pricing refreshed successfully from GCP Billing API.",
        )
    except Exception as e:
        return RefreshResponse(
            success=False,
            updated_models=0,
            message=f"Failed to refresh pricing: {str(e)}",
        )
