"""Tests for patient management endpoints."""

import pytest
from httpx import AsyncClient


class TestPatientEndpoints:
    """Test suite for /api/v1/patients endpoints."""

    @pytest.mark.asyncio
    async def test_create_patient(self, client: AsyncClient):
        """Test creating a new patient."""
        # Authenticate first
        await self._login(client)

        payload = {
            "first_name": "Test",
            "last_name": "Patient",
            "email": "test.patient@example.com",
            "phone": "+1234567890",
        }

        response = await client.post("/api/v1/patients/", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["first_name"] == payload["first_name"]
        assert data["last_name"] == payload["last_name"]
        assert data["email"] == payload["email"]
        assert "id" in data
        return data["id"]

    @pytest.mark.asyncio
    async def test_list_patients(self, client: AsyncClient):
        """Test listing patients with pagination."""
        await self._login(client)

        # Create a patient first to ensure list isn't empty
        await client.post(
            "/api/v1/patients/",
            json={
                "first_name": "List",
                "last_name": "Tester",
                "email": "list@example.com",
            },
        )

        response = await client.get("/api/v1/patients/")
        assert response.status_code == 200
        data = response.json()
        assert "patients" in data
        assert "total" in data
        assert len(data["patients"]) > 0
        assert data["page"] == 1

    @pytest.mark.asyncio
    async def test_get_patient_detail(self, client: AsyncClient):
        """Test retrieving a specific patient."""
        pid = await self.test_create_patient(client)

        response = await client.get(f"/api/v1/patients/{pid}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == pid

    @pytest.mark.asyncio
    async def test_update_patient(self, client: AsyncClient):
        """Test updating a patient."""
        pid = await self.test_create_patient(client)

        update_payload = {"first_name": "Updated Name"}
        response = await client.put(f"/api/v1/patients/{pid}", json=update_payload)

        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Updated Name"
        # Ensure other fields remain
        assert data["last_name"] == "Patient"

    @pytest.mark.asyncio
    async def test_delete_patient(self, client: AsyncClient):
        """Test deleting a patient."""
        pid = await self.test_create_patient(client)

        response = await client.delete(f"/api/v1/patients/{pid}")
        assert response.status_code == 204

        # Verify it's gone
        get_response = await client.get(f"/api/v1/patients/{pid}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_multitenancy_isolation(self, client: AsyncClient):
        """Test that users cannot access patients from other organizations."""
        # 1. Login as User A and create a patient
        await self._login(client, email="userA@test.com", org="Org A")
        res_a = await client.post(
            "/api/v1/patients/",
            json={
                "first_name": "Patient",
                "last_name": "A",
                "email": "p_a@example.com",
            },
        )
        patient_a_id = res_a.json()["id"]

        # 2. Logout and Login as User B (different org)
        await client.post("/api/v1/auth/logout")
        await self._login(client, email="userB@test.com", org="Org B")

        # 3. Try to get Patient A
        response = await client.get(f"/api/v1/patients/{patient_a_id}")
        assert response.status_code == 404

        # 4. Try to list (should not see Patient A)
        list_response = await client.get("/api/v1/patients/")
        patients = list_response.json()["patients"]
        ids = [p["id"] for p in patients]
        assert patient_a_id not in ids

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
            # If already registered, just login
            await client.post(
                "/api/v1/auth/login", json={"email": email, "password": "Password123!"}
            )
