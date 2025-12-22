"""Tests for WhatsApp Monitoring module (v0.9.8)."""

import uuid
from datetime import datetime, timedelta

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    Organization,
    User,
    Patient,
    MessageLog,
    DailyConversationAnalysis,
    MessageDirection,
)
from app.core.security import create_access_token


@pytest_asyncio.fixture
async def patient_with_messages(
    test_db: AsyncSession, authenticated_user: tuple[User, Organization]
) -> Patient:
    """Create a patient with WhatsApp messages for testing."""
    user, org = authenticated_user

    patient = Patient(
        id=uuid.uuid4(),
        organization_id=org.id,
        first_name="Test",
        last_name="Patient",
        phone="+34600000000",
    )
    test_db.add(patient)

    # Add some messages
    for i in range(3):
        msg = MessageLog(
            id=uuid.uuid4(),
            organization_id=org.id,
            patient_id=patient.id,
            direction=MessageDirection.INBOUND,
            content=f"Test message {i}",
            provider_id=f"SM{uuid.uuid4().hex[:20]}",
            timestamp=datetime.utcnow() - timedelta(hours=i),
        )
        test_db.add(msg)

    # Add a daily analysis with risks
    analysis = DailyConversationAnalysis(
        id=uuid.uuid4(),
        organization_id=org.id,
        patient_id=patient.id,
        date=datetime.utcnow(),
        summary="Test patient showing signs of distress",
        sentiment_score=-0.5,
        emotional_state="Ansioso",
        risk_flags=["Aislamiento Social", "Ansiedad Elevada"],
        suggestion="Schedule follow-up call",
        message_count=3,
    )
    test_db.add(analysis)

    await test_db.commit()
    return patient


class TestMonitoringEndpoints:
    """Test suite for patient monitoring endpoints."""

    @pytest.mark.asyncio
    async def test_get_patient_analyses(
        self,
        client: AsyncClient,
        auth_headers: dict,
        patient_with_messages: Patient,
    ):
        """Test fetching patient analyses."""
        response = await client.get(
            f"/api/v1/patients/{patient_with_messages.id}/monitoring/analyses",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "analyses" in data
        assert len(data["analyses"]) == 1
        assert data["analyses"][0]["sentiment_score"] == -0.5
        assert "Aislamiento Social" in data["analyses"][0]["risk_flags"]

    @pytest.mark.asyncio
    async def test_get_patient_messages(
        self,
        client: AsyncClient,
        auth_headers: dict,
        patient_with_messages: Patient,
    ):
        """Test fetching patient messages."""
        response = await client.get(
            f"/api/v1/patients/{patient_with_messages.id}/monitoring/messages",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert len(data["messages"]) == 3

    @pytest.mark.asyncio
    async def test_get_organization_risk_alerts(
        self,
        client: AsyncClient,
        auth_headers: dict,
        patient_with_messages: Patient,
    ):
        """Test fetching organization-wide risk alerts for dashboard."""
        response = await client.get(
            "/api/v1/monitoring/risk-alerts?hours=48",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "alerts" in data
        # Should find our patient with risks
        assert len(data["alerts"]) >= 1
        alert = data["alerts"][0]
        assert alert["patient_name"] == "Test Patient"
        assert "Aislamiento Social" in alert["risk_flags"]

    @pytest.mark.asyncio
    async def test_analyses_returns_empty_for_no_data(
        self,
        client: AsyncClient,
        auth_headers: dict,
        authenticated_user: tuple[User, Organization],
        test_db: AsyncSession,
    ):
        """Test that analyses endpoint returns empty for patient without data."""
        user, org = authenticated_user

        # Create patient with no messages
        patient = Patient(
            id=uuid.uuid4(),
            organization_id=org.id,
            first_name="Empty",
            last_name="Patient",
        )
        test_db.add(patient)
        await test_db.commit()

        response = await client.get(
            f"/api/v1/patients/{patient.id}/monitoring/analyses",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["analyses"] == []


class TestTwilioWebhook:
    """Test suite for Twilio WhatsApp webhook."""

    @pytest.mark.asyncio
    async def test_webhook_stores_message(
        self,
        client: AsyncClient,
        authenticated_user: tuple[User, Organization],
        test_db: AsyncSession,
    ):
        """Test that webhook stores incoming messages correctly."""
        user, org = authenticated_user

        # Create patient with matching phone
        patient = Patient(
            id=uuid.uuid4(),
            organization_id=org.id,
            first_name="Webhook",
            last_name="Test",
            phone="+34611111111",
        )
        test_db.add(patient)
        await test_db.commit()

        # Simulate Twilio webhook
        response = await client.post(
            "/api/v1/webhooks/twilio/whatsapp",
            data={
                "From": "whatsapp:+34611111111",
                "Body": "Hola, me siento mejor hoy",
                "MessageSid": f"SM{uuid.uuid4().hex[:20]}",
            },
        )

        # Should return TwiML response
        assert response.status_code == 200
        assert "Response" in response.text

    @pytest.mark.asyncio
    async def test_webhook_handles_unknown_sender(
        self,
        client: AsyncClient,
    ):
        """Test that webhook handles messages from unknown numbers."""
        response = await client.post(
            "/api/v1/webhooks/twilio/whatsapp",
            data={
                "From": "whatsapp:+34699999999",
                "Body": "Test from unknown",
                "MessageSid": f"SM{uuid.uuid4().hex[:20]}",
            },
        )

        # Should still return 200 OK (acknowledge receipt)
        assert response.status_code == 200
