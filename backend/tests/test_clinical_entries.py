"""Tests for clinical entries endpoints."""

import pytest
from httpx import AsyncClient


class TestClinicalEntryEndpoints:
    """Test suite for /api/v1/clinical-entries endpoints."""

    async def _register_and_login(
        self, client: AsyncClient, email="test@example.com", org="Test Org"
    ):
        """Helper to register and login a user, returns user data."""
        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": "Password123!",
                "full_name": "Test User",
                "org_name": org,
            },
        )
        if register_response.status_code == 201:
            return register_response.json()
        # Already registered, just login
        await client.post(
            "/api/v1/auth/login", json={"email": email, "password": "Password123!"}
        )
        me_response = await client.get("/api/v1/auth/me")
        return me_response.json()

    async def _create_patient(self, client: AsyncClient):
        """Helper to create a patient, returns patient id."""
        response = await client.post(
            "/api/v1/patients/",
            json={
                "first_name": "Test",
                "last_name": "Patient",
                "email": "patient@example.com",
            },
        )
        return response.json()["id"]

    @pytest.mark.asyncio
    async def test_create_clinical_entry(self, client: AsyncClient):
        """Test creating a new clinical entry."""
        await self._register_and_login(client, email="entry_create@test.com")
        patient_id = await self._create_patient(client)

        response = await client.post(
            "/api/v1/clinical-entries/",
            json={
                "patient_id": patient_id,
                "entry_type": "SESSION_NOTE",
                "content": "First session notes here.",
                "is_private": True,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["content"] == "First session notes here."
        assert data["entry_type"] == "SESSION_NOTE"
        assert data["patient_id"] == patient_id
        assert "id" in data
        return data["id"], patient_id

    @pytest.mark.asyncio
    async def test_list_patient_entries(self, client: AsyncClient):
        """Test listing entries for a patient."""
        await self._register_and_login(client, email="entry_list@test.com")
        patient_id = await self._create_patient(client)

        # Create two entries
        await client.post(
            "/api/v1/clinical-entries/",
            json={
                "patient_id": patient_id,
                "entry_type": "SESSION_NOTE",
                "content": "Note 1",
            },
        )
        await client.post(
            "/api/v1/clinical-entries/",
            json={
                "patient_id": patient_id,
                "entry_type": "DOCUMENT",
                "content": "Document entry",
            },
        )

        response = await client.get(f"/api/v1/clinical-entries/patient/{patient_id}")

        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
        assert data["total"] == 2
        assert len(data["entries"]) == 2

    @pytest.mark.asyncio
    async def test_update_clinical_entry(self, client: AsyncClient):
        """Test updating a clinical entry."""
        await self._register_and_login(client, email="entry_update@test.com")
        patient_id = await self._create_patient(client)

        # Create entry
        create_response = await client.post(
            "/api/v1/clinical-entries/",
            json={
                "patient_id": patient_id,
                "entry_type": "SESSION_NOTE",
                "content": "Original content",
            },
        )
        entry_id = create_response.json()["id"]

        # Update it
        response = await client.patch(
            f"/api/v1/clinical-entries/{entry_id}", json={"content": "Updated content"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "Updated content"

    @pytest.mark.asyncio
    async def test_delete_clinical_entry(self, client: AsyncClient):
        """Test deleting a clinical entry."""
        await self._register_and_login(client, email="entry_delete@test.com")
        patient_id = await self._create_patient(client)

        # Create entry
        create_response = await client.post(
            "/api/v1/clinical-entries/",
            json={
                "patient_id": patient_id,
                "entry_type": "SESSION_NOTE",
                "content": "To be deleted",
            },
        )
        entry_id = create_response.json()["id"]

        # Delete it
        response = await client.delete(f"/api/v1/clinical-entries/{entry_id}")
        assert response.status_code == 204

        # Verify it's gone
        list_response = await client.get(
            f"/api/v1/clinical-entries/patient/{patient_id}"
        )
        entries = list_response.json()["entries"]
        ids = [e["id"] for e in entries]
        assert entry_id not in ids

    @pytest.mark.asyncio
    async def test_multitenancy_isolation(self, client: AsyncClient):
        """Test that users cannot access entries from other organizations."""
        # User A creates an entry
        await self._register_and_login(client, email="entryA@test.com", org="Org A")
        patient_a_id = await self._create_patient(client)
        create_response = await client.post(
            "/api/v1/clinical-entries/",
            json={
                "patient_id": patient_a_id,
                "entry_type": "SESSION_NOTE",
                "content": "Org A's private note",
            },
        )
        entry_a_id = create_response.json()["id"]

        # Logout and login as User B
        await client.post("/api/v1/auth/logout")
        await self._register_and_login(client, email="entryB@test.com", org="Org B")

        # Try to access Patient A's entries (should fail)
        response = await client.get(f"/api/v1/clinical-entries/patient/{patient_a_id}")
        assert response.status_code == 404

        # Try to update entry A (should fail)
        update_response = await client.patch(
            f"/api/v1/clinical-entries/{entry_a_id}", json={"content": "Hacked content"}
        )
        assert update_response.status_code == 404

    @pytest.mark.asyncio
    async def test_entry_with_metadata(self, client: AsyncClient):
        """Test creating entry with JSONB metadata."""
        await self._register_and_login(client, email="meta@test.com")
        patient_id = await self._create_patient(client)

        response = await client.post(
            "/api/v1/clinical-entries/",
            json={
                "patient_id": patient_id,
                "entry_type": "ASSESSMENT",
                "content": "Anxiety assessment",
                "entry_metadata": {
                    "anxiety_level": 7,
                    "depression_level": 3,
                    "notes": "Improvement from last session",
                },
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["entry_metadata"]["anxiety_level"] == 7
        assert data["entry_metadata"]["depression_level"] == 3

    @pytest.mark.skip(
        reason="TD-90: requires async pipeline setup + connection pool tuning"
    )
    @pytest.mark.asyncio
    async def test_analyze_stale_entry_allowed(self, client: AsyncClient):
        """Test that stale PENDING/PROCESSING entries can be re-analyzed after 5 min timeout."""
        from datetime import datetime, timedelta
        from sqlalchemy import update

        await self._register_and_login(client, email="stale_test@test.com")
        patient_id = await self._create_patient(client)

        # Create an audio entry
        create_response = await client.post(
            "/api/v1/clinical-entries/",
            json={
                "patient_id": patient_id,
                "entry_type": "AUDIO",
                "content": "Test audio entry for stale analysis",
                "entry_metadata": {
                    "file_url": "/static/uploads/test.webm",
                    "filename": "audio_test.webm",
                },
            },
        )
        entry_id = create_response.json()["id"]

        # First analysis should be accepted
        response = await client.post(f"/api/v1/clinical-entries/{entry_id}/analyze")
        assert response.status_code == 202

        # Immediate retry should be rejected (409 Conflict)
        response2 = await client.post(f"/api/v1/clinical-entries/{entry_id}/analyze")
        assert response2.status_code == 409
        assert "already in progress" in response2.json()["detail"]
