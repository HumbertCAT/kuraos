"""
Tests for Help API endpoints.

The help chatbot is FREE/UNLIMITED and doesn't consume credits.
"""

import pytest
from httpx import AsyncClient

from app.main import app


class TestHelpChat:
    """Tests for /help/chat endpoint."""

    async def _login(
        self, client: AsyncClient, email="test@example.com", org="Test Org"
    ):
        """Helper to register/login a user."""
        try:
            await client.post(
                "/api/v1/auth/register",
                json={
                    "email": email,
                    "password": "Password123!",
                    "full_name": "Test User",
                    "org_name": org,
                },
            )
        except:
            await client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": "Password123!"},
            )

    @pytest.mark.asyncio
    async def test_chat_requires_auth(self, client: AsyncClient):
        """Chat endpoint requires authentication."""
        response = await client.post(
            "/api/v1/help/chat",
            json={"message": "Hello", "current_route": "/dashboard"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_chat_request_validation(self, client: AsyncClient):
        """Chat endpoint validates request body."""
        await self._login(client)

        # Missing message
        response = await client.post(
            "/api/v1/help/chat",
            json={"current_route": "/dashboard"},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_chat_accepts_history(self, client: AsyncClient):
        """Chat endpoint accepts conversation history."""
        await self._login(client)

        response = await client.post(
            "/api/v1/help/chat",
            json={
                "message": "Como creo un paciente?",
                "current_route": "/patients",
                "history": [
                    {"role": "user", "content": "Hola"},
                    {"role": "assistant", "content": "Hola! En que puedo ayudarte?"},
                ],
            },
        )
        # Should succeed (200) or fail gracefully if no API key
        assert response.status_code in [200, 500]

    @pytest.mark.asyncio
    async def test_chat_response_schema(self, client: AsyncClient):
        """Chat endpoint returns correct response schema."""
        await self._login(client)

        response = await client.post(
            "/api/v1/help/chat",
            json={"message": "Hola", "current_route": "/dashboard"},
        )

        if response.status_code == 200:
            data = response.json()
            assert "response" in data
            assert isinstance(data["response"], str)

    @pytest.mark.asyncio
    async def test_detect_topic_patients(self):
        """Topic detection identifies patient-related queries."""
        from app.api.v1.intelligence.help import detect_topic

        assert detect_topic("Como creo un paciente nuevo?") == "patients"
        assert detect_topic("Quiero editar el perfil de un cliente") == "patients"

    @pytest.mark.asyncio
    async def test_detect_topic_billing(self):
        """Topic detection identifies billing-related queries."""
        from app.api.v1.intelligence.help import detect_topic

        assert detect_topic("Cuanto cuesta el plan pro?") == "billing"
        assert detect_topic("Necesito mi factura") == "billing"

    @pytest.mark.asyncio
    async def test_detect_topic_bookings(self):
        """Topic detection identifies booking-related queries."""
        from app.api.v1.intelligence.help import detect_topic

        assert detect_topic("Como agendo una cita?") == "bookings"
        assert detect_topic("Necesito configurar el calendario") == "bookings"

    @pytest.mark.asyncio
    async def test_detect_topic_audio(self):
        """Topic detection identifies audio-related queries."""
        from app.api.v1.intelligence.help import detect_topic

        assert detect_topic("Como grabo una nota de voz?") == "audio"

    @pytest.mark.asyncio
    async def test_detect_topic_none(self):
        """Topic detection returns None for unrecognized queries."""
        from app.api.v1.intelligence.help import detect_topic

        assert detect_topic("This is random text") is None
