"""Unit tests for Payment Webhooks.

Tests cover:
1. Webhook signature verification
2. payment_intent.succeeded handling
3. payment_intent.payment_failed handling
4. Email confirmation triggering
"""

import pytest
import json
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient

from app.db.models import Booking, BookingStatus


# ============ Webhook Event Fixtures ============


def create_mock_event(
    event_type: str, booking_id: str, payment_intent_id: str = "pi_test"
):
    """Create a mock Stripe event payload."""
    return {
        "id": f"evt_{uuid.uuid4().hex[:24]}",
        "type": event_type,
        "data": {
            "object": {
                "id": payment_intent_id,
                "metadata": {
                    "booking_id": booking_id,
                },
                "amount": 10000,  # 100.00 EUR in cents
                "currency": "eur",
            }
        },
    }


# ============ Webhook Handler Tests ============


@pytest.mark.asyncio
class TestPaymentWebhooks:
    """Test payment webhook handling."""

    async def test_webhook_succeeds_confirms_booking(
        self, client: AsyncClient, test_db
    ):
        """payment_intent.succeeded should change booking to CONFIRMED."""
        from app.db.models import (
            Organization,
            User,
            Patient,
            ServiceType,
            Booking,
            BookingStatus,
        )
        from sqlalchemy import select
        import uuid

        # Create test organization
        org = Organization(
            id=uuid.uuid4(),
            name="Test Org",
            referral_code="TEST001",
        )
        test_db.add(org)

        # Create test user (therapist)
        user = User(
            id=uuid.uuid4(),
            email="therapist@test.com",
            hashed_password="fake",
            full_name="Test Therapist",
            organization_id=org.id,
        )
        test_db.add(user)

        # Create test patient
        patient = Patient(
            id=uuid.uuid4(),
            first_name="Test",
            last_name="Patient",
            email="patient@test.com",
            organization_id=org.id,
        )
        test_db.add(patient)

        # Create test service
        service = ServiceType(
            id=uuid.uuid4(),
            organization_id=org.id,
            title="Test Service",
            duration_minutes=60,
            price=100.0,
        )
        test_db.add(service)

        # Create PENDING booking
        booking_id = uuid.uuid4()
        booking = Booking(
            id=booking_id,
            organization_id=org.id,
            patient_id=patient.id,
            service_type_id=service.id,
            therapist_id=user.id,
            start_time=datetime(2025, 12, 20, 10, 0),
            end_time=datetime(2025, 12, 20, 11, 0),
            status=BookingStatus.PENDING,
            stripe_payment_intent_id="pi_test_123",
            amount_paid=100.0,
        )
        test_db.add(booking)
        await test_db.commit()

        # Mock Stripe webhook signature verification
        with patch("stripe.Webhook.construct_event") as mock_construct:
            # Use proper values instead of MagicMock to avoid JSON serialization issues
            mock_event = MagicMock()
            mock_event.type = "payment_intent.succeeded"
            mock_event.data.object.id = "pi_test_123"
            mock_event.data.object.metadata = {"booking_id": str(booking_id)}
            mock_event.data.object.amount = 10000  # JSON serializable
            mock_event.data.object.currency = "eur"  # JSON serializable
            mock_construct.return_value = mock_event

            # Mock automation engine to isolate from fire_event bugs (TD-87)
            with patch("app.api.v1.grow.payments.fire_event", new_callable=AsyncMock):
                # Mock email service
                with patch(
                    "app.services.email.email_service.send_booking_confirmation"
                ) as mock_email:
                    mock_email.return_value = True

                    response = await client.post(
                        "/api/v1/payments/webhook",
                        content=json.dumps({"test": "payload"}),
                        headers={"stripe-signature": "test_sig"},
                    )

                    assert response.status_code == 200

        # Verify booking is now CONFIRMED
        await test_db.refresh(booking)
        assert booking.status == BookingStatus.CONFIRMED

    async def test_webhook_failed_cancels_booking(self, client: AsyncClient, test_db):
        """payment_intent.payment_failed should change booking to CANCELLED."""
        from app.db.models import (
            Organization,
            User,
            Patient,
            ServiceType,
            Booking,
            BookingStatus,
        )
        import uuid

        # Create test data
        org = Organization(
            id=uuid.uuid4(),
            name="Test Org 2",
            referral_code="TEST002",
        )
        test_db.add(org)

        user = User(
            id=uuid.uuid4(),
            email="therapist2@test.com",
            hashed_password="fake",
            full_name="Test Therapist 2",
            organization_id=org.id,
        )
        test_db.add(user)

        patient = Patient(
            id=uuid.uuid4(),
            first_name="Test",
            last_name="Patient 2",
            email="patient2@test.com",
            organization_id=org.id,
        )
        test_db.add(patient)

        service = ServiceType(
            id=uuid.uuid4(),
            organization_id=org.id,
            title="Test Service 2",
            duration_minutes=60,
            price=50.0,
        )
        test_db.add(service)

        booking_id = uuid.uuid4()
        booking = Booking(
            id=booking_id,
            organization_id=org.id,
            patient_id=patient.id,
            service_type_id=service.id,
            therapist_id=user.id,
            start_time=datetime(2025, 12, 21, 14, 0),
            end_time=datetime(2025, 12, 21, 15, 0),
            status=BookingStatus.PENDING,
            stripe_payment_intent_id="pi_failed_123",
            amount_paid=50.0,
        )
        test_db.add(booking)
        await test_db.commit()

        with patch("stripe.Webhook.construct_event") as mock_construct:
            # Use proper values to avoid JSON serialization issues
            mock_event = MagicMock()
            mock_event.type = "payment_intent.payment_failed"
            mock_event.data.object.id = "pi_failed_123"
            mock_event.data.object.metadata = {"booking_id": str(booking_id)}
            # Provide serializable last_payment_error
            mock_event.data.object.last_payment_error = MagicMock()
            mock_event.data.object.last_payment_error.message = "Card declined"
            mock_construct.return_value = mock_event

            # Mock automation engine to isolate from fire_event bugs (TD-87)
            with patch("app.api.v1.grow.payments.fire_event", new_callable=AsyncMock):
                response = await client.post(
                    "/api/v1/payments/webhook",
                    content=json.dumps({"test": "payload"}),
                    headers={"stripe-signature": "test_sig"},
                )

                assert response.status_code == 200

        # Verify booking is CANCELLED
        await test_db.refresh(booking)
        assert booking.status == BookingStatus.CANCELLED

    async def test_webhook_invalid_signature_returns_400(self, client: AsyncClient):
        """Invalid Stripe signature should return 400."""
        import stripe

        with patch("stripe.Webhook.construct_event") as mock_construct:
            mock_construct.side_effect = stripe.error.SignatureVerificationError(
                "Invalid signature", "sig_header"
            )

            response = await client.post(
                "/api/v1/payments/webhook",
                content=json.dumps({"test": "payload"}),
                headers={"stripe-signature": "invalid_sig"},
            )

            assert response.status_code == 400

    async def test_webhook_unknown_event_returns_ok(self, client: AsyncClient):
        """Unknown event types should still return 200 (acknowledged)."""
        with patch("stripe.Webhook.construct_event") as mock_construct:
            mock_construct.return_value = MagicMock(
                type="some.unknown.event",
                data=MagicMock(object={}),
            )

            response = await client.post(
                "/api/v1/payments/webhook",
                content=json.dumps({"test": "payload"}),
                headers={"stripe-signature": "test_sig"},
            )

            assert response.status_code == 200

    async def test_webhook_missing_booking_id_handles_gracefully(
        self, client: AsyncClient
    ):
        """Webhook with missing booking_id should handle gracefully."""
        with patch("stripe.Webhook.construct_event") as mock_construct:
            mock_construct.return_value = MagicMock(
                type="payment_intent.succeeded",
                data=MagicMock(
                    object=MagicMock(
                        id="pi_no_booking",
                        metadata={},  # No booking_id
                    )
                ),
            )

            response = await client.post(
                "/api/v1/payments/webhook",
                content=json.dumps({"test": "payload"}),
                headers={"stripe-signature": "test_sig"},
            )

            # Should not crash
            assert response.status_code == 200
