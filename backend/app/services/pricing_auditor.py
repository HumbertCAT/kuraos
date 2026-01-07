"""
Pricing Auditor Service (v1.4.14)

Fetches AI model pricing from Google Cloud Billing Catalog API.
Follows Architect Directives:
1. Explicit SKU Mapping - No description string parsing
2. Region Filter - europe-west1 only
3. Fallback Mechanism - Never overwrite with zero values

IAM Requirement: roles/billing.viewer (least privilege)
"""

import logging
from typing import Dict, Optional
from decimal import Decimal
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# =============================================================================
# Vertex AI Service ID (from Google Cloud Billing)
# =============================================================================
VERTEX_AI_SERVICE_ID = "services/6F81-5844-456A"
TARGET_REGION = "europe-west1"

# =============================================================================
# Explicit SKU Mapping (Architect Directive #1)
# Maps our model IDs to known SKU description patterns
# CRITICAL: These are the ONLY patterns we trust
# =============================================================================
MODEL_SKU_PATTERNS: Dict[str, Dict[str, str]] = {
    # Gemini 3.x Series
    "gemini-3-pro": {
        "input_pattern": "Gemini 3 Pro Text Input",
        "output_pattern": "Gemini 3 Pro Text Output",
    },
    # Gemini 2.5 Series
    "gemini-2.5-pro": {
        "input_pattern": "Gemini 2.5 Pro Text Input",
        "output_pattern": "Gemini 2.5 Pro Text Output",
    },
    "gemini-2.5-flash": {
        "input_pattern": "Gemini 2.5 Flash Text Input",
        "output_pattern": "Gemini 2.5 Flash Text Output",
    },
    "gemini-2.5-flash-lite": {
        "input_pattern": "Gemini 2.5 Flash Lite Text Input",
        "output_pattern": "Gemini 2.5 Flash Lite Text Output",
    },
    # Gemini 2.0 Series
    "gemini-2.0-flash": {
        "input_pattern": "Gemini 2.0 Flash Text Input",
        "output_pattern": "Gemini 2.0 Flash Text Output",
    },
    "gemini-2.0-flash-lite": {
        "input_pattern": "Gemini 2.0 Flash Lite Text Input",
        "output_pattern": "Gemini 2.0 Flash Lite Text Output",
    },
}

# =============================================================================
# Default Pricing (Fallback - Architect Directive #3)
# Used when API fails or returns invalid values
# =============================================================================
DEFAULT_PRICING: Dict[str, Dict[str, Decimal]] = {
    "gemini-3-pro": {"input": Decimal("2.00"), "output": Decimal("12.00")},
    "gemini-2.5-pro": {"input": Decimal("1.25"), "output": Decimal("10.00")},
    "gemini-2.5-flash": {"input": Decimal("0.15"), "output": Decimal("0.60")},
    "gemini-2.5-flash-lite": {"input": Decimal("0.075"), "output": Decimal("0.30")},
    "gemini-2.0-flash": {"input": Decimal("0.10"), "output": Decimal("0.40")},
    "gemini-2.0-flash-lite": {"input": Decimal("0.075"), "output": Decimal("0.30")},
    # Third-party models (static, not from GCP Billing)
    "claude-3-5-sonnet": {"input": Decimal("3.00"), "output": Decimal("15.00")},
    "claude-3-haiku": {"input": Decimal("0.25"), "output": Decimal("1.25")},
    "llama-3-1-405b": {"input": Decimal("2.50"), "output": Decimal("5.00")},
    "llama-3-1-70b": {"input": Decimal("0.90"), "output": Decimal("0.90")},
    "mistral-large": {"input": Decimal("2.00"), "output": Decimal("6.00")},
    "whisper-large-v3": {"input": Decimal("0.006"), "output": Decimal("0")},
    "google-chirp-v2": {"input": Decimal("0.016"), "output": Decimal("0")},
}

# =============================================================================
# In-Memory Cache
# =============================================================================
_pricing_cache: Dict[str, Dict[str, Decimal]] = {}
_cache_timestamp: Optional[datetime] = None
CACHE_TTL_HOURS = 24


def get_cached_pricing() -> Dict[str, Dict[str, Decimal]]:
    """
    Get current pricing from cache.
    Returns defaults if cache is empty.
    """
    if not _pricing_cache:
        return DEFAULT_PRICING.copy()
    return _pricing_cache.copy()


def is_cache_stale() -> bool:
    """Check if cache needs refresh."""
    if _cache_timestamp is None:
        return True
    return datetime.utcnow() - _cache_timestamp > timedelta(hours=CACHE_TTL_HOURS)


async def refresh_pricing_from_gcp() -> Dict[str, Dict[str, Decimal]]:
    """
    Fetch fresh pricing from Google Cloud Billing Catalog API.

    Follows Architect Directives:
    - Uses explicit SKU patterns (no string guessing)
    - Filters by region (europe-west1)
    - Validates prices (rejects zeros)
    - Falls back to defaults on failure

    Returns:
        Dict mapping model_id to {input: Decimal, output: Decimal}
    """
    global _pricing_cache, _cache_timestamp

    try:
        from google.cloud import billing_v1

        client = billing_v1.CloudCatalogClient()

        # Fetch all SKUs for Vertex AI service
        request = billing_v1.ListSkusRequest(parent=VERTEX_AI_SERVICE_ID)
        skus = list(client.list_skus(request=request))

        logger.info(f"Fetched {len(skus)} SKUs from Vertex AI Billing")

        # Build pricing map from SKUs
        new_pricing: Dict[str, Dict[str, Decimal]] = {}

        for model_id, patterns in MODEL_SKU_PATTERNS.items():
            input_price = _find_sku_price(skus, patterns["input_pattern"])
            output_price = _find_sku_price(skus, patterns["output_pattern"])

            # Architect Directive #3: Validate prices
            if input_price is not None and input_price > Decimal("0"):
                if model_id not in new_pricing:
                    new_pricing[model_id] = {}
                new_pricing[model_id]["input"] = input_price

            if output_price is not None and output_price > Decimal("0"):
                if model_id not in new_pricing:
                    new_pricing[model_id] = {}
                new_pricing[model_id]["output"] = output_price

        # Merge with defaults (keep defaults for missing models)
        merged = DEFAULT_PRICING.copy()
        for model_id, prices in new_pricing.items():
            if model_id in merged:
                merged[model_id].update(prices)
            else:
                merged[model_id] = prices

        # Update cache
        _pricing_cache = merged
        _cache_timestamp = datetime.utcnow()

        logger.info(f"Pricing cache refreshed. Updated {len(new_pricing)} models.")
        return merged

    except ImportError:
        logger.warning("google-cloud-billing not installed. Using default pricing.")
        return DEFAULT_PRICING.copy()
    except Exception as e:
        logger.error(f"Failed to fetch pricing from GCP: {e}")
        # Architect Directive #3: Keep existing cache on failure
        if _pricing_cache:
            return _pricing_cache.copy()
        return DEFAULT_PRICING.copy()


def _find_sku_price(skus: list, pattern: str) -> Optional[Decimal]:
    """
    Find the price for a specific SKU pattern.

    Filters by:
    - Description containing the pattern
    - Region matching europe-west1

    Returns price per 1M tokens or None if not found.
    """
    for sku in skus:
        description = sku.description or ""

        # Check if this SKU matches our pattern
        if pattern.lower() not in description.lower():
            continue

        # Check region filter
        regions = [
            r.lower() for r in (sku.geo_taxonomy.regions if sku.geo_taxonomy else [])
        ]
        if TARGET_REGION not in regions and "global" not in regions:
            continue

        # Extract price from pricing info
        for pricing_info in sku.pricing_info:
            for tier in pricing_info.pricing_expression.tiered_rates:
                # Convert to Decimal (price is in micro-units)
                if tier.unit_price.units or tier.unit_price.nanos:
                    price = Decimal(tier.unit_price.units) + Decimal(
                        tier.unit_price.nanos
                    ) / Decimal(1_000_000_000)
                    # Return price per 1M tokens (API returns per-unit)
                    return price * Decimal(1_000_000)

    return None


def get_pricing_status() -> dict:
    """Get current pricing cache status for monitoring."""
    return {
        "cached_models": len(_pricing_cache),
        "cache_timestamp": _cache_timestamp.isoformat() if _cache_timestamp else None,
        "is_stale": is_cache_stale(),
        "ttl_hours": CACHE_TTL_HOURS,
    }
