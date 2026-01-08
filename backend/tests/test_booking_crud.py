"""Unit tests for Booking CRUD operations.

Tests cover:
1. Update booking status
2. Delete booking
"""

import pytest
import uuid
from datetime import datetime, timedelta
from httpx import AsyncClient

from app.db.models import Booking, BookingStatus, Patient, ServiceType


@pytest.mark.asyncio
class TestBookingCRUD:
    """Test booking update and delete operations."""

    async def _login(
        self,
        client: AsyncClient,
        email="booking_test@example.com",
        org="Booking Test Org",
    ):
        """Helper to register/login a user."""
        try:
            await client.post(
                "/api/v1/auth/register",
                json={
                    "email": email,
                    "password": "Password123!",
                    "full_name": "Booking Tester",
                    "org_name": org,
                },
            )
        except:
            await client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": "Password123!"},
            )

    async def _create_booking(
        self, client: AsyncClient, test_db, status=BookingStatus.CONFIRMED
    ):
        """Create a booking for the logged-in user."""
        # Get current user info
        me_resp = await client.get("/api/v1/auth/me")
        if me_resp.status_code != 200:
            return None
        user_data = me_resp.json()
        org_id = uuid.UUID(user_data["organization_id"])
        user_id = uuid.UUID(user_data["id"])

        # Create patient
        patient = Patient(
            id=uuid.uuid4(),
            first_name="Booking",
            last_name="Patient",
            email=f"bp_{uuid.uuid4().hex[:6]}@test.com",
            organization_id=org_id,
        )
        test_db.add(patient)

        # Create service
        service = ServiceType(
            id=uuid.uuid4(),
            organization_id=org_id,
            title="Booking Test Service",
            duration_minutes=60,
            price=50.0,
        )
        test_db.add(service)

        # Create booking
        booking = Booking(
            id=uuid.uuid4(),
            organization_id=org_id,
            patient_id=patient.id,
            service_type_id=service.id,
            therapist_id=user_id,
            start_time=datetime.now() + timedelta(days=1),
            end_time=datetime.now() + timedelta(days=1, hours=1),
            status=status,
            amount_paid=50.0,
        )
        test_db.add(booking)
        await test_db.commit()
        return booking

    async def test_update_status_to_confirmed(self, client: AsyncClient, test_db):
        """PATCH /booking/{id}/status to CONFIRMED should work."""
        await self._login(client, email="confirm@test.com", org="Confirm Org")
        booking = await self._create_booking(client, test_db, BookingStatus.PENDING)

        if not booking:
            pytest.skip("Could not create booking")

        resp = await client.patch(
            f"/api/v1/booking/{booking.id}/status?new_status=CONFIRMED"
        )
        assert resp.status_code == 200
        assert resp.json()["new_status"] == "CONFIRMED"

    async def test_update_status_to_completed(self, client: AsyncClient, test_db):
        """PATCH /booking/{id}/status to COMPLETED should work."""
        await self._login(client, email="complete@test.com", org="Complete Org")
        booking = await self._create_booking(client, test_db, BookingStatus.CONFIRMED)

        if not booking:
            pytest.skip("Could not create booking")

        resp = await client.patch(
            f"/api/v1/booking/{booking.id}/status?new_status=COMPLETED"
        )
        assert resp.status_code == 200
        assert resp.json()["new_status"] == "COMPLETED"

    async def test_update_status_to_cancelled(self, client: AsyncClient, test_db):
        """PATCH /booking/{id}/status to CANCELLED should work."""
        await self._login(client, email="cancel@test.com", org="Cancel Org")
        booking = await self._create_booking(client, test_db, BookingStatus.CONFIRMED)

        if not booking:
            pytest.skip("Could not create booking")

        resp = await client.patch(
            f"/api/v1/booking/{booking.id}/status?new_status=CANCELLED"
        )
        assert resp.status_code == 200
        assert resp.json()["new_status"] == "CANCELLED"

    async def test_update_invalid_status_returns_400(
        self, client: AsyncClient, test_db
    ):
        """PATCH with invalid status should return 400."""
        await self._login(client, email="invalid@test.com", org="Invalid Org")
        booking = await self._create_booking(client, test_db)

        if not booking:
            pytest.skip("Could not create booking")

        resp = await client.patch(
            f"/api/v1/booking/{booking.id}/status?new_status=INVALID"
        )
        assert resp.status_code == 400

    async def test_update_nonexistent_booking_returns_404(self, client: AsyncClient):
        """PATCH on non-existent booking should return 404."""
        await self._login(client, email="notfound@test.com", org="NotFound Org")
        fake_id = uuid.uuid4()
        resp = await client.patch(
            f"/api/v1/booking/{fake_id}/status?new_status=CONFIRMED"
        )
        assert resp.status_code == 404

    async def test_delete_booking_success(self, client: AsyncClient, test_db):
        """DELETE /booking/{id} should return 204."""
        await self._login(client, email="delete@test.com", org="Delete Org")
        booking = await self._create_booking(client, test_db)

        if not booking:
            pytest.skip("Could not create booking")

        resp = await client.delete(f"/api/v1/booking/{booking.id}")
        assert resp.status_code == 204

    async def test_delete_nonexistent_booking_returns_404(self, client: AsyncClient):
        """DELETE on non-existent booking should return 404."""
        await self._login(client, email="delnotfound@test.com", org="DelNotFound Org")
        fake_id = uuid.uuid4()
        resp = await client.delete(f"/api/v1/booking/{fake_id}")
        assert resp.status_code == 404
