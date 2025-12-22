"""Referral/Growth system endpoints."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/referral-code", summary="Get referral code")
async def get_referral_code():
    """Get the organization's referral code."""
    return {"message": "Get referral code - TODO"}


@router.get("/referrals", summary="List referrals")
async def list_referrals():
    """List organizations referred by this organization."""
    return {"message": "List referrals - TODO"}


@router.post("/apply-referral", summary="Apply referral code")
async def apply_referral():
    """Apply a referral code during registration."""
    return {"message": "Apply referral - TODO"}
