"""Tests for authentication endpoints."""

import pytest
from httpx import AsyncClient


class TestAuthEndpoints:
    """Test suite for /api/v1/auth endpoints."""

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient):
        """Test successful user registration."""
        payload = {
            "email": "newuser@test.com",
            "password": "SecurePassword123!",
            "full_name": "Test User",
            "org_name": "Test Organization",
        }

        response = await client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Registration successful"
        assert data["user"]["email"] == payload["email"]
        assert data["user"]["full_name"] == payload["full_name"]
        assert data["user"]["role"] == "OWNER"
        assert data["organization"]["name"] == payload["org_name"]
        assert "referral_code" in data["organization"]

        # Check httpOnly cookie was set
        assert "access_token" in response.cookies

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient):
        """Test registration fails with duplicate email."""
        payload = {
            "email": "duplicate@test.com",
            "password": "SecurePassword123!",
            "full_name": "First User",
            "org_name": "First Org",
        }

        # First registration
        await client.post("/api/v1/auth/register", json=payload)

        # Second registration with same email
        payload["org_name"] = "Second Org"
        response = await client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient):
        """Test successful login."""
        # First register a user
        register_payload = {
            "email": "login@test.com",
            "password": "MyPassword123!",
            "full_name": "Login Tester",
            "org_name": "Login Org",
        }
        await client.post("/api/v1/auth/register", json=register_payload)

        # Then login
        login_payload = {"email": "login@test.com", "password": "MyPassword123!"}
        response = await client.post("/api/v1/auth/login", json=login_payload)

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Login successful"
        assert data["user"]["email"] == login_payload["email"]
        assert "access_token" in response.cookies

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient):
        """Test login fails with wrong password."""
        # Register
        register_payload = {
            "email": "wrongpass@test.com",
            "password": "CorrectPassword123!",
            "full_name": "Wrong Pass Tester",
            "org_name": "Wrong Pass Org",
        }
        await client.post("/api/v1/auth/register", json=register_payload)

        # Login with wrong password
        login_payload = {"email": "wrongpass@test.com", "password": "WrongPassword!"}
        response = await client.post("/api/v1/auth/login", json=login_payload)

        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login fails for non-existent user."""
        login_payload = {
            "email": "nonexistent@test.com",
            "password": "SomePassword123!",
        }
        response = await client.post("/api/v1/auth/login", json=login_payload)

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_me_authenticated(self, client: AsyncClient):
        """Test /me endpoint with valid authentication."""
        # Register and get cookie
        register_payload = {
            "email": "me@test.com",
            "password": "MyPassword123!",
            "full_name": "Me Tester",
            "org_name": "Me Org",
        }
        register_response = await client.post(
            "/api/v1/auth/register", json=register_payload
        )
        cookies = register_response.cookies

        # Call /me with cookie
        response = await client.get("/api/v1/auth/me", cookies=cookies)

        assert response.status_code == 200
        data = response.json()
        # Handle both flat response and nested {"user": {...}} structure
        user_data = data if "email" in data else data.get("user", data)
        assert user_data.get("email") == register_payload["email"]
        assert user_data.get("full_name") == register_payload["full_name"]

    @pytest.mark.asyncio
    async def test_me_unauthenticated(self, client: AsyncClient):
        """Test /me endpoint without authentication."""
        response = await client.get("/api/v1/auth/me")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_logout(self, client: AsyncClient):
        """Test logout clears the cookie."""
        # Register
        register_payload = {
            "email": "logout@test.com",
            "password": "MyPassword123!",
            "full_name": "Logout Tester",
            "org_name": "Logout Org",
        }
        register_response = await client.post(
            "/api/v1/auth/register", json=register_payload
        )
        cookies = register_response.cookies

        # Logout
        response = await client.post("/api/v1/auth/logout", cookies=cookies)

        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"


class TestHealthEndpoints:
    """Test suite for health check endpoints."""

    @pytest.mark.asyncio
    async def test_health_check(self, client: AsyncClient):
        """Test health check endpoint."""
        response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_root_endpoint(self, client: AsyncClient):
        """Test root endpoint."""
        response = await client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "Kura OS" in data["message"]
